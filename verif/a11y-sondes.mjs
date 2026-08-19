/**
 * Batterie 10 — les sondes, le catalogue et le classement.
 *
 * Ce module est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie JAMAIS ce fichier, ni le catalogue
 * de règles axe, ni le seuil. Retirer une règle pour obtenir du vert est le
 * contournement de vérification nommé par PLAN §12 (RA-01). La sortie légitime
 * est le protocole d'écart.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE FICHIER PORTE, ET POURQUOI IL EST SÉPARÉ DE L'ORCHESTRATION
 *
 * Trois choses, et elles ont en commun d'être vérifiables sans navigateur :
 *
 *   1. LE CATALOGUE — quelles règles axe sont activées, lesquelles sont
 *      écartées et POUR QUEL MOTIF, quelles sondes propres au dépôt existent
 *      et quel critère chacune éprouve. C'est la réponse à l'obligation
 *      d'instrument du dépôt : « énonce ce que tu ne couvres pas, à chaque
 *      exécution, et mesure-le ». Un catalogue qui vit dans le code de
 *      l'orchestration finit par diverger de ce que le code exécute ;
 *      `verif/a11y.test.ts` confronte ici les deux, mécaniquement.
 *
 *   2. LES SONDES elles-mêmes, écrites comme un unique installateur posé dans
 *      la page. Elles sont hors de portée de l'unitaire — l'environnement de
 *      `vitest.config.ts` est `node`, sans DOM, et le dépôt n'a pas de
 *      dépendance qui en fournirait un. Elles sont donc éprouvées de bout en
 *      bout par `--sonde`, comme le banc éprouve son comparateur (RA-01).
 *
 *   3. LE CLASSEMENT EN TROIS NATURES, qui est le cœur du lot. Il est pur :
 *      deux relevés entrent, une partition sort. C'est la partie qu'un
 *      unitaire peut figer, et c'est celle dont une erreur silencieuse
 *      coûterait le plus cher — un rapport qui mélange le portage et le gel
 *      est inutilisable.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE CLASSEMENT — LA MÉTHODE, ET POURQUOI ELLE EST MÉCANIQUE
 *
 * La batterie audite DEUX CÔTÉS pour chaque état, par le même code, dans les
 * mêmes conditions de capture : la MAQUETTE GELÉE et l'APPLICATION. C'est la
 * jurisprudence du banc (`verif/banc/capture.mjs`, « un seul chemin de
 * capture ») appliquée à l'accessibilité. Le verdict d'un défaut se lit alors
 * dans la comparaison des deux relevés, jamais dans une appréciation :
 *
 *   • présent DES DEUX CÔTÉS  → nature « gel ». La maquette porte le défaut,
 *     le portage l'a fidèlement reproduit. `verif:maquette` reste vert :
 *     c'est le cas d'école de « ce qu'un vert ne dit jamais ». Le corriger
 *     dans l'application ferait diverger la vue de son gel — il demande donc
 *     un REGEL, geste du commanditaire, jamais d'un lot.
 *   • présent CÔTÉ APPLICATION SEULEMENT → nature « portage ». Le gel ne le
 *     porte pas : il a été introduit par le code livré. C'est corrigeable par
 *     le lot de la vue, sans toucher au gel.
 *   • présent CÔTÉ MAQUETTE SEULEMENT → « gel non reporté ». Ce n'est pas un
 *     défaut de l'application, c'est une DIVERGENCE : le portage n'a pas
 *     reproduit ce que le gel porte. Signalé, jamais mis au crédit de qui que
 *     ce soit.
 *   • que l'instrument ne sait pas trancher → nature « instrument ». Les
 *     `incomplete` d'axe en sont le gros, et ils sont comptés règle par règle :
 *     c'est la mesure de la non-couverture, pas son aveu.
 *
 * LE RAPPROCHEMENT SE FAIT PAR MULTI-ENSEMBLE, jamais par appariement un à un.
 * Une page porte douze liens de rail identiques ; si le gel en fait échouer
 * douze et l'application treize, le treizième est du portage et les douze
 * autres du gel. Compter les occurrences par clé et prendre le minimum est la
 * seule lecture qui ne fabrique ni faux portage ni fausse absolution.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   1. LE CATALOGUE AXE
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Les étiquettes axe qui composent le VERDICT.
 *
 * `RG-M18-07` demande le niveau AA, `RG-M18-08` à `RG-M18-11` des propriétés
 * qui relèvent de A et AA. Le verdict porte donc exactement sur A et AA, dans
 * les trois révisions que la version 4.13 d'axe connaît.
 *
 * `wcag2aaa` et `color-contrast-enhanced` en sont EXCLUS, et c'est délibéré :
 * `RG-M18-07` écrit « niveau AA », et le socle documente un jeton assombri le
 * 16/08 pour atteindre 4,5:1 — pas 7:1. Une batterie qui exigerait AAA
 * rougirait sur une exigence que personne n'a posée.
 */
export const TAGS_VERDICT = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Les étiquettes axe relevées mais NON OPPOSABLES — comptées, listées,
 * jamais portées au verdict.
 *
 * `best-practice` n'est adossé à aucun critère WCAG ni à aucune règle du
 * cadrage. Le faire entrer au verdict reviendrait à créer une exigence par
 * choix d'outillage : c'est un comblement (`CLAUDE.md` §2). Le taire
 * reviendrait à ne pas dire ce qu'on a vu. Il est donc relevé en CONSTAT.
 */
export const TAGS_CONSTAT = ['best-practice'];

/**
 * Les règles axe explicitement DÉSACTIVÉES, et le motif de chacune.
 *
 * Une règle désactivée sans motif écrit est une couverture perdue en silence.
 * Le rapport réimprime cette table à chaque exécution.
 */
