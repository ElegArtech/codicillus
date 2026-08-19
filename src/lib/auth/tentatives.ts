/**
 * LE RALENTISSEMENT DES TENTATIVES — RG-M16-01, RG-NF-07.
 *
 * `cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md:1279` : « Un nombre excessif de
 * tentatives DEPUIS UNE MÊME ORIGINE est ralenti puis bloqué temporairement,
 * avec un message explicite indiquant la durée d'attente. »
 * `:1564` (RG-NF-07) : « Les tentatives de connexion répétées sont ralenties. »
 * `cadrage/STACK-TECHNIQUE.md:323` : « Ralentissement progressif puis blocage
 * temporaire, COMPTEUR EN BASE. »
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LES SOURCES DONNENT, ET CE QU'ELLES NE DONNENT PAS
 *
 * DONNÉ, et opposable : la FORME (ralenti PUIS bloqué), la CLÉ (une même
 * origine), le SUPPORT (un compteur en base), l'OBLIGATION de transmettre la
 * durée d'attente, et UNE VALEUR — les 90 secondes de `verrouiller(90)`
 * (`mockups/V-05-connexion.html:777`), seul nombre que le gel porte sur ce
 * sujet.
 *
 * NON DONNÉ : le nombre de tentatives tolérées et la progression des délais.
 * Vérifié, et non supposé — aucune des 41 maquettes ni aucun des quatre
 * livrables de cadrage ne porte de barème : la recherche de « tentative » dans
 * `mockups/` ne rend, hors V-05, que deux occurrences étrangères au sujet
 * (hameçonnage dans V-03, reprise réseau dans V-39), et V-05 lui-même n'énonce
 * que `verrouiller(90)`.
 *
 * LE BARÈME CI-DESSOUS EST DONC UNE DÉCISION DE LOT, prise parce que le contrat
 * de `T-012` §3.4 la demande explicitement — « ce lot livre la décision serveur
 * : combien de tentatives, quel ralentissement, quelle durée de blocage » —, et
 * elle est déclarée comme telle au rapport. Elle est ANCRÉE partout où une
 * ancre existait :
 *
 *   · le blocage vaut 90 s, la valeur du gel, et non une valeur progressive :
 *     ce que la maquette montre reste alors vrai du produit ;
 *   · la progression est un doublement, forme la plus économique à décrire et
 *     à vérifier, et elle satisfait « ralenti PUIS bloqué » — il existe des
 *     tentatives ralenties AVANT tout blocage, sans quoi la première moitié de
 *     la règle serait inerte ;
 *   · rien n'est configurable : `V-33` — la console de configuration, qui
 *     énumère les sept paramètres de M14.7 — n'en porte aucun. En ajouter un
 *     serait inventer un réglage que le gel ne montre pas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI L'ÉTAT NE PEUT PAS ÊTRE UNE COLONNE
 *
 * Une colonne « bloqué jusqu'à » sur l'origine serait une seconde définition de
 * l'état de blocage, à côté des lignes qui la fondent — exactement ce que
 * `002_socle.montee.sql:313` refuse pour la fraîcheur et `T-011` pour le droit
 * effectif. L'état est donc CALCULÉ, ici, par `etatDesTentatives()`, à partir
 * des lignes ; et il l'est sans base, donc éprouvable sans base.
 *
 * LA REMISE À ZÉRO EST DANS LE GEL, et c'est ce qui empêche un blocage à vie :
 * `verrouiller()` réactive le formulaire au terme du décompte
 * (`V-05:729-735` — `champs.disabled = false`, retour au bandeau d'arrivée,
 * focus sur l'identifiant). Le compteur repart donc de zéro dès qu'un blocage
 * est échu, comme il repart de zéro après un succès.
 */

/** Une ligne de `tentatives_de_connexion`, réduite à ce qui décide. */
export interface LigneDeTentative {
	readonly reussie: boolean;
	readonly le: Date;
	/** Non nul sur la seule tentative qui a déclenché un blocage. */
	readonly blocageJusquA: Date | null;
}

