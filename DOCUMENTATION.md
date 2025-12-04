# EAT.Z - Future of Food Ordering | Project Documentation

## 1. Project Overview
**EAT.Z** is a futuristic, Gen Z-inspired food delivery application designed to streamline the connection between hungry customers and local merchants within a specific campus or facility. The application focuses on a "pinpoint" delivery system where orders are delivered to specific, pre-defined shelters or landmarks rather than arbitrary addresses, ensuring efficiency and security.

## 2. Project Goals
*   **Efficiency**: Simplify the ordering process with a "pinpoint" location system.
*   **Aesthetic**: Provide a modern, engaging, and "Gen Z" visual experience using neon colors, glassmorphism, and dynamic interactions.
*   **Empowerment**: Enable local merchants to easily manage their digital storefronts and finances.
*   **Control**: Give administrators full oversight of the platform's users and master data.

## 3. Features by Role

### 👤 Customer
*   **Authentication**: Sign up and log in securely.
*   **Browse & Search**: View all available food items, filter by category (e.g., Fast Food, Japanese), and search by name.
*   **Wallet System**: Top up digital balance for seamless payments.
*   **Cart Management**: Add items, adjust quantities, and view total cost.
*   **Checkout**: Select a specific **Pinpoint Location (Shelter)** for pickup and choose between Wallet or Cash payment.
*   **Order Tracking**: View the status of active orders (Pending -> Accepted -> Cooking -> Arrived).
*   **Chat**: Communicate with merchants during the cooking phase.

### 🏪 Merchant
*   **Onboarding**: Register a new merchant account (requires Admin approval).
*   **Dashboard**: View real-time statistics:
    *   **Total Earnings (Net Revenue)**: Projected revenue from active and completed orders (excluding platform fees and rejected/cancelled orders).
    *   **Available Balance**: Withdrawable funds from completed orders.
    *   Sales Charts (Weekly/Monthly/Yearly).
*   **Menu Management**:
    *   Add new food items with images and descriptions.
    *   Edit existing items.
    *   Toggle item availability (Active/Inactive).
*   **Order Management**:
    *   Receive incoming orders.
    *   **Accept** or **Reject** orders.
        *   **Rejection Workflow**: Must provide a mandatory reason when rejecting an order.
    *   **Chat**: Communicate with customers using **Quick Replies** and image attachments.
    *   Mark orders as **Arrived at Shelter** (requires photo proof).
*   **Financials**:
    *   View "Available Balance" (Revenue from completed orders).
    *   Request **Withdrawals** to a bank account.

### 💰 Finance
*   **Dashboard**: Dedicated view for financial oversight.
*   **Transaction History**:
    *   View all orders with breakdown of Base Price, Handling Fee (Platform Revenue), and Total.
    *   **Default Sorting**: Newest orders first.
    *   **Filtering**: Filter by status (All, Pending, Cooking, Delivered, Completed, Cancelled).
    *   **Columns**: Includes Merchant Name for better tracking.
*   **Financial Reports**: Daily, Weekly, and Monthly breakdowns of Total Revenue, Net Merchant Payout, and Platform Profit.
*   **Withdrawal Management**:
    *   View list of merchant withdrawal requests.
    *   **Approve** or **Reject** requests.
*   **Merchant Fee Breakdown**: View handling fees generated per merchant.

### 🛡️ Admin
*   **User Management**:
    *   **Verification**: Approve pending Merchant and Customer registrations.
    *   **User List**: Filter by Role (All, Merchant, Customer, Admin, **Finance**).
    *   **Add User**: Create new **Admin** or **Finance** accounts directly.
    *   **Edit/Delete**: Manage user details and access.
*   **Order Monitor**:
    *   Track all orders in real-time.
    *   **History**: View completed/cancelled orders.
    *   **Rejection Details**: See the specific reason why an order was rejected/cancelled (via tooltip).
    *   **Fingerprint Verification**: Simulate biometric verification for student identity confirmation at shelters.
