/**
 * `/console/templates` — LE CHARGEUR de V-31.
 *
 * LA GARDE EST CELLE DES ONZE ADRESSES, ET ELLE EST ÉCRITE UNE FOIS.
 * `docs/routes.md:167` : « Toutes ces routes exigent le rôle administrateur. Un
 * utilisateur non administrateur reçoit 404 V-26, pas un refus » — `P-09` pour
 * l'entrée non rendue, `RG-ACC-04` pour l'adresse construite. La décision est
 * prise par `resoudreLaConsole()` de `src/lib/donnees/consoles.ts`, qui appelle
 * `src/lib/droits/resolution.ts` et rend `INTROUVABLE` ; le seul `error(404, MESSAGE_INTROUVABLE)`
 * du fichier est SANS MESSAGE (`ADR-007`).
 *
 * CE QUE CE CHARGEUR NE FAIT PAS. Il ne touche pas `src/vues/V-31.svelte`, et
 * ne peut donc pas corriger ce que la vue lit du jeu de semence : `TEMPLATES`
 * et `TYPES_NOTE` y sont importés au niveau du module (`V-31:59`). Et même s'ils
 * entraient par propriété, une colonne manquerait : `pnpm verif:donnees` compte
 * `Template.utilisations` parmi ses LACUNES — « c'est un compteur d'EMPLOI, qui
 * se calcule sur les notes créées depuis un template, et rien n'enregistre cette
 * provenance ». Écart déclaré au rapport du lot.
 *
 * `vecteur: null` demande l'état au repos.
 */
import { error, fail } from '@sveltejs/kit';
import { and, eq, ne, sql } from 'drizzle-orm';
import { basePartagee, type Base } from '$lib/base/acces';
import { templates, typesDeNote } from '$lib/base/schema';
import { identifiantLisible } from '$lib/rangement/adresses';
import { accesALaConsole, contexteDeRequete, resoudreLaConsole } from '$lib/donnees/consoles';
import { marquerLeTemplateParDefaut, supprimerUnTemplate } from '$lib/donnees/administration';
import { lireTemplates, lireTypesDeNote } from '$lib/donnees/lecture';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ locals }) => {
	const base = basePartagee();
	const acces = await resoudreLaConsole(base, await contexteDeRequete(base), locals.identite);
	if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);

	const [templates, typesNote] = await Promise.all([lireTemplates(base), lireTypesDeNote(base)]);

	return {
		vecteur: null,
		notes: acces.ressource.notes,
		univers: acces.ressource.univers,
		domaines: acces.ressource.domaines,
		compte: acces.ressource.compte,
		templates,
		typesNote
	};
};

/** La garde des onze adresses, appliquée aux actions — voir `/console/univers`. */
function consoleOuverte(locals: App.Locals): void {
	if (!accesALaConsole(locals.identite)) error(404, MESSAGE_INTROUVABLE);
}

/**
 * LES SECTIONS ANNONCÉES SONT EXTRAITES DU CONTENU, jamais saisies à part.
 * C'est la règle du gel (`V-31:3295`) et celle de la vue : les titres de
 * section du squelette SONT sa structure. La colonne `structure` de la table
 * n'est donc pas une seconde source — elle est le résultat de cette lecture,
 * enregistré pour que les lecteurs n'aient pas à la refaire.
 */
function sectionsDuSquelette(contenu: string): readonly string[] {
	return [...contenu.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
		(m[1] ?? '').replace(/<[^>]*>/g, '').trim()
	);
}

/**
 * L'IDENTIFIANT LISIBLE D'UN TEMPLATE NEUF, et sa mise à l'écart des collisions.
 *
 * `templates_identifiant_unique` refuse un doublon ; deux templates de noms
 * différents peuvent pourtant réduire au même identifiant — « Procédure ! » et
 * « Procédure ? ». Le suffixe numéroté est la même parade que partout ailleurs
 * dans le produit, et il s'arrête au premier libre.
 */
async function identifiantLibre(base: Base, nom: string): Promise<string> {
	const racine = identifiantLisible(nom) || 'template';
	for (let rang = 1; rang < 200; rang += 1) {
		const candidat = rang === 1 ? racine : `${racine}-${rang}`;
		const [pris] = await base
			.select({ identifiant: templates.identifiant })
			.from(templates)
			.where(eq(templates.identifiant, candidat))
			.limit(1);
		if (pris === undefined) return candidat;
	}
	return `${racine}-${Date.now()}`;
}

/**
 * ÉCRIRE UN TEMPLATE — création et enregistrement partagent le formulaire, donc
 * la lecture des champs et la validation. `vise` vaut `null` pour une création,
 * l'identifiant lisible de la ligne pour un enregistrement.
 *
 * LES DEUX REFUS SONT CEUX DU GEL, AU MOT PRÈS (`V-31:3510-3515`) : un nom vide,
 * un nom déjà porté par un AUTRE template. Ils sortent en `fail` avec leur
 * message, que la vue pose dans son bloc `champ__erreur` — le seul endroit que
 * le gel offre à un refus sur cet écran.
 *
 * LE CARACTÈRE « PAR DÉFAUT » RESTE UNIQUE, et c'est la même transaction que
 * `marquerLeTemplateParDefaut()` : démarquer tous, puis marquer celui-ci. La
 * décocher ne promeut personne — le gel n'en désigne aucun remplaçant.
 */
