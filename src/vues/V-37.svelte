<script lang="ts">
	/**
	 * V-37 — Coquille applicative. Le catalogue de la coquille, pas une route
	 * (`docs/routes.md` §3.8) : c'est un catalogue du gabarit, comme V-41 l'est des
	 * composants. Le gabarit lui-même vit dans `src/lib/coquille/`.
	 *
	 * ZONES COMPARÉES — `aside.rail` et `header.barre`, la coquille proprement dite.
	 * Le tableau de bord que la maquette embarque est le contenu de V-07, la note de
	 * démonstration celui de V-14 : ils ne sont PAS rendus ici, et la zone de contenu
	 * reste vide — fait déclaré, pas un oubli.
	 */
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		UNIVERS,
		corpusDeVariante,
		noteParIdentifiant,
		type Domaine,
		type EtatDInstance,
		type Note,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import type { Notification } from '$lib/coquille/notifications';

	interface Proprietes {
		vecteur: Record<string, string | boolean> | null;
		notes: readonly Note[];
		/** LES QUATRE SOURCES DE LA COQUILLE. Absentes, les constantes du jeu de
		    semence s'appliquent ; fournies par une route, elles l'emportent. */
		/** Les univers déclarés. Absente, `UNIVERS` du jeu de semence. */
		univers?: readonly Univers[];
		/** Les domaines du périmètre du compte. Absente, `DOMAINES` du jeu de semence. */
		domaines?: readonly Domaine[];
		/** Le compte connecté. Absente, `MOI` du jeu de semence. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, `INSTANCE` du jeu de semence. */
		instance?: EtatDInstance;
	}

	const {
		vecteur,
		notes,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE
	}: Proprietes = $props();

	/** La note de démonstration du contenu « lecture » — celle de V-14 et V-15. */
	const NOTE_DEMONSTRATION = 'n-restaurer-pg';

	/**
	 * La branche dont la maquette démontre le chargement (`V-37:3620`). C'est une
	 * mise en scène du catalogue, pas une donnée : le produit signale le chargement
	 * de la branche qu'il charge.
	 */
	const BRANCHE_EN_CHARGEMENT = 'd:Applications';
	/**
	 * La notification que la maquette montre à cet instant (`V-37:3124`).
	 * DIVERGENCE DÉCLARÉE : V-37 embarque un notificateur RÉDUIT — sans marque, sans
	 * fermeture (`V-37:3080`) —, sous un commentaire qui renvoie lui-même à V-38. Le
	 * composant de référence est celui de V-38 (`V-38:2263`), où la forme courte
	 * `notifier(texte)` vaut le type « info » : c'est ce que la coquille rend.
	 */
	const NOTIFICATION_CHARGEMENT: Notification = {
		type: 'info',
		titre: "Chargement de l'arborescence d'Applications — signalé sur la branche seule"
	};

	/**
	 * L'attribut de données que la maquette pose sur `div.app` (`V-37:1195`). Il est
	 * INERTE, et le gel le veut ainsi : la règle qui l'exploite vise `body`
	 * (`V-37.css:638`), et seule V-03 le pose au bon endroit. Le porter sur `<body>`
	 * « corrigerait » le gel et CHANGERAIT le rendu.
	 */
	const ATTRIBUTS_DE_VUE = { 'data-numerote': 'non' };

	const reglage = $derived(vecteur ?? {});
	const contenu = $derived(reglage['cont'] === 'lecture' ? 'lecture' : 'bord');
	const rail = $derived(reglage['rail'] === 'ferme' ? 'ferme' : 'ouvert');
	const role = $derived(reglage['role'] === 'admin' ? 'admin' : 'referent');
	const enChargement = $derived(reglage['c-chargement'] === true);
	/** Aucun domaine accessible : le compte existe, son périmètre est vide. */
	const sansPerimetre = $derived(reglage['c-vide'] === true);

	const note = noteParIdentifiant(NOTE_DEMONSTRATION);
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
	{univers}
	domaines={sansPerimetre ? [] : domaines}
	notes={sansPerimetre ? corpusDeVariante('vide') : notes}
	compte={{
		nom: compte.nom,
		initiales: compte.initiales,
		role: compte.role,
		domaine: compte.domaine
	}}
	version={instance.version}
	donnees={ATTRIBUTS_DE_VUE}
	brancheEnChargement={enChargement ? BRANCHE_EN_CHARGEMENT : null}
	notifications={enChargement ? [NOTIFICATION_CHARGEMENT] : []}
/>
