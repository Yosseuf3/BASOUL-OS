FROM debian:bookworm-slim AS libredwg-build

ARG LIBREDWG_VERSION=0.14.8531
ARG LIBREDWG_SHA256=87568728aa2c0340f18c09ce438445009077b55bdab5221f960c35758b7131ac

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl xz-utils build-essential autoconf automake libtool pkg-config python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp/libredwg
RUN curl -fsSLo libredwg.tar.xz \
      "https://github.com/LibreDWG/libredwg/releases/download/${LIBREDWG_VERSION}/libredwg-${LIBREDWG_VERSION}.tar.xz" \
    && echo "${LIBREDWG_SHA256}  libredwg.tar.xz" | sha256sum -c - \
    && tar -xJf libredwg.tar.xz --strip-components=1 \
    && ./configure --disable-bindings --disable-python --disable-docs --disable-shared --prefix=/opt/libredwg \
    && make -j"$(nproc)" \
    && make install

FROM python:3.12-slim-bookworm

LABEL org.opencontainers.image.title="BASOUL CAD Ingestion Gateway" \
      org.opencontainers.image.description="Isolated DWG/DXF normalization boundary for BASOUL Architecture" \
      org.opencontainers.image.licenses="GPL-3.0-or-later boundary + MIT application dependencies"

COPY --from=libredwg-build /opt/libredwg/bin/dwgread /usr/local/bin/dwgread
COPY --from=libredwg-build /opt/libredwg/bin/dwg2dxf /usr/local/bin/dwg2dxf

WORKDIR /app
COPY tools/cad-ingestion/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY tools/cad-ingestion/cad_ingest.py ./cad_ingest.py

RUN useradd --create-home --uid 10001 cad && chown -R cad:cad /app
USER cad

ENTRYPOINT ["python", "/app/cad_ingest.py"]
