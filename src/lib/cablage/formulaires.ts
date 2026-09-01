/**
 * Le câblage des formulaires — ce qui relie les nœuds du gel aux actions des routes, et
 * qui vit ICI plutôt que dans `src/vues/` (`ARB-063`) : aucune vue ne porte `method`,
 * `action` ni un attribut de nom utile, parce que le gel n'en porte pas. Ce module est
 * appelé depuis `onMount`, jamais rendu au serveur, jamais importé par une vue.
 *
 * CE QU'IL FAIT SUR LE DOCUMENT VIVANT :
 *
 * 1. IL NEUTRALISE LES BOUTONS DU GEL. Un `button` sans attribut de type est un bouton
 *    de SOUMISSION dès qu'il entre dans un formulaire, et la barre d'état en porte
 *    quatre sans type — « Annuler » enverrait la note.
 * 2. IL RENOMME LE GROUPE DE BOUTONS RADIO DU CHOIX DE DOSSIER. Le gel les nomme
 *    `dossier` sans valeur : soumis tels quels, ils poseraient `dossier=on` AVANT le
 *    champ caché du même nom, et la lecture serveur prend la première occurrence.
 * 3. IL DONNE LEUR COMPORTEMENT AUX DEUX PAIRES DE BASCULES `#m-visibilite` et
 *    `#m-statut` : sans ce geste, une note ne peut pas être publiée.
 * 4. IL POSE LES CHAMPS CACHÉS À LA SOUMISSION, jamais avant.
 *
 * LE CORPS. `#redaction` est un `contenteditable` relevé LIGNE À LIGNE plutôt que par
 * `innerText` : celui-ci insère DEUX sauts de ligne autour d'un paragraphe et un seul
 * autour d'un `div`, si bien qu'un aller-retour multiplie les lignes vides à chaque
 * enregistrement. Le texte relevé est du MARKDOWN, converti côté serveur par la porte
 * unique du format. Sans JavaScript, ces écrans ne soumettent pas (`ARB-063` §4).
 */

/* Import de TYPE pur — voir `ChampDeFicheAuFormulaire` : il ne fait entrer aucune
   ligne de code, il POSE LE LIEN qu'aucun compilateur ne voyait sans lui. */
import type { ChampDeFiche } from '../../../seeds/corpus';
import { boutonDuGeste } from './libelles';

/** Le séparateur de chemin du corpus — `SEPARATEUR_DE_CHEMIN`, `rangement.ts:111`. */
const SEPARATEUR = ' › ';

export type Debranchement = () => void;

function noeud<T extends Element>(racine: ParentNode, selecteur: string): T | null {
	return racine.querySelector<T>(selecteur);
}

/**
 * Le chemin du dossier coché — reconstruit par REMONTÉE de l'arborescence : le gel
 * n'écrit le chemin nulle part, il rend un arbre de `ul`/`li` dont chaque étiquette
 * porte le seul nom du segment.
 */
export function cheminDuDossierCoche(racine: ParentNode): string {
	const coche = noeud<HTMLInputElement>(racine, '#m-dossier input:checked');
	if (coche === null) return '';
	const segments: string[] = [];
	let porteur: Element | null = coche.closest('li');
	while (porteur !== null) {
		const nom = porteur.querySelector(':scope > label > span')?.textContent?.trim();
		if (nom !== undefined && nom !== '') segments.unshift(nom);
		porteur = porteur.parentElement?.closest('li') ?? null;
	}
	return segments.join(SEPARATEUR);
}

/**
 * Le texte de la zone de rédaction — un saut de ligne par ligne, pas deux. Voir
 * l'en-tête : `innerText` n'a pas cette propriété, et l'aller-retour la demande.
 */
export function texteDeLaZone(zone: Element): string {
	const lignes: string[] = [];
	for (const enfant of Array.from(zone.childNodes)) {
		if (enfant.nodeType === Node.TEXT_NODE) {
			lignes.push((enfant as Text).data);
			continue;
		}
		if (enfant.nodeType !== Node.ELEMENT_NODE) continue;
		const element = enfant as Element;
		if (element.tagName === 'BR') {
			lignes.push('');
			continue;
		}
		lignes.push(...(element.textContent ?? '').split('\n'));
	}
	return lignes
		.join('\n')
		.replace(/\u00a0/g, ' ')
		.replace(/[ \t]+$/gm, '')
		.trimEnd();
}

export function poserLeTexte(zone: Element, texte: string): void {
	zone.replaceChildren();
	const lignes = texte.length === 0 ? [] : texte.split('\n');
	for (const ligne of lignes) {
		const paragraphe = zone.ownerDocument.createElement('p');
		if (ligne === '') paragraphe.appendChild(zone.ownerDocument.createElement('br'));
		else paragraphe.textContent = ligne;
		zone.appendChild(paragraphe);
	}
	/* `data-vide` commande le seul rendu visible du vide — l'invite d'amorçage de
	   `.redaction[data-vide="oui"]::before`. Il est DÉDUIT, jamais déclaré. */
	zone.setAttribute('data-vide', texte.trim() === '' ? 'oui' : 'non');
}

function bascule(racine: ParentNode, id: string, defaut: string): string {
	const presse = noeud<HTMLElement>(racine, `#${id} button[aria-pressed="true"]`);
	const brut = presse?.dataset['val'] ?? '';
	if (brut === '') return defaut;
	return brut
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
}

function etiquettes(racine: ParentNode): string[] {
	const pastilles = Array.from(racine.querySelectorAll('#etq-boite > span'));
	return pastilles
		.map((p) => {
			const copie = p.cloneNode(true) as Element;
			copie.querySelector('button')?.remove();
			return (copie.textContent ?? '').trim();
		})
		.filter((n) => n !== '');
}

function poserChamp(formulaire: HTMLFormElement, nom: string, valeur: string): void {
	const existant = formulaire.querySelector<HTMLInputElement>(
		`input[type="hidden"][data-cable="${nom}"]`
	);
	const champ = existant ?? formulaire.ownerDocument.createElement('input');
	champ.type = 'hidden';
	champ.name = nom;
	champ.dataset['cable'] = nom;
	champ.value = valeur;
	if (existant === null) formulaire.appendChild(champ);
}

