import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Info, Layers, RefreshCw, ZoomIn, ZoomOut, Maximize, Activity } from 'lucide-react';
import { getGraphData } from '../services/api';
import AgriCard from "../components/common/AgriCard";
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

const GraphExplorer = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });

  const initGraph = async () => {
    if (!containerRef.current) return;
    
    setLoading(true);
    try {
      const response = await getGraphData();
      const nodes = response.data.nodes || [];
      const edges = response.data.edges || [];
      
      setGraphData({ nodes, edges });

      const elements = [
        ...nodes.map(n => ({
          group: 'nodes',
          data: { ...n, id: n.id, label: n.label }
        })),
        ...edges.map((e, i) => ({
          group: 'edges',
          data: { id: `e${i}`, source: e.source, target: e.target, label: e.label }
        }))
      ];

      if (cyRef.current) {
        cyRef.current.destroy();
      }

      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: elements,
        boxSelectionEnabled: false,
        autounselectify: false,
        autoungrabify: false,
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'background-color': 'data(color)',
              'color': '#fff',
              'text-valign': 'bottom',
              'text-halign': 'center',
              'font-size': '10px',
              'font-weight': '600',
              'width': '65px',
              'height': '65px',
              'text-wrap': 'wrap',
              'text-max-width': '100px',
              'text-margin-y': '8px',
              'overlay-padding': '12px',
              'z-index': 10,
              'text-outline-width': 2,
              'text-outline-color': '#060d06',
              'shape': 'ellipse',
              'background-gradient-direction': 'to-bottom-right',
              'background-gradient-stop-colors': (ele) => `rgba(255,255,255,0.4) ${ele.data('color')}`,
              'background-gradient-stop-positions': '0% 100%',
              'border-width': 3,
              'border-color': 'rgba(255,255,255,0.2)'
            }
          },
          {
            selector: 'node[type="Category"]',
            style: {
              'width': '85px',
              'height': '85px',
              'font-size': '12px',
              'font-weight': '800',
              'border-width': 4,
              'border-color': '#fff'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 4,
              'line-color': 'rgba(74, 222, 128, 0.2)',
              'target-arrow-color': 'rgba(74, 222, 128, 0.2)',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '10px',
              'color': '#6b9a60',
              'text-rotation': 'autorotate',
              'text-margin-y': -10,
              'text-background-opacity': 1,
              'text-background-color': '#060d06',
              'text-background-padding': '4px',
              'text-background-shape': 'roundrectangle'
            }
          },
          {
            selector: ':selected',
            style: {
              'border-width': '8px',
              'border-color': '#fff',
              'border-opacity': 1,
              'z-index': 100,
              'line-color': '#4ade80',
              'target-arrow-color': '#4ade80'
            }
          }
        ]
      });

      const layout = cyRef.current.layout({
        name: edges.length === 0 ? 'circle' : 'cose',
        padding: 150,
        nodeOverlap: 100,
        componentSpacing: 200,
        nodeRepulsion: 25000,
        edgeElasticity: 200,
        nestingFactor: 10,
        gravity: 100,
        numIter: 1200,
        fit: true,
        animate: true,
        animationDuration: 1200,
        spacingFactor: 1.5
      });

      layout.run();
      
      layout.on('layoutstop', () => {
        cyRef.current.fit();
        cyRef.current.center();
      });

      cyRef.current.on('select', 'node', (evt) => {
        setSelectedNode(evt.target.data());
      });

      cyRef.current.on('unselect', 'node', () => {
        setSelectedNode(null);
      });

    } catch (error) {
      console.error('Failed to load graph:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      initGraph();
    }, 300); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
      if (cyRef.current) cyRef.current.destroy();
    };
  }, [location.pathname, location.search]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.3);
  const handleFit = () => cyRef.current?.fit();

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '10px', background: 'var(--gradient-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Network size={28} color="white" />
            </div>
            Knowledge Graph Explorer
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Centrally visualizing the Niti Setu intelligence network. Click nodes for deep metadata.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={initGraph} className="btn-glow" style={{ padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 800 }}>
            <RefreshCw size={22} className={loading ? 'spin' : ''} /> {loading ? 'Syncing...' : 'Sync Graph Data'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AgriCard
          className="agri-card"
          animate={false}
          padding="0"
          style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', border: '1px solid rgba(74, 222, 128, 0.1)' }}
        >
          <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#040804' }} />
          
          <div style={{ position: 'absolute', bottom: '40px', left: '40px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 100 }}>
            <button title="Zoom In" onClick={handleZoomIn} className="btn-secondary" style={{ width: '64px', height: '64px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}><ZoomIn size={28} /></button>
            <button title="Zoom Out" onClick={handleZoomOut} className="btn-secondary" style={{ width: '64px', height: '64px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}><ZoomOut size={28} /></button>
            <button title="Fit All" onClick={handleFit} className="btn-secondary" style={{ width: '64px', height: '64px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}><Maximize size={28} /></button>
          </div>

          {/* Info Panel Overlay — Floating glass panel */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ x: 600, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 600, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{ 
                  position: 'absolute', 
                  top: '24px', 
                  right: '24px', 
                  bottom: '24px', 
                  width: '420px', 
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column'
                }}
                key={selectedNode.id}
              >
                <div 
                  className="glass-card" 
                  style={{ 
                    height: '100%', 
                    padding: '32px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    overflowY: 'auto',
                    border: '1px solid var(--border-glow)',
                    background: 'rgba(6, 13, 6, 0.85)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    borderRadius: '32px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '16px', 
                      background: `linear-gradient(135deg, ${selectedNode.color} 0%, rgba(0,0,0,0.4) 100%)`, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'white',
                      boxShadow: `0 8px 20px -4px ${selectedNode.color}66`,
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <Info size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{selectedNode.type}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Semantic Node Data</p>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Label</label>
                      <p style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '8px', color: 'var(--text-primary)', lineHeight: 1.2 }}>{selectedNode.label}</p>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Unique Identifier</label>
                      <code style={{ 
                        display: 'block', 
                        padding: '12px 16px', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px', 
                        marginTop: '8px', 
                        fontSize: '0.9rem', 
                        color: 'var(--accent-amber)', 
                        wordBreak: 'break-all',
                        fontFamily: 'monospace'
                      }}>{selectedNode.id}</code>
                    </div>

                    <div style={{ 
                      padding: '24px', 
                      borderRadius: '24px', 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      marginTop: 'auto'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <Layers size={18} color="var(--accent-indigo)" />
                        <span style={{ fontSize: '1rem', fontWeight: 800 }}>Intelligence Link</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                        {selectedNode.type === 'Scheme' 
                          ? 'This node encapsulates a complex agricultural policy. Analyzing the graph reveals its semantic proximity to specific farmer documents.' 
                          : 'This category serves as a central hub in the knowledge graph, linking multiple documents via shared semantic embeddings.'}
                      </p>
                      <button className="btn-glow" style={{ width: '100%', padding: '14px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '14px' }}>Analyze Connections</button>
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '2px' }}>ENGINE V1.2.4 • OPTIMIZED</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', zIndex: 1000 }}>
              <div style={{ textAlign: 'center' }}>
                <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ display: 'inline-block' }}>
                  <Network size={80} color="var(--accent-indigo)" />
                </motion.div>
                <h2 style={{ marginTop: '28px', fontSize: '2rem', fontWeight: 950, letterSpacing: '-0.02em' }}>Mapping Graph...</h2>
              </div>
            </div>
          )}

          {!loading && graphData.nodes.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(15px)', zIndex: 500 }}>
              <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(0,0,0,0.4)', borderRadius: '40px', border: '1px solid var(--border-glass)' }}>
                <Activity size={72} color="var(--accent-indigo)" style={{ marginBottom: '24px' }} />
                <h3 style={{ fontSize: '2rem', fontWeight: 950 }}>Graph Engine Offline</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '20px auto', fontSize: '1.1rem', lineHeight: 1.6 }}>The Neo4j network is currently empty. Please upload scheme documents to populate the neural map.</p>
                <button onClick={initGraph} className="btn-glow" style={{ marginTop: '20px', padding: '14px 40px' }}>Initiate Sync</button>
              </div>
            </div>
          )}
        </AgriCard>
      </div>
    </div>
  );
};

export default GraphExplorer;
