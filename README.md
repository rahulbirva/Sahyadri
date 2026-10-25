# Tether

Tether is a small Expo SDK 54 demo for trip protection. It combines a flight,
bus, cab and hotel into one itinerary, then simulates a disruption so the
traveller can review refunds and approve a recovery plan.

## Run it

```bash
npm install
npx expo start
```

Open the QR code in Expo Go. The app uses the managed workflow and does not
require a custom dev client or native modules.

## 60-second demo

1. On Home, open the upcoming trip and look at the vertical trip chain.
2. Triple-tap the `TETHER` wordmark to open the developer panel.
3. Tap `Delay flight 4h`. The app returns to the trip and marks the downstream
   bus, cab and hotel as at risk.
4. Tap `Open incoming call`, then tap `Answer`. The simulated call reads the
   disruption aloud and routes to the recovery plan.
5. Review the ruled refund ledger. It shows the airline refund, the bus
   cancellation-window refund, and the replacement flight plus cab cost.
6. Tap `Approve plan`. The old legs become `Cancelled, refund requested` and
   the replacement nodes animate to recovered green.

The other developer controls simulate a cancelled flight, a 90-minute bus
delay, and a full reset. All data is local mock data. The optional `/server`
folder can be run independently if a Twilio account is available, but the app
does not depend on it.
