<script lang="ts">
	/**
	 * `/notes/{identifiant}` — V-14 Lecture d'une note.
	 *
	 * LOT T-033, « le câblage ». La vue ne change pas : elle reçoit ses deux
	 * propriétés, et l'une des deux vient de la BASE — `notes` est le corpus
	 * lisible par l'appelant, plus le fichier de constantes.
	 *
	 * LE BANC NE PASSE JAMAIS PAR ICI : il rend les composants par le mode de
	 * conception. Rien de ce fichier n'entre dans son verdict, et les 409 couples
	 * ne peuvent pas bouger de son fait. C'est le fondement d'`ARB-063`.
	 *
	 * L'ÉCRAN MONTRE LA NOTE QU'ON LIT — et il ne le faisait pas.
	 *
	 * Le chargeur rendait déjà la note réelle, son corps rendu par
	 * `rendreDocument` et ses rétroliens déduits ; cette page ne les passait
	 * pas, et `src/vues/V-14.svelte` n'avait aucune propriété pour les recevoir.
	 * Une note créée puis ouverte affichait donc le titre et le texte de
	 * `n-restaurer-pg`, la note gelée de la maquette. C'est fermé : `affichee`
	 * porte l'identité, le corps et les dates, `panneaux` porte les sept
	 * panneaux latéraux, et plus rien de l'écran ne vient du jeu de semence.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * LA SUPPRESSION EST CÂBLÉE, ET SA CONFIRMATION EST CHIFFRÉE
	 *
	 * `RG-M04-10` (`CDC:635`) : la suppression « est confirmée par une boîte de
	 * dialogue rappelant le titre, le nombre de rétroliens qui deviendront
	 * cassés, et le nombre de versions perdues ». Les trois quantités sont
	 * SERVIES par le chargeur — `lecture.note.titre`, `lecture.retroliens`,
	 * `histoire.versions` — et composées ci-dessous : rien n'est compté à
	 * l'écran, rien n'est estimé.
	 *
	 * La FORME de la confirmation est un écart déclaré, et il est nommé dans
	 * `$lib/cablage/formulaires.ts` : le gel porte un dialogue pour ce geste
	 * (`V-40:510-549`), V-14 ne le transcrit pas, et le monter demanderait de
	 * toucher `src/vues/`. Le fond de la règle est tenu — rien n'est détruit sans
	 * un rappel chiffré —, la forme ne l'est pas.
	 *
	 * Le bouton n'est rendu qu'en écriture (`V-14:369`, sous `{#if ecriture}`) :
	 * `P-09` est servie par la vue, et le refus serveur ne dépend pas d'elle.
	 */
	import { onMount } from 'svelte';
	import Vue from '../../../vues/V-14.svelte';
	import '../../../vues/V-14.css';
	import { page } from '$app/state';
	import { cablerLaSuppression, cablerLHistorique } from '$lib/cablage/formulaires';
	import Historique from '../../../vues/V-15.svelte';
	import '../../../vues/V-15.css';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/** Les trois quantités de `RG-M04-10`, telles que le chargeur les sert. */
	const rappel = $derived(
		[
			`Supprimer « ${data.lecture.note.titre} » ?`,
			'',
			`${data.lecture.retroliens.length} rétrolien(s) deviendront cassés.`,
			`${data.histoire.versions.length} version(s) seront perdues.`,
			'',
			'La suppression est définitive : il n’y a pas de corbeille.'
		].join('\n')
	);

	/**
	 * L'HISTORIQUE EST UN ÉTAT DE CETTE ADRESSE, PAS UNE AUTRE PAGE.
	 *
	 * `docs/routes.md` §3.4 : V-15 n'a **pas de chemin propre**, elle est
	 * superposée à `/notes/{identifiant}`, et son unique état adressable est
	 * `?version={n}` — `?version` nu désignant la version courante. La présence
	 * du paramètre décide donc laquelle des deux vues est montée, et rien
	 * d'autre : ni un état local, ni un booléen inventé.
	 *
	 * Sans ce montage, l'historique et la restauration n'étaient atteignables
	 * par AUCUN écran : le panneau existait, ses données étaient servies, et
	 * personne ne pouvait les voir.
	 */
	const historiqueOuvert = $derived(page.url.searchParams.has('version'));
	const adresse = $derived(`/notes/${data.lecture.note.id}`);

	/** `RG-M18-05` — l'action irréversible rappelle ce qu'elle va écraser. */
	const rappelDeRestauration = (numero: number): string =>
		`Restaurer la version ${String(numero)} de « ${data.lecture.note.titre} » ?\n\n` +
		'Le corps actuel est remplacé par celui de cette version.\n' +
		'Rien n’est perdu : la restauration capture sa propre version.';

	let formulaire: HTMLFormElement;

	onMount(() => {
		/* ═══════════════════════════════════════════════════════════════════
		   AUCUN BOUTON DU GEL NE SOUMET — et sans cette ligne, ils soumettaient
		   TOUS, vers `?/supprimer`.

		   MESURÉ : une note créée, puis « Imprimer » cliqué, puis 303 vers
		   `/univers/production/infrastructure` et 404 sur la note. « Modifier la
		   référence », « Historique des versions » et « Exporter » avaient le
		   même effet.

		   LA CAUSE EST UNE RÈGLE DE HTML, pas une faute de la vue : un `button`
		   sans attribut `type`, dans un formulaire, est un bouton de SOUMISSION.
		   Le gel n'en pose aucun — ses boutons portent des comportements, absents
		   par `ARB-011` —, et l'enveloppe `<form action="?/supprimer">` qu'exige
		   `RG-M04-10` leur en a donné un que personne n'a spécifié.

		   LA PARADE EST CELLE DE `cablerLEditeur`, geste 1, mot pour mot :
		   « aucun bouton du gel ne soumet ». Elle ne rend rien inerte qui ne le
		   fût déjà ; elle RÉTABLIT l'état que le gel décrit. La suppression, elle,
		   ne passe pas par un bouton de soumission : `cablerLaSuppression` appelle
		   `requestSubmit()` après confirmation, et un formulaire sans bouton de
		   soumission se soumet très bien ainsi. */
		for (const bouton of Array.from(formulaire.querySelectorAll('button'))) {
			if (!bouton.hasAttribute('type')) bouton.type = 'button';
		}
		const defaireSuppression = cablerLaSuppression(formulaire, { rappel });
		const defaireHistorique = historiqueOuvert
			? cablerLHistorique(formulaire, formulaire, { adresse, rappel: rappelDeRestauration })
			: ouvrirLHistorique(formulaire, adresse);
		return () => {
			defaireSuppression();
			defaireHistorique();
		};
	});

	/**
	 * LE BOUTON « HISTORIQUE DES VERSIONS » DE V-14 — il ouvre l'état, il ne
	 * fait rien d'autre. Le gel le pose sans comportement (`ARB-011`) ; la route
	 * lui en donne un, et c'est le seul endroit où elle peut le faire.
	 */
	function ouvrirLHistorique(racine: ParentNode, cible: string): () => void {
		const bouton = Array.from(racine.querySelectorAll('button')).find(
			(b) => (b.textContent ?? '').trim() === 'Historique des versions'
		);
		if (bouton === undefined) return () => {};
		const aller = (): void => {
			racine.ownerDocument?.location.assign(`${cible}?version`);
		};
		bouton.addEventListener('click', aller);
		return () => bouton.removeEventListener('click', aller);
	}
</script>

<form method="POST" action="?/supprimer" bind:this={formulaire} style="display:contents">
	{#if historiqueOuvert}
		<Historique
			vecteur={{ panneau: 'ouvert', droits: data.vecteur.droits }}
			notes={data.notes}
			note={data.lecture.note}
			versions={{ [data.lecture.note.id]: data.histoire.versions }}
			retentionVersions={data.histoire.retention}
			versionAffichee={data.histoire.affichee?.numero ?? null}
		/>
	{:else}
		<Vue
			vecteur={data.vecteur}
			notes={data.notes}
			affichee={data.affichee}
			panneaux={data.panneaux}
		/>
	{/if}
</form>
