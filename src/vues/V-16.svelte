<script lang="ts">
	/**
	 * V-16 — Comparaison de deux versions d'une note.
	 * Route `/notes/{identifiant}/comparaison` (`verif/scenarios/V-16.json`).
	 *
	 * CINQ ÉTATS, UNE SEULE FENÊTRE — 5 couples. Deux contrôles de planche :
	 * le couple de versions comparées (`cmp`, quatre positions) et le repli du
	 * journal (`c-tout`, une case).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * COQUILLE DE FORME ABRÉGÉE — ARB-021, A-1 : rail écrit au balisage du gel,
	 * barre sans les deux menus déroulants. `<main class="compare" id="contenu">`
	 * (ARB-015), lien d'évitement vers `#zone` avec le libellé propre « Aller à
	 * la comparaison » (ARB-019). Un attribut de données hors gabarit —
	 * `data-mode` (ARB-021, A-2) —, que la feuille de la vue lit pour montrer le
	 * journal ou les deux colonnes : `.app[data-mode="texte"] .si-visuel` et
	 * `.app[data-mode="visuel"] .si-texte` (`V-16.css`). Le gel le pose à
	 * « texte » et AUCUN des cinq états ne le déplace : la bascule Texte/Visuel
	 * est du comportement (ARB-011).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * L'ALIGNEMENT EST RENDU, IL N'EST PAS INVENTÉ
	 *
	 * Ce que la vue rend est l'alignement DU GEL, à sa granularité et avec ses
	 * appariements. `blocEnLignes()` (`V-16:1864`) et `alignement()`
	 * (`V-16:1882`) sont transcrits ici SANS un choix de plus : même plus longue
	 * sous-séquence commune, même départage d'égalité `t[i+1][j] >= t[i][j+1]`,
	 * même clé d'appariement — `b.cle` pour les blocs, l'identité pour les
	 * lignes. Un autre algorithme, même « meilleur », donnerait un autre écran :
	 * ce serait dessiner, pas porter.
	 *
	 * ET QUAND LA COMPARAISON EST REÇUE, C'EST LE MÊME ALGORITHME QUI L'A FAITE :
	 * `src/lib/donnees/histoire.ts` porte la même plus longue sous-séquence
	 * commune et le même départage, appliqués aux documents CANONIQUES des deux
	 * versions. La vue ne recalcule alors rien — elle compte, replie et peint.
	 *
	 * LA MATIÈRE VIENT DU CORPUS, JAMAIS D'UNE SAISIE (P-02) : `CONTENU_VERSIONS`
	 * — 37 blocs sur trois versions de `n-restaurer-pg` — et `VERSIONS` de
	 * `seeds/corpus.ts`, exactement ce que le gel lit dans
	 * `window.CONTENU_VERSIONS` et `window.versionsDe()`. Aucun compte n'est
	 * écrit : « +11 lignes », « −3 lignes » et « 6 blocs touchés sur 15 » sont
	 * comptés sur l'alignement. Les deux tableaux sont désormais REÇUS EN
	 * PROPRIÉTÉ, de défaut la constante du jeu (T-043) : `T-030` a posé la table
	 * des versions, la semence la laisse vide, et la forme de `CONTENU_VERSIONS`
	 * n'est transposée par aucun lot à ce jour — ce lot rend la vue CAPABLE sans
	 * rien transposer.
	 *
	 * LES BLOCS COMMUNS SONT ALIGNÉS HORIZONTALEMENT — c'est la rangée à deux
	 * cellules de `.visuel`, et c'est ce que `C-05` et `M07.3` demandent. LE
	 * MARQUEUR EST EN PLUS DE LA COULEUR, jamais à sa place : `.jl__marque`
	 * porte « + », « − » ou l'espace avec son `aria-label`, `.cellule__marque`
	 * porte « + Ajouté », « − Supprimé », « ± Réécrit », et `details.alternative`
	 * restitue la comparaison en liste. **CE LOT NE DÉCLARE POURTANT NI `C-05`
	 * NI `RG-M18-11` TENUES** : ce sont des rendus, pas la preuve d'une exigence
	 * (`pnpm test:a11y`, P-06).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * CINQ ÉTATS, ET CE QUE LE GEL EN MONTRE — MESURÉ, PAS DÉDUIT
	 *
	 *   `cmp-13-14`  13 → 14 — journal replié, deux colonnes, alternative
	 *   `cmp-11-14`  11 → 14 — le même écran sur un écart plus large
	 *   `cmp-14-14`  « Même version » — `na === nbv`, donc `.etat-compare`
	 *   `cmp-13-13`  « Sans différence » — MÊME BRANCHE : les deux bornes
	 *                désignent la version 13, `na === nbv` est vrai, et le gel
	 *                rend « Il n'y a rien à comparer », pas « contenu
	 *                identique ». Le libellé de la planche annonce autre chose
	 *                que ce que la maquette rend ; la maquette fait loi (plan
	 *                §11, D-08). Écart remonté au rapport de lot.
	 *   `tout`       « Tout afficher » — le journal cesse de replier les
	 *                lignes inchangées ; le reste est celui de `cmp-13-14`.
	 *
	 * LA BRANCHE « CONTENU IDENTIQUE » DU GEL (`V-16:2277`) N'EST PAS ÉCRITE.
	 * Elle exige `na !== nbv` et zéro ligne ajoutée comme retirée ; les quatre
	 * positions de la planche ne l'atteignent jamais — les deux couples de
	 * versions distinctes diffèrent, les deux couples identiques sont pris par
	 * la branche précédente. L'écrire serait poser une règle qu'aucun cas
	 * n'exerce (`CLAUDE.md` §6, P-5) : elle ne serait pas posée, elle serait
	 * espérée. Remontée au rapport de lot.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * AUCUN COMPORTEMENT — ARB-011. La bascule Texte/Visuel, le dépliage d'un
	 * repli de journal, les deux retours et les notifications qu'ils lèvent sont
	 * du temps 3. `div.notifs` est rendu vide.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog.palette#palette`
	 * FERMÉ — `docs/releve-vues.md` §4.1 les mesure : aucune boîte de rendu,
	 * aucun pixel, aucune entrée dans l'instantané ARIA. Et `div.planche`, bloc
	 * hors produit (`docs/DESIGN.md` §2.G), que le banc retire lui-même.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-16.css`, posé par `node verif/feuilles-de-vue.mjs V-16
	 * --installer` (P-6.3). Le seul `style=` reproduit est celui du gel
	 * (`V-16:1116`), à l'ensemble clos d'ARB-016 (P-6.4).
	 */
	import {
		CONTENU_VERSIONS,
		DOMAINES,
		INSTANCE,
		MOI,
		UNIVERS,
		VERSIONS,
		noteParIdentifiant,
		type BlocDeContenu,
		type Domaine,
		type EtatDInstance,
		type IdentifiantNote,
		type Note,
		type Univers,
		type UtilisateurCourant,
		type Version
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';

	/**
	 * LES PROPRIÉTÉS DE RANGEMENT ET D'IDENTITÉ SONT OPTIONNELLES, ET LEUR
	 * DÉFAUT EST LA CONSTANTE DU JEU DE SEMENCE.
	 *
	 * La vue devient capable de recevoir ce qu'un chargeur de route lit en base
	 * — univers, domaines, compte courant, état de l'instance — sans qu'aucun
	 * rendu ne change tant que rien ne lui est passé : le mode de conception ne
	 * passe que `vecteur` et `notes`, la vue reçoit donc exactement ce qu'elle
	 * recevait, et le banc de comparaison ne bouge pas d'un pixel.
	 */
	interface Proprietes {
		/** Le vecteur complet de l'état — deux contrôles de planche. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-16')`, variante « lecture ». */
		notes: readonly Note[];
		/** Les univers du produit. Défaut : ceux du jeu de semence. */
		univers?: readonly Univers[];
		/** Les domaines du produit. Défaut : ceux du jeu de semence. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Défaut : celui du jeu de semence. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance servie. Défaut : celui du jeu de semence. */
		instance?: EtatDInstance;
		/**
		 * L'historique, par note. Défaut : celui du jeu de semence.
		 *
		 * `T-030` a posé la table des versions ; la semence la laisse VIDE. La vue
		 * est rendue capable de recevoir un historique réel, elle n'en transpose
		 * aucun : tant que rien ne lui est passé, elle lit le jeu de semence.
		 */
		versions?: Partial<Record<IdentifiantNote, readonly Version[]>>;
		/**
		 * Le contenu de chaque version, par note puis par numéro. Défaut : celui du
		 * jeu de semence, dont la forme n'est transposée par aucun lot à ce jour.
		 */
		contenuVersions?: Partial<Record<IdentifiantNote, Record<string, readonly BlocDeContenu[]>>>;
		/**
		 * LA NOTE COMPARÉE. Défaut : celle du gel, `n-restaurer-pg`. Passée, elle
		 * décide du titre, du fil d'Ariane et de la clé sous laquelle l'historique
		 * est lu — la vue ne nomme alors plus aucune note d'exemple.
		 */
		note?: Note;
		/**
		 * LA COMPARAISON DÉJÀ CALCULÉE — `lireLaComparaison()` de
		 * `$lib/donnees/histoire.ts`, mise en forme d'affichage par
		 * `rangeesDAffichage()`.
		 *
		 * ELLE REMPLACE LE CALCUL LOCAL, elle ne s'y ajoute pas : l'alignement
		 * d'ADR-003 est fait UNE fois, côté données, sur les documents canoniques
		 * des deux versions — un second alignement divergerait, et la divergence
		 * ne se verrait qu'à l'écran. Ce que la vue garde est ce qui lui
		 * appartient : le repli du journal, les quantités, l'alternative
		 * textuelle, tous comptés sur ce qu'elle reçoit. Absente, le calcul du gel
		 * sur le jeu de semence reprend et le rendu par défaut ne bouge pas.
		 */
		comparaison?: {
			/** Le mode Texte : les lignes alignées des deux versions. */
			readonly lignes: readonly Paire<string>[];
			/** Le mode Visuel : les rangées de nœuds alignés. */
			readonly rangees: readonly Paire<BlocDeContenu>[];
		};
	}

	const {
		vecteur,
		notes: corpus,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		versions: historique = VERSIONS,
		contenuVersions = CONTENU_VERSIONS,
		note = undefined,
		comparaison = undefined
	}: Proprietes = $props();

	const reglage = $derived(vecteur ?? {});

	/** La note comparée par le gel — `ID`, `V-16:1991`. */
	const ID_DU_GEL = 'n-restaurer-pg';
	const NOTE = $derived(
		note ?? ((corpus.find((n) => n.id === ID_DU_GEL) ?? noteParIdentifiant(ID_DU_GEL)) as Note)
	);
	/** La clé sous laquelle l'historique et les contenus sont lus. */
	const ID = $derived(NOTE.id);

	/**
	 * LE RANGEMENT DE LA NOTE, tel que le fil le déroule. Le chemin de dossier est
	 * découpé comme `src/vues/V-17.svelte:247` le découpe, et non par une seconde
	 * règle. Une note rangée à la racine d'un domaine n'a aucun segment.
	 */
	const segments = $derived(
		NOTE.dossier
			.split('›')
			.map((s) => s.trim())
			.filter((s) => s !== '')
	);
	/** `S3` : le fil de la note, augmenté du segment propre à la comparaison. */
	const fil = $derived([
		'Accueil',
		NOTE.univers,
		NOTE.domaine,
		...segments,
		NOTE.titre,
		'Comparaison'
	]);
	const courant = $derived([NOTE.domaine, ...segments]);

	/**
	 * LE COUPLE DE BORNES. Le gel part de `na = 13, nbv = 14` (`V-16:1997`) et
	 * la planche le déplace en découpant `value` sur le tiret (`V-16:2332`).
	 */
	const COUPLE_PAR_DEFAUT = '13-14';
	const couple = $derived(typeof reglage['cmp'] === 'string' ? reglage['cmp'] : COUPLE_PAR_DEFAUT);
	const na = $derived(Number(couple.split('-')[0]));
	const nbv = $derived(Number(couple.split('-')[1]));
	/** « Tout afficher » : le journal cesse de replier les lignes inchangées. */
	const tout = $derived(reglage['c-tout'] === true);

	/** Les métadonnées d'une version — `META`, `V-16:1994`. */
	const versions = $derived<readonly Version[]>(historique[ID] ?? []);
	function meta(n: number): Version | undefined {
		return versions.find((v) => v.n === n);
	}
	/** `v.date + " · " + v.auteur`, ou le tiret quand la version est inconnue. */
	function qui(n: number): string {
		const v = meta(n);
		return v ? `${v.date} · ${v.auteur}` : '—';
	}

	/** Les trois états de contenu de la note — `CONTENUS`, `V-16:1993`. */
	const CONTENUS = $derived(contenuVersions[ID] ?? {});
	function contenu(n: number): readonly BlocDeContenu[] {
		return CONTENUS[String(n)] ?? [];
	}

	/* ── L'alignement du gel ──────────────────────────────────────────────────
	   Transcription de `window.blocEnLignes()` (`V-16:1864`) et de
	   `window.alignement()` (`V-16:1882`). Deux granularités, un seul
	   algorithme, et pas un choix de plus que le gel n'en fait. */

	/** Représentation linéaire d'un bloc, façon texte source. */
	function blocEnLignes(b: BlocDeContenu): string[] {
		switch (b.type) {
			case 'h2':
				return ['## ' + b.texte];
			case 'h3':
				return ['### ' + b.texte];
			case 'p':
				return [b.texte];
			case 'liste':
				return b.items.map((i) => '- ' + i);
			case 'taches':
				return b.items.map((i) => '- [ ] ' + i);
			case 'code':
				return ['```' + b.langage, ...b.lignes, '```'];
			case 'alerte':
				return [':::' + b.niveau + ' ' + b.titre, b.texte, ':::'];
			case 'figure':
				return ['![schéma] ' + b.legende];
			case 'tableau':
				return [
					'| ' + b.entetes.join(' | ') + ' |',
					...b.lignes.map((l) => '| ' + l.join(' | ') + ' |')
				];
		}
	}

	type EtatDePaire = 'commun' | 'retire' | 'ajoute';
	interface Paire<T> {
		readonly etat: EtatDePaire;
		readonly a: T | undefined;
		readonly b: T | undefined;
	}

	/**
	 * Plus longue sous-séquence commune. Le départage d'égalité —
	 * `t[i+1][j] >= t[i][j+1]`, donc le retrait avant l'ajout — décide de
	 * l'ordre des lignes affichées : il est repris tel quel.
	 */
	function alignement<T>(
		a: readonly T[],
		b: readonly T[],
		cle: (x: T) => unknown = (x) => x
	): Paire<T>[] {
		const n = a.length;
		const m = b.length;
		const t: number[][] = [];
		for (let i = 0; i <= n; i++) t.push(new Array<number>(m + 1).fill(0));
		for (let i = n - 1; i >= 0; i--) {
			const ligne = t[i]!;
			const suivante = t[i + 1]!;
			for (let j = m - 1; j >= 0; j--) {
				ligne[j] =
					cle(a[i]!) === cle(b[j]!) ? suivante[j + 1]! + 1 : Math.max(suivante[j]!, ligne[j + 1]!);
			}
		}
		const res: Paire<T>[] = [];
		let i = 0;
		let j = 0;
		while (i < n && j < m) {
			if (cle(a[i]!) === cle(b[j]!)) {
				res.push({ etat: 'commun', a: a[i]!, b: b[j]! });
				i++;
				j++;
			} else if (t[i + 1]![j]! >= t[i]![j + 1]!) {
				res.push({ etat: 'retire', a: a[i]!, b: undefined });
				i++;
			} else {
				res.push({ etat: 'ajoute', a: undefined, b: b[j]! });
				j++;
			}
		}
		while (i < n) {
			res.push({ etat: 'retire', a: a[i]!, b: undefined });
			i++;
		}
		while (j < m) {
			res.push({ etat: 'ajoute', a: undefined, b: b[j]! });
			j++;
		}
		return res;
	}

	/** Les deux bornes désignent la même version : il n'y a rien à comparer. */
	const memeVersion = $derived(na === nbv);

	function lignesDe(v: number): string[] {
		return contenu(v).reduce<string[]>((s, b) => s.concat(blocEnLignes(b)), []);
	}

	/**
	 * LES DEUX ALIGNEMENTS. Reçus quand la route les a calculés sur les documents
	 * canoniques des deux versions ; calculés sur le jeu de semence sinon, par la
	 * transcription du gel ci-dessus. Jamais les deux.
	 */
	const diffLignes = $derived<readonly Paire<string>[]>(
		comparaison ? comparaison.lignes : memeVersion ? [] : alignement(lignesDe(na), lignesDe(nbv))
	);
	const ajouts = $derived(diffLignes.filter((d) => d.etat === 'ajoute').length);
	const retraits = $derived(diffLignes.filter((d) => d.etat === 'retire').length);

	const rangees = $derived<readonly Paire<BlocDeContenu>[]>(
		comparaison
			? comparaison.rangees
			: memeVersion
				? []
				: alignement(contenu(na), contenu(nbv), (b: BlocDeContenu) => b.cle)
	);

	/** Deux blocs de même clé sont-ils le même bloc — `memeBloc()`, `V-16:2094`. */
	function memeBloc(a: BlocDeContenu | undefined, b: BlocDeContenu | undefined): boolean {
		return JSON.stringify(a) === JSON.stringify(b);
	}

	const touches = $derived(
		rangees.filter((r) => r.etat !== 'commun' || !memeBloc(r.a, r.b)).length
	);

	/* ── Le journal, mode Texte ───────────────────────────────────────────────
	   Transcription de `rendreTexte()` (`V-16:2022`). Les lignes conservées sont
	   les changements et leur contexte ; les intervalles sautés deviennent un
	   bouton de repli qui annonce combien de lignes il cache. */

	/** Lignes inchangées conservées autour d'un changement — `CONTEXTE`, `V-16:1998`. */
	const CONTEXTE = 2;

	interface LigneDeJournal {
		readonly sorte: 'ligne';
		readonly etat: EtatDePaire;
		readonly no: string;
		readonly nn: string;
		readonly marque: string;
		readonly nomDeMarque: string;
		readonly texte: string;
	}
	interface RepliDeJournal {
		readonly sorte: 'repli';
		readonly compte: number;
	}
	type EntreeDeJournal = LigneDeJournal | RepliDeJournal;

	const journal = $derived.by<EntreeDeJournal[]>(() => {
		const diff = diffLignes;
		const garder = new Array<boolean>(diff.length).fill(tout);
		if (!tout) {
			diff.forEach((d, k) => {
				if (d.etat === 'commun') return;
				for (let i = Math.max(0, k - CONTEXTE); i <= Math.min(diff.length - 1, k + CONTEXTE); i++)
					garder[i] = true;
			});
		}
		const entrees: EntreeDeJournal[] = [];
		let no = 0;
		let nn = 0;
		let sauteesDepuis: number | null = null;
		diff.forEach((d, k) => {
			if (d.etat !== 'ajoute') no++;
			if (d.etat !== 'retire') nn++;
			if (!garder[k]) {
				if (sauteesDepuis === null) sauteesDepuis = k;
				return;
			}
			if (sauteesDepuis !== null) {
				entrees.push({ sorte: 'repli', compte: k - sauteesDepuis });
				sauteesDepuis = null;
			}
			entrees.push({
				sorte: 'ligne',
				etat: d.etat,
				no: d.etat === 'ajoute' ? '' : String(no),
				nn: d.etat === 'retire' ? '' : String(nn),
				/* Le marqueur porte l'information : la teinte ne fait que la répéter. */
				marque: d.etat === 'ajoute' ? '+' : d.etat === 'retire' ? '−' : ' ',
				nomDeMarque:
					d.etat === 'ajoute'
						? 'ligne ajoutée'
						: d.etat === 'retire'
							? 'ligne retirée'
							: 'ligne inchangée',
				texte: (d.etat === 'ajoute' ? d.b : d.a) ?? ''
			});
		});
		if (sauteesDepuis !== null) {
			entrees.push({ sorte: 'repli', compte: diff.length - sauteesDepuis });
		}
		return entrees;
	});

	/* ── Le mode Visuel ───────────────────────────────────────────────────────
	   Transcription de `cellule()` (`V-16:2154`) et `rendreVisuel()`
	   (`V-16:2176`). Les blocs communs occupent la MÊME RANGÉE des deux côtés :
	   c'est l'alignement horizontal que C-05 et M07.3 demandent. */

	type EtatDeCellule = 'commun' | 'modifie' | 'retire' | 'ajoute';

	/** `LIBELLES`, `V-16:2152`. */
	const LIBELLES: Record<string, string> = {
		retire: 'Supprimé',
		ajoute: 'Ajouté',
		modifie: 'Réécrit'
	};

	function marqueDeCellule(etat: EtatDeCellule): string {
		return (etat === 'retire' ? '− ' : etat === 'ajoute' ? '+ ' : '± ') + LIBELLES[etat];
	}

	/* ── L'alternative textuelle ──────────────────────────────────────────────
	   Transcription de `alternative()` (`V-16:2207`) — la restitution linéaire
	   du mode visuel, exploitable en lecture d'écran. */

	function etiquetteDeBloc(b: BlocDeContenu): string {
		return b.type === 'h2' || b.type === 'h3'
			? 'titre « ' + b.texte + ' »'
			: b.type === 'code'
				? 'bloc de code ' + b.langage
				: b.type === 'tableau'
					? 'tableau'
					: b.type === 'figure'
						? 'schéma'
						: b.type === 'alerte'
							? 'encadré ' + b.niveau
							: b.type === 'taches'
								? 'liste de contrôle'
								: b.type === 'liste'
									? 'liste'
									: 'paragraphe';
	}

	const alternative = $derived.by<string[]>(() => {
		const lignes: string[] = [];
		for (const r of rangees) {
			const b = (r.a ?? r.b) as BlocDeContenu;
			const etiquette = etiquetteDeBloc(b);
			if (r.etat === 'retire') lignes.push('Supprimé : ' + etiquette + '.');
			else if (r.etat === 'ajoute') lignes.push('Ajouté : ' + etiquette + '.');
			else if (!memeBloc(r.a, r.b)) lignes.push('Réécrit : ' + etiquette + '.');
		}
		return lignes;
	});
</script>

<!--
	LE RENDU D'UN BLOC — `rendreBloc()` (`V-16:2096`). Neuf types, et rien
	d'autre : le corpus les ferme (`BlocDeContenu`, `seeds/corpus.ts:299`).

	La région est écrite serrée et soustraite au formateur : `prettier --write`
	réintroduit des blancs entre nœuds, que le relevé d'ordre de tabulation du
	niveau 1 lit dans le nom accessible (`CLAUDE.md` §6, P-6).
-->
<!-- prettier-ignore -->
{#snippet rendu(b: BlocDeContenu)}<div class="rendu"
	>{#if b.type === 'h2'}<h2>{b.texte}</h2
		>{:else if b.type === 'h3'}<h3>{b.texte}</h3
		>{:else if b.type === 'p'}<p>{b.texte}</p
		>{:else if b.type === 'liste'}<ul
			>{#each b.items as item, k (k)}<li>{item}</li>{/each}</ul
		>{:else if b.type === 'taches'}<ul class="rendu__taches"
			>{#each b.items as item, k (k)}<li
				><input type="checkbox" disabled /><span>{item}</span></li
			>{/each}</ul
		>{:else if b.type === 'code'}<span class="rendu__langage">{b.langage}</span
		><pre>{b.lignes.join('\n')}</pre
		>{:else if b.type === 'alerte'}<div class="rendu__alerte" data-niveau={b.niveau}
			><b>{b.titre}</b>{b.texte}</div
		>{:else if b.type === 'figure'}<div class="rendu__figure">{'◫ ' + b.legende}</div
		>{:else if b.type === 'tableau'}<table
			><thead><tr>{#each b.entetes as e, k (k)}<th>{e}</th>{/each}</tr></thead
			><tbody
				>{#each b.lignes as l, k (k)}<tr>{#each l as c, q (q)}<td>{c}</td>{/each}</tr>{/each}</tbody
			></table
		>{/if}</div
>{/snippet}

<!-- prettier-ignore -->
{#snippet cellule(bloc: BlocDeContenu | undefined, etat: EtatDeCellule, gauche: boolean)}{#if !bloc}<div
		class="cellule{gauche ? ' cellule--gauche' : ''}" data-etat="absent"
		><span class="cellule__vide">{gauche ? "n'existait pas" : 'supprimé'}</span></div
	>{:else}<div class="cellule{gauche ? ' cellule--gauche' : ''}" data-etat={etat}
		>{#if etat !== 'commun'}<span class="cellule__marque">{marqueDeCellule(etat)}</span
		>{/if}{@render rendu(bloc)}</div
	>{/if}{/snippet}

<Coquille
	forme="abregee"
	classeContenu="compare"
	idContenu="contenu"
	cibleEvitement="zone"
	libelleEvitement="Aller à la comparaison"
	{fil}
	{courant}
	donnees={{ 'data-mode': 'texte' }}
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
		<header class="tete-compare">
			<div>
				<span class="tete-compare__note etiq" id="nom-note">{NOTE.titre}</span>
				<div class="couple">
					<div class="borne borne--ancienne">
						<span class="borne__role etiq">Version d'origine</span>
						<div class="borne__n" id="a-n">Version {na}</div>
						<div class="borne__qui" id="a-qui">{qui(na)}</div>
					</div>
					<svg
						class="fleche"
						width="22"
						height="22"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"><path d="M2 8h11M9.5 4.5L13 8l-3.5 3.5" /></svg
					>
					<div class="borne borne--recente">
						<span class="borne__role etiq">Version comparée</span>
						<div class="borne__n" id="b-n">Version {nbv}</div>
						<div class="borne__qui" id="b-qui">{qui(nbv)}</div>
					</div>
				</div>
			</div>
			<div style="display:flex;gap:var(--e-2);flex-wrap:wrap">
				<button class="btn" id="retour-historique">Retour à l'historique</button>
				<button class="btn" id="retour-note">Retour à la note</button>
			</div>
		</header>

		<div class="outils">
			<div class="modes" role="tablist" aria-label="Mode de comparaison">
				<button role="tab" aria-selected="true" data-mode="texte">
					<svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"><path d="M2 3.5h12M2 6.8h9M2 10h12M2 13.2h7" /></svg
					>
					Texte
				</button>
				<button role="tab" aria-selected="false" data-mode="visuel">
					<svg
						width="14"
						height="14"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						><rect x="2" y="2.5" width="5" height="11" rx="1" /><rect
							x="9"
							y="2.5"
							width="5"
							height="11"
							rx="1"
						/></svg
					>
					Visuel
				</button>
			</div>
			<!-- prettier-ignore -->
			<div class="bilan" id="bilan"
				>{#if !memeVersion}<span class="bilan__plus">{'+' + ajouts + ' lignes'}</span
				><span class="bilan__moins">{'−' + retraits + ' lignes'}</span
				><span class="bilan__egal"
					>{'· ' + touches + ' blocs touchés sur ' + rangees.length}</span
				>{/if}</div
			>
		</div>

		<!-- prettier-ignore -->
		<div id="zone"
			>{#if memeVersion}<div class="etat-compare"
				><h2>Il n'y a rien à comparer</h2
				><p
					>{'Les deux bornes désignent la version ' +
						na +
						". Choisissez deux versions différentes dans l'historique pour voir un écart."}</p
				><button class="btn btn--principal">Retour à l'historique</button></div
			>{:else}<div class="journal si-texte"
				>{#each journal as e, k (k)}{#if e.sorte === 'repli'}<button
						class="repli-journal"
						type="button"
						><svg
							width="12"
							height="12"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"><path d="M5 6l3 3 3-3M5 10.5l3 3 3-3" /></svg
						><span>{e.compte + (e.compte > 1 ? ' lignes inchangées' : ' ligne inchangée')}</span
						></button
					>{:else}<div class="jl" data-etat={e.etat}
						><span class="jl__no">{e.no}</span
						><span class="jl__nn">{e.nn}</span
						><span class="jl__marque" aria-label={e.nomDeMarque}>{e.marque}</span
						><span class="jl__txt">{e.texte}</span></div
					>{/if}{/each}</div
			><div class="visuel si-visuel"
				><div class="visuel__entete etiq">Version {na}</div
				><div class="visuel__entete etiq">Version {nbv}</div
				>{#each rangees as r, k (k)}<div class="rangee"
					>{#if r.etat === 'commun'}{@render cellule(
							r.a,
							memeBloc(r.a, r.b) ? 'commun' : 'modifie',
							true
						)}{@render cellule(
							r.b,
							memeBloc(r.a, r.b) ? 'commun' : 'modifie',
							false
						)}{:else if r.etat === 'retire'}{@render cellule(r.a, 'retire', true)}{@render cellule(
							undefined,
							'retire',
							false
						)}{:else}{@render cellule(undefined, 'ajoute', true)}{@render cellule(
							r.b,
							'ajoute',
							false
						)}{/if}</div
				>{/each}</div
			><details class="alternative si-visuel"
				><summary>Lire la comparaison sous forme de liste</summary
				><div class="alternative__corps"
					>{#if alternative.length}<ol
						>{#each alternative as l, k (k)}<li>{l}</li>{/each}</ol
					>{:else}<p>Aucun bloc n'a changé.</p>{/if}</div
				></details
			>{/if}</div
		>
	{/snippet}
</Coquille>
