<script lang="ts">
	/**
	 * V-30 — Console · Types de relations. Route `/console/types-de-relations`
	 * (`docs/routes.md` §3.6).
	 *
	 * Coquille de forme abrégée, enveloppe `console` (`ARB-021`, `ARB-023`).
	 * `src/lib/console/` porte les classes communes aux dix vues de console.
	 * Propres à V-30, et à elle seule : `sens`, `sens--inverse`, `sens__fleche`,
	 * `sens__libelle`, `apercu-phrases`, `phrase`, `phrase--inverse`,
	 * `phrase__sens`, `phrase__manque`, `exemples`, `choix-reaffectation`, `aide`
	 * et `tg--relations`. AUCUNE FACTORISATION AU-DELÀ (`docs/DESIGN.md` §2.H).
	 *
	 * LE PANNEAU `tiroir-form` NE PÈSE AUCUN PIXEL : hors de `div.app`, il n'est pas
	 * atteint par `.app[data-form="ouvert"] .tiroir-form` (`V-30.css:401`).
	 *
	 * Aucun `autofocus` : la maquette focalise `#f-direct` à l'ouverture
	 * (`V-30:3054`), et dans le dialogue `showModal()` focalise déjà
	 * `button.dlg__fermer`, premier focalisable.
	 *
	 * Aucun chiffre n'est saisi : les compteurs de relations sont calculés sur les
	 * relations servies. Le style est dans `src/socle.css` et `src/vues/V-30.css`.
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import NavigationConsole from '$lib/console/NavigationConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { filDeConsole } from '$lib/console/sections';
	import type {
		CleDeTypeDeRelation,
		Domaine,
		LibellesDeRelation,
		Note,
		Relation,
		Univers,
		UtilisateurCourant
	} from '../../seeds/corpus';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';
	import type { RefusDeSaisie, SaisieDeTypeDeRelation } from '$lib/console/structure';

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille : en constante,
	   le renommer en console ne changeait rien a l'ecran. Repli : « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);
	const motFichePlurielMinuscule = $derived(motsDuProduit.fichesMin);

	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		univers: readonly Univers[];
		domaines: readonly Domaine[];
		compte: UtilisateurCourant;
		typesRelation: Record<CleDeTypeDeRelation, LibellesDeRelation>;
		/** Les types qui portent une dépendance technique — `types_de_relation.technique`. */
		relationsTechniques: readonly CleDeTypeDeRelation[];
		relations: readonly Relation[];
		/**
		 * CE QUE LA VUE FAIT QUAND LA SUPPRESSION EST CONFIRMÉE. Même partage qu'en
		 * `V-27`, `V-28`, `V-29` et `V-32` : la vue tient l'état de son dialogue, la
		 * page tient le réseau. `sortie` et `vers` portent les valeurs du gel
		 * (`V-30:536`, `:549`), jamais des noms choisis.
		 */
		onSupprimer?: (demande: {
			readonly type: string;
			readonly sortie: 'reaffecter' | 'supprimer';
			readonly vers: string;
		}) => void;
		/**
		 * CE QUE LA VUE FAIT QUAND LE PANNEAU EST VALIDÉ. La vue tient l'état du
		 * panneau, comme `ouvrirForm(t)` au gel (`V-30:3035`). `onEnregistrer` reçoit
		 * d'abord la CLÉ du type : c'est elle qui le désigne en base, et
		 * l'enregistrement peut justement changer les deux libellés.
		 */
		onCreer?: (saisie: SaisieDeTypeDeRelation) => void;
		onEnregistrer?: (cle: string, saisie: SaisieDeTypeDeRelation) => void;
		/** Les refus rendus par l'action, rattachés à leur champ du gel. */
		refus?: RefusDeSaisie | null;
	}

	const {
		vecteur,
		notes: corpus,
		univers,
		domaines,
		compte,
		typesRelation,
		relationsTechniques,
		onSupprimer,
		relations,
		onCreer,
		onEnregistrer,
		refus = null
	}: Proprietes = $props();

	/**
	 * L'USAGE ATTENDU EST UN TEXTE DU GEL (`V-30:2875`), recopié depuis lui : la
	 * donnée porte les deux libellés de chaque type de relation, jamais la phrase
	 * qui dit quand l'employer — la dériver serait inventer.
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
	 * LA LISTE : LE CATALOGUE SERVI, ET RIEN QUE LUI. Un type `remplace` y était
	 * ajouté — un littéral du gel qu'aucune table ne porte, retenu par une
	 * comparaison d'identité au jeu de démonstration : une route qui oubliait la
	 * propriété servait donc, à côté des types réels, une ligne qui ne
	 * correspondait à rien. Même geste que « Téléphonie » de `V-28`.
	 */
	const types: readonly TypeDeRelationRendu[] = $derived(
		(Object.keys(typesRelation) as readonly CleDeTypeDeRelation[]).map((cle) => ({
			cle,
			direct: typesRelation[cle].sortant,
			inverse: typesRelation[cle].entrant,
			usage: USAGES[cle] ?? '',
			technique: relationsTechniques.includes(cle)
		}))
	);

	/** Les relations déclarées qui portent ce type — calculé, jamais écrit. */
	function usage(cle: string): number {
		return relations.filter((r) => r.type === cle).length;
	}

	/**
	 * LES COUPLES D'ÉPREUVE DE L'APERÇU VIENNENT DU CORPUS, ET DE LUI SEUL. Le gel
	 * en écrivait trois en dur — des serveurs qui n'existent nulle part sur une
	 * instance réelle. On prend un couple par type de relation déclaré, dans l'ordre
	 * du graphe, puis on complète avec les notes prises deux à deux. Moins de deux
	 * notes : aucun couple, et l'aperçu le dit.
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

	/* L'état, tel que le vecteur de planche le décrit. Le panneau et le dialogue ne
	   s'ouvrent que si la position DÉVIE du réglage par défaut : la maquette ne les
	   ouvre que sur l'événement `change`, jamais au chargement (`V-30:3230`). */
	const reglage = $derived(vecteur ?? {});
	const form = $derived(String(reglage['form'] ?? 'ferme'));
	const sup = $derived(String(reglage['sup'] ?? 'utilise'));

	/**
	 * LE PANNEAU S'OUVRE, ET C'EST LA VUE QUI LE TIENT : `ouverture` vaut `null`
	 * tant que personne n'a cliqué, si bien que l'écran rendu est celui que le
	 * vecteur décrit.
	 */
	let ouverture = $state<'creation' | 'edition' | null>(null);
	let cible = $state<string | null>(null);

	let fDirect = $state('');
	let fInverse = $state('');
	let fUsage = $state('');
	let fTechnique = $state(false);
	/**
	 * LE COUPLE D'ÉPREUVE RETENU — « Changez les sujets pour éprouver la formulation
	 * sur un autre couple » (`V-30:507`). C'est un réglage de l'aperçu, pas une
	 * donnée. On en tient le RANG, pas la valeur : `COUPLES` est dérivé du corpus et
	 * se recalcule.
	 */
	let rangDuCouple = $state(0);
	const coupleRetenu = $derived(COUPLES[rangDuCouple] ?? COUPLES[0] ?? null);
	/** Les messages de `#erreur-direct` et `#erreur-inverse`, quand l'écran refuse. */
	let erreursLocales = $state<readonly RefusDeSaisie[]>([]);
	/**
	 * LE PANNEAU EST OUVERT SI UN GESTE L'A OUVERT, OU SI LE VECTEUR LE DEMANDE.
	 * C'est cette valeur qui pose `data-form` sur `div.app`, et c'est elle que la
	 * règle gelée attend pour lever `translateX(100%)`.
	 *
	 * ELLE EST DÉCLARÉE APRÈS `ouverture`, ET CE N'EST PAS UN DÉTAIL DE STYLE : au
	 * rendu SERVEUR, `$derived` est évalué à la ligne où il est écrit, et placée plus
	 * haut cette dérivation lisait une variable encore en zone morte — les quatre
	 * écrans sortaient en 500.
	 */
	const panneauOuvert = $derived(ouverture !== null || form !== 'ferme');

	/* LE TYPE ÉDITÉ EST LE PREMIER DU CATALOGUE SERVI. La position se nomme
	   « Édition · héberge » (`V-30:3234`), premier type du jeu : le désigner par son
	   rang dit la même chose sans écrire un type de démonstration. */
	const edite = $derived(
		ouverture === 'creation'
			? null
			: ouverture === 'edition'
				? (types.find((t) => t.cle === cible) ?? null)
				: form === 'edition'
					? (types[0] ?? null)
					: null
	);
	const relationsEditees = $derived(edite ? usage(edite.cle) : 0);

	const directSaisi = $derived(ouverture !== null ? fDirect : edite ? edite.direct : '');
	const inverseSaisi = $derived(ouverture !== null ? fInverse : edite ? edite.inverse : '');
	const usageSaisi = $derived(ouverture !== null ? fUsage : edite ? edite.usage : '');
	const techniqueSaisi = $derived(
		ouverture !== null ? fTechnique : edite ? edite.technique : false
	);

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

	function fermerForm(): void {
		ouverture = null;
		cible = null;
		erreursLocales = [];
	}

	/**
	 * `form-valider` — LA VALIDATION DE L'ÉCRAN, celle du gel (`V-30:3086-3098`),
	 * dans son ordre : libellé direct manquant, libellé inverse manquant ou
	 * identique au direct, puis doublon — ce dernier seulement si les deux premiers
	 * passent. `creerUnTypeDeRelation()` refuse de la même façon ; ceci n'en est que
	 * le reflet.
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
	 * LE TYPE DONT LA SUPPRESSION EST EXAMINÉE — le premier type sans relation pour
	 * « Type inutilisé », le premier du catalogue pour « Type utilisé »
	 * (`V-30:3237`). `null` au rendu serveur.
	 */
	let demande = $state<string | null>(null);
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

	/**
	 * LA RÉAFFECTATION N'EST OFFERTE QUE S'IL EXISTE UN TYPE POUR L'ACCUEILLIR.
	 * Supprimer le dernier type employé était une IMPASSE MUETTE : `autresTypes` est
	 * vide quand le catalogue n'en porte qu'un, le sélecteur sortait sans aucune
	 * option, et « Appliquer » envoyait une cible vide que le geste refuse — on
	 * cliquait, et rien ne se passait. LA SORTIE RENDUE EST DONC CELLE QUI PEUT
	 * ABOUTIR, et ce qu'« Appliquer » envoie est ce que l'écran affiche.
	 */
	const reaffectationPossible = $derived(autresTypes.length > 0);
	const sortieEffective = $derived<'reaffecter' | 'supprimer'>(
		reaffectationPossible ? sortie : 'supprimer'
	);
	const cibleDAccueil = $derived(versLeType || (autresTypes[0]?.cle ?? ''));

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

	function refermer(): void {
		demande = null;
		sortie = 'reaffecter';
		versLeType = '';
	}
