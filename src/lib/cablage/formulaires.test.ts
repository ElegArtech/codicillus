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
 * LE CORRECTIF DE FOND N'EST PAS DANS CE FICHIER, ET IL NE PEUT PAS Y ÊTRE.
 * `ChampDeFicheAuFormulaire` n'est plus une copie : elle est DÉRIVÉE de
 * `ChampDeFiche` par un type appliqué (`formulaires.ts`). Il n'y a donc plus
 * rien à comparer — aucune assertion d'assignabilité n'aurait vu l'amputation
 * de 17:13:45, un sur-ensemble structurel étant assignable au sous-ensemble
 * dans les deux sens. Ce qui ferme le trou est qu'il n'y a plus de second
 * endroit où écrire la forme.
 *
 * CE FICHIER PORTE L'AUTRE CONTRÔLE : UN ALLER-RETOUR SUR LE RENDU. Les champs
 * éprouvés sont déclarés `satisfies ChampDeFiche` — la forme est donc celle que
 * `lireTypesDeFiche()` (`../donnees/lecture.ts`) rend, pas une forme inventée
 * ici. Ce que ce fichier NE PEUT PAS faire, et il faut le dire : produire ces
 * champs par leur vraie source. Aucun unitaire de ce dépôt ne touche la base —
 * elle est partagée (`P-30`) — et la chaîne complète « console → base →
 * référentiel → éditeur » ne s'éprouve donc que dans un navigateur. C'est là
 * qu'elle a été relevée.
 */
import { describe, expect, it } from 'vitest';
import type { ChampDeFiche } from '../../../seeds/corpus';
import { documentFeint, type NoeudFeint } from './document-feint.test-utils';
import {
	COCHE,
	DECOCHE,
	PHRASE_D_OBLIGATION,
	PREFIXE_DE_CONTROLE_DE_PROPRIETE,
	PREFIXE_D_ERREUR_DE_PROPRIETE,
	proprietesDeFicheSaisies,
	rendreLesProprietesDeFiche,
	type ChampDeFicheAuFormulaire,
	type OrigineDesProprietes
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
	valeurs: Readonly<Record<string, string>> = {},
	origine: OrigineDesProprietes = 'choix'
): NoeudFeint {
	const zone = zoneDesProprietes();
	rendreLesProprietesDeFiche(zone as unknown as Element, champs, valeurs, () => undefined, origine);
	return zone;
}

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

describe('la valeur par défaut — sur un schéma CHOISI seulement', () => {
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

	it('UNE REPRISE N’EN POSE AUCUN — mockups/V-29:3308, la valeur est DEMANDÉE', () => {
		/* LE CAS MIXTE, ET C'EST CELUI QUI COMPTE : une propriété obligatoire
		   DOTÉE D'UN DÉFAUT, sur une note écrite avant qu'elle n'existe. La note ne
		   porte pas la clé ; si le défaut se posait ici, il serait soumis comme une
		   valeur, le serveur ne refuserait rien, et une valeur que personne n'a
		   saisie entrerait en base. « Les notes existantes ne seront pas bloquées,
		   mais la valeur sera demandée à la prochaine modification. » */
		const zone = rendre([ADRESSE_IP, SALLE, SUPERVISE], { salle: 'C03' }, 'reprise');
		expect(zone.querySelector('#' + PREFIXE_DE_CONTROLE_DE_PROPRIETE + 'adresse_ip')?.value).toBe(
			''
		);
		expect(zone.querySelector('.interrupteur input')?.checked).toBe(false);
		/* La valeur que la note PORTE, elle, est bien reprise. */
		expect(zone.querySelector('#' + PREFIXE_DE_CONTROLE_DE_PROPRIETE + 'salle')?.value).toBe('C03');
	});

	it('et rien n’est donc soumis à la place du rédacteur, en reprise', () => {
		const zone = rendre([ADRESSE_IP, SALLE], { salle: 'C03' }, 'reprise');
		const racine = documentFeint().createElement('form');
		racine.appendChild(zone);
		expect(proprietesDeFicheSaisies(racine as unknown as ParentNode)).toEqual({ salle: 'C03' });
	});

	it('le CHANGEMENT de type sur une note existante rouvre les défauts', () => {
		/* La distinction n'est pas « création contre modification » : désigner un
		   autre type de fiche est un CHOIX, et son schéma s'ouvre neuf. */
		expect(rendre([ADRESSE_IP], {}, 'choix').querySelector('input')?.value).toBe('10.0.0.');
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

	it('porte le PICTOGRAMME du composant, comme tous les blocs du dépôt', () => {
		/* `V-41` : « L'erreur est toujours accompagnée de son motif, jamais d'un
		   simple contour rouge ». Le cercle barré précède la phrase dans les cinq
		   blocs du gel ; un bloc né à l'exécution n'en est pas dispensé. */
		const bloc = rendre([ADRESSE_IP]).querySelector('.champ__erreur');
		const dessin = bloc?.enfants[0];
		expect(dessin?.balise).toBe('svg');
		expect(dessin?.getAttribute('viewBox')).toBe('0 0 16 16');
		expect(dessin?.enfants.map((e) => e.balise)).toEqual(['path', 'circle']);
		expect(bloc?.textContent).toBe(PHRASE_D_OBLIGATION);
	});
});
