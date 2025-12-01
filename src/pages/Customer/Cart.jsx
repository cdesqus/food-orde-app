import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import CustomerLayout from '../../layouts/CustomerLayout';
import { MapPin, Trash, Plus, Minus, CreditCard, QrCode, Wallet } from 'lucide-react';

const Cart = () => {
    const { shelters, placeOrder, currentUser } = useApp();
    const [cartItems, setCartItems] = useState([]);
    const [selectedShelter, setSelectedShelter] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('wallet'); // wallet, qr, bank
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const items = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(items);
    }, []);

    const updateCart = (newItems) => {
        setCartItems(newItems);
        localStorage.setItem('cart', JSON.stringify(newItems));
    };

    const handleQuantity = (id, delta) => {
        const newItems = cartItems.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        });
        updateCart(newItems);
    };

    const handleRemove = (id) => {
        const newItems = cartItems.filter(item => item.id !== id);
        updateCart(newItems);
    };

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = () => {
        if (!selectedShelter) return alert('Please select a delivery pinpoint!');
        if (cartItems.length === 0) return alert('Your cart is empty!');
        setShowPaymentModal(true);
    };

    const confirmPayment = () => {
        const res = placeOrder(cartItems, selectedShelter, notes, paymentMethod);
        if (res.success) {
            alert('Order placed successfully!');
            localStorage.removeItem('cart');
            setCartItems([]);
            navigate('/profile');
        } else {
            alert('Failed: ' + res.message);
        }
        setShowPaymentModal(false);
    };

    return (
        <CustomerLayout>
            <div style={{ padding: '20px', paddingBottom: '100px' }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Your Cart</h1>

                {cartItems.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '2rem' }}>Cart is empty.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {cartItems.map(item => (
                            <div key={item.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
                                <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <h3 style={{ fontSize: '1rem' }}>{item.name}</h3>
                                        <button onClick={() => handleRemove(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-hot-pink)' }}>
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                    <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>Rp {item.price.toLocaleString()}</p>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                        <button onClick={() => handleQuantity(item.id, -1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--color-border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Minus size={14} />
                                        </button>
                                        <span style={{ fontSize: '0.9rem' }}>{item.quantity}</span>
                                        <button onClick={() => handleQuantity(item.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--color-primary)', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {cartItems.length > 0 && (
                    <>
                        <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Order Notes</h3>
                            <textarea
                                placeholder="Add notes (e.g., extra spicy, no onions)..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', outline: 'none', minHeight: '80px' }}
                            />
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={20} color="var(--color-secondary)" /> Delivery Pinpoint
                            </h3>
                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                {shelters.map(shelter => (
                                    <button
                                        key={shelter.id}
                                        onClick={() => setSelectedShelter(shelter.id)}
                                        style={{
                                            padding: '0.8rem 1.2rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: selectedShelter === shelter.id ? '1px solid var(--color-secondary)' : '1px solid var(--color-border)',
                                            background: selectedShelter === shelter.id ? 'rgba(46, 213, 115, 0.1)' : 'var(--color-bg-surface)',
                                            color: 'var(--color-text-main)',
                                            whiteSpace: 'nowrap',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {shelter.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                <span>Total</span>
                                <span style={{ color: 'var(--color-primary)' }}>Rp {total.toLocaleString()}</span>
                            </div>
                            <button onClick={handleCheckout} className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
                                CHECKOUT
                            </button>
                        </div>
                    </>
                )}

                {/* Payment Modal */}
                {showPaymentModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'end', zIndex: 1000 }}>
                        <div style={{ background: 'var(--color-bg-main)', width: '100%', padding: '20px', borderRadius: '20px 20px 0 0', animation: 'slideUp 0.3s' }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Payment Method</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                <button onClick={() => setPaymentMethod('wallet')} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: paymentMethod === 'wallet' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: 'var(--color-bg-surface)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                                    <Wallet color="var(--color-primary)" />
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 'bold' }}>My Wallet</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Balance: Rp {currentUser.balance.toLocaleString()}</div>
                                    </div>
                                </button>
                                <button onClick={() => setPaymentMethod('qr')} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: paymentMethod === 'qr' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: 'var(--color-bg-surface)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                                    <QrCode color="var(--color-text-main)" />
                                    <div style={{ textAlign: 'left', fontWeight: 'bold' }}>QRIS</div>
                                </button>
                                <button onClick={() => setPaymentMethod('bank')} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: paymentMethod === 'bank' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: 'var(--color-bg-surface)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                                    <CreditCard color="var(--color-text-main)" />
                                    <div style={{ textAlign: 'left', fontWeight: 'bold' }}>Bank Transfer</div>
                                </button>
                            </div>

                            <button onClick={confirmPayment} className="btn-primary" style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}>
                                PAY Rp {total.toLocaleString()}
                            </button>
                            <button onClick={() => setShowPaymentModal(false)} style={{ width: '100%', padding: '1rem', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
};

export default Cart;
