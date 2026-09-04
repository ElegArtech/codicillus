<script lang="ts">
	/**
	 * `/notes/{identifiant}` — V-14 Lecture d'une note. `ARB-063` : la vue reste au gel, et
	 * la route lui donne ses gestes.
	 *
	 * LA CONFIRMATION DE SUPPRESSION EST CHIFFRÉE — `RG-M04-10` veut le titre, le nombre de
	 * rétroliens qui deviendront cassés, et le nombre de versions perdues. Les trois
	 * quantités sont SERVIES par le chargeur : rien n'est compté à l'écran. La FORME reste
	 * un écart déclaré — le gel porte un dialogue que V-14 ne transcrit pas.
	 *
	 * LES PIÈCES JOINTES SONT CÂBLÉES ICI, ET NULLE PART AILLEURS : le gel dessine le
	 * panneau INERTE — deux `a.pj` en `href="#"`, aucun bouton —, et y ajouter un bouton
	 * changerait la structure du gel. Trois choses sont posées sur le document vivant :
	 * l'ADRESSE des liens, servie par le chargeur ; un DÉPÔT à la forme du geste voisin ;
	 * un RETRAIT à la forme du `×` des pastilles. Aucune valeur de couleur, d'espacement,
	 * de rayon ou de police n'est écrite (`ADR-002`).
	 *
	 * LE DÉPÔT PORTE SON ENCODAGE SUR LE SOUMETTEUR, PAS SUR LE FORMULAIRE, qui vise
	 * `?/supprimer` : réécrire `formulaire.action` avant `requestSubmit()` est une COURSE,
	 * et elle a fait partir une restauration vers une suppression.
	 */
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { deserialize } from '$app/forms';
	import Vue from '../../../vues/V-14.svelte';
	import '../../../vues/V-14.css';
	import { page } from '$app/state';
	import { cablerLaSuppression, cablerLHistorique } from '$lib/cablage/formulaires';
	import { porteLeGeste } from '$lib/cablage/libelles';
	import { formeDeLecture, type FormeDeLecture } from '$lib/fichiers/affichage';
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
	 * LES TYPES DE RELATION, DANS LA FORME QUE LE DIALOGUE LIT : `d-relation`
	 * remplit son sélecteur par `Object.entries(typesRelation)`. Le chargeur sert
	 * une LISTE ordonnée par l'ordre d'administration ; la table est composée dans
	 * cet ordre-là, que l'insertion préserve.
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
	 * L'HISTORIQUE EST UN ÉTAT DE CETTE ADRESSE, PAS UNE AUTRE PAGE. V-15 n'a pas
	 * de chemin propre : elle est superposée à `/notes/{identifiant}`, et son unique
	 * état adressable est `?version={n}` — `?version` nu désignant la version
	 * courante. La présence du paramètre décide laquelle des deux vues est montée,
	 * et rien d'autre : ni un état local, ni un booléen inventé.
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
		/* AUCUN BOUTON DU GEL NE SOUMET — et sans cette ligne, ils soumettaient TOUS,
		   vers `?/supprimer`. « Imprimer », « Modifier la référence », « Historique
		   des versions » et « Exporter » partaient en suppression.

		   LA CAUSE EST UNE RÈGLE DE HTML : un `button` sans attribut `type`, dans un
		   formulaire, est un bouton de SOUMISSION. Le gel n'en pose aucun — ses
		   boutons portent des comportements, absents par `ARB-011` —, et l'enveloppe
		   `<form action="?/supprimer">` qu'exige `RG-M04-10` leur en a donné un.

		   La suppression, elle, ne passe pas par un bouton de soumission :
		   `cablerLaSuppression` appelle `requestSubmit()` après confirmation. */
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
		 * LE DIALOGUE `d-relation`, câblé sur le DOCUMENT et non sur le formulaire :
		 * la boîte vit hors de l'enveloppe `<form action="?/supprimer">`, exprès. Ses
		 * champs seraient sinon des champs de ce formulaire-là, et partiraient avec
		 * une suppression.
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
		/* AUCUN BOUTON DU GEL NE SOUMET — sans cette ligne, ils soumettaient TOUS vers
		   `?/supprimer` : « Imprimer », « Modifier la référence », « Historique des
		   versions » et « Exporter » partaient en suppression.

		   LA CAUSE EST UNE RÈGLE DE HTML : un `button` sans attribut `type`, dans un
		   formulaire, est un bouton de SOUMISSION. Le gel n'en pose aucun — ses boutons
		   portent des comportements, absents par `ARB-011` —, et l'enveloppe
		   `<form action="?/supprimer">` qu'exige `RG-M04-10` leur en a donné un.

		   La suppression, elle, passe par `requestSubmit()` après confirmation. */
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

	interface CablageDesPieces {
		readonly pieces: readonly { nom: string; adresse: string; typeMedia: string }[];
		/** `RG-M05-08` / `P-09` — sans le droit d'écrire, aucun geste n'est POSÉ. */
		readonly ecriture: boolean;
	}

	/* ═══════════════════════════════ La visionneuse ═════════════════════════ */

	/**
	 * LIRE UNE PIÈCE SANS QUITTER LA NOTE.
	 *
	 * Le lien du panneau menait aux octets, et le navigateur en faisait ce que
	 * `content-disposition` lui disait : un téléchargement. Une image et un PDF
	 * n'ont pas besoin de sortir pour être lus — tout navigateur les rend —, et les
	 * faire sortir COUPE LA LECTURE : le fichier s'ouvre ailleurs, la note qui le
	 * portait n'est plus à l'écran, et le contexte qui justifiait la pièce est
	 * perdu. Les deux familles s'ouvrent donc EN PLACE, dans une boîte modale
	 * au-dessus de la note ; tout le reste garde le lien nu, qui télécharge.
	 *
	 * `formeDeLecture()` DÉCIDE, ET C'EST LE MÊME PRÉDICAT QUE LE SERVEUR emploie
	 * pour sa disposition (`P-01`) : une pièce que la boîte afficherait et que la
	 * route servirait en `attachment` déclencherait un téléchargement depuis le
	 * cadre, laissant la boîte vide sans la moindre erreur.
	 *
	 * LA BOÎTE VIT SUR LE `document`, JAMAIS DANS LE FORMULAIRE : l'article de la
	 * note est enveloppé d'un `<form action="?/supprimer">` (`RG-M04-10`), et tout
	 * bouton qui y naîtrait partirait en suppression.
	 */
	const MARQUE_DE_LA_BOITE = 'visionneuse';

	interface PieceLisible {
		readonly nom: string;
		readonly adresse: string;
		readonly forme: FormeDeLecture;
	}

	/** La boîte, créée une fois par document et retrouvée ensuite par sa marque. */
	function boiteDeLecture(doc: Document): HTMLDialogElement {
		const posee = doc.querySelector<HTMLDialogElement>(`dialog[data-${MARQUE_DE_LA_BOITE}]`);
		if (posee !== null) return posee;

		/* LE VOILE DE LA BOÎTE MODALE. Il ne s'atteint que par le pseudo-élément
		   `::backdrop`, qu'aucun attribut de style en ligne ne porte : il faut une
		   règle, donc une feuille. Sans lui, la boîte s'ouvre par-dessus une page
		   qui reste vive à l'œil alors qu'elle ne répond plus. */
		const feuille = doc.createElement('style');
		feuille.dataset[MARQUE_DE_LA_BOITE + 'Voile'] = 'oui';
		feuille.textContent =
			'dialog[data-' + MARQUE_DE_LA_BOITE + ']::backdrop{background:rgba(17,17,17,.55)}';
		doc.head.append(feuille);

		const boite = doc.createElement('dialog');
		boite.dataset[MARQUE_DE_LA_BOITE] = 'oui';
		boite.setAttribute('aria-label', 'Pièce jointe');
		boite.style.cssText =
			'padding:0;border:1px solid var(--c-trait-fort);border-radius:var(--r-2);' +
			'background:var(--c-papier);max-width:min(1100px,94vw);width:94vw;' +
			'max-height:94vh;overflow:hidden';

		const tete = doc.createElement('div');
		tete.style.cssText =
			'display:flex;align-items:center;gap:var(--e-3);padding:var(--e-3);' +
			'border-bottom:1px solid var(--c-trait);font-family:var(--f-ui)';

		const titre = doc.createElement('strong');
		titre.dataset[MARQUE_DE_LA_BOITE + 'Titre'] = 'oui';
		titre.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis';

		/* LE TÉLÉCHARGEMENT RESTE OFFERT : lire en place ne remplace pas emporter.
		   `download` demande la sortie du fichier malgré la disposition `inline`. */
		const emporter = doc.createElement('a');
		emporter.className = 'btn btn--discret';
		emporter.dataset[MARQUE_DE_LA_BOITE + 'Emporter'] = 'oui';
		emporter.append('Télécharger');

		const fermer = doc.createElement('button');
		fermer.type = 'button';
		fermer.className = 'btn btn--discret';
		fermer.append('Fermer');
		fermer.addEventListener('click', () => boite.close());

		tete.append(titre, emporter, fermer);

		const corps = doc.createElement('div');
		corps.dataset[MARQUE_DE_LA_BOITE + 'Corps'] = 'oui';
		corps.style.cssText =
			'display:flex;align-items:center;justify-content:center;' +
			'background:var(--c-fond);height:82vh;overflow:auto';

		boite.append(tete, corps);
		doc.body.append(boite);
		return boite;
	}

	/** Ouvre la boîte sur une pièce — son contenu est refait à chaque ouverture. */
	function ouvrirLaPiece(doc: Document, piece: PieceLisible): void {
		const boite = boiteDeLecture(doc);
		const titre = boite.querySelector(`[data-${MARQUE_DE_LA_BOITE}-titre]`);
		if (titre !== null) titre.textContent = piece.nom;
		const emporter = boite.querySelector<HTMLAnchorElement>(
			`a[data-${MARQUE_DE_LA_BOITE}-emporter]`
		);
		if (emporter !== null) {
			emporter.href = piece.adresse;
			emporter.download = piece.nom;
		}
		const corps = boite.querySelector<HTMLElement>(`[data-${MARQUE_DE_LA_BOITE}-corps]`);
		if (corps === null) return;
		corps.replaceChildren();

		if (piece.forme === 'image') {
			const vue = doc.createElement('img');
			vue.src = piece.adresse;
			vue.alt = piece.nom;
			vue.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain';
			corps.append(vue);
		} else {
			/* UN CADRE, ET NON UN `<embed>` : le cadre porte un titre accessible et
			   se recharge proprement d'une ouverture à l'autre. Le rendu est celui
			   de la visionneuse du navigateur — rien n'est embarqué dans le paquet. */
			const cadre = doc.createElement('iframe');
			cadre.src = piece.adresse;
			cadre.title = piece.nom;
			cadre.style.cssText = 'width:100%;height:100%;border:0';
			corps.append(cadre);
		}
		boite.showModal();
	}

	/**
	 * LE PANNEAU, REPÉRÉ PAR SON LIBELLÉ : le gel ne donne aux panneaux latéraux ni
	 * identifiant ni classe distinctive — autant de `section.panneau.repliable`
	 * identiques, que seul le texte de leur `.etiq` sépare.
	 *
	 * `Document | Element`, ET SURTOUT PAS `ParentNode` : celui-ci est une interface
	 * de typage, pas un objet global du navigateur, et `no-undef` la refuse.
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
	 * LES GESTES DE LA LECTURE ELLE-MÊME, POSÉS APRÈS LA NEUTRALISATION et jamais
	 * avant : le câblage n'écrit aucun attribut de type, il compte sur celui que la
	 * boucle ci-dessus a posé. Poser l'un sans l'autre rendrait « Marquer comme
	 * vérifié » soumetteur ET écouté, donc parti deux fois — la seconde vers la
	 * suppression.
	 *
	 * Quand l'historique est ouvert, c'est V-15 qui est à l'écran : elle partage
	 * l'article de V-14, donc les gestes de la fraîcheur valent aussi là.
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
	 * précédent aurait posés, reconnaissables à leur marque. Sans quoi un remontage
	 * doublerait les boutons — invisible tant qu'une soumission recharge la page.
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

			/* CE QUI SE LIT EN PLACE S'OUVRE DANS LA BOÎTE, LE RESTE GARDE LE LIEN.
			   L'adresse reste posée dans les deux cas : sans script, le lien mène
			   toujours aux octets, et le clic interrompu ne l'est que par ce
			   câblage-ci. */
			const forme = formeDeLecture(piece.typeMedia);
			if (forme !== null) {
				const lire = (evenement: MouseEvent): void => {
					evenement.preventDefault();
					ouvrirLaPiece(document, { nom: piece.nom, adresse: piece.adresse, forme });
				};
				lien.addEventListener('click', lire);
				debranchements.push(() => lien.removeEventListener('click', lire));
			}

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

		/* LE DÉPÔT. Le champ de fichier vit DANS le formulaire — la seule façon
		   qu'il soit soumis — et il est caché : c'est le bouton du panneau qui
		   l'ouvre, de la même forme que le « + Ajouter » du panneau voisin. */
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

	interface CibleDeRelation {
		readonly identifiant: string;
		readonly titre: string;
		readonly type: string;
		readonly domaine: string;
	}

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
	 * LE DIALOGUE `d-relation`, MONTÉ DANS LA VUE QUI LE DÉCLENCHE — `V-40:3252` dit
	 * `ou: "V-14"`, et `docs/routes.md:211` ferme la question. L'ACTION RESTE CELLE DE
	 * `/notes/{identifiant}/relations`, inchangée : c'est elle qui porte `RG-M08-03`,
	 * `RG-M08-04` et le refus indiscernable d'une inexistence.
	 *
	 * LES QUATRE GESTES DU SCRIPT GELÉ SONT TRANSCRITS, dont `majUsage()` au caractère
	 * près dans les libellés du type SÉLECTIONNÉ (`RG-M08-06`) et la sélection au
	 * `mousedown`, pour que le champ ne perde pas le focus avant le clic. AUCUN NŒUD DU
	 * GEL N'EST CRÉÉ NI RETIRÉ EN DEHORS DE `#rel-liste` ET `#rel-apercu`, VIDES au
	 * gel ; aucune classe n'est inventée, aucune règle de style n'est écrite.
	 *
	 * LA MODALITÉ EST UN COMPORTEMENT, DONC ELLE EST ICI : `showModal()`, et non
	 * l'attribut `open` — lui seul donne le voile `::backdrop`, le piège de focus et la
	 * fermeture par Échap que `RG-M18-08` exige.
	 *
	 * UN REFUS N'A PAS DE VÊTEMENT AU GEL : la maquette annonce l'issue par
	 * `window.notifier`, que le produit n'a pas, et le motif est dit par `alert()`.
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

		/**
		 * CE QUI EMPÊCHE LA DÉCLARATION D'ABOUTIR, LU UNE FOIS À L'OUVERTURE : le
		 * référentiel de types est vide sur une instance neuve, et le périmètre
		 * d'écriture ne contient parfois que la note qu'on lit. Les deux faits sont
		 * DITS PAR LA BOÎTE (`src/vues/V-40.svelte`) ; ce câblage ne les redit pas et
		 * ne compose aucune phrase sur un libellé absent.
		 */
		const sansType = Object.keys(options.types).length === 0;
		const sansCible = options.cibles.length === 0;
		const impossible = sansType || sansCible;

		const libellesDuType = (): LibellesDeRelation =>
			options.types[typeChoisi.value] ?? { sortant: '', entrant: '' };

		/** `majUsage()` — la phrase du gel, au caractère près. */
		const majUsage = (): void => {
			/* Sans type, le repli rend deux chaînes vides et la phrase devient « Se
			   lira «  » depuis cette note… ». La vue a écrit à la place ce qui manque
			   et où le créer : on la laisse parler. */
			if (sansType) return;
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
			/* Rien à produire : la zone reste telle que la vue la rend — vide, et sans
			   le libellé qui promettrait un aperçu. */
			if (impossible) return;
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
			if (impossible) return;
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
				/* `mousedown` et non `click` : le champ de recherche perdrait le focus
				   avant que le clic n'aboutisse, et la liste se refermerait sous le
				   curseur. */
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
			/* `P-09` — un champ qui ne peut rien trouver ne se propose pas. La vue pose
			   déjà l'attribut au rendu ; il est reposé ici pour que l'état survive à une
			   réouverture. */
			cherche.disabled = impossible;
			typeChoisi.disabled = sansType;
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
	 * SOUMETTRE VERS UNE ACTION NOMMÉE — par le SOUMETTEUR, jamais en réécrivant
	 * l'attribut du formulaire. `formaction` et `formenctype` l'emportent tous deux
	 * sur le formulaire, et `requestSubmit(soumetteur)` désigne lequel s'applique ;
	 * un dépôt de fichier exige le multipart, que le formulaire enveloppant n'a
	 * aucune raison de porter.
	 *
	 * LE GESTE NAÏF EST UNE COURSE, ET ELLE A MORDU : poser `formulaire.action` puis
	 * soumettre puis remettre l'ancienne valeur a fait partir une restauration vers
	 * la SUPPRESSION, le navigateur lisant l'attribut après le retour de
	 * `requestSubmit()`.
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
	 * IL NE S'APPELLE PAS `fichier` : le champ de dépôt porte déjà ce nom-là, et les
	 * deux vivent dans le MÊME formulaire — deux champs homonymes rendent le PREMIER
	 * dans l'ordre du document, et le retrait aurait reçu un fichier vide.
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
	 * LE BOUTON « HISTORIQUE DES VERSIONS » DE V-14 — il ouvre l'état, il ne fait
	 * rien d'autre. Le gel le pose sans comportement (`ARB-011`).
	 *
	 * `Element` ET NON `ParentNode` : celui-ci est une interface de typage, pas un
	 * objet global du navigateur, et `no-undef` la refuse.
	 */
	function ouvrirLHistorique(racine: Element, cible: string): () => void {
		const bouton = Array.from(racine.querySelectorAll('button')).find((b) =>
			porteLeGeste(b, 'historiqueDesVersions')
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
			L’ARTICLE SUIT L’ADRESSE. `?version={n}` désignant une version antérieure,
			c’est l’état CAPTURÉ par cette version que le chargeur rend, et non celui
			d’aujourd’hui. `?version` nu ne désigne aucune version, la note courante EST
			la réponse, et `afficheeDeLaVersion` vaut `null`.
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
				/* `resolve()` compose le CHEMIN ; la chaîne de requête s'ajoute après, et
				   la règle ne sait pas la reconnaître. */
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
			notifications={data.notifications}
		/>
	{/if}
</form>

<!--
	LA BOÎTE « AJOUTER UNE RELATION », HORS DU FORMULAIRE — ET C'EST DÉLIBÉRÉ. Elle
	porte un sélecteur et un champ de recherche : à l'intérieur de l'enveloppe
	`<form action="?/supprimer">`, ils en deviendraient des champs et partiraient
	avec une suppression. Elle vit donc en frère du formulaire, où le gel la met.

	`P-09` — ELLE N'EST MONTÉE QUE SI LE GESTE EST POSSIBLE. `data.relation` vaut
	`null` sans le droit d'écrire. Et pas davantage quand l'historique est ouvert :
	c'est V-15 qui est à l'écran, et son panneau « Relations » n'existe pas.

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
		ciblesDeRelation={data.relation.cibles}
	/>
{/if}

<!--
	LA BOÎTE D'AGRANDISSEMENT — transcrite du gel (`V-14:1933-1941`), et montée par
	la route. `src/vues/V-14.svelte` ne la porte pas : un `dialog` FERMÉ ne déclare
	aucune boîte de rendu et n'entre pas dans l'instantané ARIA, le banc de
	comparaison ne pouvait donc pas la mesurer.

	SANS ELLE, LE CADRE DE FIGURE EST UN BOUTON QUI NE FAIT RIEN, et
	`rendreDocument()` en compose un pour CHAQUE figure de CHAQUE note lue.

	HORS DU FORMULAIRE, pour la raison de sa voisine : ses nœuds ne doivent pas
	devenir des champs de l'enveloppe qui vise la suppression. Le bouton porte son
	type explicitement, ce que le gel n'avait pas à faire.
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