*   **Master Data**:
    *   **Locations (Shelters)**: Manage pickup points with opening/closing times.
    *   **Dorms & Rooms**: Manage student housing data.

---

## 4. Business Process & UX Flows

This section outlines the core user journeys, designed to guide UX/UI development. It maps user actions to system responses and key UI states.

### 4.1. Customer Journey: Ordering Food
| Step | User Action | System Logic / UX Response |
| :--- | :--- | :--- |
| **1. Discovery** | User browses Home Page or searches for "Burger". | **UI**: Displays `FoodCard` grid. Shows ratings and delivery time.<br>**System**: Filters `foods` array by active status. |
| **2. Selection** | User clicks **"Add to Cart"** on an item. | **Logic**: Check `cart[0].merchantId` vs `newItem.merchantId`.<br>**UX (Pass)**: Toast "Added to cart". Cart counter +1.<br>**UX (Fail)**: **Alert Modal**: "Different Merchant. Clear cart?" |
| **3. Checkout** | User opens Cart, selects **Shelter**, and clicks **Checkout**. | **UI**: Dropdown for `shelters` (shows Open/Closed status). Total price calculation includes **15% Handling Fee**.<br>**System**: Validates balance (if Wallet). Creates `order` object with fee breakdown. |
| **4. Waiting** | User waits for food. | **UI**: Order Detail page shows Status Stepper.<br>**States**: `Pending` ➝ `Cooking` ➝ `Arrived`. |
| **5. Chatting** | User sends a message during "Cooking" phase. | **UI**: Chat window enabled with **Digital Receipt** history.<br>**System**: Pushes message to `messages` array. |
| **6. Pickup** | User sees "Arrived" status. | **UI**: Green notification card: "Food is waiting at [Location]!". |

### 4.2. Merchant Journey: Fulfillment
| Step | User Action | System Logic / UX Response |
| :--- | :--- | :--- |
| **1. Notification** | Merchant receives new order. | **UI**: "Incoming Orders" tab shows red badge.<br>**Card**: Shows items, total, and **Accept/Reject** buttons. |
| **2. Action (Accept)** | Merchant clicks **"Accept"**. | **System**: Updates order status to `cooking`.<br>**UI**: Order moves to "Active Orders" list. |
| **2. Action (Reject)** | Merchant clicks **"Reject"**. | **UI**: **Rejection Modal** opens. Requires reason input.<br>**System**: Updates status to `cancelled` with `rejection_reason`. |
| **3. Delivery** | Merchant arrives at Shelter and clicks **"Mark Arrived"**. | **UX**: **Photo Upload Modal** opens (Critical Step).<br>**System**: Auto-compresses image and prevents status update until photo is present. |
| **4. Validation** | Merchant takes/uploads photo and submits. | **System**: Updates status to `delivered_to_shelter`.<br>**UI**: Toast "Customer notified". |

### 4.3. Admin Journey: Management
| Step | User Action | System Logic / UX Response |
| :--- | :--- | :--- |
| **1. Verification** | Admin views "Verification" tab. | **UI**: List of pending users with **Approve** button.<br>**System**: Filters `users` where `approved: false`. |
| **2. User Mgmt** | Admin adds a new staff member. | **UI**: **Add User Modal** allows selecting "Admin" or "Finance" role. |
| **3. Monitoring** | Admin checks "Order Monitor". | **UI**: Views active orders. For cancelled orders, hovers over icon to see **Rejection Reason**. |
| **4. Biometrics** | Admin simulates verification at shelter. | **UI**: **Fingerprint Modal** simulates scanning process.<br>**System**: Updates order to `completed`. |

