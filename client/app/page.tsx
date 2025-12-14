"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Users, Sparkles, X } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";
import TubesBackground from "@/components/webgl/TubesBackground";

export default function LandingPage() {
    const router = useRouter();
    const [showSplash, setShowSplash] = useState(true);
    const [fadeIn, setFadeIn] = useState(false);
    const [showModal, setShowModal] = useState<'login' | 'signup' | 'guest' | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        roomId: ""
    });

    useEffect(() => {
        // Start fade-in animation slightly before splash ends
        const fadeTimer = setTimeout(() => {
            setFadeIn(true);
        }, 2500);

        // Hide splash screen after fade completes
        const splashTimer = setTimeout(() => {
            setShowSplash(false);
        }, 3000);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(splashTimer);
        };
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle unverified user error
                if (data.requiresVerification) {
                    throw new Error('Please verify your email before logging in. Check your inbox for the verification code.');
                }
                throw new Error(data.error || 'Login failed');
            }

            // Store JWT token and user data
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            // Check if email verification is required
            if (data.requiresVerification) {
                // Redirect to signup page with verification step
                router.push(`/auth/signup?email=${encodeURIComponent(formData.email)}&step=verify`);
            } else {
                // Fallback: If token is provided (shouldn't happen now)
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.roomId) {
            router.push(`/room/${formData.roomId}?name=${encodeURIComponent(formData.name)}&email=guest@temp.com`);
        }
    };

    if (showSplash) {
        return <SplashScreen finishLoading={() => setShowSplash(false)} />;
    }

    return (
        <>
            <TubesBackground />
            <main className={`min-h-screen bg-transparent text-[#F8F6F0] relative z-10 transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
                {/* Gradient Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 -left-48 w-96 h-96 bg-[#4169E1] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
                    <div className="absolute top-0 -right-48 w-96 h-96 bg-[#4169E1] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-48 left-1/2 w-96 h-96 bg-[#4169E1] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                {/* Header - FULLY RESPONSIVE */}
                <header className={`relative z-10 w-full px-4 sm:px-6 py-3 sm:py-4 transition-all duration-700 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
                        {/* Logo - Responsive text size */}
                        <div className="flex items-center min-w-0 flex-shrink">
                            <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-[#F8F6F0] to-[#4169E1] bg-clip-text text-transparent whitespace-nowrap">
                                Connect2Connect
                            </span>
                        </div>

                        {/* Auth Buttons - Responsive with NO WRAPPING */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <button
                                onClick={() => setShowModal('login')}
                                className="inline-flex items-center justify-center whitespace-nowrap px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-sm sm:text-base text-[#F8F6F0] hover:text-[#4169E1] transition-colors font-medium"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setShowModal('signup')}
                                className="inline-flex items-center justify-center whitespace-nowrap px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-sm sm:text-base bg-[#4169E1] hover:bg-[#3557c7] text-[#F8F6F0] rounded-lg transition-all shadow-lg hover:shadow-[0_0_30px_rgba(65,105,225,0.4)] font-medium"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </header>

                {/* Hero Section - FULLY RESPONSIVE */}
                <section className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-24 md:pb-32">
                    <div className={`text-center max-w-4xl mx-auto space-y-6 sm:space-y-8 transition-all duration-700 delay-150 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {/* Badge - Responsive */}
                        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#4169E1]/10 border border-[#4169E1]/30 rounded-full">
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#4169E1] flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-[#4169E1] font-medium">
                                Now with persistent data & social features
                            </span>
                        </div>

                        {/* Main Heading - Fully Responsive Text Sizes */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                            Watch Together,
                            <br />
                            <span className="bg-gradient-to-r from-[#4169E1] to-[#6B8EF4] bg-clip-text text-transparent">
                                Anywhere
                            </span>
                        </h1>

                        {/* Subtitle - Responsive */}
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#F8F6F0]/70 max-w-2xl mx-auto px-4">
                            Sync videos with friends in real-time. Create rooms, chat live, and build your community.
                        </p>

                        {/* CTA Buttons - Fully Responsive Stack/Row */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
                            <button
                                onClick={() => setShowModal('signup')}
                                className="inline-flex items-center justify-center whitespace-nowrap w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#F8F6F0] hover:bg-[#4169E1] text-[#0A0A0A] hover:text-[#F8F6F0] rounded-xl transition-all shadow-lg hover:shadow-[0_0_40px_rgba(65,105,225,0.5)] font-semibold text-base sm:text-lg group sm:min-w-[200px]"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Get Started Free
                                    <Play className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                                </span>
                            </button>

                            <button
                                onClick={() => setShowModal('guest')}
                                className="inline-flex items-center justify-center whitespace-nowrap w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-transparent hover:bg-[#F8F6F0]/5 text-[#F8F6F0] border-2 border-[#F8F6F0]/20 hover:border-[#4169E1] rounded-xl transition-all font-semibold text-base sm:text-lg sm:min-w-[200px]"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                    Quick Join
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Features Grid - Fully Responsive Grid */}
                    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-16 sm:mt-20 md:mt-24 max-w-5xl mx-auto transition-all duration-700 delay-300 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {[
                            { icon: "🎬", title: "Real-time Sync", desc: "Watch in perfect sync with friends" },
                            { icon: "💬", title: "Live Chat", desc: "Chat while you watch together" },
                            { icon: "👥", title: "Friend System", desc: "Connect and invite friends easily" }
                        ].map((feature, i) => (
                            <div key={i} className="p-5 sm:p-6 bg-[#F8F6F0]/5 border border-[#F8F6F0]/10 hover:border-[#4169E1]/50 rounded-2xl transition-all group hover:shadow-[0_0_30px_rgba(65,105,225,0.2)]">
                                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                                <h3 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-[#4169E1] transition-colors">{feature.title}</h3>
                                <p className="text-sm sm:text-base text-[#F8F6F0]/60">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Modals - RESPONSIVE */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
                        <div className="bg-[#0A0A0A] border-2 border-[#F8F6F0]/20 rounded-2xl p-6 sm:p-8 w-full max-w-md relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setShowModal(null)}
                                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-[#F8F6F0]/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Login Modal */}
                            {showModal === 'login' && (
                                <div className="space-y-5 sm:space-y-6">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold mb-2">Welcome Back</h2>
                                        <p className="text-sm sm:text-base text-[#F8F6F0]/60">Sign in to your account</p>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Email</label>
                                            <input
                                                type="email"
                                                placeholder="Enter your email"
                                                className="w-full px-4 py-3 text-sm sm:text-base bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Password</label>
                                            <input
                                                type="password"
                                                placeholder="Enter your password"
                                                className="w-full px-4 py-3 text-sm sm:text-base bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3 text-sm sm:text-base bg-[#4169E1] hover:bg-[#3557c7] text-[#F8F6F0] rounded-lg transition-all shadow-lg hover:shadow-[0_0_30px_rgba(65,105,225,0.4)] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Signing in...' : 'Sign In'}
                                        </button>
                                    </form>

                                    <p className="text-center text-xs sm:text-sm text-[#F8F6F0]/60">
                                        Don't have an account?{' '}
                                        <button onClick={() => setShowModal('signup')} className="text-[#4169E1] hover:underline font-medium">
                                            Sign up
                                        </button>
                                    </p>
                                </div>
                            )}

                            {/* Signup Modal */}
                            {showModal === 'signup' && (
                                <div className="space-y-5 sm:space-y-6">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold mb-2">Create Account</h2>
                                        <p className="text-sm sm:text-base text-[#F8F6F0]/60">Join the watch party</p>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleSignup} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Name</label>
                                            <input
                                                type="text"
                                                placeholder="Enter your name"
                                                className="w-full px-4 py-3 text-sm sm:text-base bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Email</label>
                                            <input
                                                type="email"
                                                placeholder="Enter your email"
                                                className="w-full px-4 py-3 text-sm sm:text-base bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Password</label>
                                            <input
                                                type="password"
                                                placeholder="Create a password"
                                                className="w-full px-4 py-3 text-sm sm:text-base bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3 text-sm sm:text-base bg-[#4169E1] hover:bg-[#3557c7] text-[#F8F6F0] rounded-lg transition-all shadow-lg hover:shadow-[0_0_30px_rgba(65,105,225,0.4)] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Creating Account...' : 'Create Account'}
                                        </button>
                                    </form>

                                    <p className="text-center text-xs sm:text-sm text-[#F8F6F0]/60">
                                        Already have an account?{' '}
                                        <button onClick={() => setShowModal('login')} className="text-[#4169E1] hover:underline font-medium">
                                            Sign in
                                        </button>
                                    </p>
                                </div>
                            )}

                            {/* Guest Join Modal */}
                            {showModal === 'guest' && (
                                <div className="space-y-5 sm:space-y-6">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold mb-2">Quick Join</h2>
                                        <p className="text-sm sm:text-base text-[#F8F6F0]/60">Join a room without an account</p>
                                    </div>

                                    <form onSubmit={handleGuestJoin} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Your Name</label>
                                            <input
                                                type="text"
                                                placeholder="Enter your name"
                                                className="w-full px-4 py-3 text-sm sm:text-base bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Room ID</label>
                                            <input
                                                type="text"
                                                placeholder="Enter room ID"
                                                className="w-full px-4 py-3 text-sm sm:text-base bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40 font-mono uppercase"
                                                value={formData.roomId}
                                                onChange={(e) => setFormData({ ...formData, roomId: e.target.value.toUpperCase() })}
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-3 text-sm sm:text-base bg-[#4169E1] hover:bg-[#3557c7] text-[#F8F6F0] rounded-lg transition-all shadow-lg hover:shadow-[0_0_30px_rgba(65,105,225,0.4)] font-semibold"
                                        >
                                            Join Room
                                        </button>
                                    </form>

                                    <p className="text-center text-xs sm:text-sm text-[#F8F6F0]/60">
                                        Want full features?{' '} <button onClick={() => setShowModal('signup')} className="text-[#4169E1] hover:underline font-medium">
                                            Create an account
                                        </button>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
            </main>
        </>
    );
}
