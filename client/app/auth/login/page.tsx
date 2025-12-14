"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock } from "lucide-react";
import TubesBackground from "@/components/webgl/TubesBackground";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                // Store token and user data
                if (data.token) {
                    localStorage.setItem("token", data.token);
                }
                localStorage.setItem("user", JSON.stringify(data.user));
                router.push("/dashboard");
            } else if (data.requiresVerification) {
                setError("Please verify your email before logging in");
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Animated Background */}
            <TubesBackground />

            <main className="flex min-h-screen flex-col items-center justify-center text-stone-50 p-4 relative z-10">
                <div className="w-full max-w-sm space-y-6 animate-[fadeIn_0.6s_ease-out]">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-stone-50 bg-gradient-to-r from-[#F8F6F0] to-[#4169E1] bg-clip-text text-transparent">Welcome Back</h1>
                        <p className="text-stone-400 text-sm">Sign in to continue</p>
                    </div>

                    <div className="bg-[#0a0a0a]/30 backdrop-blur-2xl border-2 border-stone-900/50 rounded-xl p-6 shadow-[0_0_50px_rgba(65,105,225,0.3)] hover:shadow-[0_0_60px_rgba(65,105,225,0.4)] transition-all duration-500">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-xs font-medium text-stone-400 flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-blue-500" />
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-black/50 border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-stone-50"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-xs font-medium text-stone-400 flex items-center gap-2">
                                    <Lock className="h-3.5 w-3.5 text-blue-500" />
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-black/50 border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-stone-50"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 animate-[shake_0.3s_ease-in-out]">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-[#4169E1] hover:bg-[#3557c7] text-stone-50 font-medium rounded-lg transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(65,105,225,0.5)]"
                            >
                                {loading ? "Signing in..." : "Sign In"}
                            </button>

                            <div className="text-center text-xs text-stone-500">
                                Don't have an account?{" "}
                                <Link
                                    href="/auth/signup"
                                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline"
                                >
                                    Create one
                                </Link>
                            </div>
                        </form>
                    </div>

                    <div className="text-center">
                        <Link
                            href="/"
                            className="text-stone-600 hover:text-stone-500 text-xs transition-colors"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}