/**
 * Soumettre vers une action nommée — par le SUBMITTER, jamais en réécrivant l'attribut
 * du formulaire. Le geste naïf — poser `formulaire.action`, soumettre, remettre
 * l'ancienne valeur — est une COURSE, et elle a mordu : le navigateur lit l'attribut
 * après le retour de `requestSubmit()`, et une restauration est partie vers l'action de
 * SUPPRESSION. `formaction` sur le bouton soumetteur l'emporte.
 *
 * LE SOUMETTEUR PEUT PORTER UN COUPLE, ET C'EST LE SEUL CHAMP QUI NE VOYAGE PAS
 * TOUJOURS : un formulaire n'envoie QUE le soumetteur qui l'a déclenché, ce qui désigne
 * l'objet du geste sans collision avec un homonyme resté ouvert ailleurs.
 */
export function soumettreVers(
	formulaire: HTMLFormElement,
	action: string,
	couple?: { readonly nom: string; readonly valeur: string }
): void {
	const document = formulaire.ownerDocument;
	const existant = formulaire.querySelector<HTMLButtonElement>('button[data-cable-action]');
	const soumetteur = existant ?? document.createElement('button');
	soumetteur.type = 'submit';
	soumetteur.hidden = true;
	soumetteur.dataset['cableAction'] = action;
	soumetteur.formAction = action;
	soumetteur.name = couple?.nom ?? '';
	soumetteur.value = couple?.valeur ?? '';
	if (existant === null) formulaire.appendChild(soumetteur);
	formulaire.requestSubmit(soumetteur);
}

/** Une pastille d'étiquette, de la forme exacte du gel (`V-17:833-861`). */
function pastille(document: Document, nom: string): HTMLElement {
	const span = document.createElement('span');
	span.className = 'etq';
	span.append(nom);
	const retrait = document.createElement('button');
	retrait.type = 'button';
	retrait.setAttribute('aria-label', `Retirer l'étiquette ${nom}`);
	retrait.append('×');
	retrait.addEventListener('click', () => span.remove());
	span.appendChild(retrait);
	return span;
}

/**
 * Les deux valeurs d'un champ « interrupteur ». `notes.proprietes_typees` est une table
 * de CHAÎNES : un champ booléen doit s'y écrire en toutes lettres.
 *
 * ILS VIENNENT DE LA CONSOLE : l'écran qui fait choisir le type à l'administrateur le
 * nomme « Oui ou non » (V-29), et le mot que la console PROMET est celui que la note
 * doit porter. Un troisième vocabulaire — `true`, `1`, ou la clé absente — ferait deux
 * écritures pour un même fait.
 */
export const COCHE = 'oui';
export const DECOCHE = 'non';

/**
 * Le schéma d'un champ de fiche, tel que le référentiel de l'instance le sert — DÉRIVÉ
 * de `ChampDeFiche`, jamais recopié. Un seul membre est élargi : ce module ne connaît
 * pas les noms de type du jeu et lit donc `type` en chaîne.
 *
 * LA COPIE MANUELLE A COÛTÉ TROIS COLONNES INVISIBLES, et une assertion
 * d'assignabilité n'y suffit pas : un sur-ensemble structurel est assignable au
 * sous-ensemble, et l'amputation passe en silence dans les deux sens. Seule la
 * dérivation ferme le trou.
 */
export type ChampDeFicheAuFormulaire = {
	readonly [Membre in keyof ChampDeFiche]: Membre extends 'type' ? string : ChampDeFiche[Membre];
};

/** La marque d'obligation du gel — `V-17:899`, `<span class="oblig">`. */
const MARQUE_D_OBLIGATION = '*';

/**
 * Le préfixe des blocs de refus d'une propriété de fiche. Le gel ne porte que deux
 * blocs `.champ__erreur`, ne connaissant que des champs fixes ; les propriétés d'une
 * fiche sont administrables, et leur bloc naît avec le contrôle sous la même clé — ce
 * qui permet de poser le refus À L'ENDROIT DU CHAMP.
 */
export const PREFIXE_D_ERREUR_DE_PROPRIETE = 'erreur-fiche-';

/** Le préfixe de l'identifiant que porte le CONTRÔLE d'une propriété de fiche. */
export const PREFIXE_DE_CONTROLE_DE_PROPRIETE = 'fiche-';

/**
 * Ce que le bloc de refus d'une propriété obligatoire dit — une seule écriture. Le bloc
 * naît ICI avec sa phrase ; `peindreLeRefusDEdition()` ne réécrit jamais le texte d'un
 * bloc qui porte déjà un enfant, et lit donc CETTE constante.
 */
export const PHRASE_D_OBLIGATION =
	'Le type de fiche exige une valeur pour cette propriété. Renseignez-la, puis enregistrez.';

/**
 * D'où viennent les valeurs que la zone des propriétés rend.
 *
 * `choix` — un type de fiche vient d'être désigné : aucune valeur n'existe, et la valeur
 * par défaut du référentiel se pose.
 *
 * `reprise` — ce sont les propriétés d'une note DÉJÀ ÉCRITE, et elles seules garnissent
 * les contrôles : une propriété que la note ne porte pas reste VIDE, fût-elle dotée d'un
 * défaut au schéma (`V-29:3308`).
 *
 * Ce n'est PAS « création contre modification » : changer le type de fiche d'une note
 * existante est un `choix`.
 */
export type OrigineDesProprietes = 'choix' | 'reprise';

export type ReferentielDeFiches = Readonly<Record<string, readonly ChampDeFicheAuFormulaire[]>>;

export interface FicheDeDepart {
	readonly type: string;
	readonly proprietes: Readonly<Record<string, string>>;
}

