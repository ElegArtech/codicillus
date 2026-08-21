/**
 * `/console/comptes` — LE CHARGEUR de V-32.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; le seul `error(404, MESSAGE_INTROUVABLE)`
 * du fichier est SANS MESSAGE (`ADR-007`).
 *
 * CE QUE CE CHARGEUR SERT, ET CE QU'IL NE SERT PAS. La liste des comptes vient
 * de la TABLE — `lireLesComptesDeConsole()` —, et la vue la reçoit en
 * propriété : un compte créé apparaît donc à la relecture de la page. Le jeu de
 * semence de `V-32:65` ne sert plus que de valeur par défaut, pour les planches
 * du banc, qui n'ont pas de chargeur derrière elles.
 *
 * `vecteur: null` demande l'état au repos : les quatre positions de l'axe
 * « Formulaire » et les deux de l'axe « Cas » sont des états d'INTERACTION.
 */
import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { basePartagee } from '$lib/base/acces';
import { comptes } from '$lib/base/schema';
import { hacherMotDePasse } from '$lib/auth/mots-de-passe';
import {
	changerLActivationDUnCompte,
	changerLeRoleDUnCompte,
	creerUnCompte,
	identifiantNormalise,
	roleDepuisLeLibelle
} from '$lib/donnees/administration';
import {
	accesALaConsole,
	contexteDeRequete,
	lireLesComptesDeConsole,
	lireLesDesignationsDeDomaine,
	resoudreLaConsole
} from '$lib/donnees/consoles';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	return {
		vecteur: null,
		notes: acces.ressource.notes,
		univers: acces.ressource.univers,
		domaines: acces.ressource.domaines,
		compte: acces.ressource.compte,
		comptes: await lireLesComptesDeConsole(base),
		/**
		 * LA TABLE DES DÉSIGNATIONS — le nom d'affichage d'un domaine vers sa forme
		 * canonique. Même motif qu'à `/console/domaines`, et pour le même motif :
		 * `#f-domaine` porte le NOM (`V-32:3144`), le geste attend l'identifiant
		 * lisible d'univers puis celui du domaine, et « Poste de travail » ne donne
		 * pas son identifiant par abaissement de casse — c'est la base qui sait.
		 */
		designations: await lireLesDesignationsDeDomaine(base)
	};
};

/** La garde des onze adresses, appliquée à l'action — voir `/console/univers`. */
function consoleOuverte(locals: App.Locals): void {
	if (!accesALaConsole(locals.identite)) error(404, MESSAGE_INTROUVABLE);
}

