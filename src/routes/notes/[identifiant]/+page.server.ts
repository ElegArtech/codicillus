/**
 * `/notes/{identifiant}` — LE CHARGEUR DE LA LECTURE D'UNE NOTE (V-14).
 *
 * `?registre=operationnel` désigne le second registre, et rien d'autre :
 * `docs/routes.md:223` — « le paramètre `?registre=` reste réservé à la
 * lecture » —, `V-14:3958` l'écrit dans l'adresse, « le lien est partageable
 * tel quel ». `/notes/{identifiant}/operationnel` est l'ÉDITEUR (V-18,
 * `docs/routes.md:145`) et n'appartient pas à ce lot.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * UN SEUL POINT DE SORTIE POUR LE REFUS — ADR-007, RG-ACC-04
 *
 * `lireLaNote()` rend une ressource ou `INTROUVABLE`, sans troisième forme, et
 * ce fichier n'a donc qu'UN `error(404, MESSAGE_INTROUVABLE)` : « une note inexistante » et « une
 * note interdite » ne sont pas deux branches qui se ressemblent, c'est le même
 * appel, à la même ligne. Rien ici ne sait laquelle des deux causes s'est
 * réalisée — la garantie est portée par le type, pas par la discipline.
 *
 * CE QUE CE 404 NE REND PAS ENCORE. `docs/routes.md` §5.5 veut **V-04** pour
 * l'anonyme et **V-26** pour le connecté sans droit. Ces deux écrans sont
 * l'objet de `T-035` (`docs/plan-cablage.md`, vague 2 : « adresse non résolue |
 * V-02, V-03, V-04, V-26 ») : les peindre ici demanderait une page d'erreur, et
 * ce lot ne la pose pas. Le code de statut, lui, est celui que §5.5 exige, et
 * les deux côtés du couple sont indiscernables — c'est ce que mesure
 * `pnpm test:etancheite`.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES DROITS SONT RÉSOLUS, JAMAIS RECOPIÉS
 *
 * `src/lib/droits/resolution.ts` est l'implémentation unique (T-011), et
 * jusqu'au 20 août aucune route ne l'appelait — la cause de la fuite mesurée à
 * `ECART-047` É-1. L'identité vient de `event.locals.identite`, posée par
 * `src/hooks.server.ts` pour chaque requête ; elle vaut `ANONYME` ou une
 * identité authentifiée, jamais rien.
 *
 * L'INSTANT DE RÉFÉRENCE EST PRIS ICI, UNE FOIS. `lireNotes()` l'exige en
 * paramètre : une couche de lecture qui prendrait l'heure elle-même rendrait
 * ses résultats non reproductibles. En service, la fraîcheur est vraie
 * MAINTENANT.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LES TROIS ACTIONS DE M06 SONT ICI, ET NULLE PART AILLEURS
 *
 * `docs/routes.md:140` rattache à cette adresse `UC-M06-02`, `UC-M06-03` et
 * `RG-M06-05…11` : c'est la route de la lecture d'une note, et c'est d'elle que
 * partent les trois gestes du cartouche et du bandeau de révision. Elles sont
 * NOMMÉES — `verifier`, `signaler`, `lever` —, parce que la page en porte trois
 * et qu'une action par défaut ne saurait pas laquelle a été demandée.
 *
 * `T-024` LIVRE LE MÉCANISME, PAS SON DÉCLENCHEUR. Le gel rend les trois
 * boutons (`V-14:1471`, `:1482`, `:1427`), et AUCUN n'est dans un formulaire :
 * `ARB-054` §3 recense les cinq formulaires du gel, et V-14 n'en porte aucun.
 * Ce qui atteint ces actions depuis l'écran — un formulaire posé par le lot de
 * comportement, ou une soumission par `fetch` — appartient au lot qui touchera
 * `src/vues/`. La règle d'`ARB-054` §3 vaut ici sans réserve : sans `method`,
 * une soumission native partirait en GET, et `§4` du même arbitrage ferme la
 * question — « aucune autre action d'écriture ne passe en GET ». Écart déclaré
 * au rapport, non contourné.
 *
 * ET LE REFUS N'ATTEND PAS LE BOUTON. `P-09` dit que l'action interdite n'est
 * pas RENDUE ; l'absence de bouton n'est pas un contrôle d'accès. Les trois
 * actions résolvent le droit AVANT d'écrire, et leur refus est le MÊME `404`
 * que celui du chargeur — `RG-ACC-04`, rien ne distingue « la note n'existe
 * pas » de « vous n'y avez pas droit ».
 */
