/**
 * LES UNITAIRES DES GESTES D'ADMINISTRATION — les huit règles de M14 que
 * `T-077` a portées, et leurs deux polarités.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CES CAS SONT SYNTHÉTIQUES — `P-26`, ET IL VISE CE LOT EN PLEIN
 *
 * « Un contrôle dont le seul cas d'épreuve est le défaut qu'il trouve devient
 * inerte en réussissant. » Ce lot est celui qui SUPPRIME des univers, des
 * domaines et des types ; un contrôle appuyé sur l'état du dépôt — sur le jeu de
 * semence, sur la base, sur le nombre d'administrateurs du corpus — cesserait
 * d'exercer sa règle à la première exécution du geste. Aucun cas de ce fichier ne
 * lit la base ni `seeds/corpus.ts` : les états sont posés à la main, et ils
 * restent vrais quel que soit l'état du dépôt.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DEUX POLARITÉS, À CHAQUE FOIS — `P-5`
 *
 * « Une règle éprouvée sur un seul mécanisme n'est éprouvée qu'à moitié. »
 * Chaque verdict est donc joué DANS SES DEUX SENS : ce qu'il refuse ET ce qu'il
 * laisse passer. Un refus qui refuserait tout serait vert sur la moitié des cas
 * et faux sur l'autre — et c'est le seul défaut qu'une épreuve à sens unique ne
 * peut pas voir.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CES CAS NE PROUVENT PAS
 *
 * Ils prouvent les VERDICTS et l'ORDRE DES ÉCRITURES. Ils ne prouvent pas que
 * PostgreSQL annule bien une transaction — cela, seule une base l'établit, et le
 * rapport du lot en porte le relevé mesuré. Ce que la double feinte ci-dessous
 * établit est plus étroit et plus utile ici : que les deux suppressions sont bien
 * DANS la même transaction, et que l'entretien de l'index ne s'exécute JAMAIS
 * quand elle échoue.
 */
import { describe, expect, it, vi } from 'vitest';
import { getTableName } from 'drizzle-orm';
import type { Meilisearch } from 'meilisearch';
import type { Base } from '../base/acces';
import { CLES_DE_PARAMETRE } from '../base/schema';
import type { RoleDeCompte } from '../droits/resolution';
import {
	AVERTISSEMENT_DEFINITIF,
	CHAMPS_DE_CONFIGURATION,
	estLeDernierAdministrateur,
	MESSAGE_ADRESSE_INVALIDE,
	MESSAGE_LIBELLE_VIDE,
	MESSAGE_SEUIL_MINIMAL,
	messageSeuilNonCroissant,
	nomConfirme,
	roleDepuisLeLibelle,
	SORTIE_DELESTER_LES_NOTES,
	SORTIE_RATTACHER_LES_DOMAINES,
	supprimerUnDomaine,
	valeursDeConfigurationSaisies,
	validerLaConfiguration,
	verdictDeSuppressionDUnDomaine,
	verdictDeSuppressionDUnTypeDeFiche,
	verdictDeSuppressionDUnUnivers,
	verdictDuChangementDeRole
} from './administration';
import { ROLE_DEPUIS_ENUM } from './lecture';
import type { Configuration } from '../../../seeds/corpus';

/* ═══════════════════════════════════ `RG-M14-01` ════════════════════════ */

describe('RG-M14-01 — un univers qui contient des domaines ne se supprime pas', () => {
	it('REFUSE l’univers peuplé, et rend le décompte de ce qui le retient', () => {
		const verdict = verdictDeSuppressionDUnUnivers({
			systeme: false,
			decompte: { domaines: 3, notes: 27 }
		});
		expect(verdict.issue).toBe('univers-non-vide');
		if (verdict.issue !== 'univers-non-vide') return;
		expect(verdict.decompte).toEqual({ domaines: 3, notes: 27 });
	});

	it('PROPOSE de rattacher les domaines ailleurs — la seconde moitié de la règle', () => {
		const verdict = verdictDeSuppressionDUnUnivers({
			systeme: false,
			decompte: { domaines: 1, notes: 0 }
		});
		if (verdict.issue !== 'univers-non-vide') throw new Error('refus attendu');
		/* Le refus SEUL ne tient pas la règle : « le produit propose de rattacher
		   ses domaines ailleurs ». La sortie est donc éprouvée à part. */
		expect(verdict.sortie).toBe(SORTIE_RATTACHER_LES_DOMAINES);
		expect(verdict.sortie).toContain('Rattachez');
	});

	it('LAISSE PASSER l’univers vide — la polarité inverse, et elle compte autant', () => {
		const verdict = verdictDeSuppressionDUnUnivers({
			systeme: false,
			decompte: { domaines: 0, notes: 0 }
		});
		expect(verdict).toEqual({ issue: 'possible' });
	});

	it('refuse l’univers SYSTÈME avant tout décompte — RG-STR-01, et le gel l’ordonne ainsi', () => {
		/* `V-27:3532` teste `u.systeme` AVANT `doms.length` (`:3546`) : un univers système
		   vide se voit refuser pour ce motif-là, pas pour un décompte nul. */
		const verdict = verdictDeSuppressionDUnUnivers({
			systeme: true,
			decompte: { domaines: 0, notes: 0 }
		});
		expect(verdict.issue).toBe('univers-systeme');
	});
});

