// House voice: dry, warm, no pressure.
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
    sovargasHint: 'Erős késztetés valami után — te döntöd el, mi.',
  },
  review: {
    empty: 'Még nincs adat. Ez nem hiba, hanem kezdet.',
    gateTitle: 'Ezen a héten már visszanéztél.',
    gateBody:
      'A minták hetente látszanak igazán — a napi nézegetés inkább zajt mutat. De ez a te naplód: te döntesz.',
    gateOpen: 'Mutasd most',
    days7: '7 nap',
    days30: '30 nap',
    crossBoredom: 'Unalom és sóvárgás együtt',
    crossCaption: 'Csak megfigyelés, nem ok-okozat.',
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
    unitPlaceholder: 'pl. 10 mg tabletta',
    unitLocked: 'Más egységhez adj hozzá új mezőt — így a régi adatok jelentése nem változik.',
    addMed: 'Új gyógyszermező',
    medsHint:
      'A címkék a te leleted szerint — nincs beégetett gyógyszernév. A kikapcsolt mező adata megmarad, és az exportban is benne lesz.',
    fieldsSection: 'Mezők',
    privacy:
      'Az app nem kér internet-hozzáférést — nincs analitika, nincs fiók, nincs felhő. A napló csak akkor hagyja el a telefont, ha te kéred.',
  },
  backup: {
    section: 'Biztonsági másolat',
    intro:
      'A napló alapból csak ezen a telefonon van: ha a telefon elveszik vagy tönkremegy, vele vész. Kérhetsz másolatot a rendszer mentésébe — vagy nem. Bármikor átállíthatod.',
    cloudTitle: 'Másolat a Google-fiókodba',
    cloudHow:
      'Az Android nagyjából naponta egyszer, amikor a telefon pihen, a Google-fiókod privát mappájába menti a napló másolatát, és új telefonon vagy újratelepítéskor visszaállítja. Csak akkor menti, ha van képernyőzárad: azzal titkosítja, így a Google sem tudja elolvasni.',
    cloudRisk:
      'A kockázat: a napló egészségügyi adat (gyógyszer, hangulat, sóvárgás), és kikerül a telefonról. Aki ismeri a Google-fiókod jelszavát és a képernyőzárad kódját, egy másik telefonra is visszaállíthatja. Kikapcsoláskor a másolatot azonnal töröljük a telefonról; a fiókban lévő régi mentést az Android a következő mentéssel írja felül, vagy te törölheted a Google-fiókod mentései közül.',
    transferTitle: 'Átköltözés új telefonra',
    transferHow:
      'Új Android-telefon beállításakor a napló közvetlenül átkerül a régiről — kábellel vagy vezeték nélkül, felhő nélkül.',
    transferRisk:
      'A kockázat: aki a feloldott telefonodhoz hozzáfér, egy másik telefonra is átmásolhatja a naplót.',
    iosTitle: 'Másolat az iPhone mentésébe',
    iosHow:
      'A napló bekerül az iPhone mentésébe (iCloud vagy számítógép), és új iPhone-ra költözéskor átjön vele.',
    iosRisk:
      'A kockázat: a napló egészségügyi adat, és kikerül a telefonról. Az iCloud-mentést az Apple titkosítja, de a kulcsot csak akkor nem tartja magánál, ha bekapcsoltad a Speciális adatvédelmet. Aki belép az Apple-fiókodba, egy másik iPhone-ra is visszaállíthatja.',
    off: 'Ha kikapcsolva hagyod, a napló csak ezen a telefonon van.',
  },
  data: {
    section: 'Mentés és visszaállítás',
    hint: 'A teljes napló egy fájlban. Te döntöd el, hova teszed — és ebből jön vissza minden.',
    save: 'Mentés fájlba',
    restore: 'Visszaállítás vagy CSV-import',
    restoreTitle: 'Visszaállítod ezt a mentést?',
    restoreBody:
      'A mostani napló ({before} nap) helyére a mentés kerül ({after} nap). Ezt nem lehet visszacsinálni — ha kell a mostani, előbb mentsd fájlba.',
    restoreConfirm: 'Igen, visszaállítom',
    importTitle: 'Importálod a CSV-t?',
    importBody:
      'A fájl {days} napját beírom (az ott lévőt lecserélve), és {meds} új gyógyszermezőt hozok létre. A többi nap nem változik.',
    importConfirm: 'Igen, importálom',
    notN1: 'Ez nem N1 Napló-mentés és nem is N1 Napló-export.',
    newer: 'Ezt a mentést egy újabb N1 Napló készítette. Frissítsd az appot, és próbáld újra.',
    invalid: 'A fájlban hibás adat van, ezért nem változtattam semmin.',
    encryptTitle: 'Jelmondat a mentéshez',
    encryptBody:
      'A mentés a teljes napló. Aki hozzáfér a fájlhoz — egy megosztott mappán, e-mailen vagy egy oda belátó asszisztensen át —, el tudja olvasni. Jelmondattal titkosítva csak az, aki ismeri. Ha elfelejted, a mentést senki nem tudja megnyitni, mi sem.',
    passphrase: 'Jelmondat (legalább 8 karakter)',
    passphraseRepeat: 'Jelmondat még egyszer',
    passphraseShort: 'Legalább 8 karakter kell.',
    passphraseMismatch: 'A két jelmondat nem egyezik.',
    saveEncrypted: 'Titkosítva mentem',
    savePlain: 'Jelmondat nélkül',
    decryptTitle: 'Titkosított mentés',
    decryptBody: 'Add meg a jelmondatot, amivel a mentést készítetted.',
    decryptConfirm: 'Megnyitom',
    wrongPassphrase: 'Rossz jelmondat, vagy a fájl sérült.',
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
    restore: 'Visszaállítás mentésből',
    confirmTitle: 'Üres naplóval kezded?',
    confirmBody: 'A sérült fájl másolata megmarad a telefonon. A napló üresen indul.',
    confirmLabel: 'Igen, üresen kezdem',
  },
  reminder: {
    title: 'N1 Napló',
    body: 'Ha van kedved, egy sor a mai napról. Ha nincs, az is adat.',
  },
} as const
