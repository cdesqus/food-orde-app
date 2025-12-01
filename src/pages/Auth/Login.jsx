import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Sparkles } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, currentUser } = useApp();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            if (currentUser.role === 'admin') navigate('/admin');
            else if (currentUser.role === 'merchant') navigate('/merchant');
            else navigate('/customer');
        }
    }, [currentUser, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const res = login(email, password);
        if (!res.success) {
            setError(res.message);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '20px' }}>
            <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Sparkles size={48} color="var(--color-neon-green)" />
                    <h1 className="neon-text" style={{ fontSize: '2.5rem', marginTop: '1rem' }}>EAT.Z</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Future of Food Ordering</p>
                </div>

                {error && <div style={{ color: 'var(--color-hot-pink)', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-surface)',
                            color: 'var(--color-text-main)',
                            outline: 'none'
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-surface)',
                            color: 'var(--color-text-main)',
                            outline: 'none'
                        }}
                    />
                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                        LOG IN
                    </button>
                </form>

                <div style={{ marginTop: '2rem', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/register">Sign Up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
