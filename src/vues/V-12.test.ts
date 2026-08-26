/**
 * V-12 — LE RANGEMENT SERVI, ET RIEN DU JEU DE DÉMONSTRATION.
 *
 * Cette vue a déclaré `univers`, `domaines`, `compte`, `instance` et
 * `modifications` OPTIONNELLES, de défaut les constantes de `seeds/corpus.ts`.
 * Ce défaut garantissait qu'une route qui en oubliait une servait le jeu de
 * démonstration SANS QUE RIEN NE PROTESTE, et la seconde moitié de ce fichier
 * l'épinglait comme un acquis. Elle est retirée avec lui.
 *
 * `domaines` ET `modifications` SONT REQUISES — la route les passe, et
 * `svelte-check` refuse désormais de compiler un appel qui les oublierait.
 * `univers` et `compte` peuvent légitimement manquer : leurs états vides sont
 * le tableau vide et `null`. `instance` a disparu — le contexte de coquille
 * sert la version du paquet.
 *
 * CE QUI EST ÉPROUVÉ : la propriété servie décide, et rien du jeu n'atteint
 * l'écran quand elle ne le porte pas.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { fermerLeHarnais, rendreLaVue } from './harnais.test-utils';
import { corpusPourVue, DOMAINES, MODIFICATIONS, MOI, UNIVERS } from '../../seeds/corpus';
import type { CompteAffiche } from '../lib/coquille/identite';

const NOTES = corpusPourVue('V-12');

/** Une identité qui n'est PAS celle du jeu de semence — le défaut mesuré. */
const SOPHIE: CompteAffiche = {
	nom: 'Sophie Nguyen',
	initiales: 'SN',
	domaine: 'Applications',
	role: 'Administrateur'
};

/** Le socle de rendu — tout ce que la vue exige, et rien de plus. */
const SOCLE = { vecteur: null, notes: NOTES, domaines: DOMAINES, modifications: MODIFICATIONS };

function rendu(proprietes: Record<string, unknown>): Promise<string> {
	return rendreLaVue('V-12', { ...SOCLE, ...proprietes });
}

afterAll(fermerLeHarnais);

describe('V-12 — la propriété servie décide', () => {
	it('sert le compte reçu, et n’annonce personne sans compte', async () => {
		const html = await rendu({ compte: SOPHIE });
		/* La désignation du menu utilisateur — le seul endroit où le compte
		   COURANT est nommé. Le nom de `MOI` figure par ailleurs comme AUTEUR de
		   notes du corpus : le chercher tel quel mesurerait le corpus, pas la
		   propriété. */
		expect(html).toContain('Sophie Nguyen — menu utilisateur');
		expect(html).not.toContain(`${MOI.nom} — menu utilisateur`);
		expect(await rendu({})).not.toContain(`${MOI.nom} — menu utilisateur`);
	});

	it('ne sert aucune version de démonstration au pied du rail', async () => {
		expect(await rendu({})).not.toContain('Codicillus 1.0.0');
	});

	it('sert la liste de domaines reçue — le domaine courant en sort', async () => {
		const html = await rendu({ domaines: DOMAINES.filter((d) => d.nom === 'Applications') });
		expect(html).toContain('Notes de Applications');
		expect(html).not.toContain('Notes de Infrastructure');
	});

	/* LE RAIL NE MARQUE QUE LE DOMAINE COURANT. Il en marquait DEUX : le gel
	   accumule la marque, et la vue recopiait « Infrastructure » en dur. */
	it('le rail ne met en évidence que le domaine servi', async () => {
		const html = await rendu({
			vecteur: { dom: 'Applications' },
			domaines: DOMAINES.filter((d) => d.nom === 'Applications')
		});
		expect(html).toContain('Notes de Applications');
		expect(html).not.toContain('Notes de Infrastructure');
	});

	it('sert la table de modifications reçue', async () => {
		expect(await rendu({})).toContain('modifiée il y a 3 jours');
		const html = await rendu({ modifications: { 'n-restaurer-pg': 42 } });
		expect(html).toContain('modifiée il y a 42 jours');
		/* Une table PARTIELLE est admise, et ce qu'elle ne porte pas se DIT
		   plutôt que de se combler par une valeur d'illustration (P-02). */
		expect(html).toContain('date de modification inconnue');
	});

	/**
	 * LE LIBELLÉ DE JOUR ZÉRO. `joursEcoules()` rend 0 en deçà de vingt-quatre
	 * heures, et la vue disait « modifiée hier » d'une note modifiée le jour même.
	 */
	it('une modification du jour se dit « aujourd’hui », jamais « hier »', async () => {
		const html = await rendu({ modifications: { 'n-restaurer-pg': 0 } });
		expect(html).toContain("modifiée aujourd'hui");
	});

	/**
	 * `univers` N'A AUCUN EFFET DE RENDU DANS UNE VUE DE FORME ABRÉGÉE, et ce
	 * n'est pas un oubli de ce contrôle : `Coquille.svelte` le dit en propres
	 * termes — « en forme abrégée, `univers`, `domaines`, `notes` et
	 * `brancheEnChargement` ne servent PAS au rail : il ne se dérive pas du
	 * corpus », l'arborescence de quinze nœuds étant ÉCRITE AU BALISAGE
	 * (`arborescence-abregee.ts`).
	 *
	 * Écrire ici un contrôle qui « passerait » sur du balisage figé serait une
	 * règle qu'aucun cas n'exerce (P-5) : il rendrait le même verdict avec ou
	 * sans la propriété. La preuve de `univers` est portée par V-14, seule vue
	 * de forme COMPLÈTE de ce lot, où le rail se dérive réellement.
	 */
	it('accepte la liste d’univers reçue sans rien changer au rail abrégé', async () => {
		const restreint = await rendu({ univers: UNIVERS.filter((u) => u.nom === 'Projets') });
		expect(restreint).toEqual(await rendu({}));
	});

	/**
	 * L'ARBRE DU GEL N'EST PLUS LE DÉFAUT DU RAIL ABRÉGÉ, et le cas s'est
	 * retourné avec lui.
	 *
	 * `railAbregeRendu()` prenait les quinze nœuds de la maquette comme VALEUR PAR
	 * DÉFAUT — Production, Infrastructure, Exploitation, Sauvegardes,
	 * Ordonnancement, Astreinte… Une valeur par défaut n'est jamais élaguée : elle
	 * partait dans TOUT paquet montant une coquille, et se lisait dans le source
	 * servi à des instances qui n'ont jamais eu ces domaines. Le repli n'était
	 * d'ailleurs pris que hors application.
	 *
	 * LES DEUX NOMS RESTENT ÉCRITS ICI, ET IL N'Y A PLUS DE SOURCE D'OÙ LES TIRER
	 * — c'est la conséquence directe du retrait : ils ne figuraient dans aucune
	 * donnée du produit, seulement dans la constante supprimée. Ils sont
	 * exactement ce que le cas doit ne plus trouver.
	 */
	it('sans arborescence servie, le rail abrégé ne rend plus l’arbre du gel', async () => {
		/* LA MESURE EST DÉCOUPÉE SUR LE RAIL, et il le faut : « Astreinte » est
		   aussi un DOSSIER du jeu reçu en `notes`, qui se lit légitimement dans les
		   facettes du contenu. Mesurer le document entier confondrait l'arbre écrit
		   au balisage avec le corpus servi. */
		const rail = /<aside class="rail"[\s\S]*?<\/aside>/.exec(await rendu({}))?.[0] ?? '';
		expect(rail).not.toBe('');
		expect(rail).not.toContain('Ordonnancement');
		expect(rail).not.toContain('Astreinte');
		expect(rail).not.toContain('Migration 2026');
	});

	/**
	 * LE CONTRÔLE QUI TIENT LE LOT : sur des sources qui ne portent rien du jeu,
	 * rien du jeu ne doit apparaître dans le CONTENU. Le rail abrégé, lui, est
	 * écrit au balisage du gel et nomme ses propres dossiers : la mesure est
	 * découpée sur le contenu, faute de quoi elle mesurerait ce balisage.
	 */
	it('aucune note du jeu de démonstration n’atteint la liste', async () => {
		const html = await rendu({
			notes: [],
			domaines: DOMAINES.filter((d) => d.nom === 'Migration 2026'),
			modifications: {}
		});
		const contenu = /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? '';
		expect(contenu).not.toContain('Restaurer une sauvegarde PostgreSQL');
		expect(contenu).not.toContain('Karim Belhadj');
		expect(html).not.toContain('Codicillus 1.0.0');
	});
});

