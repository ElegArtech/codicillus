# Service optionnel de conversion bureautique, autonome à l'exécution.
FROM python:3.14.7-slim-trixie
LABEL org.opencontainers.image.source="https://github.com/ElegArtech/codicillus" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.title="Codicillus"

ARG VERSION_PANDOC=3.10.2
ARG TARGETARCH=amd64
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    VERSION_PANDOC=${VERSION_PANDOC}

# Le paquet officiel conserve les notices de licence de Pandoc.
RUN set -eux; \
    apt-get update; \
    apt-get install --yes --no-install-recommends ca-certificates curl; \
    curl --fail --location --output /tmp/pandoc.deb \
      "https://github.com/jgm/pandoc/releases/download/${VERSION_PANDOC}/pandoc-${VERSION_PANDOC}-1-${TARGETARCH}.deb"; \
    dpkg --install /tmp/pandoc.deb; \
    rm /tmp/pandoc.deb; \
    apt-get purge --yes curl; \
    apt-get autoremove --yes; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /service
COPY dependances.txt ./
RUN pip install --no-cache-dir --requirement dependances.txt
COPY service.py convertisseurs.py ./
RUN useradd --create-home --shell /usr/sbin/nologin conversion \
    && mkdir -p /var/tmp/conversion \
    && chown conversion:conversion /var/tmp/conversion
USER conversion
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=10s --start-period=15s --retries=5 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/sante', timeout=5).status == 200 else 1)"
CMD ["uvicorn", "service:application", "--host", "0.0.0.0", "--port", "8000"]
