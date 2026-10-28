# N1 Napló — spec (v1.1)

**Mi ez:** nyílt forráskódú Android- és iOS-app n-of-1 öntesztelési naplóhoz — AuDHD-s és
neurodivergens sorstársaknak. Napi egy sor, húsz másodperc; hetek alatt személyes
idősor arról, mit szedtél és hogy voltál, amit a következő konzultációra magaddal vihetsz.
Kiadó: OHM Corp Kft. Licenc: MIT.

**Mi nem:** nem orvostechnikai eszköz. Nem diagnosztizál, nem kezel, nem javasol és nem
számol adagot. A naplót senki nem figyeli.

## A napi sor (a mezők — kőbe vésve)

| mező | típus | skála |
|---|---|---|
| dátum | auto (helyi naptári nap) | — |
| gyógyszerek (alapból 2 mező, bővíthető) | szám | ≥ 0, a mező egységében |
| alvás | szám | óra, 0–24, 0,5 lépés |
| izgalom | szám | 1–5 |
| szorongás | szám | 1–5 — nem ugyanaz, mint az izgalom (János, 2026-08-23) |
| **unalom** | szám | 1–5 — kulcsmező: a sóvárgás fő prediktora a hipotézis szerint |
| hangulat | szám | 1–5 |
| sóvárgás | szám | 0–5 — elrejthető; egysoros magyarázattal |
| jegyzet | szöveg | opcionális, rövid |

