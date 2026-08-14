import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Network, RefreshCw, Sparkles, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import * as d3 from 'd3';
import toast from 'react-hot-toast';
import knowledgeGraphService from '../../services/knowledgeGraphService';
import Spinner from '../common/Spinner';
import styles from './KnowledgeGraph.module.css';

const NODE_COLORS = {
    core: '#6366f1',
    sub: '#3b82f6',
    related: '#8b5cf6',
    pitfall: '#e11d48',
    example: '#0ea5e9',
};


const NODE_RADIUS = {
    core: 38,
    sub: 26,
    related: 26,
    pitfall: 24,
    example: 22,
};

const KnowledgeGraph = ({ documentId }) => {
    const [graph, setGraph] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const svgRef = useRef(null);
    const simRef = useRef(null);

    useEffect(() => {
        fetchGraph();
    }, [documentId]);

    useEffect(() => {
        if (graph) renderGraph();
    }, [graph, search, filter]);

    const fetchGraph = async () => {
        setLoading(true);
        try {
            const res = await knowledgeGraphService.get(documentId);
            setGraph(res.data.data);
        } catch {
            setGraph(null);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await knowledgeGraphService.generate(documentId);
            setGraph(res.data.data);
            toast.success('Knowledge graph generated!');
        } catch {
            toast.error('Failed to generate knowledge graph.');
        } finally {
            setGenerating(false);
        }
    };

    const renderGraph = useCallback(() => {
        if (!graph || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const W = svgRef.current.clientWidth || 600;
        const H = svgRef.current.clientHeight || 500;

        // Filter nodes based on search and filter
        const visibleNodes = graph.nodes.filter(n => {
            const matchSearch = !search || n.label.toLowerCase().includes(search.toLowerCase());
            const matchFilter = filter === 'all' || n.type === filter;
            return matchSearch && matchFilter;
        });
        const visibleIds = new Set(visibleNodes.map(n => n.id));
        const visibleEdges = graph.edges.filter(e =>
            visibleIds.has(e.source) && visibleIds.has(e.target)
        );

        // Zoom
        const g = svg.append('g');
        const zoom = d3.zoom()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => g.attr('transform', event.transform));
        svg.call(zoom);

        // Arrow markers
        const defs = svg.append('defs');
        Object.entries(NODE_COLORS).forEach(([type, color]) => {
            defs.append('marker')
                .attr('id', `arrow-${type}`)
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 28)
                .attr('refY', 0)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-5L10,0L0,5')
                .attr('fill', color)
                .attr('opacity', 0.7);
        });
        // Default arrow
        defs.append('marker')
            .attr('id', 'arrow-default')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 28).attr('refY', 0)
            .attr('markerWidth', 6).attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#94a3b8').attr('opacity', 0.6);

        // Force simulation
        const nodes = visibleNodes.map(n => ({ ...n }));
        const edges = visibleEdges.map(e => ({ ...e }));

        const sim = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(edges)
                .id(d => d.id)
                .distance(d => {
                    const src = nodes.find(n => n.id === d.source?.id || n.id === d.source);
                    return src?.type === 'core' ? 120 : 90;
                })
            )
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(W / 2, H / 2))
            .force('collision', d3.forceCollide(d => (NODE_RADIUS[d.type] || 20) + 10));

        simRef.current = sim;

        // Edges
        const link = g.append('g')
            .selectAll('line')
            .data(edges)
            .join('line')
            .attr('stroke', '#cbd5e1')
            .attr('stroke-width', 1.2)
            .attr('stroke-opacity', 0.7)
            .attr('marker-end', 'url(#arrow-default)');

        // Edge labels
        const edgeLabel = g.append('g')
            .selectAll('text')
            .data(edges)
            .join('text')
            .attr('font-size', '9px')
            .attr('fill', '#94a3b8')
            .attr('text-anchor', 'middle')
            .text(d => d.relationship);

        // Node groups
        const node = g.append('g')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .attr('cursor', 'pointer')
            .call(d3.drag()
                .on('start', (event, d) => {
                    if (!event.active) sim.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y;
                })
                .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
                .on('end', (event, d) => {
                    if (!event.active) sim.alphaTarget(0);
                    d.fx = null; d.fy = null;
                })
            )
            .on('click', (event, d) => {
                event.stopPropagation();
                setSelectedNode(d);
                // Highlight connected nodes
                const connectedIds = new Set([d.id]);
                edges.forEach(e => {
                    const src = e.source?.id || e.source;
                    const tgt = e.target?.id || e.target;
                    if (src === d.id) connectedIds.add(tgt);
                    if (tgt === d.id) connectedIds.add(src);
                });
                node.selectAll('circle')
                    .attr('opacity', n => connectedIds.has(n.id) ? 1 : 0.25);
                link.attr('stroke-opacity', e => {
                    const src = e.source?.id || e.source;
                    const tgt = e.target?.id || e.target;
                    return src === d.id || tgt === d.id ? 1 : 0.1;
                });
            });

        // Node circles
        node.append('circle')
            .attr('r', d => NODE_RADIUS[d.type] || 20)
            .attr('fill', d => NODE_COLORS[d.type] || '#6366f1')
            .attr('opacity', 0.9)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .on('mouseenter', function () {
                d3.select(this)
                    .transition().duration(150)
                    .attr('r', d => (NODE_RADIUS[d.type] || 20) + 4)
                    .attr('stroke-width', 3);
            })
            .on('mouseleave', function () {
                d3.select(this)
                    .transition().duration(150)
                    .attr('r', d => NODE_RADIUS[d.type] || 20)
                    .attr('stroke-width', 2);
            });

        // Node labels
        node.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', d => {
                if (d.type === 'core') return '11px';
                if (d.label.length > 12) return '8px';
                return '9px';
            })
            .attr('font-weight', '600')
            .attr('pointer-events', 'none')
            .each(function (d) {
                const el = d3.select(this);
                const r = NODE_RADIUS[d.type] || 20;
                const maxChars = Math.floor(r * 0.38);
                const words = d.label.split(' ');
                const lines = [];
                let current = '';

                words.forEach(word => {
                    const test = current ? `${current} ${word}` : word;
                    if (test.length > maxChars && current) {
                        lines.push(current);
                        current = word;
                    } else {
                        current = test;
                    }
                });
                if (current) lines.push(current);

                const lineHeight = 1.15;
                const startDy = -((lines.length - 1) * lineHeight) / 2;

                lines.forEach((line, i) => {
                    el.append('tspan')
                        .attr('x', 0)
                        .attr('dy', i === 0 ? `${startDy}em` : `${lineHeight}em`)
                        .text(line);
                });
            });

        // Click on background to deselect
        svg.on('click', () => {
            setSelectedNode(null);
            node.selectAll('circle').attr('opacity', 0.9);
            link.attr('stroke-opacity', 0.7);
        });

        // Tick
        sim.on('tick', () => {
            link
                .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
            edgeLabel
                .attr('x', d => (d.source.x + d.target.x) / 2)
                .attr('y', d => (d.source.y + d.target.y) / 2);
            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Zoom to fit
        svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

    }, [graph, search, filter]);

    const handleZoom = (factor) => {
        const svg = d3.select(svgRef.current);
        svg.transition().duration(300).call(
            d3.zoom().scaleExtent([0.3, 3]).on('zoom', (event) => {
                svg.select('g').attr('transform', event.transform);
            }).scaleBy, factor
        );
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner /></div>;

    return (
        <div className={styles.container}>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <span className={styles.toolbarTitle}>
                    Knowledge Graph
                    {graph && <span style={{ fontWeight: 400, color: 'var(--color-slate-500)', marginLeft: 8, fontSize: '0.8125rem' }}>
                        {graph.nodes.length} concepts · {graph.edges.length} relationships
                    </span>}
                </span>

                {graph && (
                    <input
                        className={styles.searchInput}
                        placeholder="Search concepts..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                )}

                {graph && (
                    <button className={styles.regenerateBtn} onClick={handleGenerate} disabled={generating}>
                        <RefreshCw size={14} strokeWidth={2} />
                        {generating ? 'Regenerating...' : 'Regenerate'}
                    </button>
                )}

                {!graph && (
                    <button className={styles.generateBtn} onClick={handleGenerate} disabled={generating}>
                        <Sparkles size={14} strokeWidth={2} />
                        {generating ? 'Generating...' : 'Generate Knowledge Graph'}
                    </button>
                )}
            </div>

            {/* Body */}
            {!graph ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}><Network size={30} strokeWidth={1.5} /></div>
                    <h3 className={styles.emptyTitle}>No Knowledge Graph Yet</h3>
                    <p className={styles.emptyDesc}>
                        Generate a knowledge graph to visualise the concepts in this document and how they relate to each other.
                    </p>
                    <button className={styles.generateBtn} onClick={handleGenerate} disabled={generating}>
                        <Sparkles size={14} strokeWidth={2} />
                        {generating ? 'Generating...' : 'Generate Knowledge Graph'}
                    </button>
                </div>
            ) : (
                <div className={styles.body}>

                    {/* Graph */}
                    <div className={styles.graphArea}>
                        <svg ref={svgRef} className={styles.graphSvg} />

                        {/* Zoom controls */}
                        <div className={styles.zoomControls}>
                            <button className={styles.zoomBtn} onClick={() => handleZoom(1.3)}>
                                <ZoomIn size={16} strokeWidth={2} />
                            </button>
                            <button className={styles.zoomBtn} onClick={() => handleZoom(0.7)}>
                                <ZoomOut size={16} strokeWidth={2} />
                            </button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className={styles.sidebar}>

                        {/* Stats */}
                        <div>
                            <div className={styles.sidebarLabel}>Graph Stats</div>
                            <div className={styles.statsRow}>
                                <div className={styles.statChip}>
                                    <div className={styles.statVal}>{graph.nodes.length}</div>
                                    <div className={styles.statLabel}>Nodes</div>
                                </div>
                                <div className={styles.statChip}>
                                    <div className={styles.statVal}>{graph.edges.length}</div>
                                    <div className={styles.statLabel}>Edges</div>
                                </div>
                            </div>
                        </div>

                        {/* Selected node info */}
                        <div>
                            <div className={styles.sidebarLabel}>Selected Concept</div>
                            {selectedNode ? (
                                <div className={styles.nodeCard}>
                                    <div className={styles.nodeName}>{selectedNode.label}</div>
                                    <span
                                        className={styles.nodeType}
                                        style={{
                                            background: (NODE_COLORS[selectedNode.type] || '#6366f1') + '22',
                                            color: NODE_COLORS[selectedNode.type] || '#6366f1'
                                        }}
                                    >
                                        {selectedNode.type}
                                    </span>
                                    <div className={styles.nodeDesc}>{selectedNode.description}</div>
                                </div>
                            ) : (
                                <div className={styles.nodeCard}>
                                    <div className={styles.nodeDesc} style={{ color: 'var(--color-slate-400)' }}>
                                        Click any node to see its details here.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filter */}
                        <div>
                            <div className={styles.sidebarLabel}>Filter by Type</div>
                            {['all', 'core', 'sub', 'related', 'pitfall', 'example'].map(f => (
                                <button
                                    key={f}
                                    className={[styles.filterBtn, filter === f ? styles.filterBtnActive : ''].join(' ')}
                                    onClick={() => setFilter(f)}
                                >
                                    {f === 'all' ? '● All nodes' : `● ${f.charAt(0).toUpperCase() + f.slice(1)}`}
                                </button>
                            ))}
                        </div>

                        {/* Legend */}
                        <div>
                            <div className={styles.sidebarLabel}>Legend</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {Object.entries(NODE_COLORS).map(([type, color]) => (
                                    <div key={type} className={styles.legendItem}>
                                        <div className={styles.legendDot} style={{ background: color }} />
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default KnowledgeGraph;