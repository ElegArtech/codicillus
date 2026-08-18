<script lang="ts">
	/**
	 * V-37 — Coquille applicative. Le catalogue de la coquille, pas une route.
	 *
	 * `docs/routes.md` §3.8 classe V-37 parmi les six vues sans adresse propre :
	 * c'est un catalogue du gabarit, comme V-41 l'est des composants. Ce fichier
	 * n'existe donc que pour le mode démo — `/__design/V-37?etat=…` — qui est le
	 * seul chemin par lequel le banc atteint un état côté application
	 * (`verif/banc/mode-demo.mjs`, ÉCART-011 É-1). Le gabarit lui-même vit dans
	 * `src/lib/coquille/`, où les trente-cinq vues qui le portent le prendront.
	 *
	 * ZONES COMPARÉES — ARB-012, `verif/references/zones.json` : `aside.rail` et
	 * `header.barre`, la coquille proprement dite. Le tableau de bord que la
	 * maquette embarque est le contenu de V-07, la note de démonstration celui de
	 * V-14 ; chacun est couvert par son propre lot, sur sa propre maquette. Ils ne
	 * sont donc PAS rendus ici : les porter serait sortir du périmètre du lot, et
	 * l'état « vide » de la maquette les rendrait de toute façon incohérents
	 * (ARB-012). La zone de contenu reste vide, et c'est un fait déclaré, pas un
	 * oubli.
	 *
	 * Les huit états sont ceux de `verif/scenarios/V-37.json`, extraits
	 * mécaniquement de la planche de revue de la maquette gelée. Chacun arrive par
	 * son VECTEUR COMPLET — un état est un réglage entier, jamais un delta.
	 */
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		UNIVERS,
		corpusDeVariante,
		noteParIdentifiant,
		type Note
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-37')`, la variante complète. */
		notes: readonly Note[];
	}

	const { vecteur, notes }: Proprietes = $props();

	/** La note de démonstration du contenu « lecture » — celle de V-14 et V-15. */
	const NOTE_DEMONSTRATION = 'n-restaurer-pg';

	/**
	 * La branche dont la maquette démontre le chargement (`V-37:3620`). C'est une
	 * mise en scène du catalogue, pas une donnée du corpus : le produit signale le
	 * chargement de la branche qu'il charge.
	 */
	const BRANCHE_EN_CHARGEMENT = 'd:Applications';
	const NOTIFICATION_CHARGEMENT =
		"Chargement de l'arborescence d'Applications — signalé sur la branche seule";

	const reglage = $derived(vecteur ?? {});
	const contenu = $derived(reglage['cont'] === 'lecture' ? 'lecture' : 'bord');
	const rail = $derived(reglage['rail'] === 'ferme' ? 'ferme' : 'ouvert');
	const role = $derived(reglage['role'] === 'admin' ? 'admin' : 'referent');
	const enChargement = $derived(reglage['c-chargement'] === true);
	/** Aucun domaine accessible : le compte existe, son périmètre est vide. */
	const sansPerimetre = $derived(reglage['c-vide'] === true);

	const note = noteParIdentifiant(NOTE_DEMONSTRATION);
	/** Le rangement de la note, du dossier racine au dossier terminal. */
	const rangement = note
		? note.dossier
				.split('›')
				.map((s) => s.trim())
				.filter(Boolean)
		: [];

	const fil = $derived(
		contenu === 'lecture' && note
			? ['Accueil', note.univers, note.domaine, ...rangement, note.titre]
			: ['Accueil']
	);
	const courant = $derived(contenu === 'lecture' && note ? [note.domaine, ...rangement] : []);
</script>

<Coquille
	{fil}
	{courant}
	{rail}
	{role}
	{contenu}
	univers={UNIVERS}
	domaines={sansPerimetre ? [] : DOMAINES}
	notes={sansPerimetre ? corpusDeVariante('vide') : notes}
	compte={{
		nom: MOI.nom,
		initiales: MOI.initiales,
		role: MOI.role,
		domaine: MOI.domaine
	}}
	version={INSTANCE.version}
	brancheEnChargement={enChargement ? BRANCHE_EN_CHARGEMENT : null}
	notifications={enChargement ? [NOTIFICATION_CHARGEMENT] : []}
/>
