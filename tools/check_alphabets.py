# Flags words that mix Greek, Cyrillic and Latin letters (typical copy-paste typos). Run: python tools/check_alphabets.py
import glob

def kinds(tok):
    k = set()
    for ch in tok:
        o = ord(ch)
        if 0x370 <= o <= 0x3ff or 0x1f00 <= o <= 0x1fff: k.add("el")
        elif 0x400 <= o <= 0x4ff: k.add("ru")
        elif ch.isascii() and ch.isalpha(): k.add("la")
    return k

bad = 0
for f in sorted(glob.glob("src/games/*.js")):
    for line in open(f, encoding="utf-8"):
        for tok in line.split():
            if len(kinds(tok)) > 1:
                print(f.split("/")[-1], "mixed:", tok); bad += 1
print("mixed-alphabet words:", bad)
