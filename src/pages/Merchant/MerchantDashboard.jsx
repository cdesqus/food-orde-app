import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, Edit2, Package, Menu as MenuIcon, LogOut, CheckCircle, BarChart2, Eye, EyeOff, DollarSign, X, MessageCircle, Send, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../../components/Modal';

const compressImage = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
};

const MerchantDashboard = () => {
    const [timeRange, setTimeRange] = useState('week'); // 'week' | 'month' | 'year'
    const { currentUser, logout, foods, addFood, updateFood, deleteFood, orders, updateOrder, users, withdrawals, requestWithdrawal, messages, sendMessage, shelters, showAlert, showConfirm, orderingPhase } = useApp();
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'menu' | 'orders'
    const [showAddFood, setShowAddFood] = useState(false);
    const [editingFood, setEditingFood] = useState(null);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({
        amount: '',
        bankName: '',
        accountNumber: '',
        accountHolder: ''
    });

    // Chat State
    const [showChatModal, setShowChatModal] = useState(false);
    const [activeChatOrder, setActiveChatOrder] = useState(null);
    const [chatMessage, setChatMessage] = useState('');

    // Toast Notification for Completed Orders
    const prevOrdersRef = useRef(orders);

    useEffect(() => {
        const prevOrders = prevOrdersRef.current;
        orders.forEach(order => {
            const prevOrder = prevOrders.find(o => o.id === order.id);
            if (prevOrder && prevOrder.status === 'delivered_to_shelter' && order.status === 'completed' && order.items.some(i => i.merchantId === currentUser.id)) {
                showAlert('Success', `Order #${order.id.slice(-4)} completed by customer. Funds added to balance.`);
            }
        });
        prevOrdersRef.current = orders;
    }, [orders, currentUser.id, showAlert]);

    // Arrived Modal State
    const [showArrivedModal, setShowArrivedModal] = useState(false);
    const [arrivedOrder, setArrivedOrder] = useState(null);
    const [arrivedPhoto, setArrivedPhoto] = useState('');

    // Rejection Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectOrder, setRejectOrder] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    // Form State
    const [foodForm, setFoodForm] = useState({
        name: '',
        price: '',
        description: '',
        category: 'Fast Food',
        photos: [''], // Array of URLs
        active: true
    });

    const myFoods = foods.filter(f => f.merchantId === currentUser.id);

    // Filter orders that contain items from this merchant
    const myOrders = orders.filter(order =>
        order.items && order.items.some(item => item.merchantId === currentUser.id)
    ).sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateB - dateA;
    });

    const handlePrintRecap = () => {
        // Summarize items to cook (Pending + Cooking)
        const relevantOrders = myOrders.filter(o => ['pending', 'cooking'].includes(o.status));
        const itemSummary = {};

        relevantOrders.forEach(order => {
            order.items.filter(i => i.merchantId === currentUser.id).forEach(item => {
                if (itemSummary[item.name]) {
                    itemSummary[item.name] += item.quantity;
                } else {
                    itemSummary[item.name] = item.quantity;
                }
            });
        });

        let summaryText = "DAILY RECAP (Items to Cook):\n\n";
        if (Object.keys(itemSummary).length === 0) {
            summaryText += "No active items to cook.";
        } else {
            Object.entries(itemSummary).forEach(([name, qty]) => {
                summaryText += `- ${name}: ${qty}\n`;
            });
        }

        showAlert('Daily Recap', summaryText);
    };

    const totalSales = myOrders
        .filter(o => !['cancelled', 'rejected'].includes(o.status))
        .reduce((sum, order) => {
            const myItems = order.items.filter(item => item.merchantId === currentUser.id);
            const orderTotal = myItems.reduce((s, item) => s + (item.price * item.quantity), 0);
            return sum + orderTotal;
        }, 0);

    // Calculate Available Balance (Completed Orders - Withdrawals)
    const completedRevenue = myOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => {
            const myItems = order.items.filter(item => item.merchantId === currentUser.id);
            return sum + myItems.reduce((s, item) => s + (item.price * item.quantity), 0);
        }, 0);

    const totalWithdrawn = (withdrawals || [])
        .filter(w => w.merchantId === currentUser.id && (w.status === 'pending' || w.status === 'approved'))
        .reduce((sum, w) => sum + Number(w.amount), 0);

    const availableBalance = completedRevenue - totalWithdrawn;

    const handleWithdrawSubmit = (e) => {
        e.preventDefault();
        const amount = Number(withdrawForm.amount);
        if (amount <= 0 || amount > availableBalance) {
            showAlert('Error', 'Invalid withdrawal amount');
            return;
        }

        const result = requestWithdrawal(amount, {
            bankName: withdrawForm.bankName,
            accountNumber: withdrawForm.accountNumber,
            accountHolder: withdrawForm.accountHolder
        });

        if (result.success) {
            setShowWithdrawModal(false);
            setWithdrawForm({ amount: '', bankName: '', accountNumber: '', accountHolder: '' });
            showAlert('Success', 'Withdrawal request submitted!');
        } else {
            showAlert('Error', result.message);
        }
    };

    // Chart Data Preparation
    const salesData = (() => {
        const now = new Date();
        const data = [];
        const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 12; // 12 months for year

        for (let i = days - 1; i >= 0; i--) {
            let dateLabel = '';
            let dateStart = new Date();
            let dateEnd = new Date();
            let revenue = 0;

            if (timeRange === 'year') {
                dateStart.setMonth(now.getMonth() - i);
                dateStart.setDate(1);
                dateStart.setHours(0, 0, 0, 0);

                dateEnd = new Date(dateStart);
                dateEnd.setMonth(dateStart.getMonth() + 1);

                dateLabel = dateStart.toLocaleString('default', { month: 'short' });
            } else {
                dateStart.setDate(now.getDate() - i);
                dateStart.setHours(0, 0, 0, 0);

                dateEnd = new Date(dateStart);
                dateEnd.setDate(dateStart.getDate() + 1);

                dateLabel = dateStart.toLocaleDateString('default', { day: 'numeric', month: 'short' });
            }

            // Aggregate orders for this period
            const periodOrders = myOrders.filter(o => {
                const orderDate = new Date(o.timestamp);
                return orderDate >= dateStart && orderDate < dateEnd;
            });

            revenue = periodOrders.reduce((sum, order) => {
                const myItems = order.items.filter(item => item.merchantId === currentUser.id);
                return sum + myItems.reduce((s, item) => s + (item.price * item.quantity), 0);
            }, 0);

            data.push({ name: dateLabel, sales: revenue });
        }
        return data;
    })();

    const handlePhotoChange = (idx, value) => {
        const newPhotos = [...foodForm.photos];
        newPhotos[idx] = value;
        setFoodForm({ ...foodForm, photos: newPhotos });
    };

    const addPhotoField = () => {
        if (foodForm.photos.length < 5) {
            setFoodForm({ ...foodForm, photos: [...foodForm.photos, ''] });
        }
    };

    const handleSubmitFood = (e) => {
        e.preventDefault();
        const finalData = {
            ...foodForm,
            price: Number(foodForm.price),
            image: foodForm.photos[0] || '' // Main image is first photo
        };

        if (editingFood) {
            updateFood(editingFood.id, finalData);
            setEditingFood(null);
        } else {
            addFood(finalData);
        }

        setShowAddFood(false);
        setFoodForm({ name: '', price: '', description: '', category: 'Fast Food', photos: [''], active: true });
    };

    const startEdit = (food) => {
        setEditingFood(food);
        setFoodForm({
            name: food.name,
            price: food.price,
            description: food.description,
            category: food.category || 'Fast Food',
            photos: food.photos && food.photos.length > 0 ? food.photos : [food.image],
            active: food.active
        });
        setShowAddFood(true);
        setActiveTab('menu');
    };

    const toggleActive = (food) => {
        updateFood(food.id, { active: !food.active });
    };

    const handleOrderAction = (orderId, action, extraData = {}) => {
        // action: 'accepted' | 'rejected' | 'completed'

        if (action === 'rejected') {
            const order = orders.find(o => o.id === orderId);
            setRejectOrder(order);
            setShowRejectModal(true);
            return;
        }

        // Send message first to ensure status isn't read-only yet
        if (action === 'delivered_to_shelter') {
            sendMessage(orderId, currentUser.id, "Makanan udah sampe di titik jemput nih! Buruan ambil sebelum dingin ya! 📍🏃💨", extraData.proofPhoto);
        }

        updateOrder(orderId, action, extraData);
    };

    const handleConfirmReject = () => {
        if (!rejectOrder || !rejectReason.trim()) return;

        updateOrder(rejectOrder.id, 'cancelled', { rejection_reason: rejectReason });
        setShowRejectModal(false);
        setRejectOrder(null);
        setRejectReason('');
        showAlert('Order Rejected', 'Order has been cancelled.');
    };

    const handleArrivedSubmit = (e) => {
        e.preventDefault();
        if (!arrivedPhoto) {
            showAlert('Error', 'Please upload a photo proof');
            return;
        }
        handleOrderAction(arrivedOrder.id, 'delivered_to_shelter', { proofPhoto: arrivedPhoto });
        setShowArrivedModal(false);
        setArrivedOrder(null);
        setArrivedPhoto('');
    };

    const inputStyle = {
        padding: '10px',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-main)',
        borderRadius: '8px',
        width: '100%'
    };

    const getPhaseBadge = () => {
        if (orderingPhase === 'ORDERING') {
            return (
                <div style={{ background: 'var(--color-hot-pink)', color: 'white', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    🔴 ORDERING PHASE (Incoming)
                </div>
            );
        } else if (orderingPhase === 'COOKING') {
            return (
                <div style={{ background: 'var(--color-neon-green)', color: 'black', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    🟢 COOKING PHASE (Stop Orders)
                </div>
            );
        } else {
            return (
                <div style={{ background: 'var(--color-text-muted)', color: 'white', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    ⚫ CLOSED
                </div>
            );
        }
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
            {/* Header */}
            <header className="glass-panel" style={{
                position: 'sticky', top: 0, zIndex: 100,
                padding: '1rem 20px', margin: '0 0 20px 0', borderRadius: 0,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', fontSize: '1.2rem', overflow: 'hidden'
                    }}>
                        {currentUser.photo ? <img src={currentUser.photo} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : currentUser.name[0]}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.2rem' }}>{currentUser.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Merchant Dashboard</p>
                            {getPhaseBadge()}
                        </div>
                    </div>
                </div>
                <button onClick={logout} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)' }}>
                    <LogOut size={24} />
                </button>
            </header>

            <div style={{ padding: '0 20px' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '20px', overflowX: 'auto' }}>
                    <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'btn-primary' : 'glass-panel'} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', minWidth: '100px' }}>
                        <BarChart2 size={18} /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab('menu')} className={activeTab === 'menu' ? 'btn-primary' : 'glass-panel'} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', minWidth: '100px' }}>
                        <MenuIcon size={18} /> Menu
                    </button>
                    <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'btn-primary' : 'glass-panel'} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', minWidth: '100px' }}>
                        <Package size={18} /> Orders
                    </button>
                </div>

                {/* DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Earnings</h3>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                                    Rp {totalSales.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    (Net Revenue / Pendapatan Bersih)
                                    <div title="Excludes Platform Fees" style={{ cursor: 'help' }}>ⓘ</div>
                                </div>
                            </div>
                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(46, 213, 115, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle color="var(--color-secondary)" />
                            </div>
                        </div>

                        {/* Available Balance & Withdrawal */}
                        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Available Balance</h3>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-neon-green)' }}>
                                    Rp {availableBalance.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>
                                    (Completed Orders Only)
                                </div>
                            </div>
                            <button
                                onClick={() => setShowWithdrawModal(true)}
                                disabled={availableBalance <= 0}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: availableBalance > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: availableBalance > 0 ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <DollarSign size={18} /> Withdraw
                            </button>
                        </div>

                        <div className="glass-panel" style={{ padding: '1.5rem', height: '300px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ marginBottom: '0' }}>Sales Overview</h3>
                                <div style={{ display: 'flex', gap: '5px', background: 'var(--color-bg-main)', padding: '4px', borderRadius: '12px' }}>
                                    {['week', 'month', 'year'].map(range => (
                                        <button
                                            key={range}
                                            onClick={() => setTimeRange(range)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: timeRange === range ? 'var(--color-bg-surface)' : 'transparent',
                                                color: timeRange === range ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                                fontWeight: timeRange === range ? 'bold' : 'normal',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" stroke="var(--color-text-muted)" />
                                    <YAxis stroke="var(--color-text-muted)" />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                                        itemStyle={{ color: 'var(--color-text-main)' }}
                                    />
                                    <Bar dataKey="sales" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* MENU TAB */}
                {activeTab === 'menu' && (
                    <div>
                        <button
                            onClick={() => { setShowAddFood(true); setEditingFood(null); setFoodForm({ name: '', price: '', description: '', category: 'Fast Food', photos: [''], active: true }); }}
                            className="glass-panel"
                            style={{
                                width: '100%', padding: '15px', marginBottom: '20px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                color: 'var(--color-neon-green)', border: '1px dashed var(--color-neon-green)',
                                cursor: 'pointer'
                            }}
                        >
                            <Plus /> Add New Item
                        </button>

                        {/* Food Form Modal */}
                        <Modal
                            isOpen={showAddFood}
                            onClose={() => setShowAddFood(false)}
                            title={editingFood ? 'Edit Item' : 'Add New Item'}
                        >
                            <form onSubmit={handleSubmitFood} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <input placeholder="Item Name" value={foodForm.name} onChange={e => setFoodForm({ ...foodForm, name: e.target.value })} required style={inputStyle} />
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <input placeholder="Net Price (Your Earnings)" type="number" value={foodForm.price} onChange={e => setFoodForm({ ...foodForm, price: e.target.value })} required style={inputStyle} />
                                        {foodForm.price && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                                Customer pays: <span style={{ color: 'var(--color-neon-green)' }}>Rp {(Number(foodForm.price) + Math.floor(Number(foodForm.price) * 0.15)).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                    <select value={foodForm.category} onChange={e => setFoodForm({ ...foodForm, category: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                                        <option>Fast Food</option>
                                        <option>Drinks</option>
                                        <option>Dessert</option>
                                        <option>Main Course</option>
                                        <option>Snacks</option>
                                    </select>
                                </div>
                                <textarea placeholder="Description" value={foodForm.description} onChange={e => setFoodForm({ ...foodForm, description: e.target.value })} style={{ ...inputStyle, minHeight: '80px' }} />

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Photos (Max 5)</label>
                                    {foodForm.photos.map((photo, idx) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                handlePhotoChange(idx, reader.result);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}
                                                />
                                                {idx > 0 && (
                                                    <button type="button" onClick={() => {
                                                        const newPhotos = foodForm.photos.filter((_, i) => i !== idx);
                                                        setFoodForm({ ...foodForm, photos: newPhotos });
                                                    }} style={{ background: 'transparent', border: 'none', color: 'var(--color-hot-pink)' }}>
                                                        <Trash2 size={20} />
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>OR URL:</span>
                                                <input
                                                    placeholder="https://..."
                                                    value={photo}
                                                    onChange={e => handlePhotoChange(idx, e.target.value)}
                                                    style={{ ...inputStyle, flex: 1 }}
                                                />
                                            </div>
                                            {photo && (
                                                <img src={photo} alt="Preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginTop: '5px' }} />
                                            )}
                                        </div>
                                    ))}
                                    {foodForm.photos.length < 5 && (
                                        <button type="button" onClick={addPhotoField} style={{ fontSize: '0.9rem', color: 'var(--color-primary)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Plus size={16} /> Add another photo
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingFood ? 'Update Item' : 'Add Item'}</button>
                                </div>
                            </form>
                        </Modal>

                        <div style={{ display: 'grid', gap: '15px' }}>
                            {myFoods.map(food => (
                                <div key={food.id} className="glass-panel" style={{ padding: '15px', display: 'flex', gap: '15px', opacity: food.active ? 1 : 0.6 }}>
                                    <img src={food.image || 'https://via.placeholder.com/100'} alt={food.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <h3 style={{ fontSize: '1.1rem' }}>{food.name}</h3>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button onClick={() => toggleActive(food)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: food.active ? 'var(--color-neon-green)' : 'var(--color-text-muted)' }}>
                                                    {food.active ? <Eye size={20} /> : <EyeOff size={20} />}
                                                </button>
                                                <button onClick={() => startEdit(food)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-electric-blue)' }}>
                                                    <Edit2 size={20} />
                                                </button>
                                                <button onClick={() => {
                                                    showConfirm('Delete Item', 'Are you sure you want to delete this item?', () => {
                                                        deleteFood(food.id);
                                                    });
                                                }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-hot-pink)' }}>
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                        <span style={{ color: 'var(--color-neon-green)' }}>Rp {food.price.toLocaleString()}</span>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: '5px 0' }}>{food.description}</p>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{food.photos?.length || 1} photos</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                            <button
                                onClick={handlePrintRecap}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'var(--color-electric-blue)',
                                    color: 'black',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                <ClipboardList size={18} /> Print Daily Recap
                            </button>
                        </div>

                        {myOrders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                                No orders yet.
                            </div>
                        ) : (
                            myOrders.map(order => {
                                const customer = users.find(u => u.id === order.customerId);
                                return (
                                    <div key={order.id} className="glass-panel" style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>#{order.id.slice(-6)}</span>
                                                <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{customer?.name || 'Unknown Customer'}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{
                                                    color: ['completed', 'cooking', 'accepted', 'delivered_to_shelter'].includes(order.status) ? 'var(--color-neon-green)' :
                                                        order.status === 'pending' ? 'var(--color-electric-blue)' :
                                                            ['cancelled', 'rejected'].includes(order.status) ? 'var(--color-hot-pink)' : 'white',
                                                    fontWeight: 'bold', display: 'block', marginBottom: '4px'
                                                }}>
                                                    {order.status.toUpperCase().replace(/_/g, ' ')}
                                                </span>
                                                {/* Location Display */}
                                                {(() => {
                                                    const shelter = shelters.find(s => s.id === order.shelterId);
                                                    return shelter ? (
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-hot-pink)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                                            📍 {shelter.name}
                                                        </div>
                                                    ) : null;
                                                })()}
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '0.9rem', marginBottom: '5px', color: 'var(--color-text-muted)' }}>Customer Note:</div>
                                            <div style={{ fontStyle: 'italic' }}>&quot;{order.notes || 'No notes'}&quot;</div>
                                        </div>

                                        {['cancelled', 'rejected'].includes(order.status) && order.rejection_reason && (
                                            <div style={{ marginBottom: '10px', background: 'rgba(255, 0, 0, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-hot-pink)' }}>
                                                <div style={{ fontSize: '0.9rem', marginBottom: '5px', color: 'var(--color-hot-pink)', fontWeight: 'bold' }}>Rejection Reason:</div>
                                                <div style={{ fontStyle: 'italic', color: 'var(--color-text-main)' }}>&quot;{order.rejection_reason}&quot;</div>
                                            </div>
                                        )}

                                        <div style={{ marginBottom: '10px' }}>
                                            {order.items.filter(item => item.merchantId === currentUser.id).map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '5px' }}>
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <span>Rp {(item.price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Payment: {order.paymentMethod.toUpperCase()}</div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-secondary)' }}>
                                                    Your Earnings: Rp {order.items.filter(item => item.merchantId === currentUser.id).reduce((s, item) => s + (item.price * item.quantity), 0).toLocaleString()}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                    (Customer Total: Rp {order.total.toLocaleString()})
                                                </div>

                                                {/* Chat Button */}
                                                {['cooking', 'delivered_to_shelter'].includes(order.status) && (
                                                    <button
                                                        onClick={() => { setActiveChatOrder(order); setShowChatModal(true); }}
                                                        style={{
                                                            marginTop: '10px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)',
                                                            padding: '6px 12px', borderRadius: '15px', color: 'var(--color-text-main)', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', position: 'relative'
                                                        }}
                                                    >
                                                        <MessageCircle size={16} /> Chat with Customer
                                                        {(() => {
                                                            const orderMsgs = messages.filter(m => m.orderId === order.id);
                                                            const lastMsg = orderMsgs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                                                            if (lastMsg && lastMsg.senderId !== currentUser.id) {
                                                                return (
                                                                    <span style={{
                                                                        position: 'absolute', top: '-5px', right: '-5px',
                                                                        width: '10px', height: '10px', borderRadius: '50%',
                                                                        background: 'red', border: '1px solid white'
                                                                    }} />
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </button>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {order.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleOrderAction(order.id, 'rejected')} style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid var(--color-hot-pink)', background: 'transparent', color: 'var(--color-hot-pink)', cursor: 'pointer' }}>Reject</button>
                                                        <button onClick={() => handleOrderAction(order.id, 'cooking')} style={{ padding: '8px 12px', borderRadius: '20px', border: 'none', background: 'var(--color-neon-green)', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}>Accept & Cook</button>
                                                    </>
                                                )}
                                                {order.status === 'cooking' && (
                                                    <button onClick={() => {
                                                        setArrivedOrder(order);
                                                        setShowArrivedModal(true);
                                                    }} style={{ padding: '8px 12px', borderRadius: '20px', border: 'none', background: 'var(--color-electric-blue)', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}>Mark Arrived at Shelter</button>
                                                )}
                                                {order.status === 'delivered_to_shelter' && (
                                                    <span style={{ padding: '8px 12px', borderRadius: '20px', background: 'rgba(255, 193, 7, 0.2)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                        Waiting for Customer Confirmation
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Withdrawal Modal */}
            <Modal
                isOpen={showWithdrawModal}
                onClose={() => setShowWithdrawModal(false)}
                title="Withdraw Funds"
            >
                <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(46, 213, 115, 0.1)', borderRadius: '12px', border: '1px solid var(--color-neon-green)' }}>
                    <div style={{ fontSize: '0.9rem', color: '#004d00' }}>Available to Withdraw</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#006400' }}>Rp {availableBalance.toLocaleString()}</div>
                </div>

                <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Amount</label>
                        <input
                            type="number"
                            placeholder="Enter amount"
                            value={withdrawForm.amount}
                            onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                            max={availableBalance}
                            min={10000}
                            required
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Bank Name</label>
                        <input
                            type="text"
                            placeholder="e.g. BCA, Mandiri"
                            value={withdrawForm.bankName}
                            onChange={e => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                            required
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Account Number</label>
                        <input
                            type="text"
                            placeholder="1234567890"
                            value={withdrawForm.accountNumber}
                            onChange={e => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                            required
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Account Holder Name</label>
                        <input
                            type="text"
                            placeholder="Name on account"
                            value={withdrawForm.accountHolder}
                            onChange={e => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })}
                            required
                            style={inputStyle}
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                        Submit Request
                    </button>
                </form>
            </Modal>

            {/* Chat Modal */}
            {activeChatOrder && (
                <Modal
                    isOpen={showChatModal}
                    onClose={() => { setShowChatModal(false); setActiveChatOrder(null); }}
                    title={`Chat - Order #${activeChatOrder.id.slice(-4)}`}
                >
                    <div style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                        <div className="thin-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', marginBottom: '15px' }}>
                            {messages.filter(m => m.orderId === activeChatOrder.id).length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#004d00', marginTop: '20px' }}>No messages yet.</div>
                            ) : (
                                messages.filter(m => m.orderId === activeChatOrder.id).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map(msg => {
                                    const isMe = msg.senderId === currentUser.id;
                                    return (
                                        <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                                            <div style={{
                                                background: isMe ? 'var(--color-primary)' : '#333',
                                                color: 'white',
                                                padding: '8px 12px', borderRadius: '12px',
                                                border: isMe ? 'none' : '1px solid #ccc',
                                                fontSize: '0.9rem',
                                                fontWeight: 'normal'
                                            }}>
                                                {msg.image && (
                                                    <img src={msg.image} alt="Attachment" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '5px' }} />
                                                )}
                                                {msg.text}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#004d00', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div style={{ padding: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                                {[
                                    "Pesanan siap diproses! Ditunggu ya 🔥🍳",
                                    "Lagi dimasak penuh cinta nih, sabar ya! 👨‍🍳✨",
                                    "Sebentar lagi matang, siap-siap ya! 🚀"
                                ].map((text, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            sendMessage(activeChatOrder.id, currentUser.id, text);
                                        }}
                                        style={{
                                            whiteSpace: 'nowrap',
                                            padding: '6px 12px',
                                            borderRadius: '15px',
                                            border: '1px solid var(--color-primary)',
                                            background: 'white',
                                            color: '#004d00',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            flexShrink: 0
                                        }}
                                    >
                                        {text}
                                    </button>
                                ))}
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (!chatMessage.trim()) return;
                                sendMessage(activeChatOrder.id, currentUser.id, chatMessage);
                                setChatMessage('');
                            }} style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={chatMessage}
                                    onChange={e => setChatMessage(e.target.value)}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ccc',
                                        background: 'white', color: 'black', outline: 'none'
                                    }}
                                />
                                <button type="submit" style={{
                                    width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                                    background: 'var(--color-primary)', color: 'black', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div >
                </Modal >
            )}

            {/* Arrived Photo Modal */}
            <Modal
                isOpen={showArrivedModal}
                onClose={() => { setShowArrivedModal(false); setArrivedOrder(null); setArrivedPhoto(''); }}
                title="Proof of Arrival 📸"
            >
                <p style={{ fontSize: '0.9rem', color: '#004d00', marginBottom: '20px' }}>
                    Please upload a photo of the food at the shelter to notify the customer.
                </p>

                <form onSubmit={handleArrivedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ padding: '20px', border: '2px dashed var(--color-primary)', borderRadius: '12px', textAlign: 'center' }}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    try {
                                        const compressed = await compressImage(file);
                                        setArrivedPhoto(compressed);
                                    } catch (error) {
                                        console.error("Compression error:", error);
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setArrivedPhoto(reader.result);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }
                            }}
                            style={{ display: 'none' }}
                            id="arrived-photo-input"
                        />
                        <label htmlFor="arrived-photo-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#004d00' }}>
                            {arrivedPhoto ? (
                                <img src={arrivedPhoto} alt="Proof" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                            ) : (
                                <>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(57, 255, 20, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Plus color="var(--color-primary)" />
                                    </div>
                                    <span>Tap to upload photo</span>
                                </>
                            )}
                        </label>
                    </div>

                    <button type="submit" className="btn-primary">
                        Notify Customer
                    </button>
                </form>
            </Modal>

            {/* Rejection Modal */}
            <Modal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title="Reject Order"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Please provide a reason for rejecting this order. This will be visible to the customer and admin.
                    </p>
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g., Out of stock, Closing soon..."
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--color-text-main)',
                            minHeight: '100px',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                            onClick={() => setShowRejectModal(false)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                background: 'transparent',
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmReject}
                            disabled={!rejectReason.trim()}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: rejectReason.trim() ? 'var(--color-hot-pink)' : 'gray',
                                color: 'white',
                                cursor: rejectReason.trim() ? 'pointer' : 'not-allowed',
                                fontWeight: 'bold'
                            }}
                        >
                            Confirm Reject
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
};

export default MerchantDashboard;
