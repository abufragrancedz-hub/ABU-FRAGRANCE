import { useState, useEffect, FC, FormEvent } from 'react';
import { useShop } from '../../context/ShopContext';
import { db } from '../../lib/firebase';
import {
    collection,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    QueryDocumentSnapshot,
    DocumentData,
    QuerySnapshot
} from 'firebase/firestore';
import { Order, Product } from '../../types';
import { AdminLayout } from './components/AdminLayout';
import { DashboardHome } from './views/DashboardHome';
import { OrdersView } from './views/OrdersView';
import { ProductsView } from './views/ProductsView';
import { SettingsView } from './views/SettingsView';

export const AdminDashboard: FC = () => {
    const { products, addProduct, deleteProduct, updateProduct, loading } = useShop();
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'settings'>('dashboard');
    const [isProductSaving, setIsProductSaving] = useState(false);

    // Fetch Orders in real-time
    useEffect(() => {
        const q = query(collection(db, 'orders'), orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
            const fetchedOrders = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                ...doc.data(),
                id: doc.id
            })) as Order[];
            setOrders(fetchedOrders);
        }, (error: any) => {
            console.error("Firestore Orders Listener Error:", error);
            // Help diagnose 400 errors
            if (error.message.includes("400")) {
                alert("Database Connection Error: Please check if your Firebase Project is active or if your computer clock is correct.");
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchOrders = async () => {
        // Handled by onSnapshot
    };

    const updateOrder = async (id: string, updates: Partial<Order>) => {
        try {
            const orderRef = doc(db, 'orders', id);
            await updateDoc(orderRef, updates);
            fetchOrders();
        } catch (error) {
            console.error("Error updating order: ", error);
            alert("Failed to update order");
        }
    };

    const deleteOrder = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            try {
                await deleteDoc(doc(db, 'orders', id));
                fetchOrders();
            } catch (error) {
                console.error("Error deleting order:", error);
            }
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
                oldPrice: productData.oldPrice ? Number(productData.oldPrice) : 0
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
            {activeTab === 'dashboard' && <DashboardHome orders={orders} products={products} />}

            {activeTab === 'orders' && (
                <OrdersView
                    orders={orders}
                    updateOrder={updateOrder}
                    deleteOrder={deleteOrder}
                />
            )}

            {activeTab === 'products' && (
                <ProductsView
                    products={products}
                    deleteProduct={deleteProduct}
                    saveProduct={handleSaveProduct}
                    isSaving={loading || isProductSaving}
                />
            )}

            {activeTab === 'settings' && <SettingsView />}
        </AdminLayout>
    );
};
