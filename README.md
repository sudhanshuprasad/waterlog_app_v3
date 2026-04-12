# WaterLog App v3 💧

WaterLog is a premium, dark-mode mobile application built with React Native and Expo. It provides real-time monitoring and control for IoT water pump systems. The app connects to a custom backend to fetch device telemetry, manage smart thresholds, and toggle pump actions seamlessly.

## 🚀 Features

- **Google OAuth Authentication**: Secure login via Google leveraging JWTs and an automated refresh-token lifecycle.
- **Real-Time Telemetry Dashboard**: Socket.IO integration for live water level updates and pump action acknowledgments.
- **Dynamic UI Animations**: Fluid wave effects and gauge visualizations using React Native's `Animated` API and Reanimated.
- **Multi-Device Support**: Support for fetching and controlling multiple deployed IoT tanks/pumps.
- **Dark Mode Design System**: A strict, consistent design token system optimized for dark viewing with sleek gradients and card blur effects.

---

## 🛠 Tech Stack

- **Framework**: React Native & Expo (Expo Router for file-based routing)
- **State Management**: React Context (`AuthContext`, `DeviceContext`)
- **Networking APIs**: Native `fetch` wrapper (REST) & `socket.io-client` (WebSockets)
- **Local Storage**: `expo-secure-store` for persisting JWT tokens and active sessions.
- **Animations**: `react-native-reanimated`, `react-native-svg`

---

## 📂 Project Architecture

```
waterlog_app_v3/
├── app/                  # Expo Router Pages
│   ├── _layout.tsx       # Root layout containing the AuthGuard & Context Providers
│   ├── index.tsx         # Initial entry-point redirect
│   ├── (auth)/           # Unauthenticated Routes
│   │   └── login.tsx     # Google OAuth Login screen
│   └── (main)/           # Authenticated Routes
│       ├── dashboard.tsx # Live telemetry, gauge, and primary controls
│       └── settings.tsx  # Device thresholds, Auto-mode toggles, WiFi configuration
├── src/
│   ├── components/       # Reusable UI elements
│   │   ├── WaterLevelGauge.tsx
│   │   ├── PumpControlSwitch.tsx
│   │   └── PumpStatusCard.tsx
│   ├── context/          # Global application state
│   │   ├── AuthContext.tsx    # JWT storage, Google Login interactions
│   │   └── DeviceContext.tsx  # Device tracking and state management
│   ├── hooks/
│   │   └── useWebSocket.ts    # React hook mapping Socket.IO events to component state
│   ├── services/
│   │   ├── api.ts             # REST client with automatic token refreshing
│   │   └── websocket.ts       # Socket.IO networking client 
│   ├── theme/            # Global UI styling definitions
│   │   └── index.ts      # Colors, typography, shadows, gradients
│   └── types/            # TypeScript interfaces & API schema mapping
```

---

## ⚙️ Environment Configuration

You must define the backend URLs via an environment variable file (`.env`) in the root directory before running the Expo dev server.

1. Create a `.env` file at the root of the project:
```bash
touch .env
```

2. Add your backend connection URLs:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
```
*(Replace `localhost:3000` with your production domain when deploying).*

---

## 💻 Running the App

### 1. Install Dependencies
Make sure you are on Node 18+ and install the node modules using npm (legacy-peer-deps recommended if facing React 19 / Expo 54 peer conflicts):
```bash
npm install --legacy-peer-deps
```

### 2. Start the Expo Server
Launch the Expo development server:
```bash
npm start
```
- Available commands within the terminal prompt:
  - `w`: Open in Web browser
  - `i`: Open on iOS Simulator
  - `a`: Open on Android Emulator

---

## 📡 API & Networking Guide

### Authentication Flow (`api.ts`)
1. The app triggers the `expo-auth-session` OAuth flow to fetch a short-lived authorization code from Google.
2. We POST this code to the backend (`/api/v1/auth/login`).
3. The backend validates it and returns a `JWT Access Token` and `Refresh Token`.
4. These are securely saved to `expo-secure-store`.
5. API interactions attach the `Authorization: Bearer <token>` automatically via the `api.ts` interceptor logic. 
6. If a `401 Unauthorized` is encountered, the app silently uses the refresh token to negotiate a new session via `/api/v1/auth/refresh` and replays the original request.

### Real-Time Pipeline (`websocket.ts`)
- Upon mounting `dashboard.tsx`, the `useWebSocket` hook initiates a Socket.IO connection to `EXPO_PUBLIC_SOCKET_URL`.
- The instance passes the `accessToken` inside the query parameters.
- It automatically emits `join_device` configured with the ID of the globally active device (derived from `DeviceContext`).
- **Events Traced:** 
  - `sensor_update`: Receives real-time updates for telemetry `waterLevel` and updates the Dashboard state.
  - `command_ack`: Receives fulfillment callbacks ensuring manual pump control commands fired successfully.

### API Endpoints
The following backend endpoints are internally mapped inside the `ApiService`:
- `POST /auth/login`: Issue tokens securely
- `POST /auth/refresh`: JWT Session extensions
- `POST /auth/logout`: Clears backend and invalidates session
- `GET /users/profile`: Captures synchronized user data
- `GET /devices`: Lists hardware modules currently bounded to the User
- `POST /devices/:id/control/pump`: Send manual on/off triggers
- `PUT /devices/:id`: Persists Auto-mode and Sensor Threshold updates from the frontend