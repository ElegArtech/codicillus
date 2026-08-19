#!/usr/bin/env node
/**
 * Batterie 17 — « un seul terme par concept ». `pnpm verif:vocabulaire`.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie JAMAIS ce fichier, ni la table de
 * synonymes qu'il porte, ni ses exonérations. Ajouter une exonération pour
 * qu'une occurrence « ne compte plus » est le contournement de vérification
 * nommé par PLAN §12 (RA-01). La sortie légitime d'un rouge est le protocole
 * d'écart.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'ELLE PROUVE
 *
 * `P-07`, septième des dix principes non négociables : « Un seul terme par
 * concept. Le vocabulaire du §2.3 est contractuel. Aucun synonyme ne circule
 * dans l'interface. Seul le concept "fiche" est renommable, et globalement
 * (M14.7). » `CLAUDE.md` §3 l'étend : « ni dans l'interface, ni dans le code,
 * ni dans les noms de tables, de colonnes, de routes, de types ou de
 * fichiers. »
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUNE SOURCE N'ÉNUMÈRE LES SYNONYMES INTERDITS — ET C'EST LE CŒUR DU
 * PROBLÈME
 *
 * Les douze termes sont donnés. Les mots qui leur sont interdits, non : le
 * brief n'en nomme QUE QUATRE, en deux phrases. Tout le reste d'une liste de
 * synonymes serait une décision d'exécutant, c'est-à-dire un comblement de
 * vide de spécification — ce que le contrat de ce dépôt interdit.
 *
 * La table est donc scindée en DEUX REGISTRES, et ils ne pèsent pas pareil :
 *
 *   TRACÉ    le synonyme est nommé par une phrase d'une source gelée. La
 *            phrase est recopiée dans l'entrée. C'est OPPOSABLE.
 *   DÉCIDÉ   le synonyme est proposé par l'instrument. Chaque entrée porte
 *            son motif, et un critère MÉCANIQUE recalculé à chaque exécution :
 *            le mot n'apparaît nulle part dans `cadrage/` (le compte est
 *            imprimé). Un exécutant ne crée pas d'interdiction contractuelle :
 *            ces occurrences sont un CONSTAT chiffré, remonté pour arbitrage,
 *            JAMAIS un rouge.
 *
 * Sept des douze termes n'ont, à ce jour, AUCUN synonyme déclarable : ni le
 * brief ni le cahier des charges n'en nomment, et aucun mot du français ne
 * s'impose sans arbitraire. La batterie ne les couvre donc pas, et elle le
 * dit à chaque exécution plutôt que de laisser croire qu'elle les couvre.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES HOMOGRAPHES — POURQUOI UNE OCCURRENCE N'EST PAS UNE VIOLATION
 *
 * « Page » dans « page d'accueil » n'est pas « page » pour « note ».
 * « Document » dans « le haut du document » non plus. Une batterie qui
 * compterait toutes les occurrences rendrait un chiffre illisible : mesuré,
 * les quatre synonymes tracés totalisent des centaines d'occurrences rendues
 * dont la quasi-totalité désignent l'écran, la pagination ou le papier.
 *
 * Chaque famille porte donc des EXONÉRATIONS : des contextes nommés, motivés,
 * et tracés à une occurrence réelle du corpus. Le régime est volontairement
 * asymétrique et conservateur :
 *
 *   · le DÉFAUT est la violation. Une occurrence qu'aucune exonération ne
 *     couvre est comptée comme un EMPLOI du synonyme ;
 *   · l'exonération est l'exception, et elle doit être écrite, motivée, et
 *     MORDRE : une exonération qu'aucune occurrence du gel ne déclenche est
 *     un élargissement gratuit, et la batterie la refuse en code 2 (P-5).
 *
 * Chaque exonération imprime son compte et un échantillon : rien n'est
 * absorbé en silence.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX CÔTÉS, ET LES QUATRE NATURES
 *
 * Le gel fait loi (`CLAUDE.md` §2). Si les 41 maquettes emploient un mot, le
 * produit a le droit de l'employer : le relever comme défaut de portage
 * reviendrait à opposer le produit à sa propre source. La batterie audite
 * donc les DEUX CÔTÉS, par le MÊME code, dans les MÊMES conditions de capture
 * (`verif/banc/`), et lit le verdict dans leur comparaison :
 *
 *     gel + application  → « gel »              regel, arbitrage
 *     application seule  → « portage »          corrigeable par le lot
 *     gel seul           → « gel non reporté »  divergence à signaler
 *     hors recoupement   → « instrument »       la batterie ne tranche pas
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA CLÉ DE RAPPROCHEMENT, ET SES DEUX CONTRÔLES — ÉCART-041
 *
 * Hier, la clé de la batterie 10 embarquait un extrait de `textContent` : le
 * compilateur Svelte élague les nœuds de texte blancs d'un côté et pas de
 * l'autre (P-8), et 31 défauts de portage sur 31 étaient faux. La leçon :
 * « une jointure produit deux fautes symétriques — sur-rapprocher masque un
 * défaut réel, sous-rapprocher en fabrique un faux ; prouve les deux ».
 *
 * Deux parades, et elles sont indépendantes :
 *
 *   1. la détection est faite NŒUD PAR NŒUD, jamais sur le texte concaténé de
 *      la page. L'élagage de Svelte porte sur les blancs EN BORD d'élément :
 *      il change la jointure entre nœuds, pas le contenu d'un nœud ;
 *   2. la clé retire TOUS les blancs du contexte. « Date Source et scénario »
 *      et « DateSource et scénarioAuteur » — les chaînes réelles d'ÉCART-041 —
 *      s'y rejoignent, et aucune paire de contextes réellement différents ne
 *      s'y confond (contrôle ci-dessous).
 *
 * Les deux sens sont MESURÉS à chaque exécution, jamais supposés :
 *
 *   · SUR-RAPPROCHEMENT — deux contextes distincts d'un même côté qui
 *     tombent sur la même clé. Ils seraient comptés une fois au lieu de deux,
 *     et un défaut réel serait masqué. Comptés et nommés.
 *   · SOUS-RAPPROCHEMENT — une ligne « portage » qui trouverait un jumeau au
 *     gel sous une clé PLUS LÂCHE (blancs, casse, accents et ponctuation
 *     repliés). Ce serait un faux portage, la faute exacte d'ÉCART-041.
 *     Comptés et nommés.
 *
 * Et `verif/vocabulaire.test.ts` fige les deux sens sur les chaînes réelles.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * P-5 RETOURNÉ : UNE INTERDICTION QUI NE MORD JAMAIS EST UN SUCCÈS
 *
 * `verif/etats.mjs` refuse en code 2 toute famille de marqueurs qu'aucune
 * classe du gel ne satisfait — « une règle qu'aucun cas n'exerce est une règle
 * dont on ignore si elle marche ». Ici la règle est une INTERDICTION : zéro
 * occurrence de « tag » dans le corpus est le résultat RECHERCHÉ, pas une
 * règle inerte. Le contrôle d'inertie serait donc à l'envers.
 *
 * Il est remplacé par deux contrôles qui, eux, valent :
 *
 *   · chaque famille porte une ÉPREUVE — un spécimen positif qu'elle doit
 *     détecter, un spécimen négatif qu'elle ne doit pas détecter. Les deux
 *     sont joués AVANT toute mesure ; un échec sort en code 2 ;
 *   · chaque EXONÉRATION doit mordre sur au moins une occurrence réelle du
 *     gel. Une exonération inerte est un élargissement gratuit : code 2.
 *
 * Et `--sonde` prouve que la batterie sait dire non, sur le corpus réel :
 * elle injecte le spécimen positif de CHAQUE famille du seul côté candidat et
 * exige que chacune rougisse en « portage ». Code retour inversé.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TROIS CERCLES DU PÉRIMÈTRE — ILS NE SE CONFONDENT PAS
 *
 *   1. L'INTERFACE   le texte rendu à l'utilisateur — nœuds de texte et
 *                    attributs qui portent un nom accessible. `P-07` en plein.
 *   2. LE CODE       les identifiants : classes, `id`, attributs `data-*` et
 *                    `name` relevés dans le DOM des deux côtés ; et, du seul
 *                    côté produit, les noms de fichiers, les symboles exportés
 *                    et les routes. `CLAUDE.md` §3 l'y étend.
 *   3. LE COMMENTAIRE  la prose de développeur, jamais rendue. COMPTÉE À
 *                    PART, jamais opposée — et le rapport le dit.
 *
 * `verif/**` est l'instrument, pas le produit : il n'est pas audité.
 * `mockups/**` est la source : il est LU, jamais opposé.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE CAS « FICHE » — LE SEUL DE SON ESPÈCE, ET LE SEUL QUE LE GEL N'ARBITRE
 * PAS
 *
 * M14.7 rend le concept renommable globalement par la configuration
 * (« Fiche », « Objet », « Entité »…). Opposer le mot « fiche » prendrait le
 * problème à l'envers : c'est l'INVERSE qui est le défaut — tout site du
 * produit qui écrit « fiche » en dur au lieu de lire `CONFIG.motFiche`.
 *
 * Et c'est la seule règle de cette batterie que le recoupement à deux côtés
 * NE PEUT PAS trancher : une maquette est du HTML statique, elle ne peut pas
 * lire une configuration. Que le gel écrive « Fiche » en dur n'autorise donc
 * rien. Le registre est compté à part, et sa nature est déclarée
 * « hors recoupement » plutôt que déduite d'une comparaison qui ne veut rien
 * dire ici.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * COMMANDES
 *   node verif/vocabulaire.mjs                 les 41 vues, 265 états, 2 côtés
 *   node verif/vocabulaire.mjs V-07 V-24       une sélection
 *   node verif/vocabulaire.mjs --gel           le gel seul (aucun serveur d'app)
 *   node verif/vocabulaire.mjs --occurrences   chaque emploi, une ligne
 *   node verif/vocabulaire.mjs --json          le relevé exploitable
 *   node verif/vocabulaire.mjs --sonde         la preuve qu'elle sait dire non
 *   node verif/vocabulaire.mjs --seuil-gel=N   le manque de gel ARBITRÉ à N
 *   node verif/vocabulaire.mjs --seuil-fiche=N le registre « fiche » ARBITRÉ à N
 *   node verif/vocabulaire.mjs --base=http://… un `vite dev` déjà démarré
 */

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCENARIOS = join(racine, 'verif', 'scenarios');

