import test from "node:test";
import assert from "node:assert/strict";
import { GAMES, CATS } from "../src/games.js";

const LANGS = ["ru", "en", "el"];

test("every game has 150 cards in three languages", () => {
  for (const [id, g] of Object.entries(GAMES)) {
    assert.ok(g.cards.length >= 150, id + " must have at least 150 cards");
    for (const [i, c] of g.cards.entries()) {
      assert.equal(c.length, 3, id + " card " + i + " must have ru, en, el");
      for (const part of c) {
        if (g.taboo) { assert.ok(Array.isArray(part) && part.length === 4 && part.every(s => typeof s === "string" && s.trim()), id + " card " + i); }
        else if (g.trivia) { assert.ok(Array.isArray(part) && part.length === 2 && part.every(s => typeof s === "string" && s.trim()), id + " card " + i); }
        else assert.ok(typeof part === "string" && part.trim(), id + " card " + i);
      }
    }
  }
});

test("no duplicate cards inside a game", () => {
  for (const [id, g] of Object.entries(GAMES)) {
    const seen = new Set();
    for (const c of g.cards) {
      const key = JSON.stringify(c[1]).toLowerCase();
      assert.ok(!seen.has(key), id + " duplicate: " + key);
      seen.add(key);
    }
  }
});

test("games, names and categories are complete", () => {
  const listed = CATS.flatMap(c => c.ids);
  assert.deepEqual([...listed].sort(), Object.keys(GAMES).sort());
  for (const g of Object.values(GAMES)) for (const l of LANGS) assert.ok(g.name[l] && g.desc[l], "name or description missing: " + l);
});

import { parseMapsText, safeMapsUrl, mapUrl, routeUrl, cleanGeo } from "../src/maps.js";
import { PALETTES } from "../src/themes.js";

test("maps: coordinates and links are parsed", () => {
  assert.deepEqual(parseMapsText("37.9838, 23.7275"), { name: "", lat: 37.9838, lng: 23.7275, url: "" });
  const a = parseMapsText("Acropolis\nAthens 105 58\nhttps://www.google.com/maps/place/Acropolis/@37.9715,23.7257,17z/data=!3m1");
  assert.equal(a.name, "Acropolis"); assert.equal(a.lat, 37.9715); assert.equal(a.lng, 23.7257);
  const b = parseMapsText("https://www.google.com/maps/search/?api=1&query=40.64%2C22.94");
  assert.equal(b.lat, 40.64); assert.equal(b.lng, 22.94);
  const c = parseMapsText("Bar Cellar\nhttps://maps.app.goo.gl/AbCdEf123");
  assert.equal(c.name, "Bar Cellar"); assert.equal(c.lat, undefined); assert.equal(c.url, "https://maps.app.goo.gl/AbCdEf123");
});

test("maps: junk and unsafe links are rejected", () => {
  assert.equal(parseMapsText("hello there"), null);
  assert.equal(parseMapsText("95.0, 23.0"), null);
  assert.equal(safeMapsUrl("javascript:alert(1)"), "");
  assert.equal(safeMapsUrl("http://www.google.com/maps/x"), "");
  assert.equal(safeMapsUrl("https://evil.example/maps/x"), "");
  assert.equal(safeMapsUrl("https://www.google.com/search?q=x"), "");
  assert.equal(safeMapsUrl("https://google.com.evil.example/maps"), "");
  assert.equal(cleanGeo({ lat: 1, lng: 200 }), undefined);
  assert.equal(cleanGeo({ url: "https://evil.example/" }), undefined);
});

test("maps: built links", () => {
  assert.equal(mapUrl({ lat: 1.5, lng: 2.5 }, "x"), "https://www.google.com/maps/search/?api=1&query=1.500000%2C2.500000");
  assert.equal(mapUrl(undefined, "Bar & Grill"), "https://www.google.com/maps/search/?api=1&query=Bar%20%26%20Grill");
  assert.equal(routeUrl({ lat: 1, lng: 2 }, ""), "https://www.google.com/maps/dir/?api=1&destination=1.000000%2C2.000000");
});

test("colour schemes: readable text on every background", () => {
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const cr = (a, b) => { const [p, q] = [lum(a), lum(b)].sort((m, n) => n - m); return (p + .05) / (q + .05); };
  for (const p of PALETTES) for (const m of ["light", "dark"]) {
    const t = p[m]; if (!t) continue;
    for (const [a, b] of [["ink", "bg"], ["ink", "surface"], ["muted", "bg"], ["muted", "surface"], ["muted", "surface2"], ["accent-ink", "accent"], ["accent", "bg"], ["accent", "surface"]])
      assert.ok(cr(t[a], t[b]) >= 4.5, p.id + " " + m + " " + a + "/" + b);
  }
});

