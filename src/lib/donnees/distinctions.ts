/**
 * LES DISTINCTIONS DU PROFIL — `RG-M16-03` (`CDC:1326`), « individuelles et privées ».
 *
 * L'onglet « Distinctions » de `/mon-profil` était VIDE POUR TOUJOURS : le chargeur
 * déclarait ne jamais passer de distinction, et V-25 taisait le bloc entier faute d'en
 * recevoir une. L'utilisateur ouvrait un onglet qui ne pouvait rien afficher, et rien ne
 * lui disait pourquoi.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * TROIS DÉCISIONS, ET ELLES TIENNENT TOUT LE MODULE
 *
 * 1. AUCUN BARÈME N'EST STOCKÉ. Les six paliers sont une définition du PRODUIT, comme
 *    les seuils de fraîcheur de `$lib/fraicheur` : ils vivent ici, en un seul endroit.
 *    Une table de barème ferait une seconde définition, et deux définitions divergent.
 *    Ils ne sont PAS importés de `seeds/corpus.ts` — le jeu de démonstration en porte
 *    une copie, qui est de la démonstration ; celle-ci est du produit.
 *
 * 2. AUCUNE MESURE N'EST STOCKÉE. Chaque distinction se dérive des contributions que la
 *    base porte DÉJÀ : `notes.auteur_id` pour les notes écrites, `verifications` pour
 *    les vérifications, `relations` pour les liens déclarés. Une distinction recalculée
 *    ne ment jamais ; un compteur stocké dérive au premier import.
 *
 * 3. CE QUE LE CALCUL NE PEUT PAS RETROUVER EST STOCKÉ, ET LUI SEUL : L'INSTANT. Une
 *    mesure dit qu'un seuil EST franchi, jamais QUAND il l'a été. Sans la table
 *    `distinctions_obtenues` (migration `012`), la distinction se réattribuerait à
 *    chaque affichage et l'écran ne saurait pas dire « obtenue le … ».
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * PRIVÉES — CE QUE LE MOT ENGAGE
 *
 * Toutes les lectures de ce module partent d'un `compteId` que l'appelant tient de la
 * SESSION. Il n'existe ni fonction qui rende les distinctions d'un autre compte, ni
 * classement, ni liste : `RG-M16-03` les interdit, et l'absence de la fonction est la
 * seule garantie qui tienne. Une adresse composée à la main — `/mon-profil?compte=…` —
 * n'a aucun paramètre où se poser.
 */
import { and, count, eq, sql } from 'drizzle-orm';
import type { Base } from '../base/acces';
import { distinctionsObtenues, notes, relations } from '../base/schema';
import { formaterDateCourteFr } from '../dates';
import { compterLesVerifications } from './profil';
import type { Distinction, MesureDeDistinction } from '../../../seeds/corpus';

/**
 * LES SIX PALIERS, tels que `mockups/V-25-profil.html:2506` les dessine. Le barème est
 * repris du gel et n'est pas rouvert ici : ce module le SERT, il ne le décide pas.
 *
 * Le type vient de `seeds/corpus.ts` — un type, jamais une valeur (`eslint.config.js`) :
 * `seeds/` porte les formes du domaine, et c'est sa donnée qui est de la démonstration.
 */
export const BAREME_DES_DISTINCTIONS: readonly Distinction[] = [
	{
		id: 'premier',
		nom: 'Premier pas',
		critere: 'Première note publiée',
		seuil: 1,
		mesure: 'publiees',
		quoi: 'note publiée'
	},
	{
		id: 'veilleur',
		nom: 'Veilleur',
		critere: '10 notes vérifiées',
		seuil: 10,
		mesure: 'verifiees',
		quoi: 'notes vérifiées'
	},
	{
		id: 'redacteur',
		nom: 'Rédacteur',
		critere: '25 notes publiées',
		seuil: 25,
		mesure: 'publiees',
		quoi: 'notes publiées'
	},
	{
		id: 'biblio',
		nom: 'Bibliothécaire',
		critere: '50 notes publiées',
		seuil: 50,
		mesure: 'publiees',
		quoi: 'notes publiées'
	},
	{
		id: 'tisseur',
		nom: 'Tisseur',
		critere: '100 liens internes créés',
		seuil: 100,
		mesure: 'liens',
		quoi: 'liens créés'
	},
	{
		id: 'referent',
		nom: 'Référent',
		critere: 'Une note citée par 20 autres',
		seuil: 20,
		mesure: 'citations',
		quoi: 'citations sur une même note'
	}
];

/**
 * LES QUATRE MESURES D'UN COMPTE, dans les termes exacts que `Distinction.mesure`
 * nomme : le barème et la mesure ne peuvent pas se désaccorder, le compilateur tenant
 * la porte.
 */
export type MesuresDeContribution = Record<MesureDeDistinction, number>;

/**
 * Les contributions RÉELLES d'un compte — quatre `count`, aucune constante.
 *
 * `publiees` — les notes dont il est l'auteur et qui sont publiées. Un brouillon n'est
 * pas une publication : `statut` fait foi, comme partout ailleurs dans le dépôt.
 *
 * `verifiees` — `verifications.compte_id`, la colonne posée pour cela ; le compte est
 * emprunté à `compterLesVerifications()`, l'unique définition du dépôt.
 *
 * `liens` — LES RELATIONS DÉCLARÉES AU DÉPART DE SES NOTES, et c'est la seule
 * attribution que la base permette : `relations` ne porte pas d'auteur de lien (ni
 * colonne de compte, ni horodatage attribuable). L'origine `declaree` écarte les
 * relations DÉDUITES, qui ne sont l'œuvre de personne. C'est une dérivation, pas une
 * invention — et elle vaut mieux qu'un indicateur déclaré indisponible pour toujours.
 *
 * `citations` — LE MAXIMUM d'entrants sur une même note, pas leur somme : le critère du
 * gel dit « une note citée par 20 autres ». Aucune note, aucune citation : zéro.
 */
