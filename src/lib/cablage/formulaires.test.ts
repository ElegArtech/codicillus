/**
 * CE QUE L'ÉDITEUR REND D'UNE PROPRIÉTÉ DE FICHE — le trou de couverture le
 * plus large du câblage, et le défaut qu'il cachait.
 *
 * `formulaires.ts` porte toute la soumission des deux écrans d'écriture et
 * n'avait AUCUN fichier de contrôle. Le 25/08/2026 à 17:02:22, trois colonnes
 * sont posées sur `champs_de_type_de_fiche` — `aide`, `defaut`, `obligatoire` ;
 * à 17:13:45, `ChampDeFicheAuFormulaire` est écrite à la main sur la forme
 * d'AVANT. L'objet d'exécution portait les trois clés, le TYPE les rendait
 * invisibles, `pnpm check` restait vert, et l'administrateur cochait
 * « Propriété obligatoire » sur un écran qui le lui confirmait sans qu'aucune
 * ligne du produit n'exige jamais la valeur.
 *
 * DEUX CONTRÔLES DE NATURE DIFFÉRENTE VIVENT ICI :
 *
 *  1. UN CONTRÔLE DE TYPE — `CHAMP_DE_FICHE_EST_AU_FORMULAIRE`. Il ne s'exécute
 *     pas, il COMPILE : la constante ne s'écrit `true` que si `ChampDeFiche`
 *     reste assignable à la copie. C'est celui qui aurait fait rougir
 *     `pnpm check` à 17:13:45, et c'est le correctif de fond.
 *
 *  2. UN ALLER-RETOUR SUR LE RENDU. Les champs éprouvés sont déclarés
 *     `satisfies ChampDeFiche` — la forme est donc celle que
 *     `lireTypesDeFiche()` (`../donnees/lecture.ts`) rend, pas une forme
 *     inventée ici. Ce que ce fichier NE PEUT PAS faire, et il faut le dire :
 *     produire ces champs par leur vraie source. Aucun unitaire de ce dépôt ne
 *     touche la base — elle est partagée (`P-30`) — et la chaîne complète
 *     « console → base → référentiel → éditeur » ne s'éprouve donc que dans un
 *     navigateur. C'est là qu'elle a été relevée.
 */
import { describe, expect, it } from 'vitest';
import type { ChampDeFiche } from '../../../seeds/corpus';
import { documentFeint, type NoeudFeint } from './document-feint.test-utils';
import {
	CHAMP_DE_FICHE_EST_AU_FORMULAIRE,
	COCHE,
	DECOCHE,
	PHRASE_D_OBLIGATION,
	PREFIXE_DE_CONTROLE_DE_PROPRIETE,
	PREFIXE_D_ERREUR_DE_PROPRIETE,
	proprietesDeFicheSaisies,
	rendreLesProprietesDeFiche,
	type ChampDeFicheAuFormulaire
} from './formulaires';

/* ── Ce que la console écrit sur une propriété, et que la base rend ────────
   `lireTypesDeFiche()` ne pose `aide`, `defaut` et `obligatoire` que si la
   colonne porte quelque chose : une clé absente vaut « rien saisi ». Les deux
   cas sont donc éprouvés, et ils ne se ressemblent pas. */

const ADRESSE_IP = {
	cle: 'adresse_ip',
	nom: 'Adresse IP',
	type: 'texte',
	exemple: '10.0.0.1',
	aide: 'L’adresse de gestion, pas celle du service.',
	defaut: '10.0.0.',
	obligatoire: true
} satisfies ChampDeFiche;

const SALLE = {
	cle: 'salle',
	nom: 'Salle',
	type: 'liste',
	valeurs: ['C03', 'C04'],
	defaut: 'C04',
	obligatoire: true
} satisfies ChampDeFiche;

const SUPERVISE = {
	cle: 'supervise',
	nom: 'Supervisé',
	type: 'interrupteur',
	defaut: COCHE,
	aide: 'Coché, la sonde est posée.',
	obligatoire: true
} satisfies ChampDeFiche;

/** Une propriété d'avant la console — aucune des trois colonnes n'est écrite. */
const COMMENTAIRE = {
	cle: 'commentaire',
	nom: 'Commentaire',
	type: 'texte'
} satisfies ChampDeFiche;

/** La zone `#proprietes` du gel, telle que `cablerLEditeur()` la trouve. */
function zoneDesProprietes(): NoeudFeint {
	const doc = documentFeint();
	const zone = doc.createElement('div');
	zone.id = 'proprietes';
	zone.className = 'proprietes';
	return zone;
}

function rendre(
	champs: readonly ChampDeFicheAuFormulaire[],
	valeurs: Readonly<Record<string, string>> = {}
): NoeudFeint {
	const zone = zoneDesProprietes();
	rendreLesProprietesDeFiche(zone as unknown as Element, champs, valeurs, () => undefined);
	return zone;
}

describe('le lien de type que la jonction manquée n’avait pas', () => {
	it('tient tant que `ChampDeFiche` reste lisible au formulaire', () => {
		/* La valeur ne dit rien à elle seule : c'est son TYPE qui refuse de
		   s'écrire si la source déborde la copie. Le contrôle est à la
		   compilation ; celui-ci en fait un cas visible. */
		expect(CHAMP_DE_FICHE_EST_AU_FORMULAIRE).toBe(true);
	});
});

