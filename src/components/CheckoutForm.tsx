import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useShop } from '../context/ShopContext';
import { wilayas, getDeliveryPrice } from '../data/wilayas';
import { getCommunesByWilayaId } from '../data/communes';
import { sendOrderToTelegram } from '../utils/telegram';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, Truck, Building2, Home, MapPin, MapPinned } from 'lucide-react';
import { CartItem, DeliveryType, StopDesk } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ecotrackProvider } from '../services/delivery/ecotrack';

interface CheckoutInputs {
    fullName: string;
    phone: string;
    address: string;
    wilayaId: string;
    commune: string;
}

interface CheckoutFormProps {
    items: CartItem[];
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ items }) => {
    const { addOrder } = useShop();
    const { t, language } = useLanguage();
    const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutInputs>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const selectedWilayaId = watch('wilayaId');
    const [deliveryType, setDeliveryType] = useState<DeliveryType>('domicile');
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [availableCommunes, setAvailableCommunes] = useState<any[]>([]);

    // Stop Desk Logic
    const [stopDesks, setStopDesks] = useState<StopDesk[]>([]);
    const [selectedStopDeskId, setSelectedStopDeskId] = useState<string>('');
    const [isLoadingDesks, setIsLoadingDesks] = useState(false);

    useEffect(() => {
        if (deliveryType === 'office' && selectedWilayaId) {
            setIsLoadingDesks(true);
            setStopDesks([]);
            setSelectedStopDeskId('');

            if (ecotrackProvider.getStopDesks) {
                console.log("Fetching desks for wilaya:", selectedWilayaId);
                ecotrackProvider.getStopDesks(Number(selectedWilayaId))
                    .then(desks => {
                        console.log("Desks fetched:", desks);
                        setStopDesks(desks);
                        if (desks.length > 0) {
                            setSelectedStopDeskId(String(desks[0].id));
                        }
                    })
                    .catch(err => console.error("Failed to load stop desks", err))
                    .finally(() => setIsLoadingDesks(false));
            } else {
                setIsLoadingDesks(false);
            }
        }
    }, [deliveryType, selectedWilayaId]);

    useEffect(() => {
        const wilaya = wilayas.find(w => w.id === Number(selectedWilayaId));
        if (wilaya) {
            setDeliveryFee(getDeliveryPrice(wilaya, deliveryType));
        } else {
            setDeliveryFee(0);
        }

        if (selectedWilayaId) {
            const communes = getCommunesByWilayaId(Number(selectedWilayaId));
            setAvailableCommunes(communes);
        } else {
            setAvailableCommunes([]);
        }
    }, [selectedWilayaId, deliveryType]);

    const calculateItemTotal = (item: CartItem) => {
        let total = item.finalPrice * item.quantity;

        // Check for size-specific quantity discounts (Packs)
        if (item.selectedSize && item.sizes) {
            const sizeData = item.sizes.find(s => s.size === item.selectedSize);
            if (sizeData && sizeData.discounts && sizeData.discounts.length > 0) {
                // Sort discounts by quantity descending (apply largest packs first)
                const sortedDiscounts = [...sizeData.discounts].sort((a, b) => b.quantity - a.quantity);

                let remainingQty = item.quantity;
                let totalDiscount = 0;

                for (const discountRule of sortedDiscounts) {
                    if (discountRule.quantity > 0) {
                        const numPacks = Math.floor(remainingQty / discountRule.quantity);
                        if (numPacks > 0) {
                            totalDiscount += numPacks * discountRule.discount;
                            remainingQty -= numPacks * discountRule.quantity;
                        }
                    }
                }
                total -= totalDiscount;
            }
        }
        return total;
    };

    const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const total = subtotal + deliveryFee;

    const onSubmit = async (data: CheckoutInputs) => {
        // Validation: Verify if size is selected for products having sizes
        const missingSize = items.find(item => item.sizes && item.sizes.length > 0 && !item.selectedSize);
        if (missingSize) {
            alert(language === 'ar' ? 'يرجى اختيار الحجم للمنتج: ' + missingSize.name : 'Please select a size for: ' + missingSize.name);
            // Ideally scroll to size selector, but simple alert works for now
            return;
        }

        // Validation: Verify if office is selected when deliveryType is 'office'
        if (deliveryType === 'office' && (!selectedStopDeskId || stopDesks.length === 0)) {
            alert(language === 'ar' ? 'يرجى اختيار مكتب التوصيل الأقرب إليك' : 'Please select a delivery office nearest to you');
            return;
        }

        setIsSubmitting(true);
        try {
            const wilayaName = wilayas.find(w => w.id === Number(data.wilayaId))?.name || '';
            const selectedDesk = (deliveryType === 'office' && selectedStopDeskId)
                ? stopDesks.find(d => String(d.id) === selectedStopDeskId)
                : undefined;

            const processedItems = items.map(item => ({
                ...item,
                finalPrice: calculateItemTotal(item) / item.quantity
            }));

            const orderId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const order = {
                id: orderId,
                customer: {
                    fullName: data.fullName,
                    phone: data.phone,
                    address: data.address,
                    wilaya: wilayaName,
                    wilayaId: Number(data.wilayaId),
                    commune: data.commune
                },
                items: processedItems,
                total,
                deliveryFee,
                deliveryType,
                stopDesk: selectedDesk,
                status: 'pending' as const,
                date: new Date().toISOString()
            };

            // 1. Save order and get final order with number
            const finalOrder = await addOrder(order);

            // 2. Send to Telegram with the generated order number (don't block)
            try {
                await sendOrderToTelegram(finalOrder);
            } catch (err) {
                console.error("Telegram notification failed:", err);
            }

            navigate('/success', { state: { order: finalOrder } });
        } catch (error) {
            console.error("Checkout error:", error);
            alert("There was an error processing your order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0) {
        return <div className="text-center py-10">Product not specified.</div>;
    }

    // Get delivery type labels
    const getDeliveryTypeLabel = (type: DeliveryType) => {
        if (type === 'office') {
            return language === 'ar' ? 'مكتب التوصيل' : language === 'fr' ? 'Bureau' : 'Office';
        }
        return language === 'ar' ? 'المنزل' : language === 'fr' ? 'Domicile' : 'Home';
    };

    const selectedWilaya = wilayas.find(w => w.id === Number(selectedWilayaId));

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom duration-500">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-black text-blue-900 mb-2 uppercase tracking-tight">{t('shippingDetails')}</h2>
                <p className="text-blue-500 font-medium">{t('fillDetails')}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-gradient-to-br from-white to-blue-50/50 p-5 md:p-8 lg:p-10 rounded-[2.5rem] border-2 border-blue-100 shadow-xl shadow-blue-200/20 space-y-8 md:space-y-10">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-blue-800 uppercase tracking-widest">{t('fullName')}</label>
                        <input
                            {...register('fullName', { required: true })}
                            className="input-field h-14 uppercase px-5 text-base md:text-lg rounded-2xl"
                            placeholder={language === 'ar' ? 'الإسم الكامل' : 'FULL NAME'}
                            onInput={(e) => {
                                const target = e.target as HTMLInputElement;
                                target.value = target.value.toUpperCase();
                            }}
                        />
                        {errors.fullName && <p className="text-red-500 text-xs font-bold">{language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-black text-blue-800 uppercase tracking-widest">{t('phone')}</label>
                        <input
                            {...register('phone', {
                                required: true,
                                minLength: 10,
                                maxLength: 10,
                                pattern: /^0[0-9]{9}$/
                            })}
                            type="tel"
                            inputMode="numeric"
                            className="input-field h-14 px-5 text-base md:text-lg rounded-2xl tracking-widest"
                            placeholder="0XXXXXXXXX"
                            dir="ltr"
                            maxLength={10}
                            onInput={(e) => {
                                const target = e.target as HTMLInputElement;
                                target.value = target.value.replace(/\D/g, '');
                            }}
                        />
                        {errors.phone && (
                            <p className="text-red-500 text-xs font-bold">
                                {language === 'ar' ? 'رقم هاتف غير صحيح (مثال: 0555667788)' : 'Invalid phone number (e.g., 0555667788)'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Location Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-black text-blue-800 uppercase tracking-widest">{t('wilaya')}</label>
                        <div className="relative">
                            <select
                                {...register('wilayaId', { required: true })}
                                className="input-field h-14 appearance-none cursor-pointer px-5 text-base md:text-lg rounded-2xl"
                                dir="ltr"
                            >
                                <option value="">{t('selectWilaya')}</option>
                                {wilayas.map(w => (
                                    <option key={w.id} value={w.id}>
                                        {w.id} - {w.name} {w.nameAr ? `(${w.nameAr})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-black text-blue-800 uppercase tracking-widest">{t('commune')}</label>
                        <select
                            {...register('commune', { required: true })}
                            className="input-field h-14 cursor-pointer disabled:opacity-50 px-5 text-base md:text-lg rounded-2xl"
                            disabled={!selectedWilayaId}
                        >
                            <option value="">{t('commune')}</option>
                            {availableCommunes.map(c => (
                                <option key={c.id} value={c.commune_name_ascii}>{c.commune_name_ascii} - {c.commune_name}</option>
                            ))}
                        </select>
                        {errors.wilayaId && <p className="text-red-500 text-xs font-bold">{language === 'ar' ? 'يرجى اختيار الولاية' : 'Please select a Wilaya'}</p>}
                        {errors.commune && <p className="text-red-500 text-xs font-bold">{language === 'ar' ? 'يرجى اختيار البلدية' : 'Please select a Commune'}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-black text-blue-800 uppercase tracking-widest">{t('address')}</label>
                    <textarea
                        {...register('address', { required: true })}
                        className="input-field min-h-[100px] py-4 px-5 text-base md:text-lg rounded-2xl"
                        placeholder={t('address')}
                    />
                    {errors.address && <p className="text-red-500 text-xs font-bold">{language === 'ar' ? 'يرجى إدخال العنوان' : 'Please enter your address'}</p>}
                </div>

                {/* Delivery Type Selection */}
                {selectedWilaya && (
                    <div className="space-y-3 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <label className="block text-sm font-black text-blue-800 uppercase tracking-widest mb-3">
                            {language === 'ar' ? 'اختر طريقة التوصيل' : language === 'fr' ? 'Choisir la méthode de livraison' : 'Choose Delivery Method'}
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setDeliveryType('office')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${deliveryType === 'office'
                                    ? 'border-blue-600 bg-white text-blue-700 ring-4 ring-blue-600/10 shadow-lg scale-[1.02]'
                                    : 'border-blue-200 bg-white/50 text-blue-500 hover:border-blue-400 hover:bg-white'
                                    }`}
                            >
                                <Building2 className="w-8 h-8 mb-1" />
                                <span className="font-bold text-sm text-center">{getDeliveryTypeLabel('office')}</span>
                                <span className="text-xs font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full" dir="ltr">{selectedWilaya.officePrice} {t('currency')}</span>
                                <span className="text-[10px] opacity-70 text-center leading-tight mt-1 px-1 font-medium">
                                    {language === 'ar' ? '*حسب توفر المكتب' : '*Subject to availability'}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeliveryType('domicile')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${deliveryType === 'domicile'
                                    ? 'border-blue-600 bg-white text-blue-700 ring-4 ring-blue-600/10 shadow-lg scale-[1.02]'
                                    : 'border-blue-200 bg-white/50 text-blue-500 hover:border-blue-400 hover:bg-white'
                                    }`}
                            >
                                <Home className="w-8 h-8 mb-1" />
                                <span className="font-bold text-sm text-center">{getDeliveryTypeLabel('domicile')}</span>
                                <span className="text-xs font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full" dir="ltr">{selectedWilaya.domicilePrice} {t('currency')}</span>
                            </button>
                        </div>

                        {deliveryType === 'office' && (
                            <div className="mt-6 p-5 bg-blue-50 rounded-2xl border-2 border-blue-200 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-[10px] font-black text-blue-800 uppercase tracking-[0.2em] mb-3">
                                    {language === 'ar' ? 'معلومات مكتب التوصيل' : 'Office Delivery Information'}
                                </label>

                                {isLoadingDesks ? (
                                    <div className="flex items-center gap-3 text-blue-600">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-xs font-bold">{language === 'ar' ? 'جاري تحميل المكاتب المتوفرة...' : 'Loading available offices...'}</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-blue-900">{language === 'ar' ? 'اختر المكتب الأقرب إليك' : 'Select nearest office'}</label>
                                            <select
                                                value={selectedStopDeskId}
                                                onChange={(e) => setSelectedStopDeskId(e.target.value)}
                                                className="w-full p-3 rounded-xl border border-blue-200 bg-white text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                {stopDesks.map(desk => (
                                                    <option key={desk.id} value={desk.id}>
                                                        {desk.name} — {desk.commune_name || desk.address}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {stopDesks.length === 0 && (
                                            <div className="flex flex-col items-center justify-center p-6 bg-red-100/50 rounded-xl border border-red-200 text-center space-y-3 animate-in fade-in zoom-in duration-300">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                    <MapPin className="w-5 h-5 text-red-500" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-red-900 text-[10px] uppercase tracking-wider">
                                                        {language === 'ar' ? 'لا توجد مكاتب متوفرة' : 'No offices available'}
                                                    </p>
                                                    <p className="text-[10px] text-red-700 font-bold leading-relaxed opacity-80 mt-1">
                                                        {language === 'ar'
                                                            ? `عذراً، لا توجد مكاتب توصيل متوفرة حالياً في ولاية ${selectedWilaya.nameAr || selectedWilaya.name}. يرجى اختيار التوصيل للمنزل.`
                                                            : `Sorry, there are no delivery offices currently available in ${selectedWilaya.name} Wilaya. Please select Domicile delivery.`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedStopDeskId && stopDesks.length > 0 && (
                                            <div className="flex items-start gap-3 pt-2">
                                                <MapPinned className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-blue-700 font-medium opacity-80 leading-relaxed">
                                                    {stopDesks.find(d => String(d.id) === selectedStopDeskId)?.address || (language === 'ar' ? 'العنوان متوفر عند الإتصال' : 'Address available upon contact')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Order Summary Section - Moved Inside Form */}
                <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100 space-y-6">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-4">{t('orderSummary')}</h3>

                    <div className="space-y-4">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-center">
                                <div className="w-16 h-16 bg-white rounded-xl border border-gray-200 overflow-hidden flex-shrink-0">
                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0 pr-2">
                                            <p className="font-bold text-gray-900 line-clamp-1 text-sm">{item.name}</p>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('size')}: {item.selectedSize || 'N/A'}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-black text-gray-900 text-sm" dir="ltr">{calculateItemTotal(item)} {t('currency')}</p>
                                            <p className="text-xs text-gray-400 font-bold" dir="ltr">x{item.quantity}</p>
                                            {item.finalPrice * item.quantity > calculateItemTotal(item) && (
                                                <p className="text-[10px] text-emerald-600 font-bold">-{item.finalPrice * item.quantity - calculateItemTotal(item)} DZD</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 pt-4 space-y-3">
                        <div className="flex justify-between items-center gap-4 text-gray-500 font-bold text-sm">
                            <span className="truncate min-w-0 flex-1 text-inherit">{t('subtotal').toUpperCase()}</span>
                            <span className="flex-shrink-0 whitespace-nowrap" dir="ltr">{subtotal} {t('currency')}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4 text-gray-500 font-bold text-sm">
                            <span className="flex items-center gap-2 truncate min-w-0 flex-1 text-inherit">
                                {t('delivery').toUpperCase()}
                                {deliveryType === 'office' && <Building2 className="w-3 h-3 flex-shrink-0" />}
                                {deliveryType === 'domicile' && <Home className="w-3 h-3 flex-shrink-0" />}
                            </span>
                            <span className="flex-shrink-0 whitespace-nowrap" dir="ltr">{deliveryFee > 0 ? `${deliveryFee} ${t('currency')}` : (language === 'ar' ? 'مجاني' : 'Free')}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-4 text-xl sm:text-2xl font-black pt-4 border-t border-gray-900 text-blue-900">
                            <span className="truncate min-w-0 flex-1">{t('total').toUpperCase()}</span>
                            <span className="flex-shrink-0 whitespace-nowrap" dir="ltr">{total} {t('currency')}</span>
                        </div>

                        <div className="flex items-center gap-3 text-blue-600 bg-blue-50 px-4 py-3 rounded-xl">
                            <Truck className="w-5 h-5 flex-shrink-0" />
                            <p className="text-xs font-black uppercase tracking-widest">
                                {language === 'ar' ? 'توصيل سريع' : 'Fast Delivery'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || (deliveryType === 'office' && (!selectedStopDeskId || stopDesks.length === 0))}
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 transition-all flex justify-center items-center gap-3 shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin w-6 h-6" />
                    ) : (
                        <span>{t('confirmOrder')}</span>
                    )}
                </button>

                <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    {t('securePayment')}
                </div>
            </form>
        </div>
    );
};
