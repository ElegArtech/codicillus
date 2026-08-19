#!/usr/bin/env bash
# Prépare une copie de travail (worktree) pour un lot parallèle.
#
# PLAN §6.4 et §7.4 : deux lots ne s'exécutent en parallèle que s'ils ne
# partagent ni fichier de route, ni définition de composant. L'arbre partagé
# a produit cinq symptômes en cinq vagues — batteries polluées par le lot
# voisin, `check` rouge par intermittence, correctif entré dans le commit d'un
# autre lot, six serveurs de développement orphelins (ECART-014 É-2,
# ECART-017 É-8, ECART-018 É-4, ECART-021 É-6).
#
# node_modules est LIÉ et non copié : 208 paquets, une installation par copie
# coûterait plus que le lot lui-même. Le lien est sûr ici parce qu'aucun lot
# n'installe de dépendance — celles-ci sont épinglées à l'exact depuis T-002.
set -euo pipefail

copie="${1:?usage: preparer-copie.sh <chemin-de-la-copie> [port]}"
port="${2:-0}"
racine="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

[ -d "$copie" ] || { echo "preparer-copie — $copie n'existe pas." >&2; exit 1; }

# 1. Dépendances : lien vers l'arbre principal.
[ -e "$copie/node_modules" ] || ln -s "$racine/node_modules" "$copie/node_modules"

# 2. Fichiers non suivis déclarés.
while read -r f; do
  case "$f" in ''|\#*) continue ;; esac
  [ -f "$racine/$f" ] && cp "$racine/$f" "$copie/$f" || true
done < "$racine/.worktreeinclude"

# 3. Un port de serveur de développement par copie : sans quoi le second lot
#    lancé échoue sur un port occupé, ou pire, mesure le serveur du premier.
if [ "$port" != "0" ]; then
  printf 'PORT_DEV=%s\n' "$port" >> "$copie/.env.local"
  echo "preparer-copie — port de développement : $port"
fi

# 4. Synchronisation SvelteKit : `.svelte-kit/tsconfig.json` est GÉNÉRÉ et ignoré
#    par git. Sans lui, une copie fraîche rend « Tsconfig not found » et vitest
#    déclare « no tests » — un faux vert particulièrement traître : la commande
#    sort en échec, mais un lecteur pressé lit « no tests » comme « rien à faire ».
(cd "$copie" && pnpm exec svelte-kit sync >/dev/null)

# 5. LE VERROU DES SOURCES DE VÉRITÉ.
#
#    ÉCART-037 — il manquait, et il a manqué à TOUTES les copies depuis la
#    création de ce script. `git worktree add` recrée les fichiers avec les
#    permissions normales : le `chmod a-w` posé sur l'arbre principal (ECART-004)
#    NE SE PROPAGE PAS. Une vingtaine de lots ont donc travaillé avec cadrage/,
#    mockups/ et règles/ en écriture, alors que CLAUDE.md affirme le contraire.
#
#    Aucun n'a écrit — `verif:gel` est resté vert, 43 empreintes intactes à
#    chaque clôture — mais la protection était redevenue DÉCLARATIVE, ce qui est
#    précisément la faute qu'ECART-004 avait relevée et que je croyais close.
#
#    C'est un exécutant qui l'a trouvé, en sondant l'écriture au lieu de croire
#    le document.
chmod -R a-w "$copie/cadrage" "$copie/mockups" "$copie/règles" 2>/dev/null || true
[ -d "$copie/verif/references" ] && chmod -R a-w "$copie/verif/references" 2>/dev/null || true

echo "preparer-copie — $copie prête (dépendances liées, $(basename "$racine") comme source)."