/**
 * « FICHE UNDEFINED » — le gabarit gardait sur le mauvais côté.
 *
 * `n.type === 'Fiche' ? motFiche + ' ' + n.typeFiche : n.type` garde sur le TYPE
 * DE NOTE, pas sur la présence du type de FICHE. Or « Fiche » est un type de
 * note offert (`007_types_de_note.montee.sql:29`) et `lireNotes()`
 * (`../lib/donnees/lecture.ts`) n'écrit la clé `typeFiche` que lorsque la note
 * porte un type de fiche : la clé est ABSENTE sinon. Une note de type « Fiche »
 * sans type de fiche rendait donc littéralement la pastille « Fiche undefined »
 * — et le cas était atteignable depuis l'éditeur, qui n'écrivait jamais
 * `type_de_fiche_id`.
 *
 * Le garde est celui de `V-09:198`, le seul qui fût correct : la présence du
 * type de fiche.
 *
 * LES DEUX CAS SONT DÉRIVÉS D'UNE NOTE RÉELLE DU JEU, en retirant ou en posant
 * la seule clé en cause — la même chose que fait la lecture en base selon que
 * `type_de_fiche_id` est nul ou non.
 */
describe('V-12 — la pastille de type ne rend jamais « undefined »', () => {
	const PREMIERE = NOTES[0];
	if (PREMIERE === undefined) throw new Error('seeds/corpus.ts : le corpus de V-12 est vide');

	it('une note de type « Fiche » SANS type de fiche rend son type de note, et rien de plus', async () => {
		const sansTypeDeFiche = { ...PREMIERE, type: 'Fiche' as const };
		delete (sansTypeDeFiche as { typeFiche?: unknown }).typeFiche;
		const html = await rendu({ notes: [sansTypeDeFiche] });
		expect(html).not.toContain('undefined');
		expect(html).toContain('>Fiche<');
	});

	it('une note qui PORTE un type de fiche le nomme', async () => {
		const html = await rendu({
			notes: [{ ...PREMIERE, type: 'Fiche' as const, typeFiche: 'Serveur' as const }]
		});
		expect(html).toContain('Fiche Serveur');
		expect(html).not.toContain('undefined');
	});
});