export const REGLES_ECARTEES = [
	{
		regle: 'color-contrast-enhanced',
		motif:
			'niveau AAA (7:1). RG-M18-07 exige AA (4,5:1) et le socle est réglé pour AA : ' +
			'exiger AAA créerait une exigence que le cadrage ne pose pas.'
	},
	{
		regle: 'html-has-lang',
		motif:
			'ÉCARTÉE CÔTÉ MAQUETTE SEULEMENT — voir PORTEE_DOCUMENT. La règle est active ' +
			'des deux côtés ; elle est citée ici parce que le mode démo compose lui-même ' +
			'le document (verif/banc/mode-demo.mjs) : un défaut de <html> y appartiendrait ' +
			"à l'instrument et non à la vue.",
		active: true
	}
];

/**
 * Les règles axe qui portent sur le DOCUMENT et non sur la vue.
 *
 * Le mode démo compose `<html>`, `<head>` et `<body>` lui-même — c'est écrit
 * dans son bandeau. Un défaut de document mesuré côté application ne dirait
 * donc rien de la vue : il dirait quelque chose de l'instrument. Ces règles
 * restent ACTIVES — les retirer aveuglerait le côté maquette, où elles portent
 * bien sur le gel — mais leurs constats côté application sont classés
 * « instrument » plutôt que « portage ».
 *
 * C'est la seule requalification de nature du dispositif, et elle est écrite
 * ici, en clair, plutôt que dissoute dans le code du classement.
 */
export const PORTEE_DOCUMENT = [
	'html-has-lang',
	'html-lang-valid',
	'html-xml-lang-mismatch',
	'document-title',
	'valid-lang',
	'meta-viewport',
	'meta-viewport-large',
	'meta-refresh',
	'bypass'
];

/* ═══════════════════════════════════════════════════════════════════════════
   2. LE CATALOGUE DES SONDES PROPRES AU DÉPÔT
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Ce qu'axe ne fait pas, et que la batterie doit faire quand même.
 *
 * Chaque entrée nomme la règle du cadrage qu'elle éprouve et la raison pour
 * laquelle axe ne suffit pas. `verif/a11y.test.ts` vérifie que cette table et
 * le code des sondes ne peuvent pas diverger : toute règle émise par
 * `installerSondes()` figure ici, et réciproquement.
 */
