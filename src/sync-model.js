// Pure conversion between the Firestore documents and the app's local model (no Firebase code here, so it is unit-tested).
// Locally the current user is always "me"; in Firestore people are identified by their anonymous-auth uid.

export const CODE_LEN = 8;
export const loc = (uid, me) => uid === me ? "me" : uid;
export const rem = (id, me) => id === "me" ? me : id;

const str = (v, n) => typeof v === "string" ? v.slice(0, n) : "";
const geoOf = g => {
  if (!g || typeof g !== "object") return undefined;
  const o = {}; if (Number.isFinite(g.lat) && Number.isFinite(g.lng)) { o.lat = g.lat; o.lng = g.lng; } if (typeof g.url === "string") o.url = g.url.slice(0, 500);
  return o.lat !== undefined || o.url ? o : undefined;
};
const mapKeys = (m, me, ok) => { const o = {}; Object.keys(m || {}).forEach(u => { if (ok(m[u])) o[loc(u, me)] = m[u]; }); return o; };

export function lunchFromRemote(d, me) {
  if (!d) return { place: "", time: "13:00", by: null, resp: {} };
  const l = { place: str(d.place, 60), time: str(d.time, 5) || "13:00", by: d.by ? loc(d.by, me) : null, resp: mapKeys(d.resp, me, v => v === "in" || v === "later" || v === "out") };
  const g = geoOf(d.geo); if (g) l.geo = g; return l;
}
export function lunchToRemote(l, me) {
  const o = { place: String(l.place || "").slice(0, 60), time: l.time || "13:00", by: l.by ? rem(l.by, me) : null, resp: {} };
  Object.keys(l.resp || {}).forEach(id => { o.resp[rem(id, me)] = l.resp[id]; });
  const g = geoOf(l.geo); if (g) o.geo = g; return o;
}

export function pollFromRemote(d, me) {
  if (!d) return { q: "", opts: [], win: null };
  const votes = d.votes || {};
  const opts = (Array.isArray(d.opts) ? d.opts : []).filter(o => o && typeof o.id === "string").map(o => {
    const r = { id: o.id, name: str(o.name, 60), votes: Object.keys(votes).filter(u => votes[u] === o.id).map(u => loc(u, me)) };
    const g = geoOf(o.geo); if (g) r.geo = g; return r;
  });
  return { q: str(d.q, 80), opts, win: typeof d.win === "string" ? d.win : null };
}
export function pollToRemote(p, me) {
  const votes = {};
  (p.opts || []).forEach(o => (o.votes || []).forEach(id => { votes[rem(id, me)] = o.id; }));
  return { q: String(typeof p.q === "string" ? p.q : "").slice(0, 80), opts: (p.opts || []).map(o => { const r = { id: o.id, name: String(o.name).slice(0, 60) }; const g = geoOf(o.geo); if (g) r.geo = g; return r; }), votes, win: p.win || null };
}

export function eventFromRemote(id, d, me) {
  const e = { id, title: str(d.title, 40), place: str(d.place, 60), date: str(d.date, 10), time: str(d.time, 5) || "19:00", by: d.by ? loc(d.by, me) : null, rsvp: mapKeys(d.rsvp, me, v => v === "yes" || v === "maybe" || v === "no") };
  const g = geoOf(d.geo); if (g) e.geo = g; return e;
}
export function eventToRemote(e, me) {
  const o = { title: String(e.title).slice(0, 40), place: String(e.place || "").slice(0, 60), date: e.date, time: e.time || "19:00", by: me, rsvp: {} };
  Object.keys(e.rsvp || {}).forEach(id => { o.rsvp[rem(id, me)] = e.rsvp[id]; });
  const g = geoOf(e.geo); if (g) o.geo = g; return o;
}

// members: [{ uid, name, avatar }] -> { members: ["me", uid...], people: { uid: { name, avatar } } }
export function membersFromRemote(list, me) {
  const people = {}, others = [];
  list.forEach(m => { if (m.uid !== me) { others.push(m.uid); people[m.uid] = { name: str(m.name, 20), avatar: typeof m.avatar === "string" && m.avatar.indexOf("data:image/") === 0 ? m.avatar : "" }; } });
  return { members: ["me"].concat(others.sort((a, b) => (people[a].name || a).localeCompare(people[b].name || b))), people };
}
