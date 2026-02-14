import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Order } from '../types';
import { db } from '../lib/firebase';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    DocumentData,
    QueryDocumentSnapshot
} from 'firebase/firestore';

interface ShopContextType {
    products: Product[];
    loading: boolean;
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    addOrder: (order: Order) => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Products
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'products'));
            const fetchedProducts = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                ...doc.data(),
                id: doc.id
            })) as Product[];
            setProducts(fetchedProducts);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const addProduct = async (product: Omit<Product, 'id'>) => {
        try {
            await addDoc(collection(db, 'products'), product);
            fetchProducts();
        } catch (error) {
            console.error("Error adding product:", error);
            throw error;
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'products', id));
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    };

    const updateProduct = async (id: string, updates: Partial<Product>) => {
        try {
            const productRef = doc(db, 'products', id);
            await updateDoc(productRef, updates);
            fetchProducts();
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    };

    const addOrder = async (order: Order) => {
        try {
            // Remove any undefined values as Firestore doesn't support them
            const sanitizedOrder = JSON.parse(JSON.stringify(order));

            // Log for debugging
            console.log("Saving sanitized order:", sanitizedOrder);

            await addDoc(collection(db, 'orders'), sanitizedOrder);
        } catch (error) {
            console.error("Error adding order:", error);
            throw error;
        }
    };

    return (
        <ShopContext.Provider value={{
            products,
            loading,
            addProduct,
            deleteProduct,
            updateProduct,
            addOrder
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
