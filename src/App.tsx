import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { Loader2 } from 'lucide-react';

// Lazy load pages for better performance
import { Home } from './pages/Home';
const Products = lazy(() => import('./pages/Products').then(module => ({ default: module.Products })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(module => ({ default: module.ProductDetail })));
import { Success } from './pages/Success';
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then(module => ({ default: module.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" />;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="fixed inset-0 w-full overflow-y-auto overflow-x-hidden bg-gray-50 flex flex-col scroll-smooth overscroll-none">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
);

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
    constructor(props: {children: React.ReactNode}) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("Chunk Load Error caught by boundary:", error, errorInfo);
        // Automatically reload once if it's a chunk error, or just show the UI
        if (error?.message?.includes('fetch dynamically imported module') || error?.name === 'ChunkLoadError') {
            const reloaded = sessionStorage.getItem('chunk_reloaded');
            if (!reloaded) {
                sessionStorage.setItem('chunk_reloaded', 'true');
                window.location.reload();
            }
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Interrupted</h2>
                        <p className="text-gray-600 mb-6">We couldn't load the necessary files. This usually happens on unstable network connections.</p>
                        <button 
                            onClick={() => {
                                sessionStorage.removeItem('chunk_reloaded');
                                window.location.reload();
                            }}
                            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Layout><Home /></Layout>} />
                        <Route path="/products" element={<Layout><Products /></Layout>} />
                        <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
                        <Route path="/success" element={<Layout><Success /></Layout>} />
                        <Route path="/contact" element={<Layout><div className="text-center py-20">Contact Page Placeholder</div></Layout>} />

                        {/* Admin Routes with nested AuthProvider to completely firewall Firebase */}
                        <Route
                            path="/admin/*"
                            element={
                                <AuthProvider>
                                    <Routes>
                                        <Route path="login" element={<AdminLogin />} />
                                        <Route path="dashboard" element={
                                            <ProtectedRoute>
                                                <AdminDashboard />
                                            </ProtectedRoute>
                                        } />
                                    </Routes>
                                </AuthProvider>
                            }
                        />
                    </Routes>
                </Suspense>
            </ErrorBoundary>
        </Router>
    );
}

export default App;
