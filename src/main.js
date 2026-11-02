import { GAMES, CATS, LI, cardsOf, isAdult, cardText } from "./games.js";
import { parseMapsText, mapUrl, routeUrl, searchUrl, hasPlace, cleanGeo } from "./maps.js";
import { PALETTES } from "./themes.js";
import { config } from "./firebase-config.js";
import { CODE_LEN, lunchFromRemote, lunchToRemote, pollFromRemote, pollToRemote, eventFromRemote, eventToRemote, membersFromRemote } from "./sync-model.js";


const $ = s => document.querySelector(s);
const KEY = "stayka-v2";
const APK = "https://github.com/Andrey6570/-stayka/releases/download/latest/stayka.apk";
const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 8);
const iso = off => { const d = new Date(); d.setDate(d.getDate() + off); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

// ---------- language ----------
const LOC = { ru: "ru-RU", en: "en-GB", el: "el-GR" };
const guess = () => { const n = (navigator.language || "en").toLowerCase(); return n.indexOf("ru") === 0 ? "ru" : n.indexOf("el") === 0 ? "el" : "en"; };
let S; try { S = JSON.parse(LS.get(KEY) || "null"); } catch (e) { S = null; }
let lang = (S && S.lang) || guess();
const x = (a, b, c) => [a, b, c][LI[lang]];
const X = (a, b, c) => ({ ru: a, en: b, el: c });
const d = s => s && typeof s === "object" ? s[lang] : s;
const pick = arr => arr[LI[lang]];

// ---------- people ----------
const PEOPLE = {
  me: { c: "#E8472F" }, anna: { c: "#2B7A78", n: ["Аня", "Anya", "Άνια"] }, dima: { c: "#5B4B8A", n: ["Дима", "Dima", "Ντίμα"] }, lena: { c: "#B5651D", n: ["Лена", "Lena", "Λένα"] },
  max: { c: "#3A6EA5", n: ["Макс", "Max", "Μαξ"] }, ira: { c: "#8A3F6B", n: ["Ира", "Ira", "Ίρα"] }, oleg: { c: "#4F6D2F", n: ["Олег", "Oleg", "Όλεγκ"] }
};
const other = id => (S.people && S.people[id]) || {};
const pname = id => id === "me" ? ((S.profile && S.profile.name) || x("Вы", "You", "Εσύ")) : PEOPLE[id] ? pick(PEOPLE[id].n) : (other(id).name || x("Участник", "Member", "Μέλος"));
const pcol = id => PEOPLE[id] ? PEOPLE[id].c : WCOL[Array.from(String(id)).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % WCOL.length];
const av = id => {
  const pic = id === "me" ? S.profile && S.profile.avatar : other(id).avatar;
  if (pic) return `<img class="av" src="${pic}" alt="">`;
  return `<span class="av" style="background:${pcol(id)}">${esc(Array.from(pname(id))[0] || "?")}</span>`;
};
const TIMES = ["12:30", "13:00", "13:30", "14:00"];

// ---------- seed ----------
function seed() {
  return {
    v: 2, gid: "office", tab: "today", lang, adult: false, dry: true, theme: { pal: "stayka", mode: "auto" }, consent: null, profile: { name: "", avatar: "" },
    people: {},
    groups: {
      office: {
        name: X("Офис, 3 этаж", "Office, 3rd floor", "Γραφείο, 3ος όροφος"), members: ["me", "anna", "dima", "lena", "max"],
        lunch: { place: X("Грузинский ресторанчик", "Georgian restaurant", "Γεωργιανό εστιατόριο"), time: "13:00", by: "dima", resp: { dima: "in", lena: "in", max: "out" } },
        poll: { q: X("Куда на пятничное пиво?", "Where for Friday beer?", "Πού για την παρασκευιάτικη μπίρα;"), opts: [
          { id: "o1", name: X("Бар «Погреб»", "Bar “The Cellar”", "Μπαρ «Το Κελάρι»"), votes: ["anna", "lena"] },
          { id: "o2", name: X("Крафтовая пивоварня", "Craft brewery", "Μικροζυθοποιία"), votes: ["dima"] },
          { id: "o3", name: X("Пиццерия на углу", "Pizzeria on the corner", "Πιτσαρία στη γωνία"), votes: [] }], win: null },
        events: [
          { id: "e1", title: X("Пятничные бургеры", "Friday burgers", "Παρασκευιάτικα μπέργκερ"), date: iso(2), time: "19:00", place: "Burger Lab", rsvp: { anna: "yes", dima: "yes", lena: "maybe" } },
          { id: "e2", title: X("Корпоративный квиз", "Office quiz night", "Κουίζ γραφείου"), date: iso(9), time: "20:00", place: X("Паб «Лиса»", "Pub “The Fox”", "Παμπ «Η Αλεπού»"), rsvp: { max: "yes" } }
        ]
      },
      friends: {
        name: X("Пятничные", "Friday crew", "Η παρέα της Παρασκευής"), members: ["me", "ira", "oleg", "anna", "dima"],
        lunch: { place: "", time: "13:00", by: null, resp: {} },
        poll: { q: X("Куда в субботу вечером?", "Where on Saturday night?", "Πού το Σάββατο βράδυ;"), opts: [
          { id: "o1", name: X("Настолки у Олега", "Board games at Oleg's", "Επιτραπέζια στου Όλεγκ"), votes: ["oleg", "ira"] },
          { id: "o2", name: X("Концерт в клубе", "Club concert", "Συναυλία σε κλαμπ"), votes: ["dima"] },
          { id: "o3", name: X("Боулинг", "Bowling", "Μπόουλινγκ"), votes: [] }], win: null },
        events: [{ id: "e1", title: X("День рождения Иры", "Ira's birthday", "Τα γενέθλια της Ίρας"), date: iso(5), time: "18:30", place: X("Ресторан «Тбилиси»", "Restaurant “Tbilisi”", "Εστιατόριο «Τιφλίδα»"), rsvp: { ira: "yes", oleg: "yes", dima: "maybe" } }]
      }
    }
  };
}
if (!S || !S.groups) S = seed();
S.profile = S.profile || { name: "", avatar: "" };
// Invite code: 6 characters without look-alikes (no 0/O, 1/I).
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () => Array.from({ length: CODE_LEN }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
function fix() {
  S.profile = S.profile || { name: "", avatar: "" };
  S.theme = S.theme || { pal: "stayka", mode: "auto" };
  S.people = S.people || {};
  Object.keys(S.groups).forEach(k => { const g = S.groups[k]; if (!g.code) g.code = makeCode(); if ((k === "office" || k === "friends") && !g.sync) g.demo = true; });
}
fix();
S.lang = lang;
const G = () => S.groups[S.gid];
const persist = () => LS.set(KEY, JSON.stringify(S));
const save = () => { persist(); render(); };
// ---------- theme ----------
const mq = matchMedia("(prefers-color-scheme: dark)");
function applyTheme() {
  const root = document.documentElement, t = S.theme, pal = PALETTES.find(p => p.id === t.pal) || PALETTES[0];
  const dark = t.mode === "dark" || (t.mode === "auto" && mq.matches), set = pal.light ? pal[dark ? "dark" : "light"] : null;
  if (t.mode === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t.mode);
  ["bg", "surface", "surface2", "ink", "muted", "line", "accent", "accent-ink"].forEach(k => set ? root.style.setProperty("--" + k, set[k]) : root.style.removeProperty("--" + k));
  const bg = set ? set.bg : dark ? "#0F1815" : "#F2F4F1";
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute("content", bg));
}
mq.addEventListener && mq.addEventListener("change", () => { if (S.theme.mode === "auto") applyTheme(); });

// ---------- maps and sharing ----------
const placeText = p => d(p) || "";
function mapTarget(id) {
  const g = G();
  if (id === "lunch") return { geo: g.lunch.geo, label: placeText(g.lunch.place), title: "" };
  if (id.indexOf("e:") === 0) { const e = g.events.find(z => z.id === id.slice(2)); return e ? { geo: e.geo, label: placeText(e.place), title: d(e.title) } : null; }
  if (id.indexOf("o:") === 0) { const o = g.poll.opts.find(z => z.id === id.slice(2)); return o ? { geo: o.geo, label: d(o.name), title: "" } : null; }
  return null;
}
const SVG = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const PIN = SVG('<path d="M12 21s-6-5.6-6-11a6 6 0 0112 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>');
const ROUTE = SVG('<path d="M5 19L19 5M9 5h10v10"/>');
const SHARE = SVG('<circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 11l8-4M8 13l8 4"/>');
function mapRow(id) {
  const t = mapTarget(id); if (!t || !hasPlace(t.geo, t.label)) return "";
  const a = (act, ico, txt) => `<button class="chipbtn" data-act="${act}" data-id="${esc(id)}">${ico}${txt}</button>`;
  return `<div class="maprow">${a("mapOpen", PIN, x("На карте", "On the map", "Στον χάρτη"))}${a("mapRoute", ROUTE, x("Маршрут", "Directions", "Διαδρομή"))}${a("mapShare", SHARE, x("Поделиться", "Share", "Κοινοποίηση"))}</div>`;
}
async function ext(url) { try { (await import("./native.js")).openExternal(url); } catch (e) { window.open(url, "_blank", "noopener"); } }
async function share(data) {
  let r = "failed"; try { r = await (await import("./native.js")).share(data); } catch (e) {}
  if (r === "copied") toast(x("Текст скопирован, отправьте его в любой мессенджер", "Text copied, paste it into any messenger", "Το κείμενο αντιγράφηκε, στείλτε το σε οποιοδήποτε messenger"));
  else if (r === "failed") toast(x("Не удалось поделиться", "Could not share", "Δεν ήταν δυνατή η κοινοποίηση"));
}
const inviteText = g => x(`Присоединяйся к компании «${d(g.name)}» в приложении Стайка! Код приглашения: ${g.code}`, `Join “${d(g.name)}” in the Stayka app! Invite code: ${g.code}`, `Γίνε μέλος της ομάδας «${d(g.name)}» στην εφαρμογή Stayka! Κωδικός πρόσκλησης: ${g.code}`)
  + "\n" + x("Приложение для Android: ", "Android app: ", "Εφαρμογή Android: ") + APK;

const SYNC_CFG = !!(config.apiKey && config.projectId), CONSENT_V = 2;
let sheet = S.consent && !(SYNC_CFG && S.consent.version < CONSENT_V) ? null : { kind: "consent", age: false, data: false, push: false, rerender: true };
let toastT = null, wheelRot = 0, spinning = false, wheelPick = null;
function toast(m) { const el = $("#toast"); el.textContent = m; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 2400); }
const fmtDate = s => { const dt = new Date(s + "T00:00:00"); return { d: dt.getDate(), m: dt.toLocaleDateString(LOC[lang], { month: "short" }).replace(".", ""), w: dt.toLocaleDateString(LOC[lang], { weekday: "long" }) }; };
const rel = s => { const n = Math.round((new Date(s + "T00:00:00") - new Date(iso(0) + "T00:00:00")) / 864e5); return n === 0 ? x("сегодня", "today", "σήμερα") : n === 1 ? x("завтра", "tomorrow", "αύριο") : ""; };

