<script lang="ts">
	/**
	 * V-35 — Console · Imports. Routes `/console/imports` et
	 * `/console/imports/{lot}` (`docs/routes.md`).
	 *
	 * `#dlg-rapport` s'obtient PAR L'ADRESSE, et le dialogue porte `open` — `open`
	 * n'est pas `showModal()`, et la couche supérieure ne s'atteint pas
	 * déclarativement.
	 *
	 * LE TABLEAU DE GESTION EST LA SEULE PART DU MOTIF COMMUN dont V-35 hérite :
	 * `tableau-gestion`, `tg`, `tg--entetes`, `tg--ligne`, `tg--masquable`,
	 * `tg__actions`, `tg__n`. Le MODIFICATEUR de grille est propre à la vue —
	 * `tg--imports`. Ni panneau `tiroir-form`, ni `data-form`, ni refus de
	 * suppression : V-35 n'en a aucun.
	 *
	 * LES DONNÉES VIENNENT DU CHARGEUR, JAMAIS DU JEU. Le journal retombait sur
	 * `JOURNAL_IMPORTS` de `seeds/corpus.ts` — quatre entrées datées, avec leurs
	 * auteurs et leurs décomptes — servies comme des imports passés de l'instance.
	 * Les fichiers en échec nommés au rapport sont ceux de `lotImport`, dont le
	 * défaut est `null`. La mécanique du gel reste la même (`V-35:3127`).
	 *
	 * LES SCÉNARIOS SONT UN LITTÉRAL DU GEL (`V-35:2966`) : nom et sous-titre
	 * d'accès direct, que la donnée ne porte pas. Le gel en porte trois ; SEUL CELUI
	 * QUE L'IMPORT EXÉCUTE EST OFFERT, et le filtre lit
	 * `$lib/donnees/scenarios-d-import.ts`.
	 *
	 * Coquille de forme abrégée, enveloppe `div.console`. `div.app` ne porte au gel
	 * que `data-rail` et `data-role` (`V-35:1145`). `dialog#dlg-rapport` vit HORS de
	 * `div.app`, entre elle et `div.notifs` — la propriété `superposition` du
	 * gabarit, et l'emplacement exact du gel.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-35.css`.
	 */
	import type { EntreeDeJournalDImport, LotDImport, Note } from '../../seeds/corpus';
	import CoquilleDeConsole from '$lib/console/CoquilleDeConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { SCENARIO_LIVRE, scenarioEstLivre } from '$lib/donnees/scenarios-d-import';
	import { accord } from '$lib/vocabulaire';

	interface Proprietes {
		etat?: string;
		notes: readonly Note[];
		/**
		 * CE QUE LA VUE FAIT QUAND UN SCÉNARIO EST CHOISI. Le gel l'annonce lui-même :
		 * le clic mène au « Parcours d'import, scénario "X" — vue V-24 »
		 * (`mockups/V-35-console-imports.html:2984`). La page sait où cela mène.
		 */
		onScenario?: (scenario: string) => void;
		/**
		 * « OUVRIR LE DOMAINE » DU RAPPORT DE LOT — le pied de `#dlg-rapport`. La
		 * vue rend le NOM du domaine où le lot a atterri ; la page sait à quelle
		 * adresse il correspond, comme partout ailleurs en console.
		 */
		onOuvrirLeDomaine?: (domaine: string) => void;
		/**
		 * LE DERNIER LOT DÉPOSÉ, OU AUCUN — ÉTAT VIDE EXPLICITE. La propriété
		 * retombait sur `LOT_IMPORT` du jeu de démonstration : ses fichiers en échec,
		 * avec leurs noms et leurs causes, étaient nommés au rapport d'un lot qui
		 * n'avait jamais eu lieu. Aucune table ne porte de lot.
		 */
		lotImport?: LotDImport | null;
		/**
		 * LE JOURNAL DES IMPORTS, EXIGÉ. Il retombait sur `JOURNAL_IMPORTS` du jeu de
		 * démonstration — quatre lots datés, leurs auteurs, leurs décomptes — sur
		 * l'écran de traçabilité même. `/console/imports` le passe, vide faute de table.
		 */
		journalImports: readonly EntreeDeJournalDImport[];
		/**
		 * LE JOURNAL EST-IL ENREGISTRÉ QUELQUE PART ? Le gel affirme que « les rapports
		 * restent consultables indéfiniment » ; aucune table du schéma ne garde
		 * d'import, l'entrée est composée à chaque lot puis écrite au journal
		 * d'application, et personne ne la relit. Servie vide sous cette phrase, la
		 * table laissait croire qu'aucun import n'avait eu lieu — là où la vérité est
		 * que rien n'est conservé.
		 *
		 * Le drapeau est DÉRIVÉ du recensement des mesures sans contrepartie —
		 * `journalDImportsEnregistre()` de `$lib/donnees/consoles.ts` —, jamais décidé
		 * ici : c'est le geste qu'`etatDesDonnees()` fait pour V-34.
		 */
		journalEnregistre?: boolean;
	}

	/*
	 * LE RAIL, LA BARRE ET LA VERSION NE PASSENT PLUS PAR ICI. Cette vue portait
	 * `univers`, `domaines`, `compte` et `instance` sans jamais les lire : elle ne
	 * faisait que les remettre à `CoquilleDeConsole`, qui retombait sur le jeu de
	 * démonstration.
	 */
	const {
		etat,
		notes,
		lotImport = null,
		journalImports,
		journalEnregistre = true,
		onScenario,
		onOuvrirLeDomaine
	}: Proprietes = $props();

	/**
	 * LES SCÉNARIOS D'ACCÈS DIRECT — littéral du gel (`V-35:2966`) : la donnée ne
	 * porte pas ces libellés. LE GEL EN OFFRE TROIS ; L'IMPORT N'EN EXÉCUTE QU'UN,
	 * et les deux autres menaient au parcours sans que rien ne transmette le choix —
	 * le lot se rangeait alors dans le domaine proposé par défaut. Ce qui reste est
	 * ce que `scenarioEstLivre()` reconnaît, même source que l'étape 1 de V-24.
	 */
	const SCENARIOS = [
		{
			id: SCENARIO_LIVRE,
			nom: 'Dans un domaine existant',
			sous: "L'arborescence des fichiers devient celle des dossiers."
		},
		{
			id: 'domaine',
			nom: 'Un domaine complet',
			sous: 'Le dossier de premier niveau devient un nouveau domaine.'
		},
		{
			id: 'prepare',
			nom: 'Un corpus préparé',
			sous: 'Fichiers déjà munis de leurs métadonnées, liens résolus.'
		}
	] as const;

	const SCENARIOS_OFFERTS = SCENARIOS.filter((s) => scenarioEstLivre(s.id));

	/**
	 * LE LOT DEMANDÉ DEPUIS LE JOURNAL — `ouvrirRapport(i)` du gel (`V-35:3067`).
	 * `null` au rendu serveur : l'écran reste celui que la clé d'état décrit.
	 */
	let lotDemande = $state<string | null>(null);

	const rapportOuvert = $derived(lotDemande !== null || etat === 'rapport-de-lot');
	const lot = $derived(
		lotDemande !== null
			? journalImports.find((i) => i.id === lotDemande)
			: etat === 'rapport-de-lot'
				? journalImports[0]
				: undefined
	);

	/** `ouvrirRapport()` (`V-35:3067`) — les fichiers nommés au rapport. */
	const echoues = $derived(
		lot && lotImport ? lotImport.fichiers.filter((f) => f.s === 'echec').slice(0, lot.echecs) : []
	);

	/** Les quatre chiffres du bilan, dans l'ordre du gel (`V-35:3101`). */
	const faits = $derived(
		lot
			? ([
					[lot.fichiers, 'fichiers reçus'],
					[lot.notes, 'notes créées'],
					[lot.ignores, "écartés à l'aperçu"],
					[lot.echecs, 'en échec']
				] as const)
			: []
	);

	/**
	 * `showModal()` — voir `V-31` et `V-28` : l'attribut `open` seul n'obtient pas
	 * la modalité, et un rapport rendu en flux au haut de la page n'est pas ce que
	 * le gel dessine. L'effet ne court qu'au navigateur.
	 */
	$effect(() => {
		const boite = document.getElementById('dlg-rapport');
		if (!(boite instanceof HTMLDialogElement)) return;
		if (lotDemande === null) {
			if (boite.open && !rapportOuvert) boite.close();
			return;
		}
		if (boite.matches(':modal')) return;
		if (boite.open) boite.close();
		boite.showModal();
	});

	/** La couleur d'un chiffre de bilan (`V-35:3108`) : l'absence se décolore,
	    l'échec s'alarme. Les deux valeurs sont à l'ensemble clos. */
	const couleurDeFait = (valeur: number, nom: string): string | undefined =>
		!valeur ? 'color:var(--c-encre-4)' : nom === 'en échec' ? 'color:var(--c-danger)' : undefined;
