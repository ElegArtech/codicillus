/**
 * LE CHARGEUR DE `/` — une adresse, deux branches : V-01 Accueil public sans
 * session, V-07 Accueil contributeur avec. La route est une, donc le chargeur est un.
 *
 * CE FICHIER NE DÉCIDE RIEN : il lit l'identité que `src/hooks.server.ts` a posée,
 * appelle `$lib/donnees/accueil`, et rend ce qu'il en reçoit. Aucune comparaison de
 * visibilité, de statut, de rôle ou de droit ne s'écrit ici.
 *
 * L'INSTANT DE RÉFÉRENCE EST PRIS ICI, ET NULLE PART AILLEURS : la couche de lecture
 * le reçoit en paramètre pour rester reproductible. LES SEUILS VIENNENT DE LA BASE,
 * jamais d'une constante — `P-01` veut une seule définition de la fraîcheur.
 *
 * AUCUN `<svelte:head>`, aucun titre, aucune redirection : `/` est une adresse
 * publique au sens de `src/lib/auth/garde.ts` ; sans session elle sert l'espace
 * public, ce qui est exactement `RG-ACC-02`.
 */
import { basePartagee } from '$lib/base/acces';
import { lireAccueil, lireLeTableauDeVivacite } from '$lib/donnees/accueil';
import { lireConfiguration } from '$lib/donnees/lecture';
import type { PageServerLoad } from './$types';

/**
 * LES DEUX LISTES QUE LES ALERTES DE L'ACCUEIL OUVRENT. La liste est CLOSE : un
 * paramètre hors liste n'a aucun chemin jusqu'à la réponse, et l'accueil rend son
 * tableau de bord entier.
 */
const SURVEILLANCES = ['bientot', 'retard'] as const;

function surveillanceDemandee(valeur: string | null): 'bientot' | 'retard' | null {
	return SURVEILLANCES.find((s) => s === valeur) ?? null;
}

/**
 * L'ADRESSE DU PORTAIL D'ASSISTANCE VIENT DE LA BASE, PAS D'UNE CONSTANTE : c'est
 * la clé `portail_assistance` de la table `parametres` (M14.7), « adresse externe
 * configurée en console », lue par `lireConfiguration()`.
 *
 * ELLE NE COÛTE AUCUNE REQUÊTE DE PLUS : `lireSeuils()` appelait déjà
 * `lireConfiguration()` et n'en gardait que deux nombres. Une requête au lieu de
 * deux, et `P-01` reste tenue — les seuils sortent toujours du même endroit.
 */
export const load: PageServerLoad = async ({ locals, url }) => {
	const base = basePartagee();
	const config = await lireConfiguration(base);
	const seuils = { frais: config.seuilFrais, vieillissant: config.seuilVieillissant };
	/* L'INSTANT DE RÉFÉRENCE EST PRIS UNE FOIS, ET LES DEUX LECTURES LE PARTAGENT :
	   deux `new Date()` peuvent tomber de part et d'autre de minuit, et l'état d'une
	   note posée sur son échéance changerait entre la salutation et le tableau. */
	const maintenant = new Date();
	const accueil = await lireAccueil(base, locals.identite, { maintenant, seuils });

	/* LES SEUILS DU CYCLE VIENNENT DE LA MÊME CONFIGURATION que ceux de la fabrique à
	   trois niveaux — une seule lecture, une seule définition de la vivacité (`P-01`).
	   Recomposer l'objet ailleurs rouvrirait la divergence. */
	const seuilsDeVivacite = {
		bientot: config.seuilBientot,
		retardRevoir: config.retardRevoir,
		retardObsolete: config.retardObsolete
	};

	/* LE TABLEAU DE VIVACITÉ N'EST LU QU'AVEC UNE SESSION : V-01 n'en affiche rien, et
	   trois requêtes de plus sur chaque requête publique se paieraient pour rien. Le
	   périmètre passé est celui que `lireAccueil()` VIENT DE RÉSOUDRE — le résoudre une
	   seconde fois ouvrirait deux périmètres dans une même réponse. */
	const tableau =
		locals.identite.type === 'authentifie'
			? await lireLeTableauDeVivacite(
					base,
					accueil.notes.map((n) => n.id),
					locals.identite.compteId,
					maintenant,
					seuilsDeVivacite
				)
			: null;

	/* QUI EST ADMINISTRATEUR — `RG-DRO-03`. V-07 en tire la SUITE qu'elle propose sur
	   une bibliothèque vide : créer un univers passe par la console, et la console
	   n'est ouverte qu'à lui. Ce n'est pas une exposition de droit au navigateur
	   (`ADR-006`) : aucune décision d'accès n'est prise à partir de ce booléen, seul
	   le libellé du geste en dépend.

	   L'ÉTAT « BASE VIDE » N'EST PLUS UN VECTEUR DE PLANCHE : V-07 lit zéro note et le
	   dit elle-même. Un état joué par un réglage d'écran finissait toujours par
	   diverger de l'état réel. */
	const administrateur =
		locals.identite.type === 'authentifie' && locals.identite.role === 'administrateur';

	return {
		...accueil,
		administrateur,
		vivacites: tableau?.notes ?? [],
		/* LE SEUIL EST NOMMÉ À L'ÉCRAN — « Vérification prévue dans les 10 prochains
		   jours » —, et il est CONFIGURABLE en console : l'écrire dans la vue aurait
		   fait mentir la phrase au premier réglage changé. */
		seuilBientot: config.seuilBientot,
		/* LA LISTE FILTRÉE DE « À SURVEILLER » — les deux alertes MÈNENT quelque part,
		   et ce quelque part est cette même adresse : un chevron qui n'ouvre rien est
		   un geste promis et mort. Toute autre valeur est ignorée, jamais refusée. */
		surveiller: surveillanceDemandee(url.searchParams.get('surveiller')),
		recemment: tableau?.recemment ?? [],
		plusConsultees: tableau?.plusConsultees ?? [],
		portail: config.portailAssistance
	};
};
