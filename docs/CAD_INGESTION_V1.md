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
- Layer name and properties.
- Block/INSERT name, transform, scale, rotation and insertion point.
- Closed polylines for spaces.
- Native dimensions and measurements.
- Text and MTEXT labels.

Classification is intentionally rule-based first. AI may resolve ambiguous layer/block naming later, but it must not replace native geometry.

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
