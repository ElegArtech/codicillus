<script lang="ts">
	/**
	 * `/console/templates` — V-31 Console · Templates. Le rôle administrateur est
	 * éprouvé côté serveur par `+page.server.ts`.
	 *
	 * CE FICHIER NE FAIT QUE RENDRE CE QUE LE CHARGEUR A RÉSOLU. LE BANC NE PASSE
	 * JAMAIS PAR ICI : il atteint la vue par le mode de conception.
	 */
	import Vue from '../../../vues/V-31.svelte';
	import '../../../vues/V-31.css';
	import { envoyerAUneAction } from '../cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<!--
	LA VUE TIENT L'ÉTAT DU DIALOGUE, CETTE PAGE TIENT LE RÉSEAU — voir
	`/console/domaines` pour le motif.

	AUCUNE TABLE DE TRADUCTION : `lireTemplates()` rend `templates.identifiant`
	sous le nom `id`, et la vue le porte. C'est le second écran dans ce cas, avec
	les types de relation.
-->
<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	compte={data.compte}
	templates={data.templates}
	typesNote={data.typesNote}
	onSupprimer={(template) => {
		void envoyerAUneAction(document, '?/supprimer', { template });
	}}
	onMarquerParDefaut={(template) => {
		void envoyerAUneAction(document, '?/marquerParDefaut', { template });
	}}
	onDupliquer={(template) => {
		/* `dupliquer(t)` du gel (`V-31:3385`) : tout est copié SAUF le caractère
		   « par défaut », et le nom prend le suffixe « (copie) ». Le modèle est
		   relu ici, dans la liste que le chargeur a servie — la vue n'a transmis
		   que sa désignation. */
		const modele = data.templates.find((t) => t.id === template);
		if (modele === undefined) return;
		void envoyerAUneAction(document, '?/creer', {
			'f-nom': `${modele.nom} (copie)`,
			'f-desc': modele.description,
			'f-type': modele.type,
			'f-defaut': 'non',
			'f-contenu': modele.contenu
		});
	}}
	onEnregistrer={async (demande) => {
		/* UNE SEULE FORME DE CHARGE POUR LES DEUX ACTIONS, et les noms sont ceux
		   du gel : `creer` et `enregistrer` lisent le même formulaire, seule la
		   désignation de la ligne visée les sépare (`P-35`). */
		const champs: Record<string, string> = {
			'f-nom': demande.nom,
			'f-desc': demande.description,
			'f-type': demande.type,
			'f-defaut': demande.defaut ? 'oui' : 'non',
			'f-contenu': demande.contenu
		};
		if (demande.id !== null) champs['template'] = demande.id;

		const retour = await envoyerAUneAction(
			document,
			demande.id === null ? '?/creer' : '?/enregistrer',
			champs
		);
		if (retour.succes) return { enregistre: true, message: null };

		/* LE REFUS EST RENDU TEL QUE L'ACTION L'A PRONONCÉ, jamais reformulé.

		   ET UN REFUS D'UNE AUTRE NATURE SE DIT AUSSI : le seul bloc de refus du gel
		   est celui du nom, et tout le reste — une garde de console qui rend 404, une
		   panne de serveur — ne rendait RIEN. Le panneau restait ouvert, aucun template
		   n'était écrit, et l'utilisateur croyait avoir enregistré. */
		const refus = retour.donnees as { issue?: string; message?: string } | undefined;
		if (refus?.issue === 'saisie-refusee' && refus.message !== undefined) {
			return { enregistre: false, message: refus.message };
		}
		return {
			enregistre: false,
			message: "L'enregistrement a été refusé par le serveur, et rien n'a été écrit."
		};
	}}
/>
