# F1 dashboard

Jednosouborový přehled formule 1 – kalendář závodů, vítězové, bodování jezdců
a konstruktérů, odpočet do dalšího závodu a monochromatický motiv s jedním
akcentem ve stylu Google Material 3 Expressive. Veškerá data se tahají živě z
[Jolpica F1 API](https://api.jolpi.ca/ergast/f1/), takže se stránka sama
aktualizuje. Rozhraní je pouze v angličtině.

## Otevření

Stačí otevřít `index.html` v prohlížeči nebo složku naservírovat libovolným
statickým serverem.

```
f1/
├─ index.html     – celá stránka (HTML + CSS + JS + záložní snapshot)
├─ data.json      – záložní data pro první načtení bez API
├─ img/og.png     – náhled pro sociální sítě (1200×630)
├─ robots.txt
└─ sitemap.xml
```

## Co stránka umí

- **Živá data** – kalendář, vítězové, bodování jezdců i týmů z Jolpica F1.
  Načte se při otevření, obnovuje se každých 10 minut a znovu při návratu
  na kartu. Data se ukládají do `localStorage` i s časem poslední aktualizace.
- **Odpočet do dalšího závodu** v časovém pásmu `Europe/Prague`, s jemnou
  animací měnících se číslic. Banner je kompaktní a rozklikává se stejně jako
  karty závodů – pod odpočtem se otevře celý rozvrh víkendu. Závod se počítá
  jako dokončený, jakmile má výsledky; do té doby banner ukazuje „Lights out“.
- **Kalendář v jednom sloupci** – všechny závody seřazené podle čísla kola,
  rozdělené do sekcí „Upcoming races“ a „Completed races“ s počtem závodů
  v nadpisu. Závod z banneru se v seznamu už neopakuje. Karta ukazuje číslo
  kola, vlajku země, název Grand Prix, štítek Sprint, datum závodu, okruh,
  město a zemi, počet sessioní a chevron.
- **Rozbalovací rozvrh** – kliknutím na kartu se plynule rozbalí session
  (Practice 1–3, Sprint Qualifying, Sprint, Qualifying, Race) s dnem, délkou
  a časem v `Europe/Prague`. Nejbližší session má odznak NEXT. U dokončených
  závodů je pod rozvrhem řádek „Winner: …“ s jezdcem, týmem a časem / stavem;
  u nadcházejících „Not raced yet“. Položky se objevují postupně (50 ms).
- **Vlajky zemí** – kreslené inline SVG přímo v `index.html`, takže zůstává
  jediným souborem. Neznámá země dostane neutrální glóbus.
- **Bodování** – konstruktéři a jezdci seřazení podle bodů, s medailovými
  kruhy pro první tři, pruhem v barvě týmu a podílovým neutrálním pruhem.
- **Monochromatický motiv** – grafitové plochy, černý text a jedna akcentní
  barva ve světlé i tmavé variantě. Přepínač Light / Dark je segmentovaný
  seznam; volba se pamatuje a přechod barev je plynulý. Tlačítko vzhledu sedí
  vedle navigace (na mobilu nad kalendářem).
- **M3 Expressive navigace** – segmentovaný seznam s ikonami, zaškrtnutím
  aktivní položky a posuvným indikátorem.
- **Pohyb** – jemné najíždění karet, rozbalování rozvrhu, rozostření obsahu
  podle rychlosti scrollování. Vše respektuje `prefers-reduced-motion`.
- **Mobil** – vycentrované nadpisy a banner, stavový text nahrazuje jen
  animované tlačítko s tečkou; celý text zůstává v popisku pro čtečky.
- Bez frameworků, bez buildu, bez externích fontů a analytiky.

## Úpravy

Vše důležité je v komentáři na začátku `index.html` a v hlavním `<script>`
(uprostřed souboru):

- **API** – konstanta `API_BASE` (výchozí `https://api.jolpi.ca/ergast/f1`).
- **Interval obnovy** – `REFRESH_MS` (výchozích 10 minut).
- **Délky sessioní** – `SESSION_DEFS`; Jolpica posílá jen začátky, proto se
  zobrazují obvyklé délky (tréninky a kvalifikace 60 min, sprint 60 min,
  sprintová kvalifikace 44 min, závod ≈ 2 h).
- **Vlajky** – mapa `FLAGS` (inline SVG) a `COUNTRY_CODES` (název země →
  kód). Pro novou zemi stačí doplnit obojí.
- **Barvy týmů** – `TEAM_COLORS` s variantami `dark` a `light` pro každý
  `constructorId`. Neznámý tým dostane neutrální šedou a upozornění v konzoli.
- **Názvy týmů** – `TEAM_NAMES` přepisuje názvy z API (např. „RB F1 Team“ →
  „Racing Bulls“).
- **Motiv** – objekt `THEMES` v samostatném `<script>` v hlavičce; jediná
  paleta `graphite` má variantu `light` a `dark` (jedna akcentní barva).
- **Záložní snapshot** – konstanta `F1_BOOTSTRAP` (hledej `window.F1_BOOTSTRAP`),
  používaná jen když API i `data.json` selžou (např. při otevření přes `file://`).

### Když API neodpovídá

Pořadí zdrojů je: paměť → `localStorage` → `data.json` → inline snapshot.
Při výpadku API zůstane na obrazovce poslední známý stav a v hlavičce se
zobrazí „Offline · …“ s časem poslední aktualizace (na mobilu jen animované
tlačítko, plný text je v jeho popisku pro čtečky).

## Nasazení

Čistě statický web – nahraj obsah repozitáře na Cloudflare Pages, Netlify,
Vercel nebo GitHub Pages. Žádný build krok. Pro doménu `tomsix.xyz` nastav
odpovídající DNS záznamy.

## Poznámky

- Neoficiální fanouškový projekt, není spojený s Formula 1, FIA ani týmy.
- Časy jsou převáděné do `Europe/Prague`; oficiální harmonogram je vždy
  dobré zkontrolovat.
- `data.json` i inline snapshot jsou z **23. 11. 2026** (po 21. závodě sezóny
  2026). Slouží jen jako záloha pro první načtení; živá data mají přednost.