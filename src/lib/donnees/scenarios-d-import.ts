/**
 * LES SCÉNARIOS D'IMPORT, ET CE QUE LE PRODUIT EXÉCUTE DE CHACUN. `V-24` en dessine
 * TROIS ; les trois sont livrés.
 *
 * L'HISTOIRE DE CE MODULE EST CELLE D'UN ÉCRAN QUI PROMETTAIT PLUS QUE L'IMPORT NE
 * FAISAIT : le scénario n'était TRANSMIS NULLE PART — qui choisissait « Importer un
 * domaine complet » remplissait un champ « Nom du domaine à créer * » que personne ne
 * lisait, et son corpus atterrissait dans un domaine existant qu'il n'avait pas choisi.
 * Le premier geste a été de n'offrir que ce que l'import faisait ; le second, celui-ci,
 * est de faire ce que l'écran offrait.
 *
 * `SCENARIOS_NON_LIVRES` RESTE, ET IL EST VIDE. Ce n'est pas un vestige : c'est le
 * mécanisme par lequel V-24 et V-35 n'offrent jamais un scénario que l'action refuse —
 * les deux écrans lisent `scenarioEstLivre()` plutôt qu'une liste écrite à la main. Une
 * liste vide est le bon état d'un mécanisme dont la cause a disparu ; le retirer
 * obligerait à le réécrire au premier scénario qui reculerait.
 */

/** L'identifiant d'un scénario — celui des vignettes du gel de V-24. */
export type ScenarioDImport = 'notes' | 'domaine' | 'prepare';

/**
 * LE SCÉNARIO DE BASE — `UC-M12-01`, des notes dans un domaine existant. C'est aussi la
 * valeur par défaut de l'action : un envoi qui ne porte aucun scénario est un envoi de
 * celui-là.
 */
export const SCENARIO_LIVRE: ScenarioDImport = 'notes';

/**
 * `UC-M12-02` — le dossier de premier niveau devient un DOMAINE. C'est le seul scénario
 * dont la cible n'existe pas encore, et donc le seul dont le droit s'éprouve sur
 * l'univers d'accueil.
 */
export const SCENARIO_DE_DOMAINE: ScenarioDImport = 'domaine';

/**
 * `UC-M12-03` — un corpus déjà muni de ses métadonnées. Les dix membres d'en-tête
 * qu'énumère le cahier sont ceux que l'export ÉCRIT : `../export/archive.ts` les nomme,
 * une seule fois, pour les deux sens.
 */
export const SCENARIO_PREPARE: ScenarioDImport = 'prepare';

export interface ScenarioNonLivre {
	readonly id: ScenarioDImport;
	readonly exigence: string;
	/** Ce qui manque — repris de `MANQUES_DE_L_IMPORT`, jamais réécrit. */
	readonly ceQuiManque: string;
}

/** Aucun. Voir l'en-tête : la liste vide est un état, pas un oubli. */
export const SCENARIOS_NON_LIVRES: readonly ScenarioNonLivre[] = [];

export function scenarioEstLivre(scenario: string): boolean {
	return !SCENARIOS_NON_LIVRES.some((s) => s.id === scenario) && estUnScenario(scenario);
}

/** Les trois scénarios que le gel dessine, et rien d'autre. */
function estUnScenario(scenario: string): scenario is ScenarioDImport {
	return scenario === 'notes' || scenario === 'domaine' || scenario === 'prepare';
}

/**
 * Le LIBELLÉ d'un scénario — celui du journal des imports (`V-35`), qui nomme le scénario
 * de chaque lot. Il est ici parce que le journal et l'écran d'import doivent le dire de
 * la même façon : deux tables séparées ont déjà divergé une fois.
 */
export const LIBELLE_DE_SCENARIO: Readonly<Record<ScenarioDImport, string>> = {
	notes: 'Notes dans un domaine existant',
	domaine: 'Domaine complet',
	prepare: 'Corpus préparé'
};

/** Le libellé d'un scénario lu en base, ou l'identifiant brut s'il n'en est pas un. */
export function libelleDeScenario(scenario: string): string {
	return estUnScenario(scenario) ? LIBELLE_DE_SCENARIO[scenario] : scenario;
}
