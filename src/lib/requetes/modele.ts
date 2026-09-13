export const ETATS = {
	'a-evaluer': 'À évaluer',
	acceptee: 'Acceptée',
	diffusee: 'Diffusée',
	'non-retenue': 'Non retenue'
} as const;
export type EtatDeRequete = keyof typeof ETATS;
export const ORIGINES: Record<string, string> = {
	'accueil-public': 'Accueil public',
	'recherche-publique': 'Recherche publique',
	'accueil-interne': 'Accueil connecté',
	'recherche-interne': 'Recherche connectée'
};
export const GESTES: Record<string, string> = {
	depot: 'Requête transmise',
	accepter: 'Requête acceptée',
	refuser: 'Requête non retenue',
	associer: 'Note associée',
	qualifier: 'Qualification mise à jour',
	diffuser: 'Réponse diffusée',
	supprimer: 'Requête supprimée'
};
export function estUnIdentifiantDeRequete(id: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
export function longueur(texte: string): number {
	return Array.from(texte).length;
}
export function erreursDuDepot(sujet: string, besoin: string): { sujet?: string; besoin?: string } {
	const erreurs: { sujet?: string; besoin?: string } = {};
	if (!sujet.trim()) erreurs.sujet = 'Précisez le sujet de votre requête.';
	else if (longueur(sujet) > 160)
		erreurs.sujet =
			'Le sujet dépasse 160 caractères. Raccourcissez-le pour transmettre la requête.';
	if (!besoin.trim()) erreurs.besoin = 'Décrivez le besoin rencontré.';
	else if (longueur(besoin) > 2000)
		erreurs.besoin =
			'Le besoin dépasse 2 000 caractères. Raccourcissez-le pour transmettre la requête.';
	return erreurs;
}
export function dateDeRequete(date: Date): string {
	return new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'Europe/Paris'
	}).format(date);
}
