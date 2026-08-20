#!/usr/bin/env node
/**
 * Batterie 9 — « les quatre états de toute zone de contenu ». `pnpm test:etats`.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie JAMAIS ce fichier, ni la table de
 * marqueurs qu'il porte. Élargir une famille pour qu'un état « compte » est le
 * contournement de vérification nommé par PLAN §12. La sortie légitime d'un
 * rouge est le protocole d'écart.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'ELLE PROUVE
 *
 * `RG-M18-03`, neuvième des dix points durs du brief : « chaque zone de
 * contenu gère explicitement quatre états — chargement, vide, erreur, sans
 * droit ». `RG-M18-04` : « une zone en erreur ne fait pas tomber la page ».
 *
 * Trois obligations, mesurées séparément :
 *
 *   O-1  chaque zone de contenu déclare ses quatre états, ET ils sont
 *        ATTEIGNABLES — un état qu'aucune adresse ne rend n'est pas un état ;
 *   O-2  une zone en erreur n'emporte pas la page : dans l'état où une zone
 *        porte un marqueur d'erreur, TOUTES les autres zones rendent encore,
 *        et le document répond 200 ;
 *   O-3  les composants employés sont ceux de l'inventaire fermé
 *        (`docs/DESIGN.md` §2) — aucune forme inventée côté portage.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * ELLE N'EMPRUNTE QUE LE CHEMIN DU BANC
 *
 * `verif/banc/serveur.mjs`, `ouvrirPage`, `reglerPlanche`, les conditions de
 * `conditions.mjs`, l'adresse de `mode-demo.mjs`. Une mesure prise dans
 * d'autres conditions dirait autre chose que ce que le banc mesure — et ce
 * serait un troisième dispositif à réconcilier, pas un instrument.
 *
 * Le côté GEL est réglé par sa planche ; le côté PORTAGE par son adresse
 * `/__design/V-xx?etat=…`. Les états à déclencheur reçoivent le geste du banc
 * du seul côté gel, et l'avance d'horloge équivalente côté portage — c'est
 * exactement le protocole de `verif/maquette.mjs`, recopié et non réinventé.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TROIS NATURES DE MANQUE — ET POURQUOI ELLES NE SE CONFONDENT PAS
 *
 *   PORTAGE      le gel montre l'état, l'application ne le rend pas. C'est le
 *                seul manque qu'un lot peut combler, et le seul qui ROUGIT.
 *   GEL          la zone est bien une zone de contenu, mais la MAQUETTE ne
 *                montre pas cet état. `mockups/` est en lecture seule et la
 *                règle de non-comblement interdit de l'inventer : c'est un
 *                CONSTAT chiffré, remonté, jamais un rouge.
 *   NON APPLICABLE  l'état n'a pas d'observable dans cette zone. Le cas
 *                nommé : « sans droit » n'a PAS de composant — `P-09` veut
 *                que l'action interdite ne soit pas rendue, l'absence EST
 *                l'état (`docs/DESIGN.md` §2.A A-7). Une zone qui ne porte
 *                aucun nœud conditionné par un droit n'a donc rien à montrer.
 *
 * Rendre vert en confondant les trois serait de la complaisance : le dépôt
 * afficherait « quatre états partout » là où la maquette n'en montre qu'un.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * ARB-048 — L'OBSERVABLE DE « SANS DROIT » ÉTAIT FAUTIF CÔTÉ PORTAGE
 *
 * Une CORRECTION D'INSTRUMENT, autorisée nommément et bornée à ce seul point
 * (contrat T-072, `ARB-048`). Ce n'est pas un ajustement pour obtenir du vert.
 *
 * CE BLOC A PORTÉ UN NUMÉRO QUI NE MENAIT NULLE PART — ici et dans les
 * unitaires, huit citations en tout —, et la batterie l'IMPRIMAIT à chaque
 * exécution comme l'autorisation de sa propre correction. Rectifié au lot
 * T-048 sur cinq recoupements, non sur une impression : même objet, même lot,
 * première exigence mot pour mot, ET SURTOUT LE MÊME COMMIT — celui qui a
 * inscrit l'entrée au registre est celui qui a écrit ces lignes, le 19 août
 * 2026. Le numéro qu'elles portaient n'a jamais eu d'entrée, à aucun point de
 * l'historique. Rien de la règle n'a bougé : le compte de gel reste 173.
 *
 * CE QUI ÉTAIT ÉCRIT ICI. `sansDroitParZone` attestait l'état des DEUX CÔTÉS
 * en comparant les états où une classe `si-*` est PRÉSENTE à ceux où elle est
 * VISIBLE — « le nœud conditionné doit exister pour qu'on puisse constater son
 * retrait ». Appliqué au portage, cet observable exige que l'action interdite
 * SOIT DANS LE DOM.
 *
 * OR P-09 EXIGE QU'ELLE N'Y SOIT PAS : « une action interdite n'est pas
 * affichée, ni grisée, NI MASQUÉE » — et `ARB-040` autorise nommément le
 * produit à OMETTRE ce que le gel masque, la maquette n'ayant pas de serveur.
 * AUCUNE APPLICATION CONFORME À P-09 NE POUVAIT SATISFAIRE CET OBSERVABLE. Le
 * seul « remède » eût été de poser un nœud masqué pour la seule satisfaction
 * de l'instrument : RA-01, le contournement que le plan nomme et interdit. Le
 * lot T-071 a livré le rouge plutôt que de le faire ; il a eu raison, et c'est
 * l'instrument qui avait tort.
 *
 * CE QUI EST ÉCRIT MAINTENANT. Côté GEL, rien ne change — la lecture par la
 * présence est exacte d'une maquette statique, et les 173 couples de manque de
 * gel sont intacts. Côté PORTAGE, l'observable est la VISIBILITÉ, état par
 * état : `ecransConditionnesParZone` relève les écrans qui OFFRENT l'action,
 * et `verdictDeZone` exige que les deux ensembles COÏNCIDENT. Masqué et absent
 * sont indiscernables à l'écran — c'est le fait qu'`ARB-040` établit —, si
 * bien que L'ABSENCE EST LA FORME LA PLUS FORTE DE « SANS DROIT », PAS SON
 * MANQUE. Une zone dont le portage n'émet pas le nœud là où le gel le masque
 * TIENT `RG-M18-03`, et mieux que le gel : elle est comptée `omis (P-09)`.
 *
 * LE CRIBLE N'EST PAS DEVENU AVEUGLE, ET CE POINT EST LE PLUS IMPORTANT. Le
 * GEL décide seul de l'APPLICABILITÉ. Une zone où personne n'a jamais posé de
 * nœud conditionné reste « sans objet » ; une zone qui le déclare sans jamais
 * l'atteindre reste « gel : déclaré ». Aucune omission du portage ne convertit
 * l'un ou l'autre en état tenu. Et le rouge subsiste, avec DEUX formes
 * mesurées : l'action OFFERTE là où le gel la retire — la porte ouverte de
 * RG-M05-08 —, et l'action PERDUE là où le gel l'offre.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * ARB-005 — ET CE QUE CETTE BATTERIE NE CONFOND PAS
 *
 * L'état « sans droit » vaut quand l'existence de la ressource porteuse est
 * DÉJÀ CONNUE de l'utilisateur — une zone dans une page qu'il a le droit
 * d'ouvrir. Le régime INDISCERNABLE de `RG-ACC-04` vaut pour la résolution
 * d'une ressource entière, et il exige au contraire que refus et inexistence
 * soient identiques. Les deux ne s'appliquent pas au même objet.
 *
 * La batterie ne le suppose pas, elle le MESURE : deux états déclarés d'une
 * même vue dont les relevés de structure sont IDENTIQUES relèvent du régime
 * indiscernable — ils sont nommés à chaque exécution et retirés du décompte
 * « sans droit », qui ne s'applique pas à eux.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE VERDICT, ET POURQUOI IL EST ROUGE AUJOURD'HUI
 *
 * Deux compteurs séparés, et une seule sortie :
 *   · les défauts de PORTAGE — ce qu'un lot peut corriger ;
 *   · les manques de GEL — ce qu'aucun lot ne peut corriger, et qui empêche
 *     `pnpm test:etats` de dire vrai s'il sortait en 0. Le catalogue de
 *     `CLAUDE.md` §4 lui fait dire « chaque zone rend ses quatre états » :
 *     tant que la maquette ne les montre pas, cette phrase est fausse, et un
 *     vert la certifierait. Le seuil qui rend ce manque acceptable est une
 *     décision de commanditaire — il se passe par `--seuil-gel=N`, il n'est
 *     pas écrit ici, et la batterie imprime à chaque exécution le nombre à
 *     arbitrer.
 *
 * COMMANDES
 *   node verif/etats.mjs                    les 41 vues, verdict chiffré
 *   node verif/etats.mjs V-07 V-14          une sélection
 *   node verif/etats.mjs --gel              le gel seul (aucun serveur d'app)
 *   node verif/etats.mjs --json             le relevé exploitable
 *   node verif/etats.mjs --zones            le détail zone par zone, régions
 *                                           non attestées comprises
 *   node verif/etats.mjs --seuil-gel=N      le manque de gel ARBITRÉ à N
 *   node verif/etats.mjs --base=http://…    un `vite dev` déjà démarré
 */

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCENARIOS = join(racine, 'verif', 'scenarios');

/* ═══════════════════════════════════════════════════════════════════════════
   1. LA TABLE DES MARQUEURS — l'inventaire fermé, et rien d'autre.

   Chaque famille est TRACÉE à `docs/DESIGN.md` §2 ou au relevé mécanique de
   `verif/inventaire-composants.mjs`. Elle est vérifiée à chaque exécution
   contre le gel : une famille qu'aucune classe du corpus ne satisfait est
   REFUSÉE, code 2. C'est la parade au piège P-5 du `CLAUDE.md` — « une règle
   qu'aucun cas n'exerce est une règle dont on ignore si elle marche » : le
   filtre d'ARB-013 est resté inerte huit lots durant, faute de ce contrôle.

   `sorte` distingue, DANS l'état de chargement, ce que le brief §3.2 exige —
   « une esquisse de la structure finale » — de ce qu'il refuse — « un
   indicateur générique ». Les deux comptent comme état de chargement présent ;
   le rapport les sépare, parce que la différence est une exigence.
   ═════════════════════════════════════════════════════════════════════════ */

export const QUATRE_ETATS = ['chargement', 'vide', 'erreur', 'sans-droit'];

