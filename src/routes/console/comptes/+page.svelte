<script lang="ts">
	/**
	 * `/console/comptes` — V-32 Console · Comptes.
	 *
	 * Cette route n'existait pas : `docs/routes.md` §3.6 la déclare, aucun
	 * fichier ne la montait, et la batterie 6 comptait ses cases VACANTES.
	 * `T-036` la monte avec sa garde : le rôle administrateur est éprouvé côté
	 * serveur par `+page.server.ts`, à côté de ce fichier.
	 *
	 * CE FICHIER NE FAIT QUE RENDRE CE QUE LE CHARGEUR A RÉSOLU. Les notes
	 * viennent de la base ; la liste des comptes, non — voir le chargeur. LE
	 * BANC NE PASSE JAMAIS PAR ICI : il atteint la vue par le mode de
	 * conception, qui rend le composant directement.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert ; elle est identique à l'octet à sa source gelée (P-6.3).
	 *
	 * AUCUN `<svelte:head>` : rien ne déclare de titre de page pour le PRODUIT.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../vues/V-32.svelte';
	import '../../../vues/V-32.css';
	import { cablerLeTiroirDeFormulaire, envoyerAUneAction } from '../cablage';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LE PANNEAU DE FORMULAIRE EST RENDU ATTEIGNABLE AU MONTAGE — voir
	 * `cablerLeTiroirDeFormulaire()`, qui dit pourquoi et ce qu'il ne fait pas.
	 *
	 * Ce n'est pas un ornement : `#f-role`, le déclencheur de `RG-M14-07`, vit
	 * dans ce panneau. Sans ce geste, l'action `changerLeRole` d'à côté est juste,
	 * éprouvée, et inatteignable — six lots ont écrit des actions que rien ne
	 * pouvait atteindre (`ARB-063`).
	 */
	onMount(() => cablerLeTiroirDeFormulaire(document));
</script>

<!--
	LA VUE TIENT L'ÉTAT DU DIALOGUE, CETTE PAGE TIENT LE RÉSEAU — voir
	`/console/domaines` pour le motif.

	LE COMPTE SE DÉSIGNE PAR SON IDENTIFIANT DE CONNEXION, et ici aucune table de
	traduction n'est nécessaire : `lireComptes()` rend `identifiant`, la vue
	l'affiche, l'action l'attend. C'est le seul des quatre écrans à dialogue
	destructif dans ce cas — univers, domaines et types de fiche se désignent par
	un identifiant lisible que les vues n'ont pas.

	`RG-M14-08` est tenue en DEUX endroits, et aucun n'est ici : l'écriture par
	`changerLActivationDUnCompte()`, et la perte immédiate d'accès par
	`src/hooks.server.ts`, qui ferme la session au premier accès d'un compte
	devenu inactif.
-->
<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	univers={data.univers}
	domaines={data.domaines}
	compte={data.compte}
	comptes={data.comptes}
	onChangerLActivation={(demande) => {
		void envoyerAUneAction(document, '?/changerLActivation', {
			'f-ident': demande.identifiant,
			actif: demande.actif ? 'oui' : 'non'
		});
	}}
	onEnregistrerLeRole={(demande) => {
		/* LES DEUX NOMS SONT CEUX DU GEL, ET L'ACTION LES ATTEND TELS QUELS :
		   `f-ident` désigne le compte — identifiant de connexion, définitif après
		   création (`V-32:3109`) —, `f-role` porte le LIBELLÉ du sélecteur, que
		   `roleDepuisLeLibelle()` convertit côté serveur. Rien n'est traduit ici :
		   une seconde table de conversion finirait par diverger de la première. */
		void envoyerAUneAction(document, '?/changerLeRole', {
			'f-ident': demande.identifiant,
			'f-role': demande.role
		});
	}}
	onCreerUnCompte={async (demande) => {
		/* LA VUE DÉSIGNE LE DOMAINE PAR SON NOM, LE GESTE PAR SA FORME CANONIQUE —
		   même traduction qu'à `/console/domaines`, par la table que le chargeur a
		   servie. Une désignation absente vaut « aucun rattachement » plutôt qu'un
		   rattachement deviné : `#f-domaine` n'est pas obligatoire au gel, et la
		   colonne est nullable par exigence (`RG-M14-04`). */
		const canonique = data.designations[demande.domaine];

		/* PAS DE RECHARGEMENT AU SUCCÈS : la boîte « Compte créé » doit encore
		   montrer le mot de passe initial, qui n'existe nulle part ailleurs. La
		   page se relit à la fermeture de cette boîte — `onMotDePasseTransmis`. */
		const retour = await envoyerAUneAction(
			document,
			'?/creer',
			{
				'f-ident': demande.identifiant,
				'f-nom': demande.nom,
				'f-courriel': demande.courriel,
				'f-mdp': demande.motDePasse,
				'f-role': demande.role,
				'f-verrou': demande.motDePasseVerrouille ? 'oui' : 'non',
				univers: canonique?.univers ?? '',
				domaine: canonique?.domaine ?? ''
			},
			{ rechargerAuSucces: false }
		);
		if (retour.succes) return { cree: true, erreurs: [] };

		/* LE REFUS EST RENDU TEL QUE LE VERDICT L'A PRONONCÉ, jamais reformulé :
		   les messages sont ceux du gel, et `verdictDeCreationDeCompte()` les
		   transcrit. Un refus d'une autre nature — mot de passe vide, adresse
		   indisponible — n'a AUCUN bloc au gel pour se dire : il ne rend aucune
		   erreur de champ, le panneau reste ouvert, et rien n'est écrit. C'est une
		   lacune déclarée, pas un écran inventé. */
		const refus = retour.donnees as { issue?: string; erreurs?: unknown } | undefined;
		const erreurs =
			refus?.issue === 'saisie-refusee' && Array.isArray(refus.erreurs)
				? (refus.erreurs as { champ: 'ident' | 'nom'; message: string }[])
				: [];
		return { cree: false, erreurs };
	}}
	onMotDePasseTransmis={() => {
		/* LA LISTE VIENT DU SERVEUR : le compte créé n'y entre qu'à la relecture.
		   Le rechargement est différé jusqu'ici parce que le mot de passe initial,
		   « affiché une seule fois », disparaîtrait avec la page. */
		document.location.reload();
	}}
/>
