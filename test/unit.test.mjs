import test from "node:test";
import assert from "node:assert/strict";
import { GAMES, CATS } from "../src/games.js";

const LANGS = ["ru", "en", "el"];

test("every game has 150 cards in three languages", () => {
  for (const [id, g] of Object.entries(GAMES)) {
    assert.equal(g.cards.length, 150, id + " must have 150 cards");
    for (const [i, c] of g.cards.entries()) {
      assert.equal(c.length, 3, id + " card " + i + " must have ru, en, el");
      for (const part of c) {
        if (g.trivia) { assert.ok(Array.isArray(part) && part.length === 2 && part.every(s => typeof s === "string" && s.trim()), id + " card " + i); }
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
