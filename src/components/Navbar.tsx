
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

export const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLanguage();

    return (
        <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-[60] border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 md:h-20 items-center">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img
                            src="/logo.jpg"
                            alt={t('logoText')}
                            className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
                        />
                        <span className="text-xl md:text-2xl font-black text-primary tracking-tighter uppercase whitespace-nowrap">
                            {t('logoText')}
                        </span>
                    </Link>

                    {/* Desktop Menu - Hidden on mobile/tablet, visible on large screens */}
                    <div className="hidden lg:flex gap-8 items-center">
                        <Link to="/" className="text-sm font-black text-gray-500 hover:text-primary transition-colors tracking-widest">{t('home')}</Link>
                        <Link to="/products" className="text-sm font-black text-gray-500 hover:text-primary transition-colors tracking-widest">{t('products')}</Link>
                        <Link to="/contact" className="text-sm font-black text-gray-500 hover:text-primary transition-colors tracking-widest">{t('contact')}</Link>
                        <div className="w-px h-6 bg-gray-100 mx-2"></div>
                        <LanguageSwitcher />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="lg:hidden p-2 text-primary bg-gray-50 rounded-xl active:scale-90 transition-all"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="lg:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top duration-300">
                    <div className="px-6 py-8 space-y-6">
                        <div className="grid gap-4">
                            <Link
                                to="/"
                                onClick={() => setIsOpen(false)}
                                className="text-2xl font-black text-gray-900 border-b-2 border-transparent hover:border-primary pb-2"
                            >
                                {t('home')}
                            </Link>
                            <Link
                                to="/products"
                                onClick={() => setIsOpen(false)}
                                className="text-2xl font-black text-gray-900 border-b-2 border-transparent hover:border-primary pb-2"
                            >
                                {t('products')}
                            </Link>
                            <Link
                                to="/contact"
                                onClick={() => setIsOpen(false)}
                                className="text-2xl font-black text-gray-900 border-b-2 border-transparent hover:border-primary pb-2"
                            >
                                {t('contact')}
                            </Link>
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                            <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-4">
                                {t('language')}
                            </p>
                            <LanguageSwitcher />
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};
