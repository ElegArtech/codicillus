/**
 * Batterie 13 — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE : périmètre d'écriture humain /
 * orchestrateur (`règles/workflow_agentic.md` §4.10). Le contournement le plus
 * économique d'une vérification est de modifier la vérification.
 *
 * CE QU'IL FIGE.
 *
 *   1. LE REFUS DE MESURER SUR LE CORPUS GELÉ. C'est `P-02` à l'envers : un
 *      budget mesuré sur 32 notes et présenté comme tenu sur volumétrie haute
 *      serait la valeur illustrative que le principe proscrit. Le cas d'épreuve
 *      est SYNTHÉTIQUE — il porte les volumes du corpus gelé en dur, donc il
 *      reste exercé quel que soit l'état de la base (`P-26`).
 *   2. LA STATISTIQUE. Médiane et 95ᵉ centile par le plus proche rang : aucune
 *      valeur qui n'ait été observée n'est rendue. Une interpolation ferait
 *      apparaître au rapport un temps que personne n'a mesuré.
 *   3. LES QUATRE VERDICTS, dont « non mesurable », qui n'est PAS un vert. Les
 *      quatre sont éprouvés séparément : un verdict qu'aucun cas n'exerce est un
 *      verdict qu'on espère (`P-5`).
 *   4. LE SEUIL DE `RG-M09-04` SE LIT, IL NE SE DÉCIDE PAS. Y compris le cas où
 *      la courbe ne franchit rien : la fonction doit alors DIRE qu'elle ne donne
 *      pas le seuil, jamais rendre le dernier palier comme s'il était la limite.
 *   5. LE CONTRÔLE DES TÂCHES DU MOTEUR — `ARB-060`, point 2. C'est la
 *      contrepartie du retrait de l'attente au chemin de requête : sans lui,
 *      l'arbitrage ne serait qu'un desserrage. Ses cas sont SYNTHÉTIQUES, sur des
 *      tâches fabriquées et sans moteur — `P-26` : « un contrôle dont le seul cas
 *      d'épreuve est le défaut qu'il trouve devient inerte en réussissant ». Le
 *      jour où plus aucune tâche n'échouera, ces cas resteront exercés.
 */
import { describe, it, expect } from 'vitest';
import {
	ETATS_NON_REUSSIS,
	POSTES,
	VOLUMES_EXIGES,
	centile,
	dispersion,
	manquementsDeVolumetrie,
	mediane,
	seuilDeBascule,
	verdictDesTaches,
	verdictDuPoste
	// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
} from './budgets.mjs';

/* ═══════════════════════════════════════════════════════════════════════════
   1. LES SEPT POSTES — la table est celle du cahier, et elle est complète.
   ═════════════════════════════════════════════════════════════════════════ */

