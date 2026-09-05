<script lang="ts">
	/**
	 * V-10 — PAGE D'UN UNIVERS. Route `/univers/{univers}` (`docs/routes.md` §3.3).
	 *
	 * Trois blocs, dans cet ordre : le BANDEAU (identité, statistiques, bande des
	 * compteurs de vivacité), la carte DOMAINES (une ligne par domaine), puis les
	 * deux cartes À SURVEILLER et ACTIVITÉ RÉCENTE.
	 *
	 * TOUT CE QUE CET ÉCRAN AFFICHE VIENT DU CHARGEUR, ET RIEN N'EST RECALCULÉ ICI.
	 * La répartition d'un univers est l'agrégat des registres RÉFÉRENCE de ses notes
	 * (`SPEC-modele-navigation.md`) : elle est produite par `vivacite()`, la fabrique
	 * unique, dans `+page.server.ts`. La vue reçoit des comptes, elle les rend.
	 *
	 * LES GESTES SONT DES LIENS, ET C'EST DÉLIBÉRÉ. La ligne d'un domaine, les deux
	 * alertes, la cartographie, « + Créer » : chacun est une ancre dont l'adresse est
	 * composée par le chargeur, qui seul connaît les identifiants persistés
	 * (`RG-M12-11`). Un câblage d'événements au montage ne laissait aucune trace
	 * quand il se débranchait — la page rendait, et plus rien ne cliquait.
	 *
	 * LE PRODUIT COMMENCE VIDE, et les trois vides ont chacun leur phrase : un
	 * univers sans domaine, un univers sans note, un domaine sans note. Aucun ne rend
	 * un zéro muet.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-10.css`.
	 */
	import { getContext } from 'svelte';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import GlypheDeVivacite from '$lib/GlypheDeVivacite.svelte';
	import Pictogramme from '$lib/console/Pictogramme.svelte';
	import { COMPTE_VIDE } from '$lib/coquille/compte-vide';
	import { glypheDUnivers } from '$lib/coquille/glyphes';
	import {
		CLE_IDENTITE,
		type CompteAffiche,
		type IdentiteDeCoquille
	} from '$lib/coquille/identite';
	import { ETATS_DE_VIVACITE, type EtatDeVivacite } from '$lib/fraicheur';
	import { accord } from '$lib/vocabulaire';
	import type { TypeDEvenement } from '../../seeds/corpus';

	/** L'univers ouvert — son identité, et rien de son contenu. */
	interface UniversAffiche {
		readonly nom: string;
		readonly description: string;
		/** La clé de glyphe choisie en console — `$lib/coquille/glyphes.ts`. */
		readonly glyphe: string;
	}

	/** Un compteur d'état. Les cinq sont toujours servis, y compris à zéro. */
	interface CompteurDEtat {
		readonly etat: EtatDeVivacite;
		readonly n: number;
	}

	/** Une ligne de la carte DOMAINES. */
	interface LigneDeDomaine {
		readonly nom: string;
		readonly description: string;
		/** L'adresse de sa page — composée par le chargeur sur l'identifiant persisté. */
		readonly adresse: string;
		/** La répartition de SES notes : cinq entrées, dans l'ordre des compteurs. */
		readonly repartition: readonly CompteurDEtat[];
		/** L'ancienneté de sa dernière activité, en heures. `null` : aucune. */
		readonly heures: number | null;
	}

	/** Un événement du fil. `objet` nomme la note, ou décrit le lot d'import. */
	interface EvenementDUnivers {
		readonly type: TypeDEvenement;
		readonly qui: string;
		readonly objet: string;
		/** L'adresse de la note visée, ou la chaîne vide — un import n'en vise aucune. */
		readonly adresse: string;
		readonly heures: number;
	}

	/** Les adresses que l'écran ouvre. Composées par le chargeur, jamais ici. */
	interface AdressesDeLUnivers {
		readonly cartographie: string;
		/** La liste réelle des notes de cet univers dont la validité est dépassée. */
		readonly surveillance: string;
		/** Là où l'on crée un domaine — la console, seul écran qui en écrive un. */
		readonly creationDeDomaine: string;
		/** La rédaction d'une note — le « + Créer » de l'en-tête. */
		readonly creationDeNote: string;
		/** Le profil du compte connecté — l'avatar de l'en-tête. */
		readonly profil: string;
	}

	interface Proprietes {
		univers: UniversAffiche;
		/** L'agrégat des registres RÉFÉRENCE — cinq entrées, ordre `ORDRE_DES_ETATS`. */
		repartition: readonly CompteurDEtat[];
		/** Les domaines LISIBLES de l'univers. Vide : l'univers n'en porte aucun. */
		domaines: readonly LigneDeDomaine[];
		/** Les comptes distincts qui ont rédigé une de ses notes. */
		contributeurs: number;
		/** L'ancienneté de la dernière activité de l'univers, en heures. */
		heuresDepuisLActivite: number | null;
		/** Le fil, du plus récent au plus ancien. Vide : la semaine n'a rien porté. */
		activite: readonly EvenementDUnivers[];
		/** Le seuil « bientôt », en jours : la phrase de l'alerte le nomme. */
		seuilBientot: number;
		adresses: AdressesDeLUnivers;
		/** L'utilisateur connecté. `null` : aucun compte connu. */
		compte?: CompteAffiche | null;
		/** En lecture seule, les actions d'écriture ne sont pas ÉMISES (`P-09`). */
		droits?: 'ecriture' | 'lecture';
	}

	const {
		univers,
		repartition,
		domaines,
		contributeurs,
		heuresDepuisLActivite,
		activite,
		seuilBientot,
		adresses,
		compte: compteConnecte = null,
		droits = 'ecriture'
	}: Proprietes = $props();

	/**
	 * L'IDENTITÉ RÉELLE L'EMPORTE SUR LA PROPRIÉTÉ — la même règle que la coquille,
	 * et pour la même raison : l'avatar de l'en-tête est celui du compte connecté,
	 * que le gabarit racine sert par contexte. Hors application, `getContext` rend
	 * `undefined` et la propriété reprend la main.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const compteEffectif = $derived(identite?.compte ?? compteConnecte);

	const ecriture = $derived(droits !== 'lecture');

	/* ── Les mesures du bandeau ──────────────────────────────────────────── */

	const total = $derived(repartition.reduce((somme, c) => somme + c.n, 0));
	/** Les compteurs NON NULS, dans l'ordre des états. Un zéro n'est pas un fait. */
	const compteursPresents = $derived(repartition.filter((c) => c.n > 0));

	function compte(etat: EtatDeVivacite, ou: readonly CompteurDEtat[]): number {
		return ou.find((c) => c.etat === etat)?.n ?? 0;
	}

	/**
	 * L'ANCIENNETÉ EN CLAIR, dans la forme abrégée de la référence — « il y a 2 h »,
	 * « il y a 1 j ». `null` rend le tiret : aucune activité n'est pas « il y a 0 h ».
	 */
	function depuis(heures: number | null): string {
		if (heures === null) return '—';
		if (heures < 1) return "à l'instant";
		if (heures < 24) return `il y a ${heures} h`;
		return `il y a ${Math.round(heures / 24)} j`;
	}

	/** Les quatre statistiques de la ligne, dans l'ordre de la référence. */
	const statistiques = $derived([
		{ cle: 'notes', valeur: String(total), libelle: accord(total, 'note') },
		{
			cle: 'domaines',
			valeur: String(domaines.length),
			libelle: accord(domaines.length, 'domaine')
		},
		{
			cle: 'contributeurs',
			valeur: String(contributeurs),
			libelle: accord(contributeurs, 'contributeur')
		},
		{
			cle: 'activite',
			valeur: depuis(heuresDepuisLActivite),
			libelle: 'dernière activité'
		}
	]);

	/* ── Les alertes de la carte « À surveiller » ─────────────────────────── */

	interface Alerte {
		readonly etat: EtatDeVivacite;
		readonly n: number;
		readonly titre: string;
		readonly detail: string;
	}

	/**
	 * LES DEUX ALERTES, ET RIEN QUE CE QUI EST VRAI. La première rassemble les trois
	 * états en retard — l'échéance est passée —, et porte le glyphe du PIRE d'entre
	 * eux : annoncer une note obsolète avec le demi-disque d'« À vérifier »
	 * minimiserait ce que la page est là pour signaler. La seconde annonce l'échéance
	 * qui vient, et nomme le seuil qui la définit.
	 */
	const alertes = $derived.by((): readonly Alerte[] => {
		const liste: Alerte[] = [];
		const enRetard = ['averifier', 'arevoir', 'obsolete'] as const;
		const cumul = enRetard.reduce((somme, etat) => somme + compte(etat, repartition), 0);
		if (cumul > 0) {
			const pire = [...enRetard].reverse().find((etat) => compte(etat, repartition) > 0);
			liste.push({
				etat: pire ?? 'averifier',
				n: cumul,
				titre: `${accord(cumul, 'note')} ${accord(cumul, 'nécessite', 'nécessitent')} votre attention`,
				detail: `${accord(cumul, 'Sa', 'Leur')} période de validité est dépassée`
			});
		}
		const bientot = compte('bientot', repartition);
		if (bientot > 0) {
			liste.push({
				etat: 'bientot',
				n: bientot,
				titre: `${accord(bientot, 'note')} ${accord(bientot, 'arrive', 'arrivent')} bientôt à échéance`,
				detail: `Vérification prévue dans les ${seuilBientot} prochains jours`
			});
		}
		return liste;
	});

	/* ── Le tri des domaines — le sélecteur trie vraiment ─────────────────── */

	const TRIS = [
		{ cle: 'activite', libelle: 'Activité récente' },
		{ cle: 'notes', libelle: 'Nombre de notes' },
		{ cle: 'nom', libelle: 'Nom' }
	] as const;

	let tri = $state<(typeof TRIS)[number]['cle']>('activite');

	function notesDe(d: LigneDeDomaine): number {
		return d.repartition.reduce((somme, c) => somme + c.n, 0);
	}

	/** Un domaine sans activité passe en queue, jamais en tête. */
	const domainesTries = $derived(
		[...domaines].sort((a, b) => {
			if (tri === 'nom') return a.nom.localeCompare(b.nom, 'fr');
			if (tri === 'notes') return notesDe(b) - notesDe(a) || a.nom.localeCompare(b.nom, 'fr');
			return (a.heures ?? Infinity) - (b.heures ?? Infinity) || a.nom.localeCompare(b.nom, 'fr');
		})
	);

	/**
	 * LES TROIS COLONNES D'UNE LIGNE DE DOMAINE : à jour, bientôt, puis TOUT CE QUI
	 * EST EN RETARD réuni. La couleur de la troisième est celle du PIRE état présent
	 * — c'est ce que la ligne doit crier, et une teinte d'« À vérifier » sur deux
	 * notes obsolètes ne le crierait pas.
	 *
	 * L'ENCRE DU CHIFFRE DIT AUTRE CHOSE QUE SA COULEUR : un compte nul est gris, un
	 * compte « à jour » est encre, tout autre compte prend la teinte de son état.
	 */
	interface ColonneDeDomaine {
		readonly etat: EtatDeVivacite;
		readonly n: number;
		readonly classe: string;
	}

	function colonnes(d: LigneDeDomaine): readonly ColonneDeDomaine[] {
		const retard = (['averifier', 'arevoir', 'obsolete'] as const).reduce(
			(somme, etat) => somme + compte(etat, d.repartition),
			0
		);
		const pire =
			(['obsolete', 'arevoir', 'averifier'] as const).find(
				(etat) => compte(etat, d.repartition) > 0
			) ?? 'averifier';
		return [
			{ etat: 'ajour', n: compte('ajour', d.repartition), classe: 'ligne-dom__nb--ajour' },
			{
				etat: 'bientot',
				n: compte('bientot', d.repartition),
				classe: 'ligne-dom__nb--bientot'
			},
			{ etat: pire, n: retard, classe: `ligne-dom__nb--${pire}` }
		];
	}

	/* ── Le fil d'activité — cinq types, cinq traitements ─────────────────── */

	/**
	 * LES CINQ TYPES DU FIL. Le titre, le badge, la classe du disque et l'icône
	 * blanche qu'il porte. Ils sont ceux que la base TRACE : `verification`,
	 * `edition`, `publication` (la note est née), `revision` (un humain l'a signalée)
	 * et `import`. Le prototype montre « Échéance atteinte » à la place de la demande
	 * de révision ; l'une comme l'autre est un fait de VIVACITÉ, et c'est celui dont
	 * la base porte la trace signée qui est rendu.
	 */
	const FILS: Readonly<
		Record<TypeDEvenement, { titre: string; badge: string; classe: string; icone: string }>
	> = {
		verification: {
			titre: 'Note vérifiée',
			badge: 'Vérification',
			classe: 'trace__disque--verification',
			icone: 'M3 8.5l3.5 3.5L13 4.5'
		},
		edition: {
			titre: 'Note modifiée',
			badge: 'Note',
			classe: 'trace__disque--edition',
			icone: 'M11 2.5l2.5 2.5L5 13.5H2.5V11z'
		},
		publication: {
			titre: 'Nouvelle note',
			badge: 'Note',
			classe: 'trace__disque--publication',
			icone: 'M8 3v10M3 8h10'
		},
		revision: {
			titre: 'Révision demandée',
			badge: 'Vivacité',
			classe: 'trace__disque--revision',
			icone: 'M8 4.5V8l2.5 1.5'
		},
		import: {
			titre: 'Import terminé',
			badge: 'Import',
			classe: 'trace__disque--import',
			icone: 'M8 2v8M5 7l3 3 3-3M2.5 13h11'
		}
	};

	/* ── Les pictogrammes de la vue ───────────────────────────────────────── */

	/** Les icônes des quatre statistiques, dans le même ordre qu'elles. */
	const ICONES_DE_STATISTIQUE: Readonly<Record<string, string>> = {
		notes: 'M4 2.5h6l2.5 2.5v8.5H4zM6 8h4M6 10.5h4',
		domaines: 'M1.5 4.5h4l1.5 1.5h7.5v7.5h-13z',
		contributeurs: 'M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.5 14.5a5.5 5.5 0 0 1 11 0',
		activite: 'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM8 4.5V8l2.5 1.5'
	};

	/**
	 * Le séparateur entre le type d'un événement et son objet. Il est nommé, et non
	 * écrit au balisage : Svelte élague les blancs en bord d'élément, et l'espace qui
	 * précède le tiret est le premier caractère de son span.
	 */
	const SEPARATEUR_DE_TRACE = ' — ';

	/** Le domaine — la même chemise que le rail, à 18 px. */
	const ICONE_DE_DOMAINE = 'M1.5 4.5h4l1.5 1.5h7.5v7.5h-13z';
	const CHEVRON = 'M6 3l5 5-5 5';
