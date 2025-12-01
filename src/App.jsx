import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import CustomerHome from './pages/Customer/Home';
import Cart from './pages/Customer/Cart';
import MerchantPage from './pages/Customer/MerchantPage';
import CustomerProfile from './pages/Customer/Profile';
import MerchantDashboard from './pages/Merchant/MerchantDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser } = useApp();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        // Redirect based on role
        if (currentUser.role === 'merchant') return <Navigate to="/merchant" replace />;
        if (currentUser.role === 'admin') return <Navigate to="/admin" replace />;
        return <Navigate to="/customer" replace />;
    }

    return children;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer Routes */}
            <Route path="/customer" element={
                <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerHome />
                </ProtectedRoute>
            } />
            <Route path="/customer/cart" element={
                <ProtectedRoute allowedRoles={['customer']}>
                    <Cart />
                </ProtectedRoute>
            } />
            <Route path="/customer/merchant/:id" element={
                <ProtectedRoute allowedRoles={['customer']}>
                    <MerchantPage />
                </ProtectedRoute>
            } />
            <Route path="/customer/profile" element={
                <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerProfile />
                </ProtectedRoute>
            } />

            {/* Merchant Routes */}
            <Route path="/merchant" element={
                <ProtectedRoute allowedRoles={['merchant']}>
                    <MerchantDashboard />
                </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AppProvider>
            <ToastProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </ToastProvider>
        </AppProvider>
    );
}

export default App;
