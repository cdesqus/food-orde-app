
import { Plus, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext';

const FoodCard = ({ food, onAdd, onRemove, quantity = 0, disabled = false, disabledText = 'Unavailable' }) => {
    const { getDisplayPrice } = useApp();
    return (
        <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                <img src={food.image} alt={food.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                />
            </div>
            <div style={{ padding: '1.2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', lineHeight: '1.3', marginBottom: '0.2rem' }}>{food.name}</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {food.description}
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginTop: 'auto',
                    paddingTop: '0.8rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</span>
                        <span style={{ color: 'var(--color-neon-green)', fontWeight: '700', fontSize: '1.1rem' }}>
                            Rp {getDisplayPrice(food.price).toLocaleString()}
                        </span>
                    </div>

                    {quantity > 0 ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '30px',
                            padding: '2px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                            marginLeft: '10px'
                        }}>
                            <button
                                onClick={() => !disabled && onRemove(food)}
                                disabled={disabled}
                                style={{
                                    background: 'var(--color-bg-main)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
                                    color: 'var(--color-text-main)',
                                    opacity: disabled ? 0.5 : 1,
                                    padding: 0
                                }}
                            >
                                <Minus size={14} />
                            </button>
                            <span style={{
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                width: '24px',
                                textAlign: 'center',
                                fontVariantNumeric: 'tabular-nums'
                            }}>{quantity}</span>
                            <button
                                onClick={() => !disabled && onAdd(food)}
                                disabled={disabled}
                                style={{
                                    background: 'var(--color-electric-blue)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
                                    color: 'black',
                                    opacity: disabled ? 0.5 : 1,
                                    padding: 0
                                }}
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => !disabled && onAdd(food)}
                            className={disabled ? 'btn-disabled' : ''}
                            disabled={disabled}
                            style={{
                                background: disabled ? '#333' : 'var(--color-electric-blue)',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '6px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                color: disabled ? '#aaa' : 'black',
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                marginLeft: '10px',
                                transition: 'transform 0.1s',
                                boxShadow: disabled ? 'none' : '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                        >
                            {disabled ? (disabledText || 'Closed') : <>Add <Plus size={16} /></>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FoodCard;
