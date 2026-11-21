# F1 race reminder

Kompletní kalendář formule 1 pro rok 2026 převedený do časového pásma
návštěvníka, s odpočtem do další session a rozbalovacím rozvrhem víkendu.
Rozhraní je pouze v angličtině.

## Otevření

Stačí otevřít `index.html` v prohlížeči nebo složku naservírovat libovolným
statickým serverem.

```
f1/
├─ index.html              – celá stránka
├─ css/style.css           – vzhled a oba motivy (tokeny v :root)
├─ js/app.js               – logika: časová pásma, odpočet, rozvrh
├─ js/zones.js             – mapa časových pásem na země (z IANA zone.tab)
├─ js/data.js              – snapshot sezóny 2026 pro okamžité vykreslení
├─ data/season-2026.json   – stejná data v čitelné podobě (reference)
├─ img/og.png              – náhled pro sociální sítě (1200×630)
├─ img/flags/*.svg         – vlajky okruhů
├─ tools/build-data.ps1    – obnovení dat z API
├─ robots.txt
└─ sitemap.xml
```

## Co stránka umí

- **Živý odpočet** do další session (nebo do konce právě běžící).
- **Automatická detekce časového pásma** + vyhledávací výběr země v hlavičce;
  volba se ukládá do `localStorage`. Seznam obsahuje jen názvy zemí (u zemí
  s více pásmy doplněné offsetem), nikoli města ani kontinenty.
- **Světlý a tmavý motiv** – posuvný přepínač v hlavičce, volba se pamatuje
  (výchozí stav podle systému).
- **Anglické rozhraní** – veškerý viditelný text je v angličtině.
- **Banner dalšího závodu** s živým odpočtem; kliknutím (nebo mezerníkem)
  se pod ním rozbalí celý rozvrh víkendu.
- **Přidání všech zbývajících závodů do Google Calendar** – tlačítko nad
  seznamem nadcházejících závodů stáhne jeden `.ics` soubor se všemi
  zbývajícími session (včetně upozornění 30 minut před startem) a otevře
  import v Google Calendar; soubor jde importovat i do Apple Calendar
  nebo Outlooku.
- **Kalendář 2026** hned pod bannerem ve dvou skupinách – *Upcoming races*
  nahoře, *Completed races* dole, v odstínech šedi (barevné zůstávají jen
  vlajky). Závod z banneru se v seznamu neduplikuje; kliknutím na ostatní
  závody se pod nimi rozbalí rozvrh (FP1–Race, včetně sprintových formátů).
- **Živá data z OpenF1** při načtení (cache 6 h), se snapshotem jako fallback.
- Bez frameworků, bez buildu, bez analytiky. Responzivní, respektuje
  `prefers-reduced-motion`.

## Úpravy

- **Texty** – řetězce v `js/app.js` (objekt `I18N.en`), markup v `index.html`.
- **Barvy, zaoblení, písmo** – `css/style.css`, blok `:root` (světlý motiv)
  a `html[data-theme="dark"]` (tmavý motiv).
- **Chování** – `js/app.js` (formátování času, seskupení závodů, rozbalování).
- **Data závodů** – ideálně přes skript, ne ručně:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\build-data.ps1
```

Skript stáhne termíny z [OpenF1](https://openf1.org) a metadat ze
[Jolpica F1](https://api.jolpi.ca), přepíše `js/data.js` i
`data/season-2026.json`. Snapshot v repozitáři je z **21. 11. 2026**.

## Nasazení

Je to čistě statický web — stačí nahrát obsah tohoto repozitáře na
Cloudflare Pages, Netlify, Vercel nebo GitHub Pages. Žádný build krok.
Pro vlastní doménu `tomsix.xyz` nastav odpovídající DNS záznamy u poskytovatele.

## Poznámky

- Neoficiální fanouškový projekt, není spojený s Formula 1, FIA ani týmy.
- Časy session pocházejí z OpenF1, závodní metadata z Jolpica. Vždy je dobré
  zkontrolovat oficiální harmonogram.
- Fonty: Inter + Plus Jakarta Sans (Google Fonts), s fallbackem na systémová
  písma.