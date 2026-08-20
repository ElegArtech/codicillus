/**
 * LE PÉRIMÈTRE, MIS DANS LA REQUÊTE — le cœur d'`ADR-006`.
 *
 * `STACK-TECHNIQUE.md` §4.2, recopiée : « la requête envoyée au moteur NE PEUT
 * PAS rapporter un document interdit ». `RG-ACC-01` : « le filtrage est appliqué
 * au plus près de la donnée, pas seulement dans l'affichage ».
 *
 * `ADR-006` interdit nommément trois choses que ce module rend inatteignables :
 *
 *   · « toute route qui reçoit une liste puis la filtre » — le filtre est
 *     construit AVANT la requête, et `chercherLesNotes()` de `moteur.ts` est le
 *     seul appelant du moteur ;
 *   · « toute requête à l'index sans filtre de périmètre, y compris pour
 *     compter, suggérer, autocompléter ou précharger » — le type de retour est
 *     une SOMME : ou bien on n'interroge pas, ou bien on interroge AVEC un
 *     filtre. Il n'existe pas de troisième forme, donc pas de chemin où la
 *     chaîne de filtre soit absente ou vide ;
 *   · « tout chemin dérogatoire en anonyme » — le régime anonyme sort en
 *     premier, sans consulter le moindre droit.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI
 *
 * `src/lib/droits/resolution.ts` est l'implémentation unique, et ce module ne
 * fait que TRADUIRE ce qu'elle rend. Il ne remonte aucune arborescence, ne
 * compare aucun rôle, n'énumère aucun statut de son propre chef : il reçoit une
 * `Identite` et un `Perimetre`, et les écrit dans la langue du moteur. Une
 * seconde résolution des droits, fût-elle écrite en chaîne de caractères, serait
 * exactement la faute que `resolution.ts` s'interdit dans son en-tête : « deux
 * résolutions concurrentes, et la sécurité du produit devient une question
 * d'opinion ».
 */
import type { Identite, Perimetre } from '../droits/resolution';

/**
 * CE QUE LE MOTEUR RECEVRA — ou bien rien du tout.
 *
 * La forme est une somme, et c'est elle qui porte la garantie : un appelant ne
 * peut pas obtenir une requête sans filtre, parce qu'aucune valeur de ce type
 * n'en décrit une. Le cas `interroger: false` n'est pas un échec : c'est le
 * périmètre VIDE, où la bonne requête est l'absence de requête — le moteur n'a
 * même pas à être sollicité pour rendre zéro.
 */
export type FiltreDIndex =
	| { readonly interroger: false; readonly motif: string }
	| { readonly interroger: true; readonly filtre: string };

/**
 * Une valeur, écrite dans la langue de filtre du moteur.
 *
 * Les valeurs y sont des chaînes entre guillemets doubles ; la contre-oblique et
 * le guillemet s'y échappent par une contre-oblique. Rien n'est concaténé sans
 * passer par ici — c'est la même discipline que `P-13` pour les adresses de
 * connexion : ce qui n'est jamais composé à la main n'a jamais à être échappé
 * deux fois.
 */
