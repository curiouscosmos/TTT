# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

Use the installed Expo/React Native skills from `~/.codex/skills` when they match the task:

- `expo-architecture`
- `expo-router`
- `react-native-ui`
- `react-native-performance`
- `expo-native-apis`
- `expo-eas-deployment`
- `react-native-testing`
- `mobile-auth-security`
- `offline-first-react-native`
- `expo-folder-structure`

Mobile stack:
- Expo managed workflow
- TypeScript
- Expo Router
- TanStack Query
- React Hook Form
- MobX
- Zod


Project rules override generic skill examples:

- This app root is `mobile`.
- `@/` maps to `src/`.
- MobX store files live in `src/app/stores`.
- Follow `expo-folder-structure` for new file placement.

Architecture rules:

1. TanStack Query owns server state.
   Examples:
    - retainers
    - retainer details
    - check-ins
    - at-risk retainers
    - API loading/error/refetch state

2. MobX owns local application/UI state only.
   Examples:
    - locally selected filters
    - temporary sort options
    - UI preferences
    - cross-screen transient state when URL params are not appropriate

3. Do NOT duplicate API response data into MobX.

4. React Hook Form owns form state.

5. Zod owns validation schemas.

6. Expo Router owns navigation and route parameters.

7. Prefer simple, readable architecture over abstraction-heavy patterns.

Developer comments:
- Add comments where they help another developer understand WHY something exists.
- Explain non-obvious decisions, edge cases, business rules, network/cache behavior, and workarounds.
- Do not comment obvious code.
- Avoid comments like:
  // Set loading to true
  // Loop through items
  // Return result
- Prefer comments like:
  // Keep API data in TanStack Query rather than MobX so there is a single
  // source of truth for fetching, caching, invalidation, and refetching.

- Comments should explain intent and trade-offs, not translate TypeScript into English.

Code quality:
- use strict TypeScript
- avoid `any`
- keep components focused
- extract reusable behavior when there is genuine reuse
- avoid premature generic abstractions
- preserve clear names
- handle loading, empty and error states
- keep mobile accessibility and touch targets in mind
- do not add dependencies unless they provide clear value

Do not add:
- Redux
- Zustand
- authentication
- native modules outside Expo SDK
- custom design system
- animations unless required
- offline-first implementation
- unnecessary repository/service layers on the mobile side
