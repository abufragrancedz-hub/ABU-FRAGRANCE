import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, LogOut, Home, X, Settings } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { OptimizeImage } from '../../../components/OptimizeImage';

interface AdminLayoutProps {
    children: React.ReactNode;
    activeTab: 'dashboard' | 'orders' | 'products' | 'settings';
    setActiveTab: (tab: 'dashboard' | 'orders' | 'products' | 'settings') => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, setActiveTab }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const navItems = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'orders', label: t('orders'), icon: ShoppingBag },
        { id: 'products', label: t('products'), icon: Package },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const;

    return (
        // Root: fixed full-screen, flex row (sidebar + main area)
        <div className="fixed inset-0 w-full bg-gray-50 flex overflow-hidden">

            {/* ── Mobile Overlay (sidebar backdrop) ── */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={`bg-white border-r border-gray-200 fixed md:static inset-y-0 left-0 z-50 transition-all duration-300 transform
                    ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}
                    flex flex-col h-full shrink-0 ${!isSidebarOpen && 'invisible md:visible'}`}
            >
                <div className="h-20 flex items-center justify-center border-b border-gray-100 relative shrink-0 px-4">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen && 'md:hidden'}`}>
                        <OptimizeImage src="/logo.jpg" alt="Logo" width={40} height={40} className="h-10 w-auto object-contain rounded-lg" />
                        <div className="flex flex-col items-start justify-center">
                            <span className="font-black text-sm tracking-tight text-primary leading-none uppercase">Abu Fragrance</span>
                            <span className="font-bold text-[8px] tracking-[0.2em] text-secondary mt-1 uppercase">Dashboard</span>
                        </div>
                    </div>
                    <div className={`hidden ${!isSidebarOpen && 'md:flex'} items-center justify-center`}>
                        <OptimizeImage src="/logo.jpg" alt="Logo" width={32} height={32} className="h-8 w-auto object-contain rounded-lg" />
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute right-4 md:hidden text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (window.innerWidth < 768) setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all group ${activeTab === item.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-gray-600 hover:bg-primary/5 hover:text-primary'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                            {isSidebarOpen && <span className="font-bold">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-3 border-t border-gray-100 space-y-1 shrink-0">
                    <Link
                        to="/"
                        className="flex items-center w-full px-3 py-2.5 text-gray-600 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors group"
                    >
                        <Home className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                        {isSidebarOpen && <span className="font-bold">{t('goToHome')}</span>}
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors group"
                    >
                        <LogOut className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                        {isSidebarOpen && <span className="font-bold">{t('logout')}</span>}
                    </button>
                </div>
            </aside>

            {/* ── Main Area: flex column (header + scroll content) ── */}
            {/*
                IMPORTANT: <main> does NOT have overflow-y-auto.
                Scroll happens inside the content div below.
                This prevents <main> from creating a scroll container
                that can clip/interfere with fixed modals inside OrdersView.
            */}
            <main className="flex-1 flex flex-col h-full w-full min-w-0">

                {/* Mobile logo header — shrink-0 so it never scrolls away */}
                <header className="shrink-0 bg-white border-b border-gray-200 h-14 flex items-center px-4 md:hidden z-10">
                    <div className="flex items-center gap-3">
                        <OptimizeImage src="/logo.jpg" alt="Logo" width={32} height={32} className="h-8 w-auto object-contain rounded-lg" />
                        <div className="flex flex-col items-start leading-tight">
                            <span className="font-black text-xs tracking-wider text-primary uppercase">Abu Fragrance</span>
                            <span className="font-bold text-[7px] tracking-[0.2em] text-secondary uppercase">Admin Control</span>
                        </div>
                    </div>
                </header>

                {/* Scrollable content — only this div scrolls */}
                <div className="flex-1 overflow-y-auto w-full">
                    <div className="p-4 md:p-8 pb-36 md:pb-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </div>

            </main>

            {/* ── Mobile Bottom Nav ── OUTSIDE <main>, sibling to it.
                Fixed to viewport. z-[200] so it's above all page content
                but below modals rendered via portal (z-[9999]).           */}
            <nav className="md:hidden fixed bottom-5 left-4 right-4 h-[68px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-[2rem] flex items-center justify-around px-2 shadow-2xl z-[200]">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-all duration-200
                            ${activeTab === item.id ? 'scale-105' : 'opacity-40 hover:opacity-80'}`}
                    >
                        <div className={`p-2.5 rounded-2xl transition-all duration-300
                            ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white'}`}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider leading-none
                            ${activeTab === item.id ? 'text-primary' : 'text-white/40'}`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </nav>

        </div>
    );
};
