import {
  addEdge,
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  Handle,
  useEdgesState,
  useNodesState,
  getBezierPath,
  getSmoothStepPath,
  Position,
} from '@xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  Download,
  Gauge,
  MousePointer2,
  Play,
  Power,
  RadioTower,
  Save,
  Trash2,
  Upload,
  RotateCw,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';

const nodeTypes = {
  silo: SiloNode,
  hopper: HopperNode,
  mixer: MixerNode,
  feeder: FeederNode,
  control: ControlPanelNode,
  status: StatusNode,
  point: PointNode,
};

const edgeTypes = {
  metallicPipe: MetallicPipeEdge,
};

const flowNodes = [
  { id: 'source-flour', type: 'hopper', position: { x: 42, y: 218 }, data: { label: 'Material Bin 01', fill: 72, tone: 'zinc' } },
  { id: 'source-additive', type: 'hopper', position: { x: 122, y: 218 }, data: { label: 'Material Bin 02', fill: 66, tone: 'zinc' } },
  { id: 'source-mineral', type: 'hopper', position: { x: 202, y: 218 }, data: { label: 'Material Bin 03', fill: 61, tone: 'zinc' } },
  { id: 'source-reclaim', type: 'hopper', position: { x: 282, y: 218 }, data: { label: 'Material Bin 04', fill: 69, tone: 'zinc' } },
  { id: 'screw-feeder', type: 'feeder', position: { x: 40, y: 382 }, data: { label: 'Screw Conveyor', speed: '68%', load: '31 A' } },

  { id: 'silo-a', type: 'silo', position: { x: 504, y: 34 }, data: { label: 'WEIGH SILO A', weight: '4.82 t', fill: 78 } },
  { id: 'silo-b', type: 'silo', position: { x: 612, y: 34 }, data: { label: 'WEIGH SILO B', weight: '3.96 t', fill: 63 } },
  { id: 'silo-c', type: 'silo', position: { x: 720, y: 34 }, data: { label: 'WEIGH SILO C', weight: '4.15 t', fill: 70 } },
  { id: 'scale-hopper', type: 'silo', position: { x: 568, y: 204 }, data: { label: 'BATCH HOPPER', weight: '1.28 t', fill: 52, compact: true } },

  { id: 'central-mixer', type: 'mixer', position: { x: 534, y: 456 }, data: { label: 'HIGH SPEED MIXER', rpm: 1420, temp: '41 C', state: 'Running' } },
  { id: 'discharge-scale', type: 'status', position: { x: 590, y: 682 }, data: { label: 'Scale Cart', value: 'Ready', icon: 'gauge' } },

  { id: 'right-hopper', type: 'silo', position: { x: 904, y: 224 }, data: { label: 'DISCHARGE HOPPER', weight: '0.92 t', fill: 46, compact: true } },
  { id: 'final-bin-a', type: 'hopper', position: { x: 1060, y: 36 }, data: { label: 'CYCLONE A', fill: 58, tone: 'steel' } },
  { id: 'final-bin-b', type: 'hopper', position: { x: 1170, y: 36 }, data: { label: 'CYCLONE B', fill: 81, tone: 'steel' } },
  { id: 'outlet', type: 'status', position: { x: 1064, y: 310 }, data: { label: 'Outlet Valve', value: 'Open', icon: 'activity' } },
  { id: 'plc', type: 'control', position: { x: 1044, y: 594 }, data: { label: 'PLC Control', mode: 'AUTO', batch: 'B-2605-17' } },

  { id: 'p-feed-turn', type: 'point', position: { x: 445, y: 428 }, data: { hot: true } },
  { id: 'p-top-drop', type: 'point', position: { x: 625, y: 408 }, data: { hot: true } },
  { id: 'p-right-rise', type: 'point', position: { x: 816, y: 376 }, data: { hot: false } },
  { id: 'p-cyclone-manifold', type: 'point', position: { x: 1118, y: 188 }, data: { hot: true } },
  { id: 'p-mixer-drop', type: 'point', position: { x: 645, y: 632 }, data: { hot: true } },
];

const pipeEdge = (id, source, target, opts = {}) => ({
  id,
  source,
  target,
  type: 'metallicPipe',
  animated: opts.animated ?? true,
  sourceHandle: opts.sourceHandle,
  targetHandle: opts.targetHandle,
  data: { active: opts.active ?? true, route: opts.route ?? 'smooth', label: opts.label },
  markerEnd: opts.arrow ? { type: MarkerType.ArrowClosed, color: '#53f07a', width: 20, height: 20 } : undefined,
});