/* ═══════════════════════════════════ `RG-M14-02` ════════════════════════ */

const DECOMPTE_PEUPLE = {
	notes: 14,
	fichesTypees: 4,
	signets: 2,
	dossiers: 9,
	comptesRattaches: 3
} as const;

describe('RG-M14-02 — le décompte exact, et la saisie du nom exact', () => {
	it('EXIGE le nom, au caractère près : la casse ne se pardonne pas', () => {
		/* `V-28:3239-3240`, mot pour mot : « Correspondance exacte, SANS TOLÉRANCE
		   DE CASSE : le geste doit être délibéré ». */
		expect(nomConfirme('Infrastructure', 'Infrastructure')).toBe(true);
		expect(nomConfirme('Infrastructure', 'infrastructure')).toBe(false);
		expect(nomConfirme('Infrastructure', 'INFRASTRUCTURE')).toBe(false);
	});

	it('n’accepte NI un blanc de bord, NI une valeur absente, NI un non-texte', () => {
		expect(nomConfirme('Infrastructure', ' Infrastructure')).toBe(false);
		expect(nomConfirme('Infrastructure', 'Infrastructure ')).toBe(false);
		expect(nomConfirme('Infrastructure', null)).toBe(false);
		expect(nomConfirme('Infrastructure', undefined)).toBe(false);
		expect(nomConfirme('Infrastructure', 42)).toBe(false);
	});

	it('REFUSE tant que la saisie diverge, et rend quand même le décompte', () => {
		const verdict = verdictDeSuppressionDUnDomaine(
			{ nom: 'Infrastructure', decompte: DECOMPTE_PEUPLE },
			'Infrastructur'
		);
		expect(verdict.issue).toBe('nom-non-confirme');
		/* `V-28:3222-3223` : « le décompte reste affiché même à zéro ». Le rendre
		   dans les deux issues évite qu'un appelant en écrive une seconde
		   définition pour l'afficher. */
		expect(verdict.decompte).toEqual(DECOMPTE_PEUPLE);
	});

	it('porte l’avertissement de RG-M14-03 là où il se lit — dans le dialogue', () => {
		const verdict = verdictDeSuppressionDUnDomaine(
			{ nom: 'Infrastructure', decompte: DECOMPTE_PEUPLE },
			''
		);
		if (verdict.issue !== 'nom-non-confirme') throw new Error('refus attendu');
		expect(verdict.avertissement).toBe(AVERTISSEMENT_DEFINITIF);
		expect(verdict.avertissement).toContain('pas de corbeille');
	});

	it('LAISSE PASSER quand le nom correspond — y compris sur un domaine vide', () => {
		const vide = { notes: 0, fichesTypees: 0, signets: 0, dossiers: 0, comptesRattaches: 0 };
		const verdict = verdictDeSuppressionDUnDomaine(
			{ nom: 'Bac à sable', decompte: vide },
			'Bac à sable'
		);
		expect(verdict.issue).toBe('possible');
		expect(verdict.decompte).toEqual(vide);
	});
});

/* ═══════════════════════════════════ `RG-M14-03` ════════════════════════ */

/**
 * UNE BASE FEINTE, TRANSACTIONNELLE, ET QUI SAIT ÉCHOUER EN COURS.
 *
 * Elle journalise les suppressions et les rend au test. `echouerA` fait lever la
 * n-ième : c'est la POLARITÉ INVERSE que le contrat de `T-077` demande — « une
 * suppression qui échoue EN COURS, pas seulement une qui réussit ».
 *
 * Elle n'imite pas PostgreSQL et ne prétend pas le faire : ce qu'elle établit,
 * c'est que les deux suppressions sont émises DANS le corps de la transaction et
 * dans l'ordre que la clé étrangère impose, et que rien ne se passe après elle
 * quand elle lève.
 */
