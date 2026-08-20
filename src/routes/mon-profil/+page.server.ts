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
 * CE QUE LE CHARGEUR PASSE — L'ÉCRAN EST BRANCHÉ SUR LA BASE
 *
 *   `notes`             — le périmètre de lecture de l'appelant, jamais le
 *                         corpus. La coquille en déduit l'arborescence du rail :
 *                         le corpus entier publierait la structure interne à qui
 *                         n'y a aucun droit (`RG-ACC-01`).
 *   `vecteur`           — l'onglet, de l'adresse ; le verrou, de la base.
 *   `profilDuCompte`    — le titulaire de la session, `profilAffiche()`. C'est
 *                         lui que l'entête, l'onglet Identité et le panneau
 *                         Session rendent désormais, et non plus `MOI`.
 *   `preferenceDeSession` — `sessions.souvenir` de la session COURANTE.
 *   `contributions`     — CE QUI SE COMPTE EST COMPTÉ, LE RESTE EST DÉCLARÉ
 *                         INDISPONIBLE. `verifications.compte_id` existe : les
 *                         vérifications sont comptées en base. `relations` ne
 *                         porte pas l'auteur du lien : « liens internes créés »
 *                         vaut `null`, et l'écran affiche un état neutre plutôt
 *                         qu'un zéro qui mentirait (`P-02`).
 *   `relations`         — celles du PÉRIMÈTRE, d'où sortent les citations et la
 *                         note phare. Sans elles, l'écran comptait sur le jeu de
 *                         semence.
 *   `activite`          — VIDE. Aucune table d'événements n'existe (§1 de
 *                         `profil.ts`) ; l'onglet rend alors l'encouragement,
 *                         qui est une position du gel et non un écran inventé.
 *   `compte`            — le titulaire, pour la coquille. Les trois champs sont
 *                         des unions du jeu de semence : la conversion est faite
 *                         au bord, comme `src/lib/auth/depot.ts` la fait déjà.
 *
 * `distinctions` N'EST PAS PASSÉE : le barème est un CATALOGUE de critères, pas
 * une mesure. Ses six seuils sont ceux du jeu de semence, la MESURE vient des
 * statistiques ci-dessus, et aucune table ne porte de barème. Le passer vide
 * effacerait l'écran ; le passer tel quel n'affirme rien de faux.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES QUATRE ACTIONS SONT TOUTES NOMMÉES, ET C'EST OBLIGATOIRE
 *
 * SvelteKit rend **500** si une action par défaut cohabite avec une action
 * nommée sur la même page. Cette page en porte quatre : aucune ne peut donc
 * être l'action par défaut. `+page.svelte` les vise par `?/nom`.
 *
 * `ARB-054` §4 borne le reste : `/deconnexion` est la SEULE action d'écriture
 * en GET du produit. Les quatre d'ici sont des POST.
 */
import { fail, error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { lireSeuils } from '$lib/donnees/lecture';
import {
	changerLeMotDePasse,
	compterLesVerifications,
	ecrirePreferenceDeSession,
	initialesDuNom,
	enregistrerLIdentite,
	fermerLesAutresSessions,
	lireLeProfil,
	lireLesNotesDuPerimetre,
	lirePreferenceDeSession,
	ongletDemande,
	profilAffiche,
	vecteurDeV25
} from '$lib/donnees/profil';
import { lireRelationsLisibles } from '$lib/donnees/outils';
import { ouvrirLAcces } from '$lib/donnees/rangement';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import type { NomDAuteur, NomDeDomaine, RoleDeCompte } from '../../../seeds/corpus';

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
	if (identite.type !== 'authentifie' || sessionId === undefined) error(404, MESSAGE_INTROUVABLE);
	const base = basePartagee();
	const profil = await lireLeProfil(base, identite.compteId);
	if (profil === null) error(404, MESSAGE_INTROUVABLE);
	return { base, identite, sessionId, profil };
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { base, identite, sessionId, profil } = await titulaire(locals);

	/* L'instant est pris ici, une fois par requête, et les seuils viennent de la
	   base : `P-01` veut une seule définition de la fraîcheur, seuils compris.
	   V-25 n'affiche aucun signal de fraîcheur, mais `lireNotes()` en calcule un
	   pour toute note qu'il rend, et il n'existe pas deux façons de l'appeler. */
	const contexte = { maintenant: new Date(), seuils: await lireSeuils(base) };
	const affiche = profilAffiche(profil);

	/* Le périmètre sert DEUX fois — les relations lisibles et rien d'autre. Il
	   est ouvert une seule fois : `ouvrirLAcces()` est l'unique porte du dépôt
	   vers les droits résolus, et le rouvrir en dupliquerait la décision. */
	const acces = await ouvrirLAcces(base, identite, contexte.maintenant);

	return {
		vecteur: vecteurDeV25(
			ongletDemande(url.searchParams.get('onglet')),
			profil.motDePasseVerrouille
		),
		notes: await lireLesNotesDuPerimetre(base, identite, contexte),
		profilDuCompte: affiche,
		preferenceDeSession: await lirePreferenceDeSession(base, sessionId),
		/* `verifiees` est COMPTÉ ; `liens` est déclaré indisponible, parce que la
		   table des relations ne porte pas l'auteur du lien. Deux informations
		   différentes, deux rendus différents (`P-02`). */
		contributions: {
			[affiche.nom]: {
				verifiees: await compterLesVerifications(base, identite.compteId),
				liens: null
			}
		},
		relations: await lireRelationsLisibles(base, acces.perimetre),
		/* Aucune table d'événements : le flux est vide, et l'écran le dit. */
		activite: [],
		compte: {
			prenom: affiche.nom.split(' ')[0] ?? affiche.nom,
			nom: affiche.nom as NomDAuteur,
			initiales: initialesDuNom(affiche.nom),
			domaine: affiche.domaine as NomDeDomaine,
			role: affiche.role as RoleDeCompte
		}
	};
};

export const actions: Actions = {
	/**
	 * LE NOM AFFICHÉ ET L'ADRESSE ÉLECTRONIQUE — `#p-affiche`, `#p-courriel`,
	 * `#enregistrer-identite` (`V-25:1060-1093`).
	 *
	 * Le gel intitule le panneau « Ce que vous pouvez modifier » et lui oppose
	 * « Attribué par l'administration » : la frontière est lue, pas choisie. Le
	 * refus d'un compte verrouillé est pris dans `enregistrerLIdentite()`, avant
	 * toute validation de saisie, pour la même raison que le changement de mot de
	 * passe — `RG-CPT-01`, un compte partagé ne se réattribue pas d'ici.
	 */
	enregistrerLIdentite: async ({ locals, request }) => {
		const { base, profil } = await titulaire(locals);
		const champs = await request.formData();
		const issue = await enregistrerLIdentite(base, {
			profil,
			saisies: {
				nom: String(champs.get('p-affiche') ?? ''),
				courriel: String(champs.get('p-courriel') ?? '')
			},
			maintenant: new Date()
		});
		if (issue === 'verrouille') return fail(403, { issue });
		if (issue !== 'enregistre') return fail(400, { issue });
		return { issue };
	},

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
