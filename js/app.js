/* ==========================================================================
   tomsix.xyz — F1 race reminder
   Vanilla JS. Data: bundled snapshot + optional live refresh from OpenF1.
   ========================================================================== */

(() => {
  "use strict";

  const DATA = window.F1_SEASON;
  if (!DATA || !Array.isArray(DATA.meetings) || !DATA.meetings.length) {
    const card = document.getElementById("next-card");
    if (card) card.textContent = "The 2026 schedule could not be loaded.";
    return;
  }

  const TZ_KEY = "tomsix.f1.timezone";
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

  const season = {
    year: Number(DATA.season) || new Date().getFullYear(),
    generated: DATA.generated || null,
    meetings: []
  };

  const state = {
    tz: validZone(store.get(TZ_KEY) || browserZone()),
    filter: "all",
    expanded: new Set(),
    now: Date.now()
  };

  let lastKey = "";
  let lastFetch = 0;
  let fetching = false;
  const formatterCache = new Map();

  /* ------------------------------------------------------------------------
     Data preparation
     ------------------------------------------------------------------------ */

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

  const totalSessions = season.meetings.reduce((sum, meeting) => sum + meeting.sessions.length, 0);

  /* ------------------------------------------------------------------------
     Time helpers
     ------------------------------------------------------------------------ */

  function fmt(date, options) {
    const key = `${state.tz}|${JSON.stringify(options)}`;
    let formatter = formatterCache.get(key);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat("en-GB", { ...options, timeZone: state.tz });
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

  function monthYear(date) {
    return fmt(date, { month: "long", year: "numeric" });
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
    const yearB = fmt(b, { year: "numeric" });
    let out;

    if (monthA === monthB) {
      out = `${dayA}–${dayB} ${monthB}`;
    } else {
      out = `${dayA} ${monthA} – ${dayB} ${monthB}`;
    }
    return withYear ? `${out} ${yearB}` : out;
  }

  function durationStr(session) {
    const minutes = Math.max(1, Math.round((session.endDate - session.startDate) / 60000));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

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
      for (const session of meeting.sessions) {
        if (session.name === "Race" && +session.endDate > now) return session;
        if (session.name === "Race") next = session;
      }
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

  function flagImg(code, className = "flag-img") {
    const src = flagSrc(code);
    if (!src) return "";
    return `<img class="${className}" src="${src}" alt="" width="34" height="23" decoding="async">`;
  }

  /* ------------------------------------------------------------------------
     Rendering
     ------------------------------------------------------------------------ */

  function renderStats() {
    $("#stat-races").textContent = String(season.meetings.length);
    $("#stat-sprints").textContent = String(season.meetings.filter((m) => m.sprint).length);
    $("#stat-sessions").textContent = String(totalSessions);
    const tz = $("#stat-tz");
    tz.textContent = state.tz;
    tz.title = state.tz;
    $("#hero-eyebrow").textContent = `${season.year} Formula 1 season`;
  }

  function countdownMarkup(target) {
    const diff = Math.max(0, target - state.now);
    const seconds = Math.floor(diff / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (value) => String(value).padStart(2, "0");
    const units = [
      ["d", days, "Days"],
      ["h", hours, "Hours"],
      ["m", minutes, "Mins"],
      ["s", secs, "Secs"]
    ];
    return units.map(([unit, value, label]) => `
      <div class="countdown__unit">
        <span class="countdown__value" data-unit="${unit}">${pad(value)}</span>
        <span class="countdown__label">${label}</span>
      </div>`).join("");
  }

  function renderHero() {
    const card = $("#next-card");
    const snap = snapshot();
    renderStats();

    if (!snap.session) {
      card.innerHTML = `
        <div class="next-card__head">
          <span class="pill"><span class="pill__dot"></span>Season complete</span>
          <span class="next-card__round">${season.year} · ${season.meetings.length} rounds</span>
        </div>
        <div class="next-card__race">
          <span class="next-card__flag next-card__flag--plain" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 21V4m0 0h11l-1.8 4L16 12H5"/></svg>
          </span>
          <div>
            <h2 class="next-card__gp">That's a wrap</h2>
            <p class="next-card__circuit">The ${season.year} season is in the books. See you next year.</p>
          </div>
        </div>
        <div class="next-card__foot">
          <span class="next-card__tz"><strong>${esc(state.tz)}</strong>${esc(zoneAbbr())}</span>
          <a class="btn btn--primary btn--sm" href="#calendar">Browse calendar</a>
        </div>`;
      const heroIcs = $("#hero-ics");
      heroIcs.disabled = true;
      heroIcs.dataset.round = "";
      return;
    }

    const meeting = snap.meeting;
    const session = snap.session;
    const live = snap.phase === "live";
    const nextRace = getNextRace();
    const heroTarget = nextRace ? nextRace.meeting : meeting;

    card.innerHTML = `
      <div class="next-card__head">
        <span class="pill${live ? " pill--live" : ""}">
          <span class="pill__dot" aria-hidden="true"></span>${live ? "Live now" : "Up next"}
        </span>
        <span class="next-card__round">Round ${meeting.round} of ${season.meetings.length}</span>
      </div>

      <div class="next-card__race">
        <span class="next-card__flag">${flagImg(meeting.countryCode, "flag-img flag-img--lg")}</span>
        <div>
          <h2 class="next-card__gp">${esc(meeting.name)}</h2>
          <p class="next-card__circuit">${esc(placeStr(meeting))}</p>
        </div>
      </div>

      <div class="next-card__session">
        <span class="next-card__session-name">${esc(session.name)}</span>
        <span class="next-card__session-time">${dateStr(session.startDate)} · ${timeStr(session.startDate)} ${esc(zoneAbbr(session.startDate))}</span>
      </div>

      <div class="countdown" id="countdown" role="timer" aria-label="${live ? "Time until the session ends" : "Time until the session starts"}">
        ${countdownMarkup(snap.target)}
      </div>

      <p class="next-card__hint">
        ${live
          ? `Session in progress — it ends at ${timeStr(session.endDate)}.`
          : `${esc(session.name)} starts ${dateStr(session.startDate)} at ${timeStr(session.startDate)}.`}
      </p>

      <div class="next-card__foot">
        <span class="next-card__tz">
          <strong>${esc(state.tz)}</strong>
          ${esc(zoneAbbr())} · all times local
        </span>
        <button class="btn btn--primary btn--sm" type="button" data-action="ics-weekend" data-round="${heroTarget.round}">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M12 13v5M9.5 15.5h5"/></svg>
          Add to calendar
        </button>
      </div>`;

    const heroIcs = $("#hero-ics");
    heroIcs.disabled = false;
    heroIcs.dataset.round = String(heroTarget.round);
  }

  function stateChip(sessionStateValue, isActive) {
    if (sessionStateValue === "live") return '<span class="state state--live">Live</span>';
    if (sessionStateValue === "done") return '<span class="state state--done">Done</span>';
    if (isActive) return '<span class="state state--next">Next</span>';
    return "";
  }

  function sprintBadge(session) {
    if (!/sprint/i.test(session.name)) return "";
    return '<span class="badge badge--sprint">Sprint</span>';
  }

  function sessionRow(session, active) {
    const status = sessionState(session);
    const isActive = active && active.id === session.id;
    const live = status === "live";
    const rowClass = live ? "session--live" : isActive ? "session--next" : status === "done" ? "session--done" : "";
    const chip = stateChip(status, isActive);
    const ics = status === "done"
      ? '<span class="icon-btn icon-btn--ghost" aria-hidden="true"></span>'
      : `<button class="icon-btn" type="button" data-action="ics-session" data-round="${session.meeting.round}" data-session="${esc(session.id)}" title="Add ${esc(session.name)} to calendar" aria-label="Add ${esc(session.meeting.name)} ${esc(session.name)} to calendar">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M12 13v5M9.5 15.5h5"/></svg>
        </button>`;

    return `
      <li class="session ${rowClass}">
        <span class="session__dot" aria-hidden="true"></span>
        <div class="session__main">
          <span class="session__name">${esc(session.name)}${sprintBadge(session)}</span>
          <span class="session__meta">
            <span>${dateStr(session.startDate)}</span>
            <span class="dot-sep">·</span>
            <span>${durationStr(session)}</span>
            ${chip}
          </span>
        </div>
        <span class="session__time">${timeStr(session.startDate)}</span>
        ${ics}
      </li>`;
  }

  function weekendKicker(meeting) {
    if (meeting.sessions.some((session) => sessionState(session) === "live")) return "Live this weekend";
    if (state.now < +meeting.startDate) return "Next race weekend";
    if (state.now <= +meeting.endDate) return "This race weekend";
    return "Latest race weekend";
  }

  function renderWeekend() {
    const meeting = focusMeeting();
    if (!meeting) return;
    const active = getActiveSession();

    $("#weekend-kicker").textContent = weekendKicker(meeting);
    $("#weekend-title").textContent = meeting.name;
    $("#weekend-meta").textContent = placeStr(meeting);
    $("#weekend-dates").innerHTML = `${rangeStr(meeting, true)}<span class="weekend-panel__count"> · ${meeting.sessions.length} sessions</span>`;
    $("#weekend-sessions").innerHTML = meeting.sessions.map((session) => sessionRow(session, active)).join("");
    $("#weekend-foot").textContent = [
      `All times in ${state.tz} (${zoneAbbr()})`,
      `Round ${meeting.round} of ${season.meetings.length}`,
      meeting.sprint ? "Sprint weekend" : null
    ].filter(Boolean).join(" · ");

    const button = $("#weekend-ics");
    button.disabled = false;
    button.dataset.round = String(meeting.round);
  }

  function roundBadges(meeting, isFocus) {
    const badges = [];
    if (meeting.sprint) badges.push('<span class="badge badge--sprint">Sprint</span>');
    if (isFocus) {
      const live = meeting.sessions.some((session) => sessionState(session) === "live");
      badges.push(`<span class="badge badge--next">${live ? "Live" : "Up next"}</span>`);
    }
    return badges.join(" ");
  }

  function roundMarkup(meeting, isFocus) {
    const open = state.expanded.has(meeting.round);
    const done = state.now > +meeting.endDate;
    const active = getActiveSession();
    const classes = [
      "round-card",
      isFocus ? "is-next" : "",
      done ? "is-done" : "",
      open ? "is-open" : ""
    ].filter(Boolean).join(" ");
    const meta = [
      `<span>${rangeStr(meeting)}</span>`,
      `<span class="dot-sep">·</span>`,
      `<span>${esc(placeStr(meeting))}</span>`
    ].join("");

    return `
      <article class="${classes}" data-round="${meeting.round}">
        <button class="round-card__head" type="button" data-action="toggle-round" data-round="${meeting.round}" aria-expanded="${open}" aria-controls="round-body-${meeting.round}">
          <span class="round-card__index">${String(meeting.round).padStart(2, "0")}</span>
          <span class="round-card__flag">${flagImg(meeting.countryCode, "flag-img flag-img--sm")}</span>
          <span class="round-card__main">
            <span class="round-card__name">${esc(meeting.name)} ${roundBadges(meeting, isFocus)}</span>
            <span class="round-card__meta">${meta}</span>
          </span>
          <svg class="round-card__chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div class="round-card__body" id="round-body-${meeting.round}"${open ? "" : " hidden"}>
          <ul class="session-list" aria-label="${esc(meeting.name)} sessions">
            ${meeting.sessions.map((session) => sessionRow(session, active)).join("")}
          </ul>
          <div class="round-card__actions">
            <p>Times in ${esc(state.tz)} (${esc(zoneAbbr(meeting.startDate))})</p>
            <button class="btn btn--ghost btn--xs" type="button" data-action="ics-weekend" data-round="${meeting.round}">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M12 13v5M9.5 15.5h5"/></svg>
              Add weekend
            </button>
          </div>
        </div>
      </article>`;
  }

  function matchesFilter(meeting) {
    if (state.filter === "upcoming") return +meeting.endDate >= state.now;
    if (state.filter === "sprint") return meeting.sprint;
    return true;
  }

  function renderCalendar() {
    const focus = focusMeeting();
    const snap = snapshot();
    const isSeasonOver = !snap.session;
    const filtered = season.meetings.filter(matchesFilter);

    const groups = new Map();
    for (const meeting of filtered) {
      const key = monthYear(meeting.startDate);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(meeting);
    }

    let html = "";
    for (const [month, meetings] of groups) {
      html += `<div class="month">
        <div class="month__head"><h3>${esc(month)}</h3><span>${meetings.length} ${meetings.length === 1 ? "round" : "rounds"}</span></div>
        ${meetings.map((meeting) => roundMarkup(meeting, !isSeasonOver && meeting === focus)).join("")}
      </div>`;
    }

    $("#calendar-list").innerHTML = html;
    $("#calendar-empty").hidden = filtered.length > 0;

    const upcoming = season.meetings.filter((meeting) => +meeting.endDate >= state.now).length;
    const sprints = season.meetings.filter((meeting) => meeting.sprint).length;
    $("#count-all").textContent = String(season.meetings.length);
    $("#count-upcoming").textContent = String(upcoming);
    $("#count-sprint").textContent = String(sprints);
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

  function updateClock() {
    const time = $("#clock-time");
    const zone = $("#clock-zone");
    const key = `clock|${state.tz}`;
    let formatter = formatterCache.get(key);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
        timeZone: state.tz
      });
      formatterCache.set(key, formatter);
    }
    time.textContent = formatter.format(new Date());
    zone.textContent = zoneAbbr();
  }

  function renderFooter() {
    const year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());
    const tz = $("#footer-tz");
    if (tz) tz.textContent = `${state.tz} · ${zoneAbbr()}`;
  }

  function renderAll() {
    state.now = Date.now();
    renderHero();
    renderWeekend();
    renderCalendar();
    updateClock();
    renderFooter();
    lastKey = snapshot().key;
  }

  function tick() {
    state.now = Date.now();
    updateClock();
    const snap = snapshot(state.now);
    if (snap.key !== lastKey) {
      renderAll();
      return;
    }
    updateCountdown(snap.target);
  }

  /* ------------------------------------------------------------------------
     Live schedule refresh
     ------------------------------------------------------------------------ */

  function setSync(text, live) {
    const textNode = $("#sync-text");
    const status = $("#sync-status");
    if (textNode) textNode.textContent = text;
    if (status) status.classList.toggle("is-live", Boolean(live));
  }

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
        const when = new Date(cached.savedAt);
        setSync(`Cached · ${timeStr(when)}`, true);
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
      setSync(`Live · ${timeStr(new Date())}`, true);
    } catch {
      setSync("Offline snapshot", false);
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
    const title = `F1 · ${meeting.name} — ${session.name}`;
    const description = [
      `${session.name} · ${meeting.name}`,
      `Round ${meeting.round} of ${season.meetings.length} · ${season.year} F1 season`,
      `Circuit: ${placeStr(meeting)}`,
      `Session: ${dateStr(session.startDate)} ${timeStr(session.startDate)} (${state.tz})`,
      `Duration: ${durationStr(session)}`,
      "Schedule: https://tomsix.xyz"
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
    const card = button.closest(".round-card");
    const body = document.getElementById(`round-body-${round}`);
    if (!card || !body) return;
    const open = state.expanded.has(round);
    if (open) state.expanded.delete(round);
    else state.expanded.add(round);
    button.setAttribute("aria-expanded", String(!open));
    body.hidden = open;
    card.classList.toggle("is-open", !open);
  }

  function jumpToNext() {
    const meeting = focusMeeting();
    if (!meeting) return;
    state.filter = "all";
    updateFilterButtons();
    state.expanded.add(meeting.round);
    renderCalendar();

    const card = document.querySelector(`.round-card[data-round="${meeting.round}"]`);
    if (!card) return;
    const head = card.querySelector(".round-card__head");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden;
    head?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    head?.focus({ preventScroll: true });
  }

  function updateFilterButtons() {
    $$(".tab").forEach((tab) => {
      const active = tab.dataset.filter === state.filter;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
  }

  function handleAction(button) {
    const action = button.dataset.action;
    if (action === "toggle-round") {
      toggleRound(button);
    } else if (action === "jump-next") {
      jumpToNext();
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
    $("#year").textContent = String(new Date().getFullYear());
    initTimezones();
    renderAll();

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (button) handleAction(button);
    });

    $$(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        state.filter = tab.dataset.filter || "all";
        updateFilterButtons();
        renderCalendar();
      });
    });

    setSync(`Snapshot · ${fmt(new Date(season.generated || Date.now()), { day: "numeric", month: "short", year: "numeric" })}`, false);

    setInterval(tick, 1000);
    tick();
    refreshLive();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - lastFetch > LIVE_TTL) {
      refreshLive();
    }
  });

  init();
})();