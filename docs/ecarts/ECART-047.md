# ÉCART-047 — Lot T-012b, la batterie 6 — 20 août 2026

**Quatorze écarts remontés. Tous vérifiés. Aucun écarté. Le lot est LIVRÉ ROUGE, et le rouge est le
résultat.**

Gravité d'ensemble : **haute**, et pour la première fois depuis l'ouverture du dépôt la gravité vient
du **produit**, non de l'instrument.

```
pnpm test:etancheite   → rc 1
  EMPREINTE 90/145/131/12 · couples 2/82/7/0/0 · temps dans-le-bruit
  378 cases (54 adresses × 7 personas) : 90 conformes · 145 VACANTES · 131 non couvertes · 12 défauts
  19 défauts mesurés — 12 de matrice, 7 couples fuyants
```

**Vérifié par l'orchestrateur sur l'arbre fusionné** : trois exécutions consécutives rendent
`90/145/131/12 · couples 2/82/7/0/0`, à l'identique. Cinq sondes mordent, la sonde inerte **refuse de
conclure** en code 1.

---

## É-1 — **Gravité HAUTE. Trois routes servent du contenu interne sans aucun contrôle d'accès.**

**Je l'ai reproduit à la main, sur le produit construit, avant d'accepter le rapport.**

```
$ pnpm build && node build/index.js          (port 5920, base réelle)
$ curl -H 'accept: text/html' -o /tmp/sig.html -w '%{http_code} %{size_download}' \
       http://127.0.0.1:5920/univers/production/infrastructure/signets
200 18629
```

**Aucun cookie. Aucune session. 18 629 octets.** Et le contenu n'est pas une coquille vide — extrait du
document servi à l'anonyme :

```
Signets de Infrastructure · Auteur Karim Belhadj · Marc Ferreira
Documentation officielle Barman · Page d'état de l'hébergeur · Journal officiel des versions
Codicillus Accueil Production Infrastructure Exploitation
Poste de travail · Déploiement · Projets
Modifier · Nouveau signet · Créer
```

Des signets curatés, des noms d'auteurs, **l'arborescence complète des univers et domaines**, et les
actions d'écriture. C'est `RG-ACC-01` en défaut — *« l'anonyme ne voit jamais un contenu non public :
ni en navigation, ni en recherche, ni en suggestion, ni en cartographie, ni via un lien direct »* — et
`P-09` par-dessus.

**Le tableau complet, mesuré :**

| Adresse | Servie à | Octets | Attendu (§5.5) |
|---|---|---|---|
| `/univers/{u}/{d}/signets` | **anonyme**, contributeur sans droit, **compte désactivé** | 18 529 | 404 V-04 / V-26 |
| `/importer` | contributeur sans droit, lecteur | 14 874 | 404 V-26 *(sans droit de rédaction)* |
| `/console/univers` | contributeur sans droit, lecteur, rédacteur, gestionnaire | 30 315 | 404 V-26 |

**Et le symptôme qui nomme la cause** : `/univers/ceci-n-existe-pas/ceci-n-existe-pas/signets` rend
**exactement les mêmes 18 529 octets**. La route ne lit pas ses paramètres. Elle rend l'état de
maquette, quoi qu'on lui demande.

