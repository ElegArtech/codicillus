/**
 * Batterie 16 — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * CE QU'ILS FIGENT, ET POURQUOI.
 *
 * `verif/menus.mjs` rend un verdict à cinq natures sur 265 états et deux côtés.
 * L'essentiel de sa justesse tient dans quatre décisions minuscules, et
 * `ECART-041` prouve qu'une seule d'entre elles suffit à fabriquer 31 faux
 * défauts sur 31 :
 *
 *   1. LA CLÉ DE RAPPROCHEMENT, ÉPROUVÉE DANS LES DEUX SENS. Un cas qui DOIT
 *      se rapprocher — le compilateur Svelte élague les nœuds de texte blancs
 *      (P-8), le gel rend « Rétention État » et l'application « RétentionÉtat ».
 *      Un cas qui NE DOIT PAS — deux entrées voisines du même conteneur. Une
 *      jointure produit deux fautes symétriques ; les deux sont figées ici.
 *   2. LE RANG N'EST PAS DANS LA CLÉ. Une entrée en plus décalerait tous les
 *      rangs suivants et fabriquerait une cascade. Il sert de TÉMOIN.
 *   3. L'ORDRE DES GENRES D'INERTIE. Un lien sans nom ET sans adresse est un
 *      lien mort avant d'être une entrée sans nom : l'ordre décide du libellé
 *      du défaut, donc de qui doit le corriger.
 *   4. L'ORDRE DES NATURES. Une inertie que le gel ne porte PAS est un défaut
 *      de portage même sans destination déclarée ; la même inertie des deux
 *      côtés ne l'est pas (ARB-013). Confondre les deux, c'est soit absoudre
 *      une régression, soit reprocher au code ce que la maquette impose.
 *
 * Ils s'exécutent sans navigateur et sans serveur — c'est ce qui permet de les
 * jouer à chaque `pnpm test:unit`, et donc de les jouer vraiment.
 */
import { describe, it, expect } from 'vitest';
import {
	cleDe,
	confronter,
	controleDeCle,
	destinationDe,
	ECART_DE_RANG,
	effectivite,
	genreDInertie,
	GENRES,
	motifDeRoute,
	nomCompact,
	numeroter,
	routeDe,
	routesDuDepot,
	verdictModules,
	ZONES_DE_MODULES,
	MODULES_RG_STR_06,
	REGLES_DE_DESTINATION,
	SONDES
	// @ts-expect-error — modules d'instrument en JavaScript, hors périmètre de tsc
} from './menus.mjs';

type Entree = {
	rang: number;
	conteneur: string;
	balise: string;
	role?: string;
	nom?: string;
	nomBrut: string;
	href?: string | null;
	estLien?: boolean;
	ancre?: string | null;
	cheminAbsolu?: string | null;
	route?: string | null;
	vers?: string | null;
	disabled?: boolean;
};

/** Une entrée de rail, telle que la sonde la rend. `nom` est POSÉ par `numeroter`. */
const lien = (p: Partial<Entree> & { rang: number; nomBrut: string }): Entree => ({
	conteneur: 'aside[Navigationprincipale]',
	balise: 'a',
	role: '',
	href: '#',
	estLien: true,
	ancre: null,
	cheminAbsolu: null,
	route: null,
	vers: null,
	disabled: false,
	...p,
	nom: nomCompact(p.nomBrut)
});

const routes = routesDuDepot();
const routesParVue = new Map([
	['V-07', ['/']],
	['V-19', ['/cartographie']],
	['V-05', ['/connexion']],
	['V-42', []]
]);

