/**
 * Le périmètre, mis dans la requête — le cœur d'`ADR-006` : « la requête envoyée au moteur NE
 * PEUT PAS rapporter un document interdit ».
 *
 * L'ADR interdit trois choses que ce module rend inatteignables : recevoir une liste puis la
 * filtrer — le filtre est construit AVANT la requête ; interroger l'index sans filtre — le
 * type de retour est une SOMME, il n'existe pas de troisième forme ; un chemin dérogatoire en
 * anonyme — le régime anonyme sort en premier, sans consulter le moindre droit.
 *
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI : ce module TRADUIT ce que `resolution.ts` rend.
 */
import type { Identite, Perimetre } from '../droits/resolution';

/**
 * Ce que le moteur recevra — ou bien rien du tout. La forme est une somme, et c'est
 * elle qui porte la garantie : un appelant ne peut pas obtenir une requête sans
 * filtre, parce qu'aucune valeur de ce type n'en décrit une. `interroger: false`
 * n'est pas un échec, c'est le périmètre VIDE.
 */
export type FiltreDIndex =
	| { readonly interroger: false; readonly motif: string }
	| { readonly interroger: true; readonly filtre: string };

/**
 * Une valeur, écrite dans la langue de filtre du moteur : chaînes entre guillemets
 * doubles, contre-oblique et guillemet échappés. Rien n'est concaténé sans passer par
 * ici — ce qui n'est jamais composé à la main n'a jamais à être échappé deux fois.
 */
export function valeurDeFiltre(valeur: string): string {
	return `"${valeur.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Une clause « ce champ vaut l'une de ces valeurs » — le OU d'une facette. */
export function clauseDAppartenance(champ: string, valeurs: readonly string[]): string {
	return `${champ} IN [${valeurs.map(valeurDeFiltre).join(', ')}]`;
}

/**
 * Le filtre du régime anonyme — la phrase d'`ADR-006`, traduite mot pour mot : « en anonyme,
 * le filtre est réduit à `visibilite = publique AND statut = publiee`, SANS EXCEPTION NI
 * CHEMIN DÉROGATOIRE ».
 *
 * LE DOSSIER N'Y FIGURE PAS, ET CE N'EST PAS UN OUBLI : `perimetreAnonyme()` est CONSTRUIT à
 * partir des notes publiques et publiées, donc le dossier porteur d'une telle note y est
 * toujours. La seconde condition implique la première.
 *
 * ELLE EST EXACTE SOUS UNE INVARIANTE : toute note indexée porte une chaîne d'ancêtres non
 * vide. L'invariante est tenue par DEUX gardes indépendantes : la clé étrangère composée de
 * `notes` vers `dossiers`, et le refus de `projeterLeCorpus()`, qui LÈVE plutôt que d'écrire
 * une entrée sans périmètre. LA RÉDUCTION VA DANS LE SENS FERMANT : l'inverse publierait le
 * corpus interne.
 */
export const FILTRE_ANONYME = `visibilite = ${valeurDeFiltre('publique')} AND statut = ${valeurDeFiltre('publiee')}`;

/**
 * Le filtre total — celui de l'administrateur (`RG-DRO-03`). IL RESTE UN FILTRE : `ADR-006`
 * interdit « toute requête à l'index sans filtre de périmètre ». La clause exige que l'entrée
 * PORTE un dossier — une entrée écrite sans périmètre ne sortirait même pas pour lui.
 */
export const FILTRE_TOTAL = 'dossier EXISTS';

/**
 * Le filtre de périmètre — traduction de ce que `resolution.ts` a décidé. Les trois régimes,
 * dans l'ordre où `perimetreDeLecture()` les tranche : l'anonyme sort EN PREMIER et son filtre
 * ne mentionne aucun dossier ; l'administrateur reçoit le filtre total ; les autres,
 * l'ensemble des dossiers dont la résolution rend un droit qui porte la lecture.
 *
 * LE DOSSIER PORTEUR, ET NON LA CHAÎNE D'ANCÊTRES : sous le régime authentifié l'ensemble des
 * dossiers lisibles est clos vers le bas et les deux clauses coïncident ; sous le régime
 * ANONYME il est clos vers le HAUT, et une clause sur la chaîne publierait les notes internes
 * des sous-dossiers. `ancetres` reste indexé parce qu'`ADR-006` l'exige.
 *
 * @param identite l'appelant, tel que la couche de session l'a établi
 * @param perimetre ce que `perimetreDeLecture()` a rendu pour cette identité
 */
export function filtreDuPerimetre(identite: Identite, perimetre: Perimetre): FiltreDIndex {
	if (identite.type === 'anonyme') {
		return { interroger: true, filtre: FILTRE_ANONYME };
	}
	if (perimetre.tout) {
		return { interroger: true, filtre: FILTRE_TOTAL };
	}
	const dossiers = [...perimetre.dossiers];
	if (dossiers.length === 0) {
		/* RG-DRO-02, fermeture par défaut. Aucune requête n'est émise : c'est la
		   forme la plus forte du filtre, et la seule qui ne coûte rien. */
		return { interroger: false, motif: 'aucun dossier lisible — fermeture par défaut (RG-DRO-02)' };
	}
	/* L'ordre est fixé pour que deux appels rendent la même chaîne : un filtre
	   reproductible est un filtre comparable, donc mesurable. */
	dossiers.sort();
	return { interroger: true, filtre: clauseDAppartenance('dossier', dossiers) };
}

/**
 * Les facettes honorées, traduites en clauses. `docs/routes.md` §4.2 : « à l'intérieur d'une
 * facette les valeurs sont en OU, entre facettes en ET ». CE MODULE NE DÉCIDE PAS DE CE QUI
 * EST HONORÉ : il reçoit les paramètres que le crible de `../donnees/public.ts` a laissé
 * passer, et un paramètre hors liste n'a aucun moyen d'être refusé — « un refus révélerait
 * l'existence du filtre ». La facette « fraîcheur » n'a pas de champ dans l'index (`P-01`) :
 * la liste étant close, son absence s'y lit.
 */
export const FACETTES_TRADUITES: ReadonlyMap<string, string> = new Map([
	['univers', 'univers'],
	['domaine', 'domaine'],
	['type', 'type'],
	['statut', 'statut'],
	['visibilite', 'visibilite'],
	['etiquette', 'etiquettes']
]);

export function clausesDeFacette(honores: URLSearchParams): readonly string[] {
	const clauses: string[] = [];
	for (const [parametre, champ] of FACETTES_TRADUITES) {
		const valeurs = honores.getAll(parametre);
		if (valeurs.length > 0) clauses.push(clauseDAppartenance(champ, valeurs));
	}
	return clauses;
}

/**
 * Le filtre complet — le périmètre, PUIS les facettes. Le périmètre vient en premier
 * parce qu'il est la garantie, et les facettes ne peuvent que restreindre davantage :
 * elles sont jointes par ET, jamais par OU.
 */
export function filtreComplet(perimetre: FiltreDIndex, facettes: readonly string[]): FiltreDIndex {
	if (!perimetre.interroger) return perimetre;
	if (facettes.length === 0) return perimetre;
	return {
		interroger: true,
		filtre: [`(${perimetre.filtre})`, ...facettes.map((c) => `(${c})`)].join(' AND ')
	};
}
