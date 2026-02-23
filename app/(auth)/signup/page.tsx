"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { MessageCircle, Loader2 } from "lucide-react";

export default function SignupPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    full_name: fullName,
                }
            },
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
            <div className="w-full max-w-md bg-surface p-8 rounded-3xl border border-border shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent3 via-accent to-accent2"></div>

                <div className="flex flex-col items-center mb-6">
                    <Link href="/" className="flex items-center gap-2 mb-2 group">
                        <div className="w-10 h-10 rounded-xl bg-accent3/20 flex items-center justify-center group-hover:bg-accent3/30 transition-colors">
                            <MessageCircle className="w-5 h-5 text-accent3" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent2">GrowChat</span>
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight mt-2 mb-2">Create an account</h1>
                    <p className="text-text2 text-center text-sm">
                        Start automating your Instagram growth today
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg mb-6 text-center animate-in fade-in zoom-in duration-300">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-accent3/10 border border-accent3/20 text-accent3 text-sm p-3 rounded-lg mb-6 text-center animate-in fade-in zoom-in duration-300">
                        Check your email to confirm your account
                    </div>
                )}

                <form onSubmit={handleEmailSignUp} className="space-y-4 mb-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text2 ml-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-text placeholder-text2/50 focus:outline-none focus:border-accent3 focus:ring-1 focus:ring-accent3 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text2 ml-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-text placeholder-text2/50 focus:outline-none focus:border-accent3 focus:ring-1 focus:ring-accent3 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text2 ml-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-text placeholder-text2/50 focus:outline-none focus:border-accent3 focus:ring-1 focus:ring-accent3 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text2 ml-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-text placeholder-text2/50 focus:outline-none focus:border-accent3 focus:ring-1 focus:ring-accent3 transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full bg-accent hover:bg-accent/90 text-text font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign up"}
                    </button>
                </form>

                <div className="relative mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative bg-surface px-4 text-xs text-text2 uppercase tracking-wider">Or continue with</div>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    className="w-full bg-surface2 hover:bg-border text-text font-medium py-3 rounded-xl transition-all border border-border flex items-center justify-center gap-3 group"
                >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                </button>

                <p className="text-center text-sm text-text2 mt-8">
                    Already have an account?{" "}
                    <Link href="/login" className="text-text hover:text-accent font-medium transition-colors">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