export const MARQUEURS = [
	/* ── Chargement ──────────────────────────────────────────────────────── */
	{
		etat: 'chargement',
		sorte: 'esquisse',
		famille: '.esquisse',
		re: /^esquisse$/,
		trace: 'socle.css:295 — DESIGN §2.A A-7'
	},
	{
		etat: 'chargement',
		sorte: 'esquisse',
		famille: '.esq*',
		re: /^esq(-[a-z0-9-]+)?$/,
		trace: 'V-01, V-02, V-07, V-08, V-14 — esquisses typées de vue'
	},
	{
		etat: 'chargement',
		sorte: 'esquisse',
		famille: '.sq*',
		re: /^sq($|[-_])/,
		trace: 'V-41:1060–1113 — primitives et esquisses typées, DESIGN §2.A A-7'
	},
	{
		etat: 'chargement',
		sorte: 'esquisse',
		famille: '.vue-esquisse',
		re: /^vue-esquisse$/,
		trace: 'V-14:1044 — l’esquisse de la vue entière'
	},
	{
		etat: 'chargement',
		sorte: 'generique',
		famille: '.rouet*',
		re: /^([a-z0-9]+__)?rouet$/,
		trace: 'V-07:467 ; .noeud__rouet et .notif__rouet — DESIGN §2.A A-8'
	},
	{
		etat: 'chargement',
		sorte: 'esquisse',
		famille: '.si-chargement',
		re: /^si-chargement$/,
		trace: 'V-01:538 — nœud conditionné à data-etat="chargement", V-01, V-02, V-08'
	},

	/* ── Vide ────────────────────────────────────────────────────────────────
	   `.zone-etat` FAIT LOI (DESIGN §2.D-1) : socle, une seule définition,
	   cinq vues. `.vide` n'est employée que par V-08 et V-39 et porte DEUX
	   définitions divergentes ; elle reste au gel de ses deux vues et ne se
	   factorise jamais. Les deux existent au gel, et la batterie CONSTATE les
	   deux — elle n'arbitre pas une seconde fois ce que §2.D-1 a tranché. */
	{
		etat: 'vide',
		sorte: 'socle',
		famille: '.zone-etat*',
		re: /^zone-etat($|__)/,
		trace: 'socle.css:303–305 — DESIGN §2.D-1, elle fait loi'
	},
	{
		etat: 'vide',
		sorte: 'divergente',
		famille: '.vide*',
		re: /^vide($|__|--)/,
		trace: 'V-08:909 et V-39:727 — DEUX définitions divergentes, DESIGN §2.D-1'
	},
	{
		etat: 'vide',
		sorte: 'de-vue',
		famille: '.zone-vide*',
		re: /^zone-vide($|__)/,
		trace: 'V-01:541 — V-01, V-02, V-04, V-26'
	},
	{
		etat: 'vide',
		sorte: 'de-vue',
		famille: '.vide-*',
		re: /^vide-[a-z]/,
		trace: 'V-10, V-12, V-13, V-22 — .vide-univers, .vide-liste, .vide-dossier, .vide-signets'
	},
	{
		etat: 'vide',
		sorte: 'de-vue',
		famille: '.*__vide',
		re: /^[a-z0-9-]+__vide$/,
		trace:
			'V-07 .dom__vide, V-16 .cellule__vide, V-17 .commandes__vide, V-19/V-20 .detail__vide, V-37 .rail__vide, V-40 .phrase-rel__vide'
	},
	{
		etat: 'vide',
		sorte: 'transverse',
		famille: '.palette__etat*',
		re: /^palette__(etat|requete)$/,
		trace:
			'V-07:1068 — le bloc « texte + requête + action » de la palette de ' +
			'recherche, employé par 30 vues. TROUVÉ PAR LE CRIBLE DES SPÉCIMENS, ' +
			'pas par le heuristique de noms : `palette__etat` ne ressemble à rien ' +
			'de ce que RE_SUSPECT attrapait. C’est ce manque-là qui a fait ajouter ' +
			'le crible du registre B et le relevé hors zone.'
	},
	{
		etat: 'vide',
		sorte: 'de-vue',
		famille: '.si-vide',
		re: /^si-vide$/,
		trace: 'V-07, V-11, V-34 — nœud conditionné à l’absence de données'
	},

	/* ── Erreur ──────────────────────────────────────────────────────────────
	   L'erreur DE ZONE, celle du §3.2 : « message local, bouton pour
	   réessayer, le reste de la vue fonctionne » (brief V-39). Voir
	   `HORS_QUATRE` pour ce qui porte le mot « erreur » sans être cet état. */
	{
		etat: 'erreur',
		sorte: 'socle',
		famille: '.panneau--erreur',
		re: /^panneau--erreur$/,
		trace: 'V-07:880 — le bloc d’erreur local, DESIGN §2.A A-7'
	},
	{
		etat: 'erreur',
		sorte: 'de-vue',
		famille: '.zone-erreur*',
		re: /^zone-erreur($|__)/,
		trace: 'V-01:541, .zone-erreur__titre:546 — l’erreur pleine zone'
	},
	{
		etat: 'erreur',
		sorte: 'de-vue',
		famille: '.contexte--erreur',
		re: /^contexte--erreur$/,
		trace: 'V-05 — DESIGN §2.D-4, l’état de la situation en tête d’écran'
	},
	{
		etat: 'erreur',
		sorte: 'de-vue',
		famille: '.avis--erreur',
		re: /^avis--erreur$/,
		trace: 'V-17:992 — l’avis d’éditeur, V-17 et V-18'
	},
	{
		etat: 'erreur',
		sorte: 'divergente',
		famille: '.err-local* / .err-vue*',
		re: /^err-(local|vue)($|__)/,
		trace:
			'V-39:757 et :765 — LA PLANCHE DES ÉTATS N’EMPLOIE PAS `.panneau--erreur`. ' +
			'Même motif qu’au §2.D-1 pour `.zone-etat` contre `.vide` : le composant ' +
			'du produit et celui de la planche ne se rencontrent jamais.'
	},
	{
		etat: 'erreur',
		sorte: 'de-vue',
		famille: '.*--erreurs / .*echec',
		re: /^(section-rapport--erreurs|n-echec|cv--echec)$/,
		trace: 'V-24:1009 et :1034, V-35:1091 — l’issue en échec d’un import'
	},

	/* ── Sans droit ──────────────────────────────────────────────────────────
	   PAS DE COMPOSANT, ET C'EST LE POINT. `P-09` veut que l'action interdite
	   ne soit pas rendue ; DESIGN §2.A A-7 l'écrit noir sur blanc : « l'élément
	   est absent du DOM ». Ce qui se mesure n'est donc pas la présence d'un
	   bloc mais la DIFFÉRENCE entre deux états d'une même zone : le nœud
	   conditionné est là dans l'un, retiré de l'écran dans l'autre.

	   Les classes ci-dessous sont celles dont la règle CSS lit un attribut de
	   DROIT ou de RÔLE — `data-droits`, `data-droit`, `data-role`. Les autres
	   `si-*` du corpus conditionnent un état ou un mode, pas un droit :
	   `.si-chargement`, `.si-vide`, `.si-nominal`, `.si-peuple`, `.si-donnees`,
	   `.si-apercu`, `.si-bord`, `.si-lecture`, `.si-page`, `.si-dialogue`,
	   `.si-texte`, `.si-visuel`, `.si-redaction`. Le préfixe ne suffit pas ;
	   c'est la règle qui tranche. */
	{
		etat: 'sans-droit',
		sorte: 'conditionnement',
		famille: '.si-ecriture',
		re: /^si-ecriture$/,
		trace: 'socle.css:396 — .app[data-droits="lecture"] .si-ecriture { display: none }'
	},
	{
		etat: 'sans-droit',
		sorte: 'conditionnement',
		famille: '.si-admin',
		re: /^si-admin$/,
		trace: 'socle.css:397 — .app:not([data-role="admin"]) .si-admin { display: none }'
	},
	{
		etat: 'sans-droit',
		sorte: 'conditionnement',
		famille: '.si-gestionnaire / .si-redacteur',
		re: /^si-(gestionnaire|redacteur)$/,
		trace: 'V-13 — .app[data-droit="gestionnaire"] …'
	}
];

/* ═══════════════════════════════════════════════════════════════════════════
   2. CE QUE LA TABLE ÉCARTE, ET POURQUOI — énoncé et CHIFFRÉ à chaque
   exécution. Une exclusion muette est une couverture inventée.

   Le mot « erreur » ou « vide » dans un nom de classe ne fait pas un état de
   zone. Quatre familles portent le mot sans relever de RG-M18-03, et chacune
   a sa règle propre ailleurs dans le corpus. Les compter dans les quatre états
   gonflerait la couverture d'autant.
   ═════════════════════════════════════════════════════════════════════════ */

export const HORS_QUATRE = [
	{
		famille: '.notif--erreur',
		re: /^notif--erreur$/,
		motif:
			'une NOTIFICATION, régie par RG-M18-02 — non bloquante, empilable, ' +
			'ancrée bas-droite. Elle ne rend pas compte de l’état d’une zone. ' +
			'ARB-005 rappelle nommément que confondre les deux fut une erreur de rédaction.'
	},
	{
		famille: '.champ__erreur',
		re: /^champ__erreur$/,
		motif:
			'une erreur de SAISIE, régie par DESIGN §2.A A-9 — elle remplace l’aide ' +
			'sous un champ. Le chargement de données n’y est pour rien.'
	},
	{
		famille: '.refus*',
		re: /^refus($|__)/,
		motif:
			'un refus MÉTIER de suppression (V-27 à V-32 : « cet univers n’est pas ' +
			'vide »). Ni un droit manquant, ni une panne de chargement.'
	},
	{
		famille: '.degrade / .palette__degrade',
		re: /^(degrade|si-degrade)$/,
		motif:
			'la DÉGRADATION de P-10 et RG-NF-01 — « recherche par sens indisponible ». ' +
			'Elle a sa batterie, la 14 (`pnpm test:degradation`).'
	},
	{
		famille: '.ac--interdit',
		re: /^ac--interdit$/,
		motif:
			'un droit HÉRITÉ affiché en grisé, que le brief V-40 exige explicitement. ' +
			'C’est la tension connue avec P-09, et elle appartient à la batterie 7.'
	},
	{
		famille: '.contexte--attente / .attente-*',
		re: /^(contexte--attente|attente-[a-z]+)$/,
		motif:
			'l’attente d’une ACTION soumise (V-05, V-06, V-23), non le chargement ' +
			'd’une zone de contenu.'
	},
	{
		famille: '.bandeau-reseau*',
		re: /^bandeau-reseau($|__)/,
		motif:
			'la PERTE DE CONNEXION — « bandeau persistant, reprise automatique » ' +
			'(brief V-39). Sa portée est la PAGE, pas une zone : elle ne dit rien ' +
			'du chargement d’un panneau.'
	},
	{
		famille: '.si-* de mode ou de complément',
		re: /^si-(nominal|peuple|donnees|apercu|bord|lecture|page|dialogue|texte|visuel|redaction)$/,
		motif:
			'un conditionnement de MODE, ou le COMPLÉMENT d’un état : `.si-nominal` ' +
			'est le contraire de `.si-chargement`, `.si-peuple` celui de `.si-vide`. ' +
			'Les compter doublerait chaque état, et `.si-lecture` (V-37) lit ' +
			'`data-contenu`, pas un droit. Le préfixe `si-` ne dit rien à lui seul.'
	},
	{
		famille: '.barre-etat* / .tiroir__etat / .etat-* / .grille-etats',
		re: /^(barre-etat($|__)|tiroir__etat$|etat-(compare|export)($|__)|pied-config__etat$|grille-etats$)/,
		motif:
			'le mot « état » sans l’objet : une barre d’état d’éditeur, l’étiquette ' +
			'd’un tiroir, le statut d’un export, la grille de démonstration de V-39. ' +
			'Aucune ne dit ce qu’une ZONE DE CONTENU est en train de faire.'
	},
	{
		famille: '.palette__degrade',
		re: /^palette__degrade$/,
		motif:
			'un DÉGRADÉ de peinture — le fondu bas de la palette de V-09. Faux ami ' +
			'du heuristique, et la preuve qu’il attrape plus large que la table : ' +
			'c’est ce qui rend le relevé des non-classées lisible.'
	}
];

