/**
 * LES UNITAIRES DE LA SUPPRESSION D'UNE NOTE — ce qui se contrôle SANS base.
 *
 * Même règle que `edition.test.ts` : ce qui exige le conteneur est mesuré par
 * les batteries qui l'ouvrent. La seule DÉCISION extractible de
 * `supprimerUneNote()` est le passage de la note résolue à ce que `RG-M04-10`
 * fait annoncer, et c'est `resumeDeSuppression()`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CES CAS DOIVENT ÊTRE SYNTHÉTIQUES — `P-5` ET `P-26`
 *
 * Une suppression DÉTRUIT. Elle ne peut pas être éprouvée sur le corpus de
 * semence sans le mutiler, et la base est PARTAGÉE entre plusieurs copies de
 * travail (`P-30`) : un cas qui supprimerait une note pour vérifier qu'elle
 * disparaît ferait mesurer le voisin. Aucune ligne de ce fichier n'ouvre de
 * connexion, et aucune n'écrit.
 *
 * Surtout, `P-26` : un contrôle dont le seul cas d'épreuve est l'état du dépôt
 * devient inerte le jour où le dépôt change. Les deux polarités ci-dessous —
 * la note résolue et la note qui ne l'est pas — sont donc écrites à la main.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE FICHIER NE PROUVE PAS, ET IL FAUT LE SAVOIR
 *
 * Ni la CASCADE (elle est dans le schéma, `pnpm base:coherence` la compare), ni
 * le RETRAIT DE L'INDEX (`entretenirLIndex()` a ses propres cas), ni le `303`
 * (c'est la route). Ce qui est prouvé ici est la composition du résumé et la
 * traversée du refus — rien d'autre.
 */
import { describe, expect, it } from 'vitest';
import { INTROUVABLE } from '../droits/resolution';
import { adresseDeNote } from '../rangement/adresses';
import { retroliensVers } from './note';
import { resumeDeSuppression, type EtatAvantSuppression } from './suppression';

/* ═══════════════════════════════════ Le décor synthétique ═══════════════ */

/** Un rétrolien, dans la forme que `retroliensVers()` produit. */
function retrolien(identifiant: string, titre: string) {
	return { identifiant, titre, adresse: adresseDeNote(identifiant) };
}

function etat(surcharge: Partial<EtatAvantSuppression> = {}): EtatAvantSuppression {
	return {
		titre: 'Restaurer une base PostgreSQL',
		retroliens: [
			retrolien('n-astreinte', 'Procédure d’astreinte'),
			retrolien('n-sauvegardes', 'Politique de sauvegardes')
		],
		versions: 4,
		piecesJointes: 3,
		...surcharge
	};
}

/**
 * Un corps qui cite `cible` autant de fois que demandé, un lien par paragraphe.
 *
 * UN LIEN PAR PARAGRAPHE, ET CE N'EST PAS UN CHOIX DE STYLE : le schéma
 * canonique refuse « deux textes consécutifs de mêmes marques : ProseMirror les
 * fusionne » (`../contenu/document.ts`). Deux citations côte à côte dans un même
 * paragraphe ne sont donc pas un document valide, et le cas serait rejeté avant
 * d'être mesuré.
 */
function corpsQuiCite(cible: string, fois: number) {
	return {
		type: 'doc',
		content: Array.from({ length: fois }, () => ({
			type: 'paragraph',
			content: [
				{ type: 'text', text: 'la note', marks: [{ type: 'lienInterne', attrs: { cible } }] }
			]
		}))
	};
}

/* ═══════════════════════════════════ La note résolue ════════════════════ */