</script>

<!-- `svelte/no-navigation-without-resolve` EST DÉSACTIVÉE POUR CE BALISAGE : toutes
	les adresses viennent du chargeur, qui les compose par `$lib/rangement/adresses`
	sur les identifiants PERSISTÉS ; la règle ne sait pas les suivre jusque là. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<!-- Le chevron de fin de ligne — trois emplois, un seul tracé. -->
{#snippet chevron()}
	<svg
		class="chevron"
		width="14"
		height="14"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		aria-hidden="true"><path d={CHEVRON} /></svg
	>
{/snippet}

<Coquille
	forme="abregee"
	classeContenu="univers"
	fil={['Accueil', univers.nom]}
	courant={[]}
	{droits}
	univers={[]}
	domaines={[]}
	notes={[]}
	compte={compteConnecte ?? COMPTE_VIDE}
	version=""
>
	{#snippet actionsDEntete()}
		{#if ecriture}<a class="btn" href={adresses.creationDeNote}
				><svg
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg
				>Créer</a
			>{/if}
		<a
			class="avatar-entete"
			href={adresses.profil}
			title={compteEffectif?.nom ?? 'Mon profil'}
			aria-label={compteEffectif === null ? 'Mon profil' : `${compteEffectif.nom} — mon profil`}
			>{compteEffectif?.initiales || '—'}</a
		>
	{/snippet}

	{#snippet enfants()}
		<!-- ── 1. LE BANDEAU ────────────────────────────────────────────── -->
		<section class="bandeau" aria-labelledby="titre">
			<div class="bandeau__haut">
				<span class="bandeau__sceau" aria-hidden="true">
					<Pictogramme
						traits={glypheDUnivers(univers.glyphe)}
						taille="36"
						boite="0 0 24 24"
						epaisseur="1.4"
					/>
				</span>
				<div class="bandeau__corps">
					<span class="etiq">Univers</span>
					<h1 id="titre">{univers.nom}</h1>
					{#if univers.description}<p class="bandeau__desc">{univers.description}</p>{/if}
					<div class="bandeau__stats">
						{#each statistiques as s (s.cle)}
							<span class="stat"
								><svg
									width="15"
									height="15"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"
									aria-hidden="true"><path d={ICONES_DE_STATISTIQUE[s.cle] ?? ''} /></svg
								><b>{s.valeur}</b>{' ' + s.libelle}</span
							>
						{/each}
					</div>
				</div>
				<a class="btn bandeau__carto" href={adresses.cartographie}
					><svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.4"
						aria-hidden="true"
						><circle cx="4" cy="4" r="2" /><circle cx="12" cy="6" r="2" /><circle
							cx="7"
							cy="12.5"
							r="2"
						/><path d="M5.8 4.6l4.3 1M11 7.7l-3 3.2M5.2 5.6l1.3 5" /></svg
					>Cartographie des univers →</a
				>
			</div>

			<!-- LA BANDE DES COMPTEURS — un par état NON NUL. Sans note, elle nomme le
			     geste qui la remplira plutôt que d'aligner cinq zéros. -->
			<div class="bandeau__compteurs">
				{#if total === 0}
					<span class="bandeau__aucune"
						>Cet univers ne porte encore aucune note{domaines.length
							? ' : rédigez-en une dans l’un de ses domaines pour lui donner une vivacité.'
							: '.'}</span
					>
				{:else}
					{#each compteursPresents as c (c.etat)}
						<span class="compteur"
							><GlypheDeVivacite etat={c.etat} taille={12} /><b>{c.n}</b>{' ' +
								ETATS_DE_VIVACITE[c.etat].libelle.toLowerCase()}</span
						>
					{/each}
					<span class="bandeau__total"
						><b>{total}</b>{' ' + accord(total, 'note') + ' au total'}</span
					>
				{/if}
			</div>
		</section>

		<!-- ── 2. LES DOMAINES ──────────────────────────────────────────── -->
		<section class="panneau" aria-labelledby="t-domaines">
			<div class="panneau__tete">
				<span class="etiq" id="t-domaines">Domaines</span>
				<span class="tete__droite">
					<span class="tete__compte"
						>{domaines.length
							? `${domaines.length} ${accord(domaines.length, 'domaine')}`
							: 'aucun domaine'}</span
					>
					{#if domaines.length > 1}
						<label class="tri">
							<span class="tri__lib">Trier les domaines</span>
							<select class="tri__select" bind:value={tri}>
								{#each TRIS as t (t.cle)}<option value={t.cle}>{t.libelle}</option>{/each}
							</select>
						</label>
					{/if}
				</span>
			</div>

			{#if domaines.length === 0}
				<!-- L'UNIVERS SANS DOMAINE — l'état vide nomme le geste, et l'ouvre. -->
				<div class="vide-univers">
					<h2>Cet univers ne contient aucun domaine</h2>
					<p>
						Un univers ne porte de note que par ses domaines. Créez-en un pour commencer à y ranger
						des notes.
					</p>
					{#if ecriture}<a class="btn btn--principal" href={adresses.creationDeDomaine}
							>{'Créer un domaine dans ' + univers.nom}</a
						>{/if}
				</div>
			{:else}
				<div class="lignes-dom">
					{#each domainesTries as d (d.nom)}
						{@const n = notesDe(d)}
						<a class="ligne-dom" href={d.adresse}>
							<span class="ligne-dom__sceau" aria-hidden="true"
								><svg
									width="18"
									height="18"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"><path d={ICONE_DE_DOMAINE} /></svg
								></span
							>
							<span class="ligne-dom__nom">
								<span class="ligne-dom__titre">{d.nom}</span>
								{#if d.description}<span class="ligne-dom__desc">{d.description}</span>{/if}
							</span>
							<!-- UN DOMAINE VIDE AFFICHE « — » PARTOUT, jamais des zéros : un zéro
							     compté et un ensemble vide ne disent pas la même chose. -->
							<span class="ligne-dom__n"
								>{#if n === 0}<i class="ligne-dom__rien">—</i>{:else}<b>{n}</b>{/if}{' ' +
									accord(n, 'note')}</span
							>
							<span class="ligne-dom__etats">
								{#each colonnes(d) as c (c.classe)}
									<span class="ligne-dom__etat"
										><GlypheDeVivacite etat={c.etat} taille={10} />{#if n === 0}<i
												class="ligne-dom__rien">—</i
											>{:else}<b class="ligne-dom__nb {c.n === 0 ? '' : c.classe}">{c.n}</b
											>{/if}<span class="ligne-dom__etat-lib"
											>{ETATS_DE_VIVACITE[c.etat].libelle}</span
										></span
									>
								{/each}
							</span>
							<span class="ligne-dom__quand">{depuis(d.heures)}</span>
							{@render chevron()}
						</a>
					{/each}
				</div>
			{/if}
		</section>

		<!-- ── 3. À SURVEILLER · ACTIVITÉ RÉCENTE ───────────────────────── -->
		<div class="duo">
			<section class="panneau panneau--carte" aria-labelledby="t-surveiller">
				<span class="etiq" id="t-surveiller">À surveiller</span>
				{#if total === 0}
					<p class="carte__vide">
						Aucune note à surveiller : cet univers n’en porte encore aucune.
					</p>
				{:else if alertes.length === 0}
					<p class="carte__calme">
						<svg
							width="18"
							height="18"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							aria-hidden="true"
							><circle cx="8" cy="8" r="6.5" /><path d="M5 8.5l2 2 4-4.5" stroke-width="1.8" /></svg
						>Rien à surveiller : toutes les notes de cet univers sont à jour.
					</p>
				{:else}
					{#each alertes as a (a.etat)}
						<a class="alerte" href={adresses.surveillance}>
							<span class="alerte__pastille alerte__pastille--{a.etat}"
								><GlypheDeVivacite etat={a.etat} taille={18} /></span
							>
							<span class="alerte__corps">
								<span class="alerte__titre"
									><b class="alerte__n alerte__n--{a.etat}">{a.n}</b>{' ' + a.titre}</span
								>
								<span class="alerte__detail">{a.detail}</span>
							</span>
							{@render chevron()}
						</a>
					{/each}
				{/if}
				{#if total > 0}
					<a class="carte__lien" href={adresses.surveillance}
						><span class="carte__fleche" aria-hidden="true">→</span>Voir toutes les notes à
						surveiller</a
					>
				{/if}
			</section>

			<section class="panneau panneau--carte" aria-labelledby="t-activite">
				<span class="etiq" id="t-activite">Activité récente</span>
				{#if activite.length === 0}
					<p class="carte__vide">
						Rien de neuf cette semaine : aucune note de cet univers n’a été créée, modifiée ni
						vérifiée.
					</p>
				{:else}
					<ul class="fil-activite">
						{#each activite as e, rang (rang)}
							{@const f = FILS[e.type]}
							<li class="trace" class:trace--dernier={rang === activite.length - 1}>
								<span class="trace__disque {f.classe}" aria-hidden="true"
									><svg
										width="12"
										height="12"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="2"><path d={f.icone} /></svg
									></span
								>
								<span class="trace__corps">
									<span class="trace__titre"
										><b>{f.titre}</b><span class="trace__objet"
											>{SEPARATEUR_DE_TRACE}{#if e.adresse}<a href={e.adresse}>{e.objet}</a
												>{:else}{e.objet}{/if}</span
										></span
									>
									<span class="trace__quand">{'par ' + e.qui + ' · ' + depuis(e.heures)}</span>
								</span>
								<span class="trace__badge">{f.badge}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>
	{/snippet}
</Coquille>
