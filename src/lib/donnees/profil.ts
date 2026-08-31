/**
 * Le profil, le compte et la réinitialisation — la donnée de V-25 et de V-06. Les DÉCISIONS
 * d'un côté, éprouvables sans base ; les REQUÊTES de l'autre, qui ne décident rien.
 *
 * CE QU'IL N'ÉCRIT PAS : aucune règle de droit — le périmètre est demandé à
 * `identifiantsLisibles()` ; aucun SECOND mécanisme de « rester connecté » — `ARB-054` §2 :
 * « il lit et écrit le même », c'est-à-dire `sessions.souvenir` ; aucun calcul de fraîcheur ;
 * aucune valeur de politique de mot de passe choisie ici, elles sont TRANSCRITES du gel.
 */
import { and, count, eq, isNull, ne } from 'drizzle-orm';
import type { Base } from '../base/acces';
import { comptes, domaines, sessions, verifications } from '../base/schema';
import { hacherMotDePasse, motDePasseCorrespond } from '../auth/mots-de-passe';
import { formaterDateFr, formaterDateHeureFr } from '../dates';
import type { Identite } from '../droits/resolution';
import { identifiantsLisibles, type DonneeSansContrepartie } from './accueil';
import { lireNotes, ROLE_DEPUIS_ENUM, type ContexteDeLecture } from './lecture';
import type { Note } from '../../../seeds/corpus';

/* 1. Ce que la base ne porte pas — compté, jamais comblé. Le type est celui
   d'`accueil.ts`, réemployé pour que les deux listes se comptent ensemble. */

/**
 * Les données de V-25 et V-06 que la base ne porte pas — relevées sur le schéma,
 * table par table. Elles sont ici et non dans `accueil.ts` parce qu'elles portent
 * sur d'autres écrans, et chaque test les compte de son côté : une migration future
 * fera rougir un test plutôt que de laisser un commentaire périmé.
 */
export const SANS_CONTREPARTIE_EN_BASE: readonly DonneeSansContrepartie[] = [
	{
		donnee: 'CONTRIBUTIONS.liens',
		vue: 'V-25',
		affichage: 'indicateur « liens internes créés » et les distinctions qui le mesurent',
		motif:
			'`relations` ne porte PAS l’auteur du lien — ni colonne de compte, ni horodatage attribuable (`schema.ts`, table `relations` : `source_id`, `cible_id`, `type_de_relation_id`, `origine`, `cree_le`). Le nombre est donc INDISPONIBLE, et il s’affiche comme tel plutôt qu’en zéro muet (`P-02`). Son voisin « notes vérifiées » n’est plus de cette liste : `verifications.compte_id` existe, et `compterLesVerifications()` le compte pour de bon.'
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
		donnee: 'comptes.derniere_connexion_le (le LIBELLÉ RELATIF)',
		vue: 'V-25',
		affichage:
			'l’instant en toutes lettres — « 20 août 2026 à 08:41 » — et non « aujourd’hui à 08:41 »',
		motif:
			'la colonne porte l’INSTANT, et elle est désormais AFFICHÉE : `formaterDateHeureFr()`, l’implémentation unique de `../dates`, la met en français. Ce qui manque est la règle de passage de l’instant au libellé RELATIF que le gel écrit ; aucune source ne la donne, et `dates.ts` n’a pas de formateur relatif. L’inventer serait un comblement ; afficher l’instant ne l’est pas.'
	},
	{
		donnee: 'préférence « Recevoir les demandes de révision par courriel »',
		vue: 'V-25',
		affichage: 'RIEN — le second interrupteur du panneau « Session » N’EST PLUS ÉMIS',
		motif:
			'aucune colonne de préférence de notification sur `comptes`, aucune table de préférences, ET AUCUN EXPÉDITEUR DE COURRIEL DANS LE PRODUIT : le message promis ne partirait de nulle part. Le gel posait l’interrupteur coché au balisage sans lui attacher aucun gestionnaire — un geste dessiné qu’aucune couche ne pouvait tenir. Il est retiré, comme `+layout.svelte` retire la ligne de synchronisation de V-07.'
	},
	{
		donnee: 'jeton de réinitialisation',
		vue: 'V-06',
		affichage:
			'RIEN — le parcours de réinitialisation par courriel n’est plus offert, et l’écran le déclare',
		motif:
			'AUCUNE TABLE. Le schéma porte `sessions` et `tentatives_de_connexion` ; il n’existe ni table de jeton, ni colonne de jeton sur `comptes`. Et aucun expéditeur de courriel n’existe pour porter le lien. Les deux adresses de V-06 rendent donc l’indisponibilité et orientent vers la réinitialisation par un administrateur, qui, elle, existe.'
	}
];

