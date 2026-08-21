<script lang="ts">
	/**
	 * V-29 — Console · Types de fiches.
	 * Route `/console/types-de-fiches` (`docs/routes.md` §3.6).
	 *
	 * COQUILLE DE FORME ABRÉGÉE, ENVELOPPE `console` — vérifié sur le gel par
	 * `node verif/releve-vues.mjs --formes` : V-29 partage la signature
	 * barre/rail des 26 vues abrégées (ARB-021, A-1). L'enveloppe et le nœud qui
	 * précède `<main>` viennent d'ARB-023 : `classeEnveloppe="console"`,
	 * `avantContenu` rendant `aside.nav2`, `classeContenu="travail"`,
	 * `idContenu="travail"`.
	 *
	 * CE QUI EST COMMUN, ET CE QUI NE L'EST PAS. `src/lib/console/` porte les
	 * treize classes que le relevé mesure sur les dix vues de console
	 * (`sections.ts`, en-tête). Tout le reste de cette vue lui est propre :
	 * `tg--fiches` est un modificateur de grille de vue, et les classes du
	 * constructeur de propriétés — `props`, `prop-l`, `prop-tete`, `prop-corps`,
	 * `prop-duo`, `rang`, `icones`, `avert-schema`, `apercu-schema`, `as-*` —
	 * n'apparaissent qu'ici. AUCUNE FACTORISATION AU-DELÀ : `docs/DESIGN.md`
	 * §2.H recense 66 homonymes à définitions divergentes, et `.selecteur` en
	 * fait partie — dix déclarations, cinq corps distincts, dont celui de V-29
	 * (`docs/releve-vues.md` §7.3).
	 *
	 * LE PANNEAU `tiroir-form` NE PÈSE AUCUN PIXEL, ET C'EST LE GEL. Il vit hors
	 * de `div.app` — la superposition d'ARB-021, A-4 — et la seule règle qui
	 * l'ouvre, `.app[data-form="ouvert"] .tiroir-form` (`V-29.css:401`), ne peut
	 * pas l'atteindre. Il reste donc hors fenêtre, quel que soit `data-form`.
	 * Le NIVEAU 1 en est le seul juge : `position: fixed` le laisse dans l'ordre
	 * de tabulation et dans l'instantané ARIA. Il est rendu exactement — contenu,
	 * noms accessibles, ordre — et « réparer » le sélecteur rendrait six vues
	 * rouges (`CLAUDE.md` §6, P-3).
	 *
	 * AUCUN `autofocus`. La maquette focalise `#f-nom` à l'ouverture du panneau
	 * (`V-29:3363`), mais hors dialogue le focus ne survit pas à `stabiliser()`,
	 * qui floute l'élément actif au chargement (`CLAUDE.md` §6, P-4). Le poser
	 * serait un attribut sans effet, cherché ensuite ailleurs. Dans le dialogue
	 * de suppression, `showModal()` — établi par le banc (ARB-017) — focalise
	 * déjà le premier focalisable, qui est `button.dlg__fermer` : rien à
	 * déclarer non plus.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : le nombre de propriétés vient de
	 * `TYPES_FICHE`, le nombre de notes concernées du corpus de la vue, les
	 * compteurs de la navigation secondaire de `sections.ts`.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011) : le squelette rend l'état,
	 * jamais la transition.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog#palette`
	 * FERMÉ — un dialogue fermé ne porte aucune boîte de rendu et n'entre pas
	 * dans l'instantané ARIA (`docs/releve-vues.md` §4.1) —, et `div.planche`,
	 * bloc hors produit (§2.G), qui ne se porte jamais.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-29.css`, posé par `node verif/feuilles-de-vue.mjs V-29
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import NavigationConsole from '$lib/console/NavigationConsole.svelte';
	import Pictogramme from '$lib/console/Pictogramme.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { filDeConsole, type TraitDePictogramme } from '$lib/console/sections';
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		TYPES_FICHE,
		UNIVERS,
		type ChampDeFiche,
		type Domaine,
		type EtatDInstance,
		type Note,
		type TypeDeFiche,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import { motFicheMinuscule, motFichePlurielMinuscule } from '$lib/vocabulaire';
	import type { RefusDeSaisie, SaisieDeTypeDeFiche } from '$lib/console/structure';

	interface Proprietes {
		/** Le vecteur complet de l'état — formulaire × suppression. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-29')`. */
		notes: readonly Note[];
		/** Les univers déclarés. Absente, la constante du jeu de semence s'applique. */
		univers?: readonly Univers[];
		/** Les domaines déclarés. Absente, la constante du jeu de semence s'applique. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Absente, la constante du jeu de semence s'applique. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, la constante du jeu de semence s'applique. */
		instance?: EtatDInstance;
		/** Les types de fiche et leurs champs. Absente, la constante du jeu. */
		typesFiche?: Record<TypeDeFiche, readonly ChampDeFiche[]>;
		/**
		 * CE QUE LA VUE FAIT QUAND LA SUPPRESSION EST CONFIRMÉE. Même partage qu'en
		 * `V-27` et `V-28` : la vue tient l'état de son dialogue, la page tient le
		 * réseau. Le décompte des notes concernées se calcule sur ce qu'elle a reçu.
		 */
		onSupprimer?: (type: string) => void;
		/**
		 * LA SORTIE PROPOSÉE PAR LE REFUS — « Délester ces N notes ». Le gel y
		 * attache un geste (`V-29:3465`) et `P-03` interdit qu'il soit inerte.
		 */
		onDelester?: (type: string) => void;
		/**
		 * CE QUE LA VUE FAIT QUAND LE PANNEAU EST VALIDÉ — création puis
		 * enregistrement. La vue tient l'état du constructeur de propriétés —
		 * lesquelles, dans quel ordre, dépliées ou non — parce que c'est ce que
		 * `edite.props` tenait au gel (`V-29:3330`), et elle ne connaît ni route,
		 * ni action, ni réseau.
		 */
		onCreer?: (saisie: SaisieDeTypeDeFiche) => void;
		onEnregistrer?: (nom: string, saisie: SaisieDeTypeDeFiche) => void;
		/** Le refus rendu par l'action, rattaché à son champ (`#erreur-nom`). */
		refus?: RefusDeSaisie | null;
	}

	const {
		vecteur,
		notes: corpus,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		typesFiche = TYPES_FICHE,
		onSupprimer,
		onDelester,
		onCreer,
		onEnregistrer,
		refus = null
	}: Proprietes = $props();

	/* ── Les huit types de valeur du gel (`V-29:2909`) ─────────────────────
	   `faux` est le texte du faux champ de l'aperçu ; « Oui ou non » n'en a
	   pas et rend un interrupteur. */
	type CleDeTypeDeValeur =
		'texte' | 'textelong' | 'nombre' | 'date' | 'booleen' | 'liste' | 'lien' | 'courriel';

	const TYPES_VALEUR: readonly { cle: CleDeTypeDeValeur; nom: string; faux: string | null }[] = [
		{ cle: 'texte', nom: 'Texte court', faux: 'Saisie sur une ligne' },
		{ cle: 'textelong', nom: 'Texte long', faux: 'Saisie sur plusieurs lignes' },
		{ cle: 'nombre', nom: 'Nombre', faux: '0' },
		{ cle: 'date', nom: 'Date', faux: 'jj/mm/aaaa' },
		{ cle: 'booleen', nom: 'Oui ou non', faux: null },
		{ cle: 'liste', nom: 'Liste de valeurs', faux: '—' },
		{ cle: 'lien', nom: 'Lien web', faux: 'https://…' },
		{ cle: 'courriel', nom: 'Adresse électronique', faux: 'nom@exemple.fr' }
	];

	/* ── Les six pictogrammes de type, décomposés du gel (`V-29:2919`) ─────
	   Ce sont des fragments SVG littéraux dans la maquette ; ils sont ici des
	   primitives typées, pour la raison écrite à `sections.ts`. */
	const TRAITS_SERVEUR: readonly TraitDePictogramme[] = [
		{ forme: 'rect', x: '3', y: '4', largeur: '18', hauteur: '6', rx: '1.5' },
		{ forme: 'rect', x: '3', y: '14', largeur: '18', hauteur: '6', rx: '1.5' },
		{ forme: 'path', d: 'M6.5 7h.01M6.5 17h.01' }
	];

	const ICONES: readonly { cle: string; traits: readonly TraitDePictogramme[] }[] = [
		{ cle: 'serveur', traits: TRAITS_SERVEUR },
		{
			cle: 'appli',
			traits: [
				{ forme: 'rect', x: '3', y: '3', largeur: '18', hauteur: '18', rx: '3' },
				{ forme: 'path', d: 'M8 9h8M8 13h5' }
			]
		},
		{
			cle: 'contact',
			traits: [
				{ forme: 'circle', cx: '12', cy: '8', r: '3.4' },
				{ forme: 'path', d: 'M5 20a7 7 0 0 1 14 0' }
			]
		},
		{
			cle: 'reseau',
			traits: [
				{ forme: 'circle', cx: '12', cy: '5', r: '2.4' },
				{ forme: 'circle', cx: '5', cy: '19', r: '2.4' },
				{ forme: 'circle', cx: '19', cy: '19', r: '2.4' },
				{ forme: 'path', d: 'M12 7.4v4.6M12 12l-5.6 4.8M12 12l5.6 4.8' }
			]
		},
		{
			cle: 'contrat',
			traits: [
				{ forme: 'path', d: 'M6 2.5h8l4 4V21a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 21z' },
				{ forme: 'path', d: 'M14 2.5v4h4M9 12h6M9 16h4' }
			]
		},
		{
			cle: 'lieu',
			traits: [
				{ forme: 'path', d: 'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z' },
				{ forme: 'circle', cx: '12', cy: '10', r: '2.6' }
			]
		}
	];

	/**
	 * L'ASTÉRISQUE DES PROPRIÉTÉS OBLIGATOIRES, ESPACE COMPRIS.
	 * Le gel écrit `o.textContent = " *"` (`V-29:3060`, `V-29:3252`) : l'espace
	 * appartient au contenu du `<span>`, pas au balisage qui l'entoure. Écrit
	 * en toutes lettres dans le gabarit, Svelte le taillerait — le nom
	 * accessible deviendrait « Nom d'hôte* », et le niveau 1 le voit.
	 */
	const MARQUE_OBLIGATOIRE = ' *';

	/** Les traits d'une icône. À défaut, ceux de « serveur » — le repli du gel. */
	function traitsDIcone(cle: string): readonly TraitDePictogramme[] {
		return ICONES.find((i) => i.cle === cle)?.traits ?? TRAITS_SERVEUR;
	}

	/**
	 * LES TROIS ATTRIBUTS QUE LE CORPUS NE PORTE PAS — description, icône,
	 * caractère obligatoire — sont ceux du gel, recopiés depuis lui
	 * (`V-29:2929`, `V-29:2927`, `V-29:2945`). `seeds/corpus.ts` décrit le
	 * SCHÉMA d'un type de fiche, pas sa présentation dans la console : les
	 * dériver serait inventer une définition que rien ne porte.
	 */
	const ICONE_PAR_TYPE: Record<string, string> = {
		Serveur: 'serveur',
		Application: 'appli',
		Contact: 'contact'
	};
	const DESCRIPTIONS: Record<string, string> = {
		Serveur:
			"Machine physique ou virtuelle exploitée par l'équipe. Devient un nœud de la cartographie.",
		Application: 'Logiciel en service pour le métier, avec ses contacts et sa criticité.',
		Contact: 'Interlocuteur externe : prestataire, éditeur, opérateur.'
	};
	const PROPRIETES_OBLIGATOIRES: readonly string[] = ['hote', 'organisme'];

	interface ProprieteDeType {
		readonly cle: string;
		readonly libelle: string;
		readonly type: CleDeTypeDeValeur;
		readonly obligatoire: boolean;
		readonly defaut: string;
		readonly aide: string;
		readonly valeurs: readonly string[];
	}

	interface TypeDeFicheRendu {
		readonly nom: string;
		readonly description: string;
		readonly icone: string;
		readonly props: readonly ProprieteDeType[];
	}

	function typeDeValeur(champ: ChampDeFiche): CleDeTypeDeValeur {
		if (champ.type === 'interrupteur') return 'booleen';
		if (champ.type === 'liste') return 'liste';
		if (champ.type === 'nombre') return 'nombre';
		return 'texte';
	}

	const types: readonly TypeDeFicheRendu[] = $derived(
		(Object.keys(typesFiche) as readonly TypeDeFiche[]).map((nom) => ({
			nom,
			description: DESCRIPTIONS[nom] ?? '',
			icone: ICONE_PAR_TYPE[nom] ?? 'serveur',
			props: typesFiche[nom].map((p) => ({
				cle: p.cle,
				libelle: p.nom,
				type: typeDeValeur(p),
				obligatoire: PROPRIETES_OBLIGATOIRES.includes(p.cle),
				defaut: '',
				aide: '',
				valeurs: [...(p.valeurs ?? [])]
			}))
		}))
	);

	/** Les notes qui portent ce type de fiche — calculé, jamais écrit. */
	function utilisation(nom: string): readonly Note[] {
		return corpus.filter((n) => n.typeFiche === nom);
	}

	function nomDuType(cle: CleDeTypeDeValeur): string {
		return TYPES_VALEUR.find((t) => t.cle === cle)?.nom ?? '';
	}

	/** Le faux champ de l'aperçu — défaut saisi, première valeur de liste, ou exemple du type. */
	function fauxChamp(p: ProprieteDeType): string {
		if (p.defaut) return p.defaut;
		if (p.type === 'liste') return p.valeurs[0] ?? '—';
		return TYPES_VALEUR.find((t) => t.cle === p.type)?.faux ?? '';
	}

	/* ── L'état, tel que le vecteur de planche le décrit ───────────────────
	   Le panneau et le dialogue ne s'ouvrent que si la position DÉVIE du
	   réglage par défaut : la maquette ne les ouvre que sur l'événement
	   `change` que le banc répartit, jamais au chargement (`V-29:3498`). */
	const reglage = $derived(vecteur ?? {});
	const form = $derived(String(reglage['form'] ?? 'ferme'));
	const sup = $derived(String(reglage['sup'] ?? 'refus'));
	const enEdition = $derived(form === 'edition');

	/**
	 * LE PANNEAU S'OUVRE, ET C'EST LA VUE QUI LE TIENT — même arbitrage que pour
	 * le dialogue de suppression : `ouverture` vaut `null` tant que personne n'a
	 * cliqué, si bien que l'écran rendu est celui que le vecteur décrit.
	 */
	let ouverture = $state<'creation' | 'edition' | null>(null);
	let cible = $state<string | null>(null);

	/** Les trois champs de tête, et le constructeur de propriétés. */
	let fNom = $state('');
	let fDescription = $state('');
	let fIcone = $state('serveur');
	let fProps = $state<readonly ProprieteDeType[]>([]);
	/**
	 * LES PROPRIÉTÉS DÉPLIÉES, PAR LEUR CLÉ. Le gel porte l'état sur l'objet
	 * (`p.ouvert`, `V-29:3372`) ; il est tenu à part ici parce que
	 * `ProprieteDeType` décrit le SCHÉMA, pas l'état de son tiroir — et parce
	 * qu'une propriété du gel n'en porte pas au repos.
	 */
	let deplies = $state<readonly string[]>([]);
	/** Le message de `#erreur-nom`, quand la validation de l'écran refuse. */
	let erreurLocale = $state<string | null>(null);
	/**
	 * LE PANNEAU EST OUVERT SI UN GESTE L'A OUVERT, OU SI LE VECTEUR LE DEMANDE.
	 *
	 * C'est cette valeur qui pose `data-form` sur `div.app`, et c'est elle que la
	 * règle gelée `.app[data-form="ouvert"] ~ .tiroir-form` attend pour lever
	 * `translateX(100%)`. La rédaction précédente ne lisait que le vecteur : le
	 * bouton « + » pouvait bien changer d'état, le panneau restait hors fenêtre.
	 *
	 * ELLE EST DÉCLARÉE APRÈS `ouverture`, ET CE N'EST PAS UN DÉTAIL DE STYLE.
	 * Au rendu SERVEUR, `$derived` est évalué à la ligne où il est écrit : placée
	 * plus haut, cette dérivation lisait une variable encore en zone morte et les
	 * quatre écrans sortaient en 500.
	 */
	const panneauOuvert = $derived(ouverture !== null || form !== 'ferme');

	/** Le type édité par la position « Édition · Serveur » (`V-29:3502`). */
	const edite = $derived(
		ouverture === 'creation'
			? null
			: ouverture === 'edition'
				? (types.find((t) => t.nom === cible) ?? null)
				: enEdition
					? (types.find((t) => t.nom === 'Serveur') ?? null)
					: null
	);
	const notesEditees = $derived(edite ? utilisation(edite.nom) : []);
	const propsEditees = $derived<readonly ProprieteDeType[]>(
		ouverture !== null ? fProps : edite ? edite.props : []
	);
	const nomSaisi = $derived(ouverture !== null ? fNom : edite ? edite.nom : '');
	const descriptionSaisie = $derived(
		ouverture !== null ? fDescription : edite ? edite.description : ''
	);
	const iconeChoisie = $derived(ouverture !== null ? fIcone : edite ? edite.icone : 'serveur');
	/** Le message de `#erreur-nom` : celui de l'écran, ou celui de l'action. */
	const erreurNom = $derived(
		erreurLocale ?? (refus !== null && refus.champ === 'nom' ? refus.message : null)
	);

	/** `ouvrirForm(t)` — `null` pour une création (`V-29:3330`). */
	function ouvrirForm(t: TypeDeFicheRendu | null): void {
		ouverture = t === null ? 'creation' : 'edition';
		cible = t === null ? null : t.nom;
		fNom = t === null ? '' : t.nom;
		fDescription = t === null ? '' : t.description;
		fIcone = t === null ? 'serveur' : t.icone;
		fProps = t === null ? [] : t.props.map((p) => ({ ...p }));
		deplies = [];
		erreurLocale = null;
	}

	/** `fermerForm()` — le panneau se referme, la saisie ne survit pas. */
	function fermerForm(): void {
		ouverture = null;
		cible = null;
		deplies = [];
		erreurLocale = null;
	}

	/** Remplacer une propriété en place, par son rang — le geste des six champs. */
	function changerLaPropriete(rang: number, changements: Partial<ProprieteDeType>): void {
		fProps = fProps.map((p, k) => (k === rang ? { ...p, ...changements } : p));
	}

	/**
	 * LA CLÉ TECHNIQUE EST UNIQUE, ET LA BASE L'EXIGE :
	 * `champs_cle_par_type_unique` porte sur `(type, clé)`. Le gel numérote
	 * « propriete_N » sur la longueur de la liste, ce qui redonne une clé déjà
	 * prise dès qu'on en a retiré une : la numérotation cherche donc la première
	 * place libre.
	 */
	function cleLibre(): string {
		const prises = new Set(fProps.map((p) => p.cle));
		for (let k = fProps.length + 1; ; k += 1) {
			const candidate = `propriete_${k}`;
			if (!prises.has(candidate)) return candidate;
		}
	}

	/** `ajouter-prop` — la propriété naît dépliée (`V-29:3372`). */
	function ajouterUnePropriete(): void {
		const cle = cleLibre();
		fProps = [
			...fProps,
			{
				cle,
				libelle: 'Nouvelle propriété',
				type: 'texte',
				obligatoire: false,
				defaut: '',
				aide: '',
				valeurs: []
			}
		];
		deplies = [...deplies, cle];
	}

	function retirerLaPropriete(rang: number): void {
		fProps = fProps.filter((_, k) => k !== rang);
	}

	/** Les flèches du constructeur : un rang, une place. */
	function deplacerLaPropriete(rang: number, vers: number): void {
		if (vers < 0 || vers >= fProps.length) return;
		const restantes = fProps.filter((_, k) => k !== rang);
		const deplacee = fProps[rang];
		if (deplacee === undefined) return;
		fProps = [...restantes.slice(0, vers), deplacee, ...restantes.slice(vers)];
	}

	function basculerLeDepli(cle: string): void {
		deplies = deplies.includes(cle) ? deplies.filter((c) => c !== cle) : [...deplies, cle];
	}

	function changerLaValeur(rang: number, rangValeur: number, valeur: string): void {
		const propriete = fProps[rang];
		if (propriete === undefined) return;
		changerLaPropriete(rang, {
			valeurs: propriete.valeurs.map((v, k) => (k === rangValeur ? valeur : v))
		});
	}

	function retirerLaValeur(rang: number, rangValeur: number): void {
		const propriete = fProps[rang];
		if (propriete === undefined) return;
		changerLaPropriete(rang, { valeurs: propriete.valeurs.filter((_, k) => k !== rangValeur) });
	}

	function ajouterUneValeur(rang: number): void {
		const propriete = fProps[rang];
		if (propriete === undefined) return;
		changerLaPropriete(rang, { valeurs: [...propriete.valeurs, ''] });
	}

	/**
	 * `form-valider` — LA VALIDATION DE L'ÉCRAN, celle du gel (`V-29:3387`) : nom
	 * vide ou doublon insensible à la casse. `creerUnTypeDeFiche()` refuse quoi
	 * qu'il arrive, avec les mêmes messages ; ceci n'en est que le reflet.
	 */
	function validerLeForm(): void {
		const nom = fNom.trim();
		const doublon = types.some((t) => t.nom !== cible && t.nom.toLowerCase() === nom.toLowerCase());
		if (nom === '' || doublon) {
			erreurLocale = nom === '' ? 'Donnez un nom au type.' : `« ${nom} » existe déjà.`;
			return;
		}
		erreurLocale = null;
		const saisie: SaisieDeTypeDeFiche = {
			nom,
			proprietes: fProps.map((p) => ({
				cle: p.cle,
				nom: p.libelle,
				type: p.type,
				valeurs: p.valeurs
			}))
		};
		if (ouverture === 'edition' && cible !== null) onEnregistrer?.(cible, saisie);
		else onCreer?.(saisie);
		fermerForm();
	}

	/**
	 * Les propriétés rendues obligatoires par rapport au schéma en vigueur
	 * (`V-29:3280`). `TYPES_FICHE` ne porte pas de caractère obligatoire :
	 * toute propriété obligatoire du panneau est donc une nouveauté, et le gel
	 * en tire la seule puce affichée.
	 */
	const nouvellesObligations = $derived(propsEditees.filter((p) => p.obligatoire));
	const schemaUtilise = $derived(edite !== null && notesEditees.length > 0);

	/**
	 * LE TYPE PROPOSÉ À LA SUPPRESSION, ET CE QUE LE GEL EN FAIT VRAIMENT.
	 * La position se nomme « Possible · type inutilisé », mais le gel cherche
	 * un type sans note ET RETOMBE SUR LE DERNIER quand il n'y en a pas
	 * (`V-29:3507`). Les trois types du corpus étant tous employés, la boîte
	 * montre le REFUS sur « Contact ». C'est le gel ; le corriger serait
	 * inventer un état que la maquette ne montre pas.
	 */
	/**
	 * LE TYPE DONT LA SUPPRESSION EST EXAMINÉE. `null` au rendu serveur : l'écran
	 * reste celui que le vecteur décrit tant que personne n'a cliqué.
	 */
	let demande = $state<string | null>(null);

	const aSupprimer = $derived(
		demande !== null
			? (types.find((t) => t.nom === demande) ?? null)
			: sup === 'refus'
				? null
				: (types.find((t) => utilisation(t.nom).length === 0) ?? types[types.length - 1] ?? null)
	);
	const notesASupprimer = $derived(aSupprimer ? utilisation(aSupprimer.nom) : []);
	const dialogueOuvert = $derived(aSupprimer !== null);

	/** `showModal()` — voir `V-28.svelte` : l'attribut `open` n'obtient pas la modalité. */
	$effect(() => {
		const boite = document.getElementById('dlg-supprimer');
		if (!(boite instanceof HTMLDialogElement)) return;
		if (!dialogueOuvert) {
			if (boite.open) boite.close();
			return;
		}
		if (!boite.open) boite.showModal();
	});
