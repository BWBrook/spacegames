# -*- coding: utf-8 -*-
"""
Very small, very dumb translator for the simplest ZX81/VIC-20 style
BASIC.  Good enough to chew through STARSHIP TAKEOFF; we'll harden
it as the games grow hairier.
"""
import re, sys, textwrap, random

TOKENS = {
    r"\bLET\b": "",        # LET A=3  ->  A=3
    r"\bPRINT\b": "print", # PRINT "HI"  ->  print("HI")
    r"\bCLS\b": "c64.cls()",
    r"\bRND\(\)": "rng.random()",
}

def translate_line(line: str, rng_alias: str = "rng") -> str:
    m = re.match(r"(\d+)\s+(.*)", line.strip())
    if not m:
        return line
    num, code = m.groups()
    # token replacements
    for pat, rep in TOKENS.items():
        code = re.sub(pat, rep, code, flags=re.IGNORECASE)
    # horrid INT(RND*20)+1  -> int(rng.random()*20)+1
    code = re.sub(r"INT\(\s*RND\(\)\s*\*\s*([0-9]+)\s*\)\s*\+\s*1",
                  rf"int({rng_alias}.random()*\1)+1", code, flags=re.I)
    # prepend original line number as comment
    return f"# {num}\n{code}"

def main(src_path: str) -> None:
    rng = random.Random(42)
    with open(src_path) as fh:
        for raw in fh:
            print(translate_line(raw))

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: python basic2py.py <file.bas>")
        sys.exit(1)
    main(sys.argv[1])
