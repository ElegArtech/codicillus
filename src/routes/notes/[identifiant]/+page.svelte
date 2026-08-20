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
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * LES PIÈCES JOINTES SONT CÂBLÉES ICI, ET NULLE PART AILLEURS
	 *
	 * `M04.7` (`CDC:611`) veut un panneau « liste des fichiers, taille, type,
	 * TÉLÉCHARGEMENT ». Le gel le dessine — `V-14:1827-1840` — et il le dessine
	 * INERTE : deux `a.pj` en `href="#"`, un compteur, et AUCUN bouton, là où le
	 * panneau « Relations » voisin (`V-14:1846-1849`) en pose un sous
	 * `si-ecriture`. Le mécanisme de dépôt existait pourtant depuis `T-026`, et
	 * `pieces_jointes` portait zéro ligne faute d'une porte.
	 *
	 * LE COMPORTEMENT NE PEUT DONC PAS VENIR DE LA VUE : y ajouter un bouton
	 * changerait la structure du gel, et les 409 couples du banc avec elle. Il
	 * vient d'ici, comme la suppression et l'historique, par le régime
	 * qu'`ARB-063` a posé : la vue reste au gel, la route lui donne ses gestes.
	 * Trois choses sont posées sur le document vivant, et rien d'autre —
	 *
	 *   · l'ADRESSE des liens de pièce, servie par le chargeur (`piecesJointes`)
	 *     et jamais recomposée à l'écran ;
	 *   · un DÉPÔT, dont la forme est celle que le gel donne au geste voisin
	 *     — « + Ajouter », `btn btn--discret si-ecriture`, `V-14:1848` —, et un
	 *     champ de fichier caché qu'il déclenche ;
	 *   · un RETRAIT par pièce, dont la forme est celle que le gel donne au
	 *     retrait d'un élément de liste — le `×` des pastilles d'étiquette,
	 *     `V-17:833-861`, transcrit par `pastille()` dans `$lib/cablage`.
	 *
	 * Aucune valeur de couleur, d'espacement, de rayon ou de police n'est écrite
	 * (`ADR-002`) : les trois classes employées sont celles du socle.
	 *
	 * LE DÉPÔT PORTE SON ENCODAGE SUR LE SOUMETTEUR, PAS SUR LE FORMULAIRE. Le
	 * formulaire enveloppant vise `?/supprimer` et n'a aucune raison d'être
	 * multipart ; `formenctype` et `formaction` sont portés par le bouton
	 * soumetteur, qui l'emporte sur le formulaire. C'est le motif exact de
	 * `soumettreVers()` et il existe pour une raison mesurée : réécrire
	 * `formulaire.action` avant `requestSubmit()` est une COURSE, et elle a fait
	 * partir une restauration vers une suppression.
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
		const defairePieces = historiqueOuvert
			? () => {}
			: cablerLesPiecesJointes(formulaire, {
					pieces: data.piecesJointes,
					ecriture: data.vecteur.droits === 'ecriture'
				});
		return () => {
			defaireSuppression();
			defaireHistorique();
			defairePieces();
		};
	});

	/* ═══════════════════════════════════ Les pièces jointes ═════════════════ */

	/** Ce qui distingue les nœuds posés ici de ceux que le gel rend. */
	const MARQUE_DU_CABLAGE = 'cablePj';

	/** Ce que le câblage du panneau reçoit du chargeur. */
	interface CablageDesPieces {
		readonly pieces: readonly { nom: string; adresse: string }[];
		/** `RG-M05-08` / `P-09` — sans le droit d'écrire, aucun geste n'est POSÉ. */
		readonly ecriture: boolean;
	}

	/**
	 * LE PANNEAU « PIÈCES JOINTES », REPÉRÉ PAR SON LIBELLÉ.
	 *
	 * Le gel ne donne à ce panneau ni identifiant, ni classe distinctive : les
	 * sept panneaux latéraux sont sept `section.panneau.repliable` identiques,
	 * et seul le texte de leur `.etiq` les sépare (`V-14:1829`). C'est donc lui
	 * qu'on lit — la même méthode que `ouvrirLHistorique()`, qui reconnaît son
	 * bouton au texte faute d'attribut.
	 */
	function panneauDesPieces(racine: Element): HTMLElement | null {
		for (const section of Array.from(racine.querySelectorAll('section.panneau'))) {
			const etiquette = section.querySelector('.panneau__tete .etiq');
			if ((etiquette?.textContent ?? '').trim() === 'Pièces jointes') {
				return section as HTMLElement;
			}
		}
		return null;
	}

	/**
	 * SOUMETTRE VERS UNE ACTION NOMMÉE — par le SOUMETTEUR, jamais en réécrivant
	 * l'attribut du formulaire.
	 *
	 * C'est `soumettreVers()` de `$lib/cablage/formulaires.ts`, qui n'est pas
	 * exporté, et il porte ici l'ENCODAGE en plus de l'action : un dépôt de
	 * fichier exige le multipart, que le formulaire enveloppant — qui vise la
	 * suppression — n'a aucune raison de porter. `formaction` et `formenctype`
	 * l'emportent tous deux sur le formulaire, et `requestSubmit(soumetteur)`
	 * désigne explicitement lequel s'applique.
	 *
	 * LE GESTE NAÏF EST UNE COURSE, ET ELLE A MORDU : poser `formulaire.action`
	 * puis soumettre puis remettre l'ancienne valeur a fait partir une
	 * restauration vers la SUPPRESSION, le navigateur lisant l'attribut après le
	 * retour de `requestSubmit()`. Rien n'est réécrit ici, rien n'est à remettre.
	 */
	function soumettreVers(cible: HTMLFormElement, action: string, multipart: boolean): void {
		const existant = cible.querySelector<HTMLButtonElement>(
			`button[data-cable-pj-action="${action}"]`
		);
		const soumetteur = existant ?? cible.ownerDocument.createElement('button');
		soumetteur.type = 'submit';
		soumetteur.hidden = true;
		soumetteur.dataset['cablePjAction'] = action;
		soumetteur.formAction = action;
		if (multipart) soumetteur.formEnctype = 'multipart/form-data';
		if (existant === null) cible.appendChild(soumetteur);
		cible.requestSubmit(soumetteur);
	}

	/**
	 * LE CÂBLAGE DU PANNEAU — les adresses, le dépôt, le retrait.
	 *
	 * Il est IDEMPOTENT : chaque appel retire d'abord les nœuds qu'un appel
	 * précédent aurait posés, reconnaissables à leur marque. Sans quoi un
	 * remontage doublerait les boutons — le défaut est invisible tant qu'une
	 * soumission recharge la page, et il apparaît au premier rendu qui ne le
	 * fait pas. `P-5` : une propriété qu'aucun cas n'exerce n'est pas acquise.
	 */
	function cablerLesPiecesJointes(cible: HTMLFormElement, options: CablageDesPieces): () => void {
		const panneau = panneauDesPieces(cible);
		if (panneau === null) return () => {};
		for (const pose of Array.from(panneau.querySelectorAll('[data-cable-pj]'))) pose.remove();

		const document = cible.ownerDocument;
		const liens = Array.from(panneau.querySelectorAll<HTMLAnchorElement>('a.pj'));
		const debranchements: (() => void)[] = [];

		/* L'ADRESSE DE CHAQUE PIÈCE. Le gel écrit `href="#"` faute de serveur ;
		   l'appariement est POSITIONNEL parce que le chargeur sert les deux listes
		   depuis le même tableau, dans le même ordre, sans retri entre les deux. */
		liens.forEach((lien, rang) => {
			const piece = options.pieces[rang];
			if (piece === undefined) return;
			lien.href = piece.adresse;
			if (!options.ecriture) return;
			const retrait = document.createElement('button');
			retrait.type = 'button';
			retrait.className = 'btn btn--discret btn--destructif si-ecriture';
			retrait.dataset[MARQUE_DU_CABLAGE] = 'retrait';
			retrait.setAttribute('aria-label', `Retirer la pièce jointe ${piece.nom}`);
			retrait.append('×');
			const reaction = (): void => {
				/* `RG-M18-05` — l'action irréversible nomme ce qu'elle détruit. */
				const rappelDuRetrait =
					`Retirer « ${piece.nom} » de cette note ?\n\n` +
					'Le fichier est effacé de l’entrepôt : le retrait est définitif.';
				if (!document.defaultView?.confirm(rappelDuRetrait)) return;
				poserLeNomDeLaPiece(cible, piece.nom);
				soumettreVers(cible, '?/retirerPiece', false);
			};
			retrait.addEventListener('click', reaction);
			debranchements.push(() => retrait.removeEventListener('click', reaction));
			lien.after(retrait);
		});

		if (!options.ecriture) return () => debranchements.forEach((d) => d());

		/* LE DÉPÔT. Le champ de fichier vit DANS le formulaire — c'est la seule
		   façon qu'il soit soumis — et il est caché : c'est le bouton du panneau
		   qui l'ouvre, de la même forme que le « + Ajouter » du panneau voisin. */
		const champ = document.createElement('input');
		champ.type = 'file';
		champ.name = 'fichier';
		champ.hidden = true;
		champ.dataset[MARQUE_DU_CABLAGE] = 'champ';
		const deposer = (): void => {
			if (champ.files === null || champ.files.length === 0) return;
			soumettreVers(cible, '?/deposerPiece', true);
		};
		champ.addEventListener('change', deposer);
		debranchements.push(() => champ.removeEventListener('change', deposer));

		const ajouter = document.createElement('button');
		ajouter.type = 'button';
		ajouter.className = 'btn btn--discret si-ecriture';
		ajouter.dataset[MARQUE_DU_CABLAGE] = 'ajout';
		ajouter.append('+ Ajouter');
		const ouvrir = (): void => champ.click();
		ajouter.addEventListener('click', ouvrir);
		debranchements.push(() => ajouter.removeEventListener('click', ouvrir));

		panneau.querySelector('.panneau__tete')?.append(champ, ajouter);
		return () => debranchements.forEach((d) => d());
	}

	/**
	 * Le nom de la pièce visée par le retrait, en champ caché du formulaire.
	 *
	 * IL NE S'APPELLE PAS `fichier`, ET C'EST UNE CORRECTION, PAS UN GOÛT. Le
	 * champ de dépôt porte déjà ce nom-là, et les deux vivent dans le MÊME
	 * formulaire : deux champs homonymes rendent le PREMIER dans l'ordre du
	 * document, qui est celui du dépôt — le retrait aurait reçu un fichier vide
	 * au lieu du nom qu'il vise, et n'aurait jamais rien retiré.
	 */
	function poserLeNomDeLaPiece(cible: HTMLFormElement, nom: string): void {
		const existant = cible.querySelector<HTMLInputElement>('input[data-cable-pj-nom]');
		const champ = existant ?? cible.ownerDocument.createElement('input');
		champ.type = 'hidden';
		champ.name = 'piece';
		champ.dataset['cablePjNom'] = 'oui';
		champ.value = nom;
		if (existant === null) cible.appendChild(champ);
	}

	/**
	 * LE BOUTON « HISTORIQUE DES VERSIONS » DE V-14 — il ouvre l'état, il ne
	 * fait rien d'autre. Le gel le pose sans comportement (`ARB-011`) ; la route
	 * lui en donne un, et c'est le seul endroit où elle peut le faire.
	 *
	 * LE PARAMÈTRE ÉTAIT TYPÉ `ParentNode`, ET LA BATTERIE 1 ÉTAIT ROUGE POUR
	 * CETTE SEULE LIGNE : `ParentNode` est une interface de typage, pas un objet
	 * global du navigateur, et `no-undef` la refuse — mesuré sur cette copie à
	 * `e9c31e9`, avant toute modification. `Element` est l'un et l'autre, et il
	 * porte `querySelectorAll` comme `ownerDocument`.
	 */
	function ouvrirLHistorique(racine: Element, cible: string): () => void {
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
