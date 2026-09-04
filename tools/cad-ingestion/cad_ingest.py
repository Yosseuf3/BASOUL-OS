#!/usr/bin/env python3
import argparse
import hashlib
import json
import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import ezdxf
from ezdxf import bbox

from shx_decode import decode_legacy_shx_text


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


def sampled_arc_points(entity, segments=20):
    center = safe_get(entity, "center", None)
    radius = safe_get(entity, "radius", None)
    if center is None or radius is None:
        return []
    start_angle = float(safe_get(entity, "start_angle", 0.0) or 0.0)
    end_angle = float(safe_get(entity, "end_angle", 360.0) or 360.0)
    if entity.dxftype() == "CIRCLE":
        start_angle, end_angle = 0.0, 360.0
    while end_angle <= start_angle:
        end_angle += 360.0
    count = max(6, min(48, int(segments)))
    result = []
    for index in range(count + 1):
        angle = math.radians(start_angle + (end_angle - start_angle) * index / count)
        result.append({
            "x": float(center.x + radius * math.cos(angle)),
            "y": float(center.y + radius * math.sin(angle)),
            "z": float(getattr(center, "z", 0.0)),
        })
    return result


def primitive_geometry(entity):
    kind = entity.dxftype()
    points = []
    if kind == "LINE":
        points = [point(entity.dxf.start), point(entity.dxf.end)]
    elif kind == "LWPOLYLINE":
        points = [{"x": float(x), "y": float(y), "z": float(safe_get(entity, "elevation", 0.0) or 0.0)} for x, y, *_ in entity.get_points()]
    elif kind == "POLYLINE":
        points = [point(vertex.dxf.location) for vertex in entity.vertices]
    elif kind in {"ARC", "CIRCLE"}:
        points = sampled_arc_points(entity)
    else:
        return None
    points = [p for p in points if p is not None]
    if len(points) < 2:
        return None
    result = {"type": kind, "points": points}
    if kind in {"ARC", "CIRCLE"}:
        center = safe_get(entity, "center", None)
        radius = safe_get(entity, "radius", None)
        result.update({
            "center": point(center),
            "radius": float(radius) if radius is not None else None,
            "startAngle": float(safe_get(entity, "start_angle", 0.0) or 0.0) if kind == "ARC" else 0.0,
            "endAngle": float(safe_get(entity, "end_angle", 360.0) or 360.0) if kind == "ARC" else 360.0,
        })
    return result


def insert_geometry(entity, limit=256):
    if entity.dxftype() != "INSERT":
        return None
    result = []
    try:
        for virtual in entity.virtual_entities():
            primitive = primitive_geometry(virtual)
            if primitive is not None:
                result.append(primitive)
                if len(result) >= limit:
                    break
    except Exception:
        return None
    return result or None


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
    raw_text = entity_text(entity)
    decoded_text, text_encoding = decode_legacy_shx_text(raw_text, style_info.get("font"))

    return {
        "id": str(getattr(entity.dxf, "handle", None) or f"entity-{index}"),
        "type": kind if kind in {"LINE", "LWPOLYLINE", "POLYLINE", "ARC", "CIRCLE", "INSERT", "TEXT", "MTEXT", "DIMENSION", "HATCH"} else "UNKNOWN",
        "layer": str(safe_get(entity, "layer", "0")),
        "blockName": block_name,
        "text": decoded_text if decoded_text is not None else raw_text,
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
            "insertGeometry": insert_geometry(entity),
            "rawText": raw_text if decoded_text is not None else None,
            "decodedText": decoded_text,
            "textEncoding": text_encoding,
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
    source_sha256 = hashlib.sha256(path.read_bytes()).hexdigest()
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
        decoded_count = sum(1 for entity in entities if entity.get("metadata", {}).get("decodedText"))
        return {
            "schema": "basoul.cad.v1",
            "source": {
                "format": suffix[1:],
                "filename": path.name,
                "converter": f"{converter} + ezdxf",
                "codepage": str(doc.header.get("$DWGCODEPAGE", "")) or None,
                "sha256": source_sha256,
            },
            "units": str(doc.header.get("$INSUNITS", 0)),
            "layers": layers,
            "blocks": blocks,
            "textStyles": text_styles,
            "entities": entities,
            "textDecoding": {"decoder": "xarab-keyboard-v1", "decodedEntities": decoded_count},
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
