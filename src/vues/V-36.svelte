<script lang="ts">
	/**
	 * V-36 — Console · Exports. Route `/console/exports` (`docs/routes.md`).
	 *
	 * L'ÉCRAN EST RENDU AU REPOS, `data-etat="repos"`, sans résultat ni
	 * progression : la préparation de l'archive est une MINUTERIE (`V-36:2992`)
	 * qui fait avancer `#barre` et bascule `data-etat`, et le squelette rend
	 * l'état, jamais la transition (`ARB-011`). `#etat` est donc `hidden`, comme au
	 * gel, et `#resultat` vide.
	 *
	 * TOUT CHIFFRE VIENT DU CORPUS. `apercuExport()` est le calque exact de
	 * `window.apercuExport` (`V-36:2661`), qui s'appuie sur `notesDuDomaine`,
	 * `dossiersDuDomaine` et `compterDossiers` (`V-36:2530`, `:1926`, `:1946`).
	 *
	 * LES NOMS DE L'ARCHIVE N'EN SORTENT PLUS : ils étaient des littéraux écrits
	 * ici, et ils avaient divergé de la fabrique sur cinq lignes d'un bloc de six.
	 * Ils viennent de `$lib/export/noms.ts`, la source que `construireLArchive()`
	 * lit elle-même. Le nom d'archive portait de surcroît `DATE_REFERENCE`, la date
	 * à laquelle le corpus de démonstration est figé : un écran branché sur une
	 * base annonçait toujours le même jour de 2026.
	 *
	 * LE DOMAINE COURANT EST LE PREMIER DE LA LISTE : le gel ne pose aucun
	 * `selected`, et `rendreRecap()` lit `select.value` (`V-36:3357-3364`).
	 *
	 * Coquille de forme abrégée, enveloppe `div.console`. V-36 n'a NI panneau
	 * `tiroir-form`, NI `data-form`, NI dialogue de suppression, NI tableau de
	 * gestion : c'est ce qui sépare les quatre pages des six registres.
	 * `data-etat="repos"` est transmis à `div.app` par `donnees` — le gel le pose
	 * (`V-36:1054`) et la feuille de la vue le lit.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-36.css` ; les six `style=`
	 * reproduits figurent tous à l'ensemble clos du gel.
	 */
	import type { Domaine, Note } from '../../seeds/corpus';
	import CoquilleDeConsole from '$lib/console/CoquilleDeConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	/* LES NOMS DE L'ARCHIVE VIENNENT DE LA FABRIQUE QUI LA PRODUIT, jamais de
	   littéraux écrits ici. `$lib/export/archive.ts` dépend de `node:zlib` et ne
	   peut pas entrer dans un paquet de navigateur ; `./noms` porte les noms seuls,
	   sans dépendance, et `archive.ts` les réexporte. Une définition, deux lecteurs. */
	import {
		DOSSIER_DES_PIECES,
		NOM_DU_RAPPORT,
		cheminDArchive,
		echapperSegment,
		nomDeFichierDeNote
	} from '$lib/export/noms';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille : en constante,
	   le renommer en console ne changeait rien a l'ecran. Repli : « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);
	const motFichePlurielMinuscule = $derived(motsDuProduit.fichesMin);

	interface Proprietes {
		/**
		 * Le corpus de la vue. C'est la SEULE propriété d'état qu'elle lit : ses
		 * quatre états rendent le même écran.
		 */
		notes: readonly Note[];
		/**
		 * LES DOMAINES DE L'INSTANCE, EXIGÉS — c'est le périmètre exportable. La
		 * propriété retombait sur le jeu de démonstration : le sélecteur d'export
		 * offrait trois domaines sur une instance qui n'en porte aucun, et le bouton
		 * menait à une archive qu'aucune adresse ne servait.
		 */
		domaines: readonly Domaine[];
		/**
		 * CE QUE LA VUE FAIT QUAND L'ARCHIVE EST DEMANDÉE. `P-03` — « une entrée
		 * visible est une entrée qui fonctionne » : le bouton est au gel et la route
		 * existe (`/console/exports/{univers}/{domaine}`), il ne manquait que le fil.
		 * La vue rend le NOM du domaine choisi ; la page sait à quelle adresse il
		 * correspond.
		 */
		onExporter?: (domaine: string) => void;
		/**
		 * LE NOM DE FICHIER QUE L'EXPORT PRODUIRA, PAR NOM DE DOMAINE — EXIGÉE.
		 * L'écran ANNONCE un nom d'archive et le composait de deux valeurs à lui :
		 * l'ardoise du nom d'affichage là où le fichier porte l'IDENTIFIANT du
		 * domaine, et `DATE_REFERENCE`. Servie, la table vient de `nomDArchive()` de
		 * `$lib/export/archive.ts`, celle-là même que le point de téléchargement
		 * appelle : le nom annoncé n'est pas RECONSTITUÉ, il est PRODUIT par sa
		 * source. Un domaine que la table ne nomme pas n'a pas d'arborescence rendue.
		 */
		nomsDArchive: Readonly<Record<string, string>>;
	}

	/*
	 * LE RAIL, LA BARRE ET LA VERSION NE PASSENT PLUS PAR ICI. Cette vue portait
	 * `univers`, `compte` et `instance` sans jamais les lire : elle ne faisait que
	 * les remettre à `CoquilleDeConsole`, qui retombait sur le jeu de démonstration.
	 */
	const { notes, domaines, onExporter, nomsDArchive }: Proprietes = $props();

	/* Le calque des fabriques du gel : un gel qui produit une valeur par une
	   fabrique n'admet pas qu'on la réécrive autrement (`ECART-020` É-3). Ces
	   quatre fonctions sont recopiées ligne à ligne, mêmes arguments. */

	/**
	 * `window.notesDuDomaine` (`V-36:2530`). LE CORPUS LU EST CELUI DE LA
	 * PROPRIÉTÉ : la fabrique du gel ferme sur `CORPUS`, et lire `CORPUS` ici
	 * revenait à décompter le jeu de semence quelle que soit la base servie.
	 * L'argument change, la fabrique non.
	 */
	const notesDuDomaine = (nom: string): readonly Note[] => notes.filter((n) => n.domaine === nom);

	interface NoeudDeDossier {
		enfants: Record<string, NoeudDeDossier>;
		notes: number;
	}

	/** `window.dossiersDuDomaine` (`V-36:1926`) — le rangement affiché est celui
	 *  qui existe : il se déduit du chemin des notes, jamais d'une table à part. */
	function dossiersDuDomaine(domaine: string): Record<string, NoeudDeDossier> {
		const racines: Record<string, NoeudDeDossier> = {};
		for (const n of notes) {
			if (n.domaine !== domaine || !n.dossier) continue;
			const segments = n.dossier
				.split('›')
				.map((s) => s.trim())
				.filter(Boolean);
			let niveau = racines;
			for (const s of segments) {
				const noeud = (niveau[s] ??= { enfants: {}, notes: 0 });
				niveau = noeud.enfants;
			}
			let courant = racines;
			segments.forEach((s, k) => {
				const noeud = courant[s];
				if (!noeud) return;
				if (k === segments.length - 1) noeud.notes++;
				courant = noeud.enfants;
			});
		}
		return racines;
	}

	/** `window.compterDossiers` (`V-36:1946`). */
	function compterDossiers(arbre: Record<string, NoeudDeDossier>): number {
		return Object.values(arbre).reduce((s, n) => s + 1 + compterDossiers(n.enfants), 0);
	}

	/** `window.apercuExport` (`V-36:2661`). L'estimation de volume est celle du
	 *  gel : « le texte pèse peu, les pièces jointes font le volume ». */
	function apercuExport(domaine: string) {
		const liste = notesDuDomaine(domaine);
		const arbre = dossiersDuDomaine(domaine);
		const pj = liste.reduce((s, n) => s + (n.pj ?? 0), 0);
		const mots = liste.reduce((s, n) => s + n.extrait.split(/\s+/).length * 14, 0);
		return {
			notes: liste.length,
			dossiers: compterDossiers(arbre),
			fiches: liste.filter((n) => n.type === 'Fiche').length,
			signets: liste.filter((n) => n.type === 'Signet').length,
			pieces: pj,
			octets: Math.round((mots * 6) / 1024) + pj * 780
		};
	}

	/** `volume()` (`V-36:2877`). */
	const volume = (ko: number): string =>
		ko < 1024 ? `${ko} Ko` : `${Math.round((ko / 1024) * 10) / 10} Mo`;

	/* `ardoise()` du gel (`V-36:2880`) a disparu avec son dernier lecteur : elle ne
	   servait qu'à recomposer le nom d'archive de repli, avec la date à laquelle le
	   jeu de démonstration est figé. */

	/* L'état rendu. Les agrégats d'export portent sur le corpus entier, comme au
	   gel — la vue de console administre l'instance, pas une variante. */
	/**
	 * LE DOMAINE CHOISI — `select#domaine` du gel, dont la valeur initiale est le
	 * premier de la liste. Au rendu serveur, `choisi` est vide et le premier
	 * s'applique.
	 */
	let choisi = $state('');
	const domaineCourant = $derived(
		/* `domaines[0]!` faisait tomber la page quand la liste est VIDE — une instance
		   neuve n'a aucun domaine, et l'export sortait en 500. La chaîne vide traverse
		   le reste sans rien affirmer. */
		choisi !== '' && domaines.some((d) => d.nom === choisi) ? choisi : (domaines[0]?.nom ?? '')
	);
	const apercu = $derived(apercuExport(domaineCourant));

	/** Les cinq lignes du récapitulatif, dans l'ordre du gel (`V-36:2894`). */
	const recapitulatif = $derived([
		['Notes', apercu.notes],
		[`dont ${motFichePlurielMinuscule}`, apercu.fiches],
		['dont signets', apercu.signets],
		['Dossiers', apercu.dossiers],
		['Pièces jointes', apercu.pieces]
	] as const);

	/**
	 * LE NOM DU FICHIER QUE L'EXPORT PRODUIRA, ou `null` quand il n'y en a pas. UNE
	 * INSTANCE NEUVE N'A AUCUN DOMAINE : la composition du gel rendait alors
	 * `-{date de semence}.zip`, un nom de fichier inventé. Sans domaine, il n'y a
	 * rien à nommer — l'arborescence d'archive n'est pas rendue du tout.
	 */
	const nomDeLArchive = $derived(
		domaineCourant === '' ? null : (nomsDArchive[domaineCourant] ?? null)
	);

	/**
	 * L'ARBORESCENCE D'ARCHIVE — CINQ LIGNES SUR CINQ ÉTAIENT FAUSSES. Cet écran
	 * DÉCRIT un artefact que l'utilisateur va ouvrir, et la description était
	 * composée de littéraux qui avaient divergé de la fabrique : un rapport en
	 * Markdown là où l'archive écrit du texte nu, un fichier d'index jamais produit,
	 * un nom de note mis en ardoise là où le fichier reprend le titre au caractère
	 * près, un dossier de pièces jointes sans le dossier par note, et pas de racine.
	 * PLUS AUCUN NOM N'EST ÉCRIT ICI : les trois noms et les deux fabriques viennent
	 * de `$lib/export/noms.ts`.
	 *
	 * CE QUE L'ARCHIVE CONTIENT (`export/archive.ts:765-818`) : une entrée par
	 * dossier du domaine, RACINE COMPRISE ; un fichier par note ; un dossier de
	 * pièces PAR NOTE sous le dossier voisin ; le rapport de conversion à la racine.
	 *
	 * LA RACINE EST NOMMÉE PAR LE NOM DU DOMAINE, ET C'EST EXACT TANT QUE LE DOMAINE
	 * N'A PAS ÉTÉ RENOMMÉ : l'archive range sous le nom du DOSSIER racine, que la
	 * création pose égal au nom du domaine mais que `modifierUnDomaine()` ne suit
	 * pas. Le nom du dossier racine n'atteint pas cet écran. Écart consigné.
	 *
	 * LE CHEMIN MONTRÉ EST CELUI D'UNE VRAIE NOTE : chaque segment sort du rangement
	 * de la note dont le nom de fichier est affiché en dessous.
	 */
	const archive = $derived.by(() => {
		const liste = notesDuDomaine(domaineCourant);
		const note = liste[0];
		/* `Note.dossier` n'affiche PAS la racine (`lecture.ts:295-299`) : elle porte le
		   nom du domaine et le rangement la sous-entend. L'archive, elle, l'écrit. */
		const sousLaRacine = (note?.dossier ?? '')
			.split('›')
			.map((s) => s.trim())
			.filter(Boolean);
		const avecPieces = liste.find((n) => n.pj > 0);

		/* Le tirage des branches : un seul enfant montré par niveau, donc un
		   dernier-né à chaque cran. Le trait vertical du premier cran tient parce que
		   l'entrée de racine qu'il prolonge est suivie d'autres. */
		const rameau = (profondeur: number, texte: string): string =>
			'│   ' + '    '.repeat(profondeur - 1) + '└── ' + texte + '\n';

		const dossiers = sousLaRacine
			.map((segment, rang) => rameau(rang + 1, echapperSegment(segment) + '/'))
			.join('');

		return {
			nom: nomDeLArchive,
			corps:
				`\n├── ${cheminDArchive([domaineCourant])}/\n` +
				dossiers +
				(note ? rameau(sousLaRacine.length + 1, nomDeFichierDeNote(note.titre)) : '') +
				(avecPieces
					? `├── ${DOSSIER_DES_PIECES}/\n` + rameau(1, echapperSegment(avecPieces.id) + '/')
					: '') +
				`└── ${NOM_DU_RAPPORT}`
		};
	});
