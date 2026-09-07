/**
 * `/modelisation` — LA VUE DE MODÉLISATION. Une seule question : QU'EST-CE QUI DÉPEND
 * DE QUOI.
 *
 * POURQUOI ELLE N'EST PAS LA CARTOGRAPHIE. La cartographie OBSERVE : elle dispose par
 * forces, garde les notes isolées, regroupe par familles sémantiques, et répond à
 * « comment ce corpus est-il fait ». Elle est bonne à cela et mauvaise à lire un
 * modèle — un placement qui bouge d'un chargement à l'autre ne se relit pas, et le
 * sens d'une dépendance n'y a aucune traduction géométrique. Ici la POSITION DIT LE
 * SENS : ce qui est en haut porte, ce qui est en bas dépend.
 *
 * POURQUOI ELLE N'EST PAS LA CARTE MENTALE. La carte mentale est un ARBRE — une note,
 * un parent, un rangement, aucune arête nommée. Y verser des relations typées qui
 * traversent les branches en ferait un graphe, c'est-à-dire cette vue-ci. Les deux
 * restent séparées.
 *
 * LES DROITS SONT CEUX DES CARTOGRAPHIES, PAR LE MÊME CHEMIN DE CODE : `garde.ts`
 * redirige l'anonyme avant ce chargeur, et un connecté sans droit reçoit un périmètre
 * RABATTU — zéro note, zéro relation —, jamais un refus.
 *
 * LES NOTES ISOLÉES SONT RETIRÉES ICI, ET C'EST L'INVERSE DE LA CARTOGRAPHIE. Là-bas,
 * « qu'est-ce qui n'est relié à rien ? » est une question qu'on pose, et la réponse
 * est le dessin lui-même. Ici la question est « qu'est-ce qui dépend de quoi » : une
 * note que rien ne touche n'y répond pas, et cent notes flottantes noieraient les
 * douze qui portent le modèle.
 */
import { fail, redirect } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import {
	PERIMETRE_DE_V19,
	perimetreDeLAdresse,
	valeurDeSelecteur,
	type RelationLisible
} from '$lib/donnees/outils';
import { ouvrirLAcces } from '$lib/donnees/rangement';
import { dansLePerimetre, pointsArticulation, sousGraphe, typeDe } from '$lib/graphe/cartographie';
import { cleDArete, disposerEnCouches, type AssiseDeLEtagement } from '$lib/graphe/couches';
import { TYPE_DE_MENTION } from '$lib/graphe/mentions';
import { propositionsDeMention } from '$lib/graphe/propositions';
import {
	ajouterUneRelation,
	annulerUnRefus,
	changerLeTypeDUneRelation,
	cleDeTriplet,
	confirmerUneRelation,
	lireLaSaisieDeRelation,
	lireLesPropositionsRefusees,
	lireLesTypesOfferts,
	proposerLesRelations,
	rejeterUneRelation,
	retirerUneRelation
} from '$lib/donnees/relations';
import type { PropositionRefusee } from '$lib/donnees/relations';
import { lireLeGraphe } from '../cartographie/lecture-du-graphe';
import type { Actions, PageServerLoad } from './$types';

/**
 * LE GRAPHE DU PÉRIMÈTRE, MONTÉ UNE FOIS — le chargeur ET les actions en ont besoin,
 * et deux montages divergeraient d'une règle sans que rien ne le dise. « Proposer »
 * doit RECALCULER les mentions côté serveur : celles que le formulaire porterait
 * seraient celles du navigateur, donc celles qu'on veut bien y mettre.
 */
async function monterLeModele(locals: App.Locals, perimetreDemande: string | null) {
	const base = basePartagee();
	const maintenant = new Date();
	const acces = await ouvrirLAcces(base, locals.identite, maintenant);
	const perimetre = perimetreDeLAdresse(perimetreDemande, PERIMETRE_DE_V19);
	const lu = await lireLeGraphe(base, acces, perimetre);
	/* `retirees` : voir l'en-tête. Une note que rien ne relie ne répond pas à la
	   question de cet écran. */
	const graphe = sousGraphe(lu.notes, perimetre, lu.relations, 'retirees');
	/* LES REFUS SONT MONTÉS ICI, avec le reste : le chargeur les AFFICHE et l'action
	   « Proposer » les ÉCARTE, et deux lectures divergeraient le jour où l'une
	   oublierait la borne de l'autre. */
	const refuses = await lireLesPropositionsRefusees(base, acces.perimetre);
	return { base, perimetre, graphe, refuses, ...lu };
}

