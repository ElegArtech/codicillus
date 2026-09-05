/**
 * V-15 — L'HISTORIQUE EST UNE PAGE, ET ELLE DIT LA VÉRITÉ DE *CETTE* NOTE.
 *
 * LE DÉFAUT QUE CE FICHIER GARDE FERMÉ. L'historique était un tiroir superposé à
 * `/notes/{identifiant}` : sans adresse propre, sans fil qui le nomme, et rendu
 * SANS la note dont il parlait — le bloc partagé retombait alors sur la note de
 * démonstration, si bien que `?version` affichait « Restaurer une sauvegarde
 * PostgreSQL » sous le fil d'Ariane d'une autre note. `note` est désormais
 * REQUISE, et rien du jeu ne peut plus prendre sa place.
 *
 * CE QUE CES CAS ÉPROUVENT — le RENDU, à partir d'états construits ici : le fil,
 * son ordre, le glyphe de chaque événement, le titre coloré à partir d'« À
 * vérifier », la pastille de version et son panneau de comparaison, l'état vide
 * qui NOMME son geste. Ils n'éprouvent RIEN de ce que le chargeur tire de la
 * base : cela se mesure sur une base réelle, dans un navigateur.
 *
 * LES DEUX POLARITÉS SONT JOUÉES (`P-5`) : le panneau de comparaison est rendu
 * quand la comparaison est servie, et ABSENT quand elle ne l'est pas — un rendu
 * qui l'écrirait toujours passerait pour juste.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { fermerLeHarnais, rendreLaVue } from './harnais.test-utils';
import { corpusPourVue, noteParIdentifiant } from '../../seeds/corpus';

const NOTES = corpusPourVue('V-15');

/** LA NOTE DU JEU DE DÉMONSTRATION — celle qui ne doit plus jamais paraître. */
const NOTE_DU_GEL = (() => {
	const note = noteParIdentifiant('n-restaurer-pg');
	if (!note) throw new Error('seeds/corpus.ts : « n-restaurer-pg » a disparu');
	return note;
})();

/** La note dont l'historique est ouvert — jamais celle de la démonstration. */
const LA_NOTE = (() => {
	const note = noteParIdentifiant('n-mot-de-passe');
	if (!note) throw new Error('seeds/corpus.ts : « n-mot-de-passe » a disparu');
	return note;
})();

const ADRESSE = `/notes/${LA_NOTE.id}`;

const ONGLETS = [
	{ libelle: 'Tous', actif: true, adresse: `${ADRESSE}/historique` },
	{ libelle: 'Référence', actif: false, adresse: `${ADRESSE}/historique?registre=reference` },
	{
		libelle: 'Opérationnel',
		actif: false,
		adresse: `${ADRESSE}/historique?registre=operationnel`
	}
];

/** Le socle d'un événement — chaque cas n'écrase que ce qu'il éprouve. */
function evenement(surcharge: Record<string, unknown>): Record<string, unknown> {
	return {
		cle: 'e-1',
		date: '13 août 2026',
		registre: 'Référence',
		etat: null,
		titre: 'Création de la note',
		detail: 'Rédigée par Alexandre Berge dans Claude › audit_code.',
		version: null,
		adresseComparaison: '',
		libelleComparaison: 'Comparer avec la version précédente',
		comparaison: null,
		adresseRestauration: '',
		restaurationDepliee: false,
		numero: '',
		...surcharge
	};
}

function rendu(proprietes: Record<string, unknown>): Promise<string> {
	return rendreLaVue('V-15', {
		note: LA_NOTE,
		notes: NOTES,
		adresseDeLaNote: ADRESSE,
		onglets: ONGLETS,
		evenements: [],
		vide: null,
		...proprietes
	});
}

afterAll(fermerLeHarnais);

describe('V-15 — la page nomme la note dont elle montre l’historique', () => {
	it('rend le titre de la note reçue, et le fil se ferme sur « historique »', async () => {
		const html = await rendu({});
		expect(html).toContain(`<h1 class="hist__titre">${LA_NOTE.titre}</h1>`);
		expect(html).toContain('<span class="fil__courant">historique</span>');
	});

	it('ne laisse rien de la note de démonstration', async () => {
		const html = await rendu({});
		expect(html).not.toContain(NOTE_DU_GEL.titre);
		expect(html).not.toContain('Karim Belhadj');
	});

	it('pose « ← Retour à la note » sur l’adresse servie', async () => {
		const html = await rendu({});
		expect(html).toContain(`href="${ADRESSE}"`);
		expect(html).toContain('Retour à la note');
	});

	/** La phrase d'explication de la référence, au mot près. */
	it('porte le label mono et la phrase d’explication', async () => {
		const html = await rendu({});
		expect(html).toContain('Historique');
		expect(html).toContain('Chaque registre a son propre cycle.');
	});
});

