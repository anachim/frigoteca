# Search-Recipe — Piano di lavoro

App locale (desktop + Android) per gestire un ricettario personale, con ricerca per nome e per
ingredienti disponibili ("cosa ho nel frigo").

## Decisioni

- **Stack**: Tauri 2 + SQLite (plugin SQL di Tauri), frontend Svelte.
- **Tutto in locale**: nessun backend, nessun login.
- **ID ricette = UUID**, così export/import per la condivisione funzionano senza conflitti.
- **Quantità come frazione esatta** (`qty_num` / `qty_den`), salvata sempre in **unità base**:
  `g`, `ml`, `pz`, `parte`, `qb`. Scalare le porzioni resta esatto (1/3 non diventa 0.333).
- **Input**: l'utente scrive in qualsiasi unità (`1 kg`, `1/2 l`, `2 cucchiai`), si converte in
  unità base al salvataggio.
- **Visualizzazione**: si sceglie la unità più leggibile (1500 g → 1,5 kg; 250 ml → 250 ml;
  1000 ml → 1 l). Se l'utente ha usato un'unità da cucina (cucchiaio, cucchiaino, tazza) la si
  ricorda in `display_unit` e si mostra quella ("2 cucchiai", non "30 ml").
- **Cocktail**: unità `parte` (proporzionale); volume bicchiere opzionale sulla ricetta.
- **Organizzazione con tag** (molti-a-molti), non cartelle. Niente categoria fissa cibo/cocktail:
  "Cocktail" è un tag.
- **Ricerca frigo con quantità**: l'utente indica cosa ha e quanto (quantità facoltativa).
- **Tipi di misura** (tutte quantità assolute, tranne `parte`):
  - peso: `g`, `kg` → es. 30 g zucchero
  - volume: `ml`, `cl`, `l`, `cucchiaio`, `cucchiaino`, `tazza` → es. 100 ml latte
  - pezzi: `pz` → es. 1 limone, 2 uova
  - proporzione: `parte` → es. 1/4 Malibu (relativa, solo cocktail)
  - nessuna: `qb` → es. sale q.b.
- Le conversioni avvengono dentro lo stesso tipo (1 kg = 1000 g, 1 l = 1000 ml). Tra tipi diversi
  (peso↔volume, pezzi↔peso) no: in quel caso "verifica quantità".

## Schema dati

```sql
recipe(
  id TEXT PRIMARY KEY,          -- UUID
  name TEXT NOT NULL,
  instructions TEXT,
  servings INTEGER,
  glass_ml INTEGER NULL,        -- cocktail: volume bicchiere
  favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ingredient(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pantry INTEGER NOT NULL DEFAULT 0   -- sempre in dispensa (sale, olio, acqua)
);

recipe_ingredient(
  recipe_id TEXT NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredient(id),
  qty_num INTEGER NULL,         -- in unità base
  qty_den INTEGER NULL,
  unit TEXT NULL CHECK (unit IN ('g','ml','pz','parte','qb')),
  display_unit TEXT NULL,       -- cucchiaio, cucchiaino, tazza: unità scelta dall'utente
  note TEXT NULL,
  optional INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL
);

tag(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  color TEXT NULL,
  icon TEXT NULL
);

recipe_tag(
  recipe_id TEXT NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

fridge_item(                    -- cosa ho in casa, persistente
  ingredient_id INTEGER PRIMARY KEY REFERENCES ingredient(id) ON DELETE CASCADE,
  qty_num INTEGER NULL,         -- NULL = "ce l'ho", quantità non indicata
  qty_den INTEGER NULL,
  unit TEXT NULL CHECK (unit IN ('g','ml','pz'))
);

shopping_item(
  id INTEGER PRIMARY KEY,
  ingredient_id INTEGER NULL REFERENCES ingredient(id),
  text TEXT NOT NULL,           -- testo libero se non legato a un ingrediente
  qty_num INTEGER NULL,
  qty_den INTEGER NULL,
  unit TEXT NULL CHECK (unit IN ('g','ml','pz')),
  done INTEGER NOT NULL DEFAULT 0
);

-- ricerca per nome, insensibile agli accenti ("caffe" trova "caffè")
CREATE VIRTUAL TABLE recipe_fts USING fts5(
  name, content='recipe', content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);
```

## Fasi

### Fase 0 — Setup
- [x] Progetto Tauri 2 + Svelte
- [x] Plugin SQL SQLite, migrazioni con lo schema sopra
- [ ] Build desktop funzionante
- [ ] Build Android su emulatore (verificare presto: è il punto più fragile)
- [x] Repo git + CI di base (vedi sezione CI/CD)

### Fase 1 — Ricette e organizzazione
- [x] CRUD ricette (nome, porzioni, procedimento, volume bicchiere opzionale)
- [x] Editor ingredienti: autocomplete su ingredienti esistenti, quantità frazionaria, unità da menu
- [x] Inserimento ingrediente in una riga: `30 g zucchero`, `1/4 parte malibu`, `1 limone`, `sale qb`
      → quantità + unità + ingrediente, convertito in unità base (parser con test)
