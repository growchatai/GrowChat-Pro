"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    GitBranch,
    Inbox,
    BarChart3,
    Zap,
    Settings,
    MessageCircle,
    LogOut,
    User,
    ChevronDown,
    Plus,
    Check,
    AlertCircle,
    Building,
    LineChart
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlanLimits } from "@/hooks/usePlanLimits";

const baseNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Flows", href: "/flows", icon: GitBranch },
    { name: "Inbox", href: "/inbox", icon: Inbox },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Automations", href: "/automations", icon: Zap },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [activeAccount, setActiveAccount] = useState<any | null>(null);
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

    const { limits, loading: limitsLoading } = usePlanLimits();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email ?? null);
                setUserName(user.user_metadata?.full_name || null);

                // Fetch workspace & Instagram accounts
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('workspace_id')
                    .eq('id', user.id)
                    .single();

                if (profile?.workspace_id) {
                    const { data: igAccounts } = await supabase
                        .from('instagram_accounts')
                        .select('*')
                        .eq('workspace_id', profile.workspace_id)
                        .eq('is_active', true);

                    if (igAccounts && igAccounts.length > 0) {
                        setAccounts(igAccounts);
                        const savedAccountId = localStorage.getItem('growchat_active_account');
                        const active = igAccounts.find(a => a.id === savedAccountId) || igAccounts[0];
                        setActiveAccount(active);
                    }
                }
            }
        }
        loadData();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const handleSelectAccount = (acc: any) => {
        setActiveAccount(acc);
        localStorage.setItem('growchat_active_account', acc.id);
        setIsSwitcherOpen(false);
    };

    const displayName = userName || userEmail || "User";

    // Dynamic Navigation
    const navItems = [...baseNavItems];
    if (limits?.isAgency) {
        // Insert Agency items before Settings
        navItems.splice(-1, 0,
            { name: "Client Workspaces", href: "/clients", icon: Building },
            { name: "Agency Analytics", href: "/agency-analytics", icon: LineChart }
        );
    }

    return (
        <div className="w-64 border-r border-border bg-surface h-screen flex flex-col fixed left-0 top-0 z-50">
            <div className="p-4 flex flex-col gap-6">
                <div className="flex items-center gap-2 group cursor-pointer px-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                        <MessageCircle className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent2">GrowChat</span>
                </div>

                {/* Account Switcher */}
                <div className="relative">
                    <button
                        onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                        className="w-full flex items-center justify-between p-2 rounded-xl border border-border bg-surface2 hover:bg-surface2/80 transition-all text-left"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            {activeAccount ? (
                                <>
                                    <img src={activeAccount.profile_pic_url || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"} alt="IG Avatar" className="w-8 h-8 rounded-full border border-border shrink-0 object-cover" />
                                    <div className="truncate">
                                        <p className="text-sm font-medium text-text truncate">@{activeAccount.username}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4 text-text2" />
                                    </div>
                                    <p className="text-sm font-medium text-text2">No Account Active</p>
                                </>
                            )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-text2 shrink-0 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSwitcherOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-surface2 border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                            {accounts.map(acc => (
                                <button
                                    key={acc.id}
                                    onClick={() => handleSelectAccount(acc)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-surface3 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <img src={acc.profile_pic_url || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"} alt="IG Avatar" className="w-8 h-8 rounded-full border border-border shrink-0 object-cover" />
                                        <div className="truncate">
                                            <p className="text-sm font-medium text-text truncate">@{acc.username}</p>
                                            <p className="text-xs text-text2">{Intl.NumberFormat('en-US', { notation: "compact" }).format(acc.followers_count || 0)} followers</p>
                                        </div>
                                    </div>
                                    {activeAccount?.id === acc.id && (
                                        <Check className="w-4 h-4 text-accent shrink-0" />
                                    )}
                                </button>
                            ))}

                            <div className="p-3 border-t border-border bg-surface/50">
                                {limits && !limits.canAddInstagram ? (
                                    <div className="text-xs text-orange-400 flex items-center gap-1.5 p-2 bg-orange-500/10 rounded-lg">
                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                        <span>Upgrade to add more accounts</span>
                                    </div>
                                ) : (
                                    <Link href="/settings" className="flex items-center gap-2 text-sm text-accent font-medium hover:text-accent2 p-2 rounded-lg hover:bg-accent/10 transition-colors w-full">
                                        <Plus className="w-4 h-4" />
                                        Connect Account
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Navigation */}
                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;
                        const isFlows = item.name === "Flows";
                        const showFlowWarning = isFlows && limits && !limits.canAddFlow;

                        return (
                            <div key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium ${isActive
                                        ? "bg-accent/10 text-accent"
                                        : "text-text2 hover:text-text hover:bg-surface2"
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? "text-accent" : "text-text2"}`} />
                                    {item.name}
                                </Link>
                                {showFlowWarning && (
                                    <div className="ml-11 mt-1 text-[11px] text-orange-400 font-medium flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Flow limit reached - Upgrade
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-border flex flex-col gap-3">
                {/* Plan Badge */}
                {!limitsLoading && limits && (
                    <div className={`p-3 rounded-xl border flex flex-col gap-2 ${limits.isAgency ? 'bg-purple-500/10 border-purple-500/20' :
                            limits.plan === 'pro' ? 'bg-blue-500/10 border-blue-500/20' :
                                'bg-surface2 border-border'
                        }`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider font-bold text-text2">Current Plan</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${limits.isAgency ? 'bg-purple-500 text-white' :
                                    limits.plan === 'pro' ? 'bg-blue-500 text-white' :
                                        'bg-surface3 text-text2'
                                }`}>
                                {limits.plan === 'agency' ? 'Agency' : limits.plan === 'pro' ? 'Pro' : 'Starter'}
                            </span>
                        </div>

                        {limits.plan === 'starter' && (
                            <button className="w-full py-1.5 mt-1 text-xs font-bold text-surface bg-text rounded-lg hover:opacity-90 transition-opacity">
                                Upgrade
                            </button>
                        )}
                        {limits.plan === 'pro' && (
                            <button className="w-full py-1.5 mt-1 text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg hover:opacity-90 transition-opacity">
                                Upgrade to Agency
                            </button>
                        )}
                        {limits.isAgency && (
                            <div className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-1 text-xs font-bold text-purple-400 bg-purple-500/10 rounded-lg">
                                <Check className="w-3 h-3" />
                                ✓ Agency Plan
                            </div>
                        )}
                    </div>
                )}

                {/* User Profile */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface2/50 border border-border/50">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{displayName}</p>
                        {userName && userEmail && <p className="text-xs text-text2 truncate">{userEmail}</p>}
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-xl text-text2 hover:text-red-400 hover:bg-red-500/10 transition-all font-medium border border-transparent hover:border-red-500/20"
                >
                    <LogOut className="w-4 h-4" />
                    Log out
                </button>
            </div>
        </div>
    );
}
