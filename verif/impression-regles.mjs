/**
 * Batterie 15 — « la lecture d'une note s'imprime ». Les TABLES DÉCLARÉES et
 * le classement, séparés du pilote pour être éprouvables sans navigateur.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie JAMAIS ce fichier. Retirer une
 * famille, élargir un écart ou requalifier une nature pour obtenir du vert est
 * le contournement nommé par PLAN §12 (RA-01). La sortie légitime est le
 * protocole d'écart.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LA BATTERIE PROUVE, ET CE QU'AUCUNE SOURCE NE DIT
 *
 * `RG-M18-17` (CDC:1425) : « La lecture d'une note produit une impression
 * propre : sans navigation, sans panneaux latéraux, avec les métadonnées de
 * confiance en en-tête et les adresses des liens en note. »
 *
 * Quatre exigences, et AUCUNE n'est définie par une source du dépôt. Ni le
 * cahier des charges, ni le brief, ni `docs/DESIGN.md` n'énumèrent ce qui
 * COMPTE comme « navigation », comme « panneau latéral », comme « métadonnée
 * de confiance » ni comme « adresse d'un lien ». Chaque définition ci-dessous
 * est donc une DÉCISION D'INSTRUMENT, déclarée, tracée au gel, et éprouvée à
 * chaque exécution. Elles sont réfutables ; elles ne sont pas tacites.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE « IMPRIMÉ » VEUT DIRE ICI — et la cinquième clause est mesurée
 *
 * Un élément est IMPRIMÉ, sous `media: print`, quand :
 *
 *     display ≠ none  ∧  visibility ≠ hidden  ∧  opacity ≠ 0
 *   ∧ largeur > 0  ∧  hauteur > 0
 *   ∧ le rectangle CROISE la surface de page — bas > 0, droite > 0,
 *     gauche < largeur du document.
 *
 * La cinquième clause n'est pas une précaution : sans elle, le lien
 * d'évitement `.saut-contenu` serait compté comme navigation imprimée sur les
 * trois vues. Mesuré au gel de V-14 : `position: absolute; top: -60px`,
 * rectangle `y = -60, hauteur 37,75` — ENTIÈREMENT au-dessus de la page. Il a
 * une boîte, il n'a pas d'encre. Une définition qui s'arrêterait à
 * `display ≠ none` rendrait trois faux défauts de gel.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES QUATRE NATURES — le recoupement à deux côtés
 *
 *     défaut des deux côtés   → « gel »              regel, arbitrage
 *     défaut côté application → « portage »          corrigeable par un lot
 *     défaut côté gel seul    → « gel non reporté »  divergence à signaler
 *     rien de mesurable       → « instrument »       non opposable
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA CLÉ DE RAPPROCHEMENT — la leçon d'ÉCART-041, appliquée d'avance
 *
 * `ECART-041` : la clé de la batterie 10 embarquait `textContent.slice(0,48)`,
 * or le compilateur Svelte élague les nœuds de texte blancs d'un côté et pas
 * de l'autre (**P-8**) — 31 faux défauts de portage sur 31.
 *
 * LA CLÉ D'ICI NE CONTIENT AUCUN TEXTE. Elle vaut
 * `exigence ⧺ famille ⧺ ordinal`, où l'ordinal est le RANG DE L'ÉLÉMENT parmi
 * ceux que le sélecteur de la famille désigne, en ordre de document. Un rang
 * d'élément ignore les nœuds de texte par construction : un blanc inséré ne le
 * déplace pas. Pour les adresses, la clé vaut `exigence ⧺ href ⧺ rang de ce
 * href` — l'adresse est la donnée même que la règle exige, et deux liens de
 * même adresse se distinguent par leur rang.
 *
 * La signature lisible — balise et classes — voyage à côté de la clé, JAMAIS
 * dedans : elle sert le rapport, elle ne décide de rien.
 *
 * Une jointure produit deux fautes symétriques, et les deux sont éprouvées de
 * bout en bout, code retour inversé :
 *
 *   `--sonde=cle-appariement`    même défaut des deux côtés + asymétrie de
 *                                blancs côté application → doit rendre UNE
 *                                ligne « gel », zéro « portage ».
 *   `--sonde=cle-discrimination` défaut sur deux ordinaux DIFFÉRENTS → doit
 *                                rendre « portage » ET « gel non reporté »,
 *                                zéro « gel ».
 *
 * Et le rapport imprime à chaque exécution le compte de lignes `portage`
 * JUMELÉES d'un `gel-non-reporte` de même règle : c'est le contrôle qui a
 * révélé ÉCART-041 après coup, posé ici avant.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   1. LE PÉRIMÈTRE — quelles vues sont « la lecture d'une note »

   Aucune source ne donne cette liste sous forme de liste. Elle est DÉRIVÉE de
   la table maîtresse de `docs/routes.md` §3, qui rattache nommément RG-M18-17
   à deux vues, et d'elles seules :

     `docs/routes.md:102`  `/guides/{identifiant}`  → V-03, lecture publique
     `docs/routes.md:140`  `/notes/{identifiant}`   → V-14, lecture d'une note

   V-18 est MESURÉE ET NON OPPOSÉE. Elle est l'ÉDITEUR du registre Opérationnel
   — `/notes/{identifiant}/operationnel`, `docs/routes.md:145` — et non une
   lecture : `docs/routes.md` ne lui rattache pas RG-M18-17, et son gel ne
   porte aucun `<article>` (mesuré : 0 sur ses six états). Son relevé est
   conservé parce qu'il CHIFFRE ce que « la lecture d'une note » ne recouvre
   pas — c'est la seule façon de montrer que la frontière a été regardée.

   LA LECTURE DU REGISTRE OPÉRATIONNEL N'EST ATTEINTE PAR AUCUN ÉTAT. Elle est
   V-14 sous `data-registre="operationnel"` ; aucune position de la planche de
   `verif/scenarios/V-14.json` ne l'y met, la bascule étant un comportement
   (ARB-011). La batterie le déclare en non-couverture plutôt que de l'inventer.
   ═════════════════════════════════════════════════════════════════════════ */

