import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const AdminLogin: React.FC = () => {
    // Force rebuild 1
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (await login(email, password)) {
            navigate('/admin/dashboard');
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 p-4">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-xl border border-primary/10 w-full max-w-md relative">
                <Link to="/" className="absolute top-6 left-6 text-primary/60 hover:text-primary transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>

                <div className="flex flex-col items-center mb-8 mt-4">
                    <img
                        src="/logo.jpg"
                        alt="Abu Fragrance"
                        className="h-16 w-auto object-contain mb-4"
                    />
                    <h1 className="text-3xl font-black text-center text-primary tracking-tight uppercase">Abu Fragrance</h1>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Admin Access</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100 flex items-center justify-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-primary mb-2 uppercase tracking-wide">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="input-field"
                            placeholder="admin@abufragrance.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-primary mb-2 uppercase tracking-wide">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="w-full btn-primary py-4 text-lg">
                        Login Dashboard
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <div className="text-xs text-primary/40 font-mono bg-primary/5 py-2 rounded-lg">
                        Abu Fragrance Admin Panel
                    </div>
                    <Link to="/" className="inline-block text-sm font-bold text-primary/60 hover:text-primary transition-colors">
                        ← Return to Shop
                    </Link>
                </div>
            </div>
        </div>
    );
};
