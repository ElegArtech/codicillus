<script lang="ts">
	/**
	 * V-41 — Bibliothèque de composants. La planche de référence du système
	 * visuel, et la seule vue qui montre l'inventaire fermé de `docs/DESIGN.md`
	 * §2 sur une page réelle (`docs/releve-vues.md` §11, M-4).
	 *
	 * ONZE ÉTATS, TOUS DE ZONE — `verif/scenarios/V-41.json` : `section.famille`,
	 * rangs 0 à 10. Le protocole est « page-entiere-zone-isolee »
	 * (`verif/references/protocole-app.json`) : la page est servie ENTIÈRE aux
	 * onze adresses, et le banc y découpe la famille du rang demandé, comme il la
	 * découpe dans la maquette. La clé d'état ne pilote donc rien ici — les onze
	 * familles sont montrées côte à côte, c'est la forme même de la vue.
	 *
	 * L'ENVELOPPE VIENT DU GABARIT — ARB-023, lot P-0b. `div.biblio` est une
	 * grille `208px minmax(0,1fr)` (`V-41:1460`) dont la première cellule est le
	 * sommaire et la seconde `<main class="corps-b" id="corps">`. Sans elle,
	 * `main` passe de 456 / 984 à 248 / 1060 (boîte de bordure, 1440 × 900) et
	 * les onze couples divergent avant toute comparaison de pixels
	 * (`docs/ecarts/ECART-024.md`). `cibleEvitement` n'est PAS passée : `#corps`
	 * est l'identifiant du `<main>` de cette vue, seul le libellé lui est propre.
	 *
	 * LA FRAÎCHEUR VIENT DE L'IMPLÉMENTATION UNIQUE — `$lib/fraicheur.ts`, la
	 * transcription du gel extraite par P-0b. P-01 et ADR-005 n'admettent qu'un
	 * calcul : aucune comparaison de seuil, aucun libellé, aucun décompte de
	 * barres n'est écrit ici. Le témoin est rendu par `temoinFraicheur(note)`, la
	 * jauge compte `BARRES_DE_JAUGE` barres, et la teinte vient de la classe que
	 * la fabrique donne. C'est la règle que le gel énonce lui-même à l'endroit de
	 * sa fabrique : « il n'existe qu'une seule fabrique, pour qu'il ne puisse pas
	 * diverger d'un écran à l'autre » (`V-41:2196`).
	 *
	 * TOUTES LES DONNÉES VIENNENT DE `seeds/corpus.ts` : les trois notes
	 * d'exemple sont les PREMIÈRES de chaque niveau dans l'ordre du corpus, la
	 * barre de répartition compte les dix-huit notes du domaine Infrastructure,
	 * l'arborescence du sélecteur se déduit du rangement de ces mêmes notes, le
	 * tableau trie le corpus par consultations, la chronologie lit `ACTIVITE` et
	 * la pile d'avatars compte les auteurs. Rien n'est saisi à la main —
	 * exception faite des trois indicateurs chiffrés, littéraux dans la maquette
	 * gelée, et déclarés au rapport du lot.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * (P-6.1) et de `src/vues/V-41.css` (P-6.3), posée par
	 * `node verif/feuilles-de-vue.mjs V-41 --installer`. Les quatre-vingt-neuf
	 * valeurs de `style` reproduites ci-dessous appartiennent à l'ensemble clos du
	 * gel de cette vue (ARB-016, `pnpm vues:styles V-41`) : P-1.7 les refuserait,
	 * la conformité de pixel les impose, et l'ensemble clos les prouve.
	 *
	 * DEUX ÉCARTS SONT DÉCLARÉS AU RAPPORT DU LOT, ET AUCUN N'EST RÉPARABLE ICI.
	 *
	 *  É-1  `pnpm verif:jetons` rend DEUX constats P-1.7 sur l'unique
	 *       `style="outline:2px solid var(--c-accent);outline-offset:2px"` du
	 *       spécimen « focus » des boutons. La valeur EST au gel, mot pour mot
	 *       (`V-41:4130`), mais la maquette l'y pose par
	 *       `b.setAttribute(k, attrs[k])` — nom d'attribut VARIABLE (`V-41:4107`).
	 *       L'ensemble clos d'ARB-016 lit quatre formes, dont
	 *       `setAttribute("style", …)` avec un nom LITTÉRAL : c'est une cinquième
	 *       forme, et l'instrument ne la voit pas. Retirer le style effacerait un
	 *       anneau de focalisation que la référence montre — la conformité de
	 *       pixel l'impose, P-1.7 le refuse, et l'instrument est hors périmètre.
	 *
	 *  É-2  `pnpm verif:maquette` à blanc sort en 1 sur 316 DÉRIVES DE BANC des
	 *       409 couples, dont 3 pour V-41. Elles ne portent QUE l'empreinte
	 *       ARIA — tabulation, focalisables et dimensions sont intacts — et la
	 *       comparaison elle-même est à 409 conformes, 0 écart. Cause :
	 *       `verif/references/empreintes.json` date du 18/08 20:14, et le lot P-9
	 *       a RÉPARÉ le 19/08 le filtre d'adresses d'ARB-013, jusque-là inerte
	 *       (`ECART-025` É-1). Toute zone portant un lien a donc changé de
	 *       signature. Un ré-étalonnage est un geste d'orchestrateur, tracé,
	 *       jamais la sortie silencieuse d'un contrôle de dérive.
	 *
	 * DEUX NŒUDS INERTES DU GEL NE SONT PAS PORTÉS, par application d'ARB-021 :
	 * `<template id="tpl-palette">` et `<dialog class="palette" id="palette">`,
	 * vide et fermé. Ils ne déplacent aucun pixel, n'entrent pas dans l'instantané
	 * ARIA, et la palette relève de T-106 / P-8. `<dialog class="dlg" id="d-demo">`
	 * l'est, lui, à sa place exacte du gel : c'est une boîte du produit.
	 *
	 * LES RÉGIONS SONT SOUSTRAITES AU FORMATEUR — piège P-6 de `CLAUDE.md` §6.
	 * La maquette construit tout le corps en script : le DOM de référence ne
	 * porte AUCUN nœud d'espacement entre éléments. Un blanc réintroduit par
	 * `prettier --write` se lit dans le `textContent` sur lequel le niveau 1
	 * construit ses noms accessibles, et se voit au pixel entre deux éléments en
	 * ligne. Chaque `section.famille` est donc précédée de `<!-- prettier-ignore -->`,
	 * dans la forme exacte que le formateur reconnaît.
	 */
	import {
		ACTIVITE,
		DOMAINES,
		INSTANCE,
		MOI,
		TYPES_NOTE,
		UNIVERS,
		type Domaine,
		type EtatDInstance,
		type EvenementDActivite,
		type NiveauFraicheur,
		type Note,
		type TypeDeNote,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { BARRES_DE_JAUGE, temoinFraicheur, type Temoin } from '$lib/fraicheur';
	import { vocabulaireRendu } from '$lib/vocabulaire';

	/* LE MOT RENOMMABLE DE `M14.7`, LU SUR LE CONTEXTE DE COQUILLE. Il etait
	   une constante de `$lib/vocabulaire.ts`, calculee a l'import depuis
	   `CONFIG.motFiche` de `seeds/corpus.ts` : le renommer en console ne
	   changeait rien a l'ecran. Hors gabarit racine, le repli rend « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);

	/**
	 * LA CLÉ D'ÉTAT N'EST PAS DÉCLARÉE, ET C'EST LA LECTURE JUSTE DU SCÉNARIO.
	 * Le mode démo la passe à toutes les vues ; ici les onze états rendent LA
	 * MÊME PAGE — onze zones montrées côte à côte, que le banc découpe par leur
	 * rang (`page-entiere-zone-isolee`). Une propriété `etat` déclarée et jamais
	 * lue ferait croire à un pilotage qui n'existe pas.
	 */
	interface Proprietes {
		/** Le jeu de semence de la vue — `corpusPourVue('V-41')`, variante complète. */
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
		/** Le flux d'activité. Absente, `ACTIVITE` du jeu de semence. */
		activite?: readonly EvenementDActivite[];
		/** Les types de note offerts. Absente, `TYPES_NOTE` du jeu de semence. */
		typesNote?: readonly TypeDeNote[];
	}

	const {
		notes,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		activite = ACTIVITE,
		typesNote = TYPES_NOTE
	}: Proprietes = $props();

	/** Les onze familles, dans l'ordre du gel. Le sommaire en est la table. */
	const FAMILLES: readonly { readonly id: string; readonly nom: string }[] = [
		{ id: 'fraicheur', nom: 'Signal de fraîcheur' },
		{ id: 'boutons', nom: 'Boutons' },
		{ id: 'champs', nom: 'Champs de saisie' },
		{ id: 'pastilles', nom: 'Pastilles et marqueurs' },
		{ id: 'conteneurs', nom: 'Conteneurs' },
		{ id: 'navigation', nom: 'Navigation' },
		{ id: 'donnees', nom: 'Restitution de données' },
		{ id: 'superpositions', nom: 'Superpositions' },
		{ id: 'prose', nom: 'Contenu rédigé' },
		{ id: 'retours', nom: 'Retours' },
		{ id: 'identite', nom: 'Identité' }
	];

	/* ── Le témoin de fraîcheur ────────────────────────────────────────────────
	   Les trois exemples sont les PREMIÈRES notes de chaque niveau dans l'ordre
	   du corpus — `window.CORPUS.filter(…)[0]` du gel (`V-41:4064`). Aucun
	   identifiant n'est écrit : le jeu de semence décide. */
	const NIVEAUX: readonly NiveauFraicheur[] = ['frais', 'vieil', 'obs'];

	const exemples = $derived(
		NIVEAUX.map((niveau) => notes.find((n) => n.fraicheur === niveau)).filter(
			(n): n is Note => n !== undefined
		)
	);

	/** Les trois barres de la jauge, pleines ou vides — jamais recomptées ici. */
	function jauge(t: Temoin): readonly boolean[] {
		return Array.from({ length: BARRES_DE_JAUGE }, (_, k) => k < t.barres);
	}

	/* ── La barre de répartition ───────────────────────────────────────────────
	   `barreRepartition(notesDuDomaine("Infrastructure"), { contexte })` du gel
	   (`V-41:3696`). Les parts nulles sont omises, de la barre comme de la
	   légende, et l'ordre est celui des trois niveaux. */
	const DOMAINE_DEMO = 'Infrastructure';

	const PARTS: readonly {
		readonly cle: NiveauFraicheur;
		readonly classe: string;
		readonly pluriel: string;
		readonly singulier: string;
	}[] = [
		{ cle: 'frais', classe: 'p-frais', pluriel: 'fraîches', singulier: 'fraîche' },
		{ cle: 'vieil', classe: 'p-vieil', pluriel: 'vieillissantes', singulier: 'vieillissante' },
		{ cle: 'obs', classe: 'p-obs', pluriel: 'obsolètes', singulier: 'obsolète' }
	];

	const notesDuDomaine = $derived(notes.filter((n) => n.domaine === DOMAINE_DEMO));

	const repartition = $derived(
		PARTS.map((p) => ({
			...p,
			compte: notesDuDomaine.filter((n) => n.fraicheur === p.cle).length
		})).filter((p) => p.compte > 0)
	);

	const accord = (compteur: number, pluriel: string, singulier: string) =>
		`${compteur} ${compteur > 1 ? pluriel : singulier}`;

	const libelleRepartition = $derived(
		repartition.map((p) => accord(p.compte, p.pluriel, p.singulier)).join(', ') +
			' sur ' +
			notesDuDomaine.length
	);

	/* ── L'arborescence des dossiers ───────────────────────────────────────────
	   `window.dossiersDuDomaine` (`V-41:2455`) : aucune structure séparée, le
	   rangement affiché est celui que portent les chemins des notes. Une note
	   compte pour le dossier TERMINAL de son chemin, et l'ordre est celui de la
	   première rencontre — le sélecteur du gel ne trie pas. */
	interface NoeudDeDossier {
		readonly nom: string;
		notes: number;
		readonly enfants: NoeudDeDossier[];
	}

	/** Le nœud d'un niveau, créé à la première rencontre : l'ordre est celui du
	 *  corpus, et le sélecteur du gel ne trie pas (à la différence du rail). */
	function ouCreer(niveau: NoeudDeDossier[], nom: string): NoeudDeDossier {
		const existant = niveau.find((d) => d.nom === nom);
		if (existant) return existant;
		const cree: NoeudDeDossier = { nom, notes: 0, enfants: [] };
		niveau.push(cree);
		return cree;
	}

	const dossiers = $derived.by(() => {
		const racines: NoeudDeDossier[] = [];
		for (const n of notes) {
			if (n.domaine !== DOMAINE_DEMO || !n.dossier) continue;
			const segments = n.dossier
				.split('›')
				.map((s) => s.trim())
				.filter(Boolean);
			let niveau = racines;
			segments.forEach((segment, k) => {
				const noeud = ouCreer(niveau, segment);
				if (k === segments.length - 1) noeud.notes++;
				niveau = noeud.enfants;
			});
		}
		return racines;
	});

	/* ── La carte de résultat ──────────────────────────────────────────────────
	   `carte(window.CORPUS[0], "sauvegarde", 0, {})` : la première note du jeu,
	   surlignée sur la requête de démonstration. */
	const REQUETE_DEMO = 'sauvegarde';
	const noteDeCarte = $derived(notes[0]);

	interface Morceau {
		readonly texte: string;
		readonly marque: boolean;
	}

	/** `window.surligner` (`V-41:2224`), à la lettre : jamais de HTML injecté. */
	function surligner(texte: string, requete: string): readonly Morceau[] {
		const termes = requete
			.toLowerCase()
			.split(/\s+/)
			.filter((t) => t.length > 2);
		if (!termes.length) return [{ texte, marque: false }];
		const motif = new RegExp(
			'(' + termes.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
			'ig'
		);
		const morceaux: Morceau[] = [];
		let dernier = 0;
		let trouve = motif.exec(texte);
		while (trouve !== null) {
			if (trouve.index > dernier) {
				morceaux.push({ texte: texte.slice(dernier, trouve.index), marque: false });
			}
			morceaux.push({ texte: trouve[0], marque: true });
			dernier = trouve.index + trouve[0].length;
			if (trouve.index === motif.lastIndex) motif.lastIndex++;
			trouve = motif.exec(texte);
		}
		if (dernier < texte.length) morceaux.push({ texte: texte.slice(dernier), marque: false });
		return morceaux;
	}

	/** `nombre()` du gel : la locale française, qui ne sépare pas sous 10 000. */
	const nombre = (x: number) => x.toLocaleString('fr-FR');

	/* ── Le tableau triable, la chronologie, la pile d'avatars ─────────────── */
	const plusConsultees = $derived(
		notes
			.slice()
			.sort((a, b) => b.vues - a.vues)
			.slice(0, 4)
	);

	const evenements = $derived(activite.slice(0, 4));

	const contributeurs = $derived.by(() => {
		const par: { nom: string; total: number }[] = [];
		for (const n of notes) {
			const deja = par.find((c) => c.nom === n.auteur);
			if (deja) deja.total++;
			else par.push({ nom: n.auteur, total: 1 });
		}
		return par.sort((a, b) => b.total - a.total || a.nom.localeCompare(b.nom, 'fr'));
	});

	const initiales = (nom: string) =>
		nom
			.split(' ')
			.map((m) => m[0])
			.join('');

	/* ── Les trois indicateurs chiffrés ────────────────────────────────────────
	   LITTÉRAUX DANS LE GEL (`V-41:4413`), et déclarés comme tels au rapport du
	   lot : ce sont des SPÉCIMENS de composant, pas les indicateurs d'un tableau
	   de bord. Les dériver du corpus déplacerait les pixels d'une planche de
	   référence, ce que l'ordre de préséance interdit. */
	const INDICATEURS: readonly (readonly [string, string, string, string])[] = [
		['1 240', 'consultations sur 7 jours', 'hausse', '▲ +12 %'],
		['59 %', 'recherches abouties', 'baisse', '▼ −4 %'],
		['32', 'notes publiées', 'stable', '= inchangé']
	];

	/** Les étiquettes de la démonstration de saisie — `creerEtiquettes` du gel. */
	const ETIQUETTES_DEMO: readonly string[] = ['postgresql', 'sauvegarde'];
</script>

<!--
	Le témoin, rendu par la fabrique unique. Trois barres toujours, `.plein` sur
	les n premières, le libellé jamais omis (DESIGN.md §3.3 et §3.7).
-->
<!-- prettier-ignore -->
{#snippet temoin(t: Temoin)}<span class="temoin {t.classe}"><span class="temoin__jauge" aria-hidden="true">{#each jauge(t) as pleine, k (k)}<i class={pleine ? 'plein' : undefined}></i>{/each}</span><span class="temoin__txt">{t.libelle}</span></span>{/snippet}

<!-- prettier-ignore -->
{#snippet surligne(morceaux: readonly Morceau[])}{#each morceaux as m, k (k)}{#if m.marque}<mark>{m.texte}</mark>{:else}{m.texte}{/if}{/each}{/snippet}

<!-- prettier-ignore -->
{#snippet plus()}<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 3v10M3 8h10"/></svg>{/snippet}

<!-- prettier-ignore -->
{#snippet croix(taille: number, epaisseur: string)}<svg width={taille} height={taille} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width={epaisseur}><path d="M4 4l8 8M12 4l-8 8"/></svg>{/snippet}

<!-- prettier-ignore -->
{#snippet branche(noeuds: readonly NoeudDeDossier[])}<ul>{#each noeuds as d (d.nom)}<li><label class="dc-b"><input type="radio" name="dossier-demo"/>{d.nom}<span class="ac__n" style="margin-left:auto;font-family:var(--f-donnee);font-size:var(--t-micro);color:var(--c-encre-4)">{d.notes || ''}</span></label>{#if d.enfants.length}{@render branche(d.enfants)}{/if}</li>{/each}</ul>{/snippet}

<Coquille
	fil={['Accueil', 'Bibliothèque de composants']}
	{univers}
	{domaines}
	{notes}
	{compte}
	version={instance.version}
	donnees={{ 'data-numerote': 'non' }}
	classeEnveloppe="biblio"
	classeContenu="corps-b"
	idContenu="corps"
	libelleEvitement="Aller à la bibliothèque"
>
	{#snippet avantContenu()}
		<!-- prettier-ignore -->
		<nav class="sommaire-b" id="sommaire" aria-label="Familles de composants">{#each FAMILLES as f, k (f.id)}<a href="#{f.id}" aria-current={k === 0 ? 'true' : 'false'}>{f.nom}</a>{/each}</nav>
	{/snippet}

	{#snippet enfants()}
		<!-- prettier-ignore -->
		<section class="famille" id="fraicheur"><h2 class="famille__nom">Signal de fraîcheur</h2><p class="famille__sous">La signature du produit. Trois niveaux, jamais portés par la couleur seule : une jauge à trois barres étagées, un libellé en clair, et des hachures sur l'obsolète. Un seul constructeur les produit tous, dans toutes les vues.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Témoin, trois niveaux</div><div class="compo__quand">Partout où une note apparaît : carte de résultat, ligne de liste, panneau de relations, cartographie. <b>Ne jamais afficher une note sans son témoin</b> — c'est le renseignement qui décide si l'on peut s'y fier.</div></div><div class="compo__demo">{#each exemples as n (n.id)}{@const t = temoinFraicheur(n)}<div class="echantillon">{@render temoin(t)}<span class="echantillon__nom">{t.libelle}</span></div>{/each}</div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Témoin avec date</div><div class="compo__quand">En tête de note (V-14) et dans le cartouche de contrôle, où l'on a la place de dater le dernier contrôle.</div></div><div class="compo__demo compo__demo--pile">{#each exemples as n (n.id)}{@const t = temoinFraicheur(n)}<div class="echantillon"><span style="display:inline-flex;align-items:center;gap:var(--e-1)">{@render temoin(t)}<span style="font-family:var(--f-donnee);font-size:var(--t-mini);color:var(--c-encre-3)">{' · vérifiée le ' + n.revise}</span></span><span class="echantillon__nom">{t.libelle}</span></div>{/each}</div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Barre de répartition</div><div class="compo__quand">Sur une page de domaine, d'univers ou de dossier : la santé d'un ensemble en un coup d'œil. Chaque part est cliquable et mène à la liste filtrée correspondante.</div></div><div class="compo__demo compo__demo--pile"><div class="repart" role="img" aria-label={libelleRepartition}>{#each repartition as p (p.cle)}{@const l = accord(p.compte, p.pluriel, p.singulier) + ' · ' + DOMAINE_DEMO}<button type="button" class={p.classe} title={l} aria-label={l} style="flex:{p.compte}"></button>{/each}</div><div class="legende">{#each repartition as p (p.cle)}<span><i class={p.classe}></i><b>{p.compte}</b> {p.compte > 1 ? p.pluriel : p.singulier}</span>{/each}</div></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="boutons"><h2 class="famille__nom">Boutons</h2><p class="famille__sous">Une seule action principale par écran, et jamais deux boutons pleins côte à côte. Le poids visuel dit la hiérarchie : si tout est important, plus rien ne l'est.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Variantes</div><div class="compo__quand"><b>Principale</b> : l'action attendue de l'écran, une seule. <b>Secondaire</b> : les actions courantes. <b>Discrète</b> : les actions d'appoint, dans les barres denses. <b>Destructive</b> : tout ce qui détruit, toujours détachée des actions neutres.</div></div><div class="compo__demo"><div class="echantillon"><button class="btn btn--principal" type="button">Enregistrer</button><span class="echantillon__nom">btn--principal</span></div><div class="echantillon"><button class="btn" type="button">Annuler</button><span class="echantillon__nom">btn</span></div><div class="echantillon"><button class="btn btn--discret" type="button">Options</button><span class="echantillon__nom">btn--discret</span></div><div class="echantillon"><button class="btn btn--destructif" type="button">Supprimer</button><span class="echantillon__nom">btn--destructif</span></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Avec pictogramme</div><div class="compo__quand">Le pictogramme précède toujours le libellé et ne le remplace jamais, sauf dans une barre d'outils où l'infobulle prend le relais.</div></div><div class="compo__demo"><div class="echantillon"><button class="btn btn--principal" type="button"><span style="line-height:0">{@render plus()}</span>Nouvelle note</button><span class="echantillon__nom">principale</span></div><div class="echantillon"><button class="btn" type="button"><span style="line-height:0">{@render plus()}</span>Ajouter</button><span class="echantillon__nom">secondaire</span></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">États</div><div class="compo__quand">Le focus visible est <b>obligatoire</b> : il conditionne l'usage au clavier. Un bouton désactivé doit être rare — préférer masquer une action interdite plutôt que la montrer inaccessible.</div></div><div class="compo__demo"><div class="echantillon"><button class="btn" type="button">Normal</button><span class="echantillon__nom">normal</span></div><div class="echantillon"><button class="btn" type="button" style="outline:2px solid var(--c-accent);outline-offset:2px">Focus</button><span class="echantillon__nom">focus</span></div><div class="echantillon"><button class="btn" type="button" disabled>Désactivé</button><span class="echantillon__nom">désactivé</span></div><div class="echantillon"><button class="btn" type="button" disabled><span style="width:12px;height:12px;border:2px solid var(--c-trait-fort);border-top-color:var(--c-accent);border-radius:50%;animation:tourne-notif .7s linear infinite;display:inline-block"></span>Enregistrement…</button><span class="echantillon__nom">en attente</span></div></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="champs"><h2 class="famille__nom">Champs de saisie</h2><p class="famille__sous">Toujours une étiquette au-dessus, jamais dans le champ : une étiquette flottante disparaît au moment précis où l'on en aurait besoin. L'aide est sous le champ, l'erreur remplace l'aide.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Texte, quatre états</div><div class="compo__quand">L'erreur est <b>toujours accompagnée de son motif</b>, jamais d'un simple contour rouge. Le message dit ce qui ne va pas et ce qu'il faut faire.</div></div><div class="compo__demo compo__demo--grille"><div class="champ" style="width:100%"><!-- svelte-ignore a11y_label_has_associated_control --><label class="champ__label">Normal</label><input class="saisie" type="text" placeholder="Saisie"/></div><div class="champ" style="width:100%"><!-- svelte-ignore a11y_label_has_associated_control --><label class="champ__label">Focus</label><input class="saisie" type="text" placeholder="Saisie" style="border-color:var(--c-accent);box-shadow:0 0 0 3px var(--c-accent-voile)"/></div><div class="champ" data-etat="erreur" style="width:100%"><!-- svelte-ignore a11y_label_has_associated_control --><label class="champ__label">Erreur</label><input class="saisie" type="text" placeholder="Saisie" value="valeur refusée"/><div class="champ__erreur"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" style="flex:none;margin-top:1px"><path d="M8 4.5v4M8 11.2v.3"/><circle cx="8" cy="8" r="6.2"/></svg>Ce nom est déjà pris dans ce dossier.</div></div><div class="champ" style="width:100%"><!-- svelte-ignore a11y_label_has_associated_control --><label class="champ__label">Désactivé</label><input class="saisie" type="text" placeholder="Saisie" value="Non modifiable" disabled/><span class="champ__aide">Attribué par un administrateur.</span></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Zone longue et sélecteur</div><div class="compo__quand">La zone longue pour tout texte de plus d'une ligne. Le sélecteur quand les valeurs possibles sont connues, fermées et peu nombreuses.</div></div><div class="compo__demo compo__demo--grille"><div class="champ" style="width:100%"><!-- svelte-ignore a11y_label_has_associated_control --><label class="champ__label">Zone longue</label><textarea class="saisie" rows="3" placeholder="Description…"></textarea></div><div class="champ" style="width:100%"><!-- svelte-ignore a11y_label_has_associated_control --><label class="champ__label">Sélecteur</label><select class="saisie" style="cursor:pointer">{#each typesNote as t (t)}<option>{t}</option>{/each}</select></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Sélecteur arborescent</div><div class="compo__quand">Pour choisir un dossier : la hiérarchie doit rester lisible pendant le choix, ce qu'un menu déroulant à chemins concaténés ne permet pas.</div></div><div class="compo__demo compo__demo--pile"><div class="dossier-choix-b">{@render branche(dossiers)}</div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Case, interrupteur, étiquettes</div><div class="compo__quand">La <b>case</b> pour un choix qui sera validé avec le formulaire ; l'<b>interrupteur</b> pour un réglage qui prend effet immédiatement. Les confondre trompe sur le moment où l'action se produit.</div></div><div class="compo__demo compo__demo--pile"><div class="echantillon"><label class="case"><input type="checkbox" checked/><span class="case__txt">Inclure les brouillons</span></label><span class="echantillon__nom">case</span></div><div class="echantillon"><label class="interrupteur"><input type="checkbox" checked/><span class="interrupteur__piste"></span><span>Notifications par courriel</span></label><span class="echantillon__nom">interrupteur</span></div><div class="echantillon"><div style="position:relative;width:280px"><div class="etq-boite">{#each ETIQUETTES_DEMO as e (e)}<span class="etq">{e}<button type="button" aria-label="Retirer l'étiquette {e}">{@render croix(11, '2.2')}</button></span>{/each}<input type="text" placeholder="Ajouter…" id="etq-demo"/></div><div class="etq-suggestions" id="sug-demo"></div></div><span class="echantillon__nom">saisie d'étiquettes</span></div></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="pastilles"><h2 class="famille__nom">Pastilles et marqueurs</h2><p class="famille__sous">Des étiquettes courtes qui qualifient sans commenter. Elles ne portent jamais d'action, sauf le filtre actif, dont la croix est explicite.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Familles de pastilles</div><div class="compo__quand">Le <b>domaine</b> porte sa teinte d'identification, le <b>type</b> reste neutre, l'<b>étiquette</b> est en monospace avec son croisillon. Le brouillon est hachuré comme l'obsolète : ce n'est pas encore publiable.</div></div><div class="compo__demo"><div class="echantillon"><span class="past"><i style="width:8px;height:8px;border-radius:2px;background:#453ba0;display:inline-block;margin-right:6px"></i>Infrastructure</span><span class="echantillon__nom">past--domaine</span></div><div class="echantillon"><span class="past past--type">Procédure</span><span class="echantillon__nom">past--type</span></div><div class="echantillon"><span class="past past--type">Serveur</span><span class="echantillon__nom">type de {motFicheMinuscule}</span></div><div class="echantillon"><span class="past past--etiquette">postgresql</span><span class="echantillon__nom">past--etiquette</span></div><div class="echantillon"><span class="past" style="border-color:#dcc59a;color:var(--c-alerte);background-image:repeating-linear-gradient(135deg,transparent,transparent 3px,rgba(143,92,0,.12) 3px,rgba(143,92,0,.12) 6px)">brouillon</span><span class="echantillon__nom">brouillon</span></div><div class="echantillon"><span class="past" style="border-color:var(--c-accent-trait);background:var(--c-accent-voile);color:var(--c-accent-fonce);gap:5px">Type : Procédure<button type="button" aria-label="Retirer ce filtre" style="border:0;background:none;cursor:pointer;padding:0;line-height:0;color:inherit">{@render croix(11, '2.4')}</button></span><span class="echantillon__nom">filtre actif</span></div></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="conteneurs"><h2 class="famille__nom">Conteneurs</h2><p class="famille__sous">Quatre niveaux de mise en boîte, du plus au moins engageant. Ne jamais en imbriquer deux du même type : deux cadres emboîtés ne hiérarchisent rien.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Carte de résultat</div><div class="compo__quand">Un objet cliquable dans une liste de résultats. Elle porte toujours le témoin de fraîcheur et le chemin de rangement.</div></div><div class="compo__demo compo__demo--pile">{#if noteDeCarte}<a class="carte" href="#" data-index="0"><div class="carte__haut"><h2 class="carte__titre">{@render surligne(surligner(noteDeCarte.titre, REQUETE_DEMO))}</h2>{#if noteDeCarte.brouillon}<span class="past past--brouillon">Brouillon</span>{/if}<span class="past past--type">{noteDeCarte.typeFiche ? motFiche + ' ' + noteDeCarte.typeFiche : noteDeCarte.type}</span></div><p class="carte__extrait">{@render surligne(surligner(noteDeCarte.extrait, REQUETE_DEMO))}</p><div class="carte__signal">{@render temoin(temoinFraicheur(noteDeCarte))}{#if noteDeCarte.revise}<span class="carte__revision">Révisé le {noteDeCarte.revise}</span>{:else}<span class="carte__revision" data-jamais="oui">Jamais révisé</span>{/if}{#if noteDeCarte.operationnel}<span class="marque-op">↳ Trouvé dans le registre Opérationnel</span>{/if}</div><div class="carte__pied"><span class="carte__chemin"><span>{noteDeCarte.univers + ' › '}</span><b>{noteDeCarte.domaine}</b><span>{' › ' + noteDeCarte.dossier}</span></span><span class="sep">·</span><span>{noteDeCarte.auteur}</span><span class="sep">·</span><span>{nombre(noteDeCarte.vues)} consultations</span>{#if noteDeCarte.pj}<span class="sep">·</span><span>{noteDeCarte.pj}{noteDeCarte.pj > 1 ? ' pièces jointes' : ' pièce jointe'}</span>{/if}{#if noteDeCarte.visibilite === 'Publique'}<span class="sep">·</span><span class="carte__visibilite">Publique</span>{/if}</div></a>{/if}</div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Panneau</div><div class="compo__quand">Un regroupement thématique dans une page. En-tête étiqueté, corps aéré.</div></div><div class="compo__demo compo__demo--pile"><section class="panneau"><div class="panneau__tete"><span class="etiq">Relations</span><span class="chiffre">4</span></div><div class="panneau__corps"><div class="zone-etat__txt">Contenu du panneau.</div></div></section></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Encart</div><div class="compo__quand">Une remarque de second plan à l'intérieur d'un corps de texte. Filet latéral, jamais de fond coloré vif — un encart n'est pas une alerte.</div></div><div class="compo__demo compo__demo--pile"><div class="encart-b">Cette procédure suppose que la sauvegarde du jour soit terminée. Vérifiez-le avant de commencer.</div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Panneau latéral</div><div class="compo__quand">Un formulaire secondaire qui garde le contexte visible derrière lui — édition d'un objet de la console, historique d'une note. Préféré à la boîte de dialogue quand la saisie est longue.</div></div><div class="compo__demo"><button class="btn btn--principal" type="button">Voir un panneau latéral</button></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="navigation"><h2 class="famille__nom">Navigation</h2><p class="famille__sous">Dire où l'on est avant de dire où aller. Chaque composant de cette famille répond à « où suis-je », « que puis-je voir d'autre », ou « comment je reviens ».</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Fil d'Ariane</div><div class="compo__quand">En tête de chaque vue. Le dernier segment n'est jamais cliquable : c'est la page courante, et l'offrir au clic est une promesse vide.</div></div><div class="compo__demo compo__demo--pile"><nav class="fil"><a href="#">Accueil</a><span>›</span><a href="#">Production</a><span>›</span><a href="#">Infrastructure</a><span>›</span><a href="#">Exploitation</a><span>›</span><span class="fil__courant">Sauvegardes</span></nav></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Onglets</div><div class="compo__quand">Pour des vues alternatives d'un même objet — les quatre volets du profil, les registres d'une note. Jamais pour des objets différents : ce serait de la navigation déguisée.</div></div><div class="compo__demo compo__demo--pile"><div class="onglets-d"><button type="button" role="tab" aria-selected="true">Identité</button><button type="button" role="tab" aria-selected="false">Sécurité</button><button type="button" role="tab" aria-selected="false">Distinctions</button><button type="button" role="tab" aria-selected="false">Activité</button></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Arborescence</div><div class="compo__quand">Le chevron déplie, le nom navigue. Deux cibles distinctes, toujours — c'est la règle posée en V-37 et tenue par le rail de gauche, qui en est l'exemplaire vivant.</div></div><div class="compo__demo compo__demo--pile"><div class="zone-etat__txt">Voir la navigation latérale de cette page : c'est le même composant, alimenté par le corpus.</div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Pagination</div><div class="compo__quand">Au-delà de cinquante éléments. Elle indique toujours la page courante et le total : « page 3 » sans savoir combien il y en a n'aide pas à décider.</div></div><div class="compo__demo"><div class="pagination"><button aria-label="Page précédente">‹</button><button>1</button><button aria-current="page">2</button><button>3</button><span class="pagination__saut">…</span><button>9</button><button aria-label="Page suivante">›</button><span class="echantillon__nom" style="margin-left:var(--e-2)">180 notes · 20 par page</span></div></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="donnees"><h2 class="famille__nom">Restitution de données</h2><p class="famille__sous">Un chiffre seul ne décide de rien. Chacun de ces composants ajoute au chiffre ce qui permet d'en tirer une conclusion : une comparaison, une tendance, une part.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Tableau triable</div><div class="compo__quand">Pour des données homogènes et comparables colonne par colonne. L'en-tête trié porte <b>aria-sort</b> et une flèche : sans elle, on ne sait pas ce qui a été trié.</div></div><div class="compo__demo compo__demo--pile"><div class="tableau-boite" style="width:100%"><table class="tableau-tri"><thead><tr><th><button type="button">Note</button></th><th><button type="button">Domaine</button></th><th aria-sort="descending"><button type="button">Vues <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><path d="M1 3.5h8L5 8z"/></svg></button></th></tr></thead><tbody>{#each plusConsultees as n (n.id)}<tr><td>{n.titre}</td><td>{n.domaine}</td><td class="n">{n.vues}</td></tr>{/each}</tbody></table></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Indicateur chiffré avec tendance</div><div class="compo__quand">La tendance est <b>indispensable</b> : 1 240 consultations ne veut rien dire, « 1 240, en hausse de 12 % » veut dire quelque chose. Une tendance stable se dit aussi.</div></div><div class="compo__demo">{#each INDICATEURS as [valeur, nom, sens, variation] (nom)}<div class="indicateur"><div class="indicateur__val">{valeur}</div><span class="indicateur__nom">{nom}</span><div class="tendance-c" data-sens={sens}>{variation}</div></div>{/each}</div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Chronologie</div><div class="compo__quand">Pour une succession d'événements datés : historique d'une note, activité d'un compte. La pastille de gauche encode la nature de l'événement.</div></div><div class="compo__demo compo__demo--pile"><ul class="chrono">{#each evenements as e, k (k)}<li data-marque={k === 0 ? 'fait' : undefined}><div class="chrono__txt">{e.qui} — {e.detail || e.type}<span class="chrono__quand">il y a {e.heures} h</span></div></li>{/each}</ul></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="superpositions"><h2 class="famille__nom">Superpositions</h2><p class="famille__sous">Tout ce qui passe au-dessus du contenu. Règle commune : ce qui exige une décision avant de continuer est une boîte de dialogue ; tout le reste doit pouvoir être ignoré.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Boîte de dialogue</div><div class="compo__quand">Piège le focus, se ferme à Échap, rend le focus à son déclencheur. Le catalogue complet est en V-40.</div></div><div class="compo__demo"><button class="btn btn--principal" type="button">Ouvrir une boîte</button></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Palette de recherche rapide</div><div class="compo__quand">Ctrl+K depuis n'importe où. Elle cherche, mais propose aussi les actions : c'est le raccourci universel du produit.</div></div><div class="compo__demo"><button class="btn" type="button">Ouvrir la palette</button></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Menu contextuel</div><div class="compo__quand">Les actions d'un objet précis, ouvertes depuis lui. L'action destructive y est séparée par un filet et colorée : c'est le seul endroit où elle voisine des actions neutres.</div></div><div class="compo__demo"><div class="menu-ctx"><button type="button">Ouvrir<span class="menu-ctx__raccourci">Entrée</span></button><button type="button">Modifier<span class="menu-ctx__raccourci">E</span></button><button type="button">Dupliquer</button><div class="menu-ctx__sep"></div><button class="destructif" type="button">Supprimer<span class="menu-ctx__raccourci">Suppr</span></button></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Infobulle</div><div class="compo__quand">Un complément court sur un élément dont le sens n'est pas évident. <b>Jamais pour une information nécessaire</b> : elle est inaccessible au toucher et invisible à l'impression.</div></div><div class="compo__demo"><span class="infobulle-h"><button class="btn btn--discret" type="button">Survolez-moi</button><span class="infobulle">Dernière vérification il y a 12 jours</span></span></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="prose"><h2 class="famille__nom">Contenu rédigé</h2><p class="famille__sous">Le rendu de toutes les constructions de l'éditeur. La mesure du texte est bornée à 680 pixels ; seuls le code, les tableaux, les figures et les alertes débordent, parce qu'ils se lisent en balayage et non en ligne.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Constructions de l'éditeur</div><div class="compo__quand">Titres, listes, tâches, citation, code, tableau, alertes. Ce rendu est identique dans l'éditeur (V-17) et en lecture (V-14) : c'est le même fragment de style.</div></div><div class="compo__demo compo__demo--pile"><div class="prose"><h2>Titre de section</h2><p>Un paragraphe de corps rédigé, composé en Literata pour la lecture longue à l'écran. Il peut contenir du <strong>gras</strong>, de l'<em>italique</em>, du <code>code en ligne</code> et un <a class="lien-int" href="#">lien vers une autre note</a>.</p><h3>Sous-titre</h3><ul><li>Élément de liste à puces</li><li>Second élément</li></ul><ol><li>Première étape numérotée</li><li>Seconde étape</li></ol><ul class="taches"><li><input type="checkbox" checked/><span>Contrôle effectué</span></li><li><input type="checkbox"/><span>Contrôle à faire</span></li></ul><blockquote class="prose-cit">Une citation, ou une parole rapportée.</blockquote><div class="bloc-code"><div class="bloc-code__tete"><span class="etiq">bash</span></div><pre><code>barman recover pg-prod-01 latest /var/lib/postgresql</code></pre></div><div class="tableau-boite"><table><thead><tr><th>Serveur</th><th>Rôle</th></tr></thead><tbody><tr><td>pg-prod-01</td><td>Principal</td></tr><tr><td>pg-prod-02</td><td>Réplica</td></tr></tbody></table></div><div class="alerte alerte--astuce"><div><div class="alerte__tete"><span class="alerte__glyphe">ASTUCE</span> Gagner du temps</div><div>Le raccourci Ctrl+K ouvre la recherche depuis n'importe où.</div></div></div><div class="alerte alerte--attention"><div><div class="alerte__tete"><span class="alerte__glyphe">ATTENTION</span> À savoir avant</div><div>La restauration ferme les connexions en cours.</div></div></div><div class="alerte alerte--danger"><div><div class="alerte__tete"><span class="alerte__glyphe">DANGER</span> Irréversible</div><div>Cette commande écrase le répertoire de données.</div></div></div><hr/><p>Un dernier paragraphe après le séparateur.</p></div></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="retours"><h2 class="famille__nom">Retours</h2><p class="famille__sous">Ce que le produit répond quand il a quelque chose à dire, rien à montrer, ou un problème. Les planches complètes sont en V-38 et V-39.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Notifications</div><div class="compo__quand">Quatre types. Le succès s'efface, l'erreur persiste et propose une issue, l'information est refermable, le suivi montre son avancement puis dit ce qu'il a produit.</div></div><div class="compo__demo">{#each ['Succès', 'Erreur', 'Information', 'En cours'] as libelle (libelle)}<button class="btn" type="button">{libelle}</button>{/each}</div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">État vide</div><div class="compo__quand">Un titre qui nomme la situation, une phrase qui explique, une action qui en sort. <b>« Il n'y a rien » et « vos filtres ne renvoient rien » ne se confondent jamais.</b></div></div><div class="compo__demo compo__demo--pile"><div style="background:var(--c-papier);border:1px dashed var(--c-trait-fort);border-radius:var(--r-3);padding:var(--e-5) var(--e-4);text-align:center;width:100%"><div style="font-family:var(--f-ui);font-size:var(--t-t3);font-weight:var(--g-lourd);margin-bottom:var(--e-2)">Ce dossier est vide</div><p style="font-family:var(--f-lecture);font-size:var(--t-petit);color:var(--c-encre-2);margin:0 auto var(--e-4);max-width:42ch;line-height:1.6">Aucune note n'y est rangée pour l'instant, et il ne contient aucun sous-dossier.</p><div style="display:flex;gap:var(--e-2);justify-content:center;flex-wrap:wrap"><button class="btn btn--principal" type="button">Créer une note ici</button><button class="btn" type="button">Créer un sous-dossier</button></div></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">État de chargement</div><div class="compo__quand">Une esquisse de la structure qui arrive, jamais un rouet universel : l'utilisateur doit deviner ce qui va s'afficher.</div></div><div class="compo__demo compo__demo--pile"><div class="sq-carte" style="width:100%"><div class="sq-carte__tete"><div class="sq sq--fort" style="width:26px;height:26px;border-radius:4px;flex:none"></div><div class="sq sq-l sq-l--titre sq--fort" style="width:64%"></div></div><div class="sq-pile">{#each ['100%', '86%'] as largeur (largeur)}<div class="sq sq-l" style="width:{largeur}"></div>{/each}</div></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">État d'erreur local</div><div class="compo__quand">La panne d'un panneau ne condamne pas l'écran. Le message dit ce qui continue de fonctionner et propose de réessayer.</div></div><div class="compo__demo compo__demo--pile"><div style="border:1px solid #e2b8b0;border-left:4px solid var(--c-danger);border-radius:var(--r-3);background:var(--c-danger-voile);padding:var(--e-4);width:100%"><div style="font-size:var(--t-petit);font-weight:var(--g-fort);color:var(--c-danger);margin-bottom:var(--e-1)">Ce panneau n'a pas pu se charger</div><div style="font-size:var(--t-mini);color:var(--c-encre-2);line-height:1.5;margin-bottom:var(--e-3)">Le reste de la note s'affiche normalement : vous pouvez continuer à lire et à écrire.</div><button class="btn" type="button">Réessayer</button></div></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="identite"><h2 class="famille__nom">Identité</h2><p class="famille__sous">Représenter les personnes et les gestes. Un avatar n'est jamais seul quand le nom peut tenir à côté : deux initiales ne suffisent pas à identifier un collègue.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Avatar et pile d'avatars</div><div class="compo__quand">L'avatar simple dans une ligne d'activité ou la barre supérieure. La <b>pile</b> quand plusieurs personnes ont contribué : au-delà de quatre, un compteur prend le relais.</div></div><div class="compo__demo"><div class="echantillon"><span class="avatar-p" style="width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--c-accent);color:#fff;font-size:var(--t-petit);font-weight:var(--g-lourd)">{compte.initiales}</span><span class="echantillon__nom">avatar</span></div><div class="echantillon"><div class="piles">{#each contributeurs.slice(0, 3) as c (c.nom)}<span class="avatar-p">{initiales(c.nom)}</span>{/each}{#if contributeurs.length > 3}<span class="avatar-p avatar-p--reste">+{contributeurs.length - 3}</span>{/if}</div><span class="echantillon__nom">pile d'avatars</span></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Touche clavier</div><div class="compo__quand">Pour désigner une touche ou un raccourci dans un texte d'interface. Toujours la notation réelle du clavier, jamais une paraphrase.</div></div><div class="compo__demo"><div style="display:flex;align-items:center;gap:var(--e-2);font-size:var(--t-petit)">Ouvrir la recherche : <kbd class="touche">Ctrl</kbd><kbd class="touche">K</kbd> · Fermer : <kbd class="touche">Échap</kbd></div></div></section></section>
	{/snippet}

	<!--
		La boîte de démonstration, rendue HORS de `div.app` (ARB-021, A-4), à la
		place exacte du gel : après `div.app`, avant `div.notifs`. Elle est FERMÉE —
		le gel ne l'ouvre qu'au clic —, donc sans pixel, hors de l'ordre de
		tabulation et hors de l'instantané ARIA.
	-->
	{#snippet superposition()}
		<dialog class="dlg" id="d-demo" aria-labelledby="t-demo">
			<div class="dlg__boite">
				<div class="dlg__tete">
					<span class="dlg__marque" aria-hidden="true">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							><path d="M8 4.5v4.2M8 11.4v.3" /><circle cx="8" cy="8" r="6.2" /></svg
						>
					</span>
					<h2 class="dlg__titre" id="t-demo">Boîte de dialogue</h2>
					<button class="dlg__fermer" data-fermer="" aria-label="Fermer">
						{@render croix(16, '1.8')}
					</button>
				</div>
				<div class="dlg__corps">
					<p class="dlg__texte">
						Le catalogue complet des dix boîtes du produit est en V-40, avec leurs comportements
						communs.
					</p>
				</div>
				<div class="dlg__pied">
					<button class="btn" data-fermer="">Annuler</button>
					<button class="btn btn--principal" data-fermer="">Confirmer</button>
				</div>
			</div>
		</dialog>
	{/snippet}
</Coquille>
