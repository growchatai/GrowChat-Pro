import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, GitBranch, MoreVertical, Play, Pause, Edit, Copy, Trash2, MailOpen } from "lucide-react";
import { redirect } from "next/navigation";

export default async function FlowsListPage({ searchParams }: { searchParams: { filter?: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .limit(1)
        .single();

    const workspaceId = workspace?.id;
    const filter = searchParams.filter || 'all';

    let query = supabase
        .from("flows")
        .select("*")
        .order("created_at", { ascending: false });

    if (workspaceId) {
        query = query.eq("workspace_id", workspaceId);
    }

    if (filter !== 'all') {
        query = query.eq("status", filter);
    }

    const { data: flows, error } = await query;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Automation Flows</h1>
                <Link
                    href="/flows/builder"
                    className="bg-accent hover:bg-accent/90 text-text px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create New Flow
                </Link>
            </div>

            <div className="flex items-center gap-2 border-b border-border mb-6 pb-px">
                {['All', 'Active', 'Draft', 'Paused'].map((tab) => {
                    const tabValue = tab.toLowerCase();
                    const isActive = filter === tabValue;
                    return (
                        <Link
                            key={tabValue}
                            href={`/flows?filter=${tabValue}`}
                            className={`px-4 py-3 -mb-px text-sm font-medium transition-colors border-b-2 ${isActive ? "border-accent text-text" : "border-transparent text-text2 hover:text-text"
                                }`}
                        >
                            {tab}
                        </Link>
                    );
                })}
            </div>

            {!flows || flows.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-surface rounded-2xl border border-border border-dashed">
                    <div className="w-20 h-20 rounded-2xl bg-surface2 border border-border flex items-center justify-center mb-6">
                        <GitBranch className="w-10 h-10 text-text2" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">No flows found</h2>
                    <p className="text-text2 max-w-sm mb-8">
                        {filter === 'all'
                            ? "You haven't created any automation flows yet. Build your first flow to start engaging your audience."
                            : `You don't have any ${filter} flows at the moment.`}
                    </p>
                    {filter === 'all' && (
                        <Link
                            href="/flows/builder"
                            className="bg-accent hover:bg-accent/90 text-text px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create your first flow
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flows.map((flow) => (
                        <div key={flow.id} className="bg-surface rounded-2xl border border-border overflow-hidden hover:border-accent/30 transition-colors group flex flex-col">
                            <div className="p-6 border-b border-border/50">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${flow.status === 'active' ? 'bg-green-500/10 text-green-500' :
                                            flow.status === 'paused' ? 'bg-yellow-500/10 text-yellow-500' :
                                                'bg-gray-500/10 text-text2'
                                        }`}>
                                        {flow.status === 'active' && <Play className="w-3 h-3 fill-current" />}
                                        {flow.status === 'paused' && <Pause className="w-3 h-3 fill-current" />}
                                        {flow.status === 'draft' && <Edit className="w-3 h-3" />}
                                        <span className="capitalize">{flow.status}</span>
                                    </div>
                                    <button className="text-text2 hover:text-text p-1 transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                                <h3 className="text-lg font-semibold mb-1 truncate" title={flow.name}>{flow.name || "Untitled Flow"}</h3>
                                <p className="text-text2 text-sm flex items-center gap-1.5 truncate">
                                    <span className="w-2 h-2 rounded-full bg-accent3"></span>
                                    Trigger: {flow.trigger_type || "None"}
                                </p>
                            </div>
                            <div className="p-4 bg-surface2/30 grid grid-cols-2 gap-4 border-b border-border/50">
                                <div>
                                    <p className="text-text2 text-xs mb-1 uppercase font-semibold tracking-wider">Sent</p>
                                    <p className="font-medium">1,234</p>
                                </div>
                                <div>
                                    <p className="text-text2 text-xs mb-1 flex items-center gap-1 uppercase font-semibold tracking-wider">
                                        <MailOpen className="w-3 h-3" />
                                        Open Rate
                                    </p>
                                    <p className="font-medium text-accent">68.5%</p>
                                </div>
                            </div>
                            <div className="p-4 flex items-center gap-2 mt-auto">
                                <Link
                                    href={`/flows/builder?id=${flow.id}`}
                                    className="flex-1 bg-surface2 hover:bg-surface border border-border text-center py-2.5 rounded-xl text-sm font-medium transition-colors"
                                >
                                    Edit Flow
                                </Link>
                                <button className="p-2.5 border border-border rounded-xl text-text2 hover:text-text hover:bg-surface2 transition-colors">
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button className="p-2.5 border border-border rounded-xl text-text2 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