describe('mockups/V-29:3153 — la marque d’obligation est peinte au champ', () => {
	it('pose `*` dans l’intitulé d’une propriété obligatoire', () => {
		const zone = rendre([ADRESSE_IP]);
		const intitule = zone.querySelector('.champ__label');
		expect(intitule?.textContent).toBe('Adresse IP*');
		expect(zone.querySelector('.oblig')).not.toBeNull();
	});

	it('exige le contrôle, pour le navigateur ET pour la synthèse vocale', () => {
		const zone = rendre([ADRESSE_IP]);
		const controle = zone.querySelector('input');
		expect(controle?.getAttribute('required')).toBe('');
		expect(controle?.getAttribute('aria-required')).toBe('true');
	});

	it('ne marque ni n’exige une propriété que la console n’a pas cochée', () => {
		const zone = rendre([COMMENTAIRE]);
		expect(zone.querySelector('.oblig')).toBeNull();
		expect(zone.querySelector('input')?.getAttribute('required')).toBeNull();
		expect(zone.querySelector('.champ__erreur')).toBeNull();
	});

	it('ne marque PAS un interrupteur — une case porte toujours l’un de ses deux mots', () => {
		const zone = rendre([SUPERVISE]);
		expect(zone.querySelector('.oblig')).toBeNull();
		expect(zone.querySelector('input')?.getAttribute('required')).toBeNull();
	});
});

describe('mockups/V-29:3138 — l’aide est affichée sous le champ', () => {
	it('rend l’aide de la console, sur un champ comme sur un interrupteur', () => {
		expect(rendre([ADRESSE_IP]).querySelector('.champ__aide')?.textContent).toBe(
			'L’adresse de gestion, pas celle du service.'
		);
		expect(rendre([SUPERVISE]).querySelector('.champ__aide')?.textContent).toBe(
			'Coché, la sonde est posée.'
		);
	});

	it('ne rend rien quand la console n’a pas écrit d’aide', () => {
		expect(rendre([COMMENTAIRE]).querySelector('.champ__aide')).toBeNull();
	});
});

describe('la valeur par défaut — en création seulement', () => {
	it('pré-remplit la saisie, le sélecteur et la case', () => {
		expect(rendre([ADRESSE_IP]).querySelector('input')?.value).toBe('10.0.0.');
		expect(rendre([SALLE]).querySelector('select')?.value).toBe('C04');
		expect(rendre([SUPERVISE]).querySelector('input')?.checked).toBe(true);
	});

	it('N’ÉCRASE JAMAIS UNE REPRISE — une note rouverte garde ses valeurs', () => {
		const zone = rendre([ADRESSE_IP, SALLE, SUPERVISE], {
			adresse_ip: '10.0.0.99',
			salle: 'C03',
			supervise: DECOCHE
		});
		expect(zone.querySelector('#' + PREFIXE_DE_CONTROLE_DE_PROPRIETE + 'adresse_ip')?.value).toBe(
			'10.0.0.99'
		);
		expect(zone.querySelector('#' + PREFIXE_DE_CONTROLE_DE_PROPRIETE + 'salle')?.value).toBe('C03');
		/* L'interrupteur du gel n'a PAS d'identifiant, et n'en veut pas : son
		   `label` l'enveloppe, l'association est implicite. On le désigne donc
		   par sa classe, comme le ferait n'importe quel sélecteur d'écran. */
		expect(zone.querySelector('.interrupteur input')?.checked).toBe(false);
	});

	it('une reprise VIDE reste vide : elle a été effacée, pas jamais renseignée', () => {
		const zone = rendre([ADRESSE_IP], { adresse_ip: '' });
		expect(zone.querySelector('input')?.value).toBe('');
	});

	it('un défaut non touché EST SOUMIS — ce que l’aperçu de la console promet', () => {
		const zone = rendre([ADRESSE_IP, SALLE, SUPERVISE]);
		const racine = documentFeint().createElement('form');
		racine.appendChild(zone);
		expect(proprietesDeFicheSaisies(racine as unknown as ParentNode)).toEqual({
			adresse_ip: '10.0.0.',
			salle: 'C04',
			supervise: COCHE
		});
	});
});

describe('BRIEF-VUES.md:973 — le refus a sa place À L’ENDROIT DU CHAMP', () => {
	it('pose un bloc de refus, masqué, sous chaque propriété obligatoire', () => {
		const zone = rendre([ADRESSE_IP, COMMENTAIRE, SALLE]);
		const blocs = zone.querySelectorAll('.champ__erreur');
		expect(blocs.map((b) => b.id)).toEqual([
			PREFIXE_D_ERREUR_DE_PROPRIETE + 'adresse_ip',
			PREFIXE_D_ERREUR_DE_PROPRIETE + 'salle'
		]);
		expect(blocs.every((b) => b.hidden)).toBe(true);
		expect(blocs[0]?.textContent).toBe(PHRASE_D_OBLIGATION);
	});
});
