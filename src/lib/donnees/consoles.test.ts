/**
 * LES UNITAIRES DE LA CONSOLE — ce qui se contrôle SANS base.
 *
 * Même partage que `signets.test.ts` : ce qui exige le conteneur `db` est mesuré
 * par `pnpm test:etancheite`, sur le produit construit et sur sept personas
 * réels. Ici, les DÉCISIONS pures — celles où une erreur est silencieuse parce
 * qu'elle rend un booléen plausible au lieu de lever.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * TROIS CHOSES SONT ÉPROUVÉES ICI QUE LA BATTERIE 6 NE PEUT PAS ÉPROUVER
 *
 *   1. LES QUATRE RÔLES. `ARB-036` en donne quatre — la maquette prime sur le
 *      cahier des charges, qui n'en donne que trois. La batterie 6 n'en incarne
 *      que DEUX en compte réel (`contributeur` et `administrateur`) et fabrique
 *      les autres personas par un DROIT DE DOSSIER posé sur le contributeur.
 *      Elle ne peut donc rien dire du rôle `referent`, qu'aucun de ses comptes
 *      ne porte, ni du rôle `lecteur`. Les quatre sont ici.
 *
 *   2. LA POLARITÉ INVERSE. `P-5`, second paragraphe : « une règle éprouvée sur
 *      un seul mécanisme n'est éprouvée qu'à moitié ». Le risque propre à cette
 *      garde est qu'un DROIT DE DOSSIER fort — `gestionnaire` sur la racine —
 *      ouvre la console par une confusion entre « tout voir dans un domaine » et
 *      « administrer l'instance ». Le cas est joué, avec un index peuplé.
 *
 *   3. L'ÉTAT NEUTRE DE V-34, DANS LES DEUX SENS. `P-26` : « tout contrôle doit
 *      avoir un cas d'épreuve synthétique, indépendant de l'état du dépôt ». Un
 *      prédicat qui rendrait toujours `insuffisantes` serait inerte sans que
 *      rien ne le dise ; il est donc exercé sur un recensement vide, où il doit
 *      basculer.
 */
import { describe, expect, it } from 'vitest';
import type { Base } from '../base/acces';
import { SEUILS_PAR_DEFAUT } from '../fraicheur';
import {
	ANONYME,
	INTROUVABLE,
	identiteAuthentifiee,
	indexerLesDroits,
	perimetreDeLecture,
	type DossierDeLArbre,
	type DroitExplicite,
	type RoleDeCompte
} from '../droits/resolution';
import {
	MESURES_DE_CONSOLE_SANS_CONTREPARTIE,
	accesALaConsole,
	etatDesDonnees,
	resoudreLaConsole,
	vecteurDeV34,
	type MesureSansContrepartie
} from './consoles';

/* ═══════════════════════════════════════════════ L'accès à la console ══ */

/** Les quatre rôles d'`ARB-036`, dans l'ordre de l'énumération de la base. */
const ROLES: readonly RoleDeCompte[] = ['administrateur', 'referent', 'contributeur', 'lecteur'];