/**
 * Le rendu des champs d'un type de fiche — le calque de `V-17:2878-2920`.
 *
 * Rien n'est ajouté au gel sauf `data-cle` : il ne soumettait rien, et la clé doit
 * voyager du référentiel jusqu'à la soumission sans qu'un second appariement par le NOM
 * soit écrit — deux champs peuvent porter le même nom d'affichage. La console écrit
 * trois choses de plus sur chaque propriété (V-29) : une AIDE, une VALEUR PAR DÉFAUT et
 * le caractère OBLIGATOIRE. Aucune classe n'est inventée.
 *
 * LA VALEUR PAR DÉFAUT NE VAUT QUE SUR UN SCHÉMA FRAÎCHEMENT CHOISI, et
 * `reprise === undefined` NE SUFFIT PAS À LE DIRE : une note rouverte ne porte en base
 * que les clés qu'on lui a écrites, de sorte qu'une propriété ajoutée au type après elle
 * y est `undefined` — indiscernable d'un champ qu'on vient de choisir, et une valeur que
 * personne n'a saisie serait entrée en base. D'où le cinquième argument : l'ORIGINE, que
 * seul l'appelant sait. Sur un CHOIX, un défaut pré-posé et non touché EST soumis :
 * `proprietesDeFicheSaisies()` relève les contrôles, pas les frappes.
 *
 * L'OBLIGATION NE SE MARQUE PAS SUR UN INTERRUPTEUR : une case porte toujours l'un de
 * ses deux mots, jamais rien.
 */
export function rendreLesProprietesDeFiche(
	zone: Element,
	champs: readonly ChampDeFicheAuFormulaire[],
	valeurs: Readonly<Record<string, string>>,
	surSaisie: () => void,
	origine: OrigineDesProprietes
): void {
	const document = zone.ownerDocument;
	zone.replaceChildren();
	for (const champ of champs) {
		const bloc = document.createElement('div');
		bloc.className = 'champ';
		const reprise = valeurs[champ.cle];
		/* LE DÉFAUT DU SCHÉMA N'EXISTE QUE SUR UN CHOIX — voir l'en-tête. Sur une
		   reprise il est mis de côté, et un champ que la note ne porte pas s'ouvre
		   vide : c'est ce qui fait que la valeur est DEMANDÉE. */
		const defaut = origine === 'choix' ? champ.defaut : undefined;
		if (champ.type === 'interrupteur') {
			const enveloppe = document.createElement('label');
			enveloppe.className = 'interrupteur';
			const case_ = document.createElement('input');
			case_.type = 'checkbox';
			case_.dataset['cle'] = champ.cle;
			case_.dataset['genre'] = champ.type;
			case_.checked = reprise === undefined ? defaut === COCHE : reprise === COCHE;
			const piste = document.createElement('span');
			piste.className = 'interrupteur__piste';
			const intitule = document.createElement('span');
			intitule.textContent = champ.nom;
			enveloppe.append(case_, piste, intitule);
			case_.addEventListener('change', surSaisie);
			bloc.appendChild(enveloppe);
			poserLAide(bloc, champ);
			zone.appendChild(bloc);
			continue;
		}
		const intitule = document.createElement('label');
		intitule.className = 'champ__label';
		intitule.textContent = champ.nom;
		if (champ.obligatoire === true) {
			const marque = document.createElement('span');
			marque.className = 'oblig';
			marque.textContent = MARQUE_D_OBLIGATION;
			intitule.appendChild(marque);
		}
		bloc.appendChild(intitule);
		if (champ.type === 'liste') {
			const selecteur = document.createElement('select');
			selecteur.className = 'selecteur';
			selecteur.dataset['cle'] = champ.cle;
			selecteur.dataset['genre'] = champ.type;
			const vide = document.createElement('option');
			vide.value = '';
			vide.textContent = '—';
			selecteur.appendChild(vide);
			for (const valeur of champ.valeurs ?? []) {
				const option = document.createElement('option');
				option.value = valeur;
				option.textContent = valeur;
				selecteur.appendChild(option);
			}
			const posee = reprise ?? defaut;
			if (posee !== undefined) selecteur.value = posee;
			selecteur.addEventListener('change', surSaisie);
			bloc.appendChild(selecteur);
		} else {
			const saisie = document.createElement('input');
			saisie.className = 'saisie';
			saisie.type = champ.type === 'nombre' ? 'number' : 'text';
			saisie.placeholder = champ.exemple ?? '';
			saisie.dataset['cle'] = champ.cle;
			saisie.dataset['genre'] = champ.type;
			const posee = reprise ?? defaut;
			if (posee !== undefined) saisie.value = posee;
			saisie.addEventListener('input', surSaisie);
			bloc.appendChild(saisie);
		}
		/* L'ÉTIQUETTE DÉSIGNE SON CONTRÔLE, ce que le gel ne fait pas : il rend un
		   `label` sans `for`, ce qui laisse le contrôle sans nom accessible.
		   L'identifiant est dérivé de la clé, unique par type. */
		const controle = bloc.querySelector('select, input');
		if (controle !== null) {
			const id = PREFIXE_DE_CONTROLE_DE_PROPRIETE + champ.cle;
			controle.id = id;
			intitule.setAttribute('for', id);
			/* L'EXIGENCE EST PORTÉE PAR LE CONTRÔLE LUI-MÊME : `required` la donne au
			   navigateur, `aria-required` à la synthèse vocale, et le refus serveur la
			   tient quoi qu'il arrive — aucune ne remplace les autres. */
			if (champ.obligatoire === true) {
				controle.setAttribute('required', '');
				controle.setAttribute('aria-required', 'true');
			}
		}
		poserLAide(bloc, champ);
		if (champ.obligatoire === true) {
			const refus = document.createElement('div');
			refus.className = 'champ__erreur';
			refus.id = PREFIXE_D_ERREUR_DE_PROPRIETE + champ.cle;
			refus.hidden = true;
			refus.appendChild(pictogrammeDErreur(document));
			refus.appendChild(document.createTextNode(PHRASE_D_OBLIGATION));
			bloc.appendChild(refus);
		}
		zone.appendChild(bloc);
	}
}

/** L'espace de nommage des balises graphiques — un `createElement` nu rendrait
    un nœud de balisage ordinaire, invisible à l'écran. */
const ESPACE_GRAPHIQUE = 'http://www.w3.org/2000/svg';

