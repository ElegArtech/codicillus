/**
 * LES SCÉNARIOS D'IMPORT, ET LE SEUL QUE LE PRODUIT EXÉCUTE. `V-24` en dessine TROIS
 * et les offrait tous les trois ; l'import n'en exécute qu'un — « Seul UC-M12-01 —
 * des notes dans un domaine existant — est livré. »
 *
 * Le scénario n'était TRANSMIS NULLE PART : qui choisissait « Importer un domaine
 * complet » remplissait un champ « Nom du domaine à créer * » que personne ne lisait,
 * et son corpus atterrissait dans un domaine existant qu'il n'avait pas choisi. Deux
 * gestes, donc : l'écran n'offre plus que ce que l'import fait — V-24 et V-35 lisent
 * `scenarioEstLivre()` plutôt qu'une liste écrite à la main —, et l'action REFUSE un
 * scénario non livré au lieu de dériver en silence.
 *
 * LE JOUR OÙ UN LOT LIVRERA `UC-M12-02` OU `UC-M12-03`, retirer son entrée de
 * `SCENARIOS_NON_LIVRES` et le nommer ici suffira à le rendre de nouveau offert.
 */

/** L'identifiant d'un scénario — celui des vignettes du gel de V-24. */
export type ScenarioDImport = 'notes' | 'domaine' | 'prepare';

/**
 * LE SEUL SCÉNARIO LIVRÉ — `UC-M12-01`, des notes dans un domaine existant. C'est
 * aussi la valeur par défaut de l'action : un envoi qui ne porte aucun scénario est un
 * envoi de ce scénario-là.
 */
export const SCENARIO_LIVRE: ScenarioDImport = 'notes';

export interface ScenarioNonLivre {
	readonly id: ScenarioDImport;
	readonly exigence: string;
	/** Ce qui manque — repris de `MANQUES_DE_L_IMPORT`, jamais réécrit. */
	readonly ceQuiManque: string;
}

export const SCENARIOS_NON_LIVRES: readonly ScenarioNonLivre[] = [
	{
		id: 'domaine',
		exigence: 'UC-M12-02',
		ceQuiManque:
			'la création du domaine à partir du dossier de premier niveau. L’import écrit dans un ' +
			'domaine qui existe déjà, et rien ne lit le nom du domaine à créer.'
	},
	{
		id: 'prepare',
		exigence: 'UC-M12-03',
		ceQuiManque:
			'la lecture des sept clés de métadonnées, dont aucune source du dépôt ne donne le nom, ' +
			'et la résolution des renvois en relations — la clé de renvoi ne nomme pas le type de ' +
			'relation. Les renvois sont relevés et consignés au rapport ; la relation reste à créer.'
	}
];

export function scenarioEstLivre(scenario: string): boolean {
	return scenario === SCENARIO_LIVRE;
}
