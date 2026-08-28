import shutil
import tempfile
from pathlib import Path
from uuid import UUID

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from cad_ingest import normalize

MAX_CAD_BYTES = 25 * 1024 * 1024
ALLOWED_EXTENSIONS = {".dwg", ".dxf"}

app = FastAPI(title="BASOUL CAD Ingestion Gateway", docs_url=None, redoc_url=None)


def valid_uuid(value: str) -> bool:
    try:
        UUID(value)
        return True
    except (ValueError, TypeError, AttributeError):
        return False


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "basoul-cad-gateway",
        "schema": "basoul.cad.v1",
        "dwg": bool(shutil.which("dwg2dxf") or shutil.which("dwgread")),
    }


@app.post("/")
async def ingest(
    file: UploadFile = File(...),
    projectId: str = Form(...),
    organizationId: str = Form(...),
):
    if not valid_uuid(projectId) or not valid_uuid(organizationId):
        raise HTTPException(status_code=400, detail="invalid tenant context")

    filename = Path(file.filename or "upload").name
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="unsupported CAD format")

    payload = await file.read(MAX_CAD_BYTES + 1)
    if not payload or len(payload) > MAX_CAD_BYTES:
        raise HTTPException(status_code=413, detail="invalid CAD file size")

    try:
        with tempfile.TemporaryDirectory(prefix="basoul-cad-upload-") as directory:
            source = Path(directory) / filename
            source.write_bytes(payload)
            data = normalize(source)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"CAD normalization failed: {exc}") from exc

    data.setdefault("source", {})["tenantContext"] = {
        "projectId": projectId,
        "organizationId": organizationId,
    }
    return {"data": data}
