/* ==========================================================================
   tomsix.xyz — F1 race reminder
   Vanilla JS. Data: bundled snapshot + optional live refresh from OpenF1.
   ========================================================================== */

(() => {
  "use strict";

  const TZ_KEY = "tomsix.f1.timezone";
  const THEME_KEY = "tomsix.f1.theme";
  const LANG_KEY = "tomsix.f1.lang";
  const LIVE_KEY = "tomsix.f1.live.v3";
  const LIVE_TTL = 6 * 60 * 60 * 1000;

  const FALLBACK_ZONES = [
    "Europe/Prague", "Europe/London", "Europe/Berlin", "Europe/Paris", "Europe/Madrid",
    "Europe/Rome", "Europe/Amsterdam", "Europe/Vienna", "Europe/Warsaw", "Europe/Budapest",
    "Europe/Bucharest", "Europe/Istanbul", "America/New_York", "America/Chicago",
    "America/Denver", "America/Los_Angeles", "America/Sao_Paulo", "America/Mexico_City",
    "Asia/Tokyo", "Asia/Shanghai", "Asia/Singapore", "Asia/Dubai", "Asia/Kolkata",
    "Australia/Sydney", "Australia/Melbourne", "Pacific/Auckland", "UTC"
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const store = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* private mode */ }
    }
  };

  /* ------------------------------------------------------------------------
     Translations
     ------------------------------------------------------------------------ */

  const OPENF1_LINK = '<a href="https://openf1.org" target="_blank" rel="noopener">OpenF1</a>';
  const JOLPICA_LINK = '<a href="https://api.jolpi.ca" target="_blank" rel="noopener">Jolpica</a>';

  const I18N = {
    cs: {
      "meta.title": "F1 připomínky · každá session ve tvém čase — tomsix.xyz",
      "meta.desc": "Kompletní kalendář formule 1 pro rok 2026 s časy tréninků, kvalifikací, sprintů a závodů ve tvém časovém pásmu. Připomínky do kalendáře na jeden klik.",
      "skip": "Přejít na obsah",
      "nav.next": "Další závod",
      "nav.calendar": "Kalendář",
      "nav.main": "Hlavní navigace",
      "settings.theme": "Motiv",
      "settings.light": "Světlý motiv",
      "settings.dark": "Tmavý motiv",
      "settings.language": "Jazyk",
      "settings.timezone": "Časové pásmo",
      "hero.eyebrow": "Sezóna {year}",
      "hero.title": "F1 <em>kalendář</em>",
      "hero.lead": "Tréninky, kvalifikace, sprinty i start závodu — převedené do tvého časového pásma, s připomínkou v kalendáři na jeden klik.",
      "loading": "Načítám rozvrh…",
      "next.live": "Právě teď",
      "next.up": "Další v pořadí",
      "next.over": "Sezóna je u konce",
      "next.overSub": "Ročník {year} máme za sebou. Uvidíme se příští rok.",
      "next.round": "Kolo {round} z {total}",
      "next.show": "Zobrazit všechny závody",
      "next.hide": "Skrýt seznam závodů",
      "next.calendar": "Přidat do kalendáře",
      "next.ends": "Session právě běží — končí v {time}.",
      "next.starts": "{session} začíná {date} v {time}.",
      "next.note": "Časy v {tz} ({abbr}) · přizpůsobené tvému pásmu",
      "countdown.d": "Dny",
      "countdown.h": "Hod",
      "countdown.m": "Min",
      "countdown.s": "Sek",
      "season.title": "Kalendář {year}",
      "season.sub": "Všechny session v tvém pásmu. Klikni na závod a rozbal celý rozvrh víkendu.",
      "group.upcoming": "Nadcházející závody",
      "group.past": "Proběhlé závody",
      "race.live": "Probíhá",
      "race.next": "Další",
      "race.sessions": "{n} session",
      "race.open": "Zobrazit rozvrh",
      "race.close": "Skrýt rozvrh",
      "sched.timezone": "Časy v {tz} ({abbr})",
      "sched.weekend": "Přidat celý víkend",
      "sched.add": "Přidat do kalendáře",
      "sched.next": "Další",
      "sched.live": "Živě",
      "sched.done": "Hotovo",
      "sess.practice": "Trénink {n}",
      "sess.sprintQualifying": "Sprintová kvalifikace",
      "sess.qualifying": "Kvalifikace",
      "sess.sprint": "Sprint",
      "sess.race": "Závod",
      "badge.sprint": "Sprint",
      "sync.live": "Živě · {time}",
      "sync.cached": "Z mezipaměti · {time}",
      "sync.snapshot": "Přibalená data · {date}",
      "sync.offline": "Offline data",
      "footer.note": `Neoficiální fanouškový projekt. Není spojený s Formula 1, FIA ani žádným týmem. Časy ze ${OPENF1_LINK}, data z ${JOLPICA_LINK}. Vždy zkontroluj oficiální harmonogram.`,
      "noscript": "Pro převod časů do tvého pásma je potřeba JavaScript.",
      "ics.round": "Kolo {round} z {total} · sezóna {year}",
      "ics.circuit": "Okruh: {place}",
      "ics.session": "Session: {date} {time} ({tz})",
      "ics.duration": "Délka: {duration}",
      "ics.schedule": "Rozvrh: https://tomsix.xyz",
      "data.error": "Rozvrh 2026 se nepodařilo načíst."
    },
    en: {
      "meta.title": "F1 reminders · every session in your time — tomsix.xyz",
      "meta.desc": "The full 2026 Formula 1 calendar with practice, qualifying, sprint and race times converted to your timezone. One-click calendar reminders for every session.",
      "skip": "Skip to content",
      "nav.next": "Next race",
      "nav.calendar": "Calendar",
      "nav.main": "Main navigation",
      "settings.theme": "Theme",
      "settings.light": "Light theme",
      "settings.dark": "Dark theme",
      "settings.language": "Language",
      "settings.timezone": "Timezone",
      "hero.eyebrow": "Season {year}",
      "hero.title": "F1 <em>calendar</em>",
      "hero.lead": "Practice, qualifying, sprints and lights out — converted to your timezone, with one-click calendar reminders.",
      "loading": "Loading the schedule…",
      "next.live": "Live now",
      "next.up": "Up next",
      "next.over": "Season complete",
      "next.overSub": "The {year} season is in the books. See you next year.",
      "next.round": "Round {round} of {total}",
      "next.show": "Show all races",
      "next.hide": "Hide race list",
      "next.calendar": "Add to calendar",
      "next.ends": "Session in progress — it ends at {time}.",
      "next.starts": "{session} starts {date} at {time}.",
      "next.note": "Times in {tz} ({abbr}) · matched to your timezone",
      "countdown.d": "Days",
      "countdown.h": "Hours",
      "countdown.m": "Mins",
      "countdown.s": "Secs",
      "season.title": "{year} calendar",
      "season.sub": "Every session in your zone. Click a race to unfold the full weekend schedule.",
      "group.upcoming": "Upcoming races",
      "group.past": "Completed races",
      "race.live": "Live",
      "race.next": "Next",
      "race.sessions": "{n} sessions",
      "race.open": "Show schedule",
      "race.close": "Hide schedule",
      "sched.timezone": "Times in {tz} ({abbr})",
      "sched.weekend": "Add whole weekend",
      "sched.add": "Add to calendar",
      "sched.next": "Next",
      "sched.live": "Live",
      "sched.done": "Done",
      "sess.practice": "Practice {n}",
      "sess.sprintQualifying": "Sprint qualifying",
      "sess.qualifying": "Qualifying",
      "sess.sprint": "Sprint",
      "sess.race": "Race",
      "badge.sprint": "Sprint",
      "sync.live": "Live · {time}",
      "sync.cached": "Cached · {time}",
      "sync.snapshot": "Bundled data · {date}",
      "sync.offline": "Offline data",
      "footer.note": `Unofficial fan project. Not affiliated with Formula 1, the FIA or any team. Times from ${OPENF1_LINK}, race data from ${JOLPICA_LINK}. Always double-check the official schedule.`,
      "noscript": "This page needs JavaScript to convert session times to your timezone.",
      "ics.round": "Round {round} of {total} · {year} F1 season",
      "ics.circuit": "Circuit: {place}",
      "ics.session": "Session: {date} {time} ({tz})",
      "ics.duration": "Duration: {duration}",
      "ics.schedule": "Schedule: https://tomsix.xyz",
      "data.error": "The 2026 schedule could not be loaded."
    }
  };

  const state = {
    lang: document.documentElement.lang === "en" ? "en" : "cs",
    theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    tz: validZone(store.get(TZ_KEY) || browserZone()),
    now: Date.now(),
    expanded: new Set(),
    calendarOpen: false
  };

  function t(key, vars) {
    const dict = I18N[state.lang] || I18N.cs;
    let text = dict[key] ?? I18N.cs[key] ?? key;
    if (vars) {
      for (const name of Object.keys(vars)) {
        text = text.split(`{${name}}`).join(String(vars[name]));
      }
    }
    return text;
  }

  const DATA = window.F1_SEASON;
  if (!DATA || !Array.isArray(DATA.meetings) || !DATA.meetings.length) {
    const banner = document.getElementById("next");
    if (banner) banner.innerHTML = `<div class="next__loading">${esc(t("data.error"))}</div>`;
    return;
  }

  /* ------------------------------------------------------------------------
     Time helpers
     ------------------------------------------------------------------------ */

  function browserZone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }

  function validZone(zone) {
    if (!zone) return "UTC";
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: zone });
      return zone;
    } catch {
      return "UTC";
    }
  }

  function locale() {
    return state.lang === "cs" ? "cs-CZ" : "en-GB";
  }

  /* ------------------------------------------------------------------------
     Data preparation
     ------------------------------------------------------------------------ */

  const season = {
    year: Number(DATA.season) || new Date().getFullYear(),
    generated: DATA.generated || null,
    meetings: []
  };

  const formatterCache = new Map();

  function prepareSession(raw, meeting, index) {
    const startDate = new Date(raw.start);
    const endDate = new Date(raw.end);
    return {
      id: `${meeting.round}-${index}`,
      name: raw.name,
      type: raw.type,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      startDate,
      endDate,
      meeting
    };
  }

  function prepareMeeting(raw) {
    const meeting = {
      round: Number(raw.round),
      name: raw.name,
      officialName: raw.officialName || "",
      circuit: raw.circuit || "",
      locality: raw.locality || "",
      country: raw.country || "",
      countryCode: raw.countryCode || "",
      sprint: Boolean(raw.sprint),
      sessions: []
    };
    meeting.sessions = (raw.sessions || [])
      .filter((session) => session && session.start && session.end)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .map((session, index) => prepareSession(session, meeting, index));
    meeting.startDate = meeting.sessions[0]?.startDate || new Date();
    meeting.endDate = meeting.sessions[meeting.sessions.length - 1]?.endDate || new Date();
    meeting.signature = meeting.sessions.map((s) => `${s.name}@${s.start}`).join("|");
    return meeting;
  }

  season.meetings = DATA.meetings
    .map(prepareMeeting)
    .filter((meeting) => meeting.sessions.length)
    .sort((a, b) => a.round - b.round);

  /* ------------------------------------------------------------------------
     Formatting
     ------------------------------------------------------------------------ */

  function fmt(date, options) {
    const key = `${state.tz}|${locale()}|${JSON.stringify(options)}`;
    let formatter = formatterCache.get(key);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat(locale(), { ...options, timeZone: state.tz });
      formatterCache.set(key, formatter);
    }
    return formatter.format(date);
  }

  function timeStr(date) {
    return fmt(date, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  }

  function dateStr(date) {
    return fmt(date, { weekday: "short", day: "numeric", month: "short" }).replace(/,/g, "");
  }

  function zoneAbbr(date = new Date()) {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: state.tz,
        timeZoneName: "short"
      }).formatToParts(date);
      return parts.find((part) => part.type === "timeZoneName")?.value || state.tz;
    } catch {
      return state.tz;
    }
  }

  function normalizePlace(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function placeStr(meeting) {
    const circuit = meeting.circuit || "";
    const locality = meeting.locality || "";
    const parts = [circuit];
    const c = normalizePlace(circuit);
    const l = normalizePlace(locality);
    if (locality && l !== c && !c.startsWith(l) && !l.startsWith(c)) {
      parts.push(locality);
    }
    if (meeting.country) parts.push(meeting.country);
    return parts.filter(Boolean).join(" · ");
  }

  function rangeStr(meeting, withYear = false) {
    const a = meeting.startDate;
    const b = meeting.endDate;
    const dayA = fmt(a, { day: "numeric" });
    const dayB = fmt(b, { day: "numeric" });
    const monthA = fmt(a, { month: "short" });
    const monthB = fmt(b, { month: "short" });
    let out = monthA === monthB
      ? `${dayA}–${dayB} ${monthB}`
      : `${dayA} ${monthA} – ${dayB} ${monthB}`;
    if (withYear) out += ` ${fmt(b, { year: "numeric" })}`;
    return out;
  }

  function durationStr(session) {
    const minutes = Math.max(1, Math.round((session.endDate - session.startDate) / 60000));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

  function sessionLabel(session) {
    const name = String(session.name || "");
    const practice = /practice\s*(\d+)/i.exec(name);
    if (practice) return t("sess.practice", { n: practice[1] });
    if (/sprint\s*(qualifying|shootout)/i.test(name)) return t("sess.sprintQualifying");
    if (/^sprint\s*$/i.test(name.trim())) return t("sess.sprint");
    if (/qualifying/i.test(name)) return t("sess.qualifying");
    if (/race/i.test(name)) return t("sess.race");
    if (/sprint/i.test(name)) return t("sess.sprint");
    return name;
  }

  /* ------------------------------------------------------------------------
     State helpers
     ------------------------------------------------------------------------ */

  function sessionState(session, now = state.now) {
    if (now >= +session.endDate) return "done";
    if (now >= +session.startDate) return "live";
    return "upcoming";
  }

  function getActiveSession(now = state.now) {
    let next = null;
    for (const meeting of season.meetings) {
      for (const session of meeting.sessions) {
        if (now >= +session.startDate && now < +session.endDate) return session;
        if (!next && +session.startDate > now) next = session;
      }
    }
    return next;
  }

  function getNextRace(now = state.now) {
    let next = null;
    for (const meeting of season.meetings) {
      const race = meeting.sessions.find((session) => /race/i.test(session.name) && !/sprint/i.test(session.name));
      if (!race) continue;
      if (+race.endDate > now) return race;
      next = race;
    }
    return next;
  }

  function snapshot(now = state.now) {
    const session = getActiveSession(now);
    if (!session) {
      return { key: "season-over", phase: "over", session: null, meeting: null, target: null };
    }
    const phase = now >= +session.startDate ? "live" : "next";
    const target = phase === "live" ? +session.endDate : +session.startDate;
    return { key: `${session.id}:${phase}`, phase, session, meeting: session.meeting, target };
  }

  function focusMeeting(now = state.now) {
    const snap = snapshot(now);
    if (snap.meeting) return snap.meeting;
    return getNextRace(now)?.meeting || season.meetings[season.meetings.length - 1];
  }

  function flagSrc(code) {
    if (!/^[a-z]{2}$/.test(String(code || "").toLowerCase())) return "";
    return `img/flags/${String(code).toLowerCase()}.svg`;
  }

  function flagImg(code) {
    const src = flagSrc(code);
    if (!src) return "";
    return `<img src="${src}" alt="" width="34" height="23" decoding="async">`;
  }

  /* ------------------------------------------------------------------------
     Rendering
     ------------------------------------------------------------------------ */

  let lastKey = "";
  let lastFetch = 0;
  let fetching = false;

  const syncState = {
    mode: "snapshot",
    at: season.generated ? new Date(season.generated) : new Date()
  };

  function renderSync() {
    const text = $("#sync-text");
    const status = $("#sync-status");
    if (!text || !status) return;

    if (syncState.mode === "live") text.textContent = t("sync.live", { time: timeStr(syncState.at) });
    else if (syncState.mode === "cached") text.textContent = t("sync.cached", { time: timeStr(syncState.at) });
    else if (syncState.mode === "offline") text.textContent = t("sync.offline");
    else text.textContent = t("sync.snapshot", { date: fmt(syncState.at, { day: "numeric", month: "short", year: "numeric" }) });

    status.classList.toggle("is-live", syncState.mode === "live" || syncState.mode === "cached");
  }

  function countdownMarkup(target) {
    const diff = Math.max(0, target - state.now);
    const seconds = Math.floor(diff / 1000);
    const values = {
      d: Math.floor(seconds / 86400),
      h: Math.floor((seconds % 86400) / 3600),
      m: Math.floor((seconds % 3600) / 60),
      s: seconds % 60
    };
    return Object.entries(values).map(([unit, value]) => `
      <div class="countdown__unit">
        <span class="countdown__value" data-unit="${unit}">${String(value).padStart(2, "0")}</span>
        <span class="countdown__label">${esc(t(`countdown.${unit}`))}</span>
      </div>`).join("");
  }

  function calendarButtonMarkup() {
    const label = state.calendarOpen ? t("next.hide") : t("next.show");
    return `<button class="btn btn--primary" type="button" data-action="toggle-calendar">
      ${esc(label)}
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"${state.calendarOpen ? ' transform="rotate(180 12 12)"' : ""}/></svg>
    </button>`;
  }

  function renderBanner() {
    const el = $("#next");
    if (!el) return;
    const snap = snapshot();
    const note = $("#hero-note");

    if (!snap.session) {
      const focus = focusMeeting();
      el.classList.add("next--over");
      el.innerHTML = `
        <span class="next__flag">${flagImg(focus?.countryCode)}</span>
        <div class="next__info">
          <div class="next__top">
            <span class="chip"><span class="chip__dot"></span>${esc(t("next.over"))}</span>
            <span class="next__round">${esc(t("next.round", { round: season.meetings.length, total: season.meetings.length }))}</span>
          </div>
          <div class="next__gp" id="next-title">${esc(focus?.name || "")}</div>
          <div class="next__session">${esc(t("next.overSub", { year: season.year }))}</div>
        </div>
        <div class="next__actions">${calendarButtonMarkup()}</div>`;
      if (note) note.textContent = "";
      return;
    }

    el.classList.remove("next--over");
    const meeting = snap.meeting;
    const session = snap.session;
    const live = snap.phase === "live";

    el.innerHTML = `
      <span class="next__flag">${flagImg(meeting.countryCode)}</span>
      <div class="next__info">
        <div class="next__top">
          <span class="chip${live ? " chip--live" : ""}"><span class="chip__dot"></span>${esc(live ? t("next.live") : t("next.up"))}</span>
          <span class="next__round">${esc(t("next.round", { round: meeting.round, total: season.meetings.length }))}</span>
          ${meeting.sprint ? `<span class="badge">${esc(t("badge.sprint"))}</span>` : ""}
        </div>
        <div class="next__gp" id="next-title">${esc(meeting.name)}</div>
        <div class="next__session">
          <strong>${esc(sessionLabel(session))}</strong>
          · ${esc(dateStr(session.startDate))}
          · ${esc(timeStr(session.startDate))}
          <span class="zone">${esc(zoneAbbr(session.startDate))}</span>
        </div>
      </div>

      <div class="countdown" id="countdown" role="timer" aria-label="${esc(live ? t("next.ends", { time: timeStr(session.endDate) }) : t("next.starts", { session: sessionLabel(session), date: dateStr(session.startDate), time: timeStr(session.startDate) }))}">
        ${countdownMarkup(snap.target)}
      </div>

      <div class="next__actions">
        ${calendarButtonMarkup()}
        <button class="icon-btn" type="button" data-action="ics-weekend" data-round="${meeting.round}" title="${esc(t("next.calendar"))}" aria-label="${esc(t("next.calendar"))}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M12 13v5M9.5 15.5h5"/></svg>
        </button>
      </div>`;

    if (note) {
      note.textContent = t("next.note", { tz: state.tz, abbr: zoneAbbr() });
    }
  }

  function scheduleMarkup(meeting) {
    const active = getActiveSession();
    const rows = meeting.sessions.map((session) => {
      const status = sessionState(session);
      const isActive = active && active.id === session.id;
      const rowClass = status === "live" ? "is-live" : status === "done" ? "is-done" : isActive ? "is-next" : "";
      const stateText = status === "live" ? t("sched.live") : status === "done" ? t("sched.done") : isActive ? t("sched.next") : "";
      const ics = status === "done"
        ? '<span class="icon-btn icon-btn--sm" aria-hidden="true"></span>'
        : `<button class="icon-btn icon-btn--sm" type="button" data-action="ics-session" data-round="${meeting.round}" data-session="${esc(session.id)}" title="${esc(t("sched.add"))}" aria-label="${esc(`${meeting.name} — ${sessionLabel(session)} · ${t("sched.add")}`)}">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M12 13v5M9.5 15.5h5"/></svg>
          </button>`;

      return `
        <li class="sched__row ${rowClass}">
          <span class="sched__dot" aria-hidden="true"></span>
          <span class="sched__main">
            <span class="sched__name">${esc(sessionLabel(session))}</span>
            <span class="sched__meta">
              <span>${esc(dateStr(session.startDate))}</span>
              <span class="dur-sep">·</span>
              <span class="dur">${esc(durationStr(session))}</span>
            </span>
          </span>
          <span class="sched__time">${esc(timeStr(session.startDate))}</span>
          <span class="sched__state">${esc(stateText)}</span>
          ${ics}
        </li>`;
    }).join("");

    return `
      <ul class="sched" aria-label="${esc(meeting.name)}">${rows}</ul>
      <div class="race__foot">
        <p>${esc(t("sched.timezone", { tz: state.tz, abbr: zoneAbbr(meeting.startDate) }))}</p>
        <button class="btn btn--quiet" type="button" data-action="ics-weekend" data-round="${meeting.round}">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M12 13v5M9.5 15.5h5"/></svg>
          ${esc(t("sched.weekend"))}
        </button>
      </div>`;
  }

  function raceMarkup(meeting, focus) {
    const open = state.expanded.has(meeting.round);
    const done = +meeting.endDate < state.now;
    const isFocus = focus === meeting;
    const live = meeting.sessions.some((session) => sessionState(session) === "live");
    const stateLabel = live ? t("race.live") : isFocus ? t("race.next") : "";
    const classes = ["race", open ? "is-open" : "", done ? "is-done" : "", isFocus ? "is-focus" : ""]
      .filter(Boolean)
      .join(" ");

    return `
      <li class="${classes}" data-round="${meeting.round}">
        <button class="race__head" type="button" data-action="toggle-round" data-round="${meeting.round}" aria-expanded="${open}" aria-controls="race-body-${meeting.round}" title="${esc(open ? t("race.close") : t("race.open"))}">
          <span class="race__round">${String(meeting.round).padStart(2, "0")}</span>
          <span class="race__flag">${flagImg(meeting.countryCode)}</span>
          <span class="race__main">
            <span class="race__name">
              ${esc(meeting.name)}
              ${meeting.sprint ? `<span class="badge">${esc(t("badge.sprint"))}</span>` : ""}
            </span>
            <span class="race__meta">
              <span>${esc(rangeStr(meeting))}</span>
              <span>·</span>
              <span class="place">${esc(placeStr(meeting))}</span>
              <span class="place">·</span>
              <span>${esc(t("race.sessions", { n: meeting.sessions.length }))}</span>
            </span>
          </span>
          <span class="race__state">${esc(stateLabel)}</span>
          <svg class="race__chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div class="race__body" id="race-body-${meeting.round}"${open ? "" : " hidden"}>
          ${scheduleMarkup(meeting)}
        </div>
      </li>`;
  }

  function renderCalendar() {
    const host = $("#race-groups");
    if (!host) return;

    const snap = snapshot();
    const focus = snap.session ? focusMeeting() : null;
    const upcoming = [];
    const past = [];

    for (const meeting of season.meetings) {
      if (+meeting.endDate >= state.now) upcoming.push(meeting);
      else past.push(meeting);
    }
    past.sort((a, b) => b.round - a.round);

    const group = (title, list) => {
      if (!list.length) return "";
      return `
        <section class="group">
          <div class="group__head">
            <h3 class="group__title">${esc(title)}</h3>
            <span class="group__count">${list.length}</span>
          </div>
          <ul class="race-list">${list.map((meeting) => raceMarkup(meeting, focus)).join("")}</ul>
        </section>`;
    };

    host.innerHTML = group(t("group.upcoming"), upcoming) + group(t("group.past"), past);
  }

  function updateCountdown(target) {
    const el = $("#countdown");
    if (!el || !target) return;
    const seconds = Math.max(0, Math.floor((target - Date.now()) / 1000));
    const values = {
      d: Math.floor(seconds / 86400),
      h: Math.floor((seconds % 86400) / 3600),
      m: Math.floor((seconds % 3600) / 60),
      s: seconds % 60
    };
    for (const [unit, value] of Object.entries(values)) {
      const node = el.querySelector(`[data-unit="${unit}"]`);
      if (node) node.textContent = String(value).padStart(2, "0");
    }
  }

  function renderFooter() {
    const tz = $("#footer-tz");
    if (tz) tz.textContent = `${state.tz} · ${zoneAbbr()}`;
  }

  function renderAll() {
    state.now = Date.now();
    renderBanner();
    renderCalendar();
    renderSync();
    renderFooter();
    lastKey = snapshot().key;
  }

  function tick() {
    state.now = Date.now();
    const snap = snapshot(state.now);
    if (snap.key !== lastKey) {
      renderAll();
      return;
    }
    updateCountdown(snap.target);
  }

  /* ------------------------------------------------------------------------
     Theme & language
     ------------------------------------------------------------------------ */

  function syncSettingsUi() {
    $$("[data-theme-set]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.themeSet === state.theme));
    });
    $$("[data-lang-set]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.langSet === state.lang));
    });
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", state.theme === "dark" ? "#0e0f11" : "#f7f8fa");
  }

  function applyStaticText() {
    document.documentElement.lang = state.lang;
    document.title = t("meta.title");
    $('meta[name="description"]')?.setAttribute("content", t("meta.desc"));

    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$("[data-i18n-title]").forEach((el) => { el.title = t(el.dataset.i18nTitle); });
    $$("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });

    const seasonLabel = $("#season-label");
    if (seasonLabel) seasonLabel.textContent = t("hero.eyebrow", { year: season.year });

    const seasonTitle = $("#season-title");
    if (seasonTitle) seasonTitle.textContent = t("season.title", { year: season.year });

    $("#tz-select")?.setAttribute("aria-label", t("settings.timezone"));
    $(".topnav")?.setAttribute("aria-label", t("nav.main"));
  }

  function setTheme(theme) {
    state.theme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = state.theme;
    store.set(THEME_KEY, state.theme);
    syncSettingsUi();
  }

  function setLang(lang) {
    state.lang = lang === "en" ? "en" : "cs";
    store.set(LANG_KEY, state.lang);
    formatterCache.clear();
    applyStaticText();
    syncSettingsUi();
    renderAll();
  }

  function setCalendarOpen(open) {
    state.calendarOpen = Boolean(open);
    const section = $("#calendar");
    if (!section) return;

    section.hidden = !state.calendarOpen;
    const banner = $("#next");
    if (banner) banner.setAttribute("aria-expanded", String(state.calendarOpen));

    if (state.calendarOpen) {
      if (!state.expanded.size) {
        const focus = focusMeeting();
        if (focus) state.expanded.add(focus.round);
      }
      renderCalendar();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden;
      section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }

    renderBanner();
  }

  /* ------------------------------------------------------------------------
     Live schedule refresh
     ------------------------------------------------------------------------ */

  function applyUpdates(updates) {
    let changed = false;

    for (const meeting of season.meetings) {
      const list = updates[meeting.round];
      if (!Array.isArray(list) || list.length < 4) continue;

      const normalized = list
        .filter((item) => item && item.start && item.end)
        .map((item) => ({
          name: String(item.name),
          type: String(item.type || ""),
          start: new Date(item.start).toISOString(),
          end: new Date(item.end).toISOString()
        }))
        .sort((a, b) => new Date(a.start) - new Date(b.start));

      if (normalized.length < 4) continue;

      const signature = normalized.map((item) => `${item.name}@${item.start}`).join("|");
      if (meeting.signature === signature) continue;

      meeting.sessions = normalized.map((item, index) => prepareSession(item, meeting, index));
      meeting.startDate = meeting.sessions[0].startDate;
      meeting.endDate = meeting.sessions[meeting.sessions.length - 1].endDate;
      meeting.signature = signature;
      changed = true;
    }

    if (changed) renderAll();
    return changed;
  }

  async function fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchLiveUpdates() {
    const [sessions, meetings] = await Promise.all([
      fetchJson(`https://api.openf1.org/v1/sessions?year=${season.year}`),
      fetchJson(`https://api.openf1.org/v1/meetings?year=${season.year}`)
    ]);

    if (!Array.isArray(sessions) || !Array.isArray(meetings)) return null;

    const groups = new Map();
    for (const session of sessions) {
      if (!session || !session.date_start || !session.date_end || !session.meeting_key) continue;
      if (session.is_cancelled) continue;
      if (!groups.has(session.meeting_key)) groups.set(session.meeting_key, []);
      groups.get(session.meeting_key).push(session);
    }

    const updates = {};
    let matched = 0;

    for (const meeting of season.meetings) {
      const race = meeting.sessions.find((session) => session.name === "Race");
      if (!race) continue;
      const raceDate = race.startDate.toISOString().slice(0, 10);
      const match = sessions.find((session) =>
        session &&
        session.session_type === "Race" &&
        session.session_name === "Race" &&
        String(session.date_start).slice(0, 10) === raceDate
      );
      if (!match) continue;

      const list = groups.get(match.meeting_key);
      if (!list || list.length < 4) continue;

      updates[meeting.round] = list.map((item) => ({
        name: item.session_name,
        type: item.session_type,
        start: new Date(item.date_start).toISOString(),
        end: new Date(item.date_end).toISOString()
      }));
      matched += 1;
    }

    return matched >= Math.floor(season.meetings.length * 0.5) ? updates : null;
  }

  function readCache() {
    try {
      const raw = JSON.parse(store.get(LIVE_KEY) || "null");
      if (!raw || typeof raw.savedAt !== "number" || !raw.updates) return null;
      return raw;
    } catch {
      return null;
    }
  }

  async function refreshLive() {
    if (fetching) return;
    fetching = true;

    const cached = readCache();
    if (cached) {
      applyUpdates(cached.updates);
      if (Date.now() - cached.savedAt < LIVE_TTL) {
        syncState.mode = "cached";
        syncState.at = new Date(cached.savedAt);
        renderSync();
        fetching = false;
        return;
      }
    }

    try {
      const updates = await fetchLiveUpdates();
      if (!updates) throw new Error("No matching sessions");
      applyUpdates(updates);
      const payload = { savedAt: Date.now(), updates };
      store.set(LIVE_KEY, JSON.stringify(payload));
      lastFetch = Date.now();
      syncState.mode = "live";
      syncState.at = new Date();
      renderSync();
    } catch {
      syncState.mode = "offline";
      renderSync();
    } finally {
      fetching = false;
    }
  }

  /* ------------------------------------------------------------------------
     Calendar exports (.ics)
     ------------------------------------------------------------------------ */

  function icsStamp(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function icsText(value) {
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  function foldLine(line) {
    if (line.length <= 74) return line;
    let rest = line;
    const chunks = [];
    while (rest.length > 74) {
      chunks.push(rest.slice(0, 74));
      rest = ` ${rest.slice(74)}`;
    }
    chunks.push(rest);
    return chunks.join("\r\n");
  }

  function slug(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function makeEvent(meeting, session) {
    const label = sessionLabel(session);
    const title = `F1 · ${meeting.name} — ${label}`;
    const description = [
      `${label} · ${meeting.name}`,
      t("ics.round", { round: meeting.round, total: season.meetings.length, year: season.year }),
      t("ics.circuit", { place: placeStr(meeting) }),
      t("ics.session", { date: dateStr(session.startDate), time: timeStr(session.startDate), tz: state.tz }),
      t("ics.duration", { duration: durationStr(session) }),
      t("ics.schedule")
    ].join("\n");

    return {
      uid: `f1-${season.year}-r${meeting.round}-${slug(session.name)}-${icsStamp(session.startDate)}@tomsix.xyz`,
      start: session.startDate,
      end: session.endDate,
      title,
      description,
      location: placeStr(meeting)
    };
  }

  function downloadIcs(events, filename) {
    if (!events.length) return;
    const stamp = icsStamp(new Date());
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//tomsix.xyz//F1 Reminder//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${icsText(`F1 ${season.year} · tomsix.xyz`)}`
    ];

    for (const event of events) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${event.uid}`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${icsStamp(event.start)}`,
        `DTEND:${icsStamp(event.end)}`,
        `SUMMARY:${icsText(event.title)}`,
        `DESCRIPTION:${icsText(event.description)}`,
        `LOCATION:${icsText(event.location)}`,
        "BEGIN:VALARM",
        "TRIGGER:-PT30M",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsText(event.title)}`,
        "END:VALARM",
        "END:VEVENT"
      );
    }

    lines.push("END:VCALENDAR");

    const blob = new Blob([`${lines.map(foldLine).join("\r\n")}\r\n`], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function eventsForMeeting(meeting, includePast = false) {
    const sessions = includePast
      ? meeting.sessions
      : meeting.sessions.filter((session) => +session.endDate > state.now);
    const list = sessions.length ? sessions : meeting.sessions;
    return list.map((session) => makeEvent(meeting, session));
  }

  function downloadWeekend(round) {
    const meeting = season.meetings.find((item) => item.round === round);
    if (!meeting) return;
    downloadIcs(
      eventsForMeeting(meeting),
      `f1-${season.year}-r${String(meeting.round).padStart(2, "0")}-${slug(meeting.name)}.ics`
    );
  }

  function downloadSession(round, sessionId) {
    const meeting = season.meetings.find((item) => item.round === round);
    const session = meeting?.sessions.find((item) => item.id === sessionId);
    if (!meeting || !session) return;
    downloadIcs(
      [makeEvent(meeting, session)],
      `f1-${season.year}-r${String(meeting.round).padStart(2, "0")}-${slug(session.name)}.ics`
    );
  }

  /* ------------------------------------------------------------------------
     Interactions
     ------------------------------------------------------------------------ */

  function toggleRound(button) {
    const round = Number(button.dataset.round);
    const card = button.closest(".race");
    const body = document.getElementById(`race-body-${round}`);
    if (!card || !body) return;

    const open = state.expanded.has(round);
    if (open) state.expanded.delete(round);
    else state.expanded.add(round);

    button.setAttribute("aria-expanded", String(!open));
    button.title = open ? t("race.open") : t("race.close");
    body.hidden = open;
    card.classList.toggle("is-open", !open);
  }

  function handleAction(button) {
    const action = button.dataset.action;
    if (action === "toggle-calendar") {
      setCalendarOpen(!state.calendarOpen);
    } else if (action === "toggle-round") {
      toggleRound(button);
    } else if (action === "ics-weekend") {
      const fallback = focusMeeting();
      const round = Number(button.dataset.round || fallback?.round);
      if (round) downloadWeekend(round);
    } else if (action === "ics-session") {
      const round = Number(button.dataset.round);
      const sessionId = button.dataset.session;
      if (round && sessionId) downloadSession(round, sessionId);
    }
  }

  function initTimezones() {
    const select = $("#tz-select");
    if (!select) return;

    let zones = [];
    try {
      if (typeof Intl.supportedValuesOf === "function") {
        zones = Intl.supportedValuesOf("timeZone");
      }
    } catch { /* ignore */ }
    if (!Array.isArray(zones) || !zones.length) zones = FALLBACK_ZONES.slice();
    if (!zones.includes(state.tz)) zones = [state.tz, ...zones];

    select.innerHTML = zones
      .map((zone) => `<option value="${esc(zone)}"${zone === state.tz ? " selected" : ""}>${esc(zone)}</option>`)
      .join("");

    select.addEventListener("change", () => {
      state.tz = validZone(select.value);
      store.set(TZ_KEY, state.tz);
      formatterCache.clear();
      renderAll();
    });
  }

  function init() {
    applyStaticText();
    syncSettingsUi();
    initTimezones();
    renderAll();

    document.addEventListener("click", (event) => {
      const settingsButton = event.target.closest("[data-theme-set], [data-lang-set]");
      if (settingsButton) {
        if (settingsButton.dataset.themeSet) setTheme(settingsButton.dataset.themeSet);
        if (settingsButton.dataset.langSet) setLang(settingsButton.dataset.langSet);
        return;
      }

      const actionButton = event.target.closest("[data-action]");
      if (actionButton) {
        handleAction(actionButton);
        return;
      }

      const calendarLink = event.target.closest('a[href="#calendar"]');
      if (calendarLink) {
        event.preventDefault();
        setCalendarOpen(true);
        return;
      }

      const banner = event.target.closest("#next");
      if (banner && !event.target.closest("button, a, select")) {
        setCalendarOpen(!state.calendarOpen);
      }
    });

    setInterval(tick, 1000);
    tick();

    if (location.hash === "#calendar") {
      setCalendarOpen(true);
    }

    refreshLive();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - lastFetch > LIVE_TTL) {
      refreshLive();
    }
  });

  init();
})();