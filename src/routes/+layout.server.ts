/**
 * LE CHARGEUR DU GABARIT RACINE — et il n'existe QUE pour la page non résolue.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI ICI, ET NULLE PART AILLEURS
 *
 * `docs/routes.md` §3.1 et §3.5 : l'adresse non résolue **n'a pas de route
 * propre** — « réponse 404 rendue à l'adresse demandée ». Dans SvelteKit, cela
 * désigne exactement un fichier : le composant d'erreur de la racine. Or ce
 * composant n'a qu'UN canal de donnée, et c'est ce chargeur : il est le seul
 * qui s'exécute aussi bien quand aucune route ne correspond — vérifié dans le
 * cadre, `respond_with_error()` charge le gabarit racine avant de rendre — que
 * quand un chargeur de page a refusé.
 *
 * C'est ce qui donne à `RG-ACC-04` sa forme la plus forte : **la page non
 * résolue est rigoureusement la même quelle que soit la route qui a refusé**,
 * parce qu'elle ne reçoit rien de cette route. Aucune donnée de la ressource
 * demandée n'a de chemin jusqu'à elle.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * DEUX BOOLÉENS, ET PAS UN CHAMP DE PLUS
 *
 * Ce chargeur s'exécute à CHAQUE requête du produit : tout ce qu'il lit est
 * payé par toutes les pages. Il ne porte donc que ce que la page non résolue ne
 * peut obtenir d'ailleurs, et rien de ce qui se lit sur la page elle-même.
 *
 *   `session` — quel écran rendre, V-04 ou V-26 (`docs/routes.md:90`).
 *               Gratuit : `locals.identite` est déjà posée par le crochet.
 *   `ecriture` — `P-09` / `ARB-040` : V-26 pose des actions d'écriture et les
 *               cache par attribut ; l'attribut se décide sur les CAPACITÉS de
 *               l'appelant, jamais sur son rôle. Deux projections, et
 *               seulement pour un authentifié — `RG-DRO-02` répond seule pour
 *               l'anonyme, sans aucune requête.
 *   `portailAssistance` — la SEULE issue externe de V-04, et la seule route du
 *               produit qui offrait ce bouton sans lire la table `parametres` :
 *               elle servait le domaine d'exemple du jeu de démonstration, y
 *               compris à une instance qui avait configuré le sien en console.
 *               Une lecture par clé, et c'est ce qui la fait passer pour
 *               l'anonyme aussi — V-04 est l'écran du visiteur sans session.
 *   `motFiche` — le terme renommable de `M14.7`. Il n'a pas de chargeur propre
 *               parce qu'il n'a pas d'écran propre : il est affiché par la barre
 *               de recherche de la coquille, par la pastille de type d'une carte
 *               de résultat et par le fil de la console, donc sous TOUTES les
 *               routes. Il se lisait sur `seeds/corpus.ts`, et la configuration
 *               n'avait aucun effet. Lu ici avec `portailAssistance`, dans la
 *               MÊME requête, et fait descendre par le contexte de coquille.
 *
 * NI ROLE, NI IDENTIFIANT DE COMPTE, NI PÉRIMÈTRE ne sortent d'ici : `ADR-006`
 * interdit « toute exposition des droits au navigateur pour qu'il compose
 * l'interface ». Le client reçoit deux booléens d'écran.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL NE PORTE PAS, ET C'EST UNE LACUNE DÉCLARÉE
 *
 * V-04 et V-26 affichent des guides suggérés et, pour V-04, les quatre guides
 * les plus consultés — « la sortie de secours ». Les leur passer demanderait de
 * lire le corpus ENTIER à chaque requête du produit, pour une page qui n'est
 * servie qu'en cas d'échec. Le corpus n'est donc pas passé, et les listes sont
 * **vides plutôt que fausses** (`P-02`). Compté à `LACUNES_DU_CHEMIN_PUBLIC`,
 * remonté au rapport du lot, non comblé.
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
 * LE RATTACHEMENT N'EST PAS UN TITRE D'ACCÈS. Un compte se crée avec un domaine
 * principal et AUCUN droit de dossier — `UC-M14-07` n'en énumère pas, et
 * `RG-M14-04` laisse même le rattachement survivre à la suppression de sa cible.
 * `RG-DRO-02` répond seule pour ce compte : sans droit explicite, aucun accès.
 *
 * UN PRÉDICAT PAR CIBLE, PARCE QUE LES TROIS CIBLES NE DEMANDENT PAS LA MÊME
 * CHOSE. Les composer toutes sur la lisibilité du domaine referme le cas
 * « aucun droit » et laisse ouverts les deux autres — droit insuffisant, module
 * éteint —, et l'entrée mène encore en 404 :
 *
 *   la page du domaine       `domaineLisible`
 *   ses notes                `domaineLisible` + module `notes`      (`RG-STR-06`)
 *   son formulaire de signet `domaineLisible` + module `signets`
 *                            + un dossier du domaine où l'appelant rédige
 *
 * Chacun est écrit avec les FONCTIONS de la cible, jamais avec une règle
 * recopiée : `[domaine]/+page.server.ts` compose `domaineLisible` ;
 * `[domaine]/notes/+page.server.ts` y ajoute `moduleActif(modules, 'notes')` ;
 * `resoudreLAccesAuxSignets(…, true)` exige le module `signets` puis
 * `ecritureDansLeDomaine`, dont `peutEcrireDansLUn` est l'écriture sur l'accès
 * déjà ouvert — même table de capacités, même `capacites()`.
 *
 * L'administrateur n'est pas touché : `RG-DRO-03` lui donne un périmètre total.
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
	   dossiers, eux, sont déjà dans l'accès ouvert : la rédaction ne coûte rien. */
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
 * L'IDENTITÉ AFFICHABLE DU COMPTE CONNECTÉ — nom, initiales, rôle et domaine.
 *
 * POURQUOI ELLE MONTE JUSQU'ICI. La barre supérieure affichait « Karim Belhadj —
 * Référent — Infrastructure » pour TOUT LE MONDE : `Coquille.svelte` exige une
 * propriété `compte`, les vues la remplissent depuis `MOI` de `seeds/corpus.ts`,
 * et AUCUNE route ne la passait. Mesuré le 21/08/2026 sur les huit pages qui
 * montent une coquille. La constante de semence tenait donc lieu d'identité sur
 * tout le produit.
 *
 * ELLE EST LUE UNE FOIS, AU GABARIT RACINE, et descend par contexte : trente
 * routes qui la recopieraient chacune divergeraient au premier oubli (`P-35`).
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

