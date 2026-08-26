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
import { corpsDeLaSaisie } from '../lib/donnees/creation';
import { corpsRendu } from '../lib/donnees/note';
import {
	corpusPourVue,
	DOMAINES,
	MOI,
	noteParIdentifiant,
	TEMPLATES,
	TYPES_FICHE,
	TYPES_NOTE,
	UNIVERS,
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

/** Le cas « modification » de la planche — le seul qui montre une note. */
const MODIF = { cas: 'modif' };

const AUTRE_NOTE = (() => {
	const note = noteParIdentifiant('n-astreinte');
	if (!note) throw new Error('seeds/corpus.ts : « n-astreinte » a disparu');
	return note;
})();

/** La note que le gel nomme en modification — celle qui était le REPLI. */
const NOTE_DU_GEL = (() => {
	const note = noteParIdentifiant('n-planifier-sauv');
	if (!note) throw new Error('seeds/corpus.ts : « n-planifier-sauv » a disparu');
	return note;
})();

/**
 * LE SOCLE DE PROPRIÉTÉS REQUISES, ET IL EST EXPLICITE.
 *
 * Le contexte, les trois référentiels et l'arborescence de choix avaient pour
 * DÉFAUT les constantes du jeu de démonstration : une route qui les oubliait
 * ouvrait l'éditeur sur le domaine de « Karim Belhadj », avec les types et les
 * gabarits des maquettes. Les deux routes les passent ; elles sont REQUISES, et
 * ce socle les nomme au lieu de les laisser tomber d'un défaut.
 */
function rendu(proprietes: Record<string, unknown>): Promise<string> {
	return rendreLaVue('V-17', {
		vecteur: null,
		notes: NOTES,
		domaines: DOMAINES,
		universDuCompte: 'Production',
		dossiersParDomaine: null,
		compte: MOI,
		corps: '',
		typesNote: TYPES_NOTE,
		typesFiche: TYPES_FICHE,
		templates: TEMPLATES,
		...proprietes
	});
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
		/* LE CORPS EST CELUI QUE LA ROUTE SERT, et il ne se déduit plus de
		   l'extrait : la vue écrivait l'extrait en tête d'un corps de
		   démonstration, ce qui donnait au fait éprouvé un marqueur qui n'était
		   pas le sien. */
		const html = await rendu({
			vecteur: MODIF,
			noteModifiee: AUTRE_NOTE,
			corps: `<p>${AUTRE_NOTE.extrait}</p>`
		});
		expect(html).toContain(AUTRE_NOTE.titre);
		expect(html).not.toContain(NOTE_DU_GEL.titre);
		expect(html).toContain(AUTRE_NOTE.extrait);
	});

	it('date le dernier enregistrement servi, et jamais un autre', async () => {
		const html = await rendu({
			vecteur: MODIF,
			noteModifiee: AUTRE_NOTE,
			dernierEnregistrement: 77
		});
		expect(html).toContain('dernière version il y a 77 jours');
	});

	/** Vue de forme ABRÉGÉE : `univers` ne sert pas au rail (`Coquille.svelte`). */
	it('accepte la liste d’univers reçue sans rien changer au rail abrégé', async () => {
		const restreint = await rendu({ univers: UNIVERS.filter((u) => u.nom === 'Projets') });
		expect(restreint).toEqual(await rendu({}));
	});
});

/**
 * LE MOTIF EST RETIRÉ, ET C'EST CE QUE CETTE SECTION MESURE.
 *
 * Chaque propriété portait pour défaut une constante du jeu de démonstration —
 * `MOI`, `INSTANCE`, `DOMAINES`, `TYPES_NOTE`, `TEMPLATES`, la note
 * `n-planifier-sauv` et la table d'ancienneté des trente-deux notes du gel.
 * Une route qui les oubliait servait donc les maquettes SANS QUE RIEN NE
 * PROTESTE. Ce qui reste optionnel rend VIDE.
 */
describe('V-17 — rien du jeu de démonstration ne subsiste au défaut', () => {
	it('rend les domaines et les référentiels SERVIS, et rien d’autre', async () => {
		const html = await rendu({});
		for (const d of DOMAINES) expect(html).toContain(`${d.univers} › ${d.nom}`);
		for (const t of TYPES_NOTE) expect(html).toContain(`<option value="${t}"`);
	});

	it('rend les gabarits servis dans l’état qui les montre', async () => {
		const html = await rendu({ vecteur: { cas: 'template' } });
		for (const g of TEMPLATES) expect(html).toContain(g.type);
		expect(html).toContain('Fiche applicative');
	});

	it('ne rouvre aucune note tant qu’aucune ne lui est passée', async () => {
		const html = await rendu({ vecteur: MODIF });
		expect(html).not.toContain(NOTE_DU_GEL.titre);
		expect(html).toContain('Aucune modification');
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
		const socle = {
			vecteur: MODIF,
			noteModifiee: NOTE_DU_GEL,
			dossiersParDomaine: ARBRE_DE_CHOIX
		};
		const sans = await rendu(socle);
		const html = await rendu({ ...socle, dossierDeDepart: 'Réseau' });
		expect(dossiersCoches(html)).toEqual(['Réseau']);
		expect(dossiersCoches(sans)).not.toEqual(['Réseau']);
	});
});

