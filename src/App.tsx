import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { Loader2 } from 'lucide-react';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Products = lazy(() => import('./pages/Products').then(module => ({ default: module.Products })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(module => ({ default: module.ProductDetail })));
const Success = lazy(() => import('./pages/Success').then(module => ({ default: module.Success })));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then(module => ({ default: module.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
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

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
);

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Layout><Home /></Layout>} />
                    <Route path="/products" element={<Layout><Products /></Layout>} />
                    <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
                    <Route path="/success" element={<Layout><Success /></Layout>} />
                    <Route path="/contact" element={<Layout><div className="text-center py-20">Contact Page Placeholder</div></Layout>} />

                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/dashboard" element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