import { error, fail } from '@sveltejs/kit';
import { basePartagee } from '$lib/base/acces';
import { lireLHistoire, versionDemandee } from '$lib/donnees/histoire';
import { lireSeuils } from '$lib/donnees/lecture';
import { lireLaNote, registreDemande } from '$lib/donnees/note';
import {
	commentaireDeRevision,
	demanderUneRevision,
	leverLaDemandeDeRevision,
	verifierLaNote
} from '$lib/donnees/verification';
import type { Actions, PageServerLoad } from './$types';
import { MESSAGE_INTROUVABLE } from '$lib/donnees/rangement';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const base = basePartagee();
	const maintenant = new Date();
	const contexte = { maintenant, seuils: await lireSeuils(base) };
	const registre = registreDemande(url.searchParams.get('registre'));

	const resolution = await lireLaNote(base, {
		identifiant: params.identifiant,
		registre,
		identite: locals.identite,
		contexte
	});

	if (!resolution.trouve) error(404, MESSAGE_INTROUVABLE);
	const lecture = resolution.ressource;

	/* ═══════════════════════════════════════════════════════════════════════
	   L'HISTORIQUE — T-039, ajouté à ce chargeur et non à un autre.

	   V-15 N'A PAS DE CHEMIN PROPRE : `docs/routes.md:141` et `:207` la classent
	   « superposée » à cette adresse, et son fil est celui de V-14. Son état
	   adressable est `?version={n}` (`docs/routes.md:224`), lu ici.

	   L'ACCÈS EST DÉJÀ DÉCIDÉ : `lireLHistoire()` prend la lecture RÉSOLUE
	   ci-dessus, jamais un identifiant nu — il n'existe donc pas deux décisions
	   d'accès à cette adresse. */
	const histoire = await lireLHistoire(
		base,
		lecture,
		maintenant,
		versionDemandee(url.searchParams.get('version'))
	);

	return {
		/**
		 * LE VECTEUR D'ÉTAT DE V-14, et il ne porte que ce qui est VRAI de cet
		 * appelant-ci : ses droits.
		 *
		 * Les six autres leviers de la planche — `fr`, `c-revision`,
		 * `c-brouillon`, `c-resync`, `c-op`, `etat` — décrivent LA NOTE AFFICHÉE.
		 * Or l'article de V-14 est la transcription gelée de `n-restaurer-pg`
		 * (`src/lib/lecture/CorpsReference.svelte`, `note-de-demonstration.ts`),
		 * et la vue n'accepte aucune propriété de note : les piloter depuis une
		 * AUTRE note peindrait les attributs d'une note sur le corps d'une autre
		 * — la « valeur illustrative » que P-02 proscrit. Ils restent donc à leur
		 * position du gel, et l'écart est déclaré au rapport du lot.
		 *
		 * `droits`, lui, est une propriété de l'APPELANT, vraie quelle que soit
		 * la note : la capacité d'écrire vient de `capacites()` (CDC §2.3), et
		 * c'est elle qui décide de l'ÉMISSION des actions d'écriture (P-09,
		 * ARB-040 : omises, jamais masquées).
		 */
		vecteur: { droits: lecture.capacites.ecrireDesNotes ? 'ecriture' : 'lecture' },
		notes: lecture.notes,
		/**
		 * LA NOTE RÉELLE, SON CORPS ET SES RÉTROLIENS — chargés, servis à la page,
		 * et QU'AUCUN NŒUD DE V-14 NE PEUT RECEVOIR à ce jour : la vue déclare
		 * deux propriétés (`vecteur`, `notes`) et lit tout le reste de
		 * `seeds/corpus.ts` et de `$lib/lecture/note-de-demonstration.ts`. Aucun
		 * fichier de `src/vues/` n'est touché par ce lot — c'est la règle de la
		 * vague —, donc l'écran reste celui du gel. Écart déclaré, chiffré au
		 * rapport.
		 */
		lecture: {
			note: lecture.note,
			registre,
			corps: lecture.corps,
			retroliens: lecture.retroliens
		},
		/**
		 * L'HISTORIQUE RÉEL DE LA NOTE — T-039 —, ET QU'AUCUN NŒUD DE CETTE PAGE
		 * NE PEUT RECEVOIR À CE JOUR. `src/vues/V-15.svelte` déclare bien
		 * `versions` et `retentionVersions` depuis `T-043`, mais c'est `V-14` que
		 * cette adresse monte : V-15 est une SUPERPOSITION, et rien n'adresse
		 * l'ouverture de son panneau — `docs/routes.md` §S2 ne connaît de V-15
		 * que `?version=` et l'ancre. Monter V-15 demanderait de décider quand le
		 * panneau est ouvert, ce qu'aucune source ne dit : ce serait combler.
		 * Écart déclaré, chiffré au rapport de lot.
		 *
		 * `versions` est VIDE parce que la table l'est — zéro ligne pour
		 * 32 notes —, et non parce qu'une transposition manquerait.
		 * `retention` est `versions_max` de `parametres`, lu et jamais redéclaré.
		 */
		histoire
	};
};