/**
 * Le pictogramme d'erreur de champ, à l'identique de tous ceux du dépôt : « l'erreur est
 * TOUJOURS accompagnée de son motif, jamais d'un simple contour rouge » (`V-41`).
 * Mesures et garde de disposition sont celles du gel, au chiffre près.
 */
function pictogrammeDErreur(document: Document): Element {
	const dessin = document.createElementNS(ESPACE_GRAPHIQUE, 'svg');
	for (const [nom, valeur] of [
		['width', '13'],
		['height', '13'],
		['viewBox', '0 0 16 16'],
		['fill', 'none'],
		['stroke', 'currentColor'],
		['stroke-width', '1.8'],
		['style', 'flex:none;margin-top:1px']
	]) {
		if (nom !== undefined && valeur !== undefined) dessin.setAttribute(nom, valeur);
	}
	const barre = document.createElementNS(ESPACE_GRAPHIQUE, 'path');
	barre.setAttribute('d', 'M8 4.5v4M8 11.2v.3');
	const cercle = document.createElementNS(ESPACE_GRAPHIQUE, 'circle');
	cercle.setAttribute('cx', '8');
	cercle.setAttribute('cy', '8');
	cercle.setAttribute('r', '6.2');
	dessin.append(barre, cercle);
	return dessin;
}

function poserLAide(bloc: Element, champ: ChampDeFicheAuFormulaire): void {
	if (champ.aide === undefined || champ.aide === '') return;
	const aide = bloc.ownerDocument.createElement('span');
	aide.className = 'champ__aide';
	aide.textContent = champ.aide;
	bloc.appendChild(aide);
}

/**
 * Ce que les contrôles de `#proprietes` portent — une table de chaînes. Une valeur VIDE
 * n'est pas soumise : l'écrire ferait porter à la note une propriété que personne n'a
 * renseignée. Un interrupteur porte toujours l'un de ses deux mots.
 */
export function proprietesDeFicheSaisies(racine: ParentNode): Record<string, string> {
	const rendu: Record<string, string> = {};
	const controles = Array.from(
		racine.querySelectorAll<HTMLInputElement | HTMLSelectElement>('#proprietes [data-cle]')
	);
	for (const controle of controles) {
		const cle = controle.dataset['cle'];
		if (cle === undefined || cle === '') continue;
		if (controle.dataset['genre'] === 'interrupteur') {
			rendu[cle] = (controle as HTMLInputElement).checked ? COCHE : DECOCHE;
			continue;
		}
		const valeur = controle.value.trim();
		if (valeur !== '') rendu[cle] = valeur;
	}
	return rendu;
}

export interface OptionsDeLEditeur {
	/**
	 * L'éditeur réel, quand la route en a monté un. Présent, c'est LUI qui donne le corps
	 * et le champ soumis est `corps` — le document canonique sérialisé. Absent, la zone est
	 * un `contenteditable` nu et le champ est `corps-markdown` : deux noms distincts pour
	 * deux chemins qui ne se mélangent jamais.
	 */
	editeur?: () => unknown;
	/**
	 * Le corps repris, en Markdown. Absent en création ; présent en modification,
	 * sérialisé côté serveur par le convertisseur unique.
	 */
	corps?: string | null;
	/**
	 * L'adresse à recharger quand le domaine change. Le choix de dossier est rendu par la
	 * VUE à partir du domaine reçu : le changer sans recharger laisserait l'arborescence
	 * d'un autre domaine à l'écran. Absent, le sélecteur reste inerte — le cas de la
	 * modification, où le déplacement demande un droit sur les DEUX dossiers (`RG-M05-09`).
	 */
	rechargerSurDomaine?: (domaine: string) => string;
	/**
	 * Le référentiel des types de fiche, celui que la route a déjà lu en base. ABSENT,
	 * `#m-fiche` reste un sélecteur inerte dont la valeur n'est PAS soumise : c'est ce qui
	 * garde inchangé tout formulaire sans fiche, et ce qui empêche qu'une soumission
	 * dépourvue de référentiel se lise comme un RETRAIT de type.
	 */
	typesFiche?: ReferentielDeFiches;
	/**
	 * L'état de fiche de la note rouverte. Sans lui, l'éditeur ouvrait une fiche
	 * « Serveur » sur « Aucun — note simple », panneau vide, et un enregistrement sans
	 * geste sur ce champ l'aurait DÉPOUILLÉE de son type.
	 */
	ficheDeDepart?: FicheDeDepart | null;
	/**
	 * `marquerModifie` du gel — ce qui fait passer le témoin de la barre d'état à
	 * « Modifications non enregistrées ». La route le relie à `signalerUneModification()`.
	 */
	surSaisie?: () => void;
}

/**
 * Le nom du type de note d'une fiche — la valeur d'une ligne de `types_de_note`, que la
 * soumission transporte. Ce n'est PAS le mot renommable de `../vocabulaire.ts`, qui est
 * ce que les écrans AFFICHENT (`M14.7`) : les confondre ferait dépendre l'écriture en
 * base d'un réglage d'affichage.
 */
export const TYPE_DE_NOTE_FICHE = 'Fiche';

/**
 * LE CÂBLAGE DE L'ÉDITEUR — V-17, en création comme en modification. Appelé depuis
 * `onMount` d'une route. Rend de quoi se défaire.
 */
