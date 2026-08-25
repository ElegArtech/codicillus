/**
 * V-13 — LE RANGEMENT SERVI, ET RIEN DU JEU DE DÉMONSTRATION.
 *
 * `T-032` avait mesuré le défaut : `const DOMAINE = 'Infrastructure'` en tête du
 * script faisait rendre l'arborescence d'Infrastructure pour l'adresse de
 * n'importe quel domaine. Une propriété l'a refermé — mais SON DÉFAUT ÉTAIT LA
 * MÊME VALEUR, si bien qu'une route qui l'oubliait retombait exactement sur le
 * défaut mesuré, sans que rien ne proteste.
 *
 * `domaine`, `universDuDomaine`, `modifications` et `origineDuDroit` SONT
 * REQUISES. Le compilateur garde la porte (`svelte-check`, dans `pnpm check`),
 * et ces cas éprouvent les deux moitiés qui restent : la propriété servie décide,
 * et rien du jeu n'atteint l'écran quand elle ne le porte pas.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { fermerLeHarnais, rendreLaVue } from './harnais.test-utils';
import { corpusPourVue, MODIFICATIONS, MOI, UNIVERS } from '../../seeds/corpus';
import type { CompteAffiche } from '../lib/coquille/identite';
import { cheminAffiche, segmentsAffiches, type LigneDeDossier } from '../lib/donnees/rangement';

const NOTES = corpusPourVue('V-13');

/**
 * L'identité dans la forme que la coquille affiche. Elle n'est pas `MOI` : le
 * défaut mesuré était que `MOI` s'affichait quel que fût l'appelant.
 */
const SOPHIE: CompteAffiche = {
	nom: 'Sophie Nguyen',
	initiales: 'SN',
	domaine: 'Applications',
	role: 'Administrateur'
};

/**
 * LE SOCLE DE RENDU — tout ce que la vue exige, et rien de plus. Le vecteur
 * nomme `Exploitation`, dossier que le corpus range sous Infrastructure : c'est
 * la valeur que le vecteur posait lui-même en défaut, et elle est désormais
 * écrite là où elle se lit.
 */
const SOCLE = {
	vecteur: { dos: 'Exploitation' },
	notes: NOTES,
	domaine: 'Infrastructure',
	universDuDomaine: 'Production',
	modifications: MODIFICATIONS,
	origineDuDroit: ''
};

function rendu(proprietes: Record<string, unknown>): Promise<string> {
	return rendreLaVue('V-13', { ...SOCLE, ...proprietes });
}

/**
 * Le fil d'Ariane seul, découpé du rendu.
 *
 * Ces cas repéraient un segment du fil par un lien sans destination : le gel n'y
 * en déclarait aucune, et le lien mort faisait un marqueur unique. Le fil porte
 * désormais de vraies adresses, et le marqueur ne peut plus être une
 * destination. Ce qui est éprouvé est INCHANGÉ — quel nom le fil porte —, et le
 * découpage rend au marqueur l'unicité que le lien mort lui donnait : le rail
 * nomme les mêmes domaines, mais hors de ce bloc de navigation.
 */
function filDe(html: string): string {
	return /<nav class="fil"[\s\S]*?<\/nav>/.exec(html)?.[0] ?? '';
}

afterAll(fermerLeHarnais);