const drinkWord = () => S.dry ? x("глоток воды или штрафное задание", "a sip of water or a forfeit", "μια γουλιά νερό ή μια ποινή") : x("глоток", "a sip", "μια γουλιά");
function ruleOf(id) {
  const g = GAMES[id];
  if (g.rule === "TALK") return x("Отвечайте только на то, что готовы обсуждать. Любой вопрос можно пропустить без объяснений. Не осуждаем и не пересказываем услышанное за пределами стола.",
    "Only answer what you are ready to discuss. Any question can be skipped, no explanation needed. No judgment, and what is said stays at the table.",
    "Απαντάτε μόνο σε ό,τι θέλετε να συζητήσετε. Κάθε ερώτηση μπορεί να παραλειφθεί χωρίς εξήγηση. Χωρίς κριτική, και ό,τι ειπωθεί μένει στο τραπέζι.");
  return d(g.rule).replace("{d}", drinkWord());
}
function shuffle(n) { const a = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- icons / tabs ----------
const ICON = {
  today: '<path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z"/>',
  lunch: '<path d="M7 3v8a2 2 0 002 2v8M11 3v8a2 2 0 01-2 2M7 3v6M11 3v6M17 3c-2 2-3 5-3 8h3v10"/>',
  poll: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7"/>',
  events: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  games: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/>'
};
const tabs = () => [["today", x("Сегодня", "Today", "Σήμερα")], ["lunch", x("Обед", "Lunch", "Γεύμα")], ["poll", x("Куда?", "Where?", "Πού;")], ["events", x("События", "Events", "Εκδηλώσεις")], ["games", x("Игры", "Games", "Παιχνίδια")]];

// ---------- lunch ----------
const lunchIn = L => Object.keys(L.resp).filter(k => L.resp[k] === "in");
const faces = (g, L) => g.members.map(id => { const r = L.resp[id]; return `<span class="face ${r === "in" ? "in" : r === "out" ? "out" : ""}">${av(id)}${esc(pname(id))}${r === "in" ? " ✓" : r === "later" ? " · " + x("позже", "later", "αργότερα") : ""}</span>`; }).join("");
function lunchCard() {
  const g = G(), L = g.lunch;
  if (!L.place) return `<div class="card hero"><div class="eyebrow">${x("Обед сегодня", "Lunch today", "Γεύμα σήμερα")}</div><div class="big">${x("Пока никто не зовёт", "Nobody has invited yet", "Κανείς δεν έχει καλέσει ακόμη")}</div><div class="muted">${x("Предложите место и время, остальные ответят одним нажатием.", "Suggest a place and time, the others answer with one tap.", "Προτείνετε μέρος και ώρα, οι άλλοι απαντούν με ένα πάτημα.")}</div><button class="btn lemon" data-act="newLunch">${x("Позвать на обед", "Invite to lunch", "Πρόσκληση σε γεύμα")}</button></div>`;
  const my = L.resp.me, n = lunchIn(L).length;
  return `<div class="card hero"><div class="eyebrow">${x("Обед сегодня", "Lunch today", "Γεύμα σήμερα")} · ${esc(L.time)}</div>
    <div class="big">${esc(d(L.place))}</div>
    <div class="muted">${x("Зовёт", "Invited by", "Καλεί ο/η")} ${esc(pname(L.by))}. ${x("Идут", "Going", "Έρχονται")}: ${n} / ${g.members.length}</div>
    <div class="faces">${faces(g, L)}</div>
    ${mapRow("lunch")}
    <div class="btns">
      <button class="btn lemon ${my === "in" ? "sel" : ""}" data-act="resp" data-v="in">${x("Иду", "I'm in", "Έρχομαι")}</button>
      <button class="btn ghost ${my === "later" ? "sel" : ""}" data-act="resp" data-v="later">${x("Позже", "Later", "Αργότερα")}</button>
      <button class="btn ghost ${my === "out" ? "sel" : ""}" data-act="resp" data-v="out">${x("Не сегодня", "Not today", "Όχι σήμερα")}</button>
    </div></div>`;
}
const vLunch = () => lunchCard() + `<div class="card"><h3>${x("Предложить другое место", "Suggest another place", "Πρόταση άλλου μέρους")}</h3><div class="muted">${x("Новый вариант сбросит ответы остальных.", "A new suggestion resets everyone's answers.", "Μια νέα πρόταση μηδενίζει τις απαντήσεις των υπολοίπων.")}</div><button class="btn ghost" data-act="newLunch">${x("Позвать на обед", "Invite to lunch", "Πρόσκληση σε γεύμα")}</button></div>`;

// ---------- poll ----------
function vPoll() {
  const P = G().poll, tot = P.opts.reduce((n, o) => n + o.votes.length, 0) || 1;
  return `<div class="card"><div class="eyebrow">${x("Голосование", "Poll", "Ψηφοφορία")}</div><h2>${esc(d(P.q) || x("Куда пойдём?", "Where shall we go?", "Πού πάμε;"))}</h2>
    <div style="display:flex;flex-direction:column;gap:8px">${P.opts.map(o => `<div class="optrow"><button class="opt ${o.votes.includes("me") ? "mine" : ""}" data-act="vote" data-id="${o.id}"><span class="fill" style="width:${o.votes.length / tot * 100}%"></span><span class="nm">${esc(d(o.name))}</span><span class="faces" style="gap:2px;flex-wrap:nowrap">${o.votes.map(av).join("")}</span><span class="count">${o.votes.length}</span></button><button class="chipbtn" data-act="mapOpen" data-id="o:${esc(o.id)}" aria-label="${x("Показать на карте", "Show on the map", "Εμφάνιση στον χάρτη")}: ${esc(d(o.name))}">${PIN}</button></div>`).join("")}</div>
    ${P.win ? `<div class="winner">${x("Колесо выбрало", "The wheel chose", "Ο τροχός επέλεξε")}: ${esc(P.win)}</div>` : ""}
    <div class="addrow"><input type="text" id="newOpt" maxlength="40" placeholder="${x("Свой вариант", "Your option", "Η δική σου επιλογή")}" aria-label="${x("Свой вариант", "Your option", "Η δική σου επιλογή")}"><button class="btn small" data-act="addOpt">${x("Добавить", "Add", "Προσθήκη")}</button></div>
    <button class="btn lemon" data-act="wheel">${x("Не договорились: крутить колесо", "Can't decide: spin the wheel", "Δεν συμφωνήσαμε: γύρνα τον τροχό")}</button></div>`;
}

// ---------- events ----------
function vEvents() {
  const list = G().events.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return list.map(e => {
    const f = fmtDate(e.date), my = e.rsvp.me, yes = Object.keys(e.rsvp).filter(k => e.rsvp[k] === "yes"), maybe = Object.keys(e.rsvp).filter(k => e.rsvp[k] === "maybe");
    return `<div class="card ev"><div class="date"><b>${f.d}</b><span>${esc(f.m)}</span></div><div class="body">
      <div><h3>${esc(d(e.title))}</h3><div class="muted">${esc(f.w)}${rel(e.date) ? " · " + rel(e.date) : ""}, ${esc(e.time)} · ${esc(d(e.place))}</div></div>
      ${mapRow("e:" + e.id)}
      <div class="faces">${yes.map(id => `<span class="face in">${av(id)}${esc(pname(id))}</span>`).join("")}${maybe.map(id => `<span class="face">${av(id)}${esc(pname(id))} ?</span>`).join("")}${!yes.length && !maybe.length ? `<span class="muted">${x("Пока никто не ответил", "No answers yet", "Καμία απάντηση ακόμη")}</span>` : ""}</div>
      <div class="rsvp">${[["yes", x("Иду", "Going", "Πάω")], ["maybe", x("Может", "Maybe", "Ίσως")], ["no", x("Нет", "No", "Όχι")]].map(([v, t]) => `<button class="${my === v ? "on" : ""}" data-act="rsvp" data-id="${e.id}" data-v="${v}">${t}</button>`).join("")}</div>
    </div></div>`;
  }).join("") || `<div class="card"><h3>${x("Планов пока нет", "No plans yet", "Δεν υπάρχουν πλάνα ακόμη")}</h3><div class="muted">${x("Добавьте первое событие кнопкой внизу.", "Add the first event with the button below.", "Προσθέστε την πρώτη εκδήλωση με το κουμπί κάτω.")}</div></div>`;
}

// ---------- today ----------
function vToday() {
  const g = G(), up = g.events.filter(e => e.date >= iso(0)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0], P = g.poll;
  const lead = P.opts.slice().sort((a, b) => b.votes.length - a.votes.length)[0];
  return lunchCard()
    + `<div class="card"><div class="eyebrow">${x("Компания", "Group", "Ομάδα")}</div><h3>${esc(d(g.name))}</h3><div class="faces">${g.members.map(id => `<span class="face">${av(id)}${esc(pname(id))}</span>`).join("")}</div><div class="btns"><button class="btn" data-act="gInvite">${x("Пригласить друзей", "Invite friends", "Πρόσκληση φίλων")}</button><button class="btn ghost" data-act="group">${x("Участники и код", "Members and code", "Μέλη και κωδικός")}</button></div></div>`
    + (up ? `<div class="card"><div class="eyebrow">${x("Ближайшее событие", "Next event", "Επόμενη εκδήλωση")}</div><h3>${esc(d(up.title))}</h3><div class="muted">${esc(fmtDate(up.date).w)}, ${esc(up.time)} · ${esc(d(up.place))}</div><div class="muted">${x("Идут", "Going", "Έρχονται")}: ${Object.values(up.rsvp).filter(v => v === "yes").length}</div>${mapRow("e:" + up.id)}<button class="btn ghost" data-act="goto" data-id="events">${x("Все события", "All events", "Όλες οι εκδηλώσεις")}</button></div>` : "")
    + `<div class="card"><div class="eyebrow">${x("Голосование", "Poll", "Ψηφοφορία")}</div><h3>${esc(d(P.q))}</h3><div class="muted">${lead && lead.votes.length ? x("Лидирует", "Leading", "Προηγείται") + ": " + esc(d(lead.name)) + " (" + lead.votes.length + ")" : x("Голосов пока нет", "No votes yet", "Καμία ψήφος ακόμη")}</div><button class="btn ghost" data-act="goto" data-id="poll">${x("Проголосовать", "Vote", "Ψήφισε")}</button></div>`;
}

// ---------- games ----------
function vGames() {
  return `<div class="card"><button class="sw ${S.dry ? "on" : ""}" data-act="dry" role="switch" aria-checked="${S.dry}"><span class="track"></span><span class="grow"><b>${x("Без алкоголя", "Alcohol-free mode", "Χωρίς αλκοόλ")}</b><br><span class="muted">${x("Вместо глотка: вода или штрафное задание", "Water or a forfeit instead of a drink", "Νερό ή ποινή αντί για ποτό")}</span></span></button></div>`
    + CATS.map(c => `<div class="sec"><h3>${esc(d(c.name))}</h3>${c.adult ? '<span class="tag18">18+</span>' : ""}</div>
      <div class="gamegrid">${c.ids.map(id => `<button class="tile" data-act="game" data-id="${id}"><b>${esc(d(GAMES[id].name))}</b><span class="muted">${esc(d(GAMES[id].desc))}</span><span class="muted">${cardsOf(id).length} ${x("карточек", "cards", "κάρτες")}</span></button>`).join("")}</div>`).join("");
}
function sGame() {
  const id = sheet.id, g = GAMES[id], cards = cardsOf(id), idx = sheet.deck[sheet.pos % cards.length], who = G().members[sheet.pos % G().members.length];
  let text, ans = "";
  if (g.trivia) { const qa = cards[idx][LI[lang]]; text = qa[0]; if (sheet.show) ans = qa[1]; } else text = cardText(id, cards[idx], lang);
  const warn = g.cat === "alc" ? `<div class="notice">${x("Только 18+. Пейте в меру: можно заменить на воду или сок. Не садитесь за руль.", "18+ only. Drink responsibly: water or juice is always fine. Never drive after drinking.", "Μόνο 18+. Πίνετε υπεύθυνα: νερό ή χυμός είναι πάντα εντάξει. Μην οδηγείτε μετά το ποτό.")}</div>` : "";
  const trivia = g.trivia;
  return `<div class="row"><span class="eyebrow grow">${esc(d(CATS.find(c => c.ids.includes(id)).name))}</span>${isAdult(id) ? '<span class="tag18">18+</span>' : ""}</div>
    <h2>${esc(d(g.name))}</h2><div class="notice">${esc(ruleOf(id))}</div>${warn}
    <div class="row"><span class="face">${av(who)}${x("Ходит", "Turn", "Σειρά του")}: ${esc(pname(who))}</span><span class="muted grow" style="text-align:right">${(sheet.pos % cards.length) + 1} / ${cards.length}</span></div>
    <div class="gcard">${esc(text)}${ans ? `<div class="ans">${esc(ans)}</div>` : ""}</div>
    <div class="btns">${trivia && !sheet.show ? `<button class="btn lemon" data-act="showAns">${x("Показать ответ", "Show answer", "Εμφάνιση απάντησης")}</button>` : ""}<button class="btn" data-act="nextCard">${x("Дальше", "Next", "Επόμενη")}</button>${g.cat === "talk" ? `<button class="btn ghost" data-act="nextCard">${x("Пропустить", "Skip", "Παράλειψη")}</button>` : ""}</div>
    <button class="btn ghost" data-act="close">${x("Закрыть", "Close", "Κλείσιμο")}</button>`;
}
const sAge = () => `<h2>${x("Только для взрослых", "Adults only", "Μόνο για ενήλικες")}</h2><p class="muted">${x("Эти игры предназначены для людей от 18 лет. Подтверждая, вы заявляете, что вам есть 18. Разделы с алкоголем не призывают пить: можно играть с водой или включить режим без алкоголя.", "These games are for people aged 18 and over. By confirming you declare that you are 18 or older. The drinking games never require alcohol: play with water or switch on alcohol-free mode.", "Αυτά τα παιχνίδια είναι για άτομα άνω των 18. Επιβεβαιώνοντας δηλώνετε ότι είστε 18 ετών και άνω. Τα παιχνίδια με αλκοόλ δεν απαιτούν αλκοόλ: παίξτε με νερό ή ενεργοποιήστε τη λειτουργία χωρίς αλκοόλ.")}</p>
  <button class="btn" data-act="ageYes">${x("Мне есть 18 лет", "I am 18 or older", "Είμαι 18 ετών ή μεγαλύτερος")}</button><button class="btn ghost" data-act="close">${x("Назад", "Back", "Πίσω")}</button>`;

// ---------- privacy ----------
function policy() {
  return [
    [x("Кто отвечает за данные", "Who controls the data", "Ποιος είναι υπεύθυνος για τα δεδομένα"), x("Оператор: [название и контакты оператора, адрес для запросов по данным]. Это черновик, его должен проверить юрист.", "Controller: [operator name, contact details, address for data requests]. This is a draft and needs legal review.", "Υπεύθυνος: [επωνυμία και στοιχεία επικοινωνίας, διεύθυνση για αιτήματα δεδομένων]. Πρόκειται για πρόχειρο κείμενο που χρειάζεται νομικό έλεγχο.")],
    [x("Какие данные", "What data", "Ποια δεδομένα"), x("Имя, фото (по желанию), ваши ответы в компаниях (обед, голосования, события, места на карте) и настройки. Для работы синхронизации Firebase создаёт анонимный идентификатор вашего устройства. Мы не собираем геолокацию, контакты телефона и рекламные идентификаторы.", "Name, photo (optional), your answers in groups (lunch, polls, events, places on the map) and settings. To make sync work Firebase creates an anonymous identifier for your device. We do not collect location, phone contacts or advertising identifiers.", "Όνομα, φωτογραφία (προαιρετικά), οι απαντήσεις σας στις ομάδες (γεύμα, ψηφοφορίες, εκδηλώσεις, μέρη στον χάρτη) και ρυθμίσεις. Για τον συγχρονισμό το Firebase δημιουργεί ένα ανώνυμο αναγνωριστικό της συσκευής σας. Δεν συλλέγουμε τοποθεσία, επαφές τηλεφώνου ή διαφημιστικά αναγνωριστικά.")],
    [x("Зачем и на каком основании", "Why and on what basis", "Γιατί και με ποια νομική βάση"), x("Чтобы приложение работало для вашей группы. Основание: ваше согласие (ст. 6(1)(a) GDPR) и предоставление сервиса. Согласие можно отозвать в любой момент.", "To run the app for your group. Basis: your consent (Art. 6(1)(a) GDPR) and providing the service. You can withdraw consent at any time.", "Για να λειτουργεί η εφαρμογή για την ομάδα σας. Βάση: η συγκατάθεσή σας (άρθρο 6(1)(α) GDPR) και η παροχή της υπηρεσίας. Μπορείτε να την ανακαλέσετε οποιαδήποτε στιγμή.")],
    [x("Игры", "Games", "Παιχνίδια"), x("Вопросы и ответы в играх не записываются и никуда не передаются. Возраст подтверждается вашей отметкой, мы не просим документов.", "Questions and answers in games are not recorded or sent anywhere. Age is confirmed by your own tick; we ask for no documents.", "Οι ερωτήσεις και οι απαντήσεις στα παιχνίδια δεν καταγράφονται ούτε αποστέλλονται πουθενά. Η ηλικία επιβεβαιώνεται με δική σας δήλωση, δεν ζητάμε έγγραφα.")],
    [x("Кто что видит", "Who sees what", "Ποιος βλέπει τι"), x("Участники вашей компании видят ваше имя, фото и ответы в этой компании. Людей вне компании данные не видят; в компанию вступают по секретному коду. Демо-компании выдуманные и остаются только на телефоне.", "Members of your group see your name, photo and answers in that group. People outside the group cannot see the data; people join with a secret code. The demo groups are made up and stay on your phone only.", "Τα μέλη της ομάδας σας βλέπουν το όνομα, τη φωτογραφία και τις απαντήσεις σας σε αυτήν. Όσοι είναι εκτός ομάδας δεν βλέπουν τα δεδομένα· η συμμετοχή γίνεται με μυστικό κωδικό. Οι demo ομάδες είναι φανταστικές και μένουν μόνο στο κινητό.")],
    [x("Срок хранения", "Retention", "Διάρκεια αποθήκευσης"), x("Данные компании хранятся на сервере, пока вы в ней состоите. Когда вы выходите из компании или удаляете профиль в приложении, ваши ответы, голоса и профиль в ней стираются с сервера. Данные в самом телефоне хранятся, пока вы не удалите профиль или приложение.", "Group data is kept on the server while you are a member. When you leave a group or delete your profile in the app, your answers, votes and profile in it are erased from the server. Data on the phone stays until you delete your profile or the app.", "Τα δεδομένα της ομάδας φυλάσσονται στον διακομιστή όσο είστε μέλος. Όταν αποχωρείτε από μια ομάδα ή διαγράφετε το προφίλ σας στην εφαρμογή, οι απαντήσεις, οι ψήφοι και το προφίλ σας σε αυτήν διαγράφονται από τον διακομιστή. Τα δεδομένα στο κινητό μένουν μέχρι να διαγράψετε το προφίλ ή την εφαρμογή.")],
    [x("Ваши права", "Your rights", "Τα δικαιώματά σας"), x("Доступ, исправление, удаление, перенос, ограничение обработки, возражение и отзыв согласия. Всё это есть в профиле. Можно пожаловаться в надзорный орган вашей страны.", "Access, rectification, erasure, portability, restriction, objection and withdrawal of consent. All are available in your profile. You can complain to your national supervisory authority.", "Πρόσβαση, διόρθωση, διαγραφή, φορητότητα, περιορισμός, εναντίωση και ανάκληση συγκατάθεσης. Όλα διατίθενται στο προφίλ σας. Μπορείτε να υποβάλετε καταγγελία στην εποπτική αρχή της χώρας σας.")],
    [x("Карты", "Maps", "Χάρτες"), x("Кнопки «На карте» и «Маршрут» открывают Google Карты по ссылке в отдельном приложении или браузере; в ссылку попадает только название или координаты места. Сама Стайка ничего не отправляет Google. Когда вы делитесь местом из Карт в Стайку, приложение читает только присланный вами текст. Геолокацию телефона мы не запрашиваем.", "The “On the map” and “Directions” buttons open Google Maps by link in a separate app or browser; the link contains only the place name or coordinates. Stayka itself sends nothing to Google. When you share a place from Maps to Stayka, the app reads only the text you sent. We do not ask for the phone's location.", "Τα κουμπιά «Στον χάρτη» και «Διαδρομή» ανοίγουν το Google Maps με σύνδεσμο σε ξεχωριστή εφαρμογή ή πρόγραμμα περιήγησης· ο σύνδεσμος περιέχει μόνο το όνομα ή τις συντεταγμένες του μέρους. Η ίδια η Stayka δεν στέλνει τίποτα στη Google. Όταν μοιράζεστε ένα μέρος από τους Χάρτες στη Stayka, η εφαρμογή διαβάζει μόνο το κείμενο που στείλατε. Δεν ζητάμε τη θέση του κινητού.")],
    [x("Третьи лица", "Third parties", "Τρίτοι"), x("Данные компаний хранит Google (Firebase Authentication и Cloud Firestore) как наш обработчик; регион хранения: [указать, например ЕС]. Мы не продаём данные, не показываем рекламу и не строим профили; аналитики и рекламных SDK нет, шрифты встроены.", "Group data is stored by Google (Firebase Authentication and Cloud Firestore) as our processor; storage region: [fill in, for example EU]. We do not sell data, show ads or build profiles; there is no analytics or advertising SDK and fonts are built in.", "Τα δεδομένα των ομάδων αποθηκεύονται από την Google (Firebase Authentication και Cloud Firestore) ως εκτελούσα την επεξεργασία· περιοχή αποθήκευσης: [συμπληρώστε, π.χ. ΕΕ]. Δεν πουλάμε δεδομένα, δεν εμφανίζουμε διαφημίσεις και δεν δημιουργούμε προφίλ· δεν υπάρχει analytics ή διαφημιστικό SDK και οι γραμματοσειρές είναι ενσωματωμένες.")],
  ];
}
const policyHtml = () => `<div class="pl">${policy().map(([h, p]) => `<div><b>${h}</b><p>${p}</p></div>`).join("")}</div>`;
const langBtns = () => `<div class="langs">${[["ru", "Русский"], ["en", "English"], ["el", "Ελληνικά"]].map(([k, n]) => `<button class="btn ghost ${k === lang ? "sel" : ""}" data-act="lang" data-id="${k}">${n}</button>`).join("")}</div>`;
function sConsent() {
  const ok = sheet.age && sheet.data;
  return `<h2>${x("Добро пожаловать", "Welcome", "Καλώς ήρθατε")}</h2>${langBtns()}
    <p class="muted">${x("Прежде чем начать, коротко о ваших данных. Мы собираем только то, что нужно для работы групп.", "Before you start, a short note on your data. We only collect what groups need to work.", "Πριν ξεκινήσετε, μια σύντομη ενημέρωση. Συλλέγουμε μόνο ό,τι χρειάζονται οι ομάδες για να λειτουργούν.")}</p>
    ${SYNC_CFG ? `<div class="notice">${x("Ваши компании синхронизируются через серверы Google (Firebase): имя, фото и ответы видят участники компании. Подробности в политике.", "Your groups sync through Google (Firebase) servers: group members see your name, photo and answers. See the notice for details.", "Οι ομάδες σας συγχρονίζονται μέσω των διακομιστών της Google (Firebase): τα μέλη βλέπουν το όνομα, τη φωτογραφία και τις απαντήσεις σας. Δείτε την πολιτική.")}</div>` : ""}
    <details><summary>${x("Политика конфиденциальности", "Privacy notice", "Πολιτική απορρήτου")}</summary>${policyHtml()}</details>
    <label class="chk"><input type="checkbox" id="cAge" ${sheet.age ? "checked" : ""}><span>${x("Мне есть 16 лет или больше (обязательно)", "I am 16 or older (required)", "Είμαι 16 ετών ή μεγαλύτερος (απαραίτητο)")}</span></label>
    <label class="chk"><input type="checkbox" id="cData" ${sheet.data ? "checked" : ""}><span>${x("Я согласен на обработку имени, фото и моих ответов в группах так, как описано в политике (обязательно)", "I consent to the processing of my name, photo and answers in groups as described in the notice (required)", "Συναινώ στην επεξεργασία του ονόματος, της φωτογραφίας και των απαντήσεών μου στις ομάδες όπως περιγράφεται στην πολιτική (απαραίτητο)")}</span></label>
    <label class="chk"><input type="checkbox" id="cPush" ${sheet.push ? "checked" : ""}><span>${x("Присылать уведомления об обедах и событиях (по желанию)", "Send me notifications about lunches and events (optional)", "Αποστολή ειδοποιήσεων για γεύματα και εκδηλώσεις (προαιρετικά)")}</span></label>
    <button class="btn" id="cGo" data-act="consentGo" ${ok ? "" : "disabled"}>${x("Продолжить", "Continue", "Συνέχεια")}</button>`;
}
function sProfile() {
  const p = S.profile;
  return `<h2>${x("Профиль и приватность", "Profile and privacy", "Προφίλ και απόρρητο")}</h2>
    <div>${p.avatar ? `<img class="av avbig" src="${p.avatar}" alt="${x("Ваша аватарка", "Your avatar", "Το avatar σας")}">` : `<span class="av avbig" style="background:${PEOPLE.me.c}">${esc(Array.from(pname("me"))[0] || "?")}</span>`}</div>
    <div class="btns"><label class="btn" style="cursor:pointer;display:grid;place-items:center;color:var(--accent-ink);font-size:16px">${p.avatar ? x("Заменить фото", "Change photo", "Αλλαγή φωτογραφίας") : x("Загрузить фото", "Upload photo", "Μεταφόρτωση φωτογραφίας")}<input type="file" id="avFile" accept="image/*" style="position:absolute;opacity:0;width:1px;height:1px"></label>${p.avatar ? `<button class="btn ghost" data-act="avDel">${x("Убрать фото", "Remove photo", "Αφαίρεση φωτογραφίας")}</button>` : ""}</div>
    <p class="muted">${x("Фото необязательно. Его увидят участники ваших групп. Оно сжимается до 128 пикселей, метаданные снимка не сохраняются. Не загружайте снимки других людей без их согласия.", "The photo is optional. Members of your groups will see it. It is shrunk to 128 pixels and the photo's metadata is not kept. Do not upload other people's pictures without their consent.", "Η φωτογραφία είναι προαιρετική. Θα τη βλέπουν τα μέλη των ομάδων σας. Μικραίνει στα 128 pixel και τα μεταδεδομένα δεν διατηρούνται. Μην ανεβάζετε φωτογραφίες άλλων χωρίς τη συγκατάθεσή τους.")}</p>
    <label for="pName">${x("Имя", "Name", "Όνομα")}<input type="text" id="pName" maxlength="20" value="${esc(p.name)}" placeholder="${x("Как вас называть", "What to call you", "Πώς να σας λέμε")}"></label>
    <div><div class="muted" style="margin-bottom:6px">${x("Язык", "Language", "Γλώσσα")}</div>${langBtns()}</div>
    <div><div class="muted" style="margin-bottom:6px">${x("Цветовая схема", "Colour scheme", "Χρωματικό θέμα")}</div>
      <div class="pals">${PALETTES.map(pl => `<button class="pal ${S.theme.pal === pl.id ? "sel" : ""}" data-act="pal" data-id="${pl.id}" aria-pressed="${S.theme.pal === pl.id}"><span class="dots"><i style="background:${pl.sw[1]}"></i><i style="background:${pl.sw[0]}"></i></span>${esc(pick(pl.n))}</button>`).join("")}</div></div>
    <div><div class="muted" style="margin-bottom:6px">${x("Светлая или тёмная", "Light or dark", "Φωτεινό ή σκούρο")}</div>
      <div class="langs">${[["auto", x("Как в системе", "System", "Σύστημα")], ["light", x("Светлая", "Light", "Φωτεινό")], ["dark", x("Тёмная", "Dark", "Σκούρο")]].map(([k, n]) => `<button class="btn ghost ${S.theme.mode === k ? "sel" : ""}" data-act="mode" data-id="${k}">${n}</button>`).join("")}</div></div>
    <button class="sw ${S.consent && S.consent.push ? "on" : ""}" data-act="push" role="switch" aria-checked="${!!(S.consent && S.consent.push)}"><span class="track"></span><span class="grow">${x("Уведомления", "Notifications", "Ειδοποιήσεις")}</span></button>
    <button class="sw ${S.adult ? "on" : ""}" data-act="adultToggle" role="switch" aria-checked="${S.adult}"><span class="track"></span><span class="grow">${x("Мне 18+, показывать взрослые игры", "I am 18+, show adult games", "Είμαι 18+, εμφάνιση παιχνιδιών για ενήλικες")}</span></button>
    <div class="notice">${x("Ваши права по GDPR", "Your GDPR rights", "Τα δικαιώματά σας βάσει GDPR")}${S.consent ? " · " + x("согласие дано", "consent given", "συγκατάθεση δόθηκε") + " " + new Date(S.consent.ts).toLocaleDateString(LOC[lang]) : ""}</div>
    <button class="btn ghost" data-act="myData">${x("Мои данные (доступ и перенос)", "My data (access and portability)", "Τα δεδομένα μου (πρόσβαση και φορητότητα)")}</button>
    <button class="btn ghost" data-act="policy">${x("Политика конфиденциальности", "Privacy notice", "Πολιτική απορρήτου")}</button>
    <button class="btn danger" data-act="delAll">${sheet.confirmDel ? x("Точно? Нажмите ещё раз, это необратимо", "Sure? Tap again, this cannot be undone", "Σίγουρα; Πατήστε ξανά, δεν αναιρείται") : x("Отозвать согласие и удалить все мои данные", "Withdraw consent and delete all my data", "Ανάκληση συγκατάθεσης και διαγραφή όλων των δεδομένων μου")}</button>
    <button class="btn ghost" data-act="close">${x("Готово", "Done", "Τέλος")}</button>`;
}
const sPolicy = () => `<h2>${x("Политика конфиденциальности", "Privacy notice", "Πολιτική απορρήτου")}</h2>${policyHtml()}<button class="btn ghost" data-act="${S.consent ? "profile" : "close"}">${x("Назад", "Back", "Πίσω")}</button>`;
function exportData() {
  const mine = { groups: {} };
  Object.keys(S.groups).forEach(k => { const g = S.groups[k]; mine.groups[k] = { name: d(g.name), lunchAnswer: g.lunch.resp.me || null, pollVote: (g.poll.opts.find(o => o.votes.includes("me")) || {}).name ? d(g.poll.opts.find(o => o.votes.includes("me")).name) : null, eventAnswers: g.events.filter(e => e.rsvp.me).map(e => ({ event: d(e.title), answer: e.rsvp.me })) }; });
  return JSON.stringify({ exportedAt: new Date().toISOString(), profile: { name: S.profile.name, hasAvatar: !!S.profile.avatar, language: lang }, syncUserId: S.uid || null, consent: S.consent, adultConfirmed: S.adult, alcoholFreeMode: S.dry, activity: mine }, null, 2);
}
const sMyData = () => `<h2>${x("Мои данные", "My data", "Τα δεδομένα μου")}</h2><p class="muted">${x("Всё, что приложение хранит о вас, в машиночитаемом виде (JSON). Скопируйте и сохраните. Ответы в играх не хранятся.", "Everything the app stores about you in a machine-readable format (JSON). Copy and save it. Game answers are not stored.", "Όλα όσα αποθηκεύει η εφαρμογή για εσάς σε μορφή JSON. Αντιγράψτε και αποθηκεύστε. Οι απαντήσεις στα παιχνίδια δεν αποθηκεύονται.")}</p><textarea id="dump" readonly>${esc(exportData())}</textarea><button class="btn" data-act="copyData">${x("Копировать", "Copy", "Αντιγραφή")}</button><button class="btn ghost" data-act="profile">${x("Назад", "Back", "Πίσω")}</button>`;

// ---------- sheets ----------
const geoBox = p => `<details class="mapbox" ${sheet.geo || sheet.geoOpen ? "open" : ""}><summary>${x("Место на карте (Google Карты)", "Place on the map (Google Maps)", "Μέρος στον χάρτη (Google Maps)")}</summary>
    <p class="muted">${x("Откройте Карты, найдите место и нажмите «Поделиться» → «Стайка»: оно подставится само. Или вставьте сюда ссылку либо координаты.", "Open Maps, find the place and tap Share → Stayka and it fills in by itself. Or paste a link or coordinates here.", "Ανοίξτε τους Χάρτες, βρείτε το μέρος και πατήστε Κοινοποίηση → Stayka και συμπληρώνεται μόνο του. Ή επικολλήστε εδώ σύνδεσμο ή συντεταγμένες.")}</p>
    <div class="btns"><button class="btn ghost small" data-act="mapFind" data-id="${p}">${x("Найти / выбрать в Картах", "Find / pick in Maps", "Αναζήτηση / επιλογή στους Χάρτες")}</button></div>
    <label for="${p}Geo">${x("Ссылка или координаты", "Link or coordinates", "Σύνδεσμος ή συντεταγμένες")}<input type="text" id="${p}Geo" value="${esc(sheet.geoTxt || "")}" placeholder="https://maps.app.goo.gl/… · 37.9838, 23.7275"></label>
    <div class="btns" style="margin-top:8px"><button class="btn ghost small" data-act="geoApply">${x("Применить", "Apply", "Εφαρμογή")}</button></div>
    ${sheet.geo ? `<div class="mapok">✓ ${x("Точка на карте выбрана", "Map point selected", "Το σημείο επιλέχθηκε")}${sheet.geo.lat !== undefined ? " (" + sheet.geo.lat + ", " + sheet.geo.lng + ")" : ""} <button class="chipbtn" data-act="geoClear">${x("Убрать", "Remove", "Αφαίρεση")}</button></div>` : ""}
  </details>`;
function sLunch() {
  const t = sheet.time || "13:00";
  return `<h2>${x("Позвать на обед", "Invite to lunch", "Πρόσκληση σε γεύμα")}</h2><label for="lPlace">${x("Куда идём", "Where to", "Πού πάμε")}<input type="text" id="lPlace" maxlength="50" placeholder="${x("Например, столовая на углу", "For example, the canteen on the corner", "Π.χ. η καντίνα στη γωνία")}" value="${esc(sheet.place || "")}"></label>
    ${geoBox("l")}
    <div><div class="muted" style="margin-bottom:6px">${x("Во сколько", "What time", "Τι ώρα")}</div><div class="btns">${TIMES.map(v => `<button class="btn ghost ${v === t ? "sel" : ""}" data-act="lTime" data-v="${v}">${v}</button>`).join("")}</div></div>
    <button class="btn" data-act="lSend">${x("Отправить группе", "Send to the group", "Αποστολή στην ομάδα")}</button><button class="btn ghost" data-act="close">${x("Отмена", "Cancel", "Ακύρωση")}</button>`;
}
const sEvent = () => `<h2>${x("Новое событие", "New event", "Νέα εκδήλωση")}</h2>
    <label for="eTitle">${x("Название", "Title", "Τίτλος")}<input type="text" id="eTitle" maxlength="40" value="${esc(sheet.title || "")}" placeholder="${x("Например, квиз в пабе", "For example, pub quiz", "Π.χ. κουίζ σε παμπ")}"></label>
    <label for="ePlace">${x("Место", "Place", "Μέρος")}<input type="text" id="ePlace" maxlength="50" value="${esc(sheet.place || "")}" placeholder="${x("Бар, ресторан или адрес", "Bar, restaurant or address", "Μπαρ, εστιατόριο ή διεύθυνση")}"></label>
    ${geoBox("e")}
    <div class="addrow"><label for="eDate" class="grow">${x("Дата", "Date", "Ημερομηνία")}<input type="date" id="eDate" value="${esc(sheet.date || iso(3))}"></label><label for="eTime" class="grow">${x("Время", "Time", "Ώρα")}<input type="time" id="eTime" value="${esc(sheet.etime || "19:00")}"></label></div>
    <button class="btn" data-act="eSave">${x("Создать", "Create", "Δημιουργία")}</button><button class="btn ghost" data-act="close">${x("Отмена", "Cancel", "Ακύρωση")}</button>`;

// Place that arrived from Google Maps (Share -> Stayka): choose what to do with it.
const sShared = () => `<h2>${x("Место из Google Карт", "Place from Google Maps", "Μέρος από το Google Maps")}</h2>
    <label for="shName">${x("Название", "Name", "Όνομα")}<input type="text" id="shName" maxlength="60" value="${esc(sheet.name || "")}"></label>
    ${sheet.geo && sheet.geo.lat !== undefined ? `<div class="muted">${sheet.geo.lat}, ${sheet.geo.lng}</div>` : ""}
    <div class="maprow"><button class="chipbtn" data-act="shMap">${PIN}${x("Проверить на карте", "Check on the map", "Έλεγχος στον χάρτη")}</button></div>
    <button class="btn" data-act="shLunch">${x("Позвать на обед сюда", "Invite to lunch here", "Πρόσκληση σε γεύμα εδώ")}</button>
    <button class="btn ghost" data-act="shEvent">${x("Создать событие здесь", "Create an event here", "Δημιουργία εκδήλωσης εδώ")}</button>
    <button class="btn ghost" data-act="shOpt">${x("Добавить в голосование", "Add to the poll", "Προσθήκη στην ψηφοφορία")}</button>
    <button class="btn ghost" data-act="close">${x("Отмена", "Cancel", "Ακύρωση")}</button>`;

// Groups
const sNewGroup = () => `<h2>${x("Новая компания", "New group", "Νέα ομάδα")}</h2>
    <label for="gName">${x("Название", "Name", "Όνομα")}<input type="text" id="gName" maxlength="40" placeholder="${x("Например, Пятничные или Офис", "For example, Friday crew or Office", "Π.χ. Η παρέα ή Γραφείο")}"></label>
    <button class="btn" data-act="gCreate">${x("Создать и пригласить", "Create and invite", "Δημιουργία και πρόσκληση")}</button>
    <hr class="divider">
    <label for="jCode">${x("Есть код приглашения?", "Have an invite code?", "Έχετε κωδικό πρόσκλησης;")}<input type="text" id="jCode" maxlength="8" autocapitalize="characters" autocomplete="off" placeholder="ABCD2345"></label>
    <button class="btn ghost" data-act="gJoin">${x("Вступить по коду", "Join with a code", "Συμμετοχή με κωδικό")}</button>
    <button class="btn ghost" data-act="close">${x("Отмена", "Cancel", "Ακύρωση")}</button>`;
function sGroup() {
  const g = G();
  return `<h2>${x("Компания", "Group", "Ομάδα")}</h2>
    <label for="gRen">${x("Название", "Name", "Όνομα")}<input type="text" id="gRen" maxlength="40" value="${esc(d(g.name))}"></label>
    <div><div class="muted" style="margin-bottom:6px">${x("Участники", "Members", "Μέλη")}</div><div class="faces">${g.members.map(id => `<span class="face">${av(id)}${esc(pname(id))}</span>`).join("")}</div></div>
    <div><div class="muted" style="margin-bottom:6px">${x("Код приглашения", "Invite code", "Κωδικός πρόσκλησης")}</div><div class="code" aria-label="${esc(g.code.split("").join(" "))}">${esc(g.code)}</div></div>
    ${SYNC_CFG && !g.sync && !g.demo ? `<button class="btn lemon" data-act="gSync">${x("Включить синхронизацию", "Turn on sync", "Ενεργοποίηση συγχρονισμού")}</button>` : ""}
    <button class="btn" data-act="gInvite">${x("Отправить приглашение", "Send invitation", "Αποστολή πρόσκλησης")}</button>
    <button class="btn ghost" data-act="gCopy">${x("Скопировать код", "Copy code", "Αντιγραφή κωδικού")}</button>
    <div class="notice">${g.sync ? x("Друг вводит код в Стайке («＋» → «Вступить по коду») и попадает в эту компанию: вы видите общие обеды, голосования и события. Не публикуйте код открыто: он работает как пароль.", "A friend enters the code in Stayka (“＋” → “Join with a code”) and lands in this group: you share lunches, polls and events. Do not post the code publicly: it works like a password.", "Ένας φίλος βάζει τον κωδικό στη Stayka («＋» → «Συμμετοχή με κωδικό») και μπαίνει στην ομάδα: μοιράζεστε γεύματα, ψηφοφορίες και εκδηλώσεις. Μην δημοσιεύετε τον κωδικό: λειτουργεί σαν κωδικός πρόσβασης.") : g.demo ? x("Это демо-компания с выдуманными людьми, она остаётся на телефоне. Создайте свою компанию кнопкой «＋».", "This is a demo group with made-up people and stays on your phone. Create your own group with “＋”.", "Αυτή είναι demo ομάδα με φανταστικά άτομα και μένει στο κινητό. Δημιουργήστε τη δική σας με το «＋».") : (g.joined ? x("Вы вступили по коду. Участники этой компании появятся здесь, когда заработает синхронизация. ", "You joined with a code. The members of this group will appear here once sync is on. ", "Μπήκατε με κωδικό. Τα μέλη θα εμφανιστούν εδώ όταν ενεργοποιηθεί ο συγχρονισμός. ") : "") + x("Приглашение отправляет код и ссылку на приложение. Общие обеды, голосования и события между телефонами заработают, когда мы включим синхронизацию: тогда друзья, введя код, окажутся в вашей компании.", "The invitation sends a code and a link to the app. Shared lunches, polls and events between phones will work once sync is switched on; then friends who enter the code will land in your group.", "Η πρόσκληση στέλνει έναν κωδικό και σύνδεσμο προς την εφαρμογή. Τα κοινά γεύματα, οι ψηφοφορίες και οι εκδηλώσεις μεταξύ κινητών θα λειτουργήσουν όταν ενεργοποιηθεί ο συγχρονισμός· τότε οι φίλοι που θα βάλουν τον κωδικό θα μπουν στην ομάδα σας.")}</div>
    <button class="btn danger" data-act="gDel">${sheet.confirmGDel ? x("Точно? Нажмите ещё раз", "Sure? Tap again", "Σίγουρα; Πατήστε ξανά") : g.sync ? x("Выйти из компании и стереть мои ответы", "Leave the group and erase my answers", "Αποχώρηση και διαγραφή των απαντήσεών μου") : x("Удалить компанию с этого телефона", "Delete group from this phone", "Διαγραφή ομάδας από αυτό το κινητό")}</button>
    <button class="btn ghost" data-act="close">${x("Готово", "Done", "Τέλος")}</button>`;
}
const WCOL = ["#E8472F", "#2B7A78", "#F4C430", "#5B4B8A", "#3A6EA5", "#B5651D", "#8A3F6B", "#4F6D2F"];
function sWheel() {
  const opts = G().poll.opts, n = opts.length, step = 360 / n, R = 140, cx = 150, cy = 150;
  const pt = (a, r) => [cx + r * Math.sin(a * Math.PI / 180), cy - r * Math.cos(a * Math.PI / 180)];
  let seg = "";
  opts.forEach((o, i) => {
    const a0 = i * step, a1 = (i + 1) * step, p0 = pt(a0, R), p1 = pt(a1, R), mid = pt(a0 + step / 2, R * .62), col = WCOL[i % WCOL.length], dark = col === "#F4C430", nm = d(o.name), label = nm.length > 14 ? nm.slice(0, 13) + "…" : nm;
    seg += `<path d="M${cx} ${cy} L${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${R} ${R} 0 ${step > 180 ? 1 : 0} 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} Z" fill="${col}" stroke="#fff" stroke-width="2"/>`
      + `<text x="${mid[0].toFixed(1)}" y="${mid[1].toFixed(1)}" fill="${dark ? "#3A2E00" : "#fff"}" font-size="13" font-weight="600" text-anchor="middle" dominant-baseline="middle" transform="rotate(${(a0 + step / 2).toFixed(1)} ${mid[0].toFixed(1)} ${mid[1].toFixed(1)})">${esc(label)}</text>`;
  });
  return `<h2>${x("Колесо решает", "The wheel decides", "Ο τροχός αποφασίζει")}</h2>
    ${n < 2 ? `<div class="muted">${x("Добавьте минимум два варианта в голосовании.", "Add at least two options to the poll.", "Προσθέστε τουλάχιστον δύο επιλογές στην ψηφοφορία.")}</div>` : `<div class="wheelbox"><div class="ptr"></div><svg viewBox="0 0 300 300" role="img" aria-label="${x("Колесо вариантов", "Wheel of options", "Τροχός επιλογών")}"><g id="wheel" style="transform:rotate(${wheelRot}deg)">${seg}</g><circle cx="150" cy="150" r="14" fill="var(--ink)"/></svg></div>
    ${wheelPick ? `<div class="winner" id="wres">${x("Выпало", "Result", "Αποτέλεσμα")}: ${esc(wheelPick)}</div>` : `<div class="muted" style="text-align:center" id="wres">${x("Нажмите «Крутить»", "Tap “Spin”", "Πατήστε «Γύρνα»")}</div>`}
    <button class="btn" data-act="spin">${x("Крутить", "Spin", "Γύρνα")}</button>`}
    <button class="btn ghost" data-act="close">${x("Закрыть", "Close", "Κλείσιμο")}</button>`;
}

// ---------- render ----------
function render() {
  document.documentElement.lang = lang;
  applyTheme();
  $("#logo").innerHTML = x("стайка", "stayka", "στάικα") + "<i>.</i>";
  $("#foot").textContent = syncNote();
  $("#meBtn").innerHTML = av("me"); $("#meBtn").setAttribute("aria-label", x("Профиль и приватность", "Profile and privacy", "Προφίλ και απόρρητο"));
  $("#groups").innerHTML = Object.keys(S.groups).map(id => `<button class="gchip ${id === S.gid ? "on" : ""}" data-act="group" data-id="${id}">${esc(d(S.groups[id].name))}</button>`).join("") + `<button class="gchip add" data-act="newGroup" aria-label="${x("Новая компания", "New group", "Νέα ομάδα")}">＋</button>`;
  $("#tabs").innerHTML = tabs().map(([id, nm]) => `<button class="tab ${id === S.tab ? "on" : ""}" data-act="goto" data-id="${id}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[id]}</svg>${nm}</button>`).join("");
  const views = { today: vToday, lunch: vLunch, poll: vPoll, events: vEvents, games: vGames }, keep = $("#newOpt") ? $("#newOpt").value : "";
  $("#view").innerHTML = views[S.tab]();
  if ($("#newOpt")) $("#newOpt").value = keep;
  $("#fabHost").innerHTML = S.tab === "events" ? `<button class="fab" data-act="newEvent">+ ${x("Событие", "Event", "Εκδήλωση")}</button>` : "";
  if (sheet) {
    if (!$("#sheetHost .scrim") || sheet.rerender) {
      const bodies = { consent: sConsent, profile: sProfile, policy: sPolicy, mydata: sMyData, age: sAge, game: sGame, lunch: sLunch, event: sEvent, wheel: sWheel, newgroup: sNewGroup, group: sGroup, shared: sShared };
      $("#sheetHost").innerHTML = `<div class="scrim" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true">${sheet.kind === "consent" ? "" : `<button class="grab" data-act="close" aria-label="${x("Закрыть", "Close", "Κλείσιμο")}"></button>`}${bodies[sheet.kind]()}</div></div>`;
      sheet.rerender = false;
    }
  } else $("#sheetHost").innerHTML = "";
}
const open = (kind, extra) => { sheet = Object.assign({ kind, rerender: true }, extra || {}); render(); };

function readAvatar(file) {
  if (!file || !/^image\//.test(file.type)) return;
  const fr = new FileReader();
  fr.onload = () => { const im = new Image(); im.onload = () => {
    const c = document.createElement("canvas"), n = 128; c.width = c.height = n; const s = Math.min(im.width, im.height);
    c.getContext("2d").drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, n, n);
    S.profile.avatar = c.toDataURL("image/jpeg", .8); pushProfile(); if (sheet) sheet.rerender = true; save(); toast(x("Фото обновлено", "Photo updated", "Η φωτογραφία ενημερώθηκε"));
  }; im.src = fr.result; };
  fr.readAsDataURL(file);
}

// Copy what is typed in the open form into the sheet state, so a re-render does not lose it.
function syncSheet() {
  if (!sheet) return;
  [["place", "lPlace"], ["place", "ePlace"], ["title", "eTitle"], ["date", "eDate"], ["etime", "eTime"], ["geoTxt", "lGeo"], ["geoTxt", "eGeo"], ["name", "shName"]].forEach(([k, id]) => { const el = document.getElementById(id); if (el) sheet[k] = el.value; });
}
// Turn a pasted Maps link / coordinates (in the Geo field or straight in the place field) into a stored point. False = invalid, stop saving.
function commitGeo() {
  const t = (sheet.geoTxt || "").trim();
  if (t) {
    const r = parseMapsText(t), g = r && cleanGeo(r);
    if (!g) { toast(x("Не нашёл место в ссылке или координатах", "No place found in the link or coordinates", "Δεν βρέθηκε μέρος στον σύνδεσμο ή τις συντεταγμένες")); return false; }
    sheet.geo = g; if (!(sheet.place || "").trim() && r.name) sheet.place = r.name; sheet.geoTxt = "";
  }
  const pl = (sheet.place || "").trim();
  if (/^https?:\/\//i.test(pl) || /^-?\d{1,2}\.\d+\s*[,; ]\s*-?\d{1,3}\.\d+$/.test(pl)) {
    const r = parseMapsText(pl), g = r && cleanGeo(r);
    if (g) { sheet.geo = g; sheet.place = r.name || x("Точка на карте", "Map point", "Σημείο στον χάρτη"); }
  }
  return true;
}
let pendingShared = null;
// Text shared into the app from Google Maps (Android "Share" menu).
function onShared(text) {
  let r = parseMapsText(text), data;
  if (r) data = { name: r.name || x("Точка на карте", "Map point", "Σημείο στον χάρτη"), geo: cleanGeo(r) };
  else { const t = String(text || "").trim(); if (t && t.length <= 80 && t.indexOf("\n") < 0 && !/https?:\/\//i.test(t)) data = { name: t, geo: undefined }; }
  if (!data) { toast(x("В этом тексте нет места из Карт", "No Maps place in that text", "Δεν υπάρχει μέρος από τους Χάρτες σε αυτό το κείμενο")); return; }
  if (sheet && sheet.kind === "consent") { pendingShared = data; return; }
  if (spinning) return;
  open("shared", data);
}

// ---------- sync (Firebase) ----------
let sy = null, syncState = SYNC_CFG ? "off" : "none", unsubs = {}, dirty = false, profT = null;
const later = () => { if (dirty) return; dirty = true; requestAnimationFrame(() => { dirty = false; persist(); render(); }); };
// The synced group the user is looking at (null for demo/local groups or when not connected).
const SG = () => { const g = G(); return sy && g.sync ? g : null; };
async function startSync() {
  if (!SYNC_CFG || sy || !S.consent || S.consent.version < CONSENT_V) return;
  try {
    const m = await import("./sync.js"); S.uid = await m.start(window.__stayka_emulator); sy = m; syncState = "on"; persist();
    Object.keys(S.groups).forEach(watchGroup); render();
  } catch (e) { syncState = "error"; render(); }
}
window.addEventListener("online", () => { if (!sy) startSync(); });
function watchGroup(k) {
  const g = S.groups[k]; if (!sy || !g || !g.sync || unsubs[k]) return;
  unsubs[k] = sy.watch(g.code, {
    group: d => { if (d && d.name) g.name = d.name; later(); },
    members: list => { const r = membersFromRemote(list, S.uid); g.members = r.members; Object.assign(S.people, r.people); later(); },
    lunch: d => { g.lunch = lunchFromRemote(d, S.uid); later(); },
    poll: d => { g.poll = pollFromRemote(d, S.uid); later(); },
    events: l => { g.events = l.map(([id, e]) => eventFromRemote(id, e, S.uid)); later(); },
    error: e => { g.syncErr = e && e.code; later(); }
  });
}
function unwatchAll() { Object.keys(unsubs).forEach(k => { try { unsubs[k](); } catch (e) {} delete unsubs[k]; }); }
function pushProfile() {
  if (!sy) return; clearTimeout(profT);
  profT = setTimeout(() => { Object.keys(S.groups).forEach(k => { const g = S.groups[k]; if (g.sync) sy.putMember(g.code, S.profile).catch(() => {}); }); }, 800);
}
// Upload a local group to the server under a fresh secret code and start watching it.
async function enableSync(k) {
  const g = S.groups[k]; if (!sy) throw new Error("offline");
  const code = makeCode();
  await sy.createGroup(code, d(g.name), S.profile,
    lunchToRemote(Object.assign({}, g.lunch, { place: d(g.lunch.place) }), S.uid),
    pollToRemote({ q: d(g.poll.q), opts: g.poll.opts.map(o => Object.assign({}, o, { name: d(o.name) })), win: g.poll.win }, S.uid),
    g.events.map(e => [e.id, eventToRemote(Object.assign({}, e, { title: d(e.title), place: d(e.place) }), S.uid)]));
  g.code = code; g.sync = true; g.members = ["me"]; persist(); watchGroup(k);
}
const offlineToast = () => toast(x("Нет связи с сервером. Проверьте интернет и попробуйте ещё раз", "No connection to the server. Check the internet and try again", "Δεν υπάρχει σύνδεση με τον διακομιστή. Ελέγξτε το διαδίκτυο και δοκιμάστε ξανά"));
const syncNote = () => {
  const g = G();
  if (g.demo) return x("Демо-компания: участники выдуманные, данные только на этом телефоне", "Demo group: the people are made up, data stays on this phone", "Demo ομάδα: τα μέλη είναι φανταστικά, τα δεδομένα μένουν στο κινητό");
  if (g.sync) return sy ? x("Компания синхронизируется между телефонами участников", "This group syncs between members' phones", "Η ομάδα συγχρονίζεται μεταξύ των κινητών των μελών") : x("Нет связи с сервером: показаны сохранённые данные", "Not connected to the server: showing saved data", "Δεν υπάρχει σύνδεση: εμφανίζονται αποθηκευμένα δεδομένα");
  return SYNC_CFG ? x("Эта компания пока только на вашем телефоне. Включите синхронизацию в «Участники и код»", "This group is on your phone only for now. Turn on sync in “Members and code”", "Η ομάδα είναι προς το παρόν μόνο στο κινητό σας. Ενεργοποιήστε τον συγχρονισμό στα «Μέλη και κωδικός»")
    : x("Данные хранятся только на этом телефоне. Синхронизация между друзьями будет позже", "Data is stored on this phone only. Sync between friends comes later", "Τα δεδομένα αποθηκεύονται μόνο σε αυτό το κινητό. Ο συγχρονισμός μεταξύ φίλων έρχεται αργότερα");
};

// ---------- actions ----------
const A = {
  group: id => { S.gid = id; save(); },
  goto: id => { S.tab = id; window.scrollTo(0, 0); save(); },
  lang: id => { lang = id; S.lang = id; if (sheet) sheet.rerender = true; save(); },
  resp: v => { const L = G().lunch; L.resp.me = L.resp.me === v ? null : v; if (!L.resp.me) delete L.resp.me; const sg = SG(); if (sg) sy.respLunch(sg.code, S.uid, L.resp.me || null).catch(() => {}); save(); if (L.resp.me === "in") toast(x("Вы идёте на обед", "You're going to lunch", "Έρχεστε στο γεύμα")); },
  newLunch: () => open("lunch", { place: "", time: "13:00" }),
  lTime: v => { syncSheet(); sheet.time = v; sheet.rerender = true; render(); },
  lSend: () => {
    syncSheet(); if (!commitGeo()) return;
    const p = (sheet.place || "").trim(); if (!p) { toast(x("Напишите, куда идём", "Write where you are going", "Γράψτε πού πάτε")); return; }
    G().lunch = { place: p, time: sheet.time || "13:00", by: "me", resp: { me: "in" }, geo: sheet.geo };
    { const sg = SG(); if (sg) sy.setLunch(sg.code, lunchToRemote(sg.lunch, S.uid)).catch(() => {}); }
    sheet = null; S.tab = "lunch"; save(); toast(x("Приглашение отправлено", "Invitation sent", "Η πρόσκληση στάλθηκε"));
  },
  vote: id => { const P = G().poll, o = P.opts.find(v => v.id === id), had = o.votes.includes("me"); P.opts.forEach(v => v.votes = v.votes.filter(u => u !== "me")); if (!had) o.votes.push("me"); P.win = null; const sg = SG(); if (sg) sy.vote(sg.code, S.uid, had ? null : id).catch(() => {}); save(); },
  addOpt: () => { const el = $("#newOpt"), v = el.value.trim(); if (!v) { toast(x("Впишите вариант", "Type an option", "Γράψτε μια επιλογή")); return; } const r = parseMapsText(v), o = { id: uid(), name: v, votes: [] }; if (r && (r.url || r.lat !== undefined)) { o.name = r.name || x("Точка на карте", "Map point", "Σημείο στον χάρτη"); o.geo = cleanGeo(r); } G().poll.opts.push(o); { const sg = SG(); if (sg) sy.addOpt(sg.code, { id: o.id, name: d(o.name), geo: o.geo }).catch(() => {}); } el.value = ""; save(); },
  wheel: () => { wheelPick = null; open("wheel"); },
  spin: () => {
    if (spinning) return; const opts = G().poll.opts, n = opts.length, step = 360 / n, w = document.getElementById("wheel"); if (!w) return;
    spinning = true; wheelRot += 360 * 5 + Math.floor(Math.random() * 360); w.style.transform = `rotate(${wheelRot}deg)`;
    setTimeout(() => {
      const a = wheelRot % 360, idx = Math.floor(((360 - a) % 360) / step); wheelPick = d(opts[idx].name); G().poll.win = wheelPick; spinning = false; persist(); { const sg = SG(); if (sg) sy.setWin(sg.code, wheelPick).catch(() => {}); }
      const r = document.getElementById("wres"); if (r) { r.className = "winner"; r.textContent = x("Выпало", "Result", "Αποτέλεσμα") + ": " + wheelPick; }
    }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 4100);
  },
  newEvent: () => open("event"),
  eSave: () => {
    syncSheet(); if (!commitGeo()) return;
    const t = (sheet.title || "").trim(), p = (sheet.place || "").trim(), dt = sheet.date, tm = sheet.etime;
    if (!t || !dt) { toast(x("Нужны название и дата", "Title and date are required", "Απαιτούνται τίτλος και ημερομηνία")); return; }
    const evId = uid(); G().events.push({ id: evId, by: "me", title: t, place: p || x("Место уточняется", "Place to be confirmed", "Το μέρος θα οριστεί"), date: dt, time: tm || "19:00", rsvp: { me: "yes" }, geo: sheet.geo }); { const sg = SG(); if (sg) sy.setEvent(sg.code, evId, eventToRemote(sg.events[sg.events.length - 1], S.uid)).catch(() => {}); } sheet = null; save(); toast(x("Событие создано", "Event created", "Η εκδήλωση δημιουργήθηκε"));
  },
  rsvp: (id, v) => { const e = G().events.find(z => z.id === id); e.rsvp.me = e.rsvp.me === v ? null : v; if (!e.rsvp.me) delete e.rsvp.me; const sg = SG(); if (sg) sy.rsvp(sg.code, id, S.uid, e.rsvp.me || null).catch(() => {}); save(); },
  dry: () => { S.dry = !S.dry; save(); },
  game: id => { if (isAdult(id) && !S.adult) { open("age", { next: id }); return; } open("game", { id, deck: shuffle(cardsOf(id).length), pos: 0, show: false }); },
  ageYes: () => { S.adult = true; persist(); const n = sheet.next; open("game", { id: n, deck: shuffle(cardsOf(n).length), pos: 0, show: false }); },
  showAns: () => { sheet.show = true; sheet.rerender = true; render(); },
  nextCard: () => { sheet.pos++; sheet.show = false; const n = cardsOf(sheet.id).length; if (sheet.pos % n === 0) sheet.deck = shuffle(n); sheet.rerender = true; render(); },
  profile: () => open("profile", { confirmDel: false }),
  policy: () => open("policy"),
  myData: () => open("mydata"),
  copyData: () => { const ta = $("#dump"); ta.select(); const ok = () => toast(x("Скопировано", "Copied", "Αντιγράφηκε")); try { navigator.clipboard.writeText(ta.value).then(ok, () => { try { document.execCommand("copy"); ok(); } catch (e) {} }); } catch (e) { try { document.execCommand("copy"); ok(); } catch (e2) {} } },
  avDel: () => { S.profile.avatar = ""; pushProfile(); sheet.rerender = true; save(); },
  push: () => { if (S.consent) { S.consent.push = !S.consent.push; sheet.rerender = true; save(); } },
  adultToggle: () => { S.adult = !S.adult; sheet.rerender = true; save(); },
  delAll: async () => {
    if (!sheet.confirmDel) { sheet.confirmDel = true; sheet.rerender = true; render(); return; }
    if (sy) {
      try { unwatchAll(); await sy.deleteAccount(Object.keys(S.groups).filter(k => S.groups[k].sync).map(k => S.groups[k].code)); sy = null; syncState = "off"; }
      catch (e) { Object.keys(S.groups).forEach(watchGroup); offlineToast(); return; }
    }
    LS.set(KEY, ""); const keepLang = lang; S = seed(); fix(); S.lang = keepLang; lang = keepLang; wheelPick = null; wheelRot = 0;
    sheet = { kind: "consent", age: false, data: false, push: false, rerender: true }; render(); toast(x("Все ваши данные удалены", "All your data was deleted", "Όλα τα δεδομένα σας διαγράφηκαν"));
  },
  consentGo: () => { if (!(sheet.age && sheet.data)) return; S.consent = { ts: Date.now(), version: CONSENT_V, push: !!sheet.push }; sheet = null; save(); startSync(); if (pendingShared) { const ps = pendingShared; pendingShared = null; open("shared", ps); } },
  pal: id => { S.theme.pal = id; sheet.rerender = true; save(); },
  mode: id => { S.theme.mode = id; sheet.rerender = true; save(); },
  // maps
  mapOpen: id => { const t = mapTarget(id); if (t) ext(mapUrl(t.geo, t.label)); },
  mapRoute: id => { const t = mapTarget(id); if (t) ext(routeUrl(t.geo, t.label)); },
  mapShare: id => {
    const t = mapTarget(id); if (!t) return;
    const c = t.geo && t.geo.lat !== undefined ? " (" + t.geo.lat + ", " + t.geo.lng + ")" : "";
    share({ title: t.title || t.label, text: (t.title ? t.title + " — " : "") + t.label + c + "\n" + mapUrl(t.geo, t.label) });
  },
  mapFind: () => { syncSheet(); const v = (sheet.place || "").trim(); ext(v && !/^https?:\/\//i.test(v) ? searchUrl(v) : "https://www.google.com/maps"); },
  geoApply: () => {
    syncSheet(); const r = parseMapsText(sheet.geoTxt), g = r && cleanGeo(r);
    if (!g) { toast(x("Не нашёл место в этом тексте. Нужна ссылка Google Карт или координаты", "No place found in that text. Use a Google Maps link or coordinates", "Δεν βρέθηκε μέρος. Χρησιμοποιήστε σύνδεσμο Google Maps ή συντεταγμένες")); return; }
    sheet.geo = g; if (!(sheet.place || "").trim() && r.name) sheet.place = r.name; sheet.geoTxt = ""; sheet.rerender = true; render(); toast(x("Точка на карте выбрана", "Map point selected", "Το σημείο επιλέχθηκε"));
  },
  geoClear: () => { syncSheet(); sheet.geo = undefined; sheet.rerender = true; render(); },
  shMap: () => { syncSheet(); ext(mapUrl(sheet.geo, sheet.name)); },
  shLunch: () => { syncSheet(); open("lunch", { place: sheet.name, time: "13:00", geo: sheet.geo }); },
  shEvent: () => { syncSheet(); open("event", { place: sheet.name, geo: sheet.geo }); },
  shOpt: () => {
    syncSheet(); const o = { id: uid(), name: sheet.name || x("Точка на карте", "Map point", "Σημείο στον χάρτη"), votes: [] }; if (sheet.geo) o.geo = sheet.geo;
    G().poll.opts.push(o); { const sg = SG(); if (sg) sy.addOpt(sg.code, { id: o.id, name: o.name, geo: o.geo }).catch(() => {}); } sheet = null; S.tab = "poll"; save(); toast(x("Добавлено в голосование", "Added to the poll", "Προστέθηκε στην ψηφοφορία"));
  },
  // groups
  newGroup: () => open("newgroup"),
  gCreate: async () => {
    const name = ($("#gName").value || "").trim(); if (!name) { toast(x("Назовите компанию", "Name the group", "Δώστε όνομα στην ομάδα")); return; }
    const id = uid(); S.groups[id] = { name, code: makeCode(), members: ["me"], lunch: { place: "", time: "13:00", by: null, resp: {} }, poll: { q: X("Куда пойдём?", "Where shall we go?", "Πού πάμε;"), opts: [], win: null }, events: [] };
    if (SYNC_CFG) { try { await enableSync(id); } catch (e) { toast(x("Компания создана только на телефоне: нет связи с сервером. Включите синхронизацию позже", "Group created on this phone only: no connection. Turn on sync later", "Η ομάδα δημιουργήθηκε μόνο στο κινητό: δεν υπάρχει σύνδεση. Ενεργοποιήστε τον συγχρονισμό αργότερα")); } }
    S.gid = id; S.tab = "today"; sheet = { kind: "group", rerender: true }; save(); if (!SYNC_CFG) toast(x("Компания создана", "Group created", "Η ομάδα δημιουργήθηκε"));
  },
  gJoin: async () => {
    const code = ($("#jCode").value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length !== CODE_LEN) { toast(x("Код состоит из " + CODE_LEN + " символов", "The code has " + CODE_LEN + " characters", "Ο κωδικός έχει " + CODE_LEN + " χαρακτήρες")); return; }
    let id = Object.keys(S.groups).find(k => S.groups[k].code === code);
    if (!id) {
      const blank = () => ({ lunch: { place: "", time: "13:00", by: null, resp: {} }, poll: { q: "", opts: [], win: null }, events: [], members: ["me"] });
      if (SYNC_CFG) {
        if (!sy) { offlineToast(); return; }
        try { await sy.joinGroup(code, S.profile); } catch (e) { if (e && e.code === "not-found") toast(x("Компания с таким кодом не найдена", "No group with that code", "Δεν βρέθηκε ομάδα με αυτόν τον κωδικό")); else offlineToast(); return; }
        id = uid(); S.groups[id] = Object.assign(blank(), { name: x("Компания ", "Group ", "Ομάδα ") + code, code, sync: true }); watchGroup(id);
      } else { id = uid(); S.groups[id] = Object.assign(blank(), { name: x("Компания ", "Group ", "Ομάδα ") + code, code, joined: true, poll: { q: X("Куда пойдём?", "Where shall we go?", "Πού πάμε;"), opts: [], win: null } }); }
    }
    S.gid = id; S.tab = "today"; sheet = null; save(); toast(x("Вы в компании", "You are in the group", "Είστε στην ομάδα"));
  },
  gSync: async () => {
    const k = S.gid; try { await enableSync(k); sheet.rerender = true; save(); toast(x("Синхронизация включена", "Sync is on", "Ο συγχρονισμός ενεργοποιήθηκε")); } catch (e) { offlineToast(); }
  },
  group: () => open("group", { confirmGDel: false }),
  gInvite: () => { const g = G(); if (SYNC_CFG && !g.sync) { toast(x("Сначала включите синхронизацию: «Участники и код»", "Turn on sync first: “Members and code”", "Ενεργοποιήστε πρώτα τον συγχρονισμό: «Μέλη και κωδικός»")); if (!sheet) A.group(); return; } share({ title: d(g.name), text: inviteText(g) }); },
  gCopy: () => { const c = G().code, ok = () => toast(x("Код скопирован", "Code copied", "Ο κωδικός αντιγράφηκε")); try { navigator.clipboard.writeText(c).then(ok, () => {}); } catch (e) {} },
  gDel: async () => {
    if (Object.keys(S.groups).length < 2) { toast(x("Нужна хотя бы одна компания: сначала создайте другую", "You need at least one group: create another first", "Χρειάζεται τουλάχιστον μία ομάδα: δημιουργήστε πρώτα άλλη")); return; }
    if (!sheet.confirmGDel) { sheet.confirmGDel = true; sheet.rerender = true; render(); return; }
    const k = S.gid, g = S.groups[k];
    if (g.sync) { if (!sy) { offlineToast(); return; } try { await sy.leave(g.code); } catch (e) { offlineToast(); return; } if (unsubs[k]) { unsubs[k](); delete unsubs[k]; } }
    delete S.groups[k]; S.gid = Object.keys(S.groups)[0]; sheet = null; save(); toast(x("Вы вышли из компании", "You left the group", "Αποχωρήσατε από την ομάδα"));
  },
  close: () => { if (spinning || (sheet && sheet.kind === "consent")) return; sheet = null; save(); },
  scrim: () => {}
};
document.addEventListener("click", ev => {
  const b = ev.target.closest("[data-act]"); if (!b) return;
  if (b.dataset.act === "scrim") { if (ev.target === b) A.close(); return; }
  const f = A[b.dataset.act]; if (f) f(b.dataset.id || b.dataset.v, b.dataset.v);
});
document.addEventListener("change", ev => {
  const id = ev.target.id;
  if (id === "avFile") { readAvatar(ev.target.files && ev.target.files[0]); return; }
  if (!sheet || sheet.kind !== "consent") return;
  if (id === "cAge") sheet.age = ev.target.checked; else if (id === "cData") sheet.data = ev.target.checked; else if (id === "cPush") sheet.push = ev.target.checked; else return;
  const go = $("#cGo"); if (go) go.disabled = !(sheet.age && sheet.data);
});
document.addEventListener("input", ev => {
  if (ev.target.id === "pName") { S.profile.name = ev.target.value.slice(0, 20); persist(); pushProfile(); }
  if (ev.target.id === "gRen" && ev.target.value.trim()) { const g = G(); g.name = ev.target.value.slice(0, 40); persist(); if (sy && g.sync) { clearTimeout(profT); profT = setTimeout(() => sy.renameGroup(g.code, g.name).catch(() => {}), 800); } }
});

// Swipe a sheet down to close it (works when the sheet is scrolled to the top; the handle at the top also closes it with a tap).
let drag = null;
document.addEventListener("touchstart", ev => {
  const el = ev.target.closest && ev.target.closest(".sheet");
  drag = el && sheet && sheet.kind !== "consent" && el.scrollTop <= 0 && ev.touches.length === 1 ? { y: ev.touches[0].clientY, el, dy: 0, on: false } : null;
}, { passive: true });
document.addEventListener("touchmove", ev => {
  if (!drag) return;
  const dy = ev.touches[0].clientY - drag.y;
  if (!drag.on && dy < -6) { drag = null; return; }
  if (!drag.on && dy < 8) return;
  if (!drag.on && drag.el.scrollTop > 0) { drag = null; return; }
  drag.on = true; drag.dy = dy; drag.el.style.transition = "none"; drag.el.style.transform = `translateY(${Math.max(0, dy)}px)`;
  if (ev.cancelable) ev.preventDefault();
}, { passive: false });
function endDrag() {
  if (!drag) return; const { el, dy, on } = drag; drag = null; if (!on) return;
  el.style.transition = "transform .2s";
  if (dy > 110) { el.style.transform = "translateY(100%)"; setTimeout(() => { A.close(); if (el.isConnected) el.style.transform = ""; }, 160); } else el.style.transform = "";
}
document.addEventListener("touchend", endDrag); document.addEventListener("touchcancel", endDrag);
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && sheet) A.close(); if (ev.key === "Enter" && ev.target.id === "newOpt") A.addOpt(); });
render();
startSync();

// Native bits (Android back button). Loaded lazily so the app also runs in a plain browser.
import("./native.js").then(m => m.init({ onShared, close: () => A.close(), isOpen: () => !!sheet && sheet.kind !== "consent", home: () => S.tab !== "today" ? A.goto("today") : false })).catch(() => {});
