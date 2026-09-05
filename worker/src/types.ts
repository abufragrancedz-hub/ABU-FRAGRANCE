// ─── Cloudflare Worker Environment Bindings ───
export interface Env {
  // D1 Database
  DB: D1Database;
  // KV Namespace
  PRODUCTS_KV: KVNamespace;
  // Environment variables
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ORIGINS: string;
  ENVIRONMENT: string;
  DHD_API_KEY: string;
  DHD_API_URL: string;
  // Secrets (set via `wrangler secret put`)
  ADMIN_UIDS: string;
  ECOTRACK_API_TOKEN?: string;
  WEBHOOK_SECRET?: string;
}

// ─── Auth ───
export interface AuthUser {
  uid: string;
  email?: string;
  isAdmin: boolean;
}

// ─── Products ───
export interface QuantityDiscount {
  quantity: number;
  discount: number;
}

export interface ProductSize {
  size: string;
  price: number;
  oldPrice?: number;
  discounts?: QuantityDiscount[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  category: string;
  image: string;
  images?: string[];
  sizes?: ProductSize[];
  isPromo?: boolean;
  freeDelivery?: boolean;
  deliveryCompany?: string;
  stopDeskEnabled?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Orders ───
export type OrderStatus =
  | 'pending'
  | 'sent_to_company'
  | 'confirmed'
  | 'no_answer'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type DeliveryType = 'office' | 'domicile';
export type ProcessedBy = 'manual' | 'confirmation_company';

export interface OrderItem {
  id: string;
  name: string;
  selectedSize?: string;
  quantity: number;
  finalPrice: number;
  image?: string;
}

export interface StopDesk {
  id?: string;
  name?: string;
  address?: string;
  commune?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  customer: {
    fullName: string;
    phone: string;
    address: string;
    wilaya: string;
    wilayaId?: number;
    commune: string;
  };
  items: OrderItem[];
  total: number;
  deliveryFee: number;
  actualDeliveryFee?: number;
  deliveryType: DeliveryType;
  stopDesk?: StopDesk;
  status: OrderStatus;
  isFragile?: boolean;
  carrier?: string;
  deliveryCompany?: string;
  trackingNumber?: string;
  processedBy: ProcessedBy;
  createdAt: string;
  updatedAt: string;
}

// ─── Settings ───
export interface MarketingSettings {
  facebook_pixel_id: string;
  tiktok_pixel_id: string;
}

export interface DeliveryConfig {
  ecotrack: {
    api_token: string;
  };
}

export interface ConfirmationCompanyConfig {
  enabled: boolean;
  api_token: string;
  api_url: string;
  webhook_secret: string;
}

// ─── API Response ───
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// ─── D1 Row Mappers ───
export interface OrderRow {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_wilaya: string;
  customer_wilaya_id: number | null;
  customer_commune: string;
  items: string; // JSON
  total: number;
  delivery_fee: number;
  actual_delivery_fee: number | null;
  delivery_type: string;
  stop_desk_id: string | null;
  stop_desk_name: string | null;
  stop_desk_address: string | null;
  stop_desk_commune: string | null;
  status: string;
  carrier: string | null;
  delivery_company: string | null;
  tracking_number: string | null;
  processed_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  name: string;
  description: string;
  price: number;
  old_price: number | null;
  category: string;
  image: string;
  images: string; // JSON
  sizes: string;  // JSON
  is_promo: number;
  free_delivery: number;
  delivery_company: string | null;
  stop_desk_enabled: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ─── Row → API Object Mappers ───
export function orderRowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customer: {
      fullName: row.customer_name,
      phone: row.customer_phone,
      address: row.customer_address,
      wilaya: row.customer_wilaya,
      wilayaId: row.customer_wilaya_id ?? undefined,
      commune: row.customer_commune,
    },
    items: JSON.parse(row.items || '[]'),
    total: row.total,
    deliveryFee: row.delivery_fee,
    actualDeliveryFee: row.actual_delivery_fee ?? undefined,
    deliveryType: row.delivery_type as DeliveryType,
    stopDesk: row.stop_desk_id ? {
      id: row.stop_desk_id,
      name: row.stop_desk_name ?? undefined,
      address: row.stop_desk_address ?? undefined,
      commune: row.stop_desk_commune ?? undefined,
    } : undefined,
    status: row.status as OrderStatus,
    carrier: row.carrier ?? undefined,
    deliveryCompany: row.delivery_company ?? 'anderson',
    trackingNumber: row.tracking_number ?? undefined,
    processedBy: row.processed_by as ProcessedBy,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function productRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    oldPrice: row.old_price ?? undefined,
    category: row.category,
    image: row.image,
    images: JSON.parse(row.images || '[]'),
    sizes: JSON.parse(row.sizes || '[]'),
    isPromo: row.is_promo === 1,
    freeDelivery: row.free_delivery === 1,
    deliveryCompany: row.delivery_company ?? 'anderson',
    stopDeskEnabled: row.stop_desk_enabled === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
