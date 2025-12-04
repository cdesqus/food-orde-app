import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LogOut, DollarSign, PieChart, List, CheckCircle, XCircle, Menu, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FinanceDashboard = () => {
    const { currentUser, logout, orders, withdrawals, updateWithdrawalStatus, users } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, transactions, withdrawals, reports
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [transactionFilter, setTransactionFilter] = useState('All');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Calculations
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalBase = orders.reduce((sum, o) => sum + (o.basePrice || 0), 0);
    const totalFees = orders.reduce((sum, o) => sum + (o.handlingFee || 0), 0);

    // Merchant Fee Breakdown
    const merchantFees = {};
    orders.forEach(order => {
        if (!order.items || (order.basePrice || 0) === 0) return;

        const orderBasePrice = order.basePrice || 0;
        const orderFee = order.handlingFee || 0;

        // Group items by merchant to find their share of the order
        const itemsByMerchant = {};
        order.items.forEach(item => {
            if (!itemsByMerchant[item.merchantId]) itemsByMerchant[item.merchantId] = 0;
            itemsByMerchant[item.merchantId] += (item.price * item.quantity);
        });

        // Distribute fee proportionally
        Object.entries(itemsByMerchant).forEach(([mid, amount]) => {
            const share = amount / orderBasePrice;
            const feeShare = orderFee * share;
            if (!merchantFees[mid]) merchantFees[mid] = 0;
            merchantFees[mid] += feeShare;
        });
    });

    const getMerchantName = (id) => {
        const m = users.find(u => u.id === id);
        return m ? m.name : 'Unknown Merchant';
    };

    const menuItems = [
        {
            section: 'MAIN',
            items: [{ id: 'dashboard', label: 'Dashboard', icon: PieChart }]
        },
        {
            section: 'FINANCIALS',
            items: [
                { id: 'transactions', label: 'Transactions', icon: List },
                { id: 'withdrawals', label: 'Withdrawals', icon: CheckCircle, badge: withdrawals.filter(w => w.status === 'pending').length }
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
                    {isSidebarOpen && <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>FINANCE</h1>}
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
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Finance Officer</div>
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                            {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                    {activeTab === 'dashboard' && (
                        <div>
                            <h1 style={{ marginBottom: '20px' }}>Financial Overview</h1>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                                <div className="glass-panel" style={{ padding: '20px' }}>
                                    <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Total Revenue (Gross)</h3>
                                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>Rp {totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="glass-panel" style={{ padding: '20px' }}>
                                    <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Net Merchant Payout</h3>
                                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-electric-blue)' }}>Rp {totalBase.toLocaleString()}</p>
                                </div>
                                <div className="glass-panel" style={{ padding: '20px' }}>
                                    <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Platform Profit (Fees)</h3>
                                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-neon-green)' }}>Rp {totalFees.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}



                    {activeTab === 'transactions' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h1 style={{ margin: 0 }}>Transaction History</h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <label style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Filter by Status:</label>
                                    <select
                                        value={transactionFilter}
                                        onChange={(e) => setTransactionFilter(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #e5e7eb',
                                            background: '#ffffff',
                                            color: '#1f2937',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        {['All', 'Pending', 'Cooking', 'Delivered to Shelter', 'Completed', 'Cancelled'].map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                            <th style={{ padding: '10px' }}>Order ID</th>
                                            <th style={{ padding: '10px' }}>Date</th>
                                            <th style={{ padding: '10px' }}>Merchant</th>
                                            <th style={{ padding: '10px' }}>Gross Amount</th>
                                            <th style={{ padding: '10px' }}>Platform Fee (15%)</th>
                                            <th style={{ padding: '10px' }}>Merchant Payout</th>
                                            <th style={{ padding: '10px' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders
                                            .filter(order => {
                                                if (transactionFilter === 'All') return true;
                                                // Normalize status strings for comparison (e.g., 'Delivered to Shelter' -> 'delivered_to_shelter')
                                                const normalizedFilter = transactionFilter.toLowerCase().replace(/ /g, '_');
                                                return order.status === normalizedFilter;
                                            })
                                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                            .map(order => (
                                                <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '10px', fontSize: '0.9rem' }}>{order.id}</td>
                                                    <td style={{ padding: '10px', fontSize: '0.9rem' }}>{new Date(order.timestamp).toLocaleString()}</td>
                                                    <td style={{ padding: '10px', fontSize: '0.9rem' }}>{getMerchantName(order.items?.[0]?.merchantId) || '-'}</td>
                                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>Rp {(order.total || 0).toLocaleString()}</td>
                                                    <td style={{ padding: '10px', color: 'var(--color-neon-green)' }}>Rp {(order.handlingFee || 0).toLocaleString()}</td>
                                                    <td style={{ padding: '10px', color: 'var(--color-electric-blue)' }}>Rp {(order.basePrice || 0).toLocaleString()}</td>
                                                    <td style={{ padding: '10px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.8rem',
                                                            background: order.status === 'completed' ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                                                            color: order.status === 'completed' ? 'var(--color-secondary)' : 'var(--color-text-muted)'
                                                        }}>
                                                            {order.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'withdrawals' && (
                        <div>
                            <h1 style={{ marginBottom: '20px' }}>Withdrawal Requests</h1>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                {withdrawals.length === 0 ? (
                                    <p style={{ color: 'var(--color-text-muted)' }}>No withdrawal requests.</p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                                <th style={{ padding: '10px' }}>ID</th>
                                                <th style={{ padding: '10px' }}>Merchant</th>
                                                <th style={{ padding: '10px' }}>Amount (Base Price)</th>
                                                <th style={{ padding: '10px' }}>Bank Details</th>
                                                <th style={{ padding: '10px' }}>Status</th>
                                                <th style={{ padding: '10px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {withdrawals.map(wd => (
                                                <tr key={wd.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '10px', fontSize: '0.9rem' }}>{wd.id}</td>
                                                    <td style={{ padding: '10px' }}>{getMerchantName(wd.merchantId)}</td>
                                                    <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--color-electric-blue)' }}>Rp {wd.amount.toLocaleString()}</td>
                                                    <td style={{ padding: '10px', fontSize: '0.9rem' }}>
                                                        {typeof wd.bankDetails === 'object' ? (
                                                            <>
                                                                <div>{wd.bankDetails.bankName} - {wd.bankDetails.accountNumber}</div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{wd.bankDetails.accountHolder}</div>
                                                            </>
                                                        ) : (
                                                            wd.bankDetails
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.8rem',
                                                            background: wd.status === 'approved' ? 'rgba(46, 213, 115, 0.1)' : (wd.status === 'rejected' ? 'rgba(255, 71, 87, 0.1)' : 'rgba(255, 255, 255, 0.1)'),
                                                            color: wd.status === 'approved' ? 'var(--color-secondary)' : (wd.status === 'rejected' ? 'var(--color-hot-pink)' : 'var(--color-text-muted)')
                                                        }}>
                                                            {wd.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        {wd.status === 'pending' && (
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                <button onClick={() => updateWithdrawalStatus(wd.id, 'approved')} style={{ background: 'var(--color-secondary)', border: 'none', borderRadius: '4px', padding: '5px', cursor: 'pointer', color: 'white' }} title="Approve">
                                                                    <CheckCircle size={16} />
                                                                </button>
                                                                <button onClick={() => updateWithdrawalStatus(wd.id, 'rejected')} style={{ background: 'var(--color-hot-pink)', border: 'none', borderRadius: '4px', padding: '5px', cursor: 'pointer', color: 'white' }} title="Reject">
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div>
                            <h1 style={{ marginBottom: '20px' }}>Financial Reports</h1>
                            <h2 style={{ marginBottom: '15px' }}>Fee Breakdown by Merchant</h2>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                            <th style={{ padding: '10px' }}>Merchant</th>
                                            <th style={{ padding: '10px' }}>Fees Generated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(merchantFees).map(([mid, fee]) => (
                                            <tr key={mid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '10px' }}>{getMerchantName(mid)}</td>
                                                <td style={{ padding: '10px', color: 'var(--color-neon-green)' }}>Rp {fee.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default FinanceDashboard;
