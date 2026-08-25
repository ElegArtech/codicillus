/**
 * LES SCÉNARIOS D'IMPORT, ET LE SEUL QUE LE PRODUIT EXÉCUTE.
 *
 * `mockups/V-24-import.html` en dessine TROIS, et V-24 les offrait tous les
 * trois. L'import n'en exécute qu'un — `MANQUES_DE_L_IMPORT` de
 * `$lib/donnees/import.ts` le déclare lui-même sous `UC-M12-02, UC-M12-03` :
 * « Seul UC-M12-01 — des notes dans un domaine existant — est livré. »
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CE QUE COÛTAIT LA PROMESSE, ET CE N'ÉTAIT PAS UN LIBELLÉ
 *
 * Le scénario n'était TRANSMIS NULLE PART : ni le formulaire de `/importer`,
 * ni l'action ne le portaient. Un utilisateur qui choisissait « Importer un
 * domaine complet » remplissait un champ « Nom du domaine à créer * » que
 * personne ne lisait, le sélecteur de domaine restait masqué, et la cible
 * retombait sur le domaine proposé par défaut. Son corpus atterrissait dans un
 * domaine existant qu'il n'avait pas choisi.
 *
 * Deux gestes, donc, et ce module porte les deux :
 *   · l'écran n'offre plus que ce que l'import fait — V-24 et V-35 lisent
 *     `scenarioEstLivre()` plutôt qu'une liste écrite à la main ;
 *   · l'action REFUSE un scénario non livré au lieu de dériver en silence —
 *     le formulaire transmet désormais le scénario, et il est éprouvé avant la
 *     moindre écriture.
 *
 * LE JOUR OÙ UN LOT LIVRERA `UC-M12-02` OU `UC-M12-03`, retirer son entrée de
 * `SCENARIOS_NON_LIVRES` et le nommer ici suffira à le rendre de nouveau
 * offert : c'est le geste que `etatDesDonnees()` fait déjà avec le recensement
 * des mesures de console.
 */

/** L'identifiant d'un scénario — celui des vignettes du gel de V-24. */
export type ScenarioDImport = 'notes' | 'domaine' | 'prepare';

/**
 * LE SEUL SCÉNARIO LIVRÉ — `UC-M12-01`, des notes dans un domaine existant.
 *
 * C'est aussi la valeur par défaut de l'action : un envoi qui ne porte aucun
 * scénario est un envoi de ce scénario-là, le seul qui existe.
 */
export const SCENARIO_LIVRE: ScenarioDImport = 'notes';

/** Un scénario que les maquettes dessinent et que l'import n'exécute pas. */
export interface ScenarioNonLivre {
	readonly id: ScenarioDImport;
	/** L'exigence du cahier qui le décrit, et qui reste à livrer. */
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

/** Le scénario est-il exécuté par le produit ? */
export function scenarioEstLivre(scenario: string): boolean {
	return scenario === SCENARIO_LIVRE;
}
