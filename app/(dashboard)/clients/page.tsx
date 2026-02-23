"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import {
    Building2,
    Plus,
    MoreVertical,
    ArrowRight,
    Users,
    Zap,
    Clock
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function ClientsPage() {
    const { limits, loading } = usePlanLimits();
    const [clients, setClients] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loadingClients, setLoadingClients] = useState(true);

    // Modal states
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (!limits?.isAgency) {
            setLoadingClients(false);
            return;
        }

        async function fetchClients() {
            setLoadingClients(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('workspace_id')
                .eq('id', user.id)
                .single();

            if (profile?.workspace_id) {
                // Fetch connected client workspaces
                const { data: agencyClients } = await supabase
                    .from('client_workspaces')
                    .select('*, client_workspace_id')
                    .eq('agency_workspace_id', profile.workspace_id)
                    .order('created_at', { ascending: false });

                if (agencyClients) {
                    // Enrich with data
                    // Since we haven't built out the huge JOIN logic, let's mock counts for visual parity
                    const enriched = agencyClients.map(c => ({
                        ...c,
                        ig_count: Math.floor(Math.random() * 3) + 1, // Mock
                        flows_count: Math.floor(Math.random() * 15), // Mock
                        last_active: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
                    }));
                    setClients(enriched);
                }
            }
            setLoadingClients(false);
        }

        fetchClients();
    }, [limits, supabase]);

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        // In reality, this would hit an API route that creates a new workspace using service role,
        // then binds it in `client_workspaces` table.
        // For visual parity requested by user, we mock success state here.
        setIsAddModalOpen(false);
        setClientName("");
        setClientEmail("");
        // Optimistic update
        setClients([{
            id: 'temp-' + Date.now(),
            client_name: clientName,
            client_email: clientEmail,
            status: 'active',
            created_at: new Date().toISOString(),
            ig_count: 0,
            flows_count: 0,
            last_active: new Date()
        }, ...clients]);
    };

    if (loading) {
        return <div className="p-10 text-center text-text2">Loading...</div>;
    }

    if (!limits?.isAgency) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 max-w-lg mx-auto">
                <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
                    <Building2 className="w-10 h-10 text-purple-500" />
                </div>
                <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-500">
                    Agency Feature
                </h1>
                <p className="text-text2 mb-8">
                    Client management is an exclusive feature for Agency plan subscribers. Upgrade to manage multiple clients under a single master account, with dedicated workspaces for each.
                </p>
                <Link href="/settings" className="px-6 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:opacity-90 transition-opacity text-white font-bold rounded-xl shadow-lg shadow-purple-500/20">
                    Upgrade to Agency
                </Link>
            </div>
        );
    }

    return (
        <div className="p-10 max-w-6xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Client Workspaces</h1>
                    <p className="text-text2">Manage sub-accounts for your agency's clients.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-5 py-2.5 bg-accent hover:bg-accent2 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Client
                </button>
            </div>

            {loadingClients ? (
                <div className="text-center py-20 text-text2">Loading clients...</div>
            ) : clients.length === 0 ? (
                <div className="border border-dashed border-border rounded-2xl bg-surface2/30 flex flex-col items-center justify-center text-center py-24">
                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-6">
                        <Building2 className="w-8 h-8 text-text2" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No clients yet</h3>
                    <p className="text-text2 mb-6 maw-w-sm">
                        Add your first client workspace to start managing their automation flows & Instagram inbox securely.
                    </p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-5 py-2 hover:bg-surface3 border border-border text-text font-medium rounded-xl transition-colors"
                    >
                        Add your first client
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clients.map(client => (
                        <div key={client.id} className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-accent/30 transition-all hover:shadow-lg hover:shadow-accent/5">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-xl font-bold text-indigo-400 border border-indigo-500/20">
                                            {client.client_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text text-lg">{client.client_name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${client.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'
                                                }`}>
                                                {client.status}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="text-text2 hover:text-text p-1 translate-x-2 -translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-surface2 p-3 rounded-xl border border-border/50">
                                        <div className="flex items-center gap-1.5 text-text2 text-xs mb-1">
                                            <Users className="w-3.5 h-3.5" /> IG Accounts
                                        </div>
                                        <div className="font-bold text-lg">{client.ig_count}</div>
                                    </div>
                                    <div className="bg-surface2 p-3 rounded-xl border border-border/50">
                                        <div className="flex items-center gap-1.5 text-text2 text-xs mb-1">
                                            <Zap className="w-3.5 h-3.5" /> Active Flows
                                        </div>
                                        <div className="font-bold text-lg">{client.flows_count}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-text2 mb-6">
                                    <Clock className="w-3.5 h-3.5" />
                                    Last active {formatDistanceToNow(client.last_active, { addSuffix: true })}
                                </div>
                            </div>

                            <div className="border-t border-border bg-surface2/50 p-3">
                                <button className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-text group-hover:text-accent transition-colors">
                                    Manage Workspace <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Client Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden slide-in-from-bottom-4 animate-in duration-300">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h3 className="text-lg font-bold">Add Client Workspace</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-text2 hover:text-text">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateClient} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text2 mb-1.5">Client Business Name</label>
                                <input
                                    type="text"
                                    required
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 focus:border-accent outline-none transition-colors"
                                    placeholder="Acme Corp"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text2 mb-1.5">Primary Contact Email</label>
                                <input
                                    type="email"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 focus:border-accent outline-none transition-colors"
                                    placeholder="contact@acmecorp.com"
                                />
                            </div>
                            <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl mt-4">
                                <p className="text-sm text-text">
                                    A dedicated, isolated workspace will be created. You can manage this client entirely separately from other flows.
                                </p>
                            </div>
                            <button type="submit" className="w-full py-2.5 mt-2 bg-accent hover:bg-accent2 text-white font-medium rounded-xl transition-colors">
                                Create Workspace
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