/* ═══════════════════════════════════════════════════════════════════════════
   1. LES DOUZE TERMES CONTRACTUELS

   Recopiés de `cadrage/BRIEF-VUES.md` §2.3, repris à `CLAUDE.md` §3. Ils ne
   servent pas à la détection — on ne cherche pas les termes, on cherche ce qui
   les remplace — mais ils sont la table de référence du rapport : c'est d'eux
   que se compte la COUVERTURE, c'est-à-dire le nombre de termes pour lesquels
   la batterie sait effectivement dire quelque chose.
   ═════════════════════════════════════════════════════════════════════════ */

export const TERMES = [
	{ terme: 'Note', quoi: 'L’unité de connaissance' },
	{ terme: 'Fiche', quoi: 'Une note à laquelle un type structuré a été attribué' },
	{ terme: 'Registre', quoi: 'L’un des deux modes de lecture : Référence ou Opérationnel' },
	{ terme: 'Univers', quoi: 'Le niveau de rangement le plus haut' },
	{ terme: 'Domaine', quoi: 'Un espace de connaissance autonome, appartenant à un univers' },
	{ terme: 'Dossier', quoi: 'Rangement arborescent dans un domaine, jusqu’à 10 niveaux' },
	{ terme: 'Étiquette', quoi: 'Mot-clé libre' },
	{ terme: 'Relation', quoi: 'Lien qualifié et dirigé entre deux notes' },
	{ terme: 'Signet', quoi: 'Lien web curaté' },
	{ terme: 'Fraîcheur', quoi: 'Le signal de fiabilité temporelle' },
	{ terme: 'Vérifier', quoi: 'Attester qu’une note est toujours d’actualité' },
	{ terme: 'Console', quoi: 'L’espace d’administration' }
];

/* ═══════════════════════════════════════════════════════════════════════════
   2. LES SYNONYMES INTERDITS — DEUX REGISTRES, ET ILS NE PÈSENT PAS PAREIL

   `registre: 'tracé'`  — la phrase de la source est recopiée en `trace`.
                          OPPOSABLE : un emploi côté portage rougit.
   `registre: 'décidé'` — décision de l'instrument, motivée, et appuyée sur un
                          critère mécanique recalculé à chaque exécution
                          (compte dans `cadrage/`). CONSTAT : jamais un rouge.

   `epreuve` — le spécimen positif que la famille DOIT détecter et le spécimen
   négatif qu'elle NE DOIT PAS détecter. Joués avant toute mesure (§7).
   ═════════════════════════════════════════════════════════════════════════ */

export const SYNONYMES = [
	/* ── Registre TRACÉ ──────────────────────────────────────────────────── */
	{
		terme: 'Note',
		famille: 'document',
		registre: 'tracé',
		re: /(?<![\p{L}\p{M}\p{N}])(documents?)(?![\p{L}\p{M}\p{N}])/giu,
		trace:
			'BRIEF-VUES.md §2.3 : « Note — L’unité de connaissance. Jamais « document », ' +
			'« page » ou « article » » · repris CLAUDE.md §3',
		epreuve: {
			positif: 'Ce document a été vérifié il y a 12 jours.',
			negatif: 'La documentation de la direction technique.'
		}
	},
	{
		terme: 'Note',
		famille: 'page',
		registre: 'tracé',
		re: /(?<![\p{L}\p{M}\p{N}])(pages?)(?![\p{L}\p{M}\p{N}])/giu,
		trace: 'BRIEF-VUES.md §2.3 : « Note — … Jamais « document », « page » ou « article » »',
		epreuve: {
			positif: 'Ranger cette page dans un dossier du domaine.',
			negatif: 'Vous devez être connecté pour accéder à cette page'
		}
	},
	{
		terme: 'Note',
		famille: 'article',
		registre: 'tracé',
		re: /(?<![\p{L}\p{M}\p{N}])(articles?)(?![\p{L}\p{M}\p{N}])/giu,
		trace: 'BRIEF-VUES.md §2.3 : « Note — … Jamais « document », « page » ou « article » »',
		epreuve: {
			positif: 'Rédiger un article dans ce dossier.',
			negatif: 'Articles de l’éditeur sur les erreurs de traitement'
		}
	},
	{
		terme: 'Étiquette',
		famille: 'tag',
		registre: 'tracé',
		re: /(?<![\p{L}\p{M}\p{N}])(tags?)(?![\p{L}\p{M}\p{N}])/giu,
		trace: 'BRIEF-VUES.md §2.3 : « Étiquette — Mot-clé libre. Jamais « tag » » · CLAUDE.md §3',
		epreuve: { positif: 'Ajouter un tag à la note.', negatif: 'Étiquette : sauvegarde' }
	},

	/* ── Registre DÉCIDÉ ─────────────────────────────────────────────────────
	   Quatre entrées, et le même motif pour trois d'entre elles : ce sont les
	   synonymes usuels du terme contractuel, et le cadrage NE LES EMPLOIE
	   JAMAIS — pas une fois sur ses quatre livrables. Ce compte est recalculé à
	   chaque exécution et imprimé : la justification est falsifiable, pas
	   déclarative.

	   « guide » est le cas lourd, et il est déclaré comme tel : le gel emploie
	   « guide » DE FAÇON SYSTÉMATIQUE dans l'espace public pour désigner une
	   note publique (« 6 guides publics », « Ce guide a été contrôlé le… »,
	   « Sommaire du guide », et la route `/guides/{identifiant}` de
	   `docs/routes.md`). Le cadrage ne tranche pas : « Guide utilisateur » y
	   est un TYPE DE NOTE (CDC §3.4), ce qui rend le mot légitime dans ce
	   sens-là et ambigu dans l'autre. C'est un vide de spécification, remonté
	   comme tel ; l'instrument le MESURE et ne l'oppose pas. */
	{
		terme: 'Note',
		famille: 'guide',
		registre: 'décidé',
		re: /(?<![\p{L}\p{M}\p{N}])(guides?)(?![\p{L}\p{M}\p{N}])/giu,
		trace:
			'DÉCISION de l’instrument. Motif : le gel désigne la note publique par « guide » ' +
			'(V-01, V-03, V-04, V-05, route /guides/), là où le vocabulaire contractuel dit ' +
			'« note ». Le cadrage ne l’autorise ni ne l’interdit : « Guide utilisateur » y est ' +
			'un TYPE de note (CDC §3.4), pas une désignation de l’objet.',
		epreuve: {
			positif: 'Ce guide a été contrôlé le 3 août.',
			negatif: 'Guide utilisateur'
		}
	},
	{
		terme: 'Dossier',
		famille: 'répertoire',
		registre: 'décidé',
		re: /(?<![\p{L}\p{M}\p{N}])(r[ée]pertoires?)(?![\p{L}\p{M}\p{N}])/giu,
		trace: 'DÉCISION. Synonyme usuel de « dossier » ; absent de cadrage/ (compte imprimé).',
		epreuve: {
			positif: 'Déplacer la note dans un autre répertoire.',
			negatif: 'barman recover écrase intégralement le répertoire de données de la cible'
		}
	},
	{
		terme: 'Signet',
		famille: 'favori',
		registre: 'décidé',
		re: /(?<![\p{L}\p{M}\p{N}])(favoris?|marque-pages?|bookmarks?)(?![\p{L}\p{M}\p{N}])/giu,
		trace: 'DÉCISION. Synonymes usuels de « signet » ; absents de cadrage/ (compte imprimé).',
		epreuve: { positif: 'Ajouter aux favoris', negatif: 'Nouveau signet' }
	},
	{
		terme: 'Console',
		famille: 'back-office',
		registre: 'décidé',
		re: /(?<![\p{L}\p{M}\p{N}])(back-?offices?)(?![\p{L}\p{M}\p{N}])/giu,
		trace: 'DÉCISION. Synonyme usuel de « console » ; absent de cadrage/ (compte imprimé).',
		epreuve: { positif: 'Ouvrir le back-office', negatif: 'Console d’administration' }
	}
];

/* Les mots du registre DÉCIDÉ dont l'absence de `cadrage/` est le motif. Le
   compte est refait à chaque exécution : un chiffre cité n'est pas une source. */
export const MOTS_DECIDES = [
	'guide',
	'guides',
	'répertoire',
	'répertoires',
	'favori',
	'favoris',
	'marque-page',
	'bookmark',
	'back-office',
	'backoffice'
];

/* ═══════════════════════════════════════════════════════════════════════════
   3. LES EXONÉRATIONS — LES HOMOGRAPHES, NOMMÉS ET TRACÉS

   Une exonération ne dit pas « ce mot est permis » : elle dit « dans CE
   contexte, ce mot ne désigne pas le concept ». Elle est appliquée par
   INDICES : le contexte exonérant doit recouvrir la position exacte de
   l'occurrence, sinon une occurrence fautive serait absoute par une autre
   occurrence légitime du même nœud.

   L'ordre compte : la première qui recouvre l'emporte, et c'est elle qui est
   nommée au rapport.

   Chacune doit MORDRE sur le gel, sans quoi la batterie refuse en code 2 :
   une exonération inerte est un élargissement que personne n'a demandé.
   ═════════════════════════════════════════════════════════════════════════ */