export async function mesurerLesContributions(
	base: Base,
	compteId: string
): Promise<MesuresDeContribution> {
	const [publiees, verifiees, liens, citations] = await Promise.all([
		base
			.select({ combien: count() })
			.from(notes)
			.where(and(eq(notes.auteurId, compteId), eq(notes.statut, 'publiee'))),
		/* `compterLesVerifications()` est EMPRUNTÉE, jamais redite : c'est déjà
		   l'indicateur « notes vérifiées » du profil, et deux comptes du même fait
		   finiraient par se contredire. */
		compterLesVerifications(base, compteId),
		base
			.select({ combien: count() })
			.from(relations)
			.innerJoin(notes, eq(notes.id, relations.sourceId))
			.where(and(eq(notes.auteurId, compteId), eq(relations.origine, 'declaree'))),
		/* LE MAXIMUM D'ENTRANTS. Il se lit en une requête : les relations groupées par
		   cible, restreintes aux notes du compte. `max(count(*))` n'étant pas
		   composable, l'agrégat extérieur porte sur le résultat groupé. */
		base
			.select({ combien: count() })
			.from(relations)
			.innerJoin(notes, eq(notes.id, relations.cibleId))
			.where(eq(notes.auteurId, compteId))
			.groupBy(relations.cibleId)
			.orderBy(sql`count(*) desc`)
			.limit(1)
	]);
	return {
		publiees: publiees[0]?.combien ?? 0,
		verifiees,
		liens: liens[0]?.combien ?? 0,
		citations: citations[0]?.combien ?? 0
	};
}

/**
 * LES SEUILS QUE LES MESURES FRANCHISSENT ET QUE LA BASE NE CONNAÎT PAS ENCORE —
 * fonction PURE, donc éprouvable dans les deux polarités sans base.
 *
 * Elle est la SEULE décision « cette distinction est obtenue » du dépôt côté écriture :
 * la garder à part de la requête évite qu'un jour deux conditions cohabitent, l'une dans
 * un `where` et l'autre dans un `filter`.
 */
export function distinctionsAConsigner(
	mesures: MesuresDeContribution,
	deja: ReadonlySet<string>,
	bareme: readonly Distinction[] = BAREME_DES_DISTINCTIONS
): readonly string[] {
	return bareme.filter((d) => mesures[d.mesure] >= d.seuil && !deja.has(d.id)).map((d) => d.id);
}

/**
 * Les distinctions qu'un compte a obtenues, par clé, avec la DATE de leur obtention.
 * `Record` vide : aucune obtenue — et l'écran montre alors six jauges en progression,
 * ce qui est une invitation, pas un vide.
 */
export type ObtentionsAffichees = Readonly<Record<string, string>>;

/**
 * LA MÉMOIRE DE L'OBTENTION — lue, complétée, rendue.
 *
 * Elle fait trois choses, dans cet ordre, et l'ordre compte : elle LIT ce que le compte
 * a déjà obtenu, elle CONSIGNE les seuils qui viennent d'être franchis à l'instant
 * donné, puis elle rend l'ensemble à l'écran. Une distinction déjà consignée n'est
 * JAMAIS réécrite — c'est tout l'objet de la table : sans elle, chaque affichage
 * redaterait l'obtention d'aujourd'hui.
 *
 * UNE DISTINCTION NE SE PERD PAS. Un compte dont la mesure retombe sous le seuil — une
 * note dépubliée, une relation défaite — garde sa ligne : elle dit qu'il l'A obtenue,
 * pas qu'il l'a encore. C'est ce que « distinction » veut dire.
 *
 * `ON CONFLICT DO NOTHING` sur la clé primaire `(compte_id, cle)` : deux onglets
 * ouverts au même instant ne se disputent pas la ligne.
 */
export async function obtentionsDuCompte(
	base: Base,
	compteId: string,
	mesures: MesuresDeContribution,
	maintenant: Date,
	bareme: readonly Distinction[] = BAREME_DES_DISTINCTIONS
): Promise<ObtentionsAffichees> {
	const deja = await base
		.select({ cle: distinctionsObtenues.cle, le: distinctionsObtenues.obtenueLe })
		.from(distinctionsObtenues)
		.where(eq(distinctionsObtenues.compteId, compteId));

	const connues = new Map(deja.map((l) => [l.cle, l.le]));
	const cles = distinctionsAConsigner(mesures, new Set(connues.keys()), bareme);

	if (cles.length > 0) {
		await base
			.insert(distinctionsObtenues)
			.values(cles.map((cle) => ({ compteId, cle, obtenueLe: maintenant })))
			.onConflictDoNothing();
		for (const cle of cles) connues.set(cle, maintenant);
	}

	const rendu: Record<string, string> = {};
	for (const [cle, le] of connues) rendu[cle] = formaterDateCourteFr(le);
	return rendu;
}
