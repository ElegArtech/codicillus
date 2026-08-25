/**
 * LE CÂBLAGE DES FORMULAIRES — ce qui relie les nœuds du gel aux actions des
 * routes, et pourquoi il vit ICI plutôt que dans `src/vues/`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA RAISON N'EST PAS LA COMMODITÉ, ELLE EST MESURABLE — `ARB-063`
 *
 * Aucune vue de `src/vues/` ne porte `method`, ni `action`, ni un seul attribut
 * de nom utile. Ce n'est pas un oubli d'implémenteur : c'est le gel, et les
 * vues en sont la transcription fidèle. Six lots successifs ont donc écrit des
 * actions justes que rien ne pouvait atteindre.
 *
 * `src/routes/notes/nouvelle/+page.svelte` le dit de lui-même depuis `T-042` :
 * « le banc ne passe jamais par ici — il rend les composants par le mode de
 * conception ; rien de ce fichier n'entre dans son verdict, et les 409 couples
 * ne peuvent pas bouger de son fait ». Ce module est appelé par ces fichiers-là
 * et par eux seuls, depuis `onMount` — il n'est donc jamais rendu au serveur,
 * jamais importé par une vue, jamais traversé par `verif:maquette:app`.
 *
 *   La conformité au gel n'est pas défendue ici par une relecture : elle l'est
 *   par le fait que le chemin mesuré ne traverse pas ce code.
 *
 * C'est le régime *bloquant > vérifiable > déclaratif* appliqué au gel.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE FAIT SUR LE DOCUMENT VIVANT, ET POURQUOI CHAQUE GESTE
 *
 * 1. IL NEUTRALISE LES BOUTONS DU GEL. Un `button` sans attribut de type est un
 *    bouton de SOUMISSION dès qu'il entre dans un formulaire. La barre d'état
 *    en porte quatre sans type — `#ouvrir-meta`, `#annuler`, `#previsualiser`,
 *    `#enregistrer` —, et « Annuler » enverrait donc la note. Tous passent en
 *    type `button` à l'installation ; un seul geste soumet, et il est explicite.
 *
 * 2. IL RENOMME LE GROUPE DE BOUTONS RADIO DU CHOIX DE DOSSIER. Le gel les
 *    nomme `dossier` et ne leur donne AUCUNE valeur : soumis tels quels, ils
 *    poseraient `dossier=on` AVANT le champ caché du même nom, et la lecture
 *    serveur — qui prend la première occurrence — recevrait `on` pour chemin.
 *    Le groupe est renommé ; le regroupement, qui ne tient qu'à l'égalité des
 *    noms, est préservé.
 *
 * 3. IL DONNE LEUR COMPORTEMENT AUX DEUX PAIRES DE BASCULES. `#m-visibilite` et
 *    `#m-statut` sont deux `div[role=group]` de boutons `aria-pressed` que le
 *    script du gel commandait. Les vues étant des transcriptions statiques,
 *    elles sont inertes : sans ce geste, une note ne peut pas être publiée.
 *
 * 4. IL POSE LES CHAMPS CACHÉS À LA SOUMISSION, jamais avant. Les valeurs sont
 *    relevées sur les nœuds du gel, par leur identifiant — tous existent déjà,
 *    aucun n'est ajouté.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE CORPS — UNE LIGNE DU GEL EST UNE LIGNE DE MARKDOWN
 *
 * `#redaction` est un `contenteditable`. Le corps en est relevé LIGNE À LIGNE
 * plutôt que par `innerText`, et la raison est une propriété de la plateforme :
 * `innerText` insère DEUX sauts de ligne autour d'un paragraphe et un seul
 * autour d'un `div`, si bien qu'un aller-retour par `innerText` multiplie les
 * lignes vides à chaque enregistrement. Le relevé ci-dessous parcourt les nœuds
 * et joint par un saut simple ; la pose fait l'exact inverse. Deux
 * enregistrements successifs sans frappe rendent donc le même texte, ce qui est
 * la règle 1 du format (`ADR-003`) portée jusqu'à l'écran.
 *
 * Le texte ainsi relevé est du MARKDOWN, et il est converti côté serveur par
 * `analyserMarkdown()` — la porte unique du format (`verif:convertisseur`).
 * Aucune conversion n'a lieu ici : ce module ne connaît pas le format.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE MODULE NE FAIT PAS
 *
 * Il n'écrit AUCUNE règle de style, ne pose aucune classe qui n'existe pas déjà
 * au gel, et ne crée aucun nœud visible hors des champs cachés et des pastilles
 * d'étiquette — dont la forme est copiée sur celle du gel (`V-17:833-861`).
 *
 * Sans JavaScript, ces écrans ne soumettent pas : `ARB-063` §4 le déclare, et
 * dit ce qu'il faudrait pour le combler.
 */

