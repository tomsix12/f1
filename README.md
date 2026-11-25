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
├─ details.json            – kopie public/details.json (generovaná)
├─ img/, robots.txt, sitemap.xml – kopie z public/ (generované)
├─ src/
│  ├─ index.html           – šablona stránky (zdroj pro build)
│  ├─ main.ts              – vstupní bod, boot, časovače a obnova dat
│  ├─ config.ts            – API_BASE, REFRESH_MS, SESSION_DEFS, TZ, klíče
│  ├─ types.ts             – typy sdílené datovou vrstvou a UI
│  ├─ styles/              – rozdělené CSS (tokeny, hlavička, kalendář…)
│  ├─ lib/                 – DOM, formátování, localStorage, téma, pohyb
│  ├─ theme/palette.ts     – ACCENTS, NEUTRALS, výchozí akcent
│  ├─ data/                – Jolpica, výsledky, statistiky, fotky, snapshot
│  ├─ app/                 – stav, načítání dat, vykreslení, tik
│  └─ ui/                  – hero, kalendář, výsledky, nastavení, navigace…
├─ public/
│  ├─ data.json            – záložní kalendář a bodování pro první načtení
│  ├─ details.json         – záložní výsledky, sprity a kvalifikace
│  ├─ img/og.png           – náhled pro sociální sítě (1200×630)
│  ├─ img/drivers/*.jpg    – portréty jezdců (480 px, mozjpeg)
│  ├─ robots.txt
│  └─ sitemap.xml
├─ scripts/
│  ├─ fetch-data.mjs       – stáhne kalendář a bodování do public/data.json
│  ├─ fetch-details.mjs    – stáhne výsledky do public/details.json
│  ├─ fetch-driver-photos.mjs – stáhne portréty do public/img/drivers
│  ├─ optimize-driver-photos.mjs – zmenší portréty na 480 px
│  ├─ publish-root.mjs     – kopíruje dist/ do kořene repa
│  └─ sync-snapshot.mjs    – drží snapshot v src/data v souladu s public/
├─ vite.config.ts
└─ tsconfig.json
```

`public/` se kopíruje do buildu, takže cesty v prohlížeči zůstávají
`/data.json`, `/details.json`, `/img/og.png` atd. Kořenové kopie (`index.html`,
`assets/`, `data.json`, `details.json`, `img/`) vznikají při `npm run build`
a neupravují se ručně.

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
- **Výsledky** – druhá záložka v hlavičce. Uvnitř je segmentovaný přepínač
  **Races · Drivers · Teams**.
  - **Races** – vyhledávací seznam Grand Prix (podle názvu, země i města)
    a k němu plakát víkendu s pódiem. Klasifikaci jde přepnout mezi
    **Race · Grid · Fastest · Quali** (sprintový sheet se přidá, když měl
    víkend sprint). Tabulka ukazuje pozici, portrét, tým, čas nebo stav
    odstoupení a body; nejrychlejší kolo má odznak FL.
  - **Drivers** – mřížka jezdců s portrétem, číslem vozu, týmem, body
    a podílovým pruhem v barvě týmu. Kliknutí otevře celou kartu jezdce:
    velký portrét, číslo, vlajka a národnost, tým, mřížka statistik
    (umístění a body v sezóně, závody, vítězství, pódia, pole positions,
    top 10, nejrychlejší kola, DNF, sprinty) a přehled výsledků závod
    od závodu. Hvězdička nastaví oblíbeného jezdce.
  - **Teams** – šampionát konstruktérů se stejným podílovým pruhem jako
    u jezdců, s počtem vítězství a jezdeckou sestavou.
  - Statistiky se počítají z plných klasifikací sezóny (`/current/results.json`,
    `/current/sprint.json`, `/current/qualifying.json`). Ty se stahují jednou
    za dokončené kolo a drží se v `localStorage` (`f1.results.cache.v1`).
    Když API selže, použije se `details.json`.
- **Nastavení v M3 Expressive stylu** – ozubené kolečko v hlavičce
  otevírá animovaný panel (pružinový nájezd, na mobilu pod
  celou hlavičkou). Nabízí segmentované volby tématu (System / Light / Dark),
  písma (Sans / Serif / Mono) a vypínač motion blur s posuvníkem
  intenzity (0.5–2.5×); dále osm akcentů a výběr oblíbeného jezdce a týmu. Oblíbený řádek se v bodování zvýrazní akcentovým
  rámečkem a hvězdičkou. Volby se ukládají do `localStorage`.
- **Časové pásmo** – závodní časy se zobrazují v pásmu zvoleném v nastavení.
  Výchozí je systémové pásmo prohlížeče; hledat jde podle hlavního města
  (i českého názvu, např. „Praha“ nebo „Tokio“), podle státu nebo podle
  názvu IANA pásma. Našeptávač ukazuje aktuální čas a offset daného města,
  tlačítko **System** se vrací k automatické volbě. Volba se ukládá jako
  `f1.timezone` a po změně se celá stránka překreslí.
- **Grafitový motiv s akcentem** – šedé a černé plochy, v light režimu bílé
  plochy s černým textem. Z osmi akcentů (Red, Blue, Green, Teal, Amber, Pink,
  Violet, Graphite) jde vybrat jeden; mění se jen primární barva, nikdy
  neutrální plochy. Světlý a tmavý režim se přepíná v nastavení (System /
  Light / Dark) a celá stránka mezi nimi plynule přejde – barvy jsou
  registrované CSS tokeny, takže se plochy, text i akcent prolínají současně
  (~900 ms, měkká decelerační křivka). Při prvním otevření je
  výchozí tmavý (černo-bílý) režim; systémová volba sleduje nastavení OS.
  Volba se ukládá do `localStorage` a do stránky se aplikuje inline skriptem
  v `<head>` ještě před vykreslením těla, takže neproblikne špatné téma
  ani písmo.
- **M3 Expressive navigace** – dvě záložky (Schedule, Results) s posuvným
  indikátorem aktivní položky; uvnitř výsledků druhý segmentovaný přepínač.
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
- **Mobil** – vycentrované nadpisy a banner. Hlavička drží jen ozubené
  kolečko (nastavení); data se obnovují samy každých 10 minut a při návratu
  na stránku, takže v hlavičce není žádné tlačítko pro ruční refresh.
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
- **Záložní snapshot** – `public/data.json` (kalendář, vítězové, bodování) a
  `public/details.json` (výsledky, sprity, kvalifikace) se načítají za běhu,
  když API selže. `src/data/snapshot.json` je stejný payload jako `data.json`
  zabundovaný do JS pro případ, že selže i tento fetch. Oba soubory drží
  v synchronizaci `npm run sync:snapshot`; oba zdrojové soubory obnoví
  `npm run sync:data` a `npm run sync:details`.

### Když API neodpovídá

Pořadí zdrojů je: paměť → `localStorage` → živé API → `data.json` /
`details.json` → zabundovaný snapshot. Při výpadku API zůstane na obrazovce
poslední známý stav a čtečky dostanou hlášení „Offline. Showing the last known
data.“.

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
- `data.json`, `details.json` i zabundovaný snapshot jsou z **25. 11. 2026**
  (po 21. závodě sezóny 2026). Slouží jen jako záloha pro první načtení; živá
  data mají přednost. Po aktualizaci snapshotu spusť `npm run sync:snapshot`.