export function valeurDeFiltre(valeur: string): string {
	return `"${valeur.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Une clause « ce champ vaut l'une de ces valeurs » — le OU d'une facette. */
export function clauseDAppartenance(champ: string, valeurs: readonly string[]): string {
	return `${champ} IN [${valeurs.map(valeurDeFiltre).join(', ')}]`;
}

/**
 * LE FILTRE DU RÉGIME ANONYME — la phrase d'`ADR-006`, traduite mot pour mot.
 *
 * « En anonyme, le filtre est réduit à `visibilite = publique AND statut =
 * publiee`, SANS EXCEPTION NI CHEMIN DÉROGATOIRE. »
 *
 * POURQUOI LE DOSSIER N'Y FIGURE PAS, ET POURQUOI CE N'EST PAS UN OUBLI.
 * `noteLisible()` compose deux filtres pour l'anonyme : le dossier porteur doit
 * être dans `perimetreAnonyme()`, et la note doit être publique ET publiée. Or
 * `perimetreAnonyme()` est CONSTRUIT à partir des notes publiques et publiées :
 * le dossier porteur d'une telle note y est toujours, par construction. La
 * seconde condition implique donc la première, et la réduction d'`ADR-006` est
 * exacte, pas approchée.
 *
 * Ce n'est pas une déduction laissée à la relecture : `perimetre.test.ts`
 * l'éprouve sur des corpus SYNTHÉTIQUES, en comparant les deux ensembles rendus
 * par `resolution.ts` elle-même (`P-26` — un contrôle doit avoir un cas
 * indépendant de l'état du dépôt).
 *
 * ET L'ÉPREUVE A TROUVÉ LA LIMITE DE LA RÉDUCTION, qu'il faut donc écrire. Elle
 * est exacte SOUS UNE INVARIANTE : toute note indexée porte une chaîne
 * d'ancêtres non vide. Une note dont le dossier ne serait pas dans
 * l'arborescence ferait diverger les deux lectures — `resolution.ts` fermerait
 * (chaîne vide, donc dossier hors périmètre), le filtre réduit ouvrirait
 * (publique et publiée, il ne regarde rien d'autre). Cette invariante est tenue
 * par DEUX gardes indépendantes : la clé étrangère composée de `notes` vers
 * `dossiers`, et le refus explicite de `projeterLeCorpus()` — qui LÈVE plutôt
 * que d'écrire une entrée sans périmètre, au nom de la dernière interdiction
 * d'`ADR-006`. Le cas est mesuré par un unitaire nommé, pas laissé à la
 * confiance.
 *
 * ET LA RÉDUCTION VA DANS LE SENS FERMANT. L'inverse — filtrer sur le dossier
 * SANS filtrer la note — publierait le corpus interne : un dossier du périmètre
 * anonyme contient presque toujours des notes internes. C'est le piège que
 * `resolution.ts` nomme en toutes lettres.
 */
export const FILTRE_ANONYME = `visibilite = ${valeurDeFiltre('publique')} AND statut = ${valeurDeFiltre('publiee')}`;

/**
 * LE FILTRE TOTAL — celui de l'administrateur, `RG-DRO-03` : « l'administrateur
 * contourne tous les droits de dossier ».
 *
 * IL RESTE UN FILTRE, et cela n'est pas une coquetterie. `ADR-006` interdit
 * « toute requête à l'index sans filtre de périmètre » : l'administrateur n'est
 * pas une exception à cette phrase, son périmètre est simplement total. La
 * clause retenue exige que l'entrée PORTE un dossier — donc un périmètre. Une
 * entrée écrite sans périmètre, que la dernière interdiction d'`ADR-006` nomme
 * « un document public », ne sortirait même pas pour l'administrateur : elle
 * serait invisible partout, ce qui est le bon sens de la fermeture par défaut.
 */
export const FILTRE_TOTAL = 'dossier EXISTS';

/**
 * LE FILTRE DE PÉRIMÈTRE — traduction de ce que `resolution.ts` a décidé.
 *
 * Les trois régimes, dans l'ordre où `perimetreDeLecture()` les tranche :
 *
 *   `RG-DRO-04` — l'anonyme a un périmètre, pas des droits. Il sort EN PREMIER,
 *     et son filtre ne mentionne aucun dossier : il ne peut donc pas hériter
 *     d'un droit par une branche oubliée.
 *   `RG-DRO-03` — l'administrateur : périmètre total, filtre total.
 *   `RG-DRO-01`, `02`, `05` — les autres : l'ensemble des dossiers dont la
 *     résolution rend un droit qui porte la lecture. C'est le DOSSIER PORTEUR de
 *     la note qui est interrogé, jamais un ancêtre.
 *
 * POURQUOI LE DOSSIER PORTEUR ET NON LA CHAÎNE D'ANCÊTRES. Les deux ne sont pas
 * équivalents, et croire qu'ils le sont ouvre une porte : une clause posée sur
 * la chaîne rapporterait toute note dont UN ancêtre est lisible. Sous le régime
 * authentifié, l'ensemble des dossiers lisibles est clos vers le bas — un droit
 * posé sur un dossier vaut pour tout son sous-arbre (`RG-DRO-05`) — et les deux
 * clauses coïncident ; sous le régime ANONYME, l'ensemble est clos vers le HAUT
 * — les ancêtres d'un dossier public sont visibles pour qu'on puisse y
 * descendre —, et la clause sur la chaîne y publierait les notes internes des
 * sous-dossiers. Le dossier porteur est la seule lecture qui vaille dans les
 * deux sens, et c'est celle de `noteLisible()`.
 *
 * `ancetres` reste indexé, parce qu'`ADR-006` l'exige et parce qu'une entrée qui
 * ne porte pas son chemin est une entrée sans périmètre. Ce qu'il sert, c'est la
 * réindexation d'un sous-arbre déplacé — « le déplacement d'un dossier impose
 * une réindexation des documents concernés : le chemin d'ancêtres projeté doit
 * suivre ».
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
 * LES FACETTES HONORÉES, TRADUITES EN CLAUSES.
 *
 * `docs/routes.md` §4.2, sémantique de combinaison lue dans la fabrique de la
 * maquette V-08 : « à l'intérieur d'une facette les valeurs sont en OU
 * (paramètre répété), entre facettes en ET ».
 *
 * CE MODULE NE DÉCIDE PAS DE CE QUI EST HONORÉ. Il reçoit les paramètres que le
 * crible de `src/lib/donnees/public.ts` a laissé passer — en anonyme, `q`,
 * `domaine` et `type`, et rien d'autre. Un paramètre hors liste n'arrive pas
 * jusqu'ici : il n'a donc aucun moyen de peser sur le filtre, ni d'être refusé.
 * `RG-M02-04` : « un refus révélerait l'existence du filtre ».
 *
 * La facette « fraîcheur » de §4.2 n'a pas de champ dans l'index (`P-01`, voir
 * `notes-indexees.ts`) : elle n'est pas traduite, et ne l'est pas en silence —
 * la liste ci-dessous est close et son absence s'y lit.
 */
export const FACETTES_TRADUITES: ReadonlyMap<string, string> = new Map([
	['univers', 'univers'],
	['domaine', 'domaine'],
	['type', 'type'],
	['statut', 'statut'],
	['visibilite', 'visibilite'],
	['etiquette', 'etiquettes']
]);

/** Les clauses de facette, dans l'ordre stable de la table ci-dessus. */
export function clausesDeFacette(honores: URLSearchParams): readonly string[] {
	const clauses: string[] = [];
	for (const [parametre, champ] of FACETTES_TRADUITES) {
		const valeurs = honores.getAll(parametre);
		if (valeurs.length > 0) clauses.push(clauseDAppartenance(champ, valeurs));
	}
	return clauses;
}

/**
 * LE FILTRE COMPLET — le périmètre, PUIS les facettes.
 *
 * L'ordre n'est pas indifférent à la lecture : le périmètre vient en premier
 * parce qu'il est la garantie, et les facettes ne peuvent que restreindre
 * davantage. Aucune facette ne peut élargir un périmètre : elles sont jointes
 * par ET, jamais par OU.
 */
export function filtreComplet(perimetre: FiltreDIndex, facettes: readonly string[]): FiltreDIndex {
	if (!perimetre.interroger) return perimetre;
	if (facettes.length === 0) return perimetre;
	return {
		interroger: true,
		filtre: [`(${perimetre.filtre})`, ...facettes.map((c) => `(${c})`)].join(' AND ')
	};
}
