"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import {
    Instagram,
    Users,
    CreditCard,
    Check,
    X,
    Plus,
    MoreVertical,
    Building2,
    Zap
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("instagram");
    const { limits, loading: limitsLoading } = usePlanLimits();
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("member");
    const [loadingTeam, setLoadingTeam] = useState(false);

    // We fetch user info to know if they are the owner
    const [currentUserInfo, setCurrentUserInfo] = useState<any>(null);
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        async function fetchTeamData() {
            setLoadingTeam(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUserInfo(user);

            const { data: profile } = await supabase
                .from('profiles')
                .select('workspace_id')
                .eq('id', user.id)
                .single();

            if (profile?.workspace_id) {
                setWorkspaceId(profile.workspace_id);
                // Fetch members
                const { data: members, error } = await supabase
                    .from('team_members')
                    .select('*')
                    .eq('workspace_id', profile.workspace_id)
                    .order('created_at', { ascending: true });

                if (members) setTeamMembers(members);
            }
            setLoadingTeam(false);
        }

        if (activeTab === "team") {
            fetchTeamData();
        }
    }, [activeTab, supabase]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspaceId) return;

        try {
            const { error } = await supabase
                .from('invitations')
                .insert({
                    workspace_id: workspaceId,
                    email: inviteEmail,
                    role: inviteRole,
                    invited_by: currentUserInfo.id,
                });

            if (error) throw error;

            toast.success(`Invitation sent to ${inviteEmail}`);
            setIsInviteModalOpen(false);
            setInviteEmail("");
        } catch (error: any) {
            toast.error("Failed to send invitation: " + error.message);
        }
    };

    const UsageBar = ({ label, current, max }: { label: string, current: number, max: number }) => {
        const percentage = Math.min((current / max) * 100, 100);
        return (
            <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-text2">{label}</span>
                    <span className="text-sm font-bold text-text">{current} / {max}</span>
                </div>
                <div className="w-full h-3 bg-surface3 rounded-full overflow-hidden flex">
                    <div
                        className="h-full bg-accent transition-all duration-1000 ease-out rounded-full"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="p-10 max-w-5xl mx-auto h-full flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border mb-8">
                <button
                    onClick={() => setActiveTab('instagram')}
                    className={`pb-4 px-4 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'instagram' ? 'border-accent text-text' : 'border-transparent text-text2 hover:text-text'}`}
                >
                    <Instagram className="w-4 h-4" /> Instagram Accounts
                </button>
                <button
                    onClick={() => setActiveTab('team')}
                    className={`pb-4 px-4 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'team' ? 'border-accent text-text' : 'border-transparent text-text2 hover:text-text'}`}
                >
                    <Users className="w-4 h-4" /> Team Members
                </button>
                <button
                    onClick={() => setActiveTab('billing')}
                    className={`pb-4 px-4 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'billing' ? 'border-accent text-text' : 'border-transparent text-text2 hover:text-text'}`}
                >
                    <CreditCard className="w-4 h-4" /> Billing & Plan
                </button>
            </div>

            {/* Content areas */}
            {activeTab === 'instagram' && (
                <InstagramTab supabase={supabase} workspaceId={workspaceId} />
            )}

            {activeTab === 'team' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold mb-1">Workspace Team</h2>
                            <p className="text-sm text-text2">Manage who has access to your workspace automations.</p>
                        </div>
                        {limits?.canAddTeamMember ? (
                            <button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="px-5 py-2.5 bg-accent hover:bg-accent2 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Invite Team Member
                            </button>
                        ) : (
                            <button className="px-5 py-2.5 bg-surface3 text-text2 cursor-not-allowed font-medium rounded-xl transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Upgrade plan to add more members
                            </button>
                        )}
                    </div>

                    <div className="border border-border rounded-2xl overflow-hidden bg-surface">
                        {loadingTeam ? (
                            <div className="p-10 text-center text-text2">Loading team members...</div>
                        ) : teamMembers.length === 0 ? (
                            <div className="p-10 text-center text-text2">No team members found.</div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface2 border-b border-border">
                                        <th className="p-4 font-medium text-sm text-text2">Member</th>
                                        <th className="p-4 font-medium text-sm text-text2">Role</th>
                                        <th className="p-4 font-medium text-sm text-text2">Status</th>
                                        <th className="p-4 font-medium text-sm text-text2 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamMembers.map(member => (
                                        <tr key={member.id} className="border-b border-border last:border-0 hover:bg-surface2/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                                                        {(member.full_name || member.email).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-text">{member.full_name || 'Pending User'}</div>
                                                        <div className="text-xs text-text2">{member.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 bg-surface3 text-text text-xs rounded-full font-medium capitalize">
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 text-xs rounded-full font-medium capitalize ${member.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'
                                                    }`}>
                                                    {member.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {member.role !== 'owner' && (
                                                    <button className="p-2 text-text2 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'billing' && limits && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-accent" /> Plan Usage
                            </h2>
                            <div className="p-6 border border-border rounded-2xl bg-surface">
                                <UsageBar label="Instagram Accounts" current={limits.currentInstagramAccounts} max={limits.maxInstagramAccounts} />
                                <UsageBar label="Team Members" current={limits.currentTeamMembers} max={limits.maxTeamMembers} />
                                <UsageBar label="Subscribers" current={limits.currentSubscribers} max={limits.maxSubscribers} />
                                <UsageBar label="Active Flows" current={limits.currentFlows} max={limits.maxFlows} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold mb-6">Current Plan</h2>
                        <div className={`p-6 border rounded-2xl relative overflow-hidden ${limits.plan === 'agency' ? 'border-purple-500/50 bg-purple-500/5' :
                            limits.plan === 'pro' ? 'border-blue-500/50 bg-blue-500/5' :
                                'border-border bg-surface'
                            }`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                {limits.plan === 'agency' ? <Building2 className="w-24 h-24" /> : <Zap className="w-24 h-24" />}
                            </div>

                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${limits.plan === 'agency' ? 'bg-purple-500 text-white' :
                                limits.plan === 'pro' ? 'bg-blue-500 text-white' :
                                    'bg-surface3 text-text2'
                                }`}>
                                {limits.plan === 'agency' ? 'Agency Plan' : limits.plan === 'pro' ? 'Pro Plan' : 'Starter Plan'}
                            </span>

                            <h3 className="text-3xl font-bold mb-2">
                                {limits.plan === 'agency' ? '$199' : limits.plan === 'pro' ? '$79' : 'Free'}
                                <span className="text-base font-normal text-text2">/mo</span>
                            </h3>
                            <p className="text-sm text-text2 mb-6">
                                {limits.plan === 'agency' ? 'Ultimate multi-account agency management with huge limits.' :
                                    limits.plan === 'pro' ? 'Advanced automation features for growing brands.' :
                                        'Basic automation tools for personal use.'}
                            </p>

                            {limits.plan === 'starter' && (
                                <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20">
                                    Upgrade to Pro $79/mo
                                </button>
                            )}
                            {limits.plan === 'pro' && (
                                <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20">
                                    Upgrade to Agency $199/mo
                                </button>
                            )}
                            {limits.plan === 'agency' && (
                                <div className="w-full py-3 bg-purple-500/10 text-purple-400 font-bold rounded-xl text-center flex items-center justify-center gap-2 border border-purple-500/20">
                                    <Check className="w-5 h-5" /> You're on the best plan 🎉
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden slide-in-from-bottom-4 animate-in duration-300">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h3 className="text-lg font-bold">Invite to Workspace</h3>
                            <button onClick={() => setIsInviteModalOpen(false)} className="text-text2 hover:text-text">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleInvite} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text2 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 focus:border-accent outline-none transition-colors"
                                    placeholder="colleague@agency.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text2 mb-1.5">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface2 focus:border-accent outline-none transition-colors appearance-none"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="member">Member</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-2.5 mt-2 bg-accent hover:bg-accent2 text-white font-medium rounded-xl transition-colors">
                                Send Invitation
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Instagram Tab Component ───────────────────────────────────────
function InstagramTab({ supabase, workspaceId }: { supabase: any; workspaceId: string | null }) {
    const searchParams = useSearchParams();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);

    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('instagram_accounts')
            .select('*')
            .order('created_at', { ascending: false });
        setAccounts(data || []);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    // Handle success/error from OAuth callback
    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const username = searchParams.get('username');

        if (success === 'connected' && username) {
            toast.success(`Instagram account @${username} connected successfully! 🎉`);
            fetchAccounts();
        } else if (error) {
            toast.error(`Instagram connection failed: ${error}`);
        }
    }, [searchParams, fetchAccounts]);

    const handleConnect = () => {
        setConnecting(true);
        window.location.href = '/api/instagram/connect';
    };

    const handleDisconnect = async (accountId: string) => {
        if (!confirm('Are you sure you want to disconnect this account?')) return;
        const { error } = await supabase
            .from('instagram_accounts')
            .delete()
            .eq('id', accountId);
        if (error) {
            toast.error('Failed to disconnect account');
        } else {
            toast.success('Account disconnected');
            fetchAccounts();
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-2xl bg-surface2/50 h-64">
                <p className="text-text2">Loading Instagram accounts...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Connected accounts */}
            {accounts.length > 0 && (
                <div className="border border-border rounded-2xl overflow-hidden bg-surface">
                    <div className="p-4 bg-surface2 border-b border-border">
                        <h3 className="font-semibold text-text">Connected Accounts</h3>
                    </div>
                    {accounts.map((account) => (
                        <div key={account.id} className="p-4 flex items-center justify-between border-b border-border last:border-0 hover:bg-surface2/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
                                    {account.username?.charAt(0)?.toUpperCase() || 'I'}
                                </div>
                                <div>
                                    <div className="font-semibold text-text">@{account.username}</div>
                                    <div className="text-sm text-text2">{account.full_name || account.account_type}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`w-2 h-2 rounded-full ${account.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="text-xs text-text2">{account.is_active ? 'Active' : 'Inactive'}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDisconnect(account.id)}
                                className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Connect new account */}
            <div className="flex-1 flex flex-col pt-10 items-center justify-center border border-dashed border-border rounded-2xl bg-surface2/50 shrink-0 h-64">
                <Instagram className="w-12 h-12 text-text2 mb-4" />
                <h2 className="text-xl font-bold mb-2">
                    {accounts.length > 0 ? 'Add Another Account' : 'Instagram Connections'}
                </h2>
                <p className="text-text2 mb-6">Connect your professional Instagram pages.</p>
                <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="px-6 py-2.5 bg-accent hover:bg-accent2 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {connecting ? (
                        <span>Connecting...</span>
                    ) : (
                        <><Instagram className="w-4 h-4" /> Connect Instagram Account</>
                    )}
                </button>
            </div>
        </div>
    );
}
