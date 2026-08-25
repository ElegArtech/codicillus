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
	): Promise<Record<string, unknown> | null> {
		const corps = new FormData();
		corps.append('domaine-cible', reglages.domaine);
		if (reglages.simulation) corps.append('simulation', 'oui');
		for (const f of fichiers) corps.append('fichiers', f, cheminDuFichier(f));
		const reponse = await fetch(`?/${action}`, { method: 'POST', body: corps });
		const resultat = deserialize(await reponse.text());
		if (resultat.type !== 'success') return null;
		return (resultat.data ?? null) as Record<string, unknown> | null;
	}

	async function analyser(
		fichiers: readonly File[],
		reglages: Reglages
	): Promise<LotDImport | null> {
		const charge = await envoyer('analyser', fichiers, reglages);
		return (charge?.['lot'] as LotDImport | undefined) ?? null;
	}

	async function importer(
		fichiers: readonly File[],
		reglages: Reglages
	): Promise<RapportDeLot | null> {
		const charge = await envoyer('importer', fichiers, reglages);
		return (charge?.['rapport'] as RapportDeLot | undefined) ?? null;
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

<Vue
	vecteur={data.vecteur}
	notes={data.notes}
	lotImport={data.lotImport}
	formatsImport={data.formatsImport}
	domaineParDefaut={data.domaineParDefaut}
	{lotRecu}
	{analyser}
	{importer}
/>
