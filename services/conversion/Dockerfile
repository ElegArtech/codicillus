# Image du service « conversion » — brique OPTIONNELLE (P-10, RG-NF-01,
# ADR-009). Lot T-003 : le conteneur, ses outils et son contrôle de santé.
# La conversion elle-même est le lot T-042 (vague 7) ; rien de son
# comportement n'est décidé ici.
#
# Versions arrêtées par STACK-TECHNIQUE.md §3 et §4.6 :
#   Python 3.14.7 · Pandoc 3.10.2 · python-pptx 1.0.2 · pdfplumber 0.11.10
#   FastAPI 0.141.1
#
# Pandoc est sous GPL-2.0+. Il s'exécute comme PROCESSUS SÉPARÉ dans ce
# conteneur distinct, sans liaison de code avec l'application : aucune licence
# copyleft ne contamine le produit (STACK §3, C-11).
FROM python:3.14.7-slim-trixie

ARG VERSION_PANDOC=3.10.2

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    VERSION_PANDOC=${VERSION_PANDOC}

# Pandoc est installé depuis le paquet officiel de la version exigée, et non
# depuis le dépôt de la distribution : c'est la seule façon de tenir 3.10.2
# exactement.
RUN set -eux; \
    apt-get update; \
    apt-get install --yes --no-install-recommends ca-certificates curl; \
    curl --fail --location --output /tmp/pandoc.deb \
      "https://github.com/jgm/pandoc/releases/download/${VERSION_PANDOC}/pandoc-${VERSION_PANDOC}-1-amd64.deb"; \
    dpkg --install /tmp/pandoc.deb; \
    rm /tmp/pandoc.deb; \
    apt-get purge --yes curl; \
    apt-get autoremove --yes; \
    rm -rf /var/lib/apt/lists/*; \
    pandoc --version | head -1

WORKDIR /service

COPY dependances.txt ./
RUN pip install --no-cache-dir --requirement dependances.txt

COPY service.py ./

# Le service ne tourne pas en superutilisateur, et n'écrit que dans un espace
# de travail éphémère : un fichier malformé n'a rien à corrompre (RG-M12-04).
RUN useradd --create-home --shell /usr/sbin/nologin conversion \
    && mkdir -p /var/tmp/conversion \
    && chown conversion:conversion /var/tmp/conversion
USER conversion

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=10s --start-period=15s --retries=5 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/sante', timeout=5).status == 200 else 1)"

CMD ["uvicorn", "service:application", "--host", "0.0.0.0", "--port", "8000"]
