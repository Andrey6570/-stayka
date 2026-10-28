import { GAMES, CATS, LI, cardsOf, isAdult, cardText } from "./games.js";


const $ = s => document.querySelector(s);
const KEY = "stayka-v2";
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
const pname = id => id === "me" ? ((S.profile && S.profile.name) || x("Вы", "You", "Εσύ")) : pick(PEOPLE[id].n);
const av = id => {
  if (id === "me" && S.profile && S.profile.avatar) return `<img class="av" src="${S.profile.avatar}" alt="">`;
  return `<span class="av" style="background:${PEOPLE[id].c}">${esc(Array.from(pname(id))[0] || "?")}</span>`;
};
const TIMES = ["12:30", "13:00", "13:30", "14:00"];

// ---------- seed ----------
function seed() {
  return {
    v: 2, gid: "office", tab: "today", lang, adult: false, dry: true, consent: null, profile: { name: "", avatar: "" },
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
S.lang = lang;
const G = () => S.groups[S.gid];
const persist = () => LS.set(KEY, JSON.stringify(S));
const save = () => { persist(); render(); };
let sheet = S.consent ? null : { kind: "consent", age: false, data: false, push: false, rerender: true };
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
  return `<div class="card"><div class="eyebrow">${x("Голосование", "Poll", "Ψηφοφορία")}</div><h2>${esc(d(P.q))}</h2>
    <div style="display:flex;flex-direction:column;gap:8px">${P.opts.map(o => `<button class="opt ${o.votes.includes("me") ? "mine" : ""}" data-act="vote" data-id="${o.id}"><span class="fill" style="width:${o.votes.length / tot * 100}%"></span><span class="nm">${esc(d(o.name))}</span><span class="faces" style="gap:2px;flex-wrap:nowrap">${o.votes.map(av).join("")}</span><span class="count">${o.votes.length}</span></button>`).join("")}</div>
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
    + (up ? `<div class="card"><div class="eyebrow">${x("Ближайшее событие", "Next event", "Επόμενη εκδήλωση")}</div><h3>${esc(d(up.title))}</h3><div class="muted">${esc(fmtDate(up.date).w)}, ${esc(up.time)} · ${esc(d(up.place))}</div><div class="muted">${x("Идут", "Going", "Έρχονται")}: ${Object.values(up.rsvp).filter(v => v === "yes").length}</div><button class="btn ghost" data-act="goto" data-id="events">${x("Все события", "All events", "Όλες οι εκδηλώσεις")}</button></div>` : "")
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
    [x("Какие данные", "What data", "Ποια δεδομένα"), x("Имя, фото (по желанию), ваши ответы в группах (обед, голосования, события) и настройки. Мы не собираем геолокацию, контакты телефона и рекламные идентификаторы.", "Name, photo (optional), your answers in groups (lunch, polls, events) and settings. We do not collect location, phone contacts or advertising IDs.", "Όνομα, φωτογραφία (προαιρετικά), οι απαντήσεις σας στις ομάδες (γεύμα, ψηφοφορίες, εκδηλώσεις) και ρυθμίσεις. Δεν συλλέγουμε τοποθεσία, επαφές τηλεφώνου ή διαφημιστικά αναγνωριστικά.")],
    [x("Зачем и на каком основании", "Why and on what basis", "Γιατί και με ποια νομική βάση"), x("Чтобы приложение работало для вашей группы. Основание: ваше согласие (ст. 6(1)(a) GDPR) и предоставление сервиса. Согласие можно отозвать в любой момент.", "To run the app for your group. Basis: your consent (Art. 6(1)(a) GDPR) and providing the service. You can withdraw consent at any time.", "Για να λειτουργεί η εφαρμογή για την ομάδα σας. Βάση: η συγκατάθεσή σας (άρθρο 6(1)(α) GDPR) και η παροχή της υπηρεσίας. Μπορείτε να την ανακαλέσετε οποιαδήποτε στιγμή.")],
    [x("Игры", "Games", "Παιχνίδια"), x("Вопросы и ответы в играх не записываются и никуда не передаются. Возраст подтверждается вашей отметкой, мы не просим документов.", "Questions and answers in games are not recorded or sent anywhere. Age is confirmed by your own tick; we ask for no documents.", "Οι ερωτήσεις και οι απαντήσεις στα παιχνίδια δεν καταγράφονται ούτε αποστέλλονται πουθενά. Η ηλικία επιβεβαιώνεται με δική σας δήλωση, δεν ζητάμε έγγραφα.")],
    [x("Кто что видит", "Who sees what", "Ποιος βλέπει τι"), x("Сейчас никто, кроме вас: всё хранится на вашем телефоне. Участники демо-групп выдуманные.", "Right now nobody but you: everything is kept on your phone. The people in the demo groups are made up.", "Προς το παρόν κανείς εκτός από εσάς: όλα αποθηκεύονται στο κινητό σας. Τα μέλη των δοκιμαστικών ομάδων είναι φανταστικά.")],
    [x("Срок хранения", "Retention", "Διάρκεια αποθήκευσης"), x("Пока вы не удалите профиль или приложение. Данные лежат только на телефоне и на наши серверы не передаются. Когда появится синхронизация между друзьями, мы обновим эту политику и снова спросим согласие.", "Until you delete your profile or the app. Data stays on your phone only and is not sent to our servers. When sync between friends arrives, we will update this notice and ask for consent again.", "Μέχρι να διαγράψετε το προφίλ ή την εφαρμογή. Τα δεδομένα μένουν μόνο στο κινητό και δεν στέλνονται στους διακομιστές μας. Όταν προστεθεί συγχρονισμός μεταξύ φίλων, θα ενημερώσουμε αυτή την πολιτική και θα ζητήσουμε ξανά συγκατάθεση.")],
    [x("Ваши права", "Your rights", "Τα δικαιώματά σας"), x("Доступ, исправление, удаление, перенос, ограничение обработки, возражение и отзыв согласия. Всё это есть в профиле. Можно пожаловаться в надзорный орган вашей страны.", "Access, rectification, erasure, portability, restriction, objection and withdrawal of consent. All are available in your profile. You can complain to your national supervisory authority.", "Πρόσβαση, διόρθωση, διαγραφή, φορητότητα, περιορισμός, εναντίωση και ανάκληση συγκατάθεσης. Όλα διατίθενται στο προφίλ σας. Μπορείτε να υποβάλετε καταγγελία στην εποπτική αρχή της χώρας σας.")],
    [x("Третьи лица", "Third parties", "Τρίτοι"), x("Мы не продаём данные, не показываем рекламу и не строим профили. Приложение никому ничего не отправляет: шрифты встроены, аналитики и рекламных SDK нет.", "We do not sell data, show ads or build profiles. The app sends nothing to anyone: fonts are built in, and there is no analytics or advertising SDK.", "Δεν πουλάμε δεδομένα, δεν δείχνουμε διαφημίσεις και δεν δημιουργούμε προφίλ. Η εφαρμογή δεν στέλνει τίποτα σε κανέναν: οι γραμματοσειρές είναι ενσωματωμένες και δεν υπάρχει analytics ή διαφημιστικό SDK.")]
  ];
}
const policyHtml = () => `<div class="pl">${policy().map(([h, p]) => `<div><b>${h}</b><p>${p}</p></div>`).join("")}</div>`;
const langBtns = () => `<div class="langs">${[["ru", "Русский"], ["en", "English"], ["el", "Ελληνικά"]].map(([k, n]) => `<button class="btn ghost ${k === lang ? "sel" : ""}" data-act="lang" data-id="${k}">${n}</button>`).join("")}</div>`;
function sConsent() {
  const ok = sheet.age && sheet.data;
  return `<h2>${x("Добро пожаловать", "Welcome", "Καλώς ήρθατε")}</h2>${langBtns()}
    <p class="muted">${x("Прежде чем начать, коротко о ваших данных. Мы собираем только то, что нужно для работы групп.", "Before you start, a short note on your data. We only collect what groups need to work.", "Πριν ξεκινήσετε, μια σύντομη ενημέρωση. Συλλέγουμε μόνο ό,τι χρειάζονται οι ομάδες για να λειτουργούν.")}</p>
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
  return JSON.stringify({ exportedAt: new Date().toISOString(), profile: { name: S.profile.name, hasAvatar: !!S.profile.avatar, language: lang }, consent: S.consent, adultConfirmed: S.adult, alcoholFreeMode: S.dry, activity: mine }, null, 2);
}
const sMyData = () => `<h2>${x("Мои данные", "My data", "Τα δεδομένα μου")}</h2><p class="muted">${x("Всё, что приложение хранит о вас, в машиночитаемом виде (JSON). Скопируйте и сохраните. Ответы в играх не хранятся.", "Everything the app stores about you in a machine-readable format (JSON). Copy and save it. Game answers are not stored.", "Όλα όσα αποθηκεύει η εφαρμογή για εσάς σε μορφή JSON. Αντιγράψτε και αποθηκεύστε. Οι απαντήσεις στα παιχνίδια δεν αποθηκεύονται.")}</p><textarea id="dump" readonly>${esc(exportData())}</textarea><button class="btn" data-act="copyData">${x("Копировать", "Copy", "Αντιγραφή")}</button><button class="btn ghost" data-act="profile">${x("Назад", "Back", "Πίσω")}</button>`;

// ---------- sheets ----------
function sLunch() {
  const t = sheet.time || "13:00";
  return `<h2>${x("Позвать на обед", "Invite to lunch", "Πρόσκληση σε γεύμα")}</h2><label for="lPlace">${x("Куда идём", "Where to", "Πού πάμε")}<input type="text" id="lPlace" maxlength="50" placeholder="${x("Например, столовая на углу", "For example, the canteen on the corner", "Π.χ. η καντίνα στη γωνία")}" value="${esc(sheet.place || "")}"></label>
    <div><div class="muted" style="margin-bottom:6px">${x("Во сколько", "What time", "Τι ώρα")}</div><div class="btns">${TIMES.map(v => `<button class="btn ghost ${v === t ? "sel" : ""}" data-act="lTime" data-v="${v}">${v}</button>`).join("")}</div></div>
    <button class="btn" data-act="lSend">${x("Отправить группе", "Send to the group", "Αποστολή στην ομάδα")}</button><button class="btn ghost" data-act="close">${x("Отмена", "Cancel", "Ακύρωση")}</button>`;
}
const sEvent = () => `<h2>${x("Новое событие", "New event", "Νέα εκδήλωση")}</h2>
    <label for="eTitle">${x("Название", "Title", "Τίτλος")}<input type="text" id="eTitle" maxlength="40" placeholder="${x("Например, квиз в пабе", "For example, pub quiz", "Π.χ. κουίζ σε παμπ")}"></label>
    <label for="ePlace">${x("Место", "Place", "Μέρος")}<input type="text" id="ePlace" maxlength="50" placeholder="${x("Бар, ресторан или адрес", "Bar, restaurant or address", "Μπαρ, εστιατόριο ή διεύθυνση")}"></label>
    <div class="addrow"><label for="eDate" class="grow">${x("Дата", "Date", "Ημερομηνία")}<input type="date" id="eDate" value="${iso(3)}"></label><label for="eTime" class="grow">${x("Время", "Time", "Ώρα")}<input type="time" id="eTime" value="19:00"></label></div>
    <button class="btn" data-act="eSave">${x("Создать", "Create", "Δημιουργία")}</button><button class="btn ghost" data-act="close">${x("Отмена", "Cancel", "Ακύρωση")}</button>`;
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
  $("#logo").innerHTML = x("стая", "pack", "παρέα") + "<i>.</i>";
  $("#foot").textContent = x("Данные хранятся только на этом телефоне. Синхронизация между друзьями будет позже", "Data is stored on this phone only. Sync between friends comes later", "Τα δεδομένα αποθηκεύονται μόνο σε αυτό το κινητό. Ο συγχρονισμός μεταξύ φίλων έρχεται αργότερα");
  $("#meBtn").innerHTML = av("me"); $("#meBtn").setAttribute("aria-label", x("Профиль и приватность", "Profile and privacy", "Προφίλ και απόρρητο"));
  $("#groups").innerHTML = Object.keys(S.groups).map(id => `<button class="gchip ${id === S.gid ? "on" : ""}" data-act="group" data-id="${id}">${esc(d(S.groups[id].name))}</button>`).join("");
  $("#tabs").innerHTML = tabs().map(([id, nm]) => `<button class="tab ${id === S.tab ? "on" : ""}" data-act="goto" data-id="${id}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[id]}</svg>${nm}</button>`).join("");
  const views = { today: vToday, lunch: vLunch, poll: vPoll, events: vEvents, games: vGames }, keep = $("#newOpt") ? $("#newOpt").value : "";
  $("#view").innerHTML = views[S.tab]();
  if ($("#newOpt")) $("#newOpt").value = keep;
  $("#fabHost").innerHTML = S.tab === "events" ? `<button class="fab" data-act="newEvent">+ ${x("Событие", "Event", "Εκδήλωση")}</button>` : "";
  if (sheet) {
    if (!$("#sheetHost .scrim") || sheet.rerender) {
      const bodies = { consent: sConsent, profile: sProfile, policy: sPolicy, mydata: sMyData, age: sAge, game: sGame, lunch: sLunch, event: sEvent, wheel: sWheel };
      $("#sheetHost").innerHTML = `<div class="scrim" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true">${bodies[sheet.kind]()}</div></div>`;
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
    S.profile.avatar = c.toDataURL("image/jpeg", .8); if (sheet) sheet.rerender = true; save(); toast(x("Фото обновлено", "Photo updated", "Η φωτογραφία ενημερώθηκε"));
  }; im.src = fr.result; };
  fr.readAsDataURL(file);
}

