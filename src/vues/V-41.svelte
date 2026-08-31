<script lang="ts">
	/**
	 * V-41 — Bibliothèque de composants. La planche de référence du système visuel,
	 * et la seule vue qui montre l'inventaire fermé de `docs/DESIGN.md` §2 sur une
	 * page réelle.
	 *
	 * L'ENVELOPPE VIENT DU GABARIT (`ARB-023`) : `div.biblio` est une grille
	 * `208px minmax(0,1fr)` (`V-41:1460`) dont la première cellule est le sommaire
	 * et la seconde `<main class="corps-b" id="corps">`. Sans elle, `main` passe de
	 * 456 / 984 à 248 / 1060. `cibleEvitement` n'est PAS passée : `#corps` est
	 * l'identifiant du `<main>` de cette vue, seul le libellé lui est propre.
	 *
	 * LA FRAÎCHEUR VIENT DE L'IMPLÉMENTATION UNIQUE — `$lib/fraicheur.ts`
	 * (`ADR-005`) : aucune comparaison de seuil, aucun libellé, aucun décompte de
	 * barres n'est écrit ici.
	 *
	 * LES ÉCHANTILLONS TYPOGRAPHIQUES NE COÏNCIDENT PLUS AVEC LE CORPUS : quatre
	 * fragments illustrent un rendu et non une donnée, et portaient les noms du jeu
	 * de démonstration. Ce sont des exemples, comme « lorem ipsum » — ils disent
	 * désormais ce qu'ils sont (`Domaine`, `Sous-dossier`, `srv-exemple-01`).
	 *
	 * TOUTES LES DONNÉES VIENNENT DU CHARGEUR : les trois notes d'exemple sont les
	 * PREMIÈRES de chaque niveau dans l'ordre reçu, la barre de répartition compte
	 * les notes du premier domaine servi, l'arborescence se déduit de leur
	 * rangement, la chronologie lit le flux d'activité servi. Exception faite des
	 * trois indicateurs chiffrés, littéraux dans la maquette gelée.
	 *
	 * LA PAGE RESTE SERVIE EN PRODUCTION, et c'est le point (`STACK-TECHNIQUE.md`
	 * §4.1, risque `R-06`) : une planche sortie du produit construit cesse d'être
	 * une référence.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-41.css` ; les quatre-vingt-neuf
	 * valeurs de `style` reproduites appartiennent à l'ensemble clos du gel.
	 *
	 * LES RÉGIONS SONT SOUSTRAITES AU FORMATEUR : la maquette construit tout le
	 * corps en script, et le DOM de référence ne porte AUCUN nœud d'espacement
	 * entre éléments. Un blanc réintroduit se lit dans le `textContent` sur lequel
	 * le nom accessible se construit, et se voit au pixel entre deux éléments en
	 * ligne. Chaque `section.famille` est donc précédée de la directive du
	 * formateur, dans la forme exacte qu'il reconnaît.
	 */
	import type {
		Domaine,
		EtatDInstance,
		EvenementDActivite,
		NiveauFraicheur,
		Note,
		TypeDeNote,
		Univers,
		UtilisateurCourant
	} from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import type { Notification, TypeNotification } from '$lib/coquille/notifications';
	import { adresseDeNote } from '$lib/rangement/adresses';
	import { BARRES_DE_JAUGE, temoinFraicheur, type Temoin } from '$lib/fraicheur';
	import { vocabulaireRendu } from '$lib/vocabulaire';

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille : en constante,
	   le renommer en console ne changeait rien a l'ecran. Repli : « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);

	/**
	 * LA CLÉ D'ÉTAT N'EST PAS DÉCLARÉE : les onze états rendent LA MÊME PAGE, onze
	 * zones montrées côte à côte. Une propriété `etat` déclarée et jamais lue ferait
	 * croire à un pilotage qui n'existe pas.
	 */
	/**
	 * LES SEPT SOURCES, TOUTES EXIGÉES — ET C'EST CE QUI SORT LE CORPUS DU PAQUET.
	 * Elles retombaient sur les constantes de `seeds/corpus.ts`, et le coût
	 * principal n'était pas à l'écran : l'import était fait EN VALEUR, si bien que
	 * les trente-deux notes du corpus partaient dans un chunk de 57 Ko servi comme
	 * fichier statique, atteignable même par qui reçoit 404 sur la page. Exigées,
	 * il ne reste que des imports de TYPE, effacés à la compilation.
	 */
	interface Proprietes {
		notes: readonly Note[];
		univers: readonly Univers[];
		domaines: readonly Domaine[];
		compte: UtilisateurCourant;
		instance: EtatDInstance;
		activite: readonly EvenementDActivite[];
		typesNote: readonly TypeDeNote[];
	}

	const { notes, univers, domaines, compte, instance, activite, typesNote }: Proprietes = $props();

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

	/* Le témoin de fraîcheur — les trois exemples sont les PREMIÈRES notes de chaque
	   niveau dans l'ordre du corpus (`V-41:4064`). Aucun identifiant n'est écrit. */
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

	/* La barre de répartition — `barreRepartition(…)` du gel (`V-41:3696`). Les
	   parts nulles sont omises, de la barre comme de la légende.
	   LE DOMAINE ÉCHANTILLON EST LE PREMIER SERVI : le nom du gel était écrit en dur
	   et servait à FILTRER de vraies notes — sur une instance qui n'a pas ce
	   domaine, la barre se vidait sans rien dire. Aucun domaine : rien à mesurer. */
	const domaineEchantillon = $derived(domaines[0]?.nom ?? '');

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

	const notesDuDomaine = $derived(
		domaineEchantillon === '' ? [] : notes.filter((n) => n.domaine === domaineEchantillon)
	);

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

	/* L'arborescence des dossiers — `window.dossiersDuDomaine` (`V-41:2455`) :
	   aucune structure séparée, le rangement affiché est celui que portent les
	   chemins des notes. Une note compte pour le dossier TERMINAL de son chemin, et
	   l'ordre est celui de la première rencontre — le sélecteur du gel ne trie pas. */
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
			if (domaineEchantillon === '' || n.domaine !== domaineEchantillon || !n.dossier) continue;
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

	/* Les trois indicateurs chiffrés — LITTÉRAUX DANS LE GEL (`V-41:4413`) : ce sont
	   des SPÉCIMENS de composant, pas les indicateurs d'un tableau de bord. Les
	   dériver du corpus déplacerait les pixels d'une planche de référence. */
	const INDICATEURS: readonly (readonly [string, string, string, string])[] = [
		['1 240', 'consultations sur 7 jours', 'hausse', '▲ +12 %'],
		['59 %', 'recherches abouties', 'baisse', '▼ −4 %'],
		['32', 'notes publiées', 'stable', '= inchangé']
	];

	/** Les étiquettes de la démonstration de saisie — `creerEtiquettes` du gel. */
	const ETIQUETTES_DEMO: readonly string[] = ['postgresql', 'sauvegarde'];

	/* CE QUE LES CONTRÔLES DE CETTE PAGE FONT — ET POURQUOI ILS FONT QUELQUE CHOSE.
	   La bibliothèque est une PAGE RÉELLE, servie sous `/bibliotheque` derrière la
	   garde administrateur. Elle portait trente-cinq boutons et six liens sans aucun
	   écouteur : « Ouvrir une boîte » n'ouvrait rien, les en-têtes ne triaient rien,
	   et six `href="#"` rechargeaient la page.

	   LA RÈGLE POSÉE ICI, ET TENUE PARTOUT DANS CETTE VUE :
	     · un contrôle qui peut agir sur SA PROPRE démonstration AGIT ;
	     · un contrôle qui ne le peut pas N'EST PAS OFFERT AU CLIC — le spécimen de
	       style devient un `<span>` portant la même classe, donc le même pixel ;
	     · ce qu'aucun spécimen ne peut montrer est DIT en toutes lettres, à la place
	       du bouton mort, et nomme l'écran où le composant est en service. */

	/* ── La boîte de dialogue ─────────────────────────────────────────────── */
	let boiteDeDemonstration: HTMLDialogElement | null = $state(null);

	/* ── Les notifications — la vraie pile de la coquille ─────────────────── */
	const MODELES_DE_NOTIFICATION: Readonly<Record<TypeNotification, Notification>> = {
		succes: { type: 'succes', titre: 'Note enregistrée', detail: 'Spécimen de la bibliothèque.' },
		erreur: {
			type: 'erreur',
			titre: "L'enregistrement a échoué",
			detail: "Spécimen de la bibliothèque : rien n'a été écrit."
		},
		info: {
			type: 'info',
			titre: 'Cette note attend une vérification',
			detail: 'Spécimen de la bibliothèque.'
		},
		encours: { type: 'encours', titre: 'Import en cours', detail: '3 notes sur 8', progres: 38 }
	};

	const TYPES_DE_NOTIFICATION: readonly (readonly [TypeNotification, string])[] = [
		['succes', 'Succès'],
		['erreur', 'Erreur'],
		['info', 'Information'],
		['encours', 'En cours']
	];

	/* LA PILE NE FAIT QUE CROÎTRE, et c'est délibéré : la fermeture d'une bulle est
	   tenue par le câblage de la coquille, qui RETIRE le nœud du document. Réutiliser
	   le même rang rendrait la bulle suivante dans un nœud détaché — invisible. */
	let notifications: Notification[] = $state([]);

	function poserUneNotification(type: TypeNotification): void {
		notifications = [...notifications, MODELES_DE_NOTIFICATION[type]];
	}

	/* ── Les onglets ──────────────────────────────────────────────────────── */
	const ONGLETS_DEMO: readonly string[] = ['Identité', 'Sécurité', 'Distinctions', 'Activité'];
	let ongletDemo = $state(ONGLETS_DEMO[0] ?? '');

	/* ── Le tableau triable ───────────────────────────────────────────────── */
	type ColonneDeTri = 'titre' | 'domaine' | 'vues';
	type SensDeTri = 'ascending' | 'descending';

	let colonneDeTri: ColonneDeTri = $state('vues');
	let sensDeTri: SensDeTri = $state('descending');

	const lignesDuTableau = $derived.by(() => {
		const signe = sensDeTri === 'ascending' ? 1 : -1;
		return plusConsultees.slice().sort((a, b) => {
			if (colonneDeTri === 'vues') return signe * (a.vues - b.vues);
			const gauche = colonneDeTri === 'titre' ? a.titre : a.domaine;
			const droite = colonneDeTri === 'titre' ? b.titre : b.domaine;
			return signe * gauche.localeCompare(droite, 'fr');
		});
	});

	function trierLeTableau(colonne: ColonneDeTri): void {
		if (colonne === colonneDeTri) {
			sensDeTri = sensDeTri === 'ascending' ? 'descending' : 'ascending';
			return;
		}
		colonneDeTri = colonne;
		sensDeTri = colonne === 'vues' ? 'descending' : 'ascending';
	}

	/* ── La pagination ────────────────────────────────────────────────────── */
	/* NEUF PAGES : le pied du spécimen annonce « 180 notes · 20 par page », et c'est
	   le compte du gel. `null` est un saut. */
	const PAGES_DEMO = 9;
	let pageDemo = $state(2);

	const rangsDeLaPagination = $derived.by(() => {
		const rangs: (number | null)[] = [1];
		const debut = Math.max(2, pageDemo - 1);
		const fin = Math.min(PAGES_DEMO - 1, pageDemo + 1);
		if (debut > 2) rangs.push(null);
		for (let rang = debut; rang <= fin; rang += 1) rangs.push(rang);
		if (fin < PAGES_DEMO - 1) rangs.push(null);
		rangs.push(PAGES_DEMO);
		return rangs;
	});

	/* ── La saisie d'étiquettes ───────────────────────────────────────────── */
	let etiquettesDemo: string[] = $state([...ETIQUETTES_DEMO]);
	let etiquetteFrappee = $state('');

	function ajouterLEtiquette(evenement: KeyboardEvent): void {
		if (evenement.key !== 'Enter') return;
		evenement.preventDefault();
		const nom = etiquetteFrappee.trim();
		etiquetteFrappee = '';
		if (nom === '' || etiquettesDemo.includes(nom)) return;
		etiquettesDemo = [...etiquettesDemo, nom];
	}

	/* ── Le menu contextuel ───────────────────────────────────────────────── */
	let choixDuMenu: string | null = $state(null);

	/* ── La carte de résultat ─────────────────────────────────────────────── */
	/* LA CARTE MÈNE À LA NOTE QU'ELLE MONTRE : elle portait `href="#"` alors qu'elle
	   affiche une note RÉELLE du chargeur, titre, chemin et témoin compris. */
	const adresseDeLaCarte = $derived(
		noteDeCarte === undefined ? undefined : adresseDeNote(noteDeCarte.id)
	);
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
{#snippet fleche(sens: SensDeTri)}<svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor">{#if sens === 'ascending'}<path d="M1 6.5h8L5 2z"/>{:else}<path d="M1 3.5h8L5 8z"/>{/if}</svg>{/snippet}

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
	{notifications}
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
		<section class="famille" id="fraicheur"><h2 class="famille__nom">Signal de fraîcheur</h2><p class="famille__sous">La signature du produit. Trois niveaux, jamais portés par la couleur seule : une jauge à trois barres étagées, un libellé en clair, et des hachures sur l'obsolète. Un seul constructeur les produit tous, dans toutes les vues.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Témoin, trois niveaux</div><div class="compo__quand">Partout où une note apparaît : carte de résultat, ligne de liste, panneau de relations, cartographie. <b>Ne jamais afficher une note sans son témoin</b> — c'est le renseignement qui décide si l'on peut s'y fier.</div></div><div class="compo__demo">{#each exemples as n (n.id)}{@const t = temoinFraicheur(n)}<div class="echantillon">{@render temoin(t)}<span class="echantillon__nom">{t.libelle}</span></div>{/each}</div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Témoin avec date</div><div class="compo__quand">En tête de note (V-14) et dans le cartouche de contrôle, où l'on a la place de dater le dernier contrôle.</div></div><div class="compo__demo compo__demo--pile">{#each exemples as n (n.id)}{@const t = temoinFraicheur(n)}<div class="echantillon"><span style="display:inline-flex;align-items:center;gap:var(--e-1)">{@render temoin(t)}<span style="font-family:var(--f-donnee);font-size:var(--t-mini);color:var(--c-encre-3)">{' · vérifiée le ' + n.revise}</span></span><span class="echantillon__nom">{t.libelle}</span></div>{/each}</div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Barre de répartition</div><div class="compo__quand">Sur une page de domaine, d'univers ou de dossier : la santé d'un ensemble en un coup d'œil. Chaque part est cliquable et mène à la liste filtrée correspondante.</div></div><div class="compo__demo compo__demo--pile"><div class="repart" role="img" aria-label={libelleRepartition}>{#each repartition as p (p.cle)}{@const l = accord(p.compte, p.pluriel, p.singulier) + ' · ' + domaineEchantillon}<span class={p.classe} title={l} style="flex:{p.compte}"></span>{/each}</div><div class="legende">{#each repartition as p (p.cle)}<span><i class={p.classe}></i><b>{p.compte}</b> {p.compte > 1 ? p.pluriel : p.singulier}</span>{/each}</div></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="boutons"><h2 class="famille__nom">Boutons</h2><p class="famille__sous">Une seule action principale par écran, et jamais deux boutons pleins côte à côte. Le poids visuel dit la hiérarchie : si tout est important, plus rien ne l'est.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Variantes</div><div class="compo__quand"><b>Principale</b> : l'action attendue de l'écran, une seule. <b>Secondaire</b> : les actions courantes. <b>Discrète</b> : les actions d'appoint, dans les barres denses. <b>Destructive</b> : tout ce qui détruit, toujours détachée des actions neutres.</div></div><div class="compo__demo"><div class="echantillon"><span class="btn btn--principal">Enregistrer</span><span class="echantillon__nom">btn--principal</span></div><div class="echantillon"><span class="btn">Annuler</span><span class="echantillon__nom">btn</span></div><div class="echantillon"><span class="btn btn--discret">Options</span><span class="echantillon__nom">btn--discret</span></div><div class="echantillon"><span class="btn btn--destructif">Supprimer</span><span class="echantillon__nom">btn--destructif</span></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Avec pictogramme</div><div class="compo__quand">Le pictogramme précède toujours le libellé et ne le remplace jamais, sauf dans une barre d'outils où l'infobulle prend le relais.</div></div><div class="compo__demo"><div class="echantillon"><span class="btn btn--principal"><span style="line-height:0">{@render plus()}</span>Nouvelle note</span><span class="echantillon__nom">principale</span></div><div class="echantillon"><span class="btn"><span style="line-height:0">{@render plus()}</span>Ajouter</span><span class="echantillon__nom">secondaire</span></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">États</div><div class="compo__quand">Le focus visible est <b>obligatoire</b> : il conditionne l'usage au clavier. Un bouton désactivé doit être rare — préférer masquer une action interdite plutôt que la montrer inaccessible.</div></div><div class="compo__demo"><div class="echantillon"><span class="btn">Normal</span><span class="echantillon__nom">normal</span></div><div class="echantillon"><span class="btn" style="outline:2px solid var(--c-accent);outline-offset:2px">Focus</span><span class="echantillon__nom">focus</span></div><div class="echantillon"><button class="btn" type="button" disabled>Désactivé</button><span class="echantillon__nom">désactivé</span></div><div class="echantillon"><button class="btn" type="button" disabled><span style="width:12px;height:12px;border:2px solid var(--c-trait-fort);border-top-color:var(--c-accent);border-radius:50%;animation:tourne-notif .7s linear infinite;display:inline-block"></span>Enregistrement…</button><span class="echantillon__nom">en attente</span></div></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="champs"><h2 class="famille__nom">Champs de saisie</h2><p class="famille__sous">Toujours une étiquette au-dessus, jamais dans le champ : une étiquette flottante disparaît au moment précis où l'on en aurait besoin. L'aide est sous le champ, l'erreur remplace l'aide.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Texte, quatre états</div><div class="compo__quand">L'erreur est <b>toujours accompagnée de son motif</b>, jamais d'un simple contour rouge. Le message dit ce qui ne va pas et ce qu'il faut faire.</div></div><div class="compo__demo compo__demo--grille"><div class="champ" style="width:100%"><!-- svelte-ignore a11y_label_has_associated_control --><label class="champ__label">Normal</label><input class="saisie" type="text" placeholder="Saisie"/></div><div class="champ" style="width:100%"><!-- svelte-ignore a11y_label_has_associated_control --><label class="champ__label">Focus</label><input class="saisie" type="text" placeholder="Saisie" style="border-color:var(--c-accent);box-shadow:0 0 0 3px var(--c-accent-voile)"/></div><div class="champ" data-etat="erreur" style="width:100%"><!-- svelte-ignore a11y_label_has_associated_control --><label class="champ__label">Erreur</label><input class="saisie" type="text" placeholder="Saisie" value="valeur refusée"/><div class="champ__erreur"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" style="flex:none;margin-top:1px"><path d="M8 4.5v4M8 11.2v.3"/><circle cx="8" cy="8" r="6.2"/></svg>Ce nom est déjà pris dans ce dossier.</div></div><div class="champ" style="width:100%"><!-- svelte-ignore a11y_label_has_associated_control --><label class="champ__label">Désactivé</label><input class="saisie" type="text" placeholder="Saisie" value="Non modifiable" disabled/><span class="champ__aide">Attribué par un administrateur.</span></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Zone longue et sélecteur</div><div class="compo__quand">La zone longue pour tout texte de plus d'une ligne. Le sélecteur quand les valeurs possibles sont connues, fermées et peu nombreuses.</div></div><div class="compo__demo compo__demo--grille"><div class="champ" style="width:100%"><!-- svelte-ignore a11y_label_has_associated_control --><label class="champ__label">Zone longue</label><textarea class="saisie" rows="3" placeholder="Description…"></textarea></div>{#if typesNote.length > 0}<div class="champ" style="width:100%"><!-- svelte-ignore a11y_label_has_associated_control --><label class="champ__label">Sélecteur</label><select class="saisie" style="cursor:pointer">{#each typesNote as t (t)}<option>{t}</option>{/each}</select></div>{/if}</div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Sélecteur arborescent</div><div class="compo__quand">Pour choisir un dossier : la hiérarchie doit rester lisible pendant le choix, ce qu'un menu déroulant à chemins concaténés ne permet pas.</div></div><div class="compo__demo compo__demo--pile"><div class="dossier-choix-b">{@render branche(dossiers)}</div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Case, interrupteur, étiquettes</div><div class="compo__quand">La <b>case</b> pour un choix qui sera validé avec le formulaire ; l'<b>interrupteur</b> pour un réglage qui prend effet immédiatement. Les confondre trompe sur le moment où l'action se produit.</div></div><div class="compo__demo compo__demo--pile"><div class="echantillon"><label class="case"><input type="checkbox" checked/><span class="case__txt">Inclure les brouillons</span></label><span class="echantillon__nom">case</span></div><div class="echantillon"><label class="interrupteur"><input type="checkbox" checked/><span class="interrupteur__piste"></span><span>Notifications par courriel</span></label><span class="echantillon__nom">interrupteur</span></div><div class="echantillon"><div style="position:relative;width:280px"><div class="etq-boite">{#each etiquettesDemo as e (e)}<span class="etq">{e}<button type="button" aria-label="Retirer l'étiquette {e}" onclick={() => (etiquettesDemo = etiquettesDemo.filter((autre) => autre !== e))}>{@render croix(11, '2.2')}</button></span>{/each}<input type="text" placeholder="Ajouter…" id="etq-demo" bind:value={etiquetteFrappee} onkeydown={ajouterLEtiquette}/></div><div class="etq-suggestions" id="sug-demo"></div></div><span class="echantillon__nom">saisie d'étiquettes</span></div></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="pastilles"><h2 class="famille__nom">Pastilles et marqueurs</h2><p class="famille__sous">Des étiquettes courtes qui qualifient sans commenter. Elles ne portent jamais d'action, sauf le filtre actif, dont la croix est explicite.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Familles de pastilles</div><div class="compo__quand">Le <b>domaine</b> porte sa teinte d'identification, le <b>type</b> reste neutre, l'<b>étiquette</b> est en monospace avec son croisillon. Le brouillon est hachuré comme l'obsolète : ce n'est pas encore publiable.</div></div><div class="compo__demo"><div class="echantillon"><span class="past"><i style="width:8px;height:8px;border-radius:2px;background:#453ba0;display:inline-block;margin-right:6px"></i>Domaine</span><span class="echantillon__nom">past--domaine</span></div><div class="echantillon"><span class="past past--type">Procédure</span><span class="echantillon__nom">past--type</span></div><div class="echantillon"><span class="past past--type">Serveur</span><span class="echantillon__nom">type de {motFicheMinuscule}</span></div><div class="echantillon"><span class="past past--etiquette">postgresql</span><span class="echantillon__nom">past--etiquette</span></div><div class="echantillon"><span class="past" style="border-color:#dcc59a;color:var(--c-alerte);background-image:repeating-linear-gradient(135deg,transparent,transparent 3px,rgba(143,92,0,.12) 3px,rgba(143,92,0,.12) 6px)">brouillon</span><span class="echantillon__nom">brouillon</span></div><div class="echantillon"><span class="past" style="border-color:var(--c-accent-trait);background:var(--c-accent-voile);color:var(--c-accent-fonce);gap:5px">Type : Procédure<span style="line-height:0;color:inherit">{@render croix(11, '2.4')}</span></span><span class="echantillon__nom">filtre actif</span></div></div></section></section>

		<!-- eslint-disable svelte/no-navigation-without-resolve -- l'adresse de la carte
			sort de la fabrique unique, `$lib/rangement/adresses.ts` (`ARB-001`), et la
			règle ne peut pas suivre l'expression du `href` jusque là. -->
		<!-- prettier-ignore -->
		<section class="famille" id="conteneurs"><h2 class="famille__nom">Conteneurs</h2><p class="famille__sous">Quatre niveaux de mise en boîte, du plus au moins engageant. Ne jamais en imbriquer deux du même type : deux cadres emboîtés ne hiérarchisent rien.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Carte de résultat</div><div class="compo__quand">Un objet cliquable dans une liste de résultats. Elle porte toujours le témoin de fraîcheur et le chemin de rangement.</div></div><div class="compo__demo compo__demo--pile">{#if noteDeCarte}<a class="carte" href={adresseDeLaCarte} data-index="0"><div class="carte__haut"><h2 class="carte__titre">{@render surligne(surligner(noteDeCarte.titre, REQUETE_DEMO))}</h2>{#if noteDeCarte.brouillon}<span class="past past--brouillon">Brouillon</span>{/if}<span class="past past--type">{noteDeCarte.typeFiche ? motFiche + ' ' + noteDeCarte.typeFiche : noteDeCarte.type}</span></div><p class="carte__extrait">{@render surligne(surligner(noteDeCarte.extrait, REQUETE_DEMO))}</p><div class="carte__signal">{@render temoin(temoinFraicheur(noteDeCarte))}{#if noteDeCarte.revise}<span class="carte__revision">Révisé le {noteDeCarte.revise}</span>{:else}<span class="carte__revision" data-jamais="oui">Jamais révisé</span>{/if}{#if noteDeCarte.operationnel}<span class="marque-op">↳ Trouvé dans le registre Opérationnel</span>{/if}</div><div class="carte__pied"><span class="carte__chemin"><span>{noteDeCarte.univers + ' › '}</span><b>{noteDeCarte.domaine}</b><span>{' › ' + noteDeCarte.dossier}</span></span><span class="sep">·</span><span>{noteDeCarte.auteur}</span><span class="sep">·</span><span>{nombre(noteDeCarte.vues)} consultations</span>{#if noteDeCarte.pj}<span class="sep">·</span><span>{noteDeCarte.pj}{noteDeCarte.pj > 1 ? ' pièces jointes' : ' pièce jointe'}</span>{/if}{#if noteDeCarte.visibilite === 'Publique'}<span class="sep">·</span><span class="carte__visibilite">Publique</span>{/if}</div></a>{/if}</div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Panneau</div><div class="compo__quand">Un regroupement thématique dans une page. En-tête étiqueté, corps aéré.</div></div><div class="compo__demo compo__demo--pile"><section class="panneau"><div class="panneau__tete"><span class="etiq">Relations</span><span class="chiffre">4</span></div><div class="panneau__corps"><div class="zone-etat__txt">Contenu du panneau.</div></div></section></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Encart</div><div class="compo__quand">Une remarque de second plan à l'intérieur d'un corps de texte. Filet latéral, jamais de fond coloré vif — un encart n'est pas une alerte.</div></div><div class="compo__demo compo__demo--pile"><div class="encart-b">Cette procédure suppose que la sauvegarde du jour soit terminée. Vérifiez-le avant de commencer.</div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Panneau latéral</div><div class="compo__quand">Un formulaire secondaire qui garde le contexte visible derrière lui — édition d'un objet de la console, historique d'une note. Préféré à la boîte de dialogue quand la saisie est longue.</div></div><div class="compo__demo"><div class="zone-etat__txt">Aucun spécimen : un panneau latéral s'ouvre sur le contexte qu'il garde visible, et cette page n'en a pas. Il est en service dans l'historique d'une note, où il se déploie sur la lecture.</div></div></section></section>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->

		<!-- prettier-ignore -->
		<section class="famille" id="navigation"><h2 class="famille__nom">Navigation</h2><p class="famille__sous">Dire où l'on est avant de dire où aller. Chaque composant de cette famille répond à « où suis-je », « que puis-je voir d'autre », ou « comment je reviens ».</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Fil d'Ariane</div><div class="compo__quand">En tête de chaque vue. Le dernier segment n'est jamais cliquable : c'est la page courante, et l'offrir au clic est une promesse vide.</div></div><div class="compo__demo compo__demo--pile"><nav class="fil"><span class="fil__specimen">Accueil</span><span>›</span><span class="fil__specimen">Univers</span><span>›</span><span class="fil__specimen">Domaine</span><span>›</span><span class="fil__specimen">Dossier</span><span>›</span><span class="fil__courant">Sous-dossier</span></nav></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Onglets</div><div class="compo__quand">Pour des vues alternatives d'un même objet — les quatre volets du profil, les registres d'une note. Jamais pour des objets différents : ce serait de la navigation déguisée.</div></div><div class="compo__demo compo__demo--pile"><div class="onglets-d">{#each ONGLETS_DEMO as onglet (onglet)}<button type="button" role="tab" aria-selected={onglet === ongletDemo} onclick={() => (ongletDemo = onglet)}>{onglet}</button>{/each}</div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Arborescence</div><div class="compo__quand">Le chevron déplie, le nom navigue. Deux cibles distinctes, toujours — c'est la règle posée en V-37 et tenue par le rail de gauche, qui en est l'exemplaire vivant.</div></div><div class="compo__demo compo__demo--pile"><div class="zone-etat__txt">Voir la navigation latérale de cette page : c'est le même composant, alimenté par le corpus.</div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Pagination</div><div class="compo__quand">Au-delà de cinquante éléments. Elle indique toujours la page courante et le total : « page 3 » sans savoir combien il y en a n'aide pas à décider.</div></div><div class="compo__demo"><div class="pagination"><button type="button" aria-label="Page précédente" disabled={pageDemo === 1} onclick={() => (pageDemo -= 1)}>‹</button>{#each rangsDeLaPagination as rang, k (k)}{#if rang === null}<span class="pagination__saut">…</span>{:else}<button type="button" aria-current={rang === pageDemo ? 'page' : undefined} onclick={() => (pageDemo = rang)}>{rang}</button>{/if}{/each}<button type="button" aria-label="Page suivante" disabled={pageDemo === PAGES_DEMO} onclick={() => (pageDemo += 1)}>›</button><span class="echantillon__nom" style="margin-left:var(--e-2)">180 notes · 20 par page</span></div></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="donnees"><h2 class="famille__nom">Restitution de données</h2><p class="famille__sous">Un chiffre seul ne décide de rien. Chacun de ces composants ajoute au chiffre ce qui permet d'en tirer une conclusion : une comparaison, une tendance, une part.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Tableau triable</div><div class="compo__quand">Pour des données homogènes et comparables colonne par colonne. L'en-tête trié porte <b>aria-sort</b> et une flèche : sans elle, on ne sait pas ce qui a été trié.</div></div><div class="compo__demo compo__demo--pile"><div class="tableau-boite" style="width:100%"><table class="tableau-tri"><thead><tr><th aria-sort={colonneDeTri === 'titre' ? sensDeTri : undefined}><button type="button" onclick={() => trierLeTableau('titre')}>Note {#if colonneDeTri === 'titre'}{@render fleche(sensDeTri)}{/if}</button></th><th aria-sort={colonneDeTri === 'domaine' ? sensDeTri : undefined}><button type="button" onclick={() => trierLeTableau('domaine')}>Domaine {#if colonneDeTri === 'domaine'}{@render fleche(sensDeTri)}{/if}</button></th><th aria-sort={colonneDeTri === 'vues' ? sensDeTri : undefined}><button type="button" onclick={() => trierLeTableau('vues')}>Vues {#if colonneDeTri === 'vues'}{@render fleche(sensDeTri)}{/if}</button></th></tr></thead><tbody>{#each lignesDuTableau as n (n.id)}<tr><td>{n.titre}</td><td>{n.domaine}</td><td class="n">{n.vues}</td></tr>{/each}</tbody></table></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Indicateur chiffré avec tendance</div><div class="compo__quand">La tendance est <b>indispensable</b> : 1 240 consultations ne veut rien dire, « 1 240, en hausse de 12 % » veut dire quelque chose. Une tendance stable se dit aussi.</div></div><div class="compo__demo">{#each INDICATEURS as [valeur, nom, sens, variation] (nom)}<div class="indicateur"><div class="indicateur__val">{valeur}</div><span class="indicateur__nom">{nom}</span><div class="tendance-c" data-sens={sens}>{variation}</div></div>{/each}</div></section>{#if evenements.length > 0}<section class="compo"><div class="compo__tete"><div class="compo__nom">Chronologie</div><div class="compo__quand">Pour une succession d'événements datés : historique d'une note, activité d'un compte. La pastille de gauche encode la nature de l'événement.</div></div><div class="compo__demo compo__demo--pile"><ul class="chrono">{#each evenements as e, k (k)}<li data-marque={k === 0 ? 'fait' : undefined}><div class="chrono__txt">{e.qui} — {e.detail || e.type}<span class="chrono__quand">il y a {e.heures} h</span></div></li>{/each}</ul></div></section>{/if}</section>

		<!-- prettier-ignore -->
		<section class="famille" id="superpositions"><h2 class="famille__nom">Superpositions</h2><p class="famille__sous">Tout ce qui passe au-dessus du contenu. Règle commune : ce qui exige une décision avant de continuer est une boîte de dialogue ; tout le reste doit pouvoir être ignoré.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Boîte de dialogue</div><div class="compo__quand">Piège le focus, se ferme à Échap, rend le focus à son déclencheur. Le catalogue complet est en V-40.</div></div><div class="compo__demo"><button class="btn btn--principal" type="button" onclick={() => boiteDeDemonstration?.showModal()}>Ouvrir une boîte</button></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Palette de recherche rapide</div><div class="compo__quand">Ctrl+K depuis n'importe où. Elle cherche, mais propose aussi les actions : c'est le raccourci universel du produit.</div></div><div class="compo__demo"><div class="zone-etat__txt">Aucun spécimen : la palette n'est pas encore une superposition. <kbd class="touche">Ctrl</kbd> <kbd class="touche">K</kbd> — depuis cette page comme depuis toute autre — ouvre aujourd'hui l'écran de recherche.</div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Menu contextuel</div><div class="compo__quand">Les actions d'un objet précis, ouvertes depuis lui. L'action destructive y est séparée par un filet et colorée : c'est le seul endroit où elle voisine des actions neutres.</div></div><div class="compo__demo"><div class="menu-ctx"><button type="button" onclick={() => (choixDuMenu = 'Ouvrir')}>Ouvrir<span class="menu-ctx__raccourci">Entrée</span></button><button type="button" onclick={() => (choixDuMenu = 'Modifier')}>Modifier<span class="menu-ctx__raccourci">E</span></button><button type="button" onclick={() => (choixDuMenu = 'Dupliquer')}>Dupliquer</button><div class="menu-ctx__sep"></div><button class="destructif" type="button" onclick={() => (choixDuMenu = 'Supprimer')}>Supprimer<span class="menu-ctx__raccourci">Suppr</span></button></div><span class="echantillon__nom" role="status">{choixDuMenu === null ? 'Aucune entrée choisie' : 'Entrée choisie : ' + choixDuMenu}</span></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Infobulle</div><div class="compo__quand">Un complément court sur un élément dont le sens n'est pas évident. <b>Jamais pour une information nécessaire</b> : elle est inaccessible au toucher et invisible à l'impression.</div></div><div class="compo__demo"><span class="infobulle-h"><span class="btn btn--discret">Survolez-moi</span><span class="infobulle">Dernière vérification il y a 12 jours</span></span></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="prose"><h2 class="famille__nom">Contenu rédigé</h2><p class="famille__sous">Le rendu de toutes les constructions de l'éditeur. La mesure du texte est bornée à 680 pixels ; seuls le code, les tableaux, les figures et les alertes débordent, parce qu'ils se lisent en balayage et non en ligne.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Constructions de l'éditeur</div><div class="compo__quand">Titres, listes, tâches, citation, code, tableau, alertes. Ce rendu est identique dans l'éditeur (V-17) et en lecture (V-14) : c'est le même fragment de style.</div></div><div class="compo__demo compo__demo--pile"><div class="prose"><h2>Titre de section</h2><p>Un paragraphe de corps rédigé, composé en Literata pour la lecture longue à l'écran. Il peut contenir du <strong>gras</strong>, de l'<em>italique</em>, du <code>code en ligne</code> et un <span class="lien-int">lien vers une autre note</span>.</p><h3>Sous-titre</h3><ul><li>Élément de liste à puces</li><li>Second élément</li></ul><ol><li>Première étape numérotée</li><li>Seconde étape</li></ol><ul class="taches"><li><input type="checkbox" checked/><span>Contrôle effectué</span></li><li><input type="checkbox"/><span>Contrôle à faire</span></li></ul><blockquote class="prose-cit">Une citation, ou une parole rapportée.</blockquote><div class="bloc-code"><div class="bloc-code__tete"><span class="etiq">bash</span></div><pre><code>restaurer --source srv-exemple-01 --vers /var/lib/exemple</code></pre></div><div class="tableau-boite"><table><thead><tr><th>Serveur</th><th>Rôle</th></tr></thead><tbody><tr><td>srv-exemple-01</td><td>Principal</td></tr><tr><td>srv-exemple-02</td><td>Réplica</td></tr></tbody></table></div><div class="alerte alerte--astuce"><div><div class="alerte__tete"><span class="alerte__glyphe">ASTUCE</span> Gagner du temps</div><div>Le raccourci Ctrl+K ouvre la recherche depuis n'importe où.</div></div></div><div class="alerte alerte--attention"><div><div class="alerte__tete"><span class="alerte__glyphe">ATTENTION</span> À savoir avant</div><div>La restauration ferme les connexions en cours.</div></div></div><div class="alerte alerte--danger"><div><div class="alerte__tete"><span class="alerte__glyphe">DANGER</span> Irréversible</div><div>Cette commande écrase le répertoire de données.</div></div></div><hr/><p>Un dernier paragraphe après le séparateur.</p></div></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="retours"><h2 class="famille__nom">Retours</h2><p class="famille__sous">Ce que le produit répond quand il a quelque chose à dire, rien à montrer, ou un problème. Les planches complètes sont en V-38 et V-39.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Notifications</div><div class="compo__quand">Quatre types. Le succès s'efface, l'erreur persiste et propose une issue, l'information est refermable, le suivi montre son avancement puis dit ce qu'il a produit.</div></div><div class="compo__demo">{#each TYPES_DE_NOTIFICATION as [type, libelle] (type)}<button class="btn" type="button" onclick={() => poserUneNotification(type)}>{libelle}</button>{/each}</div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">État vide</div><div class="compo__quand">Un titre qui nomme la situation, une phrase qui explique, une action qui en sort. <b>« Il n'y a rien » et « vos filtres ne renvoient rien » ne se confondent jamais.</b></div></div><div class="compo__demo compo__demo--pile"><div style="background:var(--c-papier);border:1px dashed var(--c-trait-fort);border-radius:var(--r-3);padding:var(--e-5) var(--e-4);text-align:center;width:100%"><div style="font-family:var(--f-ui);font-size:var(--t-t3);font-weight:var(--g-lourd);margin-bottom:var(--e-2)">Ce dossier est vide</div><p style="font-family:var(--f-lecture);font-size:var(--t-petit);color:var(--c-encre-2);margin:0 auto var(--e-4);max-width:42ch;line-height:1.6">Aucune note n'y est rangée pour l'instant, et il ne contient aucun sous-dossier.</p><div style="display:flex;gap:var(--e-2);justify-content:center;flex-wrap:wrap"><span class="btn btn--principal">Créer une note ici</span><span class="btn">Créer un sous-dossier</span></div></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">État de chargement</div><div class="compo__quand">Une esquisse de la structure qui arrive, jamais un rouet universel : l'utilisateur doit deviner ce qui va s'afficher.</div></div><div class="compo__demo compo__demo--pile"><div class="sq-carte" style="width:100%"><div class="sq-carte__tete"><div class="sq sq--fort" style="width:26px;height:26px;border-radius:4px;flex:none"></div><div class="sq sq-l sq-l--titre sq--fort" style="width:64%"></div></div><div class="sq-pile">{#each ['100%', '86%'] as largeur (largeur)}<div class="sq sq-l" style="width:{largeur}"></div>{/each}</div></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">État d'erreur local</div><div class="compo__quand">La panne d'un panneau ne condamne pas l'écran. Le message dit ce qui continue de fonctionner et propose de réessayer.</div></div><div class="compo__demo compo__demo--pile"><div style="border:1px solid #e2b8b0;border-left:4px solid var(--c-danger);border-radius:var(--r-3);background:var(--c-danger-voile);padding:var(--e-4);width:100%"><div style="font-size:var(--t-petit);font-weight:var(--g-fort);color:var(--c-danger);margin-bottom:var(--e-1)">Ce panneau n'a pas pu se charger</div><div style="font-size:var(--t-mini);color:var(--c-encre-2);line-height:1.5;margin-bottom:var(--e-3)">Le reste de la note s'affiche normalement : vous pouvez continuer à lire et à écrire.</div><span class="btn">Réessayer</span></div></div></section></section>

		<!-- prettier-ignore -->
		<section class="famille" id="identite"><h2 class="famille__nom">Identité</h2><p class="famille__sous">Représenter les personnes et les gestes. Un avatar n'est jamais seul quand le nom peut tenir à côté : deux initiales ne suffisent pas à identifier un collègue.</p><section class="compo"><div class="compo__tete"><div class="compo__nom">Avatar et pile d'avatars</div><div class="compo__quand">L'avatar simple dans une ligne d'activité ou la barre supérieure. La <b>pile</b> quand plusieurs personnes ont contribué : au-delà de quatre, un compteur prend le relais.</div></div><div class="compo__demo"><div class="echantillon"><span class="avatar-p" style="width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--c-accent);color:#fff;font-size:var(--t-petit);font-weight:var(--g-lourd)">{compte.initiales}</span><span class="echantillon__nom">avatar</span></div><div class="echantillon"><div class="piles">{#each contributeurs.slice(0, 3) as c (c.nom)}<span class="avatar-p">{initiales(c.nom)}</span>{/each}{#if contributeurs.length > 3}<span class="avatar-p avatar-p--reste">+{contributeurs.length - 3}</span>{/if}</div><span class="echantillon__nom">pile d'avatars</span></div></div></section><section class="compo"><div class="compo__tete"><div class="compo__nom">Touche clavier</div><div class="compo__quand">Pour désigner une touche ou un raccourci dans un texte d'interface. Toujours la notation réelle du clavier, jamais une paraphrase.</div></div><div class="compo__demo"><div style="display:flex;align-items:center;gap:var(--e-2);font-size:var(--t-petit)">Ouvrir la recherche : <kbd class="touche">Ctrl</kbd><kbd class="touche">K</kbd> · Fermer : <kbd class="touche">Échap</kbd></div></div></section></section>
	{/snippet}

	<!--
		La boîte de démonstration, rendue HORS de `div.app`, à la place exacte du gel :
		après `div.app`, avant `div.notifs`. Elle est FERMÉE — le gel ne l'ouvre qu'au
		clic —, donc sans pixel et hors de l'instantané ARIA.
	-->
	{#snippet superposition()}
		<dialog class="dlg" id="d-demo" aria-labelledby="t-demo" bind:this={boiteDeDemonstration}>
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
					<button
						class="dlg__fermer"
						data-fermer=""
						aria-label="Fermer"
						onclick={() => boiteDeDemonstration?.close()}
					>
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
					<button class="btn" data-fermer="" onclick={() => boiteDeDemonstration?.close()}
						>Annuler</button
					>
					<button
						class="btn btn--principal"
						data-fermer=""
						onclick={() => boiteDeDemonstration?.close()}>Confirmer</button
					>
				</div>
			</div>
		</dialog>
	{/snippet}
</Coquille>
