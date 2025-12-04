import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, CheckCircle, BarChart2, Plus, LogOut, TrendingUp, DollarSign, ShoppingBag, Activity, MapPin, Edit, Trash2, Key, X, FileText, Download, Home, Building, ClipboardList, Menu, ChevronLeft, ChevronRight, Eye, Fingerprint, Info } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import ConfirmationModal from '../../components/ConfirmationModal';
import Modal from '../../components/Modal';

const AdminDashboard = () => {
    const { currentUser, logout, users, toggleUserStatus, createUser, updateUser, deleteUser, orders, updateOrder, shelters, addShelter, updateShelter, deleteShelter, dorms, rooms, addDorm, updateDorm, deleteDorm, addRoom, updateRoom, deleteRoom } = useApp();
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'verification' | 'users' | 'locations' | 'dorms' | 'reports'
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'admin' });

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        isAlert: false
    });

    const showConfirm = (title, message, onConfirm) => {
        setModal({ isOpen: true, title, message, onConfirm, isAlert: false });
    };

    const showAlert = (title, message) => {
        setModal({ isOpen: true, title, message, onConfirm: () => setModal(prev => ({ ...prev, isOpen: false })), isAlert: true });
    };

    const [userFilter, setUserFilter] = useState('all'); // 'all' | 'merchant' | 'customer' | 'admin'
    const [timeRange, setTimeRange] = useState('week'); // 'week' | 'month' | 'year'
    const [newShelterName, setNewShelterName] = useState('');
    const [newShelterDetail, setNewShelterDetail] = useState('');
    const [newShelterOpen, setNewShelterOpen] = useState('08:00');
    const [newShelterClose, setNewShelterClose] = useState('20:00');

    // Edit User State
    const [editingUser, setEditingUser] = useState(null);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [editUserForm, setEditUserForm] = useState({ name: '', email: '', password: '', dormId: '', roomId: '' });

    // Edit Shelter State
    const [editingShelter, setEditingShelter] = useState(null);
    const [showEditShelterModal, setShowEditShelterModal] = useState(false);
    const [editShelterForm, setEditShelterForm] = useState({ name: '', detail: '', opening_time: '', closing_time: '' });

    // Report State
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Dorm Management State
    const [selectedDormId, setSelectedDormId] = useState('');
    const [newDormName, setNewDormName] = useState('');
    const [newDormArea, setNewDormArea] = useState('');
    const [newRoomNumber, setNewRoomNumber] = useState('');
    const [editingDorm, setEditingDorm] = useState(null);
    const [showEditDormModal, setShowEditDormModal] = useState(false);
    const [editDormForm, setEditDormForm] = useState({ name: '', location_area: '' });
    const [editingRoom, setEditingRoom] = useState(null);
    const [showEditRoomModal, setShowEditRoomModal] = useState(false);
    const [editRoomForm, setEditRoomForm] = useState({ room_number: '' });

    // Order Monitor State
    const [orderMonitorTab, setOrderMonitorTab] = useState('in_progress'); // 'in_progress' | 'at_shelter' | 'history'
    const [viewingStudent, setViewingStudent] = useState(null);
    const [showStudentModal, setShowStudentModal] = useState(false);

    // Fingerprint Verification State
    const [showFingerprintModal, setShowFingerprintModal] = useState(false);
    const [fingerprintStatus, setFingerprintStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'
    const [fingerprintOrder, setFingerprintOrder] = useState(null);

    const handleFingerprintScan = () => {
        if (fingerprintStatus !== 'idle') return;
        setFingerprintStatus('scanning');
        // Simulate scanning delay
        setTimeout(() => {
            setFingerprintStatus('success');
            // Simulate verification success and update
            setTimeout(() => {
                if (fingerprintOrder) {
                    updateOrder(fingerprintOrder.id, 'completed');
                    setShowFingerprintModal(false);
                    setFingerprintStatus('idle');
                    setFingerprintOrder(null);
                    showAlert('Verified', 'Student verified and order completed.');
                }
            }, 1000);
        }, 2000);
    };



    const pendingMerchants = users.filter(u => u.role === 'merchant' && !u.approved);
    const pendingCustomers = users.filter(u => u.role === 'customer' && !u.approved);

    // All users except current admin
    const allUsers = users.filter(u => u.id !== currentUser.id);

    const filteredUsers = useMemo(() => {
        if (userFilter === 'all') return allUsers;
        return allUsers.filter(u => u.role === userFilter);
    }, [userFilter, allUsers]);

    // Stats
    const totalUsers = users.length;
    const totalMerchants = users.filter(u => u.role === 'merchant' && u.approved).length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    // Chart Data Aggregation
    const chartData = useMemo(() => {
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
            const periodOrders = orders.filter(o => {
                const orderDate = new Date(o.timestamp);
                return orderDate >= dateStart && orderDate < dateEnd;
            });

            revenue = periodOrders.reduce((sum, o) => sum + o.total, 0);
            data.push({ name: dateLabel, revenue });
        }
        return data;
    }, [orders, timeRange]);

    // Top Merchants Logic
    const topMerchants = useMemo(() => {
        const merchantSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!merchantSales[item.merchantId]) {
                    merchantSales[item.merchantId] = 0;
                }
                merchantSales[item.merchantId] += item.price * item.quantity;
            });
        });

        return Object.entries(merchantSales)
            .map(([id, sales]) => {
                const merchant = users.find(u => u.id === id);
                return { name: merchant?.name || 'Unknown', sales };
            })
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);
    }, [orders, users]);

    const handleAddUser = (e) => {
        e.preventDefault();
        const result = createUser(newUserForm);
        if (result.success) {
            setShowAddUser(false);
            setNewUserForm({ name: '', email: '', password: '', role: 'admin' });
            showAlert('Success', 'User added successfully!');
        } else {
            showAlert('Error', result.message);
        }
    };

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const menuItems = [
        {
            section: 'MAIN',
            items: [{ id: 'dashboard', label: 'Dashboard', icon: BarChart2 }]
        },
        {
            section: 'OPERATIONS',
            items: [
                { id: 'orders', label: 'Order Monitor', icon: ClipboardList },
                { id: 'verification', label: 'Verification', icon: CheckCircle, badge: pendingMerchants.length + pendingCustomers.length }
            ]
        },
        {
            section: 'MASTER DATA',
            items: [
                { id: 'users', label: 'User List', icon: Users },
                { id: 'dorms', label: 'Dorm Management', icon: Home },
                { id: 'locations', label: 'Locations', icon: MapPin }
            ]
        },
        {
            section: 'ANALYTICS',
            items: [{ id: 'reports', label: 'Reports', icon: FileText }]
        }
    ];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--color-bg-main)', color: 'var(--color-text-main)' }}>
            {/* Sidebar */}
            <aside style={{
                width: isSidebarOpen ? '260px' : '80px',
                background: '#ffffff',
                borderRight: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s ease',
                position: 'fixed',
                height: '100vh',
                zIndex: 100,
                color: '#1f2937'
            }}>
                {/* Sidebar Header */}
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', borderBottom: '1px solid #e5e7eb' }}>
                    {isSidebarOpen && <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>ADMIN</h1>}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                        {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Menu Items */}
                <div className="thin-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 10px' }}>
                    {menuItems.map((section, idx) => (
                        <div key={idx} style={{ marginBottom: '20px' }}>
                            {isSidebarOpen && <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '10px', paddingLeft: '10px', fontWeight: 'bold' }}>{section.section}</div>}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {section.items.map(item => {
                                    const isActive = activeTab === item.id;
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                                                gap: '12px',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                background: isActive ? 'rgba(46, 213, 115, 0.1)' : 'transparent',
                                                color: isActive ? 'var(--color-primary)' : '#4b5563',
                                                border: 'none',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                transition: 'all 0.2s',
                                                width: '100%'
                                            }}
                                            title={!isSidebarOpen ? item.label : ''}
                                        >
                                            {isActive && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '4px', height: '20px', background: 'var(--color-primary)', borderRadius: '0 4px 4px 0' }} />}
                                            <Icon size={20} />
                                            {isSidebarOpen && <span style={{ fontSize: '0.9rem', fontWeight: isActive ? '600' : 'normal' }}>{item.label}</span>}
                                            {item.badge > 0 && (
                                                <span style={{
                                                    position: isSidebarOpen ? 'relative' : 'absolute',
                                                    top: isSidebarOpen ? 'auto' : '5px',
                                                    right: isSidebarOpen ? 'auto' : '5px',
                                                    marginLeft: isSidebarOpen ? 'auto' : 0,
                                                    background: 'var(--color-hot-pink)',
                                                    color: 'white',
                                                    fontSize: '0.7rem',
                                                    padding: '2px 6px',
                                                    borderRadius: '10px',
                                                    minWidth: '18px',
                                                    textAlign: 'center'
                                                }}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sidebar Footer */}
                <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb' }}>
                    <button onClick={logout} style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'flex-start' : 'center', gap: '10px', width: '100%', background: 'rgba(255, 71, 87, 0.1)', color: 'var(--color-hot-pink)', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                        <LogOut size={20} />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                marginLeft: isSidebarOpen ? '260px' : '80px',
                padding: '30px',
                transition: 'margin-left 0.3s ease',
                width: '100%'
            }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                        {menuItems.flatMap(s => s.items).find(i => i.id === activeTab)?.label}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold' }}>{currentUser.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Administrator</div>
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                            {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(39, 174, 96, 0.1)', color: 'var(--color-primary)' }}>
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Total Users</h3>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalUsers}</div>
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.1)', color: 'var(--color-secondary)' }}>
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Active Merchants</h3>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalMerchants}</div>
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(241, 196, 15, 0.1)', color: 'var(--color-accent)' }}>
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Total Orders</h3>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalOrders}</div>
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(39, 174, 96, 0.1)', color: 'var(--color-primary)' }}>
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Total Revenue</h3>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rp {totalRevenue.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <TrendingUp size={20} /> Revenue Trend
                                    </h2>
                                    <div style={{ display: 'flex', gap: '10px', background: 'var(--color-bg-main)', padding: '5px', borderRadius: '20px' }}>
                                        {['week', 'month', 'year'].map(range => (
                                            <button
                                                key={range}
                                                onClick={() => setTimeRange(range)}
                                                style={{
                                                    padding: '5px 15px',
                                                    borderRadius: '15px',
                                                    border: 'none',
                                                    background: timeRange === range ? 'var(--color-bg-surface)' : 'transparent',
                                                    color: timeRange === range ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                                    fontWeight: timeRange === range ? 'bold' : 'normal',
                                                    cursor: 'pointer',
                                                    boxShadow: timeRange === range ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                                                    textTransform: 'capitalize'
                                                }}
                                            >
                                                1 {range}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ height: '300px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} tickFormatter={(value) => `Rp ${value / 1000}k`} />
                                            <Tooltip
                                                contentStyle={{ background: 'var(--color-bg-surface)', border: 'none', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                                formatter={(value) => [`Rp ${value.toLocaleString()}`, 'Revenue']}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Revenue per Merchant Chart */}
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <BarChart2 size={20} /> Revenue per Merchant
                                </h2>
                                <div style={{ height: '300px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topMerchants} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                                contentStyle={{ background: 'var(--color-bg-surface)', border: 'none', borderRadius: '10px' }}
                                                formatter={(value) => [`Rp ${value.toLocaleString()}`, 'Sales']}
                                            />
                                            <Bar dataKey="sales" fill="var(--color-secondary)" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            {/* Recent Activity */}
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Recent Activity</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {orders.slice().reverse().slice(0, 5).map(order => {
                                        const customer = users.find(u => u.id === order.customerId);
                                        const merchant = users.find(u => u.id === order.items[0]?.merchantId);
                                        return (
                                            <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingBottom: '10px', borderBottom: '1px solid var(--color-border)' }}>
                                                <div style={{ padding: '10px', borderRadius: '50%', background: 'var(--color-bg-main)', color: 'var(--color-primary)' }}>
                                                    <ShoppingBag size={16} />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                        {customer?.name || 'User'} ordered from {merchant?.name || 'Merchant'}
                                                    </p>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(order.timestamp).toLocaleString()}</p>
                                                </div>
                                                <div style={{ marginLeft: 'auto', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                                    +Rp {order.total.toLocaleString()}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {orders.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No recent activity.</p>}
                                </div>
                            </div>

                            {/* Top Merchants List */}
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Top Merchants Leaderboard</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {topMerchants.map((merchant, index) => (
                                        <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontWeight: 'bold', color: 'var(--color-text-muted)', width: '20px' }}>{index + 1}</span>
                                                <span style={{ fontWeight: '500' }}>{merchant.name}</span>
                                            </div>
                                            <div style={{ fontWeight: 'bold' }}>Rp {merchant.sales.toLocaleString()}</div>
                                        </div>
                                    ))}
                                    {topMerchants.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No data available.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ORDER MONITOR TAB */}
                {activeTab === 'orders' && (
                    <section>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Order Monitor</h2>

                        {/* Sub-tabs */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <button
                                onClick={() => setOrderMonitorTab('in_progress')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--color-border)',
                                    background: orderMonitorTab === 'in_progress' ? 'var(--color-primary)' : 'transparent',
                                    color: orderMonitorTab === 'in_progress' ? 'black' : 'var(--color-text-main)',
                                    cursor: 'pointer',
                                    fontWeight: orderMonitorTab === 'in_progress' ? 'bold' : 'normal'
                                }}
                            >
                                In Progress
                            </button>
                            <button
                                onClick={() => setOrderMonitorTab('at_shelter')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--color-border)',
                                    background: orderMonitorTab === 'at_shelter' ? 'var(--color-primary)' : 'transparent',
                                    color: orderMonitorTab === 'at_shelter' ? 'black' : 'var(--color-text-main)',
                                    cursor: 'pointer',
                                    fontWeight: orderMonitorTab === 'at_shelter' ? 'bold' : 'normal'
                                }}
                            >
                                At Shelter
                            </button>
                            <button
                                onClick={() => setOrderMonitorTab('history')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--color-border)',
                                    background: orderMonitorTab === 'history' ? 'var(--color-primary)' : 'transparent',
                                    color: orderMonitorTab === 'history' ? 'black' : 'var(--color-text-main)',
                                    cursor: 'pointer',
                                    fontWeight: orderMonitorTab === 'history' ? 'bold' : 'normal'
                                }}
                            >
                                History
                            </button>
                        </div>

                        <div className="glass-panel" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                        <th style={{ padding: '15px' }}>Order ID</th>
                                        <th style={{ padding: '15px' }}>Time Elapsed</th>
                                        <th style={{ padding: '15px' }}>Merchant</th>
                                        <th style={{ padding: '15px' }}>Customer</th>
                                        <th style={{ padding: '15px' }}>Location</th>
                                        <th style={{ padding: '15px' }}>Status</th>
                                        <th style={{ padding: '15px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders
                                        .filter(order => {
                                            if (orderMonitorTab === 'in_progress') return ['pending', 'approved', 'cooking'].includes(order.status);
                                            if (orderMonitorTab === 'at_shelter') return order.status === 'delivered_to_shelter';
                                            if (orderMonitorTab === 'history') return ['completed', 'cancelled', 'rejected'].includes(order.status);
                                            return false;
                                        })
                                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                        .map(order => {
                                            const merchant = users.find(u => u.id === order.items[0]?.merchantId);
                                            const customer = users.find(u => u.id === order.customerId);
                                            const shelter = shelters.find(s => s.id === order.shelterId);

                                            // Time Elapsed Logic
                                            const orderTime = new Date(order.timestamp);
                                            const now = new Date();
                                            const diffMs = now - orderTime;
                                            const diffMins = Math.floor(diffMs / 60000);
                                            const diffHours = Math.floor(diffMins / 60);

                                            const isOverdue = orderMonitorTab === 'at_shelter' && diffHours >= 1;

                                            return (
                                                <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)', background: isOverdue ? 'rgba(255, 0, 0, 0.1)' : 'transparent' }}>
                                                    <td style={{ padding: '15px' }}>#{order.id.slice(-4)}</td>
                                                    <td style={{ padding: '15px' }}>
                                                        {diffHours > 0 ? `${diffHours}h ${diffMins % 60}m` : `${diffMins}m`} ago
                                                        {isOverdue && <span style={{ marginLeft: '5px', color: 'red', fontWeight: 'bold', fontSize: '0.8rem' }}>⚠️ Overdue</span>}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>{merchant?.name || 'Unknown'}</td>
                                                    <td style={{ padding: '15px' }}>
                                                        <div
                                                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                                            onClick={() => {
                                                                setViewingStudent(customer);
                                                                setShowStudentModal(true);
                                                            }}
                                                        >
                                                            <span style={{ textDecoration: 'underline', color: 'var(--color-electric-blue)', fontWeight: 'bold' }}>{customer?.name || 'Unknown'}</span>
                                                            <Eye size={14} color="var(--color-electric-blue)" />
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>NIS: {customer?.email.split('@')[0]}</div>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>{shelter?.name || 'Unknown'}</td>
                                                    <td style={{ padding: '15px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{
                                                                padding: '4px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold',
                                                                background: order.status === 'delivered_to_shelter' ? 'var(--color-accent)' :
                                                                    order.status === 'completed' ? 'var(--color-neon-green)' :
                                                                        ['cancelled', 'rejected'].includes(order.status) ? 'var(--color-hot-pink)' :
                                                                            'var(--color-electric-blue)',
                                                                color: 'black'
                                                            }}>
                                                                {order.status.replace(/_/g, ' ').toUpperCase()}
                                                            </span>
                                                            {['cancelled', 'rejected'].includes(order.status) && order.rejection_reason && (
                                                                <div className="tooltip-container" style={{ position: 'relative', cursor: 'pointer' }}>
                                                                    <Info size={18} color="var(--color-hot-pink)" />
                                                                    <div className="tooltip-text" style={{
                                                                        position: 'absolute',
                                                                        bottom: '100%',
                                                                        left: '50%',
                                                                        transform: 'translateX(-50%)',
                                                                        background: 'rgba(0,0,0,0.9)',
                                                                        color: 'white',
                                                                        padding: '8px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.8rem',
                                                                        width: '200px',
                                                                        zIndex: 10,
                                                                        marginBottom: '5px',
                                                                        display: 'none'
                                                                    }}>
                                                                        Reason: {order.rejection_reason}
                                                                    </div>
                                                                    <style>{`
                                                                        .tooltip-container:hover .tooltip-text {
                                                                            display: block !important;
                                                                        }
                                                                    `}</style>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        {orderMonitorTab === 'at_shelter' && (
                                                            <button
                                                                onClick={() => {
                                                                    setFingerprintOrder(order);
                                                                    setFingerprintStatus('idle');
                                                                    setShowFingerprintModal(true);
                                                                }}
                                                                className="btn-primary"
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    fontSize: '0.8rem',
                                                                    background: 'var(--color-electric-blue)',
                                                                    border: 'none',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px',
                                                                    color: 'white'
                                                                }}
                                                            >
                                                                <Fingerprint size={16} />
                                                                Scan Fingerprint
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    {orders.filter(order => {
                                        if (orderMonitorTab === 'in_progress') return ['pending', 'approved', 'cooking'].includes(order.status);
                                        if (orderMonitorTab === 'at_shelter') return order.status === 'delivered_to_shelter';
                                        if (orderMonitorTab === 'history') return ['completed', 'cancelled', 'rejected'].includes(order.status);
                                        return false;
                                    }).length === 0 && (
                                            <tr>
                                                <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                    No orders found in this category.
                                                </td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        </div>

                        {/* Student Details Modal */}
                        <Modal
                            isOpen={showStudentModal}
                            onClose={() => setShowStudentModal(false)}
                            title="Student Details"
                        >
                            {viewingStudent && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', padding: '10px' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'white', boxShadow: '0 4px 15px rgba(46, 213, 115, 0.3)' }}>
                                        {viewingStudent.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 style={{ fontSize: '1.4rem', color: 'var(--color-text-main)' }}>{viewingStudent.name}</h3>

                                    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>NIS</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{viewingStudent.email.split('@')[0]}</div>
                                        </div>
                                        <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Contact</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', wordBreak: 'break-all' }}>{viewingStudent.email}</div>
                                        </div>
                                        <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Dormitory (Asrama)</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-electric-blue)' }}>
                                                {(dorms && dorms.find(d => d.id === viewingStudent.dormId)?.name) || '-'}
                                            </div>
                                        </div>
                                        <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Room (Kamar)</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-electric-blue)' }}>
                                                {(rooms && rooms.find(r => r.id === viewingStudent.roomId)?.room_number) || '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Modal>
                    </section>
                )}

                {/* VERIFICATION TAB */}
                {activeTab === 'verification' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <section>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Pending Merchants ({pendingMerchants.length})</h2>
                            {pendingMerchants.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>No pending merchants.</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {pendingMerchants.map(user => (
                                        <div key={user.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1rem' }}>{user.name}</h3>
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{user.email}</p>
                                            </div>
                                            <button
                                                onClick={() => toggleUserStatus(user.id, true)}
                                                className="btn-primary"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Pending Customers ({pendingCustomers.length})</h2>
                            {pendingCustomers.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>No pending customers.</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {pendingCustomers.map(user => (
                                        <div key={user.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1rem' }}>{user.name}</h3>
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{user.email}</p>
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                                    {(dorms && dorms.find(d => d.id === user.dormId)?.name) || 'No Dorm'} - {(rooms && rooms.find(r => r.id === user.roomId)?.room_number) || 'No Room'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => toggleUserStatus(user.id, true)}
                                                className="btn-primary"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.2rem' }}>User Management</h2>
                            <button
                                onClick={() => setShowAddUser(!showAddUser)}
                                style={{
                                    background: 'var(--color-primary)',
                                    color: 'black',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontWeight: 'bold'
                                }}
                            >
                                <Plus size={16} /> Add User
                            </button>
                        </div>

                        {/* Filter Categories */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            {['All', 'Merchant', 'Customer', 'Admin', 'Finance'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setUserFilter(filter.toLowerCase())}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        border: '1px solid var(--color-border)',
                                        background: userFilter === filter.toLowerCase() ? 'var(--color-primary)' : 'transparent',
                                        color: userFilter === filter.toLowerCase() ? 'black' : 'var(--color-text-main)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: userFilter === filter.toLowerCase() ? 'bold' : 'normal'
                                    }}
                                >
                                    {filter}s
                                </button>
                            ))}
                        </div>

                        {showAddUser && (
                            <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', border: '1px solid var(--color-primary)' }}>
                                <h3 style={{ marginBottom: '15px' }}>Add New User</h3>
                                <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            placeholder="Name"
                                            value={newUserForm.name}
                                            onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                            required
                                            style={{ flex: 1, padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', borderRadius: '8px' }}
                                        />
                                        <select
                                            value={newUserForm.role}
                                            onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', borderRadius: '8px' }}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="finance">Finance</option>
                                        </select>
                                    </div>
                                    <input
                                        placeholder="Email"
                                        type="email"
                                        value={newUserForm.email}
                                        onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                        required
                                        style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', borderRadius: '8px' }}
                                    />
                                    <input
                                        placeholder="Password"
                                        type="password"
                                        value={newUserForm.password}
                                        onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                        required
                                        style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', borderRadius: '8px' }}
                                    />
                                    <button type="submit" className="btn-primary">Create User</button>
                                </form>
                            </div>
                        )}

                        <div style={{ display: 'grid', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
                            {filteredUsers.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>No users found in this category.</p>
                            ) : (
                                filteredUsers.map(user => (
                                    <div key={user.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: user.approved ? 1 : 0.7 }}>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {user.name}
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    background: user.role === 'admin' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                                                    color: user.role === 'admin' ? 'black' : 'white',
                                                    fontWeight: user.role === 'admin' ? 'bold' : 'normal'
                                                }}>
                                                    {user.role.toUpperCase()}
                                                </span>
                                            </h3>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{user.email}</p>
                                            {user.role === 'customer' && (
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                                    {(dorms && dorms.find(d => d.id === user.dormId)?.name) || 'No Dorm'} - {(rooms && rooms.find(r => r.id === user.roomId)?.room_number) || 'No Room'}
                                                </p>
                                            )}
                                            <p style={{ fontSize: '0.8rem', color: user.approved ? 'var(--color-neon-green)' : 'var(--color-hot-pink)' }}>
                                                Status: {user.approved ? 'Active' : 'Banned/Pending'}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => {
                                                    setEditingUser(user);
                                                    setEditUserForm({ name: user.name, email: user.email, password: user.password, dormId: user.dormId || '', roomId: user.roomId || '' });
                                                    setShowEditUserModal(true);
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--color-electric-blue)', cursor: 'pointer' }}
                                                title="Edit User"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => toggleUserStatus(user.id, !user.approved)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    fontSize: '0.8rem',
                                                    background: 'transparent',
                                                    border: `1px solid ${user.approved ? 'var(--color-hot-pink)' : 'var(--color-neon-green)'}`,
                                                    color: user.approved ? 'var(--color-hot-pink)' : 'var(--color-neon-green)',
                                                    borderRadius: '20px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {user.approved ? 'Ban' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    showConfirm(
                                                        'Delete User',
                                                        `Are you sure you want to delete ${user.name}? This cannot be undone.`,
                                                        () => {
                                                            deleteUser(user.id);
                                                            setModal(prev => ({ ...prev, isOpen: false }));
                                                        }
                                                    );
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--color-hot-pink)', cursor: 'pointer' }}
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {/* Edit User Modal */}
                        <Modal
                            isOpen={showEditUserModal}
                            onClose={() => setShowEditUserModal(false)}
                            title="Edit User"
                        >
                            {editingUser && (
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    updateUser(editingUser.id, editUserForm);
                                    setShowEditUserModal(false);
                                    showAlert('Success', 'User updated successfully!');
                                }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Name</label>
                                        <input
                                            value={editUserForm.name}
                                            onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', color: 'black' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Email</label>
                                        <input
                                            value={editUserForm.email}
                                            onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', color: 'black' }}
                                        />
                                    </div>
                                    {editingUser.role === 'customer' && (
                                        <>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Dormitory (Asrama)</label>
                                                <select
                                                    value={editUserForm.dormId}
                                                    onChange={e => setEditUserForm({ ...editUserForm, dormId: e.target.value, roomId: '' })}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', color: 'black' }}
                                                >
                                                    <option value="">Select Dorm</option>
                                                    {dorms && dorms.map(dorm => (
                                                        <option key={dorm.id} value={dorm.id}>{dorm.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Room Number (No. Kamar)</label>
                                                <select
                                                    value={editUserForm.roomId}
                                                    onChange={e => setEditUserForm({ ...editUserForm, roomId: e.target.value })}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', color: 'black' }}
                                                    disabled={!editUserForm.dormId}
                                                >
                                                    <option value="">Select Room</option>
                                                    {rooms && rooms
                                                        .filter(room => room.dormId === editUserForm.dormId)
                                                        .map(room => (
                                                            <option key={room.id} value={room.id}>{room.room_number}</option>
                                                        ))}
                                                </select>
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Password (Reset)</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Key size={16} color="#006400" />
                                            <input
                                                value={editUserForm.password}
                                                onChange={e => setEditUserForm({ ...editUserForm, password: e.target.value })}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', color: 'black' }}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Save Changes</button>
                                </form>
                            )}
                        </Modal>
                    </section>
                )}

                {/* LOCATIONS TAB */}
                {activeTab === 'locations' && (
                    <section>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Master Data: Pin Points</h2>

                        {/* Add Location Form */}
                        <div className="glass-panel" style={{ padding: '20px', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Add New Location</h3>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (newShelterName.trim()) {
                                        addShelter(newShelterName, newShelterDetail, newShelterOpen, newShelterClose);
                                        setNewShelterName('');
                                        setNewShelterDetail('');
                                        setNewShelterOpen('08:00');
                                        setNewShelterClose('20:00');
                                    }
                                }}
                                style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}
                            >
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <input
                                        type="text"
                                        placeholder="Location Name"
                                        value={newShelterName}
                                        onChange={(e) => setNewShelterName(e.target.value)}
                                        style={{
                                            flex: 2,
                                            padding: '10px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-surface)',
                                            color: 'var(--color-text-main)',
                                            minWidth: '200px'
                                        }}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Detail"
                                        value={newShelterDetail}
                                        onChange={(e) => setNewShelterDetail(e.target.value)}
                                        style={{
                                            flex: 3,
                                            padding: '10px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-surface)',
                                            color: 'var(--color-text-main)',
                                            minWidth: '200px'
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                        <input
                                            type="time"
                                            value={newShelterOpen}
                                            onChange={(e) => setNewShelterOpen(e.target.value)}
                                            style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                        />
                                        <span>-</span>
                                        <input
                                            type="time"
                                            value={newShelterClose}
                                            onChange={(e) => setNewShelterClose(e.target.value)}
                                            style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                        />
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ padding: '0 20px' }}>
                                        <Plus size={18} /> Add
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Locations List */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {shelters.map(shelter => (
                                <div key={shelter.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ padding: '10px', background: 'var(--color-bg-main)', borderRadius: '50%', color: 'var(--color-primary)' }}>
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{shelter.name}</div>
                                            {shelter.detail && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{shelter.detail}</div>}
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-secondary)', marginTop: '2px' }}>
                                                Open: {shelter.opening_time || '08:00'} - {shelter.closing_time || '20:00'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => {
                                                setEditingShelter(shelter);
                                                setEditShelterForm({
                                                    name: shelter.name,
                                                    detail: shelter.detail || '',
                                                    opening_time: shelter.opening_time || '08:00',
                                                    closing_time: shelter.closing_time || '20:00'
                                                });
                                                setShowEditShelterModal(true);
                                            }}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--color-electric-blue)', cursor: 'pointer' }}
                                            title="Edit Location"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                showConfirm(
                                                    'Delete Location',
                                                    'Are you sure you want to delete this location?',
                                                    () => {
                                                        deleteShelter(shelter.id);
                                                        setModal(prev => ({ ...prev, isOpen: false }));
                                                    }
                                                );
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--color-hot-pink)',
                                                cursor: 'pointer',
                                                padding: '5px'
                                            }}
                                            title="Delete Location"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Edit Shelter Modal */}
                        <Modal
                            isOpen={showEditShelterModal}
                            onClose={() => setShowEditShelterModal(false)}
                            title="Edit Location"
                        >
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                updateShelter(editingShelter.id, editShelterForm);
                                setShowEditShelterModal(false);
                                showAlert('Success', 'Location updated successfully!');
                            }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Location Name</label>
                                    <input
                                        value={editShelterForm.name}
                                        onChange={e => setEditShelterForm({ ...editShelterForm, name: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', color: 'black' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Detail</label>
                                    <input
                                        value={editShelterForm.detail}
                                        onChange={e => setEditShelterForm({ ...editShelterForm, detail: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', color: 'black' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Opening Time</label>
                                        <input
                                            type="time"
                                            value={editShelterForm.opening_time}
                                            onChange={e => setEditShelterForm({ ...editShelterForm, opening_time: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', color: 'black' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Closing Time</label>
                                        <input
                                            type="time"
                                            value={editShelterForm.closing_time}
                                            onChange={e => setEditShelterForm({ ...editShelterForm, closing_time: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', color: 'black' }}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Save Changes</button>
                            </form>
                        </Modal>
                    </section>
                )}

                {/* DORMS TAB */}
                {activeTab === 'dorms' && (
                    <section>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Dorm & Room Management</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            {/* Dorms Section */}
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Building size={18} /> Dormitories
                                </h3>

                                {/* Add Dorm */}
                                <div className="glass-panel" style={{ padding: '15px', marginBottom: '1rem' }}>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        if (newDormName) {
                                            addDorm(newDormName, newDormArea);
                                            setNewDormName('');
                                            setNewDormArea('');
                                        }
                                    }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input
                                            placeholder="Dorm Name (e.g. Asrama A)"
                                            value={newDormName}
                                            onChange={e => setNewDormName(e.target.value)}
                                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                            required
                                        />
                                        <input
                                            placeholder="Area (e.g. North)"
                                            value={newDormArea}
                                            onChange={e => setNewDormArea(e.target.value)}
                                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                        />
                                        <button type="submit" className="btn-primary" style={{ padding: '8px' }}>Add Dorm</button>
                                    </form>
                                </div>

                                {/* Dorm List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                                    {dorms.map(dorm => (
                                        <div
                                            key={dorm.id}
                                            className="glass-panel"
                                            style={{
                                                padding: '15px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                border: selectedDormId === dorm.id ? '2px solid var(--color-primary)' : 'none',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setSelectedDormId(dorm.id)}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{dorm.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{dorm.location_area}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingDorm(dorm);
                                                    setEditDormForm({ name: dorm.name, location_area: dorm.location_area });
                                                    setShowEditDormModal(true);
                                                }} style={{ background: 'transparent', border: 'none', color: 'var(--color-electric-blue)', cursor: 'pointer' }}>
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    showConfirm('Delete Dorm', 'Delete this dorm and all its rooms?', () => deleteDorm(dorm.id));
                                                }} style={{ background: 'transparent', border: 'none', color: 'var(--color-hot-pink)', cursor: 'pointer' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Rooms Section */}
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Home size={18} /> Rooms {selectedDormId ? `in ${dorms.find(d => d.id === selectedDormId)?.name}` : '(Select a Dorm)'}
                                </h3>

                                {selectedDormId ? (
                                    <>
                                        {/* Add Room */}
                                        <div className="glass-panel" style={{ padding: '15px', marginBottom: '1rem' }}>
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                if (newRoomNumber) {
                                                    addRoom(selectedDormId, newRoomNumber);
                                                    setNewRoomNumber('');
                                                }
                                            }} style={{ display: 'flex', gap: '10px' }}>
                                                <input
                                                    placeholder="Room Number"
                                                    value={newRoomNumber}
                                                    onChange={e => setNewRoomNumber(e.target.value)}
                                                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                                    required
                                                />
                                                <button type="submit" className="btn-primary" style={{ padding: '0 15px' }}>Add</button>
                                            </form>
                                        </div>

                                        {/* Room List */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                                            {rooms.filter(r => r.dormId === selectedDormId).map(room => (
                                                <div key={room.id} className="glass-panel" style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{room.room_number}</span>
                                                    <div style={{ display: 'flex', gap: '2px' }}>
                                                        <button onClick={() => {
                                                            setEditingRoom(room);
                                                            setEditRoomForm({ room_number: room.room_number });
                                                            setShowEditRoomModal(true);
                                                        }} style={{ background: 'transparent', border: 'none', color: 'var(--color-electric-blue)', cursor: 'pointer', padding: '2px' }}>
                                                            <Edit size={14} />
                                                        </button>
                                                        <button onClick={() => deleteRoom(room.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-hot-pink)', cursor: 'pointer', padding: '2px' }}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {rooms.filter(r => r.dormId === selectedDormId).length === 0 && (
                                                <p style={{ color: 'var(--color-text-muted)', gridColumn: '1/-1' }}>No rooms added yet.</p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        Please select a dorm from the list to manage its rooms.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modals */}
                        <Modal isOpen={showEditDormModal} onClose={() => setShowEditDormModal(false)} title="Edit Dorm">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                updateDorm(editingDorm.id, editDormForm);
                                setShowEditDormModal(false);
                            }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input value={editDormForm.name} onChange={e => setEditDormForm({ ...editDormForm, name: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                <input value={editDormForm.location_area} onChange={e => setEditDormForm({ ...editDormForm, location_area: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                <button type="submit" className="btn-primary">Save</button>
                            </form>
                        </Modal>

                        <Modal isOpen={showEditRoomModal} onClose={() => setShowEditRoomModal(false)} title="Edit Room">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                updateRoom(editingRoom.id, editRoomForm);
                                setShowEditRoomModal(false);
                            }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input value={editRoomForm.room_number} onChange={e => setEditRoomForm({ ...editRoomForm, room_number: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                <button type="submit" className="btn-primary">Save</button>
                            </form>
                        </Modal>
                    </section>
                )}

                {/* REPORTS TAB */}
                {activeTab === 'reports' && (
                    <section>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Monthly Merchant Revenue Report</h2>

                        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <label style={{ fontWeight: 'bold' }}>Period:</label>
                                    <select
                                        value={reportMonth.split('-')[1]}
                                        onChange={(e) => setReportMonth(`${reportMonth.split('-')[0]}-${e.target.value}`)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-surface)',
                                            color: 'var(--color-text-main)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="01">January</option>
                                        <option value="02">February</option>
                                        <option value="03">March</option>
                                        <option value="04">April</option>
                                        <option value="05">May</option>
                                        <option value="06">June</option>
                                        <option value="07">July</option>
                                        <option value="08">August</option>
                                        <option value="09">September</option>
                                        <option value="10">October</option>
                                        <option value="11">November</option>
                                        <option value="12">December</option>
                                    </select>
                                    <select
                                        value={reportMonth.split('-')[0]}
                                        onChange={(e) => setReportMonth(`${e.target.value}-${reportMonth.split('-')[1]}`)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-surface)',
                                            color: 'var(--color-text-main)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={() => {
                                        const reportData = users
                                            .filter(u => u.role === 'merchant')
                                            .map((merchant, index) => {
                                                const merchantOrders = orders.filter(o =>
                                                    o.status === 'completed' &&
                                                    o.timestamp.startsWith(reportMonth) &&
                                                    o.items.some(i => i.merchantId === merchant.id)
                                                );

                                                let totalGross = 0;
                                                let totalFee = 0;
                                                let totalNet = 0;

                                                merchantOrders.forEach(order => {
                                                    const merchantItems = order.items.filter(i => i.merchantId === merchant.id);
                                                    merchantItems.forEach(item => {
                                                        const itemBase = item.price * item.quantity;
                                                        const itemFee = Math.floor(itemBase * 0.15);
                                                        const itemGross = itemBase + itemFee;

                                                        totalGross += itemGross;
                                                        totalFee += itemFee;
                                                        totalNet += itemBase;
                                                    });
                                                });

                                                return {
                                                    'No.': index + 1,
                                                    'Merchant Name': merchant.name,
                                                    'Total Completed Orders': merchantOrders.length,
                                                    'Gross Revenue (Rp)': totalGross,
                                                    'Platform Fee (Rp)': totalFee,
                                                    'Net Payout (Rp)': totalNet
                                                };
                                            });

                                        const ws = XLSX.utils.json_to_sheet(reportData);
                                        const wb = XLSX.utils.book_new();
                                        XLSX.utils.book_append_sheet(wb, ws, "Revenue Report");
                                        XLSX.writeFile(wb, `Revenue_Report_${reportMonth}.xlsx`);
                                    }}
                                    className="btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Download size={18} /> Export to Excel
                                </button>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                        <th style={{ padding: '15px' }}>No.</th>
                                        <th style={{ padding: '15px' }}>Merchant Name</th>
                                        <th style={{ padding: '15px', textAlign: 'center' }}>Completed Orders</th>
                                        <th style={{ padding: '15px', textAlign: 'right' }}>Gross Revenue</th>
                                        <th style={{ padding: '15px', textAlign: 'right' }}>Platform Fee (15%)</th>
                                        <th style={{ padding: '15px', textAlign: 'right' }}>Net Payout</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users
                                        .filter(u => u.role === 'merchant')
                                        .map((merchant, index) => {
                                            const merchantOrders = orders.filter(o =>
                                                o.status === 'completed' &&
                                                o.timestamp.startsWith(reportMonth) &&
                                                o.items.some(i => i.merchantId === merchant.id)
                                            );

                                            let totalGross = 0;
                                            let totalFee = 0;
                                            let totalNet = 0;

                                            merchantOrders.forEach(order => {
                                                const merchantItems = order.items.filter(i => i.merchantId === merchant.id);
                                                merchantItems.forEach(item => {
                                                    const itemBase = item.price * item.quantity; // item.price is base price
                                                    const itemFee = Math.floor(itemBase * 0.15);
                                                    const itemGross = itemBase + itemFee;

                                                    totalGross += itemGross;
                                                    totalFee += itemFee;
                                                    totalNet += itemBase;
                                                });
                                            });

                                            return (
                                                <tr key={merchant.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                    <td style={{ padding: '15px' }}>{index + 1}</td>
                                                    <td style={{ padding: '15px', fontWeight: '500' }}>{merchant.name}</td>
                                                    <td style={{ padding: '15px', textAlign: 'center' }}>{merchantOrders.length}</td>
                                                    <td style={{ padding: '15px', textAlign: 'right', color: 'var(--color-text-main)' }}>
                                                        Rp {totalGross.toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '15px', textAlign: 'right', color: 'var(--color-neon-green)' }}>
                                                        Rp {totalFee.toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-electric-blue)' }}>
                                                        Rp {totalNet.toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    {users.filter(u => u.role === 'merchant').length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                No merchants found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Modals */}
                        <Modal isOpen={showEditDormModal} onClose={() => setShowEditDormModal(false)} title="Edit Dorm">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                updateDorm(editingDorm.id, editDormForm);
                                setShowEditDormModal(false);
                            }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input value={editDormForm.name} onChange={e => setEditDormForm({ ...editDormForm, name: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                <input value={editDormForm.location_area} onChange={e => setEditDormForm({ ...editDormForm, location_area: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                <button type="submit" className="btn-primary">Save</button>
                            </form>
                        </Modal>

                        <Modal isOpen={showEditRoomModal} onClose={() => setShowEditRoomModal(false)} title="Edit Room">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                updateRoom(editingRoom.id, editRoomForm);
                                setShowEditRoomModal(false);
                            }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input value={editRoomForm.room_number} onChange={e => setEditRoomForm({ ...editRoomForm, room_number: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                <button type="submit" className="btn-primary">Save</button>
                            </form>
                        </Modal>
                    </section>
                )}

                {/* REPORTS TAB */}
                {activeTab === 'reports' && (
                    <section>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Monthly Merchant Revenue Report</h2>

                        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <label style={{ fontWeight: 'bold' }}>Period:</label>
                                    <select
                                        value={reportMonth.split('-')[1]}
                                        onChange={(e) => setReportMonth(`${reportMonth.split('-')[0]}-${e.target.value}`)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-surface)',
                                            color: 'var(--color-text-main)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="01">January</option>
                                        <option value="02">February</option>
                                        <option value="03">March</option>
                                        <option value="04">April</option>
                                        <option value="05">May</option>
                                        <option value="06">June</option>
                                        <option value="07">July</option>
                                        <option value="08">August</option>
                                        <option value="09">September</option>
                                        <option value="10">October</option>
                                        <option value="11">November</option>
                                        <option value="12">December</option>
                                    </select>
                                    <select
                                        value={reportMonth.split('-')[0]}
                                        onChange={(e) => setReportMonth(`${e.target.value}-${reportMonth.split('-')[1]}`)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-surface)',
                                            color: 'var(--color-text-main)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={() => {
                                        const reportData = users
                                            .filter(u => u.role === 'merchant')
                                            .map((merchant, index) => {
                                                const merchantOrders = orders.filter(o =>
                                                    o.status === 'completed' &&
                                                    o.timestamp.startsWith(reportMonth) &&
                                                    o.items.some(i => i.merchantId === merchant.id)
                                                );

                                                let totalGross = 0;
                                                let totalFee = 0;
                                                let totalNet = 0;

                                                merchantOrders.forEach(order => {
                                                    const merchantItems = order.items.filter(i => i.merchantId === merchant.id);
                                                    merchantItems.forEach(item => {
                                                        const itemBase = item.price * item.quantity;
                                                        const itemFee = Math.floor(itemBase * 0.15);
                                                        const itemGross = itemBase + itemFee;

                                                        totalGross += itemGross;
                                                        totalFee += itemFee;
                                                        totalNet += itemBase;
                                                    });
                                                });

                                                return {
                                                    'No.': index + 1,
                                                    'Merchant Name': merchant.name,
                                                    'Total Completed Orders': merchantOrders.length,
                                                    'Gross Revenue (Rp)': totalGross,
                                                    'Platform Fee (Rp)': totalFee,
                                                    'Net Payout (Rp)': totalNet
                                                };
                                            });

                                        const ws = XLSX.utils.json_to_sheet(reportData);
                                        const wb = XLSX.utils.book_new();
                                        XLSX.utils.book_append_sheet(wb, ws, "Revenue Report");
                                        XLSX.writeFile(wb, `Revenue_Report_${reportMonth}.xlsx`);
                                    }}
                                    className="btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Download size={18} /> Export to Excel
                                </button>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                        <th style={{ padding: '15px' }}>No.</th>
                                        <th style={{ padding: '15px' }}>Merchant Name</th>
                                        <th style={{ padding: '15px', textAlign: 'center' }}>Completed Orders</th>
                                        <th style={{ padding: '15px', textAlign: 'right' }}>Gross Revenue</th>
                                        <th style={{ padding: '15px', textAlign: 'right' }}>Platform Fee (15%)</th>
                                        <th style={{ padding: '15px', textAlign: 'right' }}>Net Payout</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users
                                        .filter(u => u.role === 'merchant')
                                        .map((merchant, index) => {
                                            const merchantOrders = orders.filter(o =>
                                                o.status === 'completed' &&
                                                o.timestamp.startsWith(reportMonth) &&
                                                o.items.some(i => i.merchantId === merchant.id)
                                            );

                                            let totalGross = 0;
                                            let totalFee = 0;
                                            let totalNet = 0;

                                            merchantOrders.forEach(order => {
                                                const merchantItems = order.items.filter(i => i.merchantId === merchant.id);
                                                merchantItems.forEach(item => {
                                                    const itemBase = item.price * item.quantity; // item.price is base price
                                                    const itemFee = Math.floor(itemBase * 0.15);
                                                    const itemGross = itemBase + itemFee;

                                                    totalGross += itemGross;
                                                    totalFee += itemFee;
                                                    totalNet += itemBase;
                                                });
                                            });

                                            return (
                                                <tr key={merchant.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                    <td style={{ padding: '15px' }}>{index + 1}</td>
                                                    <td style={{ padding: '15px', fontWeight: '500' }}>{merchant.name}</td>
                                                    <td style={{ padding: '15px', textAlign: 'center' }}>{merchantOrders.length}</td>
                                                    <td style={{ padding: '15px', textAlign: 'right', color: 'var(--color-text-main)' }}>
                                                        Rp {totalGross.toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '15px', textAlign: 'right', color: 'var(--color-neon-green)' }}>
                                                        Rp {totalFee.toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-electric-blue)' }}>
                                                        Rp {totalNet.toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    {users.filter(u => u.role === 'merchant').length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                No merchants found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

            </main>

            {/* Fingerprint Verification Modal */}
            <Modal
                isOpen={showFingerprintModal}
                onClose={() => {
                    if (fingerprintStatus !== 'scanning') {
                        setShowFingerprintModal(false);
                        setFingerprintStatus('idle');
                        setFingerprintOrder(null);
                    }
                }}
                title="Biometric Verification"
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px' }}>
                    <div
                        onClick={handleFingerprintScan}
                        style={{
                            width: '120px',
                            height: '160px',
                            border: `2px solid ${fingerprintStatus === 'success' ? 'var(--color-neon-green)' : fingerprintStatus === 'error' ? 'red' : 'var(--color-border)'}`,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.05)',
                            position: 'relative',
                            cursor: fingerprintStatus === 'idle' ? 'pointer' : 'default',
                            overflow: 'hidden',
                            transition: 'all 0.3s'
                        }}
                    >
                        <Fingerprint
                            size={80}
                            color={
                                fingerprintStatus === 'success' ? 'var(--color-neon-green)' :
                                    fingerprintStatus === 'scanning' ? 'var(--color-electric-blue)' :
                                        '#6b7280'
                            }
                            style={{
                                filter: fingerprintStatus === 'scanning' ? 'drop-shadow(0 0 10px var(--color-electric-blue))' : 'none',
                                transition: 'all 0.3s'
                            }}
                        />
                        {fingerprintStatus === 'scanning' && <div className="scanning-beam" />}
                        {fingerprintStatus === 'success' && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(46, 213, 115, 0.2)' }}>
                                <CheckCircle size={40} color="var(--color-neon-green)" fill="white" />
                            </div>
                        )}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '5px', color: 'var(--color-text-main)' }}>
                            {fingerprintStatus === 'idle' && "Ready to Scan"}
                            {fingerprintStatus === 'scanning' && "Scanning..."}
                            {fingerprintStatus === 'success' && "Verified!"}
                            {fingerprintStatus === 'error' && "Scan Failed"}
                        </h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            {fingerprintStatus === 'idle' ? "Please place student's finger on the reader." :
                                fingerprintStatus === 'scanning' ? "Keep finger still..." :
                                    fingerprintStatus === 'success' ? "Identity confirmed." :
                                        "Please try again."}
                        </p>
                    </div>

                    {fingerprintStatus === 'idle' && (
                        <button
                            onClick={() => {
                                alert("Manual PIN feature coming soon. Please use the scanner.");
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-electric-blue)',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                marginTop: '10px'
                            }}
                        >
                            Scanner not working? Use Manual PIN
                        </button>
                    )}
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
                isAlert={modal.isAlert}
            />
        </div>
    );
};

export default AdminDashboard;