export const CATALOGUE_SONDES = [
	{
		regle: 'saut:cible-inexistante',
		exigence: 'RG-M18-08',
		eprouve: "un lien interne dont la cible n'existe pas dans le document",
		pourquoi_pas_axe: 'axe ne suit pas les fragments : « skip-link » ne juge que le premier lien.'
	},
	{
		regle: 'saut:cible-non-focalisable',
		exigence: 'RG-M18-08, ÉCART-018',
		eprouve:
			"la cible d'un lien interne ne peut pas recevoir le focus — ni focalisable " +
			'nativement, ni porteuse de tabindex. Le lien déplace alors le défilement sans ' +
			'déplacer le focus : le clavier reste où il était.',
		pourquoi_pas_axe: "aucune règle axe n'inspecte la focalisabilité de la cible d'un fragment."
	},
	{
		regle: 'clavier:action-non-atteignable',
		exigence: 'RG-M18-08',
		eprouve: 'un élément interactif visible que le parcours de tabulation réel ne rencontre pas',
		pourquoi_pas_axe: "axe n'appuie sur aucune touche : il lit le DOM, il ne le parcourt pas."
	},
	{
		regle: 'focus:invisible',
		exigence: 'RG-M18-08',
		eprouve:
			'un élément dont le style calculé est stricement identique avec et sans focus — ' +
			"aucun anneau, aucune ombre, aucun changement d'encre ou de fond",
		pourquoi_pas_axe: 'axe 4.13 ne porte aucune règle sur 2.4.7 « Focus visible ».'
	},
	{
		regle: 'superposition:sans-piege',
		exigence: 'RG-M18-10',
		eprouve:
			"une superposition qui n'est pas un dialogue modal natif : le focus n'y est pas " +
			'confiné, et rien ne le rendra à la fermeture',
		pourquoi_pas_axe: "axe ne teste pas la confinement du focus d'une superposition."
	},
	{
		regle: 'superposition:fuite-du-focus',
		exigence: 'RG-M18-10',
		eprouve: 'le parcours de tabulation sort de la superposition ouverte',
		pourquoi_pas_axe:
			'le piège se constate en TABULANT, pas en lisant le DOM : axe n’appuie sur ' +
			'aucune touche et ne connaît pas la couche supérieure.'
	},
	{
		regle: 'superposition:sans-echappement',
		exigence: 'RG-M18-10',
		eprouve: 'la superposition reste ouverte après un appui sur Échappement',
		pourquoi_pas_axe:
			'axe ne délivre aucun événement clavier ; l’échappement ne se constate qu’en ' +
			'appuyant sur la touche et en relisant le document.'
	},
	{
		regle: 'superposition:sans-restitution',
		exigence: 'RG-M18-10',
		eprouve: "à la fermeture, le focus ne revient pas à l'élément qui l'avait avant l'ouverture",
		pourquoi_pas_axe:
			'la restitution est une propriété DYNAMIQUE : il faut poser le focus sur un ' +
			'témoin, ouvrir, fermer, puis relire. Aucune règle statique ne peut la voir.'
	},
	{
		regle: 'graphique:sans-alternative',
		exigence: 'RG-M18-11, P-06',
		eprouve:
			'un contenu graphique — svg, canvas, img, [role=img] — sans nom accessible, non ' +
			"masqué aux technologies d'assistance, et qui n'est pas hébergé par un contrôle " +
			'lui-même nommé',
		pourquoi_pas_axe:
			"« svg-img-alt » ne juge qu'un svg portant déjà role=img ou role=graphics-*. Un " +
			'svg sans rôle — la forme la plus répandue du dépôt — lui est inapplicable.'
	},
	{
		regle: 'couleur:temoin-sans-jauge',
		exigence: 'RG-M18-09, P-7.1, DESIGN §3.7',
		eprouve: 'un témoin de fraîcheur rendu sans sa jauge : la forme ne porte plus rien',
		pourquoi_pas_axe:
			"« l'information portée par la couleur seule » n'est pas mécanisable en général ; " +
			'elle l’est sur les composants dont DESIGN §3.3 fixe le balisage exact.'
	},
	{
		regle: 'couleur:temoin-jauge-incomplete',
		exigence: 'RG-M18-09, P-7.1, DESIGN §3.7 interdit 2',
		eprouve: 'une jauge de témoin qui ne porte pas exactement trois barres',
		pourquoi_pas_axe:
			'DESIGN §3.3 fixe le balisage exact du composant ; axe ne connaît ni ce ' +
			'balisage ni la règle qui l’impose.'
	},
	{
		regle: 'couleur:temoin-jauge-annoncee',
		exigence: 'RG-M18-09, DESIGN §3.7 interdit 3',
		eprouve: 'une jauge sans aria-hidden : trois éléments vides seraient annoncés',
		pourquoi_pas_axe:
			'trois <i> vides ne violent aucune règle axe ; ils ne sont un défaut que ' +
			'parce que DESIGN §3.7 interdit de les annoncer.'
	},
	{
		regle: 'couleur:temoin-sans-libelle',
		exigence: 'RG-M18-09, P-7.1, DESIGN §3.7 interdit 1',
		eprouve: 'un témoin sans `.temoin__txt` : le niveau ne serait plus lisible qu’en couleur',
		pourquoi_pas_axe:
			'« l’information portée par la couleur seule » n’a aucune règle axe : le ' +
			'critère 1.4.1 est classé non automatisable.'
	},
	{
		regle: 'couleur:notif-sans-marque',
		exigence: 'RG-M18-09, P-7.3',
		eprouve: 'une notification sans `.notif__marque` : son genre ne tiendrait qu’à sa teinte',
		pourquoi_pas_axe:
			'même motif que le témoin : 1.4.1 n’est pas automatisable en général, il ' +
			'l’est sur un composant dont le balisage est fixé.'
	},
	{
		regle: 'etiquette:orpheline',
		exigence: 'RG-M18-08, WCAG 1.3.1',
		eprouve:
			'un <label> sans `for` et sans contrôle imbriqué : il ne nomme rien, et le champ ' +
			"qu'il désigne visuellement reste sans nom accessible",
		pourquoi_pas_axe:
			'« label » et « form-field-multiple-labels » jugent le CHAMP. Un champ nommé ' +
			"autrement — aria-label, titre — les satisfait, et l'étiquette orpheline reste " +
			'invisible à axe.'
	},
	{
		regle: 'etiquette:cible-inexistante',
		exigence: 'RG-M18-08, WCAG 1.3.1',
		eprouve: 'un <label for> qui désigne un identifiant absent du document',
		pourquoi_pas_axe:
			'axe ne le relève que si le champ visé est par ailleurs sans nom accessible ; ' +
			'un `for` mort à côté d’un champ nommé autrement lui échappe.'
	},
	{
		regle: 'arbre:treeitem-sans-aria-selected',
		exigence: 'RG-M18-08, WAI-ARIA 1.1 « treeitem »',
		eprouve:
			'un `treeitem` qui ne porte pas `aria-selected` : son état de sélection reste ' +
			"indéterminé pour une technologie d'assistance",
		pourquoi_pas_axe:
			'axe 4.13 suit ARIA 1.2, où `aria-selected` est SUPPORTÉ et non requis sur ' +
			'`treeitem` : il ne dit rien. LA RÈGLE N’EST PAS INVENTÉE ICI — le compilateur ' +
			'Svelte la pose déjà (`a11y_role_has_required_aria_props`), donc `pnpm check` la ' +
			'pose déjà. Ce que la batterie ajoute est la mesure sur le DOM RENDU : ' +
			'`pnpm check` compte des SITES DE SOURCE, elle compte des NŒUDS.'
	}
];

/**
 * Les CONSTATS — relevés, chiffrés, jamais portés au verdict.
 *
 * Un constat est un fait que la batterie sait mesurer mais qu'aucune règle du
 * dépôt ne rend opposable. Les compter sans les opposer est la seule façon
 * honnête de les traiter : les opposer serait un comblement, les taire serait
 * une couverture annoncée qu'on n'a pas.
 */
export const CATALOGUE_CONSTATS = [
	{
		regle: 'constat:lien-inerte',
		quoi:
			'un lien `href="#"`. ARB-013 les impose au portage — le gel les porte, la vue ' +
			'les reproduit. Ce sont eux que `pnpm check` compte en `a11y_invalid_attribute`.'
	},
	{
		regle: 'constat:focalisable-hors-inventaire',
		quoi:
			"un élément atteint par la tabulation que l'inventaire des interactifs ne prévoyait " +
			'pas. Signale un `tabindex` posé sur un nœud non interactif.'
	},
	{
		regle: 'constat:ordre-visuel-inverse',
		quoi:
			"deux éléments consécutifs du parcours dont la position à l'écran remonte de plus " +
			'de 24 px. HEURISTIQUE : une grille multi-colonnes en produit légitimement. ' +
			"RG-M18-08 demande un « ordre cohérent » ; la cohérence n'est pas décidable " +
			'mécaniquement, ce nombre ne fait que la borner.'
	},
	{
		regle: 'constat:alternative-textuelle',
		quoi:
			"pour les vues nommées par P-06, la présence d'une restitution textuelle candidate " +
			'à côté du graphique — liste, tableau ou groupe de définitions non masqué. La ' +
			"PRÉSENCE est mesurée ; le caractère « exploitable » ne l'est pas."
	}
];