export function cablerLEditeur(
	formulaire: HTMLFormElement,
	options: OptionsDeLEditeur = {}
): Debranchement {
	const document = formulaire.ownerDocument;
	const jetables: Debranchement[] = [];
	const ecouter = <K extends keyof HTMLElementEventMap>(
		cible: EventTarget,
		type: K,
		reaction: (evenement: HTMLElementEventMap[K]) => void
	): void => {
		const enveloppe = (e: Event): void => reaction(e as HTMLElementEventMap[K]);
		cible.addEventListener(type, enveloppe);
		jetables.push(() => cible.removeEventListener(type, enveloppe));
	};

	/* 1. Aucun bouton du gel ne soumet — voir l'en-tête, geste 1. */
	for (const bouton of Array.from(formulaire.querySelectorAll('button'))) {
		if (!bouton.hasAttribute('type')) bouton.type = 'button';
	}

	/* 1 bis. LE CONTRÔLE NATIF DU NAVIGATEUR EST ÉTEINT SUR TOUT LE FORMULAIRE.
	   Aucune source ne le demande : c'est un vide comblé, conséquence du
	   `required` posé sur les propriétés obligatoires. `requestSubmit()` passe par
	   la validation native, et une propriété obligatoire vide AVALE la
	   soumission — sans requête, sans code HTTP, sans que le refus du produit
	   puisse se peindre. La bulle native n'est ni dans la langue du produit, ni à
	   la place attendue, et ne sait pas nommer PLUSIEURS propriétés manquantes.

	   CE QU'IL COÛTE : `required` n'est plus qu'une déclaration lue par
	   l'assistance technique, et c'est le serveur qui refuse. L'extinction porte
	   sur le formulaire ENTIER — toute contrainte native qu'on y poserait un jour
	   (`min`, `max`, `pattern`) serait éteinte avec elle. */
	formulaire.noValidate = true;

	/* 2. Le groupe de dossiers ne peut pas entrer en collision — geste 2. */
	for (const radio of Array.from(
		formulaire.querySelectorAll<HTMLInputElement>('#m-dossier input[name="dossier"]')
	)) {
		radio.name = 'choix-de-dossier';
	}

	/* 3. Les deux paires de bascules retrouvent leur comportement — geste 3. */
	for (const id of ['m-visibilite', 'm-statut']) {
		const groupe = noeud<HTMLElement>(formulaire, `#${id}`);
		if (groupe === null) continue;
		ecouter(groupe, 'click', (evenement) => {
			const cible = (evenement.target as Element | null)?.closest('button');
			if (cible === null || cible === undefined) return;
			for (const bouton of Array.from(groupe.querySelectorAll('button'))) {
				bouton.setAttribute('aria-pressed', bouton === cible ? 'true' : 'false');
			}
		});
	}

	/* 4. Les étiquettes se posent à la touche Entrée — l'aide du gel le dit :
	      « Entrée pour valider. Une étiquette qui n'existe pas est créée. » */
	const saisieDEtiquette = noeud<HTMLInputElement>(formulaire, '#m-etiquette');
	const boite = noeud<HTMLElement>(formulaire, '#etq-boite');
	if (saisieDEtiquette !== null && boite !== null) {
		ecouter(saisieDEtiquette, 'keydown', (evenement) => {
			if (evenement.key !== 'Enter') return;
			evenement.preventDefault();
			const nom = saisieDEtiquette.value.trim();
			if (nom === '') return;
			if (etiquettes(formulaire).includes(nom)) {
				saisieDEtiquette.value = '';
				return;
			}
			boite.insertBefore(pastille(document, nom), saisieDEtiquette);
			saisieDEtiquette.value = '';
		});
		for (const retrait of Array.from(boite.querySelectorAll<HTMLButtonElement>('span > button'))) {
			ecouter(retrait, 'click', () => retrait.closest('span')?.remove());
		}
	}

	/* 5. Le corps repris — seulement quand aucun éditeur n'est monté : l'éditeur
	      pose le document lui-même, et écraser sa zone la viderait. */
	const zone = noeud<HTMLElement>(formulaire, '#redaction');
	if (zone !== null && options.editeur === undefined && typeof options.corps === 'string') {
		poserLeTexte(zone, options.corps);
	}

	/* 6. Le changement de domaine recharge — voir `rechargerSurDomaine`. */
	const selecteurDeDomaine = noeud<HTMLSelectElement>(formulaire, '#m-domaine');
	const recharger = options.rechargerSurDomaine;
	if (selecteurDeDomaine !== null && recharger !== undefined) {
		ecouter(selecteurDeDomaine, 'change', () => {
			document.location.assign(recharger(selecteurDeDomaine.value));
		});
	}

	/* 6 bis. LE TYPE DE FICHE FAIT APPARAÎTRE SES CHAMPS — `V-17:2878-2925`.

	   `#m-type` PASSE À « Fiche » quand un type est choisi, et c'est le gel qui
	   l'écrit : `RG-NOT-01`, une note qui porte un type de fiche EST une fiche. Le
	   geste est GARDÉ sur la présence de l'option — les types de note sont
	   administrables (M14), et poser sur un `select` une valeur qu'aucune option ne
	   porte ne lève pas : elle vide le sélecteur, et la note partirait sans type. */
	const selecteurDeFiche = noeud<HTMLSelectElement>(formulaire, '#m-fiche');
	const zoneDesProprietes = noeud<HTMLElement>(formulaire, '#proprietes');
	const referentiel = options.typesFiche;
	const fichesCablees = selecteurDeFiche !== null && referentiel !== undefined;
	if (fichesCablees && zoneDesProprietes !== null) {
		const marquerModifie = options.surSaisie ?? ((): void => undefined);
		const rendre = (
			type: string,
			valeurs: Readonly<Record<string, string>>,
			origine: OrigineDesProprietes
		): void => {
			const champs = referentiel[type];
			if (champs === undefined) {
				zoneDesProprietes.replaceChildren();
				return;
			}
			rendreLesProprietesDeFiche(zoneDesProprietes, champs, valeurs, marquerModifie, origine);
		};
		ecouter(selecteurDeFiche, 'change', () => {
			const choisi = selecteurDeFiche.value;
			/* UN TYPE QUE LE RÉDACTEUR VIENT DE DÉSIGNER EST UN CHOIX, même sur une
			   note existante : le schéma s'ouvre neuf, avec ses défauts. */
			rendre(choisi, {}, 'choix');
			marquerModifie();
			if (referentiel[choisi] === undefined) return;
			const selecteurDeType = noeud<HTMLSelectElement>(formulaire, '#m-type');
			if (selecteurDeType === null) return;
			/* Les options sont PARCOURUES, jamais interrogées par un sélecteur : un nom
			   de type de note est une donnée d'instance, et l'échapper serait une
			   seconde grammaire à tenir. */
			const porteLeType = Array.from(selecteurDeType.options).some(
				(o) => o.value === TYPE_DE_NOTE_FICHE
			);
			if (porteLeType) selecteurDeType.value = TYPE_DE_NOTE_FICHE;
		});
		/* L'ÉTAT REPRIS — la modification. Le sélecteur est pressé sur le type que
		   la note porte, et ses champs sont rendus avec les valeurs de la note. */
		const depart = options.ficheDeDepart ?? null;
		if (depart !== null && referentiel[depart.type] !== undefined) {
			selecteurDeFiche.value = depart.type;
			/* UNE REPRISE, ET LE MOT COMPTE : `depart.proprietes` ne porte que les clés
			   que la note a en base. Une propriété ajoutée au type après elle doit
			   s'ouvrir VIDE pour que sa valeur soit demandée (`V-29:3308`) ; un défaut
			   de schéma posé ici répondrait à la place du rédacteur. */
			rendre(depart.type, depart.proprietes, 'reprise');
		}
	}

	/* 7. LE SEUL GESTE QUI SOUMET. */
	const soumettre = (): void => {
		const titre = noeud<HTMLTextAreaElement>(formulaire, '#titre');
		poserChamp(formulaire, 'titre', (titre?.value ?? '').trim());
		poserChamp(formulaire, 'type', noeud<HTMLSelectElement>(formulaire, '#m-type')?.value ?? '');
		poserChamp(formulaire, 'domaine', selecteurDeDomaine?.value ?? '');
		poserChamp(formulaire, 'dossier', cheminDuDossierCoche(formulaire));
		poserChamp(formulaire, 'visibilite', bascule(formulaire, 'm-visibilite', 'interne'));
		poserChamp(formulaire, 'statut', bascule(formulaire, 'm-statut', 'publiee'));
		poserChamp(formulaire, 'etiquettes', etiquettes(formulaire).join(','));
		/* LE TYPE DE FICHE ET SES PROPRIÉTÉS. RIEN N'EST POSÉ QUAND LE CÂBLAGE N'A
		   PAS DE RÉFÉRENTIEL : en modification, un champ `fiche` vide vaut RETRAIT
		   du type, et une soumission composée sans référentiel retirerait le type de
		   toute note qu'elle enregistre. L'absence du champ, elle, ne modifie rien. */
		if (fichesCablees && selecteurDeFiche !== null) {
			poserChamp(formulaire, 'fiche', selecteurDeFiche.value);
			poserChamp(formulaire, 'proprietes', JSON.stringify(proprietesDeFicheSaisies(formulaire)));
		}
		if (options.editeur === undefined) {
			poserChamp(formulaire, 'corps-markdown', zone === null ? '' : texteDeLaZone(zone));
		} else {
			poserChamp(formulaire, 'corps', JSON.stringify(options.editeur()));
		}
		formulaire.requestSubmit();
	};

	const bouton = noeud<HTMLButtonElement>(formulaire, '#enregistrer');
	if (bouton !== null) ecouter(bouton, 'click', soumettre);

	/* Le raccourci que le gel affiche sur son propre bouton — `Ctrl` `S`. */
	ecouter(document, 'keydown', (evenement) => {
		if (evenement.key !== 's' || !(evenement.ctrlKey || evenement.metaKey)) return;
		evenement.preventDefault();
		soumettre();
	});

	return () => {
		for (const defaire of jetables) defaire();
	};
}

