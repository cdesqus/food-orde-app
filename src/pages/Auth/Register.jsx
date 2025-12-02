import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { User, Store } from 'lucide-react';

const Register = () => {
    const [role, setRole] = useState('customer'); // customer | merchant
    const [step, setStep] = useState(1); // 1: Basic Info, 2: Merchant Details (if merchant)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        // Merchant specific
        merchantIdFile: '', // Simulated file path/name
        merchantPhoto: '',
        description: ''
    });

    const [initialFoods, setInitialFoods] = useState([
        { name: '', price: '', image: '', description: '', category: 'Fast Food' },
        { name: '', price: '', image: '', description: '', category: 'Fast Food' },
        { name: '', price: '', image: '', description: '', category: 'Fast Food' }
    ]);

    const { register, showAlert } = useApp();
    const navigate = useNavigate();

    const handleFoodChange = (index, field, value) => {
        const newFoods = [...initialFoods];
        newFoods[index][field] = value;
        setInitialFoods(newFoods);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (role === 'merchant' && step === 1) {
            setStep(2);
            return;
        }

        if (role === 'merchant') {
            // Validate 3 foods
            const validFoods = initialFoods.filter(f => f.name && f.price);
            if (validFoods.length < 3) {
                showAlert('Error', 'Please add at least 3 catalog items.');
                return;
            }
            register({ ...formData, role }, validFoods);
        } else {
            const isApproved = role === 'admin';
            register({ ...formData, role, balance: 0, approved: isApproved });
        }

        showAlert('Success', 'Registration successful! ' + (role === 'merchant' ? 'Please wait for admin approval.' : 'Please login.'));
        navigate('/login');
    };

    const inputStyle = {
        padding: '1rem',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
        color: 'var(--color-text-main)',
        outline: 'none',
        width: '100%'
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: role === 'merchant' && step === 2 ? '800px' : '400px' }}>
                <h2 className="neon-text" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    {step === 1 ? 'Join the Squad' : 'Setup Your Store'}
                </h2>

                {step === 1 && (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <button
                            type="button"
                            onClick={() => setRole('customer')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: role === 'customer' ? '1px solid var(--color-neon-green)' : '1px solid var(--color-border)',
                                background: role === 'customer' ? 'rgba(46, 213, 115, 0.1)' : 'transparent',
                                color: role === 'customer' ? 'var(--color-neon-green)' : 'var(--color-text-muted)',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <User /> Customer
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('merchant')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: role === 'merchant' ? '1px solid var(--color-hot-pink)' : '1px solid var(--color-border)',
                                background: role === 'merchant' ? 'rgba(255, 165, 2, 0.1)' : 'transparent',
                                color: role === 'merchant' ? 'var(--color-hot-pink)' : 'var(--color-text-muted)',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <Store /> Merchant
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('admin')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: role === 'admin' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: role === 'admin' ? 'rgba(255, 71, 87, 0.1)' : 'transparent',
                                color: role === 'admin' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <User /> Admin
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {step === 1 ? (
                        <>
                            <input
                                type="text"
                                placeholder={role === 'merchant' ? "Store Name" : "Full Name"}
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                style={inputStyle}
                            />
                            {role === 'admin' && (
                                <input
                                    type="password"
                                    placeholder="Admin Secret Code"
                                    required
                                    onChange={(e) => {
                                        if (e.target.value !== 'admin123') {
                                            e.target.setCustomValidity('Invalid Secret Code');
                                        } else {
                                            e.target.setCustomValidity('');
                                        }
                                    }}
                                    style={inputStyle}
                                />
                            )}
                        </>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem' }}>Store Details</h3>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Upload ID Card</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFormData({ ...formData, merchantIdFile: e.target.value })} // Simulating file
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Store Photo</label>
                                    <input
                                        type="text"
                                        placeholder="Image URL (Simulated Upload)"
                                        value={formData.merchantPhoto}
                                        onChange={(e) => setFormData({ ...formData, merchantPhoto: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                                <textarea
                                    placeholder="Store Description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{ ...inputStyle, minHeight: '100px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem' }}>Initial Catalog (Min. 3 Items)</h3>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                                    {initialFoods.map((food, idx) => (
                                        <div key={idx} className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem', border: '1px dashed var(--color-border)' }}>
                                            <h4 style={{ margin: '0 0 0.5rem 0' }}>Item {idx + 1}</h4>
                                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                <input
                                                    placeholder="Item Name"
                                                    value={food.name}
                                                    onChange={e => handleFoodChange(idx, 'name', e.target.value)}
                                                    style={inputStyle}
                                                    required
                                                />
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <input
                                                        placeholder="Price"
                                                        type="number"
                                                        value={food.price}
                                                        onChange={e => handleFoodChange(idx, 'price', e.target.value)}
                                                        style={inputStyle}
                                                        required
                                                    />
                                                    <select
                                                        value={food.category}
                                                        onChange={e => handleFoodChange(idx, 'category', e.target.value)}
                                                        style={inputStyle}
                                                    >
                                                        <option>Fast Food</option>
                                                        <option>Drinks</option>
                                                        <option>Dessert</option>
                                                        <option>Main Course</option>
                                                    </select>
                                                </div>
                                                <input
                                                    placeholder="Image URL"
                                                    value={food.image}
                                                    onChange={e => handleFoodChange(idx, 'image', e.target.value)}
                                                    style={inputStyle}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setInitialFoods([...initialFoods, { name: '', price: '', image: '', description: '', category: 'Fast Food' }])}
                                        style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                    >
                                        + Add More Item
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        {step === 2 && (
                            <button type="button" onClick={() => setStep(1)} className="glass-panel" style={{ flex: 1, padding: '1rem', cursor: 'pointer' }}>
                                Back
                            </button>
                        )}
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                            {step === 1 && role === 'merchant' ? 'Next: Store Details' : 'REGISTER'}
                        </button>
                    </div>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login">Log In</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
