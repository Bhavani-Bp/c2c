"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Calendar, Link as LinkIcon, Tag, Save } from "lucide-react";

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        bio: "",
        avatarUrl: "",
        interests: [] as string[],
        dateOfBirth: ""
    });
    const [interestInput, setInterestInput] = useState("");

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/');
            return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Pre-fill form with existing data
        setFormData({
            bio: parsedUser.bio || "",
            avatarUrl: parsedUser.avatarUrl || "",
            interests: parsedUser.interests || [],
            dateOfBirth: parsedUser.dateOfBirth ? parsedUser.dateOfBirth.split('T')[0] : ""
        });
    }, [router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }

            // Update localStorage with new user data
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            setSuccess('Profile updated successfully!');

            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const addInterest = () => {
        if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
            setFormData({
                ...formData,
                interests: [...formData.interests, interestInput.trim()]
            });
            setInterestInput("");
        }
    };

    const removeInterest = (interest: string) => {
        setFormData({
            ...formData,
            interests: formData.interests.filter(i => i !== interest)
        });
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <p className="text-[#F8F6F0]">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-[#F8F6F0] py-8">
            <div className="max-w-3xl mx-auto px-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-[#4169E1] hover:underline mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>

                {/* Profile Header */}
                <div className="bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-2xl p-8 mb-8">
                    <div className="flex items-center gap-6 mb-6">
                        <div className="w-20 h-20 rounded-full bg-[#4169E1] flex items-center justify-center text-3xl font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
                            <p className="text-[#F8F6F0]/60">{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Form */}
                <div className="bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Bio
                            </label>
                            <textarea
                                placeholder="Tell us about yourself..."
                                className="w-full px-4 py-3 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0] resize-none"
                                rows={4}
                                maxLength={500}
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            />
                            <p className="text-xs text-[#F8F6F0]/40 mt-1">
                                {formData.bio.length}/500 characters
                            </p>
                        </div>

                        {/* Avatar URL */}
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" />
                                Avatar URL
                            </label>
                            <input
                                type="url"
                                placeholder="https://example.com/avatar.jpg"
                                className="w-full px-4 py-3 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0]"
                                value={formData.avatarUrl}
                                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                            />
                        </div>

                        {/* Interests */}
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                Interests
                            </label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    placeholder="Add an interest..."
                                    className="flex-1 px-4 py-3 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0]"
                                    value={interestInput}
                                    onChange={(e) => setInterestInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                                />
                                <button
                                    type="button"
                                    onClick={addInterest}
                                    className="px-6 py-3 bg-[#4169E1] hover:bg-[#3557c7] rounded-lg transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.interests.map((interest) => (
                                    <span
                                        key={interest}
                                        className="px-3 py-1 bg-[#4169E1]/20 border border-[#4169E1]/30 rounded-full text-sm flex items-center gap-2"
                                    >
                                        {interest}
                                        <button
                                            type="button"
                                            onClick={() => removeInterest(interest)}
                                            className="text-[#F8F6F0]/60 hover:text-red-400"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-[#F8F6F0]/5 border border-[#F8F6F0]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] text-[#F8F6F0]"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.push('/dashboard')}
                                className="flex-1 px-6 py-3 bg-[#F8F6F0]/10 hover:bg-[#F8F6F0]/20 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-[#4169E1] hover:bg-[#3557c7] rounded-lg transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
