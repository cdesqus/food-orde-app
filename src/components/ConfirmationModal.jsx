import React from 'react';
import { X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isAlert = false }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '2px solid var(--color-primary)',
                borderRadius: '20px',
                padding: '24px',
                width: '90%',
                maxWidth: '400px',
                boxShadow: '0 0 30px rgba(57, 255, 20, 0.4), inset 0 0 20px rgba(57, 255, 20, 0.1)',
                transform: 'scale(1)',
                animation: 'scaleUp 0.3s ease-out, pulseGlow 2s infinite ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'black', textShadow: '0 0 1px rgba(0,0,0,0.1)' }}>{title}</h3>
                    {!isAlert && (
                        <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: '#006400', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    )}
                </div>

                <p style={{ color: '#004d00', lineHeight: '1.6', fontSize: '1.05rem', fontWeight: '500' }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    {!isAlert && (
                        <button
                            onClick={onCancel}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '12px',
                                border: '2px solid #006400',
                                background: 'transparent',
                                color: '#006400',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'var(--color-primary)',
                            color: 'black',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 15px rgba(57, 255, 20, 0.4)',
                            transition: 'all 0.2s',
                            fontSize: '1rem'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleUp {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 30px rgba(57, 255, 20, 0.4), inset 0 0 20px rgba(57, 255, 20, 0.1); }
                    50% { box-shadow: 0 0 50px rgba(57, 255, 20, 0.7), inset 0 0 30px rgba(57, 255, 20, 0.3); }
                    100% { box-shadow: 0 0 30px rgba(57, 255, 20, 0.4), inset 0 0 20px rgba(57, 255, 20, 0.1); }
                }
            `}</style>
        </div>
    );
};

export default ConfirmationModal;
