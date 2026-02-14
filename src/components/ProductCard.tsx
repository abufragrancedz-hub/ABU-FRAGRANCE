import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ProductCardProps {
    product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const { t, language } = useLanguage();

    return (
        <div className="glass-card overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 rounded-[2rem] border border-gray-100">
            <div className="relative aspect-[4/5] overflow-hidden">
                <Link to={`/product/${product.id}`} className="block w-full h-full cursor-pointer">
                    <img
                        src={product.images?.[0] || product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                </Link>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none" />

                {product.isPromo && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl uppercase tracking-widest animate-pulse pointer-events-none">
                        {language === 'ar' ? 'عرض خاص' : 'PROMO'}
                    </div>
                )}

                <div className="absolute bottom-6 left-0 right-0 px-6 translate-y-0 opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500">
                    <Link
                        to={`/product/${product.id}`}
                        className="w-full bg-primary text-white py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-black transition-all shadow-2xl shadow-primary/30 active:scale-95"
                    >
                        <span>{t('buyNow')}</span>
                    </Link>
                </div>
            </div>

            <div className="p-6 text-center">
                <Link to={`/product/${product.id}`} className="block">
                    <h3 className="font-black text-xl text-gray-900 mb-2 tracking-tight line-clamp-1 hover:text-primary transition-colors">{product.name}</h3>
                </Link>
                <div className="flex items-center justify-center gap-4">
                    {(product.oldPrice || 0) > 0 && (product.oldPrice || 0) > product.price && (
                        <span className="text-gray-300 text-sm font-bold line-through decoration-red-500/50" dir="ltr">
                            {product.oldPrice} {t('currency')}
                        </span>
                    )}
                    <span className="text-primary font-black text-2xl" dir="ltr">
                        {product.price} {t('currency')}
                    </span>
                </div>
            </div>
        </div>
    );
};
