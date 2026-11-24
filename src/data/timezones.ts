/**
 * Capital cities with their IANA time zones, used by the "Time zone" control
 * in the settings. Most capitals share the name of an IANA zone, but plenty do
 * not (Bern -> Europe/Zurich, Washington -> America/New_York), so a curated
 * list is the only reliable way to make "search the capital" work. Any other
 * IANA zone is still searchable by city name through `Intl.supportedValuesOf`.
 */

export interface ZoneOption {
  /** Capital / city shown as the result title. */
  city: string;
  /** Country name, empty for plain IANA fallback entries. */
  country: string;
  /** IANA identifier, e.g. Europe/Prague. */
  zone: string;
}

interface SearchEntry extends ZoneOption {
  haystack: string;
  words: string[];
}

/** country|capital|IANA zone|extra spellings (optional, comma separated) */
const RAW = `
Czechia|Prague|Europe/Prague|Praha
Slovakia|Bratislava|Europe/Bratislava
Poland|Warsaw|Europe/Warsaw|Varšava
Germany|Berlin|Europe/Berlin|Berlín
Austria|Vienna|Europe/Vienna|Vídeň
Hungary|Budapest|Europe/Budapest|Budapešť
Slovenia|Ljubljana|Europe/Ljubljana|Lublaň
Croatia|Zagreb|Europe/Zagreb|Záhřeb
Bosnia and Herzegovina|Sarajevo|Europe/Sarajevo
Serbia|Belgrade|Europe/Belgrade|Bělehrad
Montenegro|Podgorica|Europe/Podgorica
North Macedonia|Skopje|Europe/Skopje
Kosovo|Pristina|Europe/Belgrade|Priština
Albania|Tirana|Europe/Tirane
Greece|Athens|Europe/Athens|Athény
Bulgaria|Sofia|Europe/Sofia|Sofie
Romania|Bucharest|Europe/Bucharest|Bukurešť
Moldova|Chisinau|Europe/Chisinau|Kišiněv
Ukraine|Kyiv|Europe/Kyiv|Kyjev
Belarus|Minsk|Europe/Minsk
Lithuania|Vilnius|Europe/Vilnius
Latvia|Riga|Europe/Riga|Riga
Estonia|Tallinn|Europe/Tallinn
Finland|Helsinki|Europe/Helsinki|Helsinky
Sweden|Stockholm|Europe/Stockholm
Norway|Oslo|Europe/Oslo
Denmark|Copenhagen|Europe/Copenhagen|Kodaň
Iceland|Reykjavik|Atlantic/Reykjavik|Reykjavík
Ireland|Dublin|Europe/Dublin
United Kingdom|London|Europe/London|Londýn
France|Paris|Europe/Paris|Paříž
Belgium|Brussels|Europe/Brussels|Brusel
Netherlands|Amsterdam|Europe/Amsterdam
Luxembourg|Luxembourg|Europe/Luxembourg|Lucemburk
Switzerland|Bern|Europe/Zurich
Liechtenstein|Vaduz|Europe/Vaduz
Monaco|Monaco|Europe/Monaco|Monako
Andorra|Andorra la Vella|Europe/Andorra
Spain|Madrid|Europe/Madrid
Portugal|Lisbon|Europe/Lisbon|Lisabon
Italy|Rome|Europe/Rome|Řím
Malta|Valletta|Europe/Malta
San Marino|San Marino|Europe/Rome
Vatican City|Vatican City|Europe/Vatican|Vatikán
Russia|Moscow|Europe/Moscow|Moskva
Turkey|Ankara|Europe/Istanbul
Cyprus|Nicosia|Asia/Nicosia|Nikósie
Georgia|Tbilisi|Asia/Tbilisi
Armenia|Yerevan|Asia/Yerevan
Azerbaijan|Baku|Asia/Baku
Kazakhstan|Astana|Asia/Almaty
Uzbekistan|Tashkent|Asia/Tashkent
Turkmenistan|Ashgabat|Asia/Ashgabat
Kyrgyzstan|Bishkek|Asia/Bishkek
Tajikistan|Dushanbe|Asia/Dushanbe
Afghanistan|Kabul|Asia/Kabul
Pakistan|Islamabad|Asia/Karachi
India|New Delhi|Asia/Kolkata|Nové Dillí|Dillí
Nepal|Kathmandu|Asia/Kathmandu|Káthmándú
Bhutan|Thimphu|Asia/Thimphu
Bangladesh|Dhaka|Asia/Dhaka|Dháka
Sri Lanka|Colombo|Asia/Colombo
Maldives|Malé|Indian/Maldives|Male
China|Beijing|Asia/Shanghai|Peking
Mongolia|Ulaanbaatar|Asia/Ulaanbaatar
Japan|Tokyo|Asia/Tokyo|Tokio
South Korea|Seoul|Asia/Seoul|Soul
North Korea|Pyongyang|Asia/Pyongyang|Pchjongjang
Taiwan|Taipei|Asia/Taipei
Hong Kong|Hong Kong|Asia/Hong_Kong
Macau|Macau|Asia/Macau
Vietnam|Hanoi|Asia/Ho_Chi_Minh|Hanoj
Laos|Vientiane|Asia/Vientiane
Cambodia|Phnom Penh|Asia/Phnom_Penh
Thailand|Bangkok|Asia/Bangkok
Myanmar|Naypyidaw|Asia/Yangon|Nepjida
Malaysia|Kuala Lumpur|Asia/Kuala_Lumpur
Singapore|Singapore|Asia/Singapore|Singapur
Indonesia|Jakarta|Asia/Jakarta|Džakarta
Philippines|Manila|Asia/Manila
Brunei|Bandar Seri Begawan|Asia/Brunei
East Timor|Dili|Asia/Dili
Iran|Tehran|Asia/Tehran|Teherán
Iraq|Baghdad|Asia/Baghdad|Bagdád
Syria|Damascus|Asia/Damascus|Damašek
Lebanon|Beirut|Asia/Beirut|Bejrút
Jordan|Amman|Asia/Amman|Ammán
Israel|Jerusalem|Asia/Jerusalem|Jeruzalém
Palestine|Ramallah|Asia/Hebron|Ramalláh
Saudi Arabia|Riyadh|Asia/Riyadh|Rijád
Yemen|Sanaa|Asia/Aden|Saná
Oman|Muscat|Asia/Muscat|Maskat
United Arab Emirates|Abu Dhabi|Asia/Dubai|Abú Zabí
Qatar|Doha|Asia/Qatar|Dauha
Bahrain|Manama|Asia/Bahrain
Kuwait|Kuwait City|Asia/Kuwait|Kuvajt
Morocco|Rabat|Africa/Casablanca
Algeria|Algiers|Africa/Algiers|Alžír
Tunisia|Tunis|Africa/Tunis
Libya|Tripoli|Africa/Tripoli|Tripolis
Egypt|Cairo|Africa/Cairo|Káhira
Sudan|Khartoum|Africa/Khartoum|Chartúm
South Sudan|Juba|Africa/Juba
Ethiopia|Addis Ababa|Africa/Addis_Ababa|Addis Abeba
Eritrea|Asmara|Africa/Asmara
Djibouti|Djibouti|Africa/Djibouti|Džibuti
Somalia|Mogadishu|Africa/Mogadishu|Mogadišu
Kenya|Nairobi|Africa/Nairobi|Nairobi
Uganda|Kampala|Africa/Kampala
Rwanda|Kigali|Africa/Kigali
Burundi|Bujumbura|Africa/Bujumbura
Tanzania|Dodoma|Africa/Dar_es_Salaam|Dar es Salaam
Mozambique|Maputo|Africa/Maputo
Malawi|Lilongwe|Africa/Blantyre
Zambia|Lusaka|Africa/Lusaka
Zimbabwe|Harare|Africa/Harare
Botswana|Gaborone|Africa/Gaborone
Namibia|Windhoek|Africa/Windhoek
South Africa|Pretoria|Africa/Johannesburg|Pretorie
Lesotho|Maseru|Africa/Maseru
Eswatini|Mbabane|Africa/Mbabane
Madagascar|Antananarivo|Indian/Antananarivo
Mauritius|Port Louis|Indian/Mauritius
Seychelles|Victoria|Indian/Mahe
Comoros|Moroni|Indian/Comoro
Nigeria|Abuja|Africa/Lagos
Ghana|Accra|Africa/Accra|Akra
Ivory Coast|Yamoussoukro|Africa/Abidjan
Senegal|Dakar|Africa/Dakar
Gambia|Banjul|Africa/Banjul
Guinea-Bissau|Bissau|Africa/Bissau
Guinea|Conakry|Africa/Conakry
Sierra Leone|Freetown|Africa/Freetown
Liberia|Monrovia|Africa/Monrovia
Mali|Bamako|Africa/Bamako
Burkina Faso|Ouagadougou|Africa/Ouagadougou
Niger|Niamey|Africa/Niamey
Chad|N'Djamena|Africa/Ndjamena
Cameroon|Yaoundé|Africa/Douala
Central African Republic|Bangui|Africa/Bangui
Equatorial Guinea|Malabo|Africa/Malabo
Gabon|Libreville|Africa/Libreville
Republic of the Congo|Brazzaville|Africa/Brazzaville
DR Congo|Kinshasa|Africa/Kinshasa
Angola|Luanda|Africa/Luanda
São Tomé and Príncipe|São Tomé|Africa/Sao_Tome
Cape Verde|Praia|Atlantic/Cape_Verde
Mauritania|Nouakchott|Africa/Nouakchott
Togo|Lomé|Africa/Lome
Benin|Porto-Novo|Africa/Porto-Novo
United States|Washington|America/New_York|Washington, D.C.|Washington DC
Canada|Ottawa|America/Toronto
Mexico|Mexico City|America/Mexico_City|Ciudad de México
Guatemala|Guatemala City|America/Guatemala
Belize|Belmopan|America/Belize
El Salvador|San Salvador|America/El_Salvador
Honduras|Tegucigalpa|America/Tegucigalpa
Nicaragua|Managua|America/Managua
Costa Rica|San José|America/Costa_Rica|San Jose
Panama|Panama City|America/Panama
Cuba|Havana|America/Havana|Havana
Bahamas|Nassau|America/Nassau
Jamaica|Kingston|America/Jamaica
Haiti|Port-au-Prince|America/Port-au-Prince
Dominican Republic|Santo Domingo|America/Santo_Domingo
Puerto Rico|San Juan|America/Puerto_Rico
Colombia|Bogotá|America/Bogota|Bogota
Venezuela|Caracas|America/Caracas
Ecuador|Quito|America/Guayaquil
Peru|Lima|America/Lima
Bolivia|La Paz|America/La_Paz
Chile|Santiago|America/Santiago|Santiago de Chile
Argentina|Buenos Aires|America/Argentina/Buenos_Aires
Uruguay|Montevideo|America/Montevideo
Paraguay|Asunción|America/Asuncion|Asuncion
Brazil|Brasília|America/Sao_Paulo|Brasilia
Guyana|Georgetown|America/Guyana
Suriname|Paramaribo|America/Paramaribo
French Guiana|Cayenne|America/Cayenne
Australia|Canberra|Australia/Sydney
New Zealand|Wellington|Pacific/Auckland
Papua New Guinea|Port Moresby|Pacific/Port_Moresby
Fiji|Suva|Pacific/Fiji
Solomon Islands|Honiara|Pacific/Guadalcanal
Vanuatu|Port Vila|Pacific/Efate
Samoa|Apia|Pacific/Apia
Tonga|Nuku'alofa|Pacific/Tongatapu
Kiribati|Tarawa|Pacific/Tarawa
Marshall Islands|Majuro|Pacific/Majuro
Micronesia|Palikir|Pacific/Pohnpei
Palau|Melekeok|Pacific/Palau
Tuvalu|Funafuti|Pacific/Funafuti
Nauru|Yaren|Pacific/Nauru
`;

