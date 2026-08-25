/**
 * LE REFUS D'UNE PROPRIÉTÉ OBLIGATOIRE, PEINT À L'ENDROIT DU CHAMP.
 *
 * `BRIEF-VUES.md:973` liste l'état « Champ obligatoire manquant (signalé à
 * l'endroit du champ, pas seulement en haut de page) ». Les deux blocs du gel —
 * `#erreur-titre`, `#erreur-dossier` — désignent des champs FIXES ; les
 * propriétés d'une fiche sont administrables, leurs blocs naissent avec elles,
 * et la table des motifs ne peut donc pas les porter.
 *
 * L'écran est monté par le VRAI rendu — `rendreLesProprietesDeFiche()` — et non
 * par un balisage écrit ici : c'est la seule façon d'éprouver que les deux
 * modules s'accordent sur l'identifiant des blocs. Un contrôle qui construirait
 * lui-même le `#erreur-fiche-…` ne prouverait rien de ce que l'éditeur rend.
 */
import { describe, expect, it } from 'vitest';
import { PREFIXE_D_ERREUR_DE_PROPRIETE, rendreLesProprietesDeFiche } from '../cablage/formulaires';
import { documentFeint, type NoeudFeint } from '../cablage/document-feint.test-utils';
import { MOTIF_DE_PROPRIETE_OBLIGATOIRE, peindreLeRefusDEdition } from './gestes';

/** L'écran de V-17, réduit à ce que le refus touche : la zone et le témoin. */
function ecran(): NoeudFeint {
	const doc = documentFeint();
	const racine = doc.createElement('form');
	const zone = doc.createElement('div');
	zone.id = 'proprietes';
	racine.appendChild(zone);
	const temoin = doc.createElement('div');
	temoin.id = 'sauvegarde';
	racine.appendChild(temoin);
	const texte = doc.createElement('span');
	texte.id = 'sauvegarde-txt';
	racine.appendChild(texte);
	rendreLesProprietesDeFiche(
		zone as unknown as Element,
		[
			{ cle: 'adresse_ip', nom: 'Adresse IP', type: 'texte', obligatoire: true },
			{ cle: 'salle', nom: 'Salle', type: 'texte', obligatoire: true },
			{ cle: 'commentaire', nom: 'Commentaire', type: 'texte' }
		],
		{},
		() => undefined,
		'choix'
	);
	return racine;
}

const REFUS = {
	motif: MOTIF_DE_PROPRIETE_OBLIGATOIRE,
	manquements: ['Adresse IP'],
	proprietesManquantes: ['adresse_ip']
};

describe('BRIEF-VUES.md:973 — le refus désigne SON champ, pas la page', () => {
	it('dévoile le bloc de la propriété nommée, et lui seul', () => {
		const racine = ecran();
		peindreLeRefusDEdition(racine as unknown as ParentNode, REFUS);
		const vise = racine.querySelector('#' + PREFIXE_D_ERREUR_DE_PROPRIETE + 'adresse_ip');
		const voisin = racine.querySelector('#' + PREFIXE_D_ERREUR_DE_PROPRIETE + 'salle');
		expect(vise?.hidden).toBe(false);
		expect(voisin?.hidden).toBe(true);
	});

	it('marque le champ porteur, `data-etat="erreur"` comme au gel', () => {
		/* CE QUE CETTE MARQUE FAIT, ET CE QU'ELLE NE FAIT PAS. `socle.css:438`
		   rougit `.champ[data-etat="erreur"] .saisie` : une propriété « texte » ou
		   « nombre » voit donc sa bordure changer. Une propriété « liste » reçoit la
		   classe `selecteur` (`V-17.css:601`), qu'aucune règle d'erreur ne vise —
		   sa bordure ne rougira pas. Le refus reste signalé à l'endroit du champ par
		   son bloc, ce que `BRIEF-VUES.md:973` demande ; la bordure est un renfort
		   que le socle ne rend pas à ce contrôle-là. */
		const racine = ecran();
		peindreLeRefusDEdition(racine as unknown as ParentNode, REFUS);
		const champ = racine
			.querySelector('#' + PREFIXE_D_ERREUR_DE_PROPRIETE + 'adresse_ip')
			?.closest('.champ');
		expect(champ?.dataset['etat']).toBe('erreur');
	});

	it('dit aussi au témoin qu’il y a eu refus, avec la propriété manquante', () => {
		const racine = ecran();
		peindreLeRefusDEdition(racine as unknown as ParentNode, REFUS);
		expect(racine.querySelector('#sauvegarde')?.dataset['etat']).toBe('erreur');
		expect(racine.querySelector('#sauvegarde-txt')?.textContent).toContain('Adresse IP');
	});

	it('EFFACE tout au refus suivant : une propriété corrigée ne reste pas rouge', () => {
		const racine = ecran();
		peindreLeRefusDEdition(racine as unknown as ParentNode, REFUS);
		peindreLeRefusDEdition(racine as unknown as ParentNode, {
			motif: MOTIF_DE_PROPRIETE_OBLIGATOIRE,
			manquements: ['Salle'],
			proprietesManquantes: ['salle']
		});
		const premier = racine.querySelector('#' + PREFIXE_D_ERREUR_DE_PROPRIETE + 'adresse_ip');
		expect(premier?.hidden).toBe(true);
		expect(premier?.closest('.champ')?.dataset['etat']).toBeUndefined();
		expect(racine.querySelector('#' + PREFIXE_D_ERREUR_DE_PROPRIETE + 'salle')?.hidden).toBe(false);
	});

	it('n’en dévoile aucun quand le refus porte sur un autre motif', () => {
		const racine = ecran();
		peindreLeRefusDEdition(racine as unknown as ParentNode, { motif: 'titre manquant' });
		expect(racine.querySelectorAll('#proprietes .champ__erreur').every((b) => b.hidden)).toBe(true);
	});
});
