# F1 dashboard

Statický přehled formule 1 – kalendář závodů, vítězové, bodování jezdců a
konstruktérů, odpočet do dalšího závodu a grafitový motiv s volitelným akcentem
ve stylu Google Material 3 Expressive. Data se tahají živě z
[Jolpica F1 API](https://api.jolpi.ca/ergast/f1/), takže se stránka sama
aktualizuje. Rozhraní je pouze v angličtině.

Postavené na Vite a TypeScriptu. Výsledkem buildu je ale pořád čistě statický
web – žádný server ani runtime.

## Vývoj

```bash
npm install
npm run dev        # vývojový server s HMR
npm run typecheck  # kontrola typů (tsc --noEmit)
npm run build      # typecheck + produkční build do dist/
npm run preview    # náhled produkčního buildu
```

## Struktura

```
f1/
├─ index.html              – statická kostra: hlavička, panely, patička
├─ src/
│  ├─ main.ts              – vstupní bod, boot, časovače a obnova dat
│  ├─ config.ts            – API_BASE, REFRESH_MS, SESSION_DEFS, TZ, klíče
│  ├─ types.ts             – typy sdílené datovou vrstvou a UI
│  ├─ styles/              – rozdělené CSS (tokeny, hlavička, kalendář…)
│  ├─ lib/                 – DOM, formátování, localStorage, téma, pohyb
│  ├─ theme/palette.ts     – ACCENTS, NEUTRALS, výchozí akcent
│  ├─ data/                – Jolpica, normalizace, týmy, vlajky, snapshot
│  ├─ app/                 – stav, načítání dat, vykreslení, tik
│  └─ ui/                  – hero, kalendář, bodování, stav, navigace…
├─ public/
│  ├─ data.json            – záložní data pro první načtení bez API
│  ├─ img/og.png           – náhled pro sociální sítě (1200×630)
│  ├─ robots.txt
│  └─ sitemap.xml
├─ scripts/sync-snapshot.mjs
├─ vite.config.ts
├─ tsconfig.json
└─ .github/workflows/deploy.yml
```

`public/` se celý kopíruje do `dist/`, takže cesty v prohlížeči zůstávají
`/data.json`, `/img/og.png` atd.

## Co stránka umí

- **Živá data** – kalendář, vítězové, bodování jezdců i týmů z Jolpica F1.
  Načte se při otevření, obnovuje se každých 10 minut a znovu při návratu
  na kartu. Data se ukládají do `localStorage` i s časem poslední aktualizace.
- **Odpočet do dalšího závodu** v časovém pásmu `Europe/Prague`, s jemnou
  animací měnících se číslic. Banner je kompaktní – ukazuje jen odpočet a čas
  startu, bez rozvrhu víkendu. Závod se počítá jako dokončený, jakmile má
  výsledky; do té doby banner ukazuje „Lights out“.
- **Kalendář v jednom sloupci** – všechny závody seřazené podle čísla kola,
  rozdělené do sekcí „Upcoming races“ a „Completed races“ s počtem závodů
  v nadpisu. Závod z banneru se v seznamu už neopakuje. Karta ukazuje číslo
  kola, vlajku země, název Grand Prix, štítek Sprint, datum závodu, počet
  sessioní a chevron.
- **Rozbalovací rozvrh** – kliknutím na kartu se plynule rozbalí session
  (Practice 1–3, Sprint Qualifying, Sprint, Qualifying, Race) s dnem, délkou
  a časem v `Europe/Prague`. Nejbližší session má odznak NEXT. U dokončených
  závodů je pod rozvrhem řádek „Winner: …“ s jezdcem, týmem a časem / stavem;
  u nadcházejících „Not raced yet“. Položky se objevují postupně (50 ms).
- **Vlajky zemí** – kreslené inline SVG v `src/data/flags.ts`. Neznámá země
  dostane neutrální glóbus.
- **Bodování** – konstruktéři a jezdci seřazení podle bodů, s medailovými
  kruhy pro první tři, pruhem v barvě týmu a podílovým neutrálním pruhem.
- **Grafitový motiv s akcentem** – šedé a černé plochy, v light režimu bílé
  plochy s černým textem. Z osmi akcentů (Red, Blue, Green, Teal, Amber, Pink,
  Violet, Graphite) jde vybrat jeden; mění se jen primární barva, nikdy
  neutrální plochy. V hlavičce je kruhové tlačítko se sluncem/měsícem, které
  přepíná světlý a tmavý režim; ikona se při přepnutí plynule otočí a prohodí.
  Při prvním otevření je výchozí tmavý (černo-bílý) režim; světlý se zapne,
  až když ho návštěvník přepne. Volba se ukládá do `localStorage` a do
  stránky se aplikuje inline skriptem v `<head>` ještě před vykreslením těla,
  takže neproblikne špatné téma. Přepínač Light / Dark i mřížka akcentů
  v panelu vzhledu zůstávají; tlačítko vzhledu sedí vedle navigace (na mobilu
  nad kalendářem).
- **M3 Expressive navigace** – segmentovaný seznam s ikonami a posuvným
  indikátorem aktivní položky (bez zaškrtávací ikony).
- **Pohyb** – jemné, déle plynoucí najíždění karet, rozbalování rozvrhu
  s postupným odkrýváním řádků a měkký přechod všech barev (~460 ms) při
  změně motivu. Vše respektuje `prefers-reduced-motion`.
- **Mobil** – vycentrované nadpisy a banner. Na PC zůstává celý stavový
  štítek s časem poslední aktualizace, na telefonech a tabletech (i na šířku
  nebo v režimu širokého viewportu) ho nahrazuje kruhové tlačítko s ikonou
  refresh. Ta se netočí sama od sebe – roztočí se až po kliknutí (a během
  načítání dat); plný text zůstává v popisku pro čtečky.
- Bez frameworků, bez externích fontů a analytiky.

## Úpravy

- **API** – `API_BASE` v `src/config.ts` (výchozí
  `https://api.jolpi.ca/ergast/f1`).
- **Interval obnovy** – `REFRESH_MS` v `src/config.ts` (výchozích 10 minut).
- **Délky sessioní** – `SESSION_DEFS` v `src/config.ts`; Jolpica posílá jen
  začátky, proto se zobrazují obvyklé délky (tréninky a kvalifikace 60 min,
  sprint 60 min, sprintová kvalifikace 44 min, závod ≈ 2 h).
- **Vlajky** – `FLAGS` (inline SVG) a `COUNTRY_CODES` (název země → kód)
  v `src/data/flags.ts`. Pro novou zemi stačí doplnit obojí.
- **Barvy týmů** – `TEAM_COLORS` s variantami `dark` a `light` pro každý
  `constructorId` v `src/data/teams.ts`. Neznámý tým dostane neutrální šedou
  a upozornění v konzoli.
- **Názvy týmů** – `TEAM_NAMES` v `src/data/teams.ts` přepisuje názvy z API
  (např. „RB F1 Team“ → „Racing Bulls“).
- **Motiv** – `ACCENTS` a `NEUTRALS` v `src/theme/palette.ts`; stejné hodnoty
  jsou jako CSS proměnné v `src/styles/tokens.css`, odkud je bere celá
  stránka. Neutrální plochy jsou pevné, každý akcent má variantu `light`
  a `dark`.
- **Záložní snapshot** – `public/data.json` se načítá za běhu, když API
  selže. `src/data/snapshot.json` je stejný payload zabundovaný do JS pro
  případ, že selže i tento fetch. Oba soubory drží v synchronizaci
  `npm run sync:snapshot`.

### Když API neodpovídá

Pořadí zdrojů je: paměť → `localStorage` → živé API → `data.json` →
zabundovaný snapshot. Při výpadku API zůstane na obrazovce poslední známý stav
a v hlavičce se zobrazí „Offline · …“ s časem poslední aktualizace (na mobilu
jen tlačítko s ikonou, plný text je v jeho popisku pro čtečky).

## Nasazení

`npm run build` vytvoří `dist/` – nahraj ho na Cloudflare Pages, Netlify,
Vercel nebo GitHub Pages. Pro doménu `tomsix.xyz` nastav odpovídající DNS
záznamy.

Repozitář obsahuje i workflow `.github/workflows/deploy.yml`, který při pushi
do `main` spustí build a nasadí `dist/` na GitHub Pages. V nastavení
repozitáře je potřeba mít **Settings → Pages → Source** nastavené na
**GitHub Actions**.

## Poznámky

- Neoficiální fanouškový projekt, není spojený s Formula 1, FIA ani týmy.
- Časy jsou převáděné do `Europe/Prague`; oficiální harmonogram je vždy
  dobré zkontrolovat.
- `data.json` i zabundovaný snapshot jsou z **23. 11. 2026** (po 21. závodě
  sezóny 2026). Slouží jen jako záloha pro první načtení; živá data mají
  přednost. Po aktualizaci snapshotu spusť `npm run sync:snapshot`.