export interface OptionsDeSuppression {
	/** Ce que la confirmation rappelle — `RG-M04-10`, titre et volumes. */
	rappel: string;
}

/**
 * Le câblage de la suppression — le bouton destructif du menu de V-14. `RG-M04-10` exige
 * une confirmation qui RAPPELLE ce qui sera détruit : le rappel est composé par le
 * serveur — c'est lui qui compte — et rendu ici par la confirmation NATIVE.
 *
 * ÉCART DÉCLARÉ : le gel porte une boîte de dialogue pour ce geste (`V-40:510-549`), mais
 * V-40 est un catalogue transverse que V-14 ne transcrit pas. La règle est tenue quant au
 * FOND, non quant à la FORME.
 */
export function cablerLaSuppression(
	formulaire: HTMLFormElement,
	options: OptionsDeSuppression
): Debranchement {
	/* AUCUN BOUTON DU GEL NE SOUMET — geste 1 de `cablerLEditeur`, et il manquait
	   ICI. Un `button` sans attribut de type est un bouton de SOUMISSION dès qu'il
	   entre dans un formulaire, et ce formulaire-ci vise `?/supprimer` : cliquer
	   « Imprimer » ou « Exporter » DÉTRUISAIT la note. */
	for (const b of Array.from(formulaire.querySelectorAll('button'))) {
		if (!b.hasAttribute('type')) b.type = 'button';
	}

	const bouton = boutonDuGeste(formulaire, 'supprimer');
	if (bouton === null) return () => {};
	const reaction = (): void => {
		if (!formulaire.ownerDocument.defaultView?.confirm(options.rappel)) return;
		formulaire.requestSubmit();
	};
	bouton.addEventListener('click', reaction);
	return () => bouton.removeEventListener('click', reaction);
}

/**
 * Il n'y a plus rien à câbler sur la connexion. Ce module y posait la méthode et les noms
 * de champ depuis `onMount` : la parade n'existait donc pas AVANT le montage, ce qui
 * était exactement la fenêtre du défaut qu'elle prétendait fermer — une soumission avant
 * hydratation partait en `GET`, mot de passe dans l'adresse.
 */

/**
 * Le câblage du formulaire de signet. Comme V-05 et à la différence de V-17, le gel écrit
 * ici un vrai `form.formulaire` avec un `button[type=submit]` : il ne lui manque que la
 * méthode et les noms.
 */
export interface OptionsDuSignet {
	rappelDeSuppression?: string;
}

/**
 * Ce que le champ d'adresse dit quand le presse-papiers reste fermé — refus de
 * permission, navigateur sans presse-papiers programmable, page hors contexte sûr : trois
 * causes, un seul remède pour qui est devant l'écran.
 */
export const PHRASE_DE_PRESSE_PAPIERS_HORS_ATTEINTE =
	"Le presse-papiers n'est pas accessible depuis cette page. Collez l'adresse dans le champ avec Ctrl+V.";

