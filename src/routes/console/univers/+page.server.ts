/**
 * `/console/univers` — LE CHARGEUR de V-27, et celui qui ferme la seconde fuite.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE FICHIER FERME UNE FUITE MESURÉE, ET IL FAUT DIRE LAQUELLE
 *
 * `ECART-047` É-1, reproduit à la main sur le produit construit le 20 août :
 * cette adresse rendait **200 et 30 315 octets à n'importe quel connecté** —
 * contributeur sans droit, lecteur, rédacteur, gestionnaire. La route existait
 * sans chargeur ni garde, montée par un lot de liaison dont le périmètre les
 * excluait explicitement et le disait. Aucun contrat n'héritait de la garde :
 * c'était un trou du DAG, pas la faute d'un lot livré.
 *
 * `docs/routes.md:167` fixe l'attendu, et il est deux fois motivé : « Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus », parce que la
 * console « n'apparaît pas dans la navigation des autres profils » (`P-09`) et
 * que `RG-ACC-04` interdit que l'accès direct l'apprenne davantage.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN SEUL CHEMIN DE SORTIE — ADR-007, RG-ACC-04
 *
 * Il n'y a qu'un `error(404)` dans ce fichier, SANS MESSAGE, et c'est délibéré :
 * un message entrerait dans le corps rendu et suffirait à rendre le refus
 * discernable de l'inexistence. La décision, elle, est prise une seule fois pour
 * les onze adresses, dans `src/lib/donnees/consoles.ts`, qui rend `INTROUVABLE`
 * — l'objet unique de `resolution.ts`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * AUCUNE RÈGLE DE DROIT N'EST ÉCRITE ICI
 *
 * `event.locals.identite` est posée par `src/hooks.server.ts` — jamais absente,
 * `ANONYME` à défaut. Le rôle est éprouvé par `resolution.ts` (`T-011`), appelé
 * par `consoles.ts` : voir son en-tête pour le motif du détour par
 * `perimetreDeLecture()` plutôt qu'une comparaison de rôle recopiée ici.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE CE CHARGEUR NE FAIT PAS
 *
 * Il ne touche pas `src/vues/V-27.svelte`, et il ne peut donc pas corriger ce
 * que la vue lit du jeu de semence : les univers, les domaines, le compte de
 * l'utilisateur et la version de l'instance y sont importés au niveau du module
 * (`V-27:71`). Seules les NOTES entrent par propriété, et c'est par là que la
 * base entre. Écart déclaré au rapport du lot.
 *
 * `vecteur: null` demande l'état au repos : panneau de formulaire fermé, aucun
 * dialogue de suppression ouvert. Les trois positions de l'axe « Formulaire » et
 * les trois de l'axe « Suppression » sont des états d'INTERACTION, qu'aucune
 * donnée ne détermine ; les faire dépendre de la base serait un comblement.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { contexteDeRequete, resoudreLaConsole } from '$lib/donnees/consoles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404);

	return { vecteur: null, notes: acces.ressource.notes };
};