/** Le séparateur de chemin du corpus — `SEPARATEUR_DE_CHEMIN`, `rangement.ts:111`. */
const SEPARATEUR = ' › ';

/** Ce qu'un câblage rend : de quoi le défaire. */
export type Debranchement = () => void;

/* ═══════════════════════════════════ Les relevés élémentaires ═══════════ */

function noeud<T extends Element>(racine: ParentNode, selecteur: string): T | null {
	return racine.querySelector<T>(selecteur);
}

/**
 * LE CHEMIN DU DOSSIER COCHÉ — reconstruit par REMONTÉE de l'arborescence.
 *
 * Le gel n'écrit le chemin nulle part : il rend un arbre de `ul`/`li` dont
 * chaque étiquette porte le seul nom du segment (`V-17:290-300`). Le chemin
 * complet est donc la suite des noms des `li` ancêtres, du plus haut au plus
 * bas, jointe par le séparateur du corpus — celui-là même dont la vue se sert
 * pour décider quel bouton est coché.
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
 * LE TEXTE DE LA ZONE DE RÉDACTION — un saut de ligne par ligne, pas deux.
 * Voir l'en-tête : `innerText` n'a pas cette propriété, et l'aller-retour la
 * demande.
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

/** La pose du corps repris — l'exact inverse du relevé ci-dessus. */
export function poserLeTexte(zone: Element, texte: string): void {
	zone.replaceChildren();
	const lignes = texte.length === 0 ? [] : texte.split('\n');
	for (const ligne of lignes) {
		const paragraphe = zone.ownerDocument.createElement('p');
		if (ligne === '') paragraphe.appendChild(zone.ownerDocument.createElement('br'));
		else paragraphe.textContent = ligne;
		zone.appendChild(paragraphe);
	}
	/* `data-vide` commande le seul rendu visible du vide — l'invite d'amorçage
	   de `.redaction[data-vide="oui"]::before`. Il est DÉDUIT, jamais déclaré :
	   c'est ce que dit `ZoneDeRedaction.svelte`, et ce geste ne fait que le
	   recalculer après une pose que la vue n'a pas faite. */
	zone.setAttribute('data-vide', texte.trim() === '' ? 'oui' : 'non');
}

/** La valeur pressée d'une paire de bascules, en minuscules sans diacritique. */
function bascule(racine: ParentNode, id: string, defaut: string): string {
	const presse = noeud<HTMLElement>(racine, `#${id} button[aria-pressed="true"]`);
	const brut = presse?.dataset['val'] ?? '';
	if (brut === '') return defaut;
	return brut
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
}

/** Les étiquettes posées — le texte de chaque pastille, sans celui de son bouton. */
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

/* ═══════════════════════════════════ Les gestes rendus au gel ═══════════ */