export const PERIMETRE = [
	{
		vue: 'V-03',
		opposable: true,
		quoi: 'lecture publique d’un guide',
		trace: 'docs/routes.md:102 — /guides/{identifiant}, RG-M18-17 cité'
	},
	{
		vue: 'V-14',
		opposable: true,
		quoi: 'lecture d’une note, registre Référence',
		trace: 'docs/routes.md:140 — /notes/{identifiant}, RG-M18-17 cité'
	},
	{
		vue: 'V-18',
		opposable: false,
		quoi: 'éditeur du registre Opérationnel — mesuré, jamais opposé',
		trace: 'docs/routes.md:145 — RG-M18-17 NON cité ; aucun <article> au gel'
	}
];

export const VUES_OPPOSABLES = PERIMETRE.filter((p) => p.opposable).map((p) => p.vue);
export const VUES_MESUREES = PERIMETRE.map((p) => p.vue);

/* ═══════════════════════════════════════════════════════════════════════════
   2. LES FAMILLES — ce qui compte comme navigation, comme panneau, comme
   métadonnée de confiance.

   `sens` vaut `absent` (l'exigence est une ABSENCE à l'impression) ou
   `present` (une PRÉSENCE). `structurel` marque les deux filets de sécurité :
   ils ne nomment aucune classe, ils lisent le RÔLE ARIA — implicite ou
   explicite. Sans eux, la table ne saurait que ce qu'elle a pensé à nommer,
   et une navigation nouvelle passerait sous le radar.

   Chaque famille est tracée à une ligne de maquette gelée, et ÉPROUVÉE :
   `eprouverLesFamilles()` refuse en code 2 toute famille qu'aucune classe du
   relevé mécanique des 41 maquettes ne satisfait, et le pilote refuse en
   code 2 toute famille qu'AUCUN élément du corpus mesuré n'a rencontrée.
   C'est le piège P-5 — « une règle qu'aucun cas n'exerce est une règle dont on
   ignore si elle marche » — pris des deux bouts : statique et à l'exécution.
   ═════════════════════════════════════════════════════════════════════════ */

