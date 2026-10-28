# Ethics — promises and how to check them

*Ígéretek és ellenőrzésük.* Every promise below has a mechanism that keeps it and a proof you
can run or read yourself. If a proof stops holding, the build fails — that is the point.

| Promise | Mechanism | Proof |
|---|---|---|
| **No network.** The app never talks to anything. | `android.permission.INTERNET` is stripped with `tools:node="remove"`; the code has no network calls. | CI step *No-INTERNET guard* fails the build if the permission reaches the merged manifest. `scripts/ethics-check.mjs` (`findNetworkCalls`) fails it on `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource` or `sendBeacon` in `src/`; test *flags fetch() in src*. |
| **No cloud backup.** The diary leaves the phone only when you export it. | `android:allowBackup="false"`, data-extraction rules that exclude every domain for cloud backup and device transfer; on iOS the file lives in `LibraryNoCloud`. | `checkAndroidBackup` in `scripts/ethics-check.mjs`; test *flags allowBackup true*; `android/app/src/main/res/xml/data_extraction_rules.xml`; `src/lib/store.ts`. |
| **No tracking.** No analytics, ads, crash reporting or accounts. | No such SDK in the dependency tree; the iOS privacy manifest declares no tracking and no collected data. | `findTrackerDependencies` and `checkIosPrivacyManifest` in `scripts/ethics-check.mjs`; tests *flags firebase in the lockfile*, *flags a privacy manifest that collects data*; `ios/App/App/PrivacyInfo.xcprivacy`. |
| **No dark patterns.** A skipped day is a data gap, not a failure. | No streaks, badges, scores or red counters. The reminder is off until you ask for it. The weekly review nudge is a suggestion you can override. | `findBannedClaims` (banned copy such as *streak*, *badge*, *jelvény*); test *flags a banned claim in copy*; `src/pages/OnboardingPage.tsx`; `src/pages/ReviewPage.tsx`. |
| **No medical claims.** Not a medical device; it never computes, suggests or ranks doses. | Copy says what it is not; the review shows observations, never a dose relation; there is no dose logic. | `findBannedClaims` (*optimal dose*, *effectiveness*, *diagnos…*, *cure*, *clinically*, *treats ADHD*); `SPEC.md` ("Mi nem"); `src/lib/summary.ts` computes counts and min/median/max only. |
| **Help without the internet.** | Emergency and support numbers are bundled in the app, with the date they were checked. | `src/pages/HelpPage.tsx`. |
| **Your data stays yours.** | Backup, restore, CSV import and every export work offline and are free forever; a damaged or foreign file is rejected without touching your diary. | `src/lib/backup.ts` and its tests (*readBackup rejects newer version / plain text / a CSV file*, *mergeCsv rejects a row with izgalom 9 and changes nothing*). |
| **We measure only what the stores show.** | Install and crash counts come from the store consoles' own aggregates. We never see diary data — there is no channel it could travel through. | The *No network* and *No tracking* proofs above. |

The whole check runs locally with `node scripts/ethics-check.mjs` and in CI on every commit.
Found a gap? Open an issue — see `SECURITY.md` for anything sensitive.
