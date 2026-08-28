/**
 * LE CONTRAT DE SAISIE DE `/console/types-de-fiches`, ÉPROUVÉ EN ALLER-RETOUR.
 *
 * CE QUE CE FICHIER PROUVE. Cinq attributs du panneau de `V-29` — la
 * description, l'icône, et par propriété l'aide à la saisie, la valeur par
 * défaut et le caractère obligatoire — étaient saisis par l'administrateur,
 * affichés comme acquis, et JETÉS EN SILENCE : la fabrique de champs ne les
 * émettait pas, la relecture ne les cherchait pas. L'aller-retour ci-dessous
 * échouerait si l'un des deux bouts venait à les oublier de nouveau.
 *
 * L'ENTRÉE N'EST PAS FABRIQUÉE À LA MAIN, ET C'EST LE POINT.
 * `champsDeTypeDeFiche()` produit le transport, et une VRAIE `FormData` le
 * porte, remplie exactement comme `envoyerAUneAction()` la remplit — une clé,
 * une valeur, par `append`. Un objet composé à la main partagerait avec la
 * fonction relue l'hypothèse qu'on veut justement éprouver : que le champ
 * arrive sous la forme d'une chaîne, et sous ce nom-là.
 */
import { describe, expect, it } from 'vitest';
import {
	CHAMP_PROPRIETES,
	champsDeDomaine,
	champsDeTypeDeFiche,
	CHAMP_ERREUR_MODULES,
	CHAMP_MODULES,
	messageDeModuleInconnu,
	modulesDuChamp,
	proprietesDuChamp,
	refusDeModuleInconnu,
	texteDuChamp,
	CHAMP_DESCRIPTION,
	CHAMP_GLYPHE,
	CHAMP_NOM,
	type SaisieDeDomaine,
	type SaisieDeTypeDeFiche
} from './structure';
import { CATALOGUE_DE_MODULES } from '../rangement/modules';
import type { CleDeModule } from '../../../seeds/corpus';

/** Le corps que `envoyerAUneAction()` compose, à la ligne près. */
function corpsDeRequete(champs: Record<string, string>): FormData {
	const corps = new FormData();
	for (const [nom, valeur] of Object.entries(champs)) corps.append(nom, valeur);
	return corps;
}

const SAISIE: SaisieDeTypeDeFiche = {
	nom: 'Équipement réseau',
	description: 'Commutateur, routeur, borne — tout ce qui porte du trafic.',
	glyphe: 'reseau',
	proprietes: [
		{
			cle: 'modele',
			nom: 'Modèle',
			type: 'texte',
			aide: 'Référence constructeur, telle qu’elle est gravée sur la façade.',
			defaut: '',
			obligatoire: true,
			valeurs: []
		},
		{
			cle: 'pile',
			nom: 'Empilé',
			type: 'booleen',
			aide: '',
			defaut: 'non',
			obligatoire: false,
			valeurs: []
		}
	]
};

describe('la saisie d’un type de fiche traverse le transport sans rien perdre', () => {
	const corps = corpsDeRequete(champsDeTypeDeFiche(SAISIE));

	it('porte le nom, la description et l’icône sous les noms du gel', () => {
		expect(texteDuChamp(corps, CHAMP_NOM)).toBe(SAISIE.nom);
		expect(texteDuChamp(corps, CHAMP_DESCRIPTION)).toBe(SAISIE.description);
		expect(texteDuChamp(corps, CHAMP_GLYPHE)).toBe(SAISIE.glyphe);
	});

	it('rend les propriétés à l’identique, aide, défaut et obligation comprises', () => {
		expect(proprietesDuChamp(corps, CHAMP_PROPRIETES)).toEqual(SAISIE.proprietes);
	});
});

