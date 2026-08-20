<script lang="ts">
	/**
	 * V-24 — Importer un lot de fichiers existants.
	 * Route `/importer` (`verif/scenarios/V-24.json`).
	 *
	 * SEPT ÉTATS, UNE SEULE FENÊTRE — 7 couples, deux contrôles de planche :
	 * l'étape du parcours (`et`, quatre positions) et l'issue de l'import
	 * (`issue`, trois positions).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LES TROIS ÉTATS D'ISSUE RENDENT L'ÉTAPE 1, ET C'EST MESURÉ
	 *
	 * `issue-erreurs` porte déjà `identiqueA: "et-1"` au scénario. Les deux
	 * autres — `issue-propre`, `issue-global` — ne le portent pas, et rendent
	 * pourtant le MÊME écran : leur vecteur est `{ et: "1", issue: … }`, or le
	 * gel ne relit `issue` que si `div.app` est à l'étape 4
	 * (`V-24:3396`). Relevé au navigateur, dans les conditions du banc : les
	 * quatre documents `et-1`, `issue-erreurs`, `issue-propre` et `issue-global`
	 * sont identiques à l'octet sur `<main>`.
	 *
	 * CONSÉQUENCE, ET ELLE EST STRUCTURANTE : **LE RAPPORT D'IMPORT N'EST DANS
	 * AUCUN DES SEPT ÉTATS.** `div#rapport` est vide et `hidden` partout ; les
	 * trois issues — terminé avec erreurs, terminé sans erreur, échec global —
	 * ne sont atteignables qu'en étape 4, que la planche ne combine pas. Le
	 * squelette ne les écrit donc PAS : ce serait poser des règles qu'aucun cas
	 * n'exerce (`CLAUDE.md` §6, P-5), et deviner leur rendu plutôt que le
	 * porter. Remonté au rapport de lot.
	 *
	 * `RG-M12-04` — « un fichier en erreur n'interrompt jamais le lot » — est
	 * donc rendu par ce que les états MONTRENT : la phrase de l'étape 4
	 * (« le traitement va jusqu'au bout et le rapport détaillera chaque cas »),
	 * le compteur « en échec » qui vit à côté des deux autres, et les motifs en
	 * clair des fichiers écartés à l'étape 3. **CE LOT NE DÉCLARE TENUE AUCUNE
	 * DES RÈGLES `RG-M12-01` À `RG-M12-11`** : ce sont des rendus, pas la preuve
	 * d'une exigence.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * L'ÉTAPE 4 EST UN INSTANT FIGÉ — ARB-011
	 *
	 * Le gel avance par `setInterval(…, 130)` (`V-24:3122`) : un fichier tous
	 * les 130 ms. Le banc, lui, ne patiente pas, il AVANCE une horloge virtuelle
	 * de 1 000 ms après avoir réglé la planche (`conditions.mjs` du banc,
	 * `AVANCE_ETAT_MS`), puis capture. Sept tics sont donc dus — 130, 260, …,
	 * 910 ms —, et l'écran mesuré est celui du septième : barre à 23 %, septième
	 * fichier du lot en cours, compteurs à 5 / 2 / 0.
	 *
	 * (Le chemin complet du module du banc n'est volontairement PAS cité :
	 * depuis T-070 cette vue est servie par une route réelle, donc BÂTIE, et
	 * `verif:demo:hors-production` cherche cette chaîne en texte brut dans le
	 * produit construit — commentaires compris. Écart É-2 du lot T-070.)
	 *
	 * AUCUNE MINUTERIE N'EST ÉCRITE ICI, et aucun de ces chiffres n'est saisi
	 * (P-02) : `TRAITES` est le seul nombre déclaré — le rang de l'instant
	 * capturé —, et tout le reste s'en déduit sur `LOT_IMPORT`. Le squelette
	 * rend l'ÉTAT, jamais la transition : « une capture est un instant, pas un
	 * film » (ARB-011).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1. `<main class="import-vue"
	 * id="contenu">` (ARB-015), lien d'évitement et libellé par défaut
	 * (ARB-019). Un attribut de données hors gabarit — `data-etape` (ARB-021,
	 * A-2) —, que la feuille de la vue lit pour l'avancement du fil de jalons.
	 *
	 * TOUT VIENT DU CORPUS — `LOT_IMPORT` (30 fichiers), `FORMATS_IMPORT` (9
	 * libellés) et `DOMAINES` de `seeds/corpus.ts`, exactement ce que le gel lit
	 * dans `window.LOT_IMPORT` et `window.FORMATS_IMPORT`. L'arborescence
	 * détectée, le récapitulatif chiffré, les fichiers écartés et leurs motifs
	 * sont tous DÉRIVÉS du lot par les fonctions du gel, transcrites ici :
	 * `arborescenceLot()` (`V-24:2532`) et `resumeLot()` (`V-24:2552`).
	 *
	 * `JOURNAL_IMPORTS` n'est PAS employé : le journal des imports est une
	 * section de console (ARB-003, V-35), et aucun des sept états de V-24 ne le
	 * montre. Le porter ici serait inventer un écran.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * AUCUN COMPORTEMENT — ARB-011. Le choix d'un scénario, le dépôt, le
	 * glisser-déposer, la navigation du parcours, le renoncement, la relance et
	 * les notifications sont du temps 3. `div.notifs` est rendu vide.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog.palette#palette`
	 * FERMÉ — `docs/releve-vues.md` §4.1 les mesure : aucune boîte de rendu,
	 * aucun pixel, aucune entrée dans l'instantané ARIA. Et `div.planche`, bloc
	 * hors produit (`docs/DESIGN.md` §2.G), que le banc retire lui-même.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-24.css`, posé par `node verif/feuilles-de-vue.mjs V-24
	 * --installer` (P-6.3). Les `style=` reproduits figurent tous à l'ensemble
	 * clos du gel de V-24 (ARB-016, P-6.4), y compris la largeur que le script
	 * de la maquette pose par `.style.width`.
	 */
	import {
		DOMAINES,
		FORMATS_IMPORT,
		INSTANCE,
		LOT_IMPORT,
		MOI,
		UNIVERS,
		type Domaine,
		type EtatDInstance,
		type FichierDuLot,
		type FormatDImport,
		type LotDImport,
		type Note,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';

	interface Proprietes {
		/** Le vecteur complet de l'état — deux contrôles de planche. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-24')`, variante complète. */
		notes: readonly Note[];
		/**
		 * LES QUATRE SOURCES DE LA COQUILLE, EN PROPRIÉTÉS OPTIONNELLES (T-045).
		 *
		 * Absentes, les constantes du jeu de semence s'appliquent : c'est ce que le
		 * mode démo passe, et c'est ce qui garantit que le banc ne bouge pas d'un
		 * pixel. Fournies — par un chargeur de route —, elles l'emportent, et la vue
		 * cesse de servir une valeur figée, indépendante de la base et de l'identité.
		 */
		/** Les univers déclarés. Absente, `UNIVERS` du jeu de semence. */
		univers?: readonly Univers[];
		/** Les domaines du périmètre du compte. Absente, `DOMAINES` du jeu de semence. */
		domaines?: readonly Domaine[];
		/** Le compte connecté. Absente, `MOI` du jeu de semence. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, `INSTANCE` du jeu de semence. */
		instance?: EtatDInstance;
		/** Le lot déposé. Absente, `LOT_IMPORT` du jeu de semence. */
		lotImport?: LotDImport;
		/**
		 * Les libellés des formats admis. Absente, `FORMATS_IMPORT` du jeu de
		 * semence. La table est PARTIELLE : un service de conversion qui n'en
		 * reconnaîtrait qu'une partie ne doit pas être empêché de le dire, et le
		 * rendu retombe déjà sur l'extension quand le libellé manque.
		 */
		formatsImport?: Partial<Record<FormatDImport, string>>;
	}

	const {
		vecteur,
		notes: corpus,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		lotImport = LOT_IMPORT,
		formatsImport = FORMATS_IMPORT
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});

	/** L'étape du parcours — `data-etape` de `div.app`, quatre positions. */
	const etape = $derived(
		reglage['et'] === '2' || reglage['et'] === '3' || reglage['et'] === '4'
			? Number(reglage['et'])
			: 1
	);

	/**
	 * LE SCÉNARIO CHOISI ET LE LOT DÉPOSÉ ne sont pas des réglages de planche :
	 * ils sont POSÉS par le déplacement d'étape, parce qu'on ne peut pas être à
	 * l'étape suivante sans avoir répondu à la précédente — `V-24:3387`. À
	 * l'étape 1, aucun scénario n'est retenu et aucune vignette n'est enfoncée.
	 */
	const scenarioChoisi = $derived<string | null>(etape >= 2 ? 'notes' : null);
	const depose = $derived(etape >= 3);

	/* ── Les trois scénarios ──────────────────────────────────────────────────
	   `SCENARIOS` (`V-24:2871`). Ils appartiennent à la maquette, pas au corpus,
	   et sont transcrits au caractère près. L'illustration est décomposée en
	   segments plutôt que gardée en chaîne de balisage : le gel l'injecte par
	   `innerHTML`, ce qui demanderait ici un `{@html}` que rien n'oblige à
	   employer. */

	interface SegmentIllustre {
		readonly gras: boolean;
		readonly texte: string;
	}
	interface Scenario {
		readonly id: string;
		readonly nom: string;
		readonly txt: string;
		readonly illus: readonly SegmentIllustre[];
	}

	const SCENARIOS: readonly Scenario[] = [
		{
			id: 'notes',
			nom: 'Importer des notes dans un domaine existant',
			txt: "Vos fichiers rejoignent un domaine déjà en place. L'arborescence des dossiers de votre disque devient l'arborescence des dossiers du domaine, à l'identique.",
			illus: [
				{
					gras: false,
					texte: 'Exploitation/\n  Sauvegardes/\n    Restauration.docx\n\n→ Infrastructure\n   └ '
				},
				{ gras: true, texte: 'Exploitation' },
				{ gras: false, texte: '\n      └ ' },
				{ gras: true, texte: 'Sauvegardes' },
				{ gras: false, texte: '\n         └ Restauration' }
			]
		},
		{
			id: 'domaine',
			nom: 'Importer un domaine complet',
			txt: "Le dossier de premier niveau devient un nouveau domaine, et tout ce qu'il contient s'y range. À choisir quand vous reprenez un périmètre entier d'un coup.",
			illus: [
				{ gras: false, texte: 'Exploitation/\n  Sauvegardes/\n    Restauration.docx\n\n→ ' },
				{ gras: true, texte: 'Exploitation' },
				{ gras: false, texte: ' (domaine)\n   └ ' },
				{ gras: true, texte: 'Sauvegardes' },
				{ gras: false, texte: '\n      └ Restauration' }
			]
		},
		{
			id: 'prepare',
			nom: 'Importer un corpus préparé',
			txt: 'Pour des fichiers déjà munis de leurs métadonnées — titre, étiquettes, relations. Les liens entre documents sont résolus automatiquement, et relancer le même import ne crée pas de doublons.',
			illus: [
				{
					gras: false,
					texte:
						'--- \n titre: Restauration\n etiquettes: [barman]\n voir: [pg-prod-01]\n---\n\n→ note + '
				},
				{ gras: true, texte: 'liens résolus' }
			]
		}
	];

	const scenarioCourant = $derived(SCENARIOS.find((s) => s.id === scenarioChoisi) ?? null);

	/* ── Étape 2 — le dépôt ───────────────────────────────────────────────────
	   `rendreDepot()` (`V-24:2918`). Trois réglages, un par scénario, et un seul
	   visible à la fois. La liste des formats admis et les options de domaine ne
	   sont peuplées QUE lorsque l'étape 2 a été traversée : aux étapes 1, 3 et 4
	   elles restent vides, et le gel le montre. */

	/** Les cinq familles annoncées comme admises — `V-24:2929`. */
	const FORMATS_ADMIS: readonly string[] = [
		'Traitement de texte',
		'Présentation',
		'PDF',
		'Texte brut',
		'Markdown'
	];

	const depotTraverse = $derived(etape === 2);
	const sousTitreDuDepot = $derived(
		depotTraverse && scenarioCourant
			? scenarioCourant.nom +
					'. Les formats acceptés sont indiqués ci-dessous ; tout le reste sera écarté et vous saurez pourquoi.'
			: '—'
	);

	/* ── Le lot, et ce qu'on en déduit ────────────────────────────────────────
	   `resumeLot()` (`V-24:2552`) et `arborescenceLot()` (`V-24:2532`). Aucun
	   chiffre n'est saisi : tout est compté sur `LOT_IMPORT` (P-02). */

	const LOT = $derived(lotImport);

	/** Le sort d'un fichier décide de sa colonne : note, écarté, en échec. */
	const resume = $derived.by(() => {
		let notes = 0;
		let ignores = 0;
		let echecs = 0;
		/* Une table ORDONNÉE, tenue en liste : le gel trie les formats par effectif
		   décroissant sur un tri stable, donc l'ordre de première rencontre
		   départage les ex æquo. */
		const formats: [FormatDImport, number][] = [];
		for (const f of LOT.fichiers) {
			if (f.s === 'ignore') ignores++;
			else if (f.s === 'echec') echecs++;
			else notes++;
			if (f.s === 'ignore') continue;
			const deja = formats.find((e) => e[0] === f.f);
			if (deja) deja[1]++;
			else formats.push([f.f, 1]);
		}
		return { total: LOT.fichiers.length, notes, ignores, echecs, formats };
	});

	interface NoeudDuLot {
		readonly nom: string;
		readonly enfants: NoeudDuLot[];
		readonly fichiers: { nom: string; format: FormatDImport }[];
	}

	/** Le nœud d'un niveau, créé à la première rencontre. */
	function noeud(niveau: NoeudDuLot[], nom: string): NoeudDuLot {
		const deja = niveau.find((n) => n.nom === nom);
		if (deja) return deja;
		const neuf: NoeudDuLot = { nom, enfants: [], fichiers: [] };
		niveau.push(neuf);
		return neuf;
	}

	/**
	 * L'arborescence détectée dans le lot, telle qu'elle deviendra celle des
	 * dossiers. Seuls les fichiers retenus comptent — un fichier écarté ne crée
	 * pas de dossier.
	 */
	const arborescence = $derived.by<NoeudDuLot[]>(() => {
		const racine: NoeudDuLot[] = [];
		for (const f of LOT.fichiers) {
			if (f.s === 'ignore') continue;
			const segments = f.c.split('/');
			const nom = segments.pop() as string;
			let niveau = racine;
			let dernier: NoeudDuLot | null = null;
			for (const s of segments) {
				dernier = noeud(niveau, s);
				niveau = dernier.enfants;
			}
			if (dernier) dernier.fichiers.push({ nom, format: f.f });
		}
		return racine;
	});

	/** Les dossiers de l'arborescence, tous niveaux confondus. */
	function compterDossiers(niveau: readonly NoeudDuLot[]): number {
		let total = 0;
		for (const n of niveau) total += 1 + compterDossiers(n.enfants);
		return total;
	}
	const nombreDeDossiers = $derived(compterDossiers(arborescence));

	/** Un niveau dans l'ordre alphabétique — `Object.keys(a).sort()` du gel. */
	function niveauTrie(niveau: readonly NoeudDuLot[]): NoeudDuLot[] {
		return [...niveau].sort((a, b) => (a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0));
	}

	/** Les formats du récapitulatif, du plus fourni au moins fourni. */
	const parFormat = $derived(
		[...resume.formats]
			.sort((a, b) => b[1] - a[1])
			.map(([f, n]) => [n, formatsImport[f] ?? f] as const)
	);

	/** La structure annoncée. Le scénario « notes » ne crée aucun domaine. */
	const creations = $derived([[nombreDeDossiers, 'dossiers créés'] as const]);

	const ecartes = $derived(LOT.fichiers.filter((f) => f.s === 'ignore'));

	/* ── Étape 4 — l'instant capturé ──────────────────────────────────────────
	   `lancerImport()` (`V-24:3100`). Voir l'en-tête : sept tics de 130 ms
	   tiennent dans l'avance de 1 000 ms du banc, et c'est le seul nombre
	   déclaré ici. */

	/** Rang de l'instant capturé, en fichiers traités. */
	const TRAITES = 7;

	const progression = $derived.by(() => {
		if (etape !== 4) {
			return { pourcent: 0, courant: 'Préparation…', notes: 0, ignores: 0, echecs: 0 };
		}
		let notes = 0;
		let ignores = 0;
		let echecs = 0;
		for (const f of LOT.fichiers.slice(0, TRAITES)) {
			if (f.s === 'note') notes++;
			else if (f.s === 'ignore') ignores++;
			else echecs++;
		}
		const dernier = LOT.fichiers[TRAITES - 1] as FichierDuLot;
		return {
			pourcent: Math.round((TRAITES / LOT.fichiers.length) * 100),
			courant: dernier.c,
			notes,
			ignores,
			echecs
		};
	});

	/* ── Le fil de jalons et le pied de parcours ──────────────────────────────
	   `aller()` (`V-24:3331`) et `majPied()` (`V-24:3349`). */

	const JALONS: readonly { readonly rang: number; readonly nom: string }[] = [
		{ rang: 1, nom: 'Scénario' },
		{ rang: 2, nom: 'Dépôt' },
		{ rang: 3, nom: 'Aperçu' },
		{ rang: 4, nom: 'Import' }
	];

	function etatDuJalon(rang: number): 'faite' | 'courante' | 'avenir' {
		return rang < etape ? 'faite' : rang === etape ? 'courante' : 'avenir';
	}

	/** Le retour en arrière reste possible jusqu'à la validation, pas au-delà. */
	const precedentMasque = $derived(etape === 1 || etape === 4);
	const renoncerMasque = $derived(etape !== 3);
	/* L'import lancé, « Continuer » disparaît jusqu'à ce que le rapport soit là ;
	   aucun état ne l'y voit revenir. */
	const suivantMasque = $derived(etape === 4);
	/**
	 * `majPied()` ne retouche l'inhibition qu'aux étapes 1 à 3 : à l'étape 4
	 * elle reste celle du dernier passage, et le gel arrive toujours à l'étape 4
	 * par l'étape 1, où aucun scénario n'était encore retenu. Mesuré sur le gel.
	 */
	const suivantInhibe = $derived(
		etape === 1 ? scenarioChoisi === null : etape === 2 ? !depose : etape === 3 ? false : true
	);
	const libelleDuSuivant = $derived(
		etape === 2 ? 'Analyser le lot' : etape === 3 ? "Lancer l'import" : 'Continuer'
	);
