
import Navbar from '../components/Navbar';

const CustomerLayout = ({ children }) => {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', position: 'relative', paddingBottom: '100px', background: 'var(--color-bg-main)', boxShadow: '0 0 50px rgba(0,0,0,0.05)' }}>
                {children}
                <Navbar />
            </div>
        </div>
    );
};

export default CustomerLayout;
