/**
 * LES UNITAIRES DE LA COUCHE DE LECTURE — ce qui se contrôle SANS base.
 *
 * Ce qui exige une base est `pnpm verif:donnees`, qui a besoin du conteneur
 * `db`. Mélanger les deux rendrait `pnpm test:unit` dépendant de Docker, et une
 * batterie qui ne s'exécute pas est une batterie qui ne prouve rien
 * (`semence.test.ts` pose la règle, celui-ci la suit).
 *
 * Ce que ces tests regardent : les CONVERSIONS. C'est la seule partie de la
 * couche où une erreur est silencieuse — une date décalée d'un jour ne lève
 * pas, elle affiche un mauvais jour et déplace un niveau de fraîcheur.
 */
import { describe, expect, it } from 'vitest';
import { CORPUS } from '../../../seeds/corpus';
import { corpsDepuisTexte, dateCourteEnIso, instantDeDateCourte } from '../base/semence';
import { dateCourteDInstant, dateCourteDIso, extraitDuCorps, joursEcoules } from './lecture';

describe('les dates — l’inverse exact de ce que la semence écrit', () => {
	it('rend la date courte de tout instant que la semence a pu écrire', () => {
		/* Le corpus porte 31 dates de vérification ; chacune fait l'aller-retour.
		   C'est le contrôle qui compte : la semence écrit `instantDeDateCourte`,
		   la couche relit `dateCourteDInstant`, et les deux doivent se composer en
		   l'identité. */
		const dates = CORPUS.map((n) => n.revise).filter((d): d is string => d !== null);
		expect(dates.length).toBeGreaterThan(0);
		for (const date of dates) {
			expect(dateCourteDInstant(instantDeDateCourte(date))).toBe(date);
		}
	});

	it('lit les composantes en UTC, et non dans le fuseau du serveur', () => {
		/* LE PIÈGE, et il ne lève pas : la semence écrit minuit UTC. Relire avec
		   `getDate()` rendrait la veille dans tout fuseau à l'ouest de Greenwich.
		   Un instant à minuit UTC doit rendre SON jour, jamais celui d'avant. */
		expect(dateCourteDInstant(new Date('2026-07-18T00:00:00.000Z'))).toBe('18/07/2026');
		/* Et l'autre bord de la journée, qui piège le fuseau opposé. */
		expect(dateCourteDInstant(new Date('2026-07-18T23:59:59.999Z'))).toBe('18/07/2026');
	});

	it('rend la date courte d’une colonne SQL `date`, relue en chaîne', () => {
		expect(dateCourteDIso('2026-08-13')).toBe('13/08/2026');
		expect(dateCourteDIso(dateCourteEnIso('02/08/2026'))).toBe('02/08/2026');
	});

	it('refuse une date ISO illisible plutôt que d’en deviner une', () => {
		expect(() => dateCourteDIso('2026-08')).toThrow(/illisible/);
	});

	it('compte les jours entiers écoulés, sans arrondir vers le haut', () => {
		const reference = new Date('2026-08-13T00:00:00.000Z');
		expect(joursEcoules(new Date('2026-08-13T00:00:00.000Z'), reference)).toBe(0);
		expect(joursEcoules(new Date('2026-08-12T00:00:00.000Z'), reference)).toBe(1);
		/* Vingt-trois heures ne font pas un jour : la troncature est voulue, c'est
		   celle d'`anciennete()` de la semence, dont dépend le niveau au seuil. */
		expect(joursEcoules(new Date('2026-08-12T01:00:00.000Z'), reference)).toBe(0);
	});
});

describe('l’extrait — l’inverse de `corpsDepuisTexte`', () => {
	it('retrouve le texte de tous les extraits du corpus', () => {
		for (const note of CORPUS) {
			expect(extraitDuCorps(corpsDepuisTexte(note.extrait))).toBe(note.extrait);
		}
	});

	it('rend le texte brut d’un corps à plusieurs blocs, sans lever', () => {
		/* T-050 a mesuré ce que la levée coûtait : dès le premier corps enregistré
		   par l'éditeur, `lireNotes()` levait, donc TOUTE route qui lit le corpus
		   tombait — et aucune batterie ne l'aurait vu, aucune n'enregistre.
		   `STACK-TECHNIQUE.md:261` nomme la source : le texte brut sert « aux
		   extraits ». Le parcours reste structurel (`texteBrut()` de document.ts),
		   jamais textuel : ADR-003 est tenu. */
		expect(
			extraitDuCorps({
				type: 'doc',
				content: [
					{ type: 'paragraph', content: [{ type: 'text', text: 'un' }] },
					{ type: 'paragraph', content: [{ type: 'text', text: 'deux' }] }
				]
			})
		).toContain('un');
	});

	it('refuse un document INVALIDE — la porte unique n’a pas de mode indulgent', () => {
		/* Ce qui reste refusé, et c'est le contrôle qui compte : la validation n'a
		   pas été desserrée, elle a été DÉPLACÉE sur `analyserDocument`, la porte
		   unique d'ADR-003. Un nœud que le format ne connaît pas est rejeté. */
		expect(() => extraitDuCorps({ type: 'doc', content: [{ type: 'horizontal_rule' }] })).toThrow();
		expect(() => extraitDuCorps({ type: 'paragraphe' })).toThrow();
		expect(() => extraitDuCorps({ type: 'doc', content: [] })).toThrow();
	});
});
