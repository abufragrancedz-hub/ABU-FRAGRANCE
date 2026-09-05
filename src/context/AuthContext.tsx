import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: () => void;

        const initAuth = async () => {
            try {
                // Dynamically import to keep it out of the main bundle and not block rendering
                const { auth } = await import('../lib/firebase');
                const { onAuthStateChanged } = await import('firebase/auth');

                unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                    setUser(currentUser);
                    setLoading(false);
                });
            } catch (error) {
                console.error("Failed to initialize Firebase Auth dynamically:", error);
                setLoading(false);
            }
        };

        // Small delay to ensure main UI thread has time to render
        const timer = setTimeout(initAuth, 1000);

        return () => {
            clearTimeout(timer);
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const { auth } = await import('../lib/firebase');
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (error: any) {
            console.error("Login Error:", error);
            return false;
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            const { auth } = await import('../lib/firebase');
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            await createUserWithEmailAndPassword(auth, email, password);
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    };

    const logout = async () => {
        try {
            const { auth } = await import('../lib/firebase');
            const { signOut } = await import('firebase/auth');
            await signOut(auth);
        } catch (error: any) {
            console.error("Logout Error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, signUp, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