/**
 * LES TRIPLETS REFUSÉS, en clés d'IDENTIFIANTS — l'espace de `propositionsDeMention()`
 * et des mentions. La table les porte en clés de base ; la lecture les a déjà traduits.
 */
function tripletsRefuses(refuses: readonly PropositionRefusee[]): ReadonlySet<string> {
	return new Set(refuses.map((r) => cleDeTriplet(r.de, r.vers, r.type)));
}

/**
 * L'ASSISE DEMANDÉE PAR L'ADRESSE. Une valeur inconnue vaut `tout` : ignorer plutôt
 * que refuser (`docs/routes.md` §4.2) — un réglage mal orthographié ne doit pas faire
 * sortir un écran.
 */
function assiseDeLAdresse(demandee: string | null): AssiseDeLEtagement {
	return demandee === 'declarees' ? 'declarees' : 'tout';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { base, perimetre, graphe, notes, typesRelation, relationsTechniques, refuses } =
		await monterLeModele(locals, url.searchParams.get('perimetre'));
	const assise = assiseDeLAdresse(url.searchParams.get('etagement'));

	/* Les arêtes du DESSIN, avec leur origine et leur clé de ligne. `sousGraphe()` les
	   rend au type `Relation` du corpus, faute de connaître les colonnes ajoutées ;
	   ce sont les MÊMES objets, filtrés. */
	const aretes = graphe.aretes as readonly RelationLisible[];
	const mentions = aretes.filter((r) => r.origine === 'deduite');

	const disposition = disposerEnCouches(graphe, assise);

	/**
	 * LES POINTS DE DÉFAILLANCE UNIQUE — calculés sur les SEULES relations que
	 * `types_de_relation` MARQUE techniques, et c'est la garantie de cette vue.
	 * `mentionne` n'y est pas et n'y sera pas, si bien qu'aucune arête déduite ne peut
	 * faire passer une note pour un point de rupture : une citation n'est pas une
	 * dépendance.
	 *
	 * QUAND LA TABLE NE MARQUE RIEN, LE CALCUL NE DIT RIEN — et c'est le cas de toute
	 * instance neuve, la colonne valant `false` par défaut depuis la migration `002`.
	 * L'écran ne peut pas laisser ce silence passer pour « aucun point de défaillance
	 * unique » : `nombreDeTypesPorteurs` descend, et la vue rend l'avis.
	 */
	const ruptures = [...pointsArticulation(graphe, relationsTechniques)];

	const titreParNote = new Map(notes.map((n) => [n.id, n.titre] as const));

	return {
		perimetreDemande: valeurDeSelecteur(perimetre),
		/**
		 * SUR QUOI L'ÉTAGEMENT S'APPUIE — servi pour que l'écran le DISE. La position
		 * verticale d'un nœud dépend de ce réglage, et un lecteur qui prend le dessin
		 * pour un modèle de dépendances déclarées se tromperait sans être averti.
		 */
		assise,
		/** L'arête que l'adresse désigne, sous la forme `de>vers>type`. */
		areteChoisie: url.searchParams.get('arete'),
		/**
		 * LES NŒUDS PLACÉS, prêts à dessiner. La disposition est calculée ICI, au
		 * chargeur : elle est déterministe et ne dépend d'aucun geste, la refaire à
		 * l'hydratation la paierait deux fois.
		 */
		noeuds: graphe.noeuds.map((n) => {
			const place = disposition.places.get(n.id);
			return {
				id: n.id,
				titre: n.note.titre,
				type: typeDe(n.note).nom,
				code: typeDe(n.note).code,
				x: place?.x ?? 0,
				y: place?.y ?? 0,
				couche: place?.couche ?? 0,
				rupture: ruptures.includes(n.id)
			};
		}),
		aretes: aretes.map((r) => ({
			cle: cleDArete(r),
			id: r.id,
			de: r.de,
			vers: r.vers,
			type: r.type as string,
			origine: r.origine,
			libelle: typesRelation[r.type]?.sortant ?? (r.type as string),
			technique: (relationsTechniques as readonly string[]).includes(r.type),
			/* Une arête que l'étagement a dû écarter pour rompre un circuit. Elle est
			   DITE, jamais tue : un modèle qui boucle est un fait du corpus. */
			retour: disposition.retours.has(cleDArete(r)),
			titreDe: titreParNote.get(r.de) ?? r.de,
			titreVers: titreParNote.get(r.vers) ?? r.vers
		})),
		largeur: disposition.largeur,
		hauteur: disposition.hauteur,
		/**
		 * LES NOTES DU PÉRIMÈTRE, pour les deux sélecteurs de la déclaration — TOUTES,
		 * y compris celles que le dessin a retirées faute de relation. C'est la seule
		 * façon de relier une note qui n'est encore reliée à rien : n'offrir que les
		 * nœuds dessinés rendrait le premier lien d'une note impossible à déclarer
		 * depuis l'écran qui sert à déclarer les liens.
		 */
		notesDuPerimetre: notes
			.filter((n) => dansLePerimetre(n, perimetre))
			.map((n) => ({ id: n.id, titre: n.titre }))
			.sort((a, b) => a.titre.localeCompare(b.titre, 'fr')),
		/** Le référentiel des types, tel que la table le porte — aucun n'est inventé. */
		typesOfferts: await lireLesTypesOfferts(base),
		/**
		 * CE QUE « PROPOSER » POSERAIT, compté avant tout clic. Le bouton doit dire ce
		 * qu'il fera : « Proposer » sans chiffre est un bouton qu'on n'ose pas presser.
		 */
		propositionsPossibles: propositionsDeMention(notes, aretes, mentions, tripletsRefuses(refuses))
			.length,
		/**
		 * LES PROPOSITIONS REFUSÉES, prêtes à lire — titres et libellé de type compris,
		 * pour que la vue n'ait rien à résoudre. Elles sont bornées au périmètre
		 * LISIBLE de l'appelant, comme les relations.
		 */
		refuses: refuses.map((r) => ({
			id: r.id,
			libelle: r.libelle,
			titreDe: r.titreDe,
			titreVers: r.titreVers,
			/* La date part en chaîne : c'est ce que la vue affiche, et une date rendue
			   telle quelle traverserait la sérialisation pour être reformatée deux fois. */
			refuseeLe: r.refuseeLe.toLocaleDateString('fr-FR')
		})),
		/** Les types qui portent une dépendance, tels que la table les marque. */
		nombreDeTypesPorteurs: relationsTechniques.length,
		/**
		 * L'appelant peut-il aller les régler ? La console n'est ouverte qu'à lui, et
		 * promettre une adresse qu'on ne peut pas ouvrir est le motif de `V-07`.
		 */
		consoleOuverte:
			locals.identite.type === 'authentifie' && locals.identite.role === 'administrateur',
		nombreDeMentions: mentions.length,
		nombreDeDeclarees: aretes.filter((r) => r.origine === 'declaree').length,
		nombreDePropositions: aretes.filter((r) => r.origine === 'ambigue').length,
		typeDeMention: TYPE_DE_MENTION
	};
};