</script>

<!--
	Les régions serrées reproduisent un DOM que le gel construit en script :
	elles sont soustraites au formateur, qui y réintroduirait des blancs entre
	nœuds — lus par le relevé d'ordre de tabulation du niveau 1
	(`CLAUDE.md` §6, P-6).
-->
<!-- prettier-ignore -->
{#snippet vignetteDeScenario(s: Scenario)}<button
		class="scen" type="button" aria-pressed={scenarioChoisi === s.id}
		><span class="scen__marque" aria-hidden="true"></span
		><span
			><h2 class="scen__nom">{s.nom}</h2
			><p class="scen__txt">{s.txt}</p></span
		><span class="scen__illus"
			>{#each s.illus as seg, k (k)}{#if seg.gras}<b>{seg.texte}</b>{:else}{seg.texte}{/if}{/each}</span
		></button
	>{/snippet}

<!-- prettier-ignore -->
{#snippet dossierDuLot(d: NoeudDuLot)}<li
		><div class="al al--dossier"
			><span class="al__ic"
				><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
					><path d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"/></svg
				></span
			><span class="al__nom">{d.nom}</span
			><span class="al__neuf">dossier créé</span></div
		>{#each d.fichiers as f, k (k)}<div class="al al--fichier"
			><span class="al__ic"
				><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"
					><path d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5zM9 1.5v4h4"/></svg
				></span
			><span class="al__nom">{f.nom}</span
			><span class="al__fmt">{f.format}</span></div
		>{/each}{#if d.enfants.length}<ul
			>{#each niveauTrie(d.enfants) as e (e.nom)}{@render dossierDuLot(e)}{/each}</ul
		>{/if}</li
	>{/snippet}

<!-- prettier-ignore -->
{#snippet fichierEcarte(f: FichierDuLot)}<div class="ign"
		><span class="ign__marque">{f.f}</span
		><span class="ign__nom">{f.c}</span
		><span class="ign__motif">{f.m}</span></div
	>{/snippet}

<Coquille
	forme="abregee"
	classeContenu="import-vue"
	idContenu="contenu"
	fil={['Accueil', 'Importer']}
	donnees={{ 'data-etape': String(etape) }}
	{univers}
	{domaines}
	notes={corpus}
	compte={{
		nom: compte.nom,
		initiales: compte.initiales,
		role: compte.role,
		domaine: compte.domaine
	}}
	version={instance.version}
>
	{#snippet enfants()}
		<!-- prettier-ignore -->
		<ol class="jalons" id="jalons" aria-label="Étapes de l'import"
			>{#each JALONS as j (j.rang)}<li
				class="jalon" data-jalon={j.rang} data-etat={etatDuJalon(j.rang)}
				><span class="jalon__barre"></span
				><span class="jalon__nom">{j.nom}</span></li
			>{/each}</ol
		>

		<!-- ============ ÉTAPE 1 — Scénario ============ -->
		<section class="etape" data-etape="1" data-active={etape === 1 ? 'oui' : 'non'}>
			<h1 class="etape__titre">Que voulez-vous reprendre&nbsp;?</h1>
			<p class="etape__sous">
				Trois manières de faire entrer l'existant. Choisissez celle qui décrit votre situation — la
				structure de vos fichiers sera reprise telle quelle.
			</p>
			<!-- prettier-ignore -->
			<div class="scenarios" id="scenarios" role="group" aria-label="Scénario d'import"
				>{#each SCENARIOS as s (s.id)}{@render vignetteDeScenario(s)}{/each}</div
			>
		</section>

		<!-- ============ ÉTAPE 2 — Dépôt ============ -->
		<section class="etape" data-etape="2" data-active={etape === 2 ? 'oui' : 'non'}>
			<h1 class="etape__titre">Déposez vos fichiers</h1>
			<p class="etape__sous" id="depot-sous">{sousTitreDuDepot}</p>

			<div class="depot" id="depot">
				<div class="depot__ic">
					<svg
						width="42"
						height="42"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.3"
						><path d="M12 16V4M8 7.5L12 3.5l4 4" /><path
							d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"
						/></svg
					>
				</div>
				<h3>Glissez un dossier ou une archive ici</h3>
				<p>
					L'arborescence est conservée. Vous pouvez aussi parcourir vos fichiers si vous préférez.
				</p>
				<button class="btn btn--principal" id="parcourir">Parcourir mes fichiers</button>
				<!-- prettier-ignore -->
				<div class="formats-admis" id="formats-admis"
					>{#if depotTraverse}{#each FORMATS_ADMIS as f (f)}<span>{f}</span>{/each}{/if}</div
				>
			</div>

			<div class="reglages-depot">
				<div class="champ" id="champ-domaine" hidden={scenarioChoisi !== 'notes'}>
					<label class="champ__label" for="domaine-cible"
						>Domaine de destination <span class="oblig">*</span></label
					>
					<!-- prettier-ignore -->
					<select class="selecteur" id="domaine-cible"
						>{#if depotTraverse}{#each domaines as d (d.nom)}<option
							value={d.nom} selected={d.nom === compte.domaine}>{d.univers + ' › ' + d.nom}</option
						>{/each}{/if}</select
					>
				</div>
				<div class="champ" id="champ-nom-domaine" hidden={scenarioChoisi !== 'domaine'}>
					<label class="champ__label" for="nom-domaine"
						>Nom du domaine à créer <span class="oblig">*</span></label
					>
					<input
						class="saisie"
						type="text"
						id="nom-domaine"
						style="max-width:380px"
						placeholder="Exploitation"
					/>
					<span class="champ__aide"
						>Le dossier de premier niveau du lot en fournira le nom si vous le laissez vide.</span
					>
				</div>
				<label class="case" id="champ-simulation" hidden={scenarioChoisi !== 'prepare'}>
					<input type="checkbox" id="simulation" />
					<span class="case__txt"
						>Simulation
						<span class="case__aide"
							>Tout est validé et le rapport est produit, mais rien n'est écrit. Utile pour vérifier
							un corpus préparé avant de l'engager.</span
						>
					</span>
				</label>
				<div class="lot-depose" id="lot-depose" hidden></div>
			</div>
		</section>

		<!-- ============ ÉTAPE 3 — Aperçu ============ -->
		<section class="etape" data-etape="3" data-active={etape === 3 ? 'oui' : 'non'}>
			<h1 class="etape__titre">Ce qui va être créé</h1>
			<p class="etape__sous">
				Rien n'a encore été écrit. Vérifiez l'arborescence détectée et les fichiers écartés, puis
				validez ou renoncez.
			</p>

			<div class="apercu-grille">
				<div>
					<span class="etiq" style="display:block;margin-bottom:var(--e-2)"
						>Arborescence détectée</span
					>
					<!-- prettier-ignore -->
					<div class="arbre-lot" id="arbre-lot"
						>{#if etape === 3}<ul
							>{#each niveauTrie(arborescence) as e (e.nom)}{@render dossierDuLot(e)}{/each}</ul
						>{/if}</div
					>

					<div class="ignores">
						<span class="etiq" style="display:block;margin-bottom:var(--e-2)">Fichiers écartés</span
						>
						<!-- prettier-ignore -->
						<div id="liste-ignores"
							>{#if etape === 3}{#each ecartes as f (f.c)}{@render fichierEcarte(f)}{/each}{/if}</div
						>
					</div>
				</div>

				<!-- prettier-ignore -->
				<aside class="recap" id="recap"
					>{#if etape === 3}<div class="recap__bloc"
						><div class="recap__val">{resume.notes}</div
						><span class="recap__nom">notes seront créées</span></div
					><div class="recap__bloc"
						><span class="etiq">Par format</span
						><div class="recap__liste"
							>{#each parFormat as [n, nom] (nom)}<div class="recap__ligne"
								><b>{n}</b><span>{nom}</span></div
							>{/each}</div
						></div
					><div class="recap__bloc"
						><span class="etiq">Structure</span
						><div class="recap__liste"
							>{#each creations as [n, nom] (nom)}<div class="recap__ligne"
								><b>{n}</b><span>{nom}</span></div
							>{/each}</div
						></div
					><div class="recap__bloc"
						><div class="recap__val">{resume.ignores}</div
						><span class="recap__nom">fichiers écartés</span></div
					>{/if}</aside
				>
			</div>
		</section>

		<!-- ============ ÉTAPE 4 — Import et rapport ============ -->
		<section class="etape" data-etape="4" data-active={etape === 4 ? 'oui' : 'non'}>
			<h1 class="etape__titre" id="titre-4">Import en cours</h1>
			<p class="etape__sous" id="sous-4">
				Un fichier en erreur n'interrompt pas le lot : le traitement va jusqu'au bout et le rapport
				détaillera chaque cas.
			</p>

			<div class="progression-bloc" id="bloc-progression">
				<!-- prettier-ignore -->
				<div class="barre-progres"
					>{#if etape === 4}<i id="barre" style="width:{progression.pourcent}%"></i
					>{:else}<i id="barre"></i>{/if}</div
				>
				<div class="fichier-courant" id="fichier-courant">{progression.courant}</div>
				<div class="compteurs-vifs">
					<div class="cv cv--succes">
						<div class="cv__val" id="c-notes">{progression.notes}</div>
						<span class="cv__nom">notes créées</span>
					</div>
					<div class="cv cv--ignore">
						<div class="cv__val" id="c-ignores">{progression.ignores}</div>
						<span class="cv__nom">ignorées</span>
					</div>
					<div class="cv cv--echec">
						<div class="cv__val" id="c-echecs">{progression.echecs}</div>
						<span class="cv__nom">en échec</span>
					</div>
				</div>
				<div style="margin-top:var(--e-4);display:flex;gap:var(--e-2);flex-wrap:wrap">
					<button class="btn" id="arriere-plan">Laisser tourner en arrière-plan</button>
				</div>
			</div>

			<div id="rapport" hidden></div>
		</section>

		<!-- ---------- Pied de parcours ---------- -->
		<div class="pied-parcours" id="pied">
			<button class="btn" id="precedent" hidden={precedentMasque}>Retour</button>
			<div class="pied-parcours__droite">
				<button class="btn" id="renoncer" hidden={renoncerMasque}>Renoncer</button>
				<button
					class="btn btn--principal"
					id="suivant"
					disabled={suivantInhibe}
					hidden={suivantMasque}><span id="suivant-txt">{libelleDuSuivant}</span></button
				>
			</div>
		</div>
	{/snippet}
</Coquille>