/**
 * LE CORPS RÉDIGÉ — LE DÉFAUT LE PLUS VISIBLE DE CETTE VUE, ET IL ÉTAIT SERVI.
 *
 * La zone de rédaction recevait, sous `cas: 'modif'`, un corps ÉCRIT DANS LA
 * VUE : l'extrait de la note suivi des sections d'une procédure de
 * démonstration — « Déclarer le serveur », « Vérifier le premier passage », la
 * configuration de Barman. Le chargeur de `/notes/{identifiant}/modifier` pose
 * ce vecteur sur TOUTE modification : ouvrir n'importe quelle note affichait
 * donc ce corps-là. Le câblage le remplaçait au montage, ce qui en faisait un
 * flash avec JavaScript et un contenu PERMANENT sans lui.
 *
 * Ce qui est éprouvé ici : le corps servi est celui qui est rendu, et RIEN
 * n'est rendu quand rien n'est servi.
 */
describe('V-17 — le corps rédigé vient de la route, jamais de la vue', () => {
	/** La zone de rédaction seule — le reste de l'écran ne porte pas de corps. */
	function redactionDe(html: string): string {
		return (
			/<div class="prose redaction si-redaction"[\s\S]*?<div class="prose si-apercu"/.exec(
				html
			)?.[0] ?? ''
		);
	}

	it('rend le corps servi, et le signale non vide', async () => {
		const zone = redactionDe(
			await rendu({
				vecteur: MODIF,
				noteModifiee: AUTRE_NOTE,
				corps: '<h2>Le titre de la note ouverte</h2>'
			})
		);
		expect(zone).toContain('<h2>Le titre de la note ouverte</h2>');
		expect(zone).toContain('data-vide="non"');
	});

	it('ne rend RIEN de la procédure de démonstration, en modification comme à la création', async () => {
		for (const vecteur of [null, MODIF]) {
			const html = await rendu({ vecteur, noteModifiee: AUTRE_NOTE });
			expect(html).not.toContain('Déclarer le serveur');
			expect(html).not.toContain('Vérifier le premier passage');
			expect(html).not.toContain('configuration de Barman');
			expect(html).not.toContain('La sauvegarde apparaît dans la liste');
		}
	});

	/**
	 * LE CORPS D'UNE NOTE CRÉÉE SANS CORPS — PRODUIT PAR SA SOURCE, JAMAIS
	 * ÉCRIT ICI.
	 *
	 * Un corps fabriqué par le test ne prouverait rien de la forme réelle, et
	 * le défaut tenait précisément à ce que cette forme n'est pas celle qu'on
	 * croit : `creerUneNote()` n'écrit JAMAIS NULL, elle écrit ce que
	 * `corpsDeLaSaisie('')` rend. C'est `corpsRendu()` qui en tire les deux
	 * drapeaux que la route lit.
	 */
	const CORPS_SANS_TEXTE = corpsRendu(corpsDeLaSaisie(''), 'reference', () => null);

	it('la note créée sans corps EXISTE sans être RÉDIGÉE — les deux drapeaux diffèrent', () => {
		expect(CORPS_SANS_TEXTE.existe).toBe(true);
		expect(CORPS_SANS_TEXTE.redige).toBe(false);
		/* Son HTML n'est pas vide pour autant : c'est le paragraphe sans texte de
		   `corpsVide()`. Servi tel quel, il faisait déclarer la zone NON vide et
		   privait la note neuve de son invite d'amorçage. */
		expect(CORPS_SANS_TEXTE.html).not.toBe('');
	});

	it('laisse la zone VIDE et son invite pour une note créée sans corps', async () => {
		/* CE QUE LA ROUTE SERT — `modifier/+page.server.ts` : le HTML si le corps
		   est RÉDIGÉ, la chaîne vide sinon. Sur `existe`, cette expression
		   rendait le paragraphe vide, et l'invite ne paraissait jamais. */
		const servi = CORPS_SANS_TEXTE.redige ? CORPS_SANS_TEXTE.html : '';
		const zone = redactionDe(
			await rendu({ vecteur: MODIF, noteModifiee: AUTRE_NOTE, corps: servi })
		);
		expect(zone).toContain('data-vide="oui"');
		expect(zone).toContain('data-invite="');
	});
});