/* 2. Le profil du compte connecté. La base porte huit des neuf valeurs d'identité
   que V-25 affiche ; ce que l'écran en reçoit est une autre affaire — la vue ne
   déclare que deux propriétés et lit l'identité affichée dans le jeu de semence. */

/**
 * Le profil tel que la base le porte. `derniereConnexionLe` est un INSTANT et le
 * reste : le libellé relatif du gel n'a pas de règle écrite, et il figure au
 * recensement du §1 plutôt que d'être fabriqué ici.
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
 * Les notes que l'identité peut lire, dans la forme que V-25 déclare. ELLES SERVENT DEUX
 * FOIS, ET LA SECONDE DÉCIDE DE LEUR PORTÉE : la coquille en déduit l'arborescence du rail,
 * et l'onglet « Distinctions » y compte les contributions. Le rail interdit donc le corpus
 * entier (`RG-ACC-01`), d'où une conséquence assumée : les indicateurs de contribution ne
 * comptent que les notes du PÉRIMÈTRE.
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

/* 2 bis. Ce que V-25 affiche du profil.

   AUCUNE RÈGLE DE DATE N'EST ÉCRITE ICI : `formaterDateFr()` et
   `formaterDateHeureFr()` de `../dates` sont l'implémentation unique. Ce qui ne
   peut pas être rendu — le libellé RELATIF du gel — reste au recensement du §1 :
   l'instant est vrai, sa mise en mots relative n'a pas de règle écrite. */

/**
 * Le marqueur d'une donnée absente — `P-02`, « une donnée indisponible s'affiche
 * comme telle ». Le cadratin est le marqueur que le GEL emploie lui-même pour une
 * valeur qu'il n'a pas encore.
 */
export const RIEN_A_AFFICHER = '—';

/**
 * Le profil dans la forme que V-25 rend — huit champs, tous des chaînes prêtes
 * à écrire. Les initiales n'y sont PAS : la vue porte déjà la règle du gel
 * (`initialesDe`), et la dédoubler ici en ferait deux.
 */
export interface ProfilAffiche {
	readonly nom: string;
	readonly identifiant: string;
	readonly courriel: string;
	readonly role: string;
	readonly domaine: string;
	readonly arrivee: string;
	readonly derniereConnexion: string;
}

/**
 * Le profil de la base, mis en forme pour l'écran. `domaine` à `null` est un état
 * PRÉVU — `RG-M14-04` veut le domaine principal détachable — et il s'affiche comme
 * tel plutôt que par une chaîne vide, qui laisserait croire à un libellé perdu.
 */
export function profilAffiche(profil: ProfilDuCompte): ProfilAffiche {
	return {
		nom: profil.nom,
		identifiant: profil.identifiant,
		courriel: profil.courriel,
		/* La colonne porte l'ÉNUMÉRÉ, l'écran porte le libellé français. La
		   correspondance est celle de `./lecture.ts`, l'unique table du dépôt : en
		   écrire une seconde donnerait deux vocabulaires de rôle. */
		role: ROLE_DEPUIS_ENUM[profil.role] ?? profil.role,
		domaine: profil.domaine ?? RIEN_A_AFFICHER,
		arrivee: formaterDateFr(profil.arriveLe),
		derniereConnexion:
			profil.derniereConnexionLe === null
				? RIEN_A_AFFICHER
				: formaterDateHeureFr(profil.derniereConnexionLe)
	};
}

/**
 * Les initiales d'un nom — la règle du gel, pour les appelants SERVEUR. Quatre vues
 * la transcrivent chacune pour leur propre rendu ; elle est ici pour que le côté
 * serveur n'en écrive pas une cinquième, la coquille recevant un
 * `UtilisateurCourant` dont les initiales sont un champ obligatoire.
 */
export function initialesDuNom(nom: string): string {
	return nom
		.split(' ')
		.map((m) => m[0] ?? '')
		.join('')
		.slice(0, 2)
		.toUpperCase();
}

/**
 * Les vérifications portées au compte — l'indicateur « notes vérifiées ».
 * `verifications.compte_id` existe, et le nombre est donc COMPTÉ, jamais déclaré.
 * Zéro est alors un résultat, non l'aveu d'une donnée absente — ce qui distingue
 * cet indicateur de son voisin « liens internes créés » (§1).
 */
export async function compterLesVerifications(base: Base, compteId: string): Promise<number> {
	const lignes = await base
		.select({ combien: count() })
		.from(verifications)
		.where(eq(verifications.compteId, compteId));
	return lignes[0]?.combien ?? 0;
}

