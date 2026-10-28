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
