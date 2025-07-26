# -*- coding: utf-8 -*-
# c64.py
"""
A wafer‑thin Commodore‑64 façade
--------------------------------
• 40×25 text screen  (PETSCII ≈ CP437)
• 64 KB sparse memory map
• BASIC‑style helpers: CHR$, PRINT, POKE, PEEK, RND(1)

Cross‑platform notes
~~~~~~~~~~~~~~~~~~~~
* **Keyboard**: `_get_key()` is non‑blocking and uses `msvcrt` on Windows,
  `termios+tty+select` on POSIX.  `C64.GET()` delegates to it.
* **Raw TTY**: `_raw_tty()` is a context manager; on Windows it’s a no‑op.
* **Screen clear**: We shell out to ``cls`` (Windows) or ``clear`` (POSIX).

This file is self‑contained; just `import C64` and go.
"""

from __future__ import annotations

import contextlib
import os
import random
import sys
from collections import defaultdict
from typing import Iterator, List, Optional

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────
ROWS, COLS = 25, 40
_PETSCII_OFFSET = 32                # CHR$(32) prints space.
_ESC_HOME = "\x1b[H"                # ANSI "home cursor" sequence.
_CLEAR_CMD = "cls" if os.name == "nt" else "clear"

# ──────────────────────────────────────────────────────────────────────────────
# Platform abstraction (keyboard + raw terminal)
# ──────────────────────────────────────────────────────────────────────────────
if os.name == "nt":
    import msvcrt  # type: ignore

    def _get_key() -> Optional[str]:
        """Return a single pressed key (non‑blocking) or ``None``."""
        if msvcrt.kbhit():                                   # type: ignore[attr-defined]
            ch = msvcrt.getch()                              # type: ignore[attr-defined]
            try:
                return ch.decode()
            except UnicodeDecodeError:
                return None
        return None

    @contextlib.contextmanager
    def _raw_tty() -> Iterator[None]:
        """No‑op on Windows (needed only for POSIX raw mode)."""
        yield
else:
    import select
    import termios  # type: ignore
    import tty      # type: ignore

    def _get_key() -> Optional[str]:
        """Return a single pressed key (non‑blocking) or ``None``."""
        fd = sys.stdin.fileno()
        old = termios.tcgetattr(fd)                          # type: ignore[attr-defined]
        try:
            tty.setraw(fd)                                   # type: ignore[attr-defined]
            r, _, _ = select.select([fd], [], [], 0)
            if r:
                ch = os.read(fd, 1)
                try:
                    return ch.decode()
                except UnicodeDecodeError:
                    return None
            return None
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old)    # type: ignore[attr-defined]

    @contextlib.contextmanager
    def _raw_tty() -> Iterator[None]:
        """Temporarily put the TTY into raw mode (POSIX only)."""
        fd = sys.stdin.fileno()
        old = termios.tcgetattr(fd)                          # type: ignore[attr-defined]
        try:
            tty.setraw(fd)                                   # type: ignore[attr-defined]
            yield
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old)    # type: ignore[attr-defined]

# ──────────────────────────────────────────────────────────────────────────────
# Screen
# ──────────────────────────────────────────────────────────────────────────────
class Screen:
    """A very small 40×25 monochrome text buffer."""

    def __init__(self, rows: int = ROWS, cols: int = COLS) -> None:
        self.rows, self.cols = rows, cols
        self.buffer: List[List[str]] = [[" "] * cols for _ in range(rows)]

    # --- PRINT ---------------------------------------------------------------
    def write(self, row: int, col: int, text: str) -> None:
        """Write ``text`` starting at (row, col).  Silent if row is off‑screen."""
        if not (0 <= row < self.rows):
            return
        for i, ch in enumerate(text):
            c = col + i
            if 0 <= c < self.cols:
                self.buffer[row][c] = ch

    def render(self) -> None:
        """Dump the buffer to stdout using ANSI escape codes."""
        sys.stdout.write(_ESC_HOME)
        for row in self.buffer:
            sys.stdout.write("".join(row) + "\n")
        sys.stdout.flush()

# ──────────────────────────────────────────────────────────────────────────────
# Main façade
# ──────────────────────────────────────────────────────────────────────────────
class C64:
    """A “good‑enough” Commodore‑64 façade for running 1980s BASIC listings."""

    def __init__(self, seed: int = 42) -> None:
        self.mem: defaultdict[int, int] = defaultdict(int)
        self.screen = Screen()
        self.rng = random.Random(seed)

    # BASIC helpers -----------------------------------------------------------
    def RND(self, arg: int = 1) -> float:
        """BASIC’s ``RND(1)`` → a float in [0.0, 1.0)."""
        assert arg == 1, "Only RND(1) supported"
        return self.rng.random()

    def CHR(self, code: int) -> str:
        """BASIC’s ``CHR$(code)`` (PETSCII‑ish)."""
        return chr(code + _PETSCII_OFFSET)

    # Memory map --------------------------------------------------------------
    def POKE(self, addr: int, val: int) -> None:
        """Store an 8‑bit value at ``addr``."""
        self.mem[addr] = val & 0xFF

    def PEEK(self, addr: int) -> int:
        """Fetch an 8‑bit value from ``addr`` (defaults to 0)."""
        return self.mem[addr]

    # Screen abstraction ------------------------------------------------------
    def PRINT(self, row: int, col: int, text: str) -> None:
        self.screen.write(row, col, text)

    # Keyboard ----------------------------------------------------------------
    def GET(self) -> Optional[str]:
        """Return a single keypress (non‑blocking) or ``None``."""
        return _get_key()

    # House‑keeping -----------------------------------------------------------
    def cls(self) -> None:
        """Clear C64 screen *and* host terminal."""
        self.screen = Screen()
        os.system(_CLEAR_CMD)

    def refresh(self) -> None:
        """Flush the off‑screen buffer to the terminal."""
        self.screen.render()

    # Optional: expose raw_tty for power users -------------------------------
    raw_tty = staticmethod(_raw_tty)  # e.g. `with C64.raw_tty(): ...`

# End of file
