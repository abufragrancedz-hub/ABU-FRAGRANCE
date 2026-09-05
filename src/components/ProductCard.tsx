import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Truck } from 'lucide-react';
import { OptimizeImage } from './OptimizeImage';

interface ProductCardProps {
    product: Product;
    index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
    const { t, language } = useLanguage();

    return (
        <div className="glass-card overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 rounded-2xl border border-gray-100 flex flex-col h-fit">
            <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden flex-shrink-0">
                <Link to={`/product/${product.id}`} className="block w-full h-full cursor-pointer">
                    <OptimizeImage
                        src={product.images?.[0] || product.image || ''}
                        alt={product.name}
                        width={400}
                        height={500}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        loading={index !== undefined && index < 2 ? "eager" : "lazy"}
                        fetchPriority={index !== undefined && index < 2 ? "high" : "auto"}
                    />
                </Link>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start pointer-events-none z-10">
                    {product.isPromo && (
                        <div className="bg-red-600 text-white text-[10px] sm:text-[12px] font-black px-2 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-xl uppercase tracking-widest animate-pulse whitespace-nowrap">
                            {language === 'ar' ? 'عرض خاص' : 'PROMO'}
                        </div>
                    )}

                    {product.freeDelivery && (
                        <div className="bg-emerald-600 text-white text-[10px] sm:text-[12px] font-black px-2 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-xl uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                            <Truck className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                            {t('freeDelivery')}
                        </div>
                    )}
                </div>

                <div className="absolute bottom-4 left-0 right-0 px-4 translate-y-0 opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500">
                    <Link
                        to={`/product/${product.id}`}
                        aria-label={`${t('viewDetails')} ${product.name}`}
                        className="w-full bg-primary text-white py-3 sm:py-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 hover:bg-black transition-all shadow-2xl shadow-primary/30 active:scale-95 uppercase tracking-widest"
                    >
                        <span aria-hidden="true">{t('viewDetails')}</span>
                    </Link>
                </div>
            </div>

            <div className="p-3 sm:p-4 text-center flex flex-col gap-1">
                <Link to={`/product/${product.id}`} className="block">
                    <h2 className="font-black text-[13px] sm:text-lg text-blue-900 tracking-tight hover:text-primary transition-colors leading-tight line-clamp-2">
                        {product.name}
                    </h2>
                </Link>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-3">
                    {(product.oldPrice || 0) > 0 && (product.oldPrice || 0) > product.price && (
                        <span className="text-gray-300 text-[10px] sm:text-xs font-bold line-through decoration-red-500/50" dir="ltr">
                            {product.oldPrice} {t('currency')}
                        </span>
                    )}
                    <span className="text-red-600 font-black text-[15px] sm:text-xl" dir="ltr">
                        {product.price} {t('currency')}
                    </span>
                </div>
            </div>
        </div>
    );
};
