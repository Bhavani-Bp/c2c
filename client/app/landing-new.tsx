"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Users, Sparkles, X } from "lucide-react";

export default function LandingPage() {
    const router = useRouter();
    const [showModal, setShowModal] = useState<'login' | 'signup' | 'guest' | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        roomId: ""
    });

    const handleGuestJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.roomId) {
            router.push(`/room/${formData.roomId}?name=${encodeURIComponent(formData.name)}&email=guest@temp.com`);
        }
    };

    return (
        <main className="min-h-screen bg-[#0A0A0A] text-[#F8F6F0] relative overflow-hidden">
            {/* Gradient Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-48 w-96 h-96 bg-[#4169E1] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-48 w-96 h-96 bg-[#4169E1] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-48 left-1/2 w-96 h-96 bg-[#4169E1] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-[#4169E1] rounded-xl flex items-center justify-center">
                        <Play className="w-6 h-6 text-[#F8F6F0]" fill="#F8F6F0" />
                    </div>
                    <span className="text-xl font-bold">Connect2Connect</span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowModal('login')}
                        className="px-6 py-2 text-[#F8F6F0] hover:text-[#4169E1] transition-colors font-medium"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setShowModal('signup')}
                        className="px-6 py-2 bg-[#4169E1] hover:bg-[#3557c7] text-[#F8F6F0] rounded-lg transition-all shadow-lg hover:shadow-[0_0_30px_rgba(65,105,225,0.4)] font-medium"
                    >
                        Get Started
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
                <div className="text-center max-w-4xl mx-auto space-y-8">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4169E1]/10 border border-[#4169E1]/30 rounded-full">
                        <Sparkles className="w-4 h-4 text-[#4169E1]" />
                        <span className="text-sm text-[#4169E1] font-medium">Now with persistent data & social features</span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-6xl md:text-7xl font-bold leading-tight">
                        Watch Together,
                        <br />
                        <span className="bg-gradient-to-r from-[#4169E1] to-[#6B8EF4] bg-clip-text text-transparent">
                            Anywhere
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-[#F8F6F0]/70 max-w-2xl mx-auto">
                        Sync videos with friends in real-time. Create rooms, chat live, and build your community.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button
                            onClick={() => setShowModal('signup')}
                            className="px-8 py-4 bg-[#F8F6F0] hover:bg-[#4169E1] text-[#0A0A0A] hover:text-[#F8F6F0] rounded-xl transition-all shadow-lg hover:shadow-[0_0_40px_rgba(65,105,225,0.5)] font-semibold text-lg group min-w-[200px]"
                        >
                            <span className="flex items-center justify-center gap-2">
                                Get Started Free
                                <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>

                        <button
                            onClick={() => setShowModal('guest')}
                            className="px-8 py-4 bg-transparent hover:bg-[#F8F6F0]/5 text-[#F8F6F0] border-2 border-[#F8F6F0]/20 hover:border-[#4169E1] rounded-xl transition-all font-semibold text-lg min-w-[200px]"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Users className="w-5 h-5" />
                                Quick Join
                            </span>
                        </button>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto">
                    {[
                        { icon: "🎬", title: "Real-time Sync", desc: "Watch in perfect sync with friends" },
                        { icon: "💬", title: "Live Chat", desc: "Chat while you watch together" },
                        { icon: "👥", title: "Friend System", desc: "Connect and invite friends easily" }
                    ].map((feature, i) => (
                        <div key={i} className="p-6 bg-[#F8F6F0]/5 border border-[#F8F6F0]/10 hover:border-[#4169E1]/50 rounded-2xl transition-all group hover:shadow-[0_0_30px_rgba(65,105,225,0.2)]">
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-semibold mb-2 group-hover:text-[#4169E1] transition-colors">{feature.title}</h3>
                            <p className="text-[#F8F6F0]/60">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Modals */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
                    <div className="bg-[#0A0A0A] border-2 border-[#F8F6F0]/20 rounded-2xl p-8 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowModal(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-[#F8F6F0]/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Login Modal */}
                        {showModal === 'login' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                                    <p className="text-[#F8F6F0]/60">Sign in to your account</p>
                                </div>

                                <form className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email</label>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            className="w-full px-4 py-3 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Password</label>
                                        <input
                                            type="password"
                                            placeholder="Enter your password"
                                            className="w-full px-4 py-3 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-[#4169E1] hover:bg-[#3557c7] text-[#F8F6F0] rounded-lg transition-all shadow-lg hover:shadow-[0_0_30px_rgba(65,105,225,0.4)] font-semibold"
                                    >
                                        Sign In
                                    </button>
                                </form>

                                <p className="text-center text-sm text-[#F8F6F0]/60">
                                    Don't have an account?{' '}
                                    <button onClick={() => setShowModal('signup')} className="text-[#4169E1] hover:underline font-medium">
                                        Sign up
                                    </button>
                                </p>
                            </div>
                        )}

                        {/* Signup Modal */}
                        {showModal === 'signup' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Create Account</h2>
                                    <p className="text-[#F8F6F0]/60">Join the watch party</p>
                                </div>

                                <form className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your name"
                                            className="w-full px-4 py-3 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email</label>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            className="w-full px-4 py-3 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Password</label>
                                        <input
                                            type="password"
                                            placeholder="Create a password"
                                            className="w-full px-4 py-3 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-[#4169E1] hover:bg-[#3557c7] text-[#F8F6F0] rounded-lg transition-all shadow-lg hover:shadow-[0_0_30px_rgba(65,105,225,0.4)] font-semibold"
                                    >
                                        Create Account
                                    </button>
                                </form>

                                <p className="text-center text-sm text-[#F8F6F0]/60">
                                    Already have an account?{' '}
                                    <button onClick={() => setShowModal('login')} className="text-[#4169E1] hover:underline font-medium">
                                        Sign in
                                    </button>
                                </p>
                            </div>
                        )}

                        {/* Guest Join Modal */}
                        {showModal === 'guest' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Quick Join</h2>
                                    <p className="text-[#F8F6F0]/60">Join a room without an account</p>
                                </div>

                                <form onSubmit={handleGuestJoin} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Your Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your name"
                                            className="w-full px-4 py-3 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40"
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
                                            className="w-full px-4 py-3 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] placeholder:text-[#F8F6F0]/40 font-mono uppercase"
                                            value={formData.roomId}
                                            onChange={(e) => setFormData({ ...formData, roomId: e.target.value.toUpperCase() })}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-[#4169E1] hover:bg-[#3557c7] text-[#F8F6F0] rounded-lg transition-all shadow-lg hover:shadow-[0_0_30px_rgba(65,105,225,0.4)] font-semibold"
                                    >
                                        Join Room
                                    </button>
                                </form>

                                <p className="text-center text-sm text-[#F8F6F0]/60">
                                    Want full features?{' '}
                                    <button onClick={() => setShowModal('signup')} className="text-[#4169E1] hover:underline font-medium">
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
    );
}
