/**
 * LE CÂBLAGE DE LA LECTURE — V-14, et le panneau d'historique V-15 qui s'y
 * superpose. `ARB-063` : le comportement s'accroche depuis la route, par
 * identifiant et par sélecteur.
 *
 * LA NEUTRALISATION DES BOUTONS N'EST PAS UNE GÊNE, C'EST LA PARADE. Un `button`
 * sans attribut de type est un bouton de SOUMISSION dès qu'il entre dans un
 * formulaire, et l'enveloppe de cette route vise `?/supprimer` : « Imprimer » a
 * réellement détruit des notes. `+page.svelte` pose `type="button"` au montage ;
 * ce module ne défait jamais cette pose, et chaque geste désigne son action par
 * `soumettreVers()` — rien n'est réécrit sur le formulaire, il n'y a donc aucune
 * fenêtre pendant laquelle il vise autre chose que la suppression.
 *
 * QUATRE GESTES SONT REPRIS DU SCRIPT DU GEL à la ligne près : la bascule de
 * registre, le dépliage du panneau de signalement, la copie d'un bloc de code et
 * l'agrandissement d'une figure.
 */
import { soumettreVers } from '$lib/cablage/formulaires';
import { adresseDeNote } from '$lib/rangement/adresses';

export type Debranchement = () => void;

export interface OptionsDeLaLecture {
	/** L'identifiant lisible de la note lue — la racine de toutes ses adresses. */
	readonly identifiant: string;
	/** `RG-M05-08` / `P-09` — sans le droit d'écrire, aucun geste n'est posé. */
	readonly ecriture: boolean;
	/**
	 * Où mène « Exporter », ou `null` quand l'appelant ne peut pas exporter :
	 * `RG-M13-03` le réserve à l'administrateur, et une entrée sans destination se
	 * RETIRE.
	 */
	readonly exports: string | null;
}

function libelle(noeud: Element): string {
	return (noeud.textContent ?? '').trim();
}

/** Le bouton d'une zone, reconnu à son libellé — le gel ne lui donne pas d'identifiant. */
function boutonNomme(racine: ParentNode | null, texte: string): HTMLButtonElement | null {
	if (racine === null) return null;
	return Array.from(racine.querySelectorAll('button')).find((b) => libelle(b) === texte) ?? null;
}

/**
 * Un champ caché du formulaire, créé s'il manque. C'est `poserChamp()` de
 * `$lib/cablage/formulaires.ts`, qui ne l'exporte pas ; la marque de données
 * diffère — `cableLecture` — pour que deux câblages posés sur le même formulaire
 * ne se disputent jamais le même nœud.
 */
function poserChamp(formulaire: HTMLFormElement, nom: string, valeur: string): void {
	const existant = formulaire.querySelector<HTMLInputElement>(
		`input[type="hidden"][data-cable-lecture="${nom}"]`
	);
	const champ = existant ?? formulaire.ownerDocument.createElement('input');
	champ.type = 'hidden';
	champ.name = nom;
	champ.dataset['cableLecture'] = nom;
	champ.value = valeur;
	if (existant === null) formulaire.appendChild(champ);
}

/**
 * LE CÂBLAGE DE LA LECTURE D'UNE NOTE — appelé depuis `onMount` de la route,
 * APRÈS la neutralisation des boutons du gel, et jamais ailleurs.
 */