export const FAMILLES = [
	/* ── E-1 · sans navigation ─────────────────────────────────────────────
	   « Navigation » = ce qui sert à SE DÉPLACER dans le corpus ou dans la
	   page, par opposition à ce qui sert à lire la note. Le fil d'Ariane et le
	   sommaire en font partie : ils n'ont d'objet que cliqués. */
	{
		exigence: 'navigation',
		sens: 'absent',
		famille: '.rail',
		selecteur: '.rail',
		classes: [/^rail$/],
		trace: 'V-14:1272 et V-18 — le rail de navigation de la coquille V-37'
	},
	{
		exigence: 'navigation',
		sens: 'absent',
		famille: '.barre',
		selecteur: '.barre',
		classes: [/^barre$/],
		trace: 'V-14:1272 — la barre supérieure de la coquille V-37'
	},
	{
		exigence: 'navigation',
		sens: 'absent',
		famille: '.fil / .fil-pub',
		selecteur: '.fil, .fil-pub',
		classes: [/^fil$/, /^fil-pub$/],
		trace: 'V-14:4366 (fil), V-03:901 (fil-pub) — le fil d’Ariane'
	},
	{
		exigence: 'navigation',
		sens: 'absent',
		famille: '.chapeau / .pied-public',
		selecteur: '.chapeau, .pied-public',
		classes: [/^chapeau$/, /^pied-public$/],
		trace: 'V-03:896 — en-tête et pied du site public, marque et connexion'
	},
	{
		exigence: 'navigation',
		sens: 'absent',
		famille: '.sommaire',
		selecteur: '.sommaire',
		classes: [/^sommaire$/],
		trace: 'V-14:1272, V-03:896 — le sommaire de la note, navigation intra-page'
	},
	{
		exigence: 'navigation',
		sens: 'absent',
		famille: '.saut-contenu',
		selecteur: '.saut-contenu',
		classes: [/^saut-contenu$/],
		trace: 'V-03:918, V-14 — le lien d’évitement ; hors page, donc non imprimé'
	},
	{
		exigence: 'navigation',
		sens: 'absent',
		famille: 'rôle « navigation »',
		selecteur: 'nav, [role="navigation"]',
		structurel: true,
		trace: 'filet de sécurité — le rôle ARIA, implicite (<nav>) ou explicite'
	},

	/* ── E-2 · sans panneaux latéraux ──────────────────────────────────────
	   « Panneau latéral » = un bloc qui borde la lecture sans en faire partie.
	   `.panneau` est le composant de `docs/DESIGN.md` ; `.panneaux` en est le
	   conteneur de V-14 ; `.aparte`, `.ref-panneau` et `.meta-panneau` sont les
	   formes propres de V-03 et V-18. */
	{
		exigence: 'panneaux',
		sens: 'absent',
		famille: '.panneaux',
		selecteur: '.panneaux',
		classes: [/^panneaux$/],
		trace: 'V-14:1272 — la colonne de panneaux latéraux de la lecture'
	},
	{
		exigence: 'panneaux',
		sens: 'absent',
		famille: '.panneau',
		selecteur: '.panneau',
		classes: [/^panneau$/],
		trace: 'V-03, V-14, V-18 — le composant panneau de docs/DESIGN.md §2'
	},
	{
		exigence: 'panneaux',
		sens: 'absent',
		famille: '.aparte',
		selecteur: '.aparte',
		classes: [/^aparte$/],
		trace: 'V-03:896 — l’aparté latéral de la lecture publique'
	},
	{
		exigence: 'panneaux',
		sens: 'absent',
		famille: '.ref-panneau / .meta-panneau',
		selecteur: '.ref-panneau, .meta-panneau',
		classes: [/^ref-panneau$/, /^meta-panneau$/],
		trace: 'V-18 — le panneau de référence et le panneau de métadonnées'
	},
	{
		exigence: 'panneaux',
		sens: 'absent',
		famille: 'rôle « complementary »',
		selecteur: 'aside, [role="complementary"]',
		structurel: true,
		trace: 'filet de sécurité — le rôle ARIA, implicite (<aside>) ou explicite'
	},

	/* ── E-3 · les métadonnées de confiance ────────────────────────────────
	   RG-M18-17 dit « les métadonnées de confiance en en-tête » sans les
	   énumérer. LA DÉCOMPOSITION EN TROIS PARTIES EST UNE DÉCISION : le témoin
	   de fraîcheur, sa date, son auteur. Elle est lue du cartouche de V-14, la
	   seule maquette qui porte les trois — et c'est précisément ce qui rend le
	   relevé de V-03 informatif, où l'auteur n'est pas nommé.

	   Ces trois familles sont en sens PRÉSENT : le défaut est leur absence, et
	   il n'est relevé que sur un état où la LECTURE est imprimée (cf. §3). */
	{
		exigence: 'metadonnees',
		sens: 'present',
		partie: 'temoin',
		famille: 'témoin de fraîcheur',
		selecteur: '.cartouche__valeur, .cartouche .temoin__jauge',
		classes: [/^cartouche__valeur$/, /^temoin__jauge$/],
		trace: 'V-14:cartouche#cartouche — jauge à trois barres et niveau en clair'
	},
	{
		exigence: 'metadonnees',
		sens: 'present',
		partie: 'date',
		famille: 'date de vérification',
		selecteur: '.cartouche time[datetime]',
		classes: [/^cartouche__detail$/],
		trace: 'V-14 et V-03 — <time datetime> dans .cartouche__detail'
	},
	{
		/* CETTE FAMILLE EST RESTREINTE À V-14, ET LA RESTRICTION EST UNE MESURE,
		   PAS UNE COMMODITÉ.

		   Le proxy structurel de « l'auteur » est `.cartouche__detail strong`.
		   Sur V-14 il est valide dans les trois niveaux de fraîcheur : le script
		   du gel écrit « par <strong>Karim Belhadj</strong> », « par
		   <strong>Sophie Nguyen</strong> », « par <strong>Marc Ferreira</strong> »
		   (V-14:4009-4011).

		   SUR V-03 IL EST FAUX DANS LES DEUX SENS, et je l'ai mesuré avant de le
		   croire. Le cartouche public écrit « Ce guide a été contrôlé le
		   <time>2 août 2026</time> par l'équipe qui l'a écrit » — une
		   attribution COLLECTIVE, sans nœud, donc « absent » sur trois états ; et
		   au niveau obsolète il écrit « <strong>Vérifiez auprès de l'assistance
		   avant de vous y fier.</strong> » (V-03:1678) — un AVERTISSEMENT que le
		   proxy prendrait pour un auteur, donc « présent » sur le quatrième. Une
		   famille qui se trompe dans les deux sens ne mesure pas ce qu'elle croit.

		   La part « auteur » n'est donc pas opposée à V-03 : elle est déclarée
		   NON PORTÉE PAR LE GEL, comptée en constat, et le rapport la nomme. La
		   décomposition des « métadonnées de confiance » en trois parts vient du
		   contrat de tâche ; RG-M18-17 ne les énumère pas, et rien n'autorise à
		   exiger d'une lecture PUBLIQUE qu'elle nomme un vérificateur. */
		exigence: 'metadonnees',
		sens: 'present',
		partie: 'auteur',
		vues: ['V-14'],
		famille: 'auteur de la vérification',
		selecteur: '.cartouche__detail strong',
		classes: [/^cartouche__detail$/],
		trace: 'V-14:4009-4011 — « par <strong>…</strong> » aux trois niveaux'
	}
];

