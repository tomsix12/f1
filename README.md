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
npm run dev           # vývojový server s HMR
npm run typecheck     # kontrola typů (tsc --noEmit)
npm run build         # typecheck + build + publikace do kořene repa
npm run build:dist    # jen build do dist/
npm run preview       # náhled dist/
npm run publish:root  # zkopíruje hotový dist/ do kořene
```

Zdrojový kód se edituje v `src/`. Po každé změně spusť `npm run build` –
kromě `dist/` přepíše i statické soubory v kořeni repozitáře, které se
commitují a které Vercel servíruje bez buildu.

## Struktura

```
f1/
├─ index.html              – hotový build (generovaný, needitovat)
├─ assets/                 – JS a CSS buildu (generované)
├─ data.json               – kopie public/data.json (generovaná)
├─ img/, robots.txt, sitemap.xml – kopie z public/ (generované)
├─ src/
│  ├─ index.html           – šablona stránky (zdroj pro build)
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
├─ scripts/
│  ├─ publish-root.mjs     – kopíruje dist/ do kořene repa
│  └─ sync-snapshot.mjs    – drží snapshot v src/data v souladu s public/
├─ vite.config.ts
└─ tsconfig.json
```

`public/` se kopíruje do buildu, takže cesty v prohlížeči zůstávají
`/data.json`, `/img/og.png` atd. Kořenové kopie (`index.html`, `assets/`,
`data.json`, `img/`) vznikají při `npm run build` a neupravují se ručně.

## Co stránka umí

- **Živá data** – kalendář, vítězové, bodování jezdců i týmů z Jolpica F1.
  Načte se při otevření, obnovuje se každých 10 minut a znovu při návratu
  na kartu. Data se ukládají do `localStorage` i s časem poslední aktualizace.
- **Odpočet do dalšího závodu** v časovém pásmu `Europe/Prague`, s jemnou
  animací měnících se číslic. Banner ukazuje název závodu, odpočet a čas
  startu; pod nimi je rozbalovací **Weekend schedule** s celým rozvrhem
  víkendu, který je po načtení otevřený a jde stejně jako u karet zavřít.
  Závod se počítá jako dokončený, jakmile má výsledky; do té doby banner
  ukazuje „Lights out“.
- **Kalendář v jednom sloupci** – všechny závody seřazené podle čísla kola,
  rozdělené do sekcí „Upcoming races“ a „Completed races“ s počtem závodů
  v nadpisu. Závod z banneru se v seznamu neopakuje. Karta ukazuje číslo
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
- **Nastavení v M3 Expressive stylu** – ozubené kolečko vedle tlačítka
  se sluncem/měsícem otevírá animovaný panel (pružinový nájezd, na mobilu pod
  celou hlavičkou). Nabízí segmentované volby tématu (System / Light / Dark),
  písma (Sans / Serif / Mono) a vypínač motion blur s posuvníkem
  intenzity (0.5–2.5×); dále osm akcentů a výběr oblíbeného jezdce a týmu. Oblíbený řádek se v bodování zvýrazní akcentovým
  rámečkem a hvězdičkou. Volby se ukládají do `localStorage`.
- **Grafitový motiv s akcentem** – šedé a černé plochy, v light režimu bílé
  plochy s černým textem. Z osmi akcentů (Red, Blue, Green, Teal, Amber, Pink,
  Violet, Graphite) jde vybrat jeden; mění se jen primární barva, nikdy
  neutrální plochy. Slunce/měsíc v hlavičce přepíná světlý a tmavý režim
  a ikona se při přepnutí plynule otočí a prohodí. Při prvním otevření je
  výchozí tmavý (černo-bílý) režim; systémová volba sleduje nastavení OS.
  Volba se ukládá do `localStorage` a do stránky se aplikuje inline skriptem
  v `<head>` ještě před vykreslením těla, takže neproblikne špatné téma
  ani písmo.
- **M3 Expressive navigace** – segmentovaný seznam s ikonami a posuvným
  indikátorem aktivní položky (bez zaškrtávací ikony).
- **Pohyb** – jemné, déle plynoucí najíždění karet, rozbalování rozvrhu
  s postupným odkrýváním řádků a plynulý přechod všech barev (~650 ms) při
  změně motivu: barvy jsou registrované CSS tokeny, takže plochy, text i
  akcent tónují společně. **Motion blur** je směrový – bluruje jen po ose
  scrollu, ne do stran. Vychází z AGSL modulu v
  [sameerasw/essentials](https://github.com/sameerasw/essentials) (MIT):
  rychlost se vzorkuje po snímcích, vyhlazuje poměrem 35/65, po zastavení
  odeznívá a na webu ji vykresluje SVG `feGaussianBlur` s vertikálním
  `stdDeviation`. Intenzita jde v nastavení měnit v rozsahu 0.5–2.5×.
  Filtr běží po jednotlivých kartách a nadpisech, ne na celém obsahu,
  a jen u karet blízko viewportu: velký filtr na scrollovaném wrapperu nutí
  prohlížeč překreslovat obří vrstvu a při rychlém scrollu se nový obsah
  objevuje se zpožděním. Menší vrstvy se rasterizují jen když jsou vidět,
  takže je efekt stejně plynulý a karty se načítají okamžitě.
  Na dotykových zařízeních je blur ve výchozím stavu vypnutý: mobilní WebKit
  nechává při rychlém flingu části filtrovaných vrstev nevykreslené (prázdná
  místa). Volba v nastavení tam zůstává, takže si ho jde zapnout i na mobilu
  (s nižším stropem intenzity). Hlavička má na mobilu neprůhledné pozadí
  místo `backdrop-filter`.
  Vše respektuje `prefers-reduced-motion`; motion blur jde vypnout.
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

Web běží na Vercelu a nasazuje se z tohoto repozitáře. Kořen repozitáře
obsahuje hotový statický build (`index.html`, `assets/`, `data.json`, …), takže
Vercel nemusí spouštět žádný build – stačí mu servírovat kořen.

Po úpravě zdrojů proto vždy:

```bash
npm run build
git add -A
git commit -m "Update build"
git push
```

Vercel po pushi nasadí novou verzi automaticky. Pro doménu `tomsix.xyz` nech
nastavené odpovídající DNS záznamy.

Volitelně může Vercel build spouštět sám (Framework Preset `Vite`, Build
Command `npm run build`, Output Directory `dist`) – obě cesty vedou ke stejnému
výsledku, protože `npm run build` plní i kořen repozitáře.

## Poznámky

- Neoficiální fanouškový projekt, není spojený s Formula 1, FIA ani týmy.
- Časy jsou převáděné do `Europe/Prague`; oficiální harmonogram je vždy
  dobré zkontrolovat.
- `data.json` i zabundovaný snapshot jsou z **23. 11. 2026** (po 21. závodě
  sezóny 2026). Slouží jen jako záloha pro první načtení; živá data mají
  přednost. Po aktualizaci snapshotu spusť `npm run sync:snapshot`.