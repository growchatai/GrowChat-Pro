"use client";

import { useCallback, useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    ReactFlowProvider,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
    ArrowLeft, Save, Play, Pause, MessageCircle, Image as ImageIcon,
    Video, Layers, Zap, Clock, GitBranch, Tag, Database, Globe,
    Heart, UserMinus, GripVertical, Settings2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- CUSTOM NODE COMPONENTS ---

const BaseNode = ({ id, data, icon: Icon, title, selected }: any) => {
    return (
        <div className={`bg-surface border-2 rounded-xl shadow-xl w-[260px] overflow-hidden transition-all ${selected ? 'border-accent shadow-accent/20' : 'border-border font-normal'}`}>
            <div className="bg-surface2 px-3 py-2 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="text-text2"><Icon className="w-4 h-4" /></div>
                    <span className="text-sm font-semibold">{title}</span>
                </div>
            </div>
            <div className="p-3">
                <p className="text-sm text-text2 truncate">{data.preview || "Configure this step..."}</p>
            </div>
        </div>
    );
};

// Simplified custom node map
const nodeTypes = {
    // Define custom nodes here if needed, but we can also rely on dynamic rendering in a single CustomNode component
    customNode: ({ id, data, selected }: any) => {
        const iconMap: any = {
            'text_message': MessageCircle,
            'condition': GitBranch,
            'wait': Clock,
            'trigger': Zap,
            'quick_replies': Layers
        };
        const Icon = iconMap[data.type] || MessageCircle;
        return (
            <>
                {data.type !== 'trigger' && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-border rounded-full border-2 border-surface z-10" />
                )}
                <BaseNode id={id} data={data} icon={Icon} title={data.title || 'Node'} selected={selected} />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-accent rounded-full border-2 border-surface z-10" />
            </>
        );
    }
};

// --- MAIN BUILDER COMPONENT ---

function BuilderContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createClient();

    const [flowId, setFlowId] = useState<string | null>(searchParams.get('id') || null);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [flowName, setFlowName] = useState("Untitled Flow");
    const [flowStatus, setFlowStatus] = useState('draft');
    const [triggerType, setTriggerType] = useState('keyword_dm');
    const [triggerConfig, setTriggerConfig] = useState({});
    const [saving, setSaving] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchFlow() {
            if (!flowId) {
                // Init empty state with Trigger node
                setNodes([
                    {
                        id: 'trigger-1',
                        type: 'customNode',
                        position: { x: 250, y: 100 },
                        data: { type: 'trigger', title: 'Start Flow', preview: 'Keyword in DM' },
                        deletable: false,
                    }
                ]);
                return;
            }

            const { data, error } = await supabase.from('flows').select('*').eq('id', flowId).single();
            if (error) {
                toast.error("Failed to load flow");
            } else if (data) {
                setFlowName(data.name || "Untitled Flow");
                setFlowStatus(data.status as any || 'draft');
                if (data.trigger_type) setTriggerType(data.trigger_type);
                if (data.trigger_config) setTriggerConfig(data.trigger_config);
                if (data.nodes) setNodes(data.nodes);
                if (data.edges) setEdges(data.edges);
            }
        }
        fetchFlow();
    }, [flowId, setNodes, setEdges, supabase]);

    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
            if (!reactFlowBounds) return;

            const titleMap: any = {
                'text_message': 'Text Message',
                'condition': 'Condition',
                'wait': 'Wait / Delay',
                'quick_replies': 'Quick Replies'
            };

            const position = {
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            };

            const newNode: Node = {
                id: uuidv4(),
                type: 'customNode',
                position,
                data: { type, title: titleMap[type] || 'New Node', preview: `Configure ${titleMap[type] || 'node'}...` },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [setNodes]
    );

    const saveFlow = async () => {
        try {
            setSaving(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { toast.error('Not logged in'); return }

            const { data: profile } = await supabase
                .from('profiles')
                .select('workspace_id')
                .eq('id', user.id)
                .single()

            if (!profile?.workspace_id) {
                toast.error('Workspace not found'); return
            }

            const flowData = {
                workspace_id: profile.workspace_id,
                name: flowName || 'Untitled Flow',
                status: flowStatus || 'draft',
                trigger_type: triggerType || 'keyword_dm',
                trigger_config: triggerConfig || {},
                nodes: nodes,
                edges: edges,
                updated_at: new Date().toISOString()
            }

            let result
            if (flowId) {
                result = await supabase
                    .from('flows')
                    .update(flowData)
                    .eq('id', flowId)
                    .select()
                    .single()
            } else {
                result = await supabase
                    .from('flows')
                    .insert(flowData)
                    .select()
                    .single()
            }

            const { data: savedFlow, error: saveError } = result
            if (saveError) {
                toast.error('Save failed: ' + saveError.message); return
            }

            if (!flowId && savedFlow?.id) {
                setFlowId(savedFlow.id)
                window.history.replaceState({}, '', `/flows/builder?id=${savedFlow.id}`)
            }

            toast.success('Flow saved successfully ✅')

        } catch (err) {
            toast.error('Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    const updateNodeData = (id: string, newData: any) => {
        setNodes(nds => nds.map(n => {
            if (n.id === id) {
                return { ...n, data: { ...n.data, ...newData } };
            }
            return n;
        }));
    };

    return (
        <div className="flex flex-col h-screen bg-bg text-text w-full fixed inset-0 z-50">
            {/* TOP BAR */}
            <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/flows')} className="p-2 hover:bg-surface2 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-text2" />
                    </button>
                    <div className="w-px h-6 bg-border"></div>
                    <input
                        value={flowName}
                        onChange={(e) => setFlowName(e.target.value)}
                        className="bg-transparent text-lg font-semibold focus:outline-none focus:border-b border-accent px-1 py-0.5"
                        placeholder="Name your flow..."
                    />
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${flowStatus === 'active' ? 'bg-green-500/10 text-green-500' :
                        flowStatus === 'paused' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-gray-500/10 text-text2'
                        }`}>
                        {flowStatus}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setFlowStatus(s => s === 'active' ? 'paused' : 'active')}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface2 transition-colors"
                    >
                        {flowStatus === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {flowStatus === 'active' ? 'Pause Flow' : 'Publish Flow'}
                    </button>
                    <button
                        onClick={saveFlow}
                        disabled={saving}
                        className="bg-accent hover:bg-accent/90 text-text px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-accent/20 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT PANEL */}
                <aside className="w-[260px] bg-surface border-r border-border flex flex-col overflow-y-auto shrink-0 z-10">
                    <div className="p-4 border-b border-border">
                        <h2 className="text-sm font-semibold text-text2 uppercase tracking-wider mb-4">Triggers</h2>
                        <div className="space-y-2">
                            <div className="p-3 bg-surface2 rounded-xl flex items-center gap-3 cursor-pointer hover:border-accent border border-transparent transition-colors">
                                <MessageCircle className="w-5 h-5 text-accent" />
                                <span className="text-sm font-medium">Keyword in DM</span>
                            </div>
                            <div className="p-3 bg-surface2 rounded-xl flex items-center gap-3 cursor-pointer hover:border-accent2 border border-transparent transition-colors">
                                <ImageIcon className="w-5 h-5 text-accent2" />
                                <span className="text-sm font-medium">Story Mention</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-b border-border">
                        <h2 className="text-sm font-semibold text-text2 uppercase tracking-wider mb-4">Messages</h2>
                        <div className="grid grid-cols-2 gap-2">
                            <div draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'text_message')} className="p-3 bg-surface2 rounded-xl flex flex-col items-center gap-2 cursor-grab hover:border-accent border border-transparent transition-colors text-center group">
                                <MessageCircle className="w-6 h-6 text-text2 group-hover:text-accent transition-colors" />
                                <span className="text-xs font-medium">Text</span>
                            </div>
                            <div draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'quick_replies')} className="p-3 bg-surface2 rounded-xl flex flex-col items-center gap-2 cursor-grab hover:border-accent border border-transparent transition-colors text-center group">
                                <Layers className="w-6 h-6 text-text2 group-hover:text-accent transition-colors" />
                                <span className="text-xs font-medium">Quick Reply</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-b border-border">
                        <h2 className="text-sm font-semibold text-text2 uppercase tracking-wider mb-4">Actions</h2>
                        <div className="space-y-2">
                            <div draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'wait')} className="p-3 bg-surface2 rounded-xl flex items-center gap-3 cursor-grab hover:border-accent3 border border-transparent transition-colors">
                                <Clock className="w-5 h-5 text-text2" />
                                <span className="text-sm font-medium">Wait / Delay</span>
                            </div>
                            <div draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'condition')} className="p-3 bg-surface2 rounded-xl flex items-center gap-3 cursor-grab hover:border-accent3 border border-transparent transition-colors">
                                <GitBranch className="w-5 h-5 text-text2" />
                                <span className="text-sm font-medium">Condition</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* CENTER CANVAS */}
                <div className="flex-1 relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={() => { }}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        defaultEdgeOptions={{ type: 'smoothstep', style: { stroke: '#6c63ff', strokeWidth: 2 } }}
                        onNodeClick={(e, node) => setSelectedNodeId(node.id)}
                        onPaneClick={() => setSelectedNodeId(null)}
                        fitView
                        className="bg-bg"
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background color="#2a2a40" gap={16} size={2} />
                        <Controls className="fill-text bg-surface border-border" />
                    </ReactFlow>
                </div>

                {/* RIGHT PANEL */}
                {selectedNode && (
                    <aside className="w-[300px] bg-surface border-l border-border flex flex-col overflow-y-auto shrink-0 z-10 animate-in slide-in-from-right-2 duration-200">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h2 className="font-semibold">{selectedNode.data.title as string} Settings</h2>
                            <button className="p-1 hover:bg-surface2 rounded-lg text-text2" onClick={() => setSelectedNodeId(null)}>
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                            </button>
                        </div>

                        <div className="p-4 flex-1">
                            {selectedNode.data.type === 'trigger' && (
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-text2">Keywords</label>
                                    <input type="text" placeholder="e.g. GROW, START" className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none" />
                                    <p className="text-xs text-text2">Comma separated. Case insensitive.</p>
                                </div>
                            )}

                            {selectedNode.data.type === 'text_message' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-text2">Message content</label>
                                        <div className="flex gap-1">
                                            <button className="text-xs px-2 py-1 bg-surface2 rounded hover:bg-border transition-colors">{'{{first_name}}'}</button>
                                        </div>
                                    </div>
                                    <textarea
                                        rows={6}
                                        value={(selectedNode.data.preview as string) === 'Configure Text Message...' ? '' : selectedNode.data.preview as string}
                                        onChange={(e) => updateNodeData(selectedNode.id, { preview: e.target.value })}
                                        placeholder="Type your message here..."
                                        className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none resize-none"
                                    />
                                    <div className="text-right text-xs text-text2">{(selectedNode.data.preview as string)?.length || 0} / 1000</div>
                                </div>
                            )}

                            {selectedNode.data.type === 'wait' && (
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-text2">Delay Duration</label>
                                    <div className="flex gap-2">
                                        <input type="number" defaultValue="1" className="w-20 bg-surface2 border border-border rounded-xl px-3 py-2 text-sm focus:border-accent outline-none text-center" />
                                        <select className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2 text-sm focus:border-accent outline-none">
                                            <option>Minutes</option>
                                            <option>Hours</option>
                                            <option>Days</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {selectedNode.data.type === 'condition' && (
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-text2">Condition Rule</label>
                                    <select className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm focus:border-accent outline-none mb-3">
                                        <option>Message contains</option>
                                        <option>Tag is set</option>
                                        <option>Custom field equals</option>
                                    </select>
                                    <input type="text" placeholder="Value..." className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none" />
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-border">
                            <button
                                onClick={() => setNodes(nds => nds.filter(n => n.id !== selectedNode.id))}
                                className="w-full py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                            >
                                Delete {selectedNode.data.title as string}
                            </button>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}

// Wrapper for Suspense when using searchParams
export default function FlowBuilderPage() {
    return (
        <ReactFlowProvider>
            <Suspense fallback={<div className="h-screen flex items-center justify-center bg-bg"><div className="w-8 h-8 rounded-full border-4 border-accent border-r-transparent animate-spin"></div></div>}>
                <BuilderContent />
            </Suspense>
        </ReactFlowProvider>
    );
}