**La cause est structurelle et elle est déjà écrite au dépôt.** Ces routes ont été montées par des lots
de **vue**, dont le périmètre exclut explicitement le chargeur et la garde
(`src/routes/connexion/+page.svelte:11-14` : *« pas de chargeur, pas de garde de droit, pas
d'authentification »*). `T-012` É-11 disait *« `event.locals.identite` n'a aucun lecteur »* ; en voici
la conséquence à l'échelle des routes. **Aucune route de page n'appelle
`src/lib/droits/resolution.ts`** — vérifié.

> **`T-011` a livré la résolution des droits le 19 août. Personne ne l'appelle. Rien ne le mesurait
> jusqu'à cette batterie.**

**Ce n'est le défaut d'aucun lot livré** : chacun a respecté son périmètre et l'a écrit. C'est **un trou
du DAG** — aucun contrat ne nomme le lot qui pose les gardes de ces trois routes. Voir la clôture.

---

## É-2 et É-3 — Mes deux arbitrages contredits · **amendés par `ARB-057`**

| # | Ce que j'avais écrit | Ce que la mesure dit |
|---|---|---|
| É-2 | `ARB-052` : *« aucune adresse portant un identifiant de corpus ne redirige, jamais »* | **deux adresses la contredisent** — `/console/imports/{lot}` (`routes.md:183`) et `/console/exports/{univers}/{domaine}` (`:185`). Elles redirigent sur leur **préfixe**, avant toute résolution : la réponse ne dépend pas du corpus. Ce sont d'ailleurs les **deux seuls couples indiscernables PROUVÉS** du dépôt |
| É-3 | `ARB-053` : *« aucun client ne peut forger l'en-tête »* | la prémisse tient (cinq services sur la boucle locale, vérifié) **mais ne dit pas ce que j'en concluais** : `compose.yaml` déclare `networks: [codicillus]` sur **six** services — tout conteneur du réseau atteint `app:3000` directement, les deux optionnels compris |

`ARB-057` amende les deux **énoncés** ; les deux **décisions** tiennent. La borne d'`ARB-052` visait une
propriété syntaxique là où son propre critère opérationnel visait la bonne chose ; la frontière de
confiance d'`ARB-053` est *l'hôte et le réseau de la composition*, non le frontal.

**Le lot a mesuré plutôt qu'obéi, et c'est exactement ce que la borne du contrat lui demandait.**

---

## É-4 — **`ARB-053` et la mesure temporelle sont couplés, et je ne l'avais pas vu**

Mesuré en retirant temporairement les deux lignes de `compose.yaml` :

```
REFUS DE MESURER — séries temporelles hétérogènes — côté mesuré 401+429 et côté témoin 401+429 :
la médiane mélange deux chemins de coût. Le barème de RG-M16-01 est entré dans la mesure, donc
l'origine n'est pas isolée (T-012, enseignement n° 1).                                    rc 2
médianes 2.169 ms contre 2.162 ms
```

Sans `ADDRESS_HEADER`, les 160 requêtes partagent l'origine du frontal, le barème entre au septième
essai, et les tirages empruntent le chemin **429 — 2,17 ms, sans Argon2id**. Après correction :
**401 + 401, 13,5 ms, séries homogènes**.

**La neutralisation par origine distincte n'opère que parce qu'`ARB-053` est posé.** Deux cibles que
mon contrat traitait comme indépendantes sont en fait l'une la condition de l'autre — et c'est
l'enseignement n° 1 de `T-012`, devenu un **contrôle exécutable** : l'hétérogénéité de statut fait
**refuser de conclure**, code 2.

---

## É-5 — `POST /connexion` rend 200 quand le client ne demande pas de HTML

```
accept: (défaut de fetch) → 200 · application/json ·   66 o · {"type":"failure","status":401,…}
accept: text/html         → 401 · text/html        · 4409 o · la page
```

**Ce n'est pas une fuite** — identique des deux côtés du couple — mais aucun document du dépôt ne
l'énonce, et c'est un piège pour toute batterie future : *une mesure qui laisse l'en-tête par défaut de
`fetch` conclut sur des codes que l'utilisateur ne reçoit jamais.* La batterie envoie
`accept: text/html`.

---

## É-6 — Piège nouveau · **inscrit `P-27`**

Le joker de type MIME écrit **dans un commentaire de bloc JavaScript** ferme le commentaire. L'erreur
remonte en `SyntaxError: Unexpected template string`, **à quarante lignes de la cause**. Coûté une
exécution.

Quatrième membre d'une famille que le dépôt connaît : `P-9` (citer `prettier-ignore`), `P-17` (accent
grave dans un modèle littéral), `P-20` (citer une forme de balisage). **Décrire une forme, ne jamais la
citer.**

---

## É-7, É-8, É-9 — Trois pièges d'instrument, et ils valent mieux que la batterie elle-même

| # | Le piège | Ce qu'il coûtait | La parade |
|---|---|---|---|
| É-7 | **une matrice dont les cases se contaminent mesure l'ordre, pas les droits.** `/deconnexion` est la seule action d'écriture en GET du produit (`ARB-054`) : la case qui la demandait **fermait la session**, et les 40 cases suivantes du même persona étaient mesurées en anonyme | **76 défauts, dont 62 étaient cet artefact** | session rouverte avant chaque case. Et `RG-ACC-02` est mesurée **à part** — sinon neutraliser l'effet de bord aurait effacé la preuve de l'effet de bord |
| É-8 | **la page d'erreur de SvelteKit lie ses ressources en chemin RELATIF.** Une adresse plus profonde d'un cran rend un corps plus long de 15 octets (`../` × 5) | **sept faux « couples discernables »** | construire le côté inexistant **à la même profondeur** — jamais affaiblir la clé. C'est `ECART-041` évité de justesse |
| É-9 | **caractériser une série par son premier élément ne mesure pas la série.** La première rédaction imprimait « codes 401 / 401 » pour une série dont la médiane de 2,26 ms ne pouvait contenir aucune vérification Argon2id | un verdict temporel faux, d'apparence irréprochable | identité vérifiée sur les 40 tirages ; l'hétérogénéité fait refuser de conclure |

