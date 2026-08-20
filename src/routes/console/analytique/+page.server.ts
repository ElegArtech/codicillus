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
 * CE QUE CE CHARGEUR NE FAIT PAS
 *
 * Il ne touche pas `src/vues/V-34.svelte`, qui importe ses six tables de mesure
 * au niveau du module (`V-34:89`). Les blocs sont TOUJOURS tous deux dans le
 * document et la feuille en masque un (`V-34:1092-1093`) : les chiffres du jeu
 * restent donc dans le DOM, masqués, hors de portée d'un chargeur. Seule une
 * modification de la vue les en retirerait — hors périmètre de ce lot, écart
 * déclaré au rapport.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { contexteDeRequete, resoudreLaConsole, vecteurDeV34 } from '$lib/donnees/consoles';
import { lireRelations } from '$lib/donnees/lecture';
import type { PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return {
		vecteur: vecteurDeV34(),
		notes: acces.ressource.notes,
		univers: acces.ressource.univers,
		domaines: acces.ressource.domaines,
		compte: acces.ressource.compte,
		relations: await lireRelations(base)
	};
};