/** Accents, underscores and case are ignored while searching. */
function norm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function zoneCity(zone: string): string {
  const parts = zone.split("/");
  return parts[parts.length - 1].replace(/_/g, " ");
}

function zoneRegion(zone: string): string {
  return zone.split("/")[0].replace(/_/g, " ");
}

function toEntry(option: ZoneOption, extras: string[] = []): SearchEntry {
  const words = [option.city, option.country, zoneCity(option.zone), zoneRegion(option.zone), ...extras]
    .map(norm)
    .filter(Boolean);
  return { ...option, haystack: words.join(" "), words };
}

const CAPITALS: SearchEntry[] = RAW.trim()
  .split("\n")
  .map((line) => {
    const parts = line.split("|");
    const [country, city, zone] = parts;
    return toEntry({ city: city.trim(), country: country.trim(), zone: zone.trim() }, parts.slice(3).join(",").split(","));
  })
  .filter((entry) => entry.zone.includes("/"));

let allEntries: SearchEntry[] | null = null;

/** Curated capitals first, then any other IANA zone so free city searches work. */
function entries(): SearchEntry[] {
  if (allEntries) return allEntries;
  const seen = new Set(CAPITALS.map((entry) => entry.zone));
  const list = [...CAPITALS];
  try {
    const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
    for (const zone of zones) {
      if (seen.has(zone)) continue;
      seen.add(zone);
      list.push(toEntry({ city: zoneCity(zone), country: "", zone }));
    }
  } catch {
    /* Intl.supportedValuesOf may be missing on older browsers */
  }
  allEntries = list;
  return list;
}

