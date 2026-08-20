/**
 * `/mon-profil` — LE CHARGEUR et LES TROIS ACTIONS de V-25.
 *
 * `docs/routes.md:158` et §5.5 (`:371`) : **302 vers `/connexion?motif=page-protegee`**
 * en anonyme, **V-25** pour tout connecté, sans condition de droit ni de rôle.
 * C'est la seule ligne de la matrice dont les trois colonnes connectées sont
 * identiques : un profil n'a pas de périmètre, il a un titulaire.
 *
 * LA REDIRECTION ANONYME N'EST PAS ÉCRITE ICI, ET C'EST VOULU.
 * `src/lib/auth/garde.ts` range `/mon-profil` au régime `redirection`, et
 * `src/hooks.server.ts` l'applique AVANT toute route — pour le GET comme pour
 * le POST. La réécrire ici ferait deux définitions d'une même règle, dont
 * l'une finirait par mentir. Ce fichier traite donc l'anonyme comme un cas
 * INATTEIGNABLE, et le ferme par défaut plutôt que de le supposer impossible.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LE CHARGEUR PASSE, ET CE QU'IL NE PEUT PAS PASSER
 *
 * `src/vues/V-25.svelte` déclare DEUX propriétés — `vecteur` et `notes` — et
 * lit l'identité qu'il affiche dans `seeds/corpus.ts`. Le chargeur passe donc
 * les deux, et rien d'autre :
 *
 *   `notes`   — le périmètre de lecture de l'appelant, jamais le corpus. La
 *               coquille en déduit l'arborescence du rail : le corpus entier
 *               publierait la structure interne à qui n'y a aucun droit
 *               (`RG-ACC-01`).
 *   `vecteur` — l'onglet, de l'adresse ; le verrou, de la base.
 *
 * L'IDENTITÉ AFFICHÉE RESTE CELLE DU JEU DE SEMENCE. C'est l'écart principal
 * de ce lot, déclaré et non comblé : aucune propriété de V-25 ne reçoit un
 * profil, et `src/vues/` est hors du périmètre de ce lot — cinq lots y
 * travaillent en parallèle. Le profil RÉEL est lu ici (`lireLeProfil`), il
 * gouverne le verrou et le changement de mot de passe, et il n'est PAS renvoyé
 * à la page : une donnée qu'aucun nœud ne rend n'a rien à faire dans la charge
 * sérialisée du document (`ADR-006`, esprit).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TROIS ACTIONS EXISTENT, ET AUCUNE SOUMISSION NE LES ATTEINT ENCORE
 *
 * Les cinq formulaires du gel ne portent NI `method` NI `action` (`ARB-054`
 * §3), et les champs de V-25 n'ont que des `id`. C'est exactement la situation
 * de `POST /connexion` en `T-012` : les actions sont écrites, elles portent les
 * noms de champ du gel — `actuel`, `nouveau`, `confirmation`, `p-session` —, et
 * elles attendent le lot qui reliera le formulaire. Rien ne sera à renommer.
 *
 * `ARB-054` §4 borne le reste : `/deconnexion` est la SEULE action d'écriture
 * en GET du produit. Les trois d'ici sont des POST.
 */
