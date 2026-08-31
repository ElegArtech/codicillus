/**
 * `/mon-profil` — LE CHARGEUR et LES TROIS ACTIONS de V-25, pour tout connecté et sans
 * condition de droit ni de rôle : la seule ligne de la matrice dont les trois colonnes
 * connectées sont identiques — un profil n'a pas de périmètre, il a un titulaire. LA
 * REDIRECTION ANONYME N'EST PAS ÉCRITE ICI : `garde.ts` range `/mon-profil` au régime
 * `redirection`, appliqué AVANT toute route. `notes` est le périmètre de LECTURE, jamais
 * le corpus (`RG-ACC-01`).
 *
 * `contributions` — CE QUI SE COMPTE EST COMPTÉ. Les quatre mesures sortent des tables
 * que la base porte déjà (`mesurerLesContributions()`) ; « liens internes créés » n'est
 * plus indisponible : `relations` ne nomme pas l'auteur d'un lien, mais elle nomme sa note
 * SOURCE, et son auteur est connu. `activite` est VIDE, aucune table d'événements
 * n'existant.
 *
 * `distinctions` — LE BARÈME DU PRODUIT, servi tel quel, et les DATES D'OBTENTION lues et
 * consignées par `obtentionsDuCompte()`. L'onglet était vide pour toujours. Ce qui est
 * stocké est l'INSTANT et rien d'autre : le barème est une constante du produit, les
 * mesures se recalculent. TOUT PART DU COMPTE DE LA SESSION — `RG-M16-03` veut les
 * distinctions « individuelles et privées », et aucun paramètre d'adresse n'en désigne
 * un autre.
 *
 * LES QUATRE ACTIONS SONT TOUTES NOMMÉES : SvelteKit rend 500 si une action par défaut
 * cohabite avec une action nommée.
 */
import { fail, error } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { lireSeuils } from '$lib/donnees/lecture';
import {
	changerLeMotDePasse,
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
import {
	BAREME_DES_DISTINCTIONS,
	mesurerLesContributions,
	obtentionsDuCompte
} from '$lib/donnees/distinctions';
import { lireRelationsLisibles } from '$lib/donnees/outils';
import { ouvrirLAcces } from '$lib/donnees/rangement';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';
import type { NomDAuteur, NomDeDomaine, RoleDeCompte } from '../../../seeds/corpus';

/**
 * Le titulaire de la requête — son compte, sa session, son profil en base.
 *
 * Un seul chemin pour les quatre entrées du fichier : aucune ne peut donc
 * l'oublier. Le refus est un 404, la réponse que rend une adresse qui ne désigne
 * rien (`ADR-007`) — jamais un message qui expliquerait ce qui manque.
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

	/* LES QUATRE MESURES SONT LUES UNE FOIS, et elles servent DEUX fois : les
	   indicateurs « Vos contributions » et les jauges de distinction. Deux calculs
	   donneraient deux vérités sur le même écran. L'instant est celui de la requête,
	   celui-là même que la première distinction obtenue portera. */
	const mesures = await mesurerLesContributions(base, identite.compteId);

	return {
		vecteur: vecteurDeV25(
			ongletDemande(url.searchParams.get('onglet')),
			profil.motDePasseVerrouille
		),
		notes: await lireLesNotesDuPerimetre(base, identite, contexte),
		profilDuCompte: affiche,
		/**
		 * LE CHANGEMENT EST-IL IMPOSÉ — `M14.6`. Le compte porte encore le mot de
		 * passe qu'un administrateur lui a posé, et `src/hooks.server.ts` renvoie
		 * ALORS TOUTE ADRESSE ici. Le titulaire cliquait « Accueil » et revenait sur
		 * son profil sans qu'un mot le lui explique : l'écran le dit désormais, et
		 * nomme le geste qui débloque.
		 *
		 * LE VERROU L'EMPORTE, ET C'EST LA MÊME DÉDUCTION QUE `depot.ts` : un compte
		 * à mot de passe verrouillé ne peut pas changer le sien (`RG-CPT-01`), donc
		 * rien ne lui est imposé — et rien ne le retient nulle part.
		 */
		changementImpose: profil.motDePasseAChanger && !profil.motDePasseVerrouille,
		preferenceDeSession: await lirePreferenceDeSession(base, sessionId),
		/* LES DEUX SONT COMPTÉS. `liens` valait `null` — « la table des relations ne
		   porte pas l'auteur du lien » — et l'indicateur restait en état neutre pour
		   toujours, la distinction « Tisseur » avec lui. La table nomme la note SOURCE
		   de chaque relation déclarée, et `notes.auteur_id` nomme son auteur : c'est la
		   seule attribution que la base permette, et elle est réelle. */
		contributions: {
			[affiche.nom]: { verifiees: mesures.verifiees, liens: mesures.liens }
		},
		/* LE BARÈME EST UNE CONSTANTE DU PRODUIT, LES DATES SONT EN BASE. Le premier
		   ne se stocke pas — deux définitions divergent ; les secondes ne se calculent
		   pas — une mesure ne dit jamais QUAND un seuil a été franchi. */
		distinctions: BAREME_DES_DISTINCTIONS,
		obtentions: await obtentionsDuCompte(base, identite.compteId, mesures, contexte.maintenant),
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
	 * LE NOM AFFICHÉ ET L'ADRESSE ÉLECTRONIQUE. Le gel intitule le panneau « Ce que
	 * vous pouvez modifier » et lui oppose « Attribué par l'administration » : la
	 * frontière est lue, pas choisie. Le refus d'un compte verrouillé est pris dans
	 * `enregistrerLIdentite()`, avant toute validation de saisie (`RG-CPT-01`).
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
	 * « Rester connecté sur cet appareil » — LE MÊME MÉCANISME QUE V-05, ET PAS UN
	 * SECOND (`ARB-054` §2) : la colonne écrite est `sessions.souvenir`, celle que la
	 * connexion pose et que `sessionExpiree()` lit. La case du gel n'a pas d'attribut
	 * `name` : sa PRÉSENCE vaut vrai, quelle que soit la valeur qu'un client donnera.
	 */
	preferenceDeSession: async ({ locals, request }) => {
		const { base, sessionId } = await titulaire(locals);
		const champs = await request.formData();
		const souvenir = champs.get('p-session') !== null;
		await ecrirePreferenceDeSession(base, sessionId, souvenir);
		return { issue: 'preference-enregistree', souvenir };
	},

	/**
	 * « Fermer toutes les autres sessions » — le geste opère en base, et le nombre
	 * rendu est celui qui a été fermé, jamais un nombre annoncé (`P-02`).
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
	 * Le changement de mot de passe, et la fermeture des autres sessions qui en fait
	 * partie (`ARB-054` §2). `RG-M16-02` EST REFUSÉ ICI AUSSI, et pas seulement masqué
	 * à l'écran : `P-09` dit que l'action interdite n'est pas rendue, ce qui ne
	 * dispense pas de la refuser — un client peut composer la requête lui-même. Le
	 * refus est un 403 et non un 404 : le compte de démonstration ne cache pas son
	 * état.
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
