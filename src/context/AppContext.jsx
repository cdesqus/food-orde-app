import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Mock Data & Persistence
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('users');
      return saved ? JSON.parse(saved) : [
        { id: 'admin', name: 'Admin User', role: 'admin', email: 'admin@food.com', password: '123', approved: true },
        // 5 Merchants
        { id: 'm1', name: 'Neon Burger', role: 'merchant', email: 'burger@food.com', password: '123', approved: true, phone: '08123456789', photo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500', description: 'Best burgers in 2077' },
        { id: 'm2', name: 'Sushi Synth', role: 'merchant', email: 'sushi@food.com', password: '123', approved: true, phone: '08123456788', photo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500', description: 'Fresh from the digital ocean' },
        { id: 'm3', name: 'Pizza Planet', role: 'merchant', email: 'pizza@food.com', password: '123', approved: true, phone: '08123456787', photo: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=500', description: 'Out of this world flavors' },
        { id: 'm4', name: 'Taco Tech', role: 'merchant', email: 'taco@food.com', password: '123', approved: true, phone: '08123456786', photo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500', description: 'Crunchy code' },
        { id: 'm5', name: 'Noodle Net', role: 'merchant', email: 'noodle@food.com', password: '123', approved: true, phone: '08123456785', photo: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=500', description: 'Connected by flavor' },
        // Customer
        { id: 'c1', name: 'John Doe', role: 'customer', email: 'john@food.com', password: '123', balance: 500000, approved: true, phone: '08123456000' },
      ];
    } catch (e) {
      console.error('Failed to parse users', e);
      return [];
    }
  });

  const [foods, setFoods] = useState(() => {
    try {
      const saved = localStorage.getItem('foods');
      if (saved) return JSON.parse(saved);

      // Generate 30 items across 5 merchants
      const categories = ['Fast Food', 'Japanese', 'Italian', 'Mexican', 'Asian', 'Drinks', 'Dessert'];
      const initialFoods = [];
      const merchantIds = ['m1', 'm2', 'm3', 'm4', 'm5'];

      merchantIds.forEach((mid, idx) => {
        for (let i = 1; i <= 6; i++) {
          initialFoods.push({
            id: `f${mid}-${i}`,
            merchantId: mid,
            category: categories[idx % categories.length], // Distribute categories
            name: `Item ${i} from ${mid}`,
            price: 15000 + (i * 5000),
            image: `https://source.unsplash.com/random/500x500/?food,${i + idx}`, // Placeholder
            description: `Delicious item number ${i} specially prepared.`,
            active: true,
            photos: [`https://source.unsplash.com/random/500x500/?food,${i + idx}`]
          });
        }
      });

      // Overwrite a few with real names for demo
      initialFoods[0] = { id: 'f1', merchantId: 'm1', category: 'Fast Food', name: 'Neon Burger', price: 45000, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', description: 'Glowing with flavor.', active: true, photos: [] };
      initialFoods[1] = { id: 'f2', merchantId: 'm1', category: 'Fast Food', name: 'Cyber Fries', price: 25000, image: 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?w=500', description: 'Crispy and futuristic.', active: true, photos: [] };
      initialFoods[6] = { id: 'f7', merchantId: 'm2', category: 'Japanese', name: 'Quantum Roll', price: 55000, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500', description: 'Sushi from the future.', active: true, photos: [] };

      return initialFoods;
    } catch (e) {
      console.error('Failed to parse foods', e);
      return [];
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse orders', e);
      return [];
    }
  });

  useEffect(() => { localStorage.setItem('users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('foods', JSON.stringify(foods)); }, [foods]);
  useEffect(() => { localStorage.setItem('orders', JSON.stringify(orders)); }, [orders]);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to parse currentUser', e);
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const login = (email, password) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      if (!user.approved) return { success: false, message: 'Account not approved yet.' };
      setCurrentUser(user);
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials' };
  };

  const logout = () => setCurrentUser(null);

  const register = (userData, initialFoods = []) => {
    if (users.find(u => u.email === userData.email)) {
      return { success: false, message: 'Email already exists' };
    }
    const newUser = { ...userData, id: `u${Date.now()}`, approved: false };
    setUsers([...users, newUser]);

    if (initialFoods && initialFoods.length > 0) {
      const newFoods = initialFoods.map((food, idx) => ({
        ...food,
        id: `f${Date.now()}-${idx}`,
        merchantId: newUser.id,
        active: true,
        photos: food.image ? [food.image] : []
      }));
      setFoods(prev => [...prev, ...newFoods]);
    }

    return { success: true };
  };

  const toggleUserStatus = (id, status) => {
    setUsers(users.map(u => u.id === id ? { ...u, approved: status } : u));
  };

  const createAdmin = (adminData) => {
    if (users.find(u => u.email === adminData.email)) {
      return { success: false, message: 'Email already exists' };
    }
    const newAdmin = { ...adminData, id: `admin-${Date.now()}`, role: 'admin', approved: true };
    setUsers([...users, newAdmin]);
    return { success: true };
  };

  const addFood = (foodData) => {
    const newFood = { ...foodData, id: `f${Date.now()}`, merchantId: currentUser.id };
    setFoods([...foods, newFood]);
  };

  const updateFood = (id, updates) => {
    setFoods(foods.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const topUp = (amount) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, balance: (currentUser.balance || 0) + amount };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const placeOrder = (cartItems, shelterId, notes, paymentMethod) => {
    if (!currentUser) return { success: false, message: 'Not logged in' };

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (paymentMethod === 'wallet') {
      if ((currentUser.balance || 0) < total) {
        return { success: false, message: 'Insufficient balance' };
      }
      // Deduct balance
      const updatedUser = { ...currentUser, balance: currentUser.balance - total };
      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
    }

    const newOrder = {
      id: `ord-${Date.now()}`,
      customerId: currentUser.id,
      items: cartItems,
      total,
      shelterId,
      status: 'pending',
      timestamp: new Date().toISOString(),
      notes: notes || '',
      paymentMethod: paymentMethod || 'wallet'
    };

    setOrders([...orders, newOrder]);
    return { success: true };
  };

  const updateOrder = (orderId, status) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const [shelters, setShelters] = useState(() => {
    try {
      const saved = localStorage.getItem('shelters');
      return saved ? JSON.parse(saved) : [
        { id: 's1', name: 'Main Lobby', detail: 'Near the reception desk' },
        { id: 's2', name: 'Library Entrance', detail: 'By the main glass doors' },
        { id: 's3', name: 'Tech Park Gate', detail: 'Security post 1' }
      ];
    } catch (e) {
      console.error('Failed to parse shelters', e);
      return [];
    }
  });

  useEffect(() => { localStorage.setItem('shelters', JSON.stringify(shelters)); }, [shelters]);

  const addShelter = (name, detail) => {
    const newShelter = { id: `s${Date.now()}`, name, detail };
    setShelters([...shelters, newShelter]);
  };

  const deleteShelter = (id) => {
    setShelters(shelters.filter(s => s.id !== id));
  };

  const [withdrawals, setWithdrawals] = useState(() => {
    try {
      const saved = localStorage.getItem('withdrawals');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse withdrawals', e);
      return [];
    }
  });

  useEffect(() => { localStorage.setItem('withdrawals', JSON.stringify(withdrawals)); }, [withdrawals]);

  const requestWithdrawal = (amount, bankDetails) => {
    if (!currentUser) return { success: false, message: 'Not logged in' };

    const newWithdrawal = {
      id: `wd-${Date.now()}`,
      merchantId: currentUser.id,
      amount,
      status: 'pending', // pending | approved | rejected
      bankDetails,
      createdAt: new Date().toISOString()
    };

    setWithdrawals([...withdrawals, newWithdrawal]);
    return { success: true };
  };

  return (
    <AppContext.Provider value={{
      users, currentUser, foods, orders, shelters, withdrawals,
      login, logout, register, toggleUserStatus, createAdmin, addFood, updateFood, topUp, placeOrder, updateOrder,
      addShelter, deleteShelter, requestWithdrawal
    }}>
      {children}
    </AppContext.Provider>
  );
};