/**
 * LE RETOUR À LA PAGE, PÉRIMÈTRE ET ASSISE CONSERVÉS.
 *
 * LE PÉRIMÈTRE VOYAGE DANS LE FORMULAIRE, PAS DANS L'ADRESSE DE L'ACTION. Une adresse
 * d'action SvelteKit est un paramètre de requête à part — la forme avec une barre
 * oblique —, et elle REMPLACE la chaîne de requête de la page : le périmètre choisi
 * serait perdu au premier geste, et l'écran reviendrait sur tout le corpus après
 * chaque déclaration. Un champ caché le porte, et le nom de la porte est le même
 * partout.
 *
 * L'ASSISE VOYAGE PAR LE MÊME CHEMIN, et pour la même raison : sans elle, déclarer
 * une relation depuis un étagement réglé sur les seules déclarées ramènerait le
 * dessin sur tout ce qui est dessiné, et le modèle changerait de forme sous la main.
 *
 * L'ARÊTE CHOISIE N'EST PAS CONSERVÉE, et c'est délibéré : après un changement de
 * type, un retrait ou un rejet, l'arête désignée n'est plus celle qu'on regardait —
 * elle a changé de clé, ou elle n'existe plus. Rouvrir un panneau sur une arête morte
 * afficherait un panneau vide sans dire pourquoi.
 */