const flowEdges = [
  pipeEdge('bin-01-feed', 'source-flour', 'screw-feeder'),
  pipeEdge('bin-02-feed', 'source-additive', 'screw-feeder'),
  pipeEdge('bin-03-feed', 'source-mineral', 'screw-feeder'),
  pipeEdge('bin-04-feed', 'source-reclaim', 'screw-feeder'),
  pipeEdge('feeder-turn', 'screw-feeder', 'p-feed-turn', { route: 'step' }),
  pipeEdge('turn-mixer', 'p-feed-turn', 'central-mixer', { route: 'step', arrow: true, label: 'ingredient feed' }),

  pipeEdge('silo-a-hopper', 'silo-a', 'scale-hopper', { route: 'step' }),
  pipeEdge('silo-b-hopper', 'silo-b', 'scale-hopper', { route: 'step' }),
  pipeEdge('silo-c-hopper', 'silo-c', 'scale-hopper', { route: 'step' }),
  pipeEdge('scale-drop', 'scale-hopper', 'p-top-drop', { route: 'step' }),
  pipeEdge('top-drop-mixer', 'p-top-drop', 'central-mixer', { route: 'step', label: 'batch drop' }),

  pipeEdge('mixer-right-rise', 'central-mixer', 'p-right-rise', { route: 'step' }),
  pipeEdge('right-rise-hopper', 'p-right-rise', 'right-hopper', { route: 'step', arrow: true }),
  pipeEdge('right-hopper-outlet', 'right-hopper', 'outlet', { route: 'step', active: false }),
  pipeEdge('right-manifold', 'right-hopper', 'p-cyclone-manifold', { route: 'step' }),
  pipeEdge('manifold-cyclone-a', 'p-cyclone-manifold', 'final-bin-a', { route: 'step', active: false }),
  pipeEdge('manifold-cyclone-b', 'p-cyclone-manifold', 'final-bin-b', { route: 'step' }),

  pipeEdge('mixer-cart', 'central-mixer', 'p-mixer-drop', { route: 'step' }),
  pipeEdge('cart-drop', 'p-mixer-drop', 'discharge-scale', { route: 'step', arrow: true }),
];

const defaultViewport = { x: 30, y: 16, zoom: 0.82 };
const storageKey = 'hmi-react-flow3-layout-v1';