export function cablerLaLecture(
	formulaire: HTMLFormElement,
	options: OptionsDeLaLecture
): Debranchement {
	const document = formulaire.ownerDocument;
	const fenetre = document.defaultView;
	const jetables: Debranchement[] = [];
	const ecouter = (cible: EventTarget, type: string, reaction: (e: Event) => void): void => {
		cible.addEventListener(type, reaction);
		jetables.push(() => cible.removeEventListener(type, reaction));
	};
	const adresse = adresseDeNote(options.identifiant);
	const aller = (cible: string): void => {
		document.location.assign(cible);
	};
	/** Un bouton du gel qui agit : on l'écoute, on ne touche pas à son type. */
	const agir = (bouton: Element | null, geste: () => void): void => {
		if (bouton === null) return;
		ecouter(bouton, 'click', geste);
	};

	/* ═══════════════════ 1. LA FRAÎCHEUR — les trois gestes de M06 ═════════ */

	/* « Marquer comme vérifié » — `UC-M06-02`, un clic et aucun champ. */
	agir(document.getElementById('btn-verifier'), () => soumettreVers(formulaire, '?/verifier'));

	/* Le dépliage du panneau de signalement — `V-14:4039`, transcrit. */
	const panneauReviser = document.getElementById('panneau-reviser');
	const boutonReviser = document.getElementById('btn-reviser');
	const zoneReviser = document.querySelector<HTMLTextAreaElement>('#txt-reviser');
	const replier = (): void => {
		panneauReviser?.setAttribute('data-ouvert', 'non');
		boutonReviser?.setAttribute('aria-expanded', 'false');
	};
	if (panneauReviser !== null && boutonReviser !== null) {
		agir(boutonReviser, () => {
			const ouvert = panneauReviser.getAttribute('data-ouvert') === 'oui';
			panneauReviser.setAttribute('data-ouvert', ouvert ? 'non' : 'oui');
			boutonReviser.setAttribute('aria-expanded', String(!ouvert));
			if (!ouvert) zoneReviser?.focus();
		});
		agir(document.getElementById('btn-reviser-annul'), () => {
			replier();
			boutonReviser.focus();
		});
	}

	/**
	 * « Signaler à réviser » — `UC-M06-03`. LE COMMENTAIRE VOYAGE EN CHAMP CACHÉ, et
	 * non par un attribut de nom posé sur la zone de saisie du gel : celle-ci vit
	 * dans l'enveloppe qui vise `?/supprimer`, et un champ nommé y partirait avec
	 * CHAQUE soumission — un dépôt de pièce jointe emporterait le brouillon.
	 */
	agir(document.getElementById('btn-reviser-envoi'), () => {
		poserChamp(formulaire, 'commentaire', zoneReviser?.value ?? '');
		replier();
		soumettreVers(formulaire, '?/signaler');
	});

	/* « Lever la demande » — le bandeau de révision, `V-14:1427`. */
	agir(boutonNomme(document.getElementById('bandeau-revision'), 'Lever la demande'), () =>
		soumettreVers(formulaire, '?/lever')
	);

	/* ═══════════════════ 2. LES DEUX AUTRES BANDEAUX ══════════════════════ */

	/**
	 * « Publier » — LE GEL NE DONNE AUCUN GESTE À CE BOUTON, et cette route n'a pas
	 * d'action de publication : le statut d'une note est une MODIFICATION, et
	 * `/notes/{identifiant}/modifier` la porte déjà (`P-35`). Un champ absent n'est
	 * pas modifié : la soumission ne porte que `statut`.
	 */
	agir(boutonNomme(document.getElementById('bandeau-brouillon'), 'Publier'), () => {
		poserChamp(formulaire, 'statut', 'publiee');
		soumettreVers(formulaire, `${adresse}/modifier`);
	});

	/**
	 * « Comparer les deux registres » — ÉCART DÉCLARÉ : aucun écran du gel ne met les
	 * DEUX REGISTRES côte à côte, V-16 comparant deux VERSIONS d'un même registre.
	 * Le geste mène à l'éditeur de l'Opérationnel, qui porte le même bandeau, plutôt
	 * que de ne rien faire.
	 */
	agir(boutonNomme(document.getElementById('bandeau-resync'), 'Comparer les deux registres'), () =>
		aller(`${adresse}/operationnel`)
	);

	/* ═══════════════════ 3. LA BASCULE DE REGISTRE — `V-14:3948` ══════════ */

	/**
	 * LES DEUX CORPS SONT RENDUS EN PERMANENCE, et la bascule ne fait que déplacer
	 * l'attribut `hidden` — le geste du gel. `data-registre` suit sur l'enveloppe
	 * parce que la feuille gelée le lit ; `aria-selected` sur les onglets parce que
	 * le rôle `tab` l'exige. L'ADRESSE EST REMPLACÉE et non empilée : la bascule
	 * n'est pas une navigation.
	 */
	const app = document.getElementById('app');
	const onglets = Array.from(
		document.querySelectorAll<HTMLButtonElement>('#registre button[data-reg]')
	);
	const corpsDeReference = document.getElementById('corps-reference');
	const corpsOperationnel = document.getElementById('corps-operationnel');
	for (const onglet of onglets) {
		const registre = onglet.dataset['reg'];
		if (registre === undefined) continue;
		agir(onglet, () => {
			app?.setAttribute('data-registre', registre);
			for (const autre of onglets) {
				autre.setAttribute('aria-selected', String(autre === onglet));
			}
			if (corpsDeReference !== null) corpsDeReference.hidden = registre !== 'reference';
			if (corpsOperationnel !== null) corpsOperationnel.hidden = registre !== 'operationnel';
			if (fenetre !== null) {
				fenetre.history.replaceState(fenetre.history.state, '', `?registre=${registre}`);
				fenetre.scrollTo({ top: 0, behavior: 'smooth' });
			}
		});
	}

	/* « Ajouter une version opérationnelle » — l'invite qui remplace les
	   onglets quand la note n'a pas de second registre (`V-14:1517`). */
	agir(document.getElementById('invite-op'), () => aller(`${adresse}/operationnel`));

	/* ═══════════════════ 4. LE PANNEAU « ACTIONS » ════════════════════════ */

	/**
	 * LES CINQ ENTRÉES DU MENU SONT RECONNUES À LEUR LIBELLÉ : le gel ne leur donne
	 * ni identifiant ni classe distinctive. « Historique des versions » et
	 * « Supprimer » ne sont PAS ici — la première est câblée par
	 * `ouvrirLHistorique()`, la seconde par `cablerLaSuppression()` avec son rappel
	 * chiffré (`RG-M04-10`).
	 */
	const menu = document.querySelector('.actions-liste');
	agir(boutonNomme(menu, 'Modifier la référence'), () => aller(`${adresse}/modifier`));
	agir(boutonNomme(menu, "Modifier l'opérationnel"), () => aller(`${adresse}/operationnel`));
	/* `RG-M18-17` — l'impression est celle du navigateur, et la feuille gelée
	   porte déjà ses règles d'impression (`V-14.css`, la requête de média). */
	agir(boutonNomme(menu, 'Imprimer'), () => fenetre?.print());

	/**
	 * « EXPORTER » — LE PÉRIMÈTRE DE L'EXPORT EST LE DOMAINE, PAS LA NOTE : aucune
	 * adresse ne rend une note seule (`RG-M13-01`), et `/console/exports` est l'écran
	 * qui l'offre. SANS LE DROIT DE CONSOLE, L'ENTRÉE EST RETIRÉE et non laissée
	 * morte : la route rend 404 à qui n'est pas administrateur, et `P-03` n'admet pas
	 * un geste visible qui ne mène nulle part.
	 */
	const exporter = boutonNomme(menu, 'Exporter');
	const ouExporter = options.exports;
	if (exporter !== null) {
		if (ouExporter === null) exporter.remove();
		else agir(exporter, () => aller(ouExporter));
	}

	/* Le panneau en erreur : « Réessayer » redemande la page, ce qui est
	   exactement ce que le bouton promet — rien n'est rechargé partiellement. */
	agir(boutonNomme(document.querySelector('.panneau--erreur'), 'Réessayer'), () =>
		document.location.reload()
	);

	/* ═══════════════════ 5. LE CORPS RÉDIGÉ — copie et loupe ══════════════ */

	/**
	 * LES DEUX GESTES DU CORPS SONT DÉLÉGUÉS, ET C'EST UNE NÉCESSITÉ : les boutons de
	 * copie et les cadres de figure ne sont écrits dans aucune vue — ils sortent de
	 * `rendreDocument()`, et les recenser au montage manquerait ceux qu'un changement
	 * de registre fait apparaître.
	 */
	ecouter(formulaire, 'click', (evenement) => {
		const cible = evenement.target;
		if (!(cible instanceof Element)) return;

		/* La copie d'un bloc de code — `V-14:3967`, texte brut et retour du
		   libellé au bout de 1,4 s. */
		const copier = cible.closest<HTMLButtonElement>('.btn-copier');
		if (copier !== null) {
			const code = copier.closest('.bloc-code')?.querySelector('code');
			const brut = code === null || code === undefined ? '' : (code.textContent ?? '');
			/* LE LIBELLÉ D'ORIGINE EST GARDÉ EN NŒUDS, PAS EN CHAÎNE DE BALISAGE : le
			   bouton du gel porte un dessin en plus de son mot, et le rendre par une
			   propriété de balisage réinjecterait du HTML là où un clone suffit. */
			const avant = Array.from(copier.childNodes).map((n) => n.cloneNode(true));
			const fini = (): void => {
				copier.replaceChildren('Copié');
				fenetre?.setTimeout(() => {
					copier.replaceChildren(...avant);
				}, DUREE_DE_L_ACCUSE);
			};
			const presse = fenetre?.navigator.clipboard;
			if (presse === undefined) fini();
			else void presse.writeText(brut).then(fini, fini);
			return;
		}

		/* L'agrandissement d'une figure — `V-14:3982`. La boîte est celle du
		   gel, montée par la route ; sans elle, le cadre reste inerte. */
		const cadre = cible.closest('.figure__cadre');
		if (cadre === null) return;
		ouvrirLaLoupe(document, cadre);
	});

	return () => {
		for (const defaire of jetables) defaire();
	};
}