/** Ce qu'il dit quand la lecture aboutit, mais ne rapporte aucun texte. */
export const PHRASE_DE_PRESSE_PAPIERS_VIDE =
	"Le presse-papiers ne contient aucun texte : copiez l'adresse, puis recommencez.";

/**
 * Le bloc de refus du champ d'adresse — montré avec son motif, ou refermé. Le gel pose
 * `#erreur-adresse` masqué avec son pictogramme : rien n'est créé ici.
 */
function direLAdresse(formulaire: ParentNode, motif: string | null): void {
	const bloc = noeud<HTMLElement>(formulaire, '#erreur-adresse');
	const texte = noeud<HTMLElement>(formulaire, '#erreur-adresse-txt');
	const champ = noeud<HTMLElement>(formulaire, '#champ-adresse');
	if (texte !== null) texte.textContent = motif ?? '';
	if (bloc !== null) bloc.hidden = motif === null;
	if (champ === null) return;
	if (motif === null) delete champ.dataset['etat'];
	else champ.dataset['etat'] = 'erreur';
}

/**
 * Pose une adresse collée dans le champ, ou dit pourquoi elle ne l'est pas. L'événement
 * `input` est ÉMIS parce que la vue lie la saisie à son aperçu d'adresse : une valeur
 * posée sans lui laisserait l'aperçu sur l'adresse précédente.
 *
 * Rend `true` si quelque chose a été collé.
 */
export function poserLAdresseCollee(formulaire: ParentNode, texte: string): boolean {
	const champ = noeud<HTMLInputElement>(formulaire, '#adresse');
	if (champ === null) return false;
	const adresse = texte.trim();
	if (adresse === '') {
		direLAdresse(formulaire, PHRASE_DE_PRESSE_PAPIERS_VIDE);
		champ.focus?.();
		return false;
	}
	champ.value = adresse;
	direLAdresse(formulaire, null);
	const fenetre = champ.ownerDocument.defaultView;
	if (fenetre?.Event !== undefined) {
		champ.dispatchEvent(new fenetre.Event('input', { bubbles: true }));
	}
	champ.focus?.();
	champ.setSelectionRange?.(adresse.length, adresse.length);
	return true;
}

export function cablerLeSignet(racine: ParentNode, options: OptionsDuSignet = {}): Debranchement {
	const formulaire = noeud<HTMLFormElement>(racine, 'form.formulaire');
	if (formulaire === null) return () => {};
	const document = formulaire.ownerDocument;
	const jetables: Debranchement[] = [];

	formulaire.method = 'post';
	/* EN MODIFICATION, LES DEUX ACTIONS SONT NOMMÉES : SvelteKit rend 500 si une
	   action par défaut cohabite avec une action nommée sur la même page, et
	   l'écran d'édition en porte deux. La création n'en a qu'une. */
	if (options.rappelDeSuppression !== undefined) formulaire.action = '?/enregistrer';
	for (const id of ['adresse', 'description', 'domaine']) {
		const champ = noeud<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
			formulaire,
			`#${id}`
		);
		if (champ !== null) champ.name = id;
	}
	const champTitre = noeud<HTMLInputElement>(formulaire, '#titre-signet');
	if (champTitre !== null) champTitre.name = 'titre';

	/* Les pastilles d'étiquette — même geste que l'éditeur, même forme gelée. */
	const saisie = noeud<HTMLInputElement>(formulaire, '#etiquette');
	const boite = noeud<HTMLElement>(formulaire, '#etq-boite');
	const nomsPoses = (): string[] =>
		Array.from(formulaire.querySelectorAll('#etq-boite > span')).map((p) => {
			const copie = p.cloneNode(true) as Element;
			copie.querySelector('button')?.remove();
			return (copie.textContent ?? '').trim();
		});
	if (saisie !== null && boite !== null) {
		const aLaFrappe = (evenement: KeyboardEvent): void => {
			if (evenement.key !== 'Enter') return;
			evenement.preventDefault();
			const nom = saisie.value.trim();
			saisie.value = '';
			if (nom === '' || nomsPoses().includes(nom)) return;
			boite.insertBefore(pastille(document, nom), saisie);
		};
		saisie.addEventListener('keydown', aLaFrappe);
		jetables.push(() => saisie.removeEventListener('keydown', aLaFrappe));
		for (const retrait of Array.from(boite.querySelectorAll<HTMLButtonElement>('span > button'))) {
			const oter = (): void => retrait.closest('span')?.remove();
			retrait.addEventListener('click', oter);
			jetables.push(() => retrait.removeEventListener('click', oter));
		}
	}

	/* COLLER DEPUIS LE PRESSE-PAPIERS. Le geste est une lecture du presse-papiers,
	   donc un comportement de navigateur, donc sa place est ici et pas dans la vue.

	   LE REFUS EST UN ÉTAT AFFICHÉ, JAMAIS UN SILENCE : la permission peut être
	   refusée, et n'existe pas hors contexte sûr. `#erreur-adresse`, déjà au gel,
	   porte alors la phrase qui nomme le geste de secours. */
	const collage = noeud<HTMLButtonElement>(formulaire, '#coller');
	const champAdresse = noeud<HTMLInputElement>(formulaire, '#adresse');
	if (collage !== null && champAdresse !== null) {
		collage.type = 'button';
		const auCollage = (): void => {
			const fenetre = document.defaultView;
			const pressePapiers = fenetre?.navigator.clipboard;
			if (pressePapiers === undefined || pressePapiers === null) {
				direLAdresse(formulaire, PHRASE_DE_PRESSE_PAPIERS_HORS_ATTEINTE);
				champAdresse.focus();
				return;
			}
			void pressePapiers.readText().then(
				(texte) => {
					poserLAdresseCollee(formulaire, texte);
				},
				() => {
					direLAdresse(formulaire, PHRASE_DE_PRESSE_PAPIERS_HORS_ATTEINTE);
					champAdresse.focus();
				}
			);
		};
		collage.addEventListener('click', auCollage);
		jetables.push(() => collage.removeEventListener('click', auCollage));
	}

	/* Les étiquettes voyagent dans un champ caché, posé à la soumission. */
	const avantEnvoi = (): void => poserChamp(formulaire, 'etiquettes', nomsPoses().join(','));
	formulaire.addEventListener('submit', avantEnvoi);
	jetables.push(() => formulaire.removeEventListener('submit', avantEnvoi));

	/* La suppression — action nommée, confirmation chiffrée. `RG-M18-05` :
	   toute action irréversible rappelle précisément ce qui sera détruit. */
	const bouton = noeud<HTMLButtonElement>(formulaire, '#supprimer-page');
	const rappel = options.rappelDeSuppression;
	if (bouton !== null && rappel !== undefined) {
		bouton.type = 'button';
		const oter = (): void => {
			if (!document.defaultView?.confirm(rappel)) return;
			poserChamp(formulaire, 'etiquettes', nomsPoses().join(','));
			soumettreVers(formulaire, '?/supprimer');
		};
		bouton.addEventListener('click', oter);
		jetables.push(() => bouton.removeEventListener('click', oter));
	} else if (bouton !== null) {
		bouton.type = 'button';
	}

	return () => {
		for (const defaire of jetables) defaire();
	};
}

