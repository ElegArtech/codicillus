/**
 * V-17 — LES PROPRIÉTÉS DE CONTEXTE, LES RÉFÉRENTIELS ET LA NOTE (T-042).
 *
 * L'ÉDITEUR EST RENDU CAPABLE, AUCUNE SAISIE N'EST ÉCRITE : la conversion à la
 * frappe, l'auto-complétion de lien interne et l'enregistrement restent des
 * comportements (ARB-011).
 *
 * `compte` COMMANDE ICI DAVANTAGE QUE LA PASTILLE. Une note vierge s'ouvre dans
 * le domaine de l'utilisateur courant (`V-17:3537`), et l'arborescence du choix
 * de dossier s'en déduit : la propriété n'est donc pas décorative, elle change
 * ce que l'écran propose.
 *
 * CE QUE CE FICHIER PROUVE, ET RIEN D'AUTRE : la propriété fournie l'emporte,
 * la propriété absente retombe sur la constante du jeu. La conformité de rendu
 * est mesurée par `pnpm verif:maquette V-17 --contre=app`, et par lui seul.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { fermerLeHarnais, rendreLaVue } from './harnais.test-utils';
import {
	corpusPourVue,
	DOMAINES,
	INSTANCE,
	MOI,
	noteParIdentifiant,
	TEMPLATES,
	TYPES_NOTE,
	UNIVERS,
	type EtatDInstance,
	type UtilisateurCourant
} from '../../seeds/corpus';

const NOTES = corpusPourVue('V-17');

const SOPHIE: UtilisateurCourant = {
	prenom: 'Sophie',
	nom: 'Sophie Nguyen',
	initiales: 'SN',
	domaine: 'Applications',
	role: 'Administrateur'
};

const AUTRE_INSTANCE: EtatDInstance = { version: '9.9.9-epreuve', synchro: "à l'instant" };

/** Le cas « modification » de la planche — le seul qui montre une note. */
const MODIF = { cas: 'modif' };

const AUTRE_NOTE = (() => {
	const note = noteParIdentifiant('n-astreinte');
	if (!note) throw new Error('seeds/corpus.ts : « n-astreinte » a disparu');
	return note;
})();

function rendu(proprietes: Record<string, unknown>): Promise<string> {
	return rendreLaVue('V-17', { vecteur: null, notes: NOTES, ...proprietes });
}

/**
 * Le fil d'Ariane seul, découpé du rendu — même raison qu'en `V-13.test.ts` :
 * le segment était repéré par `<a href="#">Nom</a>`, et le fil porte désormais
 * de vraies adresses (plan de remédiation §3.6). Le fait éprouvé ne change pas,
 * seul le marqueur ; le découpage lui rend son unicité, le rail nommant les
 * mêmes domaines hors de ce `<nav>`.
 */
function filDe(html: string): string {
	return /<nav class="fil"[\s\S]*?<\/nav>/.exec(html)?.[0] ?? '';
}

afterAll(fermerLeHarnais);

describe('V-17 — la propriété fournie l’emporte', () => {
	it('sert le compte reçu, et non celui du jeu de semence', async () => {
		const html = await rendu({ compte: SOPHIE });
		expect(html).toContain('Sophie Nguyen — menu utilisateur');
		expect(html).not.toContain(`${MOI.nom} — menu utilisateur`);
	});

	it('ouvre la note vierge dans le domaine du compte reçu', async () => {
		expect(filDe(await rendu({}))).toContain(`>${MOI.domaine}</a>`);
		const html = await rendu({ compte: SOPHIE });
		expect(filDe(html)).toContain(`>${SOPHIE.domaine}</a>`);
		expect(filDe(html)).not.toContain(`>${MOI.domaine}</a>`);
	});

	it('sert la version d’instance reçue', async () => {
		expect(await rendu({ instance: AUTRE_INSTANCE })).toContain('9.9.9-epreuve');
	});

	it('peuple le choix de domaine avec la liste reçue', async () => {
		const html = await rendu({ domaines: DOMAINES.filter((d) => d.univers === 'Projets') });
		expect(html).toContain('Projets › Migration 2026');
		expect(html).not.toContain('Production › Infrastructure');
	});

	it('peuple les types de note et de fiche avec ceux reçus', async () => {
		const html = await rendu({ typesNote: ['Guide'], typesFiche: { Serveur: [] } });
		expect(html).toContain('<option value="Guide"');
		expect(html).not.toContain('<option value="Procédure"');
		expect(html).toContain('<option value="Serveur"');
		expect(html).not.toContain('<option value="Contact"');
	});

	/**
	 * LE CHOISISSEUR DE GABARIT N'EXISTE QUE DANS L'ÉTAT `cas-template` : le
	 * dialogue est passé en `superposition`, et les cinq autres états ne le
	 * rendent pas. Mesurer les gabarits ailleurs ne mesurerait rien (P-5).
	 */
	it('peuple le choix de gabarit avec les gabarits reçus', async () => {
		const gel = await rendu({ vecteur: { cas: 'template' } });
		expect(gel).toContain('Fiche applicative');

		const html = await rendu({
			vecteur: { cas: 'template' },
			templates: TEMPLATES.filter((g) => g.id === 'procedure')
		});
		expect(html).not.toContain('Fiche applicative');
	});

	it('rouvre la note reçue, et non celle que le gel nomme', async () => {
		const gel = await rendu({ vecteur: MODIF });
		expect(gel).toContain('Planifier une sauvegarde Barman');

		const html = await rendu({ vecteur: MODIF, noteModifiee: AUTRE_NOTE });
		expect(html).toContain(AUTRE_NOTE.titre);
		expect(html).not.toContain('Planifier une sauvegarde Barman');
		expect(html).toContain(AUTRE_NOTE.extrait);
	});

	it('lit l’ancienneté de version dans la table de modifications reçue', async () => {
		const html = await rendu({ vecteur: MODIF, modifications: { 'n-planifier-sauv': 77 } });
		expect(html).toContain('dernière version il y a 77 jours');
	});

	/** Vue de forme ABRÉGÉE : `univers` ne sert pas au rail (`Coquille.svelte`). */
	it('accepte la liste d’univers reçue sans rien changer au rail abrégé', async () => {
		const restreint = await rendu({ univers: UNIVERS.filter((u) => u.nom === 'Projets') });
		expect(restreint).toEqual(await rendu({}));
	});
});

