/**
 * `RG-NF-10` (`CDC:1572`) — « UNE PAGE D'INDISPONIBILITÉ PROGRAMMÉE EST ACTIVABLE. »
 *
 * Rien n'existait : ni drapeau, ni message, ni page. Les deux réglages vivent dans
 * `parametres`, avec le reste de la configuration de l'instance, et `/console/configuration`
 * les pose.
 *
 * L'ADMINISTRATEUR N'EST JAMAIS RENVOYÉ SUR LA PAGE, et ce n'est pas un privilège : c'est
 * la condition pour qu'elle puisse être désactivée. Une porte qui se ferme sur sa propre
 * clef n'est pas une porte.
 *
 * TROIS ADRESSES RESTENT SERVIES POUR TOUT LE MONDE, et pas une de plus :
 *
 *   `/indisponibilite`      — la page elle-même, sans quoi la redirection boucle ;
 *   `/connexion`            — un administrateur pas encore connecté doit pouvoir l'être,
 *                             sans quoi l'instance se ferme définitivement au premier
 *                             redémarrage de navigateur ;
 *   `/deconnexion`          — `RG-ACC-02` : on peut toujours partir.
 *
 * `/mot-de-passe-oublie` EST DÉLIBÉRÉMENT EXCLU : c'est un geste de production, pas une
 * porte de secours, et l'instance est justement annoncée fermée.
 */

/** L'adresse de la page — écrite une fois, lue par la garde et par la redirection. */
export const ADRESSE_DINDISPONIBILITE = '/indisponibilite';

/** Les préfixes que l'indisponibilité ne ferme jamais. Voir l'en-tête. */
const TOUJOURS_SERVIES: readonly string[] = [
	ADRESSE_DINDISPONIBILITE,
	'/connexion',
	'/deconnexion'
];

/**
 * Ce chemin est-il servi même pendant une indisponibilité ?
 *
 * La comparaison est celle de `regimeDe()` — égalité stricte, ou préfixe suivi d'une
 * barre : `/connexions-perdues` ne doit pas passer parce que `/connexion` passe.
 */
export function serviePendantLIndisponibilite(chemin: string): boolean {
	return TOUJOURS_SERVIES.some((p) => chemin === p || chemin.startsWith(`${p}/`));
}
