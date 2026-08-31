/**
 * LE CHARGEUR DU GABARIT RACINE — et il n'existe QUE pour la page non résolue.
 *
 * POURQUOI ICI, ET NULLE PART AILLEURS : l'adresse non résolue n'a pas de route propre,
 * ce qui dans SvelteKit désigne le composant d'erreur de la racine — et ce composant
 * n'a qu'UN canal de donnée, ce chargeur, le seul qui s'exécute aussi bien quand aucune
 * route ne correspond que quand un chargeur a refusé. C'est ce qui donne à `RG-ACC-04`
 * sa forme la plus forte : la page non résolue est la même quelle que soit la route qui
 * a refusé, parce qu'elle ne reçoit rien de cette route.
 *
 * IL S'EXÉCUTE À CHAQUE REQUÊTE DU PRODUIT : tout ce qu'il lit est payé par toutes les
 * pages, et il ne porte donc que ce que la page non résolue ne peut obtenir d'ailleurs.
 * `ecriture` se décide sur les CAPACITÉS de l'appelant, jamais sur son rôle (`P-09`,
 * `ARB-040`), et seulement pour un authentifié. NI ROLE, NI IDENTIFIANT DE COMPTE, NI
 * PÉRIMÈTRE ne sortent d'ici : `ADR-006` interdit « toute exposition des droits au
 * navigateur pour qu'il compose l'interface ».
 *
 * CE QU'IL NE PORTE PAS, ET C'EST UNE LACUNE DÉCLARÉE : les guides suggérés de V-04 et
 * V-26 demanderaient de lire le corpus ENTIER à chaque requête, pour une page servie en
 * cas d'échec. Les listes sont vides plutôt que fausses (`P-02`).
 */
import { basePartagee } from '$lib/base/acces';
import paquet from '../../package.json';
import { eq, inArray } from 'drizzle-orm';
import {
	CLES_DE_PARAMETRE,
	CONFIGURATION_PAR_DEFAUT,
	comptes,
	domaines,
	parametres,
	univers
} from '$lib/base/schema';
import { capaciteDEcriture } from '$lib/donnees/public';
import { cleDeDomaine, type DesignationsDeRangement } from '$lib/rangement/adresses';
import type { Base } from '$lib/base/acces';
import {
	domaineLisible,
	dossiersDuDomaine,
	lireLesDomainesLisibles,
	lireModulesDuDomaine,
	moduleActif,
	ouvrirLAcces,
	peutEcrireDansLUn,
	type AccesAuRangement
} from '$lib/donnees/rangement';

/**
 * LE RATTACHEMENT DU COMPTE, ET CE QU'IL OUVRE VRAIMENT — un membre par cible.
 *
 * LE RATTACHEMENT N'EST PAS UN TITRE D'ACCÈS : un compte se crée avec un domaine
 * principal et AUCUN droit de dossier, et `RG-M14-04` laisse le rattachement survivre à
 * la suppression de sa cible. `RG-DRO-02` répond seule.
 *
 * UN PRÉDICAT PAR CIBLE, PARCE QUE LES TROIS CIBLES NE DEMANDENT PAS LA MÊME CHOSE. Les
 * composer toutes sur la lisibilité du domaine referme le cas « aucun droit » et laisse
 * ouverts les deux autres — droit insuffisant, module éteint —, et l'entrée mène encore
 * en 404 : la page du domaine demande `domaineLisible` ; ses notes y ajoutent le module
 * `notes` (`RG-STR-06`) ; son formulaire de signet le module `signets` et un dossier du
 * domaine où l'appelant rédige. Chacun est écrit avec les FONCTIONS de la cible, jamais
 * avec une règle recopiée. L'administrateur n'est pas touché (`RG-DRO-03`).
 */
interface RangementDuCompte {
	/** Les deux identifiants d'adresse du domaine de rattachement. */
	readonly univers: string;
	readonly domaine: string;
	/** `…/notes` s'ouvre — le module Notes est actif sur ce domaine. */
	readonly notes: boolean;
	/** `…/signets/nouveau` s'ouvre — module Signets actif, et rédaction possible. */
	readonly signets: boolean;
}

