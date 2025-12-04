import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import CustomerLayout from '../../layouts/CustomerLayout';
import { Wallet, Clock, LogOut } from 'lucide-react';

const Profile = () => {
    const { currentUser, orders, topUp, logout, showAlert, dorms, rooms, updateUser } = useApp();
    const navigate = useNavigate();
    const [topUpAmount, setTopUpAmount] = useState('');
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [newLocation, setNewLocation] = useState({ dormId: currentUser?.dormId || '', roomId: currentUser?.roomId || '' });

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

                    {/* Dorm Info */}
                    {currentUser?.role === 'customer' && (
                        <div style={{ marginTop: '1rem', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'inline-block' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '5px' }}>Current Location</div>
                            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                                {dorms.find(d => d.id === currentUser.dormId)?.name || 'Unknown Dorm'}
                                <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                                Room {rooms.find(r => r.id === currentUser.roomId)?.room_number || '??'}
                                <button
                                    onClick={() => setShowLocationModal(true)}
                                    style={{ background: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '5px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer', marginLeft: '10px' }}
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Location Edit Modal */}
                {showLocationModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="glass-panel" style={{ padding: '2rem', width: '90%', maxWidth: '400px' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Update Location</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <select
                                    value={newLocation.dormId}
                                    onChange={(e) => setNewLocation({ ...newLocation, dormId: e.target.value, roomId: '' })}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                >
                                    <option value="">Select Dorm</option>
                                    {dorms.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <select
                                    value={newLocation.roomId}
                                    onChange={(e) => setNewLocation({ ...newLocation, roomId: e.target.value })}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                    disabled={!newLocation.dormId}
                                >
                                    <option value="">Select Room</option>
                                    {rooms.filter(r => r.dormId === newLocation.dormId).map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}
                                </select>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button onClick={() => setShowLocationModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                                    <button onClick={() => {
                                        if (newLocation.dormId && newLocation.roomId) {
                                            updateUser(currentUser.id, { dormId: newLocation.dormId, roomId: newLocation.roomId });
                                            setShowLocationModal(false);
                                            showAlert('Success', 'Location updated!');
                                        }
                                    }} className="btn-primary" style={{ flex: 1 }}>Save</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
