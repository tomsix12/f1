/**
 * Inline country flags keep the page self-contained. They are intentionally
 * simplified (no coats of arms) so they stay crisp at 32 × 21 px.
 *
 * Add a new country by giving it an ISO code below and (if needed) an SVG entry.
 */
export const FLAGS: Record<string, string> = {
  au: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#00247D"/><svg x="0" y="0" width="15" height="10"><rect width="15" height="10" fill="#00247D"/><g stroke="#fff" stroke-width="2"><path d="M0 0l15 10M15 0L0 10"/></g><g stroke="#C8102E" stroke-width="1"><path d="M0 0l15 10M15 0L0 10"/></g><path d="M6 0h3v10H6zM0 3.5h15v3H0z" fill="#fff"/><path d="M6.75 0h1.5v10h-1.5zM0 4.25h15v1.5H0z" fill="#C8102E"/></svg><g fill="#fff"><circle cx="22" cy="5" r=".85"/><circle cx="26" cy="9" r=".85"/><circle cx="20.5" cy="12" r=".85"/><circle cx="24.5" cy="15.5" r=".85"/><circle cx="23" cy="10" r=".55"/><circle cx="7.5" cy="15" r="1.3"/></g></svg>',
  at: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#ED2939"/><rect y="6.67" width="30" height="6.66" fill="#fff"/></svg>',
  az: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#00B5E2"/><rect y="6.67" width="30" height="6.66" fill="#E4002B"/><rect y="13.33" width="30" height="6.67" fill="#00AF66"/><circle cx="14" cy="10" r="2.4" fill="#fff"/><circle cx="15" cy="10" r="2" fill="#E4002B"/><polygon points="18.4,8.3 18.8,9.4 20,9.4 19.1,10.1 19.4,11.3 18.4,10.6 17.4,11.3 17.7,10.1 16.8,9.4 18,9.4" fill="#fff"/></svg>',
  be: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="20" fill="#000"/><rect x="10" width="10" height="20" fill="#FDDA24"/><rect x="20" width="10" height="20" fill="#EF3340"/></svg>',
  br: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#009B3A"/><path d="M15 2.4L27 10 15 17.6 3 10z" fill="#FEDF00"/><circle cx="15" cy="10" r="4.1" fill="#002776"/><path d="M11 9.1c2.7.5 5.7 1 8 2.4" stroke="#fff" stroke-width=".9" fill="none"/><g fill="#fff"><circle cx="13" cy="8.4" r=".35"/><circle cx="16.4" cy="7.7" r=".35"/><circle cx="18" cy="10.4" r=".35"/></g></svg>',
  ca: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#fff"/><rect width="7.5" height="20" fill="#D52B1E"/><rect x="22.5" width="7.5" height="20" fill="#D52B1E"/><path d="M15 3.8l1.1 2.3 1.9-.6-.5 2 1.7.9-1.8 1.2.4 2-2-.8-.8 2.1h-1.8l-.8-2.1-2 .8.4-2-1.8-1.2 1.7-.9-.5-2 1.9.6z" fill="#D52B1E"/></svg>',
  cn: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#DE2910"/><polygon points="6,2.5 6.71,4.53 8.85,4.57 7.14,5.87 7.76,7.93 6,6.7 4.24,7.93 4.86,5.87 3.15,4.57 5.29,4.53" fill="#FFDE00"/><g fill="#FFDE00"><circle cx="10.5" cy="3.1" r=".7"/><circle cx="12" cy="5.2" r=".7"/><circle cx="12" cy="7.6" r=".7"/><circle cx="10.5" cy="9.3" r=".7"/></g></svg>',
  es: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/></svg>',
  gb: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#012169"/><g stroke="#fff" stroke-width="4"><path d="M0 0l30 20M30 0L0 20"/></g><g stroke="#C8102E" stroke-width="2"><path d="M0 0l30 20M30 0L0 20"/></g><path d="M12 0h6v20h-6zM0 7h30v6H0z" fill="#fff"/><path d="M13.5 0h3v20h-3zM0 8.5h30v3H0z" fill="#C8102E"/></svg>',
  hu: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#CE2939"/><rect y="6.67" width="30" height="6.66" fill="#fff"/><rect y="13.33" width="30" height="6.67" fill="#477050"/></svg>',
  it: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#CE2B37"/></svg>',
  jp: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="4.2" fill="#BC002D"/></svg>',
  mc: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="10" fill="#CE1126"/><rect y="10" width="30" height="10" fill="#fff"/></svg>',
  mx: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="20" fill="#006847"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#CE1126"/><path d="M15 8.2c1.7 0 2.8 1.3 2.4 3l1.1.7-1.3.6.3 1.4-1.3-.7-1.2.9-.2-1.4-1.4-.2.9-1.1c-.6-1.4.1-3.2 2.7-3.2z" fill="#7A4B22"/></svg>',
  my: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#fff"/><g fill="#CC0001"><rect width="30" height="1.43"/><rect y="2.86" width="30" height="1.43"/><rect y="5.71" width="30" height="1.43"/><rect y="8.57" width="30" height="1.43"/><rect y="11.43" width="30" height="1.43"/><rect y="14.29" width="30" height="1.43"/><rect y="17.14" width="30" height="1.43"/></g><rect width="15" height="10" fill="#010066"/><circle cx="6" cy="5" r="2.6" fill="#FFCC00"/><circle cx="7.1" cy="5" r="2.2" fill="#010066"/><polygon points="10.5,2.6 11,3.7 12.1,3.8 11.3,4.5 11.5,5.6 10.5,5 9.5,5.6 9.7,4.5 8.9,3.8 10,3.7" fill="#FFCC00"/></svg>',
  nl: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#AE1C28"/><rect y="6.67" width="30" height="6.66" fill="#fff"/><rect y="13.33" width="30" height="6.67" fill="#21468B"/></svg>',
  qa: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#8A1538"/><path d="M0 0h7l2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11 2 1.11-2 1.11V20H0z" fill="#fff"/></svg>',
  sg: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#fff"/><rect width="30" height="10" fill="#ED2939"/><circle cx="8" cy="5" r="2.8" fill="#fff"/><circle cx="9.3" cy="5" r="2.4" fill="#ED2939"/><g fill="#fff"><circle cx="12.8" cy="2.6" r=".6"/><circle cx="14.4" cy="4.1" r=".6"/><circle cx="13.8" cy="6.1" r=".6"/><circle cx="11.8" cy="6.1" r=".6"/><circle cx="11.2" cy="4.1" r=".6"/></g></svg>',
  us: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#fff"/><g fill="#B22234"><rect width="30" height="1.54"/><rect y="3.08" width="30" height="1.54"/><rect y="6.15" width="30" height="1.54"/><rect y="9.23" width="30" height="1.54"/><rect y="12.31" width="30" height="1.54"/><rect y="15.38" width="30" height="1.54"/><rect y="18.46" width="30" height="1.54"/></g><rect width="13.5" height="10.77" fill="#3C3B6E"/><g fill="#fff"><circle cx="2.2" cy="2" r=".55"/><circle cx="5.2" cy="2" r=".55"/><circle cx="8.2" cy="2" r=".55"/><circle cx="11.2" cy="2" r=".55"/><circle cx="3.7" cy="4.4" r=".55"/><circle cx="6.7" cy="4.4" r=".55"/><circle cx="9.7" cy="4.4" r=".55"/><circle cx="2.2" cy="6.8" r=".55"/><circle cx="5.2" cy="6.8" r=".55"/><circle cx="8.2" cy="6.8" r=".55"/><circle cx="11.2" cy="6.8" r=".55"/><circle cx="3.7" cy="9.1" r=".55"/><circle cx="6.7" cy="9.1" r=".55"/><circle cx="9.7" cy="9.1" r=".55"/></g></svg>',
  ae: '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="#fff"/><rect width="30" height="6.67" fill="#00732F"/><rect y="13.33" width="30" height="6.67" fill="#000"/><rect width="7.5" height="20" fill="#FF0000"/></svg>',
};