async function rangementDuCompte(
	base: Base,
	compteId: string,
	acces: AccesAuRangement
): Promise<RangementDuCompte | null> {
	const [ligne] = await base
		.select({
			id: domaines.id,
			univers: univers.identifiant,
			domaine: domaines.identifiant
		})
		.from(comptes)
		.innerJoin(domaines, eq(domaines.id, comptes.domaineId))
		.innerJoin(univers, eq(univers.id, domaines.universId))
		.where(eq(comptes.id, compteId))
		.limit(1);
	if (ligne === undefined || !domaineLisible(acces, ligne.id)) return null;

	/* Les modules du SEUL domaine de rattachement — une lecture bornée par
	   identifiant, et la seule que cette garde ajoute au chargeur racine. Les
	   dossiers sont déjà dans l'accès ouvert : la rédaction ne coûte rien. */
	const modules = await lireModulesDuDomaine(base, ligne.id);
	const siens = dossiersDuDomaine(acces, ligne.id).map((d) => d.id);
	return {
		univers: ligne.univers,
		domaine: ligne.domaine,
		notes: moduleActif(modules, 'notes'),
		signets: moduleActif(modules, 'signets') && peutEcrireDansLUn(acces, siens)
	};
}
/**
 * L'IDENTITÉ AFFICHABLE DU COMPTE CONNECTÉ, LUE UNE FOIS AU GABARIT RACINE et
 * descendue par contexte : trente routes qui la recopieraient divergeraient au
 * premier oubli (`P-35`), et les vues retombaient sur `MOI` de `seeds/corpus.ts`.
 *
 * Les initiales sont DÉRIVÉES du nom, jamais stockées : une colonne de plus
 * pourrait contredire le nom qu'elle abrège.
 */
function initialesDe(nom: string): string {
	const mots = nom.split(/\s+/u).filter((m) => m !== '');
	const premier = mots[0]?.[0] ?? '';
	const dernier = mots.length > 1 ? (mots[mots.length - 1]?.[0] ?? '') : '';
	return (premier + dernier).toUpperCase();
}

const LIBELLE_DU_ROLE: Readonly<Record<string, string>> = {
	lecteur: 'Lecteur',
	contributeur: 'Contributeur',
	referent: 'Référent',
	administrateur: 'Administrateur'
};

/**
 * LE NOM DU DOMAINE DE RATTACHEMENT EST GARDÉ PAR LA MÊME LISIBILITÉ QUE LE RAIL.
 * Sans garde, la MÊME réponse portait trois vérités : un rail vide, un
 * rattachement nommé, et le nom de ce domaine dans le sous-titre de la barre —
 * `RG-ACC-01`, la structure de l'instance n'est pas lisible sans droit.
 *
 * La chaîne vide est le cas que la barre traite DÉJÀ : elle n'affiche alors que le
 * rôle. C'est aussi celui de tout compte d'amorçage.
 */
async function identiteAffichable(
	base: Base,
	compteId: string,
	acces: AccesAuRangement
): Promise<{ nom: string; initiales: string; role: string; domaine: string } | null> {
	const [ligne] = await base
		.select({ nom: comptes.nom, role: comptes.role, id: domaines.id, domaine: domaines.nom })
		.from(comptes)
		.leftJoin(domaines, eq(domaines.id, comptes.domaineId))
		.where(eq(comptes.id, compteId))
		.limit(1);
	if (ligne === undefined) return null;
	const lisible = ligne.id !== null && domaineLisible(acces, ligne.id);
	return {
		nom: ligne.nom,
		initiales: initialesDe(ligne.nom),
		role: LIBELLE_DU_ROLE[ligne.role] ?? ligne.role,
		domaine: lisible ? (ligne.domaine ?? '') : ''
	};
}

/**
 * L'ARBORESCENCE DU RAIL, DEPUIS LA BASE. Sans elle, le rail était bâti sur
 * `UNIVERS` et `DOMAINES` de `seeds/corpus.ts`, et un univers créé dans la
 * console n'entrait jamais dans la navigation. La lecture se fait UNE FOIS ici et
 * descend par contexte — trente routes qui la recopieraient divergeraient.
 */
