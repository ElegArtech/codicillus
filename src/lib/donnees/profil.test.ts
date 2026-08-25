/**
 * LES UNITAIRES DU PROFIL — ce qui se contrôle SANS base.
 *
 * Même partage que `lecture.test.ts` et `signets.test.ts` : ce qui exige le
 * conteneur `db` est mesuré ailleurs, sur le produit construit. Ici, les
 * DÉCISIONS pures — celles où une erreur est silencieuse parce qu'elle rend
 * une valeur plausible au lieu de lever.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX CAS SONT ICI PARCE QUE LE DÉPÔT NE LES PORTE PAS — `P-5` ET `P-26`
 *
 *   1. LE COMPTE VERROUILLÉ. `RG-M16-02` gouverne un compte marqué
 *      `mot_de_passe_verrouille`, et **le jeu de semence n'en marque aucun** :
 *      mesuré, `src/lib/base/semence.ts` ne cite jamais la colonne, et les cinq
 *      comptes semés prennent son défaut, `false`. Aucune batterie du dépôt
 *      n'exerce donc la règle sur donnée réelle. Les deux cas ci-dessous sont
 *      SYNTHÉTIQUES, indépendants de l'état de la base, et c'est exactement ce
 *      que `P-26` demande d'un contrôle qui pourrait devenir inerte.
 *
 *   2. LES VECTEURS DE V-06 ONT DISPARU AVEC LE PARCOURS QU'ILS RÉGLAIENT.
 *      La vue rendait quatre étapes d'une réinitialisation par courriel dont
 *      le produit n'a ni expéditeur ni table de jeton ; elle n'en rend plus
 *      qu'une, qui déclare l'indisponibilité. Ce que ces vecteurs gardaient —
 *      ne jamais poser la position « Identifiant inconnu », qui révélerait
 *      l'inexistence d'un compte — est devenu structurel : l'écran ne demande
 *      plus d'identifiant. Le contrôle est passé sur le BALISAGE RENDU, dans
 *      `src/vues/proprietes-coquille.test.ts`, où c'est la vue qui produit la
 *      chaîne cherchée au lieu que le cas la fabrique.
 */
import { describe, expect, it } from 'vitest';
import type { Base } from '../base/acces';
import {
	MINIMUM_DE_CARACTERES,
	ONGLETS,
	SANS_CONTREPARTIE_EN_BASE,
	changerLeMotDePasse,
	motDePasseAcceptable,
	naturesDeCaracteres,
	ongletDemande,
	reglesDuMotDePasse,
	vecteurDeV25,
	type ProfilDuCompte
} from './profil';

/* ═══════════════════════════════════════════ L'onglet, de l'adresse ═════ */

describe('ongletDemande — le paramètre `?onglet=` de `/mon-profil`', () => {
	it('rend les quatre positions de l’axe `ong` de la planche', () => {
		for (const onglet of ONGLETS) expect(ongletDemande(onglet)).toBe(onglet);
	});

	it('retombe sur `identite` — le défaut du balisage gelé — hors de la liste', () => {
		expect(ongletDemande(null)).toBe('identite');
		expect(ongletDemande('')).toBe('identite');
		expect(ongletDemande('securité')).toBe('identite');
		expect(ongletDemande('../console')).toBe('identite');
	});
});

/* ══════════════════════════════════ Les vecteurs de planche ════════════ */

describe('vecteurDeV25 — l’onglet et le verrou, et rien d’autre', () => {
	it('porte l’onglet demandé', () => {
		expect(vecteurDeV25('distinctions', false)).toEqual({
			ong: 'distinctions',
			'c-verrou': false
		});
	});

	/* LE CAS SYNTHÉTIQUE DE `RG-M16-02` — aucun compte semé ne le porte. */
	it('porte `c-verrou` quand le compte a son mot de passe verrouillé', () => {
		expect(vecteurDeV25('securite', true)).toEqual({ ong: 'securite', 'c-verrou': true });
	});

	it('ne pose PAS l’axe `cpt` : aucune de ses positions ne désigne le compte connecté', () => {
		expect(Object.keys(vecteurDeV25('identite', false))).toEqual(['ong', 'c-verrou']);
	});
});

/* V-06 n'a plus de vecteur : voir l'en-tête, §2. Ce que ses deux fabriques
   gardaient est mesuré sur le balisage rendu, dans `proprietes-coquille`. */

/* ═════════════════════════ La politique de mot de passe, du gel ════════ */

