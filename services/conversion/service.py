"""Service de conversion — enveloppe d'exploitation, lot T-003.

Ce module ne convertit RIEN. Il porte l'interface du conteneur et son
contrôle de santé, exigés par la composition d'exploitation
(STACK-TECHNIQUE.md §8) et par le critère de sortie du lot T-003.

La conversion des trois formats bureautiques — `.docx` par Pandoc, `.pptx`
par python-pptx, `.pdf` par pdfplumber — est le lot T-042 (vague 7). Écrire
ici la moindre règle de conversion serait un comblement : ni M12.1, ni
RG-M12-04 ne sont dans le périmètre de T-003.

Deux invariants du service, posés par ADR-004 et ADR-009, valent dès
maintenant et sont rappelés à celui qui écrira T-042 :

  * le service retourne du Markdown et des images extraites, JAMAIS le
    document canonique — l'application applique ensuite son convertisseur
    unique (ADR-004) ;
  * l'appel est fichier par fichier, et l'arrêt du service dégrade l'import
    bureautique sans empêcher l'import Markdown (ADR-009, RG-NF-01).
"""

from __future__ import annotations

import shutil
import subprocess
from importlib import metadata

from fastapi import FastAPI

application = FastAPI(
    title="Codicillus — service de conversion",
    description=(
        "Brique optionnelle. Son arrêt dégrade l'import bureautique, "
        "il n'interrompt jamais le produit (P-10, RG-NF-01)."
    ),
    version="0.1.0",
)


def _version_pandoc() -> str | None:
    """Version de Pandoc réellement installée, ou None s'il est absent."""
    chemin = shutil.which("pandoc")
    if chemin is None:
        return None
    try:
        sortie = subprocess.run(
            [chemin, "--version"],
            capture_output=True,
            text=True,
            timeout=10,
            check=True,
        )
    except (subprocess.SubprocessError, OSError):
        return None
    premiere_ligne = sortie.stdout.splitlines()[0] if sortie.stdout else ""
    return premiere_ligne.removeprefix("pandoc ").strip() or None


def _version_paquet(nom: str) -> str | None:
    """Version d'un paquet Python installé, ou None s'il est absent."""
    try:
        return metadata.version(nom)
    except metadata.PackageNotFoundError:
        return None


@application.get("/sante")
def sante() -> dict[str, object]:
    """Le service répond, et il dit avec quels outils.

    Renvoyer les versions n'est pas un ornement : c'est ce qui distingue un
    conteneur qui répond d'un conteneur qui sait convertir. Un outil absent se
    lit ici, et non au premier fichier importé.
    """
    outils = {
        "pandoc": _version_pandoc(),
        "python-pptx": _version_paquet("python-pptx"),
        "pdfplumber": _version_paquet("pdfplumber"),
    }
    return {
        "service": "conversion",
        "critique": False,
        "outils": outils,
        "complet": all(version is not None for version in outils.values()),
    }
