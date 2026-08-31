/**
 * `/console/comptes` — LE CHARGEUR de V-32. LA GARDE EST CELLE DES ONZE ADRESSES DE
 * CONSOLE : `resoudreLaConsole()` la prend, une fois pour toutes, et un non-administrateur
 * reçoit 404 V-26 — pas un refus (`P-09`, `RG-ACC-04`). Le seul `error(404, …)` est SANS
 * MESSAGE (`ADR-007`).
 *
 * LA LISTE DES COMPTES VIENT DE LA TABLE, en propriété REQUISE : une rédaction qui
 * oublierait de la passer ne compilerait plus. LE VERROU DE MOT DE PASSE EST SERVI À
 * PART — `interface Compte` du jeu de démonstration n'en porte pas de champ, et la vue le
 * décidait en comparant l'identifiant à un compte du jeu écrit en dur.
 *
 * `vecteur: null` demande l'état au repos : les positions des axes « Formulaire » et
 * « Cas » sont des états d'INTERACTION.
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

/**
 * `comptes.mot_de_passe_verrouille`, par identifiant de connexion. SERVI À PART
 * DE LA LISTE : `interface Compte` décrit ce que le jeu de démonstration porte,
 * pas ce que la table porte. Un identifiant absent vaut « non verrouillé ».
 */
async function lireLesVerrousDeMotDePasse(
	base: ReturnType<typeof basePartagee>
): Promise<Record<string, boolean>> {
	const lignes = await base
		.select({ identifiant: comptes.identifiant, verrouille: comptes.motDePasseVerrouille })
		.from(comptes);
	return Object.fromEntries(lignes.map((l) => [l.identifiant, l.verrouille]));
}

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
		verrous: await lireLesVerrousDeMotDePasse(base),
		/**
		 * LA TABLE DES DÉSIGNATIONS — le nom d'affichage d'un domaine vers sa forme
		 * canonique : `#f-domaine` porte le NOM, le geste attend les identifiants
		 * lisibles, et « Poste de travail » ne donne pas le sien par abaissement de
		 * casse.
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
	 * CRÉER UN COMPTE — `UC-M14-07`, `RG-CPT-01`, `RG-CPT-02`.
	 *
	 * LES NOMS DE CHAMP SONT CEUX DU GEL, SAUF UN : `#f-domaine` ne voyage pas sous
	 * son nom parce qu'il ne voyage pas sous sa valeur — le sélecteur porte le NOM
	 * d'affichage, le geste attend la forme CANONIQUE, et la page traduit par la
	 * table que le chargeur lui a servie.
	 *
	 * `P-09` ET `RG-ACC-04` PASSENT PAR `consoleOuverte()`, comme les deux autres
	 * actions : un compte sans le rôle administrateur reçoit `404` sur l'ACTION comme
	 * sur l'écran.
	 *
	 * `RG-CPT-02` N'EST PAS RÉÉCRITE ICI : elle est portée par cette garde et par
	 * l'impossibilité de se créer soi-même.
	 *
	 * LE MOT DE PASSE EN CLAIR ENTRE ICI ET N'EN RESSORT PAS : `creerUnCompte()` le
	 * condense, et aucune valeur rendue à l'écran ne le porte.
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
	 * CHANGER LE RÔLE D'UN COMPTE — `RG-M14-07`. Le compte se désigne par son
	 * identifiant de connexion, définitif après création.
	 *
	 * LE SÉLECTEUR REND UN LIBELLÉ, PAS UN ÉNUMÉRÉ : `roleDepuisLeLibelle()` rend
	 * `null` sur tout le reste — un rôle non reconnu est un refus, jamais un rôle par
	 * défaut : se tromper de défaut ici, ce serait accorder un droit.
	 *
	 * LE REFUS DU DERNIER ADMINISTRATEUR SORT EN `fail` AVEC SON MOTIF : `P-09` veut
	 * que le geste ne soit pas offert, ce qui ne dispense pas de le refuser ici.
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
	 * `actif` PORTE LA CIBLE, PAS LA BASCULE : un booléen « inverser » se tromperait
	 * de sens si deux administrateurs cliquaient en même temps, et le second
	 * annulerait le premier sans le savoir.
	 *
	 * LE REFUS DU DERNIER ADMINISTRATEUR SORT EN `fail` AVEC SON MOTIF.
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
	 * LE VERROU N'EST PAS ÉPROUVÉ ICI : « un compte marqué mot de passe verrouillé
	 * […] ne peut pas changer son propre mot de passe. La réinitialisation par un
	 * administrateur reste possible » (`CDC:137`).
	 *
	 * LA VALEUR CLAIRE ENTRE ET N'EN RESSORT PAS : la base n'en garde que l'Argon2id.
	 *
	 * LES SESSIONS EN COURS NE SONT PAS FERMÉES — lacune déclarée : ni le gel ni le
	 * cahier ne le demandent.
	 */
	reinitialiserLeMotDePasse: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const identifiant = identifiantNormalise(champs.get('f-ident'));
		const clair = String(champs.get('f-mdp') ?? '');
		if (clair === '') return fail(422, { issue: 'mot-de-passe-vide' });

		const base = basePartagee();
		const [ligne] = await base
			.select({
				id: comptes.id,
				nom: comptes.nom,
				motDePasseVerrouille: comptes.motDePasseVerrouille
			})
			.from(comptes)
			.where(eq(comptes.identifiant, identifiant))
			.limit(1);
		if (ligne === undefined) error(404, MESSAGE_INTROUVABLE);

		/* LE MOT DE PASSE POSÉ PAR L'ADMINISTRATION EST À USAGE UNIQUE — même
		   raison qu'à la création : la valeur transite par un canal que
		   l'administrateur choisit, et elle ne doit pas rester celle du compte.
		   `RG-CPT-01` garde son exception : un compte à mot de passe verrouillé ne
		   peut pas changer le sien, on ne le lui impose donc jamais. */
		await base
			.update(comptes)
			.set({
				condensatMotDePasse: await hacherMotDePasse(clair),
				motDePasseAChanger: !ligne.motDePasseVerrouille,
				modifieLe: new Date()
			})
			.where(eq(comptes.id, ligne.id));

		return { issue: 'possible' as const, compte: ligne.nom };
	}
};