/** Le libellé du rôle, tel que la barre supérieure l'affiche. */
const LIBELLE_DU_ROLE: Readonly<Record<string, string>> = {
	lecteur: 'Lecteur',
	contributeur: 'Contributeur',
	referent: 'Référent',
	administrateur: 'Administrateur'
};

/**
 * LE NOM DU DOMAINE DE RATTACHEMENT EST GARDÉ PAR LA MÊME LISIBILITÉ QUE LE RAIL.
 *
 * Il descendait au client sans garde, et la MÊME réponse portait alors trois
 * vérités : un rail vide, un rattachement nommé, et le nom de ce domaine dans le
 * sous-titre de la barre. `RG-ACC-01` — la structure de l'instance est une
 * information qu'un compte sans droit n'a pas à lire —, et le nom d'un domaine
 * en fait partie.
 *
 * La chaîne vide est le cas que la barre traite DÉJÀ : `BarreSuperieure.svelte`
 * n'affiche alors que le rôle. C'est aussi le cas de tout compte d'amorçage, dont
 * `comptes.domaine_id` est nul.
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
 * L'ARBORESCENCE DU RAIL, DEPUIS LA BASE.
 *
 * Le rail était bâti sur `UNIVERS` et `DOMAINES` de `seeds/corpus.ts` : les
 * vues les portent en propriétés par défaut, et AUCUNE route ne passait les
 * vraies. Un univers créé dans la console n'entrait donc jamais dans la
 * navigation. Comme pour l'identité, la lecture se fait UNE FOIS ici et descend
 * par contexte — trente routes qui la recopieraient divergeraient (`P-35`).
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
	 * LE RAIL NE MONTRE QUE CE QUE L'APPELANT PEUT OUVRIR.
	 *
	 * Il servait la structure ENTIÈRE à tout le monde. Mesuré le 23/08/2026 sur
	 * une contributrice ayant droit sur deux domaines : son rail en listait six,
	 * plus les trois univers, et **chacun de ces liens rendait 404**. Deux fautes
	 * en une — `P-03`, une entrée de navigation visible est une entrée qui
	 * fonctionne ; et `RG-ACC-01`, la structure de l'instance est une information
	 * qu'un compte sans droit n'a pas à lire. Les noms d'univers et de domaines
	 * disent l'organisation de la direction.
	 *
	 * LE FILTRE N'EST PLUS ÉCRIT ICI : `lireLesDomainesLisibles()` le porte, et
	 * le tableau de bord de l'accueil appelle la MÊME fonction. Les deux le
	 * lisaient chacun de son côté, et la même réponse portait un rail vide et des
	 * cartes de domaines qui menaient en 404.
	 *
	 * L'ADMINISTRATEUR VOIT TOUT, et c'est `RG-DRO-03` : `ouvrirLAcces()` lui rend
	 * un périmètre total, aucun filtre ne le retire donc.
	 *
	 * UN DOMAINE VIDE RESTE VISIBLE à qui a un droit dessus : la lisibilité se lit
	 * sur les DOSSIERS, pas sur les notes, et un domaine qu'on vient de créer n'a
	 * que sa racine.
	 */
	const lisibles = await lireLesDomainesLisibles(base, acces);
	const universPorteurs = new Set(lisibles.map((d) => d.univers));

	/**
	 * LES DÉSIGNATIONS — LE NOM D'AFFICHAGE VERS L'IDENTIFIANT D'ADRESSE.
	 *
	 * Les vues reçoivent des NOMS et composaient l'adresse en les slugifiant,
	 * alors que `univers.identifiant` et `domaines.identifiant` sont persistés et
	 * ne suivent PAS les renommages (`RG-M12-11`). Renommer un univers ou un
	 * domaine en console rendait donc 404 toutes ses adresses — l'accueil, le
	 * rail, le fil d'Ariane, la page de l'univers. La correspondance est LUE, et
	 * dans les DEUX requêtes que ce chargeur émettait déjà : elle n'en coûte
	 * aucune.
	 *
	 * ELLE NE DIT QUE CE QUE L'APPELANT VOIT DÉJÀ. Les domaines sont ceux que
	 * `lireLesDomainesLisibles()` a laissés passer ; les univers, ceux qui en
	 * portent un. `RG-ACC-01` : le nom d'un univers dit l'organisation de la
	 * direction, et un compte sans droit n'a pas à le lire.
	 *
	 * L'ADMINISTRATEUR LES REÇOIT TOUS, y compris les univers SANS domaine.
	 * `RG-DRO-03` lui donne un périmètre total, et c'est le cas exact du premier
	 * geste d'une instance neuve : on crée un univers en console, on le renomme,
	 * et `/console/univers` doit encore mener à sa page.
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

	return {
		univers: lignesUnivers.filter((u) => universPorteurs.has(u.nom)),
		domaines: lisibles.map((d) => ({ nom: d.nom, univers: d.univers, couleur: d.couleur })),
		designations
	};
}

import type { LayoutServerLoad } from './$types';

/**
 * LA VERSION DU PRODUIT — celle que le paquet déclare, et rien d'autre.
 * Le pied du rail la servait depuis `INSTANCE` de `seeds/corpus.ts` : un chiffre
 * de démonstration présenté comme un fait de l'instance. Le paquet est le seul
 * endroit qui la porte ; c'est donc à lui de la tenir à jour, et non à une
 * constante de semence.
 */
