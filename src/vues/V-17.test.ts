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
