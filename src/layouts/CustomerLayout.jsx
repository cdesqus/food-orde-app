
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import { Clock, AlertCircle } from 'lucide-react';

const CustomerLayout = ({ children }) => {
    const { isOrderingOpen, orderingPhase, timeRemaining } = useApp();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', position: 'relative', paddingBottom: '100px', background: 'var(--color-bg-main)', boxShadow: '0 0 50px rgba(0,0,0,0.05)' }}>

                {/* STATUS BANNER */}


                {children}
                <Navbar />
            </div>
        </div>
    );
};

export default CustomerLayout;
