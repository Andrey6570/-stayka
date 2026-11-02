// Google Maps helpers. No API key and no network calls: the app only builds links that open in the Google Maps app,
// and parses what the user shares or pastes back from it (coordinates or a Maps link).

const TLD = "(?:com|[a-z]{2}|co\\.[a-z]{2}|com\\.[a-z]{2})";
const MAPS_HOSTS = new RegExp("^(?:www\\.|maps\\.)?google\\." + TLD + "$|^maps\\.app\\.goo\\.gl$|^goo\\.gl$", "i");
const num = "(-?\\d{1,3}(?:\\.\\d+)?)";
const okLat = v => Number.isFinite(v) && v >= -90 && v <= 90;
const okLng = v => Number.isFinite(v) && v >= -180 && v <= 180;

// A link is kept only if it is https and points to Google Maps. Anything else (javascript:, other sites) is dropped.
export function safeMapsUrl(raw) {
  try {
    const u = new URL(String(raw).trim());
    if (u.protocol !== "https:" || !MAPS_HOSTS.test(u.hostname)) return "";
    if (/^(www\.)?google\./i.test(u.hostname) && !/^\/maps/i.test(u.pathname)) return "";
    if (u.hostname.toLowerCase() === "goo.gl" && !/^\/maps/i.test(u.pathname)) return "";
    return u.href;
  } catch (e) { return ""; }
}

function coordsIn(s) {
  const pats = [
    new RegExp("!3d" + num + "!4d" + num),
    new RegExp("@" + num + "," + num),
    new RegExp("[?&](?:q|query|ll|destination|daddr|center)=" + num + "(?:,|%2C|\\+)\\s*" + num, "i"),
    new RegExp("^\\s*" + num + "\\s*[,; ]\\s*" + num + "\\s*$")
  ];
  for (const re of pats) {
    const m = s.match(re); if (!m) continue;
    const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
    if (okLat(lat) && okLng(lng)) return { lat, lng };
  }
  return null;
}

// Accepts a Maps share text ("Name\nAddress\nhttps://maps.app.goo.gl/..."), a Maps link or plain "lat, lng".
// Returns { name, lat, lng, url } with empty strings / undefined where nothing was found, or null if nothing useful.
export function parseMapsText(text) {
  const t = String(text || "").trim(); if (!t) return null;
  const urls = t.match(/https?:\/\/[^\s<>"']+/g) || [];
  let url = "";
  for (const u of urls) { url = safeMapsUrl(u); if (url) break; }
  let c = null;
  const hay = [url, ...urls.map(u => { try { return decodeURIComponent(u); } catch (e) { return u; } }), t];
  for (const h of hay) { if (h && (c = coordsIn(h))) break; }
  if (!c && !url) return null;
  const lines = t.split(/\r?\n/).map(l => l.trim()).filter(l => l && !/^https?:\/\//i.test(l));
  let name = lines[0] || "";
  if (coordsIn(name) && !/[^\d\s.,;+-]/.test(name)) name = "";
  return { name: name.slice(0, 60), lat: c ? c.lat : undefined, lng: c ? c.lng : undefined, url };
}

const q = s => encodeURIComponent(s);
const pos = g => g.lat.toFixed(6) + "," + g.lng.toFixed(6);

// geo: { lat, lng, url } (all optional); label: the place name typed by people.
export function mapUrl(geo, label) {
  if (geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lng)) return "https://www.google.com/maps/search/?api=1&query=" + q(pos(geo));
  if (geo && geo.url && safeMapsUrl(geo.url)) return safeMapsUrl(geo.url);
  return "https://www.google.com/maps/search/?api=1&query=" + q(label || "");
}
export function routeUrl(geo, label) {
  if (geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lng)) return "https://www.google.com/maps/dir/?api=1&destination=" + q(pos(geo));
  return "https://www.google.com/maps/dir/?api=1&destination=" + q(label || "");
}
export const searchUrl = label => "https://www.google.com/maps/search/?api=1&query=" + q(label || "");
export const hasPlace = (geo, label) => !!(label && String(label).trim()) || !!(geo && (Number.isFinite(geo.lat) || geo.url));

// Keep only validated fields when storing.
export function cleanGeo(g) {
  if (!g) return undefined;
  const o = {};
  if (Number.isFinite(g.lat) && Number.isFinite(g.lng) && okLat(g.lat) && okLng(g.lng)) { o.lat = Math.round(g.lat * 1e6) / 1e6; o.lng = Math.round(g.lng * 1e6) / 1e6; }
  const u = g.url && safeMapsUrl(g.url); if (u) o.url = u;
  return o.lat !== undefined || o.url ? o : undefined;
}