function baseFeinte(options: { readonly echouerA?: number } = {}) {
	const journal: string[] = [];
	let dansLaTransaction = false;
	let transactions = 0;

	const supprimer = (table: Parameters<typeof getTableName>[0]) => {
		const nom = getTableName(table);
		return {
			where: async () => {
				journal.push(`${dansLaTransaction ? 'tx' : 'hors-tx'}:delete ${nom}`);
				if (options.echouerA === journal.length) {
					throw new Error(`échec simulé sur la suppression n° ${journal.length}`);
				}
				return [];
			}
		};
	};

	const base = {
		/* Les trois lectures de `mesurerUnDomaine()`, dans l'ordre : le domaine,
		   ses notes, ses dossiers, ses comptes rattachés. */
		select: () => base,
		from: () => base,
		innerJoin: () => base,
		where: () => base,
		limit: () => base,
		then: (suite: (valeur: unknown) => void) => {
			suite(files[rang++] ?? []);
		},
		delete: supprimer,
		async transaction(corps: (tx: unknown) => Promise<void>) {
			transactions += 1;
			dansLaTransaction = true;
			try {
				await corps(base);
			} finally {
				dansLaTransaction = false;
			}
		}
	};

	let rang = 0;
	const files: unknown[][] = [
		[{ id: 'd-1', nom: 'Infrastructure' }],
		[
			{ identifiant: 'note-a', typeDeNote: 'Procédure' },
			{ identifiant: 'note-b', typeDeNote: 'Fiche' }
		],
		[{ dossiers: 5 }],
		[{ comptesRattaches: 2 }]
	];

	return { base: base as unknown as Base, journal, transactions: () => transactions };
}

/**
 * LE MOTEUR N'EST PAS FEINT, IL EST ABSENT — et c'est ce que le contrôle veut.
 *
 * L'entretien de l'index est REMPLACÉ ci-dessous : ce qui s'éprouve ici n'est pas
 * ce que le moteur fait de la demande — `entretien.test.ts` s'en charge —, c'est
 * QUE la demande est faite, avec quels identifiants, et SURTOUT qu'elle ne l'est
 * pas quand la transaction a échoué.
 */
const MOTEUR = {} as unknown as Meilisearch;

/** Ce que l'entretien de l'index a reçu, appel par appel. */
const entretiens = vi.hoisted(() => [] as string[][]);

vi.mock('../recherche/entretien', () => ({
	entretenirLIndex: async (_base: unknown, _client: unknown, identifiants: readonly string[]) => {
		entretiens.push([...identifiants]);
		return { indexees: 0, retirees: identifiants.length };
	}
}));

describe('RG-M14-03 — la suppression est atomique : soit tout, soit rien', () => {
	it('émet les DEUX suppressions dans la MÊME transaction, notes d’abord', async () => {
		entretiens.length = 0;
		const feinte = baseFeinte();

		const resultat = await supprimerUnDomaine(feinte.base, MOTEUR, {
			univers: 'production',
			domaine: 'infrastructure',
			saisie: 'Infrastructure'
		});

		expect(resultat.issue).toBe('possible');
		expect(feinte.transactions()).toBe(1);
		/* L'ORDRE N'EST PAS UNE PRÉFÉRENCE : `notes.domaine_id` est en
		   `ON DELETE RESTRICT` (`002_socle.montee.sql:336`), et le domaine
		   supprimé en premier ferait échouer la transaction entière. */
		expect(feinte.journal).toEqual(['tx:delete notes', 'tx:delete domaines']);
	});

	it('ANNULE tout quand la seconde échoue — et n’entretient PAS l’index', async () => {
		entretiens.length = 0;
		/* L'échec porte sur la DEUXIÈME suppression : la première a déjà eu lieu,
		   et c'est exactement le cas que « soit tout, soit rien » vise. */
		const feinte = baseFeinte({ echouerA: 2 });

		await expect(
			supprimerUnDomaine(feinte.base, MOTEUR, {
				univers: 'production',
				domaine: 'infrastructure',
				saisie: 'Infrastructure'
			})
		).rejects.toThrow('échec simulé');

		/* CE QUI SUIT EST LE CŒUR DE LA POLARITÉ INVERSE. Un index entretenu
		   après une transaction annulée retirerait de la recherche des notes qui
		   sont toujours en base : la recherche rendrait MOINS que le corpus, et
		   rien ne le dirait. */
		expect(entretiens).toEqual([]);
	});

	it('n’écrit RIEN quand le nom n’est pas confirmé — pas même la transaction', async () => {
		entretiens.length = 0;
		const feinte = baseFeinte();

		const resultat = await supprimerUnDomaine(feinte.base, MOTEUR, {
			univers: 'production',
			domaine: 'infrastructure',
			saisie: 'infrastructure'
		});

		expect(resultat.issue).toBe('nom-non-confirme');
		expect(feinte.transactions()).toBe(0);
		expect(feinte.journal).toEqual([]);
		expect(entretiens).toEqual([]);
	});
});