/* ═══════════════════════════════════════════════════════════════════════════
   3. LE FILET DE LA TABLE — ce qui RESSEMBLE à un marqueur et n'est classé
   par rien. Mesuré à chaque exécution, sur les 1 254 classes du corpus.

   Sans ce relevé, la table serait une liste d'espoirs : elle dirait ce qu'elle
   couvre et tairait ce qu'elle ignore. Le heuristique est volontairement plus
   large que la table — il attrape des faux positifs, et c'est le but : chaque
   nom qu'il rend et que ni MARQUEURS ni HORS_QUATRE ne prend est une décision
   que personne n'a prise.
   ═════════════════════════════════════════════════════════════════════════ */

export const RE_SUSPECT =
	/(^|-|_)(vide|erreur|erreurs|esquisse|esq|sq|rouet|chargement|charge|attente|refus|interdit|echec|panne|indispo|degrade|etat|etats)($|-|_)|^si-/;

/** Classe → l'entrée de MARQUEURS qui la prend, ou `null`. */
export function marqueurDe(classe) {
	return MARQUEURS.find((m) => m.re.test(classe)) ?? null;
}

/** Classe → l'entrée de HORS_QUATRE qui l'écarte, ou `null`. */
export function ecartDe(classe) {
	return HORS_QUATRE.find((h) => h.re.test(classe)) ?? null;
}

/**
 * Classe un ensemble de classes en états observés.
 *
 * `visibles` porte les classes effectivement rendues à l'écran ; `presentes`
 * porte tout ce qui est dans le DOM, rendu ou non. La distinction décide de
 * l'état « sans droit » : le socle MASQUE `.si-ecriture` par une règle CSS —
 * il ne le retire pas —, si bien que le nœud est PRÉSENT dans les deux états
 * et VISIBLE dans un seul. C'est cette différence qui atteste l'état.
 *
 * @returns {{ etats: Record<string, string[]>, ecartees: string[], suspectes: string[] }}
 */
export function classer({ visibles = [], presentes = [] } = {}) {
	const etats = {};
	const declares = {};
	const ecartees = [];
	const suspectes = [];
	const vus = new Set(visibles);
	for (const classe of new Set([...visibles, ...presentes])) {
		const m = marqueurDe(classe);
		if (m) {
			// « sans droit » est le seul état que la PRÉSENCE atteste : le nœud
			// conditionné doit exister pour qu'on puisse constater son retrait.
			// Les trois autres ne comptent ATTEIGNABLES que RENDUS — une esquisse
			// en `display: none` est un état DÉCLARÉ, pas un écran de chargement.
			if (m.etat === 'sans-droit' || vus.has(classe)) (etats[m.etat] ??= []).push(m.famille);
			else (declares[m.etat] ??= []).push(m.famille);
			continue;
		}
		const h = ecartDe(classe);
		if (h) {
			ecartees.push(classe);
			continue;
		}
		if (RE_SUSPECT.test(classe)) suspectes.push(classe);
	}
	for (const k of Object.keys(etats)) etats[k] = [...new Set(etats[k])].sort();
	for (const k of Object.keys(declares)) declares[k] = [...new Set(declares[k])].sort();
	return {
		etats,
		declares,
		ecartees: [...new Set(ecartees)].sort(),
		suspectes: [...new Set(suspectes)].sort()
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. LA SONDE — ce qu'on relève dans la page, une fois l'état atteint.

   ZONE DE CONTENU, définition mécanique, et elle ne s'invente pas :

     a) une RÉGION — `main`, `section`, `aside`, `nav`, `form`, `article` ou
        `[role="region"]` — qui porte une IDENTITÉ STABLE : un `id`, sinon un
        `aria-label`. Sans identité stable, la zone ne peut pas être suivie
        d'un état à l'autre : ses classes changent (`.panneau` devient
        `.panneau.panneau--erreur`) et son nom accessible aussi ;
     b) qui REND — boîte non nulle — dans au moins un état déclaré ;
     c) que le gel ÉQUIPE, dans au moins un de ses états, d'un marqueur de la
        table. C'est le critère « qui charge des données » du brief §3.2, et
        c'est le seul dont le dépôt dispose : aucune source n'énumère les
        zones de contenu des 41 vues. Une région sans aucun marqueur est
        comptée, nommée, et déclarée NON ATTESTÉE — jamais tenue pour
        conforme, jamais comptée comme couverte.

   Un marqueur est attribué à sa zone ENGLOBANTE LA PLUS PROCHE : un
   `.panneau--erreur` dans `#p-activite` appartient à `#p-activite`, pas au
   `main` qui le contient.
   ═════════════════════════════════════════════════════════════════════════ */

export const SELECTEUR_REGION = 'main, header, section, aside, nav, form, article, [role="region"]';

/** Exécutée DANS la page. Ne dépend d'aucun module — Playwright la sérialise. */
const SONDE = ({ selecteurRegion, zonesComparees, zonesDeCoquille }) => {
	const rend = (n) => {
		const s = getComputedStyle(n);
		if (s.display === 'none' || s.visibility === 'hidden') return false;
		const r = n.getBoundingClientRect();
		return r.width > 0 && r.height > 0;
	};
	const classesDe = (n) => {
		const c = n.getAttribute('class');
		return c ? c.trim().split(/\s+/).filter(Boolean) : [];
	};
	const nomDe = (n) => {
		const l = n.getAttribute('aria-label');
		if (l) return l.trim();
		const id = n.getAttribute('aria-labelledby');
		if (id) return (document.getElementById(id)?.textContent ?? '').trim().slice(0, 60);
		return '';
	};

	/* IDENTITÉ STABLE — sans elle, une zone ne se suit pas d'un état à l'autre :
	   ses classes changent (`.panneau` devient `.panneau.panneau--erreur`) et son
	   nom accessible aussi. Trois sources, dans cet ordre : l'`id`, le
	   `aria-label`, et — pour `main` seulement — la balise, parce qu'il n'y en a
	   qu'un par document. Sans `main`, les quatre vues qui ne lui donnent ni id
	   ni étiquette (V-04 en tête) n'auraient AUCUNE zone, ce qui les
	   absoudrait par accident de nommage. */
	const regions = [...document.querySelectorAll(selecteurRegion)].filter(
		(n) => n.id || n.getAttribute('aria-label') || n.tagName === 'MAIN'
	);
	const cleDe = (n) =>
		n.id
			? '#' + n.id
			: n.getAttribute('aria-label')
				? n.tagName.toLowerCase() + '[' + nomDe(n) + ']'
				: 'main';
	const index = new Map(regions.map((n) => [n, cleDe(n)]));

	const dans = (n, sels) => sels.some((s) => n.matches(s) || n.closest(s));
	const zones = new Map();
	for (const n of regions) {
		zones.set(index.get(n), {
			cle: index.get(n),
			balise: n.tagName.toLowerCase(),
			nom: nomDe(n),
			rend: rend(n),
			/* ARB-012 — la vue déclare-t-elle des ZONES COMPARÉES, et cette
			   région en fait-elle partie ? Le banc restreint son verdict à ces
			   zones ; cette batterie ne peut pas juger plus large que lui sans
			   se substituer à une décision arbitrée. */
			dansVerdict: zonesComparees.length === 0 || dans(n, zonesComparees),
			/* La COQUILLE de V-37, telle que `verif/references/zones.json` la
			   déclare. Trente-cinq vues l'enveloppent : son manque s'y répète à
			   l'identique, et le compter trente-cinq fois le ferait passer pour
			   trente-cinq manques distincts. */
			coquille: dans(n, zonesDeCoquille),
			visibles: [],
			presentes: []
		});
	}
	/* Hors zone : ce qui n'a aucune région ancêtre. Relevé quand même — un
	   marqueur d'état posé hors de toute zone nommée est un fait, pas un
	   silence. */
	const horsZone = { cle: '(hors zone nommée)', visibles: [], presentes: [], rend: true };

	for (const n of document.querySelectorAll('*')) {
		const classes = classesDe(n);
		if (!classes.length) continue;
		let p = n.parentElement;
		let cible = null;
		// L'élément lui-même compte pour SA zone quand il EST une région
		// indexée — `.panneau--erreur` est posée sur la section elle-même.
		if (index.has(n)) cible = zones.get(index.get(n));
		while (!cible && p) {
			if (index.has(p)) cible = zones.get(index.get(p));
			p = p.parentElement;
		}
		const seau = cible ?? horsZone;
		const v = rend(n);
		for (const c of classes) {
			seau.presentes.push(c);
			if (v) seau.visibles.push(c);
		}
	}

	const compacter = (z) => ({
		...z,
		visibles: [...new Set(z.visibles)],
		presentes: [...new Set(z.presentes)]
	});

	return {
		zones: [...zones.values()].map(compacter),
		horsZone: compacter(horsZone),
		/* Le relevé de structure, pour le contrôle ARB-005 : deux états dont
		   l'instantané est identique relèvent du régime indiscernable. */
		signature: document.body.innerHTML.length
	};
};

