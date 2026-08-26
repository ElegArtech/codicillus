import { describe, expect, it } from 'vitest';
import { CONFIGURATION_PAR_DEFAUT } from './base/schema';
import { accord, formesDuMot, pluriel, VOCABULAIRE_PAR_DEFAUT } from './vocabulaire';

/*
 * L'ACCORD EN NOMBRE — ce que la fonction promet, et ce que les vues en
 * attendront.
 *
 * Ce fichier n'existait pas : `pluriel()` et les trois autres dérivations
 * n'étaient éprouvées que par le rendu des vues qui les emploient, c'est-à-dire
 * jamais directement. Les deux capacités posées ici seront consommées par une
 * cinquantaine de sites ; une règle qu'aucun contrôle ne tient se réécrit à la
 * main au premier doute, et c'est exactement ce qui a produit les six helpers
 * locaux qu'elles remplacent.
 */

describe('accord — le nom qui suit un compte', () => {
	it('rend LE NOM SEUL, jamais « n nom »', () => {
		// Le point qui décide de tout : le formatage du nombre reste à
		// l'appelant. Si la fonction rendait « 2 notes », composer avec un
		// nombre déjà formaté en fr-FR le donnerait deux fois.
		expect(accord(2, 'note')).toBe('notes');
		expect(accord(1, 'note')).toBe('note');
		expect(accord(12, 'note')).not.toContain('12');
	});

	it('rend LE SINGULIER À ZÉRO — la convention que le dépôt tient déjà', () => {
		// `V-13.test.ts` gèle « 0 sous-dossier » et « 1 sous-dossier », et les
		// quarante ternaires du dépôt emploient tous « > 1 ». La fonction ne
		// tranche pas : elle nomme ce qui était déjà tranché.
		expect(accord(0, 'sous-dossier')).toBe('sous-dossier');
		expect(accord(1, 'sous-dossier')).toBe('sous-dossier');
		expect(accord(2, 'sous-dossier')).toBe('sous-dossiers');
	});

	it('dérive le pluriel par « pluriel() », et par rien d’autre', () => {
		// La forme attendue est PRODUITE PAR SA SOURCE, pas recopiée ici : si
		// la règle du gel changeait, ce contrôle suivrait au lieu de mentir.
		for (const mot of ['note', 'domaine', 'signet', 'étiquette', 'relation']) {
			expect(accord(2, mot)).toBe(pluriel(mot));
			expect(accord(1, mot)).toBe(mot);
		}
	});

	it('accepte un pluriel explicite, POUR LES SYNTAGMES que la règle massacrerait', () => {
		// « note qu'ils contiennent » pluralisé par la règle donnerait
		// « contiennents » — c'est le cas qui rend le second argument
		// obligatoire, et non confortable.
		const singulier = 'note qu’ils contiennent';
		const explicite = 'notes qu’ils contiennent';
		expect(accord(2, singulier, explicite)).toBe(explicite);
		expect(accord(1, singulier, explicite)).toBe(singulier);
		expect(accord(2, singulier)).not.toBe(explicite);
	});

	it('rend VERBATIM les deux formes du mot renommable, sans en dériver aucune', () => {
		// Les formes sont produites par « formesDuMot() », leur seule source :
		// un contrôle qui écrirait le pluriel à la main ne prouverait rien de
		// ce que la dérivation rend vraiment. « Bureau » est choisi parce que
		// son pluriel n'est pas le singulier suivi d'une marque : une forme
		// recomposée sur place se verrait.
		const formes = formesDuMot('Bureau');
		expect(formes.fichesMin).toBe('bureaux');
		expect(accord(2, formes.ficheMin, formes.fichesMin)).toBe(formes.fichesMin);
		expect(accord(1, formes.ficheMin, formes.fichesMin)).toBe(formes.ficheMin);
	});

	it('n’ajoute RIEN à un pluriel qu’on lui donne déjà pluriel', () => {
		// La discipline « les deux formes viennent du contexte » vaut par sa
		// SOURCE, pas par son résultat : la règle du gel est idempotente, donc
		// un second passage ne se verrait pas aujourd'hui. Ce contrôle épingle
		// cette idempotence — le jour où la règle changerait, il tomberait, et
		// la discipline cesserait d'être gratuite.
		for (const mot of ['notes', 'bureaux', 'journaux']) {
			expect(pluriel(mot)).toBe(mot);
			expect(accord(2, mot)).toBe(mot);
		}
	});

	it('tient sur un mot dont le pluriel est irrégulier au sens du gel', () => {
		// « pluriel() » traite les invariables en -s/-x/-z et les -al. Le
		// vocabulaire du produit n'en contient aucun — mais le mot de « M14.7 »
		// est un CHAMP LIBRE de la console, et un administrateur peut l'y
		// écrire. La fonction ne doit pas ajouter une marque de plus.
		expect(accord(2, 'processus')).toBe('processus');
		expect(accord(2, 'journal')).toBe('journaux');
		expect(accord(1, 'journal')).toBe('journal');
	});
});

describe('le mot renommable — ses quatre formes', () => {
	it('retombe sur « Fiche » quand la configuration ne dit rien', () => {
		// Le défaut du module et celui de la base disent le MÊME mot, et le
		// contrôle les compare l'un à l'autre plutôt que d'en recopier un
		// troisième : c'est la seule façon qu'ils ne divergent pas en silence.
		expect(VOCABULAIRE_PAR_DEFAUT.fiche).toBe(CONFIGURATION_PAR_DEFAUT.motFiche);
		expect(formesDuMot('   ').fiche).toBe(CONFIGURATION_PAR_DEFAUT.motFiche);
	});

	it('rend les quatre formes d’un mot saisi', () => {
		const formes = formesDuMot('Modèle');
		expect(formes).toEqual({
			fiche: 'Modèle',
			ficheMin: 'modèle',
			fiches: 'Modèles',
			fichesMin: 'modèles'
		});
	});

	it('ne décapitalise que l’initiale, et laisse le reste du mot intact', () => {
		expect(formesDuMot('MODÈLE').ficheMin).toBe('mODÈLE');
	});
});

describe('nomOrganisation — le réglage que le produit ne remplit pas à la place de son hôte', () => {
	it('est VIDE par défaut, comme le portail d’assistance', () => {
		// Inventer un nom d'organisation serait signer le produit de quelqu'un
		// d'autre — la même jurisprudence que « portailAssistance ». Vide, les
		// vues rendent « Codicillus » seul, le nom du LOGICIEL.
		expect(CONFIGURATION_PAR_DEFAUT.nomOrganisation).toBe('');
		expect(CONFIGURATION_PAR_DEFAUT.portailAssistance).toBe('');
	});
});