/**
 * LE BARÈME — décision de lot, ancrée sur `V-05:777` pour le blocage.
 *
 * `attentesEnSecondes[n]` est le délai imposé à la tentative qui suit `n`
 * échecs déjà comptés. Au-delà de la table, la tentative est BLOQUÉE : la
 * longueur de la table est donc, à elle seule, le nombre de tentatives
 * tolérées.
 */
export const BAREME = {
	/** 6 tentatives tolérées : deux sans délai, puis 1 s, 2 s, 4 s, 8 s. */
	attentesEnSecondes: [0, 0, 1, 2, 4, 8],
	/** `mockups/V-05-connexion.html:777` — `verrouiller(90)`. */
	blocageEnSecondes: 90
} as const;

/** Ce que le barème impose à la tentative qui arrive. */
export type EtatDesTentatives =
	| {
			readonly bloquee: true;
			/** Ce que `RG-M16-01` exige de transmettre : la durée d'attente. */
			readonly secondesRestantes: number;
	  }
	| {
			readonly bloquee: false;
			/** Échecs déjà comptés depuis la dernière remise à zéro. */
			readonly echecs: number;
			/** Le ralentissement à appliquer AVANT toute évaluation. */
			readonly attenteSecondes: number;
			/** Vrai quand cette tentative-ci ouvre le blocage temporaire. */
			readonly ouvreLeBlocage: boolean;
	  };

/**
 * L'état du barème pour une origine, à un instant donné.
 *
 * @param lignes les tentatives de cette origine, dans un ordre quelconque
 * @param maintenant l'instant de la tentative qui arrive
 */
export function etatDesTentatives(
	lignes: readonly LigneDeTentative[],
	maintenant: Date
): EtatDesTentatives {
	/* Le blocage le plus récent, échu ou non. */
	let dernierBlocage: Date | null = null;
	for (const l of lignes) {
		if (l.blocageJusquA === null) continue;
		if (dernierBlocage === null || l.blocageJusquA > dernierBlocage)
			dernierBlocage = l.blocageJusquA;
	}

	if (dernierBlocage !== null && dernierBlocage > maintenant) {
		const restantes = Math.ceil((dernierBlocage.getTime() - maintenant.getTime()) / 1000);
		return { bloquee: true, secondesRestantes: restantes };
	}

	/* La remise à zéro : le plus récent d'un succès et d'un blocage échu. */
	let remiseAZero: Date | null = dernierBlocage;
	for (const l of lignes) {
		if (!l.reussie) continue;
		if (remiseAZero === null || l.le > remiseAZero) remiseAZero = l.le;
	}

	let echecs = 0;
	for (const l of lignes) {
		if (l.reussie) continue;
		if (remiseAZero !== null && l.le <= remiseAZero) continue;
		echecs += 1;
	}

	const attente = BAREME.attentesEnSecondes[echecs];
	if (attente === undefined) {
		return { bloquee: false, echecs, attenteSecondes: 0, ouvreLeBlocage: true };
	}
	return { bloquee: false, echecs, attenteSecondes: attente, ouvreLeBlocage: false };
}

/**
 * L'instant où un blocage ouvert maintenant s'achèvera.
 *
 * Écrit en base sur la tentative qui l'ouvre : c'est cette date qui refuse les
 * tentatives suivantes ET qui remet le compteur à zéro une fois échue.
 */
export function finDuBlocage(maintenant: Date): Date {
	return new Date(maintenant.getTime() + BAREME.blocageEnSecondes * 1000);
}

/**
 * La temporisation elle-même. Isolée pour deux raisons : les unitaires ne
 * dorment pas, et une temporisation qu'on ne peut pas remplacer est une
 * temporisation qu'on ne peut pas mesurer.
 */
export async function attendre(secondes: number): Promise<void> {
	if (secondes <= 0) return;
	await new Promise<void>((tenir) => setTimeout(tenir, secondes * 1000));
}
