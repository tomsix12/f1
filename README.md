 F1 race reminder

 kompletní kalendář formule 1 pro rok 2026 převedený do
časového pásma návštěvníka, s odpočtem do další session a stahováním `.ics`
událostí do kalendar
## Otevření


```
tomsix-web/
├─ index.html              – celá stránka
├─ css/style.css           – vzhled (barvy v :root nahoře)
├─ js/app.js               – logika: časová pásma, odpočet, filtry, .ics export
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
- **Automatická detekce časového pásma** + přepínač v hlavičce; volba se
  ukládá do `localStorage`.
- **Celý kalendář 2026** rozdělený po měsících, s filtry *All / Upcoming /
  Sprints* a rozbalovacími víkendy (FP1–Race, včetně sprintových formátů).
- **Stahování `.ics`** pro jednu session, celý víkend nebo další závod;
  každá událost má 30minutovou připomínku.
- **Živá data z OpenF1** při načtení (cache 6 h), se snapshotem jako fallback.
- Bez frameworků, bez buildu, bez analytiky. Responzivní, respektuje
  `prefers-reduced-motion`.

## Úpravy

- **Texty** – přímo v `index.html`.
- **Barvy, zaoblení, písmo** – `css/style.css`, blok `:root`.
- **Odhady a chování** – `js/app.js` (formátování času, `.ics`, filtry).
- **Data závodů** – ideálně přes skript, ne ručně:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\build-data.ps1
```

Skript stáhne termíny z [OpenF1](https://openf1.org) a metadat ze
[Jolpica F1](https://api.jolpi.ca), přepíše `js/data.js` i
`data/season-2026.json`. Snapshot v repozitáři je z **21. 11. 2026**.

## Nasazení (až budeš chtít)

Je to čistě statický web — stačí nahrát obsah složky `tomsix-web/` na
Cloudflare Pages, Netlify, Vercel nebo GitHub Pages. Žádný build krok.
Pro vlastní doménu `tomsix.xyz` nastav odpovídající DNS záznamy u poskytovatele.

## Poznámky

- Neoficiální fanouškový projekt, není spojený s Formula 1, FIA ani týmy.
- Časy session pocházejí z OpenF1, závodní metadata z Jolpica. Vždy je dobré
  zkontrolovat oficiální harmonogram.
- Fonty: Barlow Condensed + Inter (Google Fonts), s fallbackem na systémová
  písma.