export const EXONERATIONS = [
	/* ── famille « page » ────────────────────────────────────────────────── */
	{
		famille: 'page',
		cle: 'page:pagination',
		re: /(?<![\p{L}\p{M}])pages?\s+(?:suivante|précédente|courante)(?![\p{L}\p{M}])|(?<![\p{L}\p{M}])par\s+pages?(?![\p{L}\p{M}])|«\s*page\s+\d+\s*»/giu,
		motif:
			'la PAGINATION d’une liste — « Page suivante », « 20 par page », « page 3 ». ' +
			'Une position dans un découpage d’affichage, jamais une unité de connaissance.',
		trace: 'V-41 : « 180 notes · 20 par page », « Page précédente », « Page suivante »'
	},
	{
		famille: 'page',
		cle: 'page:papier',
		re: /(?<![\p{L}\p{M}])(?:en|au)\s+(?:tête|bas|haut)\s+de\s+pages?(?![\p{L}\p{M}])|(?<![\p{L}\p{M}])(?:bas|haut|tête)\s+de\s+pages?(?![\p{L}\p{M}])/giu,
		motif:
			'une POSITION dans la hauteur de l’écran ou de la feuille — « en tête de page », ' +
			'« en bas de page ». Une coordonnée, pas un objet.',
		trace: 'V-14, V-15, V-18, V-37 : « affiché en tête de page » · V-38 : « en bas de page »'
	},
	{
		famille: 'page',
		cle: 'page:vierge',
		re: /(?<![\p{L}\p{M}])pages?\s+(?:blanches?|vierges?)(?![\p{L}\p{M}])/giu,
		motif:
			'l’IDIOME « repartir d’une page blanche » — l’absence de point de départ. ' +
			'Il ne désigne aucun objet du corpus ; il dit qu’il n’y en a pas.',
		trace: 'V-07, V-11, V-12, V-18, V-31 : « plutôt que de repartir d’une page blanche »'
	},
	{
		famille: 'page',
		cle: 'page:web-externe',
		re: /(?<![\p{L}\p{M}])pages?\s+d[’']état(?![\p{L}\p{M}])/giu,
		motif:
			'une PAGE WEB EXTERNE, cible d’un signet — « Page d’état de l’hébergeur ». ' +
			'Le signet pointe hors du corpus : sa cible n’est pas une note.',
		trace: 'V-22 : « Page d’état de l’hébergeur » · V-23, V-39 : « page d’état d’un fournisseur »'
	},
	/* DEUX RÈGLES D'ÉCRAN, ET NON UNE. La première rédaction n'en avait qu'une,
	   « déterminant + page », et l'épreuve de la famille l'a refusée : elle
	   exonérait « Ranger cette page dans un dossier du domaine », c'est-à-dire
	   le spécimen POSITIF. Une exonération qui absout la violation qu'elle est
	   censée laisser passer rend la famille inerte sans que rien ne le dise —
	   c'est P-5 par le mauvais bout. Les deux règles ci-dessous ne retiennent
	   que des SENS : un locatif, et un prédicat de rendu. */
	{
		famille: 'page',
		cle: 'page:locatif',
		re: /(?<![\p{L}\p{M}])(?:depuis|dans|sur)\s+(?:cette|une|la|sa|leur|ces|les)\s+pages?(?![\p{L}\p{M}])|(?<![\p{L}\p{M}])quitter\s+(?:la|sa|cette)\s+pages?(?![\p{L}\p{M}])|(?<![\p{L}\p{M}])(?:endroit|couverture|navigation\s+latérale)\s+de\s+(?:cette|la)\s+pages?(?![\p{L}\p{M}])|(?<![\p{L}\p{M}])(?:accéder|revenir)\s+à\s+(?:cette|la)\s+pages?(?![\p{L}\p{M}])/giu,
		motif:
			'UN LOCATIF : le mot dit OÙ l’on est, pas CE QUE l’on lit — « sans quitter la ' +
			'page », « depuis cette page », « dans une page », « accéder à cette page ». ' +
			'Aucune de ces tournures ne désigne une unité de connaissance.',
		trace:
			'V-07 : « ouvre la recherche sans quitter la page » · V-05 : « accéder à cette page » ' +
			'· V-38, V-40 : « depuis cette page » · V-27 : « en couverture de la page d’univers »'
	},
	{
		famille: 'page',
		cle: 'page:rendu',
		re: /(?<![\p{L}\p{M}])pages?\s+(?:introuvables?|inaccessibles?)(?![\p{L}\p{M}])|(?<![\p{L}\p{M}])pages?\s+n[’'](?:est|a|ont)(?![\p{L}\p{M}])|(?<![\p{L}\p{M}])pages?\s+(?:de\s+domaine|d[’']univers|de\s+dossier|d[’']accueil|de\s+connexion)(?![\p{L}\p{M}])/giu,
		motif:
			'LE RENDU LUI-MÊME : ce qui s’affiche ou ne s’affiche pas — « Page introuvable », ' +
			'« Cette page n’est pas accessible », « Page de domaine ». Le prédicat porte sur ' +
			'l’écran, et une note ne s’affiche pas « introuvable » : elle est absente.',
		trace:
			'V-04, V-26 : « Cette page n’est pas accessible », « Page introuvable » · V-33 : ' +
			'« Page de domaine : » · V-39 : « Cette page n’a pas pu s’afficher »'
	},

	/* ── famille « document » ────────────────────────────────────────────── */
	{
		famille: 'document',
		cle: 'document:html',
		re: /(?<![\p{L}\p{M}])(?:haut|bas|début|fin)\s+du\s+document(?![\p{L}\p{M}])/giu,
		motif:
			'le DOCUMENT HTML au sens du navigateur — « la navigation au clavier repart du ' +
			'haut du document ». Le contenant, jamais le contenu.',
		trace: 'V-40 : « la navigation au clavier repart du haut du document. »'
	},

	/* ── famille « article » ─────────────────────────────────────────────── */
	{
		famille: 'article',
		cle: 'article:publication-externe',
		re: /(?<![\p{L}\p{M}])articles?\s+de\s+l[’']éditeur(?![\p{L}\p{M}])/giu,
		motif:
			'une PUBLICATION EXTERNE citée par un signet — « Articles de l’éditeur sur les ' +
			'erreurs de traitement ». Hors corpus, donc hors du vocabulaire du corpus.',
		trace: 'V-22 : « Articles de l’éditeur sur les erreurs de traitement »'
	},

	/* ── famille « guide » ───────────────────────────────────────────────── */
	{
		famille: 'guide',
		cle: 'guide:type-de-note',
		re: /(?<![\p{L}\p{M}])guides?\s+(?:utilisateur|de\s+dépannage(?:\s+réseau)?)(?![\p{L}\p{M}])/giu,
		motif:
			'un TYPE DE NOTE fourni — « Guide utilisateur » (2) et « Guide de dépannage ' +
			'réseau » (9) sont deux des onze types de CDC §3.4. Le mot y est un nom de ' +
			'classification, pas une désignation de l’objet.',
		trace: 'CDC §3.4, types 2 et 9 · V-17, V-31, V-40 : « Guide utilisateur »'
	},
	{
		famille: 'guide',
		cle: 'guide:publication-externe',
		re: /(?<![\p{L}\p{M}])guides?[\s-]d[’'-]?hygiène(?![\p{L}\p{M}])|guide-hygiene/giu,
		motif:
			'le TITRE D’UNE PUBLICATION EXTERNE portée par un signet — « ANSSI — guide ' +
			'd’hygiène informatique ». Le titre d’un tiers n’est pas du vocabulaire de produit.',
		trace: 'V-22 : « ANSSI — guide d’hygiène informatique » et son adresse'
	},

	/* ── famille « répertoire » ──────────────────────────────────────────── */
	{
		famille: 'répertoire',
		cle: 'répertoire:système-de-fichiers',
		re: /(?<![\p{L}\p{M}])r[ée]pertoires?\s+de\s+données(?![\p{L}\p{M}])/giu,
		motif:
			'un RÉPERTOIRE DE SYSTÈME DE FICHIERS, cité dans le corps d’une note technique — ' +
			'« barman recover écrase intégralement le répertoire de données de la cible ». ' +
			'Le rangement documentaire n’y est pour rien.',
		trace: 'V-14, V-15, V-16 : « écrase intégralement le répertoire de données de la cible »'
	}
];

/* ═══════════════════════════════════════════════════════════════════════════
   4. LA DÉTECTION — PURE, DONC UNITAIRE (`verif/vocabulaire.test.ts`)
   ═════════════════════════════════════════════════════════════════════════ */

/* Les blancs que la typographie française sème et qu'aucune règle de contexte
   ne doit distinguer : insécable, insécable étroite, fine, et le joint de mot
   de largeur nulle. Écrits en points de code — un caractère invisible dans une
   source est une divergence que personne ne verra en relecture. */
const BLANCS_TYPOGRAPHIQUES = /[\u00A0\u202F\u2009\u2060]/g;

/**
 * Normalise un texte rendu avant toute comparaison.
 *
 * Trois replis, et chacun a une cause :
 *   · NFC, parce qu'un « é » précomposé et un « e » + accent combinant sont le
 *     même mot pour un lecteur et deux chaînes pour un moteur d'expressions ;
 *   · les espaces insécables et fines, parce que la typographie française en
 *     sème devant les deux-points et dans les nombres, et qu'aucune règle de
 *     contexte ne doit dépendre de laquelle a été employée ;
 *   · les blancs répétés, réduits à un seul — c'est ce qui rend une règle de
 *     contexte indépendante de l'indentation de la source.
 *
 * L'apostrophe, elle, n'est PAS repliée : les deux formes sont écrites dans
 * les expressions d'exonération, ce qui laisse le texte relevé intact dans le
 * rapport. Un rapport qui réécrit ce qu'il cite n'est plus une preuve.
 */
export function normaliser(texte) {
	return String(texte ?? '')
		.normalize('NFC')
		.replace(BLANCS_TYPOGRAPHIQUES, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Le repli employé par la clé de rapprochement : tous les blancs retirés. */
export function sansBlancs(texte) {
	return String(texte ?? '').replace(/\s+/g, '');
}

/**
 * Le repli LÂCHE, employé par le seul contrôle de sous-rapprochement : blancs,
 * casse, accents et ponctuation repliés. Il ne sert jamais à rapprocher — il
 * sert à prouver que le rapprochement normal n'a rien laissé passer.
 */
export function repliLache(texte) {
	return String(texte ?? '')
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]/gu, '');
}

/** Les intervalles couverts par une exonération dans un texte donné. */
function intervallesExoneres(texte, famille) {
	const out = [];
	for (const e of EXONERATIONS) {
		if (e.famille !== famille) continue;
		e.re.lastIndex = 0;
		for (const m of texte.matchAll(e.re)) {
			out.push({ de: m.index, a: m.index + m[0].length, cle: e.cle });
		}
	}
	return out;
}

/**
 * Relève, dans un texte, toutes les occurrences des familles de synonymes.
 *
 * @param {string} brut le texte tel que rendu
 * @param {string} champ d'où il vient — `texte`, `aria-label`, `classe`…
 * @returns {{famille: string, terme: string, registre: string, forme: string,
 *            champ: string, contexte: string, extrait: string,
 *            position: number, exoneration: string|null}[]}
 */
export function scanner(brut, champ = 'texte') {
	const texte = normaliser(brut);
	if (!texte) return [];
	const out = [];
	for (const s of SYNONYMES) {
		s.re.lastIndex = 0;
		const trouves = [...texte.matchAll(s.re)];
		if (!trouves.length) continue;
		const exos = intervallesExoneres(texte, s.famille);
		for (const m of trouves) {
			const de = m.index;
			const a = de + m[0].length;
			// Recouvrement STRICT : l'exonération doit englober l'occurrence, sans
			// quoi une occurrence fautive serait absoute par une occurrence
			// légitime distante du même nœud.
			const exo = exos.find((x) => x.de <= de && x.a >= a);
			out.push({
				famille: s.famille,
				terme: s.terme,
				registre: s.registre,
				forme: m[0],
				champ,
				contexte: texte.slice(0, 240),
				extrait: texte.slice(Math.max(0, de - 40), a + 45),
				position: de,
				exoneration: exo ? exo.cle : null
			});
		}
	}
	return out;
}

/**
 * Les segments d'un identifiant — `page-signet__tete`, `motFiche`,
 * `data-vers`, `/guides/{identifiant}`.
 */
export function segmenter(identifiant) {
	return String(identifiant ?? '')
		.replace(/([\p{Ll}\p{N}])([\p{Lu}])/gu, '$1 $2')
		.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean);
}

/**
 * Relève les synonymes d'un identifiant, segment par segment.
 *
 * Un identifiant n'a PAS de contexte : il n'a que ses segments. C'est pourquoi
 * le cercle 2 ne porte aucune exonération — il n'y aurait rien sur quoi
 * l'asseoir. En contrepartie, chaque occurrence est nommée une par une au
 * rapport : elles se comptent par dizaines, pas par milliers.
 */
export function scannerIdentifiant(identifiant, champ) {
	const segments = segmenter(identifiant);
	const out = [];
	for (const s of SYNONYMES) {
		const entier = new RegExp(`^(?:${s.re.source})$`, 'iu');
		for (const seg of segments) {
			if (!entier.test(seg)) continue;
			out.push({
				famille: s.famille,
				terme: s.terme,
				registre: s.registre,
				forme: seg,
				champ,
				contexte: String(identifiant),
				extrait: String(identifiant),
				position: 0,
				exoneration: null
			});
			break;
		}
	}
	return out;
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. LA CLÉ DE RAPPROCHEMENT — ET LES DEUX FAUTES QU'ELLE PEUT COMMETTRE
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * La clé qui rapproche une occurrence du gel de son jumeau de l'application.
 *
 * Elle ne retient QUE ce que les deux côtés rendent identique : la famille, le
 * champ porteur, l'état d'exonération, et le contexte DÉBARRASSÉ DE SES
 * BLANCS. C'est la parade d'ÉCART-041 — le compilateur Svelte élague les
 * nœuds de texte blancs d'un côté et pas de l'autre (P-8), et une clé qui
 * embarque un `textContent` brut fabrique du portage imaginaire.
 */
export function cleDe(o) {
	return [o.famille, o.champ, o.exoneration ?? '—', sansBlancs(o.contexte).slice(0, 160)].join(
		'\u0000'
	);
}

/** La clé lâche : elle ne rapproche rien, elle contrôle. Cf. §5 de l'en-tête. */
export function cleLache(o) {
	return [o.famille, o.champ, repliLache(o.contexte).slice(0, 160)].join('\u0000');
}

/** Le compte des occurrences par clé, pour un côté. */
export function compter(occurrences) {
	const m = new Map();
	for (const o of occurrences) {
		const k = cleDe(o);
		const e = m.get(k);
		if (e) e.occurrences++;
		else m.set(k, { ...o, cle: k, occurrences: 1 });
	}
	return m;
}

/**
 * Le classement d'un couple (vue, état) en natures.
 *
 * Le protocole est celui de `verif/a11y-sondes.mjs`, recopié et non réinventé :
 * commun → `gel` ; surplus application → `portage` ; surplus gel →
 * `gel-non-reporté`.
 */
export function classer(gel, app) {
	const cGel = compter(gel);
	const cApp = compter(app);
	const sortie = [];
	for (const cle of new Set([...cGel.keys(), ...cApp.keys()])) {
		const g = cGel.get(cle);
		const a = cApp.get(cle);
		const nGel = g ? g.occurrences : 0;
		const nApp = a ? a.occurrences : 0;
		const commun = Math.min(nGel, nApp);
		if (commun > 0) sortie.push({ ...(a ?? g), nature: 'gel', occurrences: commun });
		if (nApp > commun) sortie.push({ ...a, nature: 'portage', occurrences: nApp - commun });
		if (nGel > commun) sortie.push({ ...g, nature: 'gel-non-reporte', occurrences: nGel - commun });
	}
	return sortie;
}

/**
 * CONTRÔLE DE SUR-RAPPROCHEMENT — la clé confond-elle deux occurrences
 * différentes ? Deux contextes STRICTEMENT distincts (blancs compris) d'un
 * même côté qui tombent sur la même clé seraient comptés une fois au lieu de
 * deux : un défaut réel serait masqué.
 */
export function surRapprochement(occurrences) {
	const parCle = new Map();
	for (const o of occurrences) {
		const k = cleDe(o);
		if (!parCle.has(k)) parCle.set(k, new Set());
		parCle.get(k).add(`${o.champ}|${o.contexte}`);
	}
	return [...parCle].filter(([, s]) => s.size > 1).map(([cle, s]) => ({ cle, contextes: [...s] }));
}

/**
 * CONTRÔLE DE SOUS-RAPPROCHEMENT — la clé fabrique-t-elle du faux portage ?
 * C'est la faute exacte d'ÉCART-041 : une ligne `portage` qui aurait un jumeau
 * au gel sous une clé plus lâche n'est pas un défaut de portage, c'est un
 * défaut d'instrument.
 */
export function sousRapprochement(portages, occurrencesGel) {
	const lachesGel = new Set(occurrencesGel.map(cleLache));
	return portages.filter((p) => lachesGel.has(cleLache(p)));
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. LE REGISTRE « FICHE » — LA RÈGLE INVERSE

   M14.7 : le concept est renommable globalement. Le défaut n'est donc pas le
   mot, c'est le mot ÉCRIT EN DUR là où la configuration doit être lue. Un site
   conforme rend « Fiche » ; un site fautif rend « Fiche » lui aussi. Le rendu
   ne les sépare pas — SEULE LA SOURCE le peut. Ce registre est donc le seul
   qui ne passe pas par le banc, et le seul que le gel ne peut pas arbitrer.
   ═════════════════════════════════════════════════════════════════════════ */

export const RE_FICHE = /(?<![\p{L}\p{M}\p{N}])(fiches?)(?![\p{L}\p{M}\p{N}])/giu;

/**
 * Sépare d'une source ses commentaires et son code, et rend les deux.
 *
 * Le cercle 3 est compté à part : il ne peut donc pas être mélangé au cercle 2
 * par inadvertance, ce qui arriverait fatalement sur une lecture au fil du
 * texte. Les commentaires sont remplacés par des blancs de MÊME LONGUEUR :
 * les numéros de ligne du code restent ceux du fichier.
 */
export function separerCommentaires(source, extension) {
	let code = String(source ?? '');
	const commentaires = [];
	const remplacer = (re) => {
		code = code.replace(re, (m) => {
			commentaires.push(m);
			return m.replace(/[^\n]/g, ' ');
		});
	};
	remplacer(/<!--[\s\S]*?-->/g);
	remplacer(/\/\*[\s\S]*?\*\//g);
	if (extension !== '.css') remplacer(/(?<![:\\/])\/\/[^\n]*/g);
	return { code, commentaires: commentaires.join('\n') };
}

/**
 * Les emplois du mot « fiche » dans la source du produit, séparés en deux :
 * ceux qui LISENT la configuration et ceux qui l'écrivent en dur.
 */
/**
 * Le CERCLE d'une occurrence de « fiche » dans une source.
 *
 * LES TROIS CERCLES NE SE CONFONDENT PAS, ET CE REGISTRE-CI ÉTAIT LE PLUS
 * EXPOSÉ À LES CONFONDRE. Un décompte naïf mêle `<h1>Fiches applicatives</h1>`
 * — du TEXTE, que M14.7 veut renommable — et `.tg--fiches`, `TYPES_FICHE`,
 * `cle: 'fiches'` — des IDENTIFIANTS, qu'aucune configuration d'exécution ne
 * peut renommer et qui relèvent de l'extension de `CLAUDE.md` §3, pas de
 * M14.7. Additionner les deux rendrait un nombre que personne ne saurait
 * fermer.
 *
 * Deux règles, mécaniques :
 *   · une feuille de style ne rend aucun texte : tout y est identifiant ;
 *   · le mot pris dans un JETON plus long — `TYPES_FICHE`, `tg--fiches`,
 *     `fiches-applicatives` — est un morceau de nom, pas un mot d'interface.
 *
 * Ce qui reste peut encore contenir des clés de données citées entre quotes
 * (`cle: 'fiches'`) : l'imprécision résiduelle est comptée et déclarée au
 * rapport plutôt que devinée par une règle de plus.
 */
export function cercleDeFiche(ligne, index, longueur, extension) {
	if (extension === '.css') return 'identifiant';
	const estJeton = (c) => c !== undefined && /[\p{L}\p{N}_-]/u.test(c);
	if (estJeton(ligne[index - 1]) || estJeton(ligne[index + longueur])) return 'identifiant';
	return 'interface';
}

export function releverFiche(fichiers) {
	const dur = [];
	const identifiants = [];
	const configure = [];
	for (const { chemin, source } of fichiers) {
		const extension = chemin.slice(chemin.lastIndexOf('.'));
		const { code } = separerCommentaires(source, extension);
		const lignes = code.split('\n');
		for (let i = 0; i < lignes.length; i++) {
			RE_FICHE.lastIndex = 0;
			for (const m of lignes[i].matchAll(RE_FICHE)) {
				const cercle = cercleDeFiche(lignes[i], m.index, m[0].length, extension);
				const entree = {
					chemin,
					ligne: i + 1,
					forme: m[0],
					cercle,
					extrait: normaliser(lignes[i]).slice(0, 120)
				};
				if (/motFiche/.test(lignes[i])) configure.push(entree);
				else if (cercle === 'identifiant') identifiants.push(entree);
				else dur.push(entree);
			}
		}
	}
	return { dur, identifiants, configure };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. L'ÉPREUVE DE LA TABLE — AVANT TOUTE MESURE

   P-5 RETOURNÉ. Pour une table de MARQUEURS, l'inertie est le défaut : une
   famille qu'aucun cas n'exerce est espérée, pas posée. Pour une table
   d'INTERDICTIONS, l'inertie est le résultat recherché : zéro occurrence de
   « tag » est un succès. Le contrôle d'inertie serait donc à l'envers, et il
   est remplacé par deux contrôles qui valent.
   ═════════════════════════════════════════════════════════════════════════ */

export function eprouverLesFamilles() {
	const echecs = [];
	for (const s of SYNONYMES) {
		const pos = scanner(s.epreuve.positif).filter((o) => o.famille === s.famille && !o.exoneration);
		if (!pos.length)
			echecs.push(`${s.famille} — spécimen POSITIF non détecté : « ${s.epreuve.positif} »`);
		const neg = scanner(s.epreuve.negatif).filter((o) => o.famille === s.famille && !o.exoneration);
		if (neg.length)
			echecs.push(`${s.famille} — spécimen NÉGATIF pris pour un emploi : « ${s.epreuve.negatif} »`);
	}
	return echecs;
}

export function eprouverLesExonerations(occurrencesDuGel) {
	const mordues = new Set(occurrencesDuGel.map((o) => o.exoneration).filter(Boolean));
	return EXONERATIONS.filter((e) => !mordues.has(e.cle)).map((e) => e.cle);
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. LES SOURCES DU PRODUIT — cercles 2 et 3, et le registre « fiche »
   ═════════════════════════════════════════════════════════════════════════ */

const EXTENSIONS = new Set(['.ts', '.svelte', '.css', '.js', '.mjs', '.html']);

export function fichiersDe(dossier, sortie = []) {
	for (const nom of readdirSync(dossier).sort()) {
		const chemin = join(dossier, nom);
		if (statSync(chemin).isDirectory()) fichiersDe(chemin, sortie);
		else if (EXTENSIONS.has(nom.slice(nom.lastIndexOf('.')))) sortie.push(chemin);
	}
	return sortie;
}

/** Les symboles nommés d'un module — le vocabulaire du code, côté produit. */
export function symbolesExportes(source) {
	const out = [];
	const re =
		/(?:export\s+)?(?:const|let|var|function|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g;
	for (const m of String(source ?? '').matchAll(re)) out.push(m[1]);
	return [...new Set(out)];
}

/** Les routes déclarées par l'inventaire du lot T-006. */
export function routesDeclarees() {
	const texte = readFileSync(join(racine, 'docs', 'routes.md'), 'utf8');
	const out = new Set();
	for (const m of texte.matchAll(/`(\/[A-Za-z0-9{}_\-/.:?=]*)`/g)) out.add(m[1]);
	return [...out].sort();
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. LA MESURE — LE CHEMIN DU BANC, ET LUI SEUL
   ═════════════════════════════════════════════════════════════════════════ */

export function vuesDuDepot() {
	return readdirSync(SCENARIOS)
		.filter((f) => /^V-\d\d\.json$/.test(f))
		.map((f) => f.slice(0, 4))
		.sort();
}

export function scenarioDe(vue) {
	return JSON.parse(readFileSync(join(SCENARIOS, `${vue}.json`), 'utf8'));
}

/**
 * Exécutée DANS la page : tout ce qui se lit à l'écran, et tout ce qui nomme.
 *
 * Le relevé est NŒUD PAR NŒUD, jamais sur le texte concaténé de la page :
 * c'est la première des deux parades à P-8 (cf. en-tête). Un nœud invisible ne
 * compte pas — un synonyme en `display: none` ne circule pas dans l'interface.
 */
const SONDE = ({ attributs }) => {
	const rendu = (e) => {
		const s = getComputedStyle(e);
		if (s.display === 'none' || s.visibility === 'hidden') return false;
		const r = e.getBoundingClientRect();
		return r.width > 0 && r.height > 0;
	};
	const textes = [];
	const marcheur = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
	let n;
	while ((n = marcheur.nextNode())) {
		if (!n.nodeValue || !n.nodeValue.trim()) continue;
		const p = n.parentElement;
		if (!p || p.closest('script,style,template')) continue;
		if (!rendu(p)) continue;
		textes.push({ champ: 'texte', v: n.nodeValue });
	}
	const identifiants = [];
	for (const e of document.querySelectorAll('*')) {
		if (e.closest('script,style,template')) continue;
		const visible = rendu(e);
		for (const a of attributs) {
			const v = e.getAttribute(a);
			if (v && v.trim() && visible) textes.push({ champ: a, v });
		}
		if (e.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(e.getAttribute('type') || '')) {
			const v = e.getAttribute('value');
			if (v && v.trim() && visible) textes.push({ champ: 'value', v });
		}
		if (e.id) identifiants.push({ champ: 'id', v: e.id });
		const c = e.getAttribute('class');
		if (c) for (const x of c.trim().split(/\s+/)) identifiants.push({ champ: 'classe', v: x });
		const nom = e.getAttribute('name');
		if (nom) identifiants.push({ champ: 'name', v: nom });
		for (const a of e.attributes)
			if (a.name.startsWith('data-')) identifiants.push({ champ: 'data', v: a.name });
	}
	const vus = new Set();
	const idsUniques = identifiants.filter((x) => {
		const k = x.champ + '|' + x.v;
		if (vus.has(k)) return false;
		vus.add(k);
		return true;
	});
	return { textes, identifiants: idsUniques };
};

/** L'injection de la sonde : le spécimen positif de chaque famille, côté candidat seul. */
const INJECTER = (specimens) => {
	const hote = document.createElement('div');
	hote.id = 'sonde-vocabulaire';
	for (const s of specimens) {
		const p = document.createElement('p');
		p.textContent = s;
		hote.appendChild(p);
	}
	document.body.appendChild(hote);
};

/**
 * Relève un état, d'un côté. Protocole recopié de `verif/etats.mjs`, qui l'a
 * lui-même recopié de `verif/maquette.mjs` : la planche est réglée au vecteur
 * COMPLET côté gel, l'adresse porte l'état côté portage, les blocs hors
 * produit sont retirés APRÈS le réglage, et le déclencheur n'est joué que du
 * côté qui rejoue la maquette.
 */
async function releverEtat(navigateur, ctx, vue, scenario, etat, cote) {
	const { ouvrirPage, reglerPlanche } = ctx.capture;
	const {
		FENETRE_PRINCIPALE,
		retirerBlocsHorsProduit,
		avancer,
		AVANCE_ETAT_MS,
		POINTEUR_AU_REPOS
	} = ctx.conditions;
	const adresse =
		cote === 'gel'
			? `${ctx.origineGel}/${scenario.maquette.replace(/^mockups\//, '')}`
			: `${ctx.originePortage}${ctx.adresseDeLEtat(vue, etat.cle, 'app')}`;

	const { page, contexte, statut } = await ouvrirPage(navigateur, adresse, FENETRE_PRINCIPALE);
	let erreur = null;
	let brut = null;
	try {
		if (cote === 'gel') {
			if (etat.vecteur) await reglerPlanche(page, etat.vecteur);
			else if (scenario.defaut && scenario.planche) await reglerPlanche(page, scenario.defaut);
			if (etat.zone?.declencheur) {
				const d = etat.zone.declencheur;
				const cible =
					typeof d === 'string' ? page.locator(d).first() : page.locator(d.selecteur).nth(d.index);
				await cible.click();
				await page.evaluate(() => window.scrollTo(0, 0));
				await page.mouse.move(...POINTEUR_AU_REPOS);
				await avancer(page, AVANCE_ETAT_MS);
			}
		} else {
			// Le budget d'horloge est dépensé des deux côtés, dans le même ordre.
			if (etat.vecteur || (scenario.defaut && scenario.planche))
				await avancer(page, AVANCE_ETAT_MS);
			if (etat.zone?.declencheur) await avancer(page, AVANCE_ETAT_MS);
			if (ctx.sonde) await page.evaluate(INJECTER, ctx.sonde);
		}
		await retirerBlocsHorsProduit(page);
		brut = await page.evaluate(SONDE, { attributs: ctx.attributs });
	} catch (e) {
		erreur = String(e?.message ?? e).slice(0, 220);
	} finally {
		await contexte.close();
	}
	const occurrences = [];
	for (const t of brut?.textes ?? []) occurrences.push(...scanner(t.v, t.champ));
	const identifiants = [];
	for (const i of brut?.identifiants ?? []) identifiants.push(...scannerIdentifiant(i.v, i.champ));
	return { vue, etat: etat.cle, cote, statut, erreur, occurrences, identifiants };
}

async function enParallele(taches, largeur, faire) {
	const out = new Array(taches.length);
	let i = 0;
	await Promise.all(
		Array.from({ length: Math.min(largeur, taches.length) }, async () => {
			for (;;) {
				const k = i++;
				if (k >= taches.length) return;
				out[k] = await faire(taches[k], k);
			}
		})
	);
	return out;
}

/* Les attributs qui portent du texte lu par un utilisateur ou une synthèse
   vocale. `title` et `alt` compris : un synonyme y circule aussi sûrement que
   dans un libellé. Les attributs de mécanique (`id`, `for`, `aria-labelledby`)
   n'en portent pas — ils relèvent du cercle 2. */
const ATTRIBUTS_DE_TEXTE = [
	'aria-label',
	'title',
	'placeholder',
	'alt',
	'aria-placeholder',
	'aria-roledescription',
	'aria-description',
	'aria-valuetext'
];

/* ═══════════════════════════════════════════════════════════════════════════
   10. EXÉCUTION ET RAPPORT
   ═════════════════════════════════════════════════════════════════════════ */

async function executer(args) {
	const t0 = Date.now();
	const demandees = args.filter((a) => /^V-\d\d$/.test(a));
	const vues = demandees.length ? demandees : vuesDuDepot();
	const gelSeul = args.includes('--gel');
	const enJson = args.includes('--json');
	const detail = args.includes('--occurrences');
	const enSonde = args.includes('--sonde');
	const base = args.find((a) => a.startsWith('--base='))?.slice(7) ?? null;
	const lireSeuil = (nom) => {
		const brut = args.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3) ?? null;
		if (brut === null) return null;
		const n = Number(brut);
		if (!Number.isInteger(n)) {
			console.error(`batterie 17 — \`--${nom}=\` attend un entier.`);
			process.exit(2);
		}
		return n;
	};
	const seuilGel = lireSeuil('seuil-gel');
	const seuilFiche = lireSeuil('seuil-fiche');

	/* ── L'ÉPREUVE DES FAMILLES, AVANT TOUT ────────────────────────────────
	   Elle ne coûte rien et elle décide de tout : une famille dont le spécimen
	   positif n'est pas détecté ne dirait rien du corpus, et son silence
	   passerait pour un succès. */
	const echecsFamille = eprouverLesFamilles();
	if (echecsFamille.length) {
		console.error(
			`\nbatterie 17 — ${echecsFamille.length} famille(s) dont l'épreuve échoue :\n    ` +
				echecsFamille.join('\n    ') +
				'\n  Une interdiction qui ne détecte pas son propre spécimen ne prouve rien de son\n' +
				'  absence dans le corpus (CLAUDE.md §6 P-5). Refus, avant toute mesure.\n'
		);
		process.exit(2);
	}

	const { chromium } = await import('@playwright/test');
	const capture = await import('./banc/capture.mjs');
	const conditions = await import('./banc/conditions.mjs');
	const { servir } = await import('./banc/serveur.mjs');
	const { adresseDeLEtat, PREFIXE } = await import('./banc/mode-demo.mjs');

	if (enSonde && gelSeul) {
		console.error(
			'batterie 17 — `--sonde` perturbe le côté candidat : `--gel` la rend sans objet.'
		);
		process.exit(2);
	}

	const serveurGel = await servir(join(racine, 'mockups'));
	let serveurPortage = null;
	if (!gelSeul) {
		if (base) serveurPortage = { origine: base.replace(/\/$/, ''), fermer: async () => {} };
		else {
			const { createServer } = await import('vite');
			const vite = await createServer({
				configFile: join(racine, 'vite.config.ts'),
				root: racine,
				server: { port: 0, strictPort: false },
				logLevel: 'warn'
			});
			await vite.listen();
			const origine = vite.resolvedUrls?.local?.[0]?.replace(/\/$/, '');
			if (!origine) {
				console.error('batterie 17 — le serveur de développement n’a pas rendu d’adresse.');
				process.exit(2);
			}
			serveurPortage = { origine, fermer: () => vite.close() };
		}
		const sonde = await fetch(`${serveurPortage.origine}${PREFIXE}/`).catch(() => null);
		if (!sonde || !sonde.ok) {
			console.error(
				`\nbatterie 17 — le mode démo ne répond pas sur ${serveurPortage.origine}${PREFIXE}/.\n` +
					'  Sans lui, le côté PORTAGE n’a aucun chemin (ÉCART-011 É-1), et la batterie\n' +
					'  ne mesurerait que le gel en croyant mesurer les deux.\n'
			);
			await serveurGel.fermer();
			await serveurPortage.fermer();
			process.exit(2);
		}
	}

	const ctx = {
		capture,
		conditions,
		adresseDeLEtat,
		attributs: ATTRIBUTS_DE_TEXTE,
		sonde: enSonde ? SYNONYMES.map((s) => s.epreuve.positif) : null,
		origineGel: serveurGel.origine,
		originePortage: serveurPortage?.origine ?? null
	};

	const taches = [];
	for (const vue of vues) {
		const s = scenarioDe(vue);
		for (const etat of s.etats) {
			taches.push({ vue, scenario: s, etat, cote: 'gel' });
			if (!gelSeul) taches.push({ vue, scenario: s, etat, cote: 'portage' });
		}
	}

	const navigateur = await chromium.launch();
	let releves;
	try {
		releves = await enParallele(taches, 4, (t) =>
			releverEtat(navigateur, ctx, t.vue, t.scenario, t.etat, t.cote)
		);
	} finally {
		await navigateur.close();
		await serveurGel.fermer();
		await serveurPortage?.fermer();
	}

	const echecs = releves.filter((r) => r.erreur);

	/* ── L'ÉPREUVE DES EXONÉRATIONS, sur le gel réellement mesuré ─────────── */
	const occGelToutes = releves.filter((r) => r.cote === 'gel').flatMap((r) => r.occurrences);
	const inertes = eprouverLesExonerations(occGelToutes);
	if (inertes.length && !demandees.length) {
		console.error(
			`\nbatterie 17 — ${inertes.length} exonération(s) qu'AUCUNE occurrence du gel ne` +
				` déclenche :\n    ${inertes.join('\n    ')}\n` +
				'  Une exonération inerte est un élargissement gratuit du permis : elle rend le\n' +
				'  même verdict qu’une exonération qui mord, et personne ne l’a demandée\n' +
				'  (CLAUDE.md §6 P-5). Refus.\n'
		);
		process.exit(2);
	}

	/* ── Le classement, couple par couple ──────────────────────────────────── */
	const parCouple = new Map();
	for (const r of releves) {
		const k = `${r.vue} ${r.etat}`;
		if (!parCouple.has(k)) parCouple.set(k, { vue: r.vue, etat: r.etat, gel: null, portage: null });
		parCouple.get(k)[r.cote] = r;
	}

	const lignes = [];
	for (const c of parCouple.values()) {
		const g = [...(c.gel?.occurrences ?? []), ...(c.gel?.identifiants ?? [])];
		const a = [...(c.portage?.occurrences ?? []), ...(c.portage?.identifiants ?? [])];
		if (gelSeul) {
			for (const o of g)
				lignes.push({ vue: c.vue, etat: c.etat, ...o, nature: 'instrument', occurrences: 1 });
			continue;
		}
		for (const l of classer(g, a)) lignes.push({ vue: c.vue, etat: c.etat, ...l });
	}

	/* ── Les deux contrôles de la clé, MESURÉS ─────────────────────────────── */
	const toutesGel = releves
		.filter((r) => r.cote === 'gel')
		.flatMap((r) => [...r.occurrences, ...r.identifiants]);
	const toutesApp = releves
		.filter((r) => r.cote === 'portage')
		.flatMap((r) => [...r.occurrences, ...r.identifiants]);
	const confusions = [...surRapprochement(toutesGel), ...surRapprochement(toutesApp)];
	const portagesTous = lignes.filter((l) => l.nature === 'portage');
	const fauxPortages = sousRapprochement(portagesTous, toutesGel);

	/* ── Cercles 2 (sources du produit) et 3 (commentaires) ────────────────── */
	const sources = [...fichiersDe(join(racine, 'src')), ...fichiersDe(join(racine, 'seeds'))].map(
		(chemin) => ({ chemin: relative(racine, chemin), source: readFileSync(chemin, 'utf8') })
	);

	const identifiantsPropres = [];
	const commentaires = [];
	for (const f of sources) {
		const ext = f.chemin.slice(f.chemin.lastIndexOf('.'));
		const { code, commentaires: prose } = separerCommentaires(f.source, ext);
		for (const o of scannerIdentifiant(f.chemin, 'fichier'))
			identifiantsPropres.push({ ...o, ou: f.chemin });
		for (const s of symbolesExportes(code))
			for (const o of scannerIdentifiant(s, 'symbole'))
				identifiantsPropres.push({ ...o, ou: f.chemin });
		for (const o of scanner(prose, 'commentaire')) commentaires.push({ ...o, ou: f.chemin });
	}
	for (const r of routesDeclarees())
		for (const o of scannerIdentifiant(r, 'route'))
			identifiantsPropres.push({ ...o, ou: 'docs/routes.md' });

	const fiche = releverFiche(
		sources.filter((f) => f.chemin.startsWith('src/vues/') || f.chemin.startsWith('src/lib/'))
	);

	/* ── Le motif mécanique du registre DÉCIDÉ, recalculé ──────────────────── */
	const texteCadrage = readdirSync(join(racine, 'cadrage'))
		.map((f) => readFileSync(join(racine, 'cadrage', f), 'utf8'))
		.join('\n');
	const dansLeCadrage = {};
	for (const mot of MOTS_DECIDES) {
		const re = new RegExp(`(?<![\\p{L}\\p{M}])${mot}(?![\\p{L}\\p{M}])`, 'giu');
		dansLeCadrage[mot] = (texteCadrage.match(re) || []).length;
	}

	/* ═══════════════ RAPPORT ═══════════════ */
	const secondes = ((Date.now() - t0) / 1000).toFixed(0);
	const emplois = lignes.filter((l) => !l.exoneration);
	const exoneres = lignes.filter((l) => l.exoneration);
	const compteDe = (liste, filtre) =>
		liste.filter(filtre).reduce((n, l) => n + (l.occurrences ?? 1), 0);
	const parNature = (liste) => ({
		gel: compteDe(liste, (l) => l.nature === 'gel'),
		portage: compteDe(liste, (l) => l.nature === 'portage'),
		'gel-non-reporte': compteDe(liste, (l) => l.nature === 'gel-non-reporte'),
		instrument: compteDe(liste, (l) => l.nature === 'instrument')
	});
	const traces = emplois.filter((l) => l.registre === 'tracé');
	const decides = emplois.filter((l) => l.registre === 'décidé');

	/* LE RELEVÉ MACHINE. `verif/rapports/` est la sortie volatile du dépôt — la
	   même que celle du banc (`maquette.json`), ignorée de git. Il porte les
	   deux SEUILS PROPOSÉS : un seuil se lit, se discute et s'arbitre ; il ne
	   se devine pas dans un fil de sortie de 400 lignes. Il n'est écrit NULLE
	   PART ailleurs, et surtout pas dans cet instrument. */
	const releveMachine = {
		vues,
		lignes,
		confusions,
		fauxPortages,
		identifiantsPropres,
		commentaires,
		fiche,
		dansLeCadrage,
		echecs,
		secondes,
		seuils_proposes: {
			gel: compteDe(traces, (l) => l.nature === 'gel' || l.nature === 'gel-non-reporte'),
			fiche: fiche.dur.length,
			note: 'Proposés, jamais appliqués. `--seuil-gel=N` et `--seuil-fiche=N` au contrat de tâche, après arbitrage.'
		}
	};
	try {
		mkdirSync(join(racine, 'verif', 'rapports'), { recursive: true });
		writeFileSync(
			join(racine, 'verif', 'rapports', 'vocabulaire.json'),
			JSON.stringify(releveMachine, null, 1)
		);
	} catch {
		/* une sortie volatile qui ne s'écrit pas ne doit pas faire tomber une mesure */
	}

	if (enJson) {
		console.log(JSON.stringify(releveMachine, null, 1));
		process.exit(0);
	}

	console.log(
		'\nbatterie 17 — un seul terme par concept (P-07, CLAUDE.md §3)\n' +
			`  ${vues.length} vue(s) · ${taches.filter((t) => t.cote === 'gel').length} état(s) · ` +
			(gelSeul
				? 'PORTAGE NON MESURÉ (--gel)'
				: 'deux côtés, même code, mêmes conditions de capture') +
			(enSonde ? '  ·  SONDE ACTIVE — le candidat est perturbé' : '')
	);

	/* ── La table, telle qu'elle a été éprouvée ────────────────────────────── */
	console.log(
		`\n  LA TABLE — ${SYNONYMES.length} famille(s) pour ${new Set(SYNONYMES.map((s) => s.terme)).size} des ${TERMES.length} termes contractuels,\n` +
			`  ${EXONERATIONS.length} exonération(s). Familles et exonérations éprouvées avant mesure.`
	);
	console.log('\n    registre   terme       famille        trace');
	for (const s of SYNONYMES)
		console.log(
			`    ${s.registre.padEnd(10)} ${s.terme.padEnd(11)} ${s.famille.padEnd(14)} ${s.trace.slice(0, 96)}`
		);

	console.log(
		'\n    LE MOTIF MÉCANIQUE DU REGISTRE DÉCIDÉ — occurrences dans `cadrage/`, recomptées :\n      ' +
			MOTS_DECIDES.map((m) => `${m} ×${dansLeCadrage[m]}`).join(' · ') +
			'\n      Un mot que les quatre livrables de cadrage n’emploient jamais et que le\n' +
			'      vocabulaire contractuel rend inutile est un synonyme candidat — c’est une\n' +
			'      DÉCISION, pas une lecture, et elle n’est jamais opposée.\n' +
			'      « guide » fait exception et son compte le montre : le cadrage l’emploie,\n' +
			'      mais comme TYPE de note (CDC §3.4), jamais comme désignation de l’objet.'
	);

	/* ── Ce que les exonérations ont absorbé ───────────────────────────────── */
	console.log(
		'\n  CE QUE LES EXONÉRATIONS ABSORBENT, ET POURQUOI — rien n’est retiré en silence :'
	);
	for (const e of EXONERATIONS) {
		const n = compteDe(exoneres, (l) => l.exoneration === e.cle);
		const ex = exoneres.find((l) => l.exoneration === e.cle);
		console.log(
			`    ${e.cle.padEnd(32)} ${String(n).padStart(5)} occ.  ${e.motif.slice(0, 86)}\n` +
				`    ${' '.repeat(32)}             ex. « ${(ex?.extrait ?? '—').slice(0, 86)} »`
		);
	}

	/* ── Le verdict, par nature et par registre ────────────────────────────── */
	const nT = parNature(traces);
	const nD = parNature(decides);
	const dansIdentifiant = compteDe(traces.concat(decides), (l) =>
		/^(classe|id|data|name)$/.test(l.champ)
	);
	console.log(
		'\n  VERDICT — cercle 1 (l’interface) et cercle 2 (les identifiants du DOM)\n' +
			'    registre TRACÉ  — opposable\n' +
			`      gel               ${String(nT.gel).padStart(5)}   les deux côtés l’emploient : le gel fait loi, regel\n` +
			`      PORTAGE           ${String(nT.portage).padStart(5)}   l’application seule l’emploie : corrigeable par un lot\n` +
			`      gel non reporté   ${String(nT['gel-non-reporte']).padStart(5)}   le gel l’emploie, l’application non : divergence\n` +
			(gelSeul
				? `      instrument        ${String(nT.instrument).padStart(5)}   \`--gel\` : aucun classement possible\n`
				: '') +
			'    registre DÉCIDÉ — CONSTAT, jamais un rouge\n' +
			`      gel               ${String(nD.gel).padStart(5)}\n` +
			`      portage           ${String(nD.portage).padStart(5)}\n` +
			`      gel non reporté   ${String(nD['gel-non-reporte']).padStart(5)}\n` +
			(gelSeul ? `      instrument        ${String(nD.instrument).padStart(5)}\n` : '') +
			`    dont ${dansIdentifiant} occurrence(s) dans un IDENTIFIANT du DOM (classe, id, data, name)`
	);

	/* ── Les emplois, un par un ────────────────────────────────────────────── */
	const grouper = (liste) => {
		const m = new Map();
		for (const l of liste) {
			const k = `${l.famille}\u0000${l.nature}\u0000${l.champ}\u0000${sansBlancs(l.contexte).slice(0, 160)}`;
			if (!m.has(k)) m.set(k, { ...l, vues: new Set(), n: 0 });
			const e = m.get(k);
			e.vues.add(l.vue);
			e.n += l.occurrences ?? 1;
		}
		return [...m.values()].sort((x, y) => y.n - x.n);
	};

	for (const [nom, liste] of [
		['registre TRACÉ', traces],
		['registre DÉCIDÉ', decides]
	]) {
		const g = grouper(liste);
		if (!g.length) continue;
		console.log(
			`\n  LES EMPLOIS DU ${nom} — ${g.length} contexte(s) distinct(s), ${compteDe(liste, () => true)} occurrence(s) :`
		);
		for (const e of g.slice(0, detail ? 500 : 40))
			console.log(
				`    ${e.nature.padEnd(16)} ${e.famille.padEnd(11)} ${e.champ.padEnd(11)} ×${String(e.n).padEnd(4)} ` +
					`${[...e.vues].sort().slice(0, 4).join(',').padEnd(20)} « ${e.extrait.slice(0, 84)} »`
			);
		if (!detail && g.length > 40) console.log(`    … ${g.length - 40} de plus (\`--occurrences\`)`);
	}

	/* ── CE QUE LES ZONES COMPARÉES EXPLIQUENT, ET QUI N'EST PAS UN DÉFAUT ───
	   `verif/references/zones.json` (ARB-012) restreint le verdict de conformité
	   de certaines vues à une partie de leur rendu. Cette batterie, elle, mesure
	   la PAGE ENTIÈRE — le vocabulaire circule partout, y compris hors du
	   périmètre d'un verdict de pixels. La conséquence est mécanique : ce que la
	   maquette rend hors zone et que l'application n'a pas à porter tombe en
	   « gel non reporté ». Le taire ferait lire une divergence là où il y a une
	   décision arbitrée ; le requalifier en silence serait pire encore. */
	const vuesAZones = vues.filter((v) => conditions.zonesDe(v).length > 0);
	const nonReportesEnZone = compteDe(
		traces.concat(decides),
		(l) => l.nature === 'gel-non-reporte' && vuesAZones.includes(l.vue)
	);
	if (vuesAZones.length) {
		console.log(
			`\n  ZONES COMPARÉES (ARB-012) — ${vuesAZones.join(', ')} : ${nonReportesEnZone} des lignes\n` +
				`    « gel non reporté » y tombent. Le banc ne juge ces vues que sur ` +
				`${vuesAZones.map((v) => conditions.zonesDe(v).join(' + ')).join(' ; ')} ;\n` +
				'    cette batterie mesure la page entière, parce qu’un mot circule aussi hors\n' +
				'    d’une zone de verdict. Ce que l’application ne porte pas là n’est donc pas\n' +
				'    une divergence de portage : c’est le périmètre qu’un arbitrage lui a fixé.'
		);
	}

	/* ── Cercle 2, partie propre au produit ────────────────────────────────── */
	console.log(
		`\n  CERCLE 2 — LE VOCABULAIRE DU CODE PROPRE AU PRODUIT : ${identifiantsPropres.length} occurrence(s)\n` +
			'    Noms de fichiers, symboles nommés, routes déclarées. LE GEL N’EN A PAS\n' +
			'    D’ÉQUIVALENT — une maquette n’a ni module ni route —, donc AUCUNE de ces\n' +
			'    lignes n’est classée en nature : les imputer au portage serait la faute\n' +
			'    d’ÉCART-041 sous une autre forme. Elles sont un constat.'
	);
	for (const o of identifiantsPropres.slice(0, 30))
		console.log(
			`    ${o.champ.padEnd(9)} ${o.famille.padEnd(11)} ${o.contexte.slice(0, 60).padEnd(60)} (${o.ou})`
		);
	if (identifiantsPropres.length > 30)
		console.log(`    … ${identifiantsPropres.length - 30} de plus`);

	/* ── Cercle F — le cas « fiche » ───────────────────────────────────────── */
	console.log(
		`\n  LE CAS « FICHE » (M14.7) — ${fiche.dur.length} emploi(s) EN DUR dans le TEXTE, ` +
			`${fiche.identifiants.length} dans un IDENTIFIANT, ${fiche.configure.length} lisant \`CONFIG.motFiche\`\n` +
			'    Les deux premiers nombres ne se ferment pas de la même façon, et c’est\n' +
			'    pourquoi ils ne sont pas additionnés : le TEXTE se renomme par la\n' +
			'    configuration, comme M14.7 l’exige ; l’IDENTIFIANT — `.tg--fiches`,\n' +
			"    `TYPES_FICHE`, `cle: 'fiches'` — ne se renomme pas à l’exécution et relève de\n" +
			'    l’extension de CLAUDE.md §3, avec la contrainte P-6.3 par-dessus.\n' +
			'    Le défaut est l’inverse du mot : le concept est renommable globalement par la\n' +
			'    configuration, et tout site qui écrit « fiche » en dur rend ce renommage\n' +
			'    inopérant. LE GEL NE PEUT PAS ARBITRER CE REGISTRE — une maquette est du HTML\n' +
			'    statique, elle ne peut lire aucune configuration ; qu’elle écrive « Fiche » en\n' +
			'    dur n’autorise donc rien. Compté à part, hors recoupement.'
	);
	const ficheParFichier = {};
	for (const f of fiche.dur) ficheParFichier[f.chemin] = (ficheParFichier[f.chemin] ?? 0) + 1;
	const rangs = Object.entries(ficheParFichier).sort((a, b) => b[1] - a[1]);
	for (const [c, n] of rangs.slice(0, 12)) console.log(`    ${String(n).padStart(4)}  ${c}`);
	if (rangs.length > 12) console.log(`    … ${rangs.length - 12} fichier(s) de plus`);

	/* ── Cercle 3 — les commentaires ───────────────────────────────────────── */
	const commEmplois = commentaires.filter((c) => !c.exoneration);
	console.log(
		`\n  CERCLE 3 — LES COMMENTAIRES : ${commentaires.length} occurrence(s), dont ${commEmplois.length} hors exonération.\n` +
			'    La prose de développeur n’est jamais rendue : elle est COMPTÉE À PART et\n' +
			'    n’est JAMAIS opposée. Le contrat de ce dépôt l’exige explicitement, et le\n' +
			'    dire est la seule façon de ne pas la compter deux fois — ni zéro.'
	);

	/* ── Les deux contrôles de la clé ──────────────────────────────────────── */
	console.log(
		'\n  LES DEUX CONTRÔLES DE LA CLÉ DE RAPPROCHEMENT (ÉCART-041) — mesurés, pas supposés :\n' +
			`    · SUR-RAPPROCHEMENT : ${confusions.length} clé(s) sur lesquelles deux contextes\n` +
			'      strictement différents d’un même côté se confondent. Elles masqueraient un\n' +
			'      défaut réel en le comptant une fois au lieu de deux.' +
			(confusions.length
				? '\n      ' +
					confusions
						.slice(0, 5)
						.map((c) => c.contextes.join(' ≠ ').slice(0, 130))
						.join('\n      ')
				: '') +
			`\n    · SOUS-RAPPROCHEMENT : ${fauxPortages.length} ligne(s) « portage » qui trouveraient un\n` +
			'      jumeau au gel sous une clé plus lâche (blancs, casse, accents, ponctuation\n' +
			'      repliés). C’est la faute exacte d’ÉCART-041 : 31 faux défauts sur 31.' +
			(fauxPortages.length
				? '\n      ' +
					fauxPortages
						.slice(0, 5)
						.map((p) => `${p.vue} ${p.famille} « ${p.extrait.slice(0, 90)} »`)
						.join('\n      ')
				: '')
	);

	/* ── Ce que la batterie ne couvre pas ──────────────────────────────────── */
	const couplesTotaux = vues.reduce((n, v) => {
		const s = scenarioDe(v);
		return n + s.etats.length * s.fenetres.length;
	}, 0);
	const couplesMesures = vues.reduce((n, v) => n + scenarioDe(v).etats.length, 0);
	const aDeclencheur = vues.reduce(
		(n, v) => n + scenarioDe(v).etats.filter((e) => e.zone?.declencheur).length,
		0
	);
	const couverts = new Set(SYNONYMES.map((s) => s.terme));
	const decouverts = TERMES.filter((t) => !couverts.has(t.terme)).map((t) => t.terme);
	const enTexte = compteDe(traces.concat(decides), (l) => l.champ === 'texte');

	console.log(
		'\n  CE QUE CETTE BATTERIE NE COUVRE PAS — mesuré, jamais recopié (ARB-023) :\n' +
			`    · ${decouverts.length} des ${TERMES.length} termes contractuels n’ont AUCUN synonyme déclarable :\n` +
			`      ${decouverts.join(', ')}.\n` +
			'      Aucune source n’en nomme, et en inventer serait le comblement que le contrat\n' +
			'      interdit. Pour ceux-là, un vert ne dit RIEN — pas « aucun synonyme », mais\n' +
			'      « la batterie n’en cherche aucun ».\n' +
			`    · ${couplesTotaux - couplesMesures} couple(s) sur ${couplesTotaux} : seule la fenêtre ${conditions.FENETRE_PRINCIPALE} est mesurée.\n` +
			'      Le vocabulaire n’est pas une propriété de largeur — mais un libellé abrégé au\n' +
			'      téléphone en serait une, et cette batterie ne le verrait pas.\n' +
			`    · ${aDeclencheur} état(s) à déclencheur : le geste est joué du seul côté GEL (ARB-011).\n` +
			`    · ${enTexte} occurrence(s) de texte relevées SANS distinguer le CHROME du CONTENU des\n` +
			'      notes du corpus. Le cadrage ne dit pas si P-07 s’applique au corps d’une note\n' +
			'      rédigée par un contributeur ; l’instrument ne tranche pas ce qu’aucune source\n' +
			'      ne tranche, et les emplois concernés sont nommés un par un ci-dessus.\n' +
			'    · les NOMS DE TABLES ET DE COLONNES, que CLAUDE.md §3 vise nommément : aucun\n' +
			'      schéma n’existe encore (vague 0). Zéro mesuré, zéro prouvé.\n' +
			'    · le texte produit à l’exécution par une base réelle : seul le jeu de semence\n' +
			'      est traversé.\n' +
			'    · le `<title>` du document : le mode démo compose le document lui-même, les deux\n' +
			'      côtés ne sont donc pas comparables (P-7).\n' +
			'    · `verif/**`, `docs/**`, `cadrage/**`, `mockups/**` : instrument et sources, non\n' +
			'      audités. `docs/routes.md` est LU comme inventaire de routes, jamais opposé.'
	);

	/* ── Sortie ────────────────────────────────────────────────────────────── */
	const portageOpposable = nT.portage;
	const gelOpposable = nT.gel + nT['gel-non-reporte'];
	const gelHorsSeuil = seuilGel === null ? gelOpposable > 0 : gelOpposable > seuilGel;
	const ficheHorsSeuil = seuilFiche === null ? fiche.dur.length > 0 : fiche.dur.length > seuilFiche;

	if (echecs.length) {
		console.log(`\n  ${echecs.length} relevé(s) en échec :`);
		for (const e of echecs.slice(0, 30))
			console.log(`    ${e.vue} ${e.etat} [${e.cote}] ${e.erreur}`);
	}

	if (enSonde) {
		const attendues = new Set(SYNONYMES.map((s) => s.famille));
		const detectees = new Set(
			traces
				.concat(decides)
				.filter((l) => l.nature === 'portage')
				.map((l) => l.famille)
		);
		const manquantes = [...attendues].filter((f) => !detectees.has(f));
		console.log(
			`\n  SONDE — ${attendues.size - manquantes.length}/${attendues.size} famille(s) détectée(s) en « portage » sur le candidat perturbé.` +
				(manquantes.length ? `\n    NON DÉTECTÉE(S) : ${manquantes.join(', ')}` : '')
		);
		const bon = manquantes.length === 0 && echecs.length === 0;
		console.log(
			`\n  ${bon ? 'SONDE VERTE' : 'SONDE ROUGE'} — code retour INVERSÉ : la batterie doit rougir sur\n` +
				`    un candidat perturbé, sans quoi son vert ne vaut rien (RA-01).  ${secondes} s.\n`
		);
		process.exit(bon ? 0 : 1);
	}

	if (seuilGel === null && gelOpposable > 0) {
		console.log(
			'\n  LE DÉPÔT NE PEUT PAS PASSER AU VERT, ET CE N’EST PAS UN DÉFAUT DE PORTAGE.\n' +
				`    ${gelOpposable} occurrence(s) du registre TRACÉ sont DANS LE GEL. \`mockups/\` est en\n` +
				'    lecture seule et la règle de non-comblement interdit d’y toucher : aucun lot\n' +
				'    ne peut les faire baisser. Elles se ferment par REGEL, geste du commanditaire.\n' +
				`    SEUIL DE DÉPART PROPOSÉ : ${gelOpposable}. Il n’est pas écrit dans cet instrument —\n` +
				'    un seuil que la mesure se donne à elle-même ne mesure rien. Une fois arbitré :\n' +
				`    \`pnpm verif:vocabulaire --seuil-gel=${gelOpposable}\`.`
		);
	} else if (seuilGel !== null && gelOpposable < seuilGel) {
		console.log(
			`\n  SEUIL PÉRIMÉ — arbitré à ${seuilGel}, mesuré à ${gelOpposable}. Le seuil doit redescendre,\n` +
				'    sans quoi il absoudrait par avance une régression future.'
		);
	}

	if (seuilFiche === null && fiche.dur.length > 0) {
		console.log(
			'\n  LE REGISTRE « FICHE » EST ROUGE, ET SON SEUIL EST UN ARBITRAGE À PART.\n' +
				`    ${fiche.dur.length} emploi(s) en dur contre ${fiche.configure.length} lecture(s) de \`CONFIG.motFiche\`.\n` +
				'    M14.7 rend le concept renommable globalement ; en dur, le renommage est\n' +
				'    inopérant. Le portage statique de vague 0 a recopié le gel, ce qui est ce\n' +
				'    qu’on lui demandait : la dette est réelle, et elle est datée.\n' +
				`    SEUIL DE DÉPART PROPOSÉ : ${fiche.dur.length} — \`--seuil-fiche=${fiche.dur.length}\`.`
		);
	}

	console.log('\n  rapport machine : verif/rapports/vocabulaire.json');

	const vert =
		portageOpposable === 0 &&
		!gelHorsSeuil &&
		!ficheHorsSeuil &&
		echecs.length === 0 &&
		confusions.length === 0 &&
		fauxPortages.length === 0;
	console.log(
		`\n  ${vert ? 'VERT' : 'ROUGE'} — ${portageOpposable} emploi(s) imputable(s) au PORTAGE` +
			` · ${gelOpposable} au GEL` +
			(seuilGel === null ? ' (aucun seuil arbitré)' : ` (seuil arbitré : ${seuilGel})`) +
			` · ${fiche.dur.length} « fiche » en dur` +
			(seuilFiche === null ? '' : ` (seuil arbitré : ${seuilFiche})`) +
			` · ${compteDe(decides, () => true)} constat(s) du registre décidé` +
			` · ${commentaires.length} en commentaire.  ${secondes} s.\n`
	);
	process.exit(vert ? 0 : 1);
}

/* Le point d'entrée n'est exécuté que si le module est lancé directement :
   `verif/vocabulaire.test.ts` importe les fonctions pures sans démarrer de
   navigateur ni de serveur. */
if (process.argv[1] && /vocabulaire\.mjs$/.test(process.argv[1])) {
	await executer(process.argv.slice(2));
}
