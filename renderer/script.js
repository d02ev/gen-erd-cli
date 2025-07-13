// Constants for ERD rendering
const NODE_WIDTH = 220;
const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 28;
const NODE_MARGIN_X = 60;
const NODE_MARGIN_Y = 40;

// State management
let metadata = [];
let nodePositions = {};
let isFullscreen = false;

// DOM elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const noDataState = document.getElementById('noDataState');
const erdSvg = document.getElementById('erdSvg');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');
const appContainer = document.querySelector('.app-container');

// Helper functions
function isPK(table, col) {
    return table.primary_key && table.primary_key.includes(col.column_name);
}

function isFK(table, col) {
    return (table.foreign_keys || []).some(fk => fk.source_column === col.column_name);
}

function getRelationshipSymbols(type) {
    // Returns [sourceSymbol, targetSymbol]
    if (type === 'OneToOne') return ['1', '1'];
    if (type === 'OneToMany') return ['1', '*'];
    if (type === 'ManyToMany') return ['*', '*'];
    return ['', ''];
}

// State management functions
function showLoading() {
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    noDataState.style.display = 'none';
    erdSvg.style.display = 'none';
}

function showError(message) {
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
    noDataState.style.display = 'none';
    erdSvg.style.display = 'none';
    errorMessage.textContent = message;
}

function showNoData() {
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    noDataState.style.display = 'block';
    erdSvg.style.display = 'none';
}

function showDiagram() {
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    noDataState.style.display = 'none';
    erdSvg.style.display = 'block';
}

// Fetch metadata from endpoint
async function fetchMetadata() {
    try {
        showLoading();

        const response = await fetch('http://localhost:5000/metadata.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data) || data.length === 0) {
            showNoData();
            return;
        }

        metadata = data;
        console.log('Metadata loaded:', metadata);

        // Initialize node positions
        initializeNodePositions();

        // Render the diagram
        renderDiagram();

        showDiagram();

    } catch (error) {
        console.error('Error fetching metadata:', error);
        showError(`Failed to load metadata: ${error.message}`);
    }
}

