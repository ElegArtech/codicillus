<script lang="ts">
	/**
	 * Coquille applicative — la navigation latérale, 300 px.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (P-1, ADR-002) : tout est dans la section
	 * « 4 ter » de `src/socle.css`. Le chevron déplie, le nom navigue.
	 *
	 * SEPT ZONES, DE HAUT EN BAS — la marque, le champ de recherche, le label UNIVERS,
	 * l'arborescence dépliable, « + Créer un univers », les RÉCENTS, la carte de compte.
	 *
	 * LE RENDU EST SERVEUR ET SANS HYDRATATION. Ce qui suppose un script :
	 *   • le chevron d'une branche (`$lib/cablage/coquille.ts`) — et les branches du
	 *     chemin courant sont dépliées PAR LE SERVEUR, donc l'arbre reste utilisable ;
	 *   • le champ de recherche, qui ouvre la palette — il retombe sur `/recherche`.
	 * La carte de compte, elle, est un `details` NATIF : son menu s'ouvre sans script,
	 * et ses entrées sont des liens, pas des boutons à câbler.
	 *
	 * P-03 / P-09 — L'ABSENCE, ET NON LE MASQUAGE : une entrée dont la cible rendrait
	 * 404 n'est pas émise. « + Créer un univers » mène à la console et n'est donc émise
	 * qu'à l'administrateur ; « Import » demande de pouvoir écrire quelque part.
	 */
	import { getContext, onMount, tick } from 'svelte';
	import { deserialize } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { base as racineDesAssets, resolve } from '$app/paths';
	import { page } from '$app/state';
	import Pictogramme from '$lib/console/Pictogramme.svelte';
	import {
		CHAMP_DOMAINE_CIBLE,
		CHAMP_NOM,
		CHAMP_UNIVERS_CIBLE,
		CHAMP_UNIVERS_DE_RATTACHEMENT
	} from '$lib/console/structure';
	import { identifiantLisible } from '$lib/rangement/adresses';
	import { accord } from '$lib/vocabulaire';
	import { cheminDuFichier, fichiersDuTransfert } from '$lib/cablage/depot-de-fichiers';
	import { scenarioDuDepotSurLeRail } from '$lib/donnees/scenarios-d-import';
	import {
		AUCUNE_PAGE,
		railRendu,
		sectionsDuRail,
		type NoeudRendu,
		type SectionRendue
	} from './arborescence';
	import { COMPTE_VIDE } from './compte-vide';
	import { glypheDUnivers, iconeDeNoeud } from './glyphes';
	import type { SectionAbregeeRendue } from './arborescence-abregee';
	import {
		CLE_IDENTITE,
		designationsDeCoquille,
		type CompteAffiche,
		type IdentiteDeCoquille,
		type NoteRecente
	} from './identite';

	interface Proprietes {
		/**
		 * Les univers, leurs domaines, leurs dossiers et leurs notes, DÉJÀ RENDUS
		 * pour la page courante — `Coquille.svelte` seule sait laquelle c'est.
		 *
		 * ABSENTE, LE RAIL SE DÉRIVE DU CONTEXTE D'IDENTITÉ, sans page courante : une
		 * vue qui monte le rail sans passer par la coquille garde ainsi une
		 * navigation réelle, au lieu du rail vide qu'elle affichait.
		 */
		sections?: readonly SectionRendue[] | undefined;
		/** Les cinq dernières notes consultées. Vide : la section n'est pas rendue. */
		recents?: readonly NoteRecente[] | undefined;
		/** Le compte affiché par la carte du bas. Absent : celui du contexte. */
		compte?: CompteAffiche | undefined;
		/**
		 * La version du produit, telle que `package.json` la déclare. Elle vit au bas
		 * du menu de compte : la référence ne lui donne pas de place propre, et la
		 * perdre priverait le support du seul numéro qu'un utilisateur peut lire.
		 */
		version: string;
		/**
		 * DROITS EFFECTIFS — P-09. En lecture seule, les entrées d'écriture ne sont
		 * pas ÉMISES. Absente : aucune restriction.
		 */
		droits?: 'ecriture' | 'lecture' | undefined;
		/**
		 * PROFIL — P-09, RG-DRO-03. La console et la création d'un univers ne sont
		 * ÉMISES que pour l'administrateur : elles rendent 404 à tout autre.
		 */
		role?: 'referent' | 'admin';
		/**
		 * LES DEUX ENTRÉES DE CRÉATION QUI EXIGENT UN DOMAINE — émises, ou pas du
		 * tout. Le verdict vient de `+layout.server.ts`, un prédicat par cible.
		 */
		creations?: { readonly dossier: boolean; readonly signet: boolean };
		/** Le rattachement du compte, qui donne l'adresse des deux entrées ci-dessus. */
		rangement?: { readonly univers: string; readonly domaine: string } | null | undefined;
		/** La page courante EST l'accueil — le lien de la marque n'y mène plus. */
		accueilCourant?: boolean;
		/** L'identifiant de la note ouverte — la ligne « Récents » qui la porte est active. */
		noteCourante?: string | null;
		/**
		 * LA FORME ABRÉGÉE N'EXISTE PLUS, ET SES DEUX PROPRIÉTÉS SONT ACCEPTÉES SANS
		 * ÊTRE LUES. Vingt-six vues portaient un rail écrit au balisage, dont l'arbre
		 * n'était pas celui du corpus : deux navigations pour un seul produit, et la
		 * seconde mentait. Il n'y en a plus qu'une, et elle se dérive des données.
		 *
		 * Les propriétés restent déclarées parce que des vues les passent encore, et
		 * que le compilateur les casserait toutes.
		 */
		forme?: 'complete' | 'abregee';
		sectionsAbregees?: readonly SectionAbregeeRendue[];
	}

	const {
		sections,
		recents,
		compte,
		version,
		droits,
		role = 'referent',
		creations = { dossier: true, signet: true },
		rangement,
		accueilCourant = false,
		noteCourante = null
	}: Proprietes = $props();

	/**
	 * L'IDENTITÉ RÉELLE L'EMPORTE — `./identite.ts` porte le contrat. Hors
	 * application, `getContext` rend `undefined` et les propriétés s'appliquent.
	 */
	const identite = getContext<IdentiteDeCoquille | undefined>(CLE_IDENTITE);
	const designations = designationsDeCoquille();

	/**
	 * L'ARBORESCENCE — celle que la coquille a rendue pour la page courante, ou,
	 * à défaut, celle que le contexte permet de dériver SANS page courante.
	 */
	const arbre = $derived(
		sections ??
			(identite === undefined
				? []
				: railRendu(
						sectionsDuRail(identite.univers, identite.domaines, identite.notes ?? []),
						AUCUNE_PAGE,
						null,
						designations
					))
	);
	let replie = $state(false);
	onMount(() => {
		try {
			replie = localStorage.getItem('codicillus-rail-replie') === 'oui';
		} catch {
			// La navigation reste disponible si le stockage est désactivé.
		}
	});
	function basculerLeRail(): void {
		replie = !replie;
		fermerLeMenu();
		try {
			localStorage.setItem('codicillus-rail-replie', replie ? 'oui' : 'non');
		} catch {
			// Le choix reste valable pour cet écran.
		}
	}

	const compteAffiche = $derived(compte ?? identite?.compte ?? COMPTE_VIDE);
	const recentsAffiches = $derived(recents ?? identite?.recents ?? []);

	const ecriture = $derived(role === 'admin' || droits !== 'lecture');
	const admin = $derived(role === 'admin');

	/**
	 * L'ENTRÉE « Modélisation » — ÉMISE SEULEMENT SI LE MODULE VIT QUELQUE PART que
	 * l'appelant lit. Elle était inconditionnelle, et menait donc à un écran vide sur
	 * toute instance qui n'a activé le module nulle part : `P-03`, une entrée de
	 * navigation visible est une entrée qui fonctionne.
	 *
	 * LE VERDICT VIENT DU GABARIT RACINE — le seul chargeur qui s'exécute sous TOUTES
	 * les routes —, lu comme la coquille lit `ecriture`.
	 *
	 * LE CONTEXTE D'IDENTITÉ GARDE LA LECTURE, et ce n'est pas une précaution : hors
	 * application, `page` de `$app/state` n'a AUCUN état de requête et sortir sa
	 * propriété `data` lève. Le contexte n'est posé que par `+layout.svelte` — son
	 * absence dit exactement « nous ne sommes pas dans une requête », et l'entrée
	 * n'est alors pas émise : le rail d'un banc de rendu ne promet rien.
	 *
	 * L'ENTRÉE « Cartographie » N'EST PAS TOUCHÉE, et l'asymétrie est assumée : elle
	 * sert aujourd'hui, rien ne l'a signalée comme un défaut, et la fermer ferait
	 * disparaître une entrée dont on se sert.
	 */
	const modelisationOfferte = $derived(
		identite !== undefined && page.data['modelisationOfferte'] === true
	);

	/**
	 * LES MOTIFS DE ROUTE, ÉCRITS EN CONSTANTES pour que
	 * `svelte/no-navigation-without-resolve` voie `resolve()` appelée sur un motif
	 * connu. `resolve()` n'accepte pas de chaîne de requête : celle de « Signets »
	 * est concaténée après, le chemin passant par la résolution du cadre.
	 */
	const ROUTE_UNIVERS = '/univers/[univers]' as const;
	const ROUTE_DOMAINE = '/univers/[univers]/[domaine]' as const;
	const ROUTE_DOSSIER = '/univers/[univers]/[domaine]/dossiers/[...chemin]' as const;
	const ROUTE_NOTE = '/notes/[identifiant]' as const;

	type TypeDeCibleContextuelle = 'univers' | 'domaine' | 'dossier' | 'note';
	interface CibleContextuelle {
		readonly type: TypeDeCibleContextuelle;
		readonly nom: string;
		readonly cible: NoeudRendu['cible'];
		readonly identifiant: string | null;
		readonly decompte: {
			readonly domaines: number;
			readonly dossiers: number;
			readonly notes: number;
		};
	}

	let menuContextuel = $state<CibleContextuelle | null>(null);
	let positionDuMenu = $state({ x: 0, y: 0 });
	let elementDuMenu = $state<HTMLDivElement>();
	let boiteDeSuppression = $state<HTMLDialogElement>();
	let suppressionDemandee = $state<CibleContextuelle | null>(null);
	let confirmationDeSuppression = $state('');
	let suppressionEnCours = $state(false);
	let erreurDeSuppression = $state<string | null>(null);
	let elementDeplace = $state<CibleContextuelle | null>(null);
	let notesSelectionnees = $state<CibleContextuelle[]>([]);
	let cibleDeDepot = $state<string | null>(null);
	let brancheSurvolee: string | null = null;
	let ouvertureAuSurvol: ReturnType<typeof setTimeout> | undefined;
	function annulerLOuverture(): void {
		clearTimeout(ouvertureAuSurvol);
		ouvertureAuSurvol = undefined;
		brancheSurvolee = null;
	}
	onMount(() => () => annulerLOuverture());
	let importEnCours = $state(false);
	let renommage = $state<{
		cible: CibleContextuelle;
		valeur: string;
		envoi: boolean;
		erreur: string | null;
	} | null>(null);

	function decompteDesNoeuds(noeuds: readonly NoeudRendu[]): {
		readonly dossiers: number;
		readonly notes: number;
	} {
		let dossiers = 0;
		let notes = 0;
		for (const noeud of noeuds) {
			if (noeud.type === 'note') notes += 1;
			if (noeud.type === 'dossier') dossiers += 1;
			const enfants = decompteDesNoeuds(noeud.enfants);
			dossiers += enfants.dossiers;
			notes += enfants.notes;
		}
		return { dossiers, notes };
	}

	function cibleDeNoeud(noeud: NoeudRendu): CibleContextuelle {
		const contenu = decompteDesNoeuds(noeud.enfants);
		return {
			type: noeud.type,
			nom: noeud.nom,
			cible: noeud.cible,
			identifiant: noeud.identifiant,
			decompte: {
				domaines: 0,
				dossiers: contenu.dossiers,
				notes: noeud.type === 'note' ? 1 : contenu.notes
			}
		};
	}

	function cibleDUnivers(section: SectionRendue): CibleContextuelle {
		const contenu = decompteDesNoeuds(section.domaines);
		return {
			type: 'univers',
			nom: section.nom,
			cible: section.cible,
			identifiant: null,
			decompte: {
				domaines: section.domaines.length,
				dossiers: contenu.dossiers,
				notes: contenu.notes
			}
		};
	}

	function cibleDeNoteRecente(note: NoteRecente): CibleContextuelle {
		return {
			type: 'note',
			nom: note.titre,
			cible: null,
			identifiant: note.identifiant,
			decompte: { domaines: 0, dossiers: 0, notes: 1 }
		};
	}

	async function ouvrirLeMenu(evenement: MouseEvent, cible: CibleContextuelle): Promise<void> {
		if (cible.type === 'univers' && !admin) return;
		if ((cible.type === 'domaine' || cible.type === 'dossier') && !ecriture) return;
		evenement.preventDefault();
		positionDuMenu = {
			x: Math.min(evenement.clientX, window.innerWidth - 240),
			y: Math.min(evenement.clientY, window.innerHeight - 190)
		};
		menuContextuel = cible;
		await tick();
		elementDuMenu?.querySelector<HTMLElement>('a, button')?.focus();
	}

	function fermerLeMenu(evenement?: MouseEvent): void {
		if (
			evenement?.target instanceof Element &&
			evenement.target.closest('.rail__menu-contextuel') !== null
		) {
			return;
		}
		menuContextuel = null;
	}

	function fermerLeMenuAuClavier(evenement: KeyboardEvent): void {
		if (evenement.key === 'Escape') menuContextuel = null;
	}

	function avecParametres(adresse: string, parametres: Record<string, string>): string {
		return `${adresse}?${new URLSearchParams(parametres)}`;
	}

	function cleDeCible(cible: CibleContextuelle): string {
		if (cible.type === 'note') return `note:${cible.identifiant ?? ''}`;
		return `${cible.type}:${cible.cible?.univers ?? ''}:${cible.cible?.domaine ?? ''}:${cible.cible?.chemin.join('/') ?? ''}`;
	}

	function noteSelectionnee(cible: CibleContextuelle): boolean {
		return (
			cible.type === 'note' &&
			cible.identifiant !== null &&
			notesSelectionnees.some((note) => note.identifiant === cible.identifiant)
		);
	}

	function memeDossierDeNote(a: CibleContextuelle, b: CibleContextuelle): boolean {
		return (
			a.cible !== null &&
			b.cible !== null &&
			a.cible.univers === b.cible.univers &&
			a.cible.domaine === b.cible.domaine &&
			a.cible.dossierAffiche.join(' › ') === b.cible.dossierAffiche.join(' › ')
		);
	}

	function selectionnerLaNote(evenement: MouseEvent, cible: CibleContextuelle): void {
		if (cible.type !== 'note' || (!evenement.shiftKey && !evenement.ctrlKey && !evenement.metaKey))
			return;
		evenement.preventDefault();
		evenement.stopPropagation();
		if (noteSelectionnee(cible)) {
			notesSelectionnees = notesSelectionnees.filter(
				(note) => note.identifiant !== cible.identifiant
			);
			return;
		}
		const premiere = notesSelectionnees[0];
		notesSelectionnees =
			premiere === undefined || memeDossierDeNote(premiere, cible)
				? [...notesSelectionnees, cible]
				: [cible];
	}

	function effacerLaSelectionDeNotes(): void {
		notesSelectionnees = [];
	}

	function renommageDe(cible: CibleContextuelle): boolean {
		return renommage !== null && cleDeCible(renommage.cible) === cleDeCible(cible);
	}

	async function commencerLeRenommage(cible: CibleContextuelle): Promise<void> {
		renommage = { cible, valeur: cible.nom, envoi: false, erreur: null };
		menuContextuel = null;
		await tick();
		const champ = document.querySelector<HTMLInputElement>('.rail__champ-renommage');
		champ?.focus();
		champ?.select();
	}

	function commencerLeRenommageDuMenu(): void {
		if (menuContextuel !== null) void commencerLeRenommage(menuContextuel);
	}

	function annulerLeRenommage(): void {
		if (renommage?.envoi === true) return;
		renommage = null;
	}

	function adresseDeRenommage(cible: CibleContextuelle): string {
		if (cible.type === 'univers') return `${resolve('/console/univers')}?/enregistrer`;
		if (cible.type === 'domaine') return `${resolve('/console/domaines')}?/enregistrer`;
		if (cible.type === 'dossier' && cible.cible !== null) {
			return `${resolve(ROUTE_DOSSIER, {
				univers: cible.cible.univers,
				domaine: cible.cible.domaine,
				chemin: cible.cible.chemin.join('/')
			})}?/renommerOuDeplacer`;
		}
		return `${adresseDeNote(cible)}/modifier`;
	}

	async function validerLeRenommage(): Promise<void> {
		if (renommage === null || renommage.envoi) return;
		const nom = renommage.valeur.trim();
		if (nom === '') {
			renommage.erreur = 'Le nom ne peut pas être vide.';
			return;
		}
		if (nom === renommage.cible.nom) {
			renommage = null;
			return;
		}

		const actif = renommage;
		actif.envoi = true;
		actif.erreur = null;
		const champs = new FormData();
		if (actif.cible.type === 'univers') {
			champs.set(CHAMP_UNIVERS_CIBLE, actif.cible.cible?.univers ?? '');
			champs.set(CHAMP_NOM, nom);
		} else if (actif.cible.type === 'domaine') {
			champs.set(CHAMP_UNIVERS_CIBLE, actif.cible.cible?.univers ?? '');
			champs.set(CHAMP_DOMAINE_CIBLE, actif.cible.cible?.domaine ?? '');
			champs.set(CHAMP_NOM, nom);
		} else if (actif.cible.type === 'dossier') {
			champs.set('nouveauNom', nom);
		} else {
			champs.set('titre', nom);
		}

		try {
			const reponse = await fetch(adresseDeRenommage(actif.cible), {
				method: 'POST',
				body: champs
			});
			if (!reponse.ok) {
				actif.erreur = 'Ce nom ne peut pas être utilisé.';
				actif.envoi = false;
				return;
			}
			renommage = null;
			await invalidateAll();
		} catch {
			actif.erreur = 'Le renommage a échoué.';
			actif.envoi = false;
		}
	}

	function clavierDuRenommage(evenement: KeyboardEvent): void {
		if (evenement.key === 'Enter') {
			evenement.preventDefault();
			void validerLeRenommage();
		} else if (evenement.key === 'Escape') {
			evenement.preventDefault();
			annulerLeRenommage();
		}
	}

	function adresseDeCreationDeNote(cible: CibleContextuelle): string {
		if (cible.cible === null) return resolve('/notes/nouvelle');
		const dossier =
			cible.type === 'domaine'
				? cible.cible.domaineAffiche
				: cible.cible.dossierAffiche.join(' › ');
		return avecParametres(resolve('/notes/nouvelle'), {
			domaine: cible.cible.domaineAffiche,
			dossier
		});
	}

	function adresseDeCreationDeDossier(cible: CibleContextuelle): string {
		if (cible.cible === null) return '#';
		const chemin =
			cible.type === 'domaine'
				? identifiantLisible(cible.cible.domaineAffiche)
				: cible.cible.chemin.join('/');
		const adresse = resolve(ROUTE_DOSSIER, {
			univers: cible.cible.univers,
			domaine: cible.cible.domaine,
			chemin
		});
		return avecParametres(adresse, { creation: 'dossier' });
	}

	function adresseDeCreationDeDomaine(cible: CibleContextuelle): string {
		return avecParametres(resolve('/console/domaines'), {
			univers: cible.cible?.univers ?? '',
			creation: 'domaine'
		});
	}

	function adresseDeNote(cible: CibleContextuelle): string {
		return resolve(ROUTE_NOTE, { identifiant: cible.identifiant ?? '' });
	}

	function adresseDeSuppression(cible: CibleContextuelle): string {
		if (cible.type === 'univers') return `${resolve('/console/univers')}?/supprimer`;
		if (cible.type === 'domaine') return `${resolve('/console/domaines')}?/supprimer`;
		if (cible.type === 'dossier' && cible.cible !== null) {
			return `${resolve(ROUTE_DOSSIER, {
				univers: cible.cible.univers,
				domaine: cible.cible.domaine,
				chemin: cible.cible.chemin.join('/')
			})}?/supprimer`;
		}
		return `${adresseDeNote(cible)}?/supprimer`;
	}

	function champsDeSuppression(cible: CibleContextuelle): FormData {
		const champs = new FormData();
		if (cible.type === 'univers') {
			champs.set(CHAMP_UNIVERS_CIBLE, cible.cible?.univers ?? '');
		} else if (cible.type === 'domaine') {
			champs.set(CHAMP_UNIVERS_CIBLE, cible.cible?.univers ?? '');
			champs.set(CHAMP_DOMAINE_CIBLE, cible.cible?.domaine ?? '');
			champs.set('sup-saisie', confirmationDeSuppression);
		} else if (cible.type === 'dossier') {
			champs.set('confirmation', confirmationDeSuppression);
		}
		return champs;
	}

	async function demanderLaSuppressionDepuisLeMenu(): Promise<void> {
		if (menuContextuel === null) return;
		suppressionDemandee = menuContextuel;
		menuContextuel = null;
		confirmationDeSuppression = '';
		suppressionEnCours = false;
		erreurDeSuppression = null;
		await tick();
		boiteDeSuppression?.showModal();
	}

	function annulerLaSuppression(): void {
		if (suppressionEnCours) return;
		boiteDeSuppression?.close();
		suppressionDemandee = null;
	}

	async function confirmerLaSuppression(): Promise<void> {
		if (suppressionDemandee === null || suppressionEnCours) return;
		const cible = suppressionDemandee;
		if (cible.type !== 'note' && confirmationDeSuppression !== cible.nom) return;
		suppressionEnCours = true;
		erreurDeSuppression = null;
		try {
			const reponse = await fetch(adresseDeSuppression(cible), {
				method: 'POST',
				body: champsDeSuppression(cible)
			});
			if (!reponse.ok) {
				erreurDeSuppression =
					cible.type === 'univers'
						? `« ${cible.nom} » est l'univers système et ne peut pas être supprimé.`
						: `« ${cible.nom} » ne peut pas être supprimé.`;
				suppressionEnCours = false;
				return;
			}
			boiteDeSuppression?.close();
			suppressionDemandee = null;
			await goto(resolve('/'), { invalidateAll: true });
		} catch {
			erreurDeSuppression = 'La suppression a échoué.';
			suppressionEnCours = false;
		}
	}

	function peutRecevoir(cible: CibleContextuelle): boolean {
		if (!ecriture || cible.cible === null) return false;
		const source = elementDeplace;
		if (source === null) return cible.type === 'domaine' || cible.type === 'dossier';
		const memeDomaine =
			source.cible?.univers === cible.cible.univers &&
			source.cible?.domaine === cible.cible.domaine;
		if (source.type === 'domaine') {
			return (
				admin &&
				(cible.type === 'univers'
					? source.cible?.univers !== cible.cible.univers
					: (cible.type === 'domaine' || cible.type === 'dossier') && !memeDomaine)
			);
		}
		if (cible.type === 'univers') return admin && source.type === 'dossier';
		if (cible.type !== 'domaine' && cible.type !== 'dossier') return false;
		if (
			source.type === 'dossier' &&
			memeDomaine &&
			source.cible !== null &&
			source.cible.chemin.every((segment, i) => cible.cible?.chemin[i] === segment)
		)
			return false;
		return true;
	}

	function transfertDeFichiers(evenement: DragEvent): boolean {
		return Array.from(evenement.dataTransfer?.types ?? []).includes('Files');
	}

	function peutRecevoirUnDepot(cible: CibleContextuelle): boolean {
		return cible.type === 'univers' ? admin : peutRecevoir(cible);
	}

	function commencerLeDeplacement(evenement: DragEvent, cible: CibleContextuelle): void {
		const sourceValide =
			(cible.type === 'note' && cible.identifiant !== null) ||
			(cible.type === 'dossier' && cible.cible !== null) ||
			(cible.type === 'domaine' && admin && cible.cible !== null);
		if (!ecriture || !sourceValide) {
			evenement.preventDefault();
			return;
		}
		elementDeplace = cible;
		if (cible.type === 'note' && !noteSelectionnee(cible)) notesSelectionnees = [cible];
		menuContextuel = null;
		if (evenement.dataTransfer !== null) {
			evenement.dataTransfer.effectAllowed = 'move';
			evenement.dataTransfer.setData('text/plain', cleDeCible(cible));
		}
	}

	function survolerLaDestination(
		evenement: DragEvent,
		cible: CibleContextuelle,
		cle: string
	): void {
		evenement.stopPropagation();
		const externe = elementDeplace === null && transfertDeFichiers(evenement);
		if (elementDeplace === null && !externe) return;
		const ligne = (evenement.currentTarget as Element).closest('.noeud');
		const rail = ligne?.closest<HTMLElement>('.rail');
		if (rail !== null && rail !== undefined) {
			const limites = rail.getBoundingClientRect();
			if (evenement.clientY < limites.top + 60) rail.scrollTop -= 24;
			if (evenement.clientY > limites.bottom - 60) rail.scrollTop += 24;
		}
		if (brancheSurvolee !== cle) {
			annulerLOuverture();
			brancheSurvolee = cle;
			const chevron = ligne?.querySelector<HTMLButtonElement>('.noeud__chevron');
			if (chevron?.getAttribute('aria-expanded') === 'false') {
				ouvertureAuSurvol = setTimeout(() => chevron.click(), 650);
			}
		}
		if (externe ? !peutRecevoirUnDepot(cible) : !peutRecevoir(cible)) {
			cibleDeDepot = null;
			if (evenement.dataTransfer !== null) evenement.dataTransfer.dropEffect = 'none';
			return;
		}
		evenement.preventDefault();
		cibleDeDepot = cle;
		if (evenement.dataTransfer !== null)
			evenement.dataTransfer.dropEffect = externe ? 'copy' : 'move';
	}

	function quitterLaDestination(evenement: DragEvent, cle: string): void {
		if (
			(cibleDeDepot === cle || brancheSurvolee === cle) &&
			(!(evenement.relatedTarget instanceof Node) ||
				!(evenement.currentTarget as Element).contains(evenement.relatedTarget))
		) {
			annulerLOuverture();
			cibleDeDepot = null;
		}
	}

	function dossierDeDestination(cible: CibleContextuelle): string {
		if (cible.cible === null) return '';
		return cible.type === 'domaine'
			? cible.cible.domaineAffiche
			: cible.cible.dossierAffiche.join(' › ');
	}

	async function deplacerUneNote(
		source: CibleContextuelle,
		destination: NonNullable<CibleContextuelle['cible']>,
		cible: CibleContextuelle
	): Promise<void> {
		if (source.identifiant === null) return;
		const formulaire = new FormData();
		formulaire.set('univers', destination.univers);
		formulaire.set('domaine', destination.domaineAffiche);
		formulaire.set('dossier', dossierDeDestination(cible));
		const reponse = await fetch(`${adresseDeNote(source)}/modifier`, {
			method: 'POST',
			headers: { accept: 'application/json', 'x-sveltekit-action': 'true' },
			body: formulaire
		});
		const resultat = deserialize(await reponse.text());
		if (resultat.type === 'failure' || resultat.type === 'error') {
			const donnees = resultat.type === 'failure' ? resultat.data : null;
			const erreurs = donnees?.erreurs;
			const premiere = Array.isArray(erreurs) ? erreurs[0] : undefined;
			const message =
				donnees?.deplacement ??
				donnees?.motif ??
				(premiere && typeof premiere === 'object' && 'message' in premiere
					? premiere.message
					: undefined);
			throw new Error(typeof message === 'string' ? message : 'Ce déplacement a été refusé.');
		}
	}

	async function deposerLElement(evenement: DragEvent, cible: CibleContextuelle): Promise<void> {
		annulerLOuverture();
		evenement.stopPropagation();
		if (elementDeplace === null && transfertDeFichiers(evenement)) {
			evenement.stopPropagation();
			await importerLeDepot(evenement, cible);
			return;
		}
		if (elementDeplace === null || !peutRecevoir(cible)) return;
		evenement.preventDefault();
		evenement.stopPropagation();
		const source = elementDeplace;
		const destination = cible.cible;
		cibleDeDepot = null;
		if (destination === null) return;

		const memeDomaine =
			source.cible?.univers === destination.univers &&
			source.cible?.domaine === destination.domaine;
		const origine = source.cible?.dossierAffiche.join(' › ') ?? '';
		const destinationAffichee =
			cible.type === 'domaine' ? '' : destination.dossierAffiche.join(' › ');
		const parentDeLaSource = source.cible?.dossierAffiche.slice(0, -1).join(' › ') ?? '';
		if (
			source.type !== 'domaine' &&
			memeDomaine &&
			(source.type === 'note'
				? origine === destinationAffichee
				: parentDeLaSource === destinationAffichee)
		) {
			elementDeplace = null;
			return;
		}

		if (source.type === 'note') {
			const lot = noteSelectionnee(source) ? notesSelectionnees : [source];
			try {
				for (const note of lot) await deplacerUneNote(note, destination, cible);
				notesSelectionnees = [];
				await invalidateAll();
			} catch (erreur) {
				window.alert(erreur instanceof Error ? erreur.message : 'Le déplacement a échoué.');
			} finally {
				elementDeplace = null;
			}
			return;
		}

		const formulaire = new FormData();
		let adresse: string;
		let adresseSource: string | null = null;
		let adresseDestination: string;
		if (source.type === 'domaine') {
			if (source.cible === null) return;
			formulaire.set(CHAMP_UNIVERS_CIBLE, source.cible.univers);
			formulaire.set(CHAMP_DOMAINE_CIBLE, source.cible.domaine);
			formulaire.set('destination-univers', destination.univers);
			formulaire.set('destination-domaine', destination.domaine);
			formulaire.set('destination-chemin', destination.chemin.join('/'));
			if (cible.type === 'univers') {
				formulaire.set(CHAMP_UNIVERS_DE_RATTACHEMENT, destination.univers);
				adresse = `${resolve('/console/domaines')}?/enregistrer`;
			} else {
				adresse = `${resolve('/console/domaines')}?/convertirEnDossier`;
			}
			adresseSource = resolve(ROUTE_DOMAINE, {
				univers: source.cible.univers,
				domaine: source.cible.domaine
			});
		} else if (source.type === 'dossier') {
			formulaire.set('nouveauNom', source.nom);
			formulaire.set('destination-univers', destination.univers);
			formulaire.set('destination-domaine', destination.domaine);
			formulaire.set(
				'destination-chemin',
				cible.type === 'dossier' ? destination.chemin.join('/') : ''
			);
			adresse = adresseDeRenommage(source);
			if (cible.type === 'univers' && source.cible !== null) {
				formulaire.set(CHAMP_UNIVERS_CIBLE, source.cible.univers);
				formulaire.set(CHAMP_DOMAINE_CIBLE, source.cible.domaine);
				formulaire.set('source-chemin', source.cible.chemin.join('/'));
				adresse = `${resolve('/console/domaines')}?/convertirEnDomaine`;
			}
			if (source.cible !== null)
				adresseSource = resolve(ROUTE_DOSSIER, {
					univers: source.cible.univers,
					domaine: source.cible.domaine,
					chemin: source.cible.chemin.join('/')
				});
		} else {
			return;
		}
		try {
			const reponse = await fetch(adresse, {
				method: 'POST',
				headers: { accept: 'application/json', 'x-sveltekit-action': 'true' },
				body: formulaire
			});
			const resultat = deserialize(await reponse.text());
			if (resultat.type === 'failure' || resultat.type === 'error') {
				const donnees = resultat.type === 'failure' ? resultat.data : null;
				const erreurs = donnees?.erreurs;
				const premiere = Array.isArray(erreurs) ? erreurs[0] : undefined;
				const message =
					donnees?.deplacement ??
					donnees?.motif ??
					(premiere && typeof premiere === 'object' && 'message' in premiere
						? premiere.message
						: undefined);
				throw new Error(typeof message === 'string' ? message : 'Ce déplacement a été refusé.');
			}
			if (cible.type === 'univers') {
				const donnees = resultat.type === 'success' ? resultat.data : undefined;
				adresseDestination = resolve(ROUTE_DOMAINE, {
					univers: destination.univers,
					domaine:
						typeof donnees?.identifiant === 'string'
							? donnees.identifiant
							: (source.cible?.domaine ?? '')
				});
			} else {
				adresseDestination = resolve(ROUTE_DOSSIER, {
					univers: destination.univers,
					domaine: destination.domaine,
					chemin: [...destination.chemin, identifiantLisible(source.nom)].join('/')
				});
			}
			if (
				adresseSource !== null &&
				(page.url.pathname === adresseSource || page.url.pathname.startsWith(`${adresseSource}/`))
			) {
				let suite = page.url.pathname.slice(adresseSource.length);
				if (source.type === 'dossier' && cible.type === 'univers' && suite !== '')
					suite = `/dossiers${suite}`;
				if (source.type === 'domaine' && cible.type !== 'univers') {
					suite = suite.startsWith('/dossiers/') ? suite.slice('/dossiers'.length) : '';
					if (suite === `/${identifiantLisible(source.nom)}`) suite = '';
				}
				// Les deux adresses sont produites par resolve ci-dessus.
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				await goto(`${adresseDestination}${suite}${page.url.search}${page.url.hash}`, {
					invalidateAll: true
				});
			} else {
				await invalidateAll();
			}
		} catch (erreur) {
			window.alert(erreur instanceof Error ? erreur.message : 'Le déplacement a échoué.');
		} finally {
			elementDeplace = null;
		}
	}

	async function importerLeDepot(evenement: DragEvent, cible: CibleContextuelle): Promise<void> {
		if (importEnCours || !peutRecevoirUnDepot(cible) || evenement.dataTransfer === null) return;
		if (cible.type === 'note') return;
		evenement.preventDefault();
		cibleDeDepot = null;
		const transfert = evenement.dataTransfer;
		const entreeDeDossier = Array.from(transfert.items ?? []).some((item) => {
			const entree = item.webkitGetAsEntry?.();
			return (
				entree !== null && entree !== undefined && 'isDirectory' in entree && entree.isDirectory
			);
		});
		const fichiers = await fichiersDuTransfert(transfert);
		if (fichiers.length === 0) {
			window.alert('Ce dépôt ne contient aucun fichier.');
			return;
		}
		const porteUnDossier =
			entreeDeDossier || fichiers.some((fichier) => cheminDuFichier(fichier).includes('/'));
		if (cible.type === 'univers' && !porteUnDossier) {
			window.alert('Déposez un dossier sur un univers pour créer un domaine.');
			return;
		}

		const corps = new FormData();
		corps.set('scenario', scenarioDuDepotSurLeRail(cible.type, fichiers.length, porteUnDossier));
		if (cible.type === 'univers') {
			corps.set('univers-cible', cible.cible?.univers ?? '');
		} else {
			corps.set('cible-univers', cible.cible?.univers ?? '');
			corps.set('cible-domaine', cible.cible?.domaine ?? '');
			corps.set(
				'cible-chemin',
				cible.type === 'dossier' ? (cible.cible?.chemin.join('/') ?? '') : ''
			);
		}
		for (const fichier of fichiers) corps.append('fichiers', fichier, cheminDuFichier(fichier));

		importEnCours = true;
		try {
			const reponse = await fetch(`${resolve('/importer')}?/importer`, {
				method: 'POST',
				body: corps
			});
			const resultat = deserialize(await reponse.text());
			if (resultat.type !== 'success') {
				window.alert('L’import n’a pas pu être exécuté sur cette cible.');
				return;
			}
			const rapport = (
				resultat.data as
					| {
							rapport?: {
								notesCreees: number;
								notesMisesAJour: number;
								echecs: number;
								dossiersCrees: number;
							};
					  }
					| undefined
			)?.rapport;
			await invalidateAll();
			window.alert(
				rapport === undefined
					? 'Import terminé.'
					: `Import terminé : ${rapport.notesCreees} note(s) créée(s), ${rapport.notesMisesAJour} mise(s) à jour, ${rapport.dossiersCrees} dossier(s) créé(s), ${rapport.echecs} échec(s).`
			);
		} catch {
			window.alert('L’import a échoué.');
		} finally {
			importEnCours = false;
		}
	}

	function terminerLeDeplacement(): void {
		annulerLOuverture();
		elementDeplace = null;
		cibleDeDepot = null;
	}

	const sousTitre = $derived(
		compteAffiche.domaine ? `${compteAffiche.role} · ${compteAffiche.domaine}` : compteAffiche.role
	);
	const designation = $derived(
		compteAffiche.nom === '' ? 'Menu utilisateur' : `${compteAffiche.nom} — menu utilisateur`
	);
