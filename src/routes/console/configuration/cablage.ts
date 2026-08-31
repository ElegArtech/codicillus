/**
 * `/console/configuration` — LE COMPLÉMENT AU CÂBLAGE COMMUN, ET RIEN D'AUTRE.
 *
 * `cablerLaConfiguration()` fait déjà l'essentiel ; il lui manque UN nœud, et c'est
 * le seul que l'utilisateur LIT : `#etat-config`. Ce module-là est PARTAGÉ, et « un
 * lot qui a besoin d'une fonction nouvelle l'écrit dans son propre `cablage.ts` ».
 *
 * CE QU'IL BASCULE : `#etat-config` porte `data-modifie`, dont la feuille GELÉE tire
 * deux textes. La vue calcule `modifie` depuis le VECTEUR de planche, qui ne bouge
 * jamais dans le produit — le témoin restait bloqué sur « Aucune modification en
 * attente » alors que le bouton d'enregistrement venait de s'activer.
 *
 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI, aucun nœud n'est créé ni retiré. LE TEXTE
 * EST CELUI DE LA VUE, AU MOT PRÈS : une troisième rédaction du même message
 * finirait par diverger des deux autres.
 */

export type Debranchement = () => void;

/** Les sept champs de `V-33`, par leur identifiant de gel (`V-33:1247-1360`). */
const CHAMPS = ['c-frais', 'c-vieil', 'c-versions', 'c-portail', 'c-mot', 'c-taille', 'c-session'];

/** Les deux phrases de `#etat-config`, littéral de `V-33:508`. */
const AU_REPOS = 'Aucune modification en attente.';
const MODIFIE = "Modifications non enregistrées — elles ne s'appliquent pas encore.";

/**
 * LE TÉMOIN D'ÉTAT SUIT LA SAISIE — le geste que le câblage commun ne fait pas.
 *
 * Les valeurs initiales sont relevées AU MONTAGE, donc celles que le chargeur a
 * servies : la même lecture que `cablerLaConfiguration()`, et le même verdict.
 *
 * IL NE POSE AUCUN ÉCOUTEUR SUR `#enregistrer` NI SUR `#annuler` : l'envoi et le
 * rétablissement appartiennent au câblage commun, et les doubler enverrait deux
 * fois la même requête. Une valeur reposée par script n'émettant pas d'événement,
 * le témoin est relu au clic sur `#annuler`, en observateur.
 */
export function cablerLeTemoinDeConfiguration(racine: ParentNode): Debranchement {
	const champs = CHAMPS.map((id) =>
		racine.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)
	).filter((n): n is HTMLInputElement | HTMLSelectElement => n !== null);
	const temoin = racine.querySelector<HTMLElement>('#etat-config');
	if (champs.length === 0 || temoin === null) return () => {};

	const initiales = new Map(champs.map((c) => [c.id, c.value]));
	const defaire: Debranchement[] = [];

	const relire = (): void => {
		const modifie = champs.some((c) => c.value !== initiales.get(c.id));
		temoin.setAttribute('data-modifie', modifie ? 'oui' : 'non');
		temoin.textContent = modifie ? MODIFIE : AU_REPOS;
	};
	relire();

	const ecouter = (cible: EventTarget, type: string, reaction: () => void): void => {
		cible.addEventListener(type, reaction);
		defaire.push(() => cible.removeEventListener(type, reaction));
	};

	for (const champ of champs) {
		ecouter(champ, 'input', relire);
		ecouter(champ, 'change', relire);
	}

	/* « Rétablir les valeurs enregistrées » repose les champs par script, ce
	   qu'aucun événement de saisie n'annonce : on relit après coup. */
	const retablir = racine.querySelector<HTMLButtonElement>('#annuler');
	if (retablir !== null) ecouter(retablir, 'click', () => queueMicrotask(relire));

	return () => {
		for (const d of defaire) d();
	};
}

/**
 * L'AFFICHAGE DES REFUS DE SEUIL — le dernier maillon, et il manquait : un seuil
 * refusé répondait `400` avec ses messages rattachés à leur champ, et l'écran ne
 * bougeait pas d'un pixel.
 *
 * LES BLOCS EXISTAIENT DÉJÀ, TOUS LES QUATRE — `#erreur-frais`, `#erreur-vieil`,
 * `#erreur-portail`, `#erreur-mot`, chacun avec son `-txt` et son
 * `data-etat="erreur"`. TROIS SE SONT AJOUTÉS SUR LE MÊME PATRON : plafond de
 * versions, taille de pièce jointe et durée de session sont désormais validés
 * (`RG-M14-10` nomme « plafond négatif »), et sans bloc pour se dire leur refus
 * serait un enregistrement qui n'aboutit pas et ne l'annonce pas.
 *
 * POURQUOI ICI ET NON DANS LE MODULE PARTAGÉ : `cablerLaConfiguration()` sert aussi
 * V-27 à V-32, qui n'ont aucun de ces blocs. Le module partagé rend le refus, cette
 * fonction le peint.
 */
export function peindreLesRefusDeConfiguration(
	racine: ParentNode
): (erreurs: readonly { readonly champ: string; readonly message: string }[]) => void {
	/* Les sept champs que l'action sait refuser — `ErreurDeConfiguration`. */
	const CHAMPS_REFUSABLES = [
		'frais',
		'vieil',
		'portail',
		'mot',
		'versions',
		'taille',
		'session'
	] as const;

	return (erreurs) => {
		const parChamp = new Map(erreurs.map((e) => [e.champ, e.message]));
		for (const champ of CHAMPS_REFUSABLES) {
			const message = parChamp.get(champ);
			const bloc = racine.querySelector<HTMLElement>(`#champ-${champ}`);
			const erreur = racine.querySelector<HTMLElement>(`#erreur-${champ}`);
			const texte = racine.querySelector<HTMLElement>(`#erreur-${champ}-txt`);
			if (message === undefined) {
				bloc?.removeAttribute('data-etat');
				if (erreur !== null) erreur.hidden = true;
				continue;
			}
			bloc?.setAttribute('data-etat', 'erreur');
			if (texte !== null) texte.textContent = message;
			if (erreur !== null) erreur.hidden = false;
		}
		/* Le premier champ refusé reçoit le foyer : sans quoi le message peut
		   naître hors de la fenêtre, et le refus reste aussi muet qu'avant. */
		const premier = CHAMPS_REFUSABLES.find((c) => parChamp.has(c));
		if (premier !== undefined) {
			const champ = racine.querySelector<HTMLInputElement>(`#c-${premier}`);
			champ?.focus();
			champ?.scrollIntoView({ block: 'center' });
		}
	};
}
