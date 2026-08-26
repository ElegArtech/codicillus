/**
 * `/console/analytique` — LE CHARGEUR de V-34, et le seul des onze qui pose un
 * vecteur.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS
 *
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; le seul `error(404, MESSAGE_INTROUVABLE)`
 * du fichier est SANS MESSAGE (`ADR-007`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `P-02` MORD ICI, ET C'EST LE VECTEUR QUI LUI RÉPOND
 *
 * V-34 est un écran de MESURES, et le produit n'en porte aucune : ni journal de
 * recherche, ni consultation horodatée, ni demande de révision, ni compte de
 * modifications par période. Les cinq lacunes sont recensées, une par une avec
 * la table qui manque, dans `MESURES_DE_CONSOLE_SANS_CONTREPARTIE`.
 *
 * `P-02` est sans exception : « Aucun indicateur, aucune tendance, aucun
 * compteur ne peut être figé ou simulé. Une donnée indisponible s'affiche comme
 * telle » (`RG-M01-01`). Servir la section « Suffisantes » afficherait les
 * chiffres du jeu de semence — la valeur illustrative même. Servir des zéros
 * serait pire : « 0 » et « indisponible » sont deux informations différentes, et
 * c'est le ZÉRO MUET que la batterie 8 nomme comme la plus traître des deux
 * fautes.
 *
 * LE GEL PORTE DÉJÀ L'ÉTAT NEUTRE EXPLICITE, et c'est lui qu'on demande. La
 * planche de V-34 a deux positions — « Suffisantes » et « Insuffisantes »
 * (`verif/scenarios/V-34.json`) — et la seconde rend « Pas encore assez d'usage
 * pour conclure », avec sa raison. Le choix n'est donc pas une invention : des
 * deux états que la maquette offre, on demande celui qui ne dit rien de faux.
 * `vecteurDeV34()` le DÉRIVE du recensement plutôt que de l'écrire, pour que le
 * contrôle garde un cas d'épreuve après une migration future (`P-26`).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES CHIFFRES DU JEU NE SONT PLUS DANS LE DOCUMENT, ET C'EST LA VUE QUI A CÉDÉ
 *
 * Ce chargeur demandait l'état neutre, mais V-34 importait ses six tables de
 * mesure au niveau du module : les deux blocs étant TOUJOURS rendus tous les
 * deux et la feuille en masquant un (`V-34:1092-1093`), les chiffres du jeu de
 * démonstration restaient dans le HTML servi, masqués, hors de portée d'un
 * chargeur. Aucun chargeur ne pouvait les en retirer.
 *
 * Les défauts de `seeds/corpus.ts` ont disparu de la vue. Les deux mesures que
 * le produit porte — les consultations de deux fenêtres de sept jours — sont
 * EXIGÉES et comptées ici ; les trois qu'il ne porte pas ont pour défaut l'état
 * VIDE, et vide, chaque bloc qui en dérive ne se rend pas du tout.
 */
import { error } from '@sveltejs/kit';
import { and, count, eq, gte, lt } from 'drizzle-orm';
import { basePartagee, type Base } from '$lib/base/acces';
import { consultations, notes } from '$lib/base/schema';
import {
	contexteDeRequete,
	lireLesDesignationsDeDomaine,
	resoudreLaConsole,
	vecteurDeV34
} from '$lib/donnees/consoles';
import { lireRelations } from '$lib/donnees/lecture';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

/** Sept jours en millisecondes — la fenêtre que l'écran nomme partout. */
const SEPT_JOURS = 7 * 24 * 60 * 60 * 1000;

/**
 * LES CONSULTATIONS D'UNE FENÊTRE, PAR NOTE — et c'est la seule des cinq
 * mesures de V-34 que le produit porte vraiment.
 *
 * `MESURES_DE_CONSOLE_SANS_CONTREPARTIE` comptait encore `MESURES_7J` et
 * `MESURES_7J_PREC` parmi ses lacunes, au motif qu'« aucune table ne porte de
 * consultation horodatée » : la migration `006` en a monté une, elle se
 * remplit, et ces deux lignes la lisent. Les deux entrées ont été retirées du
 * recensement — un registre de lacunes qui ment dispense d'aller voir.
 *
 * LES DEUX AUTRES SÉRIES DE L'ÉCRAN N'ONT TOUJOURS AUCUNE TABLE — le journal de
 * recherche et les demandes de révision. La vue garde donc leur défaut, et le
 * vecteur continue de demander l'état « Pas encore assez d'usage pour
 * conclure » : un seul indicateur réel ne fait pas un tableau de bord.
 */
async function consultationsParNote(
	base: Base,
	depuis: Date,
	avant: Date
): Promise<Record<string, number>> {
	const lignes = await base
		.select({ identifiant: notes.identifiant, n: count() })
		.from(consultations)
		.innerJoin(notes, eq(notes.id, consultations.noteId))
		.where(and(gte(consultations.le, depuis), lt(consultations.le, avant)))
		.groupBy(notes.identifiant);
	return Object.fromEntries(lignes.map((l) => [l.identifiant, Number(l.n)]));
}

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);
	const maintenant = Date.now();

	return {
		vecteur: vecteurDeV34(),
		notes: acces.ressource.notes,
		domaines: acces.ressource.domaines,
		/* NI `univers` NI `compte` : LA COQUILLE LES LIT AU CONTEXTE D'IDENTITÉ.
		   Ils descendaient jusqu'à `CoquilleDeConsole`, qui retombait sur les
		   constantes de `seeds/corpus.ts` dès qu'une route en oubliait un. Le
		   gabarit racine pose le contexte ; les servir ici serait une seconde
		   source, et une charge utile que personne ne lit. */
		relations: await lireRelations(base),
		designations: await lireLesDesignationsDeDomaine(base),
		mesures7j: await consultationsParNote(
			base,
			new Date(maintenant - SEPT_JOURS),
			new Date(maintenant)
		),
		mesures7jPrec: await consultationsParNote(
			base,
			new Date(maintenant - 2 * SEPT_JOURS),
			new Date(maintenant - SEPT_JOURS)
		)
	};
};