/** Un champ caché du formulaire, créé s'il manque, mis à jour sinon. */
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
 * SOUMETTRE VERS UNE ACTION NOMMÉE — par le SUBMITTER, jamais en réécrivant
 * l'attribut du formulaire.
 *
 * Le geste naïf — poser `formulaire.action`, soumettre, puis remettre l'ancienne
 * valeur — est une COURSE, et elle a mordu : le panneau d'historique a fait
 * partir une restauration vers l'action de SUPPRESSION, parce que le navigateur
 * lit l'attribut après le retour de `requestSubmit()`. Une note détruite au lieu
 * d'être restaurée : la pire issue possible pour cette famille de gestes.
 *
 * `formaction` sur le bouton soumetteur l'emporte sur l'action du formulaire, et
 * `requestSubmit(soumetteur)` le désigne explicitement. Rien n'est réécrit, rien
 * n'est à remettre, il n'y a plus de fenêtre pendant laquelle le formulaire vise
 * autre chose que ce qu'il vise d'ordinaire.
 *
 * LE SOUMETTEUR PEUT PORTER UN COUPLE, ET C'EST LE SEUL CHAMP QUI NE VOYAGE PAS
 * TOUJOURS. Un formulaire n'envoie QUE le soumetteur qui l'a déclenché : là où
 * tous les autres champs partent à chaque soumission — les trois dialogues de
 * V-13 vivent dans le même formulaire —, celui-ci désigne l'objet du geste sans
 * qu'aucun nom puisse entrer en collision avec un homonyme resté ouvert
 * ailleurs. Sans couple, le soumetteur reste anonyme et n'envoie rien.
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

/* ═══════════════════════════════ Les propriétés d'une fiche ════════════ */

/**
 * LES DEUX VALEURS D'UN CHAMP « interrupteur », ET ELLES NE SONT PAS INVENTÉES.
 *
 * `notes.proprietes_typees` est une table de chaînes — `lireLesProprietes()`
 * (`../base/demonstration.ts`) n'en produit pas d'autre forme, et
 * `lireLesProprietesDeFiche()` (`../donnees/lecture.ts`) rend ce que la colonne
 * porte. Les deux mots retenus sont ceux que le jeu de démonstration écrit
 * déjà : `seeds/demonstration/60-fiche-pg-prod-01.md` porte `sauvegarde=oui` et
 * `…/61-fiche-bkp-01.md` porte `sauvegarde=non`. Un troisième vocabulaire —
 * `true` / `1` / la clé absente — ferait deux écritures pour un même fait, et
 * le panneau de propriétés de V-20 rendrait l'un ou l'autre selon l'origine de
 * la ligne.
 */
export const COCHE = 'oui';
export const DECOCHE = 'non';

/**
 * LE SCHÉMA D'UN CHAMP DE FICHE, tel que le référentiel de l'instance le sert.
 *
 * La forme est celle de `ChampDeFiche` (`seeds/corpus.ts`), que
 * `lireTypesDeFiche()` remplit depuis `champs_de_type_de_fiche`. Elle est
 * redéclarée ICI en structure minimale plutôt qu'importée du jeu de semence :
 * ce module ne connaît ni le corpus de démonstration, ni ses trois noms de type
 * (`TypeDeFiche` est une union fermée qu'une instance réelle déborde).
 */
export interface ChampDeFicheAuFormulaire {
	readonly cle: string;
	readonly nom: string;
	readonly type: string;
	readonly exemple?: string | undefined;
	readonly valeurs?: readonly string[] | undefined;
}

/** Le référentiel entier, indexé par le NOM du type de fiche. */
export type ReferentielDeFiches = Readonly<Record<string, readonly ChampDeFicheAuFormulaire[]>>;

/** L'état de fiche d'une note qu'on rouvre en modification. */
export interface FicheDeDepart {
	/** Le NOM du type de fiche que la note porte. */
	readonly type: string;
	/** Ce que CETTE note a mis dans les champs de ce type. */
	readonly proprietes: Readonly<Record<string, string>>;
}

