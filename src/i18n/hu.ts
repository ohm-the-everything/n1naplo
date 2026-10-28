// Minden UI-szöveg itt él — tanul.io-hang: száraz, meleg, nyomás nélkül.
export const hu = {
  appName: 'N1 Napló',
  tabs: {
    entry: 'Napló',
    review: 'Visszanézés',
    settings: 'Beállítások',
  },
  entry: {
    prevDay: 'Előző nap',
    nextDay: 'Következő nap',
    backToToday: 'Vissza a mához',
    clear: 'Törlés',
    notePlaceholder: 'Rövid jegyzet, ha van…',
    footer: 'Minden mentve, ahogy írod. A kihagyott mező nem hiba, hanem adatlyuk.',
  },
  topics: {
    title: 'Témák a következő rendelésre',
    placeholder: 'Amit nem akarsz elfelejteni…',
    add: 'Téma hozzáadása',
    done: 'Megbeszélve',
    remove: 'Törlés',
    empty: 'Ami két rendelés közt eszedbe jut, ide írd — ott úgyis elfelejtenéd.',
  },
  fields: {
    alvas: 'Alvás (óra)',
    izgalom: 'Izgalom',
    szorongas: 'Szorongás',
    unalom: 'Unalom',
    hangulat: 'Hangulat',
    sovargas: 'Sóvárgás',
    jegyzet: 'Jegyzet',
  },
  review: {
    empty: 'Még nincs adat. Ez nem hiba, hanem kezdet.',
    gateTitle: 'Ezen a héten már visszanéztél.',
    gateBody:
      'A minták hetente látszanak igazán — a napi nézegetés inkább zajt mutat. De ez a te naplód: te döntesz.',
    gateOpen: 'Mutasd most',
    days7: '7 nap',
    days30: '30 nap',
    crossDose: 'Izgalom × adag',
    crossBoredom: 'Unalom × sóvárgás',
    doseAxis: 'adag (db)',
    noPoints: 'Ehhez még kevés a pont. Majd lesz.',
  },
  settings: {
    exportSection: 'Leletbemutatás',
    exportButton: 'Leletbemutatás',
    exportHint: 'Tiszta CSV, az orvosnak vagy magadnak. Magától nem megy sehova.',
    reminderLabel: 'Esti emlékeztető',
    reminderHint: 'Szólok este. Nyomás nincs.',
    reminderTime: 'Időpont',
    medsSection: 'Gyógyszermezők',
    medFallback: 'Gyógyszer',
    addMed: 'Új gyógyszermező',
    medsHint:
      'A címkék a te leleted szerint — nincs beégetett gyógyszernév. A kikapcsolt mező adata megmarad, és az exportban is benne lesz.',
    fieldsSection: 'Mezők',
    privacy:
      'Minden adat kizárólag ezen a készüléken marad. Az app nem kér internet-hozzáférést — nincs analitika, nincs fiók, nincs felhő.',
  },
  common: {
    cancel: 'Mégse',
  },
  store: {
    saveFailed: 'Az utolsó változást nem sikerült elmenteni.',
    retry: 'Újra',
    loadFailed: 'A naplót most nem sikerült megnyitni. Az adat nem veszett el.',
  },
  recovery: {
    title: 'A napló fájlja megsérült.',
    body: 'Nem írtam felül semmit: a sérült fájlról másolat készült, és az megmarad. Kezdhetsz most üres naplóval.',
    startEmpty: 'Kezdés üres naplóval',
    confirmTitle: 'Üres naplóval kezded?',
    confirmBody: 'A sérült fájl másolata megmarad a telefonon. A napló üresen indul.',
    confirmLabel: 'Igen, üresen kezdem',
  },
  reminder: {
    title: 'N1 Napló',
    body: 'Ha van kedved, egy sor a mai napról. Ha nincs, az is adat.',
  },
} as const