/**
 * Les états où la batterie ne peut PAS trancher, et pourquoi.
 * Réimprimée à chaque exécution avec ses effectifs mesurés.
 */
export const CATALOGUE_INSTRUMENT = [
	{
		regle: 'instrument:axe-indecidable',
		quoi:
			"un résultat `incomplete` d'axe : la règle s'applique, et axe refuse de conclure. " +
			'Le gros du volume est `color-contrast` sur du texte SVG et sur des éléments ' +
			'superposés — c’est-à-dire, précisément, la cartographie et la carte mentale.'
	},
	{
		regle: 'instrument:dom-instable',
		quoi:
			"le document a changé pendant l'audit. L'horloge virtuelle est reprise le temps " +
			"d'exécuter axe — axe s'appuie sur `setTimeout` et ne rend jamais la main sous " +
			'horloge arrêtée — et une minuterie de la maquette a pu se déclencher.'
	},
	{
		regle: 'instrument:parcours-tronque',
		quoi:
			'le parcours au clavier a atteint sa borne sans reboucler : les éléments ' +
			"au-delà n'ont pas été éprouvés."
	},
	{
		regle: 'instrument:etat-inatteignable',
		quoi: "l'état n'a pas pu être atteint d'un côté ou de l'autre : rien n'a été mesuré."
	},
	{
		regle: 'instrument:focus-deja-pose',
		quoi:
			"un élément portait déjà le focus au moment de l'inventaire et n'a pas pu être " +
			'relâché : son empreinte « au repos » est en réalité son empreinte focalisée, ' +
			'et la sonde `focus:invisible` ne peut pas conclure sur lui.'
	},
	{
		regle: 'instrument:restitution-non-mesurable',
		quoi:
			"une superposition modale est ouverte, mais aucun élément témoin n'existe hors " +
			"d'elle pour recevoir le focus : la restitution ne peut pas être éprouvée."
	}
];

/* ═══════════════════════════════════════════════════════════════════════════
   3. CE QUE LA BATTERIE NE COUVRE PAS — ÉNONCÉ, ET MESURÉ
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * L'obligation d'instrument du dépôt, tenue explicitement.
 *
 * Chaque entrée porte une CLÉ DE MESURE : le rapport y accroche un effectif
 * relevé à l'exécution, pour que la non-couverture soit chiffrée et non
 * seulement déclarée. Une entrée sans clé est une non-couverture totale, et
 * elle porte alors son effectif à zéro — ce qui est en soi le chiffre.
 */
export const NON_COUVERTURE = [
	{
		sujet: 'Le jugement humain de WCAG',
		detail:
			"axe-core ne couvre, de son propre aveu, qu'environ 57 % des critères WCAG de " +
			'façon automatique. Tout ce qui demande de comprendre le contenu — pertinence ' +
			"d'un nom accessible, ordre de lecture, sens d'un pictogramme, équivalence d'une " +
			"alternative — reste hors d'atteinte. La batterie ne rend pas un produit " +
			'accessible : elle rend un produit sans défaut mécaniquement détectable.',
		mesure: null
	},
	{
		sujet: 'Le contraste des éléments non textuels (WCAG 1.4.11)',
		detail:
			"RG-M18-07 écrit « tout texte ET tout élément d'interface porteur de sens ». axe " +
			'4.13 ne porte AUCUNE règle sur 1.4.11 : bordures de champs, anneaux de focus, ' +
			'traits de séparation et pictogrammes ne sont mesurés par personne. La moitié de ' +
			"RG-M18-07 n'est donc pas tenue par cette batterie.",
		mesure: null
	},
	{
		sujet: 'Le contraste que axe refuse de trancher',
		detail:
			'`color-contrast` rend `incomplete` sur le texte SVG et sur tout élément dont le ' +
			"fond est recouvert. C'est chiffré ci-dessous, nœud par nœud.",
		mesure: 'axe:color-contrast/incomplete'
	},
	{
		sujet: "L'ordre de tabulation « cohérent » (RG-M18-08)",
		detail:
			'La batterie mesure que le parcours ATTEINT tout ce qui est interactif. Que son ' +
			"ordre soit COHÉRENT avec la lecture visuelle n'est pas décidable : une grille " +
			'multi-colonnes produit des remontées légitimes. Le nombre de remontées est ' +
			'relevé en constat, il ne conclut pas.',
		mesure: 'constat:ordre-visuel-inverse'
	},
	{
		sujet: "Le caractère « exploitable » d'une alternative textuelle (P-06)",
		detail:
			'RG-M18-11 exige une « liste équivalente des nœuds et relations ». ' +
			"L'ÉQUIVALENCE ne se mesure pas : il faudrait comparer deux représentations du " +
			'même fond. La batterie mesure la PRÉSENCE du nom accessible et la présence ' +
			"d'une restitution textuelle candidate. Elle ne dit rien de leur suffisance.",
		mesure: 'constat:alternative-textuelle'
	},
	{
		sujet: 'Les transitions, et tout comportement temporisé',
		detail:
			"Les conditions de capture arrêtent l'horloge et annulent les animations " +
			'(`verif/banc/conditions.mjs`). La batterie juge des ÉTATS, jamais des passages ' +
			"d'un état à l'autre. Un piège de focus qui ne fuirait que pendant une " +
			"transition lui échapperait. C'est la même borne que `docs/dag-phase-1.md` §8 " +
			'pose au banc.',
		mesure: null
	},
	{
		sujet: 'Le clavier au-delà de la tabulation',
		detail:
			"Tab et Échappement sont éprouvés. Les flèches d'un arbre ou d'une liste, " +
			"Origine/Fin, l'activation par Entrée et Espace ne le sont pas : le squelette de " +
			"phase 1 n'a pas de script (ARB-011), il n'y a donc rien à éprouver — et le jour " +
			'où il en aura, cette ligne devra bouger.',
		mesure: null
	},
	{
		sujet: 'Les technologies d’assistance réelles',
		detail:
			"Aucun lecteur d'écran n'est exécuté. L'arbre d'accessibilité est celui de " +
			'Chromium, et les divergences NVDA / JAWS / VoiceOver ne sont pas explorées.',
		mesure: null
	},
	{
		sujet: 'Les états non maquettés',
		detail:
			'La batterie parcourt les 409 couples de `verif/scenarios/`, dérivés des planches ' +
			"du gel. Un état que le gel ne présente pas n'existe pas pour elle. Le survol, " +
			"le focus persistant au clic et les états d'erreur non maquettés en font partie.",
		mesure: 'couverture:couples'
	},
	{
		sujet: 'Le produit construit',
		detail:
			"L'audit passe par le mode démo, qui n'existe qu'en développement " +
			'(`pnpm verif:demo:hors-production`). Ce que le paquet de production sert — ' +
			"hydratation, scripts, en-têtes — n'est pas audité ici.",
		mesure: null
	}
];