export interface OptionsDeLHistorique {
	adresse: string;
	rappel: (numero: number) => string;
}

function numeroDeLigne(ligne: Element): number | null {
	const texte = ligne.querySelector('.ver__n')?.textContent ?? '';
	const trouve = /(\d+)/.exec(texte);
	return trouve === null ? null : Number(trouve[1]);
}

/**
 * Le câblage du panneau d'historique. V-15 n'a pas de chemin propre : c'est une
 * superposition de `/notes/{identifiant}` dont le seul état adressable est `?version={n}`.
 * Tout ce câblage est donc de la NAVIGATION vers cet état, plus la restauration. Le numéro
 * d'une version se lit dans le libellé de sa ligne : le gel ne pose aucun attribut.
 */
export function cablerLHistorique(
	racine: ParentNode,
	formulaire: HTMLFormElement,
	options: OptionsDeLHistorique
): Debranchement {
	const document = formulaire.ownerDocument;
	const jetables: Debranchement[] = [];
	const aller = (cible: string): void => document.location.assign(cible);

	/**
	 * LE PANNEAU EST HORS FENÊTRE, ET C'EST LE GEL. `V-15.css:761` ouvre le panneau par
	 * `.app[data-historique="ouvert"] .tiroir`, et `V-15-historique.html:1853` place
	 * l'`aside.tiroir` HORS de `div.app` : le sélecteur ne peut pas s'appliquer et le
	 * panneau reste inatteignable.
	 *
	 * DEUX GESTES, ET AUCUN N'INVENTE UN STYLE : on pose l'attribut que la règle attend, et
	 * on rend le panneau DESCENDANT de `.app`. Divergence de structure assumée avec la
	 * maquette : un panneau que l'utilisateur ne peut pas atteindre n'est pas un panneau.
	 */
	const app = noeud<HTMLElement>(racine, '.app');
	const tiroir = noeud<HTMLElement>(racine, '#tiroir');
	if (app !== null && tiroir !== null) {
		if (!app.contains(tiroir)) app.appendChild(tiroir);
		app.setAttribute('data-historique', 'ouvert');
	}

	const ecouter = (cible: EventTarget, type: string, reaction: (e: Event) => void): void => {
		cible.addEventListener(type, reaction);
		jetables.push(() => cible.removeEventListener(type, reaction));
	};

	/* Une ligne de version ouvre son état adressable. La ligne courante y revient
	   par l'adresse nue, ce que le gel écrit lui-même. */
	ecouter(racine as unknown as EventTarget, 'click', (evenement) => {
		const corps = (evenement.target as Element | null)?.closest('.ver__corps');
		if (corps === null || corps === undefined) return;
		const ligne = corps.closest('.ver');
		if (ligne === null) return;
		evenement.preventDefault();
		if (ligne.getAttribute('data-courante') === 'oui') return aller(options.adresse);
		const numero = numeroDeLigne(ligne);
		if (numero !== null) aller(`${options.adresse}?version=${String(numero)}`);
	});

	const retour = noeud<HTMLButtonElement>(racine, '#bv-retour');
	if (retour !== null) {
		retour.type = 'button';
		ecouter(retour, 'click', () => aller(options.adresse));
	}

	/* COMPARER — deux versions cochées, et l'adresse de la comparaison se compose
	   de leurs deux numéros. Le bouton du gel naît désactivé ; il le reste tant
	   que la sélection n'en porte pas exactement deux. */
	const comparer = noeud<HTMLButtonElement>(racine, '#comparer');
	const cochees = (): number[] =>
		Array.from(racine.querySelectorAll('.ver'))
			.filter((l) => l.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked === true)
			.map(numeroDeLigne)
			.filter((n): n is number => n !== null)
			.sort((a, b) => a - b);
	if (comparer !== null) {
		comparer.type = 'button';
		ecouter(racine as unknown as EventTarget, 'change', (evenement) => {
			if ((evenement.target as Element | null)?.matches('.ver input[type="checkbox"]') !== true) {
				return;
			}
			comparer.disabled = cochees().length !== 2;
		});
		ecouter(comparer, 'click', () => {
			const deux = cochees();
			if (deux.length !== 2) return;
			aller(`${options.adresse}/comparaison?versions=${String(deux[0])}-${String(deux[1])}`);
		});
	}

	/* RESTAURER — action irréversible, donc confirmation qui rappelle ce qui sera
	   écrasé (`RG-M18-05`). Le numéro voyage en champ caché. */
	const restaurer = noeud<HTMLButtonElement>(racine, '#bv-restaurer');
	if (restaurer !== null) {
		restaurer.type = 'button';
		ecouter(restaurer, 'click', () => {
			const affichee = racine.querySelector('.ver[data-affichee="oui"]');
			const numero = affichee === null ? null : numeroDeLigne(affichee);
			if (numero === null) return;
			if (!document.defaultView?.confirm(options.rappel(numero))) return;
			poserChamp(formulaire, 'version', String(numero));
			soumettreVers(formulaire, '?/restaurer');
		});
	}

	return () => {
		for (const defaire of jetables) defaire();
	};
}
