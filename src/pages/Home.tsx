import React from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { HeroCarousel } from '../components/HeroCarousel';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Home: React.FC = () => {
    const { products, loading } = useShop();
    const { t, language } = useLanguage();
    const featuredProducts = (products || []).slice(0, 8);

    const shouldShowProducts = !loading && featuredProducts.length > 0;

    return (
        <div className="space-y-12 md:space-y-24 pb-20 overflow-x-hidden">
            {/* Hero Section */}
            <HeroCarousel />

            {/* Featured Products */}
            <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-4 text-center md:text-left">
                    <div className="space-y-2">
                        <div className="inline-block px-3 py-1 bg-primary/5 rounded-full text-primary font-black text-xs uppercase tracking-widest">
                            {t('trending')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{t('featuredProducts')}</h1>
                        <p className="text-gray-600 text-lg max-w-md">{t('heroSubtitle')}</p>
                    </div>
                    <Link to="/products" className="group flex items-center gap-2 text-primary font-black hover:opacity-70 transition-all text-lg">
                        {t('viewAll')}
                        <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${language === 'ar' ? 'rotate-180' : ''}`} />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[4/5] bg-gray-200 rounded-3xl mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : shouldShowProducts ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {featuredProducts.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold text-lg">{language === 'ar' ? 'لا توجد منتجات حالياً' : 'No products available yet'}</p>
                    </div>
                )}
            </section>

            {/* Features Banner - Mobile First Grid */}
            <section className="px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: t('premiumQuality'), desc: t('premiumQualityDesc'), bg: 'bg-white border-2 border-gray-100 text-primary' },
                        { title: t('fastDelivery'), desc: t('fastDeliveryDesc'), bg: 'bg-gray-100 text-primary' },
                        { title: t('securePayment'), desc: t('securePaymentDesc'), bg: 'bg-white border-2 border-gray-100 text-primary' },
                    ].map((feature, i) => (
                        <div key={i} className={`p-10 rounded-[2.5rem] ${feature.bg} flex flex-col justify-center gap-4 group hover:scale-[1.02] transition-transform`}>
                            <h2 className="text-2xl font-black tracking-tight">{feature.title}</h2>
                            <p className="opacity-70 font-medium leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