/**
 * LE RENDU DES CHAMPS D'UN TYPE DE FICHE — le calque de `V-17:2878-2920`.
 *
 * Le gel construit un contrôle par champ, selon son type : un interrupteur, un
 * sélecteur de valeurs, un nombre, ou du texte. Rien n'est ajouté ici, sauf
 * `data-cle` : le gel n'a jamais eu à relire ce qu'il dessinait — il ne
 * soumettait rien —, et la clé du champ doit voyager du référentiel jusqu'à la
 * soumission sans qu'un second appariement par le NOM soit écrit. Deux champs
 * peuvent porter le même nom d'affichage ; `champs_cle_par_type_unique` ne
 * porte que sur la clé.
 *
 * Les valeurs REPRISES sont posées au moment du rendu : c'est le seul moment où
 * le contrôle et sa valeur sont connus ensemble, et une seconde passe
 * dupliquerait la connaissance du type de contrôle.
 */
export function rendreLesProprietesDeFiche(
	zone: Element,
	champs: readonly ChampDeFicheAuFormulaire[],
	valeurs: Readonly<Record<string, string>>,
	surSaisie: () => void
): void {
	const document = zone.ownerDocument;
	zone.replaceChildren();
	for (const champ of champs) {
		const bloc = document.createElement('div');
		bloc.className = 'champ';
		const reprise = valeurs[champ.cle];
		if (champ.type === 'interrupteur') {
			const enveloppe = document.createElement('label');
			enveloppe.className = 'interrupteur';
			const case_ = document.createElement('input');
			case_.type = 'checkbox';
			case_.dataset['cle'] = champ.cle;
			case_.dataset['genre'] = champ.type;
			case_.checked = reprise === COCHE;
			const piste = document.createElement('span');
			piste.className = 'interrupteur__piste';
			const intitule = document.createElement('span');
			intitule.textContent = champ.nom;
			enveloppe.append(case_, piste, intitule);
			case_.addEventListener('change', surSaisie);
			bloc.appendChild(enveloppe);
			zone.appendChild(bloc);
			continue;
		}
		const intitule = document.createElement('label');
		intitule.className = 'champ__label';
		intitule.textContent = champ.nom;
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
			if (reprise !== undefined) selecteur.value = reprise;
			selecteur.addEventListener('change', surSaisie);
			bloc.appendChild(selecteur);
		} else {
			const saisie = document.createElement('input');
			saisie.className = 'saisie';
			saisie.type = champ.type === 'nombre' ? 'number' : 'text';
			saisie.placeholder = champ.exemple ?? '';
			saisie.dataset['cle'] = champ.cle;
			saisie.dataset['genre'] = champ.type;
			if (reprise !== undefined) saisie.value = reprise;
			saisie.addEventListener('input', surSaisie);
			bloc.appendChild(saisie);
		}
		/* L'ÉTIQUETTE DÉSIGNE SON CONTRÔLE, ce que le gel ne fait pas : il rend
		   un `label` sans `for`, ce qui laisse le contrôle sans nom accessible.
		   L'identifiant est dérivé de la clé, unique par type (`ARB-062` §2.4
		   pour la forme du préfixe, `champs_cle_par_type_unique` pour l'unicité). */
		const controle = bloc.querySelector('select, input');
		if (controle !== null) {
			const id = 'fiche-' + champ.cle;
			controle.id = id;
			intitule.setAttribute('for', id);
		}
		zone.appendChild(bloc);
	}
}

/**
 * CE QUE LES CONTRÔLES DE `#proprietes` PORTENT — une table de chaînes.
 *
 * Une valeur VIDE n'est pas soumise : `lireLesProprietesDeFiche()` l'écarte
 * déjà à la lecture, et l'écrire en base ferait porter à la note une propriété
 * que personne n'a renseignée. Un interrupteur, lui, porte toujours l'un de ses
 * deux mots — décoché n'est pas « non renseigné ».
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

/* ═══════════════════════════════════ L'éditeur — V-17 ═══════════════════ */

