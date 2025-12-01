
import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, User } from 'lucide-react';

const Navbar = () => {
    return (
        <nav style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '1rem',
            zIndex: 100,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
            <NavLink to="/customer" end style={({ isActive }) => ({
                color: isActive ? 'var(--color-neon-green)' : 'var(--color-text-muted)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.8rem'
            })}>
                <Home size={24} />
            </NavLink>
            <NavLink to="/customer/cart" style={({ isActive }) => ({
                color: isActive ? 'var(--color-electric-blue)' : 'var(--color-text-muted)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.8rem'
            })}>
                <ShoppingCart size={24} />
            </NavLink>
            <NavLink to="/customer/profile" style={({ isActive }) => ({
                color: isActive ? 'var(--color-hot-pink)' : 'var(--color-text-muted)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.8rem'
            })}>
                <User size={24} />
            </NavLink>
        </nav>
    );
};

export default Navbar;