export const actions: Actions = {
	/**
	 * CRÉER UN COMPTE — `UC-M14-07` (`CDC:1178`), `RG-CPT-01`, `RG-CPT-02`.
	 *
	 * LES NOMS DE CHAMP SONT CEUX DU GEL, SAUF DEUX, ET LES DEUX EXCEPTIONS SE
	 * JUSTIFIENT. Les six premiers sont les identifiants du formulaire de
	 * `V-32:1344-1401` — `f-ident`, `f-nom`, `f-courriel`, `f-mdp`, `f-role`,
	 * `f-verrou` —, comme `changerLeRole` le fait déjà pour `f-ident` et
	 * `f-role` : rien n'est traduit, et deux noms pour une même clé finiraient
	 * par diverger.
	 *
	 * Le septième, `#f-domaine`, ne voyage PAS sous son nom, parce qu'il ne
	 * voyage pas sous sa valeur : le sélecteur porte le NOM d'affichage du
	 * domaine, le geste attend sa forme CANONIQUE. La page traduit par la table
	 * que le chargeur lui a servie, et envoie `univers` puis `domaine` — les
	 * deux noms que `/console/domaines` emploie déjà pour la même désignation.
	 *
	 * `P-09` ET `RG-ACC-04` PASSENT PAR `consoleOuverte()`, comme les deux
	 * autres actions : un compte sans le rôle administrateur reçoit `404` sur
	 * l'ACTION comme sur l'écran, et ce 404 est celui d'`ADR-007` — sans message,
	 * indiscernable d'une adresse qui n'existe pas.
	 *
	 * `RG-CPT-02` N'EST PAS RÉÉCRITE ICI, et c'est délibéré : elle est portée par
	 * cette garde — sur une instance sans administrateur, personne n'atteint
	 * cette action — et par l'impossibilité de se créer soi-même. Le
	 * raisonnement complet est à l'en-tête de section 11 d'`administration.ts`.
	 *
	 * LE MOT DE PASSE EN CLAIR ENTRE ICI ET N'EN RESSORT PAS. `creerUnCompte()`
	 * le condense ; aucune valeur rendue à l'écran ne le porte. La boîte
	 * « Compte créé » affiche la valeur que le NAVIGATEUR a engendrée, celle-là
	 * même qui a été envoyée.
	 */
	creer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();

		/* LE RÔLE EST CONVERTI PAR LA SEULE TABLE DU DÉPÔT, et un libellé inconnu
		   est un refus — jamais un rôle par défaut. Se tromper de défaut ici, ce
		   serait accorder un droit. Même rédaction que `changerLeRole`. */
		const role = roleDepuisLeLibelle(champs.get('f-role'));
		if (role === null) return fail(400, { issue: 'role-inconnu' });

		/* LE RATTACHEMENT EST FACULTATIF AU GEL — `#f-domaine` ne porte pas
		   l'étoile d'obligation (`V-32:1389`) — et la colonne est nullable par
		   exigence (`RG-M14-04`). Une désignation incomplète vaut donc « aucun
		   rattachement », pas un refus. */
		const universDemande = String(champs.get('univers') ?? '');
		const domaineDemande = String(champs.get('domaine') ?? '');
		const rattachement =
			universDemande === '' || domaineDemande === ''
				? null
				: { univers: universDemande, domaine: domaineDemande };

		const resultat = await creerUnCompte(
			basePartagee(),
			{
				identifiant: identifiantNormalise(champs.get('f-ident')),
				nom: String(champs.get('f-nom') ?? ''),
				courriel: String(champs.get('f-courriel') ?? ''),
				motDePasse: String(champs.get('f-mdp') ?? ''),
				role,
				domaine: rattachement,
				motDePasseVerrouille: champs.get('f-verrou') === 'oui'
			},
			new Date()
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	},
	/**
	 * CHANGER LE RÔLE D'UN COMPTE — `RG-M14-07`.
	 *
	 * `f-ident` ET `f-role` SONT LES NOMS DU GEL : `V-32:1384` porte
	 * `select#f-role`, et le champ d'identifiant de connexion est `f-ident`
	 * (`V-32:3109`), définitif après création — « le modifier casserait
	 * l'attribution de ses contributions passées ». Le compte se désigne donc par
	 * lui.
	 *
	 * LE SÉLECTEUR REND UN LIBELLÉ, PAS UN ÉNUMÉRÉ. `roleDepuisLeLibelle()` fait
	 * la conversion, et rend `null` sur tout le reste : un rôle non reconnu est
	 * un refus, jamais un rôle par défaut — se tromper de défaut ici, ce serait
	 * accorder un droit.
	 *
	 * LE REFUS DU DERNIER ADMINISTRATEUR SORT EN `fail` AVEC SON MOTIF. `P-09`
	 * veut que le geste ne soit pas offert — le gel verrouille le sélecteur et
	 * écrit le motif au-dessus (`V-32:3081-3099`) —, ce qui ne dispense pas de le
	 * refuser ici : un client compose la requête qu'il veut.
	 */
	changerLeRole: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const role = roleDepuisLeLibelle(champs.get('f-role'));
		if (role === null) return fail(400, { issue: 'role-inconnu' });

		const resultat = await changerLeRoleDUnCompte(
			basePartagee(),
			String(champs.get('f-ident') ?? ''),
			role,
			new Date()
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	},
	/**
	 * ACTIVER OU DÉSACTIVER UN COMPTE — `RG-M14-08`.
	 *
	 * `f-ident` DÉSIGNE LE COMPTE, comme pour le changement de rôle : c'est
	 * l'identifiant de connexion, « définitif après création » (`V-32:3109`), et
	 * deux noms de champ pour une même clé finiraient par diverger.
	 *
	 * `actif` PORTE LA CIBLE, PAS LA BASCULE. Un booléen « inverser » se
	 * tromperait de sens si deux administrateurs cliquaient en même temps, et le
	 * second annulerait le premier sans le savoir. La requête dit l'état voulu ;
	 * la base l'écrit.
	 *
	 * LE REFUS DU DERNIER ADMINISTRATEUR SORT EN `fail` AVEC SON MOTIF. Le gel le
	 * rend dans le dialogue (`V-32:3270-3284`), bouton de validation caché ;
	 * `P-09` veut que le geste ne soit pas offert, ce qui ne dispense jamais de le
	 * refuser ici — un client compose la requête qu'il veut.
	 */
	changerLActivation: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await changerLActivationDUnCompte(
			basePartagee(),
			String(champs.get('f-ident') ?? ''),
			champs.get('actif') === 'oui',
			new Date()
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		if (resultat.issue !== 'possible') return fail(400, resultat);
		return resultat;
	},

	/**
	 * RÉINITIALISER LE MOT DE PASSE D'UN COMPTE — `RG-CPT-01`.
	 *
	 * « Un compte peut être marqué mot de passe verrouillé : il conserve tous ses
	 * droits de contenu mais ne peut pas changer son propre mot de passe. […] La
	 * réinitialisation par un administrateur reste possible » (`CDC:137`). Le
	 * verrou N'EST DONC PAS ÉPROUVÉ ICI : il vise le compte lui-même, jamais
	 * l'administrateur, et le refuser ici retirerait au compte de démonstration
	 * partagé la seule porte de sortie que la règle lui laisse.
	 *
	 * LA VALEUR CLAIRE ENTRE ET N'EN RESSORT PAS — même motif qu'à la création :
	 * elle est engendrée par le NAVIGATEUR, condensée ici, et la base n'en garde
	 * que l'Argon2id. Aucune valeur rendue ne la reporte.
	 *
	 * LES SESSIONS EN COURS NE SONT PAS FERMÉES, et c'est une lacune déclarée
	 * plutôt qu'un oubli : ni le gel ni le cahier des charges ne le demandent, et
	 * décider seul de déconnecter quelqu'un dépasse ce que le geste annonce.
	 */
	reinitialiserLeMotDePasse: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const identifiant = identifiantNormalise(champs.get('f-ident'));
		const clair = String(champs.get('f-mdp') ?? '');
		if (clair === '') return fail(422, { issue: 'mot-de-passe-vide' });

		const base = basePartagee();
		const [ligne] = await base
			.select({ id: comptes.id, nom: comptes.nom })
			.from(comptes)
			.where(eq(comptes.identifiant, identifiant))
			.limit(1);
		if (ligne === undefined) error(404, MESSAGE_INTROUVABLE);

		await base
			.update(comptes)
			.set({ condensatMotDePasse: await hacherMotDePasse(clair), modifieLe: new Date() })
			.where(eq(comptes.id, ligne.id));

		return { issue: 'possible' as const, compte: ligne.nom };
	}
};
