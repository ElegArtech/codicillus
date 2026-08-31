/**
 * LA CONFIGURATION EST CONSTATÉE AU DÉMARRAGE, PAS AU DIX-HUITIÈME ÉCRAN.
 *
 * Le produit construit, démarré avec les seules variables de la base, servait
 * dix-huit écrans en 200 et rendait 500 sur l'écran de recherche — et lui seul —, à
 * la PREMIÈRE REQUÊTE de cet écran : l'exploitant voyait un produit qui marche, et un
 * utilisateur trouvait la page cassée.
 *
 * PAS DE MODE DÉGRADÉ SUR UNE RECHERCHE NON CONFIGURÉE : le moteur est une brique
 * critique, son absence de configuration est une erreur de déploiement. L'état
 * dégradé du produit vise le moteur JOIGNABLE ET MUET, pas le moteur pas configuré.
 * Ce module ne change donc rien à la nature de l'erreur : il en change le MOMENT et
 * la LISIBILITÉ.
 *
 * PAS DE SECONDE DÉFINITION DE CE QUI EST REQUIS : ce module n'énumère aucune
 * variable, il appelle les deux fonctions de configuration existantes et récolte leurs
 * messages. Une liste écrite ici divergerait au premier contrat de déploiement
 * modifié.
 *
 * AUCUNE CONNEXION N'EST OUVERTE : les deux fonctions appelées sont PURES. Constater
 * qu'une base est JOIGNABLE est une autre question, et elle reste paresseuse.
 */
import { configurationDeConnexion, type EnvironnementDeConnexion } from '../base/connexion';
import { configurationDeRecherche, type EnvironnementDeRecherche } from '../recherche/connexion';

export type EnvironnementDeDemarrage = EnvironnementDeConnexion & EnvironnementDeRecherche;

/** Levée quand le produit refuse de servir faute de configuration. */
export class ConfigurationIncompleteErreur extends Error {
	readonly pannes: readonly string[];

	constructor(pannes: readonly string[]) {
		super(
			['Codicillus refuse de démarrer : sa configuration est incomplète.']
				.concat(pannes.map((panne) => `  · ${panne}`))
				.concat(['Aucune requête ne sera servie tant qu’une de ces variables manquera.'])
				.join('\n')
		);
		this.name = 'ConfigurationIncompleteErreur';
		this.pannes = pannes;
	}
}

/**
 * CE QUI MANQUE, EN UNE SEULE PASSE — fonction PURE, éprouvable dans les deux
 * polarités sans base ni moteur. Les deux sondes sont indépendantes et TOUTES LES DEUX
 * exécutées : en sortir à la première ferait deux démarrages, deux lectures de journal
 * et deux corrections là où une suffit.
 */
export function pannesDeConfiguration(env: EnvironnementDeDemarrage): readonly string[] {
	const pannes: string[] = [];
	for (const sonde of [configurationDeConnexion, configurationDeRecherche]) {
		try {
			sonde(env);
		} catch (cause) {
			pannes.push(cause instanceof Error ? cause.message : String(cause));
		}
	}
	return pannes;
}

/**
 * LA PORTE DU DÉMARRAGE. Appelée une fois, avant la première requête. Elle ne lève que
 * sur une configuration incomplète : le serveur bâti attend cette porte avant
 * d'écouter, ce qui manque interrompt donc le démarrage, sans port ouvert.
 */
export function verifierLaConfiguration(env: EnvironnementDeDemarrage): void {
	const pannes = pannesDeConfiguration(env);
	if (pannes.length > 0) throw new ConfigurationIncompleteErreur(pannes);
}
