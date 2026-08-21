import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { cn } from '@/lib/cn';
import { generateRiskGraph, getNodeTransactions } from '@/lib/riskGraph';
import type { GraphNode, Transaction } from '@/types';
import { Network, X, ZoomIn, ZoomOut, Maximize, User, Smartphone, Globe, MapPin, Building, CreditCard, AlertTriangle } from 'lucide-react';

const NODE_ICONS: Record<string, typeof User> = {
  user: User,
  device: Smartphone,
  ip: Globe,
  location: MapPin,
  merchant: Building,
  transaction: CreditCard,
};

const NODE_COLORS: Record<string, string> = {
  user: '#60a5fa',
  device: '#a78bfa',
  ip: '#f472b6',
  location: '#fb923c',
  merchant: '#34d399',
  transaction: '#1fc7f0',
};

export function RiskGraph() {
  const { transactions } = useApp();
  const graph = useMemo(() => generateRiskGraph(transactions), [transactions]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    }
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setTransform((prev) => ({ ...prev, x: panStart.current.tx + dx, y: panStart.current.ty + dy }));
    }
  }, [isPanning]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleZoom = useCallback((direction: 'in' | 'out' | 'reset') => {
    setTransform((prev) => {
      if (direction === 'reset') return { x: 0, y: 0, scale: 1 };
      const delta = direction === 'in' ? 1.2 : 0.8;
      const newScale = Math.max(0.3, Math.min(3, prev.scale * delta));
      return { ...prev, scale: newScale };
    });
  }, []);

  const connectedTransactions = useMemo(() => {
    if (!selectedNode) return [];
    return getNodeTransactions(selectedNode.id, graph, transactions);
  }, [selectedNode, graph, transactions]);

  return (
    <div className="space-y-4">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Network className="w-6 h-6 text-cyan-400" />
          Behavioral Risk Graph
        </h1>
        <p className="text-slate-400 mt-1.5 text-sm">
          Interactive network visualization of transaction relationships · Click nodes to inspect
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Graph canvas */}
        <div className="lg:col-span-3 glass-card overflow-hidden animate-fade-in-up animate-delay-100 relative" style={{ height: '600px' }}>
          <svg
            ref={svgRef}
            className="w-full h-full cursor-grab active:cursor-grabbing grid-bg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              <marker id="arrow-suspicious" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="rgba(239, 68, 68, 0.5)" />
              </marker>
              <marker id="arrow-normal" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="rgba(74, 93, 138, 0.3)" />
              </marker>
            </defs>
            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
              {/* Edges */}
              {graph.edges.map((edge, i) => {
                const source = graph.nodes.find((n) => n.id === edge.source);
                const target = graph.nodes.find((n) => n.id === edge.target);
                if (!source || !target) return null;
                return (
                  <line
                    key={i}
                    x1={source.x} y1={source.y}
                    x2={target.x} y2={target.y}
                    stroke={edge.suspicious ? 'rgba(239, 68, 68, 0.4)' : 'rgba(74, 93, 138, 0.2)'}
                    strokeWidth={edge.suspicious ? 1.5 : 1}
                    strokeDasharray={edge.suspicious ? '0' : '4 2'}
                    markerEnd={edge.suspicious ? 'url(#arrow-suspicious)' : 'url(#arrow-normal)'}
                  />
                );
              })}
              {/* Nodes */}
              {graph.nodes.map((node) => {
                const Icon = NODE_ICONS[node.type] || User;
                const color = NODE_COLORS[node.type] || '#1fc7f0';
                const isSelected = selectedNode?.id === node.id;
                const radius = node.id === 'sentinel' ? 30 : node.type === 'transaction' ? 20 : 16;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
                    className="cursor-pointer"
                  >
                    {node.suspicious && (
                      <circle r={radius + 6} fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="2" className="animate-pulse" />
                    )}
                    <circle
                      r={radius}
                      fill={node.suspicious ? 'rgba(239, 68, 68, 0.15)' : `${color}20`}
                      stroke={node.suspicious ? '#ef4444' : color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="transition-all duration-200"
                      style={isSelected ? { filter: `drop-shadow(0 0 8px ${color})` } : undefined}
                    />
                    <foreignObject x={-8} y={-8} width="16" height="16">
                      <div className="flex items-center justify-center w-full h-full">
                        <Icon className="w-3.5 h-3.5" style={{ color: node.suspicious ? '#ef4444' : color }} />
                      </div>
                    </foreignObject>
                    <text
                      y={radius + 12}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-400 font-mono pointer-events-none select-none"
                    >
                      {node.label.length > 20 ? node.label.slice(0, 17) + '...' : node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
            <button onClick={() => handleZoom('in')} className="p-2 rounded-lg glass-strong border border-navy-600/30 text-navy-300 hover:text-cyan-300 transition-colors" title="Zoom in">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => handleZoom('out')} className="p-2 rounded-lg glass-strong border border-navy-600/30 text-navy-300 hover:text-cyan-300 transition-colors" title="Zoom out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={() => handleZoom('reset')} className="p-2 rounded-lg glass-strong border border-navy-600/30 text-navy-300 hover:text-cyan-300 transition-colors" title="Reset view">
              <Maximize className="w-4 h-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute top-4 left-4 glass-strong rounded-lg border border-navy-600/30 p-3 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-navy-300 font-mono mb-1">Legend</div>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-slate-300 capitalize">{type}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-xs pt-1 border-t border-navy-600/20">
              <span className="w-2.5 h-2.5 rounded-full bg-risk-critical" />
              <span className="text-slate-300">Suspicious</span>
            </div>
          </div>
        </div>

        {/* Node details panel */}
        <div className="lg:col-span-1 animate-fade-in-up animate-delay-200">
          {selectedNode ? (
            <NodeDetails
              node={selectedNode}
              connectedTransactions={connectedTransactions}
              onClose={() => setSelectedNode(null)}
            />
          ) : (
            <div className="glass-card p-6 text-center" style={{ minHeight: '200px' }}>
              <Network className="w-10 h-10 text-navy-400 mx-auto mb-3" />
              <p className="text-sm text-navy-300">
                Click any node in the graph to view its details, connected transactions, and associated risk signals.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NodeDetails({ node, connectedTransactions, onClose }: { node: GraphNode; connectedTransactions: Transaction[]; onClose: () => void }) {
  const Icon = NODE_ICONS[node.type] || User;
  const color = NODE_COLORS[node.type] || '#1fc7f0';

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg border" style={{ backgroundColor: `${color}20`, borderColor: `${color}40` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="text-sm font-bold text-white capitalize">{node.type}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded text-navy-300 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <div className="text-xs text-navy-300 mb-1">Node ID</div>
        <div className="text-sm text-white font-mono break-all">{node.label}</div>
      </div>

      {node.suspicious && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-risk-critical/5 border border-risk-critical/20">
          <AlertTriangle className="w-4 h-4 text-risk-critical flex-shrink-0" />
          <span className="text-xs text-risk-critical">Suspicious node — flagged by risk engine</span>
        </div>
      )}

      {node.details && (
        <div className="space-y-1.5">
          <div className="text-xs text-navy-300 uppercase tracking-wider">Properties</div>
          {Object.entries(node.details).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="text-navy-300">{key}</span>
              <span className="text-white font-medium text-right">{value}</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="text-xs text-navy-300 uppercase tracking-wider mb-2">Connected Transactions ({connectedTransactions.length})</div>
        {connectedTransactions.length === 0 ? (
          <p className="text-xs text-navy-400">No direct transaction connections.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {connectedTransactions.map((t) => (
              <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-navy-800/40 text-xs">
                <span className={cn(
                  'flex items-center justify-center w-7 h-7 rounded border text-[10px] font-bold font-mono',
                  t.risk_level === 'CRITICAL' ? 'bg-risk-critical/10 border-risk-critical/30 text-risk-critical' :
                  t.risk_level === 'HIGH' ? 'bg-risk-high/10 border-risk-high/30 text-risk-high' :
                  t.risk_level === 'MEDIUM' ? 'bg-risk-medium/10 border-risk-medium/30 text-risk-medium' :
                  'bg-risk-low/10 border-risk-low/30 text-risk-low'
                )}>
                  {t.risk_score}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-cyan-300/80 font-mono truncate">{t.id}</div>
                  <div className="text-navy-300 truncate">{t.currency}{t.amount.toLocaleString()} · {t.threat_type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {node.suspicious && (
        <div className="glass-card p-3 border-risk-critical/15 space-y-1.5">
          <div className="text-xs text-navy-300 uppercase tracking-wider">Why is this suspicious?</div>
          <p className="text-xs text-slate-300">
            {node.type === 'device' && 'This device has not been previously associated with the user account, indicating a potential account takeover attempt.'}
            {node.type === 'location' && 'The transaction originated from a new geographic location not in the user\'s historical pattern.'}
            {node.type === 'ip' && 'This IP address has a suspicious reputation or is associated with anomalous transaction patterns.'}
            {node.type === 'transaction' && 'This transaction triggered multiple high-severity risk signals in the risk engine.'}
          </p>
        </div>
      )}
    </div>
  );
}
