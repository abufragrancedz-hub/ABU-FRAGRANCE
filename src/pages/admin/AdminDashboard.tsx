import { FC, FormEvent, useEffect, useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { apiFetch } from '../../lib/apiClient';
import { Order, Product } from '../../types';
import { AdminLayout } from './components/AdminLayout';
import { DashboardHome } from './views/DashboardHome';
import { OrdersView } from './views/OrdersView';
import { ProductsView } from './views/ProductsView';
import { SettingsView } from './views/SettingsView';

export const AdminDashboard: FC = () => {
    const { products, addProduct, deleteProduct, updateProduct, loading, syncShopToCloudflare } = useShop();
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'settings'>('dashboard');
    const [isProductSaving, setIsProductSaving] = useState(false);
    const [ordersPage, setOrdersPage] = useState(1);
    const [hasMoreOrders, setHasMoreOrders] = useState(true);

    const ORDERS_PAGE_SIZE = 50;

    // Fetch Orders from Cloudflare
    const fetchOrders = async (showLoading = true, isLoadMore = false) => {
        if (showLoading && !isLoadMore) setOrdersLoading(true);
        try {
            const fetchPage = isLoadMore ? ordersPage + 1 : 1;
            // Added ?t= timestamp to bypass any server/browser cache
            const res = await apiFetch(`/api/admin/orders?page=${fetchPage}&limit=${ORDERS_PAGE_SIZE}&t=${Date.now()}`);
            
            if (isLoadMore) {
                setOrders(prev => [...prev, ...(res.data || [])]);
            } else {
                setOrders(res.data || []);
            }

            setOrdersPage(fetchPage);
            setHasMoreOrders(res.meta?.hasMore || false);
            
            return res.data || [];
        } catch (error: any) {
            console.error("Cloudflare Orders API Error:", error);
            if (error.message.includes("401")) {
                alert("Session expired. Please log in again.");
            }
            return [];
        } finally {
            if (showLoading) setOrdersLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateOrder = async (id: string, updates: Partial<Order>) => {
        try {
            // Optimistically update local state
            setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
            
            // Only status updates are handled via this generic update in AdminDashboard 
            // Delivery changes are done explicitly via OrdersView now. 
            // We just send the status if it's there.
            if (updates.status) {
                await apiFetch(`/api/admin/orders/${id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: updates.status })
                });
            }
        } catch (error) {
            console.error("Error updating order: ", error);
            alert("Failed to update order");
            // Revert optimistically changed state (ideally, though simple reload works)
            fetchOrders(false);
        }
    };

    const deleteOrder = async (id: string) => {
        try {
            // Optimistically remove from local state
            setOrders(prev => prev.filter(o => o.id !== id));
            await apiFetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
        } catch (error) {
            console.error("Error deleting order:", error);
            fetchOrders(false);
        }
    };

    const handleSaveProduct = async (e: FormEvent, productData: Partial<Product>) => {
        e.preventDefault();

        // Improved validation
        if (!productData.name?.trim()) {
            alert("Product name is required.");
            return;
        }
        if (productData.price === undefined || productData.price < 0) {
            alert("Please enter a valid price.");
            return;
        }

        setIsProductSaving(true);
        try {
            const dbProduct = {
                name: productData.name.trim(),
                description: productData.description || '',
                price: Number(productData.price),
                category: productData.category || 'General',
                image: productData.image || 'https://via.placeholder.com/300',
                images: productData.images || [],
                sizes: productData.sizes || [],
                isPromo: productData.isPromo || false,
                oldPrice: productData.oldPrice ? Number(productData.oldPrice) : 0,
                freeDelivery: productData.freeDelivery || false,
                deliveryCompany: productData.deliveryCompany || 'anderson',
                stopDeskEnabled: productData.stopDeskEnabled || false
            };

            if (productData.id) {
                await updateProduct(productData.id, dbProduct);
                alert("Product updated successfully!");
            } else {
                await addProduct(dbProduct as Product);
                alert("Product created successfully!");
            }
        } catch (error: any) {
            console.error("Error saving product:", error);
            alert(`Failed to save product: ${error.message || "Unknown error"}`);
        } finally {
            setIsProductSaving(false);
        }
    };

    return (
        <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
            {ordersLoading && !orders.length ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-8 h-8 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {activeTab === 'dashboard' && <DashboardHome orders={orders} products={products} />}

                    {activeTab === 'orders' && (
                        <OrdersView
                            orders={orders}
                            updateOrder={updateOrder}
                            deleteOrder={deleteOrder}
                            refreshOrders={() => fetchOrders(false)}
                            hasMore={hasMoreOrders}
                            onLoadMore={() => fetchOrders(false, true)}
                        />
                    )}

                    {activeTab === 'products' && (
                        <ProductsView
                            products={products}
                            deleteProduct={deleteProduct}
                            saveProduct={handleSaveProduct}
                            syncShopToCloudflare={syncShopToCloudflare}
                            isSaving={loading || isProductSaving}
                        />
                    )}

                    {activeTab === 'settings' && <SettingsView />}
                </>
            )}
        </AdminLayout>
    );
};