</script>

<!-- LA VERSION DU PIED DE RAIL VIENT DU CONTEXTE DE COQUILLE, JAMAIS D'ICI : la
	vue passait le numéro du jeu de démonstration comme un fait. -->
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
	version=""
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
							>{n} {accord(n, 'relation')}</span
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
					<!--
						L'ÉTAT VIDE, PARCE QUE LE PRODUIT COMMENCE VIDE. Une instance neuve ne
						porte aucun type de relation : l'écran se réduisait à une ligne d'en-têtes
						suivie de blanc.
					-->
				{:else}
					<div class="zone-etat" id="liste-vide">
						<div class="zone-etat__titre">Aucun type de relation</div>
						<div class="zone-etat__txt">
							{`Sans vocabulaire de liaison, aucune ${motFicheMinuscule} ne peut être reliée à une autre et le graphe reste sans arête. Le bouton « Nouveau type », en haut à droite, crée le premier couple de libellés.`}
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
						placeholder="succède à"
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
						placeholder="est suivi de"
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
										<b>{relationsASupprimer}</b>{accord(
											relationsASupprimer,
											`relation déclarée entre des ${motFichePlurielMinuscule}`,
											`relations déclarées entre des ${motFichePlurielMinuscule}`
										)}
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
										disabled={!reaffectationPossible}
										checked={sortieEffective === 'reaffecter'}
										onchange={() => (sortie = 'reaffecter')}
									/><span style="flex:1"
										>Réaffecter à un autre type<select
											class="selecteur"
											style="margin-top:var(--e-2);width:100%;padding:6px var(--e-2);border:1px solid var(--c-trait-fort);border-radius:var(--r-2);background:var(--c-papier);font-family:var(--f-ui);font-size:var(--t-petit)"
											disabled={!reaffectationPossible}
											value={cibleDAccueil}
											onchange={(e) => (versLeType = e.currentTarget.value)}
											>{#each autresTypes as t (t.cle)}<option value={t.cle}
													>{t.direct} / {t.inverse}</option
												>{:else}<option value="">Aucun autre type de relation n'existe</option
												>{/each}</select
										><span class="aide"
											>{reaffectationPossible
												? accord(
														relationsASupprimer,
														'La relation est conservée et change',
														`Les ${relationsASupprimer} relations sont conservées et changent`
													) + " d'étiquette. Le graphe garde sa structure."
												: 'C’est le seul type de relation du catalogue : il n’y a nulle part où déplacer ces liens. Fermez cette boîte, créez un autre type avec « Nouveau type », et la réaffectation sera possible.'}</span
										></span
									></label
								><label
									><input
										type="radio"
										name="sortie"
										value="supprimer"
										checked={sortieEffective === 'supprimer'}
										onchange={() => (sortie = 'supprimer')}
									/><span style="flex:1"
										>Supprimer aussi {accord(
											relationsASupprimer,
											'cette relation',
											`ces ${relationsASupprimer} relations`
										)}<span class="aide"
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
								sortie: relationsASupprimer === 0 ? 'supprimer' : sortieEffective,
								vers: cibleDAccueil
							});
						}}>{aSupprimer && relationsASupprimer === 0 ? 'Supprimer' : 'Appliquer'}</button
					>
				</div>
			</div>
		</dialog>
	{/snippet}
</Coquille>
