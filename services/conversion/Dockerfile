# Service optionnel de conversion bureautique, autonome à l'exécution.
# L'image de base est épinglée par empreinte : une étiquette se déplace, l'empreinte non.
FROM python:3.14.7-slim-trixie@sha256:51dafde81dbdb6ebde285137a295cf18a47ca95234fe388a343719cb97305b3d
LABEL org.opencontainers.image.source="https://github.com/ElegArtech/codicillus" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.title="Codicillus"

ARG VERSION_PANDOC=3.10.2
ARG TARGETARCH=amd64
# Empreintes publiées avec la version de Pandoc, par architecture : le paquet téléchargé
# est refusé s'il diffère. Elles changent avec VERSION_PANDOC.
ARG EMPREINTE_PANDOC_AMD64=6c06b69b49ae95087573631a6fcafb233ab7ab51e5cfa73f7539d6c964a2640d
ARG EMPREINTE_PANDOC_ARM64=868c7675806237dd21711e3890e82f2844e011c8f542a1ddc6245df4324dd6b5
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    VERSION_PANDOC=${VERSION_PANDOC}

# Le paquet officiel conserve les notices de licence de Pandoc.
RUN set -eux; \
    apt-get update; \
    apt-get install --yes --no-install-recommends ca-certificates curl; \
    curl --fail --location --output /tmp/pandoc.deb \
      "https://github.com/jgm/pandoc/releases/download/${VERSION_PANDOC}/pandoc-${VERSION_PANDOC}-1-${TARGETARCH}.deb"; \
    case "$TARGETARCH" in \
      amd64) empreinte="$EMPREINTE_PANDOC_AMD64" ;; \
      arm64) empreinte="$EMPREINTE_PANDOC_ARM64" ;; \
      *) echo "architecture sans empreinte : $TARGETARCH" >&2; exit 1 ;; \
    esac; \
    echo "$empreinte  /tmp/pandoc.deb" | sha256sum --check --strict; \
    dpkg --install /tmp/pandoc.deb; \
    rm /tmp/pandoc.deb; \
    apt-get purge --yes curl; \
    apt-get autoremove --yes; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /service
COPY dependances.txt ./
RUN pip install --no-cache-dir --require-hashes --no-deps --requirement dependances.txt
COPY service.py convertisseurs.py ./
RUN useradd --create-home --shell /usr/sbin/nologin conversion \
    && mkdir -p /var/tmp/conversion \
    && chown conversion:conversion /var/tmp/conversion
USER conversion
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=10s --start-period=15s --retries=5 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/sante', timeout=5).status == 200 else 1)"
CMD ["uvicorn", "service:application", "--host", "0.0.0.0", "--port", "8000"]
