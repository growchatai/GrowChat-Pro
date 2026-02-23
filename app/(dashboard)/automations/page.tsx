import { Hammer } from "lucide-react";

export default function AutomationsPlaceholder() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-surface2 border border-border flex items-center justify-center mb-8">
                <Hammer className="w-10 h-10 text-text2" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Automations Module</h2>
            <p className="text-text2">Coming soon.</p>
        </div>
    );
}
