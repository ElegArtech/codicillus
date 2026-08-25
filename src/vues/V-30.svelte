<script lang="ts">
	/**
	 * V-30 — Console · Types de relations.
	 * Route `/console/types-de-relations` (`docs/routes.md` §3.6).
	 *
	 * COQUILLE DE FORME ABRÉGÉE, ENVELOPPE `console` — vérifié sur le gel par
	 * `node verif/releve-vues.mjs --formes` (ARB-021, A-1 ; ARB-023).
	 *
	 * CE QUI EST COMMUN, ET CE QUI NE L'EST PAS. `src/lib/console/` porte les
	 * treize classes des dix vues de console et le panneau des six registres
	 * (`sections.ts`, en-tête). Propres à V-30, et à elle seule : `sens`,
	 * `sens--inverse`, `sens__fleche`, `sens__libelle`, `apercu-phrases`,
	 * `phrase`, `phrase--inverse`, `phrase__sens`, `phrase__manque`, `exemples`,
	 * `choix-reaffectation`, `aide`, et le modificateur de grille
	 * `tg--relations`. AUCUNE FACTORISATION AU-DELÀ (`docs/DESIGN.md` §2.H).
	 *
	 * LE PANNEAU `tiroir-form` NE PÈSE AUCUN PIXEL, ET C'EST LE GEL. Hors de
	 * `div.app`, il n'est pas atteint par `.app[data-form="ouvert"]
	 * .tiroir-form` (`V-30.css:401`) et reste hors fenêtre. Le NIVEAU 1 en est
	 * le seul juge — `position: fixed` le laisse dans l'ordre de tabulation et
	 * dans l'instantané ARIA (`CLAUDE.md` §6, P-3).
	 *
	 * AUCUN `autofocus` : la maquette focalise `#f-direct` à l'ouverture
	 * (`V-30:3054`), mais hors dialogue le focus ne survit pas à `stabiliser()`
	 * (`CLAUDE.md` §6, P-4). Dans le dialogue, `showModal()` — établi par le
	 * banc (ARB-017) — focalise déjà `button.dlg__fermer`, premier focalisable.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : les compteurs de relations sont
	 * calculés sur `RELATIONS` de `seeds/corpus.ts`.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011).
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette`, `dialog#palette` fermé,
	 * et `div.planche`, bloc hors produit (§2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-30.css` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import NavigationConsole from '$lib/console/NavigationConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { filDeConsole } from '$lib/console/sections';
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		RELATIONS,
		RELATIONS_TECHNIQUES,
		TYPES_RELATION,
		UNIVERS,
		type CleDeTypeDeRelation,
		type Domaine,
		type EtatDInstance,
		type LibellesDeRelation,
		type Note,
		type Relation,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import { vocabulaireRendu } from '$lib/vocabulaire';
	import type { RefusDeSaisie, SaisieDeTypeDeRelation } from '$lib/console/structure';

	/* LE MOT RENOMMABLE DE `M14.7`, LU SUR LE CONTEXTE DE COQUILLE. Il etait
	   une constante de `$lib/vocabulaire.ts`, calculee a l'import depuis
	   `CONFIG.motFiche` de `seeds/corpus.ts` : le renommer en console ne
	   changeait rien a l'ecran. Hors gabarit racine, le repli rend « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);
	const motFichePlurielMinuscule = $derived(motsDuProduit.fichesMin);

	interface Proprietes {
		/** Le vecteur complet de l'état — formulaire × suppression. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-30')`. */
		notes: readonly Note[];
		/** Les univers déclarés. Absente, la constante du jeu de semence s'applique. */
		univers?: readonly Univers[];
		/** Les domaines déclarés. Absente, la constante du jeu de semence s'applique. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Absente, la constante du jeu de semence s'applique. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, la constante du jeu de semence s'applique. */
		instance?: EtatDInstance;
		/** Le catalogue des types de relation. Absente, la constante du jeu. */
		typesRelation?: Record<CleDeTypeDeRelation, LibellesDeRelation>;
		/**
		 * Les types qui portent une dépendance technique — `types_de_relation.technique`.
		 * Absente, la constante du jeu de semence s'applique.
		 */
		relationsTechniques?: readonly CleDeTypeDeRelation[];
		/** Les relations déclarées, dont se compte l'usage. Absente, la constante du jeu. */
		relations?: readonly Relation[];
		/**
		 * CE QUE LA VUE FAIT QUAND LA SUPPRESSION EST CONFIRMÉE.
		 *
		 * Même partage qu'en `V-27`, `V-28`, `V-29` et `V-32` : la vue tient l'état
		 * de son dialogue — quel type est visé, combien de relations le portent,
		 * quelle sortie est cochée — et la page tient le réseau. `sortie` et `vers`
		 * portent les valeurs du gel (`V-30:536`, `:549`), jamais des noms choisis.
		 */
		onSupprimer?: (demande: {
			readonly type: string;
			readonly sortie: 'reaffecter' | 'supprimer';
			readonly vers: string;
		}) => void;
		/**
		 * CE QUE LA VUE FAIT QUAND LE PANNEAU EST VALIDÉ — création puis
		 * enregistrement. La vue tient l'état du panneau — les deux libellés, le
		 * caractère technique, le couple d'épreuve retenu — parce que c'est ce que
		 * `ouvrirForm(t)` tenait au gel (`V-30:3035`), et elle ne connaît ni route,
		 * ni action, ni réseau.
		 *
		 * `onEnregistrer` reçoit d'abord la CLÉ du type — son identifiant lisible —
		 * parce que c'est elle qui le désigne en base, et que l'enregistrement peut
		 * justement changer les deux libellés.
		 */
		onCreer?: (saisie: SaisieDeTypeDeRelation) => void;
		onEnregistrer?: (cle: string, saisie: SaisieDeTypeDeRelation) => void;
		/** Les refus rendus par l'action, rattachés à leur champ du gel. */
		refus?: RefusDeSaisie | null;
	}

	const {
		vecteur,
		notes: corpus,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		typesRelation = TYPES_RELATION,
		relationsTechniques = RELATIONS_TECHNIQUES,
		onSupprimer,
		relations = RELATIONS,
		onCreer,
		onEnregistrer,
		refus = null
	}: Proprietes = $props();

	/**
	 * L'USAGE ATTENDU EST UN TEXTE DU GEL (`V-30:2875`), recopié depuis lui.
	 * `seeds/corpus.ts` porte les deux libellés de chaque type de relation,
	 * jamais la phrase qui dit quand l'employer : la dériver serait inventer.
	 */
	const USAGES: Record<string, string> = {
		heberge: "Entre un serveur et ce qui tourne dessus. La rupture du serveur emporte l'hébergé.",
		depend:
			"Quand l'indisponibilité de la cible empêche l'origine de fonctionner. Le lien le plus structurant du graphe.",
		replique:
			'Entre deux instances qui portent la même donnée. Distinct de « dépend de » : la bascule est possible.',
		sauvegarde:
			"Entre un dispositif de sauvegarde et ce qu'il protège. Sert aux revues de plan de reprise.",
		documente:
			"Entre une procédure et l'objet qu'elle décrit. Lien éditorial, sans dépendance technique.",
		contact: "Entre un objet et l'interlocuteur à joindre à son sujet."
	};

	interface TypeDeRelationRendu {
		readonly cle: string;
		readonly direct: string;
		readonly inverse: string;
		readonly usage: string;
		readonly technique: boolean;
	}

	/**
	 * LE TYPE `remplace` EST UN AJOUT DU GEL, ET IL EST DÉCLARÉ COMME TEL
	 * (`V-30:2895`) : « un type inutilisé, pour que le cas de suppression
	 * simple existe ». Aucune relation ne le porte, et c'est précisément ce
	 * qu'il sert à montrer. Le déduire du corpus est impossible — les six types
	 * de `TYPES_RELATION` sont tous employés.
	 */
	const TYPE_INUTILISE: TypeDeRelationRendu = {
		cle: 'remplace',
		direct: 'remplace',
		inverse: 'est remplacé par',
		usage: 'Entre un objet retiré du service et celui qui reprend sa fonction.',
		technique: false
	};

	/**
	 * La liste — plus le type inutilisé, MAIS SEULEMENT SUR LE JEU DE SEMENCE.
	 *
	 * `TYPE_INUTILISE` est un littéral de démonstration : il donne à la planche
	 * son état « type inutilisé », et aucune table ne le porte. Servi à côté des
	 * types réels d'une instance, c'est une ligne que l'administrateur voit et
	 * qui ne correspond à rien — la valeur illustrative que `P-02` proscrit.
	 * La condition est une comparaison d'identité avec le défaut : la maquette
	 * garde exactement ce qu'elle montrait, et la base ne montre qu'elle-même.
	 * Même geste, même motif, que `TELEPHONIE` de `V-28`.
	 */
	const types: readonly TypeDeRelationRendu[] = $derived([
		...(Object.keys(typesRelation) as readonly CleDeTypeDeRelation[]).map((cle) => ({
			cle,
			direct: typesRelation[cle].sortant,
			inverse: typesRelation[cle].entrant,
			usage: USAGES[cle] ?? '',
			technique: relationsTechniques.includes(cle)
		})),
		...(typesRelation === TYPES_RELATION ? [TYPE_INUTILISE] : [])
	]);

	/** Les relations déclarées qui portent ce type — calculé, jamais écrit. */
	function usage(cle: string): number {
		return relations.filter((r) => r.type === cle).length;
	}

	/**
	 * LES COUPLES D'ÉPREUVE DE L'APERÇU VIENNENT DU CORPUS, ET DE LUI SEUL.
	 *
	 * Le gel en écrivait trois en dur — « srv-app-01 / Facturation », « bkp-01.prod
	 * / pg-prod-01 », « Restaurer une sauvegarde PostgreSQL / pg-prod-02 » : sur une
	 * instance réelle, ce sont des serveurs qui n'existent nulle part. On prend donc
	 * un couple par type de relation déclaré, dans l'ordre du graphe — c'est ce que
	 * le gel montrait, trois types différents — puis on complète avec les notes
	 * prises deux à deux. Moins de deux notes : aucun couple, et l'aperçu le dit.
	 */
	const titresDuCorpus = $derived(new Map<string, string>(corpus.map((n) => [n.id, n.titre])));
	const COUPLES: readonly (readonly [string, string])[] = $derived.by(() => {
		/* Accumulateurs de tableau, jamais d'ensemble : trois couples au plus, et
		   `svelte/prefer-svelte-reactivity` refuse un `Set` mutable dans un composant. */
		const couples: [string, string][] = [];
		const ajouter = (a: string | undefined, b: string | undefined): void => {
			if (a === undefined || b === undefined || a === b || couples.length >= 3) return;
			if (couples.some(([x, y]) => x === a && y === b)) return;
			couples.push([a, b]);
		};
		const typesVus: string[] = [];
		for (const r of relations) {
			if (typesVus.includes(r.type)) continue;
			typesVus.push(r.type);
			ajouter(titresDuCorpus.get(r.de), titresDuCorpus.get(r.vers));
		}
		for (let i = 0; i + 1 < corpus.length; i += 2) ajouter(corpus[i]?.titre, corpus[i + 1]?.titre);
		return couples;
	});

	/* ── L'état, tel que le vecteur de planche le décrit ───────────────────
	   Le panneau et le dialogue ne s'ouvrent que si la position DÉVIE du
	   réglage par défaut : la maquette ne les ouvre que sur l'événement
	   `change` que le banc répartit, jamais au chargement (`V-30:3230`). */
	const reglage = $derived(vecteur ?? {});
	const form = $derived(String(reglage['form'] ?? 'ferme'));
	const sup = $derived(String(reglage['sup'] ?? 'utilise'));

	/**
	 * LE PANNEAU S'OUVRE, ET C'EST LA VUE QUI LE TIENT — même arbitrage que pour
	 * le dialogue de suppression : `ouverture` vaut `null` tant que personne n'a
	 * cliqué, si bien que l'écran rendu est celui que le vecteur décrit.
	 */
	let ouverture = $state<'creation' | 'edition' | null>(null);
	let cible = $state<string | null>(null);

	/** Les quatre champs du panneau — `edite` du gel (`V-30:3035`), un par un. */
	let fDirect = $state('');
	let fInverse = $state('');
	let fUsage = $state('');
	let fTechnique = $state(false);
	/**
	 * LE COUPLE D'ÉPREUVE RETENU — « Changez les sujets pour éprouver la
	 * formulation sur un autre couple » (`V-30:507`). C'est un réglage de
	 * l'aperçu, pas une donnée : il ne sort jamais de la vue. On en tient le RANG,
	 * pas la valeur : `COUPLES` est dérivé du corpus et se recalcule.
	 */
	let rangDuCouple = $state(0);
	const coupleRetenu = $derived(COUPLES[rangDuCouple] ?? COUPLES[0] ?? null);
	/** Les messages de `#erreur-direct` et `#erreur-inverse`, quand l'écran refuse. */
	let erreursLocales = $state<readonly RefusDeSaisie[]>([]);
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

	/** Le type édité par la position « Édition · héberge » (`V-30:3234`). */
	const edite = $derived(
		ouverture === 'creation'
			? null
			: ouverture === 'edition'
				? (types.find((t) => t.cle === cible) ?? null)
				: form === 'edition'
					? (types.find((t) => t.cle === 'heberge') ?? null)
					: null
	);
	const relationsEditees = $derived(edite ? usage(edite.cle) : 0);

	const directSaisi = $derived(ouverture !== null ? fDirect : edite ? edite.direct : '');
	const inverseSaisi = $derived(ouverture !== null ? fInverse : edite ? edite.inverse : '');
	const usageSaisi = $derived(ouverture !== null ? fUsage : edite ? edite.usage : '');
	const techniqueSaisi = $derived(
		ouverture !== null ? fTechnique : edite ? edite.technique : false
	);

	/** Le message d'un champ : celui de l'écran, ou celui de l'action. */
	function messageDuChamp(champ: string): string | null {
		const locale = erreursLocales.find((e) => e.champ === champ);
		if (locale !== undefined) return locale.message;
		return refus !== null && refus.champ === champ ? refus.message : null;
	}
	const erreurDirect = $derived(messageDuChamp('direct'));
	const erreurInverse = $derived(messageDuChamp('inverse'));

	/** Sans couple à éprouver, la phrase nomme les deux rôles — jamais un sujet inventé. */
	const ORIGINE = $derived(`la ${motFicheMinuscule} d'origine`);
	const CIBLE = $derived(`la ${motFicheMinuscule} cible`);

	/** Les deux phrases de l'aperçu, dans l'ordre du gel. */
	const phrases = $derived([
		{
			sujet: coupleRetenu?.[0] ?? null,
			sujetVide: ORIGINE,
			libelle: directSaisi,
			objet: coupleRetenu?.[1] ?? null,
			objetVide: CIBLE,
			sens: 'sens direct',
			modificateur: ''
		},
		{
			sujet: coupleRetenu?.[1] ?? null,
			sujetVide: CIBLE,
			libelle: inverseSaisi,
			objet: coupleRetenu?.[0] ?? null,
			objetVide: ORIGINE,
			sens: 'sens inverse',
			modificateur: 'phrase--inverse'
		}
	]);

	/** `ouvrirForm(t)` — `null` pour une création (`V-30:3035`). */
	function ouvrirForm(t: TypeDeRelationRendu | null): void {
		ouverture = t === null ? 'creation' : 'edition';
		cible = t === null ? null : t.cle;
		fDirect = t === null ? '' : t.direct;
		fInverse = t === null ? '' : t.inverse;
		fUsage = t === null ? '' : t.usage;
		fTechnique = t === null ? false : t.technique;
		rangDuCouple = 0;
		erreursLocales = [];
	}

	/** `fermerForm()` — le panneau se referme, la saisie ne survit pas. */
	function fermerForm(): void {
		ouverture = null;
		cible = null;
		erreursLocales = [];
	}

	/**
	 * `form-valider` — LA VALIDATION DE L'ÉCRAN, celle du gel (`V-30:3086-3098`),
	 * dans son ordre : libellé direct manquant, libellé inverse manquant ou
	 * identique au direct, puis doublon — ce dernier seulement si les deux
	 * premiers passent. `creerUnTypeDeRelation()` refuse de la même façon, avec
	 * les mêmes messages ; ceci n'en est que le reflet.
	 */
	function validerLeForm(): void {
		const direct = fDirect.trim();
		const inverse = fInverse.trim();
		const fautes: RefusDeSaisie[] = [];
		if (direct === '') fautes.push({ champ: 'direct', message: 'Saisissez le libellé direct.' });
		if (inverse === '') {
			fautes.push({ champ: 'inverse', message: 'Saisissez le libellé inverse.' });
		} else if (inverse.toLowerCase() === direct.toLowerCase()) {
			fautes.push({
				champ: 'inverse',
				message:
					"Le libellé inverse est identique au direct. Relisez l'aperçu : la seconde phrase doit se lire naturellement."
			});
		}
		if (
			fautes.length === 0 &&
			types.some((t) => t.cle !== cible && t.direct.toLowerCase() === direct.toLowerCase())
		) {
			fautes.push({ champ: 'direct', message: `« ${direct} » existe déjà.` });
		}
		erreursLocales = fautes;
		if (fautes.length > 0) return;

		const saisie: SaisieDeTypeDeRelation = { direct, inverse, technique: fTechnique };
		if (ouverture === 'edition' && cible !== null) onEnregistrer?.(cible, saisie);
		else onCreer?.(saisie);
		fermerForm();
	}

	/**
	 * LE TYPE PROPOSÉ À LA SUPPRESSION (`V-30:3237`) : le premier type sans
	 * relation pour « Type inutilisé », `heberge` pour « Type utilisé ». La
	 * position par défaut n'ouvre rien.
	 */
	/**
	 * LE TYPE DONT LA SUPPRESSION EST EXAMINÉE. `null` au rendu serveur : l'écran
	 * reste celui que le vecteur décrit tant que personne n'a cliqué.
	 */
	let demande = $state<string | null>(null);
	/** La sortie cochée, et le type d'accueil — les deux réglages du gel. */
	let sortie = $state<'reaffecter' | 'supprimer'>('reaffecter');
	let versLeType = $state('');

	const aSupprimer = $derived(
		demande !== null
			? (types.find((t) => t.cle === demande) ?? null)
			: sup === 'utilise'
				? null
				: (types.find((t) => usage(t.cle) === 0) ?? null)
	);
	const relationsASupprimer = $derived(aSupprimer ? usage(aSupprimer.cle) : 0);
	const autresTypes = $derived(aSupprimer ? types.filter((t) => t !== aSupprimer) : []);

	/** `showModal()` — voir `V-28.svelte` : l'attribut `open` n'obtient pas la modalité. */
	$effect(() => {
		const boite = document.getElementById('dlg-supprimer');
		if (!(boite instanceof HTMLDialogElement)) return;
		if (aSupprimer === null) {
			if (boite.open) boite.close();
			return;
		}
		if (!boite.open) boite.showModal();
	});

	/** Refermer : le dialogue disparaît, et les réglages retrouvent leur défaut. */
	function refermer(): void {
		demande = null;
		sortie = 'reaffecter';
		versLeType = '';
	}
