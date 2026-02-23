import { createClient } from "@/lib/supabase/server";
import { Users, Send, GitBranch, Instagram, ArrowUpRight, Plus } from "lucide-react";

export default async function DashboardHomePage() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Fetch real data from Supabase
    const [
        { data: profile },
        { data: workspace },
        { count: subscribersCount },
        { count: activeFlowsCount },
        { count: igAccountsCount }
    ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('workspaces').select('*').limit(1).maybeSingle(),
        supabase.from('subscribers').select('*', { count: 'exact', head: true }),
        supabase.from('flows').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('instagram_accounts').select('*', { count: 'exact', head: true })
    ]);

    const fullName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
    const planName = workspace?.plan_id || workspace?.plan_level || workspace?.plan || "Starter";
    const messagesSent = workspace?.messages_used_this_month || 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Welcome back, {fullName}!</h1>
                    <p className="text-text2">Here is what is happening with your automation flows today.</p>
                </div>
                <div className="hidden sm:flex items-center gap-3 bg-surface p-1.5 rounded-full border border-border">
                    <span className="px-3 py-1 text-sm font-medium text-text2">Plan</span>
                    <span className="px-4 py-1 text-sm font-bold bg-accent rounded-full text-text capitalize shadow-lg shadow-accent/20">
                        {planName}
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-surface p-6 rounded-2xl border border-border flex flex-col hover:border-accent/50 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-text2 font-medium">Total Subscribers</h3>
                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                            <Users className="w-5 h-5 text-accent" />
                        </div>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold">{subscribersCount || 0}</span>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-border flex flex-col hover:border-accent2/50 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-text2 font-medium">Messages Sent</h3>
                        <div className="w-10 h-10 rounded-xl bg-accent2/20 flex items-center justify-center group-hover:bg-accent2/30 transition-colors">
                            <Send className="w-5 h-5 text-accent2" />
                        </div>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold">{messagesSent}</span>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-border flex flex-col hover:border-accent3/50 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-text2 font-medium">Active Flows</h3>
                        <div className="w-10 h-10 rounded-xl bg-accent3/20 flex items-center justify-center group-hover:bg-accent3/30 transition-colors">
                            <GitBranch className="w-5 h-5 text-accent3" />
                        </div>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold">{activeFlowsCount || 0}</span>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-border flex flex-col hover:border-accent/50 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-text2 font-medium">Instagram Accounts</h3>
                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                            <Instagram className="w-5 h-5 text-accent" />
                        </div>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold">{igAccountsCount || 0}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Placeholder */}
                <div className="lg:col-span-2 bg-surface rounded-2xl border border-border overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Recent Activity</h2>
                        <button className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">
                            View all
                        </button>
                    </div>
                    <div className="p-8 text-center flex flex-col items-center justify-center h-64 text-text2">
                        <GitBranch className="w-12 h-12 mb-4 opacity-50" />
                        <p>No recent activity data available.</p>
                        <p className="text-sm mt-1">Connect your Instagram account to start building flows.</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-surface rounded-2xl border border-border p-6 flex flex-col h-fit">
                    <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
                    <div className="space-y-4">
                        <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-surface2 hover:border-accent hover:bg-accent/5 transition-all group">
                            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors shrink-0">
                                <Plus className="w-5 h-5 text-accent" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-text text-sm">Create New Flow</p>
                                <p className="text-xs text-text2 mt-0.5">Start building a new automation</p>
                            </div>
                        </button>

                        <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-surface2 hover:border-accent2 hover:bg-accent2/5 transition-all group">
                            <div className="w-10 h-10 rounded-lg bg-accent2/20 flex items-center justify-center group-hover:bg-accent2/30 transition-colors shrink-0">
                                <Send className="w-5 h-5 text-accent2" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-text text-sm">Send Broadcast</p>
                                <p className="text-xs text-text2 mt-0.5">Message your subscribers</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