import { lunchFromRemote, lunchToRemote, pollFromRemote, pollToRemote, eventFromRemote, eventToRemote, membersFromRemote, CODE_LEN } from "../src/sync-model.js";

test("sync model: my uid becomes 'me' and back", () => {
  const l = lunchFromRemote({ place: "Pizza", time: "13:00", by: "u1", resp: { u1: "in", u2: "out", u3: "bogus" } }, "u1");
  assert.deepEqual(l, { place: "Pizza", time: "13:00", by: "me", resp: { me: "in", u2: "out" } });
  assert.deepEqual(lunchToRemote(l, "u1").resp, { u1: "in", u2: "out" });
  assert.equal(lunchToRemote(l, "u1").by, "u1");
});

test("sync model: poll votes map <-> option arrays", () => {
  const remote = { q: "Where?", opts: [{ id: "a", name: "Bar" }, { id: "b", name: "Pub", geo: { lat: 1, lng: 2 } }], votes: { u1: "b", u2: "b", u3: "a" }, win: null };
  const p = pollFromRemote(remote, "u1");
  assert.deepEqual(p.opts.map(o => o.votes), [["u3"], ["me", "u2"]]);
  assert.deepEqual(p.opts[1].geo, { lat: 1, lng: 2 });
  assert.deepEqual(pollToRemote(p, "u1").votes, { u1: "b", u2: "b", u3: "a" });
});

test("sync model: events, members and defaults", () => {
  const e = eventFromRemote("e1", { title: "Quiz", place: "Pub", date: "2026-11-05", time: "20:00", by: "u2", rsvp: { u1: "yes", u2: "maybe" } }, "u1");
  assert.equal(e.by, "u2"); assert.deepEqual(e.rsvp, { me: "yes", u2: "maybe" });
  assert.equal(eventToRemote({ id: "e1", title: "Quiz", date: "2026-11-05", rsvp: { me: "yes" } }, "u1").rsvp.u1, "yes");
  const m = membersFromRemote([{ uid: "u1", name: "Me" }, { uid: "u2", name: "Zed", avatar: "data:image/jpeg;base64,AA" }, { uid: "u3", name: "Amy", avatar: "javascript:x" }], "u1");
  assert.deepEqual(m.members, ["me", "u3", "u2"]); assert.equal(m.people.u3.avatar, ""); assert.ok(m.people.u2.avatar);
  assert.deepEqual(lunchFromRemote(null, "u1"), { place: "", time: "13:00", by: null, resp: {} });
  assert.equal(CODE_LEN, 8);
});

import { cardsOf, isAdult, LEVELS } from "../src/games.js";

test("trivia has three difficulty levels with valid, distinct questions", () => {
  const min = { easy: 150, mid: 60, hard: 95 }, all = new Set();
  for (const lvl of LEVELS) {
    const cards = cardsOf("trivia", lvl); assert.ok(cards.length >= min[lvl], lvl + " has " + cards.length);
    for (const c of cards) {
      assert.equal(c.length, 3);
      for (const qa of c) assert.ok(Array.isArray(qa) && qa.length === 2 && qa.every(t => typeof t === "string" && t.trim()), lvl + " " + JSON.stringify(c).slice(0, 60));
      const key = c[1][0].toLowerCase(); assert.ok(!all.has(key), "question repeats across levels: " + key); all.add(key);
    }
  }
  assert.equal(cardsOf("quizpen", "hard"), cardsOf("trivia", "hard"));
});

test("explain game: forbidden words differ from the word, three per card", () => {
  for (const c of cardsOf("explain")) for (const [i, part] of c.entries()) {
    const [word, ...bad] = part.map(w => w.toLowerCase());
    assert.equal(bad.length, 3); assert.ok(!bad.includes(word), "forbidden word equals the word: " + word + " (" + i + ")");
    assert.equal(new Set(bad).size, 3, "repeated forbidden words on " + word);
  }
});

test("adult flag follows the category", () => {
  assert.ok(isAdult("explain") && isAdult("never") && isAdult("spicy"));
  assert.ok(!isAdult("trivia") && !isAdult("charades") && !isAdult("dares"));
});