</script>

<!--
	Le rapport d'un lot passé, rendu HORS de `div.app` — la place du gel, entre
	`div.app` et `div.notifs`. `open` seul : la modalité n'est jamais établie par un
	script de la vue.
-->
<!-- prettier-ignore -->
{#snippet rapportDeLot()}<dialog class="dlg dlg--large" id="dlg-rapport" aria-labelledby="dlg-rap-titre" open={rapportOuvert}
		><div class="dlg__boite"
			><div class="dlg__tete"
				><span class="dlg__marque" aria-hidden="true"
					><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5zM9 1.5v4h4M5.5 9h5M5.5 11.5h3"/></svg
				></span
				><div style="flex:1;min-width:0"
					><h2 class="dlg__titre" id="dlg-rap-titre">Rapport d'import</h2
					><div style="font-size:var(--t-mini);color:var(--c-encre-3);margin-top:2px" id="rap-sous">{lot ? `${lot.date} à ${lot.heure} · ${lot.auteur} · ${lot.source}` : '—'}</div
				></div
				><button class="dlg__fermer" data-fermer aria-label="Fermer" onclick={() => (lotDemande = null)}
					><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8"/></svg
				></button
			></div
			><div class="dlg__corps rapport-lot" id="rap-corps"
				>{#if lot}<div class="rl-entete" data-erreurs={lot.echecs ? 'oui' : 'non'}
					><div style="flex:none">{#if lot.echecs}<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--c-alerte)" stroke-width="1.6"><circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v5.5M12 16.3v.3"/></svg>{:else}<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--c-frais)" stroke-width="1.8"><circle cx="12" cy="12" r="9.5"/><path d="M7.8 12.4l3 3 5.4-6"/></svg>{/if}</div
					><div style="flex:1"
						><h3>{`${lot.notes} ${accord(lot.notes, 'note créée', 'notes créées')}, ${lot.echecs ? `${lot.echecs} ${accord(lot.echecs, 'fichier en échec', 'fichiers en échec')}` : 'aucun échec'}`}</h3
						><p>{lot.echecs ? `Le lot est allé jusqu'au bout : ${lot.notes} ${accord(lot.notes, 'fichier')} sur ${lot.fichiers} ${accord(lot.notes, 'est devenu une note', 'sont devenus des notes')} du domaine ${lot.domaine}. ${accord(lot.echecs, "Le fichier en échec n'a bloqué", "Les fichiers en échec n'ont bloqué")} aucun des autres.` : accord(lot.fichiers, 'Le fichier du lot a été traité', `Les ${lot.fichiers} fichiers du lot ont été traités`) + ` sans incident dans le domaine ${lot.domaine}.`}</p
					></div
				></div
				><div class="rl-faits"
					>{#each faits as [valeur, nom] (nom)}<div class="rl-fait"><div class="rl-fait__v" style={couleurDeFait(valeur, nom)}>{valeur}</div><span class="rl-fait__n">{nom}</span></div>{/each}</div
				>{#if lot.echecs}<div
					><span class="etiq" style="display:block;margin-bottom:var(--e-2)">Fichiers en échec</span
					><div style="border:1px solid #e2b8b0;border-radius:var(--r-3);padding:var(--e-2) var(--e-4) var(--e-3)"
						>{#each echoues as f (f.c)}<div style="padding:var(--e-2) 0;border-top:1px solid var(--c-trait-fin)"><div style="font-family:var(--f-donnee);font-size:var(--t-mini);word-break:break-all">{f.c}</div><div style="font-size:var(--t-mini);color:var(--c-encre-2);line-height:1.5;margin-top:2px">{f.m}</div></div>{/each}</div
				></div
				>{/if}<div class="rl-conserve">Rejouer le même import ne crée pas de doublons : un fichier qui retrouve son nom et sa place met à jour la note qui s'y trouve, au lieu d'en écrire une seconde. Un fichier renommé ou déplacé entre deux imports, lui, donne une note de plus.</div
				>{/if}</div
			><div class="dlg__pied"
				><button class="btn" data-fermer onclick={() => (lotDemande = null)}>Fermer</button
				><button class="btn btn--principal" id="rap-domaine" onclick={() => { if (lot) onOuvrirLeDomaine?.(lot.domaine); }}>Ouvrir le domaine</button
			></div
		></div
	></dialog>{/snippet}

<CoquilleDeConsole section="imports" {notes} superposition={rapportDeLot}>
	{#snippet enfants()}
		<!-- « CHAQUE LOT CONSERVE SON RAPPORT » N'EST VRAI QUE SI QUELQUE CHOSE LE
			CONSERVE. Rien ne le conserve aujourd'hui : la phrase du gel n'est servie
			que lorsque le journal est enregistré. -->
		<TeteDeSection
			titre="Imports"
			description={journalEnregistre
				? "Faire entrer l'existant, et garder trace de ce qui est entré. Chaque lot conserve son rapport : c'est ce qui permet, six mois plus tard, de comprendre d'où vient une note."
				: "Faire entrer l'existant. Le rapport d'un lot est rendu à la fin du parcours d'import, et rien ne le conserve ensuite : cette instance ne garde aucune trace des lots passés."}
		/>

		<!-- ---------- Lancer un import ---------- -->
		<!-- prettier-ignore -->
		<section class="lancement"
			><div class="depot" id="depot"
				><div class="depot__ic"
					><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 16V4M8 7.5L12 3.5l4 4"/><path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/></svg
				></div
				><h2>Déposez un dossier</h2
				><p>Traitement de texte, présentations, PDF, texte brut, Markdown. L'arborescence est conservée telle quelle. Une archive déposée est écartée, avec son motif.</p
				><button class="btn btn--principal" id="parcourir">Parcourir mes fichiers</button
			></div
			><span class="etiq" style="display:block;margin-bottom:var(--e-2)">Ou choisissez directement votre scénario</span
			><div class="scenarios-court" id="scenarios"
				>{#each SCENARIOS_OFFERTS as s (s.nom)}<button class="sc" type="button" onclick={() => onScenario?.(s.nom)}><span class="sc__nom">{s.nom}</span><span class="sc__sous">{s.sous}</span></button>{/each}</div
		></section>

		<!-- ---------- Journal ---------- -->
		<!-- prettier-ignore -->
		<div class="tete-section" style="border-bottom:0;padding-bottom:var(--e-2);margin-bottom:var(--e-2)"
			><div class="tete-section__corps"
				><h2 style="font-family:var(--f-ui);font-size:var(--t-t2);font-weight:var(--g-lourd);letter-spacing:-.018em;margin:0 0 var(--e-1)">Journal des imports</h2
				><p style="font-size:var(--t-petit)">{journalEnregistre ? 'Les rapports restent consultables indéfiniment, y compris ceux des lots partiellement en échec.' : 'Le journal n’est pas encore enregistré : aucun lot passé n’est conservé sur cette instance.'}</p
			></div
		></div>

		<!--
			L'ÉTAT VIDE EXPLICITE, PLUTÔT QU'UN TABLEAU VIDE SOUS UNE PROMESSE
			D'ÉTERNITÉ. Le tableau était vide PAR REFUS DE MENTIR — servir le journal du
			jeu de semence aurait été quatre lots datés qui n'ont jamais eu lieu —, mais
			il ne disait pas POURQUOI : un lecteur y voyait « aucun import n'a eu lieu »
			là où la vérité est « rien n'est conservé ». `RG-M12-09` n'est pas tenue pour
			autant : l'écran cesse de la contredire, il ne la remplit pas.
		-->
		<!--
			LES RÈGLES DE STYLE SONT PORTÉES EN ATTRIBUT, et c'est le seul endroit du
			fichier où elles ne sont pas reprises du gel : le nœud lui-même est un ajout,
			et `src/vues/V-35.css` est identique à l'octet à sa source gelée.
		-->
		{#if !journalEnregistre}
			<div
				id="journal-non-enregistre"
				style="background:var(--c-papier);border:1px dashed var(--c-trait-fort);border-radius:var(--r-3);padding:var(--e-6) var(--e-5);text-align:center"
			>
				<h3
					style="font-family:var(--f-ui);font-size:var(--t-t2);font-weight:var(--g-lourd);letter-spacing:-.018em;margin:0 0 var(--e-2)"
				>
					Aucun lot n'est conservé
				</h3>
				<p
					style="font-family:var(--f-lecture);font-size:var(--t-base);line-height:1.6;color:var(--c-encre-2);margin:0 auto;max-width:52ch"
				>
					Chaque import rend son rapport à la fin du parcours — notes écrites, fichiers écartés,
					fichiers en échec avec leur cause. Ce rapport n'est enregistré nulle part : cette instance
					ne porte pas de table d'imports, et un lot terminé ne peut plus être rouvert ici. Relevez
					ce qui compte avant de quitter l'écran d'import.
				</p>
			</div>
		{:else}
			<!-- prettier-ignore -->
			<div class="tableau-gestion"
			><div class="tg tg--imports tg--entetes" role="row"
				><span>Date</span
				><span>Source et scénario</span
				><span class="tg--masquable">Auteur</span
				><span class="tg__n">Notes</span
				><span class="tg__n tg--masquable">Ignorés</span
				><span class="tg__n">Échecs</span
				><span></span
			></div
			><div id="journal"
				>{#each journalImports as i (i.id)}<div class="tg tg--imports tg--ligne"
					><div><div class="tg__date">{i.date}</div><div class="tg__heure">{i.heure}</div></div
					><div style="min-width:0"><div class="tg__nom" style="font-size:var(--t-petit)">{i.source}</div><div class="tg__desc">{`${i.scenario} · ${i.domaine} · ${i.duree}`}</div></div
					><span class="tg__n tg--masquable">{i.auteur}</span
					><span class="tg__n">{i.notes}</span
					><span class="tg__n tg--masquable{i.ignores ? '' : ' n-nul'}">{i.ignores}</span
					><span class="tg__n {i.echecs ? 'n-echec' : 'n-nul'}">{i.echecs}</span
					><div class="tg__actions"><button class="btn" type="button" onclick={() => (lotDemande = i.id)}>Rapport</button></div
				></div>{/each}</div
		></div>
		{/if}
	{/snippet}
</CoquilleDeConsole>
