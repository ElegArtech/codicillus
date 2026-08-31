<script lang="ts">
	/**
	 * `/importer` — V-24 Import. La garde est côté serveur, dans `+page.server.ts`.
	 *
	 * CE FICHIER EST LE CÂBLAGE DU PARCOURS, ET RIEN D'AUTRE. Le gel de V-24 ne porte
	 * ni méthode, ni cible, ni champ de fichier : c'est la ROUTE qui donne au parcours
	 * ses deux gestes serveur — `analyser`, qui CLASSE sans rien écrire, et
	 * `importer`, qui exécute.
	 *
	 * DEUX ACTIONS NOMMÉES, jamais une action par défaut : SvelteKit rend 500 quand
	 * les deux régimes cohabitent sur une même page.
	 *
	 * `deserialize` DE SVELTEKIT EST EMPLOYÉ, et il n'est pas décoratif : la réponse
	 * d'une action est sérialisée par `devalue`, qui porte des formes que `JSON` perd.
	 * La conversion des deux formes est faite au bord, une seule fois.
	 *
	 * SANS JAVASCRIPT, CET ÉCRAN NE DÉPOSE PAS — `ARB-063` §4.
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
	 * LE LOT QUE LA CONSOLE A REÇU, REPRIS ICI — et repris UNE FOIS, à
	 * l'initialisation du composant : un lot déposé n'est remis qu'au parcours qui
	 * s'ouvre derrière lui. VIDE DANS TOUS LES AUTRES CAS — requête directe,
	 * rechargement, retour arrière : « un parcours qui porte des fichiers déposés
	 * n'est pas restaurable depuis une adresse ».
	 */
	const lotRecu = reprendreLotEnAttente();

	interface RapportDeLot {
		readonly simulation: boolean;
		/** `RG-M12-03`, mode strict — le lot est allé au bout puis a été annulé. */
		readonly refuseEnBloc: boolean;
		readonly total: number;
		readonly notesCreees: number;
		readonly notesMisesAJour: number;
		readonly ignores: number;
		readonly echecs: number;
		readonly dossiersCrees: number;
		/** `RG-M12-03` — les relations créées par les renvois déclarés. */
		readonly relationsCreees: number;
		readonly domaine: string;
		/** L'adresse du domaine visé, composée par le serveur. */
		readonly adresseDuDomaine: string;
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
		readonly scenario: string;
		readonly domaine: string;
		/** `UC-M12-02` — le nom du domaine à créer, et l'univers qui l'accueille. */
		readonly nomDuDomaine: string;
		readonly universDAccueil: string;
		readonly simulation: boolean;
		/** `RG-M12-03` — refuser le lot entier si une ligne échoue. */
		readonly strict: boolean;
	}

	interface AnalyseDuLot {
		readonly lot: LotDImport;
		readonly dossiersExistants: readonly string[];
		/** `UC-M12-02` — le domaine que l'import CRÉERA, et qui n'existe pas encore. */
		readonly domaineACreer: string;
	}

	/**
	 * CE QU'UN GESTE SERVEUR REND — le résultat, OU LE MOTIF DE SON REFUS.
	 * `envoyer()` rendait `null` sur tout ce qui n'était pas un succès : « Analyser le
	 * lot » ne produisait RIEN, sans un mot, alors que l'action avait répondu
	 * `fail(400, …)` ou `fail(403, …)`. `P-09` : une action offerte aboutit, ou dit
	 * pourquoi elle refuse. LE MOTIF EST UN CODE, jamais une phrase.
	 */
	type Issue<T> = { readonly valeur: T } | { readonly refus: string };

	/**
	 * LE REPLI QUAND LA RÉPONSE N'EST PAS LISIBLE — ET AUCUNE ACTION NE L'ÉMET. Les
	 * quatre seuls motifs que les actions de ce dossier rendent sont cible inconnue,
	 * cible interdite, lot vide et scénario non livré ; ce code-ci est posé PAR CET
	 * ÉCRAN, quand la réponse ne porte pas de motif lisible. Il ne dit rien de ce que
	 * le serveur a fait, et sa mise en français ne doit rien affirmer non plus. Une
	 * redirection n'en est pas un cas : elle se suit.
	 */
	const REFUS_SANS_MOTIF = 'erreur-serveur';

	/**
	 * L'ENVOI D'UN LOT À UNE ACTION NOMMÉE. Les noms de champ sont les identifiants du
	 * gel ; la partie qui porte les fichiers s'appelle `fichiers` — le seul nom de ce
	 * câblage qu'aucune source ne fonde.
	 *
	 * `scenario` VOYAGE DÉSORMAIS : l'action traitait les trois scénarios comme celui
	 * qu'elle sait faire, et un lot choisi « domaine complet » atterrissait dans le
	 * domaine proposé par défaut sans que rien ne le dise.
	 *
	 * LE CHEMIN DE CHAQUE FICHIER VOYAGE, pas seulement son nom : `File.name` perd
	 * l'arborescence, or c'est elle qui deviendra celle des dossiers.
	 */
	async function envoyer(
		action: string,
		fichiers: readonly File[],
		reglages: Reglages
	): Promise<Issue<Record<string, unknown>>> {
		const corps = new FormData();
		corps.append('scenario', reglages.scenario);
		corps.append('domaine-cible', reglages.domaine);
		corps.append('nom-domaine', reglages.nomDuDomaine);
		corps.append('univers-cible', reglages.universDAccueil);
		if (reglages.simulation) corps.append('simulation', 'oui');
		if (reglages.strict) corps.append('strict', 'oui');
		for (const f of fichiers) corps.append('fichiers', f, cheminDuFichier(f));
		const reponse = await fetch(`?/${action}`, { method: 'POST', body: corps });

		/**
		 * « LAISSER TOURNER EN ARRIÈRE-PLAN » — le gel annonce « suivez-le depuis la
		 * console, onglet Imports, vue V-35 ». LE TRAITEMENT NE S'INTERROMPT PAS QUAND ON
		 * QUITTE L'ÉCRAN : la requête est DÉJÀ partie, l'action s'exécute côté serveur
		 * jusqu'au bout, et la navigation n'annule que la lecture de sa réponse.
		 *
		 * LE BOUTON EST RETIRÉ QUAND LA CONSOLE EST HORS DE PORTÉE — `P-09`. `[hidden]`
		 * du socle le sort de la boîte de rendu comme de l'arbre d'accessibilité ; le nœud
		 * du gel n'est ni supprimé, ni grisé, ni déplacé.
		 */
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
					(issue.valeur['dossiersExistants'] as readonly string[] | undefined) ?? [],
				domaineACreer: (issue.valeur['domaineACreer'] as string | undefined) ?? ''
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
	 * « LAISSER TOURNER EN ARRIÈRE-PLAN » — le gel annonce « suivez-le depuis la
	 * console, onglet Imports, vue V-35 ».
	 *
	 * LE TRAITEMENT NE S'INTERROMPT PAS QUAND ON QUITTE L'ÉCRAN : la requête est
	 * DÉJÀ partie, l'action s'exécute côté serveur jusqu'au bout, et la navigation
	 * n'annule que la lecture de sa réponse.
	 *
	 * LE BOUTON EST RETIRÉ QUAND LA CONSOLE EST HORS DE PORTÉE — `P-09`. `[hidden]`
	 * du socle le sort de la boîte de rendu comme de l'arbre d'accessibilité ; le
	 * nœud du gel n'est ni supprimé, ni grisé, ni déplacé.
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
	universOuCreerUnDomaine={data.universOuCreerUnDomaine}
	lotImport={data.lotImport}
	formatsImport={data.formatsImport}
	domaineParDefaut={data.domaineParDefaut}
	{lotRecu}
	{analyser}
	{importer}
/>
