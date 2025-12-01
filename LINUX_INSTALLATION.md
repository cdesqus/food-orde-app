# Linux Installation Guide (Docker)

This guide explains how to build and run the EAT.Z Food Order App using Docker on a Linux system.

## Prerequisites

- **Docker**: Ensure Docker is installed and running on your Linux machine.
- **Git**: To clone the repository (if not already present).

## Installation Steps

### 1. Clone the Repository

If you haven't already, clone the project repository:

```bash
git clone <repository-url>
cd food-order-app
```

### 2. Build the Docker Image

Run the following command to build the Docker image. We'll tag it as `food-order-app`.

```bash
docker build -t food-order-app .
```

This process may take a few minutes as it installs dependencies and builds the application.

### 3. Run the Container

Once the build is complete, run the container mapping port 80 of the container to port 8080 (or any other port) on your host:

```bash
docker run -d -p 8080:80 --name eat-z-app food-order-app
```

### 4. Access the Application

Open your web browser and navigate to:

```
http://localhost:8080
```

You should see the EAT.Z application running.

## PWA Support

This application is configured as a Progressive Web App (PWA).
- **Installable**: You can install it on your desktop or mobile device.
- **Offline Capable**: It caches resources for offline access (depending on browser support and configuration).

To test PWA features:
1. Open the app in Chrome or Edge.
2. Look for the "Install" icon in the address bar.

## Troubleshooting

- **Port Conflict**: If port 8080 is already in use, change the `-p` flag (e.g., `-p 3000:80`).
- **Permission Issues**: If you get permission errors with Docker, try running commands with `sudo` or add your user to the `docker` group.