describe('accesALaConsole — docs/routes.md:167, le rôle administrateur et lui seul', () => {
	it('ouvre la console à l’administrateur', () => {
		expect(accesALaConsole(identiteAuthentifiee('c-admin', 'administrateur'))).toBe(true);
	});

	it('la ferme aux TROIS autres rôles, un par un', () => {
		/* `referent` est le piège : `resolution.ts` le dit en propres termes —
		   « Seul le rôle `administrateur` contourne : `referent` ne le fait pas,
		   RG-DRO-03 ne le nomme pas ». Aucun compte de la batterie 6 ne le porte,
		   donc aucune de ses 54 adresses ne l'exerce. */
		for (const role of ROLES.filter((r) => r !== 'administrateur')) {
			expect(accesALaConsole(identiteAuthentifiee('c-x', role))).toBe(false);
		}
	});

	it('la ferme à l’anonyme, sans dépendre de la redirection de garde.ts', () => {
		/* `ARB-052` fait rediriger l'anonyme AVANT d'arriver ici. Une garde qui ne
		   tiendrait que par une autre garde n'est pas une garde : si la table des
		   régimes changeait, la console devrait rester fermée. */
		expect(accesALaConsole(ANONYME)).toBe(false);
	});

	it('LA POLARITÉ INVERSE — le droit de dossier le plus fort n’ouvre rien', () => {
		/* `gestionnaire` sur la RACINE couvre tout le sous-arbre (`RG-DRO-05`) et
		   porte les cinq capacités de CDC §2.3, dont « gérer les droits ». Il ne
		   donne AUCUN accès à la console : administrer un dossier n'est pas
		   administrer l'instance. C'est la confusion que cette garde doit refuser,
		   et la batterie 6 la joue sur `/console/univers` seulement. */
		const arbre: readonly DossierDeLArbre[] = [
			{ id: 'd-racine', parentId: null },
			{ id: 'd-fils', parentId: 'd-racine' }
		];
		const droits: readonly DroitExplicite[] = [
			{ dossierId: 'd-racine', compteId: 'c-x', droit: 'gestionnaire' }
		];
		const index = indexerLesDroits(arbre, droits);
		const identite = identiteAuthentifiee('c-x', 'contributeur');

		/* Le droit EST bien résolu — le cas n'est pas vide de sens… */
		expect(perimetreDeLecture(identite, index)).toEqual({
			tout: false,
			dossiers: new Set(['d-racine', 'd-fils'])
		});
		/* …et la console reste fermée. */
		expect(accesALaConsole(identite)).toBe(false);
	});
});

/* ═══════════════════════════════════════════════ La résolution ═════════ */

/**
 * Une base qui REFUSE toute requête.
 *
 * Elle sert à prouver une propriété que la batterie 6 ne peut pas voir : un
 * refus ne lit RIEN. `ADR-006` interdit « toute route qui reçoit une liste puis
 * la filtre » ; ici la question est plus simple encore — un appelant sans droit
 * ne doit pas faire toucher la table du tout. Si un jour la garde passait après
 * la lecture, ce test lèverait au lieu de rendre `INTROUVABLE`.
 */
function baseQuiRefuse(): Base {
	const refuser = (): never => {
		throw new Error('la base ne doit pas être interrogée pour un refus');
	};
	const chaine: Record<string, unknown> = {};
	for (const methode of ['select', 'from', 'innerJoin', 'leftJoin', 'where', 'orderBy', 'limit']) {
		chaine[methode] = refuser;
	}
	chaine['then'] = refuser;
	chaine['execute'] = refuser;
	return chaine as unknown as Base;
}

describe('resoudreLaConsole — un seul objet d’échec, et la base n’est pas lue', () => {
	const contexte = {
		maintenant: new Date('2026-08-13T00:00:00.000Z'),
		seuils: SEUILS_PAR_DEFAUT
	};

	it('rend INTROUVABLE — LE MÊME OBJET — pour les trois rôles non administrateurs', async () => {
		for (const role of ROLES.filter((r) => r !== 'administrateur')) {
			const acces = await resoudreLaConsole(
				baseQuiRefuse(),
				contexte,
				identiteAuthentifiee('c-x', role)
			);
			/* Par IDENTITÉ DE RÉFÉRENCE : un champ « raison » ajouté un jour ferait
			   rougir ce test, et c'est ce que `ADR-007` demande de garantir. */
			expect(acces).toBe(INTROUVABLE);
		}
	});

	it('rend LE MÊME OBJET à l’anonyme qu’au connecté sans droit', async () => {
		const anonyme = await resoudreLaConsole(baseQuiRefuse(), contexte, ANONYME);
		const connecte = await resoudreLaConsole(
			baseQuiRefuse(),
			contexte,
			identiteAuthentifiee('c-x', 'contributeur')
		);
		expect(anonyme).toBe(connecte);
		expect(anonyme).toBe(INTROUVABLE);
	});

	it('l’administrateur, lui, ATTEINT la base — le refus n’est pas un court-circuit universel', async () => {
		/* Sans ce cas, les trois précédents seraient satisfaits par une fonction
		   qui rendrait toujours `INTROUVABLE` : le contrôle serait inerte et
		   vert (`P-26`). La base d'épreuve lève ; c'est la preuve que le chemin
		   administrateur va jusqu'à la lecture. */
		await expect(
			resoudreLaConsole(
				baseQuiRefuse(),
				contexte,
				identiteAuthentifiee('c-admin', 'administrateur')
			)
		).rejects.toThrow('la base ne doit pas être interrogée pour un refus');
	});
});

