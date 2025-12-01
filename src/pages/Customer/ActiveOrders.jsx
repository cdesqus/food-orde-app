import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import CustomerLayout from '../../layouts/CustomerLayout';
import { ClipboardList } from 'lucide-react';

const ActiveOrders = () => {
    const { currentUser, orders } = useApp();
    const navigate = useNavigate();

    const activeOrders = orders
        .filter(o => o.customerId === currentUser?.id && ['pending', 'approved', 'cooking', 'delivered_to_shelter'].includes(o.status))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
        <CustomerLayout>
            <div style={{ padding: '20px', paddingBottom: '100px' }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClipboardList color="var(--color-electric-blue)" /> Active Orders
                </h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {activeOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                            <p style={{ marginBottom: '1rem' }}>No active orders right now.</p>
                            <button
                                onClick={() => navigate('/customer')}
                                className="btn-primary"
                                style={{ padding: '0.8rem 1.5rem' }}
                            >
                                Order Food
                            </button>
                        </div>
                    ) : (
                        activeOrders.map(order => (
                            <div
                                key={order.id}
                                className="glass-panel"
                                style={{ padding: '1rem', cursor: 'pointer', transition: 'transform 0.2s', borderLeft: '4px solid var(--color-electric-blue)' }}
                                onClick={() => navigate(`/customer/order/${order.id}`)}
                                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 'bold' }}>Order #{order.id.slice(-4)}</span>
                                    <span style={{
                                        color: 'var(--color-electric-blue)',
                                        textTransform: 'capitalize',
                                        fontWeight: 'bold'
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
            </div>
        </CustomerLayout>
    );
};

export default ActiveOrders;