- [x] Formattazione quantità per la UI: unità base → unità leggibile (g/kg, ml/l, `display_unit`),
      frazioni comuni come frazione (1/2, 1/4), il resto arrotondato (con test)
- [x] Incolla lista ingredienti (una riga = un ingrediente, stesso parser)
- [ ] Lista ricette + dettaglio
- [ ] Tag: creazione con colore/emoji, assegnazione multipla
- [ ] Filtro lista per uno o più tag
- [ ] Preferiti
- [ ] Eliminazione con "Annulla" (toast) invece di conferma
- [ ] Bozza ricetta salvata automaticamente
- [ ] Tema scuro automatico (`prefers-color-scheme`)
- [ ] Layout mobile: navigazione in basso, azioni principali a portata di pollice
- [ ] Stato vuoto curato ("Crea la tua prima ricetta")

### Fase 2 — Ricerca
- [ ] Ricerca per nome (FTS5, insensibile agli accenti)
- [ ] Frigo persistente (`fridge_item`): chip grandi da toccare, più usati in alto, quantità
      facoltativa con lo stesso parser a riga (`500 g farina`, `6 uova`)
- [ ] Confronto diretto in unità base (stessa unità = confrontabile, nessuna conversione)
- [ ] Confronto ricetta vs frigo per ogni ingrediente (esclusi opzionali e "dispensa"):
  - **ok**: presente e quantità sufficiente, oppure ricetta senza quantità (`qb`)
  - **insufficiente**: presente ma poco → "mancano 20 g zucchero"
  - **da verificare**: presente senza quantità, o unità non confrontabili (g vs ml, pz vs g)
  - **mancante**: non presente
  - `parte` (cocktail): confrontabile solo se la ricetta ha `glass_ml`, altrimenti solo presenza
- [ ] Risultati in gruppi: "Puoi farla" / "Quasi" (insufficienti o mancanti, ordinati per quanti) /
      con badge "verifica quantità" dove serve; risultati aggiornati a ogni modifica del frigo
- [ ] Sotto ogni risultato: "ti manca: 2 uova, 50 g pecorino"
- [ ] "Ti basta per N porzioni": minimo tra disponibile/richiesto sugli ingredienti confrontabili
- [ ] Ricerca frigo combinabile con filtro tag

### Fase 3 — Comodità
- [ ] Porzioni con +/− nel dettaglio ricetta (frazioni esatte)
- [ ] Cocktail: calcolo ml per ingrediente da `parte` + volume bicchiere
- [ ] Modalità cucina: testo grande, schermo sempre acceso (Wake Lock API — verificare su
      WebView Android e WebView2), passi numerati, ingredienti e passi da spuntare
- [ ] Lista della spesa: "aggiungi mancanti" dalla ricerca frigo con le quantità mancanti
      (es. "20 g zucchero"), voci spuntabili
- [ ] Dopo aver cucinato: "scala dal frigo" le quantità usate (facoltativo, con Annulla)

### Fase 4 — Condivisione
- [ ] Export/import ricetta in JSON (con tag e ingredienti)
- [ ] Share nativo su Android

## CI/CD (GitHub Actions)

### CI — ogni push e pull request (Fase 0)
- [ ] Un job su Ubuntu: `svelte-check`, test frontend (Vitest: parser quantità, formattazione,
      confronto frigo), `cargo fmt --check`, `cargo clippy`, `cargo test`
- [ ] Cache di npm e cargo
- [ ] Niente build completa dei pacchetti in CI: troppo lenta, la fa il release

### Release — al push di un tag `v*`
- [ ] Desktop con `tauri-apps/tauri-action`, matrice di runner, tutto allegato a una GitHub
      Release in bozza:
  - Windows: NSIS + MSI
  - macOS: Apple Silicon (`aarch64-apple-darwin`) + Intel (`x86_64-apple-darwin`), `.dmg`
  - Linux (Ubuntu 22.04): AppImage + `.deb`
- [ ] Android: `tauri android build --apk` su Ubuntu (Java + Android SDK/NDK), APK firmato per
      installazione manuale
- [ ] Keystore Android e password nei secrets del repo (keystore in base64).
      **Conservare una copia del keystore fuori da GitHub**: se si perde, gli utenti non possono
      aggiornare l'app installata e servirà disinstallarla (perdendo le ricette).
- [ ] Versione unica in `tauri.conf.json`, deve coincidere con il tag

### Rimandati
- Firma codice Windows (senza certificato SmartScreen mostra un avviso al primo avvio)
- Firma e notarizzazione macOS (Apple Developer, a pagamento): senza, al primo avvio serve
  tasto destro → Apri
- Auto-aggiornamento desktop (`tauri-plugin-updater`)
- Play Store: account sviluppatore, build AAB, Play App Signing

## Rimandati (aggiungere solo se servono)

- Foto ricette
- Sinonimi ingredienti
- Conversione peso↔volume (densità per ingrediente) e pezzi↔grammi (peso medio, es. 1 uovo ≈ 60 g)
- Tag annidati
- Raccolte intelligenti (ricerche salvate)
- Campi personalizzati
- Timer nei passi (richiede notifiche native)
- Ricette di esempio al primo avvio
