<script lang="ts">
	/**
	 * `/importer` — V-24 Import.
	 *
	 * `T-070` avait monté cette route sans chargeur, et elle servait l'écran
	 * d'import — quinze kilo-octets, rail et arborescence compris — à tout
	 * connecté, y compris à un lecteur et à un contributeur sans le moindre
	 * droit de rédaction (`ECART-047` É-1). La garde est côté serveur, dans
	 * `+page.server.ts`, à côté de ce fichier.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * CE FICHIER EST LE CÂBLAGE DU PARCOURS, ET RIEN D'AUTRE
	 *
	 * Le gel de V-24 ne porte ni méthode, ni cible, ni champ de fichier : son
	 * bouton « Parcourir mes fichiers » est un bouton nu, et le dépôt y est un
	 * comportement de navigateur. C'est donc la ROUTE qui donne au parcours ses
	 * deux gestes serveur, par deux rappels que la vue reçoit en propriété :
	 *
	 *   `analyser` — l'étape 2 vers l'étape 3. Le lot est envoyé, CLASSÉ, et
	 *                rien n'est écrit : `UC-M12-04` étape 3, « rien n'a encore
	 *                été écrit ». La vue en tire l'arborescence détectée, le
	 *                récapitulatif chiffré et les fichiers écartés.
	 *   `importer` — l'étape 3 vers l'étape 4. Le lot est exécuté, en réel ou en
	 *                simulation selon la case du gel, et le rapport rendu est
	 *                celui du traitement — jamais un rapport d'exemple.
	 *
	 * DEUX ACTIONS NOMMÉES, jamais une action par défaut : SvelteKit rend 500
	 * quand les deux régimes cohabitent sur une même page.
	 *
	 * `deserialize` DE SVELTEKIT EST EMPLOYÉ, et il n'est pas décoratif : la
	 * réponse d'une action est sérialisée par `devalue`, qui porte des formes que
	 * `JSON` perd. La relire à la main serait un second format.
	 *
	 * LES DEUX FORMES SONT DÉCRITES ICI, et c'est le prix d'une frontière : une
	 * charge d'action se relit en `unknown`, et il faut bien dire ce qu'on en
	 * attend. La conversion est faite au bord, une seule fois — même geste que
	 * `src/lib/auth/depot.ts` pour les rôles. Si la vue et cette description
	 * divergeaient, le contrôle de types le dirait à la compilation.
	 *
	 * SANS JAVASCRIPT, CET ÉCRAN NE DÉPOSE PAS — `ARB-063` §4, comme les six
	 * autres formulaires du produit.
	 *
	 * La feuille portée est importée ici parce qu'aucune autre couche ne la
	 * sert : `+layout.svelte` ne porte que le socle. Elle est identique à
	 * l'octet à sa source gelée (P-6.3) et n'est pas modifiée par cet import.
	 *
	 * AUCUN titre de page n'est déclaré : les titres des maquettes sont ceux des
	 * planches de revue, et en inventer un serait un comblement.
	 */
	import { deserialize } from '$app/forms';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import Vue from '../../vues/V-24.svelte';
	import '../../vues/V-24.css';
	import { reprendreLotEnAttente } from './lot-en-attente';
	import { cheminDuFichier } from '$lib/cablage/depot-de-fichiers';
	import type { LotDImport } from '../../../seeds/corpus';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	/**
	 * LE LOT QUE LA CONSOLE A REÇU, REPRIS ICI — et repris UNE FOIS.
	 *
	 * `mockups/V-35-console-imports.html:3000` : le dépôt de `/console/imports`
	 * fait atterrir son lot « à l'étape du choix de scénario, vue V-24 ». C'est
	 * cette adresse, et c'est l'étape 1. La lecture est faite à l'initialisation
	 * du composant, donc une fois par ouverture du parcours : un lot déposé n'est
	 * remis qu'au parcours qui s'ouvre derrière lui.
	 *
	 * VIDE DANS TOUS LES AUTRES CAS — une requête directe, un rechargement, un
	 * retour arrière. `docs/routes.md:297` : « un parcours qui porte des fichiers
	 * déposés n'est pas restaurable depuis une adresse. »
	 */
	const lotRecu = reprendreLotEnAttente();

	/** Ce que la vue attend du rapport — la description de la frontière. */
	interface RapportDeLot {
		readonly simulation: boolean;
		readonly total: number;
		readonly notesCreees: number;
		readonly notesMisesAJour: number;
		readonly ignores: number;
		readonly echecs: number;
		readonly dossiersCrees: number;
		readonly domaine: string;
		readonly enEchec: readonly { readonly chemin: string; readonly motif: string }[];
		readonly renvoisNonResolus: readonly {
			readonly chemin: string;
			readonly renvois: readonly string[];
		}[];
		readonly ecrites: readonly {
			readonly identifiant: string;
			readonly titre: string;
			readonly ou: string;
			readonly adresse: string;
			readonly miseAJour: boolean;
		}[];
	}

	interface Reglages {
		readonly domaine: string;
		readonly simulation: boolean;
	}

	/** Ce que l'analyse rend : le lot classé, et ce que la cible porte déjà. */
	interface AnalyseDuLot {
		readonly lot: LotDImport;
		readonly dossiersExistants: readonly string[];
	}

	/**
	 * CE QU'UN GESTE SERVEUR REND — le résultat, OU LE MOTIF DE SON REFUS.
	 *
	 * `envoyer()` rendait `null` sur tout ce qui n'était pas un succès, et la vue
	 * retournait alors en silence : « Analyser le lot » ne produisait RIEN, sans
	 * un mot, alors que l'action avait répondu `fail(400, domaine-inconnu)` ou
	 * `fail(403, sans-droit-sur-la-cible)`. Trois refus, tous avalés. `P-09` : une
	 * action offerte aboutit, ou dit pourquoi elle refuse.
	 *
	 * LE MOTIF EST UN CODE, jamais une phrase : la mise en français est dans la
	 * vue, comme celle des motifs de classement.
	 */
	type Issue<T> = { readonly valeur: T } | { readonly refus: string };

	/**
	 * LE REPLI QUAND LA RÉPONSE N'EST PAS LISIBLE — ET AUCUNE ACTION NE L'ÉMET.
	 *
	 * `fail()` produit un résultat de type `failure` dont `data` porte l'objet
	 * passé à l'appel — ici `issue` —, et les trois seuls motifs que les actions
	 * de ce dossier rendent sont ceux-là. Ce code-ci n'en fait pas partie : il
	 * est posé PAR CET ÉCRAN, et seulement quand la réponse ne porte pas de
	 * motif lisible — un `error()` non intercepté, ou un succès dont la charge
	 * n'a pas la forme attendue. Il ne dit donc rien de ce que le serveur a
	 * fait, et sa mise en français dans la vue ne doit rien affirmer non plus.
	 *
	 * UNE REDIRECTION N'EN EST PAS UN CAS : elle se suit, voir `envoyer()`.
	 */
	const REFUS_SANS_MOTIF = 'erreur-serveur';

	/**
	 * L'ENVOI D'UN LOT À UNE ACTION NOMMÉE.
	 *
	 * Les noms de champ sont les identifiants du gel — `domaine-cible`,
	 * `simulation` —, convention posée par `ARB-054` §3 et déjà appliquée par
	 * `/mon-profil`. La partie qui porte les fichiers s'appelle `fichiers` :
	 * c'est le seul nom de ce câblage qu'aucune source ne fonde, et le chargeur
	 * le déclare comme tel.
	 *
	 * LE CHEMIN DE CHAQUE FICHIER VOYAGE, pas seulement son nom. `File.name` perd
	 * l'arborescence ; or c'est elle qui deviendra celle des dossiers, « à
	 * l'identique » comme le scénario le promet. Le troisième argument de
	 * `append` porte donc le chemin relatif quand le navigateur le connaît.
	 */
	async function envoyer(
		action: string,
		fichiers: readonly File[],
		reglages: Reglages
	): Promise<Issue<Record<string, unknown>>> {
		const corps = new FormData();
		corps.append('domaine-cible', reglages.domaine);
		if (reglages.simulation) corps.append('simulation', 'oui');
		for (const f of fichiers) corps.append('fichiers', f, cheminDuFichier(f));
		const reponse = await fetch(`?/${action}`, { method: 'POST', body: corps });

		/* UNE REDIRECTION SE SUIT, ELLE NE SE RACONTE PAS — et il y en a DEUX
		   FORMES, mesurées sur le produit plutôt que supposées.

		   Celle qui arrive vraiment est la session close pendant le parcours :
		   `garde.ts` range `/importer` au régime `redirection`, et les hooks
		   répondent 302 vers `/connexion` AVANT que l'action existe. Relevé au
		   dev sur un envoi sans session : `POST /importer?/analyser` -> 302 vers
		   `/connexion?motif=page-protegee&suite=…`. Un envoi programmé suit ce
		   renvoi tout seul, et ce qui revient est alors la PAGE DE CONNEXION :
		   la relire comme un résultat d'action lève, et le parcours restait de
		   nouveau sans un mot. `redirected` dit que le renvoi a eu lieu, `url`
		   dit où — c'est là qu'il faut emmener la fenêtre.

		   L'autre est le `redirect` d'une action, que `deserialize` sait rendre.
		   Aucune des deux actions de ce dossier n'en lève aujourd'hui ; le motif
		   de refus lui étant attribué affirmait pourtant que le lot n'avait pas
		   été traité. On la suit aussi, plutôt que de la raconter de travers.

		   Le repli rendu ensuite ne sert qu'à honorer la signature, le temps que
		   la page parte — et il n'affirme rien de ce qu'est devenu le lot. */
		if (reponse.redirected) {
			window.location.assign(reponse.url);
			return { refus: REFUS_SANS_MOTIF };
		}

		const resultat = deserialize(await reponse.text());
		if (resultat.type === 'failure') {
			const motif = (resultat.data as Record<string, unknown> | undefined)?.['issue'];
			return { refus: typeof motif === 'string' ? motif : REFUS_SANS_MOTIF };
		}
		if (resultat.type === 'redirect') {
			window.location.assign(resultat.location);
			return { refus: REFUS_SANS_MOTIF };
		}
		if (resultat.type !== 'success') return { refus: REFUS_SANS_MOTIF };
		return { valeur: (resultat.data ?? {}) as Record<string, unknown> };
	}

	async function analyser(
		fichiers: readonly File[],
		reglages: Reglages
	): Promise<Issue<AnalyseDuLot>> {
		const issue = await envoyer('analyser', fichiers, reglages);
		if ('refus' in issue) return issue;
		const lot = issue.valeur['lot'] as LotDImport | undefined;
		if (lot === undefined) return { refus: REFUS_SANS_MOTIF };
		return {
			valeur: {
				lot,
				dossiersExistants:
					(issue.valeur['dossiersExistants'] as readonly string[] | undefined) ?? []
			}
		};
	}

	async function importer(
		fichiers: readonly File[],
		reglages: Reglages
	): Promise<Issue<RapportDeLot>> {
		const issue = await envoyer('importer', fichiers, reglages);
		if ('refus' in issue) return issue;
		const rapport = issue.valeur['rapport'] as RapportDeLot | undefined;
		return rapport === undefined ? { refus: REFUS_SANS_MOTIF } : { valeur: rapport };
	}

	/**
	 * « LAISSER TOURNER EN ARRIÈRE-PLAN » — `V-24:3382`, qui annonce « suivez-le
	 * depuis la console, onglet Imports, vue V-35 ».
	 *
	 * LE TRAITEMENT NE S'INTERROMPT PAS QUAND ON QUITTE L'ÉCRAN, et c'est ce qui
	 * rend la promesse honnête : la requête est DÉJÀ partie, l'action de route
	 * s'exécute côté serveur jusqu'au bout, et la navigation n'annule que la
	 * lecture de sa réponse. Le rapport, lui, se lit ensuite dans la console.
	 *
	 * LE BOUTON EST RETIRÉ QUAND LA CONSOLE EST HORS DE PORTÉE — `P-09`, une
	 * action interdite n'est pas rendue. `[hidden]` du socle le sort de la boîte
	 * de rendu comme de l'arbre d'accessibilité ; le nœud du gel n'est ni
	 * supprimé, ni grisé, ni déplacé.
	 */
	onMount(() => {
		const bouton = document.querySelector<HTMLButtonElement>('#arriere-plan');
		if (bouton === null) return;
		if (!data.suiviEnConsole) {
			bouton.hidden = true;
			return;
		}
		const suivre = (): void => location.assign(resolve('/console/imports'));
		bouton.addEventListener('click', suivre);
		return () => bouton.removeEventListener('click', suivre);
	});
</script>

<!-- `domaines` PEUPLE ICI UN CHAMP DE SAISIE OBLIGATOIRE — le sélecteur « Domaine
     de destination » de l'étape 2 —, et non le seul rail de la coquille. Sans
     cette propriété, la vue retombait sur `DOMAINES` du jeu de semence : sur une
     instance neuve, l'écran n'offrait que des domaines fictifs, et l'action
     refusait le dépôt en 400. La liste servie est celle des domaines où
     l'appelant peut ÉCRIRE, pas celle qu'il peut lire — voir `+page.server.ts`. -->
<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	domaines={data.domainesOuEcrire}
	lotImport={data.lotImport}
	formatsImport={data.formatsImport}
	domaineParDefaut={data.domaineParDefaut}
	{lotRecu}
	{analyser}
	{importer}
/>