async function ecrireUnTemplate(
	base: Base,
	vise: string | null,
	champs: FormData
): Promise<ReturnType<typeof fail> | { readonly issue: 'possible'; readonly template: string }> {
	const nom = String(champs.get('f-nom') ?? '').trim();
	if (nom === '') {
		return fail(422, { issue: 'saisie-refusee', message: 'Donnez un nom au template.' });
	}

	const [collision] = await base
		.select({ identifiant: templates.identifiant })
		.from(templates)
		.where(
			vise === null
				? sql`lower(${templates.nom}) = lower(${nom})`
				: and(sql`lower(${templates.nom}) = lower(${nom})`, ne(templates.identifiant, vise))
		)
		.limit(1);
	if (collision !== undefined) {
		return fail(422, { issue: 'saisie-refusee', message: `« ${nom} » existe déjà.` });
	}

	const typeDemande = String(champs.get('f-type') ?? '').trim();
	const [type] = await base
		.select({ id: typesDeNote.id })
		.from(typesDeNote)
		.where(eq(typesDeNote.nom, typeDemande))
		.limit(1);
	if (type === undefined) {
		return fail(422, { issue: 'saisie-refusee', message: 'Choisissez un type de note connu.' });
	}

	const contenu = String(champs.get('f-contenu') ?? '').trim();
	const defaut = champs.get('f-defaut') === 'oui';
	const maintenant = new Date();
	const valeurs = {
		nom,
		description: String(champs.get('f-desc') ?? '').trim(),
		typeDeNoteId: type.id,
		defaut,
		structure: sectionsDuSquelette(contenu),
		contenu,
		modifieLe: maintenant
	};

	if (vise === null) {
		const identifiant = await identifiantLibre(base, nom);
		await base.transaction(async (tx) => {
			if (defaut) await tx.update(templates).set({ defaut: false, modifieLe: maintenant });
			await tx.insert(templates).values({ ...valeurs, identifiant, creeLe: maintenant });
		});
		return { issue: 'possible', template: nom };
	}

	const [ligne] = await base
		.select({ id: templates.id })
		.from(templates)
		.where(eq(templates.identifiant, vise))
		.limit(1);
	if (ligne === undefined) error(404, MESSAGE_INTROUVABLE);

	await base.transaction(async (tx) => {
		if (defaut) await tx.update(templates).set({ defaut: false, modifieLe: maintenant });
		await tx.update(templates).set(valeurs).where(eq(templates.id, ligne.id));
	});
	return { issue: 'possible', template: nom };
}

export const actions: Actions = {
	/**
	 * SUPPRIMER UN TEMPLATE — `RG-REF-01`.
	 *
	 * `template` porte l'IDENTIFIANT LISIBLE, celui de `templates.identifiant` que
	 * `lireTemplates()` rend en `id` : la vue le porte déjà, aucune table de
	 * traduction n'est nécessaire.
	 *
	 * AUCUNE ISSUE DE REFUS : la suppression d'un template n'affecte aucune note,
	 * et le dialogue du gel n'avertit que d'une chose — la création s'ouvrira sur
	 * la page vierge si c'était le template par défaut.
	 */
	supprimer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await supprimerUnTemplate(
			basePartagee(),
			String(champs.get('template') ?? '')
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		return resultat;
	},

	/**
	 * MARQUER UN TEMPLATE PAR DÉFAUT — `RG-REF-02`.
	 *
	 * Le geste est UNIQUE et laisse exactement un template par défaut : c'est ce
	 * que le gel écrit depuis l'écran — « Cocher décochera "X", qui l'est
	 * actuellement » (`V-31:380`). Voir `marquerLeTemplateParDefaut()` pour le
	 * motif de la transaction.
	 */
	marquerParDefaut: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const resultat = await marquerLeTemplateParDefaut(
			basePartagee(),
			String(champs.get('template') ?? ''),
			new Date()
		);
		if (resultat.issue === 'introuvable') error(404, MESSAGE_INTROUVABLE);
		return resultat;
	},

	/**
	 * CRÉER UN TEMPLATE — le geste que le panneau de V-31 promet depuis le gel.
	 *
	 * LES NOMS DE CHAMP SONT CEUX DU GEL, comme partout ailleurs en console :
	 * `f-nom`, `f-desc`, `f-type`, `f-defaut`, `f-contenu` sont les identifiants
	 * du formulaire (`V-31:363-560`). Rien n'est traduit ; deux noms pour une
	 * même clé finiraient par diverger (`P-35`).
	 */
	creer: async ({ locals, request }) => {
		consoleOuverte(locals);
		return await ecrireUnTemplate(basePartagee(), null, await request.formData());
	},

	/**
	 * ENREGISTRER UN TEMPLATE EXISTANT — même formulaire, même validation.
	 *
	 * `template` porte l'identifiant lisible, celui que `supprimer` et
	 * `marquerParDefaut` attendent déjà. L'IDENTIFIANT NE BOUGE PAS quand le nom
	 * change : il désigne la ligne, et le renommer casserait les trois autres
	 * gestes de l'écran en cours de route.
	 */
	enregistrer: async ({ locals, request }) => {
		consoleOuverte(locals);
		const champs = await request.formData();
		const vise = String(champs.get('template') ?? '');
		if (vise === '') error(404, MESSAGE_INTROUVABLE);
		return await ecrireUnTemplate(basePartagee(), vise, champs);
	}
};
