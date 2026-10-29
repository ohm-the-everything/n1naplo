# Contributing

Thank you for helping. N1 Napló is small on purpose; contributions that keep it small, honest
and private are the easiest to accept.

## Before you start

- Read [SPEC.md](SPEC.md) (the product contract) and [ETHICS.md](ETHICS.md) (the promises).
- **No new network access, tracking, analytics, ads or accounts — ever.** A new dependency or
  plugin needs a short discussion in an issue first; it must not add the INTERNET permission
  and must be MIT, Apache-2.0, BSD, ISC or OFL licensed.
- **Never put real diary data in an issue, a test or a screenshot.** Use made-up entries.

## Working on the code

```bash
npm ci
npm test                      # Vitest, test-first please
npx tsc -b --noEmit           # types
npx biome check src/          # lint and format
node scripts/ethics-check.mjs # the promises
npm run a11y                  # axe on every screen (needs Playwright's Chromium)
```

- Every user-visible text goes into `src/i18n/hu.ts` and `src/i18n/en.ts` (the test fails if a
  key is missing in one of them). House voice: dry, warm, no pressure. No streaks, badges or
  red counters; a skipped day is a data gap, not a failure.
- Never hardcode drug names; never compute, suggest or rank doses.
- Every input from outside (stored file, backup, CSV) goes through `parseDocument`.
- Code comments in English, only where the reason is not obvious from the code.

## Pull requests

Small, focused, with tests. The PR template has the checklist.