const VERSION_DU_PRODUIT = paquet.version;

/**
 * L'ADRESSE DU PORTAIL D'ASSISTANCE — clé `portail_assistance` de `parametres`.
 *
 * POURQUOI ELLE MONTE JUSQU'ICI, alors que ce chargeur ne porte que ce que la
 * page non résolue ne peut obtenir d'ailleurs. C'est exactement son cas : V-04
 * offre « Ouvrir un ticket d'assistance » comme l'une de ses DEUX issues, et
 * l'écran n'a pas de route propre. Faute de canal, la vue retombait sur la
 * constante du jeu de démonstration — `assistance.exemple.fr` — et cette valeur
 * l'emportait **même sur une adresse que l'administrateur avait configurée en
 * console**. Toutes les autres routes qui offrent ce bouton lisent bien la
 * table ; celle-ci est la seule qui servait un domaine d'exemple.
 *
 * LA LECTURE EST BORNÉE À UNE CLÉ, et elle est faite pour L'ANONYME AUSSI —
 * V-04 est précisément l'écran du visiteur sans session. C'est la seule requête
 * que le chemin anonyme ait jamais coûtée : une recherche par clé primaire sur
 * une table de sept lignes. Le reste du chargeur reste fermé à l'anonyme, et
 * `RG-DRO-02` continue de répondre seule sur les droits.
 *
 * LE DÉFAUT N'EST PAS RECOPIÉ : il vient de `CONFIGURATION_PAR_DEFAUT`, la même
 * table de défauts sur laquelle `lireConfiguration()` retombe clé par clé. Une
 * valeur d'un autre type est une base corrompue, pas une base neuve — elle
 * prend le défaut plutôt que de faire tomber toutes les pages du produit.
 */
