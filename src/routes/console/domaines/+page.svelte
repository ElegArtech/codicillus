<script lang="ts">
	/**
	 * `/console/domaines` — V-28 Console · Domaines. Le rôle administrateur est
	 * éprouvé côté serveur par `+page.server.ts`.
	 *
	 * CE FICHIER NE FAIT QUE RENDRE CE QUE LE CHARGEUR A RÉSOLU : notes, univers,
	 * domaines, leur détail — description et modules activés — et l'utilisateur
	 * courant viennent tous de la base. LE BANC NE PASSE JAMAIS PAR ICI : il atteint
	 * la vue par le mode de conception.
	 */
	import Vue from '../../../vues/V-28.svelte';
	import '../../../vues/V-28.css';
	import { envoyerAUneAction } from '../cablage';
	import {
		CHAMP_DOMAINE_CIBLE,
		CHAMP_UNIVERS_CIBLE,
		CHAMP_UNIVERS_DE_RATTACHEMENT,
		champsDeDomaine,
		type RefusDeSaisie,
		type SaisieDeDomaine
	} from '$lib/console/structure';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LE REFUS RENDU PAR L'ACTION, REMIS À LA VUE — voir `/console/univers`, qui
	 * porte le motif au long. Il est effacé avant chaque envoi.
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
</script>

<!--
	LA VUE TIENT L'ÉTAT DU DIALOGUE, CETTE PAGE TIENT LE RÉSEAU.

	`RG-M14-02` demande deux choses de cet écran, et la frontière passe entre elles :
	le DÉCOMPTE EXACT de ce qui sera détruit se calcule sur les notes que le chargeur
	a servies — donc dans la vue, seule à les avoir — tandis que l'ENVOI s'adresse à
	une action que la vue ne doit pas connaître. Le gel n'écrit ni `method` ni
	`action` sur ces nœuds ; rien ici ne les invente non plus.

	La suppression est ATOMIQUE ET DÉFINITIVE (`RG-M14-03`) : c'est la transaction de
	`supprimerUnDomaine()` qui le tient, et l'index est entretenu après elle.
-->
<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	compte={data.compte}
	detailDomaines={data.detailDomaines}
	modules={data.modules}
	onSupprimer={(demande) => {
		/* LA VUE DÉSIGNE PAR LE NOM, LE GESTE PAR LA FORME CANONIQUE. La table vient
		   du chargeur, jamais d'une règle devinée : « Poste de travail » ne donne pas
		   son identifiant par abaissement de casse. Une désignation absente n'envoie
		   rien — mieux vaut un geste sans effet qu'un geste sur un autre domaine. */
		const canonique = data.designations[demande.domaine];
		if (canonique === undefined) return;
		void envoyerAUneAction(document, '?/supprimer', {
			univers: canonique.univers,
			domaine: canonique.domaine,
			'sup-saisie': demande.saisie
		});
	}}
	{refus}
	onCreer={(saisie: SaisieDeDomaine) => {
		/* L'UNIVERS PART PAR SON IDENTIFIANT, jamais par son nom d'affichage — même
		   règle que la cible du domaine, même table. Le `<select>` du gel porte le nom
		   et `champsDeDomaine()` le recopie tel quel : le champ de rattachement est
		   RÉÉCRIT ici, après la fabrique. Une désignation absente n'envoie rien. */
		const universCanonique = data.designationsUnivers[saisie.univers];
		if (universCanonique === undefined) return;
		void envoyer('?/creer', {
			...champsDeDomaine(saisie),
			[CHAMP_UNIVERS_DE_RATTACHEMENT]: universCanonique
		});
	}}
	onEnregistrer={(nom: string, saisie: SaisieDeDomaine) => {
		/* LA CIBLE EST DÉSIGNÉE PAR SA FORME CANONIQUE, comme la suppression, et
		   pour la même raison : `RG-STR-02` ne rend l'identifiant d'un domaine
		   unique qu'au sein de son univers. La table vient du chargeur. */
		const canonique = data.designations[nom];
		if (canonique === undefined) return;
		/* Le rattachement part par son identifiant, comme à la création. */
		const universCanonique = data.designationsUnivers[saisie.univers];
		if (universCanonique === undefined) return;
		void envoyer('?/enregistrer', {
			[CHAMP_UNIVERS_CIBLE]: canonique.univers,
			[CHAMP_DOMAINE_CIBLE]: canonique.domaine,
			...champsDeDomaine(saisie),
			[CHAMP_UNIVERS_DE_RATTACHEMENT]: universCanonique
		});
	}}
/>
