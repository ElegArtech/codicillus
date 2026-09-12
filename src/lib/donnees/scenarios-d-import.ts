/**
 * LES SCÉNARIOS D'IMPORT, ET CE QUE LE PRODUIT EXÉCUTE DE CHACUN. `V-24` en dessine
 * TROIS ; le produit ajoute le quatrième niveau que le rangement exige : l'univers.
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
export type ScenarioDImport = 'notes' | 'domaine' | 'univers' | 'racine' | 'prepare';

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
 * Reprendre une arborescence entière : le premier niveau devient l'univers et chacun
 * de ses dossiers directs devient un domaine. Ce scénario est réservé à
 * l'administrateur, puisque lui seul peut créer ces deux niveaux de rangement.
 */
export const SCENARIO_D_UNIVERS: ScenarioDImport = 'univers';

/** Un dossier maître dont chaque dossier direct représente un univers. */
export const SCENARIO_DE_RACINE: ScenarioDImport = 'racine';

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

export function scenarioEstLivre(scenario: string): scenario is ScenarioDImport {
	return !SCENARIOS_NON_LIVRES.some((s) => s.id === scenario) && estUnScenario(scenario);
}

/** Les trois scénarios du gel et l'import d'un univers complet. */
function estUnScenario(scenario: string): scenario is ScenarioDImport {
	return (
		scenario === 'notes' ||
		scenario === 'domaine' ||
		scenario === 'univers' ||
		scenario === 'racine' ||
		scenario === 'prepare'
	);
}

/**
 * Le LIBELLÉ d'un scénario — celui du journal des imports (`V-35`), qui nomme le scénario
 * de chaque lot. Il est ici parce que le journal et l'écran d'import doivent le dire de
 * la même façon : deux tables séparées ont déjà divergé une fois.
 */
export const LIBELLE_DE_SCENARIO: Readonly<Record<ScenarioDImport, string>> = {
	notes: 'Notes dans un domaine existant',
	domaine: 'Domaine complet',
	univers: 'Univers complet',
	racine: 'Racine de l’application',
	prepare: 'Dossier dans un emplacement existant'
};

/** Les quatre gestes montrés dans la console et repris mot pour mot dans le parcours. */
export const CHOIX_D_IMPORT: readonly {
	readonly id: ScenarioDImport;
	readonly nom: string;
	readonly sous: string;
}[] = [
	{
		id: SCENARIO_LIVRE,
		nom: 'Importer une note',
		sous: 'La note sera rangée dans un domaine ou un dossier existant.'
	},
	{
		id: SCENARIO_DE_DOMAINE,
		nom: 'Importer un domaine',
		sous: 'Le dossier choisi deviendra un domaine dans un univers existant.'
	},
	{
		id: SCENARIO_D_UNIVERS,
		nom: 'Importer un univers',
		sous: 'Le dossier choisi deviendra un univers ; ses dossiers directs deviendront des domaines.'
	},
	{
		id: SCENARIO_DE_RACINE,
		nom: 'Importer une racine',
		sous: 'Chaque dossier direct du dossier choisi sera importé comme un univers.'
	},
	{
		id: SCENARIO_PREPARE,
		nom: 'Importer un dossier',
		sous: 'Les notes du dossier seront rangées dans un emplacement existant.'
	}
];

/** Le libellé d'un scénario lu en base, ou l'identifiant brut s'il n'en est pas un. */
export function libelleDeScenario(scenario: string): string {
	return estUnScenario(scenario) ? LIBELLE_DE_SCENARIO[scenario] : scenario;
}