/* 2 ter. Ce que le titulaire modifie lui-même — deux champs, et deux seulement.
   Le gel les oppose au panneau « Attribué par l'administration », dont il écrit que
   « le rôle et le domaine principal sont fixés par un administrateur » : la
   frontière est lue, pas choisie.

   `RG-CPT-01` ET `RG-M16-02` GOUVERNENT AUSSI CE GESTE : laisser un compte de
   démonstration partagé changer son adresse électronique déplacerait la
   réinitialisation de mot de passe vers la boîte du dernier venu. Le refus est pris
   avant toute validation de saisie. */

export type IssueDeLIdentite = 'verrouille' | 'nom-vide' | 'courriel-invalide' | 'enregistre';

/** Les deux champs que le titulaire modifie — `#p-affiche` et `#p-courriel`. */
export interface SaisiesDeLIdentite {
	readonly nom: string;
	readonly courriel: string;
}

/**
 * La forme d'une adresse électronique — reprise du `type="email"` du champ gelé. Le contrôle
 * est refait côté serveur parce qu'un client peut composer la requête lui-même : « l'absence
 * de bouton n'est pas un contrôle d'accès ». Le motif est volontairement celui, minimal, de
 * la plateforme : un motif plus sévère refuserait des adresses valides.
 */
const ADRESSE_ELECTRONIQUE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Le nom affiché et l'adresse électronique du titulaire, enregistrés. `modifieLe`
 * est posé au même geste : une écriture qui ne la touche pas rendrait l'instant
 * faux pour toutes les lectures suivantes.
 */
export async function enregistrerLIdentite(
	base: Base,
	demande: {
		readonly profil: ProfilDuCompte;
		readonly saisies: SaisiesDeLIdentite;
		readonly maintenant: Date;
	}
): Promise<IssueDeLIdentite> {
	const { profil } = demande;
	if (profil.motDePasseVerrouille) return 'verrouille';

	const nom = demande.saisies.nom.trim();
	const courriel = demande.saisies.courriel.trim();
	if (nom === '') return 'nom-vide';
	if (!ADRESSE_ELECTRONIQUE.test(courriel)) return 'courriel-invalide';

	await base
		.update(comptes)
		.set({ nom, courriel, modifieLe: demande.maintenant })
		.where(eq(comptes.id, profil.compteId));
	return 'enregistre';
}

/* 3. Les vecteurs de planche — les noms sont ceux de `verif/scenarios/V-xx.json`,
   composés à UN SEUL ENDROIT. */

/** Les quatre onglets de V-25 — `docs/routes.md:283`, axe `ong` de la planche. */
export const ONGLETS = ['identite', 'securite', 'distinctions', 'activite'] as const;

export type Onglet = (typeof ONGLETS)[number];

/**
 * L'onglet demandé par `?onglet=`, ou le défaut. Une valeur inconnue RETOMBE sur le
 * défaut plutôt que de rendre 404 : le paramètre est un réglage d'affichage, pas une
 * ressource.
 */
export function ongletDemande(parametre: string | null): Onglet {
	const trouve = ONGLETS.find((o) => o === parametre);
	return trouve ?? 'identite';
}

/**
 * Le vecteur de V-25 — deux axes sur trois, et le troisième est un écart.
 *
 *   `ong`      — l'onglet, de l'adresse.
 *   `c-verrou` — `mot_de_passe_verrouille` du compte connecté (`RG-M16-02`).
 *   `cpt`      — NON POSÉ : l'axe « Compte » de la planche choisit entre deux comptes du jeu
 *                de semence, et aucune de ses positions ne désigne « le compte connecté ».
 */
export function vecteurDeV25(
	onglet: Onglet,
	verrouille: boolean
): Record<string, string | boolean> {
	return { ong: onglet, 'c-verrou': verrouille };
}

/* V-06 N'A PLUS DE VECTEUR : ses quatre étapes décrivaient un parcours par
   courriel dont le produit n'a aucun morceau (§1). La vue rend un écran unique, qui
   déclare l'indisponibilité et nomme le chemin réel — la réinitialisation par un
   administrateur. */

