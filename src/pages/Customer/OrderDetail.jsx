import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import CustomerLayout from '../../layouts/CustomerLayout';
import { ArrowLeft, Send, ClipboardList, ChefHat, MapPin, CheckCircle, Lock } from 'lucide-react';

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { orders, messages, sendMessage, currentUser, shelters, users, showAlert, updateOrder } = useApp();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const order = orders.find(o => o.id === orderId);
    const merchant = users.find(u => u.id === order?.items[0]?.merchantId);
    const shelter = shelters.find(s => s.id === order?.shelterId);

    const orderMessages = messages.filter(m => m.orderId === orderId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [orderMessages]);

    if (!order) return <div style={{ padding: '20px', color: 'white' }}>Order not found</div>;

    // Status Logic
    const steps = [
        { id: 'pending', label: 'Order Placed', icon: ClipboardList },
        { id: 'cooking', label: 'In the Kitchen', icon: ChefHat },
        { id: 'delivered_to_shelter', label: 'Arrived', icon: MapPin },
        { id: 'completed', label: 'Completed', icon: CheckCircle },
    ];

    const getCurrentStepIndex = () => {
        if (order.status === 'rejected') return -1;
        return steps.findIndex(s => s.id === order.status);
    };

    const currentStepIndex = getCurrentStepIndex();

    // Chat Logic
    const isChatActive = ['cooking'].includes(order.status); // Only active during cooking? User said: "APPROVED or COOKING". My status is 'cooking'.
    // User said: "Termination: Once status becomes COMPLETED or ARRIVED... chat must become Read-Only"
    // So 'delivered_to_shelter' and 'completed' are read-only. 'pending' is disabled.

    const canChat = ['cooking'].includes(order.status);
    // Wait, user said: "Activation: ... updates to 'APPROVED' or 'COOKING'". 
    // My 'cooking' status covers this.
    // "Before this (e.g. 'PENDING'), the chat is disabled." -> Correct.

    const isChatReadOnly = ['delivered_to_shelter', 'completed', 'rejected'].includes(order.status);
    const isChatDisabled = order.status === 'pending';

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const res = sendMessage(orderId, currentUser.id, newMessage);
        if (res.success) {
            setNewMessage('');
        } else {
            showAlert('Error', res.message);
        }
    };

    return (
        <CustomerLayout>
            <div style={{ padding: '20px', paddingBottom: '100px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-neon-green)' }}>
                        <ArrowLeft />
                    </button>
                    <h1 style={{ fontSize: '1.2rem', margin: 0 }}>Order #{order.id.slice(-4)}</h1>
                </div>

                {/* Tracker */}
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--color-text-muted)' }}>Order Status</h3>

                    {order.status === 'rejected' ? (
                        <div style={{ color: 'var(--color-hot-pink)', fontWeight: 'bold', textAlign: 'center' }}>
                            Order Rejected
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                            {/* Connecting Line */}
                            <div style={{
                                position: 'absolute', top: '20px', left: '10%', right: '10%', height: '2px',
                                background: 'rgba(255,255,255,0.1)', zIndex: 0
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%`,
                                    background: 'var(--color-neon-green)',
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>

                            {steps.map((step, idx) => {
                                const isActive = idx <= currentStepIndex;
                                const isCurrent = idx === currentStepIndex;
                                const Icon = step.icon;

                                return (
                                    <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1, position: 'relative' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            background: isActive ? 'var(--color-neon-green)' : 'var(--color-text-muted)',
                                            border: 'none',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white',
                                            transition: 'all 0.3s ease',
                                            boxShadow: isCurrent ? '0 0 15px var(--color-neon-green)' : 'none'
                                        }}>
                                            <Icon size={20} />
                                        </div>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                            fontWeight: isActive ? 'bold' : 'normal',
                                            textAlign: 'center',
                                            maxWidth: '60px'
                                        }}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Arrived State Special UI */}
                    {order.status === 'delivered_to_shelter' && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(46, 213, 115, 0.1)', borderRadius: '12px', border: '1px solid var(--color-neon-green)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '50px', height: '50px', background: 'var(--color-neon-green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: 'var(--color-neon-green)' }}>Your food is waiting!</div>
                                    <div style={{ fontSize: '0.9rem' }}>At: {shelter?.name} ({shelter?.detail})</div>
                                </div>
                            </div>
                            <button
                                onClick={() => updateOrder(order.id, 'completed')}
                                className="btn-primary"
                                style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <CheckCircle size={20} /> Order Received / Pesanan Diterima
                            </button>
                        </div>
                    )}
                </div>

                {/* Chat Section */}
                <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)' }}>
                        <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Chat with {merchant?.name}
                            {isChatReadOnly && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'var(--color-text-muted)', color: 'black' }}>Read Only</span>}
                        </h3>
                    </div>

                    <div className="thin-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {orderMessages.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '2rem', fontSize: '0.9rem' }}>
                                {isChatDisabled ? 'Chat will open when order is approved.' : 'No messages yet.'}
                            </div>
                        ) : (
                            orderMessages.map(msg => {
                                const isMe = msg.senderId === currentUser.id;
                                return (
                                    <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                                        <div style={{
                                            background: isMe ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                                            color: isMe ? 'white' : 'var(--color-text-main)',
                                            padding: '8px 12px', borderRadius: '12px',
                                            border: isMe ? 'none' : '1px solid var(--color-border)',
                                            fontSize: '0.9rem'
                                        }}>
                                            {msg.image && (
                                                <img src={msg.image} alt="Attachment" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '5px', display: 'block' }} />
                                            )}
                                            {msg.text}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)' }}>
                        {isChatReadOnly ? (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Lock size={14} /> Order completed/arrived. Chat session closed.
                            </div>
                        ) : isChatDisabled ? (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                Waiting for merchant to accept order...
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                                    {[
                                        "Pesanan sudah sesuai ya, Kak! 😋👍",
                                        "Gak sabar mau makan nih! 🤤",
                                        "Ditunggu ya, semangat masaknya! 🔥"
                                    ].map((text, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                sendMessage(order.id, currentUser.id, text);
                                            }}
                                            style={{
                                                whiteSpace: 'nowrap',
                                                padding: '6px 12px',
                                                borderRadius: '15px',
                                                border: '1px solid var(--color-border)',
                                                background: 'var(--color-bg-surface)',
                                                color: 'var(--color-text-main)',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                flexShrink: 0
                                            }}
                                        >
                                            {text}
                                        </button>
                                    ))}
                                </div>
                                <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid var(--color-border)',
                                            background: 'white', color: '#333', outline: 'none'
                                        }}
                                    />
                                    <button type="submit" style={{
                                        width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                                        background: 'var(--color-primary)', color: 'white', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Send size={18} />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
};

export default OrderDetail;
