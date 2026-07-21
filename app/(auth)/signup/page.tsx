'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signUp, signInWithGoogle } from '@/lib/firebase/auth';
import { fadeIn } from '@/lib/utils/animations';
import { GoogleGlyph, CadenceMark } from '@/components/auth/AuthBits';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
        const { user, error } = await signUp(email, password, name);
        if (error) { setError(error); setLoading(false); return; }
        if (user) router.push('/tasks');
    };

    const handleGoogleSignup = async () => {
        setError('');
        setLoading(true);
        const { user, error } = await signInWithGoogle();
        if (error) { setError(error); setLoading(false); return; }
        if (user) router.push('/tasks');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--app-bg)' }}>
            <motion.div variants={fadeIn} initial="hidden" animate="visible" className="w-full max-w-[400px]">
                <div className="flex flex-col items-center gap-4 mb-6">
                    <CadenceMark />
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Create your account</h1>
                        <p className="mt-1.5 text-base text-text-secondary">Start building better habits today</p>
                    </div>
                </div>

                <div className="bg-bg-primary border border-border rounded-4xl shadow-elev-3 p-6 flex flex-col gap-3.5">
                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-danger-bg text-danger text-sm font-medium">
                            <AlertCircle className="w-[15px] h-[15px] shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="flex flex-col gap-3.5">
                        <Input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} icon={<User className="w-[18px] h-[18px]" />} required />
                        <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="w-[18px] h-[18px]" />} required />
                        <div className="relative">
                            <Input type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock className="w-[18px] h-[18px]" />} required />
                            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary">
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <Button type="submit" className="w-full" loading={loading}>Create Account</Button>
                    </form>

                    <div className="flex items-center gap-3 text-xs text-text-tertiary">
                        <span className="flex-1 h-px bg-border" />or continue with<span className="flex-1 h-px bg-border" />
                    </div>

                    <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={loading}>
                        <GoogleGlyph /> Continue with Google
                    </Button>
                </div>

                <p className="text-center mt-4 text-base text-text-secondary">
                    Already have an account?{' '}
                    <Link href="/login" className="text-accent font-semibold hover:underline">Sign in</Link>
                </p>
            </motion.div>
        </div>
    );
}
