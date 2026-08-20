/**
 * LE PROFIL, LE COMPTE ET LA RÉINITIALISATION — la donnée de V-25 et de V-06.
 *
 * Lot `T-038`, câblage. Ce module suit la répartition que `T-011` a posée pour
 * les droits et que `T-012` a reprise pour l'authentification : les DÉCISIONS
 * d'un côté, éprouvables sans base ; les REQUÊTES de l'autre, qui ne décident
 * rien. Une règle qu'on ne peut éprouver qu'avec un serveur debout est une
 * règle qu'on éprouve rarement.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL N'ÉCRIT PAS
 *
 *  - AUCUNE RÈGLE DE DROIT. `src/lib/droits/resolution.ts` est l'implémentation
 *    unique ; le périmètre de lecture est demandé à `identifiantsLisibles()`,
 *    jamais recalculé.
 *  - AUCUN SECOND MÉCANISME DE « RESTER CONNECTÉ ». `ARB-054` §2 est explicite :
 *    le lot qui porte V-25 « ne crée pas un second mécanisme : il lit et écrit
 *    le même ». Le même veut dire `sessions.souvenir`, posé par `T-012` à la
 *    connexion et lu par `sessionExpiree()` de `src/lib/auth/sessions.ts`. Ce
 *    module ne fait que le lire et l'écrire sur la session COURANTE.
 *  - AUCUN CALCUL DE FRAÎCHEUR. `P-01` : V-25 n'affiche aucun signal de
 *    fraîcheur, et rien n'est recalculé ici. Les seuils traversent ce module
 *    dans le contexte de lecture, sans être relus.
 *  - AUCUNE VALEUR DE POLITIQUE DE MOT DE PASSE choisie ici : elle est
 *    TRANSCRITE du gel (voir §4).
 */
import { and, eq, isNull, ne } from 'drizzle-orm';
import type { Base } from '../base/acces';
import { comptes, domaines, sessions } from '../base/schema';
import { hacherMotDePasse, motDePasseCorrespond } from '../auth/mots-de-passe';
import type { Identite } from '../droits/resolution';
import { identifiantsLisibles, type DonneeSansContrepartie } from './accueil';
import { lireNotes, type ContexteDeLecture } from './lecture';
import type { Note } from '../../../seeds/corpus';

/* ═══════════════════════════════════════════════════════════════════════════
   1. CE QUE LA BASE NE PORTE PAS — compté, jamais comblé

   `P-02` : « aucune valeur illustrative ». Une donnée que la base ne porte pas
   ne se fabrique pas ; elle se nomme. Le type est celui de `T-031`
   (`accueil.ts`), réemployé pour que les deux listes se comptent ensemble.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * LES SIX DONNÉES DE V-25 ET V-06 QUE LA BASE NE PORTE PAS — relevées sur
 * `src/lib/base/schema.ts`, table par table, jamais supposées.
 *
 * Elles sont rangées ici et non dans `accueil.ts` parce qu'elles portent sur
 * d'autres écrans ; `accueil.test.ts` et `profil.test.ts` les comptent chacun
 * de leur côté, de sorte qu'une migration future fasse rougir un test plutôt
 * que de laisser un commentaire périmé derrière elle.
 */