</script>

<!-- Les adresses du menu contextuel sont toutes composées dans les fonctions
	ci-dessus à partir de `resolve()` ; la règle ne suit pas un appel de fonction. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<!--
	UNE BRANCHE — domaine, dossier ou note. Le chevron n'est émis que si le nœud a
	des enfants ; sinon un espaceur tient sa place, pour que les icônes s'alignent.
-->
{#snippet branche(n: NoeudRendu)}
	<li data-cle={n.cle} data-ouvert={n.ouvert ? 'oui' : 'non'}>
		<div
			class="noeud"
			role="group"
			class:noeud--courant={n.page}
			class:noeud--selectionne={noteSelectionnee(cibleDeNoeud(n))}
			class:noeud--deplace={elementDeplace !== null &&
				cleDeCible(elementDeplace) === cleDeCible(cibleDeNoeud(n))}
			class:noeud--depot={cibleDeDepot === n.cle}
			data-ouvert={n.ouvert ? 'oui' : undefined}
			ondragover={(evenement) => survolerLaDestination(evenement, cibleDeNoeud(n), n.cle)}
			ondragleave={(evenement) => quitterLaDestination(evenement, n.cle)}
			ondrop={(evenement) => deposerLElement(evenement, cibleDeNoeud(n))}
		>
			{#if n.enfants.length}<button
					class="noeud__chevron"
					type="button"
					aria-expanded={n.ouvert}
					aria-label="Déplier {n.nom}"
					ondragover={(evenement) => survolerLaDestination(evenement, cibleDeNoeud(n), n.cle)}
					ondrop={(evenement) => deposerLElement(evenement, cibleDeNoeud(n))}
					><svg
						width="10"
						height="10"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M6 3l5 5-5 5" /></svg
					></button
				>{:else}<span
					class="noeud__vide"
					role="group"
					ondragover={(evenement) => survolerLaDestination(evenement, cibleDeNoeud(n), n.cle)}
					ondrop={(evenement) => deposerLElement(evenement, cibleDeNoeud(n))}
				></span>{/if}<a
				class="noeud__nom"
				href={n.type === 'note'
					? resolve(ROUTE_NOTE, { identifiant: n.identifiant ?? '' })
					: n.cible === null
						? '#'
						: n.cible.chemin.length > 0
							? resolve(ROUTE_DOSSIER, {
									univers: n.cible.univers,
									domaine: n.cible.domaine,
									chemin: n.cible.chemin.join('/')
								})
							: resolve(ROUTE_DOMAINE, { univers: n.cible.univers, domaine: n.cible.domaine })}
				aria-current={n.page ? 'page' : undefined}
				draggable={ecriture &&
					(n.type === 'note' || n.type === 'dossier' || (n.type === 'domaine' && admin))}
				onclick={(evenement) => selectionnerLaNote(evenement, cibleDeNoeud(n))}
				oncontextmenu={(evenement) => ouvrirLeMenu(evenement, cibleDeNoeud(n))}
				ondragstart={(evenement) => commencerLeDeplacement(evenement, cibleDeNoeud(n))}
				ondragend={terminerLeDeplacement}
				ondragover={(evenement) => survolerLaDestination(evenement, cibleDeNoeud(n), n.cle)}
				ondrop={(evenement) => deposerLElement(evenement, cibleDeNoeud(n))}
				><Pictogramme
					traits={iconeDeNoeud(n.type)}
					taille="16"
					boite="0 0 16 16"
					epaisseur="1.4"
				/>{@render texteRenommable(cibleDeNoeud(n))}{#if n.compte !== null}<span
						class="noeud__compte">{n.compte}</span
					>{/if}</a
			>{#if n.chargement}<span class="noeud__rouet" aria-label="Chargement"></span>{/if}
		</div>
		{#if n.enfants.length}
			<ul>
				{#each n.enfants as enfant (enfant.cle)}{@render branche(enfant)}{/each}
			</ul>
		{/if}
	</li>
{/snippet}

<svelte:window
	onclick={fermerLeMenu}
	onkeydown={fermerLeMenuAuClavier}
	onresize={() => fermerLeMenu()}
/>

{#snippet texteRenommable(cible: CibleContextuelle)}
	{#if renommageDe(cible)}
		<input
			class="rail__champ-renommage"
			aria-label={`Nouveau nom de ${cible.nom}`}
			aria-invalid={renommage?.erreur === null ? undefined : 'true'}
			title={renommage?.erreur ?? 'Entrée pour valider, Échap pour annuler'}
			disabled={renommage?.envoi}
			value={renommage?.valeur ?? ''}
			oninput={(evenement) => {
				if (renommage !== null) renommage.valeur = evenement.currentTarget.value;
			}}
			onkeydown={clavierDuRenommage}
			onclick={(evenement) => {
				evenement.preventDefault();
				evenement.stopPropagation();
			}}
		/>
	{:else}
		<span class="noeud__texte">{cible.nom}</span>
	{/if}
{/snippet}

<aside
	class="rail"
	class:rail--replie={replie}
	class:rail--deplacement={elementDeplace !== null || cibleDeDepot !== null}
	aria-label="Navigation principale"
>
	<!-- LA CROIX DU TIROIR — rendue toujours, visible sous 1024 px seulement, où le
	     rail est un tiroir. Le voile ferme aussi ; les deux gestes existent. -->
	<button class="rail__fermer" type="button" data-fermer-tiroir aria-label="Fermer la navigation"
		><svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8" /></svg
		></button
	>
	<div class="rail__marque">
		<button
			class="rail__bascule"
			type="button"
			aria-label={replie ? 'Déplier la navigation' : 'Replier la navigation'}
			title={replie ? 'Déplier la navigation' : 'Replier la navigation'}
			aria-expanded={!replie}
			onclick={basculerLeRail}
		>
			<img class="rail__sceau" src={`${racineDesAssets}/logo.png`} alt="" width="36" height="36" />
		</button>
		<a class="rail__accueil-mobile" aria-label="Codicillus — Accueil" href={resolve('/')}>
			<img class="rail__sceau" src={`${racineDesAssets}/logo.png`} alt="" width="36" height="36" />
		</a>
		<a class="rail__identite" href={accueilCourant ? '#' : resolve('/')}>
			<span class="rail__nom">Codicillus</span>
			<span class="rail__accroche">Vos connaissances. Vivantes.</span>
		</a>
	</div>

	<!--
		LE CHAMP DE RECHERCHE OUVRE LA PALETTE — `$lib/cablage/coquille.ts` reconnaît
		`.recherche` et lui passe le clic ; sans script, il mène à `/recherche`. C'est
		un LIEN et non un `div[role=button]` : la destination de repli est réelle.
	-->
	<a
		class="recherche"
		id="ouvrir-recherche"
		aria-label="Rechercher"
		title="Rechercher"
		href={resolve('/recherche')}
	>
		<svg
			width="15"
			height="15"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg
		>
		<span class="recherche__txt">Rechercher…</span>
		<kbd class="touche">⌘ K</kbd>
	</a>

	<div class="rail__zone">
		<div class="rail__titre etiq">Univers</div>
		{#if notesSelectionnees.length > 0}<div class="rail__selection" role="status">
				<span
					>{notesSelectionnees.length}
					{accord(notesSelectionnees.length, 'note sélectionnée', 'notes sélectionnées')}</span
				>
				<button type="button" onclick={effacerLaSelectionDeNotes}>Effacer</button>
			</div>{/if}
		{#if arbre.length === 0}
			<!-- LE VIDE NE SE DIT PAS PAREIL SELON QUI LE LIT : cette phrase envoyait
			     l'administrateur qui vient d'installer « demander à un administrateur »,
			     alors qu'il est le seul compte de l'instance. -->
			<p class="rail__vide">
				{#if admin}Aucun univers n'existe encore. Créez-en un ci-dessous, puis un domaine : le
					rangement s'ouvrira ici.{:else}Aucun domaine ne vous est accessible pour l'instant.
					Demandez à un administrateur de vous rattacher à un domaine — votre compte existe, il n'a
					simplement pas encore de périmètre.{/if}
			</p>
		{:else}
			<ul class="arbre">
				{#each arbre as section (section.nom)}
					<li data-ouvert={section.ouvert ? 'oui' : 'non'} style="--teinte:{section.couleur}">
						<div
							class="noeud noeud--univers"
							role="group"
							class:noeud--courant={section.page}
							class:noeud--branche={section.courant && !section.page}
							class:noeud--depot={cibleDeDepot === `univers:${section.cible?.univers ?? ''}`}
							data-ouvert={section.ouvert ? 'oui' : undefined}
							ondragover={(evenement) =>
								survolerLaDestination(
									evenement,
									cibleDUnivers(section),
									`univers:${section.cible?.univers ?? ''}`
								)}
							ondragleave={(evenement) =>
								quitterLaDestination(evenement, `univers:${section.cible?.univers ?? ''}`)}
							ondrop={(evenement) => deposerLElement(evenement, cibleDUnivers(section))}
						>
							{#if section.domaines.length}<button
									class="noeud__chevron"
									type="button"
									aria-expanded={section.ouvert}
									aria-label="Déplier {section.nom}"
									ondragover={(evenement) =>
										survolerLaDestination(
											evenement,
											cibleDUnivers(section),
											`univers:${section.cible?.univers ?? ''}`
										)}
									ondrop={(evenement) => deposerLElement(evenement, cibleDUnivers(section))}
									><svg
										width="10"
										height="10"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="2"><path d="M6 3l5 5-5 5" /></svg
									></button
								>{:else}<span
									class="noeud__vide"
									role="group"
									ondragover={(evenement) =>
										survolerLaDestination(
											evenement,
											cibleDUnivers(section),
											`univers:${section.cible?.univers ?? ''}`
										)}
									ondrop={(evenement) => deposerLElement(evenement, cibleDUnivers(section))}
								></span>{/if}<a
								class="noeud__nom"
								href={section.cible === null
									? '#'
									: resolve(ROUTE_UNIVERS, { univers: section.cible.univers })}
								aria-label={section.nom}
								draggable={false}
								title={section.nom}
								aria-current={section.page ? 'page' : undefined}
								oncontextmenu={(evenement) => ouvrirLeMenu(evenement, cibleDUnivers(section))}
								ondragover={(evenement) =>
									survolerLaDestination(
										evenement,
										cibleDUnivers(section),
										`univers:${section.cible?.univers ?? ''}`
									)}
								ondrop={(evenement) => deposerLElement(evenement, cibleDUnivers(section))}
								><span class="noeud__teinte" style="color:{section.couleur}"
									><Pictogramme
										traits={glypheDUnivers(section.glyphe)}
										taille="16"
										boite="0 0 24 24"
										epaisseur="1.9"
									/></span
								>{@render texteRenommable(cibleDUnivers(section))}{#if section.compte > 0}<span
										class="noeud__compte">{section.compte}</span
									>{/if}</a
							>
						</div>
						{#if section.domaines.length}
							<ul>
								{#each section.domaines as domaine (domaine.cle)}{@render branche(domaine)}{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		<!-- CRÉER UN UNIVERS EST UN GESTE DE CONSOLE (`RG-DRO-03`) : l'entrée mène à
		     la table des univers, où le formulaire s'ouvre. Émise au seul
		     administrateur, parce qu'elle rend 404 à tout autre. -->
		{#if admin}<a class="rail__action" href={resolve('/console/univers')}>
				<span class="rail__signe" aria-hidden="true">+</span>Créer un univers
			</a>{/if}
	</div>

	<!-- AUCUN COMPTE, AUCUNE CONSULTATION : PAS DE SECTION. Une zone « Récents »
	     vide n'apprend rien ; elle n'est simplement pas rendue. -->
	{#if recentsAffiches.length > 0}
		<div class="rail__zone rail__zone--recents">
			<div class="rail__titre etiq">Récents</div>
			<ul class="rail__recents">
				{#each recentsAffiches as note (note.identifiant)}
					<li>
						<a
							class="rail__recent"
							href={resolve(ROUTE_NOTE, { identifiant: note.identifiant })}
							aria-current={note.identifiant === noteCourante ? 'page' : undefined}
							oncontextmenu={(evenement) => ouvrirLeMenu(evenement, cibleDeNoteRecente(note))}
						>
							<Pictogramme
								traits={iconeDeNoeud('note')}
								taille="16"
								boite="0 0 16 16"
								epaisseur="1.4"
							/>{@render texteRenommable(cibleDeNoteRecente(note))}
						</a>
					</li>
				{/each}
			</ul>
			<!-- « TOUS LES RÉCENTS » N'A PAS DE PAGE PROPRE, et en inventer une serait
			     un écran de plus à tenir : le geste se ferme sur la recherche triée par
			     consultation, qui est la seule liste du produit qui ordonne les notes
			     par leur lecture. -->
			<a class="rail__action" href="{resolve('/recherche')}?tri=consultations">
				<span class="rail__signe" aria-hidden="true">→</span>Voir tous les récents
			</a>
		</div>
	{/if}

	<!--
		LA CARTE DE COMPTE — et le menu que la barre supérieure portait. Un `details`
		NATIF : il s'ouvre sans script, au clavier comme à la souris, et ses entrées
		sont des LIENS. Aucune adresse n'est devenue inatteignable en quittant le
		rail : Cartographie, Carte mentale, Signets, Import et Console vivent ici.
	-->
	<details class="rail__compte">
		<summary aria-label={designation} title={designation}>
			<span class="avatar" aria-hidden="true">{compteAffiche.initiales}</span>
			<span class="rail__compte-textes">
				<span class="rail__compte-nom">{compteAffiche.nom}</span>
				{#if compteAffiche.courriel}<span class="rail__compte-courriel"
						>{compteAffiche.courriel}</span
					>{/if}
			</span>
			<svg
				class="rail__compte-chevron"
				width="14"
				height="14"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg
			>
		</summary>
		<div class="rail__menu">
			<div class="rail__menu-entete">
				<div class="rail__menu-nom">{compteAffiche.nom}</div>
				<div class="rail__menu-role">{sousTitre}</div>
			</div>
			{#if admin}<div class="rail__menu-console">
					<a class="rail__menu-lien rail__menu-lien--console" href={resolve('/console')}>Console</a>
				</div>{/if}
			{#if ecriture}
				<a
					class="rail__menu-lien"
					class:rail__menu-lien--principal={admin}
					href={resolve('/notes/nouvelle')}>Nouvelle note</a
				>
				{#if creations.dossier && rangement}<a
						class="rail__menu-lien"
						href={resolve(ROUTE_DOMAINE, {
							univers: rangement.univers,
							domaine: rangement.domaine
						})}>Nouveau dossier</a
					>{/if}
				{#if creations.signet && rangement}<a
						class="rail__menu-lien"
						href="{resolve(ROUTE_DOMAINE, {
							univers: rangement.univers,
							domaine: rangement.domaine
						})}/signets/nouveau">Nouveau signet</a
					>{/if}
				<div class="rail__menu-sep"></div>
			{/if}
			<a class="rail__menu-lien" href={resolve('/cartographie')}>Cartographie</a>
			{#if modelisationOfferte}<a class="rail__menu-lien" href={resolve('/modelisation')}
					>Modélisation</a
				>{/if}
			<a class="rail__menu-lien" href={resolve('/carte-mentale')}>Carte mentale</a>
			<a class="rail__menu-lien" href="{resolve('/recherche')}?type=Signet">Signets</a>
			{#if ecriture}<a
					class="rail__menu-lien"
					href={admin ? resolve('/console/imports') : `${resolve('/importer')}?scenario=notes`}
					>Import</a
				>{/if}
			<div class="rail__menu-sep"></div>
			<a class="rail__menu-lien" href={resolve('/mes-requetes')}>Mes requêtes de documentation</a>
			<a class="rail__menu-lien" href={resolve('/mon-profil')}>Mon profil</a>
			<a class="rail__menu-lien" href={resolve('/deconnexion')}>Se déconnecter</a>
			<div class="rail__menu-version etiq">Codicillus {version}</div>
		</div>
	</details>
</aside>

{#if menuContextuel}
	<div
		class="rail__menu-contextuel"
		role="menu"
		aria-label={`Actions pour ${menuContextuel.nom}`}
		style={`left:${positionDuMenu.x}px;top:${positionDuMenu.y}px`}
		bind:this={elementDuMenu}
	>
		<div class="rail__menu-contextuel-titre">{menuContextuel.nom}</div>
		{#if menuContextuel.type === 'univers'}
			<button type="button" role="menuitem" onclick={commencerLeRenommageDuMenu}>Renommer</button>
			<a role="menuitem" href={adresseDeCreationDeDomaine(menuContextuel)}>Créer un domaine</a>
			<button
				type="button"
				role="menuitem"
				class="rail__menu-contextuel-danger"
				onclick={demanderLaSuppressionDepuisLeMenu}>Supprimer</button
			>
		{:else if menuContextuel.type === 'domaine'}
			{#if admin}<button type="button" role="menuitem" onclick={commencerLeRenommageDuMenu}
					>Renommer</button
				>{/if}
			<a role="menuitem" href={adresseDeCreationDeNote(menuContextuel)}>Créer une note</a>
			<a role="menuitem" href={adresseDeCreationDeDossier(menuContextuel)}>Créer un dossier</a>
			{#if admin}<button
					type="button"
					role="menuitem"
					class="rail__menu-contextuel-danger"
					onclick={demanderLaSuppressionDepuisLeMenu}>Supprimer</button
				>{/if}
		{:else if menuContextuel.type === 'dossier'}
			<button type="button" role="menuitem" onclick={commencerLeRenommageDuMenu}>Renommer</button>
			<a role="menuitem" href={adresseDeCreationDeNote(menuContextuel)}>Créer une note ici</a>
			<a role="menuitem" href={adresseDeCreationDeDossier(menuContextuel)}>Créer un sous-dossier</a>
			<button
				type="button"
				role="menuitem"
				class="rail__menu-contextuel-danger"
				onclick={demanderLaSuppressionDepuisLeMenu}>Supprimer</button
			>
		{:else if menuContextuel.identifiant}
			<a role="menuitem" href={adresseDeNote(menuContextuel)}>Ouvrir</a>
			{#if ecriture}
				<button type="button" role="menuitem" onclick={commencerLeRenommageDuMenu}>Renommer</button>
				<button
					type="button"
					role="menuitem"
					class="rail__menu-contextuel-danger"
					onclick={demanderLaSuppressionDepuisLeMenu}>Supprimer</button
				>
			{/if}
		{/if}
	</div>
{/if}

<dialog
	class="rail__suppression"
	bind:this={boiteDeSuppression}
	aria-labelledby="rail-suppression-titre"
	oncancel={(evenement) => {
		if (suppressionEnCours) evenement.preventDefault();
		else suppressionDemandee = null;
	}}
>
	{#if suppressionDemandee}
		<div class="rail__suppression-boite">
			<div class="rail__suppression-tete">
				<span class="rail__suppression-marque" aria-hidden="true">!</span>
				<h2 id="rail-suppression-titre">
					Supprimer {suppressionDemandee.type === 'univers'
						? "l'univers"
						: suppressionDemandee.type === 'domaine'
							? 'le domaine'
							: suppressionDemandee.type === 'dossier'
								? 'le dossier'
								: 'la note'}
				</h2>
				<button
					type="button"
					class="rail__suppression-fermer"
					aria-label="Fermer"
					disabled={suppressionEnCours}
					onclick={annulerLaSuppression}>×</button
				>
			</div>
			<div class="rail__suppression-corps">
				<p>
					<strong>« {suppressionDemandee.nom} »</strong>
				</p>
				{#if suppressionDemandee.type === 'univers'}
					<p class="rail__suppression-avertissement">
						Attention, supprimer cet univers supprimera l'intégralité des domaines, dossiers,
						sous-dossiers et notes qu'il contient.
					</p>
					<ul>
						<li>
							{suppressionDemandee.decompte.domaines}
							{accord(suppressionDemandee.decompte.domaines, 'domaine')}
						</li>
						<li>
							{suppressionDemandee.decompte.dossiers}
							{accord(suppressionDemandee.decompte.dossiers, 'dossier')} et
							{accord(suppressionDemandee.decompte.dossiers, 'sous-dossier')}
						</li>
						<li>
							{suppressionDemandee.decompte.notes}
							{accord(suppressionDemandee.decompte.notes, 'note')}
						</li>
					</ul>
				{:else if suppressionDemandee.type === 'domaine'}
					<p class="rail__suppression-avertissement">
						Supprimer ce domaine supprimera tous ses dossiers, sous-dossiers et notes.
					</p>
					<ul>
						<li>
							{suppressionDemandee.decompte.dossiers}
							{accord(suppressionDemandee.decompte.dossiers, 'dossier')} et
							{accord(suppressionDemandee.decompte.dossiers, 'sous-dossier')}
						</li>
						<li>
							{suppressionDemandee.decompte.notes}
							{accord(suppressionDemandee.decompte.notes, 'note')}
						</li>
					</ul>
				{:else if suppressionDemandee.type === 'dossier'}
					<p class="rail__suppression-avertissement">
						Supprimer ce dossier supprimera tous ses sous-dossiers et toutes les notes qu'ils
						contiennent.
					</p>
					<ul>
						<li>
							{suppressionDemandee.decompte.dossiers}
							{accord(suppressionDemandee.decompte.dossiers, 'sous-dossier')}
						</li>
						<li>
							{suppressionDemandee.decompte.notes}
							{accord(suppressionDemandee.decompte.notes, 'note')}
						</li>
					</ul>
				{:else}
					<p class="rail__suppression-avertissement">
						Le contenu, les registres, l'historique, les relations et les pièces jointes de cette
						note seront supprimés.
					</p>
				{/if}
				<p class="rail__suppression-definitif">
					La suppression est définitive : il n'y a pas de corbeille.
				</p>
				{#if suppressionDemandee.type !== 'note'}
					<label for="rail-confirmation-suppression">
						Pour confirmer, retapez le nom exact :
						<strong>{suppressionDemandee.nom}</strong>
					</label>
					<input
						id="rail-confirmation-suppression"
						type="text"
						autocomplete="off"
						spellcheck="false"
						bind:value={confirmationDeSuppression}
					/>
				{/if}
				{#if erreurDeSuppression}<p class="rail__suppression-erreur" role="alert">
						{erreurDeSuppression}
					</p>{/if}
			</div>
			<div class="rail__suppression-pied">
				<button
					type="button"
					class="btn"
					disabled={suppressionEnCours}
					onclick={annulerLaSuppression}>Annuler</button
				>
				<button
					type="button"
					class="btn rail__suppression-valider"
					disabled={suppressionEnCours ||
						(suppressionDemandee.type !== 'note' &&
							confirmationDeSuppression !== suppressionDemandee.nom)}
					onclick={confirmerLaSuppression}
				>
					{suppressionEnCours ? 'Suppression…' : 'Supprimer définitivement'}
				</button>
			</div>
		</div>
	{/if}
</dialog>
