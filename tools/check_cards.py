# Counts and checks src/games/*.js (each is "export default [...]" in JSON syntax). Run: python tools/check_cards.py
import json, glob, os, sys
ok = True
for f in sorted(glob.glob(os.path.join(os.path.dirname(__file__), "..", "src", "games", "*.js"))):
    if os.path.basename(f) == "explain.js":
        print("%-14s checked by npm test (word + 3 forbidden words per language)" % os.path.basename(f)); continue
    t = open(f, encoding="utf-8").read()
    body = "\n".join(l for l in t.splitlines() if not l.startswith("//"))
    body = body.split("export default", 1)[1].strip().rstrip(";")
    try:
        cards = json.loads(body)
    except Exception as e:
        print(os.path.basename(f), "JSON ERROR", e); ok = False; continue
    names = [json.dumps(c[1], ensure_ascii=False).lower() for c in cards]
    dups = len(names) - len(set(names))
    bad = [i for i, c in enumerate(cards) if len(c) != 3 or any((not p) or (isinstance(p, str) and not p.strip()) for p in c)]
    print("%-14s %4d cards, %d duplicates, %d malformed" % (os.path.basename(f), len(cards), dups, len(bad)))
    need = {"trivia-mid.js": 60, "trivia-hard.js": 95}.get(os.path.basename(f), 150)
    if len(cards) < need or dups or bad: ok = False
print("ALL OK" if ok else "NOT YET")
