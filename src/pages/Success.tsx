import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, Hash } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Order } from '../types';

export const Success: React.FC = () => {
    const { t, language } = useLanguage();
    const location = useLocation();
    const order = location.state?.order as Order;

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center bg-gray-50/50">
            <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl shadow-primary/5 border border-gray-100 max-w-2xl w-full animate-in fade-in zoom-in duration-700">
                <div className="relative mb-10">
                    <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto animate-bounce">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-black mb-4 text-gray-900 tracking-tight leading-tight">
                    {t('successMessage')}
                </h1>

                {order && (
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl font-black mb-8 animate-in slide-in-from-bottom duration-1000">
                        <Hash className="w-5 h-5" />
                        <span className="text-xl tracking-tighter uppercase">
                            {language === 'ar' ? 'رقم الطلب' : 'Order Number'}: {order.orderNumber || order.id.slice(0, 8)}
                        </span>
                    </div>
                )}

                <p className="text-gray-500 mb-12 text-lg md:text-xl font-medium leading-relaxed">
                    {t('successMessageDetail')}
                </p>

                <div className="space-y-6">
                    <Link
                        to="/"
                        className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-black transition-all shadow-2xl shadow-primary/20 active:scale-95"
                    >
                        {t('backToHome')}
                        <ArrowRight className={`w-6 h-6 ${language === 'ar' ? 'rotate-180' : ''}`} />
                    </Link>

                    <div className="pt-6 border-t border-gray-50">
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">
                            {language === 'ar' ? 'هل لديك سؤال؟ تواصل معنا' : 'Have a question? Contact us'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
