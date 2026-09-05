import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Order } from '../types';
import { apiFetch } from '../lib/apiClient';

interface ShopContextType {
    products: Product[];
    marketingSettings: { facebook_pixel_id: string; tiktok_pixel_id: string } | null;
    loading: boolean;
    hasMore: boolean;
    fetchMoreProducts: () => Promise<void>;
    refreshShopData: () => Promise<void>;
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    addOrder: (order: Order) => Promise<Order & { isEmergency?: boolean }>;
    syncShopToCloudflare: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [marketingSettings, setMarketingSettings] = useState<{ facebook_pixel_id: string; tiktok_pixel_id: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [page, setPage] = useState(1);

    const PAGE_SIZE = 12;

    const refreshShopData = React.useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            // Fetch Products first
            const res = await apiFetch(`/api/products?page=1&limit=${PAGE_SIZE}`);
            setProducts(res.data || []);
            setHasMore(res.meta?.hasMore || false);
            setPage(1);

            // Fetch marketing after to prioritize content paint
            const markRes = await apiFetch('/api/settings/marketing').catch(() => null);
            if (markRes && markRes.data) {
                setMarketingSettings({
                    facebook_pixel_id: markRes.data.facebook_pixel_id || '',
                    tiktok_pixel_id: markRes.data.tiktok_pixel_id || ''
                });
            }
        } catch (error: any) {
            console.error("Error refreshing shop data:", error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, []);

    const syncShopToCloudflare = async () => {
        try {
            await apiFetch('/api/admin/sync-cache', { method: 'POST' });
            await refreshShopData();
        } catch (error) {
            console.error("Manual sync failed:", error);
            throw error;
        }
    };

    useEffect(() => {
        // Fetch data immediately on mount
        refreshShopData();
    }, [refreshShopData]);

    const fetchMoreProducts = async () => {
        if (!hasMore || isFetchingMore) return;
        setIsFetchingMore(true);
        try {
            const nextPage = page + 1;
            const res = await apiFetch(`/api/products?page=${nextPage}&limit=${PAGE_SIZE}`);
            setProducts(prev => [...prev, ...(res.data || [])]);
            setHasMore(res.meta?.hasMore || false);
            setPage(nextPage);
        } catch (error) {
            console.error("Error fetching more products:", error);
        } finally {
            setIsFetchingMore(false);
        }
    };

    const addProduct = async (product: Omit<Product, 'id'>) => {
        await apiFetch('/api/admin/products', { method: 'POST', body: JSON.stringify(product) });
        refreshShopData();
    };

    const deleteProduct = async (id: string) => {
        await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
        refreshShopData();
    };

    const updateProduct = async (id: string, updates: Partial<Product>) => {
        await apiFetch(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
        refreshShopData();
    };

    const addOrder = async (order: Order) => {
        // Now handled by Cloudflare API
        const savedOrder = await apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(order) });
        return savedOrder.data;
    };

    return (
        <ShopContext.Provider value={{
            products,
            marketingSettings,
            loading,
            hasMore,
            fetchMoreProducts,
            refreshShopData,
            addProduct,
            deleteProduct,
            updateProduct,
            addOrder,
            syncShopToCloudflare
        }}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShop = () => {
    const context = useContext(ShopContext);
    if (!context) throw new Error('useShop must be used within a ShopProvider');
    return context;
};

