/**
 * Batterie 9 — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * CE QU'ILS FIGENT, ET POURQUOI.
 *
 * `verif/etats.mjs` rend un verdict à cinq valeurs sur 265 états et deux
 * côtés. L'essentiel de sa justesse tient dans quatre décisions minuscules,
 * dont trois ont déjà été fausses en cours d'écriture — et dont aucune ne se
 * voit dans un vert global :
 *
 *   1. une esquisse en `display: none` est un état DÉCLARÉ, pas un état
 *      ATTEINT. Confondre les deux faisait passer pour couvertes des zones que
 *      le gel n'atteint jamais ;
 *   2. le préfixe `si-` ne dit pas « droit » : `.si-nominal` est le complément
 *      de `.si-chargement`, `.si-lecture` lit `data-contenu`. Les compter tous
 *      comme conditionnements de droit inventait un quatrième état partout ;
 *   3. deux états de MÊME vecteur ne sont pas indiscernables, ils sont le même
 *      écran — `verif/scenarios/V-07.json` déclare `etat-nominal` identique à
 *      `role-referent`. Sans ce crible, la batterie citait ARB-005 à tort ;
 *   4. l'instantané ARIA seul ne distingue pas le nominal du chargement de
 *      V-08 : une esquisse est un `div` sans rôle ni nom. Mesuré.
 *
 * Ils s'exécutent sans navigateur et sans serveur — c'est ce qui permet de les
 * jouer à chaque `pnpm test:unit`, et donc de les jouer vraiment.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
	agregerCote,
	chutesDePage,
	classer,
	classesDuGel,
	couplesIndiscernables,
	ecartDe,
	eprouverLaTable,
	HORS_QUATRE,
	MARQUEURS,
	marqueurDe,
	QUATRE_ETATS,
	racine,
	RE_SUSPECT,
	sansDroitParZone,
	verdictDeZone,
	vuesDuDepot
	// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
} from './etats.mjs';

type Zone = { cle: string; rend: boolean; visibles: string[]; presentes: string[] };
type Releve = { etat: string; defaut?: boolean; statut?: number | null; zones: Zone[] };
const z = (cle: string, visibles: string[], presentes = visibles): Zone => ({
	cle,
	rend: true,
	visibles,
	presentes
});

describe('classer — atteignable et déclaré ne sont pas la même chose', () => {
	it('compte l’esquisse RENDUE comme état de chargement atteint', () => {
		const r = classer({ visibles: ['esquisse'], presentes: ['esquisse'] });
		expect(r.etats.chargement).toEqual(['.esquisse']);
		expect(r.declares.chargement).toBeUndefined();
	});

	it('compte l’esquisse PRÉSENTE mais non rendue comme état seulement DÉCLARÉ', () => {
		const r = classer({ visibles: [], presentes: ['esquisse'] });
		expect(r.etats.chargement).toBeUndefined();
		expect(r.declares.chargement).toEqual(['.esquisse']);
	});

	it('« sans droit » se lit sur la PRÉSENCE : le socle masque, il ne retire pas', () => {
		// socle.css:396 — .app[data-droits="lecture"] .si-ecriture { display: none }
		const r = classer({ visibles: [], presentes: ['si-ecriture'] });
		expect(r.etats['sans-droit']).toEqual(['.si-ecriture']);
	});

	it('`.zone-etat` fait loi et `.vide` reste au gel de ses deux vues (DESIGN §2.D-1)', () => {
		expect(marqueurDe('zone-etat').etat).toBe('vide');
		expect(marqueurDe('zone-etat').sorte).toBe('socle');
		expect(marqueurDe('vide__titre').etat).toBe('vide');
		expect(marqueurDe('vide__titre').sorte).toBe('divergente');
	});
});

describe('la table ne prend pas ce qui porte seulement le mot', () => {
	it('récuse la notification d’erreur — RG-M18-02, pas un état de zone', () => {
		expect(marqueurDe('notif--erreur')).toBeNull();
		expect(ecartDe('notif--erreur')).not.toBeNull();
		expect(classer({ visibles: ['notif--erreur'] }).etats.erreur).toBeUndefined();
	});

	it('récuse l’erreur de saisie, le refus métier, la dégradation et le droit hérité grisé', () => {
		for (const c of ['champ__erreur', 'refus__titre', 'degrade', 'ac--interdit'])
			expect(ecartDe(c), c).not.toBeNull();
	});

	it('le préfixe `si-` ne suffit pas : seul le conditionnement de DROIT compte', () => {
		for (const c of ['si-ecriture', 'si-admin', 'si-gestionnaire', 'si-redacteur'])
			expect(marqueurDe(c)?.etat, c).toBe('sans-droit');
		for (const c of ['si-nominal', 'si-peuple', 'si-donnees', 'si-lecture', 'si-apercu'])
			expect(marqueurDe(c)?.etat, c).not.toBe('sans-droit');
		// `.si-chargement` et `.si-vide`, elles, sont bien des états.
		expect(marqueurDe('si-chargement').etat).toBe('chargement');
		expect(marqueurDe('si-vide').etat).toBe('vide');
	});

	it('`.palette__degrade` est un dégradé de peinture, pas une dégradation', () => {
		expect(ecartDe('palette__degrade')).not.toBeNull();
		expect(RE_SUSPECT.test('palette__degrade')).toBe(true);
	});
});

describe('sansDroitParZone — l’absence est l’état, encore faut-il qu’elle arrive', () => {
	const releves = (): Releve[] => [
		{ etat: 'ecriture', zones: [z('#a', ['si-ecriture']), z('#b', []), z('#c', ['si-ecriture'])] },
		{
			etat: 'lecture',
			zones: [
				{ cle: '#a', rend: true, visibles: [], presentes: ['si-ecriture'] },
				z('#b', []),
				z('#c', ['si-ecriture'])
			]
		}
	];

	it('atteignable quand un état déclaré RETIRE l’action de l’écran', () => {
		expect(sansDroitParZone(releves()).get('#a')).toBe('atteignable');
	});

	it('non applicable quand la zone ne porte aucun nœud conditionné', () => {
		expect(sansDroitParZone(releves()).get('#b')).toBe('non-applicable');
	});

	it('déclaré mais non atteignable quand aucun état ne la retire', () => {
		expect(sansDroitParZone(releves()).get('#c')).toBe('declare-non-atteignable');
	});
});

describe('verdictDeZone — les trois natures de manque ne se confondent pas', () => {
	it('porté quand les deux côtés rendent l’état', () => {
		const g = { etats: { chargement: ['s1'] }, declares: {} };
		const p = { etats: { chargement: ['s1'] }, declares: {} };
		expect(verdictDeZone(g, p, 'non-applicable', 'non-applicable').chargement).toBe('porte');
	});

	it('MANQUE PORTAGE quand le gel rend l’état et pas l’application', () => {
		const g = { etats: { vide: ['s1'] }, declares: {} };
		expect(verdictDeZone(g, { etats: {}, declares: {} }, null, null).vide).toBe('manque-portage');
	});

	it('gel-non-atteignable quand la maquette déclare le composant sans jamais l’atteindre', () => {
		const g = { etats: {}, declares: { erreur: ['s1'] } };
		expect(verdictDeZone(g, { etats: {}, declares: {} }, null, null).erreur).toBe(
			'gel-non-atteignable'
		);
	});

	it('gel-absent quand la maquette ne porte rien', () => {
		expect(verdictDeZone({ etats: {}, declares: {} }, null, null, null).erreur).toBe('gel-absent');
	});

	it('« sans droit » non applicable ne devient JAMAIS un manque', () => {
		const v = verdictDeZone({ etats: {}, declares: {} }, null, 'non-applicable', 'non-applicable');
		expect(v['sans-droit']).toBe('non-applicable');
	});

	it('« sans droit » atteignable au gel et absent du portage est un manque de PORTAGE', () => {
		const v = verdictDeZone({ etats: {}, declares: {} }, null, 'atteignable', 'non-applicable');
		expect(v['sans-droit']).toBe('manque-portage');
	});
});

describe('chutesDePage — RG-M18-04, et elle doit savoir dire non', () => {
	/* Le point de comparaison est LE GEL, état par état. Une première rédaction
	   prenait « les zones qui rendent dans tous les états » et laissait passer la
	   mutation de V-07 qui escamote `#p-revisions` sous l’erreur voisine. */
	const gel = (etat: string, zones: Zone[]): Releve => ({ etat, statut: 200, zones });

	it('ne dit rien quand aucune zone n’est en erreur', () => {
		const g = [gel('nominal', [z('#a', []), z('#b', [])])];
		expect(chutesDePage(g, g)).toEqual([]);
	});

	it('accepte l’erreur locale : les voisines rendent encore des deux côtés', () => {
		const g = [gel('err', [z('#a', ['panneau--erreur']), z('#b', []), z('#c', [])])];
		expect(chutesDePage(g, g)).toEqual([]);
	});

	it('NOMME la zone que le gel rend et que le portage a perdue sous l’erreur', () => {
		const g = [gel('err', [z('#a', ['panneau--erreur']), z('#b', []), z('#c', [])])];
		const p = [
			gel('err', [
				z('#a', ['panneau--erreur']),
				{ cle: '#b', rend: false, visibles: [], presentes: [] },
				z('#c', [])
			])
		];
		const r = chutesDePage(g, p);
		expect(r).toHaveLength(1);
		expect(r[0].tombees).toEqual(['#b']);
	});

	it('n’exige PAS une zone que le gel n’affiche pas non plus dans cet état', () => {
		const g = [
			gel('err', [
				z('#a', ['panneau--erreur']),
				{ cle: '#b', rend: false, visibles: [], presentes: [] }
			])
		];
		expect(chutesDePage(g, g)).toEqual([]);
	});

	it('NOMME le document qui ne répond plus 200 — une page tombée est une page tombée', () => {
		const g = [gel('err', [z('#a', ['err-local']), z('#b', [])])];
		const p = [{ etat: 'err', statut: 500, zones: [z('#a', ['err-local']), z('#b', [])] }];
		const r = chutesDePage(g, p);
		expect(r).toHaveLength(1);
		expect(r[0].cause).toContain('500');
	});

	it('NOMME la page réduite à sa seule zone en erreur', () => {
		const g = [gel('err', [z('#a', ['panneau--erreur']), z('#b', []), z('#c', [])])];
		const p = [
			{
				etat: 'err',
				statut: 200,
				zones: [
					z('#a', ['panneau--erreur']),
					{ cle: '#b', rend: false, visibles: [], presentes: [] },
					{ cle: '#c', rend: false, visibles: [], presentes: [] }
				]
			}
		];
		expect(chutesDePage(g, p)).toHaveLength(1);
	});
});