</script>

<Coquille
	forme="abregee"
	role="admin"
	classeEnveloppe="console"
	classeContenu="travail"
	idContenu="travail"
	fil={filDeConsole('Types de relations')}
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
		<NavigationConsole courante="relations" />
	{/snippet}

	{#snippet enfants()}
		<TeteDeSection
			titre="Types de relations"
			description={`Le vocabulaire qui relie les ${motFichePlurielMinuscule} entre elles. Chaque type se lit dans les deux sens : « héberge » d'un côté, « est hébergé par » de l'autre. C'est ce couple qui rend le graphe compréhensible sans légende.`}
		>
			{#snippet action()}
				<BoutonDeCreation libelle="Nouveau type" onCliquer={() => ouvrirForm(null)} />
			{/snippet}
		</TeteDeSection>

		<div class="tableau-gestion">
			<div class="tg tg--relations tg--entetes" role="row">
				<span>Libellé direct</span>
				<span>Libellé inverse</span>
				<span class="tg--masquable">Usage attendu</span>
				<span class="tg--masquable">Relations</span>
				<span></span>
			</div>
			<div id="liste">
				{#each types as t (t.cle)}
					{@const n = usage(t.cle)}
					<div class="tg tg--relations tg--ligne">
						<span class="sens"
							><span class="sens__fleche"
								><svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"><path d="M2 8h11M9.5 4.5L13 8l-3.5 3.5" /></svg
								></span
							><span class="sens__libelle">{t.direct}</span>{#if t.technique}<span
									class="past"
									title="Entre dans le calcul des points de rupture">technique</span
								>{/if}</span
						>
						<span class="sens sens--inverse"
							><span class="sens__fleche"
								><svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"><path d="M14 8H3M6.5 4.5L3 8l3.5 3.5" /></svg
								></span
							><span class="sens__libelle">{t.inverse}</span></span
						>
						<span class="tg__desc tg--masquable" style="margin-top:0">{t.usage}</span>
						<span class="tg__n tg--masquable" style={n ? undefined : 'color:var(--c-encre-4)'}
							>{n} {n > 1 ? 'relations' : 'relation'}</span
						>
						<div class="tg__actions">
							<button class="btn" type="button" onclick={() => ouvrirForm(t)}>Modifier</button>
							<button
								class="btn btn--destructif"
								type="button"
								aria-label="Supprimer le type {t.direct}"
								onclick={() => {
									demande = t.cle;
									sortie = 'reaffecter';
									versLeType = '';
								}}
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
		<aside class="tiroir-form" id="tiroir" aria-label="Formulaire de type de relation">
			<div class="tiroir-form__tete">
				<div style="min-width:0">
					<h2 class="tiroir-form__titre" id="form-titre">
						{edite ? edite.direct : 'Nouveau type de relation'}
					</h2>
					<div class="tiroir-form__sous" id="form-sous">
						{#if edite}{relationsEditees}
							{relationsEditees > 1
								? 'relations déclarées utilisent ce type.'
								: 'relation déclarée utilise ce type.'}{:else}Un couple de libellés, un par sens de
							lecture.{/if}
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
					class="champ"
					id="champ-direct"
					data-etat={erreurDirect === null ? undefined : 'erreur'}
				>
					<label class="champ__label" for="f-direct"
						>Libellé direct <span class="oblig">*</span></label
					>
					<input
						class="saisie"
						type="text"
						id="f-direct"
						autocomplete="off"
						placeholder="héberge"
						value={directSaisi}
						oninput={(e) => (fDirect = e.currentTarget.value)}
					/>
					<span class="champ__aide"
						>Se lit de la {motFicheMinuscule} d'origine vers la {motFicheMinuscule} cible. En minuscules,
						à la troisième personne.</span
					>
					<div class="champ__erreur" id="erreur-direct" hidden={erreurDirect === null}>
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
						<span id="erreur-direct-txt">{erreurDirect ?? ''}</span>
					</div>
				</div>

				<div
					class="champ"
					id="champ-inverse"
					data-etat={erreurInverse === null ? undefined : 'erreur'}
				>
					<label class="champ__label" for="f-inverse"
						>Libellé inverse <span class="oblig">*</span></label
					>
					<input
						class="saisie"
						type="text"
						id="f-inverse"
						autocomplete="off"
						placeholder="est hébergé par"
						value={inverseSaisi}
						oninput={(e) => (fInverse = e.currentTarget.value)}
					/>
					<span class="champ__aide"
						>Se lit de la cible vers l'origine. C'est lui qui apparaît dans le panneau Relations de
						la {motFicheMinuscule} visée.</span
					>
					<div class="champ__erreur" id="erreur-inverse" hidden={erreurInverse === null}>
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
						<span id="erreur-inverse-txt">{erreurInverse ?? ''}</span>
					</div>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-desc">Usage attendu</label>
					<textarea
						class="saisie"
						id="f-desc"
						rows="2"
						placeholder="Quand employer ce type plutôt qu'un autre."
						oninput={(e) => (fUsage = e.currentTarget.value)}
						value={usageSaisi}></textarea>
					<span class="champ__aide"
						>Affiché au moment de déclarer une relation. C'est ce qui évite que deux types voisins
						soient employés au hasard.</span
					>
				</div>

				<div class="champ">
					<label class="case" style="align-items:flex-start">
						<input
							type="checkbox"
							id="f-technique"
							checked={techniqueSaisi}
							onchange={(e) => (fTechnique = e.currentTarget.checked)}
						/>
						<span class="case__txt"
							>Dépendance technique
							<span class="case__aide"
								>Entre dans le calcul des points de rupture de la cartographie. À cocher pour «
								héberge » ou « dépend de », à laisser vide pour « documente » — une note qui en
								documente une autre n'en dépend pas.</span
							>
						</span>
					</label>
				</div>

				<div class="champ">
					<span class="champ__label">Aperçu dans les deux sens</span>
					<div class="apercu-phrases" id="apercu">
						{#if panneauOuvert}{#each phrases as p (p.sens)}<div class="phrase {p.modificateur}">
									<span class="phrase__sens">{p.sens}</span><span
										>{#if p.sujet}<i>{p.sujet}</i>{:else}<span class="phrase__manque"
												>{p.sujetVide}</span
											>{/if}
										{#if p.libelle}<b>{p.libelle}</b>{:else}<span class="phrase__manque"
												>…libellé à saisir…</span
											>{/if}
										{#if p.objet}<i>{p.objet}</i>{:else}<span class="phrase__manque"
												>{p.objetVide}</span
											>{/if}.</span
									>
								</div>{/each}{/if}
					</div>
					<span class="champ__aide" style="margin-top:var(--e-2)"
						>{COUPLES.length > 0
							? 'Changez les sujets pour éprouver la formulation sur un autre couple :'
							: `Aucun couple à éprouver : le corpus porte moins de deux ${motFichePlurielMinuscule}.`}</span
					>
					<div class="exemples" id="exemples">
						{#if panneauOuvert}{#each COUPLES as couple, rang (couple[0] + ' / ' + couple[1])}<button
									type="button"
									style={rang === rangDuCouple
										? 'border-color:var(--c-accent);background:var(--c-accent-voile);color:var(--c-accent-fonce)'
										: undefined}
									onclick={() => (rangDuCouple = rang)}>{couple[0]} / {couple[1]}</button
								>{/each}{/if}
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
						const vise = edite.cle;
						fermerForm();
						demande = vise;
						sortie = 'reaffecter';
						versLeType = '';
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
			open={aSupprimer !== null}
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
					<h2 class="dlg__titre" id="dlg-sup-titre">Supprimer le type de relation</h2>
					<button class="dlg__fermer" data-fermer aria-label="Fermer" onclick={refermer}>
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
					{#if aSupprimer}{#if relationsASupprimer === 0}<p class="dlg__texte">
								« {aSupprimer.direct} » n'est utilisé par aucune relation. Sa suppression retire seulement
								ce couple de libellés du vocabulaire proposé.
							</p>{:else}<div class="refus">
								<div class="refus__titre">Suppression refusée en l'état : ce type est employé</div>
								<ul>
									<li>
										<b>{relationsASupprimer}</b>{relationsASupprimer > 1
											? `relations déclarées entre des ${motFichePlurielMinuscule}`
											: `relation déclarée entre des ${motFichePlurielMinuscule}`}
									</li>
									{#if aSupprimer.technique}<li>
											Type technique : sa disparition modifiera le calcul des points de rupture de
											la cartographie.
										</li>{/if}
								</ul>
								<div class="refus__sortie">
									Choisissez ce qu'il advient de ces relations. Aucune {motFicheMinuscule} n'est supprimée
									dans les deux cas : seul le lien entre elles est concerné.
								</div>
							</div>
							<div class="choix-reaffectation">
								<label
									><input
										type="radio"
										name="sortie"
										value="reaffecter"
										checked={sortie === 'reaffecter'}
										onchange={() => (sortie = 'reaffecter')}
									/><span style="flex:1"
										>Réaffecter à un autre type<select
											class="selecteur"
											style="margin-top:var(--e-2);width:100%;padding:6px var(--e-2);border:1px solid var(--c-trait-fort);border-radius:var(--r-2);background:var(--c-papier);font-family:var(--f-ui);font-size:var(--t-petit)"
											value={versLeType || (autresTypes[0]?.cle ?? '')}
											onchange={(e) => (versLeType = e.currentTarget.value)}
											>{#each autresTypes as t (t.cle)}<option value={t.cle}
													>{t.direct} / {t.inverse}</option
												>{/each}</select
										><span class="aide"
											>Les {relationsASupprimer} relations sont conservées et changent d'étiquette. Le
											graphe garde sa structure.</span
										></span
									></label
								><label
									><input
										type="radio"
										name="sortie"
										value="supprimer"
										checked={sortie === 'supprimer'}
										onchange={() => (sortie = 'supprimer')}
									/><span style="flex:1"
										>Supprimer aussi ces {relationsASupprimer} relations<span class="aide"
											>Les liens disparaissent du graphe et des panneaux Relations. Les {motFichePlurielMinuscule}
											restent intactes. Cette perte est définitive.</span
										></span
									></label
								>
							</div>{/if}{/if}
				</div>
				<div class="dlg__pied">
					<button class="btn" data-fermer id="sup-annuler" onclick={refermer}>Annuler</button>
					<button
						class="btn btn--principal btn--destructif"
						id="sup-valider"
						style="background:var(--c-danger);border-color:var(--c-danger);color:#fff"
						onclick={() => {
							if (aSupprimer === null) return;
							onSupprimer?.({
								type: aSupprimer.cle,
								sortie: relationsASupprimer === 0 ? 'supprimer' : sortie,
								vers: versLeType || (autresTypes[0]?.cle ?? '')
							});
						}}>{aSupprimer && relationsASupprimer === 0 ? 'Supprimer' : 'Appliquer'}</button
					>
				</div>
			</div>
		</dialog>
	{/snippet}
</Coquille>
