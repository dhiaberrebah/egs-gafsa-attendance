# EGS Gafsa Coach

Expo React Native client for coaches. It authenticates against the Next.js service and stores the signed session token with `expo-secure-store`.

## Run locally

1. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL`.
2. Start the web service from the repository root:

   ```powershell
   npm run dev -- --hostname 0.0.0.0
   ```

3. Start Expo from `mobile/`:

   ```powershell
   npx expo start
   ```

Use `http://10.0.2.2:3000` for an Android emulator, `http://localhost:3000` for an iOS simulator, or the computer's LAN IP for a physical phone on the same Wi-Fi. Use the deployed HTTPS URL for a production build.

This app targets Expo SDK 58. During the SDK 58 rollout, the store version of Expo Go may only support SDK 57; use a matching SDK 58 development build on a physical device if Expo Go reports an SDK mismatch.

## Build an installable APK

Set `EXPO_PUBLIC_API_URL` to the deployed Next.js origin in the Expo build environment, then run:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

The `preview` profile creates an internally distributed APK. It does not upload the app to Google Play.

## Coach workflow

- Sign in with the username and password created by administration.
- View assigned categories and upcoming/recent sessions.
- Open a session, set attendance for players and staff, save a draft, or submit the sheet.
- A submitted sheet remains editable by the coach until administration locks it.

Only the session token is persisted on-device; it is never written to AsyncStorage or logged. Player and dirigente accounts cannot sign in.