export interface OptionsDeLEditeur {
	/**
	 * L'ÉDITEUR RÉEL, quand la route en a monté un.
	 *
	 * Présent, c'est LUI qui donne le corps, et le champ soumis est `corps` — le
	 * document canonique sérialisé, celui que la base porte. Absent, la zone de
	 * rédaction est un `contenteditable` nu et le champ soumis est
	 * `corps-markdown`. Les deux chemins existent, ils ne se mélangent jamais, et
	 * `P-35` est la raison pour laquelle ils ne portent pas le même nom.
	 */
	editeur?: () => unknown;
	/**
	 * Le corps repris, en Markdown. Absent en création. Présent en
	 * modification : c'est le document que la base porte, sérialisé par le
	 * convertisseur unique, côté serveur.
	 */
	corps?: string | null;
	/**
	 * L'adresse à recharger quand le domaine change. Le choix de dossier est
	 * rendu par la VUE, à partir du domaine reçu en propriété : le changer sans
	 * recharger laisserait l'arborescence d'un autre domaine à l'écran, et la
	 * note serait rangée là où l'utilisateur croit ne pas la ranger. Absent, le
	 * sélecteur de domaine reste inerte — c'est le cas de la modification, où
	 * le déplacement demande un droit sur les DEUX dossiers (`RG-M05-09`).
	 */
	rechargerSurDomaine?: (domaine: string) => string;
	/**
	 * LE RÉFÉRENTIEL DES TYPES DE FICHE, celui que la route a déjà lu en base
	 * pour peupler le sélecteur `#m-fiche` — `data.typesFiche`, servi par
	 * `lireTypesDeFiche()`.
	 *
	 * ABSENT, `#m-fiche` reste ce qu'il était : un sélecteur qui ne fait rien et
	 * dont la valeur n'est PAS soumise. C'est ce qui garde inchangé tout
	 * formulaire qui n'a pas de fiche à porter — et c'est aussi ce qui empêche
	 * qu'une soumission dépourvue de référentiel se lise comme un RETRAIT de
	 * type, la chaîne vide ayant ce sens en modification.
	 */
	typesFiche?: ReferentielDeFiches;
	/**
	 * L'ÉTAT DE FICHE DE LA NOTE ROUVERTE — le type qu'elle porte et ce qu'elle a
	 * mis dans ses champs.
	 *
	 * Sans lui, l'éditeur ouvrait une fiche « Serveur » sur « Aucun — note
	 * simple », panneau de propriétés vide : l'écran mentait sur l'état de la
	 * note, et un enregistrement sans un geste sur ce champ l'aurait DÉPOUILLÉE
	 * de son type. Absent — la création —, l'écran s'ouvre sur le sélecteur vide
	 * que le gel presse (`V-17:3543-3544`).
	 */
	ficheDeDepart?: FicheDeDepart | null;
	/**
	 * `marquerModifie` du gel (`V-17:2872`, `:2894`, `:2911`, `:2917`) — ce qui
	 * fait passer le témoin de la barre d'état à « Modifications non
	 * enregistrées ». La route le relie à `signalerUneModification()` de
	 * `cablerLesGestesDEdition`, seule définition de cet état.
	 */
	surSaisie?: () => void;
}

/**
 * LE NOM DU TYPE DE NOTE D'UNE FICHE — `007_types_de_note.montee.sql:29`,
 * `('fiche', 'Fiche', 3)`, et `TYPES_NOTE` (`seeds/corpus.ts`).
 *
 * Ce n'est PAS le mot renommable de `../vocabulaire.ts` : celui-là est ce que
 * les écrans AFFICHENT (`M14.7`), celui-ci est la valeur d'une ligne de
 * `types_de_note`, que la soumission transporte et que `resoudreLaCible()`
 * compare à `types_de_note.nom`. Les confondre ferait dépendre l'écriture en
 * base d'un réglage d'affichage.
 */
