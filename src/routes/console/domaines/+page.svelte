<script lang="ts">
	/**
	 * `/console/domaines` — V-28 Console · Domaines.
	 *
	 * Cette route n'existait pas : `docs/routes.md` §3.6 la déclare, aucun
	 * fichier ne la montait, et la batterie 6 comptait ses cases VACANTES — un
	 * 404 d'absence, jamais une décision de refus (`RA-01`). `T-036` la monte
	 * avec sa garde : le rôle administrateur est éprouvé côté serveur par
	 * `+page.server.ts`, à côté de ce fichier.
	 *
	 * CE FICHIER NE FAIT QUE RENDRE CE QUE LE CHARGEUR A RÉSOLU. Les notes, les
	 * univers, les domaines, leur détail — description et modules activés — et
	 * l'utilisateur courant viennent tous de la base. LE BANC NE PASSE JAMAIS PAR
	 * ICI : il atteint la vue par le mode de conception, qui rend le composant
	 * directement.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert : `+layout.svelte` ne porte que le socle. Elle est identique à
	 * l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 */
	import Vue from '../../../vues/V-28.svelte';
	import '../../../vues/V-28.css';
	import { envoyerAUneAction } from '../cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<!--
	LA VUE TIENT L'ÉTAT DU DIALOGUE, CETTE PAGE TIENT LE RÉSEAU.

	`RG-M14-02` demande deux choses de cet écran, et la frontière passe entre
	elles : le DÉCOMPTE EXACT de ce qui sera détruit se calcule sur les notes que
	le chargeur a servies — donc dans la vue, seule à les avoir — tandis que
	l'ENVOI s'adresse à une action que la vue ne doit pas connaître. Le gel n'écrit
	ni `method` ni `action` sur ces nœuds ; rien ici ne les invente non plus, la
	requête est composée à la main.

	La suppression est ATOMIQUE ET DÉFINITIVE (`RG-M14-03`) : c'est la transaction
	de `supprimerUnDomaine()` qui le tient, et l'index de recherche est entretenu
	après elle (`RG-M14-05`). Cette page ne fait que porter le geste.
-->
<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	compte={data.compte}
	detailDomaines={data.detailDomaines}
	onSupprimer={(demande) => {
		/* LA VUE DÉSIGNE PAR LE NOM, LE GESTE PAR LA FORME CANONIQUE. La table
		   vient du chargeur — `lireLesDesignationsDeDomaine()` —, jamais d'une
		   règle devinée : « Poste de travail » ne donne pas son identifiant par
		   abaissement de casse, et c'est la base qui sait. Une désignation absente
		   n'envoie rien : mieux vaut un geste sans effet qu'un geste sur un autre
		   domaine. */
		const canonique = data.designations[demande.domaine];
		if (canonique === undefined) return;
		void envoyerAUneAction(document, '?/supprimer', {
			univers: canonique.univers,
			domaine: canonique.domaine,
			'sup-saisie': demande.saisie
		});
	}}
/>