/** `V-14:3971` — combien de temps le bouton de copie dit « Copié ». */
const DUREE_DE_L_ACCUSE = 1400;

/** Le suffixe que la légende du gel porte et que la loupe retire. */
const INVITE_DE_LEGENDE = /\s*Cliquez pour agrandir\.?\s*$/;

/**
 * L'AGRANDISSEMENT D'UNE FIGURE — `V-14:3982`, transcrit. Le contenu de la boîte
 * est le dessin LUI-MÊME, cloné : ni une seconde source, ni une image
 * reconstruite. La légende est celle de la figure, privée de l'invite.
 */
function ouvrirLaLoupe(document: Document, cadre: Element): void {
	const loupe = document.querySelector<HTMLDialogElement>('dialog#loupe');
	const contenu = document.getElementById('loupe-contenu');
	if (loupe === null || contenu === null) return;
	const dessin = cadre.querySelector('svg') ?? cadre.querySelector('img');
	contenu.replaceChildren();
	if (dessin !== null) contenu.appendChild(dessin.cloneNode(true));
	const legende = document.getElementById('loupe-legende');
	const texte = cadre.closest('figure')?.querySelector('figcaption');
	if (legende !== null && texte !== null && texte !== undefined) {
		legende.textContent = (texte.textContent ?? '').replace(INVITE_DE_LEGENDE, '').trim();
	}
	loupe.showModal();
}

