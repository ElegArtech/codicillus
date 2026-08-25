/**
 * LA CONFIGURATION EST CONSTATÉE AU DÉMARRAGE, PAS AU DIX-HUITIÈME ÉCRAN.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE DÉFAUT QUE CE MODULE FERME
 *
 * Le produit construit, démarré avec les seules variables de la base, servait
 * dix-huit écrans en 200 et rendait 500 sur l'écran de recherche — et lui seul.
 * La panne était constatée à la PREMIÈRE REQUÊTE de cet écran, longtemps après
 * le démarrage, sous la forme d'un 500 nu : l'exploitant voyait un produit qui
 * marche, et un utilisateur trouvait la page cassée.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUI N'EST PAS FAIT, ET C'EST DÉLIBÉRÉ
 *
 * PAS DE MODE DÉGRADÉ SUR UNE RECHERCHE NON CONFIGURÉE. `../recherche/connexion.ts`
 * l'arbitre explicitement : le moteur est une brique critique de la composition,
 * son absence de configuration n'est pas un état dégradé, c'est une erreur de
 * déploiement, et elle se dit. Le produit a bien un état dégradé — il vise le
 * moteur JOIGNABLE ET MUET, pas le moteur pas configuré. Rendre l'écran de
 * recherche en dégradé quand la clé manque cacherait la panne de déploiement,
 * et l'exploitant ne la verrait jamais.
 *
 * Ce module ne change donc RIEN à la nature de l'erreur : il en change le
 * MOMENT et la LISIBILITÉ. Elle se dit au démarrage, elle nomme les variables
 * qui manquent, et le produit refuse de servir plutôt que de servir à moitié.
 *
 * PAS DE SECONDE DÉFINITION DE CE QUI EST REQUIS. Ce module n'énumère aucune
 * variable : il appelle les deux fonctions de configuration existantes et
 * récolte leurs messages, qui nomment déjà les variables et leur jeu. Une liste
 * écrite ici divergerait au premier contrat de déploiement modifié, et la
 * divergence ne se verrait qu'au déploiement suivant.
 *
 * AUCUNE CONNEXION N'EST OUVERTE. Les deux fonctions appelées sont PURES : elles
 * lisent des variables et rendent un objet de paramètres. Constater qu'une base
 * est JOIGNABLE est une autre question, et elle reste paresseuse — un module
 * chargé au démarrage ne doit pas décider qu'un service est en marche.
 */
import { configurationDeConnexion, type EnvironnementDeConnexion } from '../base/connexion';
import { configurationDeRecherche, type EnvironnementDeRecherche } from '../recherche/connexion';

/** Tout ce que le démarrage lit de l'environnement — l'union des deux jeux. */
export type EnvironnementDeDemarrage = EnvironnementDeConnexion & EnvironnementDeRecherche;

/** Levée quand le produit refuse de servir faute de configuration. */
export class ConfigurationIncompleteErreur extends Error {
	/** Les pannes constatées, dans l'ordre où elles ont été relevées. */
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
 * polarités sans base ni moteur.
 *
 * Les deux sondes sont indépendantes et TOUTES LES DEUX exécutées : une
 * configuration à qui il manque la base ET le moteur les nomme en une fois. En
 * sortir à la première ferait deux démarrages, deux lectures de journal et deux
 * corrections là où une suffit.
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
 * LA PORTE DU DÉMARRAGE. Appelée une fois, avant la première requête.
 *
 * Elle ne rend rien et ne lève que sur une configuration incomplète : c'est
 * `hooks.server.ts` qui l'appelle, et le serveur bâti attend cette porte avant
 * d'écouter — ce qui manque interrompt donc le démarrage, sans port ouvert.
 */
export function verifierLaConfiguration(env: EnvironnementDeDemarrage): void {
	const pannes = pannesDeConfiguration(env);
	if (pannes.length > 0) throw new ConfigurationIncompleteErreur(pannes);
}
