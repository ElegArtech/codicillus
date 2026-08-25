<script lang="ts">
	/**
	 * V-21 — Carte mentale. Route `/carte-mentale` (`docs/routes.md` §3),
	 * atteinte par l'entrée de rail « Outils › Carte mentale ».
	 *
	 * AUCUNE STRUCTURE SÉPARÉE : « l'arborescence est celle du corpus, filtrée
	 * par ce que l'utilisateur a le droit de voir » (`V-21:2185`). Univers,
	 * domaines et dossiers sortaient de `seeds/corpus.ts` et du jeu de semence que
	 * le mode démo passe en propriété (`corpusPourVue('V-21')`, variante
	 * « cartographie », 27 notes) ; les dossiers sont DÉDUITS du champ `dossier`
	 * des notes, qu'aucune table ne double (`seeds/corpus.ts:84`).
	 *
	 * UN DOMAINE INTERDIT N'APPARAÎT PAS — il n'est pas grisé, il n'existe pas
	 * pour cette vue (P-09, `RG-M05-08`). L'état `dv-restreints` retire
	 * « Applications » de l'arbre ET du sélecteur de périmètre : vingt notes dans
	 * trois domaines au lieu de vingt-sept dans quatre. Ce lot NE DÉCLARE PAS
	 * `P-09` tenue : la batterie qui l'éprouve est `pnpm test:droits`.
	 *
	 * LE RENDU EST DU SVG DANS LE DOM (ADR-008, `STACK §4.4`). L'alternative
	 * exploitable est `div.liste-arbre#liste`, une liste imbriquée `treeitem`
	 * rendue en permanence et révélée par la bascule « Liste » — c'est la
	 * matière de `RG-M18-11`, que ce lot NE DÉCLARE PAS TENUE.
	 *
	 * TROIS ÉTATS — `verif/scenarios/V-21.json`, DEUX RENDUS DISTINCTS. Le
	 * relevé du gel donne `lent` STRICTEMENT IDENTIQUE à `dv-complets` : la case
	 * « Branches lentes » n'a AUCUN gestionnaire de `change`, elle n'est lue
	 * qu'au dépliage d'une branche (`V-21:2444`), donc jamais dans un squelette
	 * qui rend l'état et non la transition (ARB-011). Le sablier de branche
	 * (`enCours`) n'est atteint par aucun des trois états. Ce n'est pas un oubli
	 * à combler : c'est ce que la maquette montre.
	 *
	 * LES DEUX ÉTATS NE SONT PAS DÉPLIÉS PAREIL, ET C'EST LE GEL. Le chargement
	 * appelle `deplierNiveaux(2)` — univers et domaines ouverts —, tandis que le
	 * gestionnaire des droits appelle `deplierNiveaux(1)` — univers seuls
	 * (`V-21:2628`). `dv-restreints` montre donc ses domaines REPLIÉS. Mesuré,
	 * pas déduit.
	 *
	 * AUCUNE DISPOSITION SIMULÉE (ARB-011) : « Disposition — déterministe »
	 * (`V-21:2237`). Un nœud est placé à `profondeur × 244` et sa ligne à
	 * `rang × 34` ; un parent déplié se centre sur ses enfants. Le calque exact
	 * de la fabrique du gel est porté ici — mêmes constantes, mêmes opérations,
	 * même parcours suffixe, qui décide de l'ordre du balisage.
	 *
	 * V-21 NE PARTAGE RIEN AVEC V-19 NI V-20, ET C'EST MESURÉ. Elle ne porte ni
	 * type cartographique, ni forme de nœud, ni sous-graphe de relations :
	 * `$lib/graphe/cartographie.ts` ne lui sert à rien. Les trois vues du lot ne
	 * partagent que des NOMS DE CLASSE — `.scene`, `.voile`, `.controles`,
	 * `.outils-graphe` —, et ceux-là vivent dans la feuille de chaque vue
	 * (P-6.3), jamais dans une feuille commune.
	 *
	 * `.n`, `.branche`, `.chevron` SONT PROPRES À CETTE VUE. Le rail de la page,
	 * lui, emploie `.noeud` et `.noeud__chevron` avec les définitions de V-37 —
	 * `docs/DESIGN.md` §2.H. Les deux familles ne se touchent pas.
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette` et `dialog#palette`
	 * (divergence mesurée nulle, `docs/releve-vues.md` §4.1) et `div.planche`,
	 * bloc hors produit (§2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-21.css`, posé par `node verif/feuilles-de-vue.mjs V-21
	 * --installer` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import type { Domaine, Note, Univers } from '../../seeds/corpus';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import type { CompteAffiche } from '$lib/coquille/identite';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { adresseDeDossier, segmentsDeDossier } from '$lib/rangement/adresses';

	/**
	 * LE RANGEMENT EST EXIGÉ, L'IDENTITÉ A UN ÉTAT VIDE.
	 *
	 * `univers` et `domaines` étaient optionnels, de défaut la constante de
	 * `seeds/corpus.ts` : une route qui les oubliait dessinait l'arborescence du
	 * jeu de démonstration sans que rien ne proteste — et chacun de ses nœuds
	 * ouvrait une adresse en 404. La route les sert depuis la base, ils sont
	 * donc EXIGÉS, et une route qui les oublierait ne bâtirait plus.
	 *
	 * `compte` reste optionnelle, avec un ÉTAT VIDE pour défaut : aucune route
	 * ne la passe et le contexte de coquille porte l'identité réelle. `instance`
	 * a disparu — elle ne servait qu'à donner sa version au pied du rail, que le
	 * contexte sert déjà.
	 */
	interface Proprietes {
		/** Le vecteur complet de l'état — droits de vue × chargement. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-21')`. */
		notes: readonly Note[];
		/** Les univers du produit, tels que la base les porte. */
		univers: readonly Univers[];
		/** Les domaines du produit, tels que la base les porte. */
		domaines: readonly Domaine[];
		/** L'utilisateur courant. Absente, un compte VIDE — jamais celui du jeu. */
		compte?: CompteAffiche | null;
		/**
		 * LE PÉRIMÈTRE DEMANDÉ PAR L'ADRESSE — `?perimetre=`, sous la forme même du
		 * sélecteur du gel : `tout|`, `univers|{nom}` ou `domaine|{nom}`.
		 *
		 * Le gel garde le sien dans une clôture (`V-21:2605`) : une carte réduite
		 * ne s'envoie donc à personne, et le rechargement la ramène à tout le
		 * corpus. Absent, c'est « Tout le corpus » — la première option, celle que
		 * le gel a retenue au chargement, et l'état des trois positions de planche.
		 */
		perimetreDemande?: string | undefined;
	}

	const {
		vecteur,
		notes: corpus,
		univers,
		domaines,
		compte = null,
		perimetreDemande
	}: Proprietes = $props();

	/**
	 * LE COMPTE RENDU QUAND AUCUNE IDENTITÉ N'EST SERVIE — un état VIDE, jamais
	 * un compte du jeu de démonstration. En application, le contexte de coquille
	 * l'emporte et cette valeur n'atteint aucun écran.
	 */
	const COMPTE_VIDE = { nom: '', initiales: '', role: '', domaine: '' } satisfies CompteAffiche;
	const compteRendu = $derived(compte ?? COMPTE_VIDE);

	const reglage = $derived(vecteur ?? {});
	const restreint = $derived(reglage['dv'] === 'restreints');

	/**
	 * LES UNIVERS PROPOSÉS — les deux univers déclarés, sans l'univers SYSTÈME.
	 * `seeds/corpus.ts` en porte trois ; « Non classé », marqué `systeme: true`,
	 * est la destination de repli d'un domaine qui perd son rattachement, et
	 * aucun domaine ne s'y trouve. Le gel n'en connaît que deux (`V-21:1712`).
	 */
	const UNIVERS_PROPOSES = $derived(univers.filter((u) => !u.systeme));

	/**
	 * Les domaines que l'utilisateur a le droit de voir. « Un domaine interdit
	 * n'apparaît pas — il n'est pas grisé, il n'existe pas pour cette vue. »
	 */
	const domainesVisibles = $derived(
		restreint ? domaines.filter((d) => d.nom !== 'Applications') : domaines
	);

	/**
	 * LE PÉRIMÈTRE EFFECTIF. Une valeur illisible vaut « tout le corpus » : un
	 * périmètre inventé rendrait un arbre vide sans jamais dire pourquoi.
	 */
	const perimetre = $derived.by(() => {
		const brut = perimetreDemande ?? 'tout|';
		const barre = brut.indexOf('|');
		const type = barre < 0 ? brut : brut.slice(0, barre);
		const nom = barre < 0 ? '' : brut.slice(barre + 1);
		if ((type === 'univers' || type === 'domaine') && nom !== '') return { type, nom };
		return { type: 'tout', nom: '' };
	});

	/** Les deux rangs supérieurs, réduits au périmètre demandé. */
	const universDuPerimetre = $derived(
		perimetre.type === 'univers'
			? UNIVERS_PROPOSES.filter((u) => u.nom === perimetre.nom)
			: UNIVERS_PROPOSES
	);

	const domainesDuPerimetre = $derived(
		perimetre.type === 'domaine'
			? domainesVisibles.filter((d) => d.nom === perimetre.nom)
			: domainesVisibles
	);

	/**
	 * CHANGER DE PÉRIMÈTRE — l'adresse le porte, comme aux deux cartographies.
	 * `svelte/no-navigation-without-resolve` ne sait pas vérifier une adresse
	 * composée : la règle est levée sur cette seule ligne.
	 */
	function changerDePerimetre(valeur: string): void {
		const cible =
			valeur === 'tout|'
				? '/carte-mentale'
				: `/carte-mentale?perimetre=${encodeURIComponent(valeur)}`;
		/* eslint-disable-next-line svelte/no-navigation-without-resolve */
		void goto(cible);
	}

	/* ── L'arbre ────────────────────────────────────────────────────────────
	   Univers › domaine › dossiers (jusqu'à dix niveaux) › notes. Le rangement
	   affiché est celui qui existe : un dossier que le corpus ne porte pas ne
	   rend aucun nœud. */
	type Rang = 'univers' | 'domaine' | 'dossier' | 'note';

	interface NoeudMental {
		readonly cle: string;
		readonly rang: Rang;
		readonly nom: string;
		readonly couleur?: string;
		readonly enfants: NoeudMental[];
	}

	interface DossierBrut {
		readonly nom: string;
		readonly enfants: DossierBrut[];
	}

	/** L'arborescence de dossiers d'un domaine, déduite du champ `dossier`. */
	function dossiersDuDomaine(domaine: string): DossierBrut[] {
		const racines: DossierBrut[] = [];
		for (const n of corpus) {
			if (n.domaine !== domaine || !n.dossier) continue;
			let niveau = racines;
			for (const s of segmentsDeDossier(n.dossier)) {
				const existant = niveau.find((d) => d.nom === s);
				const noeud = existant ?? { nom: s, enfants: [] };
				if (!existant) niveau.push(noeud);
				niveau = noeud.enfants;
			}
		}
		return racines;
	}

	/** Les dossiers d'un niveau, classés à la française, avec leurs notes. */
	function brancheDeDossiers(
		niveau: readonly DossierBrut[],
		chemin: string,
		domaine: string
	): NoeudMental[] {
		return niveau
			.slice()
			.sort((x, y) => x.nom.localeCompare(y.nom, 'fr'))
			.map((d) => {
				const c = chemin ? `${chemin} › ${d.nom}` : d.nom;
				const enfants: NoeudMental[] = brancheDeDossiers(d.enfants, c, domaine);
				for (const n of corpus
					.filter((n) => n.domaine === domaine && n.dossier === c)
					.slice()
					.sort((x, y) => x.titre.localeCompare(y.titre, 'fr'))) {
					enfants.push({ cle: `n:${n.id}`, rang: 'note', nom: n.titre, enfants: [] });
				}
				return { cle: `f:${domaine}:${c}`, rang: 'dossier' as Rang, nom: d.nom, enfants };
			});
	}

	/** L'arbre complet, filtré par les droits de vue. Le périmètre reste « Tout
	 *  le corpus », première option du sélecteur au chargement. */
	const racine = $derived.by<NoeudMental[]>(() => {
		const universRendus: NoeudMental[] = [];
		for (const u of universDuPerimetre) {
			const doms = domainesDuPerimetre.filter((d) => d.univers === u.nom);
			if (!doms.length) continue;
			universRendus.push({
				cle: `u:${u.nom}`,
				rang: 'univers',
				nom: u.nom,
				couleur: u.couleur,
				enfants: doms.map((d) => ({
					cle: `d:${d.nom}`,
					rang: 'domaine' as Rang,
					nom: d.nom,
					couleur: d.couleur,
					enfants: brancheDeDossiers(dossiersDuDomaine(d.nom), '', d.nom)
				}))
			});
		}
		return universRendus;
	});

	/** Le nombre de notes d'une branche, tous niveaux confondus. */
	function compter(n: NoeudMental): number {
		if (n.rang === 'note') return 1;
		return n.enfants.reduce((s, e) => s + compter(e), 0);
	}

	/**
	 * LES BRANCHES DÉPLIÉES. Le chargement ouvre DEUX niveaux, le changement de
	 * droits n'en ouvre qu'UN — `V-21:2624` et `:2628`. C'est la seule
	 * différence de dépliage entre les deux rendus de la vue.
	 */
	function ouvertsJusque(profondeur: number): string[] {
		const ouverts: string[] = [];
		const parcourir = (noeuds: readonly NoeudMental[], niveau: number): void => {
			for (const n of noeuds) {
				if (niveau < profondeur && n.enfants.length) {
					ouverts.push(n.cle);
					parcourir(n.enfants, niveau + 1);
				}
			}
		};
		parcourir(racine, 0);
		return ouverts;
	}

	/**
	 * LE DÉPLIAGE DEVIENT UN ÉTAT, ET IL NE L'ÉTAIT PAS.
	 *
	 * Il était un DÉRIVÉ du vecteur : deux niveaux ouverts, toujours les mêmes,
	 * et rien ne pouvait en ouvrir un troisième. Les trois gestes que le gel
	 * dessine — le chevron d'une branche, « Déplier deux niveaux », « Tout
	 * replier » — n'avaient donc aucun effet possible, et un arbre qu'on ne peut
	 * pas déplier n'est pas un arbre.
	 *
	 * `null` SIGNIFIE « CE QUE LE DÉPLIAGE PAR DÉFAUT DONNE », et c'est ce qui
	 * tient le gel : tant qu'aucun geste n'a eu lieu, le rendu est celui du
	 * dérivé d'avant, à la branche près, et il suit les droits de vue comme
	 * avant. Le premier geste fige la liste, et elle vit ensuite pour elle-même.
	 */
	let ouvertesChoisies = $state<string[] | null>(null);

	const deplies = $derived(ouvertesChoisies ?? ouvertsJusque(restreint ? 1 : 2));

	/** La branche est-elle dépliée ? */
	const estDeplie = (cle: string): boolean => deplies.includes(cle);

	/** Le chevron d'une branche — `basculer()` du gel, `V-21:2421`. */
	function basculer(n: NoeudMental): void {
		const courantes = deplies;
		ouvertesChoisies = courantes.includes(n.cle)
			? courantes.filter((c) => c !== n.cle)
			: [...courantes, n.cle];
	}

	/**
	 * OUVRIR UN NŒUD — `ouvrir()` du gel, `V-21:2441`. Une note s'ouvre (V-14),
	 * un dossier s'ouvre (V-13), et tout ce qui porte des enfants se déplie.
	 *
	 * LES DEUX ADRESSES SORTENT DE LA FABRIQUE UNIQUE, jamais d'un gabarit écrit
	 * à la main : l'identifiant de note est plat et stable (`RG-M03-03`), le
	 * chemin de dossier est la forme canonique d'`ARB-001`. La clé d'un nœud les
	 * porte — `n:{identifiant}` et `f:{domaine}:{chemin}` —, c'est elle qu'on
	 * relit plutôt que de retraverser l'arbre.
	 */
	function ouvrir(n: NoeudMental): void {
		if (n.rang === 'note') {
			void goto(resolve('/notes/[identifiant]', { identifiant: n.cle.slice(2) }));
			return;
		}
		if (n.rang === 'dossier') {
			const reste = n.cle.slice(2);
			const separation = reste.indexOf(':');
			const domaine = reste.slice(0, separation);
			const chemin = reste.slice(separation + 1);
			const univers = domaines.find((d) => d.nom === domaine)?.univers;
			if (univers !== undefined) {
				/* eslint-disable-next-line svelte/no-navigation-without-resolve */
				void goto(adresseDeDossier(univers, domaine, segmentsDeDossier(chemin)));
				return;
			}
		}
		if (n.enfants.length) basculer(n);
	}

	/** « Déplier deux niveaux » et « Tout replier » — `V-21:2608` et `:2611`. */
	function deplierDeuxNiveaux(): void {
		ouvertesChoisies = ouvertsJusque(2);
	}

	function toutReplier(): void {
		ouvertesChoisies = [];
	}

	/* ── Disposition — déterministe ─────────────────────────────────────────
	   Le calque de `disposer()` du gel : parcours SUFFIXE, qui décide de
	   l'ordre du balisage rendu autant que des coordonnées. */
	const LARGEUR = 208;
	const HAUTEUR = 26;
	const PAS_X = 244;
	const PAS_Y = 34;

	interface LignePlacee {
		readonly noeud: NoeudMental;
		readonly x: number;
		readonly y: number;
	}

	const lignes = $derived.by<LignePlacee[]>(() => {
		const placees: LignePlacee[] = [];
		let y = 0;

		const placer = (n: NoeudMental, profondeur: number): number => {
			const x = profondeur * PAS_X;
			if (!estDeplie(n.cle) || !n.enfants.length) {
				const ligne = y * PAS_Y;
				y++;
				placees.push({ noeud: n, x, y: ligne });
				return ligne;
			}
			const enfantsPlaces = n.enfants.map((e) => placer(e, profondeur + 1));
			const ligne = (Math.min(...enfantsPlaces) + Math.max(...enfantsPlaces)) / 2;
			placees.push({ noeud: n, x, y: ligne });
			return ligne;
		};

		for (const u of racine) placer(u, 0);
		return placees;
	});

	const positions = $derived(new Map(lignes.map((l) => [l.noeud.cle, l])));

	/** Le cadrage de la scène : la boîte englobante, plus sa marge. */
	const boite = $derived.by(() => {
		let maxX = 0;
		let maxY = 0;
		for (const l of lignes) {
			maxX = Math.max(maxX, l.x + LARGEUR);
			maxY = Math.max(maxY, l.y + HAUTEUR);
		}
		return `-24 -24 ${maxX + 72} ${maxY + 48}`;
	});

	/** Les courbes de liaison, dans l'ordre du parcours suffixe. */
	interface Branche {
		readonly rang: Rang;
		readonly d: string;
	}

	const branches = $derived.by<Branche[]>(() => {
		const tracees: Branche[] = [];
		for (const l of lignes) {
			if (!estDeplie(l.noeud.cle)) continue;
			for (const e of l.noeud.enfants) {
				const p = positions.get(e.cle);
				if (!p) continue;
				const x1 = l.x + LARGEUR;
				const y1 = l.y + HAUTEUR / 2;
				const x2 = p.x;
				const y2 = p.y + HAUTEUR / 2;
				const m = (x1 + x2) / 2;
				tracees.push({ rang: e.rang, d: `M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2} ${y2}` });
			}
		}
		return tracees;
	});

	/** Le texte tenu dans la boîte du nœud, tronqué au-delà de sa largeur. */
	function texteAjuste(s: string): string {
		const max = Math.floor((LARGEUR - 46) / 6.5);
		return s.length > max ? `${s.slice(0, max - 1)}…` : s;
	}

	/** Le nom accessible d'un nœud : nom, rang, effectif, état de dépliage. */
	function libelleDuNoeud(n: NoeudMental): string {
		return (
			`${n.nom}, ${n.rang}` +
			(n.rang === 'note' ? '' : `, ${compter(n)} notes`) +
			(n.enfants.length ? (estDeplie(n.cle) ? ', déplié' : ', replié') : '')
		);
	}

	/** La largeur de la pastille de compteur, en fonction du nombre de chiffres. */
	const largeurCompteur = (total: number): number => String(total).length * 6 + 13;

	/* ── L'entête chiffré ───────────────────────────────────────────────────
	   Aucun chiffre n'est saisi (P-02) : les deux nombres sont comptés sur
	   l'arbre effectivement rendu. */
	const totalNotes = $derived(racine.reduce((s, u) => s + compter(u), 0));
	const totalDomaines = $derived(racine.reduce((s, u) => s + u.enfants.length, 0));
