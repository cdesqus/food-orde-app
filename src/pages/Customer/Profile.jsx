import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import CustomerLayout from '../../layouts/CustomerLayout';
import { Wallet, Clock, LogOut } from 'lucide-react';

const Profile = () => {
    const { currentUser, orders, topUp, logout, showAlert } = useApp();
    const navigate = useNavigate();
    const [topUpAmount, setTopUpAmount] = useState('');

    const handleTopUp = (e) => {
        e.preventDefault();
        if (!topUpAmount) return;
        topUp(parseInt(topUpAmount));
        setTopUpAmount('');
        showAlert('Success', 'Top up successful!');
    };

    const myOrders = orders.filter(o => o.customerId === currentUser?.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
        <CustomerLayout>
            <div style={{ padding: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-main)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                        {currentUser?.name.charAt(0)}
                    </div>
                    <h1 style={{ fontSize: '1.5rem' }}>{currentUser?.name}</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>{currentUser?.email}</p>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Wallet color="var(--color-neon-green)" /> Balance
                    </h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-neon-green)', marginBottom: '1rem' }}>
                        Rp {currentUser?.balance.toLocaleString()}
                    </div>
                    <form onSubmit={handleTopUp} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="number"
                            placeholder="Amount"
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '0.8rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-surface)',
                                color: 'var(--color-text-main)',
                                outline: 'none'
                            }}
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '0.8rem 1.5rem' }}>Top Up</button>
                    </form>
                </div>

                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Clock color="var(--color-electric-blue)" /> Order History
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {myOrders.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)' }}>No orders yet.</p>
                    ) : (
                        myOrders.map(order => (
                            <div
                                key={order.id}
                                className="glass-panel"
                                style={{ padding: '1rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                                onClick={() => navigate(`/customer/order/${order.id}`)}
                                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 'bold' }}>Order #{order.id.slice(-4)}</span>
                                    <span style={{
                                        color: order.status === 'pending' ? 'orange' :
                                            order.status === 'completed' ? 'var(--color-neon-green)' :
                                                order.status === 'rejected' ? 'var(--color-hot-pink)' : 'var(--color-electric-blue)',
                                        textTransform: 'capitalize'
                                    }}>{order.status.replace(/_/g, ' ')}</span>
                                </div>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    {new Date(order.timestamp).toLocaleString()}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{order.items.length} items</span>
                                    <span style={{ fontWeight: 'bold' }}>Rp {order.total.toLocaleString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <button
                    onClick={logout}
                    style={{
                        marginTop: '3rem',
                        width: '100%',
                        padding: '1rem',
                        background: 'rgba(255, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 0, 0, 0.3)',
                        color: 'red',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                >
                    <LogOut size={20} /> Logout
                </button>
            </div>
        </CustomerLayout>
    );
};

export default Profile;