/* ═══════════════════════════ L'état neutre de l'analytique — P-02 ══════ */

describe('etatDesDonnees — P-02, l’état neutre explicite plutôt qu’un zéro muet', () => {
	it('rend « insuffisantes » sur le recensement RÉEL du dépôt', () => {
		expect(etatDesDonnees()).toBe('insuffisantes');
		expect(vecteurDeV34()).toEqual({ don: 'insuffisantes' });
	});

	it('rend « completes » sur un recensement VIDE — le cas d’épreuve synthétique', () => {
		/* `P-26` : un prédicat sans cas contraire est une règle qu'on espère. Le
		   jour où une migration porterait les cinq mesures, retirer leurs entrées
		   du recensement suffirait à faire basculer l'écran — et c'est ce
		   basculement qui est mesuré ici, indépendamment de l'état du dépôt. */
		expect(etatDesDonnees([])).toBe('completes');
		expect(vecteurDeV34([])).toEqual({ don: 'completes' });
	});

	it('ne bascule PAS sur une lacune qui concerne un autre écran', () => {
		/* Une lacune de V-35 ne dit rien de V-34. Sans ce cas, un prédicat écrit
		   « le recensement est non vide » passerait pour juste. */
		const ailleurs: readonly MesureSansContrepartie[] = [
			{ donnee: 'JOURNAL_IMPORTS', vue: 'V-35', affichage: 'le journal', motif: 'aucune table' }
		];
		expect(etatDesDonnees(ailleurs)).toBe('completes');
	});
});

describe('MESURES_DE_CONSOLE_SANS_CONTREPARTIE — la lacune comptée, jamais racontée', () => {
	it('recense CINQ mesures pour V-34, nommément', () => {
		/* Le nom de chaque donnée est celui que `seeds/corpus.ts` exporte : une
		   migration qui en porterait une devrait retirer son entrée, et ce test
		   la réclamerait. C'est le motif de `DonneeSansContrepartie` d'`accueil.ts`,
		   repris : « qu'une lacune refermée fasse rougir le test au lieu de laisser
		   un commentaire périmé derrière elle ». */
		const v34 = MESURES_DE_CONSOLE_SANS_CONTREPARTIE.filter((m) => m.vue === 'V-34');
		expect(v34.map((m) => m.donnee)).toEqual([
			'RECHERCHES',
			'MESURES_7J',
			'MESURES_7J_PREC',
			'REVISIONS',
			'MODIFICATIONS'
		]);
	});

	it('recense aussi les deux journaux d’imports et l’archive d’export', () => {
		const parVue = (vue: string) =>
			MESURES_DE_CONSOLE_SANS_CONTREPARTIE.filter((m) => m.vue === vue).length;
		expect(parVue('V-35')).toBe(2);
		expect(parVue('V-36')).toBe(1);
	});

	it('chaque entrée dit POURQUOI la base ne peut pas la rendre', () => {
		/* Un recensement sans motif serait une liste de noms : c'est le motif qui
		   permet de savoir, plus tard, si une migration l'a refermé. */
		for (const m of MESURES_DE_CONSOLE_SANS_CONTREPARTIE) {
			expect(m.motif.length).toBeGreaterThan(40);
			expect(m.affichage.length).toBeGreaterThan(10);
		}
	});
});