/* ═══════════════════════════════════════════════════════════════════════════
   5. AGRÉGATION ET VERDICT — pures, donc unitaires (verif/etats.test.ts).
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Agrège les relevés d'UNE vue, d'UN côté, en une fiche par zone.
 *
 * @param {{etat: string, zones: {cle: string, rend: boolean, visibles: string[], presentes: string[]}[]}[]} releves
 */
export function agregerCote(releves) {
	/** @type {Map<string, {cle: string, rendDans: string[], etats: Record<string, string[]>, sortes: Record<string,string[]>, ecartees: Set<string>, suspectes: Set<string>}>} */
	const zones = new Map();
	for (const r of releves) {
		for (const z of r.zones) {
			const f =
				zones.get(z.cle) ??
				zones
					.set(z.cle, {
						cle: z.cle,
						nom: z.nom ?? '',
						balise: z.balise ?? '',
						dansVerdict: z.dansVerdict !== false,
						coquille: Boolean(z.coquille),
						rendDans: [],
						etats: {},
						declares: {},
						sortes: {},
						ecartees: new Set(),
						suspectes: new Set()
					})
					.get(z.cle);
			if (z.rend) f.rendDans.push(r.etat);
			const { etats, declares, ecartees, suspectes } = classer(z);
			for (const [e, familles] of Object.entries(etats)) {
				(f.etats[e] ??= []).push(r.etat);
				for (const fam of familles) {
					const m = MARQUEURS.find((x) => x.famille === fam);
					if (m) (f.sortes[e] ??= []).push(m.sorte);
				}
			}
			for (const e of Object.keys(declares)) (f.declares[e] ??= []).push(r.etat);
			for (const c of ecartees) f.ecartees.add(c);
			for (const c of suspectes) f.suspectes.add(c);
		}
	}
	for (const f of zones.values()) {
		for (const k of Object.keys(f.etats)) f.etats[k] = [...new Set(f.etats[k])].sort();
		for (const k of Object.keys(f.declares)) f.declares[k] = [...new Set(f.declares[k])].sort();
		for (const k of Object.keys(f.sortes)) f.sortes[k] = [...new Set(f.sortes[k])].sort();
	}
	return zones;
}

/** Cet ensemble de classes porte-t-il un nœud conditionné par un DROIT ? */
function porteUnConditionnement(classes) {
	return classes.some((c) => MARQUEURS.some((m) => m.etat === 'sans-droit' && m.re.test(c)));
}

/**
 * « Sans droit » n'est ATTEIGNABLE que si l'écran change : le nœud conditionné
 * est présent dans les états déclarés, et VISIBLE dans certains seulement.
 *
 * Présent partout et visible partout = la zone porte l'action, aucun état
 * déclaré ne la retire : l'état n'est pas atteignable, il est seulement
 * DÉCLARÉ. Présent nulle part = non applicable.
 *
 * CE VERDICT DÉCRIT LE GEL, ET C'EST TOUT CE QU'IL PEUT DÉCRIRE. Il est bâti
 * sur l'écart entre PRÉSENCE et VISIBILITÉ, parce qu'une maquette statique n'a
 * pas de serveur : elle ne sait exprimer « cette action n'existe pas pour ce
 * rôle » qu'en la posant puis en la masquant. Côté PORTAGE, la même lecture
 * serait fautive — voir `ecransConditionnesParZone` et `verdictDeZone`.
 *
 * @param {{etat: string, zones: {cle: string, visibles: string[], presentes: string[]}[]}[]} releves
 */
export function sansDroitParZone(releves) {
	/** @type {Map<string, {present: string[], visible: string[]}>} */
	const par = new Map();
	for (const r of releves) {
		for (const z of r.zones) {
			const p = par.get(z.cle) ?? par.set(z.cle, { present: [], visible: [] }).get(z.cle);
			if (porteUnConditionnement(z.presentes)) p.present.push(r.etat);
			if (porteUnConditionnement(z.visibles)) p.visible.push(r.etat);
		}
	}
	/** @type {Map<string, 'atteignable'|'declare-non-atteignable'|'non-applicable'>} */
	const verdict = new Map();
	for (const [cle, p] of par) {
		if (!p.present.length) verdict.set(cle, 'non-applicable');
		else if (p.visible.length < p.present.length) verdict.set(cle, 'atteignable');
		else verdict.set(cle, 'declare-non-atteignable');
	}
	return verdict;
}

/**
 * LES ÉTATS DÉCLARÉS OÙ LA ZONE MONTRE À L'ÉCRAN UN NŒUD CONDITIONNÉ PAR UN
 * DROIT — l'observable de « sans droit » côté PORTAGE (ARB-048, lot T-072).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CELUI-CI, ET PAS CELUI DE `sansDroitParZone`
 *
 * `sansDroitParZone` atteste l'état par la PRÉSENCE : « le nœud conditionné
 * doit exister pour qu'on puisse constater son retrait ». C'est vrai d'une
 * MAQUETTE, et faux d'un PRODUIT. `P-09` exige que l'action interdite ne soit
 * pas affichée — « ni grisée, NI MASQUÉE » —, et `ARB-040` autorise
 * nommément le produit à OMETTRE ce que le gel masque. Une application
 * conforme à P-09 n'a donc PAS le nœud à présenter : appliquée au portage, la
 * lecture par la présence exigeait le contraire d'un principe non négociable,
 * et le seul moyen de la satisfaire eût été de poser un nœud masqué pour la
 * seule satisfaction de l'instrument — RA-01, le contournement que le plan
 * nomme et interdit.
 *
 * L'OBSERVABLE JUSTE EST LA VISIBILITÉ, ÉTAT PAR ÉTAT. Masqué et absent sont
 * indiscernables à l'écran, et c'est précisément ce qu'`ARB-040` établit :
 * un nœud en `display: none` ne pèse ni dans l'instantané ARIA, ni dans
 * l'ordre de tabulation, ni dans un pixel. Ce que l'on compare est donc
 * l'ENSEMBLE DES ÉCRANS qui offrent l'action, des deux côtés :
 *
 *   · le portage MONTRE l'action là où le gel la retire  → P-09 violé, ROUGE ;
 *   · le portage RETIRE l'action là où le gel l'offre    → l'action a disparu
 *     pour qui y a droit, ROUGE aussi ;
 *   · les deux ensembles coïncident                      → l'état est TENU,
 *     que le portage masque comme le gel ou qu'il omette. L'ABSENCE EST LA
 *     FORME LA PLUS FORTE DE « SANS DROIT », PAS SON MANQUE.
 *
 * CE QUE CE CRIBLE NE FAIT PAS, ET C'EST VOULU : il ne rend PAS l'état
 * applicable. C'est le GEL, par `sansDroitParZone`, qui décide s'il y a
 * quelque chose à tenir. Une zone où personne n'a jamais posé de nœud
 * conditionné — ni au gel, ni au portage — reste « non applicable » : elle ne
 * tient pas l'état, elle n'a pas d'état à tenir. Distinguer « le portage omet
 * ce que le gel masque » de « personne n'a jamais rien posé » est la première
 * exigence de la correction, et elle est portée par `verdictDeZone`.
 *
 * @param {{etat: string, zones: {cle: string, visibles: string[]}[]}[]} releves
 * @returns {Map<string, string[]>} zone → les états où l'action est À L'ÉCRAN
 */
export function ecransConditionnesParZone(releves) {
	/** @type {Map<string, string[]>} */
	const par = new Map();
	for (const r of releves) {
		for (const z of r.zones) {
			const l = par.get(z.cle) ?? par.set(z.cle, []).get(z.cle);
			if (porteUnConditionnement(z.visibles)) l.push(r.etat);
		}
	}
	for (const [cle, l] of par) par.set(cle, [...new Set(l)].sort());
	return par;
}

/**
 * Le verdict d'une zone, les deux côtés confrontés. SIX valeurs, parce que
 * « déclaré » et « atteignable » ne sont pas la même chose, que la mission
 * porte sur les DEUX, et qu'un portage peut tenir « sans droit » par
 * l'ABSENCE là où le gel ne sait le tenir que par le masquage.
 *
 *   porte                 le gel rend l'état, le portage aussi ;
 *   porte-par-omission    « sans droit » SEUL — le gel MASQUE le nœud
 *                         conditionné, le portage ne l'ÉMET PAS. Même écran,
 *                         état par état ; forme la PLUS FORTE de l'état, celle
 *                         que P-09 exige et qu'ARB-040 autorise. Ni rouge, ni
 *                         manque de gel ;
 *   manque-portage        le gel le rend, le portage non — LE SEUL ROUGE ;
 *   gel-non-atteignable   la maquette DÉCLARE le composant — la classe est
 *                         dans le DOM — mais aucun état déclaré ne le rend.
 *                         Un état qu'aucune adresse n'atteint n'est pas un
 *                         état : c'est un manque au gel, qualifié ;
 *   gel-absent            la maquette ne porte rien du tout pour cet état ;
 *   non-applicable        aucun observable — le cas nommé de « sans droit ».
 *
 * ═════════════════════════════════════════════════════════════════════════
 * « SANS DROIT » — L'OBSERVABLE CORRIGÉ (ARB-048, lot T-072)
 *
 * L'APPLICABILITÉ EST DÉCIDÉE PAR LE GEL, ET PAR LUI SEUL. Rien au gel — le
 * cas « personne n'a jamais rien posé » — reste « non applicable » : la zone
 * ne tient pas l'état, elle n'a pas d'état à tenir, et aucune omission du
 * portage ne peut le lui donner. Déclaré mais jamais atteint reste
 * « gel : déclaré ». Ces deux lignes-là sont intactes : le compte de gel ne
 * bouge pas d'un couple.
 *
 * LA CONFRONTATION NE PORTE QUE SUR LE TROISIÈME CAS — le gel RETIRE
 * effectivement l'action de l'écran dans au moins un état déclaré. On y
 * compare alors les ENSEMBLES D'ÉCRANS qui offrent l'action, jamais les
 * présences au DOM : masqué et absent sont indiscernables à l'écran (ARB-040),
 * et P-09 interdit au produit d'être présent-mais-masqué. Le rouge subsiste,
 * et il a désormais deux formes MESURÉES au lieu d'une forme structurelle :
 * l'action OFFERTE là où le gel la retire, l'action PERDUE là où le gel
 * l'offre.
 *
 * @param {string[]} ecransGel     états déclarés où le GEL montre l'action
 * @param {string[]} ecransPortage états déclarés où le PORTAGE la montre
 * @returns {Record<string, 'porte'|'porte-par-omission'|'manque-portage'|'gel-non-atteignable'|'gel-absent'|'non-applicable'>}
 */
