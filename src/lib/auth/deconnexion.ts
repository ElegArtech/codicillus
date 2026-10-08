/**
 * SE DÉCONNECTER EST UN POST. En GET, n'importe quel site — ou une image glissée dans une
 * note — fermait la session de qui l'ouvrait. Le formulaire vise la fenêtre de tête : une
 * page ouverte dans un volet ferme la session de toute l'application, pas son seul cadre.
 */
export const ADRESSE_DE_DECONNEXION = '/deconnexion';

export function seDeconnecter(): void {
	const formulaire = document.createElement('form');
	formulaire.method = 'POST';
	formulaire.action = ADRESSE_DE_DECONNEXION;
	formulaire.target = '_top';
	formulaire.hidden = true;
	document.body.append(formulaire);
	formulaire.submit();
}