/* 4. La politique de mot de passe — TRANSCRITE du gel, jamais choisie.
   `V-25:2618-2665`, `creerRobustesse()` : `MINI = 12`, `natures()` et les trois
   règles `longueur`, `varie`, `different`. `RG-M16-01` exige une politique ; le gel
   en donne la lettre, et les maquettes priment.

   POURQUOI CÔTÉ SERVEUR ALORS QUE LE GEL LA JOUE AU NAVIGATEUR : un contrôle de
   saisie n'est pas une application de règle, et le gel ne peut pas se protéger
   d'une requête composée à la main.

   LES CLASSES DE CARACTÈRES SONT RECOPIÉES TELLES QUELLES, bornes comprises. Les
   deux classes de lettres accentuées recouvrent au passage deux signes d'opération
   latins-1, ce qui rend le compte des « natures » légèrement généreux : c'est le
   comportement du gel, et le corriger ici ferait diverger le serveur de l'écran. */

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

export interface ReglesDuMotDePasse {
	readonly longueur: boolean;
	readonly varie: boolean;
	readonly different: boolean;
}

/**
 * `evaluer()` du gel, réduit à sa décision. Le reste de la fonction gelée —
 * segments, niveau, libellé — peint l'indicateur de robustesse ; il n'entre dans
 * aucune décision, et il appartient à la vue.
 */
export function reglesDuMotDePasse(clair: string, identifiant: string): ReglesDuMotDePasse {
	const interdit = identifiant.toLowerCase();
	return {
		longueur: clair.length >= MINIMUM_DE_CARACTERES,
		varie: naturesDeCaracteres(clair) >= 2,
		different: clair.length > 0 && (interdit === '' || !clair.toLowerCase().includes(interdit))
	};
}

export function motDePasseAcceptable(clair: string, identifiant: string): boolean {
	const r = reglesDuMotDePasse(clair, identifiant);
	return r.longueur && r.varie && r.different;
}

/* 5. Les trois gestes de session d'`ARB-054` : « rester connecté sur cet
   appareil » est une PRÉFÉRENCE persistée, « fermer toutes les autres sessions »
   opère en base, et le changement de mot de passe ferme les autres sessions. Les
   trois portent sur `sessions.souvenir`.

   UNE SESSION `souvenir` N'EXPIRE NI PAR INACTIVITÉ NI PAR ÉCHÉANCE : rien n'est à
   écrire ici pour cela, `sessionExpiree()` porte déjà la règle et ce module se
   contente de basculer la colonne qu'elle lit. */

export async function lirePreferenceDeSession(base: Base, sessionId: string): Promise<boolean> {
	const lignes = await base
		.select({ souvenir: sessions.souvenir })
		.from(sessions)
		.where(eq(sessions.id, sessionId))
		.limit(1);
	return lignes[0]?.souvenir ?? false;
}

/**
 * Écrit la préférence sur la session COURANTE, et sur elle seule : « rester connecté SUR CET
 * APPAREIL » — l'appareil, c'est la session. La porter sur le compte l'étendrait aux autres
 * appareils. Repasser à `false` rend la session au délai d'inactivité.
 */
export async function ecrirePreferenceDeSession(
	base: Base,
	sessionId: string,
	souvenir: boolean
): Promise<void> {
	await base.update(sessions).set({ souvenir }).where(eq(sessions.id, sessionId));
}

/**
 * « Fermer toutes les autres sessions » — rend le nombre fermé. `fermee_le` est posé, la
 * ligne est gardée : la fermeture est définitive et la trace reste. La session courante est
 * explicitement épargnée — le libellé gelé dit « les AUTRES ». Le nombre rendu est mesuré,
 * jamais annoncé.
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

/* 6. Le changement de mot de passe. */

/**
 * Les issues du changement. Elles ne se recouvrent pas, et l'ordre dans lequel elles
 * sont décidées est celui du gel, `RG-M16-02` d'abord : `verrouille`,
 * `actuel-faux`, `regles`, `confirmation`, `change`.
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
 * Le changement de mot de passe, et la fermeture qui l'accompagne.
 *
 * `ARB-054` §2, sur la foi de `V-25:2917` — « Mot de passe changé, vos autres sessions ont
 * été fermées » : la fermeture fait partie du geste, elle est donc ici et non chez l'appelant
 * qui pourrait l'oublier. `RG-M16-02` EST APPLIQUÉ AVANT TOUTE VÉRIFICATION : vérifier
 * d'abord donnerait à l'appelant un oracle sur le mot de passe d'un compte partagé
 * (`RG-CPT-01`). LA SESSION COURANTE SURVIT.
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

	/* LE MOT DE PASSE N'EST PLUS CELUI DE L'ADMINISTRATION — c'est ici, et
	   nulle part ailleurs, que le compte cesse de porter la valeur qui lui a été
	   transmise. La garde de `src/hooks.server.ts` le laisse alors circuler. */
	await base
		.update(comptes)
		.set({
			condensatMotDePasse: await hacherMotDePasse(saisies.nouveau),
			motDePasseAChanger: false,
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