export const SANS_CONTREPARTIE_EN_BASE: readonly DonneeSansContrepartie[] = [
	{
		donnee: 'CONTRIBUTIONS',
		vue: 'V-25',
		affichage: 'indicateurs « notes vérifiées » et « liens internes créés »',
		motif:
			'`verifications` porte une ligne par vérification, mais le jeu de semence n’en écrit aucune ; `relations` ne porte pas l’auteur du lien. Les deux nombres sont DÉCLARÉS par le corpus, qui l’écrit de lui-même : « ce qui est calculable l’est ; le reste est déclaré ici plutôt que deviné dans la vue ».'
	},
	{
		donnee: 'DISTINCTIONS',
		vue: 'V-25',
		affichage: 'les six jauges de l’onglet « Distinctions »',
		motif:
			'aucune table de distinction. Les seuils et les libellés sont un catalogue du jeu de semence ; la MESURE, elle, est calculée sur les statistiques par `progression()`, donc jamais figée — c’est le catalogue qui manque en base, pas la valeur.'
	},
	{
		donnee: 'ACTIVITE',
		vue: 'V-25',
		affichage: 'le flux de l’onglet « Activité »',
		motif:
			'aucune table d’événements — même absence que `T-031` a relevée pour V-07. `versions` et `verifications` portent deux des cinq types du jeu ; publication, révision et import n’ont aucune trace.'
	},
	{
		donnee: 'comptes.derniere_connexion_le (le libellé)',
		vue: 'V-25',
		affichage: '« Dernière connexion — aujourd’hui à 08:41 »',
		motif:
			'la colonne porte l’INSTANT, et le gel n’écrit que le LIBELLÉ relatif sans donner la règle de passage de l’un à l’autre (`schema.ts`, `comptes.derniereConnexionLe`). Inventer la règle serait un comblement.'
	},
	{
		donnee: 'préférence « Recevoir les demandes de révision par courriel »',
		vue: 'V-25',
		affichage: 'le second interrupteur du panneau « Session »',
		motif:
			'aucune colonne de préférence de notification sur `comptes`, aucune table de préférences. Le gel pose l’interrupteur coché au balisage et ne lui attache AUCUN gestionnaire : rien ne dit ce qu’il persiste.'
	},
	{
		donnee: 'jeton de réinitialisation',
		vue: 'V-06',
		affichage: 'les étapes 3 et 4 de `/mot-de-passe-oublie/{jeton}`',
		motif:
			'AUCUNE TABLE. Le schéma porte `sessions` et `tentatives_de_connexion` ; il n’existe ni table de jeton, ni colonne de jeton sur `comptes`. `base/**` n’est pas le périmètre de ce lot : la lacune est déclarée, pas migrée.'
	}
];

/* ═══════════════════════════════════════════════════════════════════════════
   2. LE PROFIL DU COMPTE CONNECTÉ — ce que la base porte, et qui n'atteint
      pas encore l'écran

   La base porte huit des neuf valeurs d'identité que V-25 affiche. Ce que
   l'écran en reçoit est une autre affaire, et c'est un écart déclaré au
   rapport du lot : `src/vues/V-25.svelte` ne déclare que deux propriétés —
   `vecteur` et `notes` — et lit l'identité affichée dans `seeds/corpus.ts`.
   Aucun chargeur ne peut donc la lui passer, et `src/vues/` est hors du
   périmètre de ce lot.
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Le profil tel que la base le porte.
 *
 * `derniereConnexionLe` est un INSTANT et le reste : le libellé relatif du gel
 * n'a pas de règle écrite, et il figure à la liste du §1 plutôt que d'être
 * fabriqué ici.
 */
export interface ProfilDuCompte {
	readonly compteId: string;
	readonly identifiant: string;
	readonly nom: string;
	readonly courriel: string;
	readonly role: string;
	/** Le domaine principal, ou `null` — `RG-M14-04` le veut détachable. */
	readonly domaine: string | null;
	readonly arriveLe: string;
	readonly derniereConnexionLe: Date | null;
	/** `RG-M16-02` et `RG-CPT-01` — le mot de passe est géré par l'administration. */
	readonly motDePasseVerrouille: boolean;
}

/** Le profil d'un compte, ou `null` si le compte n'existe pas. */
export async function lireLeProfil(base: Base, compteId: string): Promise<ProfilDuCompte | null> {
	const lignes = await base
		.select({
			compteId: comptes.id,
			identifiant: comptes.identifiant,
			nom: comptes.nom,
			courriel: comptes.courriel,
			role: comptes.role,
			domaine: domaines.nom,
			arriveLe: comptes.arriveLe,
			derniereConnexionLe: comptes.derniereConnexionLe,
			motDePasseVerrouille: comptes.motDePasseVerrouille
		})
		.from(comptes)
		.leftJoin(domaines, eq(domaines.id, comptes.domaineId))
		.where(eq(comptes.id, compteId))
		.limit(1);
	return lignes[0] ?? null;
}

