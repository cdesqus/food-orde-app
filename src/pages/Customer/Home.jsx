import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import FoodCard from '../../components/FoodCard';
import CustomerLayout from '../../layouts/CustomerLayout';
import { Search, MapPin } from 'lucide-react';

const Home = () => {
    const { currentUser, foods, users, getDisplayPrice } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const activeFoods = foods.filter(f => f.active);

    // Filter logic
    const filteredFoods = activeFoods.filter(food =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFoodClick = (food) => {
        // Redirect to Merchant Page
        navigate(`/customer/merchant/${food.merchantId}`);
    };

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Hello, {currentUser.name.split(' ')[0]}! 👋</h1>
                        <p style={{ opacity: 0.9 }}>Hungry for something new?</p>
                    </div>
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