describe('V-17 — la propriété absente retombe sur la constante du jeu', () => {
	it('rend le compte, la version, les domaines et les référentiels du jeu', async () => {
		const html = await rendu({});
		expect(html).toContain(`${MOI.nom} — menu utilisateur`);
		expect(html).toContain(INSTANCE.version);
		for (const d of DOMAINES) expect(html).toContain(`${d.univers} › ${d.nom}`);
		for (const t of TYPES_NOTE) expect(html).toContain(`<option value="${t}"`);
	});

	it('rend les gabarits du jeu de semence dans l’état qui les montre', async () => {
		const html = await rendu({ vecteur: { cas: 'template' } });
		for (const g of TEMPLATES) expect(html).toContain(g.type);
		expect(html).toContain('Fiche applicative');
	});

	it('rouvre la note que le gel nomme, avec son ancienneté de version', async () => {
		const html = await rendu({ vecteur: MODIF });
		expect(html).toContain('Planifier une sauvegarde Barman');
		expect(html).toContain('dernière version il y a');
	});
});

/**
 * LE DOSSIER DE DÉPART — `?dossier=`, et le défaut qu'il répare.
 *
 * `dossierChoisi` était une valeur DÉRIVÉE, nulle hors du cas `modif` : en
 * création aucun bouton radio n'était jamais coché, et rien ne pouvait le
 * changer. La page d'un dossier promet pourtant « nouvelle note DANS CE
 * DOSSIER » (`V-13:2379`, `docs/routes.md:288`) ; l'éditeur s'ouvrait sur le
 * DOMAINE seulement, à charge pour qui rédige de retrouver son dossier.
 *
 * Ce qui est éprouvé ici, et rien d'autre : la propriété absente ne change pas
 * un octet du rendu, la propriété posée coche son dossier — et lui seul.
 */
const ARBRE_DE_CHOIX = {
	[MOI.domaine]: [
		{ nom: MOI.domaine, notes: 1, enfants: [] },
		{ nom: 'Serveurs', notes: 0, enfants: [{ nom: 'Bases', notes: 2, enfants: [] }] },
		{ nom: 'Réseau', notes: 3, enfants: [] }
	]
};

/** Les dossiers cochés du rendu, dans l'ordre où l'arborescence les rend. */
function dossiersCoches(html: string): readonly string[] {
	const coches: string[] = [];
	const motif = /name="choix-de-dossier"([^>]*)><span>([^<]*)<\/span>/g;
	for (const trouve of html.matchAll(motif)) {
		if ((trouve[1] ?? '').includes('checked')) coches.push(trouve[2] ?? '');
	}
	return coches;
}

describe('V-17 — le dossier de départ', () => {
	it('ne coche aucun dossier quand la propriété est absente', async () => {
		expect(dossiersCoches(await rendu({ dossiersParDomaine: ARBRE_DE_CHOIX }))).toEqual([]);
	});

	it('coche le dossier reçu, et lui seul', async () => {
		const html = await rendu({
			dossiersParDomaine: ARBRE_DE_CHOIX,
			dossierDeDepart: 'Serveurs › Bases'
		});
		expect(dossiersCoches(html)).toEqual(['Bases']);
	});

	it('coche la racine du domaine, qui est un chemin et non une absence', async () => {
		const html = await rendu({
			dossiersParDomaine: ARBRE_DE_CHOIX,
			dossierDeDepart: MOI.domaine
		});
		expect(dossiersCoches(html)).toEqual([MOI.domaine]);
	});

	it('ne coche rien d’un chemin qui ne désigne aucun dossier', async () => {
		const html = await rendu({
			dossiersParDomaine: ARBRE_DE_CHOIX,
			dossierDeDepart: 'Serveurs › Disparu'
		});
		expect(dossiersCoches(html)).toEqual([]);
	});

	it('absente, elle ne change pas un octet du rendu — création comme modification', async () => {
		expect(await rendu({ dossierDeDepart: null })).toEqual(await rendu({}));
		expect(await rendu({ vecteur: MODIF, dossierDeDepart: null })).toEqual(
			await rendu({ vecteur: MODIF })
		);
	});

	it('l’emporte sur le dossier de la note reprise en modification', async () => {
		const gel = await rendu({ vecteur: MODIF, dossiersParDomaine: ARBRE_DE_CHOIX });
		const html = await rendu({
			vecteur: MODIF,
			dossiersParDomaine: ARBRE_DE_CHOIX,
			dossierDeDepart: 'Réseau'
		});
		expect(dossiersCoches(html)).toEqual(['Réseau']);
		expect(dossiersCoches(gel)).not.toEqual(['Réseau']);
	});
});
