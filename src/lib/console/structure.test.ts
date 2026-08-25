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
	champsDeTypeDeFiche,
	proprietesDuChamp,
	texteDuChamp,
	CHAMP_DESCRIPTION,
	CHAMP_GLYPHE,
	CHAMP_NOM,
	type SaisieDeTypeDeFiche
} from './structure';

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
