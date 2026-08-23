# N1 Napló — spec (v1)

**Mi ez:** nyílt forráskódú Android-app n-of-1 öntesztelési naplóhoz — AuDHD-s és
neurodivergens sorstársaknak. Napi egy sor, húsz másodperc; hetek alatt személyes
dózis–állapot idősor, amit az orvosnak „leletbemutatásként" lehet átadni.
A projekt gazdája János; szánt licence: nyílt (alapértelmezés: MIT — F-Droid-kompatibilis;
János CC0-t is szeret, döntés release előtt).

## A napi sor (a mezők — a tanul.io-s beszélgetésből, kőbe vésve)

| mező | típus | skála |
|---|---|---|
| dátum | auto | — |
| gyógyszerek (pl. XR, IR — alapból 2 mező, bővíthető) | szám | darab |
| alvás | szám | óra, 0,5 lépés |
| izgalom | szám | 1–5 |
| szorongás | szám | 1–5 — nem ugyanaz, mint az izgalom (János, 2026-08-23) |
| **unalom** | szám | 1–5 — kulcsmező: a sóvárgás fő prediktora a hipotézis szerint |
| hangulat | szám | 1–5 |
| sóvárgás | szám | 0–5 |
| jegyzet | szöveg | opcionális, rövid |

A gyógyszermezők címkéi szerkeszthetők (ne legyen hardcode „Ritalin" — más sorstársnak
más a lelete), és a beállításokban további gyógyszermezők adhatók hozzá; a kikapcsolt
gyógyszermező adata megmarad, és az exportban is szerepel. Mezők be/ki kapcsolhatók a
beállításokban.

## Funkciók (v1 — szándékosan minimális)

1. **Napi bevitel** — egy képernyő, nagy tappolható léptetők/csúszkák, 20 mp alatt kitölthető.
   Visszamenőleges kitöltés/javítás naptárból.
2. **Napi értesítés** — konfigurálható időpont (alapért. 21:00), WorkManager/AlarmManager,
   megbízható (Doze-túlélő). A hangnem a csend-cikk etikája: **„a kitöltés lehetséges,
   nyomás nincs"** — nincs streak-szégyenítés, nincs piros szám, kihagyott nap nem hiba,
   hanem adatlyuk. Az üres napok emlékeztetője szelíd.
3. **Heti visszanézés** — egyszerű 7/30 napos sparkline mezőnként + a két kulcs-keresztkép:
   izgalom×adag és unalom×sóvárgás. Nem elemez naponta (megfigyelői torzítás) — a
   visszanézés-fül hetente egyszer „nyílik" igazán (finom nudge, nem tiltás).
4. **CSV-export** — „Leletbemutatás" gomb: share intent, tiszta CSV, orvosnak/magának.
5. **Adatvédelem mint alapérték:** minden adat kizárólag a készüléken (Room/DataStore).
   **Az app egyáltalán nem kér INTERNET permissiont.** Nincs analytics, nincs fiók,
   nincs felhő. Ez a sorstárs-bizalom alapja és a README első mondata.

## Stack és build

- A forni-di-napoli bejárt útja (János döntése, 2026-08-17): Capacitor 8 + Vite +
  React + TypeScript + Tailwind CSS v4.
- Tárolás: `@capacitor/preferences` — lokális JSON, egy kulcs a bejegyzéseknek.
- Értesítés: `@capacitor/local-notifications` — napi ismétlés, `allowWhileIdle`,
  a plugin boot-receivere reboot után visszaállítja.
- Nincs Google Play Services függés (F-Droid-barát); az INTERNET permission a
  manifestben `tools:node="remove"`-val tiltva, a CI külön őrzi.
- **Build-út lokális Android SDK nélkül:** GitHub Actions (check: tsc + biome + vitest;
  android: web build → `cap sync` → `gradle assembleDebug`) artifactként adja az APK-t →
  János letölti, telepíti. Release: később F-Droid + GitHub Releases.
- UI nyelv: magyar először, minden szöveg a `src/i18n/hu.ts`-ben (angol később).

## Hangnem

Az app szövegei a tanul.io hangján: száraz, meleg, önirónikus. Példák:
üres állapot: „Még nincs adat. Ez nem hiba, hanem kezdet."; export gomb: „Leletbemutatás";
beállításokban az értesítésnél: „Szólok este. Nyomás nincs."

## Nem-célok (v1)

Nincs: felhő-szinkron, fiók, közösségi funkció, AI-elemzés, gamifikáció, widget (v2-re),
több felhasználó. A v1 egy jó napló és egy megbízható értesítés. Ennyi. Az ennyi a termék.
