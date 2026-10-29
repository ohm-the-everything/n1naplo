# Security

N1 Napló has no server, no account and no network access: the diary lives on the phone. A
security problem here means something that lets the diary leave the phone, or lets someone read
it, against the promises in [ETHICS.md](ETHICS.md).

## Reporting

Write to **hello@n1naplo.org** with "security" in the subject. Please do not open a public issue
for a vulnerability until it is fixed.

- Describe the problem and how to reproduce it on a test device.
- **Never send real diary data or screenshots of it** — use made-up entries.
- You will get an answer within a week. Fixes ship in the next store release, with credit if you
  want it.

## In scope

- Anything that adds network access, tracking or a data channel to the app.
- Ways to read the diary from outside the app: backups beyond the user's choice, exports, screen
  capture while protection is on, the app lock, encrypted backup files.
- The CI guards in `scripts/ethics-check.mjs` and `.github/workflows/build.yml` missing a case.

## Out of scope

- A phone that is already compromised (rooted or jailbroken, with malware running as the user).
- Store, operating-system or cloud-backup infrastructure run by Google or Apple.
