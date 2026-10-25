# Trip Guard

Trip Guard is a single-file Expo React Native application for unified travel booking, live disruption telemetry, cascade impact analysis, refund settlement, and one-tap schedule recovery.

The app is designed to run from the same codebase in:

- Expo Go on iOS
- Expo Go on Android
- Expo Web in a desktop or mobile browser

No custom native build or `prebuild` step is required.

## Product flow

The interactive demo follows a five-step recovery workflow for trip `#BLR-GOI-884`:

1. **Unified trip booking**
   - IndiGo 6E-402 from BLR to GOI
   - Kadamba Volvo AC connection to Panjim ISBT
   - Pre-booked resort cab
   - Taj Cidade de Goa check-in
2. **Live telemetry**
   - Displays incoming aircraft `VT-IVR`
   - Maps the linked booking chain from flight to hotel
   - Simulates a four-hour operator delay
3. **Alternative route and refund math**
   - Stages the `07:00 PM` IX-814 replacement flight
   - Calculates `₹4,600` in refund credit
   - Calculates the `₹5,100` replacement cost
   - Shows the final `₹500` net payable amount
4. **Proactive phone call**
   - Opens a full-screen call modal
   - Uses `Vibration` for the incoming call state
   - Uses `expo-speech` for the spoken recovery briefing
5. **One-tap approval**
   - Confirms every itinerary node
   - Updates the flight to IX-814 at `07:00 PM`
   - Marks the old tickets as `REFUND AUTO-FILED (₹4,600)`

## Design system

The interface uses a Swiss-grid travel and fintech visual system:

- Warm alabaster background: `#F7F7F5`
- White cards with hairline borders
- Carbon black typography
- Monospace financial and operational figures
- Aviation Orange primary actions
- Forest Green confirmed states
- Amber cascade-risk states
- Signal Red disruption states
- Feather stroke icons only

## Requirements

- Node.js
- npm
- Expo CLI through the local Expo package
- Expo Go for iOS or Android, or a browser for web development

The project uses Expo SDK 58 and only Expo-compatible modules:

- `@expo/vector-icons`
- `expo-font`
- `expo-speech`
- `expo-status-bar`
- `react-native-web`

## Install

From the project directory:

```bash
cd trip-guard
npm install
```

## Run on Expo Go

Start the development server:

```bash
npm start
```

Then scan the QR code with Expo Go on iOS or Android.

Platform-specific commands are also available:

```bash
npm run ios
npm run android
```

## Run on the web

Start the Expo web development server:

```bash
npm run web
```

Expo will print the local browser URL. To use a specific port:

```bash
npx expo start --web --port 8082
```

## Create production-style exports

Android export:

```bash
npx expo export --platform android
```

Web export:

```bash
npx expo export --platform web
```

The generated static web files are written to `dist/`.

## Checks

Run the available project checks:

```bash
npm run lint
npx expo-doctor
node --check App.js
```

## Project structure

```text
trip-guard/
├── App.js              # Complete application UI and interaction flow
├── index.js            # Expo entry point
├── app.json            # Expo configuration
├── package.json        # Scripts and dependencies
├── assets/             # App icons and web favicon
└── dist/               # Generated export output, when created
```

## Scope and demo behavior

This repository contains a self-contained interactive prototype. Flight telemetry, booking records, refund settlement, and payment approval are represented with local state so the full recovery flow can be demonstrated without external APIs or account credentials.

The phone call is an in-app full-screen modal rather than a real cellular call. Speech synthesis depends on the platform or browser's available voice engine.