describe('couplesIndiscernables — le crible, et ses deux discriminants', () => {
	it('ne retient PAS deux états de même vecteur : c’est le même écran, pas ARB-005', () => {
		// `verif/scenarios/V-07.json` : `etat-nominal` est déclaré identique à
		// `role-referent`. Une redite de planche n'est pas un régime de sécurité.
		const r = [
			{ etat: 'a', vecteur: { x: 1 }, aria: 'IDEM', zones: [z('#a', [])] },
			{ etat: 'b', vecteur: { x: 1 }, aria: 'IDEM', zones: [z('#a', [])] }
		];
		expect(couplesIndiscernables(r)).toEqual([]);
	});

	it('retient deux vecteurs DIFFÉRENTS qui rendent le même écran', () => {
		const r = [
			{ etat: 'inexistant', vecteur: { cas: 'inexistant' }, aria: 'IDEM', zones: [z('#a', [])] },
			{ etat: 'prive', vecteur: { cas: 'prive' }, aria: 'IDEM', zones: [z('#a', [])] }
		];
		expect(couplesIndiscernables(r)).toEqual([['inexistant', 'prive']]);
	});

	it('l’instantané ARIA seul ne suffit pas : une esquisse n’a ni rôle ni nom (V-08)', () => {
		const r = [
			{ etat: 'nominal', vecteur: { etat: 'nominal' }, aria: 'IDEM', zones: [z('#a', [])] },
			{
				etat: 'chargement',
				vecteur: { etat: 'chargement' },
				aria: 'IDEM',
				zones: [z('#a', ['esquisse'])]
			}
		];
		expect(couplesIndiscernables(r)).toEqual([]);
	});
});

