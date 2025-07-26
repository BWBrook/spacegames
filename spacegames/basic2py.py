#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
basic2py.py  –  ZX‑/VIC‑era BASIC → runnable Python   (v0.1)

• Enough to compile ‘STARSHIP TAKE‑OFF’ from *Computer Spacegames*.
• Pattern‑based, no full parser yet – we’ll grow it one game at a time.
"""
from __future__ import annotations
import re, sys, random, textwrap
from pathlib import Path
# ───────────────────────────────────────────────────────── helpers ──
PRINT_RE = re.compile(r'\s*PRINT\s+(.+)', flags=re.I)
FOR_RE   = re.compile(r'FOR\s+(\w+)\s*=\s*(\S+)\s+TO\s+(\S+)', flags=re.I)
IF_GOTO_RE = re.compile(r'IF\s+(.+?)\s+THEN\s+GOTO\s+(\d+)', flags=re.I)
IF_INLINE_RE = re.compile(r'IF\s+(.+?)\s+THEN\s+(.+)', flags=re.I)

def _expr(e: str) -> str:
    """Token tweaks inside expressions."""
    e = re.sub(r'\bRND\b', 'rng.random()', e, flags=re.I)
    e = re.sub(r'\bINT\s*\(', 'int(', e, flags=re.I)
    e = re.sub(r'\bATN\s*\(', 'math.atan(', e, flags=re.I)
    e = re.sub(r'\bSQR\s*\(', 'math.sqrt(', e, flags=re.I)
    e = re.sub(r'\bABS\s*\(', 'abs(', e, flags=re.I)    
    return e

def _condition(cond: str) -> str:
    """BASIC uses single ‘=’ for equality → ‘==’."""
    cond = _expr(cond)
    cond = re.sub(r'\bAND\b', 'and', cond, flags=re.I)
    cond = re.sub(r'\bOR\b',  'or',  cond, flags=re.I)
    return re.sub(r'(?<![<>=])=(?!=)', '==', cond)

def _py_print(payload: str) -> str:
    """
    Convert the *payload* **after** the BASIC keyword.
        input:  '"HELLO";A'
        output: 'print("HELLO", A)'
    """
    payload = payload.rstrip(';')
    if not payload:
        return "print()"
    parts = [p.strip() for p in re.split(r'\s*;\s*', payload)]
    return f'print({", ".join(parts)})'

# ───────────────────────────────────────────────────────── compiler ──
def compile_basic(source: str) -> str:
    """Return Python text equivalent to a very small BASIC subset."""
    # pass 1 – read into ordered dict
    lines: dict[int, str] = {}
    for raw in source.splitlines():
        m = re.match(r'\s*(\d+)\s+(.*)', raw)
        if m:
            lines[int(m.group(1))] = m.group(2).strip()

    goto_targets = {int(m.group(2))
                    for c in lines.values()
                    if (m := IF_GOTO_RE.match(c))}
    emitted: list[str] = []
    IND = "    "
    emitted.extend([
        "import math, random",
        "from spacegames.c64 import C64",
        "c64 = C64()",
        "rng = random.Random(42)",
        "",
        "def main():",
        IND + "pass  # declarations follow",
    ])

    indent = 1            # inside main()
    for n, code in lines.items():
        if n in goto_targets:
            # label is compiled in‑line where the GOTO lands, so we skip here
            continue

        # -------------------------------- CLS / STOP / INPUT
        if re.fullmatch(r'CLS', code, flags=re.I):
            py = "c64.cls()"

        elif re.fullmatch(r'STOP', code, flags=re.I):
            py = "return"

        elif m := re.match(r'INPUT\s+(\w+)', code, flags=re.I):
            py = f"{m.group(1)} = int(input(\"> \").strip())"

        # -------------------------------- FOR / NEXT
        elif m := FOR_RE.match(code):
            v, lo, hi = m.groups()
            emitted.append(IND*indent + f"{v} = 0  # pre-declare for linters")
            py = f"for {v} in range({_expr(lo)}, {_expr(hi)} + 1):"
            emitted.append(IND*indent + py)
            indent += 1
            continue                        # body lines follow – next iteration

        elif re.fullmatch(r'NEXT\s+\w*', code, flags=re.I):
            indent -= 1
            emitted.append(IND*indent + "pass  # NEXT")
            continue

        # -------------------------------- IF … THEN GOTO (success jump)
        elif m := IF_GOTO_RE.match(code):
            cond, target = m.groups()
            cond_py = _condition(cond)
            # inline the *target* line(s) (here only one PRINT + STOP)
            target_text = lines[int(target)]
            if target_text.upper().startswith("PRINT"):
                target_py = _py_print(target_text[5:].lstrip())  # drop “PRINT”
            else:
                target_py = _expr(target_text)
            py_block = [
                f"if {cond_py}:",
                IND + target_py,
                IND + "return",
            ]
            emitted.extend([IND*indent + l for l in py_block])
            continue

        # -------------------------------- one‑line IF … THEN …
        elif m := IF_INLINE_RE.match(code):
            cond, action = m.groups()
            cond_py = _condition(cond)
            action_body = action.lstrip()[5:].lstrip()  # drop “PRINT”
            action_py = _py_print(action_body)          # PRINT "X";Y  ->  print("X", Y)
            py = f"if {cond_py}: {action_py}"

        # -------------------------------- PRINT
        elif code.upper().startswith("PRINT"):
            py = _py_print(code[5:])

        # -------------------------------- LET / plain assignment
        else:
            py = _expr(re.sub(r'\bLET\b', '', code, flags=re.I).strip())

        # ─── skip consecutive identical returns ───────────────────────
        if py == "return" and emitted and emitted[-1].strip() == "return":
            continue          # drop duplicate
        
        emitted.append(IND*indent + py)

    emitted.extend([
        "",
        "if __name__ == '__main__':",
        IND[:-2] + "main()",
    ])
    return "\n".join(emitted)
# ───────────────────────────────────────────────────────── CLI ──
def main_cli(path: str) -> None:
    src = Path(path).read_text(encoding="utf-8", errors="replace")
    print(compile_basic(src))

if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python -m spacegames.basic2py <file.bas>")
    main_cli(sys.argv[1])