describe('V-15 — le fil rend ce que le chargeur lui donne, et rien de plus', () => {
	it('rend les événements dans l’ordre servi, sans les retrier', async () => {
		const html = await rendu({
			evenements: [
				evenement({ cle: 'a', date: '4 septembre 2026', titre: 'Le plus récent' }),
				evenement({ cle: 'b', date: '13 août 2026', titre: 'Le plus ancien' })
			]
		});
		expect(html.indexOf('Le plus récent')).toBeLessThan(html.indexOf('Le plus ancien'));
	});

	/**
	 * LE GLYPHE VIENT DE LA FABRIQUE UNIQUE. Un événement d'état rend le glyphe
	 * de vivacité et sa classe de teinte ; un événement qui ne change aucun cycle
	 * — une version, une création — rend le jalon neutre.
	 */
	it('rend le glyphe de l’état, et le jalon neutre à défaut', async () => {
		const avecEtat = await rendu({
			evenements: [evenement({ etat: 'averifier', titre: 'Passage automatique à « À vérifier »' })]
		});
		expect(avecEtat).toContain('glyphe--averifier');

		const sansEtat = await rendu({ evenements: [evenement({ etat: null })] });
		expect(sansEtat).not.toContain('glyphe--averifier');
		/* Le carré du jalon neutre — la forme que la référence dessine. */
		expect(sansEtat).toContain('M5 5h6v6H5z');
	});

	/**
	 * LE TITRE SE COLORE DÈS « À vérifier ». Le degré d'attention vient de la
	 * fabrique : la vue le porte en attribut, elle ne le décide pas.
	 */
	it('porte le degré d’attention de l’état sur le titre', async () => {
		const calme = await rendu({ evenements: [evenement({ etat: 'ajour' })] });
		expect(calme).toContain('data-attention="0"');

		const criant = await rendu({ evenements: [evenement({ etat: 'arevoir' })] });
		expect(criant).toContain('data-attention="3"');
	});

	it('rend la date et le registre de chaque événement', async () => {
		const html = await rendu({
			evenements: [evenement({ date: '14 août 2026', registre: 'Référence + Opérationnel' })]
		});
		expect(html).toContain('14 août 2026');
		expect(html).toContain('Référence + Opérationnel');
	});
});

describe('V-15 — une version porte sa pastille et son panneau de comparaison', () => {
	const VERSION = evenement({
		titre: 'Contenu modifié par Alexandre Berge',
		version: 'v3',
		adresseComparaison: `${ADRESSE}/historique?comparer=3`,
		numero: '3'
	});

	it('rend la pastille mono et le lien de comparaison', async () => {
		const html = await rendu({ evenements: [VERSION] });
		expect(html).toContain('v3');
		expect(html).toContain('Comparer avec la version précédente');
		expect(html).toContain(`${ADRESSE}/historique?comparer=3`);
	});

	/** `P-5` — LA POLARITÉ : le panneau n'est rendu que s'il est servi. */
	it('n’écrit aucun panneau tant que la comparaison n’est pas servie', async () => {
		const html = await rendu({ evenements: [VERSION] });
		expect(html).not.toContain('AVANT');
		expect(html).not.toContain('APRÈS');
	});

	it('rend les deux colonnes quand la comparaison est servie', async () => {
		const html = await rendu({
			evenements: [
				{
					...VERSION,
					libelleComparaison: 'Masquer la comparaison',
					comparaison: {
						avant: ['Ligne qui part'],
						apres: ['Ligne qui arrive'],
						identique: false,
						registre: 'Référence',
						resteAvant: '',
						resteApres: ''
					}
				}
			]
		});
		expect(html).toContain('AVANT');
		expect(html).toContain('APRÈS');
		expect(html).toContain('Ligne qui part');
		expect(html).toContain('Ligne qui arrive');
		expect(html).toContain('Masquer la comparaison');
	});

	/**
	 * `P-09` — LE GESTE DE RESTAURATION N'EST PRÉPARÉ QUE POUR QUI PEUT ÉCRIRE :
	 * ni lien, ni formulaire, ni champ caché n'entrent dans la page sans le droit.
	 */
	it('n’émet la restauration que pour qui peut écrire', async () => {
		const sansDroit = await rendu({ evenements: [VERSION] });
		expect(sansDroit).not.toContain('Restaurer cette version');

		const avecDroit = await rendu({
			ecriture: true,
			evenements: [
				{
					...VERSION,
					adresseRestauration: `${ADRESSE}/historique?restaurer=3`,
					restaurationDepliee: true
				}
			]
		});
		expect(avecDroit).toContain('Restaurer cette version');
		expect(avecDroit).toContain(`action="${ADRESSE}?/restaurer"`);
		expect(avecDroit).toContain('name="version" value="3"');
	});
});

describe('V-15 — aucune donnée : la page le dit, et nomme le geste', () => {
	it('rend l’état vide servi et son geste', async () => {
		const html = await rendu({
			evenements: [],
			vide: {
				titre: 'Cette note n’a pas de registre Opérationnel',
				texte: 'Créez-le : sa création ouvrira ce fil.',
				adresse: `${ADRESSE}/operationnel`,
				libelle: 'Créer l’Opérationnel'
			}
		});
		expect(html).toContain('Cette note n’a pas de registre Opérationnel');
		expect(html).toContain('Créer l’Opérationnel');
		expect(html).toContain(`href="${ADRESSE}/operationnel"`);
	});

	/** `P-5` — servi un fil, la page ne rend PAS l'état vide. */
	it('n’écrit aucun état vide quand le fil porte un événement', async () => {
		const html = await rendu({ evenements: [evenement({})], vide: null });
		expect(html).not.toContain('hist__vide');
		expect(html).toContain('Création de la note');
	});
});

describe('V-15 — les trois onglets sont un filtre réel', () => {
	it('rend les trois adresses, et marque l’onglet actif', async () => {
		const html = await rendu({});
		expect(html).toContain(`href="${ADRESSE}/historique?registre=reference"`);
		expect(html).toContain(`href="${ADRESSE}/historique?registre=operationnel"`);
		/* L'onglet actif est marqué par `aria-current`, jamais par la seule barre. */
		expect(html).toContain('aria-current="page"');
	});
});
