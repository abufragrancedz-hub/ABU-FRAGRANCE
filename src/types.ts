// Quantity discount - how much to reduce when buying multiple items
export interface QuantityDiscount {
    quantity: number;  // e.g., 2, 3, 4...
    discount: number;  // amount to reduce from total (e.g., if 2 items at 100 each = 200, discount 10 = 190)
}

// Size with its price and optional quantity discounts
export interface ProductSize {
    size: string;
    price: number;
    oldPrice?: number;
    discounts?: QuantityDiscount[];  // quantity-based discounts for this specific size
}

export interface StopDesk {
    id: number | string;
    name: string;
    address?: string;
    wilaya_id?: number | string;
    commune_id?: number | string;
    commune_name?: string;
    phone?: string;
}

// Which delivery company handles this product
export type DeliveryCompany = 'anderson' | 'dhd' | 'both';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    images?: string[];
    sizes?: ProductSize[];
    isPromo?: boolean;
    oldPrice?: number;
    freeDelivery?: boolean;
    deliveryCompany?: DeliveryCompany; // which carrier(s) this product uses
    stopDeskEnabled?: boolean;          // whether stop-desk pickup is available for this product
}

export interface CartItem extends Product {
    selectedSize?: string;
    selectedSizes?: (string | undefined)[];
    quantity: number;
    finalPrice: number;
}

export type DeliveryType = 'office' | 'domicile';

export interface Order {
    id: string;
    orderNumber?: number | string;
    customer: {
        fullName: string;
        phone: string;
        address: string;
        wilaya: string;
        wilayaId?: number;
        commune: string;
    };
    items: CartItem[];
    total: number;
    deliveryFee: number;
    actualDeliveryFee?: number;
    deliveryType?: DeliveryType;
    deliveryCompany?: 'anderson' | 'dhd'; // the actual company chosen at checkout
    status: 'pending' | 'sent_to_company' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'no_answer';
    date: string;
    carrier?: 'ecotrack' | 'dhd';
    trackingNumber?: string;
    stopDesk?: StopDesk;
}

export interface Wilaya {
    id: number;
    name: string;
    nameAr?: string;
    officePrice: number;
    domicilePrice: number;
    deliveryPrice?: number; // kept for backward compatibility
}

export interface DHDWilaya {
    id: number;
    name: string;
    domicilePrice: number;
    officePrice: number;
}
