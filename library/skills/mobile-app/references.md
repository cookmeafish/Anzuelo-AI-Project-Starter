# Mobile app: commands per platform

## Analyze and test
| Platform | Analyze | Unit and widget tests | On a device or emulator |
|---|---|---|---|
| Flutter | `flutter analyze` | `flutter test` | `flutter test integration_test` |
| React Native / Expo | `npx tsc --noEmit`, `npx eslint .` | `npx jest` | Detox or Maestro, when the project has them |
| Android (Kotlin, Compose) | `./gradlew lint` | `./gradlew testDebugUnitTest` | `./gradlew connectedDebugAndroidTest` |
| iOS (Swift, SwiftUI) | `swiftlint`, when installed | `xcodebuild test -scheme <scheme> -destination 'platform=iOS Simulator,name=<device>'` | the same, with UI test targets |

On Windows use `gradlew.bat`. iOS builds and tests need a Mac with Xcode; on other machines say so instead of skipping
silently.

## Emulators and simulators
- List and start: `emulator -list-avds`, `emulator -avd <name>`; `xcrun simctl list devices`, `xcrun simctl boot <device>`.
- Flutter: `flutter devices`, `flutter run -d <device>`.
- Dark mode: `adb shell cmd uimode night yes`; `xcrun simctl ui booted appearance dark`.
- Largest font: `adb shell settings put system font_scale 2.0`; on iOS, the simulator's Accessibility settings or
  `xcrun simctl ui booted content_size accessibility-extra-extra-extra-large`.
- Network off: `adb shell svc wifi disable` and `adb shell svc data disable`; on iOS, the Network Link Conditioner.
- Screenshots: see the gui-review-loop skill, step 1 (gui pack).

## Version and build number
| Platform | Version | Build number |
|---|---|---|
| Flutter | `pubspec.yaml` `version: 1.4.0+23` (before the plus) | after the plus |
| Android | `versionName` in `app/build.gradle(.kts)` | `versionCode` |
| iOS | `MARKETING_VERSION` (shown as `CFBundleShortVersionString`) | `CURRENT_PROJECT_VERSION` (`CFBundleVersion`) |
| Expo | `version` in `app.json` | `android.versionCode`, `ios.buildNumber` |

Check them: `node skills/mobile-app/scripts/app-version.mjs <app folder> --against <git ref or old copy>`.

## Signing, kept out of git
Add to `.gitignore`: `*.jks`, `*.keystore`, `key.properties`, `*.p12`, `*.mobileprovision`, `*.p8`,
`google-services.json` and `GoogleService-Info.plist` when they hold private project settings. Read passwords from
environment variables in `build.gradle`, never write them in.

## Release builds
| Platform | Build | Install to try it |
|---|---|---|
| Flutter Android | `flutter build appbundle` (store), `flutter build apk --release` (testers) | `flutter install` or `adb install <apk>` |
| Flutter iOS | `flutter build ipa` | Xcode, or TestFlight after the user's OK |
| Android | `./gradlew bundleRelease` | `bundletool` or `./gradlew installRelease` |
| iOS | `xcodebuild archive` then `-exportArchive` | Xcode Devices window |
| Expo | `eas build --profile production` (uploads to the Expo service: ask first) | the build link |

`fastlane deliver`, `fastlane supply`, `eas submit` and uploads in Xcode or Play Console all send the build to a
store: outward actions, only with the user's OK.