/* ═══════════════════════════════════════════════════════════════════════════
   4. LES SONDES POSÉES DANS LA PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Installe `window.__a11y` dans la page.
 *
 * Un seul installateur, appelé une fois par page, plutôt qu'une fonction
 * sérialisée par appel : les aides — signature d'un nœud, visibilité, nom
 * accessible — doivent être RIGOUREUSEMENT les mêmes pour les sondes et pour
 * le rapprochement des nœuds d'axe. Deux définitions jumelles divergeraient au
 * premier oubli, et le classement en trois natures s'appuie sur l'identité des
 * signatures : une divergence y fabriquerait du portage imaginaire.
 *
 * Cette fonction est exécutée DANS LE NAVIGATEUR. Elle ne référence rien de
 * son module.
 */
export function installerSondes() {
	const NATIFS =
		'a[href],area[href],button,input,select,textarea,details,summary,iframe,' +
		'audio[controls],video[controls],[contenteditable=""],[contenteditable="true"]';
	const ROLES_INTERACTIFS =
		'[role="button"],[role="link"],[role="checkbox"],[role="radio"],[role="switch"],' +
		'[role="tab"],[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"],' +
		'[role="option"],[role="treeitem"],[role="combobox"],[role="slider"],[role="spinbutton"],' +
		'[role="textbox"],[role="searchbox"]';
	const GRAPHIQUES = 'svg,canvas,img,object,[role="img"],[role="graphics-document"]';
	/* Les propriétés dont un changement rend le focus VISIBLE. La liste est
	   volontairement large : n'importe laquelle suffit à satisfaire 2.4.7, et
	   une liste étroite fabriquerait des faux positifs sur les mises en évidence
	   qui n'emploient pas d'anneau. */
	const PROPS_FOCUS = [
		'outlineStyle',
		'outlineWidth',
		'outlineColor',
		'outlineOffset',
		'boxShadow',
		'backgroundColor',
		'backgroundImage',
		'borderTopColor',
		'borderRightColor',
		'borderBottomColor',
		'borderLeftColor',
		'borderTopWidth',
		'color',
		'textDecorationLine',
		'textDecorationColor',
		'filter',
		'transform'
	];

	const texte = (n) => (n && n.textContent ? n.textContent.replace(/\s+/g, ' ').trim() : '');

	const styleDe = (e) => window.getComputedStyle(e);

	const visible = (e) => {
		if (!e || !e.isConnected) return false;
		const s = styleDe(e);
		if (s.display === 'none' || s.visibility === 'hidden' || s.visibility === 'collapse') {
			return false;
		}
		if (s.opacity === '0') return false;
		const r = e.getBoundingClientRect();
		return r.width > 0 || r.height > 0;
	};

	const masque = (e) => e.closest('[aria-hidden="true"],[inert],[hidden]') !== null;

	/* LA SIGNATURE D'UN NŒUD — la clé du classement en trois natures.
	   Elle doit être identique pour le même nœud de la maquette et de
	   l'application. Elle ne retient donc QUE ce que le niveau 1 du banc rend
	   déjà identique des deux côtés (structure, rôles, noms accessibles) et
	   ignore tout ce qui peut légitimement différer — commentaires de Svelte,
	   ordre de déclaration des classes, blancs. */
	const signature = (e) => {
		if (!e || e.nodeType !== 1) return '?';
		const classes = [...e.classList].sort().join('.');
		const parents = [];
		for (let p = e.parentElement, n = 0; p && n < 2; p = p.parentElement, n++) {
			parents.push(p.tagName.toLowerCase() + (p.id ? '#' + p.id : ''));
		}
		return [
			e.tagName.toLowerCase(),
			e.id || '',
			classes,
			e.getAttribute('role') || '',
			e.getAttribute('href') || '',
			e.getAttribute('type') || '',
			(e.getAttribute('aria-label') || '').slice(0, 48),
			texte(e).slice(0, 48),
			parents.join('>')
		].join('|');
	};

	/** Nom accessible EXPLICITE — sans le repli sur le contenu textuel. */
	const nomExplicite = (e) => {
		const par = e.getAttribute('aria-labelledby');
		if (par) {
			const n = par
				.split(/\s+/)
				.map((id) => document.getElementById(id))
				.filter(Boolean)
				.map(texte)
				.join(' ')
				.trim();
			if (n) return n;
		}
		const label = e.getAttribute('aria-label');
		if (label && label.trim()) return label.trim();
		const alt = e.getAttribute('alt');
		if (alt !== null && alt.trim()) return alt.trim();
		if (e.tagName.toLowerCase() === 'svg') {
			const t = [...e.children].find((c) => c.tagName.toLowerCase() === 'title');
			if (t && texte(t)) return texte(t);
		}
		const titre = e.getAttribute('title');
		if (titre && titre.trim()) return titre.trim();
		return '';
	};

	/** Nom accessible APPROCHÉ — avec le repli sur le contenu textuel. */
	const nomApproche = (e) => nomExplicite(e) || texte(e);

	const focalisable = (e) => e.hasAttribute('tabindex') || e.matches(NATIFS);

	const interactif = (e) =>
		(e.matches(NATIFS) || e.matches(ROLES_INTERACTIFS) || e.hasAttribute('tabindex')) &&
		!e.hasAttribute('disabled') &&
		e.getAttribute('aria-disabled') !== 'true' &&
		e.tabIndex >= 0;

	const empreinteStyle = (e) => {
		const s = styleDe(e);
		return PROPS_FOCUS.map((p) => s[p]).join('~');
	};

	/** La portée du parcours : le dialogue modal ouvert, ou le document. */
	const porteeCourante = () => {
		const modal = [...document.querySelectorAll('dialog[open]')].find((d) => d.matches(':modal'));
		return modal || document.body;
	};

	const constats = [];
	const ajouter = (regle, e, detail) =>
		constats.push({
			regle,
			signature: e ? signature(e) : '(document)',
			detail: detail || ''
		});

	window.__a11y = {
		signature,
		constats: () => constats,

		/* ── Les sondes de DOM — sans geste, sans effet de bord ───────────── */
		dom() {
			/* S-1 · les liens internes et leurs cibles — RG-M18-08, ÉCART-018. */
			for (const a of document.querySelectorAll('a[href]')) {
				const href = a.getAttribute('href');
				if (!href.startsWith('#')) continue;
				if (!visible(a) || masque(a)) continue;
				const fragment = decodeURIComponent(href.slice(1));
				if (fragment === '') {
					ajouter('constat:lien-inerte', a, href);
					continue;
				}
				const cible =
					document.getElementById(fragment) ||
					document.querySelector(`a[name="${CSS.escape(fragment)}"]`);
				if (!cible) {
					ajouter('saut:cible-inexistante', a, `#${fragment}`);
				} else if (!focalisable(cible)) {
					ajouter(
						'saut:cible-non-focalisable',
						a,
						`#${fragment} → <${cible.tagName.toLowerCase()}> sans tabindex`
					);
				}
			}

			/* S-5 · le contenu graphique — RG-M18-11, P-06. */
			for (const g of document.querySelectorAll(GRAPHIQUES)) {
				if (!visible(g) || masque(g)) continue;
				if (g.getAttribute('role') === 'presentation' || g.getAttribute('role') === 'none') {
					continue;
				}
				if (nomExplicite(g)) continue;
				const hote = g.parentElement
					? g.parentElement.closest(
							'a,button,[role="button"],[role="link"],[tabindex],figure,label'
						)
					: null;
				if (hote && nomApproche(hote)) continue;
				ajouter('graphique:sans-alternative', g, g.tagName.toLowerCase());
			}

			/* S-6 · la forme porte l'information — RG-M18-09, P-7, DESIGN §3.7. */
			for (const t of document.querySelectorAll('.temoin')) {
				if (!visible(t)) continue;
				const jauge = t.querySelector('.temoin__jauge');
				if (!jauge) {
					ajouter('couleur:temoin-sans-jauge', t, '');
				} else {
					if (jauge.getAttribute('aria-hidden') !== 'true') {
						ajouter('couleur:temoin-jauge-annoncee', t, '');
					}
					const barres = jauge.querySelectorAll('i').length;
					if (barres !== 3) ajouter('couleur:temoin-jauge-incomplete', t, `${barres} barre(s)`);
				}
				const libelle = t.querySelector('.temoin__txt');
				if (!libelle || !texte(libelle)) ajouter('couleur:temoin-sans-libelle', t, '');
			}
			for (const n of document.querySelectorAll('.notif')) {
				if (!visible(n)) continue;
				if (!n.querySelector('.notif__marque')) ajouter('couleur:notif-sans-marque', n, '');
			}

			/* S-7 · les étiquettes — WCAG 1.3.1. */
			for (const l of document.querySelectorAll('label')) {
				if (masque(l)) continue;
				const pour = l.getAttribute('for');
				if (pour) {
					if (!document.getElementById(pour)) {
						ajouter('etiquette:cible-inexistante', l, `for="${pour}"`);
					}
				} else if (!l.querySelector('input,select,textarea,button,meter,output,progress')) {
					ajouter('etiquette:orpheline', l, texte(l).slice(0, 40));
				}
			}

			/* S-8 · la cohérence d'`aria-selected` dans un arbre. */
			const arbres = new Map();
			for (const item of document.querySelectorAll('[role="treeitem"]')) {
				if (masque(item)) continue;
				const racine = item.closest('[role="tree"]') || item.closest('svg') || document.body;
				if (!arbres.has(racine)) arbres.set(racine, []);
				arbres.get(racine).push(item);
			}
			for (const [, items] of arbres) {
				for (const i of items) {
					if (!i.hasAttribute('aria-selected')) {
						ajouter('arbre:treeitem-sans-aria-selected', i, nomApproche(i).slice(0, 40));
					}
				}
			}

			return constats.splice(0, constats.length);
		},

		/* ── L'inventaire des interactifs, avant le parcours ──────────────── */
		inventorier() {
			const portee = porteeCourante();
			const attendus = [];
			const candidats = [...portee.querySelectorAll(`${NATIFS},${ROLES_INTERACTIFS},[tabindex]`)];
			if (portee !== document.body && interactif(portee)) candidats.unshift(portee);
			for (const e of candidats) {
				if (!interactif(e) || !visible(e) || masque(e)) continue;
				const rang = attendus.length;
				e.setAttribute('data-a11y-rang', String(rang));
				const r = e.getBoundingClientRect();
				attendus.push({
					rang,
					signature: signature(e),
					repos: empreinteStyle(e),
					/* L'EMPREINTE DE REPOS D'UN ÉLÉMENT DÉJÀ FOCALISÉ N'EST PAS UNE
					   EMPREINTE DE REPOS. Seize états du projet posent une focalisation
					   (ÉCART-029), et `showModal()` en pose une autre : l'élément
					   concerné serait relevé « focus invisible » parce qu'on l'aurait
					   comparé à lui-même. Le parcours relâche le focus AVANT
					   d'inventorier ; ce drapeau attrape ce qui y résiste, et
					   l'orchestration le porte alors en instrument, jamais en défaut. */
					dejaFocalise: e === document.activeElement,
					x: Math.round(r.left),
					y: Math.round(r.top)
				});
			}
			return {
				attendus,
				portee: portee === document.body ? 'document' : 'superposition',
				modal: portee !== document.body
			};
		},

		/** Ce que la tabulation vient d'atteindre. */
		focal() {
			const e = document.activeElement;
			if (!e || e === document.body || e === document.documentElement) return null;
			const rang = e.getAttribute('data-a11y-rang');
			const r = e.getBoundingClientRect();
			return {
				rang: rang === null ? null : Number(rang),
				signature: signature(e),
				focalise: empreinteStyle(e),
				dansPortee: porteeCourante() === document.body || porteeCourante().contains(e),
				x: Math.round(r.left),
				y: Math.round(r.top)
			};
		},

		/** Efface les marques posées par l'inventaire. */
		demarquer() {
			for (const e of document.querySelectorAll('[data-a11y-rang]')) {
				e.removeAttribute('data-a11y-rang');
			}
		},

		/* ── Les superpositions — RG-M18-10 ───────────────────────────────── */
		superpositions() {
			const releve = [];
			for (const d of document.querySelectorAll('dialog[open]')) {
				if (!visible(d)) continue;
				releve.push({
					signature: signature(d),
					natif: true,
					modal: d.matches(':modal'),
					focalisables: d.querySelectorAll(`${NATIFS},[tabindex]`).length
				});
			}
			const SUSPECTS =
				'[role="dialog"]:not(dialog),[role="alertdialog"]:not(dialog),' +
				'[aria-modal="true"]:not(dialog),.voile[data-actif="oui"],.palette[data-ouvert="oui"]';
			for (const v of document.querySelectorAll(SUSPECTS)) {
				if (!visible(v) || masque(v)) continue;
				releve.push({
					signature: signature(v),
					natif: false,
					modal: false,
					focalisables: v.querySelectorAll(`${NATIFS},[tabindex]`).length
				});
			}
			return releve;
		},

		/** Prépare la mesure de la restitution du focus : ferme, focalise un
		 *  témoin, rouvre. Le témoin est le premier interactif du document hors
		 *  de la superposition — s'il n'y en a pas, la propriété n'est pas
		 *  mesurable et la sonde le dit. */
		armerRestitution() {
			const d = [...document.querySelectorAll('dialog[open]')].find((x) => x.matches(':modal'));
			if (!d) return { arme: false, motif: 'aucun dialogue modal ouvert' };
			const temoin = [...document.querySelectorAll(NATIFS)].find(
				(e) => !d.contains(e) && visible(e) && !masque(e) && e.tabIndex >= 0
			);
			if (!temoin) return { arme: false, motif: 'aucun élément témoin hors de la superposition' };
			d.close();
			temoin.focus();
			const pris = document.activeElement === temoin;
			d.showModal();
			window.__a11yTemoin = temoin;
			return { arme: pris, motif: pris ? '' : 'le témoin n’a pas pris le focus' };
		},

		/** Après Échappement : la superposition est-elle fermée, le focus rendu ? */
		constaterRestitution() {
			const encoreOuverts = [...document.querySelectorAll('dialog[open]')].filter((d) =>
				d.matches(':modal')
			);
			const temoin = window.__a11yTemoin;
			return {
				ferme: encoreOuverts.length === 0,
				rendu: Boolean(temoin) && document.activeElement === temoin,
				actif: document.activeElement ? signature(document.activeElement) : '(body)'
			};
		},

		/* ── P-06 : la restitution textuelle candidate ────────────────────── */
		alternativeTextuelle() {
			const graphiques = [...document.querySelectorAll('svg,canvas')].filter(
				(g) => visible(g) && !masque(g) && g.getBoundingClientRect().width >= 240
			);
			return graphiques.map((g) => {
				const conteneur = g.closest('main,section,figure,div') || document.body;
				const restitution = conteneur.querySelector(
					'table:not([aria-hidden="true"]),dl:not([aria-hidden="true"]),' +
						'ul:not([aria-hidden="true"]),ol:not([aria-hidden="true"])'
				);
				return {
					signature: signature(g),
					nom: nomExplicite(g),
					restitution: restitution ? signature(restitution) : ''
				};
			});
		},

		/** L'empreinte du document, pour constater qu'il n'a pas bougé. */
		empreinteDocument() {
			const h = document.documentElement.outerHTML;
			let a = 0;
			for (let i = 0; i < h.length; i++) a = (a * 31 + h.charCodeAt(i)) >>> 0;
			return `${h.length}:${a}`;
		},

		relacherFocus() {
			if (document.activeElement && document.activeElement !== document.body) {
				document.activeElement.blur();
			}
		},

		/** Rapproche les nœuds d'axe de leur signature, par leur sélecteur. */
		signaturesDe(selecteurs) {
			return selecteurs.map((s) => {
				try {
					const e = document.querySelector(s);
					return e ? signature(e) : `(introuvable)${s}`;
				} catch {
					return `(illisible)${s}`;
				}
			});
		}
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. LE CLASSEMENT — PUR, DONC FIGEABLE PAR UN UNITAIRE
   ═══════════════════════════════════════════════════════════════════════════ */

/** La clé de rapprochement d'un constat entre les deux côtés. */
export function cleDe(constat) {
	return `${constat.regle}\u0000${constat.signature}`;
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
 * Le classement en natures d'un couple.
 *
 * @param {{regle: string, signature: string, detail?: string}[]} gel
 * @param {{regle: string, signature: string, detail?: string}[]} app
 * @param {{portee_document?: string[]}} [options]
 * @returns {{regle: string, signature: string, detail: string, nature: string,
 *            occurrences: number}[]}
 */
export function classer(gel, app, options = {}) {
	const document_ = new Set(options.portee_document ?? PORTEE_DOCUMENT);
	const cotesGel = compter(gel);
	const cotesApp = compter(app);
	const sortie = [];
	const vues = new Set([...cotesGel.keys(), ...cotesApp.keys()]);

	for (const cle of vues) {
		const g = cotesGel.get(cle);
		const a = cotesApp.get(cle);
		const modele = a ?? g;
		const nGel = g ? g.occurrences : 0;
		const nApp = a ? a.occurrences : 0;
		const commun = Math.min(nGel, nApp);
		const regleNue = modele.regle.startsWith('axe:') ? modele.regle.slice(4) : modele.regle;

		if (commun > 0) {
			sortie.push({ ...modele, nature: 'gel', occurrences: commun });
		}
		if (nApp > commun) {
			/* Une règle de portée document échouant côté application ne dit rien
			   de la vue : le mode démo compose le document. Requalifiée. */
			sortie.push({
				...a,
				nature: document_.has(regleNue) ? 'instrument' : 'portage',
				occurrences: nApp - commun,
				...(document_.has(regleNue) ? { requalifie: 'portee-document' } : {})
			});
		}
		if (nGel > commun) {
			sortie.push({ ...g, nature: 'gel-non-reporte', occurrences: nGel - commun });
		}
	}

	sortie.sort((x, y) => (x.regle === y.regle ? 0 : x.regle < y.regle ? -1 : 1));
	return sortie;
}

/** Les natures qui font échouer la batterie, et celles qui ne font que compter. */
export const NATURES_OPPOSABLES = ['portage', 'gel'];
export const NATURES_RELEVEES = ['gel-non-reporte', 'instrument'];

/** Vrai si la règle est un simple constat, jamais opposable. */
export function estConstat(regle) {
	return regle.startsWith('constat:');
}

/** Vrai si la règle relève de l'instrument. */
export function estInstrument(regle) {
	return regle.startsWith('instrument:');
}

/**
 * Agrège une liste de constats classés en un décompte par nature.
 * Les constats et les lignes d'instrument sont comptés à part : ils ne
 * participent jamais au verdict.
 */
export function agreger(lignes) {
	const total = {
		portage: 0,
		gel: 0,
		'gel-non-reporte': 0,
		instrument: 0,
		constat: 0,
		// `--cote=app` et `--cote=gel` ne classent rien : leurs lignes atterrissent
		// ici plutôt que d'incrémenter une clé inexistante — un NaN silencieux
		// dans un tableau de chiffres est le pire des rapports.
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

/**
 * Le verdict d'un couple : conforme, ou la nature la plus grave rencontrée.
 * L'ordre est celui de l'action : le portage se corrige dans un lot, le gel
 * demande un arbitrage, le reste ne bloque pas.
 */
export function verdictDuCouple(total) {
	if (total.portage > 0) return 'portage';
	if (total.gel > 0) return 'gel';
	return 'conforme';
}

/**
 * Compare un relevé au seuil arbitré, s'il en existe un.
 *
 * LE SEUIL NE PARDONNE QUE CE QU'IL NOMME. Il porte un compte par règle et par
 * nature ; un dépassement, fût-il d'une unité, est un échec. Une règle absente
 * du seuil vaut zéro. C'est la seule forme de seuil qui ne dérive pas :
 * un seuil global se remplirait de dettes nouvelles sans que rien ne le dise.
 *
 * @param {{regle: string, nature: string, occurrences: number}[]} lignes
 * @param {{admis: Record<string, number>} | null} seuil
 */
export function confronterAuSeuil(lignes, seuil) {
	const mesure = new Map();
	for (const l of lignes) {
		if (estConstat(l.regle) || estInstrument(l.regle)) continue;
		if (!NATURES_OPPOSABLES.includes(l.nature)) continue;
		const k = `${l.nature}/${l.regle}`;
		mesure.set(k, (mesure.get(k) ?? 0) + l.occurrences);
	}
	const admis = seuil?.admis ?? {};
	const depassements = [];
	for (const [k, n] of [...mesure].sort()) {
		const permis = admis[k] ?? 0;
		if (n > permis) depassements.push({ cle: k, mesure: n, admis: permis, exces: n - permis });
	}
	const retombees = [];
	for (const [k, permis] of Object.entries(admis).sort()) {
		const n = mesure.get(k) ?? 0;
		if (n < permis) retombees.push({ cle: k, mesure: n, admis: permis });
	}
	return {
		mesure: Object.fromEntries([...mesure].sort()),
		depassements,
		retombees,
		tenu: depassements.length === 0
	};
}
