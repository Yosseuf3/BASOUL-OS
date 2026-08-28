# BASOUL CAD Ingestion v1

## Goal

Use native CAD semantics as the primary architectural understanding source. DWG/DXF is the high-fidelity path; PDF/image recognition remains a fallback.

## Pipeline

DWG -> isolated LibreDWG converter -> DXF -> ezdxf normalizer -> `basoul.cad.v1` JSON -> BASOUL CAD semantic classification -> `ArchitectureScene` -> reconciliation/validation -> Pascal adapter.

DXF skips the LibreDWG step and enters ezdxf directly.

## Licensing boundary

LibreDWG is GPLv3+. BASOUL must not copy/link LibreDWG code into the proprietary application core. Run its CLI in an isolated converter/container boundary and exchange files/JSON across the boundary. The BASOUL TypeScript semantic package contains no LibreDWG/ezdxf/Pascal imports.

ezdxf is MIT and runs in the isolated normalization gateway.

## v1 semantic signals

Priority signals:

- Native entity type: `LINE`, `LWPOLYLINE`, `POLYLINE`, `INSERT`, `TEXT`, `MTEXT`, `DIMENSION`, `HATCH`.
- Layer name and properties, including tolerant recognition of common naming mistakes such as `stiars`.
- Block/INSERT name, transform, scale, rotation and insertion point.
- Native geometry placed directly on wall, door, window, stair or column layers.
- Closed polylines for spaces.
- Native dimensions and measurements.
- Text and MTEXT labels plus text style, SHX/TTF font, big-font and DWG codepage metadata.

Classification is intentionally rule-based first. AI may resolve ambiguous layer/block naming later, but it must not replace native geometry.

## Real architectural DWG benchmark

A real user-supplied architectural DWG was tested locally without uploading the drawing to GitHub. The file is AC1021 (AutoCAD 2007/2008/2009 compatibility) and LibreDWG 0.14.8531 converted it successfully to DXF.

Recovered modelspace facts:

- 8 layers: `0`, `Defpoints`, `stiars`, `wall`, `WINDOW`, `WINDOW_TEXT`, `door`, `TX-ARAB`.
- 5 named blocks, including `DR_D01`, `WD_00_X2`, `WD_00_X1`, `WD_WIN4`.
- 618 modelspace entities: 455 `LINE`, 80 `DIMENSION`, 49 `INSERT`, 34 `TEXT`.
- 425 wall lines directly on the `wall` layer.
- 14 door block inserts on the `door` layer, plus 4 door-layer line entities.
- 35 window block inserts on the `WINDOW` layer.
- 26 stair line entities on the misspelled `stiars` layer.
- 80 native dimensions.
- 34 Arabic labels using text style `mas` and `xarab.shx`; the converted text is legacy SHX-encoded and therefore requires a dedicated text-decoding phase rather than Vision/OCR guessing.
- Drawing units are meters (`$INSUNITS = 6`).

This benchmark materially exceeds the PDF/Vision fallback: native CAD geometry recovers hundreds of trustworthy architectural elements with exact coordinates before any AI inference.

## Acceptance PoC

Given one real architectural DWG, export `basoul.cad.v1` JSON and report:

1. layer count and names;
2. block count and names;
3. entity counts by native CAD type;
4. classified walls, doors, windows, stairs, columns, rooms, dimensions and labels;
5. resulting ArchitectureScene validation issues.

The PoC is successful when BASOUL can recover materially more trustworthy architectural geometry from the DWG than from the PDF fallback without Vision-based wall guessing.

## Local gateway

Requirements:

- Python 3.11+
- `pip install -r tools/cad-ingestion/requirements.txt`
- LibreDWG `dwg2dxf` or `dwgread` available on PATH for DWG input

Example:

```bash
python tools/cad-ingestion/cad_ingest.py plan.dwg -o plan.basoul-cad.json
```

For DXF:

```bash
python tools/cad-ingestion/cad_ingest.py plan.dxf -o plan.basoul-cad.json
```

No production upload or Supabase mutation is part of v1 PoC.
