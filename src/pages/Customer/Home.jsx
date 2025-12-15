import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import FoodCard from '../../components/FoodCard';
import CustomerLayout from '../../layouts/CustomerLayout';
import { Search, MapPin, ChevronDown } from 'lucide-react';

const Home = () => {
    const { currentUser, foods, users, getDisplayPrice, getFamilyMembers, orderingFor, setOrderingFor, serverTime } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const activeFoods = foods.filter(f => {
        if (!f.active) return false;
        const merchant = users.find(u => u.id === f.merchantId);
        return merchant && merchant.status !== 'SUSPENDED' && merchant.status !== 'PERMANENT_BAN';
    });

    // Status Badge Logic
    const statusBadge = useMemo(() => {
        if (!serverTime) return null;
        const now = new Date(serverTime);
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const time = hours + minutes / 60;

        let text = "Closed";
        let color = "#e5e7eb"; // Light gray text for dark bg? No, banner is gradient.
        // Banner text is white. 
        // Request: "Subtle background color with a dot indicator."
        // Let's use specific colors for the badge itself.
        // Status Colors:
        // Open: Green
        // Cooking: Orange
        // Delivering: Blue
        // Closed: Gray

        let badgeColor = "#9ca3af"; // Icon/Text color
        let badgeBg = "rgba(0, 0, 0, 0.3)"; // Background

        if (time >= 8 && time < 13) {
            text = "Open 08:00-13:00";
            badgeColor = "#4ade80"; // Bright Green
            badgeBg = "rgba(0, 0, 0, 0.2)";
        } else if (time >= 13 && time < 14) {
            text = "Cooking Phase";
            badgeColor = "#fbbf24"; // Amber
            badgeBg = "rgba(0, 0, 0, 0.2)";
        } else if (time >= 14 && time < 16.5) {
            text = "Delivering";
            badgeColor = "#60a5fa"; // Blue
            badgeBg = "rgba(0, 0, 0, 0.2)";
        }

        return { text, color: badgeColor, bg: badgeBg };
    }, [serverTime]);

    // Filter logic
    const filteredFoods = activeFoods.filter(food =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFoodClick = (food) => {
        // Redirect to Merchant Page
        navigate(`/customer/merchant/${food.merchantId}`);
    };

    const familyMembers = currentUser?.role === 'parent' ? getFamilyMembers(currentUser.id) : [];

    return (
        <CustomerLayout>
            {/* Banner */}
            <div style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                padding: '2rem 25px 3rem 25px', // Increased bottom and horizontal padding
                color: 'white',
                borderRadius: '0 0 30px 30px',
                marginBottom: '2rem',
                boxShadow: '0 10px 30px rgba(255, 71, 87, 0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Hello, {currentUser.name.split(' ')[0]}! 👋</h1>

                        {/* Parent Context Switcher */}
                        {currentUser.role === 'parent' && (
                            <>
                                <div className="dropdown-container" style={{ position: 'relative', marginTop: '5px', display: 'inline-block' }}>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="glass-panel"
                                        style={{
                                            padding: '5px 12px',
                                            borderRadius: '20px',
                                            background: 'rgba(255,255,255,0.2)',
                                            border: 'none',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            width: 'auto'
                                        }}>
                                        Ordering for: <strong>{orderingFor ? orderingFor.name : 'Me'}</strong>
                                        <ChevronDown size={14} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="dropdown-content" style={{
                                            position: 'absolute',
                                            top: '120%',
                                            left: 0,
                                            background: 'white',
                                            color: 'black',
                                            borderRadius: '10px',
                                            padding: '5px',
                                            minWidth: '200px',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                            zIndex: 20,
                                            animation: 'fadeIn 0.2s ease'
                                        }}>
                                            <div
                                                onClick={() => {
                                                    setOrderingFor(currentUser);
                                                    setIsDropdownOpen(false);
                                                }}
                                                style={{ padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>ME</div>
                                                Myself ({currentUser.name})
                                            </div>

                                            {familyMembers.length > 0 && <div style={{ height: '1px', background: '#e5e7eb', margin: '5px 0' }}></div>}

                                            {familyMembers.map(member => (
                                                <div
                                                    key={member.id}
                                                    onClick={() => {
                                                        setOrderingFor(member);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    style={{ padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{member.name.charAt(0)}</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span>{member.name}</span>
                                                    </div>
                                                </div>
                                            ))}

                                            {familyMembers.length === 0 && (
                                                <div style={{ padding: '10px', fontSize: '0.8rem', color: '#6b7280', textAlign: 'center' }}>
                                                    No children linked yet.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Full screen transparent overlay to close dropdown */}
                                {isDropdownOpen && (
                                    <div
                                        style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                )}
                            </>
                        )}

                        {currentUser.role !== 'parent' && <p style={{ opacity: 0.9 }}>Hungry for something new?</p>}
                    </div>

                    {/* Right Side: Status & Location */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        {/* Status Badge */}
                        {statusBadge && (
                            <div style={{
                                background: statusBadge.bg,
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusBadge.color, boxShadow: `0 0 5px ${statusBadge.color}` }}></div>
                                {statusBadge.text}
                            </div>
                        )}

                        {/* Location Pill */}
                        <div style={{
                            background: 'rgba(255,255,255,0.2)',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <MapPin size={16} />
                            <span style={{ fontSize: '0.9rem' }}>Jakarta, ID</span>
                        </div>
                    </div>
                </div>

                {/* Search Bar - Nested in Banner */}
                <div style={{ position: 'relative', marginTop: '1.5rem', width: '100%', maxWidth: '600px', margin: '1.5rem auto 0' }}>
                    <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={20} />
                    <input
                        type="text"
                        placeholder="Search food..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem 1rem 0.8rem 3rem',
                            borderRadius: '20px',
                            border: 'none',
                            outline: 'none',
                            background: 'var(--color-bg-surface)',
                            color: 'var(--color-text-main)',
                            fontSize: '0.95rem',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            <div style={{ padding: '0 20px' }}>
                {/* Most Popular (Mock logic: just take first 5) */}
                {!searchTerm && (
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🔥 Most Popular
                        </h2>
                        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
                            {activeFoods.slice(0, 5).map(food => {
                                const merchant = users.find(u => u.id === food.merchantId);
                                return (
                                    <div
                                        key={food.id}
                                        onClick={() => handleFoodClick(food)}
                                        className="glass-panel"
                                        style={{
                                            minWidth: '200px',
                                            padding: '0',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s'
                                        }}
                                    >
                                        <div style={{ height: '120px', overflow: 'hidden' }}>
                                            <img src={food.image} alt={food.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ padding: '1rem' }}>
                                            <h3 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{food.name}</h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                                by {merchant?.name}
                                            </p>
                                            <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                                Rp {getDisplayPrice(food.price).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* All Foods / Search Results */}
                <section>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                        {searchTerm ? 'Search Results' : 'Explore Menu'}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                        {filteredFoods.map(food => {
                            const merchant = users.find(u => u.id === food.merchantId);
                            return (
                                <div key={food.id} onClick={() => handleFoodClick(food)} style={{ cursor: 'pointer' }}>
                                    <FoodCard food={{ ...food, merchantName: merchant?.name }} onAdd={() => handleFoodClick(food)} />
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </CustomerLayout>
    );
};

export default Home;
