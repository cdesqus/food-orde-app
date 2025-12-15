# EAT.Z - Future of Food Ordering | Project Documentation

## 1. Project Overview
**EAT.Z** is a futuristic, Gen Z-inspired food delivery application designed to streamline the connection between hungry customers and local merchants within a specific campus or facility. The application focuses on a "pinpoint" delivery system where orders are delivered to specific, pre-defined shelters or landmarks rather than arbitrary addresses, ensuring efficiency and security.

## 2. Project Goals
*   **Efficiency**: Simplify the ordering process with a "pinpoint" location system.
*   **Aesthetic**: Provide a modern, engaging, and "Gen Z" visual experience using neon colors, glassmorphism, and dynamic interactions.
*   **Empowerment**: Enable local merchants to easily manage their digital storefronts and finances.
*   **Control**: Give administrators full oversight of the platform's users, master data, and compliance.

## 3. Features by Role

### 👤 Customer
*   **Authentication**: Sign up and log in securely.
*   **Browse & Search**: View all available food items, filter by category (e.g., Fast Food, Japanese), and search by name. **Items from suspended merchants are automatically hidden.**
*   **Wallet System**: Top up digital balance for seamless payments.
*   **Cart Management**: Add items, adjust quantities, and view total cost.
*   **Checkout**: Select a specific **Pinpoint Location (Shelter)** for pickup and choose between Wallet or Cash payment.
*   **Order Tracking**: View the status of active orders (Pending -> Accepted -> Cooking -> Arrived).
*   **Chat**: Communicate with merchants during the cooking phase.

### 🏪 Merchant
*   **Onboarding**: Register a new merchant account (requires Admin approval).
*   **Dashboard**: View real-time statistics:
    *   **Total Earnings (Net Revenue)**: Projected revenue from active and completed orders.
    *   **Available Balance**: Withdrawable funds from completed orders.
    *   Sales Charts (Weekly/Monthly/Yearly).
*   **Menu Management**:
    *   Add new food items with images and descriptions.
    *   Edit existing items.
    *   Toggle item availability (Active/Inactive).
*   **Order Management**:
    *   Receive incoming orders.
    *   **Accept** or **Reject** orders (Rejection requires a mandatory reason).
    *   **Chat**: Communicate with customers using **Quick Replies** and image attachments.
    *   Mark orders as **Arrived at Shelter** (requires photo proof).
*   **Financials**:
    *   View "Available Balance".
    *   Request **Withdrawals** to a bank account.

### 💰 Finance
*   **Professional Dashboard**: Dedicated view for financial oversight.
*   **Analytics & Charts**:
    *   **Revenue Trends**: Area chart visualizing revenue vs profit over time.
    *   **Revenue vs Profit**: Bar chart comparison.
    *   **Revenue Distribution**: Pie chart showing Merchant Payouts vs Platform Fees.
*   **Transaction History**:
    *   Detailed order audit trail.
    *   Filter by **Status** (Pending, Cooking, Delivered, Completed, Cancelled).
*   **Vendor Invoicing (Bill Generator)**:
    *   Generate monthly invoices for merchants based on GMV.
    *   **Maintenance Fee**: Automatically calculated at **2.5%** of Total GMV.
    *   Track invoice status (Unpaid/Paid).
*   **Withdrawal Management**: Approve or Reject merchant withdrawal requests.

### 🛡️ Admin
*   **User Management**:
    *   **Verification**: Approve pending Merchant and Customer registrations.
    *   **Access Control**: **Suspend** or **Ban** merchants for policy violations. Reactivate them when compliant.
    *   **Role Management**: Create and assign custom roles (e.g., Super Admin, Finance Staff) with specific permissions.
*   **Order Monitor**:
    *   Track all orders in real-time.
    *   **History**: View completed/cancelled orders with rejection details.
    *   **Fingerprint Verification**: Simulate biometric verification for student identity confirmation at shelters.
*   **Master Data**:
    *   **Locations (Shelters)**: Manage pickup points with opening/closing times.
    *   **Dorms & Rooms**: Manage student housing data.

---

## 4. Business Process & UX Flows

This section outlines the core user journeys, designed to guide UX/UI development.

### 4.1. Customer Journey: Ordering Food
| Step | User Action | System Logic / UX Response |
| :--- | :--- | :--- |
| **1. Discovery** | User browses Home Page. | **System**: Filters out items from `SUSPENDED` merchants.<br>**UI**: Displays available `FoodCard` grid. |
| **2. Selection** | User clicks **"Add to Cart"** on an item. | **Logic**: Check `cart[0].merchantId` vs `newItem.merchantId`.<br>**UX**: Toast "Added to cart" if valid. |
| **3. Checkout** | User opens Cart, selects **Shelter**, and clicks **Checkout**. | **UI**: Dropdown for `shelters` (shows Open/Closed status). Total price calculation includes **15% Handling Fee**.<br>**System**: Validates balance (if Wallet). |
| **4. Pickup** | User sees "Arrived" status. | **UI**: Green notification card: "Food is waiting at [Location]!". |