A gyógyszermezők címkéi szerkeszthetők (ne legyen hardcode gyógyszernév — más sorstársnak
más a lelete), és a beállításokban további gyógyszermezők adhatók hozzá. **Minden
gyógyszermezőnek lehet egysége** (pl. „10 mg tabletta"). Amint a mezőben van adat, az
egység zárolt: más egységhez új mező kell — így a régi számok jelentése sosem változik.
A kikapcsolt gyógyszermező adata megmarad, és az exportban is szerepel. Mezők be/ki
kapcsolhatók a beállításokban.

## Funkciók (1.0 — szándékosan minimális)

1. **Napi bevitel** — egy képernyő, nagy tappolható léptetők, 20 mp alatt kitölthető.
   Visszamenőleges kitöltés/javítás naptárból.
2. **Bevezetés** — első indításkor négy rövid képernyő: mi ez; mi nem (nem orvostechnikai
   eszköz, senki nem figyeli, a segítség a Beállítások › Segítség alatt); az adataid (a
   telefonon maradnak, az appnak nincs internet-engedélye, a mentést te csinálod); esti
   jelzés — kéred vagy „Most nem".
3. **Esti emlékeztető** — **alapból ki**; csak a bevezetésben vagy a beállításokban kért
   jelzés után kér engedélyt. Konfigurálható időpont (alapért. 21:00, helyi idő, az
   óraátállítás után is), megbízható (Doze-túlélő). A hangnem a csend-cikk etikája:
   **„a kitöltés lehetséges, nyomás nincs"** — nincs streak-szégyenítés, nincs piros szám,
   kihagyott nap nem hiba, hanem adatlyuk. Ha a rendszer csak pontatlan jelzést enged, a
   beállítások megmondják, és felajánlják a pontos jelzés engedélyét.
4. **Heti visszanézés** — 7/30 napos sparkline mezőnként; gyógyszermezőnként egy
   időrendi napi görbe (az egységgel a címkében); és egy keresztkép: „Unalom és sóvárgás
   együtt" — *csak megfigyelés, nem ok-okozat*. Gyógyszerek összevont vagy adag szerinti
   keresztképe nincs. Nem elemez naponta (megfigyelői torzítás) — a visszanézés-fül
   hetente egyszer „nyílik" igazán (finom nudge, nem tiltás: bármikor megnyitható).
5. **Összefoglaló a konzultációhoz** — 14/30/90 nap; HTML-előnézet, majd **PDF** (A4,
   offline készül a telefonon, magyar ékezetekkel) és **CSV** megosztás. Tartalom: rögzített
   és hiányzó napok, gyógyszermezőnkénti napi rács, mezőstatisztika (min/medián/max), a
   nyitott témák a következő rendelésre, kérésre a jegyzetek és a sóvárgás. Fejléc alatt:
   „Saját megfigyelések, ajánlás nélkül."
6. **Mentés és visszaállítás** — a teljes napló egy fájlba menthető (megosztás), és fájlból
   visszaállítható; egy régi CSV-export (a v0.1-es debug buildé is) importálható. Minden
   ilyen művelet előtt az app megmondja a hatását (pl. „most 40 nap → 52 nap"), és csak
   megerősítés után lép. Sérült, idegen vagy újabb verziójú fájlt elutasít, a mostani
   naplóhoz nem nyúl. A mentés, a visszaállítás és minden export ingyenes, örökre.
7. **Segítség** — offline: 112, a 116-123 (LESZ, ingyenes, 0–24 órás lelki elsősegély),
   ellenőrzési dátummal; angolul az EU-s 112 és 116 123. „A naplót senki nem figyeli — ha
   bajban vagy, hívj valakit."
8. **Nyelv** — magyar és angol; a telefon nyelvét követi, a beállításokban felülírható.
9. **Adatvédelem mint alapérték:** minden adat kizárólag a készüléken. **Az app egyáltalán
   nem kér INTERNET permissiont.** Nincs analytics, nincs fiók, nincs felhő. Ez a
   sorstárs-bizalom alapja és a README első mondata.

**Kivéve 1.0-ból:** az „izgalom × adag" keresztkép (összeadott adagokat mutatott, ami
félrevezet).

## Tárolás

A napló egyetlen JSON-fájl (`n1naplo.json`) a készülék biztonsági mentésből kizárt
könyvtárában (iOS: `LibraryNoCloud`). Mentés: ideiglenes fájl, majd csere — egy félbeszakadt
írás után a régi vagy az új napló marad meg, sosem üres vagy félkész. Sérült fájlt az app
nem ír felül: félreteszi, és felajánlja a visszaállítást. Androidon a felhős mentés és az
eszközök közötti átvitel ki van kapcsolva (`allowBackup="false"`, kizáró szabályok): a napló
csak úgy hagyja el a telefont, ha te mented ki.

## Stack és build

- Capacitor 8 + Vite + React + TypeScript + Tailwind CSS v4 (a forni-di-napoli bejárt útja,
  János döntése, 2026-08-17).
- Értesítés: `@capacitor/local-notifications` — előre ütemezett, egyszeri, `allowWhileIdle`
  jelzések; a plugin boot-receivere reboot után visszaállítja őket.
- Nincs Google Play Services függés; az INTERNET permission a manifestben
  `tools:node="remove"`-val tiltva.
- **Nyilvános CI** minden commitra: typecheck + lint + tesztek + etikai őr, debug APK, és
  egy őr, ami bedönti a buildet, ha INTERNET permission kerülne a merge-elt manifestbe.
  Forrásból bárki építhet (README).
- UI-szövegek kizárólag az `src/i18n/` alatt, magyarul és angolul.

## Hangnem

Az app szövegei a tanul.io hangján: száraz, meleg, önirónikus. Példák:
üres állapot: „Még nincs adat. Ez nem hiba, hanem kezdet."; beállításokban az
emlékeztetőnél: „Szólok este. Nyomás nincs."

## Nem-célok (1.0)

Nincs: felhő-szinkron, fiók, közösségi funkció, AI-elemzés, gamifikáció, widget, több
felhasználó, adag-javaslat. Az 1.0 egy jó napló, egy megbízható emlékeztető és egy
összefoglaló, amit odaadhatsz. Ennyi. Az ennyi a termék.

## Fogalmak

| magyar | English | jelentés |
|---|---|---|
| bejegyzés | entry | egy nap sora |
| adatlyuk | data gap | kihagyott nap — nem hiba |
| gyógyszermező | medication field | szerkeszthető címkéjű számmező |
| egység | unit | amiben a gyógyszermező számol; adat után zárolt |
| összefoglaló | summary | a konzultációra vihető PDF/CSV |
| mentés | backup | a teljes napló egy fájlban |
| visszaállítás | restore | a napló cseréje egy mentésből |
| téma | topic | amit a következő rendelésen szóba hoznál |
| emlékeztető | reminder | az esti jelzés, alapból ki |