function loadSavedLayout() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function App() {
  const [savedLayout] = useState(() => (typeof window === 'undefined' ? null : loadSavedLayout()));
  const [nodes, setNodes, onNodesChange] = useNodesState(savedLayout?.nodes ?? flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(savedLayout?.edges ?? flowEdges);
  const [editMode, setEditMode] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedEdges, setSelectedEdges] = useState([]);
  const [saveState, setSaveState] = useState(savedLayout ? 'Loaded saved layout' : 'Default layout');
  const flowRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (flowRef.current && savedLayout?.viewport) {
      flowRef.current.setViewport(savedLayout.viewport, { duration: 0 });
    }
  }, [savedLayout?.viewport]);

  const onConnect = useCallback((connection) => {
    const id = `pipe-${connection.source}-${connection.target}-${Date.now()}`;
    setEdges((currentEdges) => addEdge({
      ...connection,
      id,
      type: 'metallicPipe',
      animated: true,
      data: { active: true, route: 'step' },
    }, currentEdges));
    setSaveState('Unsaved changes');
  }, [setEdges]);

  const onSelectionChange = useCallback(({ nodes: nextNodes, edges: nextEdges }) => {
    setSelectedNodes(nextNodes);
    setSelectedEdges(nextEdges);
  }, []);

  const saveLayout = useCallback(() => {
    const payload = {
      nodes,
      edges,
      viewport: flowRef.current?.getViewport() ?? defaultViewport,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    setSaveState('Saved to this browser');
  }, [edges, nodes]);

  const resetLayout = useCallback(() => {
    window.localStorage.removeItem(storageKey);
    setNodes(flowNodes);
    setEdges(flowEdges);
    flowRef.current?.setViewport(defaultViewport, { duration: 250 });
    setSaveState('Reset to default');
  }, [setEdges, setNodes]);

  const deleteSelection = useCallback(() => {
    const nodeIds = new Set(selectedNodes.map((node) => node.id));
    const edgeIds = new Set(selectedEdges.map((edge) => edge.id));
    setNodes((currentNodes) => currentNodes.filter((node) => !nodeIds.has(node.id)));
    setEdges((currentEdges) => currentEdges.filter((edge) => (
      !edgeIds.has(edge.id) && !nodeIds.has(edge.source) && !nodeIds.has(edge.target)
    )));
    setSaveState('Unsaved changes');
  }, [selectedEdges, selectedNodes, setEdges, setNodes]);

  const exportLayout = useCallback(() => {
    const payload = JSON.stringify({
      nodes,
      edges,
      viewport: flowRef.current?.getViewport() ?? defaultViewport,
      exportedAt: new Date().toISOString(),
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hmi-react-flow-layout.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [edges, nodes]);

  const importLayout = useCallback((event) => {
    const [file] = event.target.files;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const layout = JSON.parse(reader.result);
        if (!Array.isArray(layout.nodes) || !Array.isArray(layout.edges)) {
          throw new Error('Invalid layout file');
        }
        setNodes(layout.nodes);
        setEdges(layout.edges);
        if (layout.viewport) {
          flowRef.current?.setViewport(layout.viewport, { duration: 250 });
        }
        setSaveState('Imported layout');
      } catch {
        setSaveState('Import failed');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [setEdges, setNodes]);

  const selectionCount = selectedNodes.length + selectedEdges.length;

  return (
    <ReactFlowProvider>
      <main className={`app-shell ${editMode ? 'is-editing' : ''}`}>
        <TopBar
          editMode={editMode}
          saveState={saveState}
          selectionCount={selectionCount}
          onDeleteSelection={deleteSelection}
          onExportLayout={exportLayout}
          onImportClick={() => fileInputRef.current?.click()}
          onResetLayout={resetLayout}
          onSaveLayout={saveLayout}
          onToggleEdit={() => setEditMode((current) => !current)}
        />
        <input ref={fileInputRef} className="file-input" type="file" accept="application/json" onChange={importLayout} />
        <SvgDefinitions />
        <section className="flow-panel" aria-label="PLC HMI process overview">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultViewport={defaultViewport}
            minZoom={0.45}
            maxZoom={1.35}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            onInit={(instance) => {
              flowRef.current = instance;
            }}
            onConnect={onConnect}
            onEdgesChange={(changes) => {
              onEdgesChange(changes);
              setSaveState('Unsaved changes');
            }}
            onNodesChange={(changes) => {
              onNodesChange(changes);
              setSaveState('Unsaved changes');
            }}
            onSelectionChange={onSelectionChange}
            nodesDraggable={editMode}
            nodesConnectable={editMode}
            elementsSelectable={editMode}
            deleteKeyCode={editMode ? ['Backspace', 'Delete'] : null}
            snapToGrid={editMode}
            snapGrid={[12, 12]}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#7d8388" gap={24} size={1} />
            <Controls showInteractive={false} position="bottom-left" />
          </ReactFlow>
        </section>
      </main>
    </ReactFlowProvider>
  );
}

function SvgDefinitions() {
  return (
    <svg className="svg-defs" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="metalPipe" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f7fbff" />
          <stop offset="22%" stopColor="#aeb8bd" />
          <stop offset="50%" stopColor="#626b70" />
          <stop offset="73%" stopColor="#d7e0e5" />
          <stop offset="100%" stopColor="#777f84" />
        </linearGradient>
        <linearGradient id="livePipe" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#14ef72" />
          <stop offset="42%" stopColor="#8eff9d" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <filter id="pipeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#101316" floodOpacity="0.4" />
        </filter>
      </defs>
    </svg>
  );
}

function TopBar({
  editMode,
  onDeleteSelection,
  onExportLayout,
  onImportClick,
  onResetLayout,
  onSaveLayout,
  onToggleEdit,
  saveState,
  selectionCount,
}) {
  return (
    <header className="topbar">
      <div>
        <p>REAL TIME DATA LOGGING</p>
        <h1>Mixing Line Process HMI</h1>
      </div>
      <div className="toolbar" aria-label="Line controls">
        <button className={editMode ? 'is-active' : ''} title="Toggle edit mode" onClick={onToggleEdit}>
          <MousePointer2 size={18} /> {editMode ? 'EDITING' : 'EDIT'}
        </button>
        <button title="Save layout in this browser" onClick={onSaveLayout}><Save size={18} /> SAVE</button>
        <button title="Download layout JSON" onClick={onExportLayout}><Download size={18} /> EXPORT</button>
        <button title="Import layout JSON" onClick={onImportClick}><Upload size={18} /> IMPORT</button>
        <button title="Delete selected nodes or edges" disabled={!editMode || selectionCount === 0} onClick={onDeleteSelection}>
          <Trash2 size={18} /> DELETE
        </button>
        <button title="Reset layout" onClick={onResetLayout}><RotateCw size={18} /> RESET LAYOUT</button>
        <button title="Run"><Play size={18} /> RUN</button>
        <button className="danger" title="Power"><Power size={18} /> E-STOP</button>
      </div>
      <div className="system-stats">
        <span>{saveState}</span>
        <span><RadioTower size={16} /> PLC online</span>
        <span><Zap size={16} /> 480 V</span>
        <span><Gauge size={16} /> 86% OEE</span>
      </div>
    </header>
  );
}

function MetallicPipeEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, animated }) {
  const route = data?.route === 'step' ? getSmoothStepPath : getBezierPath;
  const [edgePath, labelX, labelY] = route({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 18 });
  const active = data?.active !== false;

  return (
    <g className="pipe-edge" data-active={active}>
      <path id={`${id}-shadow`} d={edgePath} className="pipe-shadow" />
      <path id={id} d={edgePath} className="pipe-base" />
      <path d={edgePath} className="pipe-highlight" />
      {active && <path d={edgePath} className={`pipe-flow ${animated ? 'is-animated' : ''}`} />}
      {data?.label && (
        <text x={labelX} y={labelY - 18} className="pipe-label">
          {data.label}
        </text>
      )}
    </g>
  );
}

function SiloNode({ data }) {
  return (
    <article className={`silo-node ${data.compact ? 'is-compact' : ''}`}>
      <FlowHandles />
      <div className="silo-cap">
        <span>{data.label}</span>
        <b>{data.weight}</b>
      </div>
      <div className="silo-body">
        <div className="silo-level" style={{ height: `${data.fill}%` }} />
        <div className="silo-shine" />
      </div>
      <div className="silo-cone" />
    </article>
  );
}

function HopperNode({ data }) {
  return (
    <article className={`hopper-node tone-${data.tone}`}>
      <FlowHandles />
      <div className="hopper-label">{data.label}</div>
      <div className="hopper-vessel">
        <div style={{ height: `${data.fill}%` }} />
      </div>
      <div className="hopper-neck" />
    </article>
  );
}

function MixerNode({ data }) {
  return (
    <article className="mixer-node">
      <FlowHandles />
      <div className="mixer-drum">
        <div className="mix-liquid" />
        <SlidersHorizontal className="mixer-blade" size={42} />
      </div>
      <div className="mixer-status">
        <strong>{data.label}</strong>
        <span>{data.state}</span>
        <small>{data.rpm} RPM - {data.temp}</small>
      </div>
    </article>
  );
}

function FeederNode({ data }) {
  return (
    <article className="feeder-node">
      <FlowHandles />
      <div className="feeder-track">
        {Array.from({ length: 10 }).map((_, index) => <span key={index} />)}
      </div>
      <div className="feeder-readout">
        <strong>{data.label}</strong>
        <span>{data.speed} - {data.load}</span>
      </div>
    </article>
  );
}

function ControlPanelNode({ data }) {
  return (
    <article className="control-node">
      <FlowHandles />
      <div>
        <strong>{data.label}</strong>
        <span>{data.batch}</span>
      </div>
      <div className="panel-grid">
        <button>AUTO</button>
        <button>JOG</button>
        <button>VALVES</button>
        <button>ALARMS</button>
      </div>
      <p>{data.mode}</p>
    </article>
  );
}

function StatusNode({ data }) {
  const Icon = data.icon === 'activity' ? Activity : Gauge;
  return (
    <article className="status-node">
      <FlowHandles />
      <Icon size={24} />
      <div>
        <strong>{data.label}</strong>
        <span>{data.value}</span>
      </div>
    </article>
  );
}

function PointNode({ data }) {
  return (
    <span className={`point-node ${data.hot ? 'is-hot' : ''}`}>
      <FlowHandles />
    </span>
  );
}

function FlowHandles() {
  return (
    <>
      <Handle className="flow-handle" type="target" position={Position.Top} />
      <Handle className="flow-handle" type="source" position={Position.Bottom} />
      <Handle className="flow-handle" type="target" position={Position.Left} />
      <Handle className="flow-handle" type="source" position={Position.Right} />
    </>
  );
}

export default App;