import { fail, error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { lireSeuils } from '$lib/donnees/lecture';
import {
	changerLeMotDePasse,
	ecrirePreferenceDeSession,
	fermerLesAutresSessions,
	lireLeProfil,
	lireLesNotesDuPerimetre,
	ongletDemande,
	vecteurDeV25
} from '$lib/donnees/profil';
import type { Actions, PageServerLoad } from './$types';

/**
 * Le titulaire de la requête — son compte, sa session, son profil en base.
 *
 * Un seul chemin pour les quatre entrées du fichier : le chargeur et les trois
 * actions le franchissent tous, et aucun ne peut donc l'oublier. Le refus est
 * un 404, la réponse que rend une adresse qui ne désigne rien (`ADR-007`) —
 * jamais un message qui expliquerait ce qui manque.
 */
async function titulaire(locals: App.Locals) {
	const identite = locals.identite;
	const sessionId = locals.sessionId;
	/* Inatteignable par construction : `regimeDe('/mon-profil')` vaut
	   `redirection`, et les hooks ont déjà répondu 302. Fermé par défaut tout
	   de même — le jour où le régime changerait, l'omission serait une fuite. */
	if (identite.type !== 'authentifie' || sessionId === undefined) error(404);
	const base = basePartagee();
	const profil = await lireLeProfil(base, identite.compteId);
	if (profil === null) error(404);
	return { base, identite, sessionId, profil };
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { base, identite, profil } = await titulaire(locals);

	/* L'instant est pris ici, une fois par requête, et les seuils viennent de la
	   base : `P-01` veut une seule définition de la fraîcheur, seuils compris.
	   V-25 n'affiche aucun signal de fraîcheur, mais `lireNotes()` en calcule un
	   pour toute note qu'il rend, et il n'existe pas deux façons de l'appeler. */
	const contexte = { maintenant: new Date(), seuils: await lireSeuils(base) };

	return {
		vecteur: vecteurDeV25(
			ongletDemande(url.searchParams.get('onglet')),
			profil.motDePasseVerrouille
		),
		notes: await lireLesNotesDuPerimetre(base, identite, contexte)
	};
};

export const actions: Actions = {
	/**
	 * « Rester connecté sur cet appareil » — `input#p-session` de `V-25:1225`.
	 *
	 * LE MÊME MÉCANISME QUE V-05, ET PAS UN SECOND (`ARB-054` §2) : la colonne
	 * écrite est `sessions.souvenir`, celle que `T-012` pose à la connexion et
	 * que `sessionExpiree()` lit. La case du gel n'a pas d'attribut `name` : sa
	 * PRÉSENCE vaut vrai, quelle que soit la valeur qu'un client lui donnera —
	 * même lecture qu'à `POST /connexion`.
	 */
	preferenceDeSession: async ({ locals, request }) => {
		const { base, sessionId } = await titulaire(locals);
		const champs = await request.formData();
		const souvenir = champs.get('p-session') !== null;
		await ecrirePreferenceDeSession(base, sessionId, souvenir);
		return { issue: 'preference-enregistree', souvenir };
	},

	/**
	 * « Fermer toutes les autres sessions » — `button#fermer-sessions`,
	 * `V-25:1236`. Le geste opère en base ; le nombre rendu est celui qui a été
	 * fermé, jamais un nombre annoncé (`P-02`).
	 */
	fermerLesAutresSessions: async ({ locals }) => {
		const { base, identite, sessionId } = await titulaire(locals);
		const sessionsFermees = await fermerLesAutresSessions(
			base,
			identite.compteId,
			sessionId,
			new Date()
		);
		return { issue: 'autres-sessions-fermees', sessionsFermees };
	},

	/**
	 * Le changement de mot de passe — `form#form-securite`, et la fermeture des
	 * autres sessions qui en fait partie (`V-25:2917`, `ARB-054` §2).
	 *
	 * `RG-M16-02` EST REFUSÉ ICI AUSSI, et pas seulement masqué à l'écran :
	 * `P-09` dit que l'action interdite n'est pas rendue, ce qui ne dispense pas
	 * de la refuser — un client peut composer la requête lui-même. Le refus est
	 * un 403 et non un 404 : le compte de démonstration ne cache pas son état,
	 * l'écran l'explique en toutes lettres.
	 */
	changerLeMotDePasse: async ({ locals, request }) => {
		const { base, sessionId, profil } = await titulaire(locals);
		const champs = await request.formData();
		const resultat = await changerLeMotDePasse(base, {
			profil,
			sessionCourante: sessionId,
			saisies: {
				actuel: String(champs.get('actuel') ?? ''),
				nouveau: String(champs.get('nouveau') ?? ''),
				confirmation: String(champs.get('confirmation') ?? '')
			},
			maintenant: new Date()
		});

		if (resultat.issue === 'verrouille') return fail(403, { issue: resultat.issue });
		if (resultat.issue !== 'change') return fail(400, { issue: resultat.issue });
		return { issue: resultat.issue, sessionsFermees: resultat.sessionsFermees };
	}
};