async function arborescenceDeNavigation(
	base: Base,
	acces: AccesAuRangement,
	administrateur: boolean
): Promise<{
	univers: {
		nom: string;
		couleur: string;
		glyphe: string;
		ordre: number;
		systeme: boolean;
		description: string;
	}[];
	domaines: { nom: string; univers: string; couleur: string }[];
	designations: DesignationsDeRangement;
}> {
	const lignesUnivers = await base
		.select({
			nom: univers.nom,
			couleur: univers.couleur,
			glyphe: univers.glyphe,
			ordre: univers.ordre,
			systeme: univers.systeme,
			description: univers.description,
			identifiant: univers.identifiant
		})
		.from(univers);
	/**
	 * LE RAIL NE MONTRE QUE CE QUE L'APPELANT PEUT OUVRIR. Il servait la structure
	 * ENTIÈRE à tout le monde, et chacun de ces liens rendait 404 : deux fautes en une
	 * — `P-03`, une entrée de navigation visible est une entrée qui fonctionne ; et
	 * `RG-ACC-01`, la structure de l'instance n'est pas lisible sans droit.
	 *
	 * LE FILTRE N'EST PLUS ÉCRIT ICI : `lireLesDomainesLisibles()` le porte, et le
	 * tableau de bord de l'accueil appelle la MÊME fonction — chacun le lisant de son
	 * côté, la même réponse portait un rail vide et des cartes menant en 404.
	 *
	 * L'ADMINISTRATEUR VOIT TOUT (`RG-DRO-03`). UN DOMAINE VIDE RESTE VISIBLE à qui a
	 * un droit dessus : la lisibilité se lit sur les DOSSIERS, pas sur les notes.
	 */
	const lisibles = await lireLesDomainesLisibles(base, acces);
	const universPorteurs = new Set(lisibles.map((d) => d.univers));

	/**
	 * LES DÉSIGNATIONS — LE NOM D'AFFICHAGE VERS L'IDENTIFIANT D'ADRESSE. Les vues
	 * reçoivent des NOMS et composaient l'adresse en les slugifiant, alors que les
	 * identifiants sont persistés et ne suivent PAS les renommages (`RG-M12-11`) :
	 * renommer en console rendait 404 toutes les adresses. La correspondance est LUE,
	 * dans les DEUX requêtes que ce chargeur émettait déjà.
	 *
	 * ELLE NE DIT QUE CE QUE L'APPELANT VOIT DÉJÀ (`RG-ACC-01`). L'ADMINISTRATEUR LES
	 * REÇOIT TOUS, y compris les univers SANS domaine (`RG-DRO-03`) : c'est le premier
	 * geste d'une instance neuve.
	 */
	const universDesignes = administrateur
		? lignesUnivers
		: lignesUnivers.filter((u) => universPorteurs.has(u.nom));
	const designations: DesignationsDeRangement = {
		univers: Object.fromEntries(universDesignes.map((u) => [u.nom, u.identifiant])),
		domaines: Object.fromEntries(
			lisibles.map((d) => [cleDeDomaine(d.univers, d.nom), d.identifiant])
		)
	};

	/* LE RAIL PORTE LES MÊMES UNIVERS QUE LES DÉSIGNATIONS, et c'est la seule
	   valeur juste : `sectionsDuRail()` fait figurer un univers sans domaine avec
	   une liste vide, sans quoi « le premier geste du produit » — créer un univers
	   en console — reste invisible dans la navigation. Un filtre écrit ici
	   annulerait cette intention à l'étage du dessus. */
	return {
		univers: universDesignes,
		domaines: lisibles.map((d) => ({ nom: d.nom, univers: d.univers, couleur: d.couleur })),
		designations
	};
}

import type { LayoutServerLoad } from './$types';

/**
 * LA VERSION DU PRODUIT — celle que le paquet déclare, et rien d'autre. Le pied
 * du rail la servait depuis `INSTANCE` de `seeds/corpus.ts`.
 */
const VERSION_DU_PRODUIT = paquet.version;