describe('la clé de rapprochement — ECART-041, éprouvée dans les DEUX sens', () => {
	it('rapproche ce qui DOIT l’être : les blancs élagués par Svelte (P-8)', () => {
		// Le cas exact d'ECART-041 : même nœud, deux DOM, un espace d'écart.
		const gel = numeroter([lien({ rang: 3, nomBrut: 'Rétention État 2026' })]);
		const app = numeroter([lien({ rang: 3, nomBrut: 'RétentionÉtat2026' })]);
		expect(gel[0].cle).toBe(app[0].cle);
	});

	it('rapproche aussi malgré une insécable, un retour à la ligne et une tabulation', () => {
		const gel = numeroter([lien({ rang: 0, nomBrut: 'Carte\u00a0mentale\n\t' })]);
		const app = numeroter([lien({ rang: 0, nomBrut: 'Cartementale' })]);
		expect(gel[0].cle).toBe(app[0].cle);
	});

	it('NE rapproche PAS deux entrées voisines du même conteneur', () => {
		const l = numeroter([
			lien({ rang: 0, nomBrut: 'Cartographie' }),
			lien({ rang: 1, nomBrut: 'Carte mentale' })
		]);
		expect(l[0].cle).not.toBe(l[1].cle);
	});

	it('NE rapproche PAS deux homonymes : l’occurrence les sépare', () => {
		const l = numeroter([lien({ rang: 0, nomBrut: 'Notes' }), lien({ rang: 1, nomBrut: 'Notes' })]);
		expect(l[0].cle).not.toBe(l[1].cle);
		expect(l[1].cle).toContain('│2');
	});

	it('NE rapproche PAS le même nom dans deux conteneurs différents', () => {
		const [a] = numeroter([lien({ rang: 0, nomBrut: 'Signets' })]);
		const [b] = numeroter([
			lien({ rang: 0, nomBrut: 'Signets', conteneur: 'nav#fil[Fild’Ariane]' })
		]);
		expect(a.cle).not.toBe(b.cle);
	});

	it('le RANG n’entre pas dans la clé — sans quoi une entrée insérée décalerait tout', () => {
		const [a] = numeroter([lien({ rang: 2, nomBrut: 'Console' })]);
		const [b] = numeroter([lien({ rang: 40, nomBrut: 'Console' })]);
		expect(a.cle).toBe(b.cle);
		expect(cleDe({ ...a, rang: 999 })).toBe(a.cle);
	});
});

describe('le contrôle de la clé — il doit savoir se dénoncer lui-même', () => {
	it('signale un SUR-rapprochement : même clé, rang très divergent', () => {
		const gel = numeroter([lien({ rang: 0, nomBrut: 'Accueil' })]);
		const app = numeroter([lien({ rang: 0 + ECART_DE_RANG + 1, nomBrut: 'Accueil' })]);
		const c = controleDeCle(gel, app);
		expect(c.surRapproches).toHaveLength(1);
		expect(c.sousRapproches).toHaveLength(0);
	});

	it('ne signale rien pour un décalage ordinaire', () => {
		const gel = numeroter([lien({ rang: 0, nomBrut: 'Accueil' })]);
		const app = numeroter([lien({ rang: 1, nomBrut: 'Accueil' })]);
		expect(controleDeCle(gel, app).surRapproches).toHaveLength(0);
	});

	it('signale un SOUS-rapprochement : même rang, même nom compact, clés disjointes', () => {
		// Le conteneur diffère : c'est la faute symétrique d'ECART-041.
		const gel = numeroter([lien({ rang: 0, nomBrut: 'Import' })]);
		const app = numeroter([lien({ rang: 0, nomBrut: 'Import', conteneur: 'nav#outils' })]);
		const c = controleDeCle(gel, app);
		expect(c.sousRapproches).toHaveLength(1);
	});
});

