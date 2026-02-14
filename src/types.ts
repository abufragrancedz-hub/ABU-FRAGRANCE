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
}

export interface CartItem extends Product {
    selectedSize?: string;
    quantity: number;
    finalPrice: number;
}

export type DeliveryType = 'office' | 'domicile';

export interface Order {
    id: string;
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
    deliveryType?: DeliveryType;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    date: string;
    carrier?: 'ecotrack';
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