/**
 * Les notes que l'identité peut lire, dans la forme que V-25 déclare.
 *
 * ELLES SERVENT DEUX FOIS, ET LA SECONDE DÉCIDE DE LEUR PORTÉE : la coquille
 * en déduit l'arborescence du rail (`Coquille.svelte`, `sectionsDuRail`), et
 * l'onglet « Distinctions » y compte les contributions. Le rail interdit donc
 * le corpus entier : `RG-ACC-01` — aucun contenu hors périmètre, par aucun
 * chemin. Conséquence assumée et remontée au rapport : les indicateurs de
 * contribution ne comptent que les notes du PÉRIMÈTRE de l'appelant, ce qui
 * n'est pas la même chose que « toutes les notes dont il est l'auteur ».
 */
export async function lireLesNotesDuPerimetre(
	base: Base,
	identite: Identite,
	contexte: ContexteDeLecture
): Promise<readonly Note[]> {
	const retenus = await identifiantsLisibles(base, identite);
	if (retenus.size === 0) return [];
	const corpus = await lireNotes(base, contexte);
	return corpus.filter((n) => retenus.has(n.id));
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. LES VECTEURS DE PLANCHE

   Une vue de planche reçoit son état par un vecteur, dont les noms sont ceux
   de `verif/scenarios/V-xx.json`. Ce module le compose à UN SEUL ENDROIT, sur
   le modèle de `vecteurDeV22()` et `vecteurDeV23()` de `T-034`.
   ═════════════════════════════════════════════════════════════════════════ */

/** Les quatre onglets de V-25 — `docs/routes.md:283`, axe `ong` de la planche. */
export const ONGLETS = ['identite', 'securite', 'distinctions', 'activite'] as const;

export type Onglet = (typeof ONGLETS)[number];

/**
 * L'onglet demandé par `?onglet=`, ou le défaut.
 *
 * Une valeur inconnue RETOMBE sur le défaut plutôt que de rendre 404 : le
 * paramètre est un réglage d'affichage, pas une ressource, et `docs/routes.md`
 * §5.3 le range parmi les paramètres de vue. Le défaut est celui du balisage
 * gelé, `identite`.
 */
export function ongletDemande(parametre: string | null): Onglet {
	const trouve = ONGLETS.find((o) => o === parametre);
	return trouve ?? 'identite';
}

/**
 * LE VECTEUR DE V-25 — deux axes sur trois, et le troisième est un écart.
 *
 *   `ong`      — l'onglet, de l'adresse. Réel.
 *   `c-verrou` — `comptes.mot_de_passe_verrouille` du compte connecté. Réel,
 *                lu en base, et c'est `RG-M16-02` : le formulaire cède la place
 *                à l'explication « Compte de démonstration ».
 *   `cpt`      — NON POSÉ, et c'est délibéré. L'axe « Compte » de la planche
 *                choisit entre deux comptes du jeu de semence, que la vue lit
 *                elle-même dans `seeds/corpus.ts` ; aucune de ses deux
 *                positions ne désigne « le compte connecté ». Lui donner une
 *                valeur d'après l'identifiant de l'appelant serait une
 *                correspondance qu'aucune source n'écrit — un comblement. La
 *                vue rend donc sa position par défaut, celle du gel. L'écart
 *                est déclaré au rapport du lot.
 */
export function vecteurDeV25(
	onglet: Onglet,
	verrouille: boolean
): Record<string, string | boolean> {
	return { ong: onglet, 'c-verrou': verrouille };
}

/**
 * LE VECTEUR DE V-06, ÉTAPE 1 — `/mot-de-passe-oublie`.
 *
 * `cpt` reste à `connu`, sa position par défaut, ET IL NE PEUT PAS EN SORTIR :
 * la position `inconnu` empile une notification dans la vue, ce qui
 * RÉVÉLERAIT qu'un identifiant n'existe pas. `RG-ACC-04` l'interdit, et le gel
 * lui-même écrit que ce contrôle « ne change rien à l'écran d'envoi : c'est
 * précisément ce qu'il faut vérifier ». Aucun chemin de ce module ne le pose.
 */
export function vecteurDeV06Etape1(): Record<string, string | boolean> {
	return { et: '1', cpt: 'connu', 'c-expire': false };
}

/**
 * LE VECTEUR DE V-06 POUR UNE ADRESSE PORTEUSE D'UN JETON.
 *
 * ÉTAT RENDU : « Lien expiré ». Ce n'est pas un choix d'écran, c'est le seul
 * énoncé vrai. Aucune table ne porte de jeton de réinitialisation (§1) : il
 * n'existe donc AUCUN jeton valide, et tout jeton présenté est inconnu. Rendre
 * l'étape 3 — la saisie d'un nouveau mot de passe — laisserait croire qu'un
 * lien vient d'être honoré, et la saisie n'aboutirait nulle part.
 *
 * L'état existe au gel (`c-expire`, rang 3 de `ORDRE`), et la réponse est la
 * MÊME pour tout jeton : elle ne dit rien de l'existence d'un compte.
 */
export function vecteurDeV06LienInconnu(): Record<string, string | boolean> {
	return { et: '3', cpt: 'connu', 'c-expire': true };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. LA POLITIQUE DE MOT DE PASSE — TRANSCRITE DU GEL, JAMAIS CHOISIE

   `mockups/V-25-profil.html:2618-2665`, `creerRobustesse()` : `MINI = 12`,
   `natures()` et les trois règles `longueur`, `varie`, `different`. Les trois
   libellés en sont l'énoncé à l'écran (`V-25:1160-1162`) : « 12 caractères au
   minimum », « Au moins deux natures de caractères différentes », « Différent
   de votre identifiant ». `RG-M16-01` exige une politique ; le gel en donne la
   lettre, et les maquettes priment.

   POURQUOI CÔTÉ SERVEUR ALORS QUE LE GEL LA JOUE AU NAVIGATEUR : un contrôle
   de saisie n'est pas une application de règle. Le gel ne peut pas se protéger
   d'une requête composée à la main ; c'est le raisonnement que `T-034` a écrit
   pour le droit de rédaction — « l'absence de bouton n'est pas un contrôle
   d'accès ».

   LES CLASSES DE CARACTÈRES SONT RECOPIÉES TELLES QUELLES, bornes comprises.
   Les deux classes de lettres accentuées recouvrent au passage deux signes
   d'opération latins-1, ce qui rend le compte des « natures » légèrement
   généreux. C'est le comportement du gel, mesurable et identique des deux
   côtés ; le corriger ici ferait diverger le serveur de l'écran, et la
   divergence est le seul vrai défaut.
   ═════════════════════════════════════════════════════════════════════════ */

/** `MINI` du gel — `mockups/V-25-profil.html:2619`. */
export const MINIMUM_DE_CARACTERES = 12;

/** `natures()` du gel — quatre classes, comptées présentes ou absentes. */
export function naturesDeCaracteres(clair: string): number {
	let n = 0;
	if (/[a-zà-ÿ]/.test(clair)) n++;
	if (/[A-ZÀ-Ý]/.test(clair)) n++;
	if (/[0-9]/.test(clair)) n++;
	if (/[^a-zà-ÿA-ZÀ-Ý0-9]/.test(clair)) n++;
	return n;
}

/** Les trois règles, dans l'ordre où le gel les énonce à l'écran. */
export interface ReglesDuMotDePasse {
	readonly longueur: boolean;
	readonly varie: boolean;
	readonly different: boolean;
}

/**
 * `evaluer()` du gel, réduit à sa décision : `ok.longueur && ok.varie &&
 * ok.different`. Le reste de la fonction gelée — segments, niveau, libellé —
 * peint l'indicateur de robustesse ; il n'entre dans aucune décision, et il
 * appartient à la vue.
 */
export function reglesDuMotDePasse(clair: string, identifiant: string): ReglesDuMotDePasse {
	const interdit = identifiant.toLowerCase();
	return {
		longueur: clair.length >= MINIMUM_DE_CARACTERES,
		varie: naturesDeCaracteres(clair) >= 2,
		different: clair.length > 0 && (interdit === '' || !clair.toLowerCase().includes(interdit))
	};
}

/** Les trois règles tenues ensemble. */
export function motDePasseAcceptable(clair: string, identifiant: string): boolean {
	const r = reglesDuMotDePasse(clair, identifiant);
	return r.longueur && r.varie && r.different;
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. LES TROIS GESTES DE SESSION D'`ARB-054`

   « Rester connecté sur cet appareil » est une PRÉFÉRENCE persistée dans V-25
   là où V-05 en fait une case de connexion ; « Fermer toutes les autres
   sessions » opère en base ; le changement de mot de passe ferme les autres
   sessions. Les trois portent sur `sessions`, la table de `T-012`, et sur son
   unique colonne `souvenir`.

   UNE SESSION `souvenir` N'EXPIRE NI PAR INACTIVITÉ NI PAR ÉCHÉANCE
   (`ARB-054` §2). Rien n'est à écrire ici pour cela : `sessionExpiree()` de
   `src/lib/auth/sessions.ts` porte déjà la règle, et ce module se contente de
   basculer la colonne qu'elle lit. C'est ce que « le même mécanisme » veut
   dire.
   ═════════════════════════════════════════════════════════════════════════ */

/** La préférence de la session courante, telle que la table la porte. */
export async function lirePreferenceDeSession(base: Base, sessionId: string): Promise<boolean> {
	const lignes = await base
		.select({ souvenir: sessions.souvenir })
		.from(sessions)
		.where(eq(sessions.id, sessionId))
		.limit(1);
	return lignes[0]?.souvenir ?? false;
}

/**
 * Écrit la préférence sur la session COURANTE, et sur elle seule.
 *
 * « Rester connecté SUR CET APPAREIL » (`V-25:1222`) : l'appareil, c'est la
 * session. La porter sur le compte l'étendrait aux autres appareils, ce que la
 * phrase gelée exclut.
 *
 * Le retrait de l'option est l'une des cinq fins de vie qu'`ARB-054` énumère :
 * repasser à `false` rend la session au délai d'inactivité, sans autre geste.
 */
export async function ecrirePreferenceDeSession(
	base: Base,
	sessionId: string,
	souvenir: boolean
): Promise<void> {
	await base.update(sessions).set({ souvenir }).where(eq(sessions.id, sessionId));
}

/**
 * « Fermer toutes les autres sessions » (`V-25:1236`) — rend le nombre fermé.
 *
 * `fermee_le` est posé, la ligne est gardée : la fermeture est définitive et la
 * trace reste, comme pour `fermerLaSession()` de `T-012`. La session courante
 * est explicitement épargnée — le libellé gelé dit « les AUTRES ».
 *
 * Le nombre rendu est mesuré, jamais annoncé : `P-02`. Un appelant qui n'a
 * qu'une session en ferme zéro, et c'est le résultat juste.
 */
export async function fermerLesAutresSessions(
	base: Base,
	compteId: string,
	sessionCourante: string,
	maintenant: Date
): Promise<number> {
	const fermees = await base
		.update(sessions)
		.set({ fermeeLe: maintenant })
		.where(
			and(
				eq(sessions.compteId, compteId),
				ne(sessions.id, sessionCourante),
				isNull(sessions.fermeeLe)
			)
		)
		.returning({ id: sessions.id });
	return fermees.length;
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. LE CHANGEMENT DE MOT DE PASSE
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * Les issues du changement. Elles ne se recouvrent pas, et l'ordre dans lequel
 * elles sont décidées est celui du gel, `RG-M16-02` d'abord.
 *
 *   `verrouille`   — `RG-M16-02` : le mot de passe est géré par l'administration.
 *   `actuel-faux`  — le mot de passe actuel ne correspond pas.
 *   `regles`       — la politique du §4 n'est pas tenue.
 *   `confirmation` — les deux saisies diffèrent (`verifierConfirmation()`).
 *   `change`       — écrit, et les autres sessions fermées.
 */
export type IssueDuChangement = 'verrouille' | 'actuel-faux' | 'regles' | 'confirmation' | 'change';

/** Ce que le changement rapporte. `sessionsFermees` vaut 0 hors de `change`. */
export interface ResultatDuChangement {
	readonly issue: IssueDuChangement;
	readonly sessionsFermees: number;
}

/** Les trois saisies du formulaire gelé — `#actuel`, `#nouveau`, `#confirmation`. */
export interface SaisiesDuChangement {
	readonly actuel: string;
	readonly nouveau: string;
	readonly confirmation: string;
}

/**
 * LE CHANGEMENT DE MOT DE PASSE, ET LA FERMETURE QUI L'ACCOMPAGNE.
 *
 * `ARB-054` §2, sur la foi de `V-25:2917` — « Mot de passe changé, vos autres
 * sessions ont été fermées » : la fermeture n'est pas une option, elle fait
 * partie du geste. Elle est donc ici, dans la fonction qui change, et non chez
 * l'appelant qui pourrait l'oublier.
 *
 * `RG-M16-02` EST APPLIQUÉ AVANT TOUTE VÉRIFICATION. Un compte verrouillé
 * n'est pas un compte dont le mot de passe actuel serait faux : c'est un compte
 * dont le mot de passe ne se change pas d'ici. Vérifier d'abord donnerait à
 * l'appelant un oracle sur le mot de passe d'un compte partagé (`RG-CPT-01`).
 *
 * LA SESSION COURANTE SURVIT. Celui qui change son mot de passe ne se
 * déconnecte pas lui-même — le gel le laisse sur son écran, avec une
 * notification.
 */
export async function changerLeMotDePasse(
	base: Base,
	demande: {
		readonly profil: ProfilDuCompte;
		readonly sessionCourante: string;
		readonly saisies: SaisiesDuChangement;
		readonly maintenant: Date;
	}
): Promise<ResultatDuChangement> {
	const { profil, saisies } = demande;

	if (profil.motDePasseVerrouille) return { issue: 'verrouille', sessionsFermees: 0 };

	const condensats = await base
		.select({ condensat: comptes.condensatMotDePasse })
		.from(comptes)
		.where(eq(comptes.id, profil.compteId))
		.limit(1);

	/* `motDePasseCorrespond()` accepte `null` et vérifie alors un condensat
	   leurre : un compte sans mot de passe posé coûte le même temps qu'un mot
	   de passe faux, et rend le même refus (`T-012`, `ARB-005`). */
	const correspond = await motDePasseCorrespond(condensats[0]?.condensat, saisies.actuel);
	if (!correspond) return { issue: 'actuel-faux', sessionsFermees: 0 };

	if (!motDePasseAcceptable(saisies.nouveau, profil.identifiant)) {
		return { issue: 'regles', sessionsFermees: 0 };
	}

	if (saisies.confirmation !== saisies.nouveau) {
		return { issue: 'confirmation', sessionsFermees: 0 };
	}

	await base
		.update(comptes)
		.set({
			condensatMotDePasse: await hacherMotDePasse(saisies.nouveau),
			modifieLe: demande.maintenant
		})
		.where(eq(comptes.id, profil.compteId));

	const sessionsFermees = await fermerLesAutresSessions(
		base,
		profil.compteId,
		demande.sessionCourante,
		demande.maintenant
	);
	return { issue: 'change', sessionsFermees };
}
