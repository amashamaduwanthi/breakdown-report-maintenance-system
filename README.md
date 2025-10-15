# Breakdown Report Maintenance System

## Overview
The project  two React + TypeScript single-page applications that collaborate over a shared Firebase realtime database to streamline equipment breakdown reporting. The manager-facing app (`breakdownapp/`) enables maintenance teams to triage, assign, and resolve incidents in real time, while the reporter-facing app (`breakdownapp-reporter/`) lets employees submit new issues and track progress transparently.

## Repository layout
```
.
├─ breakdownapp/          # Manager & technician experience
└─ breakdownapp-reporter/ # Reporter experience
```

## Features
- **Dual web clients**: Dedicated landing experiences in `breakdownapp/src/App.tsx` and `breakdownapp-reporter/src/App.tsx` provide focused entry points for each audience.
- **Real-time database sync**: Firebase Realtime Database powers live updates for breakdown cards, technician assignments, and timeline messages.
- **Role-aware authentication**: Firebase Authentication combined with custom role checks in `breakdownapp/src/firebase/services.ts` restricts access to manager and technician tools.
- **Incident lifecycle management**: `ManagerApp.tsx` supports approving, assigning, progressing, and resolving reports with activity logs and notes.
- **Reporter visibility**: The reporter client offers fast submission and live status tracking to keep employees informed without manual follow-up.

## Tech stack
- **Framework**: React  with React Router  and Vite  for fast development builds.
- **Language**: TypeScript across both clients for type safety and IDE support.
- **Backend**: Firebase Authentication plus Realtime Database for secure, low-latency data flows.
- **Tooling**: ESLint with modern React presets, and TypeScript project references for type checking.

## Prerequisites
- **Node.js**: Install Node.js 18.18 or newer (Node 20 LTS recommended) for Vite compatibility.
- **Firebase project**: Provision Firebase Authentication and Realtime Database, and create a service account with appropriate rules.

## Environment configuration
Both apps load configuration from `import.meta.env`. Create `.env` files in each package root (`breakdownapp/.env` and `breakdownapp-reporter/.env`) with the following keys:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-app.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=sender-id
VITE_FIREBASE_APP_ID=app-id
```
Run `npm run dev` only after all variables resolve; otherwise, `getFirebaseConfig()` will raise a descriptive error listing any missing keys.

## Installation
- **Manager app**:
  ```bash
  cd breakdownapp
  npm install
  ```
- **Reporter app**:
  ```bash
  cd breakdownapp-reporter
  npm install
  ```

## Running locally
Use separate terminals (or background processes) so each Vite dev server can watch its files:
- **Manager side**:
  ```bash
  cd breakdownapp
  npm run dev
  ```
- **Reporter side**:
  ```bash
  cd breakdownapp-reporter
  npm run dev
  ```
Each command prints a local URL (default `http://localhost:5173`). If both use the default port, adjust one via `npm run dev -- --port 5174`.


## Firebase roles & authentication
- **Manager/Technician access**: `ManagerApp.tsx` requires users to log in with credentials that resolve to a Firebase custom claim of `manager` or `technician`. Use the registration flow built into the manager client (switch to “Register”) to onboard additional staff securely.
- **Reporter access**: Reporters authenticate through the reporter client; additional logic in `firebase/services.ts` ensures each reporter interaction is scoped to their own submissions.
- **Security rules**: Configure Realtime Database rules to mirror these role checks. Start from least privilege and allow read/write operations only where required by the UI flows outlined above.