describe('V-13 — la propriété servie décide', () => {
	it('sert le compte reçu, et n’annonce personne sans compte', async () => {
		const html = await rendu({ compte: SOPHIE });
		expect(html).toContain('Sophie Nguyen — menu utilisateur');
		expect(html).not.toContain(`${MOI.nom} — menu utilisateur`);
		expect(await rendu({})).not.toContain(`${MOI.nom} — menu utilisateur`);
	});

	/**
	 * LE DÉFAUT DE `T-032`, DANS LES DEUX POLARITÉS. Le dossier demandé —
	 * `Exploitation` — n'existe QUE dans Infrastructure : sous un autre domaine,
	 * la page rend son état sans sous-dossier.
	 */
	it('range la page dans le domaine reçu, jamais dans Infrastructure', async () => {
		/* Le témoin de polarité — sans lui, les assertions négatives qui suivent
		   passeraient même si la propriété était inerte (P-5). */
		const infra = await rendu({});
		expect(filDe(infra)).toContain('>Infrastructure</a>');
		expect(infra).toContain('<b>2</b> sous-dossiers');

		const html = await rendu({ domaine: 'Applications' });
		expect(filDe(html)).toContain('>Applications</a>');
		expect(filDe(html)).not.toContain('>Infrastructure</a>');
		expect(html).toContain('<b>0</b> sous-dossier');
	});

	/**
	 * L'UNIVERS DU FIL VIENT DE L'ADRESSE, ET DE NULLE PART AILLEURS. Il était
	 * cherché dans `domaines` — que la route ne passe pas —, donc dans la
	 * constante du jeu, avec « Production » pour dernier repli : sur un domaine
	 * absent du jeu, tous les liens de la page rendaient 404.
	 */
	it('l’univers du fil est celui de l’adresse', async () => {
		const html = await rendu({ domaine: 'Migration 2026', universDuDomaine: 'Projets' });
		expect(filDe(html)).toContain('>Projets</a>');
		expect(filDe(html)).not.toContain('>Production</a>');
	});

	it('sert la table de modifications reçue', async () => {
		expect(await rendu({})).not.toContain('modification inconnue');
		/* Une table PARTIELLE est admise, et ce qu'elle ne porte pas se DIT
		   plutôt que de se combler par une valeur d'illustration (P-02). */
		expect(await rendu({ modifications: {} })).toContain('modification inconnue');
	});

	/**
	 * LE LIBELLÉ DE JOUR ZÉRO. `joursEcoules()` rend 0 en deçà de vingt-quatre
	 * heures, et la vue disait « modifiée hier » d'une note modifiée le jour même.
	 */
	it('une modification du jour se dit « aujourd’hui », jamais « hier »', async () => {
		const dansExploitation = NOTES.filter((n) => n.dossier === 'Exploitation');
		const premiere = dansExploitation[0];
		if (premiere === undefined) throw new Error('le corpus de V-13 ne porte pas Exploitation');
		const html = await rendu({ modifications: { [premiere.id]: 0 } });
		expect(html).toContain("modifiée aujourd'hui");
	});

	/**
	 * L'ORIGINE DU DROIT — celle que la route résout, et rien d'autre. Le gel fige
	 * « — hérité du domaine Infrastructure », et cette tournure était le REPLI de
	 * la propriété : un droit accordé ailleurs, sur une instance qui ne porte pas
	 * ce domaine, affichait quand même cet héritage-là.
	 */
	it('l’origine du droit est celle qui est servie, et la chaîne vide se tait', async () => {
		const muet = await rendu({ vecteur: { dos: 'Exploitation', dr: 'lecteur' } });
		expect(muet).not.toContain('hérité du domaine Infrastructure');

		const dit = await rendu({
			vecteur: { dos: 'Exploitation', dr: 'lecteur' },
			origineDuDroit: '— hérité du dossier Sauvegardes'
		});
		expect(dit).toContain('— hérité du dossier Sauvegardes');
	});

	/** Vue de forme ABRÉGÉE : `univers` ne sert pas au rail (`Coquille.svelte`). */
	it('accepte la liste d’univers reçue sans rien changer au rail abrégé', async () => {
		const restreint = await rendu({ univers: UNIVERS.filter((u) => u.nom === 'Projets') });
		expect(restreint).toEqual(await rendu({}));
	});

	/**
	 * LE CONTRÔLE QUI TIENT LE LOT : sur un rangement servi qui ne porte rien du
	 * jeu, rien du jeu ne doit apparaître. Un défaut de propriété resté quelque
	 * part se verrait ici, et nulle part ailleurs.
	 *
	 * LA MESURE EST DÉCOUPÉE SUR LE CONTENU ET LE FIL, ET C'EST DÉCLARÉ. Le rail
	 * de forme ABRÉGÉE est une DONNÉE écrite au balisage du gel
	 * (`arborescence-abregee.ts`) : hors gabarit racine — ce que rend ce
	 * harnais —, il nomme les dossiers du gel. En application il suit la base
	 * (`Coquille.svelte`, `sectionsAbregeesDuCorpus`). Mesurer le document
	 * entier mesurerait ce balisage, pas les propriétés de la vue.
	 */
	it('aucune ligne du jeu de démonstration n’atteint le contenu', async () => {
		const html = await rendu({
			vecteur: { dos: '' },
			notes: [],
			domaine: 'Migration 2026',
			universDuDomaine: 'Projets',
			modifications: {}
		});
		const contenu = /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? '';
		expect(contenu).not.toContain('Infrastructure');
		expect(contenu).not.toContain('Restaurer une sauvegarde PostgreSQL');
		expect(filDe(html)).not.toContain('>Production</a>');
		expect(filDe(html)).not.toContain('>Infrastructure</a>');
		expect(html).not.toContain('Karim Belhadj — menu utilisateur');
		expect(html).not.toContain('Codicillus 1.0.0');
	});
});

