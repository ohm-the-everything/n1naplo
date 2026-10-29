# Changelog

## 1.0.0

First public release, on Google Play and the App Store.

- Daily entry with medication fields that have your own labels and units (locked once they
  hold data), sleep, restlessness, anxiety, boredom, mood, craving and a note.
- Weekly review: a chart per field and per medication; "boredom and craving together" as an
  observation, not a cause. The pooled dose chart of the debug builds is gone.
- Summary for your appointment: 14, 30 or 90 days as a PDF (made on the phone) or CSV.
- Backup to a file with optional passphrase encryption; restore; CSV import (also from the
  debug builds).
- Diary stored as one file outside system backups, saved crash-safely. System backup and
  device transfer only as a copy you choose, explained with its risk.
- Onboarding without any permission prompt; the evening reminder only if you ask for it, with
  honest status when the phone delays or blocks it.
- Protection: screenshots blocked by default, Android 14+ accessibility guard, optional app
  lock with the phone's own authentication, file protection on iOS.
- Offline help (112, 116-123), Hungarian and English, accessibility checked with axe.
- No internet permission, no analytics, no account — guarded in CI.