export function verdictDeZone(
	gel,
	portage,
	sansDroitGel,
	sansDroitPortage,
	ecransGel = [],
	ecransPortage = []
) {
	const out = {};
	for (const e of QUATRE_ETATS) {
		if (e === 'sans-droit') {
			const g = sansDroitGel ?? 'non-applicable';
			if (g === 'non-applicable') {
				out[e] = 'non-applicable';
				continue;
			}
			if (g === 'declare-non-atteignable') {
				out[e] = 'gel-non-atteignable';
				continue;
			}
			const auGelVu = new Set(ecransGel);
			const auPortageVu = new Set(ecransPortage);
			/* OFFERTE : le portage MONTRE l'action dans un état où le gel la
			   retire. C'est la porte ouverte que RG-M05-08 interdit nommément.
			   PERDUE : le portage la retire là où le gel l'offre — l'action a
			   disparu pour qui y a droit. Les deux rougissent. */
			const offerte = ecransPortage.some((x) => !auGelVu.has(x));
			const perdue = ecransGel.some((x) => !auPortageVu.has(x));
			if (offerte || perdue) out[e] = 'manque-portage';
			else out[e] = sansDroitPortage === 'atteignable' ? 'porte' : 'porte-par-omission';
			continue;
		}
		const auGel = (gel?.etats?.[e] ?? []).length > 0;
		const declareAuGel = (gel?.declares?.[e] ?? []).length > 0;
		const auPortage = (portage?.etats?.[e] ?? []).length > 0;
		if (!auGel) out[e] = declareAuGel ? 'gel-non-atteignable' : 'gel-absent';
		else if (auPortage) out[e] = 'porte';
		else out[e] = 'manque-portage';
	}
	return out;
}

/**
 * RG-M18-04 — une zone en erreur n'emporte pas la page.
 *
 * LE POINT DE COMPARAISON EST LE GEL, ÉTAT PAR ÉTAT, et rien d'autre. Une
 * première rédaction prenait pour référence « les zones qui rendent dans TOUS
 * les états de planche » : trop prudente d'un cran, et le crible laissait
 * passer une zone escamotée par l'erreur d'une voisine — mesuré, sur une
 * mutation délibérée de V-07. Une zone que le gel n'affiche pas dans son état
 * vide n'est pas exigible dans l'état vide ; elle l'est dans l'état d'erreur,
 * où le gel l'affiche.
 *
 * Trois façons pour une page de tomber, et les trois sont refusées :
 *   1. le document ne répond plus 200 ;
 *   2. une zone que le gel rend dans CE MÊME état ne rend plus côté portage ;
 *   3. plus aucune zone ne rend hors de celle qui porte l'erreur, alors que le
 *      gel en rendait d'autres.
 *
 * @param {{etat: string, statut: number|null, zones: {cle:string, rend:boolean, visibles:string[]}[]}[]} gel
 * @param {{etat: string, statut: number|null, zones: {cle:string, rend:boolean, visibles:string[]}[]}[]} portage
 */
export function chutesDePage(gel, portage = []) {
	const erreurs = MARQUEURS.filter((m) => m.etat === 'erreur');
	const enErreur = (r) =>
		r.zones
			.filter((z) => z.visibles.some((c) => erreurs.some((m) => m.re.test(c))))
			.map((z) => z.cle);
	const chutes = [];
	for (const g of gel) {
		const zonesEnErreur = enErreur(g);
		if (!zonesEnErreur.length) continue;
		const attendues = g.zones
			.filter((z) => z.rend && !zonesEnErreur.includes(z.cle))
			.map((z) => z.cle);
		const p = portage.find((x) => x.etat === g.etat);
		if (!p) continue;
		if (p.statut !== null && p.statut !== 200) {
			chutes.push({
				etat: g.etat,
				cause: `le document répond ${p.statut}`,
				zones: zonesEnErreur
			});
			continue;
		}
		const rendues = new Set(p.zones.filter((z) => z.rend).map((z) => z.cle));
		const tombees = attendues.filter((c) => !rendues.has(c));
		if (tombees.length) {
			chutes.push({
				etat: g.etat,
				cause: 'zone(s) que le gel rend dans ce même état et que le portage n’a plus',
				zones: zonesEnErreur,
				tombees
			});
		} else if (attendues.length && !attendues.some((c) => rendues.has(c))) {
			chutes.push({
				etat: g.etat,
				cause: 'plus aucune zone ne rend hors de celle qui porte l’erreur',
				zones: zonesEnErreur
			});
		}
	}
	return chutes;
}

/**
 * ARB-005 — les CANDIDATS au régime indiscernable, et rien de plus.
 *
 * Deux états d'une même vue, réglés par des vecteurs DIFFÉRENTS, dont le rendu
 * ne se distingue par rien de ce que cette batterie sait lire, relèvent
 * vraisemblablement du régime `RG-ACC-04` : refus et inexistence produisent la
 * même réponse, et le quatrième état de zone ne s'y applique pas — l'existence
 * n'y est pas déjà connue de l'utilisateur.
 *
 * DEUX DISCRIMINANTS, ET IL EN FAUT DEUX. L'instantané ARIA seul ne suffit
 * pas : il ne voit pas une esquisse — un `div` sans rôle ni nom —, si bien
 * qu'il déclarait « identiques » le nominal et le chargement de V-08, que
 * cette même batterie mesure différents. Le relevé de classes seul ne suffit
 * pas davantage : trois fraîcheurs portent les mêmes classes. Les deux
 * ensemble tiennent.
 *
 * ET CE N'EST QU'UN CRIBLE. L'indiscernabilité au sens de `RG-ACC-04` porte
 * sur le corps, les en-têtes, le code ET LE TEMPS DE RÉPONSE d'une résolution
 * d'adresse (ARB-005) : rien de cela n'est visible sur un rendu. La preuve
 * appartient à la batterie 6 ; ce relevé n'en est que le repérage.
 */
export function couplesIndiscernables(releves) {
	const empreinte = (r) =>
		(r.aria ?? '') +
		'\u0000' +
		JSON.stringify(
			r.zones
				.map((z) => [z.cle, z.rend, [...z.visibles].sort()])
				.sort((a, b) => String(a[0]).localeCompare(String(b[0])))
		);
	const par = new Map();
	for (const r of releves) {
		const e = empreinte(r);
		(par.get(e) ?? par.set(e, []).get(e)).push(r);
	}
	/* DEUX ÉTATS DE MÊME VECTEUR NE SONT PAS INDISCERNABLES, ILS SONT LE MÊME
	   ÉCRAN. `verif/scenarios/V-07.json` déclare `etat-nominal` identique à
	   `role-referent` : c'est une redite de planche, pas RG-ACC-04. Le régime
	   indiscernable, c'est deux RÉGLAGES DIFFÉRENTS qui rendent le même écran —
	   V-04 « inexistant » contre « privé ». Sans ce crible, la batterie
	   nommerait des couples qui n'ont rien à voir avec ARB-005. */
	return [...par.values()]
		.filter((v) => v.length > 1)
		.filter((v) => v[0].aria)
		.filter((v) => new Set(v.map((r) => JSON.stringify(r.vecteur ?? null))).size > 1)
		.map((v) => v.map((r) => r.etat));
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. EXÉCUTION
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
 * Les classes que les 41 maquettes gelées connaissent — relevées par
 * l'instrument qui fait autorité, jamais par une lecture du balisage.
 *
 * `docs/DESIGN.md` §2.0 : les maquettes construisent l'essentiel de leur DOM
 * en script, et « un relevé qui ne lirait que le balisage serait faux de
 * moitié ». `verif/inventaire-composants.mjs` suit les quatre chemins d'emploi
 * — attribut, `className`, fabrique, table de données. Une seconde extraction
 * écrite ici serait une seconde vérité, donc une occasion de divergence.
 *
 * Le sous-processus est délibéré : ce module s'IMPORTE en CLI sur son passage.
 */
export function classesDuGel() {
	const sortie = execSync(
		`node ${JSON.stringify(join(racine, 'verif', 'inventaire-composants.mjs'))} --json`,
		{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
	);
	return JSON.parse(sortie).map((c) => c.classe);
}

/** Exécutée DANS la page : le spécimen d'un état présenté côte à côte. */
const SONDE_ZONE = ({ selecteur, index }) => {
	const n = document.querySelectorAll(selecteur)[index];
	if (!n) return null;
	const rend = (e) => {
		const s = getComputedStyle(e);
		if (s.display === 'none' || s.visibility === 'hidden') return false;
		const r = e.getBoundingClientRect();
		return r.width > 0 && r.height > 0;
	};
	const visibles = [];
	const presentes = [];
	for (const e of [n, ...n.querySelectorAll('*')]) {
		const c = e.getAttribute('class');
		if (!c) continue;
		const v = rend(e);
		for (const x of c.trim().split(/\s+/)) {
			presentes.push(x);
			if (v) visibles.push(x);
		}
	}
	return { visibles: [...new Set(visibles)], presentes: [...new Set(presentes)], rend: rend(n) };
};

/**
 * Relève un état, d'un côté.
 *
 * Le protocole est celui de `verif/maquette.mjs`, RECOPIÉ et non réinventé :
 * la planche est réglée au vecteur COMPLET côté gel, l'adresse porte l'état
 * côté portage, les blocs hors produit sont retirés APRÈS le réglage — la
 * planche est elle-même un bloc hors produit —, et le déclencheur n'est joué
 * que du côté qui rejoue la maquette.
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
	let specimen = null;
	let aria = null;
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
		}
		await retirerBlocsHorsProduit(page);
		brut = await page.evaluate(SONDE, {
			selecteurRegion: SELECTEUR_REGION,
			zonesComparees: ctx.conditions.zonesDe(vue),
			zonesDeCoquille: ctx.zonesDeCoquille
		});
		if (etat.zone) specimen = await page.evaluate(SONDE_ZONE, etat.zone);
		/* L'INSTANTANÉ DE STRUCTURE — celui du niveau 1 du banc, et pas une
		   empreinte maison. C'est lui, et lui seul, qui permet de dire que deux
		   états sont INDISCERNABLES au sens d'ARB-005 : un relevé de classes
		   dirait « identiques » de deux fraîcheurs différentes. */
		if (cote === 'gel' && !etat.zone) aria = await page.locator('body').ariaSnapshot();
	} catch (e) {
		erreur = String(e?.message ?? e).slice(0, 220);
	} finally {
		await contexte.close();
	}
	return {
		vue,
		etat: etat.cle,
		vecteur: etat.vecteur ?? null,
		cote,
		statut,
		erreur,
		aria,
		zoneEtat: Boolean(etat.zone),
		defaut: Boolean(etat.defaut),
		zones: brut?.zones ?? [],
		horsZone: brut?.horsZone ?? null,
		specimen
	};
}

/** Un pool de tâches à parallélisme borné — un contexte neuf par état, comme le banc. */
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