/**
 * LA PAGE DE LA RACINE D'UN DOMAINE — et la forme éprouvée est PRODUITE, non
 * recopiée.
 *
 * Le défaut mesuré : `noeudDe([])` sortait de sa boucle sans rien trouver, donc
 * la racine n'annonçait jamais ses sous-dossiers et son titre était vide. On
 * créait un dossier, il disparaissait de l'écran qui venait de le créer.
 *
 * CE QUI FAIT LA VALEUR DE CE CAS, C'EST QU'IL NE FABRIQUE PAS SON ENTRÉE. La
 * suite vide de la racine et la chaîne vide du vecteur ne sont pas écrites ici :
 * elles sortent de `segmentsAffiches()` et de `cheminAffiche()`, les deux
 * fonctions que le chargeur appelle pour composer `rangement.destinations` et
 * `vecteur.dos`. Un cas qui poserait la chaîne vide à la main partagerait avec
 * le code l'hypothèse qu'il prétend éprouver.
 */
const LIGNES: readonly LigneDeDossier[] = [
	{
		id: 'r-infra',
		parentId: null,
		domaineId: 'd1',
		nom: 'Infrastructure',
		profondeur: 1,
		position: 0
	},
	{
		id: 'expl',
		parentId: 'r-infra',
		domaineId: 'd1',
		nom: 'Exploitation',
		profondeur: 2,
		position: 0
	},
	{ id: 'serv', parentId: 'r-infra', domaineId: 'd1', nom: 'Serveurs', profondeur: 2, position: 1 },
	{ id: 'sauv', parentId: 'expl', domaineId: 'd1', nom: 'Sauvegardes', profondeur: 3, position: 0 }
];

/** Exactement ce que le chargeur compose, par les mêmes fonctions que lui. */
function rangementDe(dossierId: string): Record<string, unknown> {
	return {
		destinations: LIGNES.map((d) => ({
			id: d.id,
			segments: segmentsAffiches(LIGNES, d.id),
			refus: null
		})),
		dossierId,
		parentId: LIGNES.find((d) => d.id === dossierId)?.parentId ?? ''
	};
}

function renduDe(dossierId: string): Promise<string> {
	return rendreLaVue('V-13', {
		vecteur: { dos: cheminAffiche(segmentsAffiches(LIGNES, dossierId)), dr: 'gestionnaire' },
		notes: NOTES,
		domaine: 'Infrastructure',
		universDuDomaine: 'Production',
		modifications: MODIFICATIONS,
		origineDuDroit: '',
		rangement: rangementDe(dossierId)
	});
}

describe('V-13 — la racine d’un domaine se comporte comme un dossier', () => {
	it('liste ses sous-dossiers et porte le nom du domaine', async () => {
		const html = await renduDe('r-infra');
		expect(html).toContain('<b>2</b> sous-dossiers');
		expect(html).toContain('<span id="titre">Infrastructure</span>');
		expect(html).toContain('Exploitation');
		expect(html).toContain('Serveurs');
	});

	it('n’annonce plus « aucun sous-dossier » sur une racine qui en porte', async () => {
		/* Le bloc d'état vide est rendu masqué : c'est son attribut qu'on lit, non
		   sa présence. */
		expect(await renduDe('r-infra')).toContain('id="bloc-vide" hidden');
	});

	/**
	 * `renommerOuDeplacerUnDossier()` et `supprimerUnDossier()` refusent MUETTEMENT
	 * tout dossier sans parent. Les deux gestes sont donc omis sur la racine, avec
	 * leurs dialogues — `P-03`, `P-09`.
	 */
	it('n’offre ni « Renommer ou déplacer » ni « Supprimer » sur la racine', async () => {
		const racine = await renduDe('r-infra');
		expect(racine).not.toContain('id="a-renommer"');
		expect(racine).not.toContain('id="a-supprimer"');
		expect(racine).not.toContain('id="dlg-deplacer"');
		expect(racine).not.toContain('id="dlg-supprimer"');
		/* Le témoin de polarité : les deux gestes existent bien un niveau plus bas. */
		const enfant = await renduDe('expl');
		expect(enfant).toContain('id="a-renommer"');
		expect(enfant).toContain('id="a-supprimer"');
	});

	it('nomme le domaine comme parent du sous-dossier à créer', async () => {
		expect(await renduDe('r-infra')).toContain('id="creer-parent">Infrastructure<');
		expect(await renduDe('expl')).toContain('id="creer-parent">Exploitation<');
	});

	it('n’a pas fait régresser un dossier de profondeur 2', async () => {
		const html = await renduDe('expl');
		expect(html).toContain('<b>1</b> sous-dossier');
		expect(html).toContain('<span id="titre">Exploitation</span>');
	});
});