describe('RG-M04-10 et le gel de V-40 — ce que la confirmation annonce', () => {
	it('rend les QUATRE valeurs du gel, et rien d’autre', () => {
		/* Trois puces au gel — `mockups/V-40-dialogues.html:3295-3297` : versions,
		   notes qui pointent vers elle, pièces jointes — plus le titre rappelé.
		   `RG-M04-10` n'en nomme que trois : la quatrième vient de la maquette,
		   qui prime (`ECART-048` É-5). */
		const resume = resumeDeSuppression({ trouve: true, ressource: etat() });

		expect(resume.trouve).toBe(true);
		if (!resume.trouve) return;
		expect(resume.ressource).toEqual({
			titre: 'Restaurer une base PostgreSQL',
			retroliensCasses: 2,
			versionsPerdues: 4,
			piecesJointesPerdues: 3
		});
	});

	it('le titre est repris À LA LETTRE — la boîte « rappelle le titre »', () => {
		/* Aucune troncature, aucune capitale, aucun guillemet ajouté : ce que la
		   note porte est ce que le dialogue annonce. Une transformation ici serait
		   une décision graphique, et V-40 n'en demande aucune. */
		const resume = resumeDeSuppression({
			trouve: true,
			ressource: etat({ titre: 'PRA — bascule du site de secours (v2)' })
		});
		if (!resume.trouve) throw new Error('la note est résolue');
		expect(resume.ressource.titre).toBe('PRA — bascule du site de secours (v2)');
	});

	it('une note sans rétrolien, sans version et sans pièce annonce ZÉRO, jamais rien', () => {
		/* `P-02` — « une donnée indisponible s'affiche comme telle ». Zéro est une
		   donnée : la note n'est citée par personne, n'a pas d'historique et ne
		   porte aucune pièce. C'est L'ÉTAT RÉEL du corpus pour les pièces —
		   `pieces_jointes` compte zéro ligne —, et ce cas est donc le seul que le
		   dépôt exercerait ; les autres sont ici pour cette raison (`P-26`). */
		const resume = resumeDeSuppression({
			trouve: true,
			ressource: etat({ retroliens: [], versions: 0, piecesJointes: 0 })
		});
		if (!resume.trouve) throw new Error('la note est résolue');
		expect(resume.ressource.retroliensCasses).toBe(0);
		expect(resume.ressource.versionsPerdues).toBe(0);
		expect(resume.ressource.piecesJointesPerdues).toBe(0);
	});

	it('« rétroliens cassés » compte les NOTES CITANTES, pas les liens', () => {
		/* Le cas est composé avec `retroliensVers()`, l'implémentation unique du
		   rétrolien (`RG-M05-02`) : une note qui cite trois fois la cible, une
		   autre qui la cite une fois. Deux rétroliens seront cassés, pas quatre —
		   c'est le lecteur qui compte, pas l'occurrence. */
		const retroliens = retroliensVers('n-restaurer-pg', [
			{
				identifiant: 'n-astreinte',
				titre: 'Procédure d’astreinte',
				reference: corpsQuiCite('n-restaurer-pg', 3),
				operationnel: null
			},
			{
				identifiant: 'n-sauvegardes',
				titre: 'Politique de sauvegardes',
				reference: corpsQuiCite('n-restaurer-pg', 1),
				operationnel: null
			}
		]);

		const resume = resumeDeSuppression({ trouve: true, ressource: etat({ retroliens }) });
		if (!resume.trouve) throw new Error('la note est résolue');
		expect(resume.ressource.retroliensCasses).toBe(2);
	});
});

/* ═══════════════════════════════════ La note qui ne l’est pas ═══════════ */

describe('RG-ACC-04 — la note NON résolue ne produit aucun résumé', () => {
	it('le refus traverse : rien du titre, rien des chiffres', () => {
		/* La polarité inverse de tout ce qui précède (`P-5`). Une note interdite et
		   une note inexistante arrivent ici sous la MÊME forme, et il n'y a donc
		   rien à distinguer : le résumé n'existe pas. */
		const resume = resumeDeSuppression(INTROUVABLE);
		expect(resume.trouve).toBe(false);
		expect('ressource' in resume).toBe(false);
	});

	it('le refus rendu est l’OBJET UNIQUE, pas un égal recomposé', () => {
		/* `INTROUVABLE` est gelé et unique (`../droits/resolution.ts`). L'égalité
		   par référence est ce qui prouve qu'aucun second refus n'a été fabriqué —
		   `toEqual` passerait sur un objet distinct de même forme. */
		expect(resumeDeSuppression(INTROUVABLE)).toBe(INTROUVABLE);
	});
});
