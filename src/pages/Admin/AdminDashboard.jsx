import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, CheckCircle, BarChart2, Plus, LogOut, TrendingUp, DollarSign, ShoppingBag, Activity, MapPin, Edit, Trash2, Key, X, FileText, Download } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import ConfirmationModal from '../../components/ConfirmationModal';
import Modal from '../../components/Modal';

const AdminDashboard = () => {
    const { currentUser, logout, users, toggleUserStatus, createAdmin, updateUser, deleteUser, orders, shelters, addShelter, updateShelter, deleteShelter } = useApp();
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'verification' | 'users' | 'locations'
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });

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

    // Edit User State
    const [editingUser, setEditingUser] = useState(null);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [editUserForm, setEditUserForm] = useState({ name: '', email: '', password: '' });

    // Edit Shelter State
    const [editingShelter, setEditingShelter] = useState(null);
    const [showEditShelterModal, setShowEditShelterModal] = useState(false);
    const [editShelterForm, setEditShelterForm] = useState({ name: '', detail: '' });

    // Report State
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const pendingMerchants = users.filter(u => u.role === 'merchant' && !u.approved);
    const pendingCustomers = users.filter(u => u.role === 'customer' && !u.approved);

    // All users except current admin
    const allUsers = users.filter(u => u.id !== currentUser.id);

    const filteredUsers = userFilter === 'all'
        ? allUsers
        : allUsers.filter(u => u.role === userFilter);

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

    const handleAddAdmin = (e) => {
        e.preventDefault();
        const result = createAdmin(adminForm);
        if (result.success) {
            setShowAddAdmin(false);
            setAdminForm({ name: '', email: '', password: '' });
            showAlert('Success', 'Admin added successfully!');
        } else {
            showAlert('Error', result.message);
        }
    };

    return (
        <div style={{ padding: '20px', minHeight: '100vh', paddingBottom: '80px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem' }}>Admin Dashboard</h1>
                <button onClick={logout} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LogOut size={18} /> Logout
                </button>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '20px', overflowX: 'auto' }}>
                <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'btn-primary' : 'glass-panel'} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', minWidth: '120px' }}>
                    <BarChart2 size={18} /> Dashboard
                </button>
                <button onClick={() => setActiveTab('verification')} className={activeTab === 'verification' ? 'btn-primary' : 'glass-panel'} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', minWidth: '120px' }}>
                    <CheckCircle size={18} /> Verification
                    {(pendingMerchants.length + pendingCustomers.length) > 0 && (
                        <span style={{ background: 'var(--color-hot-pink)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                            {pendingMerchants.length + pendingCustomers.length}
                        </span>
                    )}
                </button>
                <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'btn-primary' : 'glass-panel'} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', minWidth: '120px' }}>
                    <Users size={18} /> User List
                </button>
                <button onClick={() => setActiveTab('locations')} className={activeTab === 'locations' ? 'btn-primary' : 'glass-panel'} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', minWidth: '120px' }}>
                    <MapPin size={18} /> Locations
                </button>
                <button onClick={() => setActiveTab('reports')} className={activeTab === 'reports' ? 'btn-primary' : 'glass-panel'} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', minWidth: '120px' }}>
                    <FileText size={18} /> Reports
                </button>
            </div>

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
                            onClick={() => setShowAddAdmin(!showAddAdmin)}
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
                            <Plus size={16} /> Add Admin
                        </button>
                    </div>

                    {/* Filter Categories */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        {['All', 'Merchant', 'Customer', 'Admin'].map(filter => (
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

                    {showAddAdmin && (
                        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', border: '1px solid var(--color-primary)' }}>
                            <h3 style={{ marginBottom: '15px' }}>Add New Admin</h3>
                            <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <input
                                    placeholder="Name"
                                    value={adminForm.name}
                                    onChange={e => setAdminForm({ ...adminForm, name: e.target.value })}
                                    required
                                    style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', borderRadius: '8px' }}
                                />
                                <input
                                    placeholder="Email"
                                    type="email"
                                    value={adminForm.email}
                                    onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                                    required
                                    style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', borderRadius: '8px' }}
                                />
                                <input
                                    placeholder="Password"
                                    type="password"
                                    value={adminForm.password}
                                    onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                                    required
                                    style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', borderRadius: '8px' }}
                                />
                                <button type="submit" className="btn-primary">Create Admin User</button>
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
                                        <p style={{ fontSize: '0.8rem', color: user.approved ? 'var(--color-neon-green)' : 'var(--color-hot-pink)' }}>
                                            Status: {user.approved ? 'Active' : 'Banned/Pending'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => {
                                                setEditingUser(user);
                                                setEditUserForm({ name: user.name, email: user.email, password: user.password });
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
                                    addShelter(newShelterName, newShelterDetail);
                                    setNewShelterName('');
                                    setNewShelterDetail('');
                                }
                            }}
                            style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}
                        >
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Location Name (e.g. Lobby A)"
                                    value={newShelterName}
                                    onChange={(e) => setNewShelterName(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-surface)',
                                        color: 'var(--color-text-main)'
                                    }}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Detail (e.g. Near the elevator)"
                                    value={newShelterDetail}
                                    onChange={(e) => setNewShelterDetail(e.target.value)}
                                    style={{
                                        flex: 2,
                                        padding: '10px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-surface)',
                                        color: 'var(--color-text-main)'
                                    }}
                                />
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
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => {
                                            setEditingShelter(shelter);
                                            setEditShelterForm({ name: shelter.name, detail: shelter.detail || '' });
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
                            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Save Changes</button>
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

                                            const totalRevenue = merchantOrders.reduce((sum, o) => sum + o.total, 0);
                                            // Assuming 0% fee for now as per requirement "Optional"
                                            const fee = 0;
                                            const netPayout = totalRevenue - fee;

                                            return {
                                                'No.': index + 1,
                                                'Merchant Name': merchant.name,
                                                'Total Completed Orders': merchantOrders.length,
                                                'Total Revenue (Rp)': totalRevenue,
                                                'Commission/Fee (Rp)': fee,
                                                'Net Payout (Rp)': netPayout
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
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Total Revenue</th>
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

                                        const totalRevenue = merchantOrders.reduce((sum, o) => sum + o.total, 0);
                                        const fee = 0;
                                        const netPayout = totalRevenue - fee;

                                        return (
                                            <tr key={merchant.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '15px' }}>{index + 1}</td>
                                                <td style={{ padding: '15px', fontWeight: '500' }}>{merchant.name}</td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>{merchantOrders.length}</td>
                                                <td style={{ padding: '15px', textAlign: 'right', color: 'var(--color-neon-green)' }}>
                                                    Rp {totalRevenue.toLocaleString()}
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>
                                                    Rp {netPayout.toLocaleString()}
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