/* ═══════════════════════════════════════════════════════════════════════════
   7. LE CONTRÔLE DE LA TABLE ELLE-MÊME — piège P-5 du CLAUDE.md.

   « Une règle qu'aucun cas n'exerce est une règle dont on ignore si elle
   marche. » Le filtre d'ARB-013 est resté inerte huit lots durant parce que
   rien ne vérifiait qu'il MORDAIT. Ici : chaque famille de MARQUEURS et de
   HORS_QUATRE doit être satisfaite par au moins une classe du relevé
   mécanique des 41 maquettes. Sinon, code 2 — pas un rouge de vue, un refus
   d'instrument.
   ═════════════════════════════════════════════════════════════════════════ */

export function eprouverLaTable(classesDuGel) {
	const inertes = [];
	for (const m of [...MARQUEURS, ...HORS_QUATRE]) {
		if (!classesDuGel.some((c) => m.re.test(c))) inertes.push(m.famille);
	}
	const nonClassees = classesDuGel
		.filter((c) => RE_SUSPECT.test(c) && !marqueurDe(c) && !ecartDe(c))
		.sort();
	return { inertes, nonClassees };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. EXÉCUTION ET RAPPORT
   ═════════════════════════════════════════════════════════════════════════ */

async function executer(args) {
	const t0 = Date.now();
	const demandees = args.filter((a) => /^V-\d\d$/.test(a));
	const vues = demandees.length ? demandees : vuesDuDepot();
	const gelSeul = args.includes('--gel');
	const enJson = args.includes('--json');
	const detail = args.includes('--zones');
	const base = args.find((a) => a.startsWith('--base='))?.slice(7) ?? null;
	/* LE SEUIL DE DÉPART, ET POURQUOI IL N'A PAS DE VALEUR PAR DÉFAUT.
	   Le point dur n° 9 n'est pas tenu par le gel lui-même : la majorité des
	   zones de contenu n'y sont maquettées que dans un ou deux de leurs quatre
	   états. Aucun lot ne peut le combler — `mockups/` est en lecture seule et
	   la règle de non-comblement l'interdit. Deux issues, et une seule est
	   honnête : sortir en 1 tant que le manque n'est pas ARBITRÉ, en imprimant
	   le nombre qui servira de seuil ; ou l'accepter en silence, ce qui ferait
	   dire à `pnpm test:etats` — au catalogue de CLAUDE.md §4 — que « chaque
	   zone rend ses quatre états » alors qu'elle ne les rend pas. La seconde
	   est le vert de complaisance de RA-01.
	   Un seuil arbitré se passe par `--seuil-gel=N`, et il ne se met pas dans
	   ce fichier : c'est une décision de commanditaire, pas d'instrument. */
	const seuilBrut = args.find((a) => a.startsWith('--seuil-gel='))?.slice(12) ?? null;
	const seuilGel = seuilBrut === null ? null : Number(seuilBrut);
	if (seuilGel !== null && !Number.isInteger(seuilGel)) {
		console.error('batterie 9 — `--seuil-gel=` attend un entier.');
		process.exit(2);
	}

	const { chromium } = await import('@playwright/test');
	const capture = await import('./banc/capture.mjs');
	const conditions = await import('./banc/conditions.mjs');
	const { servir } = await import('./banc/serveur.mjs');
	const { adresseDeLEtat, PREFIXE } = await import('./banc/mode-demo.mjs');

	/* ── La table, éprouvée AVANT toute mesure ─────────────────────────────── */
	const classes = classesDuGel();
	const { inertes, nonClassees } = eprouverLaTable(classes);
	if (inertes.length) {
		console.error(
			`\nbatterie 9 — ${inertes.length} famille(s) de la table qu'AUCUNE classe du gel ne` +
				` satisfait :\n    ${inertes.join('\n    ')}\n` +
				'  Une famille inerte rend le même verdict qu’une famille qui marche : elle est\n' +
				'  espérée, pas posée (CLAUDE.md §6 P-5). Refus, avant toute mesure.\n'
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
				console.error('batterie 9 — le serveur de développement n’a pas rendu d’adresse.');
				process.exit(2);
			}
			serveurPortage = { origine, fermer: () => vite.close() };
		}
		const sonde = await fetch(`${serveurPortage.origine}${PREFIXE}/`).catch(() => null);
		if (!sonde || !sonde.ok) {
			console.error(
				`\nbatterie 9 — le mode démo ne répond pas sur ${serveurPortage.origine}${PREFIXE}/.\n` +
					'  Sans lui, le côté PORTAGE n’a aucun chemin (ÉCART-011 É-1), et la batterie\n' +
					'  ne mesurerait que le gel en croyant mesurer les deux.\n'
			);
			await serveurGel.fermer();
			await serveurPortage.fermer();
			process.exit(2);
		}
	}

	/* LA COQUILLE, DÉCLARÉE ET NON DEVINÉE. `verif/references/zones.json` —
	   écriture humaine seule, ARB-012 — nomme les zones qui font le verdict de
	   V-37 : c'est la définition arbitrée de ce qu'EST la coquille. Trente-cinq
	   vues l'enveloppent (brief §3.3). */
	const zonesDeCoquille = conditions.zonesDe('V-37');
	const ctx = {
		capture,
		conditions,
		adresseDeLEtat,
		zonesDeCoquille,
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
		if (serveurPortage) await serveurPortage.fermer();
	}

	/* ── Agrégation ────────────────────────────────────────────────────────── */
	const parVue = [];
	const echecs = [];
	for (const vue of vues) {
		const s = scenarioDe(vue);
		const r = releves.filter((x) => x.vue === vue);
		for (const x of r) if (x.erreur) echecs.push(x);
		const gelTous = r.filter((x) => x.cote === 'gel');
		const portTous = r.filter((x) => x.cote === 'portage');
		// REGISTRE A — les zones de contenu, mesurées sur les états de PLANCHE.
		const gelA = gelTous.filter((x) => !x.zoneEtat);
		const portA = portTous.filter((x) => !x.zoneEtat);
		const aGel = agregerCote(gelA);
		const aPort = agregerCote(portA);
		const sdGel = sansDroitParZone(gelA);
		const sdPort = sansDroitParZone(portA);
		/* ARB-048 — les ÉCRANS qui offrent une action gouvernée, des deux côtés.
		   C'est l'observable de « sans droit » côté portage : la présence au DOM
		   ne peut pas l'être, P-09 exigeant l'absence. */
		const ecrGel = ecransConditionnesParZone(gelA);
		const ecrPort = ecransConditionnesParZone(portA);

		const chutesPortage = gelSeul ? [] : chutesDePage(gelA, portA);

		const zones = [];
		for (const [cle, fg] of aGel) {
			const fp = aPort.get(cle) ?? null;
			const v = verdictDeZone(
				fg,
				fp,
				sdGel.get(cle),
				sdPort.get(cle),
				ecrGel.get(cle) ?? [],
				ecrPort.get(cle) ?? []
			);
			/* ARB-012 — UNE ZONE HORS DU VERDICT DE SA VUE N'EN REÇOIT PAS UN.
			   V-37 déclare `aside.rail` et `header.barre` : son `<main>` est
			   « le contenu de V-07, la note de démonstration celle de V-14,
			   chacun couvert par son propre lot ». Le banc ne le juge pas ; cette
			   batterie non plus. Le constat côté GEL est conservé — il ne coûte
			   rien et il informe —, le verdict de PORTAGE est retiré. */
			if (!fg.dansVerdict) {
				for (const e of QUATRE_ETATS) if (v[e] === 'manque-portage') v[e] = 'hors-verdict';
			}
			/* `--gel` ne mesure pas l'application : lui imputer un manque serait
			   lui reprocher de n'avoir pas été regardée. */
			if (gelSeul) {
				/* `porte-par-omission` en fait partie : sans mesure du portage, deux
				   ensembles d'écrans vides coïncident TRIVIALEMENT, et un vert tiré
				   d'une absence de mesure ne vaut rien (RA-01). */
				for (const e of QUATRE_ETATS)
					if (v[e] === 'manque-portage' || v[e] === 'porte-par-omission')
						v[e] = 'portage-non-mesure';
			}
			const atteste =
				QUATRE_ETATS.some((e) => (fg.etats?.[e] ?? []).length) ||
				sdGel.get(cle) !== 'non-applicable';
			zones.push({
				cle,
				nom: fg.nom,
				balise: fg.balise,
				dansVerdict: fg.dansVerdict,
				coquille: fg.coquille,
				atteste,
				absenteDuPortage: !gelSeul && !fp,
				verdict: v,
				gel: fg.etats,
				sortes: fg.sortes,
				portage: fp?.etats ?? {},
				sansDroit: { gel: sdGel.get(cle) ?? null, portage: sdPort.get(cle) ?? null },
				ecrans: { gel: ecrGel.get(cle) ?? [], portage: ecrPort.get(cle) ?? [] },
				ecartees: [...fg.ecartees],
				suspectes: [...fg.suspectes]
			});
		}

		// REGISTRE B — les spécimens de catalogue présentés côte à côte.
		const specimens = [];
		for (const x of gelTous.filter((y) => y.zoneEtat)) {
			const p = portTous.find((y) => y.etat === x.etat && y.zoneEtat);
			const cg = x.specimen ? classer(x.specimen) : { etats: {} };
			const cp = p?.specimen ? classer(p.specimen) : { etats: {} };
			specimens.push({
				etat: x.etat,
				gel: Object.keys(cg.etats).sort(),
				portage: Object.keys(cp.etats).sort(),
				rendu: { gel: x.specimen?.rend ?? false, portage: p?.specimen?.rend ?? null },
				manquePortage: gelSeul
					? []
					: Object.keys(cg.etats).filter((e) => !Object.keys(cp.etats).includes(e))
			});
		}

		parVue.push({
			vue,
			titre: s.titre,
			etats: s.etats.length,
			etatsDePlanche: gelA.length,
			etatsDeZone: gelTous.filter((x) => x.zoneEtat).length,
			zones,
			specimens,
			chutesPortage,
			indiscernables: couplesIndiscernables(gelA)
		});
	}

	if (enJson) {
		console.log(JSON.stringify({ vues: parVue, nonClassees, echecs }, null, '\t'));
		process.exit(0);
	}

	/* ── Rapport ───────────────────────────────────────────────────────────── */
	const compte = {
		porte: 0,
		'porte-par-omission': 0,
		'manque-portage': 0,
		'gel-non-atteignable': 0,
		'gel-absent': 0,
		'non-applicable': 0,
		'hors-verdict': 0,
		'portage-non-mesure': 0
	};
	let zonesAttestees = 0;
	let zonesNonAttestees = 0;
	let zonesAbsentesDuPortage = 0;

	console.log(
		'\nbatterie 9 — les quatre états de toute zone de contenu (RG-M18-03, RG-M18-04)\n' +
			`  gel : ${vues.length} vue(s), ${taches.filter((t) => t.cote === 'gel').length} état(s) déclaré(s)` +
			(gelSeul ? '  ·  PORTAGE NON MESURÉ (--gel)' : `  ·  portage : /__design/V-xx?etat=…`)
	);

	console.log('\n  vue    zone                              charg.   vide     erreur   s.droit');
	for (const v of parVue) {
		for (const z of v.zones) {
			if (!z.atteste) {
				zonesNonAttestees++;
				if (!detail) continue;
			} else zonesAttestees++;
			if (z.absenteDuPortage) zonesAbsentesDuPortage++;
			if (z.atteste) for (const e of QUATRE_ETATS) compte[z.verdict[e]]++;
			if (!z.atteste) {
				console.log(
					`  ${v.vue}   ${z.cle.slice(0, 33).padEnd(34)}(non attestée comme zone de contenu)`
				);
				continue;
			}
			const cell = (e) =>
				({
					porte: 'porté',
					'porte-par-omission': 'omis',
					'manque-portage': 'PORTAGE',
					'gel-non-atteignable': 'gel:décl',
					'gel-absent': 'gel:rien',
					'non-applicable': '—',
					'hors-verdict': 'ARB-012',
					'portage-non-mesure': '(--gel)'
				})[z.verdict[e]].padEnd(9);
			console.log(
				`  ${v.vue}   ${z.cle.slice(0, 33).padEnd(34)}${QUATRE_ETATS.map(cell).join('')}` +
					(z.coquille && v.vue !== 'V-37' ? ' coquille' : '') +
					(z.dansVerdict ? '' : ' hors verdict')
			);
		}
	}

	/* ── Registre B — les spécimens de catalogue ───────────────────────────── */
	const specTotal = parVue.reduce((n, v) => n + v.specimens.length, 0);
	const specManque = parVue.flatMap((v) =>
		v.specimens
			.filter((s) => s.manquePortage.length)
			.map((s) => `${v.vue} ${s.etat} → ${s.manquePortage.join(', ')}`)
	);
	const specParEtat = {};
	for (const v of parVue)
		for (const s of v.specimens) for (const e of s.gel) specParEtat[e] = (specParEtat[e] ?? 0) + 1;

	console.log(
		`\n  REGISTRE B — spécimens de catalogue (états présentés côte à côte) : ${specTotal}\n` +
			'    Ces zones ne sont pas des zones de contenu : ce sont les DÉMONSTRATIONS\n' +
			'    des composants d’état. Elles servent de référence d’inventaire, pas de\n' +
			'    décompte des quatre états.\n' +
			`    Ce que le corpus démontre : ${QUATRE_ETATS.map((e) => `${e} ×${specParEtat[e] ?? 0}`).join(' · ')}`
	);
	if (!specParEtat['sans-droit']) {
		console.log(
			'    « sans droit » n’a AUCUN spécimen, et c’est attendu : P-09 veut que\n' +
				'    l’action interdite ne soit pas rendue — l’absence EST l’état, il n’y a\n' +
				'    pas de composant à démontrer (docs/DESIGN.md §2.A A-7).'
		);
	}

	/* ── Verdict chiffré par nature ────────────────────────────────────────── */
	/* Combien d'états mettent RÉELLEMENT une zone en erreur ? Sans ce chiffre,
	   « aucune chute » serait compatible avec « aucune erreur mesurée » — le
	   vert muet de RA-01. */
	const familleErreur = MARQUEURS.filter((m) => m.etat === 'erreur');
	const etatsEnErreur = releves.filter(
		(r) =>
			r.cote === 'gel' &&
			!r.zoneEtat &&
			r.zones.some((z) => z.visibles.some((c) => familleErreur.some((m) => m.re.test(c))))
	).length;
	const chutes = parVue.flatMap((v) => v.chutesPortage.map((c) => ({ ...c, vue: v.vue })));
	const vuesSansRegistreA = parVue.filter((v) => v.etatsDePlanche === 0).map((v) => v.vue);
	const auGel = (x) => x === 'gel-non-atteignable' || x === 'gel-absent';
	const zonesAvecManqueGel = parVue.flatMap((v) =>
		v.zones
			.filter((z) => z.atteste && QUATRE_ETATS.some((e) => auGel(z.verdict[e])))
			.map((z) => ({
				vue: v.vue,
				cle: z.cle,
				etats: QUATRE_ETATS.filter((e) => auGel(z.verdict[e])).map(
					(e) => e + (z.verdict[e] === 'gel-non-atteignable' ? ' (déclaré, hors d’atteinte)' : '')
				)
			}))
	);
	const zonesAvecManquePortage = parVue.flatMap((v) =>
		v.zones
			.filter((z) => z.atteste && QUATRE_ETATS.some((e) => z.verdict[e] === 'manque-portage'))
			.map((z) => ({
				vue: v.vue,
				cle: z.cle,
				etats: QUATRE_ETATS.filter((e) => z.verdict[e] === 'manque-portage')
			}))
	);
	const total = Object.values(compte).reduce((a, b) => a + b, 0);

	console.log(
		`\n  VERDICT — ${zonesAttestees} zone(s) de contenu attestée(s) sur ${vues.length} vue(s), ` +
			`${total} couples zone × état\n` +
			`    porté             ${String(compte.porte).padStart(5)}   le gel rend l’état, le portage aussi\n` +
			`    omis (P-09)       ${String(compte['porte-par-omission']).padStart(5)}   « sans droit » TENU PAR L’ABSENCE : le gel masque, le portage n’émet pas\n` +
			`    MANQUE PORTAGE    ${String(compte['manque-portage']).padStart(5)}   le gel rend l’état, le portage ne le rend pas\n` +
			`    gel : déclaré     ${String(compte['gel-non-atteignable']).padStart(5)}   la maquette porte le composant, aucun état ne l’ATTEINT\n` +
			`    gel : rien        ${String(compte['gel-absent']).padStart(5)}   la maquette ne montre pas cet état du tout\n` +
			`    sans objet        ${String(compte['non-applicable']).padStart(5)}   aucun observable — « sans droit » n’a pas de composant\n` +
			`    hors verdict      ${String(compte['hors-verdict']).padStart(5)}   zone que sa vue ne fait pas juger (ARB-012)\n` +
			(gelSeul
				? `    portage non mesuré${String(compte['portage-non-mesure']).padStart(4)}   \`--gel\` : l’application n’a pas été ouverte\n`
				: '') +
			`    ────────────────────────\n` +
			`    manque au GEL     ${String(compte['gel-non-atteignable'] + compte['gel-absent']).padStart(5)}   les deux lignes de gel réunies — non-comblement`
	);

	/* LE MANQUE DE COQUILLE NE SE COMPTE PAS TRENTE-CINQ FOIS. Le rail et la
	   barre sont le MÊME objet dans les trente-cinq vues qui les enveloppent
	   (brief §3.3) : leur manque s'y répète à l'identique. Le décompte brut le
	   dirait trente-cinq fois, et un lecteur y lirait trente-cinq défauts. Les
	   deux chiffres sont donnés — le brut, parce que c'est ce que le dépôt
	   porte ; le dédupliqué, parce que c'est ce qu'il y a à corriger. */
	const coquilleBrut = [];
	const proprePar = [];
	for (const v of parVue)
		for (const z of v.zones.filter((x) => x.atteste))
			for (const e of QUATRE_ETATS)
				if (auGel(z.verdict[e]))
					(z.coquille ? coquilleBrut : proprePar).push({ vue: v.vue, cle: z.cle, etat: e });
	const coquilleDedup = new Set(coquilleBrut.map((x) => `${x.cle}|${x.etat}`));

	if (zonesAvecManqueGel.length) {
		console.log(
			`\n  LES ZONES DONT LE GEL NE MONTRE PAS LES QUATRE ÉTATS — ${zonesAvecManqueGel.length} zone(s) :`
		);
		for (const z of zonesAvecManqueGel)
			console.log(`    ${z.vue}  ${z.cle.padEnd(34)} absent(s) du gel : ${z.etats.join(', ')}`);
		console.log(
			`\n    ${coquilleBrut.length} de ces ${coquilleBrut.length + proprePar.length} couples portent sur une zone de COQUILLE` +
				` (rail, barre) —\n    ${coquilleDedup.size} manque(s) distinct(s), répété(s) dans les vues qui l’enveloppent.` +
				`\n    Les ${proprePar.length} autres appartiennent en propre à leur vue.\n` +
				'    `mockups/` est en LECTURE SEULE et la règle de non-comblement interdit\n' +
				'    d’inventer un état non maquetté. Ce décompte est un CONSTAT à remonter,\n' +
				'    jamais un rouge : aucun lot ne peut le faire baisser sans arbitrage.'
		);
	}

	if (zonesAvecManquePortage.length) {
		console.log(`\n  MANQUES DE PORTAGE — ${zonesAvecManquePortage.length} zone(s) :`);
		for (const z of zonesAvecManquePortage)
			console.log(`    ${z.vue}  ${z.cle.padEnd(34)} non rendu(s) : ${z.etats.join(', ')}`);
	}

	if (chutes.length) {
		console.log(`\n  RG-M18-04 — ${chutes.length} chute(s) de page sur zone en erreur :`);
		for (const c of chutes)
			console.log(
				`    ${c.vue}  ${c.etat} — ${c.cause}` +
					(c.tombees ? ` ; emportée(s) : ${c.tombees.join(', ')}` : '')
			);
	} else if (etatsEnErreur === 0) {
		console.log(
			'\n  RG-M18-04 — AUCUN ÉTAT DÉCLARÉ NE MET UNE ZONE EN ERREUR sur la sélection\n' +
				'    mesurée. La règle n’est donc pas éprouvée : « une règle qu’aucun cas\n' +
				'    n’exerce est une règle dont on ignore si elle marche » (CLAUDE.md §6 P-5).\n' +
				'    Ce vert-là ne vaut rien, et il est dit.'
		);
	} else {
		console.log(
			`\n  RG-M18-04 — aucune chute de page, sur ${etatsEnErreur} état(s) du gel où une zone\n` +
				'    porte effectivement un marqueur d’erreur : dans chacun, toute zone que le gel\n' +
				'    rend hors de l’erreur rend encore côté portage, et le document répond 200.\n' +
				'    La règle est éprouvée, pas seulement posée.'
		);
	}

	/* ── Ce que la batterie NE COUVRE PAS — mesuré, à chaque exécution ─────── */
	const couplesTotaux = vues.reduce((n, v) => {
		const s = scenarioDe(v);
		return n + s.etats.length * s.fenetres.length;
	}, 0);
	const couplesMesures = vues.reduce((n, v) => n + scenarioDe(v).etats.length, 0);
	const aDeclencheur = vues.reduce(
		(n, v) => n + scenarioDe(v).etats.filter((e) => e.zone?.declencheur).length,
		0
	);
	const conditionnementsRestants = parVue.reduce(
		(n, v) =>
			n +
			v.zones.filter(
				(z) =>
					z.sansDroit.portage === 'atteignable' || z.sansDroit.portage === 'declare-non-atteignable'
			).length,
		0
	);
	const indiscernables = parVue.flatMap((v) =>
		v.indiscernables.map((g) => `${v.vue} { ${g.join(' ≡ ')} }`)
	);
	/* DEUX CRIBLES QUI NE DÉPENDENT D'AUCUN NOM. Le relevé des classes non
	   classées ne vaut que ce que vaut son heuristique : il rendait 0 alors que
	   `.palette__etat` — l'état vide de la palette de recherche, trente vues —
	   lui échappait entièrement. Ces deux-ci ne se fient à aucun libellé, et
	   c'est le premier qui a trouvé la classe manquante. */
	const specimensMuets = parVue.flatMap((v) =>
		v.specimens.filter((x) => !x.gel.length).map((x) => `${v.vue}/${x.etat}`)
	);
	const marqueursHorsZone = [
		...new Set(
			releves
				.filter((r) => r.cote === 'gel' && r.horsZone)
				.flatMap((r) => Object.values(classer(r.horsZone).etats).flat())
		)
	].sort();

	console.log(
		'\n  CE QUE CETTE BATTERIE NE COUVRE PAS — mesuré, jamais recopié (RA-01) :\n' +
			`    · ${couplesTotaux - couplesMesures} couple(s) sur ${couplesTotaux} : seule la fenêtre ` +
			`${conditions.FENETRE_PRINCIPALE} est mesurée.\n` +
			`      Les quatre états ne sont pas une propriété de largeur ; RG-M18-13 a sa\n` +
			'      propre couverture, aux quatre fenêtres, dans `pnpm verif:maquette`.\n' +
			`    · ${aDeclencheur} état(s) à déclencheur : le geste est joué du côté GEL, jamais du côté\n` +
			'      PORTAGE — qui rend l’état et jamais la transition (ARB-011). Le portage y\n' +
			'      est donc mesuré sur la page servie, pas sur le résultat d’un clic.\n' +
			`    · ${vuesSansRegistreA.length} vue(s) sans aucun état de planche — ${vuesSansRegistreA.join(', ') || 'aucune'} :\n` +
			'      leurs états sont tous des spécimens côte à côte, donc AUCUNE zone de\n' +
			'      contenu n’y est mesurable. Ce n’est pas un manque, c’est leur nature.\n' +
			`    · ${zonesNonAttestees} région(s) nommée(s) qu’aucun marqueur n’atteste comme zone de contenu.\n` +
			'      Aucune source du dépôt n’énumère les zones de contenu des 41 vues : ce que\n' +
			'      le gel n’équipe jamais, la batterie ne peut ni exiger ni absoudre.\n' +
			`      (\`--zones\` les nomme.)\n` +
			`    · l’absence au DOM d’une action interdite : ${conditionnementsRestants} zone(s) du portage portent\n` +
			'      encore un nœud conditionné par un droit. Le gel le MASQUE par une règle CSS\n' +
			'      (socle.css:396–397) ; P-09 exige qu’il soit ABSENT. Ce verdict-là appartient\n' +
			'      à la batterie 7 (`pnpm test:droits`), qui lit le DOM et non l’écran. CELLE-CI\n' +
			'      ne lit que l’ÉCRAN, et depuis ARB-048 elle l’assume : masqué et absent lui\n' +
			'      sont indiscernables, et c’est pourquoi elle ne peut pas trancher ce point.\n' +
			`    · ${indiscernables.length} groupe(s) d’états que cette batterie NE SAIT PAS DISTINGUER —\n` +
			'      vecteurs de planche différents, même instantané ARIA et mêmes classes rendues :\n' +
			`      ${indiscernables.join(' · ') || 'aucun'}\n` +
			'      DEUX CAUSES POSSIBLES, que ce relevé ne sépare pas, et il ne le prétend pas :\n' +
			'      le régime INDISCERNABLE d’ARB-005 — V-04 « inexistant » contre « privé »,\n' +
			'      où refus et inexistence doivent rendre la même réponse (RG-ACC-04) et où le\n' +
			'      quatrième état de zone ne s’applique pas ; ou une position de planche dont\n' +
			'      l’effet échappe à ce que cette batterie lit. Dans les deux cas, ces états\n' +
			'      n’ajoutent aucune mesure. La preuve d’indiscernabilité — corps, en-têtes,\n' +
			'      code ET temps de réponse — appartient à la batterie 6, pas à celle-ci.\n' +
			`    · ${specimensMuets.length} spécimen(s) de catalogue sur ${specTotal} que la table ne rattache à\n` +
			'      AUCUN des quatre états. Ce crible ne dépend d’aucun nom : c’est lui qui a\n' +
			'      trouvé `.palette__etat`, employée par trente vues et que le heuristique de\n' +
			'      noms ne voyait pas. Les autres sont des dialogues, des notifications et des\n' +
			'      familles de composants — ils n’ont pas à l’être :\n' +
			`      ${specimensMuets.join(' · ') || 'aucun'}\n` +
			`    · ${marqueursHorsZone.length} famille(s) de marqueur posée(s) HORS de toute région nommée, donc\n` +
			'      rattachée(s) à aucune zone et comptée(s) nulle part' +
			(marqueursHorsZone.length ? ` : ${marqueursHorsZone.join(' ')}` : '.') +
			'\n      Second crible sans nom : un composant d’état qu’aucune région n’englobe\n' +
			'      échappe au décompte par construction. Le dire est le seul moyen de ne pas\n' +
			'      le compter comme couvert.\n' +
			`    · ${nonClassees.length} classe(s) du gel que la table ne classe ni ne récuse` +
			(nonClassees.length ? ` :\n      ${nonClassees.join(' ')}` : '.') +
			'\n      Chacune est une décision que personne n’a prise ; le relevé la rend visible\n' +
			'      au lieu de la taire.'
	);

	console.log('\n  CE QUE LA TABLE ÉCARTE DES QUATRE ÉTATS, ET POURQUOI :');
	for (const h of HORS_QUATRE) {
		const n = classes.filter((c) => h.re.test(c)).length;
		console.log(`    ${h.famille.padEnd(30)} ${String(n).padStart(3)} classe(s) — ${h.motif}`);
	}

	/* ── Sortie ────────────────────────────────────────────────────────────── */
	const rouges =
		compte['manque-portage'] +
		chutes.length +
		specManque.length +
		zonesAbsentesDuPortage +
		echecs.length;
	const manqueGel = compte['gel-non-atteignable'] + compte['gel-absent'];
	const gelHorsSeuil = seuilGel === null ? manqueGel > 0 : manqueGel > seuilGel;

	if (echecs.length) {
		console.log(`\n  ${echecs.length} relevé(s) en échec :`);
		for (const e of echecs.slice(0, 30))
			console.log(`    ${e.vue} ${e.etat} [${e.cote}] ${e.erreur}`);
	}
	if (specManque.length) {
		console.log(`\n  SPÉCIMENS non reproduits par le portage — ${specManque.length} :`);
		for (const s of specManque) console.log(`    ${s}`);
	}
	if (zonesAbsentesDuPortage) {
		console.log(
			`\n  ${zonesAbsentesDuPortage} zone(s) du gel ABSENTE(S) du portage — une zone qu’aucun état\n` +
				'    de l’application ne rend n’a pas d’état du tout.'
		);
		for (const v of parVue)
			for (const z of v.zones.filter((x) => x.absenteDuPortage && x.atteste))
				console.log(`    ${v.vue}  ${z.cle}`);
	}

	if (seuilGel === null && manqueGel > 0) {
		console.log(
			`\n  LE DÉPÔT NE PEUT PAS PASSER AU VERT, ET CE N'EST PAS UN DÉFAUT DE PORTAGE.\n` +
				`    Le point dur n° 9 du brief — « chaque zone est maquettée dans ses quatre\n` +
				`    états » — n’est pas tenu par LE GEL : ${manqueGel} couples zone × état sur ${total}\n` +
				`    manquent à la maquette, dont ${coquilleDedup.size} manque(s) distinct(s) de coquille répété(s).\n` +
				`    Aucun lot ne peut les combler : \`mockups/\` est en lecture seule, et inventer\n` +
				`    un état non maquetté est le comblement que le contrat interdit.\n` +
				`    SEUIL DE DÉPART PROPOSÉ : ${manqueGel}. Il n’est pas écrit dans cet instrument —\n` +
				`    un seuil que la mesure se donne à elle-même ne mesure rien. Une fois arbitré,\n` +
				`    il se passe au contrat de tâche : \`pnpm test:etats --seuil-gel=${manqueGel}\`.\n` +
				`    Tant qu’il ne l’est pas, ce ROUGE est le verdict, et il est le bon.`
		);
	} else if (seuilGel !== null && manqueGel < seuilGel) {
		console.log(
			`\n  SEUIL PÉRIMÉ — arbitré à ${seuilGel}, mesuré à ${manqueGel}. Le gel a gagné ${seuilGel - manqueGel}\n` +
				'    couple(s) : le seuil doit être redescendu, sans quoi il absoudrait par avance\n' +
				'    une régression future. Ce n’est pas un rouge ; c’est une dette d’arbitrage.'
		);
	}

	const vert = rouges === 0 && !gelHorsSeuil;
	console.log(
		`\n  ${vert ? 'VERT' : 'ROUGE'} — ${rouges} défaut(s) imputable(s) au PORTAGE` +
			` · ${manqueGel} couple(s) en manque de GEL` +
			(seuilGel === null ? ' (aucun seuil arbitré)' : ` (seuil arbitré : ${seuilGel})`) +
			` · ${compte['non-applicable']} sans objet.` +
			`  ${((Date.now() - t0) / 1000).toFixed(0)} s.\n`
	);
	process.exit(vert ? 0 : 1);
}

/* Le point d'entrée n'est exécuté que si le module est lancé directement :
   `verif/etats.test.ts` importe les fonctions pures sans démarrer de
   navigateur ni de serveur. */
if (process.argv[1] && /etats\.mjs$/.test(process.argv[1])) {
	await executer(process.argv.slice(2));
}
