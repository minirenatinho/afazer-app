# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start dev server (opens Expo QR code + web)
npm start

# Run on web (opens browser)
npm run web

# Run on Android (requires emulator or device)
npm run android

# Run on iOS (requires macOS + simulator)
npm run ios

# TypeScript type check
npx tsc --noEmit
```

No test suite is configured. No lint script is in `package.json`, but ESLint is installed — run `npx eslint .` manually.

## Environment Setup

Create a `.env` file in `afazer-app/` before running:

```
EXPO_API_URL=http://<backend-host>:<port>/api/v1
EAS_PROJECT_ID=<your-eas-project-id>
```

`app.config.js` reads these via `dotenv` and injects them into `Constants.expoConfig.extra`. The app throws at startup if `EXPO_API_URL` is missing.

## Architecture

### Data flow

```
App.tsx (auth gate)
  └── PageCarousel (tab navigation: Afazer / Supermarket)
  └── AfazerPage / SupermarketPage
        └── ItemItem (row component)
              └── CategorySelectorModal / ColorSelectorModal
        └── api.ts (all HTTP calls)
              └── services/apiInterceptor.ts (Bearer token injection, 401 → refresh)
              └── services/tokenService.ts (SecureStore → AsyncStorage → localStorage)
```

### Authentication

`App.tsx` checks `/auth/me` on mount. If it fails, the login form is shown. After login, JWT tokens are stored by `TokenService`. All subsequent calls go through `apiCall()` in `apiInterceptor.ts`, which automatically retries with a refreshed token on 401 (with a queue to avoid concurrent refresh races). Token storage is platform-aware: `localStorage` on web, `SecureStore` with `AsyncStorage` fallback on native.

### Item types and the shared API

All persistent entities (`Item`, `Supermarket`, `Country`) share the same REST endpoint `/items/` differentiated by a `type` field (`"item"`, `"supermarket"`, `"country"`). The `dynamics` field is a flexible JSON object whose shape depends on the type. Types are defined in `types/index.ts`; categories (`PRIORITY`, `ON`, `OFF`, `PAY`) and colors (`BLUE`, `GREEN`, `PINK`, `BROWN`) are string enums there.

### Platform differences

- **Web**: category/color selectors appear inline in the input bar; confirmation dialogs use `window.confirm`; `localStorage` for tokens; CSS properties like `boxShadow`/`transition`/`cursor` added via `Platform.select`.
- **Mobile**: `ItemTypeModal` pops up on item creation to pick category/color; `Alert.alert` for confirmations; `SecureStore` for tokens (falls back to `AsyncStorage`).

### Internationalization (i18n)

The app is bilingual (English and pt-BR) via a dependency-free module in `i18n/`. `LanguageProvider` (wraps the app in `App.tsx`) exposes `useI18n()` returning `{ t, locale, setLocale }`. All user-facing strings live in `i18n/translations.ts` — when adding UI text, add the key to **both** the `en` and `'pt-BR'` dictionaries and render it with `t('section.key')` (supports `{{param}}` interpolation). The language defaults to the device locale (pt\* → pt-BR, otherwise en), is switchable via the `LanguageToggle` component (header + login screen), and persists in AsyncStorage under the key `"language"`. Finance categories are a per-user pool stored as items (`type: 'finance'`, `dynamics.recordType: 'category'`), seeded with the generic defaults on first load. Default categories store canonical English keys and only their display labels are translated; user-created categories are stored and displayed as literal text (see `categoryLabel()` in `FinancesPage.tsx`). Month names come from `Intl.DateTimeFormat` with the active locale.

### Caching

`AfazerPage` and `SupermarketPage` write the latest API response to `AsyncStorage` under the key `"items"` / `"supermarkets"` and read from cache as a fallback when the API is unreachable.

### CORS

The backend (FastAPI) must use specific allowed origins (not `*`) when credentials are sent. See `CORS_FIX_GUIDE.md` for the full setup. The frontend does **not** send `credentials: 'include'` — it uses Bearer tokens in the `Authorization` header.