</script>

<!-- Le chevron d'une liste imbriquée — le glyphe du gel, à l'identique. -->
{#snippet chevronDeListe()}<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
		><path d="M3 1l4 4-4 4z" /></svg
	>{/snippet}

<!--
	La liste imbriquée — alternative textuelle et mode petit écran. Elle rend
	exactement les branches que l'arbre rend : même filtre de droits, même
	dépliage.
-->
{#snippet listeDe(noeuds: readonly NoeudMental[])}<ul role="group">
		{#each noeuds as n (n.cle)}<li role="none">
				<button
					class="la-noeud"
					type="button"
					role="treeitem"
					data-rang={n.rang}
					aria-expanded={n.enfants.length ? estDeplie(n.cle) : undefined}
					onclick={() => (n.enfants.length ? basculer(n) : ouvrir(n))}
					><span class="la-noeud__chev"
						>{#if n.enfants.length}{@render chevronDeListe()}{/if}</span
					>{#if n.couleur}<span class="la-noeud__puce" style="background:{n.couleur}"
						></span>{/if}<span class="la-noeud__nom">{n.nom}</span>{#if n.rang !== 'note'}<span
							class="la-noeud__n">{compter(n)}</span
						>{/if}</button
				>{#if n.enfants.length && estDeplie(n.cle)}{@render listeDe(n.enfants)}{/if}
			</li>{/each}
	</ul>{/snippet}

<Coquille
	forme="abregee"
	classeContenu="mentale"
	cibleEvitement="liste"
	libelleEvitement="Aller à l'arborescence"
	fil={['Accueil', 'Carte mentale']}
	donnees={{ 'data-affichage': 'arbre', 'data-droits-vue': restreint ? 'restreints' : 'complets' }}
	{univers}
	{domaines}
	notes={corpus}
	compte={{
		nom: compteRendu.nom,
		initiales: compteRendu.initiales,
		role: compteRendu.role,
		domaine: compteRendu.domaine
	}}
	version=""
>
	{#snippet enfants()}
		<div class="controles">
			<div style="display:flex;align-items:center;gap:var(--e-2)">
				<label class="etiq" for="perimetre">Périmètre</label>
				<select id="perimetre" onchange={(e) => changerDePerimetre(e.currentTarget.value)}
					><option value="tout|">Tout le corpus</option>{#each UNIVERS_PROPOSES as u (u.nom)}<option
							value="univers|{u.nom}">Univers {u.nom}</option
						>{/each}{#each domainesVisibles as d (d.nom)}<option value="domaine|{d.nom}"
							>Domaine {d.nom}</option
						>{/each}</select
				>
			</div>
			<span class="compte-global" id="compte-global"
				><b>{totalNotes}</b>{totalNotes > 1 ? ' notes dans ' : ' note dans '}<b>{totalDomaines}</b
				>{totalDomaines > 1 ? ' domaines' : ' domaine'}</span
			>

			<div
				class="bascule-affichage"
				style="display:flex;align-items:center;gap:var(--e-1);padding:2px;background:var(--c-fond-creux);border:1px solid var(--c-trait);border-radius:var(--r-2)"
			>
				<button
					type="button"
					class="btn btn--discret"
					data-affichage="arbre"
					aria-pressed="true"
					style="padding:5px 10px;font-size:var(--t-mini)">Arbre</button
				>
				<button
					type="button"
					class="btn btn--discret"
					data-affichage="liste"
					aria-pressed="false"
					style="padding:5px 10px;font-size:var(--t-mini)">Liste</button
				>
			</div>

			<div style="margin-left:auto;display:flex;gap:var(--e-2);flex-wrap:wrap">
				<button class="btn" id="deplier-2" onclick={deplierDeuxNiveaux}>Déplier deux niveaux</button
				>
				<button class="btn" id="replier" onclick={toutReplier}>Tout replier</button>
			</div>
		</div>

		<div class="scene" id="scene">
			<svg
				id="arbre"
				role="img"
				aria-label="Arborescence du corpus. Une liste imbriquée équivalente est disponible via la bascule Liste."
				viewBox={boite}
				><g id="racine" transform="translate(0,0) scale(1)"
					><g
						>{#each branches as b, rang (rang)}<path
								class="branche"
								data-rang={b.rang}
								d={b.d}
							/>{/each}</g
					><g
						>{#each lignes as l (l.noeud.cle)}{@const total = compter(l.noeud)}{@const largeurC =
								largeurCompteur(total)}<g
								class="n"
								data-rang={l.noeud.rang}
								data-cle={l.noeud.cle}
								data-courant="non"
								transform="translate({l.x},{l.y})"
								tabindex="0"
								role="treeitem"
								aria-label={libelleDuNoeud(l.noeud)}
								aria-expanded={l.noeud.enfants.length ? estDeplie(l.noeud.cle) : undefined}
								onclick={() => ouvrir(l.noeud)}
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										ouvrir(l.noeud);
									} else if (e.key === ' ' && l.noeud.enfants.length) {
										e.preventDefault();
										basculer(l.noeud);
									}
								}}
								><rect
									class="n__boite"
									width={LARGEUR}
									height={HAUTEUR}
									rx="4"
								/>{#if l.noeud.rang === 'domaine' && l.noeud.couleur}<rect
										class="n__rang-domaine"
										x="0"
										y="0"
										width="4"
										height={HAUTEUR}
										fill={l.noeud.couleur}
									/>{/if}<text
									class="n__txt"
									x={l.noeud.rang === 'domaine' ? 14 : 10}
									y={HAUTEUR / 2}>{texteAjuste(l.noeud.nom)}</text
								>{#if l.noeud.rang !== 'note' && total}<rect
										class="compteur-fond"
										x={LARGEUR - largeurC - 8}
										y="6"
										width={largeurC}
										height="14"
										rx="7"
									/><text class="n__compte" x={LARGEUR - largeurC / 2 - 8} y={HAUTEUR / 2}
										>{total}<title
											>{`${total}${total > 1 ? ' notes' : ' note'} dans cette branche`}</title
										></text
									>{/if}{#if l.noeud.enfants.length}<g
										class="chevron"
										transform="translate({LARGEUR + 11},{HAUTEUR / 2})"
										role="button"
										tabindex="-1"
										aria-label="{estDeplie(l.noeud.cle) ? 'Replier ' : 'Déplier '}{l.noeud.nom}"
										onclick={(e) => {
											e.stopPropagation();
											basculer(l.noeud);
										}}
										onkeydown={(e) => {
											if (e.key !== 'Enter' && e.key !== ' ') return;
											e.preventDefault();
											e.stopPropagation();
											basculer(l.noeud);
										}}
										><circle class="chevron__fond" r="9" /><path
											class="chevron__signe"
											d={estDeplie(l.noeud.cle) ? 'M-4 0 H4' : 'M-4 0 H4 M0 -4 V4'}
										/></g
									>{/if}</g
							>{/each}</g
					></g
				></svg
			>

			<div class="liste-arbre" id="liste" aria-label="Arborescence en liste">
				{#if racine.length}{@render listeDe(racine)}{/if}
			</div>

			<div class="outils-graphe">
				<button type="button" id="zoom-plus" aria-label="Agrandir" title="Agrandir">
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"><path d="M8 3.5v9M3.5 8h9" /></svg
					>
				</button>
				<button type="button" id="zoom-moins" aria-label="Réduire" title="Réduire">
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"><path d="M3.5 8h9" /></svg
					>
				</button>
				<button type="button" id="ajuster" aria-label="Recentrer" title="Recentrer">
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"><path d="M2 5.5V2.5h3M14 5.5V2.5h-3M2 10.5v3h3M14 10.5v3h-3" /></svg
					>
				</button>
			</div>

			<!--
				Le voile ne s'ouvre qu'à périmètre vide (`V-21:2276`). Aucun des trois
				états n'y est : sa boîte reste vide et `data-actif` vaut « non ».
			-->
			<div class="voile" id="voile" data-actif="non">
				<div class="voile__boite" id="voile-boite"></div>
			</div>
		</div>
	{/snippet}
</Coquille>