### 4.2. Merchant Journey: Fulfillment
| Step | User Action | System Logic / UX Response |
| :--- | :--- | :--- |
| **1. Notification** | Merchant receives new order. | **UI**: "Incoming Orders" tab shows red badge. |
| **2. Action** | Merchant clicks **Accept** or **Reject**. | **System**: Updates order status. `cooking` or `cancelled`. |
| **3. Delivery** | Merchant clicks **"Mark Arrived"**. | **UX**: **Photo Upload Modal** opens (Critical Step). |
| **4. Validation** | Merchant uploads photo and submits. | **System**: Updates status to `delivered_to_shelter`. |

### 4.3. Admin Journey: Management
| Step | User Action | System Logic / UX Response |
| :--- | :--- | :--- |
| **1. Verification** | Admin views "Verification" tab. | **UI**: List of pending users with **Approve** button. |
| **2. Suspension** | Admin suspends a merchant. | **UI**: Merchant status changes to `Suspended`. Items hidden on customer side.<br>**System**: `suspendMerchant` function called. |
| **3. Reactivation** | Admin clicks **"Reactivate"**. | **System**: Merchant status restored to `Active`. Items visible again. |

### 4.4. Finance Journey: Financial Oversight
| Step | User Action | System Logic / UX Response |
| :--- | :--- | :--- |
| **1. Analysis** | Finance Officer views Dashboard. | **UI**: Interactive Charts (Area, Bar, Pie) showing financial health. |
| **2. Invoicing** | Finance Officer uses **Bill Generator**. | **UI**: Selects Month. System calculates **2.5% Maintenance Fee** on GMV.<br>**Action**: Click **Generate Invoice**. |
| **3. Withdrawals** | Finance Officer views "Withdrawals" tab. | **UI**: List of pending requests. Action: **Approve** or **Reject**. |

---

## 5. User Flows

### Finance Flow
```mermaid
graph TD
    A[Login] --> B[Finance Dashboard]
    B --> C{Task?}
    C -- Overview --> D[View Charts & Stats]
    C -- Invoicing --> E[Bill Generator (2.5% Fee)]
    E --> G[Generate Monthly Invoice]
    C -- Transactions --> H[Audit Order History]
    C -- Withdrawals --> I[Approve/Reject Requests]
```

---

## 6. User Guide

### For Admins
*   **Suspending Merchants**: In the **User List**, if a merchant violates policies, you can Suspend (Temporary) or Ban (Permanent) them.
    *   **Effect**: The merchant disappears from the customer app immediately.
*   **Reactivating Merchants**: In the **User List**, find the suspended merchant and click **"Reactivate"** to restore their access.
*   **Role Management**: Go to "Roles & Permissions" (Super Admin only) to create custom roles for your team.

### For Finance Officers
*   **Dashboard**: Use the charts to analyze trends in revenue vs profit.
*   **Vendor Invoices**:
    1.  Go to the **"Vendor Invoices"** tab.
    2.  Select the **Month**.
    3.  Review the **Total GMV** and the calculated **Variable Fee (2.5%)**.
    4.  Click **Generate Invoice**.
*   **Withdrawals**: Regularly check for pending withdrawal requests to ensure merchants get paid on time.

---

## 7. Developer Documentation

### 7.1. Key Concepts
*   **Role-Based Access Control (RBAC)**:
    *   **Roles**: `admin`, `finance`, `merchant`, `customer`, `parent`.
    *   **Permissions**: Granular permissions (e.g., `merchant.suspend`, `finance.report.view`) are assigned to roles in `AppContext`.
*   **State Management**: `AppContext.jsx` uses `useState` and `localStorage` to persist data.
*   **Pricing & Fees**:
    *   **Customer Handling Fee**: **15%** added to the order total at checkout (Platform Revenue).
    *   **Merchant Maintenance Fee**: **2.5%** of Gross Merchandise Value (GMV), calculated monthly for Vendor Invoices.
*   **Suspension Logic**:
    *   Merchants with status `SUSPENDED` or `PERMANENT_BAN` are filtered out from `Customer/Home.jsx` and cannot receive orders (`placeOrder` validation).

### 7.2. Mock Data
*   **Admin**: `admin@food.com` / `123` (Super Admin)
*   **Finance**: `finance@food.com` / `123` (Finance Role)
*   **Merchant**: `burger@food.com` / `123`
*   **Customer**: `john@food.com` / `123`

