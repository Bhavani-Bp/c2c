"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { User, Lock, Mail, Calendar, CheckCircle } from "lucide-react";
import TubesBackground from "@/components/webgl/TubesBackground";

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

function SignupPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState<"signup" | "verify">("signup");

    const [formData, setFormData] = useState({
        userId: "",
        name: "",
        dob: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [verificationCode, setVerificationCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Check URL parameters to auto-show verification step
    useEffect(() => {
        const stepParam = searchParams.get('step');
        const emailParam = searchParams.get('email');

        if (stepParam === 'verify' && emailParam) {
            setStep('verify');
            setFormData(prev => ({ ...prev, email: emailParam }));
        }
    }, [searchParams]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: formData.userId,
                    name: formData.name,
                    dob: formData.dob,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setStep("verify");
            } else {
                setError(data.error || "Signup failed");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    code: verificationCode,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Store token received AFTER verification
                if (data.token) {
                    localStorage.setItem("token", data.token);
                }
                localStorage.setItem("user", JSON.stringify(data.user));
                router.push("/dashboard");
            } else {
                setError(data.error || "Verification failed");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError("");
    };

    return (
        <>
            {/* Animated Background */}
            <TubesBackground />

            <main className="flex min-h-screen flex-col items-center justify-center text-stone-50 p-4 relative z-10">
                <div className="w-full max-w-sm space-y-6 animate-[fadeIn_0.6s_ease-out]">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#F8F6F0] to-[#4169E1] bg-clip-text text-transparent">
                            {step === "signup" ? "Create Account" : "Verify Email"}
                        </h1>
                        <p className="text-stone-400 text-sm">
                            {step === "signup" ? "Join Connect to Connect" : "Enter verification code"}
                        </p>
                    </div>

                    <div className="bg-[#0a0a0a]/30 backdrop-blur-2xl border-2 border-stone-900/50 rounded-xl p-6 shadow-[0_0_50px_rgba(65,105,225,0.3)] hover:shadow-[0_0_60px_rgba(65,105,225,0.4)] transition-all duration-500">
                        {step === "signup" ? (
                            <form onSubmit={handleSignup} className="space-y-4">
                                <div className="space-y-2 animate-[slideIn_0.4s_ease-out]">
                                    <label htmlFor="name" className="text-xs font-medium text-stone-400 flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-blue-500" />
                                        Full Name
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        className="w-full px-4 py-2.5 bg-black border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-stone-50"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 animate-[slideIn_0.5s_ease-out]">
                                    <label htmlFor="dob" className="text-xs font-medium text-stone-400 flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                        Date of Birth
                                    </label>
                                    <input
                                        id="dob"
                                        type="date"
                                        value={formData.dob}
                                        onChange={(e) => handleInputChange("dob", e.target.value)}
                                        className="w-full px-4 py-2.5 bg-black border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-stone-50"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 animate-[slideIn_0.6s_ease-out]">
                                    <label htmlFor="userId" className="text-xs font-medium text-stone-400 flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-blue-500" />
                                        User ID
                                    </label>
                                    <input
                                        id="userId"
                                        type="text"
                                        placeholder="Choose a unique user ID"
                                        value={formData.userId}
                                        onChange={(e) => handleInputChange("userId", e.target.value)}
                                        className="w-full px-4 py-2.5 bg-black border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-stone-50"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 animate-[slideIn_0.7s_ease-out]">
                                    <label htmlFor="email" className="text-xs font-medium text-stone-400 flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-blue-500" />
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        className="w-full px-4 py-2.5 bg-black border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-stone-50"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 animate-[slideIn_0.8s_ease-out]">
                                    <label htmlFor="password" className="text-xs font-medium text-stone-400 flex items-center gap-2">
                                        <Lock className="h-3.5 w-3.5 text-blue-500" />
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="Create a password (min 6 characters)"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange("password", e.target.value)}
                                        className="w-full px-4 py-2.5 bg-black border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-stone-50"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 animate-[slideIn_0.9s_ease-out]">
                                    <label htmlFor="confirmPassword" className="text-xs font-medium text-stone-400 flex items-center gap-2">
                                        <Lock className="h-3.5 w-3.5 text-blue-500" />
                                        Confirm Password
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm your password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                        className="w-full px-4 py-2.5 bg-black border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-stone-50"
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
                                    {loading ? "Creating Account..." : "Create Account"}
                                </button>

                                <div className="text-center text-xs text-stone-500">
                                    Already have an account?{" "}
                                    <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline">
                                        Sign in
                                    </Link>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleVerify} className="space-y-5">
                                <div className="text-center text-xs text-stone-400 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                    Check your email ({formData.email}) for the code.
                                    <br />
                                    <span className="text-stone-500 mt-1 block">
                                        (Check server console for now)
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="code" className="text-xs font-medium text-stone-400 flex items-center gap-2">
                                        <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                                        Verification Code
                                    </label>
                                    <input
                                        id="code"
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-black border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-stone-600 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-center text-xl tracking-widest font-mono text-stone-50"
                                        maxLength={6}
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
                                    {loading ? "Verifying..." : "Verify Email"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep("signup")}
                                    className="w-full py-2 text-stone-500 hover:text-stone-400 transition-colors text-xs"
                                >
                                    ← Back to Signup
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="text-center">
                        <Link href="/" className="text-stone-600 hover:text-stone-500 text-xs transition-colors">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-[#F8F6F0]">Loading...</div>}>
            <SignupPageContent />
        </Suspense>
    );
}