/* ═══════════════════════════════════ `RG-M14-05` ════════════════════════ */

describe('RG-M14-05 — le contenu détruit disparaît immédiatement de la recherche', () => {
	it('demande à l’entretien d’oublier EXACTEMENT les notes du domaine', async () => {
		entretiens.length = 0;
		const feinte = baseFeinte();

		await supprimerUnDomaine(feinte.base, MOTEUR, {
			univers: 'production',
			domaine: 'infrastructure',
			saisie: 'Infrastructure'
		});

		/* `ARB-060` et `T-075` : il n'y a QU'UNE implémentation de l'entretien de
		   l'index, et ce geste l'appelle. Les identifiants sont ceux lus AVANT la
		   suppression — après, plus rien ne les nomme. */
		expect(entretiens).toEqual([['note-a', 'note-b']]);
	});
});

/* ═══════════════════════════════════ `RG-M14-06` ════════════════════════ */

describe('RG-M14-06 — supprimer un type de fiche utilisé est refusé', () => {
	it('REFUSE dès une seule note, et dit combien en portent', () => {
		const verdict = verdictDeSuppressionDUnTypeDeFiche({ notes: 1, proprietes: 6 });
		expect(verdict.issue).toBe('type-utilise');
		expect(verdict.decompte).toEqual({ notes: 1, proprietes: 6 });
	});

	it('PROPOSE le délestage — la troisième obligation de la règle', () => {
		const verdict = verdictDeSuppressionDUnTypeDeFiche({ notes: 12, proprietes: 4 });
		if (verdict.issue !== 'type-utilise') throw new Error('refus attendu');
		expect(verdict.sortie).toBe(SORTIE_DELESTER_LES_NOTES);
		expect(verdict.sortie).toContain('Délestez');
	});

	it('LAISSE PASSER le type inemployé, et rend quand même ses propriétés', () => {
		const verdict = verdictDeSuppressionDUnTypeDeFiche({ notes: 0, proprietes: 5 });
		expect(verdict.issue).toBe('possible');
		/* Le gel les annonce : « sa suppression retire le schéma et ses N
		   propriétés, sans affecter aucun contenu » (`V-29:3475-3476`). */
		expect(verdict.decompte.proprietes).toBe(5);
	});
});

/* ═══════════════════════════════════ `RG-M14-07` ════════════════════════ */

const SEUL_ADMIN = {
	nom: 'Sophie Nguyen',
	role: 'administrateur',
	actif: true,
	administrateursActifs: 1
} as const;