/**
 * TROIS VALEURS QUE DES VUES SANS CHARGEUR PROPRE AFFICHENT, LUES EN UNE REQUÊTE :
 * `portail_assistance`, pour l'issue de V-04 ; `mot_fiche`, le terme renommable de
 * `M14.7` que la coquille affiche sous TOUTES les routes, et dont `$lib/vocabulaire.ts`
 * calculait quatre constantes à l'import — `RG-M14-09` était faux à la lettre ;
 * `nom_organisation`, que huit vues écrivaient en dur.
 *
 * LA LECTURE EST FAITE POUR L'ANONYME AUSSI — V-04 et les pieds publics sont ses écrans.
 * C'est la seule requête que le chemin anonyme coûte, et `RG-DRO-02` répond seule sur les
 * droits. TROIS CLÉS, UN SEUL `in` : trois `select` se paieraient sur toutes les pages, et
 * le résultat est indexé par clé plutôt que positionnel — une clé absente d'une base
 * neuve ne rend aucune ligne, et son défaut s'applique.
 *
 * LES DÉFAUTS NE SONT PAS RECOPIÉS : ils viennent de `CONFIGURATION_PAR_DEFAUT`. Une
 * valeur d'un autre type est une base corrompue, pas une base neuve — elle prend le
 * défaut plutôt que de faire tomber toutes les pages du produit.
 */
interface ParametresDeCoquille {
	readonly portailAssistance: string;
	readonly nomOrganisation: string;
	readonly motFiche: string;
}

async function parametresDeCoquille(base: Base): Promise<ParametresDeCoquille> {
	const lignes = await base
		.select({ cle: parametres.cle, valeur: parametres.valeur })
		.from(parametres)
		.where(
			inArray(parametres.cle, [
				CLES_DE_PARAMETRE.portailAssistance,
				CLES_DE_PARAMETRE.nomOrganisation,
				CLES_DE_PARAMETRE.motFiche
			])
		);
	const lues = new Map(lignes.map((l) => [l.cle, l.valeur]));
	const chaine = (cle: string, defaut: string): string => {
		const valeur = lues.get(cle);
		return typeof valeur === 'string' ? valeur : defaut;
	};
	return {
		portailAssistance: chaine(
			CLES_DE_PARAMETRE.portailAssistance,
			CONFIGURATION_PAR_DEFAUT.portailAssistance
		),
		nomOrganisation: chaine(
			CLES_DE_PARAMETRE.nomOrganisation,
			CONFIGURATION_PAR_DEFAUT.nomOrganisation
		),
		motFiche: chaine(CLES_DE_PARAMETRE.motFiche, CONFIGURATION_PAR_DEFAUT.motFiche)
	};
}

export const load: LayoutServerLoad = async ({ locals }) => {
	if (locals.identite.type !== 'authentifie') {
		return {
			session: false,
			ecriture: false,
			administrateur: false,
			rangement: null,
			compte: null,
			version: VERSION_DU_PRODUIT,
			...(await parametresDeCoquille(basePartagee()))
		};
	}
	const base = basePartagee();
	/**
	 * L'ACCÈS EST OUVERT UNE FOIS, ET LES DEUX LECTEURS DE LISIBILITÉ LE PARTAGENT :
	 * aucune requête de plus, et il leur est interdit de diverger.
	 */
	const acces = await ouvrirLAcces(base, locals.identite, new Date());
	return {
		session: true,
		ecriture: await capaciteDEcriture(base, locals.identite),
		/**
		 * `RG-DRO-03` — l'administrateur contourne tous les droits de dossier, et lui
		 * seul voit l'entrée « Console d'administration ». Une entrée de navigation
		 * visible est une entrée qui fonctionne (`P-03`), et une action interdite
		 * n'est pas affichée (`P-09`).
		 */
		administrateur: locals.identite.role === 'administrateur',
		/**
		 * LE RANGEMENT DE RATTACHEMENT DU COMPTE, sous la forme que les adresses
		 * emploient. Le menu « Créer » offre deux entrées qui exigent un domaine, et le
		 * seul que le produit puisse choisir sans décider à la place de l'utilisateur
		 * est celui de rattachement.
		 *
		 * Il porte UN BOOLÉEN PAR CIBLE, et non un seul verdict pour les trois :
		 * l'entrée dont la cible ne s'ouvrirait pas n'est pas ÉMISE — un lien mort, que
		 * `P-03` n'admet pas et que `P-09` veut absent, ni grisé ni masqué.
		 */
		rangement: await rangementDuCompte(base, locals.identite.compteId, acces),
		compte: await identiteAffichable(base, locals.identite.compteId, acces),
		version: VERSION_DU_PRODUIT,
		...(await parametresDeCoquille(base)),
		...(await arborescenceDeNavigation(base, acces, locals.identite.role === 'administrateur'))
	};
};
