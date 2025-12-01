import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} className="glass-panel" style={{
                        padding: '1rem 1.5rem',
                        background: toast.type === 'error' ? 'rgba(255, 71, 87, 0.9)' :
                            toast.type === 'success' ? 'rgba(46, 213, 115, 0.9)' :
                                'rgba(255, 255, 255, 0.9)',
                        color: toast.type === 'info' ? 'black' : 'white',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        animation: 'slideIn 0.3s ease-out',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        minWidth: '250px'
                    }}>
                        <span>{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} style={{
                            background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 'auto', fontSize: '1.2rem'
                        }}>&times;</button>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