// ---------- actions ----------
const A = {
  group: id => { S.gid = id; save(); },
  goto: id => { S.tab = id; window.scrollTo(0, 0); save(); },
  lang: id => { lang = id; S.lang = id; if (sheet) sheet.rerender = true; save(); },
  resp: v => { const L = G().lunch; L.resp.me = L.resp.me === v ? null : v; if (!L.resp.me) delete L.resp.me; save(); if (L.resp.me === "in") toast(x("Вы идёте на обед", "You're going to lunch", "Έρχεστε στο γεύμα")); },
  newLunch: () => open("lunch", { place: "", time: "13:00" }),
  lTime: v => { const p = $("#lPlace"); sheet.place = p ? p.value : ""; sheet.time = v; sheet.rerender = true; render(); },
  lSend: () => {
    const p = $("#lPlace").value.trim(); if (!p) { toast(x("Напишите, куда идём", "Write where you are going", "Γράψτε πού πάτε")); return; }
    G().lunch = { place: p, time: sheet.time || "13:00", by: "me", resp: { me: "in" } }; sheet = null; S.tab = "lunch"; save(); toast(x("Приглашение отправлено", "Invitation sent", "Η πρόσκληση στάλθηκε"));
  },
  vote: id => { const P = G().poll, o = P.opts.find(v => v.id === id), had = o.votes.includes("me"); P.opts.forEach(v => v.votes = v.votes.filter(u => u !== "me")); if (!had) o.votes.push("me"); P.win = null; save(); },
  addOpt: () => { const el = $("#newOpt"), v = el.value.trim(); if (!v) { toast(x("Впишите вариант", "Type an option", "Γράψτε μια επιλογή")); return; } G().poll.opts.push({ id: uid(), name: v, votes: [] }); el.value = ""; save(); },
  wheel: () => { wheelPick = null; open("wheel"); },
  spin: () => {
    if (spinning) return; const opts = G().poll.opts, n = opts.length, step = 360 / n, w = document.getElementById("wheel"); if (!w) return;
    spinning = true; wheelRot += 360 * 5 + Math.floor(Math.random() * 360); w.style.transform = `rotate(${wheelRot}deg)`;
    setTimeout(() => {
      const a = wheelRot % 360, idx = Math.floor(((360 - a) % 360) / step); wheelPick = d(opts[idx].name); G().poll.win = wheelPick; spinning = false; persist();
      const r = document.getElementById("wres"); if (r) { r.className = "winner"; r.textContent = x("Выпало", "Result", "Αποτέλεσμα") + ": " + wheelPick; }
    }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 4100);
  },
  newEvent: () => open("event"),
  eSave: () => {
    const t = $("#eTitle").value.trim(), p = $("#ePlace").value.trim(), dt = $("#eDate").value, tm = $("#eTime").value;
    if (!t || !dt) { toast(x("Нужны название и дата", "Title and date are required", "Απαιτούνται τίτλος και ημερομηνία")); return; }
    G().events.push({ id: uid(), title: t, place: p || x("Место уточняется", "Place to be confirmed", "Το μέρος θα οριστεί"), date: dt, time: tm || "19:00", rsvp: { me: "yes" } }); sheet = null; save(); toast(x("Событие создано", "Event created", "Η εκδήλωση δημιουργήθηκε"));
  },
  rsvp: (id, v) => { const e = G().events.find(z => z.id === id); e.rsvp.me = e.rsvp.me === v ? null : v; if (!e.rsvp.me) delete e.rsvp.me; save(); },
  dry: () => { S.dry = !S.dry; save(); },
  game: id => { if (isAdult(id) && !S.adult) { open("age", { next: id }); return; } open("game", { id, deck: shuffle(cardsOf(id).length), pos: 0, show: false }); },
  ageYes: () => { S.adult = true; persist(); const n = sheet.next; open("game", { id: n, deck: shuffle(cardsOf(n).length), pos: 0, show: false }); },
  showAns: () => { sheet.show = true; sheet.rerender = true; render(); },
  nextCard: () => { sheet.pos++; sheet.show = false; const n = cardsOf(sheet.id).length; if (sheet.pos % n === 0) sheet.deck = shuffle(n); sheet.rerender = true; render(); },
  profile: () => open("profile", { confirmDel: false }),
  policy: () => open("policy"),
  myData: () => open("mydata"),
  copyData: () => { const ta = $("#dump"); ta.select(); const ok = () => toast(x("Скопировано", "Copied", "Αντιγράφηκε")); try { navigator.clipboard.writeText(ta.value).then(ok, () => { try { document.execCommand("copy"); ok(); } catch (e) {} }); } catch (e) { try { document.execCommand("copy"); ok(); } catch (e2) {} } },
  avDel: () => { S.profile.avatar = ""; sheet.rerender = true; save(); },
  push: () => { if (S.consent) { S.consent.push = !S.consent.push; sheet.rerender = true; save(); } },
  adultToggle: () => { S.adult = !S.adult; sheet.rerender = true; save(); },
  delAll: () => {
    if (!sheet.confirmDel) { sheet.confirmDel = true; sheet.rerender = true; render(); return; }
    LS.set(KEY, ""); const keepLang = lang; S = seed(); S.lang = keepLang; lang = keepLang; wheelPick = null; wheelRot = 0;
    sheet = { kind: "consent", age: false, data: false, push: false, rerender: true }; render(); toast(x("Все ваши данные удалены", "All your data was deleted", "Όλα τα δεδομένα σας διαγράφηκαν"));
  },
  consentGo: () => { if (!(sheet.age && sheet.data)) return; S.consent = { ts: Date.now(), version: 1, push: !!sheet.push }; sheet = null; save(); },
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
document.addEventListener("input", ev => { if (ev.target.id === "pName") { S.profile.name = ev.target.value.slice(0, 20); persist(); } });
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && sheet) A.close(); if (ev.key === "Enter" && ev.target.id === "newOpt") A.addOpt(); });
render();

// Native bits (Android back button). Loaded lazily so the app also runs in a plain browser.
import("./native.js").then(m => m.init({ close: () => A.close(), isOpen: () => !!sheet && sheet.kind !== "consent", home: () => S.tab !== "today" ? A.goto("today") : false })).catch(() => {});
