# F1 dashboard

Jednosouborový přehled formule 1 – kalendář závodů, vítězové, bodování jezdců
a konstruktérů, odpočet do dalšího závodu a devět barevných motivů ve stylu
Google Material 3 Expressive. Veškerá data se tahají živě z
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
  animací měnících se číslic. Závod se počítá jako dokončený, jakmile má
  výsledky; do té doby karta ukazuje „Not raced yet“ a odpočet.
- **Kalendář po víkendech** – přepínač týdnů a karty závodů s názvem GP,
  okruhem, datem a časem. U dokončených závodů je vítěz, tým a čas / stav.
- **Bodování** – konstruktéři a jezdci seřazení podle bodů, s medailovými
  kruhy pro první tři, pruhem v barvě týmu a podílovým barevným přechodem.
- **Devět motivů** – Intense, Tonal spot, Content, Fidelity, Vibrant,
  Expressive, Fruit salad, Rainbow a Neutral, každý ve světlé i tmavé
  variantě. Volba se pamatuje, přepnutí barev je plynulé.
- **Pohyb** – jemné najíždění karet, přechod mezi týdny, rozostření obsahu
  podle rychlosti scrollování. Vše respektuje `prefers-reduced-motion`.
- Bez frameworků, bez buildu, bez externích fontů a analytiky.

## Úpravy

Vše důležité je v komentáři na začátku `index.html` a v hlavním `<script>`
(uprostřed souboru):

- **API** – konstanta `API_BASE` (výchozí `https://api.jolpi.ca/ergast/f1`).
- **Interval obnovy** – `REFRESH_MS` (výchozích 10 minut).
- **Barvy týmů** – `TEAM_COLORS` s variantami `dark` a `light` pro každý
  `constructorId`. Neznámý tým dostane neutrální šedou a upozornění v konzoli.
- **Názvy týmů** – `TEAM_NAMES` přepisuje názvy z API (např. „RB F1 Team“ →
  „Racing Bulls“).
- **Motivy** – objekt `THEMES` v samostatném `<script>` v hlavičce; každý motiv
  má paletu `light` a `dark`.
- **Záložní snapshot** – konstanta `F1_BOOTSTRAP` (hledej `window.F1_BOOTSTRAP`),
  používaná jen když API i `data.json` selžou (např. při otevření přes `file://`).

### Když API neodpovídá

Pořadí zdrojů je: paměť → `localStorage` → `data.json` → inline snapshot.
Při výpadku API zůstane na obrazovce poslední známý stav a v hlavičce se
zobrazí „Offline · …“ s časem poslední aktualizace.

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