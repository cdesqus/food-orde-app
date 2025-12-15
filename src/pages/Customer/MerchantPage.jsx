import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, ShoppingCart, Star, Clock, MapPin } from 'lucide-react';
import FoodCard from '../../components/FoodCard';
import Navbar from '../../components/Navbar';

const MerchantPage = () => {
    const { merchantId } = useParams();
    const { users, foods, showConfirm, getDisplayPrice, isOrderingOpen, showAlert } = useApp();
    const navigate = useNavigate();

    const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));

    const merchant = users.find(u => u.id === merchantId);
    const merchantFoods = foods.filter(f => f.merchantId === merchantId && f.active);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const handleAddToCart = (food) => {
        if (!isOrderingOpen) {
            showAlert('Toko Tutup', 'Order hari ini sudah tutup. Silakan pesan besok pagi jam 08:00.');
            return;
        }

        if (cart.length > 0) {
            const currentMerchantId = cart[0].merchantId;
            if (currentMerchantId !== food.merchantId) {
                showConfirm("Different Merchant", "You can only order from one merchant at a time. Clear current cart and start a new order?", () => {
                    setCart([{ ...food, quantity: 1 }]);
                });
                return;
            }
        }

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === food.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                return [...prevCart, { ...food, quantity: 1 }];
            }
        });
    };

    const handleRemoveFromCart = (food) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === food.id);
            if (existingItem.quantity === 1) {
                return prevCart.filter(item => item.id !== food.id);
            } else {
                return prevCart.map(item =>
                    item.id === food.id ? { ...item, quantity: item.quantity - 1 } : item
                );
            }
        });
    };

    const getQuantity = (foodId) => {
        const item = cart.find(item => item.id === foodId);
        return item ? item.quantity : 0;
    };

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (getDisplayPrice(item.price) * item.quantity), 0);

    if (!merchant) return <div style={{ padding: '20px' }}>Merchant not found</div>;

    if (merchant.status === 'SUSPENDED' || merchant.status === 'PERMANENT_BAN') {
        return (
            <div style={{ padding: '20px', textAlign: 'center', marginTop: '50px' }}>
                <h2 style={{ color: 'var(--color-hot-pink)' }}>Merchant Suspended</h2>
                <p>This merchant is currently suspended and cannot accept orders.</p>
                <button
                    onClick={() => navigate('/customer/home')}
                    className="btn-primary"
                    style={{ marginTop: '20px' }}
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '100px' }}>
            {/* Banner */}
            <div style={{
                height: '200px',
                background: `url(${merchant.photo || 'https://source.unsplash.com/random/800x400/?restaurant'}) center/cover`,
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))',
                    display: 'flex', alignItems: 'flex-end', padding: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', marginRight: 'auto' }}>
                            <ArrowLeft />
                        </button>
                    </div>
                </div>
            </div>

            {/* Merchant Info */}
            <div style={{ padding: '20px', marginTop: '-40px', position: 'relative', zIndex: 10 }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{merchant.name}</h1>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                {merchant.description || 'Serving delicious food since 2024.'}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={14} fill="orange" color="orange" /> 4.8</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> 20 min</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> 1.2 km</span>
                            </div>
                        </div>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%',
                            background: 'var(--color-bg-main)', border: '2px solid var(--color-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)'
                        }}>
                            {merchant.name[0]}
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu */}
            <div style={{ padding: '0 20px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Menu</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem' }}>
                    {merchantFoods.map(food => (
                        <FoodCard
                            key={food.id}
                            food={food}
                            onAdd={handleAddToCart}
                            onRemove={handleRemoveFromCart}
                            quantity={getQuantity(food.id)}
                            disabled={!isOrderingOpen}
                            disabledText="Toko Tutup"
                        />
                    ))}
                </div>
            </div>

            {/* Checkout Bar */}
            {totalItems > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: '85px', // Above Navbar
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '85%',
                    maxWidth: '360px',
                    background: 'linear-gradient(135deg, #2ecc71, #27ae60)', // Fresh Green Gradient
                    borderRadius: '50px', // Pill shape
                    padding: '10px 24px', // Compact padding
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 101,
                    boxShadow: '0 8px 20px rgba(46, 204, 113, 0.3)',
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(4px)'
                }} onClick={() => navigate('/customer/cart')}>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
                        <span style={{ fontWeight: '800', color: 'white', fontSize: '0.95rem' }}>{totalItems} Items</span>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', marginTop: '2px' }}>Rp {totalPrice.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: 'white', fontSize: '0.95rem' }}>
                        Checkout <ShoppingCart size={18} fill="white" />
                    </div>
                </div>
            )}

            <Navbar />
        </div>
    );
};

export default MerchantPage;