describe('agregerCote — un marqueur compte pour SA zone', () => {
	it('sépare les états zone par zone et n’en mélange aucun', () => {
		const m = agregerCote([
			{ etat: 's1', zones: [z('#a', ['esquisse']), z('#b', ['zone-etat'])] },
			{ etat: 's2', zones: [z('#a', ['panneau--erreur']), z('#b', [])] }
		] as never);
		expect(Object.keys(m.get('#a').etats).sort()).toEqual(['chargement', 'erreur']);
		expect(Object.keys(m.get('#b').etats)).toEqual(['vide']);
	});
});

describe('la table est éprouvée par le gel — CLAUDE.md §6 P-5', () => {
	/* « Une règle qu'aucun cas n'exerce est une règle dont on ignore si elle
	   marche. » Le relevé mécanique des 41 maquettes est la seule source qui
	   puisse le dire, et il est rejoué ici. */
	const classes: string[] = classesDuGel();

	it('aucune famille de la table n’est inerte sur le gel', () => {
		const { inertes } = eprouverLaTable(classes);
		expect(inertes).toEqual([]);
	});

	it('les quatre états sont tous représentés dans la table', () => {
		for (const e of QUATRE_ETATS)
			expect(
				MARQUEURS.some((m: { etat: string }) => m.etat === e),
				e
			).toBe(true);
	});

	it('aucune classe n’est à la fois prise et récusée', () => {
		for (const c of classes) expect(Boolean(marqueurDe(c) && ecartDe(c)), c).toBe(false);
	});

	it('chaque famille porte une trace ou un motif — jamais une décision muette', () => {
		for (const m of MARQUEURS) expect(String(m.trace).length, m.famille).toBeGreaterThan(10);
		for (const h of HORS_QUATRE) expect(String(h.motif).length, h.famille).toBeGreaterThan(20);
	});
});

describe('le périmètre est celui du dépôt, jamais une liste recopiée', () => {
	it('les 41 vues sont lues des scénarios, pas énumérées à la main', () => {
		const vues = vuesDuDepot();
		expect(vues.length).toBe(
			readdirSync(join(racine as string, 'verif', 'scenarios')).filter((f) =>
				/^V-\d\d\.json$/.test(f)
			).length
		);
		expect(vues[0]).toBe('V-01');
	});
});
