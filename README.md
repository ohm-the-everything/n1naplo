# N1 Napló

**Az appnak nincs internet-engedélye: a naplód a telefonodon van, és csak akkor hagyja el,
ha te kéred.** Nincs analitika, nincs fiók, nincs felhő. Ezt nem kérjük, hogy elhidd — lent
leírjuk, hogyan ellenőrizheted.

*English below.*

## Mi ez

Napló n-of-1 öntesztelőknek — AuDHD-s és neurodivergens sorstársaknak, akik gyógyszert
szednek, és a következő rendelésre többet akarnak vinni, mint egy „szerintem jobb". Napi egy
sor, húsz másodperc: gyógyszerek (saját címkével és egységgel), alvás, izgalom, szorongás,
unalom, hangulat, sóvárgás, egy rövid jegyzet. Hetek alatt kirajzolódik a saját idősorod.

- **Napi bevitel** nagy léptetőkkel, visszamenőleges javítással.
- **Heti visszanézés** — görbék mezőnként, és egy keresztkép (*csak megfigyelés, nem
  ok-okozat*).
- **Összefoglaló a konzultációhoz** — 14/30/90 nap PDF-ben vagy CSV-ben, a telefonon készül.
- **Mentés fájlba, visszaállítás**, jelmondatos titkosítással; régi CSV importja.
- **Esti emlékeztető**, ha kéred — a kitöltés lehetséges, nyomás nincs.
- **Védelem**: képernyőkép alapból tiltva, választható zárolás a telefon saját azonosításával.
- Magyarul és angolul.

## Mi nem

Nem orvostechnikai eszköz: nem diagnosztizál, nem kezel, nem ad tanácsot az adagról. A naplót
senki nem figyeli. **Ha bajban vagy:** 112 (segélyhívó), 116-123 (lelki elsősegély, ingyenes,
éjjel-nappal). Kérdéseiddel fordulj az orvosodhoz.

## Hogyan ellenőrizheted

1. **Az áruházban:** a Google Play „Engedélyek" listájában nincs internet-hozzáférés.
2. **A CI-ban:** minden commitnál lefut a [build](.github/workflows/build.yml): a build
   elbukik, ha INTERNET engedély kerülne az APK-ba, ha a mentési szabályok a kért másolaton
   kívül bármit engednének, ha követő SDK kerülne a függőségek közé, ha hálózati hívás
   jelenne meg a kódban, vagy ha tiltott állítás (pl. „optimális adag") kerülne a szövegekbe —
   lásd [`scripts/ethics-check.mjs`](scripts/ethics-check.mjs).
3. **Forrásból:** építsd meg magad (lent), és nézd meg a kész APK engedélyeit:
   `aapt dump permissions android/app/build/outputs/apk/debug/app-debug.apk`.

Minden ígéret, a mechanizmusa és a bizonyítéka: [ETHICS.md](ETHICS.md). A termék szerződése:
[SPEC.md](SPEC.md).

## Építés forrásból

Node 22, JDK 21, Android SDK (iOS-hez Xcode 26).

```bash
npm ci
npm test                      # Vitest
node scripts/ethics-check.mjs # az ígéretek őre
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug
```

## Közreműködés

Lásd [CONTRIBUTING.md](CONTRIBUTING.md) és [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
Biztonsági hiba: [SECURITY.md](SECURITY.md). **Soha ne küldj valódi naplóadatot.**

Kiadó: OHM Corp Kft. · Licenc: MIT (kód), SIL OFL 1.1 (Noto Sans betűtípus).

---

# N1 Napló (English)

**The app has no internet permission: your diary lives on your phone and leaves it only when
you ask.** No analytics, no account, no cloud. We don't ask you to believe this — here is how
to check it.

## What it is

A diary for n-of-1 self-tracking — for AuDHD and neurodivergent people on medication who want
to bring more than "I think it's better" to their next appointment. One row a day, twenty
seconds: medication (your own labels and units), sleep, restlessness, anxiety, boredom, mood,
craving, a short note. Over weeks your own time series takes shape.

- **Daily entry** with large steppers; fill in or correct past days.
- **Weekly review** — a chart per field and one cross-view (*an observation, not a cause*).
- **Summary for your appointment** — 14/30/90 days as a PDF or CSV, made on the phone.
- **Backup to a file and restore**, with optional passphrase encryption; import an old CSV.
- **Evening reminder** if you want it — filling in is possible, never required.
- **Protection**: screenshots blocked by default, optional app lock with the phone's own
  authentication.
- Hungarian and English.

## What it isn't

Not a medical device: it doesn't diagnose, treat or advise on doses. Nobody monitors this
diary. **If you are in trouble:** 112 (EU emergency number), 116 123 (emotional support in
several EU countries); elsewhere, your local emergency number. Take your questions to your
doctor.

## How to check

1. **In the store:** the Google Play permission list has no internet access.
2. **In CI:** every commit runs the [build](.github/workflows/build.yml). It fails if the
   INTERNET permission reaches the APK, if the backup rules allow anything beyond the copy you
   chose, if a tracking SDK enters the dependencies, if a network call appears in the code, or
   if banned claims (e.g. "optimal dose") enter the copy — see
   [`scripts/ethics-check.mjs`](scripts/ethics-check.mjs).
3. **From source:** build it yourself (above) and inspect the APK's permissions with
   `aapt dump permissions android/app/build/outputs/apk/debug/app-debug.apk`.

Every promise with its mechanism and proof: [ETHICS.md](ETHICS.md). Contributing:
[CONTRIBUTING.md](CONTRIBUTING.md). Security: [SECURITY.md](SECURITY.md). **Never send real
diary data.**

Published by OHM Corp Kft. · Licence: MIT (code), SIL OFL 1.1 (Noto Sans font).