function retour(perimetre: string | null, assise: AssiseDeLEtagement): string {
	const morceaux: string[] = [];
	if (perimetre !== null && perimetre !== '') {
		morceaux.push('perimetre=' + encodeURIComponent(perimetre));
	}
	/* SEULE LA VALEUR NON NOMINALE VOYAGE : `tout` est ce que l'adresse nue rend, et
	   l'écrire allongerait chaque adresse sans rien dire de plus. */
	if (assise === 'declarees') morceaux.push('etagement=declarees');
	return morceaux.length === 0 ? '/modelisation' : '/modelisation?' + morceaux.join('&');
}

/** Le champ que tous les formulaires portent — une seule orthographe, partout. */
function perimetreDuFormulaire(donnees: FormData): string | null {
	const brut = (donnees.get('perimetre') ?? '').toString().trim();
	return brut === '' ? null : brut;
}

/**
 * L'ASSISE QUE LE FORMULAIRE PORTE. Sans ce champ, le premier geste ramènerait
 * l'étagement à son état nominal, et le modèle qu'on regardait changerait de forme
 * sous la main.
 */
function assiseDuFormulaire(donnees: FormData): AssiseDeLEtagement {
	return assiseDeLAdresse((donnees.get('etagement') ?? '').toString().trim());
}

/** Un champ de formulaire, élagué — la lecture est la même pour les sept actions. */
function champ(donnees: FormData, nom: string): string {
	return (donnees.get(nom) ?? '').toString().trim();
}

/**
 * SEPT ACTIONS NOMMÉES, AUCUNE PAR DÉFAUT : SvelteKit refuse qu'une action par défaut
 * cohabite avec une action nommée. Chacune a son formulaire, et l'écran fonctionne
 * sans hydratation — c'est ce qui le rend éprouvable dans un navigateur sans rien
 * d'autre.
 *
 * LE REFUS EST UNIFORME. Toutes les portes de droit sont dans
 * `$lib/donnees/relations.ts` et rendent le même `INTROUVABLE` ; cette couche ne fait
 * que le traduire en message.
 */
