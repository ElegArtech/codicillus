<script lang="ts">
	/**
	 * `/console/univers` — V-27 Console · Univers. La garde et le chargeur sont dans
	 * `+page.server.ts`, à côté de ce fichier.
	 *
	 * CE FICHIER NE FAIT QUE RENDRE CE QUE LE CHARGEUR A RÉSOLU : notes, univers,
	 * domaines et utilisateur courant viennent de la base, et `seeds/corpus.ts` n'est
	 * plus lu ici.
	 *
	 * `compte` EST TOUJOURS PRÉSENT : `resoudreLaConsole()` refuse une session dont
	 * la ligne de compte a disparu, plutôt que de rendre un administrateur sans nom.
	 * Aucune branche de repli ici — une branche que rien n'exerce est une branche
	 * dont on ignore si elle marche.
	 */
	import Vue from '../../../vues/V-27.svelte';
	import '../../../vues/V-27.css';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { envoyerAUneAction } from '../cablage';
	import {
		CHAMP_POSITION,
		CHAMP_UNIVERS_CIBLE,
		champsDUnivers,
		type RefusDeSaisie,
		type SaisieDUnivers
	} from '$lib/console/structure';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LE REFUS RENDU PAR L'ACTION, REMIS À LA VUE. `envoyerAUneAction()` recharge la
	 * page au succès et rend la charge du `fail()` au refus : c'est elle qui porte le
	 * message et le champ visé, et le bloc `#erreur-nom` du gel n'attendait que lui.
	 * Le refus est effacé avant chaque envoi — un message d'un geste précédent qui
	 * survivrait au suivant mentirait sur ce qui vient de se passer.
	 */
	let refus = $state<RefusDeSaisie | null>(null);

	function premierRefus(donnees: unknown): RefusDeSaisie | null {
		if (typeof donnees !== 'object' || donnees === null) return null;
		const erreurs = (donnees as { erreurs?: unknown }).erreurs;
		if (!Array.isArray(erreurs)) return null;
		const [premiere] = erreurs as RefusDeSaisie[];
		return premiere ?? null;
	}

	async function envoyer(action: string, champs: Record<string, string>): Promise<void> {
		refus = null;
		const retour = await envoyerAUneAction(document, action, champs);
		if (!retour.succes) refus = premierRefus(retour.donnees);
	}

	function identifiantDe(nom: string): string | undefined {
		return data.designations[nom];
	}
</script>

<!--
	LA VUE TIENT L'ÉTAT DU DIALOGUE, CETTE PAGE TIENT LE RÉSEAU — même partage
	qu'en `/console/domaines`, et pour la même raison : le décompte du refus se
	compose sur ce que le chargeur a servi à la vue.

	`RG-M14-01` et `RG-STR-01` sont tenues côté serveur par
	`verdictDeSuppressionDUnUnivers()` : un univers qui porte des domaines et
	l'univers système sont refusés là, quoi que l'écran propose. La vue n'offre le
	bouton que dans la branche « possible » (`P-09` : une action interdite n'est
	pas rendue), ce qui ne dispense jamais de refuser.

	L'UNIVERS EST DÉSIGNÉ PAR SON IDENTIFIANT LISIBLE, comme le geste l'attend.
	`data.univers` ne le porte pas — `interface Univers` du jeu de semence n'a que
	le nom —, d'où la table du chargeur, lue en base : c'est le même défaut qui
	rendait 404 sur `/console/domaines`, corrigé de la même façon.

	LA SORTIE DU REFUS mène à `/console/domaines`. Le gel y notifie
	« Console · Domaines, FILTRÉE SUR <univers> » ; aucune adresse de ce dépôt ne
	porte ce filtre — `docs/routes.md` n'en déclare aucun —, et en inventer un
	serait combler. La navigation va donc à l'écran annoncé, sans son filtre.
	Divergence déclarée au rapport, plutôt qu'une entrée inerte (`P-03`).
-->
<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	compte={data.compte}
	onSupprimer={(nom) => {
		const identifiant = data.designations[nom];
		if (identifiant === undefined) return;
		void envoyerAUneAction(document, '?/supprimer', { univers: identifiant });
	}}
	onRattacher={() => {
		void goto(resolve('/console/domaines'));
	}}
	{refus}
	onCreer={(saisie: SaisieDUnivers) => {
		void envoyer('?/creer', champsDUnivers(saisie));
	}}
	onEnregistrer={(nom: string, saisie: SaisieDUnivers) => {
		const identifiant = identifiantDe(nom);
		if (identifiant === undefined) return;
		void envoyer('?/enregistrer', {
			[CHAMP_UNIVERS_CIBLE]: identifiant,
			...champsDUnivers(saisie)
		});
	}}
	onReordonner={(nom: string, ordre: number) => {
		/* LE RANG SEUL, ET RIEN D'AUTRE. `?/enregistrer` ne touche que les champs
		   transmis : une flèche ne recopie donc pas le nom, la description, la
		   couleur et le glyphe relus à l'écran dans la base à chaque clic. */
		const identifiant = identifiantDe(nom);
		if (identifiant === undefined) return;
		void envoyer('?/enregistrer', {
			[CHAMP_UNIVERS_CIBLE]: identifiant,
			[CHAMP_POSITION]: String(ordre)
		});
	}}
/>
