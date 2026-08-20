/**
 * `/notes/{identifiant}` — LE CHARGEUR DE LA LECTURE D'UNE NOTE (V-14).
 *
 * `?registre=operationnel` désigne le second registre, et rien d'autre :
 * `docs/routes.md:223` — « le paramètre `?registre=` reste réservé à la
 * lecture » —, `V-14:3958` l'écrit dans l'adresse, « le lien est partageable
 * tel quel ». `/notes/{identifiant}/operationnel` est l'ÉDITEUR (V-18,
 * `docs/routes.md:145`) et n'appartient pas à ce lot.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN SEUL POINT DE SORTIE POUR LE REFUS — ADR-007, RG-ACC-04
 *
 * `lireLaNote()` rend une ressource ou `INTROUVABLE`, sans troisième forme, et
 * ce fichier n'a donc qu'UN `error(404)` : « une note inexistante » et « une
 * note interdite » ne sont pas deux branches qui se ressemblent, c'est le même
 * appel, à la même ligne. Rien ici ne sait laquelle des deux causes s'est
 * réalisée — la garantie est portée par le type, pas par la discipline.
 *
 * CE QUE CE 404 NE REND PAS ENCORE. `docs/routes.md` §5.5 veut **V-04** pour
 * l'anonyme et **V-26** pour le connecté sans droit. Ces deux écrans sont
 * l'objet de `T-035` (`docs/plan-cablage.md`, vague 2 : « adresse non résolue |
 * V-02, V-03, V-04, V-26 ») : les peindre ici demanderait une page d'erreur, et
 * ce lot ne la pose pas. Le code de statut, lui, est celui que §5.5 exige, et
 * les deux côtés du couple sont indiscernables — c'est ce que mesure
 * `pnpm test:etancheite`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DROITS SONT RÉSOLUS, JAMAIS RECOPIÉS
 *
 * `src/lib/droits/resolution.ts` est l'implémentation unique (T-011), et
 * jusqu'au 20 août aucune route ne l'appelait — la cause de la fuite mesurée à
 * `ECART-047` É-1. L'identité vient de `event.locals.identite`, posée par
 * `src/hooks.server.ts` pour chaque requête ; elle vaut `ANONYME` ou une
 * identité authentifiée, jamais rien.
 *
 * L'INSTANT DE RÉFÉRENCE EST PRIS ICI, UNE FOIS. `lireNotes()` l'exige en
 * paramètre : une couche de lecture qui prendrait l'heure elle-même rendrait
 * ses résultats non reproductibles. En service, la fraîcheur est vraie
 * MAINTENANT.
 */
import { error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { lireSeuils } from '$lib/donnees/lecture';
import { lireLaNote, registreDemande } from '$lib/donnees/note';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const base = basePartagee();
	const contexte = { maintenant: new Date(), seuils: await lireSeuils(base) };
	const registre = registreDemande(url.searchParams.get('registre'));

	const resolution = await lireLaNote(base, {
		identifiant: params.identifiant,
		registre,
		identite: locals.identite,
		contexte
	});

	if (!resolution.trouve) error(404);
	const lecture = resolution.ressource;

	return {
		/**
		 * LE VECTEUR D'ÉTAT DE V-14, et il ne porte que ce qui est VRAI de cet
		 * appelant-ci : ses droits.
		 *
		 * Les six autres leviers de la planche — `fr`, `c-revision`,
		 * `c-brouillon`, `c-resync`, `c-op`, `etat` — décrivent LA NOTE AFFICHÉE.
		 * Or l'article de V-14 est la transcription gelée de `n-restaurer-pg`
		 * (`src/lib/lecture/CorpsReference.svelte`, `note-de-demonstration.ts`),
		 * et la vue n'accepte aucune propriété de note : les piloter depuis une
		 * AUTRE note peindrait les attributs d'une note sur le corps d'une autre
		 * — la « valeur illustrative » que P-02 proscrit. Ils restent donc à leur
		 * position du gel, et l'écart est déclaré au rapport du lot.
		 *
		 * `droits`, lui, est une propriété de l'APPELANT, vraie quelle que soit
		 * la note : la capacité d'écrire vient de `capacites()` (CDC §2.3), et
		 * c'est elle qui décide de l'ÉMISSION des actions d'écriture (P-09,
		 * ARB-040 : omises, jamais masquées).
		 */
		vecteur: { droits: lecture.capacites.ecrireDesNotes ? 'ecriture' : 'lecture' },
		notes: lecture.notes,
		/**
		 * LA NOTE RÉELLE, SON CORPS ET SES RÉTROLIENS — chargés, servis à la page,
		 * et QU'AUCUN NŒUD DE V-14 NE PEUT RECEVOIR à ce jour : la vue déclare
		 * deux propriétés (`vecteur`, `notes`) et lit tout le reste de
		 * `seeds/corpus.ts` et de `$lib/lecture/note-de-demonstration.ts`. Aucun
		 * fichier de `src/vues/` n'est touché par ce lot — c'est la règle de la
		 * vague —, donc l'écran reste celui du gel. Écart déclaré, chiffré au
		 * rapport.
		 */
		lecture: {
			note: lecture.note,
			registre,
			corps: lecture.corps,
			retroliens: lecture.retroliens
		}
	};
};
