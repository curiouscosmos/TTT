# Mobile App

Expo React Native client for the Retainer Health Tracker.

The root `./setup.sh` creates `mobile/.env` from `mobile/.env.example` if it is missing.

Run it from the repo root after the API is up:

```sh
cp mobile/.env.example mobile/.env
cd mobile
pnpm run ios
```

For a physical device, edit `mobile/.env` and replace `localhost` with your Mac's LAN IP:

```sh
EXPO_PUBLIC_API_URL=http://192.168.1.25:3000
```

The full project setup, tradeoffs, and submission notes live in the root `README.md`.