</script>

<CoquilleDeConsole section="exports" {notes} donnees={{ 'data-etat': 'repos' }}>
	{#snippet enfants()}
		<TeteDeSection
			titre="Exports"
			description="Extraire un domaine entier dans un format ouvert, lisible sans le produit."
		/>

		<!--
			AUCUN BLANC ENTRE LES NŒUDS PORTEURS DE TEXTE, et il doit le rester : le nom
			accessible se construit sur `textContent`, où un blanc réintroduit par le
			formateur se voit. D'où les gardes de formatage ci-dessous, dont la forme est
			exacte et obligatoire — un commentaire rédigé autrement n'est pas reconnu.
		-->
		<!--
			CET ÉCRAN A PROMIS LA RÉIMPORTATION, ET ELLE N'EXISTE PAS. Le texte affirmait
			que « réimporter l'archive reconstitue le domaine à l'identique » ; aucun
			chemin d'import d'archive n'existe — l'import écarte le format d'archive
			(`donnees/import.ts:118`) et la relecture d'archive n'est appelée que par ses
			propres contrôles. Ce qui est vrai et qui se dit : l'archive est du texte, un
			fichier par note, rangé comme le domaine, métadonnées en tête.
		-->
		<!-- prettier-ignore -->
		<section class="reversible"
			><div class="reversible__ic"
				><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 2.5H5.5a1.5 1.5 0 0 0-1.5 1.5v16a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5V8.5L14 2.5H9zM14 2.5V8h5.5"/><path d="M7.5 12.5h9M7.5 16h6"/></svg
			></div
			><div
				><h2>Cet export s'ouvre sans ce produit</h2
				><p>L'archive est du texte : un fichier par note, rangé dans la même arborescence, avec ses métadonnées en tête de fichier. Elle se lit dans n'importe quel éditeur, se met sous gestion de versions et se conserve telle quelle. <b>La réimporter dans Codicillus n'est pas encore possible</b> : l'import accepte un dossier de fichiers, et écarte les archives.</p
			></div
		></section>

		<div class="grille-export">
			<div>
				<div class="champ" style="margin-bottom:var(--e-4)">
					<label class="champ__label" for="domaine">Domaine à exporter</label>
					<!-- prettier-ignore -->
					<select
						class="selecteur"
						id="domaine"
						disabled={domaines.length === 0}
						value={domaineCourant}
						onchange={(e) => (choisi = e.currentTarget.value)}
						>{#each domaines as d (d.nom)}<option value={d.nom}>{d.univers} › {d.nom} — {notesDuDomaine(d.nom).length} {accord(notesDuDomaine(d.nom).length, 'note')}</option>{:else}<option value="">Aucun domaine sur cette instance</option>{/each}</select
					>
					<!--
						CE QUI MANQUE, ET LE GESTE QUI DÉBLOQUE — sur l'instance neuve, et là
						seulement. Le sélecteur sortait VIDE, sans un mot, au-dessus d'un
						récapitulatif de zéros et d'un bouton qui ne pouvait rien préparer.
					-->
					{#if domaines.length === 0}<span class="champ__aide" id="aide-domaine"
							>Un export porte sur un domaine, et cette instance n'en porte aucun. Créez un univers,
							puis un domaine, dans la console — Console › Domaines — et ce sélecteur s'ouvrira sur
							lui.</span
						>{/if}
				</div>

				<span class="etiq" style="display:block;margin-bottom:var(--e-2)"
					>Ce que contient l'archive</span
				>

				<!-- prettier-ignore -->
				<div class="contenu-archive" id="contenu-archive"
					><div class="ca"
						><span class="ca__ic"><svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5zM9 1.5v4h4"/></svg></span
						><div
							><div class="ca__nom">Un fichier par note</div
							><div class="ca__txt">Au format Markdown, lisible dans n'importe quel éditeur de texte. Le nom du fichier reprend le titre de la note.</div
						></div
					></div
					><div class="ca"
						><span class="ca__ic"><svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1.5 4a1 1 0 0 1 1-1h3.2l1.4 1.6h6.4a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4z"/></svg></span
						><div
							><div class="ca__nom">L'arborescence de dossiers, reproduite</div
							><div class="ca__txt">{accord(apercu.dossiers, 'Le dossier du domaine devient un dossier', `Les ${apercu.dossiers} dossiers du domaine deviennent des dossiers`)} de l'archive, à la même place.</div
						></div
					></div
					><div class="ca"
						><span class="ca__ic"><svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="3" width="12" height="10" rx="1.4"/><path d="M2 6h12M5.5 9h5"/></svg></span
						><div
							><div class="ca__nom">Les métadonnées, en en-tête de chaque fichier</div
							><div class="ca__txt">Type, étiquettes, auteur, date de dernière vérification, visibilité et propriétés de {motFicheMinuscule}, dans un bloc <code>---</code> en tête de fichier. Rien de ce que porte une note n'est laissé au seul nom du fichier.</div
						></div
					></div
					><div class="ca"
						><span class="ca__ic"><svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="3" width="12" height="10" rx="1.4"/><circle cx="5.5" cy="6.5" r="1.2"/><path d="M2.5 11.5l3.5-3 3 2.5 2.5-2 2.5 2"/></svg></span
						><div
							><div class="ca__nom">Les images et pièces jointes</div
							><div class="ca__txt">{#if apercu.pieces}{accord(apercu.pieces, 'Le fichier joint est inclus', `Les ${apercu.pieces} fichiers joints sont inclus`)} dans un dossier voisin, et les notes y renvoient par chemin relatif.{:else}Ce domaine n'a aucune pièce jointe : l'archive ne contiendra que du texte.{/if}</div
						></div
					></div
					><div class="ca"
						><span class="ca__ic"><svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5zM5.5 9h5M5.5 11.5h3"/></svg></span
						><div
							><div class="ca__nom">Un rapport de conversion</div
							><div class="ca__txt">Liste ce qui n'a pas pu être rendu fidèlement en Markdown, avec la raison. À lire avant d'archiver.</div
						></div
					></div
					>{#if archive.nom !== null}<div class="arbo-archive"><b>{archive.nom}</b>{archive.corps}</div>{/if}</div
				>

				<div id="resultat"></div>
			</div>

			<!-- prettier-ignore -->
			<aside class="recap-export"
				><div class="recap-export__tete"
					><span class="etiq">Volume estimé</span
					><div class="recap-export__volume" id="volume">{volume(apercu.octets)}</div
				></div
				><div class="recap-export__corps"
					><div id="recap"
						>{#each recapitulatif as [nom, valeur] (nom)}<div class="re" data-nul={valeur ? 'non' : 'oui'}><span>{nom}</span><span class="re__n">{valeur}</span></div>{/each}</div
					><button
						class="btn btn--principal"
						id="exporter"
						type="button"
						disabled={domaineCourant === ''}
						onclick={() => onExporter?.(domaineCourant)}
						><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2v8.5M4.8 7.3L8 10.7l3.2-3.4M2.5 13.5h11"/></svg>
						Préparer l'archive</button
					><div class="etat-export" id="etat" hidden
						><div class="barre-progres"><i id="barre"></i></div
						><div class="etat-export__txt" id="etat-txt">—</div
					></div
				></div
			></aside>
		</div>
	{/snippet}
</CoquilleDeConsole>
