#!/usr/bin/env python3
import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import ezdxf
from ezdxf import bbox


def point(value):
    if value is None:
        return None
    return {"x": float(value.x), "y": float(value.y), "z": float(getattr(value, "z", 0.0))}


def safe_get(entity, name, default=None):
    try:
        return getattr(entity.dxf, name)
    except Exception:
        return default


def entity_points(entity):
    kind = entity.dxftype()
    if kind == "LINE":
        return [point(entity.dxf.start), point(entity.dxf.end)]
    if kind == "LWPOLYLINE":
        return [{"x": float(x), "y": float(y), "z": float(safe_get(entity, "elevation", 0.0) or 0.0)} for x, y, *_ in entity.get_points()]
    if kind == "POLYLINE":
        return [point(vertex.dxf.location) for vertex in entity.vertices]
    if kind in {"TEXT", "MTEXT", "INSERT", "CIRCLE", "ARC"}:
        p = safe_get(entity, "insert", None) or safe_get(entity, "center", None)
        return [point(p)] if p is not None else []
    if kind == "DIMENSION":
        names = ["defpoint", "defpoint2", "defpoint3", "text_midpoint"]
        return [point(v) for v in (safe_get(entity, name) for name in names) if v is not None]
    return []


def entity_text(entity):
    if entity.dxftype() == "TEXT":
        return entity.dxf.text
    if entity.dxftype() == "MTEXT":
        try:
            return entity.plain_text()
        except Exception:
            return entity.text
    return None


def insert_bounds(entity):
    if entity.dxftype() != "INSERT":
        return None
    try:
        box = bbox.extents([entity], fast=True)
        if not box.has_data:
            return None
        return {"min": point(box.extmin), "max": point(box.extmax)}
    except Exception:
        return None


def normalize_entity(entity, index, text_style_map):
    kind = entity.dxftype()
    block_name = safe_get(entity, "name", None) if kind == "INSERT" else None
    insert = point(safe_get(entity, "insert", None)) if kind == "INSERT" else None
    scale = None
    if kind == "INSERT":
        scale = {
            "x": float(safe_get(entity, "xscale", 1.0) or 1.0),
            "y": float(safe_get(entity, "yscale", 1.0) or 1.0),
            "z": float(safe_get(entity, "zscale", 1.0) or 1.0),
        }
    closed = None
    if kind in {"LWPOLYLINE", "POLYLINE"}:
        closed = bool(getattr(entity, "closed", False) or getattr(entity, "is_closed", False))
    measurement = None
    if kind == "DIMENSION":
        try:
            measurement = float(entity.get_measurement())
        except Exception:
            measurement = None

    text_style = str(safe_get(entity, "style", "")) if kind in {"TEXT", "MTEXT"} else ""
    style_info = text_style_map.get(text_style, {})

    return {
        "id": str(getattr(entity.dxf, "handle", None) or f"entity-{index}"),
        "type": kind if kind in {"LINE", "LWPOLYLINE", "POLYLINE", "ARC", "CIRCLE", "INSERT", "TEXT", "MTEXT", "DIMENSION", "HATCH"} else "UNKNOWN",
        "layer": str(safe_get(entity, "layer", "0")),
        "blockName": block_name,
        "text": entity_text(entity),
        "points": [p for p in entity_points(entity) if p is not None],
        "insert": insert,
        "rotation": float(safe_get(entity, "rotation", 0.0) or 0.0) if kind == "INSERT" else None,
        "scale": scale,
        "closed": closed,
        "measurement": measurement,
        "metadata": {
            "color": safe_get(entity, "color", None),
            "lineweight": safe_get(entity, "lineweight", None),
            "linetype": safe_get(entity, "linetype", None),
            "textStyle": text_style or None,
            "font": style_info.get("font"),
            "bigFont": style_info.get("bigFont"),
            "insertBounds": insert_bounds(entity),
        },
    }


def convert_dwg_to_dxf(source: Path, target: Path):
    converter = shutil.which("dwg2dxf")
    if converter:
        subprocess.run([converter, "-y", "-o", str(target), str(source)], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return "LibreDWG dwg2dxf"
    dwgread = shutil.which("dwgread")
    if dwgread:
        subprocess.run([dwgread, "-O", "DXF", "-o", str(target), str(source)], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return "LibreDWG dwgread"
    raise RuntimeError("LibreDWG is required for DWG input. Install dwg2dxf or dwgread and keep it isolated in the CAD gateway container.")


def normalize(path: Path):
    suffix = path.suffix.lower()
    if suffix not in {".dwg", ".dxf"}:
        raise RuntimeError("Only DWG and DXF are supported by BASOUL CAD Ingestion v1.")
    temp_dir = None
    converter = "ezdxf direct"
    dxf_path = path
    if suffix == ".dwg":
        temp_dir = tempfile.TemporaryDirectory(prefix="basoul-cad-")
        dxf_path = Path(temp_dir.name) / f"{path.stem}.dxf"
        converter = convert_dwg_to_dxf(path, dxf_path)
    try:
        doc = ezdxf.readfile(dxf_path)
        modelspace = doc.modelspace()

        text_styles = []
        text_style_map = {}
        for style in doc.styles:
            item = {
                "name": str(style.dxf.name),
                "font": str(safe_get(style, "font", "") or "") or None,
                "bigFont": str(safe_get(style, "bigfont", "") or "") or None,
            }
            text_styles.append(item)
            text_style_map[item["name"]] = item

        entities = [normalize_entity(entity, i, text_style_map) for i, entity in enumerate(modelspace)]
        layers = [{"name": layer.dxf.name, "color": safe_get(layer, "color", None), "flags": safe_get(layer, "flags", None)} for layer in doc.layers]
        blocks = []
        for block in doc.blocks:
            if block.name.startswith("*"):
                continue
            blocks.append({"name": block.name, "entityCount": sum(1 for _ in block)})
        return {
            "schema": "basoul.cad.v1",
            "source": {
                "format": suffix[1:],
                "filename": path.name,
                "converter": f"{converter} + ezdxf",
                "codepage": str(doc.header.get("$DWGCODEPAGE", "")) or None,
            },
            "units": str(doc.header.get("$INSUNITS", 0)),
            "layers": layers,
            "blocks": blocks,
            "textStyles": text_styles,
            "entities": entities,
        }
    finally:
        if temp_dir is not None:
            temp_dir.cleanup()


def main():
    parser = argparse.ArgumentParser(description="Normalize DWG/DXF into BASOUL CAD JSON v1")
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", "-o", type=Path)
    args = parser.parse_args()
    try:
        result = normalize(args.input.resolve())
    except Exception as exc:
        print(f"cad-ingestion error: {exc}", file=sys.stderr)
        return 2
    payload = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(payload, encoding="utf-8")
    else:
        print(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())