</script>

<Coquille
	forme="abregee"
	role="admin"
	classeEnveloppe="console"
	classeContenu="travail"
	idContenu="travail"
	fil={filDeConsole(`Types de ${motFichePlurielMinuscule}`)}
	donnees={{ 'data-form': panneauOuvert ? 'ouvert' : 'ferme' }}
	{univers}
	{domaines}
	notes={corpus}
	compte={{
		nom: compte.nom,
		initiales: compte.initiales,
		role: compte.role,
		domaine: compte.domaine
	}}
	version={instance.version}
>
	{#snippet avantContenu()}
		<NavigationConsole courante="fiches" />
	{/snippet}

	{#snippet enfants()}
		<TeteDeSection
			titre={`Types de ${motFichePlurielMinuscule}`}
			description={`Les schémas de propriétés structurées. Un type de ${motFicheMinuscule} transforme une note en objet exploitable : un serveur porte une adresse et une criticité, et devient un nœud de la cartographie.`}
		>
			{#snippet action()}
				<BoutonDeCreation libelle="Nouveau type" onCliquer={() => ouvrirForm(null)} />
			{/snippet}
		</TeteDeSection>

		<div class="tableau-gestion">
			<div class="tg tg--fiches tg--entetes" role="row">
				<span></span>
				<span>Nom et description</span>
				<span class="tg--masquable">Propriétés</span>
				<span class="tg--masquable">Notes concernées</span>
				<span></span>
			</div>
			<div id="liste">
				{#each types as t (t.nom)}
					{@const notes = utilisation(t.nom)}
					<div class="tg tg--fiches tg--ligne">
						<span
							style="width:32px;height:32px;border-radius:var(--r-2);display:grid;place-items:center;background:var(--c-fond-creux);color:var(--c-encre-2)"
							><Pictogramme
								traits={traitsDIcone(t.icone)}
								taille="18"
								boite="0 0 24 24"
								epaisseur="1.5"
							/></span
						>
						<div style="min-width:0">
							<div class="tg__nom">{t.nom}</div>
							<div class="tg__desc">{t.description}</div>
						</div>
						<span class="tg__n tg--masquable"
							>{t.props.length}
							{t.props.length > 1 ? 'propriétés' : 'propriété'}</span
						>
						<span
							class="tg__n tg--masquable"
							style={notes.length ? undefined : 'color:var(--c-encre-4)'}
							>{notes.length} {notes.length > 1 ? 'notes' : 'note'}</span
						>
						<div class="tg__actions">
							<button class="btn" type="button" onclick={() => ouvrirForm(t)}>Modifier</button>
							<button
								class="btn btn--destructif"
								type="button"
								aria-label="Supprimer le type {t.nom}"
								onclick={() => (demande = t.nom)}
								><svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"
									><path
										d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"
									/></svg
								></button
							>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/snippet}

	{#snippet superposition()}
		<aside class="tiroir-form" id="tiroir" aria-label="Formulaire de type de {motFicheMinuscule}">
			<div class="tiroir-form__tete">
				<div style="min-width:0">
					<h2 class="tiroir-form__titre" id="form-titre">
						{edite ? edite.nom : `Nouveau type de ${motFicheMinuscule}`}
					</h2>
					<div class="tiroir-form__sous" id="form-sous">
						{#if edite}{notesEditees.length} notes utilisent déjà ce schéma.{:else}Définissez les
							propriétés que porteront les notes de ce type.{/if}
					</div>
				</div>
				<button
					class="tiroir-form__fermer"
					id="form-fermer"
					aria-label="Fermer le formulaire"
					onclick={fermerForm}
				>
					<svg
						width="17"
						height="17"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
					>
				</button>
			</div>

			<div class="tiroir-form__corps">
				<div
					class="avert-schema"
					id="avert-schema"
					data-actif={panneauOuvert ? (schemaUtilise ? 'oui' : 'non') : undefined}
				>
					{#if schemaUtilise}<div style="font-weight:var(--g-fort)">
							Ce schéma est utilisé par {notesEditees.length}
							{notesEditees.length > 1 ? 'notes' : 'note'}
						</div>
						<ul>
							{#if nouvellesObligations.length}<li>
									Propriétés rendues obligatoires : les notes existantes qui n'ont pas de valeur ne
									seront pas bloquées, mais la valeur sera demandée à la prochaine modification.
								</li>{:else}<li>
									Les modifications d'ordre, de libellé et d'aide s'appliquent immédiatement, sans
									effet sur les valeurs saisies.
								</li>{/if}
						</ul>{/if}
				</div>

				<div class="champ" id="champ-nom" data-etat={erreurNom === null ? undefined : 'erreur'}>
					<label class="champ__label" for="f-nom">Nom du type <span class="oblig">*</span></label>
					<input
						class="saisie"
						type="text"
						id="f-nom"
						autocomplete="off"
						placeholder="Serveur"
						value={nomSaisi}
						oninput={(e) => (fNom = e.currentTarget.value)}
					/>
					<div class="champ__erreur" id="erreur-nom" hidden={erreurNom === null}>
						<svg
							width="13"
							height="13"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							style="flex:none;margin-top:1px"
							><path d="M8 4.5v4M8 11.2v.3" /><circle cx="8" cy="8" r="6.2" /></svg
						>
						<span id="erreur-nom-txt">{erreurNom ?? ''}</span>
					</div>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-desc">Description</label>
					<textarea
						class="saisie"
						id="f-desc"
						rows="2"
						placeholder="Ce que ce type décrit, et quand l'employer."
						oninput={(e) => (fDescription = e.currentTarget.value)}
						value={descriptionSaisie}></textarea>
				</div>

				<div class="champ">
					<span class="champ__label">Icône</span>
					<div class="icones" id="f-icones" role="group" aria-label="Icône du type">
						{#if panneauOuvert}{#each ICONES as icone (icone.cle)}<button
									type="button"
									aria-pressed={icone.cle === iconeChoisie}
									aria-label="Icône {icone.cle}"
									onclick={() => (fIcone = icone.cle)}
									><Pictogramme
										traits={icone.traits}
										taille="19"
										boite="0 0 24 24"
										epaisseur="1.5"
									/></button
								>{/each}{/if}
					</div>
				</div>

				<div class="champ">
					<span class="champ__label">Propriétés</span>
					<span class="champ__aide" style="margin-bottom:var(--e-2)"
						>Leur ordre pilote l'affichage dans l'éditeur et dans le panneau de lecture. Réglez-le
						avec les flèches.</span
					>
					<div class="props" id="f-props">
						{#if panneauOuvert}{#if propsEditees.length}{#each propsEditees as p, rang (p.cle)}<div
										class="prop-l"
										data-ouvert={deplies.includes(p.cle) ? 'oui' : 'non'}
									>
										<div class="prop-tete">
											<div class="rang">
												<button
													type="button"
													disabled={rang === 0}
													aria-label="Monter {p.libelle}"
													onclick={() => deplacerLaPropriete(rang, rang - 1)}
													><svg
														width="11"
														height="11"
														viewBox="0 0 12 12"
														fill="none"
														stroke="currentColor"
														stroke-width="1.6"><path d="M3 6.5L6 3.5l3 3" /></svg
													></button
												><button
													type="button"
													disabled={rang === propsEditees.length - 1}
													aria-label="Descendre {p.libelle}"
													onclick={() => deplacerLaPropriete(rang, rang + 1)}
													><svg
														width="11"
														height="11"
														viewBox="0 0 12 12"
														fill="none"
														stroke="currentColor"
														stroke-width="1.6"><path d="M3 5.5L6 8.5l3-3" /></svg
													></button
												>
											</div>
											<div style="min-width:0">
												<div class="prop-tete__nom">
													{p.libelle}{#if p.obligatoire}<span class="prop-tete__oblig"
															>{MARQUE_OBLIGATOIRE}</span
														>{/if}
												</div>
												<div class="prop-tete__cle">{p.cle}</div>
											</div>
											<span class="prop-tete__type">{nomDuType(p.type)}</span>
											<div style="display:flex">
												<button
													class="prop-tete__bouton"
													type="button"
													aria-expanded={deplies.includes(p.cle)}
													aria-label="Déplier {p.libelle}"
													onclick={() => basculerLeDepli(p.cle)}
													><svg
														width="14"
														height="14"
														viewBox="0 0 16 16"
														fill="none"
														stroke="currentColor"
														stroke-width="1.6"><path d="M4 6l4 4 4-4" /></svg
													></button
												><button
													class="prop-tete__bouton"
													type="button"
													aria-label="Retirer {p.libelle}"
													onclick={() => retirerLaPropriete(rang)}
													><svg
														width="14"
														height="14"
														viewBox="0 0 16 16"
														fill="none"
														stroke="currentColor"
														stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8" /></svg
													></button
												>
											</div>
										</div>
										<div class="prop-corps">
											<div class="prop-duo">
												<div class="champ">
													<label class="champ__label">Libellé affiché</label>
													<input
														class="saisie"
														type="text"
														style="padding:6px var(--e-2);font-size:var(--t-petit)"
														value={p.libelle}
														oninput={(e) =>
															changerLaPropriete(rang, { libelle: e.currentTarget.value })}
													/>
												</div>
												<div class="champ">
													<label class="champ__label">Nom technique</label>
													<!--
	LA CLÉ EST RELUE À LA SORTIE DU CHAMP, PAS À CHAQUE FRAPPE. Le bloc
	`{#each}` est indexé PAR ELLE : la changer à chaque touche recréerait
	la ligne, et le champ perdrait le focus au premier caractère.
	`change` la relit une fois, la saisie finie.
-->
													<input
														class="saisie"
														type="text"
														style="padding:6px var(--e-2);font-size:var(--t-petit)"
														value={p.cle}
														onchange={(e) =>
															changerLaPropriete(rang, { cle: e.currentTarget.value })}
													/>
													<span class="champ__aide"
														>Sert aux imports et aux exports. Modifiable, mais stable de préférence.</span
													>
												</div>
											</div>
											<div class="prop-duo">
												<div class="champ">
													<label class="champ__label">Type de valeur</label>
													<select
														class="selecteur"
														onchange={(e) =>
															changerLaPropriete(rang, {
																type: e.currentTarget.value as CleDeTypeDeValeur
															})}
														>{#each TYPES_VALEUR as t (t.cle)}<option
																value={t.cle}
																selected={t.cle === p.type}>{t.nom}</option
															>{/each}</select
													>
												</div>
												<div class="champ">
													<label class="champ__label">Valeur par défaut</label>
													<input
														class="saisie"
														type="text"
														style="padding:6px var(--e-2);font-size:var(--t-petit)"
														value={p.defaut}
														oninput={(e) =>
															changerLaPropriete(rang, { defaut: e.currentTarget.value })}
													/>
												</div>
											</div>
											<div class="champ">
												<label class="champ__label">Aide à la saisie</label>
												<input
													class="saisie"
													type="text"
													style="padding:6px var(--e-2);font-size:var(--t-petit)"
													value={p.aide}
													oninput={(e) => changerLaPropriete(rang, { aide: e.currentTarget.value })}
												/>
												<span class="champ__aide">Affichée sous le champ dans l'éditeur.</span>
											</div>
											<label class="case">
												<input
													type="checkbox"
													checked={p.obligatoire}
													onchange={(e) =>
														changerLaPropriete(rang, { obligatoire: e.currentTarget.checked })}
												/>
												<span class="case__txt"
													>Propriété obligatoire<span class="case__aide"
														>La note ne pourra pas être enregistrée sans cette valeur.</span
													></span
												>
											</label>
											{#if p.type === 'liste'}<div class="champ">
													<span class="champ__label">Valeurs autorisées</span>
													<div class="valeurs">
														{#each p.valeurs as v, rangValeur (rangValeur)}<div class="valeur-l">
																<input
																	class="saisie"
																	type="text"
																	value={v}
																	onchange={(e) =>
																		changerLaValeur(rang, rangValeur, e.currentTarget.value)}
																/><button
																	type="button"
																	aria-label="Retirer la valeur {v}"
																	onclick={() => retirerLaValeur(rang, rangValeur)}
																	><svg
																		width="13"
																		height="13"
																		viewBox="0 0 16 16"
																		fill="none"
																		stroke="currentColor"
																		stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
																	></button
																>
															</div>{/each}
													</div>
													<button
														class="btn"
														type="button"
														style="margin-top:var(--e-2);padding:4px var(--e-2);font-size:var(--t-mini)"
														onclick={() => ajouterUneValeur(rang)}>+ Ajouter une valeur</button
													>
												</div>{/if}
										</div>
									</div>{/each}{:else}<div class="zone-etat">
									<div class="zone-etat__titre">Aucune propriété</div>
									<div class="zone-etat__txt">
										Un type sans propriété reste utilisable : il classe les notes et les fait entrer
										dans la cartographie, sans champ structuré.
									</div>
								</div>{/if}{/if}
					</div>
					<button
						class="btn"
						id="ajouter-prop"
						style="margin-top:var(--e-2);width:100%;justify-content:center"
						onclick={ajouterUnePropriete}
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M8 3v10M3 8h10" /></svg
						>
						Ajouter une propriété
					</button>
				</div>

				<div class="champ">
					<span class="champ__label">Aperçu du formulaire produit</span>
					<span class="champ__aide" style="margin-bottom:var(--e-2)"
						>C'est ce que verra le rédacteur dans l'éditeur de note.</span
					>
					<div class="apercu-schema" id="apercu-schema">
						{#if panneauOuvert}{#if propsEditees.length}{#each propsEditees as p (p.cle)}<div
										class="as-champ"
									>
										<div class="as-label">
											{p.libelle}{#if p.obligatoire}<span class="oblig">{MARQUE_OBLIGATOIRE}</span
												>{/if}
										</div>
										{#if p.type === 'booleen'}<div class="as-interrupteur"></div>{:else}<div
												class="as-faux"
											>
												{fauxChamp(p)}
											</div>{/if}
									</div>{/each}{:else}<div style="font-size:var(--t-mini);color:var(--c-encre-3)">
									Aucun champ ne sera ajouté à l'éditeur.
								</div>{/if}{/if}
					</div>
				</div>
			</div>

			<div class="tiroir-form__pied">
				<button
					class="btn btn--destructif"
					id="form-supprimer"
					hidden={!edite}
					onclick={() => {
						if (edite === null) return;
						const vise = edite.nom;
						fermerForm();
						demande = vise;
					}}>Supprimer</button
				>
				<button class="btn" id="form-annuler" onclick={fermerForm}>Annuler</button>
				<button class="btn btn--principal" id="form-valider" onclick={validerLeForm}
					><span id="form-valider-txt">{edite ? 'Enregistrer' : 'Créer le type'}</span></button
				>
			</div>
		</aside>

		<dialog
			class="dlg dlg--destructif"
			id="dlg-supprimer"
			aria-labelledby="dlg-sup-titre"
			open={dialogueOuvert}
		>
			<div class="dlg__boite">
				<div class="dlg__tete">
					<span class="dlg__marque" aria-hidden="true">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							><path d="M8 4.5v4.2M8 11.4v.3" /><path
								d="M7 1.9L1.3 12.4a.9.9 0 0 0 .8 1.3h11.8a.9.9 0 0 0 .8-1.3L9 1.9a1.1 1.1 0 0 0-2 0z"
							/></svg
						>
					</span>
					<h2 class="dlg__titre" id="dlg-sup-titre">Supprimer le type de {motFicheMinuscule}</h2>
					<button
						class="dlg__fermer"
						data-fermer
						aria-label="Fermer"
						onclick={() => (demande = null)}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
						>
					</button>
				</div>
				<div class="dlg__corps" id="sup-corps">
					{#if aSupprimer}{#if notesASupprimer.length}<div class="refus">
								<div class="refus__titre">Suppression refusée : ce type est utilisé</div>
								<ul>
									<li>
										<b>{notesASupprimer.length}</b>{notesASupprimer.length > 1
											? `notes portent ce type de ${motFicheMinuscule}`
											: `note porte ce type de ${motFicheMinuscule}`}
									</li>
									<li>
										<b>{aSupprimer.props.length}</b>propriétés dont les valeurs seraient perdues
									</li>
								</ul>
								<div class="refus__sortie">
									Délestez d'abord ces notes : elles resteront des notes ordinaires, avec leur
									contenu rédigé intact, mais perdront leurs propriétés structurées et sortiront de
									la cartographie.
								</div>
							</div>
							<div
								style="display:flex;flex-direction:column;gap:var(--e-1);max-height:180px;overflow-y:auto"
							>
								{#each notesASupprimer as n (n.id)}<div
										style="display:flex;align-items:center;gap:var(--e-2);padding:var(--e-2);border:1px solid var(--c-trait);border-radius:var(--r-2);font-size:var(--t-petit)"
									>
										<span style="flex:1">{n.titre}</span><span class="tg__n">{n.domaine}</span>
									</div>{/each}
							</div>
							<button
								class="btn btn--principal"
								style="width:100%"
								type="button"
								onclick={() => aSupprimer && onDelester?.(aSupprimer.nom)}
								>Délester ces {notesASupprimer.length} notes du type « {aSupprimer.nom} »</button
							>{:else}<p class="dlg__texte">
								« {aSupprimer.nom} » n'est utilisé par aucune note. Sa suppression retire le schéma et
								ses {aSupprimer.props.length} propriétés, sans affecter aucun contenu.
							</p>{/if}{/if}
				</div>
				<div class="dlg__pied">
					<button class="btn" data-fermer id="sup-annuler" onclick={() => (demande = null)}
						>{notesASupprimer.length ? 'Fermer' : 'Annuler'}</button
					>
					<button
						class="btn btn--principal btn--destructif"
						id="sup-valider"
						style="background:var(--c-danger);border-color:var(--c-danger);color:#fff"
						hidden={notesASupprimer.length > 0}
						onclick={() => {
							if (aSupprimer === null || notesASupprimer.length) return;
							onSupprimer?.(aSupprimer.nom);
						}}>Supprimer</button
					>
				</div>
			</div>
		</dialog>
	{/snippet}
</Coquille>
