# Image du service « app » — SvelteKit rendu par `@sveltejs/adapter-node`.
# Lot T-003, pile arrêtée par STACK-TECHNIQUE.md §3 : Node 24.19.0 « Krypton »,
# ligne LTS active jusqu'au 30/04/2028 ; pnpm 11.22.0 (ARB-008, la ligne 11 est
# actée là où STACK §3 retient la 10).
#
# Deux étages. Le premier construit et n'entre jamais en production : il porte
# les dépendances de construction et le greffon de mesure `verif/banc/`. Le
# second ne reçoit que la sortie de `vite build` et les dépendances d'exécution.
# C'EST CE QUI GARANTIT QUE L'INSTRUMENT NE VOYAGE PAS AVEC LE PRODUIT : le mode
# démo `/__design/…` est monté en `apply: 'serve'`, `vite build` ne le traverse
# pas, et `verif/` n'est pas copié dans l'étage final.

# ───────────────────────────────────────────────────────────── construction ──
FROM node:24.19.0-bookworm-slim AS constructeur

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true
RUN npm install --global --no-fund --no-audit pnpm@11.22.0

WORKDIR /chantier

# Le manifeste d'abord : la couche d'installation ne se rejoue que si les
# dépendances changent.
COPY package.json pnpm-lock.yaml ./
# `--ignore-scripts` : le script `prepare` appelle `svelte-kit sync`, qui exige
# la configuration ; elle n'est copiée qu'après. La synchronisation est faite
# explicitement plus bas.
RUN pnpm install --frozen-lockfile --ignore-scripts

# La configuration de construction. `vite.config.ts` importe le greffon du mode
# démo : le fichier doit exister pour que la configuration se charge, même s'il
# n'est monté qu'en développement.
COPY svelte.config.js vite.config.ts tsconfig.json ./
COPY verif/banc/mode-demo.mjs ./verif/banc/mode-demo.mjs
# Le greffon lit ce protocole au chargement du module, donc AVANT tout choix de
# mode : sans lui, `vite build` échoue. Il ne franchit pas l'étage suivant.
COPY verif/references/protocole-app.json ./verif/references/protocole-app.json

# Les sources de l'application, et rien de plus.
COPY src ./src
COPY static ./static

RUN pnpm exec svelte-kit sync && pnpm run build

# Les dépendances d'exécution seules, dans une arborescence propre.
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# ───────────────────────────────────────────────────────────────── exécution ──
FROM node:24.19.0-bookworm-slim AS execution

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    RACINE_FICHIERS=/var/lib/codicillus/fichiers

WORKDIR /application

# Le compte `node` est fourni par l'image officielle : le produit ne tourne pas
# en superutilisateur.
COPY --from=constructeur --chown=node:node /chantier/build ./build
COPY --from=constructeur --chown=node:node /chantier/node_modules ./node_modules
COPY --from=constructeur --chown=node:node /chantier/package.json ./package.json

# Pièces jointes et images : volume monté par la composition, sauvegardé avec
# la base (RG-NF-09).
RUN mkdir -p "$RACINE_FICHIERS" && chown -R node:node "$RACINE_FICHIERS"

USER node
EXPOSE 3000

# Contrôle de santé intégré à l'image : il ne traverse aucune brique
# optionnelle (ADR-009).
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"

CMD ["node", "build/index.js"]
