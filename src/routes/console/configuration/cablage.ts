/**
 * `/console/configuration` — LE COMPLÉMENT AU CÂBLAGE COMMUN, ET RIEN D'AUTRE.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI UN SECOND MODULE PLUTÔT QU'UNE LIGNE DANS LE PREMIER
 *
 * `cablerLaConfiguration()` de `src/routes/console/cablage.ts` fait déjà
 * l'essentiel : il relève les sept valeurs au montage, active `#enregistrer` dès
 * qu'une seule dévie, révèle `#annuler`, repose les valeurs initiales et appelle
 * l'action. Il lui manque UN nœud, et c'est le seul que l'utilisateur LIT :
 * `#etat-config`.
 *
 * Ce module-là est partagé — L6 l'emploie pour `envoyerAUneAction()` et pour le
 * tiroir des consoles de structure. Le plan de remédiation §4 tranche ce cas
 * sans ambiguïté : « Un lot qui a besoin d'une fonction nouvelle l'écrit dans
 * son propre `cablage.ts` ». Le complément vit donc ici, à côté de la route qui
 * l'emploie, et deux lots ne se disputent pas un fichier.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL BASCULE, ET POURQUOI CE N'EST PAS UN ORNEMENT
 *
 * `#etat-config` porte `data-modifie`, et la feuille GELÉE en tire deux textes
 * que la vue rend l'un ou l'autre : « Aucune modification en attente. » et
 * « Modifications non enregistrées — elles ne s'appliquent pas encore. »
 * (`V-33:508`). La vue calcule `modifie` depuis le VECTEUR de planche, qui ne
 * bouge jamais dans le produit : le témoin restait donc bloqué sur « Aucune
 * modification en attente » alors que le bouton d'enregistrement venait de
 * s'activer. L'écran se contredisait lui-même, sur la seule phrase qui dit à
 * l'administrateur que son travail n'est pas encore pris en compte.
 *
 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI, aucun nœud n'est créé ni retiré :
 * l'attribut est celui du gel, et la feuille le lit déjà. On rend seulement vrai
 * ce qu'elle affirme.
 *
 * LE TEXTE EST CELUI DE LA VUE, AU MOT PRÈS, et il n'est pas reformulé : les
 * deux littéraux sont recopiés de `V-33:508`, qui les tient du gel. Une
 * troisième rédaction du même message finirait par diverger des deux autres.
 */

/** Ce qu'un câblage rend pour être défait au démontage. */
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
 * servies : c'est la même lecture que `cablerLaConfiguration()`, et elle donne
 * forcément le même verdict. Revenir à la valeur de départ repose le témoin,
 * dans les deux sens.
 *
 * IL NE POSE AUCUN ÉCOUTEUR SUR `#enregistrer` NI SUR `#annuler` : l'envoi et le
 * rétablissement appartiennent au câblage commun, et les doubler enverrait deux
 * fois la même requête. Le rétablissement passe par `#annuler`, dont le clic
 * repose les valeurs — l'écouteur `input` posé ici ne les voit pas, puisqu'une
 * valeur reposée par script n'émet pas d'événement. Le témoin est donc relu
 * aussi au clic sur `#annuler`, en observateur, sans rien y faire d'autre.
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