function score(entry: SearchEntry, query: string): number {
  if (!query) return Number.POSITIVE_INFINITY;
  if (entry.words.some((word) => word.startsWith(query))) return 0;
  if (entry.words.some((word) => word.includes(" " + query))) return 1;
  if (entry.haystack.includes(query)) return 2;
  return Number.POSITIVE_INFINITY;
}

/** Ranks capital matches before secondary IANA cities. */
export function searchTimeZones(query: string, limit = 8): ZoneOption[] {
  const q = norm(query);
  if (!q) return [];
  const matches: Array<{ entry: SearchEntry; rank: number }> = [];
  for (const entry of entries()) {
    const rank = score(entry, q);
    if (rank === Number.POSITIVE_INFINITY) continue;
    matches.push({ entry, rank: rank + (entry.country ? 0 : 0.5) });
  }
  matches.sort((a, b) => a.rank - b.rank || a.entry.city.localeCompare(b.entry.city));
  return matches.slice(0, limit).map(({ entry }) => ({
    city: entry.city,
    country: entry.country || zoneRegion(entry.zone),
    zone: entry.zone,
  }));
}

/** Human label for a zone id, e.g. "Europe/Prague" -> "Europe / Prague". */
export function zoneLabel(zone: string): string {
  return zone.replace(/_/g, " ").replace("/", " / ");
}

/** Wall-clock time in a zone, in the same 24 h style as the rest of the page. */
export function timeInZone(zone: string, date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return "";
  }
}

/** Current UTC offset of a zone, e.g. "GMT+1". */
export function offsetInZone(zone: string, date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      timeZoneName: "shortOffset",
    }).formatToParts(date);
    const name = parts.find((part) => part.type === "timeZoneName");
    return name ? name.value : "";
  } catch {
    return "";
  }
}

/** Date label used next to the selected zone, e.g. "Mon 24 Nov". */
export function dayInZone(zone: string, date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date);
  } catch {
    return "";
  }
}