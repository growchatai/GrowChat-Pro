import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-bg flex">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <Topbar />
                <main className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