describe('RG-M14-07 — le dernier administrateur ne perd pas son rôle', () => {
	it('reconnaît le dernier administrateur ACTIF, et lui seul', () => {
		expect(estLeDernierAdministrateur(SEUL_ADMIN)).toBe(true);
		expect(estLeDernierAdministrateur({ ...SEUL_ADMIN, administrateursActifs: 2 })).toBe(false);
		expect(estLeDernierAdministrateur({ ...SEUL_ADMIN, role: 'referent' })).toBe(false);
		/* Un compte désactivé ne tient pas la console ouverte pour l'instance —
		   `RG-M14-08` lui a déjà retiré l'accès. */
		expect(estLeDernierAdministrateur({ ...SEUL_ADMIN, actif: false })).toBe(false);
	});

	it('REFUSE le retrait, et le motif nomme le compte', () => {
		const verdict = verdictDuChangementDeRole(SEUL_ADMIN, 'referent');
		expect(verdict.issue).toBe('dernier-administrateur');
		if (verdict.issue !== 'dernier-administrateur') return;
		expect(verdict.motif).toContain('Sophie Nguyen');
		expect(verdict.motif).toContain('seul administrateur actif');
	});

	it('LAISSE PASSER le retrait quand un second administrateur existe', () => {
		const verdict = verdictDuChangementDeRole(
			{ ...SEUL_ADMIN, administrateursActifs: 2 },
			'contributeur'
		);
		expect(verdict).toEqual({ issue: 'possible', role: 'contributeur' });
	});

	it('LAISSE PASSER ce qui ne RETIRE rien — la règle protège l’existence, pas le formulaire', () => {
		/* Reposer le rôle d'administrateur sur le dernier administrateur ne
		   retire rien. Le refuser ferait d'un enregistrement sans effet une
		   erreur, ce que la règle ne demande nulle part. */
		const verdict = verdictDuChangementDeRole(SEUL_ADMIN, 'administrateur');
		expect(verdict.issue).toBe('possible');
	});

	it('les quatre libellés du gel font l’aller-retour, et rien d’autre ne passe', () => {
		for (const enumere of Object.keys(ROLE_DEPUIS_ENUM)) {
			const libelle = ROLE_DEPUIS_ENUM[enumere];
			expect(roleDepuisLeLibelle(libelle)).toBe(enumere as RoleDeCompte);
		}
		expect(roleDepuisLeLibelle('administrateur')).toBe(null);
		expect(roleDepuisLeLibelle('Super-administrateur')).toBe(null);
		expect(roleDepuisLeLibelle(null)).toBe(null);
	});
});

/* ═══════════════════════════════ `RG-M14-09` et `RG-M14-10` ════════════ */

/**
 * UN JEU DE VALEURS QUI N'EST PAS CELUI DU GEL, ET C'EST UNE EXIGENCE.
 *
 * `verif:fraicheur` A3 refuse toute duplication littérale des seuils hors de
 * l'implémentation unique — `src/lib/fraicheur.test.ts` est le seul fichier du
 * dépôt qui ait le droit d'écrire les deux nombres en vigueur, parce que les
 * épingler EST son objet. Ce qui s'éprouve ici n'est pas la valeur des seuils,
 * c'est la RELATION entre les deux : le second doit dépasser le premier. Deux
 * nombres quelconques la portent aussi bien, et ne fabriquent pas une seconde
 * définition de ce que « frais » veut dire (`P-01`, `ADR-005`).
 */
const CONFIGURATION_VALABLE: Configuration = {
	seuilFrais: 45,
	seuilVieillissant: 120,
	versionsMax: 50,
	portailAssistance: 'https://assistance.exemple.fr',
	motFiche: 'Fiche',
	tailleMaxPieceJointe: 25,
	dureeSession: 120
};

describe('RG-M14-10 — la validation refuse les combinaisons incohérentes', () => {
	it('LAISSE PASSER une progression valable — le second dépasse le premier', () => {
		const verdict = validerLaConfiguration(CONFIGURATION_VALABLE);
		expect(verdict.issue).toBe('possible');
	});

	it('refuse le second seuil INFÉRIEUR OU ÉGAL au premier — le cas nommé par le cahier', () => {
		for (const vieillissant of [45, 20]) {
			const verdict = validerLaConfiguration({
				...CONFIGURATION_VALABLE,
				seuilVieillissant: vieillissant
			});
			expect(verdict.issue).toBe('valeurs-refusees');
			if (verdict.issue !== 'valeurs-refusees') continue;
			expect(verdict.erreurs).toEqual([{ champ: 'vieil', message: messageSeuilNonCroissant(45) }]);
		}
	});

	it('le message est EXPLICITE : il dit le seuil en cause et ce qui arriverait', () => {
		const message = messageSeuilNonCroissant(45);
		expect(message).toContain('45 jours');
		expect(message).toContain('aucune note ne serait jamais vieillissante');
	});

	it('refuse un seuil nul, négatif ou non numérique', () => {
		for (const frais of [0, -1, Number.NaN]) {
			const verdict = validerLaConfiguration({ ...CONFIGURATION_VALABLE, seuilFrais: frais });
			expect(verdict.issue).toBe('valeurs-refusees');
			if (verdict.issue !== 'valeurs-refusees') continue;
			expect(verdict.erreurs[0]).toEqual({ champ: 'frais', message: MESSAGE_SEUIL_MINIMAL });
		}
	});

	it('refuse une adresse de portail qui n’est pas une adresse web, et TOLÈRE le vide', () => {
		const mauvaise = validerLaConfiguration({
			...CONFIGURATION_VALABLE,
			portailAssistance: 'assistance.exemple.fr'
		});
		expect(mauvaise.issue).toBe('valeurs-refusees');
		if (mauvaise.issue === 'valeurs-refusees') {
			expect(mauvaise.erreurs).toEqual([{ champ: 'portail', message: MESSAGE_ADRESSE_INVALIDE }]);
		}
		/* `V-33:3017` ne contrôle QUE si le champ est renseigné : l'adresse du
		   portail n'est pas obligatoire, et l'exiger serait ajouter une règle. */
		const vide = validerLaConfiguration({ ...CONFIGURATION_VALABLE, portailAssistance: '' });
		expect(vide.issue).toBe('possible');
	});

	it('refuse un libellé de concept vide — M14.7 le rend affiché partout', () => {
		const verdict = validerLaConfiguration({ ...CONFIGURATION_VALABLE, motFiche: '' });
		expect(verdict.issue).toBe('valeurs-refusees');
		if (verdict.issue !== 'valeurs-refusees') return;
		expect(verdict.erreurs).toEqual([{ champ: 'mot', message: MESSAGE_LIBELLE_VIDE }]);
	});

	it('rend TOUTES les erreurs, jamais la première — un aller-retour par faute serait cruel', () => {
		const verdict = validerLaConfiguration({
			...CONFIGURATION_VALABLE,
			seuilFrais: 0,
			seuilVieillissant: 0,
			portailAssistance: 'nimporte quoi',
			motFiche: ''
		});
		if (verdict.issue !== 'valeurs-refusees') throw new Error('refus attendu');
		expect(verdict.erreurs.map((e) => e.champ)).toEqual(['frais', 'vieil', 'portail', 'mot']);
	});
});