/**
 * Les familles applicables à une vue. Une famille sans `vues` vaut partout ;
 * une famille restreinte ne s'oppose qu'aux vues dont le gel la porte.
 */
export function famillesPour(vue) {
	return FAMILLES.filter((f) => !f.vues || f.vues.includes(vue));
}

/** Les familles qu'une vue ne porte pas — comptées, nommées, jamais opposées. */
export function famillesHorsGelDe(vue) {
	return FAMILLES.filter((f) => f.vues && !f.vues.includes(vue));
}

/** Les familles d'une exigence donnée. */
export function famillesDe(exigence) {
	return FAMILLES.filter((f) => f.exigence === exigence);
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. CE QUE LA TABLE ÉCARTE, ET POURQUOI — énoncé et chiffré à chaque
   exécution. Une exclusion muette est une couverture inventée.

   Le gel masque à l'impression plus de choses que RG-M18-17 n'en nomme. Les
   compter en défaut ferait dire à la batterie que la règle exige leur absence,
   ce qu'elle n'exige pas ; les taire ferait croire que la batterie les a
   jugées. Elles sont donc RELEVÉES, jamais opposées.
   ═════════════════════════════════════════════════════════════════════════ */

export const HORS_REGLE = [
	{
		famille: '.cartouche__actions',
		selecteur: '.cartouche__actions',
		motif:
			'les COMMANDES du cartouche — « Marquer comme vérifié », « Signaler à ' +
			'réviser ». RG-M18-17 n’exige ni leur absence ni leur présence ; le gel ' +
			'les masque, ce qui est cohérent avec une feuille imprimée, et ce choix ' +
			'appartient à la maquette.'
	},
	{
		famille: '.registre',
		selecteur: '.registre',
		motif:
			'la BASCULE DE REGISTRE — Référence / Opérationnel. Ni navigation dans ' +
			'le corpus, ni panneau latéral : un commutateur de lecture. Le gel le ' +
			'masque ; la règle ne le demande pas.'
	},
	{
		famille: '.notifs',
		selecteur: '.notifs',
		motif:
			'la PILE DE NOTIFICATIONS de RG-M18-02, vide au repos sur les trois vues ' +
			'(mesuré : 0 élément rendu à l’écran). Son masquage à l’impression ne ' +
			'peut RIEN prouver — la règle n’est pas exercée. C’est P-5, et c’est ' +
			'pourquoi le rapport imprime, pour chaque famille, ce qu’elle a exercé.'
	},
	{
		famille: '.bandeaux / .bandeau*',
		selecteur: '.bandeaux, [class^="bandeau"]',
		motif:
			'les BANDEAUX de révision, brouillon et resynchronisation. Le gel les ' +
			'masque à l’impression alors qu’ils portent une information de confiance ' +
			'— « Révision demandée », « Brouillon, non visible du public ». ' +
			'RG-M18-17 ne les nomme pas : la tension est RELEVÉE, pas tranchée.'
	},
	{
		famille: '.tampon',
		selecteur: '.tampon',
		motif:
			'le TAMPON « VÉRIFIÉ » du cartouche — décor, doublon graphique du témoin. ' +
			'Il s’imprime ; la règle ne le demande pas.'
	}
];

/* ═══════════════════════════════════════════════════════════════════════════
   4. LES ADRESSES DES LIENS — E-4, et le piège de mesure qui la rend fausse

   « attr(href) dans `content` n'apparaît PAS dans le textContent. » Il se lit
   par `getComputedStyle(element, '::after').content`, et par lui seul. Une
   batterie qui lirait le texte conclurait à une absence sur un dépôt conforme.
   Vérifié avant d'écrire une ligne : sur V-14, `.lien-ext::after` rend
   `" ↗"` en média écran et `" (https://docs.pgbarman.org)"` en média
   impression, tandis que `textContent` vaut « docs.pgbarman.org » dans les
   deux cas.

   UN LIEN A UNE ADRESSE quand son attribut `href` n'est ni vide, ni `#`, ni
   une ancre interne `#…`. C'est une décision, et elle a une conséquence
   chiffrée qu'il faut lire : LES MAQUETTES ÉCRIVENT `href="#"` PARTOUT. Sur
   V-14, 13 liens du corps sur 14 n'ont pas d'adresse ; sur V-03, 3 sur 4. La
   règle n'est donc exercée QUE PAR UN LIEN PAR VUE, et le rapport le dit à
   chaque exécution. C'est exactement le défaut que P-5 décrit — le filtre
   d'ARB-013 resté inerte huit lots parce que « toutes les vues portaient
   href="#" ».

   L'ADRESSE EST RESTITUÉE quand le contenu généré du lien — `::before` et
   `::after` réunis, en média impression — CONTIENT la valeur de `href`.
   « Hors du flux » est entendu au sens du contenu généré : ce qui n'est pas
   dans le texte de la note.
   ═════════════════════════════════════════════════════════════════════════ */

/** Un `href` porte-t-il une adresse ? Décision déclarée, éprouvée en unitaire. */
export function porteUneAdresse(href) {
	if (typeof href !== 'string') return false;
	const h = href.trim();
	if (h === '' || h === '#' || h.startsWith('#')) return false;
	return true;
}

/** Le contenu généré restitue-t-il l'adresse ? */
export function adresseRestituee(href, contenuGenere) {
	if (!porteUneAdresse(href)) return true;
	return String(contenuGenere ?? '').includes(href.trim());
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. LE CATALOGUE DES RÈGLES — aucune règle n'est émise hors de lui.

   Une règle que le catalogue ignore est une règle dont personne ne saura
   qu'elle a parlé : le rapport annoncerait une couverture qu'il n'a pas. Les
   unitaires figent la non-divergence du catalogue et du code.
   ═════════════════════════════════════════════════════════════════════════ */

export const CATALOGUE_DEFAUTS = [
	{
		regle: 'impression:navigation-imprimee',
		exigence: 'navigation',
		quoi: 'un élément de navigation a de l’encre sur la feuille'
	},
	{
		regle: 'impression:panneau-imprime',
		exigence: 'panneaux',
		quoi: 'un panneau latéral a de l’encre sur la feuille'
	},
	{
		regle: 'impression:metadonnee-absente',
		exigence: 'metadonnees',
		quoi: 'une part des métadonnées de confiance manque à la feuille'
	},
	{
		regle: 'impression:adresse-non-restituee',
		exigence: 'adresses',
		quoi: 'un lien du corps porte une adresse que la feuille ne restitue pas'
	}
];

export const CATALOGUE_CONSTATS = [
	{
		regle: 'constat:lecture-non-imprimee',
		quoi:
			'aucun article porteur de titre n’est imprimé dans cet état — il n’y a ' +
			'rien à lire, donc rien que RG-M18-17 puisse exiger. Compté, jamais opposé.'
	},
	{
		regle: 'constat:lien-sans-adresse',
		quoi:
			'un lien du corps dont le `href` est `#` : la maquette ne lui donne pas ' +
			'd’adresse, la règle ne peut pas être exercée sur lui (P-5).'
	},
	{
		regle: 'constat:masque-hors-regle',
		quoi:
			'un élément que le gel masque à l’impression sans que RG-M18-17 le ' +
			'nomme — cf. HORS_REGLE et son motif.'
	},
	{
		regle: 'constat:metadonnee-non-portee',
		quoi:
			'une part des métadonnées de confiance que le GEL DE CETTE VUE ne porte ' +
			'pas — V-03 ne nomme aucun auteur de vérification. Comptée, jamais ' +
			'opposée : la vue ne peut pas imprimer ce que sa maquette n’écrit pas.'
	},
	{
		regle: 'constat:jauge-sans-adjustement-couleur',
		quoi:
			'la jauge de fraîcheur est peinte par des fonds, et le nœud ne déclare ' +
			'pas `print-color-adjust: exact` : une imprimante qui n’imprime pas les ' +
			'fonds — le défaut de Chromium — la rendrait muette. RG-M18-17 ne le ' +
			'nomme pas ; le niveau reste lisible en clair par `.cartouche__valeur`.'
	}
];

export const CATALOGUE_INSTRUMENT = [
	{
		regle: 'instrument:etat-inatteignable',
		quoi: 'le couple n’a pas pu être posé — rien ne peut être conclu de son silence'
	},
	{
		regle: 'instrument:famille-inerte',
		quoi: 'une famille déclarée qu’aucun élément du corpus mesuré ne satisfait'
	}
];

const REGLES_DEFAUT = new Set(CATALOGUE_DEFAUTS.map((c) => c.regle));
const REGLES_CONSTAT = new Set(CATALOGUE_CONSTATS.map((c) => c.regle));
const REGLES_INSTRUMENT = new Set(CATALOGUE_INSTRUMENT.map((c) => c.regle));

export const estConstat = (regle) => REGLES_CONSTAT.has(regle);
export const estInstrument = (regle) => REGLES_INSTRUMENT.has(regle);
export const estDefaut = (regle) => REGLES_DEFAUT.has(regle);

/* ═══════════════════════════════════════════════════════════════════════════
   6. CE QUE LA BATTERIE NE COUVRE PAS — imprimé, chiffré, à chaque exécution.
   « Un relevé ne prouve que ce qu'il regarde » (ARB-023).
   ═════════════════════════════════════════════════════════════════════════ */

export const NON_COUVERTURE = [
	{
		sujet:
			'LA PAGINATION. `emulateMedia({media:"print"})` applique la CASCADE du ' +
			'média impression, il ne PAGINE pas : ni boîte de page, ni marges ' +
			'`@page`, ni coupures. `break-inside`, `page-break-*` et les orphelines ' +
			'ne sont pas jugés. Aucune maquette ne déclare `@page` — mesuré.',
		mesure: 'regles-page'
	},
	{
		sujet:
			'LES FONDS. Chromium n’imprime pas les fonds par défaut ; ici ils sont ' +
			'rendus. La batterie relève `print-color-adjust` en CONSTAT, elle ne ' +
			'simule pas une imprimante.',
		mesure: 'constat:jauge-sans-adjustement-couleur'
	},
	{
		sujet:
			'LA LECTURE DU REGISTRE OPÉRATIONNEL. Aucun état de ' +
			'`verif/scenarios/V-14.json` ne pose `data-registre="operationnel"` : la ' +
			'bascule est un comportement (ARB-011). Le registre Opérationnel imprimé ' +
			'n’est mesuré par personne.',
		mesure: 'etats-registre-operationnel'
	},
	{
		sujet:
			'LES 38 AUTRES VUES. RG-M18-17 ne porte que sur la lecture d’une note ; ' +
			'les autres vues ne sont pas mesurées, et le gel ne leur donne d’ailleurs ' +
			'aucune règle `@media print`.',
		mesure: 'vues-hors-perimetre'
	},
	{
		sujet:
			'LE BOUTON « IMPRIMER ». Le gel l’attache à `window.print()` ; ' +
			'`src/vues/V-14.svelte` ne porte pas cet attribut, par ARB-011. La ' +
			'batterie mesure CE QUI S’IMPRIME, jamais le geste qui le déclenche.',
		mesure: 'boutons-imprimer'
	},
	{
		sujet:
			'LES LIENS SANS ADRESSE. La règle des adresses n’est exercée que par les ' +
			'liens dont le `href` en porte une.',
		mesure: 'constat:lien-sans-adresse'
	}
];

/* ═══════════════════════════════════════════════════════════════════════════
   7. LE CLASSEMENT — la clé, le multi-ensemble, les natures.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * La clé de rapprochement. AUCUN TEXTE N'Y ENTRE — ÉCART-041, P-8.
 * @param {{regle: string, exigence: string, famille?: string, ordinal?: number,
 *          href?: string, partie?: string}} c
 */
export function cleDe(c) {
	const parts = [c.regle, c.exigence ?? '', c.famille ?? '', c.partie ?? '', c.href ?? ''];
	parts.push(c.ordinal === undefined || c.ordinal === null ? '' : String(c.ordinal));
	return parts.join(' ');
}

/** Le compte des occurrences par clé, pour un côté. */
export function compter(constats) {
	const m = new Map();
	for (const c of constats) {
		const k = cleDe(c);
		const e = m.get(k);
		if (e) e.occurrences++;
		else m.set(k, { ...c, cle: k, occurrences: 1 });
	}
	return m;
}

/**
 * Le classement en natures d'un couple — multi-ensemble, comme la batterie 10.
 * @returns {{regle: string, nature: string, occurrences: number}[]}
 */
export function classer(gel, app) {
	const cotesGel = compter(gel);
	const cotesApp = compter(app);
	const sortie = [];
	for (const cle of new Set([...cotesGel.keys(), ...cotesApp.keys()])) {
		const g = cotesGel.get(cle);
		const a = cotesApp.get(cle);
		const modele = a ?? g;
		const nGel = g ? g.occurrences : 0;
		const nApp = a ? a.occurrences : 0;
		const commun = Math.min(nGel, nApp);
		if (commun > 0) sortie.push({ ...modele, nature: 'gel', occurrences: commun });
		if (nApp > commun) sortie.push({ ...a, nature: 'portage', occurrences: nApp - commun });
		if (nGel > commun) sortie.push({ ...g, nature: 'gel-non-reporte', occurrences: nGel - commun });
	}
	sortie.sort((x, y) => (x.cle === y.cle ? 0 : x.cle < y.cle ? -1 : 1));
	return sortie;
}

/** Les natures qui font échouer la batterie. */
export const NATURES_OPPOSABLES = ['portage', 'gel'];

export function agreger(lignes) {
	const total = {
		portage: 0,
		gel: 0,
		'gel-non-reporte': 0,
		instrument: 0,
		constat: 0,
		'non-classe': 0
	};
	for (const l of lignes) {
		if (estConstat(l.regle)) total.constat += l.occurrences;
		else if (estInstrument(l.regle)) total.instrument += l.occurrences;
		else if (l.nature in total) total[l.nature] += l.occurrences;
		else total['non-classe'] += l.occurrences;
	}
	return total;
}

/** Le verdict d'un couple : conforme, ou la nature la plus grave rencontrée. */
export function verdictDuCouple(total) {
	if (total.instrument > 0) return 'instrument';
	if (total.portage > 0) return 'portage';
	if (total.gel > 0) return 'gel';
	return 'conforme';
}

/**
 * LE CONTRÔLE D'ÉCART-041, POSÉ D'AVANCE.
 *
 * Une clé qui sur-discrimine fabrique des paires `portage` / `gel-non-reporte`
 * de MÊME RÈGLE et de MÊME COMPTE : c'est exactement la signature des 31 faux
 * défauts. Le rapport imprime ce chiffre à chaque exécution ; il n'est pas un
 * verdict, il est le témoin qui a manqué pendant huit lots.
 */
export function jumelages(lignes) {
	const parRegle = new Map();
	for (const l of lignes) {
		const e = parRegle.get(l.regle) ?? { portage: 0, 'gel-non-reporte': 0 };
		if (l.nature === 'portage') e.portage += l.occurrences;
		if (l.nature === 'gel-non-reporte') e['gel-non-reporte'] += l.occurrences;
		parRegle.set(l.regle, e);
	}
	let portage = 0;
	let jumeles = 0;
	const detail = [];
	for (const [regle, e] of parRegle) {
		if (!e.portage) continue;
		const j = Math.min(e.portage, e['gel-non-reporte']);
		portage += e.portage;
		jumeles += j;
		if (j) detail.push({ regle, portage: e.portage, jumeles: j });
	}
	return { portage, jumeles, detail };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. L'ÉPREUVE DE LA TABLE — P-5, volet statique.

   Chaque famille qui nomme des classes doit être satisfaite par au moins une
   classe du relevé mécanique des 41 maquettes. Les familles structurelles ne
   nomment aucune classe : elles sont éprouvées à l'exécution, par le compte
   d'éléments rencontrés.
   ═════════════════════════════════════════════════════════════════════════ */

export function eprouverLesFamilles(classesDuGel) {
	const inertes = [];
	for (const f of FAMILLES) {
		if (f.structurel) continue;
		if (!f.classes?.length) {
			inertes.push(`${f.famille} (aucune classe déclarée)`);
			continue;
		}
		for (const re of f.classes) {
			if (!classesDuGel.some((c) => re.test(c))) inertes.push(`${f.famille} → ${re}`);
		}
	}
	return inertes;
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. LA DÉRIVATION DES RÈGLES DEPUIS UN RELEVÉ.

   Le relevé de page ne DÉCIDE de rien : il rend des faits — ce qui a de
   l'encre, ce qui n'en a pas, ce que les pseudo-éléments engendrent. La
   traduction en constats se fait ICI, hors du navigateur, pour être éprouvée
   par `verif/impression.test.ts` sans lancer ni serveur ni Chromium.
   ═════════════════════════════════════════════════════════════════════════ */

export function constatsDuReleve(releve, vue) {
	const constats = [];
	/* Ce que le gel de CETTE vue ne porte pas — nommé, compté, jamais opposé. */
	for (const f of famillesHorsGelDe(vue)) {
		constats.push({
			regle: 'constat:metadonnee-non-portee',
			exigence: f.exigence,
			famille: f.famille,
			partie: f.partie ?? null,
			ordinal: null,
			signature: `(${f.partie ?? f.famille})`,
			detail: `le gel de ${vue} ne porte pas cette part`
		});
	}
	for (const f of releve.familles) {
		if (f.sens === 'absent') {
			const regle =
				f.exigence === 'navigation'
					? 'impression:navigation-imprimee'
					: 'impression:panneau-imprime';
			for (const ordinal of f.rendus) {
				constats.push({
					regle,
					exigence: f.exigence,
					famille: f.famille,
					ordinal,
					signature: f.signatures[ordinal] ?? '',
					detail: ''
				});
			}
		} else if (releve.lecture && f.rendus.length === 0) {
			constats.push({
				regle: 'impression:metadonnee-absente',
				exigence: f.exigence,
				famille: f.famille,
				partie: f.partie,
				ordinal: null,
				signature: `(${f.partie})`,
				detail: `${f.total} nœud(s) au DOM, aucun imprimé`
			});
		}
	}

	/* Les adresses. Le rang de chaque `href` distingue deux liens de même
	   adresse ; aucun texte n'entre dans la clé. */
	const rangs = new Map();
	for (const l of releve.liens) {
		const href = l.href ?? '';
		const rang = rangs.get(href) ?? 0;
		rangs.set(href, rang + 1);
		if (!porteUneAdresse(href)) {
			constats.push({
				regle: 'constat:lien-sans-adresse',
				exigence: 'adresses',
				href,
				ordinal: rang,
				signature: l.signature,
				detail: ''
			});
			continue;
		}
		if (!adresseRestituee(href, l.genere)) {
			constats.push({
				regle: 'impression:adresse-non-restituee',
				exigence: 'adresses',
				href,
				ordinal: rang,
				signature: l.signature,
				detail: `contenu engendré : « ${l.genere} »`
			});
		}
	}

	if (!releve.lecture) {
		constats.push({
			regle: 'constat:lecture-non-imprimee',
			exigence: 'lecture',
			ordinal: null,
			signature: '(document)',
			detail: `${releve.articles} article(s) imprimé(s), ${releve.titres} titre(s)`
		});
	}
	for (const h of releve.horsRegle) {
		if (h.total === 0) continue;
		constats.push({
			regle: 'constat:masque-hors-regle',
			exigence: 'hors-regle',
			famille: h.famille,
			ordinal: null,
			signature: h.famille,
			detail: `${h.rendus}/${h.total} imprimé(s)`
		});
	}
	if (releve.ajustementJauge !== null && releve.ajustementJauge !== 'exact') {
		constats.push({
			regle: 'constat:jauge-sans-adjustement-couleur',
			exigence: 'metadonnees',
			ordinal: null,
			signature: '.temoin__jauge i',
			detail: `print-color-adjust: ${releve.ajustementJauge || '(non déclaré)'}`
		});
	}
	return constats;
}
