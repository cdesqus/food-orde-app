# EAT.Z - Future of Food Ordering | Technical Documentation

## 1. System Architecture

**EAT.Z** uses a modern, scalable **Hybrid Architecture** designed for high throughput and security.

### 1.1 High-Level Overview
```mermaid
graph TD
    Client[Hybrid Mobile App / Web] -->|HTTPS/WSS| LB[Nginx Proxy]
    LB -->|API Requests| Backend[Node.js Express Server]
    Backend -->|Read/Write| DB[(PostgreSQL Database)]
    Backend -->|Caching| Redis[Redis Cache (Optional)]
    Backend -->|Real-time| Socket[Socket.io Service]
    Admin[Admin Panel] --|Manage|--> Backend
```

### 1.2 core Components
1.  **Frontend (Client)**:
    *   **Framework**: React 18 + Vite.
    *   **State Management**: React Context (`AppContext`) + Optimistic UI updates.
    *   **Styling**: TailwindCSS with Custom "Gen Z" Design System (Glassmorphism, Neon).
    *   **Mobile Wrapper**: Capacitor 6 (Android/iOS integration).
    *   **Updates**: Capgo (Over-the-Air updates).

2.  **Backend (Server)**:
    *   **Runtime**: Node.js v22.
    *   **Framework**: Express.js with TypeScript.
    *   **Security**: Helmet (Headers), HPP (Param Pollution), Rate Limit (DDoS), CORS (Strict).
    *   **Real-time**: Socket.io (Order status updates "Kitchen" <-> "User").

3.  **Database**:
    *   **Engine**: PostgreSQL 16+.
    *   **ORM**: Sequelize (TypeScript).
    *   **Seeds**: Automated seeding script for fresh deployments.

---

## 2. Feature Specification

### 2.1 📱 Mobile & Hardware Features
*   **Biometric Authentication**:
    *   **Tech**: Native Android/iOS Fingerprint/FaceID via `NativeBiometric`.
    *   **Usage**: Administrators scan a student's finger to verify identity before handing over food at the shelter.
    *   **Fallback**: Dev mode simulation for browser testing.
*   **OTA Updates**:
    *   **Tech**: Capgo (`@capgo/capacitor-updater`).
    *   **Flow**: Developers push JS changes -> Users download silently -> App restarts with new code. No App Store review needed.

### 2.2 🛡️ Security Implementation
*   **RBAC (Role-Based Access Control)**:
    *   Middleware `authenticateToken` validates JWT.
    *   Roles: `admin`, `merchant`, `customer`, `parent`, `finance`.
    *   Strict route protection on both Frontend (`<ProtectedRoute>`) and Backend routes.
*   **Data Protection**:
    *   Passwords: Hashed via `bcrypt`.
    *   API: All endpoints protected by Rate Limiting (1000 req/15min).

---

## 3. Database Schema

### 3.1 Core Models
*   **User**: Stores Login, Role, Balance, Biometric Metadata.
    *   *Relations*: `hasMany(Order)`, `hasMany(FoodItem)`.
*   **Order**: The central transaction entity. status: `pending` -> `cooking` -> `arrived` -> `completed`.
    *   *Relations*: `belongsTo(User, Customer)`, `belongsTo(User, Merchant)`.
*   **OrderItem**: Pivot table linking Orders to FoodItems with Quantity and Snapshot Price.
*   **FoodItem**: Menu items managed by merchants. `is_active` boolean for availability.

---

## 4. API Reference

### 4.1 Authentication (`/api/auth`)
*   `POST /register`: Create new account (Customer/Merchant).
*   `POST /login`: Returns JWT Token + User Data.
*   `GET /me`: Validate current session.

### 4.2 Orders (`/api/orders`)
*   `POST /`: Create new order (Atomic Transaction: Deduct Balance + Save Order).
*   `GET /my-orders`: Fetch history for logged-in user.
*   `PATCH /:id/status`: Update status (Merchant/Admin only). Triggers Socket event.

### 4.3 Foods (`/api/foods`)
*   `GET /`: Public list of active food.
*   `POST /`: Create food (Merchant only).

---

## 5. Deployment & Operations

### 5.1 Infrastructure
*   **Dockerized**: Backend and Database run in isolated containers.
*   **Monitoring**: Portainer instance running on port `9000` for log viewing and health checks.

### 5.2 Environment Variables
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Postgres Connection String | `postgresql://user:pass@db:5432/db` |
| `JWT_SECRET` | Signing Key for Tokens | `openssl rand -base64 32` |
| `FRONTEND_URL` | CORS Allow Origin | `https://app.eatz.com` |

---

## 6. Developer Workflow

### 6.1 Setup
1.  **Backend**: `cd backend && npm install && npm run seed && npm run dev`
2.  **Frontend**: `npm install && npm run dev`
3.  **Mobile**: `npm run build && npx cap sync && npx cap open android`

### 6.2 Troubleshooting
*   **"Access Token Error" on Install**:
    *   Issue: npm registry auth conflict.
    *   Fix: `npm install <package> --registry=https://registry.npmjs.org/` or Manual Install.
*   **"Mobile Plugin Not Found"**:
    *   Issue: Capacitor didn't sync.
    *   Fix: Run `npx cap sync`.