export const actions: Actions = {
	declarer: async ({ request, locals }) => {
		const donnees = await request.formData();
		const saisie = lireLaSaisieDeRelation(donnees);
		if (!saisie.ok) return fail(400, { message: saisie.motif });
		const source = champ(donnees, 'source');
		if (source === '') return fail(400, { message: 'aucune note de départ choisie' });

		const resultat = await ajouterUneRelation(basePartagee(), {
			identite: locals.identite,
			source,
			saisie: saisie.saisie
		});
		if (!resultat.trouve) return fail(404, { message: 'relation impossible sur ces deux notes' });
		if (!resultat.ressource.ok) {
			return fail(409, {
				message:
					resultat.ressource.motif === 'doublon'
						? 'cette relation existe déjà'
						: 'une note ne se relie pas à elle-même'
			});
		}
		redirect(303, retour(perimetreDuFormulaire(donnees), assiseDuFormulaire(donnees)));
	},

	changer: async ({ request, locals }) => {
		const donnees = await request.formData();
		const relation = champ(donnees, 'relation');
		const type = champ(donnees, 'type');
		if (relation === '' || type === '') return fail(400, { message: 'demande incomplète' });

		const resultat = await changerLeTypeDUneRelation(basePartagee(), {
			identite: locals.identite,
			relation,
			type
		});
		if (!resultat.trouve) return fail(404, { message: 'relation introuvable' });
		if (!resultat.ressource.ok) return fail(409, { message: 'cette relation existe déjà' });
		redirect(303, retour(perimetreDuFormulaire(donnees), assiseDuFormulaire(donnees)));
	},

	retirer: async ({ request, locals }) => {
		const donnees = await request.formData();
		const relation = champ(donnees, 'relation');
		const depuis = champ(donnees, 'depuis');
		if (relation === '' || depuis === '') return fail(400, { message: 'demande incomplète' });

		const resultat = await retirerUneRelation(basePartagee(), {
			identite: locals.identite,
			depuis,
			relation
		});
		if (!resultat.trouve) return fail(404, { message: 'relation introuvable' });
		redirect(303, retour(perimetreDuFormulaire(donnees), assiseDuFormulaire(donnees)));
	},

	confirmer: async ({ request, locals }) => {
		const donnees = await request.formData();
		const relation = champ(donnees, 'relation');
		if (relation === '') return fail(400, { message: 'demande incomplète' });

		const resultat = await confirmerUneRelation(basePartagee(), {
			identite: locals.identite,
			relation
		});
		if (!resultat.trouve) return fail(404, { message: 'proposition introuvable' });
		redirect(303, retour(perimetreDuFormulaire(donnees), assiseDuFormulaire(donnees)));
	},

	rejeter: async ({ request, locals }) => {
		const donnees = await request.formData();
		const relation = champ(donnees, 'relation');
		if (relation === '') return fail(400, { message: 'demande incomplète' });

		const resultat = await rejeterUneRelation(basePartagee(), {
			identite: locals.identite,
			relation
		});
		if (!resultat.trouve) return fail(404, { message: 'proposition introuvable' });
		redirect(303, retour(perimetreDuFormulaire(donnees), assiseDuFormulaire(donnees)));
	},

	/**
	 * LES MENTIONS SONT RECALCULÉES ICI, sur le périmètre demandé et les droits de
	 * l'appelant. Rien de ce que le formulaire porterait ne serait digne de foi : une
	 * liste de paires soumise par le navigateur permettrait de faire écrire au produit
	 * des propositions qu'aucune mention ne soutient.
	 */
	proposer: async ({ request, locals }) => {
		const donnees = await request.formData();
		const perimetreDemande = perimetreDuFormulaire(donnees);
		const { notes, graphe, refuses } = await monterLeModele(locals, perimetreDemande);
		const aretes = graphe.aretes as readonly RelationLisible[];
		const mentions = aretes.filter((r) => r.origine === 'deduite');
		const propositions = propositionsDeMention(notes, aretes, mentions, tripletsRefuses(refuses));

		if (propositions.length === 0) {
			return fail(400, { message: 'aucune mention ne correspond à une règle de proposition' });
		}

		const releve = await proposerLesRelations(basePartagee(), {
			identite: locals.identite,
			propositions: propositions.map((p) => ({ de: p.de, vers: p.vers, type: p.type }))
		});
		if (releve.posees === 0) {
			return fail(409, {
				message:
					String(releve.ecartees) +
					' proposition(s) écartée(s), dont ' +
					String(releve.refusees) +
					' refusée(s) : la paire est déjà reliée, le lien a été refusé, ou le droit manque sur une extrémité'
			});
		}
		redirect(303, retour(perimetreDemande, assiseDuFormulaire(donnees)));
	},

	/**
	 * ANNULER UN REFUS — la ligne quitte la mémoire des refus, et RIEN n'est reposé.
	 * C'est le clic suivant sur « Proposer » qui repropose : reposer ici écrirait une
	 * relation que personne n'a demandée.
	 */
	annulerLeRefus: async ({ request, locals }) => {
		const donnees = await request.formData();
		const refus = champ(donnees, 'refus');
		if (refus === '') return fail(400, { message: 'demande incomplète' });

		const resultat = await annulerUnRefus(basePartagee(), {
			identite: locals.identite,
			refus
		});
		if (!resultat.trouve) return fail(404, { message: 'refus introuvable' });
		redirect(303, retour(perimetreDuFormulaire(donnees), assiseDuFormulaire(donnees)));
	}
};
