# Production Deployment Guide

This guide details the steps to deploy the EAT.Z Food Order App to production and how to build the mobile APK for production usage.

## 1. Prerequisites

*   **Server**: A VPS (Virtual Private Server) with Linux (Ubuntu recommended).
*   **Docker**: Installed on the server.
*   **Docker Compose**: Installed on the server.
*   **Domain**: Pointed to your server IP (e.g., `food.kaumtech.com`).

## 2. Backend Deployment (Docker Compose)

The backend and database run together using Docker Compose.

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```

2.  **Configure Environment**:
    Create a `.env` file in the `backend/` directory (if not exists) and ensure your production values are set:
    ```env
    PORT=3000
    NODE_ENV=production
    DATABASE_URL=postgresql://postgres:password@db:5432/food_order
    JWT_SECRET=your_secure_secret_here
    # ... other secrets
    ```
    
    > **Tip**: Generate a secure `JWT_SECRET` by running:
    > ```bash
    > openssl rand -base64 32
    > ```
    > Or if you don't have openssl:
    > ```bash
    > node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    > ```

3.  **Start Services**:
    Run the following command to build and start the containers in detached mode:
    ```bash
    docker-compose up -d --build
    ```

4.  **Verify**:
    *   API should be running on `http://localhost:3000` (or mapped port).
    *   Portainer (if enabled) on `http://localhost:9000`.

## 3. Frontend Deployment (Docker/Nginx)

The frontend is served as static files via Nginx.

1.  **Navigate to the project root**:
    ```bash
    cd ..
    # You should be in food-order-app/
    ```

2.  **Build the Docker Image**:
    Run this command in the root directory. This uses the multi-stage `Dockerfile`.
    ```bash
    docker build -t food-order-app .
    ```

3.  **Run the Container**:
    Start the Nginx container, mapping port 80 inside to port 8080 (or 80) on your host.
    ```bash
    docker run -d -p 8080:80 --name eat-z-frontend food-order-app
    ```

4.  **Verify**:
    Access the web app at `http://your-server-ip:8080` (or `http://food.kaumtech.com` if reverse proxy is configured).

## 4. Mobile Build (Local APK for Production)

To generate an APK that connects to your production server (`food.kaumtech.com`), follow these steps on your local machine.

### Step 1: Configure Production URL
A `.env.production` file has been created in your project root with the following content:
```env
VITE_API_URL=https://food.kaumtech.com/api
```
This ensures that when you build the app, it points to your live server instead of localhost.

### Step 2: Build Web Assets
Run the build command. **Important**: This must run *before* syncing with Capacitor.
```bash
npm run build
```
*Note: Vite automatically loads `.env.production` when running `build` (unlike `dev` which uses `.env.development`).*

### Step 3: Sync with Capacitor
Copy the newly built web assets into the Android native project.
```bash
npx cap sync
```

### Step 4: Open Android Studio
Open the native Android project.
```bash
npx cap open android
```

### Step 5: Generate APK
1.  In Android Studio, wait for Gradle sync to finish.
2.  Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3.  Once complete, a notification will appear. Click "locate" to find your `app-debug.apk`.
4.  Transfer this APK to your phone to test the connection to `food.kaumtech.com`.

## 5. Troubleshooting

*   **API Connection Failed**:
    *   Ensure your `VITE_API_URL` in `.env.production` ends with `/api` if your backend expects it.
    *   Ensure your server's firewall allows traffic on the API port.
    *   Check Mixed Content: If your frontend is HTTPS, your API **MUST** be HTTPS.
*   **Docker Permission Denied**:
    *   Run docker commands with `sudo` or add your user to the docker group.
