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
  fields: {
    alvas: 'Alvás (óra)',
    izgalom: 'Izgalom',
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
    med1Default: 'Gyógyszer 1',
    med2Default: 'Gyógyszer 2',
    medLabelPlaceholder: 'Mező neve',
    medsHint: 'A címkék a te leleted szerint — nincs beégetett gyógyszernév.',
    fieldsSection: 'Mezők',
    privacy:
      'Minden adat kizárólag ezen a készüléken marad. Az app nem kér internet-hozzáférést — nincs analitika, nincs fiók, nincs felhő.',
  },
  reminder: {
    title: 'N1 Napló',
    body: 'Ha van kedved, egy sor a mai napról. Ha nincs, az is adat.',
  },
} as const
