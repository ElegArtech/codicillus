# Construction de l'application et des commandes de gestion.
FROM node:24.19.0-bookworm-slim AS constructeur

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true
RUN npm install --global --no-fund --no-audit pnpm@11.22.0

WORKDIR /application
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY svelte.config.js vite.config.ts tsconfig.json ./
COPY src ./src
COPY static ./static
COPY base ./base
COPY recherche ./recherche
COPY seeds ./seeds
COPY LICENSE THIRD_PARTY_NOTICES.md ./
RUN pnpm exec svelte-kit sync && pnpm run build

# Commandes ponctuelles : migrations, premier compte, réindexation.
# Vite exécute le TypeScript ; aucun paquet n'est installé au démarrage.
FROM constructeur AS gestion
ENV RACINE_FICHIERS=/var/lib/codicillus/fichiers
RUN mkdir -p "$RACINE_FICHIERS" \
    && chown -R node:node /application "$RACINE_FICHIERS"
USER node
ENTRYPOINT ["pnpm"]
CMD ["base:etat"]

FROM constructeur AS dependances
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Serveur : uniquement la construction et les dépendances d'exécution.
FROM node:24.19.0-bookworm-slim AS execution
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    RACINE_FICHIERS=/var/lib/codicillus/fichiers
WORKDIR /application
COPY --from=constructeur --chown=node:node /application/build ./build
COPY --from=dependances --chown=node:node /application/node_modules ./node_modules
COPY --from=constructeur --chown=node:node /application/package.json /application/LICENSE /application/THIRD_PARTY_NOTICES.md ./
RUN mkdir -p "$RACINE_FICHIERS" && chown node:node "$RACINE_FICHIERS"
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "build/index.js"]
