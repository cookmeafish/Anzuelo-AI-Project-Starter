---
name: mobile-app
description: Builds and ships phone apps (Flutter, React Native and Expo, SwiftUI, Jetpack Compose) safely. Code changes are followed by the platform's analyzer and tests; screens are checked on an emulator or simulator at small and large phone sizes in light and dark mode; permissions are asked only when needed with a plain reason; offline and slow-network states are handled; the version and build number are bumped together; signing keys stay out of the repository; and store releases are prepared as drafts the user submits. Use when the project is a mobile app and the user asks for a screen, a mobile bug, a permission, push notifications, offline mode, an app icon or splash screen, an Android or iOS build, or a store release.
triggers: mobile app, phone app, flutter, react native, expo app, swiftui, jetpack compose, android, ios, iphone app, android build, ios build, android emulator, ios simulator, apk, app bundle, testflight, play store, app store, app icon, splash screen, push notification, runtime permission, offline mode, keystore, build number, iphone build, android version
---
# Mobile app: works on a real phone, ships as a draft

Phone apps fail where a desktop window never shows it: a small screen, a large system font, a refused permission, a
train tunnel, a store review. This skill covers those and leaves the submit button to the user.

Say at the start: "Working on the phone app (mobile-app skill)."

## What the other skills already cover
- **The feature or bug itself:** the app pack runbooks (`docs/playbooks/feature.md`, `docs/playbooks/bugfix.md`) and
  the debug skill. This skill adds the phone-specific steps.
- **Screenshots and the review loop:** the gui-review-loop skill (gui pack). Its step 1 has the emulator and
  simulator screenshot commands and the `.cache/gui-review/` folder the hooks look in.
- **Shipping:** `docs/playbooks/release.md` (gates, rollback, release notes, the user's OK). This skill adds the store
  parts.
- **Slow screens, jank, battery:** `docs/playbooks/perf.md`.
- **Keys and secrets:** `docs/security.md` and the security-review skill, before any build leaves the machine.

`skills/mobile-app/scripts/app-version.mjs` lists the version and build number in every file that sets them and
checks they moved together. Per-platform commands: [references.md](references.md).

## Pick the situation
| Situation | Do |
|---|---|
| Any code change | **A** (analyzer and tests), plus the section for the kind of change |
| A new or changed screen | **B** |
| Camera, location, contacts, notifications, any permission | **C** |
| Network calls, sync, offline mode | **D** |
| A build for testers or a store release | **E**, then **F** |

## A. Analyze and test after every code change
1. Run the platform's checks before saying a change works (commands in references.md):
   - Flutter: `flutter analyze`, then `flutter test`.
   - React Native / Expo: `npx tsc --noEmit` (TypeScript), `npx eslint .`, `npx jest`.
   - Android (Kotlin, Compose): `./gradlew lint testDebugUnitTest` (`gradlew.bat` on Windows).
   - iOS (Swift, SwiftUI): `xcodebuild test -scheme <scheme> -destination 'platform=iOS Simulator,name=<device>'`.
2. A failing check is fixed before anything else (debug skill). Do not mark tests skipped to get a pass.
3. Logic that does not need the phone (formatting, parsing, state) gets plain unit tests, which run in seconds.

## B. Screens
1. Run the app on an emulator or simulator, never only in a desktop or web preview.
2. Follow the gui-review-loop skill: shoot each changed screen at a small phone (about 360x640 dp) and a large one,
   light and dark, and once with the largest system font. Look at every shot.
3. Touch targets at least 48x48 dp (Android) or 44x44 pt (iOS). Nothing hidden under the notch, the home indicator or
   the keyboard. Text wraps instead of being cut off.
4. Every screen has its empty, loading and error state, and the shots include the ones you changed.
5. Screen reader labels on icons and images (`Semantics`, `accessibilityLabel`, `contentDescription`).

## C. Permissions
1. Ask at the moment the feature needs it, after one plain sentence on why ("To scan the receipt, the app needs the
   camera."). Never ask for everything at first launch.
2. The app keeps working when the user says no: show what is missing and how to turn it on in Settings.
3. Declare only what is used: `AndroidManifest.xml` permissions and the iOS `Info.plist` usage strings
   (`NSCameraUsageDescription` and the like) in plain words. Remove ones no code uses; stores reject or question them.
4. Notifications: Android 13 and later and iOS both need a runtime request. Ask after the user turns on something that
   sends them.

## D. Offline and slow networks
1. Every network call has a timeout, a loading state, an offline state and an error state in plain words, with a
   retry.
2. Test with the network off and with a slow profile (emulator network settings, or the iOS Network Link Conditioner).
3. Data the user typed is never lost on a failed call: keep it and send it again later, or say clearly it was not
   saved.
4. Secrets never ship inside the app: anyone can unpack an APK or IPA. Keys that must stay secret live on a server the
   app calls.

## E. Version, build number and signing
1. Bump the version and the build number together, wherever the project keeps them (`pubspec.yaml`
   `x.y.z+n`, `versionName` and `versionCode` in `build.gradle`, `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`
   in Xcode, `version` and `versionCode` or `buildNumber` in `app.json`). The build number only ever goes up.
2. Check: `node skills/mobile-app/scripts/app-version.mjs . --against HEAD` (or an older tag). It fails when the
   version changed without a higher build number, the build number went down, or files disagree on the version.
3. Signing keys (`.jks`, `.keystore`, `.p12`, `.mobileprovision`, `key.properties`, App Store Connect API keys) stay
   outside the repository and are listed in `.gitignore`. Passwords come from environment variables or the CI secret
   store. If one was ever committed, tell the user: it must be replaced, not just deleted.

## F. Store releases, as drafts
1. Build the release artifact (`flutter build appbundle`, `flutter build ipa`, `./gradlew bundleRelease`, an Xcode
   archive, or `eas build`) and install it on an emulator or a device once. A release build can fail where a debug
   build did not (code shrinking, missing entitlements).
2. Prepare the store text as files the user can review: what is new, the description, screenshots from **B**, and the
   data-safety or privacy answers matching the permissions in **C**.
3. Uploading to TestFlight, Play Console or any store, and submitting for review, are outward actions: only with the
   user's OK in this conversation. Prefer a draft or internal test track the user sends.

## Done when
- [ ] After code changes, the platform's analyzer or tests ran this turn (hook: mobile-checked).
- [ ] Each changed screen was shot on an emulator or simulator, small and large, light and dark, and every shot looked at (judgment: the gui-review-loop check covers the shots when the gui pack is installed).
- [ ] A release bumped the version and the build number together, and `app-version.mjs --against` printed RESULT: PASS (judgment: only release turns).
- [ ] No signing key, keystore or password file is in the repository (judgment: the git hooks block secrets in commits).
- [ ] Nothing was uploaded or submitted to a store without the user's OK (judgment: the outward-action rule covers it).

## Pitfalls
- Checking a screen only in a web preview or a desktop window, where notches, keyboards and font scaling do not exist.
- Asking for every permission on first launch, then crashing or showing a blank screen when one is refused.
- Raising the version but not the build number, so the store rejects the upload.
- A release build that crashes because code shrinking removed a class used only by reflection.
- An API key in the app bundle, treated as secret because it is not in the source code.
- Testing only on fast office Wi-Fi.
