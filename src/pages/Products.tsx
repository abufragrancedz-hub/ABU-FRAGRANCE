import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

export const Products: React.FC = () => {
    const { products, loading } = useShop();
    const { t, language } = useLanguage();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                <p className="font-bold text-gray-400 opacity-0 animate-pulse">...</p>
            </div>
        );
    }

    const categories = ['All', ...new Set(products.map(p => p.category))];

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
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
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setCurrentPage(1);
                        }}
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

            {currentItems.length > 0 ? (
                <div className="space-y-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
                        {currentItems.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pt-12">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest bg-white border border-gray-100 text-gray-900 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 flex items-center gap-2"
                            >
                                <svg className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                                </svg>
                                {language === 'ar' ? 'السابق' : 'Previous'}
                            </button>

                            <div className="flex items-center gap-2 px-4">
                                <span className="font-black text-xl text-primary">{currentPage}</span>
                                <span className="text-gray-300 font-bold">/</span>
                                <span className="font-bold text-gray-400">{totalPages}</span>
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest bg-white border border-gray-100 text-gray-900 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 flex items-center gap-2"
                            >
                                {language === 'ar' ? 'التالي' : 'Next'}
                                <svg className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                                </svg>
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