// Update edges for a specific table (for drag operations)
function updateEdgesForTable(tableName) {
    if (!metadata || metadata.length === 0) return;

    const svg = d3.select(erdSvg);

    // Helper: get column anchor point
    function getColumnAnchor(tableName, colName, side = 'right', nodeWidth = NODE_WIDTH) {
        const table = metadata.find(t => t.table_name === tableName);
        const pos = nodePositions[tableName] || { x: 0, y: 0 };
        const colIdx = table.columns.findIndex(c => c.column_name === colName);
        const y = pos.y + HEADER_HEIGHT + ROW_HEIGHT * colIdx + ROW_HEIGHT / 2 + 4;

        if (side === 'left') return { x: pos.x, y };
        if (side === 'right') return { x: pos.x + nodeWidth, y };
        if (side === 'top') return { x: pos.x + nodeWidth / 2, y: pos.y };
        if (side === 'bottom') return { x: pos.x + nodeWidth / 2, y: pos.y + HEADER_HEIGHT + ROW_HEIGHT * table.columns.length };
        return { x: pos.x + nodeWidth, y };
    }

    // Precompute node widths for each table
    const nodeWidths = {};
    metadata.forEach((table) => {
        let maxLen = table.table_name.length;
        table.columns.forEach(col => {
            let icons = [];
            if (isPK(table, col)) icons.push('🔑');
            if (isFK(table, col)) icons.push('🔗');
            const iconStr = icons.join(' ');
            const len = (iconStr.length ? iconStr.length + 1 : 0) + col.column_name.length + 2 + (col.data_type ? col.data_type.length : 0);
            if (len > maxLen) maxLen = len;
        });
        nodeWidths[table.table_name] = Math.max(NODE_WIDTH, maxLen * 10 + 56);
    });

    // Update edges that involve the dragged table
    metadata.forEach((table) => {
        (table.foreign_keys || []).forEach(fk => {
            // Only update edges that involve the dragged table
            if (table.table_name === tableName || fk.target_table === tableName) {
                const sourcePos = nodePositions[table.table_name] || { x: 0, y: 0 };
                const targetPos = nodePositions[fk.target_table] || { x: 0, y: 0 };
                const sourceWidth = nodeWidths[table.table_name] || NODE_WIDTH;
                const targetWidth = nodeWidths[fk.target_table] || NODE_WIDTH;

                const sourceCenterX = sourcePos.x + sourceWidth / 2;
                const targetCenterX = targetPos.x + targetWidth / 2;

                let sourceSide = 'left', targetSide = 'right';
                const overlapThreshold = (sourceWidth + targetWidth) / 2 + 24;

                if (Math.abs(sourceCenterX - targetCenterX) < overlapThreshold) {
                    sourceSide = 'top';
                    targetSide = 'bottom';
                } else if (sourcePos.x < targetPos.x - targetWidth / 2) {
                    sourceSide = 'right';
                    targetSide = 'left';
                } else if (sourcePos.x > targetPos.x + targetWidth / 2) {
                    sourceSide = 'left';
                    targetSide = 'right';
                } else {
                    sourceSide = 'right';
                    targetSide = 'left';
                }

                const startAnchor = getColumnAnchor(fk.target_table, fk.target_column, targetSide, targetWidth);
                const endAnchor = getColumnAnchor(table.table_name, fk.source_column, sourceSide, sourceWidth);

                let pathD;
                if ((sourceSide === 'top' && targetSide === 'bottom') || (sourceSide === 'bottom' && targetSide === 'top')) {
                    const dy = endAnchor.y - startAnchor.y;
                    const curve = 0.4;
                    const c1x = startAnchor.x;
                    const c1y = startAnchor.y + dy * curve;
                    const c2x = endAnchor.x;
                    const c2y = endAnchor.y - dy * curve;
                    pathD = `M${startAnchor.x},${startAnchor.y} C${c1x},${c1y} ${c2x},${c2y} ${endAnchor.x},${endAnchor.y}`;
                } else {
                    const dx = endAnchor.x - startAnchor.x;
                    const curve = 0.4;
                    const c1x = startAnchor.x + dx * curve;
                    const c1y = startAnchor.y;
                    const c2x = endAnchor.x - dx * curve;
                    const c2y = endAnchor.y;
                    pathD = `M${startAnchor.x},${startAnchor.y} C${c1x},${c1y} ${c2x},${c2y} ${endAnchor.x},${endAnchor.y}`;
                }

                // Find and update the existing path
                const edgeId = `${table.table_name}_${fk.source_column}_${fk.target_table}_${fk.target_column}`;
                const existingPath = svg.select(`path[data-edge-id="${edgeId}"]`);

                if (existingPath.empty()) {
                    // If path doesn't exist, create it
                    const newPath = svg.append('path')
                        .attr('d', pathD)
                        .attr('stroke', '#0dcaf0')
                        .attr('stroke-width', 3)
                        .attr('fill', 'none')
                        .attr('stroke-dasharray', '8 6')
                        .attr('class', 'erd-animated-edge')
                        .attr('data-edge-id', edgeId)
                        .node();

                    // Add relationship symbols for new path
                    const [srcSym, tgtSym] = getRelationshipSymbols(fk.relationship_type);
                    if (newPath) {
                        const totalLen = newPath.getTotalLength();
                        const srcPt = newPath.getPointAtLength(18);
                        const tgtPt = newPath.getPointAtLength(totalLen - 18);

                        svg.append('text')
                            .attr('x', srcPt.x)
                            .attr('y', srcPt.y - 6)
                            .attr('font-size', 13)
                            .attr('fill', '#0dcaf0')
                            .attr('font-weight', 700)
                            .attr('text-anchor', 'middle')
                            .attr('data-edge-id', edgeId)
                            .attr('data-symbol-type', 'source')
                            .text(srcSym);

                        svg.append('text')
                            .attr('x', tgtPt.x)
                            .attr('y', tgtPt.y - 6)
                            .attr('font-size', 13)
                            .attr('fill', '#0dcaf0')
                            .attr('font-weight', 700)
                            .attr('text-anchor', 'middle')
                            .attr('data-edge-id', edgeId)
                            .attr('data-symbol-type', 'target')
                            .text(tgtSym);
                    }
                } else {
                    // Update existing path
                    existingPath.attr('d', pathD);

                    // Update relationship symbols for existing path
                    const pathNode = existingPath.node();
                    if (pathNode) {
                        const totalLen = pathNode.getTotalLength();
                        const srcPt = pathNode.getPointAtLength(18);
                        const tgtPt = pathNode.getPointAtLength(totalLen - 18);

                        // Update source symbol
                        const sourceSymbol = svg.select(`text[data-edge-id="${edgeId}"][data-symbol-type="source"]`);
                        if (!sourceSymbol.empty()) {
                            sourceSymbol
                                .attr('x', srcPt.x)
                                .attr('y', srcPt.y - 6);
                        }

                        // Update target symbol
                        const targetSymbol = svg.select(`text[data-edge-id="${edgeId}"][data-symbol-type="target"]`);
                        if (!targetSymbol.empty()) {
                            targetSymbol
                                .attr('x', tgtPt.x)
                                .attr('y', tgtPt.y - 6);
                        }
                    }
                }
            }
        });
    });
}