/**
 * LE MOT RENOMMABLE DE `M14.7` MONTE PAR LE MÊME CHEMIN, ET POUR LA MÊME
 * RAISON — clé `mot_fiche` de `parametres`.
 *
 * `$lib/vocabulaire.ts` en calculait QUATRE CONSTANTES À L'IMPORT, depuis
 * `CONFIG.motFiche` de `seeds/corpus.ts`. La clé existe en base, la console
 * l'écrit, `lireConfiguration()` la lit — et rien ne branchait la lecture sur
 * l'affichage : renommer « Fiche » en « Modèle » depuis `/console/configuration`
 * ne changeait rien aux quinze vues qui affichent le mot, ni à la pastille
 * « Types de fiches » de la console. `RG-M14-09` (« recalcul immédiat ») était
 * faux à la lettre.
 *
 * Le mot est affiché par des vues que TOUTES les routes montent — la barre de
 * recherche de la coquille, la pastille de type d'une carte de résultat, le fil
 * d'Ariane de la console. Il n'a donc pas plus de chargeur propre que le portail
 * d'assistance, et c'est ici qu'il se lit : un seul endroit, et le contexte de
 * coquille le fait descendre.
 *
 * LE NOM DE L'ORGANISATION MONTE PAR LE MÊME CHEMIN — clé `nom_organisation`.
 *
 * Huit vues l'écrivaient en dur, « Direction technique », et parmi elles LES
 * CINQ PIEDS PUBLICS ET L'ÉCRAN DE CONNEXION — c'est-à-dire les écrans que le
 * visiteur sans session voit en premier. Ce n'était pas une donnée du jeu de
 * démonstration : c'était le segment de marché du cadrage soudé dans une
 * signature de produit. Le nom du LOGICIEL, « Codicillus », reste en dur, comme
 * le pied du rail le fait déjà ; c'est la soudure entre les deux qu'on défait.
 *
 * Il se lit ICI et pour l'anonyme, exactement comme le portail d'assistance, et
 * pour la même raison : les vues qui l'affichent n'ont pas de chargeur propre —
 * V-04 n'a pas de route, et un pied de page est rendu par toutes.
 *
 * LES TROIS CLÉS SONT LUES EN UNE REQUÊTE. Ce chargeur s'exécute à CHAQUE
 * requête du produit ; trois `select` là où un `in` suffit se paieraient sur
 * toutes les pages. La troisième clé n'en coûte donc AUCUNE de plus : elle
 * s'ajoute au `in` déjà émis. Le résultat est indexé par clé plutôt que positionnel : une
 * clé absente d'une base neuve ne rend aucune ligne, et son défaut s'applique.
 *
 * LES DÉFAUTS NE SONT PAS RECOPIÉS : ils viennent de `CONFIGURATION_PAR_DEFAUT`,
 * la même table sur laquelle `lireConfiguration()` retombe clé par clé. Une
 * valeur d'un autre type est une base corrompue, pas une base neuve — elle prend
 * le défaut plutôt que de faire tomber toutes les pages du produit.
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
	 * L'ACCÈS EST OUVERT UNE FOIS, ET LES DEUX LECTEURS DE LISIBILITÉ LE PARTAGENT.
	 * Il l'était déjà pour le rail seul ; il est simplement déplacé d'un cran, ce
	 * qui ne coûte aucune requête de plus et interdit aux deux de diverger.
	 */
	const acces = await ouvrirLAcces(base, locals.identite, new Date());
	return {
		session: true,
		ecriture: await capaciteDEcriture(base, locals.identite),
		/**
		 * `RG-DRO-03` — l'administrateur contourne tous les droits de dossier, et
		 * lui seul voit l'entrée « Console d'administration ». Une entrée de
		 * navigation visible est une entrée qui fonctionne (`P-03`), et une action
		 * interdite n'est pas affichée (`P-09`) : les deux se rejoignent ici.
		 */
		administrateur: locals.identite.role === 'administrateur',
		/**
		 * LE RANGEMENT DE RATTACHEMENT DU COMPTE — les identifiants d'univers et de
		 * domaine, sous la forme que les adresses emploient.
		 *
		 * Le menu « Créer » de la barre supérieure offre « Nouveau signet » et
		 * « Nouveau dossier », et les deux adresses exigent un domaine. Le seul que
		 * le produit puisse choisir sans décider à la place de l'utilisateur est
		 * celui auquel son compte est rattaché (migration `005`).
		 *
		 * Il porte UN BOOLÉEN PAR CIBLE, et non un seul verdict pour les trois :
		 * `Coquille.svelte` ne rend pas l'entrée dont la cible ne s'ouvrirait pas,
		 * et `/mon-profil` ne rend pas son bouton. L'entrée n'est pas ÉMISE — une
		 * entrée qui ne mène nulle part est un lien mort, `P-03` n'en admet aucun,
		 * et `P-09` la veut absente, ni grisée ni masquée.
		 */
		rangement: await rangementDuCompte(base, locals.identite.compteId, acces),
		compte: await identiteAffichable(base, locals.identite.compteId, acces),
		version: VERSION_DU_PRODUIT,
		...(await parametresDeCoquille(base)),
		...(await arborescenceDeNavigation(base, acces, locals.identite.role === 'administrateur'))
	};
};
