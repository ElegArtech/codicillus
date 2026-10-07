/**
 * LE TITRE DE L'ONGLET. Aucune page n'en portait : onglets, historique et favoris
 * montraient l'adresse. Il est composé ici, pour toutes les routes, depuis l'identifiant
 * de route et le nom de ce que la page affiche quand sa donnée le porte.
 *
 * Les quelques pages qui posent elles-mêmes leur titre en gardent la main : `null`.
 */

const SUFFIXE = ' · Codicillus';

/** Les routes dont la page pose son propre titre. */
const TITRE_PROPRE = new Set([
	'/console/requetes',
	'/console/requetes/[identifiant]',
	'/console/requetes/journal',
	'/requetes/nouvelle',
	'/requetes/transmise'
]);

const LIBELLES: Readonly<Record<string, string>> = {
	'/': 'Accueil',
	'/connexion': 'Connexion',
	'/mot-de-passe-oublie': 'Mot de passe oublié',
	'/indisponibilite': 'Maintenance',
	'/recherche': 'Recherche',
	'/mes-requetes': 'Mes requêtes de documentation',
	'/mes-requetes/[identifiant]': 'Mes requêtes de documentation',
	'/importer': 'Import',
	'/mon-profil': 'Mon profil',
	'/cartographie': 'Cartographie',
	'/cartographie/par-type': 'Cartographie par type',
	'/carte-mentale': 'Carte mentale',
	'/modelisation': 'Modélisation',
	'/bibliotheque': 'Bibliothèque',
	'/bibliotheque/vivacite': 'Vivacité',
	'/notes/nouvelle': 'Nouvelle note',
	'/console': 'Console',
	'/console/univers': 'Univers · Console',
	'/console/domaines': 'Domaines · Console',
	'/console/types-de-note': 'Types de note · Console',
	'/console/types-de-fiches': 'Types de fiches · Console',
	'/console/types-de-relations': 'Types de relations · Console',
	'/console/templates': 'Templates · Console',
	'/console/comptes': 'Comptes · Console',
	'/console/imports': 'Imports · Console',
	'/console/imports/[lot]': 'Imports · Console',
	'/console/exports': 'Exports · Console',
	'/console/analytique': 'Analytique · Console',
	'/console/configuration': 'Configuration · Console'
};

const VUES_DE_NOTE: Readonly<Record<string, string>> = {
	modifier: 'Modifier',
	historique: 'Historique',
	comparaison: 'Comparaison',
	relations: 'Relations',
	operationnel: 'Opérationnel'
};

const VUES_DE_DOMAINE: Readonly<Record<string, string>> = {
	notes: 'Notes',
	signets: 'Signets',
	dossiers: 'Dossiers'
};

/** Une chaîne lue au bout d'un chemin de propriétés, ou `null`. */
function lu(donnee: unknown, ...chemin: string[]): string | null {
	let courant = donnee;
	for (const cle of chemin) {
		if (typeof courant !== 'object' || courant === null) return null;
		courant = (courant as Record<string, unknown>)[cle];
	}
	return typeof courant === 'string' && courant.trim() !== '' ? courant.trim() : null;
}

function premierLu(donnee: unknown, chemins: readonly (readonly string[])[]): string | null {
	for (const chemin of chemins) {
		const valeur = lu(donnee, ...chemin);
		if (valeur !== null) return valeur;
	}
	return null;
}

const TITRE_DE_NOTE = [
	['affichee', 'note', 'titre'],
	['lecture', 'note', 'titre'],
	['note', 'titre'],
	['affichee', 'titre'],
	['noteModifiee', 'titre'],
	['guide', 'titre'],
	['titre']
] as const;
const NOM_DE_DOMAINE = [['domaine', 'nom'], ['vecteur', 'dom'], ['domaine']] as const;
const NOM_D_UNIVERS = [['univers', 'nom']] as const;

function avec(prefixe: string, nom: string | null): string {
	return nom === null ? prefixe : `${prefixe} — ${nom}`;
}

export function titreDeLaPage(routeId: string | null, donnee: unknown): string | null {
	if (routeId === null) return 'Codicillus';
	if (TITRE_PROPRE.has(routeId)) return null;

	const libelle = LIBELLES[routeId];
	if (libelle !== undefined) return libelle + SUFFIXE;

	const segments = routeId.split('/').filter((s) => s !== '');

	if (segments[0] === 'notes' || segments[0] === 'guides') {
		const titre = premierLu(donnee, TITRE_DE_NOTE);
		const vue = VUES_DE_NOTE[segments[2] ?? ''];
		if (vue !== undefined) return avec(vue, titre) + SUFFIXE;
		return (titre ?? 'Note') + SUFFIXE;
	}

	if (segments[0] === 'univers') {
		if (segments.length === 2) return (premierLu(donnee, NOM_D_UNIVERS) ?? 'Univers') + SUFFIXE;
		const domaine = premierLu(donnee, NOM_DE_DOMAINE);
		const vue = VUES_DE_DOMAINE[segments[3] ?? ''];
		if (vue !== undefined) return avec(vue, domaine) + SUFFIXE;
		return (domaine ?? 'Domaine') + SUFFIXE;
	}

	return 'Codicillus';
}