/**
 * LE CONTEXTE D'UN GESTE — l'instant est pris UNE FOIS par requête, et il sert
 * à la fois de seuil de lecture et de date d'attestation.
 *
 * Deux appels d'horloge donneraient à la note une date de vérification
 * légèrement postérieure à celle sur laquelle la fraîcheur a été résolue : la
 * réponse serait exacte, et la trace incohérente d'une milliseconde.
 */
async function contexteDUnGeste() {
	const base = basePartagee();
	const maintenant = new Date();
	return { base, maintenant, contexte: { maintenant, seuils: await lireSeuils(base) } };
}

export const actions: Actions = {
	/**
	 * VÉRIFIER — `UC-M06-02`. Un clic, aucun champ : la requête n'a pas de corps
	 * utile, et il n'y a rien à valider avant d'écrire. C'est littéralement ce
	 * que `CLAUDE.md` §1 décrit — « en un clic, sans formulaire ».
	 */
	verifier: async ({ params, locals }) => {
		const { base, maintenant, contexte } = await contexteDUnGeste();
		const fait = await verifierLaNote(base, {
			identifiant: params.identifiant,
			identite: locals.identite,
			contexte,
			maintenant
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		return {
			verifieLe: fait.ressource.verifieLe.toISOString(),
			/* `RG-M06-07` — ce que le geste a EFFACÉ au passage. L'écran a besoin de
			   le savoir : le bandeau de révision doit disparaître. */
			demandeEffacee: fait.ressource.demandeEffacee
		};
	},

	/**
	 * SIGNALER À RÉVISER — `UC-M06-03`, « en expliquant pourquoi ». Le
	 * commentaire est la seule donnée du geste, et son absence le refuse.
	 */
	signaler: async ({ params, locals, request }) => {
		const { base, maintenant, contexte } = await contexteDUnGeste();
		const formulaire = await request.formData();
		const commentaire = commentaireDeRevision(formulaire.get('commentaire'));

		if (commentaire === null) {
			/* LE DROIT EST RÉSOLU AVANT QU'ON SE PLAIGNE DE LA FORME. Une réponse qui
			   distinguerait « explication manquante » de « adresse inconnue »
			   révélerait l'existence de la note à qui n'y a pas droit — le même
			   raisonnement que l'action de `/notes/{identifiant}/modifier`. La levée
			   sert de sonde d'accès : elle est le geste du même régime dont l'effet
			   est neutre quand aucune demande n'est courante. */
			const acces = await leverLaDemandeDeRevision(base, {
				identifiant: params.identifiant,
				identite: locals.identite,
				contexte,
				maintenant
			});
			if (!acces.trouve) error(404, MESSAGE_INTROUVABLE);
			return fail(400, { motif: 'aucune explication fournie' });
		}

		const fait = await demanderUneRevision(base, {
			identifiant: params.identifiant,
			identite: locals.identite,
			contexte,
			maintenant,
			commentaire
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		return {
			le: fait.ressource.le.toISOString(),
			/* `RG-M06-06` — la demande a-t-elle REMPLACÉ une demande courante. */
			aRemplace: fait.ressource.aRemplace
		};
	},

	/**
	 * LEVER LA DEMANDE — `M06.3`, dernière puce, rendue par `V-14:1427`.
	 *
	 * Elle n'atteste rien : la note ne repasse pas au vert. Confondre les deux
	 * serait confondre « cette demande n'a plus lieu d'être » et « ce contenu est
	 * d'actualité », et le vocabulaire du produit sépare les deux (`CLAUDE.md`
	 * §3, « Vérifier »).
	 */
	lever: async ({ params, locals }) => {
		const { base, maintenant, contexte } = await contexteDUnGeste();
		const fait = await leverLaDemandeDeRevision(base, {
			identifiant: params.identifiant,
			identite: locals.identite,
			contexte,
			maintenant
		});
		if (!fait.trouve) error(404, MESSAGE_INTROUVABLE);
		return { avaitUneDemande: fait.ressource.avaitUneDemande };
	}
};
