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
*   **Order Tracking**: View the status of active orders (Pending -> Accepted -> Completed).

### 🏪 Merchant
*   **Onboarding**: Register a new merchant account (requires Admin approval).
*   **Dashboard**: View real-time statistics:
    *   Total Revenue
    *   Available Balance (Withdrawable)
    *   Sales Charts (Weekly/Monthly/Yearly)
*   **Menu Management**:
    *   Add new food items with images and descriptions.
    *   Edit existing items.
    *   Toggle item availability (Active/Inactive).
*   **Order Management**:
    *   Receive incoming orders.
    *   **Accept** or **Reject** orders.
    *   Mark orders as **Completed** once delivered.
*   **Financials**:
    *   View "Available Balance" (Revenue from completed orders).
    *   Request **Withdrawals** to a bank account.

### 🛡️ Admin
*   **Dashboard**: Comprehensive overview of platform health (Total Users, Active Merchants, Total Orders, Total Revenue).
*   **User Verification**:
    *   Review pending Merchant and Customer registrations.
    *   **Approve** or **Ban** users.
*   **User Management**: View all users and manage their access status.
*   **Master Data (Locations)**:
    *   Manage the list of "Pinpoint" locations (Shelters).
    *   Add new locations with specific details (e.g., "Lobby A - Near Elevator").
    *   Delete obsolete locations.

---

## 4. Business Process & UX Flows

This section outlines the core user journeys, designed to guide UX/UI development. It maps user actions to system responses and key UI states.

### 4.1. Customer Journey: Ordering Food
| Step | User Action | System Logic / UX Response |
| :--- | :--- | :--- |
| **1. Discovery** | User browses Home Page or searches for "Burger". | **UI**: Displays `FoodCard` grid. Shows ratings and delivery time.<br>**System**: Filters `foods` array by active status. |
| **2. Selection** | User clicks **"Add to Cart"** on an item. | **Logic**: Check `cart[0].merchantId` vs `newItem.merchantId`.<br>**UX (Pass)**: Toast "Added to cart". Cart counter +1.<br>**UX (Fail)**: **Alert Modal**: "Different Merchant. Clear cart?" |
| **3. Checkout** | User opens Cart, selects **Shelter**, and clicks **Checkout**. | **UI**: Dropdown for `shelters`. Total price calculation.<br>**System**: Validates balance (if Wallet). Creates `order` object. |
| **4. Waiting** | User waits for food. | **UI**: Order Detail page shows Status Stepper.<br>**States**: `Pending` ➝ `Cooking` ➝ `Arrived`. |
| **5. Chatting** | User sends a message during "Cooking" phase. | **UI**: Chat window enabled.<br>**System**: Pushes message to `messages` array. |
| **6. Pickup** | User sees "Arrived" status. | **UI**: Green notification card: "Food is waiting at [Location]!". |

### 4.2. Merchant Journey: Fulfillment
| Step | User Action | System Logic / UX Response |
| :--- | :--- | :--- |
| **1. Notification** | Merchant receives new order. | **UI**: "Incoming Orders" tab shows red badge.<br>**Card**: Shows items, total, and **Accept/Reject** buttons. |
| **2. Action** | Merchant clicks **"Accept"**. | **System**: Updates order status to `cooking`.<br>**UI**: Order moves to "Active Orders" list. |
| **3. Delivery** | Merchant arrives at Shelter and clicks **"Mark Arrived"**. | **UX**: **Photo Upload Modal** opens (Critical Step).<br>**System**: Prevents status update until photo is present. |
| **4. Validation** | Merchant takes/uploads photo and submits. | **System**: Updates status to `delivered_to_shelter`.<br>**UI**: Toast "Customer notified". |

### 4.3. Admin Journey: Management
| Step | User Action | System Logic / UX Response |
| :--- | :--- | :--- |
| **1. Verification** | Admin views "Verification" tab. | **UI**: List of pending users with **Approve** button.<br>**System**: Filters `users` where `approved: false`. |
| **2. Monitoring** | Admin checks "Revenue" chart. | **UI**: Area Chart showing income trends.<br>**Data**: Aggregates `orders` by timestamp. |
| **3. Master Data** | Admin edits a Location. | **UX**: **Edit Modal** appears with Name/Detail inputs.<br>**System**: Updates `shelters` array. |

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
    O --> P[Place Order]
    P --> Q[Order Pending]
    Q --> R{Merchant Action}
    R -- Accepted --> S[Cooking]
    S --> T[Chat Available]
    R -- Rejected --> U[Refund/Cancelled]
    S --> V[Merchant Arrives]
    V --> W[Photo Proof Uploaded]
    W --> X[Order Arrived]
    X --> Y[Customer Pickup]
    Y --> Z[Order Completed]
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
    J -- Reject --> L[Cancel Order]
    K --> M[Deliver to Shelter]
    M --> N[Upload Photo Proof]
    N --> O[Mark Arrived]
    O --> P[Customer Pickup]
    P --> Q[Mark Completed]
    Q --> R[Revenue Added]
    G -- Finance --> S[Request Withdrawal]
```

### Admin Flow
```mermaid
graph TD
    A[Login] --> B[Admin Dashboard]
    B --> C{Task?}
    C -- Verification --> D[Approve/Reject Users]
    C -- Monitoring --> E[View Revenue Charts & Activity]
    C -- Master Data --> F[Add/Edit/Delete Locations]
    C -- User Mgmt --> G[Edit/Reset/Delete Users]
```

---

## 6. User Guide

### For Customers
1.  **Registration**: Go to the Sign-Up page. Fill in your details. Note that you may need to wait for Admin approval before logging in.
2.  **Top Up**: On the Home page, click the "+" icon next to your balance to add funds to your wallet.
3.  **Ordering**:
    *   Browse the "Popular" or "All Food" sections.
    *   Click "Add" on items you crave. **Note:** You can only order from one merchant at a time.
    *   Go to the "Cart" (shopping bag icon).
    *   **Crucial Step**: Select your **Pickup Location** from the dropdown.
    *   Click "Checkout".
4.  **Status**: You will be notified when the merchant accepts your order. You can chat with them while they are cooking.

### For Merchants
1.  **Setup**: Register as a merchant. Once approved, log in.
2.  **Menu**: Go to the "Menu" tab. Click "Add New Item" or use the **Edit/Delete** buttons to manage your offerings.
3.  **Processing Orders**:
    *   Go to the "Orders" tab.
    *   Click **Accept** on incoming orders.
    *   **Delivery**: When you arrive at the shelter, click **"Mark Arrived"**. You **MUST** upload a photo of the food at the location to proceed.
4.  **Getting Paid**:
    *   Go to the "Dashboard" tab.
    *   Check your "Available Balance" and "Revenue Charts".
    *   Click **Withdraw**, enter your bank details, and submit.

### For Admins
1.  **Verification**: Check the "Verification" tab daily. New users cannot access the platform until you click **Approve**.
2.  **Locations**: Manage delivery points in the "Locations" tab. You can now **Edit** details if a location changes.
3.  **Oversight**:
    *   Use the "User List" to **Edit**, **Reset Password**, or **Delete** users.
    *   Monitor the "Revenue per Merchant" chart to identify top performers.