**É-9 a été trouvé en rejouant l'état d'avant la correction** — c'est l'argument même du *« relève ta
ligne de base »*, retourné contre le lot lui-même.

**Et le plancher de bruit a été redéfini deux fois, chaque fois sur une faute chiffrée** :

- pris sur les **séries mesurées**, il enfle avec l'effet qu'il doit détecter : sonde
  `latence-discernable`, **11,125 ms de plancher pour 11,157 ms d'écart** — le verdict tenait à 32 µs ;
- pris sur le témoin **mis en commun**, deux séries écartées de 20 ms rendent 20 ms de dispersion et le
  garde-fou « le témoin dépasse son plancher » devenait **inatteignable** — `P-5` sur le garde-fou.

Il est donc pris **série par série**, et un unitaire l'exerce.

---

## É-10 — Onze traces périmées, dont `docs/routes.md:460`

`docs/routes.md:460` disait : *« la mesure de l'indiscernabilité temporelle, **sans batterie à ce
jour** — assignée à T-011 »*. **Elle existe.** Et neuf fichiers de `src/` attribuent encore la batterie
6 au « lot T-011 » (`V-01`, `V-02`, `V-03`, `V-04`, `V-06`, `V-26`, `src/lib/public/recherche.ts`,
`src/lib/public/adresse-non-resolue.ts`).

Le lot ne les a pas touchés — `routes.md` est tenu par arbitrage, `src/vues/**` était le territoire de
`T-013b`. **Corrigés par l'orchestrateur au rapatriement.**

---

## É-11 — `XFF_DEPTH` trop grand ne fait pas que faire confiance à trop de sauts : **il tue l'action**

Observé sous sonde : `XFF_DEPTH=2` avec un seul en-tête, `POST /connexion` rend **500** et rien n'est
enregistré. Contrainte d'exploitation, portée à `ARB-057` §3 et au commentaire de `compose.yaml`.

---

## É-12 — Mon contrat disait « sept routes » ; il y en a **huit**

Relevé mécaniquement, et je l'ai revérifié :

```
$ find src/routes -name '+page.svelte' -o -name '+server.ts' | sort
src/routes/+page.svelte                                   src/routes/deconnexion/+server.ts
src/routes/carte-mentale/+page.svelte                      src/routes/importer/+page.svelte
src/routes/cartographie/+page.svelte                       src/routes/console/univers/+page.svelte
src/routes/connexion/+page.svelte                          src/routes/univers/[univers]/[domaine]/signets/+page.svelte
```

**Huit.** `docs/reprise.md` disait sept — écrit avant que `T-012` n'ajoute l'action de `/connexion` et
`/deconnexion`, et j'ai recopié le chiffre dans deux contrats sans le recompter. **`P-21`, encore, et
sur un chiffre trivial.** Corrigé.

---

## É-13 — Trois paramètres n'ont aucune valeur dans le corpus

`{jeton}`, `{fichier}`, `{lot}` : trois familles n'ont que leur côté *inexistant* mesurable. Compté
**non couvert**, jamais simulé. `pieces_jointes` est vide — la semence n'écrit aucun fichier.

---

## É-14 — Faute de méthode du lot, déclarée par lui

*« J'ai retouché l'instrument pendant qu'une série de preuves tournait. »* **Tout a été rejoué sur le
code définitif** — `check`, `test:unit`, trois exécutions de déterminisme, la matrice, la chaîne des
cinq sondes — et les chiffres du rapport viennent de cette dernière série.

**Un lot qui déclare sa propre faute de méthode et rejoue tout est plus fiable qu'un lot sans écart.**

---

## Ce que le lot ne couvre pas — et c'est la partie qui compte

### `RG-ACC-04` n'est pas déclarée tenue, et cette fois le chiffre existe

