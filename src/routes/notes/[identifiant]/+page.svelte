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
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { deserialize } from '$app/forms';
	import Vue from '../../../vues/V-14.svelte';
	import '../../../vues/V-14.css';
	import { page } from '$app/state';
	import { cablerLaSuppression, cablerLHistorique } from '$lib/cablage/formulaires';
	import { cablerLaFermetureDeLHistorique, cablerLaLecture, cablerLaLoupe } from './cablage';
	import Historique from '../../../vues/V-15.svelte';
	import '../../../vues/V-15.css';
	import Dialogues from '../../../vues/V-40.svelte';
	import '../../../vues/V-40.css';
	import type { LibellesDeRelation } from '../../../../seeds/corpus';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/** L'écran d'export — le seul du produit, et son périmètre est le domaine. */
	const ADRESSE_DES_EXPORTS = '/console/exports';

	/**
	 * LES TYPES DE RELATION, DANS LA FORME QUE LE DIALOGUE LIT.
	 *
	 * `d-relation` remplit son sélecteur par `Object.entries(typesRelation)` —
	 * c'est le geste de `prepRelation()` au gel (`V-40:3424`), qui parcourt les
	 * clés de `window.TYPES_RELATION`. Le chargeur, lui, sert une LISTE ordonnée
	 * par l'ordre d'administration ; la table est composée dans cet ordre-là, que
	 * l'insertion préserve, de sorte que le premier type offert reste le premier
	 * proposé.
	 */
	const typesRelation = $derived.by<Readonly<Record<string, LibellesDeRelation>>>(() => {
		const table: Record<string, LibellesDeRelation> = {};
		for (const t of data.relation?.types ?? []) {
			table[t.identifiant] = { sortant: t.sortant, entrant: t.entrant };
		}
		return table;
	});

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
		/**
		 * LE DIALOGUE `d-relation`, ET SON DÉCLENCHEUR.
		 *
		 * Il est câblé sur le DOCUMENT, et non sur le formulaire : la boîte vit
		 * hors de l'enveloppe `<form action="?/supprimer">`, exprès. Ses champs
		 * seraient sinon des champs de ce formulaire-là, et partiraient avec une
		 * suppression.
		 */
		const relation = data.relation;
		const defaireRelation =
			historiqueOuvert || relation === null
				? () => {}
				: cablerLeDialogueDeRelation(formulaire.ownerDocument, {
						cibles: relation.cibles,
						types: typesRelation,
						titreDeLaNote: data.lecture.note.titre,
						action: `${adresse}/relations?/ajouter`
					});
		/**
		 * LES GESTES DE LA LECTURE ELLE-MÊME — la fraîcheur, les bandeaux, la
		 * bascule de registre, le menu d'actions, la copie et la loupe.
		 *
		 * ILS SONT POSÉS APRÈS LA NEUTRALISATION, et jamais avant : le câblage
		 * n'écrit aucun attribut de type, il compte sur celui que la boucle
		 * ci-dessus a posé. Poser l'un sans l'autre rendrait « Marquer comme
		 * vérifié » soumetteur ET écouté, donc parti deux fois — la seconde vers
		 * l'action par défaut du formulaire, qui est la suppression.
		 *
		 * Quand l'historique est ouvert, c'est V-15 qui est à l'écran : elle
		 * partage l'article de V-14 (le même bloc, à l'octet), donc les gestes de
		 * la fraîcheur valent aussi là, et seule la fermeture du panneau s'ajoute.
		 */
		const defaireLecture = cablerLaLecture(formulaire, {
			identifiant: data.lecture.note.id,
			ecriture: data.vecteur.droits === 'ecriture',
			/* `RG-M13-03` — l'export est réservé à l'administrateur. Pour les
			   autres, l'entrée n'a pas de destination, et le câblage la retire. */
			exports: data.administrateur ? ADRESSE_DES_EXPORTS : null
		});
		const defaireLoupe = cablerLaLoupe(formulaire.ownerDocument);
		const defaireFermeture = historiqueOuvert
			? cablerLaFermetureDeLHistorique(formulaire.ownerDocument, adresse)
			: () => {};
		return () => {
			defaireSuppression();
			defaireHistorique();
			defairePieces();
			defaireRelation();
			defaireLecture();
			defaireLoupe();
			defaireFermeture();
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
	 * panneaux latéraux sont autant de `section.panneau.repliable` identiques, et
	 * seul le texte de leur `.etiq` les sépare (`V-14:1829`). C'est donc lui
	 * qu'on lit — la même méthode que `ouvrirLHistorique()`, qui reconnaît son
	 * bouton au texte faute d'attribut.
	 */
	/**
	 * `Document | Element`, ET SURTOUT PAS `ParentNode` — la batterie 1 a déjà
	 * été rouge pour cette seule ligne : `ParentNode` est une interface de
	 * typage, pas un objet global du navigateur, et `no-undef` la refuse. Les
	 * deux types employés ici sont l'un et l'autre, et portent
	 * `querySelectorAll`.
	 */
	function panneauNomme(racine: Document | Element, libelle: string): HTMLElement | null {
		for (const section of Array.from(racine.querySelectorAll('section.panneau'))) {
			const etiquette = section.querySelector('.panneau__tete .etiq');
			if ((etiquette?.textContent ?? '').trim() === libelle) return section as HTMLElement;
		}
		return null;
	}

	function panneauDesPieces(racine: Element): HTMLElement | null {
		return panneauNomme(racine, 'Pièces jointes');
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

	/* ═══════════════════════════ Le dialogue « Ajouter une relation » ═══════ */

	/** Une note que l'appelant peut viser — ce que le chargeur en sert. */
	interface CibleDeRelation {
		readonly identifiant: string;
		readonly titre: string;
		readonly type: string;
		readonly domaine: string;
	}

	/** Ce dont le câblage du dialogue a besoin, et rien de plus. */
	interface CablageDeRelation {
		readonly cibles: readonly CibleDeRelation[];
		readonly types: Readonly<Record<string, LibellesDeRelation>>;
		/** Le titre de la note d'où part la relation — l'aperçu le nomme. */
		readonly titreDeLaNote: string;
		/** L'action de route qui déclare la relation. */
		readonly action: string;
	}

	/** `V-40:3444` — le lot de résultats que la liste montre au plus. */
	const RESULTATS_DE_RECHERCHE = 6;

	/**
	 * LE DIALOGUE `d-relation`, MONTÉ DANS LA VUE QUI LE DÉCLENCHE.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * CE QUE LE GEL DIT, ET QUI N'ÉTAIT PAS TENU
	 *
	 * `mockups/V-14-lecture-note.html:1848` : le panneau « Relations » porte un
	 * bouton « + Ajouter », sous `si-ecriture`. `mockups/V-40-dialogues.html:3252`
	 * dit de `d-relation` : `ou: "V-14"`. Et `docs/routes.md:211` ferme la
	 * question — V-40 n'a aucune adresse propre, « chaque dialogue s'exécute dans
	 * la vue qui le déclenche ».
	 *
	 * Le geste existait pourtant : il était sur `/notes/{identifiant}/relations`,
	 * une adresse qu'aucune source ne prévoit, et le bouton du gel n'y menait
	 * pas. Il y mène maintenant — et l'ACTION reste celle-là, inchangée : c'est
	 * elle qui porte `RG-M08-03` (pas de doublon), `RG-M08-04` (le droit sur les
	 * deux extrémités) et le refus indiscernable d'une inexistence. Rien de ce
	 * qui décide n'est réécrit ici.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * LES QUATRE GESTES DU SCRIPT GELÉ, TRANSCRITS
	 *
	 *   1. `prepRelation()` (`V-40:3423`) — à l'ouverture : aucune cible retenue,
	 *      champ de recherche vide, bouton inhibé, usage et aperçu recomposés ;
	 *   2. `majUsage()` (`V-40:3437`) — la phrase du `champ__aide`, au caractère
	 *      près, dans les libellés du type SÉLECTIONNÉ (`RG-M08-06`) ;
	 *   3. la recherche (`V-40:3488`) — au plus six résultats, le titre et la
	 *      ligne « type · domaine », sélection au `mousedown` pour que le champ
	 *      ne perde pas le focus avant le clic ;
	 *   4. `majApercuRel()` (`V-40:3446`) — les deux phrases, sens direct et sens
	 *      inverse, avec leur `phrase-rel__vide` tant qu'aucune note n'est visée.
	 *
	 * AUCUN NŒUD DU GEL N'EST CRÉÉ NI RETIRÉ EN DEHORS DE CES DEUX ZONES —
	 * `#rel-liste` et `#rel-apercu` —, que le script de la maquette peuple lui
	 * aussi et qui sont VIDES au gel. Aucune classe n'est inventée : `rel-item`,
	 * `rel-item__t`, `rel-item__s`, `phrase-rel`, `phrase-rel__sens`,
	 * `phrase-rel__vide` sont toutes du gel. Aucune règle de style n'est écrite.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * LA MODALITÉ EST UN COMPORTEMENT, DONC ELLE EST ICI
	 *
	 * `showModal()`, et non l'attribut `open` : lui seul donne le voile
	 * `::backdrop`, le piège de focus et la fermeture par Échap que `RG-M18-08`
	 * exige. `src/vues/V-40.svelte` ne pose donc AUCUN `open` hors catalogue.
	 *
	 * UN REFUS N'A PAS DE VÊTEMENT AU GEL, ET C'EST DÉCLARÉ. La maquette annonce
	 * l'issue par `window.notifier` (`V-40:3514`), que le produit n'a pas ; le
	 * dialogue, lui, ne porte aucun bloc d'erreur. Le motif est donc dit par
	 * `alert()`, comme la suppression et le retrait d'une pièce disent leur
	 * rappel par `confirm()` dans ce même fichier. C'est une lacune de gel,
	 * remontée au rapport, pas une invention d'écran.
	 */
	function cablerLeDialogueDeRelation(document: Document, options: CablageDeRelation): () => void {
		const boite = document.querySelector<HTMLDialogElement>('dialog#d-relation');
		const panneau = panneauNomme(document, 'Relations');
		const declencheur = panneau?.querySelector<HTMLButtonElement>('.panneau__tete button') ?? null;
		if (boite === null || declencheur === null) return () => {};

		const typeChoisi = boite.querySelector<HTMLSelectElement>('#rel-type');
		const usage = boite.querySelector<HTMLElement>('#rel-usage');
		const cherche = boite.querySelector<HTMLInputElement>('#rel-cherche');
		const liste = boite.querySelector<HTMLElement>('#rel-liste');
		const apercu = boite.querySelector<HTMLElement>('#rel-apercu');
		const valider = boite.querySelector<HTMLButtonElement>('#rel-valider');
		if (
			typeChoisi === null ||
			usage === null ||
			cherche === null ||
			liste === null ||
			apercu === null ||
			valider === null
		) {
			return () => {};
		}

		/** La note visée, tant qu'aucune n'est choisie — `cibleRel` du gel. */
		let visee: CibleDeRelation | null = null;

		const libellesDuType = (): LibellesDeRelation =>
			options.types[typeChoisi.value] ?? { sortant: '', entrant: '' };

		/** `majUsage()` — la phrase du gel, au caractère près. */
		const majUsage = (): void => {
			const t = libellesDuType();
			usage.textContent = `Se lira « ${t.sortant} » depuis cette note, et « ${t.entrant} » depuis l'autre.`;
		};

		/** `morceau()` du gel : un titre en italique, un libellé en gras, un vide. */
		const morceau = (texte: string | null, gras: boolean): HTMLElement => {
			if (texte === null || texte === '') {
				const vide = document.createElement('span');
				vide.className = 'phrase-rel__vide';
				vide.textContent = '…note à choisir…';
				return vide;
			}
			const noeud = document.createElement(gras ? 'b' : 'i');
			noeud.textContent = texte;
			return noeud;
		};

		/** `majApercuRel()` — les deux phrases, dans l'ordre du gel. */
		const majApercu = (): void => {
			apercu.replaceChildren();
			const t = libellesDuType();
			const autre = visee === null ? null : visee.titre;
			const phrases: readonly (readonly [string | null, string, string | null, string])[] = [
				[options.titreDeLaNote, t.sortant, autre, 'sens direct'],
				[autre, t.entrant, options.titreDeLaNote, 'sens inverse']
			];
			for (const [gauche, milieu, droite, sens] of phrases) {
				const ligne = document.createElement('div');
				ligne.className = 'phrase-rel';
				const marque = document.createElement('span');
				marque.className = 'phrase-rel__sens';
				marque.textContent = sens;
				ligne.appendChild(marque);
				const corps = document.createElement('span');
				corps.append(
					morceau(gauche, false),
					' ',
					morceau(milieu, true),
					' ',
					morceau(droite, false),
					'.'
				);
				ligne.appendChild(corps);
				apercu.appendChild(ligne);
			}
		};

		/** La liste des résultats — vidée, puis repeuplée, comme le gel la fait. */
		const chercher = (): void => {
			const q = cherche.value.trim().toLowerCase();
			liste.replaceChildren();
			if (q === '') {
				liste.setAttribute('data-ouvert', 'non');
				return;
			}
			const trouvees = options.cibles
				.filter((c) => c.titre.toLowerCase().includes(q))
				.slice(0, RESULTATS_DE_RECHERCHE);
			for (const note of trouvees) {
				const entree = document.createElement('button');
				entree.className = 'rel-item';
				entree.type = 'button';
				const titre = document.createElement('div');
				titre.className = 'rel-item__t';
				titre.textContent = note.titre;
				const sous = document.createElement('div');
				sous.className = 'rel-item__s';
				sous.textContent = `${note.type} · ${note.domaine}`;
				entree.append(titre, sous);
				/* `mousedown` et non `click` : le gel le fait ainsi, et pour une
				   raison — le champ de recherche perdrait le focus avant que le clic
				   n'aboutisse, et la liste se refermerait sous le curseur. */
				entree.addEventListener('mousedown', (evenement) => {
					evenement.preventDefault();
					visee = note;
					cherche.value = note.titre;
					liste.setAttribute('data-ouvert', 'non');
					valider.disabled = false;
					majApercu();
				});
				liste.appendChild(entree);
			}
			liste.setAttribute('data-ouvert', liste.children.length > 0 ? 'oui' : 'non');
		};

		/** `prepRelation()` — l'état d'ouverture, remis à neuf à chaque fois. */
		const preparer = (): void => {
			visee = null;
			cherche.value = '';
			liste.replaceChildren();
			liste.setAttribute('data-ouvert', 'non');
			valider.disabled = true;
			majUsage();
			majApercu();
		};

		const ouvrir = (): void => {
			preparer();
			boite.showModal();
		};
		const surType = (): void => {
			majUsage();
			majApercu();
		};
		const declarer = (): void => {
			if (visee === null) return;
			void envoyerLaRelation(options.action, typeChoisi.value, visee.identifiant, boite);
		};

		declencheur.addEventListener('click', ouvrir);
		typeChoisi.addEventListener('change', surType);
		cherche.addEventListener('input', chercher);
		valider.addEventListener('click', declarer);

		/* Les deux boutons `data-fermer` du gel — la croix et « Annuler ». */
		const fermetures = Array.from(boite.querySelectorAll<HTMLButtonElement>('[data-fermer]'));
		const fermer = (): void => boite.close();
		for (const bouton of fermetures) bouton.addEventListener('click', fermer);

		preparer();

		return () => {
			declencheur.removeEventListener('click', ouvrir);
			typeChoisi.removeEventListener('change', surType);
			cherche.removeEventListener('input', chercher);
			valider.removeEventListener('click', declarer);
			for (const bouton of fermetures) bouton.removeEventListener('click', fermer);
		};
	}

	/**
	 * L'ENVOI À L'ACTION `ajouter` DE `/notes/{identifiant}/relations`.
	 *
	 * `deserialize` DE SVELTEKIT EST EMPLOYÉ, et il n'est pas décoratif : la
	 * réponse d'une action est sérialisée par `devalue`, qui porte des formes que
	 * `JSON` perd. C'est le geste de `/importer`, et pour la même raison.
	 *
	 * AUCUNE ACTION N'EST CRÉÉE POUR CE GESTE. `ajouter` existe, elle est éprouvée
	 * et elle porte les deux règles qui comptent ; en écrire une seconde ici
	 * ferait deux chemins pour un même geste, dont l'un finirait par diverger.
	 */
	async function envoyerLaRelation(
		action: string,
		type: string,
		cible: string,
		boite: HTMLDialogElement
	): Promise<void> {
		const corps = new FormData();
		corps.append('type', type);
		corps.append('cible', cible);
		const reponse = await fetch(action, { method: 'POST', body: corps });
		const resultat = deserialize(await reponse.text());
		if (resultat.type === 'success') {
			boite.close();
			/* La relation apparaît des DEUX côtés, et le panneau de cette note est
			   servi par le chargeur : c'est lui qu'il faut refaire parler. */
			boite.ownerDocument.location.reload();
			return;
		}
		const charge = resultat.type === 'failure' ? (resultat.data ?? null) : null;
		const annonce = charge === null ? undefined : charge['motif'];
		const motif = typeof annonce === 'string' ? annonce : 'la relation n’a pas pu être déclarée';
		boite.ownerDocument.defaultView?.alert(`Relation refusée : ${motif}.`);
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
		<!--
			L’ARTICLE SUIT L’ADRESSE. `?version={n}` désignant une version
			antérieure, c’est l’état CAPTURÉ par cette version que le chargeur rend
			— son titre et ses deux corps —, et non celui d’aujourd’hui : le
			bandeau annonce « vous consultez un état antérieur », et le corps sous
			lui doit être celui-là. `?version` nu ne désigne aucune version, la
			note courante EST la réponse, et `afficheeDeLaVersion` vaut `null`.
		-->
		<Historique
			vecteur={{ panneau: 'ouvert', droits: data.vecteur.droits }}
			notes={data.notes}
			note={data.lecture.note}
			affichee={data.afficheeDeLaVersion ?? data.affichee}
			versions={{ [data.lecture.note.id]: data.histoire.versions }}
			retentionVersions={data.histoire.retention}
			versionAffichee={data.histoire.affichee?.numero ?? null}
			onComparer={(a, b) => {
				/* `resolve()` compose le CHEMIN ; la chaîne de requête s'ajoute après,
				   et la règle ne sait pas la reconnaître — même désarmement qu'en
				   V-03, V-13, V-22, V-24 et à la console analytique. */
				const adresse =
					resolve('/notes/[identifiant]/comparaison', {
						identifiant: data.lecture.note.id
					}) + `?versions=${a}-${b}`;
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				void goto(adresse);
			}}
		/>
	{:else}
		<Vue
			adresseDesRelations={resolve('/notes/[identifiant]/relations', {
				identifiant: data.lecture.note.id
			})}
			vecteur={data.vecteur}
			notes={data.notes}
			affichee={data.affichee}
			panneaux={data.panneaux}
		/>
	{/if}
</form>

<!--
	LA BOÎTE « AJOUTER UNE RELATION », HORS DU FORMULAIRE — ET C'EST DÉLIBÉRÉ.

	Elle porte un sélecteur et un champ de recherche. À l'intérieur de
	l'enveloppe `<form action="?/supprimer">`, ils en deviendraient des champs, et
	partiraient avec une suppression. Elle vit donc en frère du formulaire, où le
	gel la met : `mockups/V-40-dialogues.html:1228` la pose au premier niveau du
	document, hors de `div.app`.

	`P-09` — ELLE N'EST MONTÉE QUE SI LE GESTE EST POSSIBLE. `data.relation` vaut
	`null` sans le droit d'écrire : ni la boîte, ni ses actions n'entrent alors
	dans le DOM. Et pas davantage quand l'historique est ouvert : c'est V-15 qui
	est à l'écran, et son panneau « Relations » n'existe pas.

	`catalogue={false}` — le seul dialogue nommé, sans le cadre de la planche et
	sans attribut `open` : la modalité est posée au clic par `showModal()`.
-->
{#if !historiqueOuvert && data.relation !== null}
	<Dialogues
		etat="d-relation"
		catalogue={false}
		notes={data.notes}
		note={data.lecture.note}
		{typesRelation}
	/>
{/if}

<!--
	LA BOÎTE D'AGRANDISSEMENT — transcrite du gel, et montée par la route.

	`mockups/V-14-lecture-note.html:1933-1941`, à l'octet. `src/vues/V-14.svelte`
	ne la porte pas, et son en-tête dit pourquoi : un `dialog` FERMÉ ne déclare
	aucune boîte de rendu, ne déplace aucun pixel et n'entre pas dans
	l'instantané ARIA — le banc de comparaison ne pouvait donc pas la mesurer, et
	l'y écrire n'aurait rien prouvé.

	SANS ELLE, LE CADRE DE FIGURE EST UN BOUTON QUI NE FAIT RIEN, et
	`rendreDocument()` en compose un pour CHAQUE figure de CHAQUE note lue
	(`src/lib/contenu/rendu.ts`) : ce n'est pas un ornement de démonstration,
	c'est le seul moyen de lire un schéma dense. Elle est donc montée ici, comme
	`d-relation` juste au-dessus et pour la même raison — `docs/routes.md:211`,
	« chaque dialogue s'exécute dans la vue qui le déclenche ».

	HORS DU FORMULAIRE, et pour la raison de sa voisine : ses nœuds ne doivent
	pas devenir des champs de l'enveloppe qui vise la suppression. Le bouton
	porte son type explicitement, ce que le gel n'avait pas à faire.

	Sa feuille est celle de V-14, déjà importée par cette page, et elle n'est pas
	modifiée : les cinq règles de la famille y sont, telles que le gel les écrit.
-->
<dialog class="loupe" id="loupe">
	<div class="loupe__boite">
		<div id="loupe-contenu"></div>
		<div class="loupe__pied">
			<span id="loupe-legende"></span>
			<button class="btn" type="button" id="loupe-fermer"
				>Fermer <kbd class="touche">Échap</kbd></button
			>
		</div>
	</div>
</dialog>