describe('la politique de mot de passe — transcription de `creerRobustesse()`', () => {
	const identifiant = 'karim.belhadj';

	it('compte les natures comme les quatre classes du gel', () => {
		expect(naturesDeCaracteres('abc')).toBe(1);
		expect(naturesDeCaracteres('abcD')).toBe(2);
		expect(naturesDeCaracteres('abcD1')).toBe(3);
		expect(naturesDeCaracteres('abcD1!')).toBe(4);
		expect(naturesDeCaracteres('')).toBe(0);
	});

	it('exige douze caractères — `MINI` du gel', () => {
		expect(MINIMUM_DE_CARACTERES).toBe(12);
		expect(reglesDuMotDePasse('Court1', identifiant).longueur).toBe(false);
		expect(reglesDuMotDePasse('Motdepasse12', identifiant).longueur).toBe(true);
	});

	it('exige deux natures', () => {
		expect(reglesDuMotDePasse('abcdefghijkl', identifiant).varie).toBe(false);
		expect(reglesDuMotDePasse('abcdefghijk1', identifiant).varie).toBe(true);
	});

	it('refuse un mot de passe qui contient l’identifiant, quelle qu’en soit la casse', () => {
		expect(reglesDuMotDePasse('Karim.Belhadj2026', identifiant).different).toBe(false);
		expect(reglesDuMotDePasse('Motdepasse12', identifiant).different).toBe(true);
	});

	it('refuse la chaîne vide par la règle `different`, comme le gel', () => {
		expect(reglesDuMotDePasse('', identifiant).different).toBe(false);
	});

	/* Les deux exemples que le gel cite lui-même dans son commentaire. */
	it('accepte les deux mots de passe que le gel donne en exemple', () => {
		expect(motDePasseAcceptable('cheval agrafe batterie', identifiant)).toBe(true);
		expect(motDePasseAcceptable('Motdepasse12', identifiant)).toBe(true);
	});

	it('refuse dès qu’une seule des trois règles tombe', () => {
		expect(motDePasseAcceptable('abcdefghijkl', identifiant)).toBe(false);
		expect(motDePasseAcceptable('Court1!', identifiant)).toBe(false);
		expect(motDePasseAcceptable('karim.belhadj2026', identifiant)).toBe(false);
	});
});

/* ═════════════════════ `RG-M16-02` — le refus précède toute lecture ════ */

/**
 * UNE BASE QUI REFUSE D'ÊTRE TOUCHÉE.
 *
 * Le cas ne se contente pas de vérifier l'issue : il vérifie qu'AUCUNE requête
 * n'a été émise. Un compte verrouillé ne doit pas donner à l'appelant un oracle
 * sur le mot de passe d'un compte de démonstration partagé (`RG-CPT-01`), et un
 * refus posé après la vérification en donnerait un par le temps de réponse.
 */
function baseInterdite(): Base {
	return new Proxy(
		{},
		{
			get() {
				throw new Error('la base ne doit pas être touchée pour un compte verrouillé');
			}
		}
	) as unknown as Base;
}

const PROFIL_VERROUILLE: ProfilDuCompte = {
	compteId: '00000000-0000-4000-8000-000000000001',
	identifiant: 'demo.lecture',
	nom: 'Compte de démonstration',
	courriel: 'demo@exemple.fr',
	role: 'lecteur',
	domaine: null,
	arriveLe: '2026-01-05',
	derniereConnexionLe: null,
	motDePasseVerrouille: true
};

describe('changerLeMotDePasse — `RG-M16-02`, décidé avant toute requête', () => {
	it('refuse un compte verrouillé sans émettre la moindre requête', async () => {
		const resultat = await changerLeMotDePasse(baseInterdite(), {
			profil: PROFIL_VERROUILLE,
			sessionCourante: '00000000-0000-4000-8000-0000000000ff',
			saisies: {
				actuel: 'peu importe',
				nouveau: 'cheval agrafe batterie',
				confirmation: 'cheval agrafe batterie'
			},
			maintenant: new Date('2026-08-20T10:00:00.000Z')
		});
		expect(resultat).toEqual({ issue: 'verrouille', sessionsFermees: 0 });
	});

	it('ne ferme aucune session quand il refuse', async () => {
		const resultat = await changerLeMotDePasse(baseInterdite(), {
			profil: PROFIL_VERROUILLE,
			sessionCourante: '00000000-0000-4000-8000-0000000000ff',
			saisies: { actuel: '', nouveau: '', confirmation: '' },
			maintenant: new Date('2026-08-20T10:00:00.000Z')
		});
		expect(resultat.sessionsFermees).toBe(0);
	});
});

/* ═══════════════════ Ce que la base ne porte pas, compté ═══════════════ */

describe('SANS_CONTREPARTIE_EN_BASE — la lacune est comptée, pas racontée', () => {
	it('en dénombre six, dont le jeton de réinitialisation', () => {
		expect(SANS_CONTREPARTIE_EN_BASE).toHaveLength(6);
		expect(SANS_CONTREPARTIE_EN_BASE.map((d) => d.donnee)).toContain('jeton de réinitialisation');
	});

	it('nomme pour chacune l’écran, l’affichage et le motif', () => {
		for (const d of SANS_CONTREPARTIE_EN_BASE) {
			expect(d.vue).toMatch(/^V-\d\d$/);
			expect(d.affichage.length).toBeGreaterThan(0);
			expect(d.motif.length).toBeGreaterThan(0);
		}
	});
});