describe('les routes — lues à la source, jamais recopiées', () => {
	it('extrait 39 chemins distincts du §3 de docs/routes.md', () => {
		// §9 arrête le total à 40 : 39 chemins, plus la capture des adresses non
		// résolues, qui n'est pas un chemin. Si ce nombre bouge, la source a bougé.
		expect(routes).toHaveLength(39);
	});

	it('résout les formes paramétrées, y compris le chemin de dossiers à N segments', () => {
		expect(routeDe('/cartographie', routes)).toBe('/cartographie');
		expect(routeDe('/univers/production/infrastructure', routes)).toBe(
			'/univers/{univers}/{domaine}'
		);
		expect(routeDe('/univers/production/infra/dossiers/a/b/c', routes)).toBe(
			'/univers/{univers}/{domaine}/dossiers/{chemin…}'
		);
		expect(routeDe('/notes/restaurer-une-sauvegarde-mariadb/modifier', routes)).toBe(
			'/notes/{identifiant}/modifier'
		);
	});

	it('refuse ce qu’ARB-001 a supprimé et ce qu’ARB-002 n’a jamais ouvert', () => {
		expect(routeDe('/domaines/infrastructure', routes)).toBeNull();
		expect(routeDe('/bibliotheque/notifications', routes)).toBeNull();
	});

	it('un paramètre ne vaut qu’UN segment — sinon toute adresse résoudrait', () => {
		expect(motifDeRoute('/notes/{identifiant}').test('/notes/a/b')).toBe(false);
		expect(motifDeRoute('/notes/{identifiant}').test('/notes/a')).toBe(true);
	});
});

describe('la destination déclarée — deux règles, et pas une de plus', () => {
	it('résout « — vue V-xx », la forme du rail', () => {
		const d = destinationDe('Cartographie — vue V-19', routesParVue);
		expect(d).toMatchObject({ vue: 'V-19', routes: ['/cartographie'] });
	});

	it('résout « connexion », la forme de V-06', () => {
		expect(destinationDe('connexion', routesParVue)).toMatchObject({ vue: 'V-05' });
	});

	it('ne devine RIEN d’autre — un libellé libre reste non résolu', () => {
		expect(destinationDe('Vous êtes déjà sur l’accueil', routesParVue)).toBeNull();
		expect(destinationDe(null, routesParVue)).toBeNull();
	});

	it('les deux règles déclarées sont distinctes et toutes deux exercées ci-dessus', () => {
		expect(REGLES_DE_DESTINATION).toHaveLength(2);
		expect(REGLES_DE_DESTINATION.every((r: { trace: string }) => r.trace.length > 20)).toBe(true);
	});
});

describe('les genres d’inertie — et leur ORDRE, qui décide du libellé', () => {
	it('href="#", href="" et l’absence d’href sont tous des liens morts', () => {
		for (const h of ['#', '', null, undefined])
			expect(genreDInertie(lien({ rang: 0, nomBrut: 'Signets', href: h as string }))).toBe(
				'lien-mort'
			);
	});

	it('une ancre résolue est conforme, une ancre orpheline est morte', () => {
		expect(
			genreDInertie(
				lien({ rang: 0, nomBrut: 'Aller au contenu', href: '#contenu', ancre: 'presente' })
			)
		).toBeNull();
		expect(
			genreDInertie(
				lien({ rang: 0, nomBrut: 'Aller au contenu', href: '#contenu', ancre: 'absente' })
			)
		).toBe('ancre-morte');
	});

	it('une adresse hors routes est signalée ; une adresse servie ne l’est pas', () => {
		expect(
			genreDInertie(
				lien({
					rang: 0,
					nomBrut: 'X',
					href: '/domaines/x',
					cheminAbsolu: '/domaines/x',
					route: null
				})
			)
		).toBe('hors-routes');
		expect(
			genreDInertie(
				lien({
					rang: 0,
					nomBrut: 'X',
					href: '/cartographie',
					cheminAbsolu: '/cartographie',
					route: '/cartographie'
				})
			)
		).toBeNull();
	});

	it('un lien SANS adresse ET sans nom est un lien MORT, pas une entrée sans nom', () => {
		// L'ordre décide de qui doit corriger : recâbler, ou nommer.
		expect(genreDInertie(lien({ rang: 0, nomBrut: '', href: '#' }))).toBe('lien-mort');
		expect(
			genreDInertie(
				lien({
					rang: 0,
					nomBrut: '',
					href: '/cartographie',
					cheminAbsolu: '/cartographie',
					route: '/cartographie'
				})
			)
		).toBe('sans-nom');
	});

	it('« grisé » et « bientôt » priment sur l’adresse — ils sont visibles, eux', () => {
		expect(
			genreDInertie(
				lien({
					rang: 0,
					nomBrut: 'Onglet',
					disabled: true,
					href: '/cartographie',
					cheminAbsolu: '/cartographie',
					route: '/cartographie'
				})
			)
		).toBe('inactivee');
		expect(
			genreDInertie(
				lien({
					rang: 0,
					nomBrut: 'Cartographie — bientôt disponible',
					href: '/cartographie',
					cheminAbsolu: '/cartographie',
					route: '/cartographie'
				})
			)
		).toBe('promesse');
	});

	it('chaque genre déclaré a une trace et un moyen d’être éprouvé', () => {
		for (const g of GENRES as { genre: string; trace: string; eprouve_par: string }[]) {
			expect(g.trace.length).toBeGreaterThan(10);
			expect(['corpus', 'sonde']).toContain(g.eprouve_par);
			if (g.eprouve_par === 'sonde') expect(Object.keys(SONDES)).toContain(g.genre);
		}
	});
});