export const COUNTRY_CODES: Record<string, string> = {
  Australia: "au",
  China: "cn",
  Japan: "jp",
  USA: "us",
  "United States": "us",
  Canada: "ca",
  Monaco: "mc",
  Spain: "es",
  Austria: "at",
  UK: "gb",
  "United Kingdom": "gb",
  Belgium: "be",
  Hungary: "hu",
  Netherlands: "nl",
  Italy: "it",
  Azerbaijan: "az",
  Malaysia: "my",
  Singapore: "sg",
  Mexico: "mx",
  Brazil: "br",
  Qatar: "qa",
  UAE: "ae",
  "United Arab Emirates": "ae",
};

const UNKNOWN_FLAG =
  '<span class="flag flag--unknown" aria-hidden="true">' +
  '<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">' +
  '<rect width="30" height="20" fill="#7C858D"/>' +
  '<circle cx="15" cy="10" r="4.6" fill="none" stroke="#fff" stroke-width="1.2"/>' +
  '<path d="M10.4 10h9.2M15 5.4c2 3 2 6.2 0 9.2M15 5.4c-2 3-2 6.2 0 9.2" fill="none" stroke="#fff" stroke-width="1"/>' +
  "</svg></span>";

export function flagFor(country: string): string {
  const code = COUNTRY_CODES[country];
  const svg = code ? FLAGS[code] : "";
  if (!svg) return UNKNOWN_FLAG;
  return '<span class="flag" aria-hidden="true">' + svg + "</span>";
}