### 4.4. Finance Journey: Financial Oversight
| Step | User Action | System Logic / UX Response |
| :--- | :--- | :--- |
| **1. Overview** | Finance Officer views Dashboard. | **UI**: Cards for Total Revenue, Net Payout, Platform Profit.<br>**Data**: Calculated from `orders` array. |
| **2. Transactions** | Finance Officer audits history. | **UI**: Table sorted by **Newest First**. Filters by **Status**. Shows **Merchant Name**. |
| **3. Withdrawals** | Finance Officer views "Withdrawals" tab. | **UI**: List of pending requests.<br>**Action**: Click **Approve** or **Reject**. |

---

## 5. User Flows (Flowcharts)

### Customer Flow
```mermaid
graph TD
    A[Start] --> B{Has Account?}
    B -- No --> C[Register]
    B -- Yes --> D[Login]
    C --> E[Wait for Approval]
    D --> F[Home Page]
    F --> G[Browse/Search Food]
    G --> H[Add to Cart]
    H --> I{Cart has items from other merchant?}
    I -- Yes --> J[Prompt: Clear Cart?]
    J -- Yes --> K[Clear & Add New Item]
    J -- No --> L[Cancel Add]
    I -- No --> K
    K --> M[View Cart]
    M --> N[Select Pinpoint Location]
    N --> O[Select Payment Method]
    O --> P[Place Order (Base + 15% Fee)]
    P --> Q[Order Pending]
    Q --> R{Merchant Action}
    R -- Accepted --> S[Cooking]
    S --> T[Chat Available]
    R -- Rejected --> U[Rejection Modal (Reason Required)]
    U --> V[Order Cancelled]
    S --> W[Merchant Arrives]
    W --> X[Photo Proof Uploaded]
    X --> Y[Order Arrived]
    Y --> Z[Customer Pickup]
    Z --> AA[Order Completed]
```

### Merchant Flow
```mermaid
graph TD
    A[Start] --> B{Has Account?}
    B -- No --> C[Register]
    B -- Yes --> D[Login]
    C --> E[Wait for Approval]
    D --> F[Merchant Dashboard]
    F --> G{Action?}
    G -- Manage Menu --> H[Add/Edit/Delete Food]
    G -- Manage Orders --> I[View Incoming Orders]
    I --> J{Decision}
    J -- Accept --> K[Cooking]
    J -- Reject --> L[Input Rejection Reason]
    L --> M[Cancel Order]
    K --> N[Deliver to Shelter]
    N --> O[Upload Photo Proof]
    O --> P[Mark Arrived]
    P --> Q[Customer Pickup]
    Q --> R[Mark Completed]
    R --> S[Revenue Added (Base Price)]
    G -- Finance --> T[Request Withdrawal]
```

### Finance Flow
```mermaid
graph TD
    A[Login] --> B[Finance Dashboard]
    B --> C{Task?}
    C -- Overview --> D[View Financial Stats]
    C -- Transactions --> E[Audit Order History (Filter/Sort)]
    C -- Withdrawals --> F[Approve/Reject Requests]
```

---

## 6. User Guide

### For Customers
1.  **Registration**: Go to the Sign-Up page. Fill in your details, including **Dorm** and **Room**. Note that you may need to wait for Admin approval before logging in.
2.  **Top Up**: On the Home page, click the "+" icon next to your balance to add funds to your wallet.
3.  **Ordering**:
    *   Browse the "Popular" or "All Food" sections.
    *   Click "Add" on items you crave. **Note:** You can only order from one merchant at a time.
    *   Go to the "Cart" (shopping bag icon).
    *   **Crucial Step**: Select your **Pickup Location** from the dropdown. Locations have operating hours and will be closed if outside that window.
    *   Click "Checkout". **Note**: A 15% handling fee is added to the total.
4.  **Status**: You will be notified when the merchant accepts your order. You can chat with them while they are cooking.

