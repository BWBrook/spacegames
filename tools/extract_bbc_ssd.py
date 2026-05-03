#!/usr/bin/env python3
"""Extract BBC Micro DFS .ssd images and detokenise BBC BASIC files."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path


SECTOR_SIZE = 256

BASIC_TOKENS = {
    0x80: "AND",
    0x81: "DIV",
    0x82: "EOR",
    0x83: "MOD",
    0x84: "OR",
    0x85: "ERROR",
    0x86: "LINE",
    0x87: "OFF",
    0x88: "STEP",
    0x89: "SPC",
    0x8A: "TAB(",
    0x8B: "ELSE",
    0x8C: "THEN",
    0x8E: "OPENIN",
    0x8F: "PTR",
    0x90: "PAGE",
    0x91: "TIME",
    0x92: "LOMEM",
    0x93: "HIMEM",
    0x94: "ABS",
    0x95: "ACS",
    0x96: "ADVAL",
    0x97: "ASC",
    0x98: "ASN",
    0x99: "ATN",
    0x9A: "BGET",
    0x9B: "COS",
    0x9C: "COUNT",
    0x9D: "DEG",
    0x9E: "ERL",
    0x9F: "ERR",
    0xA0: "EVAL",
    0xA1: "EXP",
    0xA2: "EXT",
    0xA3: "FALSE",
    0xA4: "FN",
    0xA5: "GET",
    0xA6: "INKEY",
    0xA7: "INSTR",
    0xA8: "INT",
    0xA9: "LEN",
    0xAA: "LN",
    0xAB: "LOG",
    0xAC: "NOT",
    0xAD: "OPENUP",
    0xAE: "OPENOUT",
    0xAF: "PI",
    0xB0: "POINT(",
    0xB1: "POS",
    0xB2: "RAD",
    0xB3: "RND",
    0xB4: "SGN",
    0xB5: "SIN",
    0xB6: "SQR",
    0xB7: "TAN",
    0xB8: "TO",
    0xB9: "TRUE",
    0xBA: "USR",
    0xBB: "VAL",
    0xBC: "VPOS",
    0xBD: "CHR$",
    0xBE: "GET$",
    0xBF: "INKEY$",
    0xC0: "LEFT$(",
    0xC1: "MID$(",
    0xC2: "RIGHT$(",
    0xC3: "STR$",
    0xC4: "STRING$(",
    0xC5: "EOF",
    0xC6: "AUTO",
    0xC7: "DELETE",
    0xC8: "LOAD",
    0xC9: "LIST",
    0xCA: "NEW",
    0xCB: "OLD",
    0xCC: "RENUMBER",
    0xCD: "SAVE",
    0xCE: "PUT",
    0xCF: "PTR",
    0xD0: "PAGE",
    0xD1: "TIME",
    0xD2: "LOMEM",
    0xD3: "HIMEM",
    0xD4: "SOUND",
    0xD5: "BPUT",
    0xD6: "CALL",
    0xD7: "CHAIN",
    0xD8: "CLEAR",
    0xD9: "CLOSE",
    0xDA: "CLG",
    0xDB: "CLS",
    0xDC: "DATA",
    0xDD: "DEF",
    0xDE: "DIM",
    0xDF: "DRAW",
    0xE0: "END",
    0xE1: "ENDPROC",
    0xE2: "ENVELOPE",
    0xE3: "FOR",
    0xE4: "GOSUB",
    0xE5: "GOTO",
    0xE6: "GCOL",
    0xE7: "IF",
    0xE8: "INPUT",
    0xE9: "LET",
    0xEA: "LOCAL",
    0xEB: "MODE",
    0xEC: "MOVE",
    0xED: "NEXT",
    0xEE: "ON",
    0xEF: "VDU",
    0xF0: "PLOT",
    0xF1: "PRINT",
    0xF2: "PROC",
    0xF3: "READ",
    0xF4: "REM",
    0xF5: "REPEAT",
    0xF6: "REPORT",
    0xF7: "RESTORE",
    0xF8: "RETURN",
    0xF9: "RUN",
    0xFA: "STOP",
    0xFB: "COLOUR",
    0xFC: "TRACE",
    0xFD: "UNTIL",
    0xFE: "WIDTH",
    0xFF: "OSCLI",
}

RAW_REMAINDER_TOKENS = {0xDC, 0xF4}


@dataclass
class CatalogEntry:
    dfs_name: str
    directory: str
    name: str
    locked: bool
    load_address: int
    exec_address: int
    length: int
    start_sector: int
    output_file: str | None = None
    title: str | None = None
    tokenised_basic: bool = False


@dataclass
class DiskCatalog:
    source: str
    title: str
    cycle: int
    boot_option: int
    sectors: int
    file_count: int
    entries: list[CatalogEntry]


def parse_catalog(image: bytes, source: Path) -> DiskCatalog:
    sector0 = image[:SECTOR_SIZE]
    sector1 = image[SECTOR_SIZE : SECTOR_SIZE * 2]
    title = (sector0[:8] + sector1[:4]).decode("latin1").rstrip("\x00 ").strip()
    file_count = sector1[5] // 8
    sectors = sector1[7] + ((sector1[6] & 0x03) << 8)
    boot_option = (sector1[6] >> 4) & 0x03
    entries: list[CatalogEntry] = []

    for index in range(file_count):
        name_offset = 8 + index * 8
        meta_offset = 8 + index * 8
        raw_name = sector0[name_offset : name_offset + 8]
        name = raw_name[:7].decode("latin1").rstrip()
        directory = chr(raw_name[7] & 0x7F)
        locked = bool(raw_name[7] & 0x80)
        metadata = sector1[meta_offset : meta_offset + 8]

        load_address = metadata[0] + (metadata[1] << 8)
        exec_address = metadata[2] + (metadata[3] << 8)
        length = metadata[4] + (metadata[5] << 8) + ((metadata[6] & 0x30) << 12)
        start_sector = metadata[7] + ((metadata[6] & 0x03) << 8)
        dfs_name = f"{directory}.{name}"

        entries.append(
            CatalogEntry(
                dfs_name=dfs_name,
                directory=directory,
                name=name,
                locked=locked,
                load_address=load_address,
                exec_address=exec_address,
                length=length,
                start_sector=start_sector,
            )
        )

    return DiskCatalog(
        source=str(source),
        title=title,
        cycle=sector1[4],
        boot_option=boot_option,
        sectors=sectors,
        file_count=file_count,
        entries=entries,
    )


def file_bytes(image: bytes, entry: CatalogEntry) -> bytes:
    start = entry.start_sector * SECTOR_SIZE
    return image[start : start + entry.length]


def is_tokenised_basic(data: bytes) -> bool:
    if len(data) < 5 or data[0] != 0x0D:
        return False
    line_length = data[3]
    return 4 < line_length <= len(data)


def decode_line_reference(data: bytes) -> int:
    marker = data[0] ^ 0x54
    line = (data[1] & 0x3F) | ((data[2] & 0x3F) << 8)
    line |= (marker & 0x30) << 2
    line |= (marker & 0x0C) << 12
    return line


def raw_text(data: bytes) -> str:
    return data.decode("latin1").replace("\r", "\n")


def detokenise_body(body: bytes) -> str:
    pieces: list[str] = []
    index = 0
    while index < len(body):
        byte = body[index]

        if byte == 0x22:
            end = index + 1
            while end < len(body):
                if body[end] == 0x22:
                    end += 1
                    break
                end += 1
            pieces.append(raw_text(body[index:end]))
            index = end
            continue

        if byte == 0x8D and index + 3 < len(body):
            pieces.append(str(decode_line_reference(body[index + 1 : index + 4])))
            index += 4
            continue

        token = BASIC_TOKENS.get(byte)
        if token:
            pieces.append(token)
            index += 1
            if byte in RAW_REMAINDER_TOKENS:
                pieces.append(raw_text(body[index:]))
                break
            continue

        pieces.append(chr(byte))
        index += 1

    return "".join(pieces)


def detokenise_basic(data: bytes) -> str:
    lines: list[str] = []
    position = 0
    while position < len(data):
        if data[position] != 0x0D:
            break
        if position + 4 > len(data):
            break
        if data[position + 1 : position + 4] == b"\xFF\xFF\xFF":
            break

        line_number = (data[position + 1] << 8) | data[position + 2]
        line_length = data[position + 3]
        if line_length <= 4 or position + line_length > len(data):
            break

        body = data[position + 4 : position + line_length]
        lines.append(f"{line_number} {detokenise_body(body)}".rstrip())
        position += line_length

    return "\n".join(lines) + "\n"


def extract_title(text: str) -> str | None:
    match = re.search(r'TITLE\$="([^"]+)"', text)
    if match:
        return match.group(1)
    quoted = re.findall(r'"([A-Z][A-Z0-9 \-]{3,})"', text)
    return quoted[0] if quoted else None


def output_name(entry: CatalogEntry, extension: str) -> str:
    safe_name = re.sub(r"[^A-Za-z0-9_!.-]+", "_", entry.name)
    return f"{safe_name}{extension}"


def write_outputs(image_path: Path, output_dir: Path) -> DiskCatalog:
    image = image_path.read_bytes()
    catalog = parse_catalog(image, image_path)
    output_dir.mkdir(parents=True, exist_ok=True)

    for entry in catalog.entries:
        data = file_bytes(image, entry)
        if is_tokenised_basic(data):
            text = detokenise_basic(data)
            entry.tokenised_basic = True
            entry.title = extract_title(text)
            filename = output_name(entry, ".bas")
        else:
            text = raw_text(data)
            entry.title = extract_title(text)
            filename = output_name(entry, ".txt")

        entry.output_file = filename
        (output_dir / filename).write_text(text, encoding="utf-8")

    catalog_json = {
        **asdict(catalog),
        "entries": [asdict(entry) for entry in catalog.entries],
    }
    (output_dir / "catalog.json").write_text(
        json.dumps(catalog_json, indent=2) + "\n",
        encoding="utf-8",
    )
    (output_dir / "README.md").write_text(readme(catalog), encoding="utf-8")
    return catalog


def readme(catalog: DiskCatalog) -> str:
    rows = [
        "# Usborne Computer Space Games BBC Micro Sources",
        "",
        "Extracted from `assets-src/Disc999-ComputerSpaceGamesUsborne.ssd`.",
        "",
        "The `.ssd` image is a BBC Micro DFS disk titled "
        f"`{catalog.title}`. Files here are detokenised BBC BASIC where possible; "
        "`catalog.json` preserves DFS names, load/exec addresses, file lengths, "
        "and start sectors.",
        "",
        "These files are the source canon for the anthology. Player-facing Retro BASIC modes are browser-native recreations that should link back to this archive rather than modifying or duplicating the extracted files.",
        "",
        "## Catalogue",
        "",
        "| DFS name | Output | Load | Exec | Bytes | Sector | Title/text hint |",
        "| --- | --- | ---: | ---: | ---: | ---: | --- |",
    ]
    for entry in catalog.entries:
        title = entry.title or ""
        rows.append(
            "| "
            f"`{entry.dfs_name}` | `{entry.output_file}` | "
            f"`&{entry.load_address:04X}` | `&{entry.exec_address:04X}` | "
            f"{entry.length} | {entry.start_sector} | {title} |"
        )
    rows.append("")
    return "\n".join(rows)


def print_catalog(catalog: DiskCatalog) -> None:
    print(f"{catalog.source}")
    print(f"title={catalog.title} files={catalog.file_count} sectors={catalog.sectors} boot={catalog.boot_option}")
    for entry in catalog.entries:
        print(
            f"{entry.dfs_name:<8} load=&{entry.load_address:04X} "
            f"exec=&{entry.exec_address:04X} len={entry.length:4d} "
            f"sector={entry.start_sector:3d} output={entry.output_file or '-'}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path, help="BBC DFS .ssd image")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("basic/bbc/usborne-computer-space-games"),
        help="directory for extracted files",
    )
    parser.add_argument("--catalog-only", action="store_true", help="print the DFS catalogue without writing files")
    args = parser.parse_args()

    if args.catalog_only:
        print_catalog(parse_catalog(args.image.read_bytes(), args.image))
        return

    catalog = write_outputs(args.image, args.out)
    print_catalog(catalog)


if __name__ == "__main__":
    main()
