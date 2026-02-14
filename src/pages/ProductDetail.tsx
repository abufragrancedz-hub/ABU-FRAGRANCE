import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { ArrowLeft, Check, Truck, ShieldCheck, Clock, Minus, Plus, Tag } from 'lucide-react';
import { CheckoutForm } from '../components/CheckoutForm';
import { CartItem, ProductSize, QuantityDiscount } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { products } = useShop();
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const checkoutRef = useRef<HTMLDivElement>(null);

    const product = products.find(p => p.id === id);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState<string>(product?.images?.[0] || product?.image || '');

    // Update active image when product changes
    useEffect(() => {
        if (product) {
            setActiveImage(product.images?.[0] || product.image || '');
        }
    }, [product]);

    // Get the selected size object - must be before any conditional returns
    const selectedSizeObj: ProductSize | undefined = useMemo(() => {
        if (!selectedSize || !product?.sizes) return undefined;
        return product.sizes.find(s => s.size === selectedSize);
    }, [selectedSize, product?.sizes]);

    // Get base price based on size selection
    const basePrice = selectedSizeObj?.price || product?.price || 0;
    const currentOldPrice = selectedSizeObj?.oldPrice || product?.oldPrice || 0;

    // Get available discounts for selected size
    const availableDiscounts: QuantityDiscount[] = useMemo(() => {
        if (!selectedSizeObj?.discounts) return [];
        return [...selectedSizeObj.discounts].sort((a, b) => a.quantity - b.quantity);
    }, [selectedSizeObj]);

    // Calculate the applicable discount based on quantity
    const applicableDiscount: QuantityDiscount | null = useMemo(() => {
        if (availableDiscounts.length === 0) return null;
        // Find the highest quantity discount that applies
        const applicable = [...availableDiscounts]
            .reverse()
            .find(d => quantity >= d.quantity);
        return applicable || null;
    }, [availableDiscounts, quantity]);

    // Calculate current price (total for all items)
    const currentTotalPrice = useMemo(() => {
        const regularTotal = basePrice * quantity;
        if (applicableDiscount) {
            return regularTotal - applicableDiscount.discount;
        }
        return regularTotal;
    }, [basePrice, quantity, applicableDiscount]);

    // Calculate savings
    const savings = useMemo(() => {
        if (!applicableDiscount) return 0;
        return applicableDiscount.discount;
    }, [applicableDiscount]);

    // Early return AFTER all hooks
    if (!product) {
        return <div className="text-center py-20 text-blue-900 font-bold">Product not found</div>;
    }

    const checkoutItem: CartItem = {
        ...product,
        selectedSize,
        quantity,
        finalPrice: basePrice
    };

    const handleQuantityChange = (newQuantity: number) => {
        setQuantity(Math.max(1, newQuantity));
    };

    // Quick select a discount quantity
    const selectDiscountQuantity = (qty: number) => {
        setQuantity(qty);
    };

    return (
        <div className="min-h-screen pb-12 w-full overflow-x-hidden">
            {/* Navbar */}
            <div className="bg-white/95 backdrop-blur-md border-b-2 border-blue-100 sticky top-0 z-50 shadow-sm w-full">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="flex items-center text-blue-600 hover:text-blue-800 transition-colors p-2 -ml-2">
                        <ArrowLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180 ml-2' : 'mr-2'}`} />
                        <span className="font-medium hidden sm:inline">{t('back')}</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <img
                            src="/logo.jpg"
                            alt={t('logoText')}
                            className="h-8 md:h-10 w-auto object-contain"
                        />
                        <span className="font-black text-lg md:text-xl tracking-tighter text-blue-900 uppercase whitespace-nowrap">
                            {t('logoText')}
                        </span>
                    </div>
                    <div className="w-10 md:w-20"></div>
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-16 items-start max-w-full">
                    {/* Left: Product Images */}
                    <div className="w-full space-y-3 md:space-y-4">
                        <div className="w-full aspect-[4/5] md:aspect-square bg-white rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-lg shadow-blue-500/10 border-2 border-blue-100 group">
                            <img src={activeImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        {product.images && product.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2 md:gap-3 px-1 md:px-2">
                                {product.images.map((img, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setActiveImage(img)}
                                        className={`aspect-square bg-white rounded-xl md:rounded-2xl overflow-hidden border-2 transition-all shadow-sm cursor-pointer ${activeImage === img ? 'border-blue-500' : 'border-blue-100 hover:border-blue-400'}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover opacity-80 hover:opacity-100" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Info */}
                    <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 py-2 md:py-4">
                        <div className="space-y-3 md:space-y-4">
                            {product.isPromo && currentOldPrice > 0 && currentOldPrice > basePrice && (
                                <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-black border border-red-100 uppercase tracking-widest shadow-sm">
                                    <Clock className="w-3 md:w-4 h-3 md:h-4" />
                                    <span className="truncate">{t('limitedOffer')} - {Math.round(((currentOldPrice - basePrice) / currentOldPrice) * 100)}%</span>
                                </div>
                            )}
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-blue-900 leading-tight tracking-tight break-words drop-shadow-sm">{product.name}</h1>
                            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-2xl sm:text-3xl md:text-4xl font-black">
                                <span className="text-blue-700" dir="ltr">{basePrice > 0 ? basePrice : product.price} {t('currency')}</span>
                                {product.isPromo && currentOldPrice > 0 && currentOldPrice > basePrice && (
                                    <span className="text-blue-300 line-through text-lg sm:text-xl md:text-2xl decoration-red-500/50" dir="ltr">{currentOldPrice} {t('currency')}</span>
                                )}
                            </div>
                            <p className="text-blue-800 text-base md:text-lg lg:text-xl leading-relaxed font-medium">
                                {product.description}
                            </p>
                        </div>

                        {/* Benefits Icons */}
                        <div className="w-full overflow-x-auto pb-3 md:pb-4">
                            <div className="flex md:grid md:grid-cols-2 gap-3 md:gap-4 min-w-max md:min-w-0 pr-4">
                                {[
                                    { icon: Truck, text: t('shipping48'), subtext: t('readyToShip'), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                                    { icon: ShieldCheck, text: t('cashOnDelivery'), subtext: t('secure100'), color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                                    { icon: Clock, text: t('support247'), subtext: t('contact'), color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                                    { icon: Check, text: t('qualityGuaranteed'), subtext: t('exclusive'), color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                                ].map((item, i) => (
                                    <div key={i} className={`flex-shrink-0 w-56 md:w-full flex items-center gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border-2 ${item.border} group hover:scale-[1.02] transition-transform`}>
                                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl ${item.bg} flex items-center justify-center ${item.color} shadow-inner`}>
                                            <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs md:text-sm font-black text-blue-900 truncate">{item.text}</div>
                                            <div className="text-[10px] md:text-xs text-blue-500 font-bold truncate">{item.subtext}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Selection & Controls */}
                        <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[2rem] border-2 border-blue-100 shadow-md space-y-6 md:space-y-8">
                            {/* Size Selection */}
                            {product.sizes && product.sizes.length > 0 && (
                                <div className="space-y-3 md:space-y-4">
                                    <h3 className="font-black text-blue-900 text-base md:text-lg">
                                        <span>{t('selectSize')}</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-2 md:gap-3">
                                        {product.sizes.map(s => (
                                            <button
                                                key={s.size}
                                                onClick={() => { setSelectedSize(s.size); setQuantity(1); }}
                                                className={`min-w-[80px] md:min-w-[100px] h-auto py-3 px-4 rounded-xl md:rounded-2xl border-2 transition-all font-black flex flex-col items-center justify-center gap-1 ${selectedSize === s.size
                                                    ? 'border-blue-700 bg-blue-700 text-white shadow-lg shadow-blue-700/30 scale-105 ring-2 ring-blue-200 ring-offset-2'
                                                    : 'border-blue-200 bg-white text-blue-900 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-950 shadow-sm'
                                                    }`}
                                            >
                                                <span className="text-base md:text-lg">{s.size}</span>
                                                <span className={`text-xs ${selectedSize === s.size ? 'text-blue-100' : 'text-blue-500'}`}>{s.price} {t('currency')}</span>
                                                {s.discounts && s.discounts.length > 0 && (
                                                    <span className={`text-[10px] flex items-center gap-1 ${selectedSize === s.size ? 'text-yellow-300' : 'text-emerald-500'}`}>
                                                        <Tag className="w-3 h-3" />
                                                        {language === 'ar' ? 'عروض' : 'Offers'}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity Discounts - Show only when size with discounts is selected */}
                            {selectedSize && availableDiscounts.length > 0 && (
                                <div className="space-y-3 md:space-y-4">
                                    <h3 className="font-black text-emerald-700 text-base md:text-lg flex items-center gap-2">
                                        <Tag className="w-5 h-5" />
                                        {language === 'ar' ? 'عروض الكمية' : language === 'fr' ? 'Remises quantité' : 'Quantity Offers'}
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {availableDiscounts.map((discount, index) => {
                                            const regularPrice = basePrice * discount.quantity;
                                            const discountedPrice = regularPrice - discount.discount;
                                            const savingsPercent = Math.round((discount.discount / regularPrice) * 100);
                                            const isSelected = quantity === discount.quantity;

                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => selectDiscountQuantity(discount.quantity)}
                                                    className={`relative p-4 rounded-xl border-2 transition-all ${isSelected
                                                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                                                        : 'border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/50'
                                                        }`}
                                                >
                                                    {/* Discount badge */}
                                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                        -{savingsPercent}%
                                                    </div>

                                                    <div className="text-center">
                                                        <div className="text-2xl font-black text-emerald-800">
                                                            {discount.quantity}x
                                                        </div>
                                                        <div className="text-lg font-bold text-emerald-600" dir="ltr">
                                                            {discountedPrice} {t('currency')}
                                                        </div>
                                                        <div className="text-xs text-gray-400 line-through" dir="ltr">
                                                            {regularPrice} {t('currency')}
                                                        </div>
                                                        <div className="text-xs font-bold text-emerald-500 mt-1">
                                                            {language === 'ar' ? `وفر ${discount.discount} دج` : `Save ${discount.discount} DZD`}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quantity Selector */}
                            <div className="space-y-3 md:space-y-4">
                                <h3 className="font-black text-blue-900 text-base md:text-lg">{t('chooseQuantity')}</h3>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
                                    <div className="flex items-center bg-white rounded-xl md:rounded-2xl p-1.5 md:p-2 shadow-sm border-2 border-blue-100">
                                        <button
                                            onClick={() => handleQuantityChange(quantity - 1)}
                                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg md:rounded-xl hover:bg-blue-50 text-blue-900 transition-colors"
                                        >
                                            <Minus className="w-4 h-4 md:w-5 md:h-5" />
                                        </button>
                                        <span className="w-10 md:w-12 text-center font-black text-xl md:text-2xl text-blue-900" dir="ltr">{quantity}</span>
                                        <button
                                            onClick={() => handleQuantityChange(quantity + 1)}
                                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg md:rounded-xl hover:bg-blue-50 text-blue-900 transition-colors"
                                        >
                                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                        </button>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <div className="text-xl md:text-2xl font-black text-blue-700" dir="ltr">
                                                {currentTotalPrice > 0 ? currentTotalPrice : product.price * quantity} <span className="text-sm font-medium">{t('currency')}</span>
                                            </div>
                                            {savings > 0 && (
                                                <span className="text-sm text-gray-400 line-through" dir="ltr">
                                                    {basePrice * quantity} {t('currency')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] md:text-xs text-blue-400 font-bold uppercase tracking-widest">{t('totalPayable')}</div>
                                        {savings > 0 && (
                                            <div className="text-xs font-bold text-emerald-600 mt-1">
                                                {language === 'ar' ? `توفير ${savings} دج!` : `Saving ${savings} DZD!`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Note about checkout below */}
                        <div className="pt-2 md:pt-4 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 text-emerald-600 font-black text-xs md:text-sm uppercase tracking-widest">
                                <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
                                {t('cashOnDelivery')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checkout Section directly integrated */}
                <div ref={checkoutRef} className="mt-12 md:mt-20 lg:mt-32 pt-12 md:pt-20 border-t-2 border-blue-100/50">
                    <div className="max-w-4xl mx-auto px-2">
                        <div className="text-center mb-8 md:mb-12 lg:mb-16 space-y-3 md:space-y-4">
                            <div className="inline-block px-3 md:px-4 py-1.5 md:py-2 bg-blue-100 rounded-full text-blue-700 font-black text-xs md:text-sm uppercase tracking-widest mb-2 md:mb-4">
                                {t('finalStep')}
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-blue-900 font-arabic leading-tight">{t('confirmOrder')}</h2>
                            <p className="text-blue-500 text-sm md:text-lg lg:text-xl font-bold max-w-xl mx-auto">
                                {t('fillDetails')}
                            </p>
                        </div>
                        <div className="glass-card p-4 md:p-8 lg:p-12">
                            <CheckoutForm items={[checkoutItem]} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