// Initialize node positions in a grid layout
function initializeNodePositions() {
    if (!metadata || metadata.length === 0) return;

    const positions = {};
    const cols = Math.ceil(Math.sqrt(metadata.length));

    metadata.forEach((table, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        positions[table.table_name] = {
            x: NODE_MARGIN_X + col * (NODE_WIDTH + NODE_MARGIN_X),
            y: NODE_MARGIN_Y + row * (HEADER_HEIGHT + ROW_HEIGHT * (table.columns.length + 1) + NODE_MARGIN_Y)
        };
    });

    nodePositions = positions;
}

// Render the ERD diagram using D3.js
function renderDiagram() {
    if (!metadata || metadata.length === 0) return;

    const svg = d3.select(erdSvg);
    svg.selectAll('*').remove();

    // Setup drag behavior
    const drag = d3.drag()
        .on('start', function () {
            d3.select(this).raise();
        })
        .on('drag', function (event, d) {
            // Update the node position
            nodePositions[d.table_name] = {
                x: event.x,
                y: event.y
            };

            // Update the transform attribute to move the node
            d3.select(this).attr('transform', `translate(${event.x},${event.y})`);

            // Update edges connected to this table
            updateEdgesForTable(d.table_name);
        });

    // Helper: get column anchor point
    function getColumnAnchor(tableName, colName, side = 'right', nodeWidth = NODE_WIDTH) {
        const table = metadata.find(t => t.table_name === tableName);
        const pos = nodePositions[tableName] || { x: 0, y: 0 };
        const colIdx = table.columns.findIndex(c => c.column_name === colName);
        const y = pos.y + HEADER_HEIGHT + ROW_HEIGHT * colIdx + ROW_HEIGHT / 2 + 4;

        if (side === 'left') return { x: pos.x, y };
        if (side === 'right') return { x: pos.x + nodeWidth, y };
        if (side === 'top') return { x: pos.x + nodeWidth / 2, y: pos.y };
        if (side === 'bottom') return { x: pos.x + nodeWidth / 2, y: pos.y + HEADER_HEIGHT + ROW_HEIGHT * table.columns.length };
        return { x: pos.x + nodeWidth, y };
    }

    // Precompute node widths for each table
    const nodeWidths = {};
    metadata.forEach((table) => {
        let maxLen = table.table_name.length;
        table.columns.forEach(col => {
            let icons = [];
            if (isPK(table, col)) icons.push('🔑');
            if (isFK(table, col)) icons.push('🔗');
            const iconStr = icons.join(' ');
            // Estimate: icon + space + col name + space + data type
            const len = (iconStr.length ? iconStr.length + 1 : 0) + col.column_name.length + 2 + (col.data_type ? col.data_type.length : 0);
            if (len > maxLen) maxLen = len;
        });
        // Use a monospace font, so 10px per char is a good estimate, plus padding
        nodeWidths[table.table_name] = Math.max(NODE_WIDTH, maxLen * 10 + 56);
    });

    // Draw edges first (under nodes)
    metadata.forEach((table) => {
        (table.foreign_keys || []).forEach(fk => {
            // Get node positions and widths
            const sourcePos = nodePositions[table.table_name] || { x: 0, y: 0 };
            const targetPos = nodePositions[fk.target_table] || { x: 0, y: 0 };
            const sourceWidth = nodeWidths[table.table_name] || NODE_WIDTH;
            const targetWidth = nodeWidths[fk.target_table] || NODE_WIDTH;

            // Calculate node centers
            const sourceCenterX = sourcePos.x + sourceWidth / 2;
            const targetCenterX = targetPos.x + targetWidth / 2;

            // Decide anchor sides based on relative positions
            let sourceSide = 'left', targetSide = 'right';
            const overlapThreshold = (sourceWidth + targetWidth) / 2 + 24;

            if (Math.abs(sourceCenterX - targetCenterX) < overlapThreshold) {
                sourceSide = 'top';
                targetSide = 'bottom';
            } else if (sourcePos.x < targetPos.x - targetWidth / 2) {
                sourceSide = 'right';
                targetSide = 'left';
            } else if (sourcePos.x > targetPos.x + targetWidth / 2) {
                sourceSide = 'left';
                targetSide = 'right';
            } else {
                sourceSide = 'right';
                targetSide = 'left';
            }

            // Edge: from target_column (PK, targetSide) to source_column (FK, sourceSide)
            const startAnchor = getColumnAnchor(fk.target_table, fk.target_column, targetSide, targetWidth);
            const endAnchor = getColumnAnchor(table.table_name, fk.source_column, sourceSide, sourceWidth);

            let pathD;
            if ((sourceSide === 'top' && targetSide === 'bottom') || (sourceSide === 'bottom' && targetSide === 'top')) {
                // Vertical curve
                const dy = endAnchor.y - startAnchor.y;
                const curve = 0.4;
                const c1x = startAnchor.x;
                const c1y = startAnchor.y + dy * curve;
                const c2x = endAnchor.x;
                const c2y = endAnchor.y - dy * curve;
                pathD = `M${startAnchor.x},${startAnchor.y} C${c1x},${c1y} ${c2x},${c2y} ${endAnchor.x},${endAnchor.y}`;
            } else {
                // Horizontal curve
                const dx = endAnchor.x - startAnchor.x;
                const curve = 0.4;
                const c1x = startAnchor.x + dx * curve;
                const c1y = startAnchor.y;
                const c2x = endAnchor.x - dx * curve;
                const c2y = endAnchor.y;
                pathD = `M${startAnchor.x},${startAnchor.y} C${c1x},${c1y} ${c2x},${c2y} ${endAnchor.x},${endAnchor.y}`;
            }

            const edgeId = `${table.table_name}_${fk.source_column}_${fk.target_table}_${fk.target_column}`;
            const pathElem = svg.append('path')
                .attr('d', pathD)
                .attr('stroke', '#0dcaf0')
                .attr('stroke-width', 3)
                .attr('fill', 'none')
                .attr('stroke-dasharray', '8 6')
                .attr('class', 'erd-animated-edge')
                .attr('data-edge-id', edgeId)
                .node();

            // Relationship symbols
            const [srcSym, tgtSym] = getRelationshipSymbols(fk.relationship_type);
            if (pathElem) {
                const totalLen = pathElem.getTotalLength();
                const srcPt = pathElem.getPointAtLength(18);
                const tgtPt = pathElem.getPointAtLength(totalLen - 18);

                svg.append('text')
                    .attr('x', srcPt.x)
                    .attr('y', srcPt.y - 6)
                    .attr('font-size', 13)
                    .attr('fill', '#0dcaf0')
                    .attr('font-weight', 700)
                    .attr('text-anchor', 'middle')
                    .attr('data-edge-id', edgeId)
                    .attr('data-symbol-type', 'source')
                    .text(srcSym);

                svg.append('text')
                    .attr('x', tgtPt.x)
                    .attr('y', tgtPt.y - 6)
                    .attr('font-size', 13)
                    .attr('fill', '#0dcaf0')
                    .attr('font-weight', 700)
                    .attr('text-anchor', 'middle')
                    .attr('data-edge-id', edgeId)
                    .attr('data-symbol-type', 'target')
                    .text(tgtSym);
            }
        });
    });

    // Draw nodes
    metadata.forEach((table) => {
        const pos = nodePositions[table.table_name] || { x: 0, y: 0 };
        const nodeWidth = nodeWidths[table.table_name] || NODE_WIDTH;
        const nodeHeight = HEADER_HEIGHT + ROW_HEIGHT * table.columns.length;

        const g = svg.append('g')
            .attr('class', 'erd-table')
            .attr('transform', `translate(${pos.x},${pos.y})`)
            .datum(table)
            .call(drag, table);

        // Node background
        g.append('rect')
            .attr('width', nodeWidth)
            .attr('height', nodeHeight)
            .attr('rx', 12)
            .attr('fill', '#232533')
            .attr('stroke', '#0d6efd')
            .attr('stroke-width', 2)
            .attr('filter', 'drop-shadow(0 4px 16px #0008)');

        // Header
        g.append('rect')
            .attr('width', nodeWidth)
            .attr('height', HEADER_HEIGHT)
            .attr('rx', 12)
            .attr('fill', '#0d6efd');

        g.append('text')
            .attr('x', nodeWidth / 2)
            .attr('y', HEADER_HEIGHT / 2 + 6)
            .attr('text-anchor', 'middle')
            .attr('font-size', 18)
            .attr('font-weight', 700)
            .attr('fill', '#fff')
            .text(table.table_name);

        // Columns
        table.columns.forEach((col, idx) => {
            const y = HEADER_HEIGHT + ROW_HEIGHT * idx + ROW_HEIGHT / 2 + 4;
            let icons = [];
            if (isPK(table, col)) icons.push('🔑');
            if (isFK(table, col)) icons.push('🔗');

            // Render each icon as a separate text element, spaced horizontally
            let iconX = 16;
            icons.forEach((icon) => {
                g.append('text')
                    .attr('x', iconX)
                    .attr('y', y)
                    .attr('font-size', 15)
                    .attr('font-family', 'monospace')
                    .attr('fill', icon === '🔑' ? '#ffd700' : '#0dcaf0')
                    .text(icon);
                iconX += 18;
            });

            // Add extra padding after the last icon
            const colNameX = iconX + (icons.length > 0 ? 4 : 0);
            g.append('text')
                .attr('x', colNameX)
                .attr('y', y)
                .attr('font-size', 15)
                .attr('font-family', 'monospace')
                .attr('fill', '#fff')
                .text(col.column_name);

            g.append('text')
                .attr('x', nodeWidth - 16)
                .attr('y', y)
                .attr('font-size', 13)
                .attr('font-family', 'monospace')
                .attr('fill', '#adb5bd')
                .attr('text-anchor', 'end')
                .text(col.data_type);
        });
    });

    // Add CSS animation for edges
    const existingStyle = document.querySelector('#erdSvg').parentNode.querySelector('style');
    if (existingStyle) {
        existingStyle.remove();
    }

    const style = document.createElement('style');
    style.textContent = `
        .erd-animated-edge {
            stroke-dasharray: 8 6;
            animation: dashmove 1.2s linear infinite;
        }
        @keyframes dashmove {
            to { stroke-dashoffset: -28; }
        }
    `;
    document.querySelector('#erdSvg').parentNode.appendChild(style);
}



// Event listeners
document.addEventListener('DOMContentLoaded', function () {
    // Initial load
    fetchMetadata();

    // Button event listeners
    retryBtn.addEventListener('click', fetchMetadata);

    // Keyboard shortcuts
    document.addEventListener('keydown', function (event) {
        if (event.key === 'F5') {
            event.preventDefault();
            fetchMetadata();
        }
    });
});

// Export functions for potential external use
window.ERDRenderer = {
    fetchMetadata,
    renderDiagram
};