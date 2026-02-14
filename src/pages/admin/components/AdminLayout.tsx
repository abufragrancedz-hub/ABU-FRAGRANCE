import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, LogOut, Home, Menu, X, Settings } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';

interface AdminLayoutProps {
    children: React.ReactNode;
    activeTab: 'dashboard' | 'orders' | 'products' | 'settings';
    setActiveTab: (tab: 'dashboard' | 'orders' | 'products' | 'settings') => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, setActiveTab }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
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
        <div className="fixed inset-0 w-full bg-gray-50 flex overflow-hidden overscroll-none">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`bg-white border-r border-gray-200 fixed md:static inset-y-0 left-0 z-30 transition-all duration-300 transform 
                    ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'} 
                    flex flex-col h-full shrink-0 ${!isSidebarOpen && 'invisible md:visible'}`}
            >
                <div className="h-20 flex items-center justify-center border-b border-gray-100 relative shrink-0 px-4">
                    <div className={`flex flex-col items-center justify-center ${!isSidebarOpen && 'md:hidden'}`}>
                        <span className="font-black text-lg tracking-wider text-primary leading-none uppercase">Abu Fragrance</span>
                        <span className="font-bold text-[10px] tracking-[0.2em] text-secondary mt-1 uppercase">Fragrance</span>
                    </div>
                    <span className={`font-black text-2xl tracking-tight text-primary hidden ${!isSidebarOpen && 'md:block'}`}>
                        A
                    </span>
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
                                // On mobile, close sidebar after selection
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

            {/* Main Content */}
            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative w-full">
                {/* Mobile Header */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:hidden sticky top-0 z-10 justify-between shrink-0">
                    <div className="flex flex-col items-start">
                        <span className="font-black text-sm tracking-wider text-primary leading-none uppercase">Abu Fragrance</span>
                        <span className="font-bold text-[8px] tracking-[0.2em] text-secondary mt-0.5 uppercase">Admin Control</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 bg-gray-50 rounded-lg">
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
};
