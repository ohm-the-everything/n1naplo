# N1 Napló

**Az N1 Napló minden adata kizárólag a te készülékeden marad — az app egyáltalán nem kér
internet-hozzáférést.** Nincs analitika, nincs fiók, nincs felhő. A CI külön ellenőrzi,
hogy az APK-ba ne kerülhessen INTERNET permission.

Nyílt forráskódú Android-napló n-of-1 öntesztelőknek — AuDHD-s és neurodivergens
sorstársaknak. Napi egy sor, húsz másodperc: gyógyszer, alvás, izgalom, unalom, hangulat,
sóvárgás, jegyzet. Hetek alatt személyes dózis–állapot idősor rajzolódik ki, amit
„leletbemutatásként" vihetsz az orvosodhoz.

## Mit tud (v1)

- **Napi bevitel** — egy képernyő, nagy léptetők, visszamenőleges javítás naptárból.
  A kihagyott nap nem hiba, hanem adatlyuk.
- **Napi értesítés** — szelíd esti jelzés (alapértelmezés: 21:00), Doze- és reboot-túlélő.
  A kitöltés lehetséges, nyomás nincs.
- **Heti visszanézés** — 7/30 napos sparkline mezőnként, plusz a két kulcs-keresztkép:
  izgalom × adag és unalom × sóvárgás. Szándékosan hetente „nyílik" igazán.
- **CSV-export** — „Leletbemutatás" gomb: tiszta CSV, megosztásra.

A gyógyszermezők címkéi szerkeszthetők — más sorstársnak más a lelete.

## Stack

Capacitor 8 + Vite + React + TypeScript + Tailwind CSS v4. Tárolás:
`@capacitor/preferences` (lokális, JSON). Értesítés: `@capacitor/local-notifications`.

## Build

Nem kell helyi Android SDK: a GitHub Actions workflow (`.github/workflows/build.yml`)
minden pushra lefuttatja az ellenőrzéseket, megépíti az appot, és artifactként feltölti
a debug APK-t.

Helyben:

```bash
npm install
npm run dev                  # webes fejlesztői szerver
npm run test                 # vitest
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug   # JDK 21+
```

## Licenc

MIT — lásd [LICENSE](LICENSE).
