"use client";

import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";

function getPageTitle(pathname: string) {
    const path = pathname.split("/")[1];
    if (!path) return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
}

export function Topbar() {
    const pathname = usePathname();
    const title = getPageTitle(pathname);

    return (
        <header className="h-20 border-b border-border bg-bg flex items-center justify-between px-8 sticky top-0 z-10 w-full">
            <h1 className="text-2xl font-bold">{title}</h1>

            <div className="flex items-center gap-6">
                <div className="relative relative hidden md:block w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text2" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-surface border border-border rounded-full pl-10 pr-4 py-2 text-sm text-text placeholder-text2/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    />
                </div>

                <button className="relative p-2 text-text2 hover:text-text hover:bg-surface2 rounded-full transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent2 rounded-full border-2 border-bg"></span>
                </button>

                <div className="w-10 h-10 rounded-full bg-surface2 border border-border overflow-hidden">
                    <img
                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=transparent`}
                        alt="User avatar"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </header>
    );
}