### For Merchants
1.  **Setup**: Register as a merchant. Once approved, log in.
2.  **Menu**: Go to the "Menu" tab. Click "Add New Item" or use the **Edit/Delete** buttons to manage your offerings.
3.  **Processing Orders**:
    *   Go to the "Orders" tab.
    *   Click **Accept** on incoming orders.
    *   **Reject**: If you cannot fulfill an order, click Reject and provide a reason (e.g., "Out of Stock").
    *   **Chat**: Use "Quick Reply" buttons for faster communication.
    *   **Delivery**: When you arrive at the shelter, click **"Mark Arrived"**. You **MUST** upload a photo of the food at the location to proceed.
4.  **Getting Paid**:
    *   Go to the "Dashboard" tab.
    *   Check your **Total Earnings** (Net Revenue) to see your daily performance.
    *   Check your **Available Balance** (Revenue from completed orders minus fees).
    *   Click **Withdraw**, enter your bank details, and submit.

### For Finance Officers
1.  **Overview**: Monitor total platform revenue and profit.
2.  **Transactions**: Use the **Transaction History** tab to audit orders. Use the **Status Filter** to find specific transactions (e.g., Cancelled orders).
3.  **Withdrawals**: Review pending withdrawal requests from merchants. Approve valid requests to release funds.

### For Admins
1.  **Verification**: Check the "Verification" tab daily. New users cannot access the platform until you click **Approve**.
2.  **User Management**:
    *   Use the **User List** to manage all accounts.
    *   Filter by **[Finance]** to see finance staff.
    *   Click **Add User** to create new Admin or Finance accounts.
3.  **Order Monitor**:
    *   Track active orders.
    *   For cancelled orders, hover over the info icon to see the **Rejection Reason**.
    *   Use the **Fingerprint Verification** modal (simulated) to confirm student identity at pickup.
4.  **Master Data**: Manage Locations, Dorms, and Rooms.

---

## 7. Developer Documentation

### 7.1. Project Structure
```
src/
├── components/         # Reusable UI components (Modal, ConfirmationModal, etc.)
├── context/
│   ├── AppContext.jsx  # Global state management (Users, Orders, Foods, etc.)
│   └── ToastContext.jsx # Toast notification system
├── pages/
│   ├── Admin/          # Admin Dashboard & Finance Dashboard
│   ├── Auth/           # Login & Register pages
│   ├── Customer/       # Customer-facing pages (Home, Cart, Profile, etc.)
│   └── Merchant/       # Merchant Dashboard
├── App.jsx             # Main routing configuration
└── main.jsx            # Entry point
```

### 7.2. Key Concepts
*   **Role-Based Access Control (RBAC)**: Implemented in `App.jsx` via `ProtectedRoute`. Roles: `customer`, `merchant`, `admin`, `finance`.
*   **State Management**: `AppContext.jsx` uses `useState` and `localStorage` to mock a backend database. All data (users, orders, etc.) persists in the browser's local storage.
*   **Pricing Logic**:
    *   **Base Price**: Sum of item prices.
    *   **Handling Fee**: 15% of Base Price (rounded down).
    *   **Total Price**: Base Price + Handling Fee.
    *   **Merchant Revenue**: Only the Base Price is credited to the merchant's available balance.
*   **Shelter Logic**: Shelters have `opening_time` and `closing_time`. The Cart validates these times before allowing checkout.

### 7.3. Setup & Running
1.  **Install Dependencies**: `npm install`
2.  **Run Development Server**: `npm run dev`
3.  **Build for Production**: `npm run build`

### 7.4. Mock Data
The application initializes with mock data in `AppContext.jsx` if `localStorage` is empty.
*   **Admin**: `admin@food.com` / `123`
*   **Finance**: `finance@food.com` / `123`
*   **Merchant**: `burger@food.com` / `123` (Neon Burger)
*   **Customer**: `john@food.com` / `123`

### 7.5. Future Improvements
*   Replace `localStorage` with a real backend (Node.js/Express + MongoDB/PostgreSQL).
*   Implement real-time socket communication for chat and order updates.
*   Integrate a real payment gateway.

