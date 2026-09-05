import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

export const Products: React.FC = () => {
    const { products, loading, hasMore, fetchMoreProducts } = useShop();
    const { t, language } = useLanguage();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const productList = products || [];

    if (loading && productList.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                <p className="font-bold text-gray-400 opacity-0 animate-pulse">...</p>
            </div>
        );
    }

    const categories = ['All', ...new Set(productList.map(p => p.category))];

    const filteredProducts = productList.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
                <div className="space-y-2 text-center md:text-left w-full md:w-auto">
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight uppercase">{t('allProducts')}</h1>
                    <p className="text-gray-400 font-medium">
                        {filteredProducts.length} {language === 'ar' ? 'منتج متاح' : 'products found'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative group w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder={language === 'ar' ? 'ابحث عن منتج...' : 'Search products...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field w-full sm:w-80 pl-12 pr-4 transition-all focus:ring-4 focus:ring-primary/10"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="input-field bg-white cursor-pointer w-full sm:w-48 transition-all focus:ring-4 focus:ring-primary/10"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'All' ? (language === 'ar' ? 'الكل' : 'All') : cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {filteredProducts.length > 0 ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {filteredProducts.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} />
                        ))}
                    </div>

                    {/* Load More Control */}
                    {hasMore && (
                        <div className="flex justify-center pt-12">
                            <button
                                onClick={() => fetchMoreProducts()}
                                disabled={loading}
                                className="px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-primary text-white hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl active:scale-95 flex items-center gap-3"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                                {language === 'ar' ? 'عرض المزيد' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 animate-in fade-in zoom-in duration-500">
                    <p className="text-gray-400 font-bold text-xl">
                        {language === 'ar' ? 'لم يتم العثور على نتائج' : 'No products found matching your criteria.'}
                    </p>
                </div>
            )}
        </div>
    );
};
