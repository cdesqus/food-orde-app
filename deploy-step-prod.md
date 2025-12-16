# Production Deployment Guide

This guide details the steps to deploy the EAT.Z Food Order App to production and how to build the mobile APK for production usage.

## 1. Prerequisites

*   **Server**: A VPS (Virtual Private Server) with Linux (Ubuntu recommended).
*   **Domain**: Pointed to your server IP (e.g., `food.kaumtech.com`).

### 1.1 Installing Docker & Docker Compose (Ubuntu)
If you have a fresh VPS, run these commands to install Docker:

1.  **Update your system**:
    ```bash
    sudo apt-get update
    sudo apt-get upgrade -y
    ```
2.  **Install Docker**:
    ```bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    ```
3.  **Add your user to the Docker group** (so you don't need `sudo` for every command):
    ```bash
    sudo usermod -aG docker $USER
    # Log out and log back in for this to take effect!
    ```
4.  **Verify Installation**:
    ```bash
    docker --version
    docker compose version
    ```
    *Note: Modern Docker includes Compose as `docker compose` (v2).*

## 2. Full Stack Deployment (Recommended)

We now use a single `docker-compose.yml` in the root directory to orchestrate Frontend, Backend, Database, and Cache. This ensures they are automatically connected on the same private network.

1.  **Stop any existing containers**:
    If you were running backend separately:
    ```bash
    cd backend
    docker-compose down
    cd ..
    ```
    If you were running frontend separately:
    ```bash
    docker rm -f eat-z-frontend
    ```

2.  **Pull and Build Everything**:
    Run this in the project root (`food-order-app/`):
    ```bash
    docker-compose up -d --build
    ```

3.  **Verify**:
    *   **Frontend**: `http://localhost:8080` (or your server IP)
    *   **Backend API**: Internal interactions verified. 
    *   **Data**: Your existing database in `backend/pg_data` is preserved and mounted.

4.  **Troubleshooting**:
    *   If you see "Bind for 0.0.0.0:5432 failed", it means your old Postgres container is still running. Ensure you ran `docker-compose down` in the `backend/` folder first.

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