- **145 cases sur 378 sont VACANTES** : 31 routes sur 39 ne sont pas montées, leur 404 est une
  **absence**, pas une décision. La batterie les compte à part et **les traite comme un échec** — c'est
  `RA-01` refusé de face.
- **0 couple indiscernable prouvé sur une adresse de RESSOURCE.** Les deux prouvés portent sur un
  chemin fixe. Le point dur de V-04 — note interne contre adresse inexistante, *« la vérification la
  plus importante de cette vue »* (`V-04:2219`) — est **vacant** : `/guides/{identifiant}` n'existe pas.

`docs/routes.md:460` interdisait de déclarer `RG-ACC-04` tenue *tant que la batterie n'existe pas*.
**Elle existe. La règle reste non tenue, et c'est désormais mesuré au lieu d'être ignoré.**

### La batterie mesure le VERDICT d'une route, jamais le CONTENU qu'elle sert

Limite structurelle, et le lot l'a assortie d'une trouvaille que je confirme.
`seeds/corpus.ts:2452-2454` :

```ts
export function notesPubliques(notes = CORPUS) {
	return notes.filter((n) => n.visibilite === 'Publique');
}
```

`src/lib/droits/resolution.ts:328-330` exige, lui, `visibilite === 'publique' && statut === 'publiee'`.
**Deux définitions de « ce qu'un anonyme peut voir », et celle dont `V-01` se sert n'en porte que la
moitié.** Mesuré en base : **zéro** note `publique + brouillon` — la moitié manquante n'est exercée par
aucun cas, donc rien ne la voit. `P-5`, sur le chemin public du produit.

**Ce n'est pas exploitable aujourd'hui et ce le deviendra au premier brouillon public.** Hors territoire
du lot (`seeds/`, `src/vues/**`) : signalé, non comblé.

### Trois exigences de l'énoncé de la batterie ne sont pas couvertes du tout

`RG-M02-04` (`/recherche` non montée) · `RG-M17-01` (`/guides/{id}` non montée, et la demi-règle
ci-dessus) · `RG-M04-08` (pas de route **et** `pieces_jointes` vide). `PU-03` relève de la batterie 12.

### Et aucun seuil n'est posé

`verif/references/` est en écriture humaine seule, et **le lot ne s'est pas donné son seuil.** Si un
seuil est voulu, l'empreinte à figer est `90/145/131/12 · couples 2/82/7/0/0`, et **elle ne peut que
descendre**.

**Aucun seuil ne sera posé ici**, et le motif est celui d'`docs/orchestration.md` §4 : *« ne pose pas de
seuil sur une dette qu'un lot referme »*. Les 12 défauts sont fermables — ce sont trois gardes de route
—, et les 145 vacuités se referment route par route. Un seuil les enterrerait.

---

## P-22 — ce que le lot laisse derrière lui

Aucun conteneur créé, aucun volume, **aucun serveur orphelin** : la batterie démarre son serveur et le
tue dans son `finally`, vérifié par `ss -ltnp` et `ps`, **jamais par `pgrep`** (`P-1`). Attentes sur
**marqueurs écrits**. Base rendue propre : 5 comptes, 32 notes, 19 dossiers, **0 session, 0 droit,
0 tentative, 0 condensat**. Aucune dépendance installée. `package.json` **sans réordonnancement** —
`ECART-044` É-14 évité.

*(L'orchestrateur a, lui, laissé un serveur de sonde sur le port 5920 le temps de reproduire É-1 ; il a
été arrêté par son port, jamais par un motif de processus.)*

---

## La question de clôture, et la réponse est NON

> **Le dépôt suffirait-il à réexpliquer ce lot sans le rouvrir ?**

**Oui pour l'instrument.** Chaque décision minuscule porte en commentaire la faute chiffrée qui l'a
produite, et 33 unitaires les figent.

**Non pour É-1.** Trois routes servent du contenu interne, et **aucun contrat ne nomme le lot qui doit
les fermer.** Le DAG de la phase 1 attribue les gardes aux lots de route — `T-116` pour l'espace
public, `T-037` pour les notes —, mais `/univers/{u}/{d}/signets`, `/importer` et `/console/univers` ont
été **montées par avance** par les lots de liaison, sans que personne n'hérite de leur garde.

**C'est le trou du DAG que ce lot met au jour, et il ne se refermera pas tout seul.**
