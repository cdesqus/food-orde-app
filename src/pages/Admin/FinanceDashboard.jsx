import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { LogOut, DollarSign, PieChart, List, CheckCircle, XCircle, Menu, ChevronLeft, ChevronRight, FileText, Server, Download, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const FinanceDashboard = () => {
    const { currentUser, logout, orders, withdrawals, updateWithdrawalStatus, users, vendorInvoices, createVendorInvoice, updateVendorInvoiceStatus, deleteVendorInvoice, showAlert, showConfirm } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, transactions, withdrawals, reports, vendor_invoices
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [transactionFilter, setTransactionFilter] = useState('All');

    // Vendor Invoice State
    const [invoiceMonth, setInvoiceMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

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

    // Vendor Bill Calculation
    const vendorBillData = useMemo(() => {
        const [year, month] = invoiceMonth.split('-');
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

        const monthlyOrders = orders.filter(o => {
            const d = new Date(o.timestamp);
            return o.status === 'completed' && d >= startDate && d <= endDate;
        });

        const totalGMV = monthlyOrders.reduce((sum, o) => sum + o.total, 0);
        const variableFee = totalGMV * 0.023;
        const totalBill = variableFee;

        return {
            period: invoiceMonth,
            totalGMV,
            variableFee,
            totalBill,
            orderCount: monthlyOrders.length
        };
    }, [orders, invoiceMonth]);

    const handleGenerateInvoice = () => {
        // Check if invoice already exists for this month
        if (vendorInvoices.find(inv => inv.period === invoiceMonth)) {
            showAlert('Error', 'Invoice for this month already exists.');
            return;
        }

        if (vendorBillData.totalGMV === 0) {
            showAlert('Error', 'No billable amount for this month.');
            return;
        }

        createVendorInvoice(vendorBillData);
        showAlert('Success', 'Vendor invoice generated successfully!');
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
                { id: 'withdrawals', label: 'Withdrawals', icon: CheckCircle, badge: withdrawals.filter(w => w.status === 'pending').length },
                { id: 'vendor_invoices', label: 'Vendor Invoices', icon: Server }
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

                    {activeTab === 'vendor_invoices' && (
                        <div>
                            <h1 style={{ marginBottom: '20px' }}>Vendor Invoices</h1>

                            {/* Section A: Bill Generator */}
                            <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
                                <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Server size={20} /> Bill Generator
                                </h2>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Select Month</label>
                                        <input
                                            type="month"
                                            value={invoiceMonth}
                                            onChange={(e) => setInvoiceMonth(e.target.value)}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: '1px solid #e5e7eb',
                                                background: '#ffffff',
                                                color: '#1f2937',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', background: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Total GMV (Completed)</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Rp {vendorBillData.totalGMV.toLocaleString()}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{vendorBillData.orderCount} Orders</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Variable Fee (2.3%)</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-electric-blue)' }}>Rp {vendorBillData.variableFee.toLocaleString()}</div>
                                    </div>
                                    <div style={{ borderLeft: '2px solid var(--color-border)', paddingLeft: '15px' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Total Bill Due</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>Rp {vendorBillData.totalBill.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={handleGenerateInvoice}
                                        className="btn-primary"
                                        style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}
                                    >
                                        <FileText size={18} />
                                        Generate Invoice
                                    </button>
                                </div>
                            </div>

                            {/* Section B: Invoice History */}
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Invoice History</h2>
                                {vendorInvoices.length === 0 ? (
                                    <p style={{ color: 'var(--color-text-muted)' }}>No invoices generated yet.</p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                                <th style={{ padding: '10px' }}>Invoice ID</th>
                                                <th style={{ padding: '10px' }}>Period</th>
                                                <th style={{ padding: '10px' }}>Total GMV</th>
                                                <th style={{ padding: '10px' }}>Maint. Fee (2.3%)</th>
                                                <th style={{ padding: '10px' }}>Total Payout</th>
                                                <th style={{ padding: '10px' }}>Status</th>
                                                <th style={{ padding: '10px' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vendorInvoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(inv => (
                                                <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '10px', fontSize: '0.9rem' }}>#{inv.id.slice(-6)}</td>
                                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{inv.period}</td>
                                                    <td style={{ padding: '10px' }}>Rp {inv.totalGMV.toLocaleString()}</td>
                                                    <td style={{ padding: '10px' }}>Rp {inv.variableFee.toLocaleString()}</td>
                                                    <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--color-primary)' }}>Rp {inv.totalBill.toLocaleString()}</td>
                                                    <td style={{ padding: '10px' }}>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.8rem',
                                                            background: inv.status === 'paid' ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                                                            color: inv.status === 'paid' ? 'var(--color-secondary)' : 'var(--color-hot-pink)'
                                                        }}>
                                                            {inv.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            {inv.status === 'unpaid' && (
                                                                <button
                                                                    onClick={() => updateVendorInvoiceStatus(inv.id, 'paid')}
                                                                    style={{
                                                                        background: 'var(--color-secondary)',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        padding: '6px 10px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                                >
                                                                    Mark as Paid
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => showAlert('Info', 'PDF Download feature coming soon.')}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: '1px solid var(--color-border)',
                                                                    color: 'var(--color-text-main)',
                                                                    borderRadius: '4px',
                                                                    padding: '6px',
                                                                    cursor: 'pointer'
                                                                }}
                                                                title="Download PDF"
                                                            >
                                                                <Download size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => showConfirm('Delete Invoice', 'Are you sure you want to delete this invoice?', () => deleteVendorInvoice(inv.id))}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: '1px solid var(--color-hot-pink)',
                                                                    color: 'var(--color-hot-pink)',
                                                                    borderRadius: '4px',
                                                                    padding: '6px',
                                                                    cursor: 'pointer'
                                                                }}
                                                                title="Delete Invoice"
                                                            >
                                                                <Trash size={16} />
                                                            </button>
                                                        </div>
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