describe('les natures — ce qui rougit, et ce qui ne rougit jamais', () => {
	const nature = (gel: Entree[], app: Entree[]) =>
		confronter(numeroter(gel), numeroter(app), { routesParVue }).map(
			(l: { nom: string; nature: string; genre: string }) => [l.nom, l.genre, l.nature]
		);

	it('PORTAGE — destination déclarée, route existante, entrée morte', () => {
		const e = { rang: 0, nomBrut: 'Cartographie', vers: 'Cartographie — vue V-19' };
		expect(nature([lien(e)], [lien(e)])).toEqual([['Cartographie', 'lien-mort', 'portage']]);
	});

	it('INSTRUMENT — destination déclarée mais aucune route : la batterie ne tranche pas', () => {
		const e = { rang: 0, nomBrut: 'Inconnue', vers: 'Inconnue — vue V-42' };
		expect(nature([lien(e)], [lien(e)])).toEqual([['Inconnue', 'lien-mort', 'instrument']]);
	});

	it('INERTE AU GEL — même inertie des deux côtés, aucune destination (ARB-013)', () => {
		const e = { rang: 0, nomBrut: 'Infrastructure' };
		expect(nature([lien(e)], [lien(e)])).toEqual([
			['Infrastructure', 'lien-mort', 'inerte-au-gel']
		]);
	});

	it('PORTAGE — une inertie que le gel NE porte PAS est une régression, destination ou non', () => {
		const gel = lien({ rang: 0, nomBrut: 'Aller au contenu', href: '#contenu', ancre: 'presente' });
		const app = lien({ rang: 0, nomBrut: 'Aller au contenu', href: '#contenu', ancre: 'absente' });
		expect(nature([gel], [app])).toEqual([['Alleraucontenu', 'ancre-morte', 'portage']]);
	});

	it('GEL NON REPORTÉ — l’entrée du gel a disparu de l’application', () => {
		const l = nature([lien({ rang: 0, nomBrut: 'Console' })], []);
		expect(l).toEqual([['Console', 'lien-mort', 'gel-non-reporte']]);
	});

	it('SURPLUS PORTAGE — l’application rend une entrée que le gel n’a pas', () => {
		const l = nature([], [lien({ rang: 0, nomBrut: 'Nouveauté' })]);
		expect(l).toEqual([['Nouveauté', 'lien-mort', 'surplus-portage']]);
	});

	it('une entrée conforme des deux côtés ne produit AUCUNE ligne', () => {
		const e = {
			rang: 0,
			nomBrut: 'Cartographie',
			href: '/cartographie',
			cheminAbsolu: '/cartographie',
			route: '/cartographie'
		};
		expect(nature([lien(e)], [lien(e)])).toEqual([]);
	});
});

