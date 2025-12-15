import { createContext, useContext, useState, useEffect } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // --- RBAC SYSTEM ---
  const AVAILABLE_PERMISSIONS = [
    { slug: 'user.view', label: 'View Users', group: 'User Management' },
    { slug: 'user.create', label: 'Create User', group: 'User Management' },
    { slug: 'user.edit', label: 'Edit User', group: 'User Management' },
    { slug: 'finance.topup', label: 'Manual Top Up', group: 'Finance Operations' },
    { slug: 'finance.withdraw.approve', label: 'Approve Withdrawals', group: 'Finance Operations' },
    { slug: 'finance.report.view', label: 'View Reports', group: 'Finance Operations' },
    { slug: 'merchant.verify', label: 'Verify Merchants', group: 'Merchant Ops' },
    { slug: 'merchant.suspend', label: 'Suspend Merchants', group: 'Merchant Ops' },
    { slug: 'order.monitor.food', label: 'Monitor Food Orders', group: 'Order Monitoring' },
    { slug: 'order.monitor.laundry', label: 'Monitor Laundry Orders', group: 'Order Monitoring' }
  ];

  const [roles, setRoles] = useState(() => {
    try {
      const saved = localStorage.getItem('roles');
      if (saved) return JSON.parse(saved);

      // Default Super Admin Role
      return [
        {
          id: 'role_super_admin',
          name: 'Super Admin',
          description: 'Full access to all features',
          permissions: AVAILABLE_PERMISSIONS.map(p => p.slug),
          isSystem: true // Prevent deletion
        },
        {
          id: 'role_finance',
          name: 'Finance Staff',
          description: 'manage finance operations',
          permissions: ['finance.topup', 'finance.withdraw.approve', 'finance.report.view'],
          isSystem: false
        }
      ];
    } catch (e) {
      console.error('Failed to parse roles', e);
      return [];
    }
  });

  useEffect(() => { localStorage.setItem('roles', JSON.stringify(roles)); }, [roles]);

  const addRole = (roleData) => {
    const newRole = { ...roleData, id: `role_${Date.now()}` };
    setRoles([...roles, newRole]);
    return { success: true };
  };

  const updateRole = (id, updates) => {
    setRoles(roles.map(r => r.id === id ? { ...r, ...updates } : r));
    return { success: true };
  };

  const deleteRole = (id) => {
    setRoles(roles.filter(r => r.id !== id));
    return { success: true };
  };

  const hasPermission = (permissionSlug) => {
    if (!currentUser) return false;
    if (currentUser.role !== 'admin') return false; // RBAC currently only for admins

    // Find user's assigned role
    // Assuming 'adminRoleId' is the link. For backward compatibility, if field missing, check if it's the main admin

    let userRole = null;
    if (currentUser.id === 'admin') {
      // Force Super Admin for the hardcoded 'admin' user
      userRole = roles.find(r => r.id === 'role_super_admin');
    } else if (currentUser.adminRoleId) {
      userRole = roles.find(r => r.id === currentUser.adminRoleId);
    }

    if (!userRole) return false;

    // Super Admin Bypass
    if (userRole.id === 'role_super_admin') return true;

    return userRole.permissions.includes(permissionSlug);
  };

  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('users');
      let initialUsers = saved ? JSON.parse(saved) : [
        { id: 'admin', name: 'Admin User', role: 'admin', email: 'admin@food.com', password: '123', approved: true, adminRoleId: 'role_super_admin' },
        // 5 Merchants
        { id: 'm1', name: 'Neon Burger', role: 'merchant', email: 'burger@food.com', password: '123', approved: true, phone: '08123456789', photo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500', description: 'Best burgers in 2077' },
        { id: 'm2', name: 'Sushi Synth', role: 'merchant', email: 'sushi@food.com', password: '123', approved: true, phone: '08123456788', photo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500', description: 'Fresh from the digital ocean' },
        { id: 'm3', name: 'Pizza Planet', role: 'merchant', email: 'pizza@food.com', password: '123', approved: true, phone: '08123456787', photo: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=500', description: 'Out of this world flavors' },
        { id: 'm4', name: 'Taco Tech', role: 'merchant', email: 'taco@food.com', password: '123', approved: true, phone: '08123456786', photo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500', description: 'Crunchy code' },
        { id: 'm5', name: 'Noodle Net', role: 'merchant', email: 'noodle@food.com', password: '123', approved: true, phone: '08123456785', photo: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=500', description: 'Connected by flavor' },
        // Customer
        { id: 'c1', name: 'John Doe', role: 'customer', email: 'john@food.com', password: '123', balance: 500000, approved: true, phone: '08123456000', nis: '12345', birthDate: '2010-01-01' },
        // Parent
        { id: 'p1', name: 'Parent User', role: 'parent', email: 'parent@food.com', password: '123', approved: true, phone: '08199999999' },
        // Finance
        { id: 'fin1', name: 'Finance Officer', role: 'finance', email: 'finance@food.com', password: '123', approved: true }
      ];

      // Fix for existing localStorage: Ensure Finance user exists
      if (!initialUsers.find(u => u.email === 'finance@food.com')) {
        initialUsers.push({ id: 'fin1', name: 'Finance Officer', role: 'finance', email: 'finance@food.com', password: '123', approved: true });
      }
      if (!initialUsers.find(u => u.email === 'parent@food.com')) {
        initialUsers.push({ id: 'p1', name: 'Parent User', role: 'parent', email: 'parent@food.com', password: '123', approved: true, phone: '08199999999' });
      }

      // Ensure admin user has correct role ID if coming from old storage
      const adminUser = initialUsers.find(u => u.id === 'admin');
      if (adminUser && !adminUser.adminRoleId) {
        adminUser.adminRoleId = 'role_super_admin';
      }

      return initialUsers;
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

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('messages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse messages', e);
      return [];
    }
  });

  useEffect(() => { localStorage.setItem('users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('foods', JSON.stringify(foods)); }, [foods]);
  useEffect(() => { localStorage.setItem('orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('messages', JSON.stringify(messages)); }, [messages]);

  // --- SINGLE DAILY BATCH LOGIC ---
  // Rules: Open 08:00 - 13:00. Cutoff 13:00 SHARP.
  const [serverTime, setServerTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute (or second if we want precise countdowns)
    const timer = setInterval(() => setServerTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getSystemStatus = () => {
    const hour = serverTime.getHours();
    const minute = serverTime.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // 08:00 = 480 mins
    // 13:00 = 780 mins

    const isOpen = totalMinutes >= 480 && totalMinutes < 780;

    let phase = 'CLOSED_FOR_DAY'; // Default
    if (totalMinutes < 480) phase = 'NOT_OPEN_YET';
    else if (isOpen) phase = 'ORDERING';
    else phase = 'COOKING'; // >= 13:00

    // Time Remaining for Ordering Phase
    let remainingStr = '';
    if (phase === 'ORDERING') {
      const remainingTotal = 780 - totalMinutes;
      const h = Math.floor(remainingTotal / 60);
      const m = remainingTotal % 60;
      remainingStr = `${h}h ${m}m remaining`;
    }

    return { isOpen, phase, remainingStr };
  };

  const { isOpen: isOrderingOpen, phase: orderingPhase, remainingStr: timeRemaining } = getSystemStatus();

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

    return { success: true, user: newUser };
  };

  const toggleUserStatus = (id, status) => {
    setUsers(users.map(u => u.id === id ? { ...u, approved: status } : u));
  };

  const updateUser = (id, updates) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const createUser = (userData) => {
    if (users.find(u => u.email === userData.email)) {
      return { success: false, message: 'Email already exists' };
    }
    const newUser = {
      ...userData,
      id: `${userData.role}-${Date.now()}`,
      approved: true
    };
    setUsers([...users, newUser]);
    return { success: true };
  };

  const addFood = (foodData) => {
    const newFood = { ...foodData, id: `f${Date.now()}`, merchantId: currentUser.id };
    setFoods([...foods, newFood]);
  };

  const updateFood = (id, updates) => {
    setFoods(foods.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFood = (id) => {
    setFoods(foods.filter(f => f.id !== id));
  };

  const topUp = (amount) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, balance: (currentUser.balance || 0) + amount };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  // Helper: Calculate price displayed to customer (Base + 15%)
  const getDisplayPrice = (basePrice) => {
    return basePrice + Math.floor(basePrice * 0.15);
  };

  const placeOrder = (cartItems, shelterId, notes, paymentMethod) => {
    if (!currentUser) return { success: false, message: 'Not logged in' };

    // Strict Server-Side Check for Cutoff
    if (!isOrderingOpen) {
      return { success: false, message: 'Order hari ini sudah tutup. Silakan pesan besok pagi jam 08:00.' };
    }

    // Check if Merchant is Suspended
    if (cartItems.length > 0) {
      const merchantId = cartItems[0].merchantId;
      const merchant = users.find(u => u.id === merchantId);
      if (merchant && (merchant.status === 'SUSPENDED' || merchant.status === 'PERMANENT_BAN')) {
        return { success: false, message: 'Merchant is currently suspended and cannot accept orders.' };
      }
    }

    // Determine who the order is for (Receiver) and who is paying (Payer)
    const receiver = orderingFor || currentUser;
    const payer = currentUser;

    // Calculate totals based on Item Level to match Customer UI
    let totalBasePrice = 0;
    let totalDisplayPrice = 0;

    const enrichedItems = cartItems.map(item => {
      const basePrice = item.price;
      const platformFee = Math.floor(basePrice * 0.15);
      const finalPrice = basePrice + platformFee;

      totalBasePrice += basePrice * item.quantity;
      totalDisplayPrice += finalPrice * item.quantity;

      return {
        ...item,
        basePrice: basePrice,
        platformFee: platformFee,
        finalPrice: finalPrice
      };
    });

    const totalPlatformFee = totalDisplayPrice - totalBasePrice;

    if (paymentMethod === 'wallet') {
      if ((payer.balance || 0) < totalDisplayPrice) {
        return { success: false, message: 'Insufficient balance' };
      }
      // Deduct balance from PAYER
      const updatedPayer = { ...payer, balance: payer.balance - totalDisplayPrice };

      // Update local state for currentUser immediately if they are the payer
      if (currentUser.id === payer.id) {
        setCurrentUser(updatedPayer);
      }

      // Update users list
      setUsers(users.map(u => u.id === payer.id ? updatedPayer : u));
    }

    const newOrder = {
      id: `ord-${Date.now()}`,
      customerId: receiver.id, // The Student (Receiver)
      orderedById: payer.id,   // The Parent (Payer)
      items: enrichedItems, // Stores breakdown per item
      basePrice: totalBasePrice, // Merchant Payout
      handlingFee: totalPlatformFee, // Platform Profit
      total: totalDisplayPrice, // Customer Paid
      shelterId,
      status: 'pending',
      timestamp: new Date().toISOString(),
      notes: notes || '',
      paymentMethod: paymentMethod || 'wallet'
    };

    setOrders([...orders, newOrder]);

    // Auto-inject summary message
    const itemsList = cartItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
    const noteText = notes ? notes : '-';
    const summaryText = `Order Summary:\n${itemsList}\n\nNote: ${noteText}`;

    const summaryMsg = {
      id: `msg-${Date.now()}`,
      orderId: newOrder.id,
      senderId: payer.id, // Message sent by Payer
      text: summaryText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, summaryMsg]);

    return { success: true };
  };

  // Incident Reports State
  const [incidentReports, setIncidentReports] = useState(() => {
    try {
      const saved = localStorage.getItem('incidentReports');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse incidentReports', e);
      return [];
    }
  });

  useEffect(() => { localStorage.setItem('incidentReports', JSON.stringify(incidentReports)); }, [incidentReports]);

  const reportIncident = (orderId, merchantId, type, description, evidence) => {
    const newReport = {
      id: `rep-${Date.now()}`,
      orderId,
      merchantId,
      customerId: currentUser?.id,
      type, // 'Wrong Food', 'Bad Quality', 'Late Delivery', 'Rude Behavior'
      description,
      evidence, // URL or base64
      status: 'pending', // 'pending', 'resolved', 'escalated'
      timestamp: new Date().toISOString()
    };
    setIncidentReports([...incidentReports, newReport]);
    return { success: true };
  };

  const updateIncidentReport = (id, status, adminNotes = '') => {
    setIncidentReports(incidentReports.map(rep =>
      rep.id === id ? { ...rep, status, adminNotes } : rep
    ));
  };


  // Merchant Suspension Logic
  const suspendMerchant = (merchantId, durationDays, reason) => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === merchantId) {
        return {
          ...u,
          status: 'SUSPENDED', // 'ACTIVE', 'SUSPENDED', 'PERMANENT_BAN'
          suspension_end_date: endDate.toISOString(),
          suspension_reason: reason
        };
      }
      return u;
    }));
    return { success: true };
  };

  const unsuspendMerchant = (merchantId) => {
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === merchantId) {
        return {
          ...u,
          status: 'ACTIVE',
          suspension_end_date: null,
          suspension_reason: null
        };
      }
      return u;
    }));
    return { success: true };
  };

  // Check for expired suspensions (Auto-Unsuspend)
  useEffect(() => {
    const now = new Date();
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.status === 'SUSPENDED' && u.suspension_end_date) {
        const end = new Date(u.suspension_end_date);
        if (now >= end) {
          // Auto unsuspend
          return { ...u, status: 'ACTIVE', suspension_end_date: null, suspension_reason: null };
        }
      }
      return u;
    }));
  }, []); // Run once on mount


  const updateOrder = (orderId, status, additionalData = {}) => {
    let updates = { status, ...additionalData };

    // Late Delivery Detection
    if (status === 'delivered_to_shelter') {
      const now = serverTime; // Use the synchronized serverTime
      const cutoff = new Date(now);
      cutoff.setHours(16, 30, 0, 0);

      if (now > cutoff) {
        const diffMs = now - cutoff;
        const minutesLate = Math.ceil(diffMs / 60000);
        updates.is_late_delivery = true;
        updates.minutes_late = minutesLate;
      }
    }

    setOrders(orders.map(o => o.id === orderId ? { ...o, ...updates } : o));
  };

  const [shelters, setShelters] = useState(() => {
    try {
      const saved = localStorage.getItem('shelters');
      return saved ? JSON.parse(saved) : [
        { id: 's1', name: 'Main Lobby', detail: 'Near the reception desk', opening_time: '08:00', closing_time: '20:00' },
        { id: 's2', name: 'Library Entrance', detail: 'By the main glass doors', opening_time: '09:00', closing_time: '17:00' },
        { id: 's3', name: 'Tech Park Gate', detail: 'Security post 1', opening_time: '07:00', closing_time: '22:00' }
      ];
    } catch (e) {
      console.error('Failed to parse shelters', e);
      return [];
    }
  });

  useEffect(() => { localStorage.setItem('shelters', JSON.stringify(shelters)); }, [shelters]);

  const addShelter = (name, detail, opening_time = '08:00', closing_time = '20:00') => {
    const newShelter = { id: `s${Date.now()}`, name, detail, opening_time, closing_time };
    setShelters([...shelters, newShelter]);
  };

  const updateShelter = (id, updates) => {
    setShelters(shelters.map(s => s.id === id ? { ...s, ...updates } : s));
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

  // Master Data: Dorms & Rooms
  const [dorms, setDorms] = useState(() => {
    try {
      const saved = localStorage.getItem('dorms');
      return saved ? JSON.parse(saved) : [
        { id: 'd1', name: 'Asrama Putra A', location_area: 'North Campus' },
        { id: 'd2', name: 'Asrama Putri C', location_area: 'South Campus' }
      ];
    } catch (e) {
      console.error('Failed to parse dorms', e);
      return [];
    }
  });

  const [rooms, setRooms] = useState(() => {
    try {
      const saved = localStorage.getItem('rooms');
      return saved ? JSON.parse(saved) : [
        { id: 'r1', dormId: 'd1', room_number: '101' },
        { id: 'r2', dormId: 'd1', room_number: '102' },
        { id: 'r3', dormId: 'd2', room_number: '201' },
        { id: 'r4', dormId: 'd2', room_number: '202' }
      ];
    } catch (e) {
      console.error('Failed to parse rooms', e);
      return [];
    }
  });

  useEffect(() => { localStorage.setItem('dorms', JSON.stringify(dorms)); }, [dorms]);
  useEffect(() => { localStorage.setItem('dorms', JSON.stringify(dorms)); }, [dorms]);
  useEffect(() => { localStorage.setItem('rooms', JSON.stringify(rooms)); }, [rooms]);

  // Vendor Invoices
  const [vendorInvoices, setVendorInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('vendorInvoices');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse vendorInvoices', e);
      return [];
    }
  });

  useEffect(() => { localStorage.setItem('vendorInvoices', JSON.stringify(vendorInvoices)); }, [vendorInvoices]);

  const createVendorInvoice = (invoiceData) => {
    const newInvoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      status: 'unpaid', // unpaid | paid
      createdAt: new Date().toISOString()
    };
    setVendorInvoices([...vendorInvoices, newInvoice]);
    return { success: true };
  };

  const updateVendorInvoiceStatus = (id, status) => {
    setVendorInvoices(vendorInvoices.map(inv => inv.id === id ? { ...inv, status } : inv));
  };

  const deleteVendorInvoice = (id) => {
    setVendorInvoices(vendorInvoices.filter(inv => inv.id !== id));
  };

  const addDorm = (name, location_area) => {
    const newDorm = { id: `d${Date.now()}`, name, location_area };
    setDorms([...dorms, newDorm]);
  };

  const updateDorm = (id, updates) => {
    setDorms(dorms.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDorm = (id) => {
    setDorms(dorms.filter(d => d.id !== id));
    // Also delete associated rooms? Optional but good practice.
    setRooms(rooms.filter(r => r.dormId !== id));
  };

  const addRoom = (dormId, room_number) => {
    const newRoom = { id: `r${Date.now()}`, dormId, room_number };
    setRooms([...rooms, newRoom]);
  };

  const updateRoom = (id, updates) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRoom = (id) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

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

  const updateWithdrawalStatus = (id, status) => {
    setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status } : w));
  };

  const sendMessage = (orderId, senderId, text, image = null) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    if (['pending', 'completed', 'delivered_to_shelter', 'rejected'].includes(order.status)) {
      return { success: false, message: 'Chat is closed for this order status.' };
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      orderId,
      senderId,
      text,
      image,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, newMessage]);
    return { success: true };
  };

  // Global Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isAlert: false
  });

  const showConfirm = (title, message, onConfirm) => {
    setModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        setModal(prev => ({ ...prev, isOpen: false }));
      },
      isAlert: false
    });
  };

  const showAlert = (title, message, onConfirm = null) => {
    setModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        setModal(prev => ({ ...prev, isOpen: false }));
      },
      isAlert: true
    });
  };

  const [familyLinks, setFamilyLinks] = useState(() => {
    try {
      const saved = localStorage.getItem('familyLinks');
      let links = saved ? JSON.parse(saved) : [];

      // Ensure default link p1 -> c1 exists for demo
      if (!links.find(l => l.parentId === 'p1' && l.studentId === 'c1')) {
        links.push({ id: 'fl-1', parentId: 'p1', studentId: 'c1', createdAt: new Date().toISOString() });
      }

      return links;
    } catch (e) {
      console.error('Failed to parse familyLinks', e);
      return [];
    }
  });

  useEffect(() => { localStorage.setItem('familyLinks', JSON.stringify(familyLinks)); }, [familyLinks]);

  const [orderingFor, setOrderingFor] = useState(() => {
    try {
      const saved = localStorage.getItem('orderingFor');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (orderingFor) {
      localStorage.setItem('orderingFor', JSON.stringify(orderingFor));
    } else {
      localStorage.removeItem('orderingFor');
    }
  }, [orderingFor]);

  // Update orderingFor when currentUser changes
  useEffect(() => {
    if (currentUser) {
      // If not set (e.g. fresh login), default to current user
      // On refresh, it will be restored from localStorage so this won't overwrite
      setOrderingFor(prev => prev || currentUser);
    } else {
      setOrderingFor(null);
    }
  }, [currentUser]);

  const linkFamily = (parentId, studentId) => {
    // Check if already linked
    if (familyLinks.find(l => l.parentId === parentId && l.studentId === studentId)) {
      return { success: false, message: 'Already linked' };
    }
    const newLink = {
      id: `fl-${Date.now()}`,
      parentId,
      studentId,
      createdAt: new Date().toISOString()
    };
    setFamilyLinks([...familyLinks, newLink]);
    return { success: true };
  };

  const unlinkFamily = (linkId) => {
    setFamilyLinks(familyLinks.filter(l => l.id !== linkId));
  };

  const getFamilyMembers = (parentId) => {
    const links = familyLinks.filter(l => l.parentId === parentId);
    return links.map(l => {
      const student = users.find(u => u.id === l.studentId);
      return { ...student, linkId: l.id };
    }).filter(s => s && s.id); // Filter out any nulls if user deleted
  };



  return (
    <AppContext.Provider value={{
      users, currentUser, foods, orders, shelters, withdrawals, messages, dorms, rooms, familyLinks, orderingFor, setOrderingFor,
      incidentReports, reportIncident, updateIncidentReport, suspendMerchant, unsuspendMerchant,
      roles, addRole, updateRole, deleteRole, hasPermission, AVAILABLE_PERMISSIONS,
      login, logout, register, toggleUserStatus, createUser, updateUser, deleteUser, addFood, updateFood, deleteFood, topUp, placeOrder, updateOrder,
      addShelter, updateShelter, deleteShelter, requestWithdrawal, updateWithdrawalStatus, sendMessage,
      addDorm, updateDorm, deleteDorm, addRoom, updateRoom, deleteRoom,
      vendorInvoices, createVendorInvoice, updateVendorInvoiceStatus, deleteVendorInvoice,
      linkFamily, unlinkFamily, getFamilyMembers,
      showAlert, showConfirm, getDisplayPrice,
      isOrderingOpen, orderingPhase, timeRemaining, serverTime
    }}>
      {children}
      <ConfirmationModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
        isAlert={modal.isAlert}
      />
    </AppContext.Provider>
  );
};