export const TYPE_DE_NOTE_FICHE = 'Fiche';

/**
 * LE CÂBLAGE DE L'ÉDITEUR — V-17, en création comme en modification.
 *
 * Appelé depuis `onMount` d'une route, jamais ailleurs. Rend de quoi se défaire,
 * pour que la route puisse le rendre à son tour à Svelte.
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

	   Le sélecteur était vivant et seul : ses options venaient de la base, et
	   rien ne les écoutait. `#proprietes` restait vide à jamais, donc la note
	   n'avait aucune propriété à soumettre — le trou était de deux étages.

	   `#m-type` PASSE À « Fiche » quand un type est choisi, et c'est le gel qui
	   l'écrit (`V-17:2921`) : `RG-NOT-01` — une note qui porte un type de fiche
	   EST une fiche. Le geste est GARDÉ sur la présence de l'option : les types
	   de note sont administrables (M14), et poser sur un `select` une valeur
	   qu'aucune option ne porte ne lève pas — elle vide le sélecteur, et la note
	   partirait sans type du tout. */
	const selecteurDeFiche = noeud<HTMLSelectElement>(formulaire, '#m-fiche');
	const zoneDesProprietes = noeud<HTMLElement>(formulaire, '#proprietes');
	const referentiel = options.typesFiche;
	const fichesCablees = selecteurDeFiche !== null && referentiel !== undefined;
	if (fichesCablees && zoneDesProprietes !== null) {
		const marquerModifie = options.surSaisie ?? ((): void => undefined);
		const rendre = (type: string, valeurs: Readonly<Record<string, string>>): void => {
			const champs = referentiel[type];
			if (champs === undefined) {
				zoneDesProprietes.replaceChildren();
				return;
			}
			rendreLesProprietesDeFiche(zoneDesProprietes, champs, valeurs, marquerModifie);
		};
		ecouter(selecteurDeFiche, 'change', () => {
			const choisi = selecteurDeFiche.value;
			rendre(choisi, {});
			marquerModifie();
			if (referentiel[choisi] === undefined) return;
			const selecteurDeType = noeud<HTMLSelectElement>(formulaire, '#m-type');
			if (selecteurDeType === null) return;
			/* Les options sont PARCOURUES, jamais interrogées par un sélecteur : un
			   nom de type de note est une donnée d'instance, et l'échapper pour
			   entrer dans un sélecteur serait une seconde grammaire à tenir. */
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
			rendre(depart.type, depart.proprietes);
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
		/* LE TYPE DE FICHE ET SES PROPRIÉTÉS — les deux champs que la soumission
		   n'a jamais portés, et sans lesquels `notes.type_de_fiche_id` restait
		   vide à jamais quel que fût le choix de l'utilisateur.

		   RIEN N'EST POSÉ QUAND LE CÂBLAGE N'A PAS DE RÉFÉRENTIEL : en
		   modification, un champ `fiche` vide vaut RETRAIT du type, et une
		   soumission composée sans référentiel retirerait le type de toute note
		   qu'elle enregistre. L'absence du champ, elle, ne modifie rien. */
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

/* ═══════════════════════════════════ La suppression — V-14 ══════════════ */

export interface OptionsDeSuppression {
	/** Ce que la confirmation rappelle — `RG-M04-10`, titre et volumes. */
	rappel: string;
}

/**
 * LE CÂBLAGE DE LA SUPPRESSION — le bouton destructif du menu de V-14.
 *
 * `RG-M04-10` exige une confirmation qui RAPPELLE ce qui sera détruit : le
 * titre, les rétroliens qui casseront, les versions perdues. Le rappel est
 * composé par le serveur — c'est lui qui compte — et rendu ici par la
 * confirmation NATIVE du navigateur.
 *
 * ÉCART DÉCLARÉ, ET IL EST NOMMÉ. Le gel porte une boîte de dialogue pour ce
 * geste — `dlg` « Supprimer cette note », `V-40:510-549` —, et cette vue-là
 * n'est pas montée par `/notes/{identifiant}` : V-40 est un catalogue transverse
 * dont « chaque dialogue s'exécute dans la vue qui le déclenche »
 * (`docs/routes.md:211`), et V-14 ne le transcrit pas. Le monter demanderait de
 * toucher `src/vues/`, que `ARB-063` §5 ferme pour cette campagne. La règle est
 * donc tenue quant au FOND — rien n'est détruit sans un rappel chiffré — et non
 * quant à la FORME. Le comblement serait pire : il inventerait un écran.
 */
export function cablerLaSuppression(
	formulaire: HTMLFormElement,
	options: OptionsDeSuppression
): Debranchement {
	/* AUCUN BOUTON DU GEL NE SOUMET — geste 1 de `cablerLEditeur`, et il manquait
	   ICI. Le défaut a été mesuré, pas imaginé : un `button` sans attribut de
	   type est un bouton de SOUMISSION dès qu'il entre dans un formulaire, et ce
	   formulaire-ci vise `?/supprimer`. Cliquer « Imprimer », « Modifier la
	   référence », « Historique des versions » ou « Exporter » DÉTRUISAIT donc la
	   note — 303 vers le domaine, puis 404 sur la note. Une action irréversible
	   déclenchée par un bouton d'impression : c'est le pire défaut de cette
	   campagne, et il tenait à une ligne absente. */
	for (const b of Array.from(formulaire.querySelectorAll('button'))) {
		if (!b.hasAttribute('type')) b.type = 'button';
	}

	const bouton = Array.from(formulaire.querySelectorAll('button')).find(
		(b) => (b.textContent ?? '').trim() === 'Supprimer'
	);
	if (bouton === undefined) return () => {};
	const reaction = (): void => {
		if (!formulaire.ownerDocument.defaultView?.confirm(options.rappel)) return;
		formulaire.requestSubmit();
	};
	bouton.addEventListener('click', reaction);
	return () => bouton.removeEventListener('click', reaction);
}

/* ═══════════════════════════════════ La connexion — V-05 ════════════════ */

/**
 * IL N'Y A PLUS RIEN À CÂBLER SUR LA CONNEXION, ET C'EST LA BONNE NOUVELLE.
 *
 * Ce module posait ici la méthode et les trois noms de champ depuis `onMount`.
 * La parade n'existait donc pas AVANT le montage — et c'est exactement la
 * fenêtre du défaut qu'elle prétendait fermer : une soumission avant
 * hydratation partait en `GET`, avec le mot de passe dans l'adresse. Mesuré sur
 * le HTML servi, `name="motdepasse"` présent et `method` absent.
 *
 * `P-5` mot pour mot : une règle qu'aucun cas n'exerçait. Les quatre attributs
 * sont désormais dans le balisage de `src/vues/V-05.svelte`, où aucune fenêtre
 * ne subsiste, et la connexion fonctionne **sans JavaScript** — vérifié,
 * navigateur script désactivé, `POST /connexion` puis `303`.
 *
 * La fonction est retirée plutôt que laissée vide : un câblage sans objet est
 * un contrôle inerte, et ce dépôt en a assez payé (`P-26`).
 */

/* ═══════════════════════════════════ Le signet — V-23 ═══════════════════ */

/**
 * LE CÂBLAGE DU FORMULAIRE DE SIGNET.
 *
 * Comme V-05, et à la différence de V-17, le gel écrit ici un vrai
 * `form.formulaire` avec un `button[type=submit]#valider-page`. Il ne lui
 * manque que la méthode et les noms. Aucune enveloppe n'est posée.
 *
 * Trois champs portent déjà le nom attendu dans leur identifiant — `adresse`,
 * `description`, `domaine` — et deux ne le portent pas : le titre s'appelle
 * `titre-signet` au gel, et les étiquettes sont des pastilles, pas un champ. Le
 * relevé des pastilles et la touche Entrée sont les mêmes gestes que ceux de
 * l'éditeur, et ils sont écrits une seule fois.
 *
 * `#supprimer-page` soumet vers une action nommée, sur confirmation chiffrée.
 */
export interface OptionsDuSignet {
	/** Ce que la confirmation de suppression rappelle. Absent : pas de suppression. */
	rappelDeSuppression?: string;
}

export function cablerLeSignet(racine: ParentNode, options: OptionsDuSignet = {}): Debranchement {
	const formulaire = noeud<HTMLFormElement>(racine, 'form.formulaire');
	if (formulaire === null) return () => {};
	const document = formulaire.ownerDocument;
	const jetables: Debranchement[] = [];

	formulaire.method = 'post';
	/* EN MODIFICATION, LES DEUX ACTIONS SONT NOMMÉES. SvelteKit refuse qu'une
	   action par défaut cohabite avec une action nommée sur la même page — il
	   rend 500 —, et l'écran d'édition en porte deux : enregistrer et supprimer.
	   La création, elle, n'en a qu'une, et garde donc l'action par défaut. */
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

/* ═══════════════════════════════════ L'historique — V-15 ════════════════ */

export interface OptionsDeLHistorique {
	/** L'adresse de la note — celle sur laquelle le panneau est superposé. */
	adresse: string;
	/** Ce que la confirmation de restauration rappelle. */
	rappel: (numero: number) => string;
}

/** Le numéro qu'une ligne de version porte, lu dans son libellé. */
function numeroDeLigne(ligne: Element): number | null {
	const texte = ligne.querySelector('.ver__n')?.textContent ?? '';
	const trouve = /(\d+)/.exec(texte);
	return trouve === null ? null : Number(trouve[1]);
}

/**
 * LE CÂBLAGE DU PANNEAU D'HISTORIQUE.
 *
 * V-15 n'a **pas de chemin propre** : `docs/routes.md` §3.4 la classe
 * superposition de `/notes/{identifiant}`, et son seul état adressable est
 * `?version={n}` — `?` nu désignant la version courante. Tout ce que ce câblage
 * fait est donc de la NAVIGATION vers cet état, plus le geste de restauration.
 *
 * Le numéro d'une version se lit dans le libellé de sa ligne, faute d'attribut :
 * le gel n'en pose aucun, et lui en ajouter un serait toucher `src/vues/`.
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
	 * LE PANNEAU EST HORS FENÊTRE, ET C'EST LE GEL — cousin exact de `P-3`.
	 *
	 * `V-15.css:761` ouvre le panneau par `.app[data-historique="ouvert"]
	 * .tiroir { transform: none; }`, et `mockups/V-15-historique.html:1853` place
	 * l'`aside.tiroir` **hors** de `div.app` : le sélecteur ne peut pas
	 * s'appliquer, le panneau reste à `translateX(100%)`, et il est
	 * inatteignable. Mesuré : Playwright refuse le clic — « element is outside of
	 * the viewport ».
	 *
	 * DEUX GESTES, ET AUCUN N'INVENTE UN STYLE. On pose l'attribut que la règle
	 * attend, et on rend le panneau DESCENDANT de `.app` pour que la règle du gel
	 * puisse enfin le trouver. Aucune déclaration n'est écrite, aucune feuille
	 * n'est touchée : c'est la règle GELÉE qui ouvre le panneau, elle en devient
	 * seulement applicable.
	 *
	 * C'est une divergence de structure avec la maquette, et elle est assumée :
	 * un panneau que l'utilisateur ne peut pas atteindre n'est pas un panneau.
	 * Elle appelle un regel de V-15, pas une seconde rustine.
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
