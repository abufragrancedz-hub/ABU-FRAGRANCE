import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useShop } from '../context/ShopContext';
import { wilayas, getDeliveryPrice } from '../data/wilayas';
import { getCommunesByWilayaId } from '../data/communes';
import { andersonOffices } from '../data/anderson_offices';
import { getDHDDeliveryPrice } from '../data/dhd_wilayas';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, Truck, Building2, Home, MapPin, ChevronDown } from 'lucide-react';
import { CartItem, DeliveryType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { OptimizeImage } from './OptimizeImage';

interface CheckoutInputs {
    fullName: string;
    phone: string;
    wilayaId: string;
    commune: string;
}

interface CheckoutFormProps {
    items: CartItem[];
    onValidationFail?: () => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ items, onValidationFail }) => {
    const { addOrder } = useShop();
    const { t, language } = useLanguage();
    const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutInputs>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const selectedWilayaId = watch('wilayaId');
    const [deliveryType, setDeliveryType] = useState<DeliveryType>('domicile');
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [availableCommunes, setAvailableCommunes] = useState<any[]>([]);
    const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');

    // Derive product-level delivery settings from cart items
    const productDeliveryCompany = items[0]?.deliveryCompany || 'anderson';
    const stopDeskEnabled = items.some(item => item.stopDeskEnabled);
    const isFreeDelivery = items.some(item => item.freeDelivery);

    // When product supports 'both', let the customer pick. 
    const [selectedDeliveryCompany, setSelectedDeliveryCompany] = useState<'anderson' | 'dhd'>('anderson');

    // Sync selected company when the product's delivery settings change
    useEffect(() => {
        if (productDeliveryCompany === 'dhd') {
            setSelectedDeliveryCompany('dhd');
        } else if (productDeliveryCompany === 'anderson') {
            setSelectedDeliveryCompany('anderson');
        }
        // If it's 'both', we keep whatever was selected or stay on 'anderson' as default
    }, [productDeliveryCompany]);

    // The effective company used for fee calculation
    const effectiveCompany = productDeliveryCompany === 'both' ? selectedDeliveryCompany
        : productDeliveryCompany === 'dhd' ? 'dhd'
            : 'anderson';

    // Anderson offices only apply when effective company is anderson AND stopDeskEnabled
    const wilayaOffices = (effectiveCompany === 'anderson' && stopDeskEnabled && selectedWilayaId)
        ? andersonOffices.filter(o => o.wilaya_id === Number(selectedWilayaId))
        : [];

    useEffect(() => {
        const wilayaIdNum = Number(selectedWilayaId);
        if (wilayaIdNum) {
            if (isFreeDelivery) {
                setDeliveryFee(0);
            } else if (effectiveCompany === 'dhd') {
                setDeliveryFee(getDHDDeliveryPrice(wilayaIdNum, deliveryType));
            } else {
                const wilaya = wilayas.find(w => w.id === wilayaIdNum);
                setDeliveryFee(wilaya ? getDeliveryPrice(wilaya, deliveryType) : 0);
            }
        } else {
            setDeliveryFee(0);
        }

        if (selectedWilayaId) {
            const communes = getCommunesByWilayaId(Number(selectedWilayaId));
            setAvailableCommunes(communes);

            // If office is selected but offices unavailable (no stop desk or wrong company), revert
            const officesAvailable = effectiveCompany === 'anderson' && stopDeskEnabled &&
                andersonOffices.filter(o => o.wilaya_id === Number(selectedWilayaId)).length > 0;
            if ((!officesAvailable || isFreeDelivery) && deliveryType === 'office') {
                setDeliveryType('domicile');
            }
            setSelectedOfficeId('');
        } else {
            setAvailableCommunes([]);
        }
    }, [selectedWilayaId, deliveryType, isFreeDelivery, effectiveCompany, stopDeskEnabled]);

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
        // Enforce size selection if product has sizes
        const missingSizeItem = items.find(item => item.sizes && item.sizes.length > 0 && !item.selectedSize);
        if (missingSizeItem) {
            if (onValidationFail) onValidationFail();

            // Scroll back up to size selection area precisely
            const sizeSection = document.getElementById('size-selection-section');
            if (sizeSection) {
                sizeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                window.scrollTo({ top: 400, behavior: 'smooth' });
            }
            return;
        }

        setIsSubmitting(true);

        // Track InitiateCheckout for Meta and TikTok
        if (typeof window !== 'undefined') {
            const checkoutValue = Number(total) || 0;
            if ((window as any).fbq) {
                (window as any).fbq('track', 'InitiateCheckout', {
                    value: checkoutValue,
                    currency: 'DZD',
                    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
                    content_ids: items.map(i => i.id),
                    content_type: 'product'
                });
            }
            if ((window as any).ttq) {
                (window as any).ttq.track('InitiateCheckout', {
                    value: checkoutValue,
                    currency: 'DZD',
                    contents: items.map(i => ({
                        content_id: i.id,
                        content_name: i.name,
                        quantity: i.quantity,
                        price: Number(i.finalPrice) || 0
                    }))
                });
            }
        }

        try {
            const wilayaName = wilayas.find(w => w.id === Number(data.wilayaId))?.name || '';

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
                    address: '',
                    wilaya: wilayaName,
                    wilayaId: Number(data.wilayaId),
                    commune: data.commune
                },
                items: processedItems,
                total,
                deliveryFee,
                deliveryType,
                deliveryCompany: effectiveCompany as 'anderson' | 'dhd',
                stopDesk: deliveryType === 'office' && selectedOfficeId
                    ? wilayaOffices.find(o => o.id.toString() === selectedOfficeId)
                    : undefined,
                status: 'pending' as const,
                date: new Date().toISOString()
            };

            // 1. Save to Admin Dashboard (PRIORITY #1)
            const savedOrder = await addOrder(order);

            // 2. Sync to Google Sheets (Completely Independent)
            try {
                const orderLabel = (savedOrder as any)?.orderNumber
                    ? `#${(savedOrder as any).orderNumber}`
                    : order.id.slice(0, 8);

                const totalQuantity = order.items.reduce((sum, i) => sum + i.quantity, 0);
                const subtotal = order.total - order.deliveryFee;

                const formData = new URLSearchParams();
                formData.append('customerName', order.customer.fullName);
                formData.append('phone', order.customer.phone);
                formData.append('items', order.items.map(i => `${i.quantity}x ${i.name}${i.selectedSize ? ' (' + i.selectedSize + ')' : ''}`).join(', '));
                formData.append('orderId', orderLabel);
                formData.append('address', order.customer.address || '');
                formData.append('deliveryType', order.deliveryType || 'domicile');
                formData.append('deliveryCompany', effectiveCompany === 'dhd' ? 'DHD Delivery' : 'Anderson (EcoTrack)');
                formData.append('wilaya', order.customer.wilaya);
                formData.append('commune', order.customer.commune);
                formData.append('productPrice', subtotal.toString());
                formData.append('quantity', totalQuantity.toString());
                formData.append('shippingCost', order.deliveryFee.toString());
                formData.append('totalPrice', order.total.toString());
                formData.append('status', 'Pending');

                fetch("https://script.google.com/macros/s/AKfycbxmdXrEfshkP-K-eFpqIEqLeT6Sv0LCblidpBrIDZBozNoIwQAFYKqpG7j3aNQ2618yaQ/exec", {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: formData.toString()
                });
            } catch (err) {
                console.error("Sheet sync error:", err);
            }

            // 3. Move to success page — merge original order data with saved response
            navigate('/success', { state: { order: { ...order, id: savedOrder.id || order.id, orderNumber: (savedOrder as any).orderNumber } } });
        } catch (error) {
            console.error("Checkout submission failed:", error);
            alert("Checkout Error. Please try again or contact support.");
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
        return language === 'ar' ? 'الى باب المنزل' : language === 'fr' ? 'Domicile' : 'Home';
    };

    const selectedWilaya = wilayas.find(w => w.id === Number(selectedWilayaId));

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom duration-500">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-black text-blue-900 mb-2 uppercase tracking-tight">{t('shippingDetails')}</h2>
                <p className="text-blue-700 font-medium">{t('fillDetails')}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-blue-900/10 shadow-xl space-y-8">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="fullName" className="block text-sm font-black text-blue-900 uppercase tracking-widest">{t('fullName')}</label>
                        <input
                            id="fullName"
                            {...register('fullName', { required: true })}
                            required
                            className="input-field"
                            placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                        />
                        {errors.fullName && <p id="fullName-error" className="text-red-500 text-xs font-bold">{language === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="phone" className="block text-sm font-black text-blue-900 uppercase tracking-widest">{t('phone')}</label>
                        <input
                            id="phone"
                            {...register('phone', {
                                required: true,
                                minLength: 10,
                                maxLength: 10,
                                pattern: /^0[0-9]{9}$/
                            })}
                            required
                            type="tel"
                            inputMode="numeric"
                            className="input-field"
                            placeholder="0XXXXXXXXX"
                            dir="ltr"
                            maxLength={10}
                        />
                        {errors.phone && (
                            <p id="phone-error" className="text-red-500 text-xs font-bold">
                                {language === 'ar' ? 'رقم هاتف غير صحيح (مثال: 0555667788)' : 'Invalid phone number (e.g., 0555667788)'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Location Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="wilayaId" className="block text-sm font-black text-blue-900 uppercase tracking-widest">{t('wilaya')}</label>
                        <div className="relative">
                            <select
                                id="wilayaId"
                                {...register('wilayaId', { required: true })}
                                required
                                className="input-field appearance-none cursor-pointer text-blue-900"
                                dir="ltr"
                            >
                                <option value="" className="text-blue-900">{t('selectWilaya')}</option>
                                {wilayas.map(w => (
                                    <option key={w.id} value={w.id} className="text-blue-900">
                                        {w.id} - {w.name} {w.nameAr ? `(${w.nameAr})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="commune" className="block text-sm font-black text-blue-900 uppercase tracking-widest">{t('commune')}</label>
                        <select
                            id="commune"
                            {...register('commune', { required: true })}
                            required
                            className="input-field cursor-pointer disabled:opacity-50 text-blue-900"
                            disabled={!selectedWilayaId}
                        >
                            <option value="" className="text-blue-900">{t('commune')}</option>
                            {availableCommunes.map(c => (
                                <option key={c.id} value={c.commune_name_ascii} className="text-blue-900">{c.commune_name_ascii} - {c.commune_name}</option>
                            ))}
                        </select>
                        {errors.wilayaId && <p id="wilaya-error" className="text-red-500 text-xs font-bold">{language === 'ar' ? 'يرجى اختيار الولاية' : 'Please select a Wilaya'}</p>}
                        {errors.commune && <p id="commune-error" className="text-red-500 text-xs font-bold">{language === 'ar' ? 'يرجى اختيار البلدية' : 'Please select a Commune'}</p>}
                    </div>
                </div>

                {/* Delivery Type Selection */}
                {selectedWilaya && (
                    <div className="space-y-3 bg-blue-50/50 p-6 rounded-2xl border border-blue-900/10">

                        {/* Company selector — only shown when product supports both companies */}
                        {productDeliveryCompany === 'both' && (
                            <div className="mb-4">
                                <label className="block text-sm font-black text-blue-900 uppercase tracking-widest mb-2">
                                    {language === 'ar' ? 'اختر شركة التوصيل' : 'Choose Delivery Company'}
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border-2 border-blue-900/20 bg-white text-blue-900 font-bold appearance-none cursor-pointer focus:outline-none focus:border-blue-600 transition-all"
                                        value={selectedDeliveryCompany}
                                        onChange={e => {
                                            setSelectedDeliveryCompany(e.target.value as 'anderson' | 'dhd');
                                            setDeliveryType('domicile');
                                        }}
                                    >
                                        <option value="anderson">🚚 Anderson — EcoTrack</option>
                                        <option value="dhd">📦 DHD Delivery</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-700 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Company badge when single company */}
                        {productDeliveryCompany !== 'both' && (
                            <div className={`flex items-center gap-2 mb-3 px-3 py-1.5 rounded-xl w-fit text-xs font-bold ${effectiveCompany === 'dhd'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                <Truck className="w-3.5 h-3.5" />
                                {effectiveCompany === 'dhd' ? 'DHD Delivery' : 'Anderson (EcoTrack)'}
                            </div>
                        )}

                        <label className="block text-sm font-black text-blue-900 uppercase tracking-widest mb-3">
                            {language === 'ar' ? 'اختر طريقة التوصيل' : language === 'fr' ? 'Choisir la méthode de livraison' : 'Choose Delivery Method'}
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Office button — only visible when stopDeskEnabled AND company is Anderson */}
                            <button
                                type="button"
                                disabled={wilayaOffices.length === 0 || isFreeDelivery || !stopDeskEnabled || effectiveCompany !== 'anderson'}
                                onClick={() => setDeliveryType('office')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${(wilayaOffices.length === 0 || isFreeDelivery || !stopDeskEnabled || effectiveCompany !== 'anderson')
                                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-75'
                                        : deliveryType === 'office'
                                            ? 'border-blue-900 bg-white text-blue-900 ring-4 ring-blue-900/10 shadow-lg scale-[1.02]'
                                            : 'border-blue-900/20 bg-white/50 text-gray-400 hover:border-blue-900/40 hover:bg-white'
                                    }`}
                            >
                                <Building2 className="w-8 h-8 mb-1" />
                                <span className="font-bold text-sm text-center">
                                    {isFreeDelivery
                                        ? (language === 'ar' ? 'غير متوفر مع العرض' : 'Unavailable')
                                        : !stopDeskEnabled
                                            ? (language === 'ar' ? 'غير متاح' : 'Not Available')
                                            : effectiveCompany !== 'anderson'
                                                ? (language === 'ar' ? 'غير متاح' : 'N/A for DHD')
                                                : wilayaOffices.length === 0
                                                    ? (language === 'ar' ? 'غير متوفر بهذه الولاية' : 'Not Available')
                                                    : getDeliveryTypeLabel('office')}
                                </span>
                                {wilayaOffices.length > 0 && !isFreeDelivery && stopDeskEnabled && effectiveCompany === 'anderson' && (
                                    <span className="text-xs font-black bg-orange-100 text-orange-700 px-3 py-1 rounded-full" dir="ltr">
                                        {selectedWilaya.officePrice} {t('currency')}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeliveryType('domicile')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${deliveryType === 'domicile'
                                    ? 'border-blue-900 bg-white text-blue-900 ring-4 ring-blue-900/10 shadow-lg scale-[1.02]'
                                    : 'border-blue-900/20 bg-white/50 text-gray-400 hover:border-blue-900/40 hover:bg-white'
                                    }`}
                            >
                                <Home className="w-8 h-8 mb-1" />
                                <span className="font-bold text-sm text-center">{getDeliveryTypeLabel('domicile')}</span>
                                <span className="text-xs font-black bg-orange-100 text-orange-700 px-3 py-1 rounded-full" dir="ltr">
                                    {isFreeDelivery ? '0' : deliveryFee} {t('currency')}
                                </span>
                            </button>
                        </div>

                        {deliveryType === 'office' && wilayaOffices.length > 0 && (
                            <div className="mt-6 p-5 bg-white rounded-2xl border-2 border-blue-900/10 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-xs font-black text-blue-900 uppercase tracking-[0.2em] mb-3">
                                    {language === 'ar' ? 'اختر مكتب التوصيل' : 'Select Delivery Office'}
                                </label>

                                <select
                                    value={selectedOfficeId}
                                    onChange={(e) => setSelectedOfficeId(e.target.value)}
                                    required
                                    className={`input-field mb-4 w-full bg-white shadow-sm ${!selectedOfficeId ? 'text-gray-400' : ''}`}
                                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                                >
                                    <option value="" disabled>
                                        {language === 'ar' ? '-- يرجى اختيار مكتب التوصيل الأقرب إليك --' : '-- Please select the nearest office --'}
                                    </option>
                                    {wilayaOffices.map(office => (
                                        <option key={office.id} value={office.id} className="text-gray-900">
                                            {office.name} {office.commune_name ? `- ${office.commune_name}` : ''}
                                        </option>
                                    ))}
                                </select>

                                {selectedOfficeId && (
                                    <div className="flex items-start gap-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-primary/10 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-black text-primary text-sm mb-1 uppercase tracking-tight">
                                                {wilayaOffices.find(o => o.id.toString() === selectedOfficeId)?.name || 'Anderson / EcoTrack Office'}
                                            </p>
                                            <p className="text-xs text-primary/60 font-bold leading-relaxed opacity-80 mt-1">
                                                {wilayaOffices.find(o => o.id.toString() === selectedOfficeId)?.address}
                                            </p>
                                            <p className="text-xs text-emerald-700 font-bold leading-relaxed mt-3 pt-3 border-t border-primary/10">
                                                {language === 'ar'
                                                    ? `ستتلقى مكالمة هاتفية بمجرد وصول طلبك لتستلمه من المكتب أعلاه.`
                                                    : `You will receive a phone call once your order arrives for pickup at the office above.`
                                                }
                                            </p>
                                        </div>
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
                                    <OptimizeImage
                                        src={item.image}
                                        alt={item.name}
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0 pr-2">
                                            <p className="font-bold text-blue-900 line-clamp-1 text-sm">{item.name}</p>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('size')}: {item.selectedSize || 'N/A'}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-black text-gray-900 text-sm" dir="ltr">{calculateItemTotal(item)} {t('currency')}</p>
                                            <p className="text-xs text-gray-500 font-bold" dir="ltr">x{item.quantity}</p>
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
                            <span className="flex-shrink-0 whitespace-nowrap text-orange-600" dir="ltr">
                                {isFreeDelivery
                                    ? (language === 'ar' ? 'مجاني' : 'Free')
                                    : !selectedWilayaId
                                        ? '—'
                                        : `${deliveryFee} ${t('currency')}`}
                            </span>
                        </div>
                        <div className="flex justify-between items-baseline gap-4 text-xl sm:text-2xl font-black pt-4 border-t border-gray-900 text-blue-900">
                            <span className="truncate min-w-0 flex-1">{t('total').toUpperCase()}</span>
                            <span className="flex-shrink-0 whitespace-nowrap text-red-600" dir="ltr">{total} {t('currency')}</span>
                        </div>

                        <div className="flex items-center gap-3 text-blue-900 bg-blue-50 px-4 py-3 rounded-xl">
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
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-700 transition-all flex justify-center items-center gap-3 shadow-xl shadow-emerald-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
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