describe('RG-M14-09 — les seuils écrits sont ceux que la lecture relit', () => {
	it('les sept clés d’écriture SONT les sept champs de la configuration', () => {
		/* C'est la garantie structurelle de la règle : une clé écrite hors de
		   cette table serait un seuil enregistré que `lireConfiguration()`
		   n'irait jamais chercher — donc un badge qui ne bouge pas. Le type
		   `Record<keyof Configuration, string>` l'interdit à la compilation ; ce
		   cas le rend visible à l'exécution. */
		expect(Object.keys(CLES_DE_PARAMETRE).sort()).toEqual(
			Object.keys(CONFIGURATION_VALABLE).sort()
		);
		expect(CLES_DE_PARAMETRE.seuilFrais).toBe('seuil_frais');
		expect(CLES_DE_PARAMETRE.seuilVieillissant).toBe('seuil_vieillissant');
	});

	it('les sept noms de champ sont ceux du gel, préfixe compris', () => {
		expect(CHAMPS_DE_CONFIGURATION.seuilFrais).toBe('c-frais');
		expect(CHAMPS_DE_CONFIGURATION.seuilVieillissant).toBe('c-vieil');
		expect(Object.keys(CHAMPS_DE_CONFIGURATION).sort()).toEqual(
			Object.keys(CONFIGURATION_VALABLE).sort()
		);
	});

	it('la saisie est lue comme le gel la lit — nombres convertis, textes ébarbés', () => {
		const porte: Record<string, string> = {
			'c-frais': '30',
			'c-vieil': '60',
			'c-versions': '20',
			'c-portail': '  https://assistance.exemple.fr  ',
			'c-mot': '  Objet  ',
			'c-taille': '10',
			'c-session': '480'
		};
		const valeurs = valeursDeConfigurationSaisies((champ) => porte[champ]);
		expect(valeurs).toEqual({
			seuilFrais: 30,
			seuilVieillissant: 60,
			versionsMax: 20,
			portailAssistance: 'https://assistance.exemple.fr',
			motFiche: 'Objet',
			tailleMaxPieceJointe: 10,
			dureeSession: 480
		});
	});

	it('un champ absent devient une faute VISIBLE, jamais une valeur par défaut', () => {
		/* `Number('')` vaut 0, et `validerLaConfiguration()` le refuse. Ébarber
		   ici ce que la validation doit voir reviendrait à lui cacher la faute —
		   et un seuil « par défaut » posé en silence changerait la fraîcheur de
		   tout le corpus sans que personne ne l'ait demandé. */
		const valeurs = valeursDeConfigurationSaisies(() => undefined);
		expect(valeurs.seuilFrais).toBe(0);
		expect(validerLaConfiguration(valeurs).issue).toBe('valeurs-refusees');
	});
});