describe('P-04 — les modules de domaine', () => {
	const inst = (
		rendus: string[],
		presents = rendus,
		annonce: number | null = null,
		rendue = true
	) => ({
		rendue,
		annonce,
		rendus,
		presents
	});

	it('M-1 — le compte annoncé par la vue doit être le compte rendu', () => {
		const d = verdictModules({ instances: [inst(['Notes'], ['Notes'], 3)] }, null, ['Notes']);
		expect(d.map((x: { obligation: string }) => x.obligation)).toEqual(['M-1']);
	});

	it('M-2 — un module au DOM sans être rendu est un module MASQUÉ, pas absent', () => {
		const d = verdictModules({ instances: [inst(['Notes'], ['Notes', 'Cartographie'])] }, null, [
			'Notes',
			'Cartographie'
		]);
		expect(d[0]).toMatchObject({ obligation: 'M-2', cote: 'gel' });
		expect(d[0].detail).toContain('Cartographie');
	});

	it('M-2 — une instance NON RENDUE n’est pas jugée : l’état vide n’est pas P-04', () => {
		// V-11 « sans note » masque la zone en laissant les six tuiles au DOM.
		const d = verdictModules({ instances: [inst([], ['Notes', 'Cartographie'], 6, false)] }, null, [
			'Notes',
			'Cartographie'
		]);
		expect(d).toEqual([]);
	});

	it('M-3 — l’application doit rendre le même ensemble que le gel', () => {
		const d = verdictModules(
			{ instances: [inst(['Notes'])] },
			{ instances: [inst(['Notes', 'Signets'])] },
			['Notes', 'Signets']
		);
		expect(d.map((x: { obligation: string }) => x.obligation)).toContain('M-3');
	});

	it('M-3 — un nombre d’instances divergent est signalé', () => {
		const d = verdictModules({ instances: [inst(['Notes'])] }, { instances: [] }, ['Notes']);
		expect(d[0]).toMatchObject({ obligation: 'M-3', cote: 'portage' });
	});

	it('M-4 — une activation qui ne fait jamais varier le rendu n’est pas effective', () => {
		expect(effectivite([['Notes'], ['Notes'], ['Notes']]).effectif).toBe(false);
		expect(effectivite([['Notes'], ['Notes', 'Signets']]).effectif).toBe(true);
	});

	it('les zones déclarées sont tracées, et RG-STR-06 est cité tel quel', () => {
		expect(ZONES_DE_MODULES.length).toBeGreaterThan(0);
		for (const z of ZONES_DE_MODULES as { trace: string; zone: string; entree: string }[]) {
			expect(z.trace).toMatch(/V-\d\d:/);
			expect(z.zone.length).toBeGreaterThan(0);
			expect(z.entree.length).toBeGreaterThan(0);
		}
		expect(MODULES_RG_STR_06).toEqual([
			'Notes',
			'Fiches',
			'Cartographie',
			'Signets',
			'Carte mentale'
		]);
	});
});

describe('les sondes — la batterie doit savoir dire non', () => {
	it('chaque sonde déclare ce qu’elle perturbe, ce qu’elle attend, et où', () => {
		for (const [nom, s] of Object.entries(SONDES) as [string, Record<string, unknown>][]) {
			expect(String(s.quoi).length).toBeGreaterThan(10);
			expect(s.genre_attendu).toBeTruthy();
			expect(s.nature_attendue).toBeTruthy();
			expect(s.site_attendu).toBeInstanceOf(RegExp);
			expect(typeof s.poser).toBe('function');
			expect(nom.length).toBeGreaterThan(0);
		}
	});

	it('tout genre qu’aucun corpus n’exerce a sa sonde — sinon il serait espéré', () => {
		const parSonde = (GENRES as { genre: string; eprouve_par: string }[]).filter(
			(g) => g.eprouve_par === 'sonde'
		);
		expect(parSonde.length).toBeGreaterThan(0);
		for (const g of parSonde) expect(SONDES[g.genre]).toBeDefined();
	});
});
