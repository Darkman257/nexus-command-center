import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useLiveHealth, PORT_TO_NODE_ID, STATUS_COLORS } from '../lib/useLiveHealth';

// ─── Types ──────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: string;
  status: string;
  layer: string;
  description: string;
  port: number | null;
  path: string | null;
  role?: string;
  does?: string[];
  readsFrom?: string[];
  writesTo?: string[];
  canDo?: string[];
  cannotDo?: string[];
  owner?: string;
  notes?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface Node3D extends GraphNode {
  x: number;
  y: number;
  z: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LAYER_Y: Record<string, number> = {
  user: 14,
  intelligence: 8,
  interface: 4,
  runtime: 0,
  data: -6,
  execution: -10,
  future: -14,
};

const LAYER_COLOR: Record<string, string> = {
  user: '#00d2ff',
  intelligence: '#d500f9',
  interface: '#00e676',
  runtime: '#ffab00',
  data: '#7b61ff',
  execution: '#ff6d00',
  future: '#546e7a',
};

const STATUS_COLOR: Record<string, string> = {
  online:  '#00e676',
  offline: '#ff1744',
  hidden:  '#ffab00',
  unknown: '#546e7a',
  future:  '#37474f',
};

const EDGE_COLOR: Record<string, string> = {
  primary:        '#00d2ff',
  data:           '#7b61ff',
  control:        '#00e676',
  intelligence:   '#d500f9',
  infrastructure: '#546e7a',
  future:         '#37474f',
};

// Live-mode particle speed multipliers per edge type
const EDGE_SPEED: Record<string, number> = {
  primary:        0.55,
  data:           0.40,
  control:        0.60,
  intelligence:   0.70,
  infrastructure: 0.20,
  future:         0.05,
};

// ─── Layout ──────────────────────────────────────────────────────────────────

function layoutNodes(nodes: GraphNode[]): Node3D[] {
  const groups: Record<string, GraphNode[]> = {};
  for (const n of nodes) {
    if (!groups[n.layer]) groups[n.layer] = [];
    groups[n.layer].push(n);
  }
  const result: Node3D[] = [];
  for (const [layer, group] of Object.entries(groups)) {
    const y = LAYER_Y[layer] ?? 0;
    const radius = Math.max(4, group.length * 2.4);
    group.forEach((n, i) => {
      const angle = (i / group.length) * Math.PI * 2;
      result.push({ ...n, x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius });
    });
  }
  return result;
}

// ─── Flow Particle Component ──────────────────────────────────────────────────

function FlowParticles({
  from,
  to,
  edgeType,
  liveMode,
  isActive,
}: {
  from: Node3D;
  to: Node3D;
  edgeType: string;
  liveMode: boolean;
  isActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(Math.random()); // stagger start position
  const color = EDGE_COLOR[edgeType] || '#546e7a';
  const speed = EDGE_SPEED[edgeType] || 0.3;
  const isFuture = edgeType === 'future';
  const isOffline = !isActive;

  const curve = useMemo(() => {
    const start = new THREE.Vector3(from.x, from.y, from.z);
    const end   = new THREE.Vector3(to.x,   to.y,   to.z);
    const mid   = start.clone().lerp(end, 0.5);
    mid.y += 1.8;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from.x, from.y, from.z, to.x, to.y, to.z]);

  // Static edge line (always rendered)
  const lineGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
    return g;
  }, [curve]);

  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: isFuture ? 0.12 : isOffline ? 0.15 : 0.35,
  }), [color, isFuture, isOffline]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (!liveMode || isOffline || isFuture) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;
    tRef.current = (tRef.current + delta * speed) % 1;
    const pt = curve.getPoint(tRef.current);
    meshRef.current.position.set(pt.x, pt.y, pt.z);
  });

  return (
    <group>
      <primitive object={new THREE.Line(lineGeometry, lineMaterial)} />
      {/* Animated particle */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

// ─── Node Sphere ──────────────────────────────────────────────────────────────

function NodeSphere({
  node,
  isSelected,
  isHighlighted,
  liveMode,
  onClick,
}: {
  node: Node3D;
  isSelected: boolean;
  isHighlighted: boolean;
  liveMode: boolean;
  onClick: () => void;
}) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const glowRef  = useRef<THREE.Mesh>(null);
  const color       = LAYER_COLOR[node.layer] || '#ffffff';
  const statusColor = STATUS_COLOR[node.status] || '#546e7a';
  const isFuture    = node.status === 'future';
  const isOnline    = node.status === 'online';
  const baseSize    = isFuture ? 0.52 : 0.75;
  const opacity     = isFuture ? 0.3 : (!isHighlighted && !isSelected) ? 0.45 : 1;

  useFrame((_, delta) => {
    if (meshRef.current && liveMode && isOnline) {
      meshRef.current.rotation.y += delta * 0.25;
    }
    if (glowRef.current) {
      const pulse = 1 + Math.sin(Date.now() * 0.0018) * (liveMode && isOnline ? 0.12 : 0.04);
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={[node.x, node.y, node.z]}>
      {/* Outer glow halo — brighter when selected */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[baseSize * (isSelected ? 2.2 : 1.7), 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.12 : 0.05} />
      </mesh>

      {/* Main sphere */}
      <mesh ref={meshRef} onClick={onClick} castShadow>
        <sphereGeometry args={[baseSize, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.9 : 0.2}
          transparent
          opacity={opacity}
          roughness={0.25}
          metalness={0.65}
        />
      </mesh>

      {/* Status dot */}
      <mesh position={[baseSize * 0.75, baseSize * 0.75, 0]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Label */}
      <Text
        position={[0, baseSize + 0.6, 0]}
        fontSize={0.36}
        color={isSelected ? '#ffffff' : (isHighlighted ? '#cfd8dc' : '#546e7a')}
        anchorX="center"
        anchorY="bottom"
        renderOrder={1}
      >
        {node.label}
      </Text>

      {/* Port */}
      {node.port != null && (
        <Text
          position={[0, -(baseSize + 0.4), 0]}
          fontSize={0.26}
          color="#37474f"
          anchorX="center"
          anchorY="top"
        >
          :{node.port}
        </Text>
      )}
    </group>
  );
}

// ─── Layer Labels ──────────────────────────────────────────────────────────────

function LayerLabel({ layer, y }: { layer: string; y: number }) {
  const labels: Record<string, string> = {
    user:         '── USER ──',
    intelligence: '── INTELLIGENCE ──',
    interface:    '── INTERFACE ──',
    runtime:      '── RUNTIME ──',
    data:         '── DATA ──',
    execution:    '── EXECUTION ──',
    future:       '── FUTURE ──',
  };
  return (
    <Text position={[-20, y, 0]} fontSize={0.38} color={LAYER_COLOR[layer] || '#546e7a'} anchorX="left" anchorY="middle">
      {labels[layer] || layer.toUpperCase()}
    </Text>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene({
  graphData,
  selectedNode,
  setSelectedNode,
  searchTerm: _searchTerm,
  liveMode,
  filteredIds,
}: {
  graphData: GraphData;
  selectedNode: GraphNode | null;
  setSelectedNode: (n: GraphNode | null) => void;
  searchTerm: string;
  liveMode: boolean;
  filteredIds: Set<string> | null;
}) {
  const nodes3D = useMemo(() => layoutNodes(graphData.nodes), [graphData.nodes]);
  const nodeMap = useMemo(() => {
    const m: Record<string, Node3D> = {};
    nodes3D.forEach(n => { m[n.id] = n; });
    return m;
  }, [nodes3D]);

  const { camera } = useThree();
  useEffect(() => { camera.position.set(0, 8, 34); }, [camera]);

  // Determine which nodes are "active" (have online status) for particle decisions
  const activeNodeIds = useMemo(() => {
    const s = new Set<string>();
    graphData.nodes.forEach(n => { if (n.status === 'online') s.add(n.id); });
    return s;
  }, [graphData.nodes]);

  return (
    <>
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 22, 0]}   intensity={1.1} color="#00d2ff" />
      <pointLight position={[12, 0, 12]}  intensity={0.5} color="#d500f9" />
      <pointLight position={[-12, -12, -12]} intensity={0.4} color="#7b61ff" />

      <OrbitControls enableDamping dampingFactor={0.05} minDistance={8} maxDistance={90} enablePan />

      {Object.entries(LAYER_Y).map(([layer, y]) => (
        <LayerLabel key={layer} layer={layer} y={y} />
      ))}

      {/* Edges with animated flow particles */}
      {graphData.edges.map((edge, i) => {
        const from = nodeMap[edge.source];
        const to   = nodeMap[edge.target];
        if (!from || !to) return null;
        const bothActive = activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target);
        return (
          <FlowParticles
            key={i}
            from={from}
            to={to}
            edgeType={edge.type}
            liveMode={liveMode}
            isActive={bothActive}
          />
        );
      })}

      {/* Nodes */}
      {nodes3D.map(node => {
        const isSelected    = selectedNode?.id === node.id;
        const isHighlighted = !filteredIds || filteredIds.has(node.id);
        return (
          <NodeSphere
            key={node.id}
            node={node}
            isSelected={isSelected}
            isHighlighted={isHighlighted}
            liveMode={liveMode}
            onClick={() => setSelectedNode(isSelected ? null : node)}
          />
        );
      })}
    </>
  );
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({ node, onClose, onAskNova }: { node: GraphNode; onClose: () => void; onAskNova?: (prompt: string) => void }) {
  const statusColor = STATUS_COLOR[node.status] || '#546e7a';
  const layerColor  = LAYER_COLOR[node.layer]  || '#ffffff';

  const Row = ({ ar, en, val, color }: { ar: string; en: string; val: string | string[] | null | undefined; color?: string }) => {
    if (!val || (Array.isArray(val) && val.length === 0)) return null;
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: '#546e7a', letterSpacing: 1, marginBottom: 2 }}>
          {ar} <span style={{ color: '#37474f' }}>/ {en}</span>
        </div>
        {Array.isArray(val) ? (
          <ul style={{ margin: 0, paddingLeft: 16, color: color || '#b0bec5', fontSize: 12, lineHeight: 1.7 }}>
            {val.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        ) : (
          <div style={{ fontSize: 12, color: color || '#b0bec5' }}>{val}</div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 380,
      maxHeight: 'calc(100% - 120px)',
      overflowY: 'auto',
      background: 'rgba(6,8,18,0.96)',
      border: `1px solid ${layerColor}33`,
      borderRadius: 12,
      padding: '18px 22px',
      backdropFilter: 'blur(16px)',
      color: '#e0e6ef',
      fontFamily: 'monospace',
      zIndex: 200,
      boxShadow: `0 0 32px ${layerColor}22`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: layerColor, marginBottom: 2 }}>{node.label}</div>
          <div style={{ fontSize: 10, color: '#546e7a', letterSpacing: 1 }}>
            {node.type.toUpperCase()} · {node.layer.toUpperCase()}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block', boxShadow: `0 0 6px ${statusColor}` }} />
          <span style={{ fontSize: 10, color: statusColor, textTransform: 'uppercase', letterSpacing: 1 }}>{node.status}</span>
          <button onClick={onClose} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#546e7a', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderBottom: `1px solid ${layerColor}22`, marginBottom: 12 }} />

      <Row ar="الدور" en="Role" val={node.role} color="#e0e6ef" />
      <Row ar="الحالة" en="Status" val={node.status === 'future' ? 'لم يُبنَ بعد — مستقبلي' : node.status === 'offline' ? 'غير متصل' : 'متصل وشغال'} color={statusColor} />

      {node.port != null && (
        <Row ar="البورت" en="Port" val={`:${node.port}  →  http://localhost:${node.port}`} color="#7b61ff" />
      )}

      <Row ar="بيعمل إيه" en="Does" val={node.does} />
      <Row ar="بيقرأ من" en="Reads From" val={node.readsFrom} color="#d500f9" />
      <Row ar="بيكتب إلى" en="Writes To" val={node.writesTo} color="#00e676" />
      <Row ar="يقدر يعمل" en="Can Do" val={node.canDo} color="#00e676" />
      <Row ar="لا يقدر يعمل" en="Cannot Do" val={node.cannotDo} color="#ff1744" />

      {node.path && (
        <Row ar="المسار" en="Path" val={node.path} color="#546e7a" />
      )}
      {node.owner && (
        <Row ar="المالك" en="Owner" val={node.owner} />
      )}
      {node.notes && (
        <Row ar="ملاحظات" en="Notes" val={node.notes} color="#ffab00" />
      )}

      {/* Ask NOVA button */}
      {onAskNova && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #1a2433' }}>
          <button
            onClick={() => {
              const prompt = `اشرح لي ${node.label} ودوره في نكسس وحالته الحالية.`;
              onAskNova(prompt);
            }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '9px 16px', borderRadius: 6, cursor: 'pointer',
              background: 'rgba(213,0,249,0.12)', border: '1px solid #d500f933',
              color: '#d500f9', fontFamily: 'monospace', fontSize: 11, fontWeight: 600,
              letterSpacing: 1, transition: 'all 0.15s',
            }}
          >
            ✨ Ask NOVA
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Node Explorer Panel ───────────────────────────────────────────────────────

function NodeExplorer({
  graphData,
  selectedNode,
  setSelectedNode,
  searchTerm: _searchTerm,
  filteredIds,
  visible,
  onToggle,
}: {
  graphData: GraphData;
  selectedNode: GraphNode | null;
  setSelectedNode: (n: GraphNode | null) => void;
  searchTerm: string;
  filteredIds: Set<string> | null;
  visible: boolean;
  onToggle: () => void;
}) {
  const byLayer = useMemo(() => {
    const groups: Record<string, GraphNode[]> = {};
    const layerOrder = ['user', 'intelligence', 'interface', 'runtime', 'data', 'execution', 'future'];
    layerOrder.forEach(l => { groups[l] = []; });
    graphData.nodes.forEach(n => {
      if (!groups[n.layer]) groups[n.layer] = [];
      groups[n.layer].push(n);
    });
    return groups;
  }, [graphData.nodes]);

  const visibleNodes = useMemo(() => {
    const count = filteredIds ? graphData.nodes.filter(n => filteredIds.has(n.id)).length : graphData.nodes.length;
    return count;
  }, [filteredIds, graphData.nodes]);

  return (
    <div style={{
      position: 'absolute',
      top: 60,
      right: 16,
      width: visible ? 260 : 44,
      maxHeight: 'calc(100% - 80px)',
      background: 'rgba(6,8,18,0.94)',
      border: '1px solid #1a2433',
      borderRadius: 12,
      overflow: 'hidden',
      zIndex: 150,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      backdropFilter: 'blur(12px)',
    }}>
      {/* Header toggle row */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: visible ? 'space-between' : 'center',
          padding: visible ? '10px 14px' : '10px 0',
          cursor: 'pointer', flexShrink: 0,
          borderBottom: visible ? '1px solid #1a2433' : 'none',
          color: '#00d2ff', fontFamily: 'monospace',
        }}
      >
        {visible ? (
          <>
            <span style={{ fontSize: 10, letterSpacing: 2 }}>NODE EXPLORER</span>
            <span style={{ fontSize: 10, color: '#546e7a' }}>{visibleNodes}/{graphData.nodes.length} ›</span>
          </>
        ) : (
          <span style={{ fontSize: 14 }}>⊞</span>
        )}
      </div>

      {visible && (
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {Object.entries(byLayer).map(([layer, nodes]) => {
            const visNodes = filteredIds ? nodes.filter(n => filteredIds.has(n.id)) : nodes;
            if (visNodes.length === 0) return null;
            return (
              <div key={layer}>
                {/* Layer group header */}
                <div style={{
                  fontSize: 9, letterSpacing: 2, color: LAYER_COLOR[layer] || '#546e7a',
                  padding: '8px 14px 4px', fontFamily: 'monospace',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span>{layer.toUpperCase()}</span>
                  <span style={{ color: '#37474f' }}>{visNodes.length}</span>
                </div>

                {visNodes.map(node => {
                  const isSelected = selectedNode?.id === node.id;
                  const sc = STATUS_COLOR[node.status] || '#546e7a';
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(isSelected ? null : node)}
                      style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 14px',
                        background: isSelected ? `${LAYER_COLOR[layer]}18` : 'transparent',
                        border: 'none',
                        borderLeft: isSelected ? `2px solid ${LAYER_COLOR[layer]}` : '2px solid transparent',
                        cursor: 'pointer', fontFamily: 'monospace', textAlign: 'left',
                      }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc, flexShrink: 0, boxShadow: node.status === 'online' ? `0 0 4px ${sc}` : 'none' }} />
                      <span style={{ flex: 1, fontSize: 11, color: isSelected ? '#ffffff' : '#b0bec5', lineHeight: 1.3 }}>
                        {node.label}
                      </span>
                      {node.port != null && (
                        <span style={{ fontSize: 9, color: '#37474f' }}>{node.port}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar({ graphData, liveMode, setLiveMode }: { graphData: GraphData; liveMode: boolean; setLiveMode: (v: boolean) => void }) {
  const online  = graphData.nodes.filter(n => n.status === 'online').length;
  const offline = graphData.nodes.filter(n => n.status === 'offline').length;
  const future  = graphData.nodes.filter(n => n.status === 'future').length;

  return (
    <div style={{
      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 0, alignItems: 'center',
      background: 'rgba(6,8,18,0.94)', border: '1px solid #1a2433',
      borderRadius: 8, zIndex: 200, fontFamily: 'monospace',
      overflow: 'hidden',
    }}>
      {[
        { label: 'NODES',   val: graphData.nodes.length, color: '#00d2ff' },
        { label: 'EDGES',   val: graphData.edges.length, color: '#7b61ff' },
        { label: 'ONLINE',  val: online,                 color: '#00e676' },
        { label: 'OFFLINE', val: offline,                color: '#ff1744' },
        { label: 'FUTURE',  val: future,                 color: '#546e7a' },
      ].map((s) => (
        <div key={s.label} style={{
          textAlign: 'center', padding: '7px 18px',
          borderRight: '1px solid #1a2433',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.val}</div>
          <div style={{ fontSize: 9, color: '#37474f', letterSpacing: 1 }}>{s.label}</div>
        </div>
      ))}

      {/* Live/Static toggle */}
      <button
        onClick={() => setLiveMode(!liveMode)}
        style={{
          padding: '7px 16px',
          background: liveMode ? '#00d2ff18' : 'transparent',
          border: 'none', cursor: 'pointer',
          fontFamily: 'monospace', fontSize: 11,
          color: liveMode ? '#00d2ff' : '#546e7a',
          letterSpacing: 1,
          transition: 'all 0.2s',
        }}
      >
        {liveMode ? '⦿ LIVE' : '◌ STATIC'}
      </button>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div style={{
      position: 'absolute', top: 60, left: 16,
      background: 'rgba(6,8,18,0.92)', border: '1px solid #1a2433',
      borderRadius: 10, padding: '12px 16px', zIndex: 100, fontFamily: 'monospace',
    }}>
      <div style={{ fontSize: 9, color: '#37474f', marginBottom: 8, letterSpacing: 2 }}>LAYERS</div>
      {Object.entries(LAYER_COLOR).map(([layer, color]) => (
        <div key={layer} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: color, display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: '#b0bec5', textTransform: 'capitalize' }}>{layer}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid #1a2433', marginTop: 10, paddingTop: 10 }}>
        <div style={{ fontSize: 9, color: '#37474f', marginBottom: 8, letterSpacing: 2 }}>STATUS</div>
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: '#b0bec5', textTransform: 'capitalize' }}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SystemGraph3D({ onAskNova }: { onAskNova?: (prompt: string) => void } = {}) {
  const [graphData, setGraphData]       = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [liveMode, setLiveMode]         = useState(true);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // ─── Live Health Engine ───
  const portHealth = useLiveHealth(10000);

  // Build nodeId -> live status map from port probes
  const liveNodeStatus = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [port, health] of Object.entries(portHealth)) {
      const nodeId = PORT_TO_NODE_ID[Number(port)];
      if (nodeId) map[nodeId] = health.status;
    }
    return map;
  }, [portHealth]);

  // Resolve live status for a given node (port-keyed override or stored status)
  const resolveStatus = useCallback((node: GraphNode): string => {
    return liveNodeStatus[node.id] ?? node.status;
  }, [liveNodeStatus]);

  useEffect(() => {
    fetch('/docs/nexus-system-graph.json')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setGraphData)
      .catch(e => setError(e.message));
  }, []);

  const filteredIds = useMemo(() => {
    if (!searchTerm || !graphData) return null;
    const lower = searchTerm.toLowerCase();
    return new Set(
      graphData.nodes
        .filter(n =>
          n.label.toLowerCase().includes(lower) ||
          n.type.toLowerCase().includes(lower) ||
          n.layer.toLowerCase().includes(lower) ||
          (n.role ?? '').toLowerCase().includes(lower)
        )
        .map(n => n.id)
    );
  }, [searchTerm, graphData]);

  const handleSelectNode = useCallback((n: GraphNode | null) => {
    setSelectedNode(n);
  }, []);

  if (error) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff1744', fontFamily: 'monospace', background: '#050810' }}>
      <div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>⚠ Graph Load Error</div>
        <div style={{ fontSize: 13, color: '#546e7a' }}>{error}</div>
        <div style={{ fontSize: 11, color: '#37474f', marginTop: 8 }}>Ensure public/docs/nexus-system-graph.json exists.</div>
      </div>
    </div>
  );

  if (!graphData) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d2ff', fontFamily: 'monospace', background: '#050810' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.6 }}>◌</div>
        <div>Loading NEXUS Graph...</div>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#050810', overflow: 'hidden' }}>

      {/* Page breadcrumb */}
      <div style={{ position: 'absolute', top: 14, left: 16, zIndex: 200, fontFamily: 'monospace', fontSize: 11, color: '#37474f', letterSpacing: 2 }}>
        NEXUS / SYSTEM GRAPH
      </div>

      {/* Stats bar + Live toggle */}
      <StatsBar graphData={graphData} liveMode={liveMode} setLiveMode={setLiveMode} />

      {/* Live Port Health Strip */}
      <div style={{
        position: 'absolute', top: 14, right: 16, zIndex: 200,
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(6,8,18,0.85)', border: '1px solid #1a2433',
        borderRadius: 6, padding: '5px 10px', backdropFilter: 'blur(8px)',
      }}>
        {Object.entries(portHealth).map(([port, h]) => (
          <div key={port} title={`Port ${port}: ${h.status}${h.latencyMs ? ` (${h.latencyMs}ms)` : ''}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLORS[h.status], display: 'block', boxShadow: h.status === 'ONLINE' ? `0 0 5px ${STATUS_COLORS[h.status]}` : 'none' }} />
            <span style={{ fontFamily: 'monospace', fontSize: 8, color: STATUS_COLORS[h.status] }}>{port}</span>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', zIndex: 200, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          placeholder="Search nodes, types, layers..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            background: 'rgba(6,8,18,0.95)', border: '1px solid #1a2433',
            borderRadius: 6, color: '#e0e6ef', fontFamily: 'monospace',
            fontSize: 12, padding: '6px 14px', width: 240, outline: 'none',
          }}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#546e7a', cursor: 'pointer', fontSize: 16 }}>×</button>
        )}
      </div>

      {/* Legend */}
      <Legend />

      {/* Node Explorer */}
      <NodeExplorer
        graphData={graphData}
        selectedNode={selectedNode}
        setSelectedNode={handleSelectNode}
        searchTerm={searchTerm}
        filteredIds={filteredIds}
        visible={explorerOpen}
        onToggle={() => setExplorerOpen(v => !v)}
      />

      {/* 3D Canvas */}
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [0, 8, 34], fov: 55 }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene
          graphData={graphData}
          selectedNode={selectedNode}
          setSelectedNode={handleSelectNode}
          searchTerm={searchTerm}
          liveMode={liveMode}
          filteredIds={filteredIds}
        />
      </Canvas>

      {/* Detail panel */}
      {selectedNode && (
        <DetailPanel
          node={{ ...selectedNode, status: resolveStatus(selectedNode) }}
          onClose={() => setSelectedNode(null)}
          onAskNova={onAskNova}
        />
      )}

      {/* Controls hint */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, fontFamily: 'monospace', fontSize: 9, color: '#263238', lineHeight: 1.9 }}>
        <div>🖱 Left drag: Rotate</div>
        <div>🖱 Right drag: Pan</div>
        <div>🖱 Scroll: Zoom</div>
        <div>Click node: Details</div>
      </div>
    </div>
  );
}