describe('une propriété incomplète est ramenée au neutre, jamais devinée', () => {
	it('les trois attributs manquants valent « rien saisi »', () => {
		const corps = corpsDeRequete({
			[CHAMP_PROPRIETES]: JSON.stringify([{ cle: 'hote', nom: 'Nom d’hôte', type: 'texte' }])
		});
		expect(proprietesDuChamp(corps, CHAMP_PROPRIETES)).toEqual([
			{
				cle: 'hote',
				nom: 'Nom d’hôte',
				type: 'texte',
				aide: '',
				defaut: '',
				obligatoire: false,
				valeurs: []
			}
		]);
	});

	it('une obligation qui n’est pas un booléen vrai ne rend pas la propriété requise', () => {
		const corps = corpsDeRequete({
			[CHAMP_PROPRIETES]: JSON.stringify([
				{ cle: 'hote', nom: 'Nom d’hôte', type: 'texte', obligatoire: 'oui' }
			])
		});
		expect(proprietesDuChamp(corps, CHAMP_PROPRIETES)?.[0]?.obligatoire).toBe(false);
	});
});

/* ═══════════════ Les modules d'un domaine, confrontés au catalogue ═══════ */

/**
 * CE QUE CES TROIS CONTRÔLES PROUVENT.
 *
 * `modulesDuChamp()` transtypait chaque segment en `CleDeModule` sans jamais
 * consulter le catalogue, et l'écriture jetait ensuite l'inconnue en silence :
 * `notes signets cartographie carte-mentale relations recherche` entrait en
 * base réduit à trois clés, et l'action rendait 200 « possible ». Un domaine né
 * sans `dossiers` faisait alors rendre 404 à `…/dossiers/{domaine}`.
 *
 * LES SIX CLÉS NE SONT PAS RECOPIÉES ICI : elles sont lues sur
 * `CATALOGUE_DE_MODULES`, la seule source. Une clé ajoutée au produit entre donc
 * dans l'aller-retour sans qu'une ligne de ce fichier ne bouge — et une clé
 * qu'on oublierait de faire traverser le fait échouer.
 */
describe('les modules traversent le transport, ou le geste est refusé', () => {
	const TOUTES = Object.keys(CATALOGUE_DE_MODULES) as readonly CleDeModule[];

	it('les six clés du catalogue reviennent toutes, aucune jetée en chemin', () => {
		const saisie: SaisieDeDomaine = {
			nom: 'Exploitation',
			description: 'Ce que le service tient debout.',
			univers: 'Infrastructure',
			couleur: 'ardoise',
			modules: TOUTES
		};
		const corps = corpsDeRequete(champsDeDomaine(saisie));
		expect(modulesDuChamp(corps, CHAMP_MODULES)).toEqual({ etat: 'lue', modules: TOUTES });
	});

	it('une clé hors catalogue rend un refus, et le refus la nomme', () => {
		const corps = corpsDeRequete({
			[CHAMP_MODULES]: 'notes signets cartographie carte-mentale relations recherche'
		});
		const lecture = modulesDuChamp(corps, CHAMP_MODULES);
		expect(lecture).toEqual({ etat: 'cle-inconnue', cle: 'carte-mentale' });

		const refus = refusDeModuleInconnu(lecture.etat === 'cle-inconnue' ? lecture.cle : '');
		expect(refus.issue).toBe('saisie-refusee');
		expect(refus.erreurs).toEqual([
			{ champ: CHAMP_ERREUR_MODULES, message: messageDeModuleInconnu('carte-mentale') }
		]);
		expect(refus.erreurs[0]?.message).toContain('carte-mentale');
	});

	it('un champ non transmis reste « rien à changer », jamais une liste vide', () => {
		expect(modulesDuChamp(corpsDeRequete({}), CHAMP_MODULES)).toEqual({ etat: 'absent' });
	});

	it('une propriété du prototype n’est pas un module', () => {
		expect(modulesDuChamp(corpsDeRequete({ [CHAMP_MODULES]: 'toString' }), CHAMP_MODULES)).toEqual({
			etat: 'cle-inconnue',
			cle: 'toString'
		});
	});
});