/**
 * LA FERMETURE DE LA BOÎTE D'AGRANDISSEMENT — la croix, et le clic hors boîte.
 * `RG-M18-08` veut la fermeture par Échap : `showModal()` la donne seule, et
 * c'est pourquoi la boîte est ouverte ainsi plutôt que par l'attribut.
 */
export function cablerLaLoupe(document: Document): Debranchement {
	const loupe = document.querySelector<HTMLDialogElement>('dialog#loupe');
	if (loupe === null) return () => {};
	const fermer = (): void => loupe.close();
	const horsBoite = (evenement: Event): void => {
		if (evenement.target === loupe) loupe.close();
	};
	const croix = document.getElementById('loupe-fermer');
	croix?.addEventListener('click', fermer);
	loupe.addEventListener('click', horsBoite);
	return () => {
		croix?.removeEventListener('click', fermer);
		loupe.removeEventListener('click', horsBoite);
	};
}

/**
 * LA FERMETURE DU PANNEAU D'HISTORIQUE — `#fermer-tiroir`, V-15. Le panneau n'est
 * pas un état local : il EST l'état `?version` de cette adresse, et le fermer
 * c'est quitter cet état — non escamoter un tiroir que le rechargement rouvrirait.
 */
export function cablerLaFermetureDeLHistorique(racine: ParentNode, adresse: string): Debranchement {
	const fermer = racine.querySelector<HTMLButtonElement>('#fermer-tiroir');
	if (fermer === null) return () => {};
	fermer.type = 'button';
	const geste = (): void => {
		fermer.ownerDocument.location.assign(adresse);
	};
	fermer.addEventListener('click', geste);
	return () => fermer.removeEventListener('click', geste);
}