describe('la table des postes', () => {
	it('porte les sept budgets, chacun avec la ligne de source d’où vient son chiffre', () => {
		expect(POSTES).toHaveLength(7);
		for (const poste of POSTES) {
			expect(poste.source).toMatch(/CDC:\d+/);
			expect(typeof poste.libelle).toBe('string');
		}
	});

	it('ne chiffre pas le seul poste que la source ne chiffre pas', () => {
		const palette = POSTES.find((p: { cle: string }) => p.cle === 'palette');
		expect(palette.cible).toBeNull();
		expect(palette.echec).toBeNull();
	});

	it('recopie les cibles du cahier sans les arrondir', () => {
		const par = Object.fromEntries(POSTES.map((p: { cle: string }) => [p.cle, p]));
		expect(par['recherche-premiers'].cible).toBe(500);
		expect(par['recherche-premiers'].echec).toBe(1500);
		expect(par['recherche-facettes'].cible).toBe(1500);
		expect(par.note.cible).toBe(1000);
		expect(par.enregistrement.cible).toBe(1000);
		expect(par.indexation.cible).toBe(10_000);
		expect(par.cartographie.cible).toBe(3000);
		expect(par.cartographie.echec).toBe(8000);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   2. `P-02` À L'ENVERS — le refus de mesurer sur le corpus gelé.
   ═════════════════════════════════════════════════════════════════════════ */

describe('le contrôle de volumétrie', () => {
	/** Ce que la base porte quand SEUL le corpus gelé est semé (mesuré T-055). */
	const CORPUS_GELE = {
		notes: 32,
		comptes: 5,
		univers: 3,
		domaines: 4,
		dossiers: 19,
		profondeurMax: 3,
		relations: 22,
		noeudsDuGraphe: 31
	};

	it('refuse le corpus gelé, et nomme chacun des volumes qui manquent', () => {
		const manques = manquementsDeVolumetrie(CORPUS_GELE);
		expect(manques.length).toBe(Object.keys(VOLUMES_EXIGES).length);
		expect(manques.join(' ')).toContain('notes : 32 en base, 5000 exigés');
		expect(manques.join(' ')).toContain('noeudsDuGraphe : 31 en base, 500 exigés');
	});

	it('accepte la volumétrie haute', () => {
		expect(
			manquementsDeVolumetrie({
				notes: 5000,
				comptes: 200,
				univers: 6,
				domaines: 30,
				dossiers: 445,
				profondeurMax: 10,
				relations: 3022,
				noeudsDuGraphe: 500
			})
		).toEqual([]);
	});

	it('refuse un volume absent aussi fermement qu’un volume insuffisant', () => {
		expect(manquementsDeVolumetrie({ notes: 5000 }).length).toBeGreaterThan(0);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   3. LA STATISTIQUE — aucune valeur rendue qui n'ait été observée.
   ═════════════════════════════════════════════════════════════════════════ */

describe('la statistique', () => {
	it('rend la médiane d’un échantillon impair, et la demi-somme d’un pair', () => {
		expect(mediane([3, 1, 2])).toBe(2);
		expect(mediane([1, 2, 3, 4])).toBe(2.5);
		expect(mediane([])).toBeNull();
	});

	it('rend un centile par le plus proche rang — donc une valeur observée', () => {
		const echantillon = Array.from({ length: 20 }, (_, i) => i + 1);
		expect(centile(echantillon, 95)).toBe(19);
		expect(centile(echantillon, 100)).toBe(20);
		expect(centile([7], 95)).toBe(7);
	});

	it('dit la dispersion en trois nombres, dont l’écart entre séries', () => {
		const d = dispersion([
			[10, 10, 10],
			[20, 20, 20],
			[30, 30, 30]
		]);
		expect(d.mediane).toBe(20);
		expect(d.medianesDeSerie).toEqual([10, 20, 30]);
		expect(d.interSeries).toBe(20);
		expect(d.min).toBe(10);
		expect(d.max).toBe(30);
		expect(d.tirages).toBe(9);
	});

	it('ne cache pas une queue derrière une médiane tenue', () => {
		/* Dix-huit tirages à 100 ms, deux à 2 000 : la médiane ne bouge pas, le
		   95ᵉ centile, lui, la dénonce. C'est la raison d'être de la colonne. */
		const d = dispersion([[...Array.from({ length: 18 }, () => 100), 2000, 2000]]);
		expect(d.mediane).toBe(100);
		expect(d.p95).toBe(2000);
		expect(d.queue).toBe(1900);
	});

	it('ne prétend pas voir une queue plus fine que son échantillon — et c’est pourquoi le max est imprimé', () => {
		/* UN SEUL tirage lent sur vingt est SOUS le 95ᵉ centile par construction :
		   5 % de vingt, c'est un tirage. Le plus proche rang rend alors 100 ms, et
		   c'est exact — ce n'est pas un défaut de la méthode, c'est sa résolution.
		   Le rapport imprime donc TOUJOURS le max à côté du 95ᵉ centile : sans lui,
		   un accident isolé disparaîtrait du compte rendu sans laisser de trace. */
		const d = dispersion([[...Array.from({ length: 19 }, () => 100), 2000]]);
		expect(d.p95).toBe(100);
		expect(d.max).toBe(2000);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   4. LES QUATRE VERDICTS — chacun exercé par son propre cas.
   ═════════════════════════════════════════════════════════════════════════ */

describe('le verdict d’un poste', () => {
	const poste = { cible: 1000, echec: 3000 };

	it('est vert quand la médiane ET le 95ᵉ centile tiennent', () => {
		expect(verdictDuPoste(poste, { mediane: 200, p95: 400 }).etat).toBe('vert');
	});

	it('est vert RÉSERVÉ quand la médiane tient et que la queue dépasse la cible', () => {
		const v = verdictDuPoste(poste, { mediane: 900, p95: 1400 });
		expect(v.etat).toBe('vert réservé');
		expect(v.motif).toContain('95ᵉ centile');
	});

	it('est rouge dès que la médiane atteint la cible', () => {
		expect(verdictDuPoste(poste, { mediane: 1000, p95: 1000 }).etat).toBe('rouge');
	});

	it('est rouge quand la queue atteint le seuil d’échec, même médiane tenue', () => {
		const v = verdictDuPoste(poste, { mediane: 300, p95: 3200 });
		expect(v.etat).toBe('rouge');
		expect(v.motif).toContain('seuil d’échec');
	});

	it('est NON MESURABLE, jamais vert, quand le chemin n’existe pas', () => {
		const v = verdictDuPoste(poste, null, 'la palette n’est montée sur aucun écran');
		expect(v.etat).toBe('non mesurable');
		expect(v.motif).toContain('palette');
	});

	it('est NON MESURABLE quand la source ne donne aucune cible chiffrée', () => {
		expect(verdictDuPoste({ cible: null, echec: null }, { mediane: 5, p95: 9 }).etat).toBe(
			'non mesurable'
		);
	});

	it('est NON MESURABLE sur un échantillon vide — un vide n’est pas un vert', () => {
		expect(verdictDuPoste(poste, { mediane: null, p95: null }).etat).toBe('non mesurable');
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   5. LE SEUIL DE `RG-M09-04` — lu sur la courbe, et jamais inventé.
   ═════════════════════════════════════════════════════════════════════════ */

describe('le seuil de bascule', () => {
	it('rend le dernier palier tenu et le premier rompu', () => {
		const seuil = seuilDeBascule(
			[
				{ noeuds: 500, p95: 200 },
				{ noeuds: 2000, p95: 900 },
				{ noeuds: 8000, p95: 2800 },
				{ noeuds: 16_000, p95: 5200 }
			],
			3000
		);
		expect(seuil.dernierTenu).toBe(8000);
		expect(seuil.premierRompu).toBe(16_000);
		expect(seuil.mesurePartielle).toBe(false);
	});

	it('déclare la mesure PARTIELLE quand rien n’est franchi — il ne conclut pas', () => {
		const seuil = seuilDeBascule(
			[
				{ noeuds: 500, p95: 150 },
				{ noeuds: 2000, p95: 190 }
			],
			3000
		);
		expect(seuil.premierRompu).toBeNull();
		expect(seuil.mesurePartielle).toBe(true);
	});

	it('ignore un palier sans mesure plutôt que de le compter comme tenu', () => {
		const seuil = seuilDeBascule(
			[
				{ noeuds: 500, p95: 150 },
				{ noeuds: 2000, p95: null },
				{ noeuds: 8000, p95: 4000 }
			],
			3000
		);
		expect(seuil.dernierTenu).toBe(500);
		expect(seuil.premierRompu).toBe(8000);
	});
});

/* ═══════════════════════════════════════════════════════════════════════════
   5. LE CONTRÔLE DES TÂCHES DU MOTEUR — ARB-060, point 2.
   ═════════════════════════════════════════════════════════════════════════ */

describe('le contrôle des tâches du moteur', () => {
	const tache = (uid: number, status: string, message: string | null = null) => ({
		uid,
		status,
		type: 'documentAdditionOrUpdate',
		indexUid: 'notes',
		error: message === null ? null : { message }
	});

	it('nomme les deux états terminaux qui ne sont pas la réussite, et eux seuls', () => {
		expect([...ETATS_NON_REUSSIS].sort()).toEqual(['canceled', 'failed']);
	});

	it('est VERT quand le moteur ne porte que des tâches réussies', () => {
		const v = verdictDesTaches([tache(1, 'succeeded'), tache(2, 'succeeded')], 0);
		expect(v.total).toBe(0);
		expect(v.lignes).toEqual([]);
	});

	it('ROUGIT sur une tâche en échec, et rend son message tel que le moteur l’écrit', () => {
		/* LA POLARITÉ QUI COMPTE — `P-5`. Sans ce cas, le contrôle serait vert
		   pour la seule raison que rien n’a jamais échoué, ce qui ne prouve rien
		   de sa capacité à dire non. */
		const v = verdictDesTaches([tache(4, 'failed', 'Document identifier is invalid.')], 0);
		expect(v.total).toBe(1);
		expect(v.lignes[0]).toContain('tâche 4');
		expect(v.lignes[0]).toContain('Document identifier is invalid.');
	});

	it('compte une tâche ANNULÉE comme une tâche non réussie', () => {
		/* Du point de vue du corpus, une tâche annulée dit la même chose qu’une
		   tâche échouée : l’écriture demandée n’a pas eu lieu. Un contrôle qui ne
		   regarderait que « failed » laisserait passer la moitié du cas. */
		expect(verdictDesTaches([tache(9, 'canceled')], 0).total).toBe(1);
	});

	it('ne compte NI une tâche enfilée, NI une tâche en cours — elles ne sont pas jugées', () => {
		/* C’est ce qui oblige le contrôle à vider la file avant de lire : une
		   tâche soumise il y a quatre millisecondes n’est pas un succès, elle
		   n’est pas encore passée. La compter comme réussie serait conclure sur un
		   chemin non parcouru. */
		const v = verdictDesTaches([tache(1, 'enqueued'), tache(2, 'processing')], 0);
		expect(v.total).toBe(0);
	});

	it('sépare ce que l’exécution a PRODUIT de ce dont elle a HÉRITÉ — sans absoudre', () => {
		/* `P-28` : ce qu’on neutralise, on le mesure ailleurs. La distinction dit
		   l’imputabilité ; elle ne retire rien du compte, et les deux rougissent. */
		const v = verdictDesTaches([tache(3, 'failed'), tache(12, 'failed')], 7);
		expect(v.total).toBe(2);
		expect(v.heritees.map((t: { uid: number }) => t.uid)).toEqual([3]);
		expect(v.produites.map((t: { uid: number }) => t.uid)).toEqual([12]);
	});

	it('range TOUT en hérité quand la marque est inconnue — jamais en produit', () => {
		/* Moteur injoignable au départ : on ne sait pas ce qui préexistait. Le
		   contrôle rougit quand même, et n’impute rien à cette exécution — une
		   imputation inventée serait pire qu’une imputation absente. */
		const v = verdictDesTaches([tache(3, 'failed')], null);
		expect(v.total).toBe(1);
		expect(v.produites).toEqual([]);
		expect(v.heritees).toHaveLength(1);
	});

	it('trie par numéro de tâche, quel que soit l’ordre où le moteur les rend', () => {
		/* Le moteur rend les tâches de la plus récente à la plus ancienne. Un
		   rapport qui reprendrait cet ordre se lirait à l’envers de l’histoire. */
		const v = verdictDesTaches([tache(12, 'failed'), tache(3, 'failed')], 0);
		expect(v.lignes[0]).toContain('tâche 3');
		expect(v.lignes[1]).toContain('tâche 12');
	});
});
