<script lang="ts">
	/**
	 * V-33 — Console · Configuration. Route `/console/configuration`.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * CE QUE LA PLANCHE CHOISIT, ET CE QU'ELLE NE CHOISIT PAS
	 *
	 * Les quatre états ne changent QUE LES DEUX SEUILS DE FRAÎCHEUR. Le gel
	 * l'écrit en une ligne (`V-33:3226-3231`) : le gestionnaire de la planche pose
	 * `#c-frais` et `#c-vieil`, puis rappelle `surSaisie()`. Tout le reste de
	 * l'écran — validation, aperçu d'impact, aperçu de vocabulaire, état du
	 * pied de page — en DÉCOULE. Aucun état n'est un écran séparé : ce sont
	 * quatre entrées d'une même fonction, et cette vue la reproduit.
	 *
	 * LES QUATRE COUPLES DE SEUILS SONT DES DONNÉES DE MAQUETTE, pas de
	 * corpus : `{ actuel: [90, 180], severe: [30, 60], large: [120, 240],
	 * invalide: [120, 90] }` (`V-33:3228`) — trois d'entre eux, du moins. Les
	 * couples `severe`, `large` et `invalide` sont des réglages HYPOTHÉTIQUES,
	 * choisis pour la revue : littéraux du gel, recopiés tels quels, la même
	 * situation que les trois adresses de planche de V-26.
	 *
	 * `actuel` N'EN EST PAS UN. Le gel l'étiquette « 90 / 180 · en vigueur »
	 * (`V-33:1427`) : ce n'est pas un quatrième réglage d'essai qui vaudrait
	 * 90 / 180 par coïncidence, c'est LA CONFIGURATION DE L'INSTANCE, celle que
	 * `CONFIG` porte. L'écrire en littéral en faisait un second jeu de seuils
	 * que rien ne liait au premier — ADR-005 interdit « toute duplication des
	 * seuils sous forme de constante littérale ailleurs que dans la
	 * configuration lue par l'implémentation unique ». Il en DÉRIVE désormais,
	 * et la chaîne de dérivation est écrite en un seul sens :
	 *
	 *   `SEUILS_PAR_DEFAUT` (`src/lib/fraicheur.ts`, l'implémentation unique)
	 *      → la configuration de l'instance, reçue en propriété `config`
	 *         (défaut : `CONFIG` de `seeds/corpus.ts`)
	 *         → `SEUILS_DE_PLANCHE.actuel` (ici, la position « en vigueur »)
	 *
	 * Les valeurs rendues sont inchangées : 90 et 180 des deux côtés.
	 *
	 * LE FORMULAIRE EST NOURRI PAR LA PROPRIÉTÉ `config` — les sept
	 * réglages, aucun en dur : seuils, versions conservées, portail
	 * d'assistance, libellé du concept, taille de pièce jointe, durée de
	 * session. `enregistre` du gel est cette même valeur (`V-33:2962`).
	 * Absente, la constante `CONFIG` du jeu de semence s'applique : la vue rend
	 * alors exactement ce qu'elle rendait (T-044).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * L'APERÇU D'IMPACT — UNE SEULE DÉFINITION DE LA FRAÎCHEUR (P-01)
	 *
	 * `niveauFraicheur()` de `$lib/fraicheur` EST `window.niveauPour`
	 * (`V-33:2667`), au caractère près, et prend ses seuils en paramètre. Rien
	 * n'est recalculé ici : `repartitionPour()` et `impactSeuils()` sont les
	 * calques de `V-33:2687` et `V-33:2674`, et ils l'appellent. ADR-005
	 * interdit une seconde définition ; `docs/releve-vues.md` §9 R-9 rappelle
	 * qu'aucun lot ne doit en écrire une troisième.
	 *
	 * `barreRepartition()` est le calque de `V-33:2897` — la barre de
	 * répartition de tout le produit. Les deux barres de la comparaison sont
	 * construites sur des notes FACTICES, et c'est le gel qui le fait
	 * (`V-33:3085-3089`) : il ne compte que le niveau, jamais la note.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * AUCUN COMPORTEMENT (ARB-011)
	 *
	 * Le gel attache `input`, `change` et `click` à sept champs et trois
	 * boutons ; tous appellent `surSaisie()`, `ecrire()` ou `notifier()`. Le
	 * squelette rend l'ÉTAT — les valeurs, les messages d'erreur, l'aperçu, le
	 * pied — et jamais la transition. Aucune minuterie n'est écrite.
	 *
	 * `autofocus` N'EST POSÉ NULLE PART : le gel ne focalise rien au
	 * chargement de V-33, et le banc floute de toute façon l'élément actif hors
	 * dialogue (CLAUDE.md §6, P-4).
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * LA COQUILLE ET LE MOTIF COMMUN
	 *
	 * Forme ABRÉGÉE (ARB-021), enveloppe `div.console` (ARB-023), treize
	 * classes du motif commun portées par `$lib/console/` — écrites par P-2,
	 * consommées ici (R-2). V-33 n'a NI panneau `tiroir-form`, NI `data-form`,
	 * NI dialogue de suppression, NI tableau de gestion, NI action en tête de
	 * section : `TeteDeSection` est appelée sans fragment d'action.
	 *
	 * `div.app` ne porte au gel que `data-rail` et `data-role` (`V-33:1075`) :
	 * aucun attribut de données n'est transmis.
	 *
	 * L'hôte de palette de V-09 n'est pas rendu — mesuré sans incidence sur
	 * trente maquettes (`docs/releve-vues.md` §4.1). `div.notifs` est vide.
	 *
	 * ═══════════════════════════════════════════════════════════════════════
	 * CE QUE CE COMPOSANT NE PROUVE PAS. Il rend un ÉTAT DE MAQUETTE. Ni
	 * `P-09`, ni `P-02`, ni `RG-M15-03` ne sont déclarées tenues par ce lot.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI. Le rendu vient de `src/socle.css`
	 * et de `src/vues/V-33.css`, extraite du gel. Cette feuille n'en est plus la
	 * copie à l'octet : les règles de `.repart` y suivent les `span` de
	 * l'aperçu d'impact (voir `barreRepartition` plus bas). Le rendu, lui, est
	 * inchangé. Les `style=` reproduits figurent tous à l'ensemble clos du gel.
	 */
	import {
		CONFIG,
		DOMAINES,
		INSTANCE,
		MOI,
		UNIVERS,
		type Configuration,
		type Domaine,
		type EtatDInstance,
		type NiveauFraicheur,
		type Note,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import { niveauFraicheur } from '$lib/fraicheur';
	import CoquilleDeConsole from '$lib/console/CoquilleDeConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import {
		motFiche,
		motFicheMinuscule,
		motFichePluriel,
		motFichePlurielMinuscule
	} from '$lib/vocabulaire';

	interface Proprietes {
		/** Le vecteur complet de l'état demandé, tel que le scénario le déclare. */
		vecteur?: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-33')`. */
		notes: readonly Note[];
		/** Les univers déclarés. Absente, la constante du jeu de semence s'applique. */
		univers?: readonly Univers[];
		/** Les domaines déclarés. Absente, la constante du jeu de semence s'applique. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Absente, la constante du jeu de semence s'applique. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, la constante du jeu de semence s'applique. */
		instance?: EtatDInstance;
		/** Les sept réglages de l'instance. Absente, la constante du jeu de semence. */
		config?: Configuration;
	}

	const {
		vecteur,
		notes,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		config = CONFIG
	}: Proprietes = $props();

	/**
	 * LES QUATRE POSITIONS DE LA PLANCHE. Les trois dernières sont des réglages
	 * hypothétiques, littéral du gel (`V-33:3228`), recopié et non fabriqué :
	 * aucune table du corpus ne les porte. La première, `actuel`, est au
	 * contraire la position « en vigueur » — elle DÉRIVE de `config`, et
	 * n'est pas un second jeu de seuils (P-01, ADR-005 ; voir l'en-tête).
	 */
	const SEUILS_DE_PLANCHE: Record<string, readonly [number, number]> = $derived({
		actuel: [config.seuilFrais, config.seuilVieillissant],
		severe: [30, 60],
		large: [120, 240],
		invalide: [120, 90]
	});

	/**
	 * LES DURÉES DE SESSION PROPOSÉES — littéral du gel (`var DUREES`,
	 * `V-33:2963`). `config.dureeSession` donne la valeur retenue, jamais la
	 * liste des choix : le corpus ne la porte pas, et la fabriquer serait
	 * inventer une définition que le gel n'a pas.
	 */
	const DUREES = [30, 60, 120, 240, 480] as const;

	const reglage = $derived(vecteur ?? {});
	const position = $derived(typeof reglage['seuils'] === 'string' ? reglage['seuils'] : 'actuel');
	const seuils = $derived(SEUILS_DE_PLANCHE[position] ?? SEUILS_DE_PLANCHE['actuel']!);
	const seuilFrais = $derived(seuils[0]);
	const seuilVieillissant = $derived(seuils[1]);

	/* ── Les fabriques du gel, portées ligne à ligne ─────────────────────────
	   `ECART-020` É-3 : porter le calque exact de la fabrique du gel, et
	   l'appeler avec les mêmes valeurs. */

	interface Repartition {
		frais: number;
		vieil: number;
		obs: number;
		total: number;
	}

	/** `window.repartitionPour` (`V-33:2687`) — le niveau vient de P-01. */
	function repartitionPour(frais: number, vieillissant: number): Repartition {
		const r: Repartition = { frais: 0, vieil: 0, obs: 0, total: notes.length };
		for (const n of notes) r[niveauFraicheur(n.jours, { frais, vieillissant })]++;
		return r;
	}

	interface Mouvement {
		note: Note;
		aggrave: boolean;
	}

	/** `window.impactSeuils` (`V-33:2674`) — les bascules, note par note. */
	function impactSeuils(frais: number, vieillissant: number) {
		const rang: Record<NiveauFraicheur, number> = { frais: 0, vieil: 1, obs: 2 };
		const mouvements: Record<'versFrais' | 'versVieil' | 'versObs', Mouvement[]> = {
			versFrais: [],
			versVieil: [],
			versObs: []
		};
		for (const n of notes) {
			const avant = niveauFraicheur(n.jours, {
				frais: config.seuilFrais,
				vieillissant: config.seuilVieillissant
			});
			const apres = niveauFraicheur(n.jours, { frais, vieillissant });
			if (avant === apres) continue;
			const cible = apres === 'frais' ? 'versFrais' : apres === 'vieil' ? 'versVieil' : 'versObs';
			mouvements[cible].push({ note: n, aggrave: rang[apres] > rang[avant] });
		}
		return mouvements;
	}

	/** Les trois parts de `barreRepartition` (`V-33:2911`), dans l'ordre du gel. */
	const PARTS = [
		{ cle: 'frais', classe: 'p-frais', pluriel: 'fraîches', singulier: 'fraîche' },
		{ cle: 'vieil', classe: 'p-vieil', pluriel: 'vieillissantes', singulier: 'vieillissante' },
		{ cle: 'obs', classe: 'p-obs', pluriel: 'obsolètes', singulier: 'obsolète' }
	] as const;

	/** `n fraîches` / `1 fraîche` — la forme du gel, employée au titre, au nom
	 *  accessible de chaque part et à la légende. */
	const partsDe = (r: Repartition) =>
		PARTS.filter((p) => r[p.cle]).map((p) => ({
			...p,
			n: r[p.cle],
			libelle: `${r[p.cle]} ${r[p.cle] > 1 ? p.pluriel : p.singulier}`
		}));

	/** L'étiquette de la barre entière (`V-33:2920`). */
	const libelleDeBarre = (r: Repartition) =>
		`${partsDe(r)
			.map((p) => p.libelle)
			.join(', ')} sur ${r.total}`;

	/* ── L'état rendu ────────────────────────────────────────────────────── */

	/** `valider()` (`V-33:3003`) — seul le second seuil peut être en faute ici :
	 *  les quatre positions donnent toujours un premier seuil ≥ 1, un portail
	 *  valide et un libellé non vide. Le message est celui du gel, au mot près. */
	const erreurVieil = $derived(
		seuilVieillissant <= seuilFrais
			? `Doit dépasser le seuil frais (${seuilFrais} jours). En l'état, aucune note ne serait ` +
					'jamais vieillissante : le témoin passerait directement du vert au rouge.'
			: null
	);

	/** `modifie()` (`V-33:3166`) — la comparaison porte sur les sept réglages ;
	 *  seuls les deux seuils peuvent différer de l'enregistré. */
	const modifie = $derived(
		seuilFrais !== config.seuilFrais || seuilVieillissant !== config.seuilVieillissant
	);

	/** `rendreImpact()` (`V-33:3032`). L'aperçu ne s'affiche que si les deux
	 *  seuils forment une progression valable. */
	const avant = $derived(repartitionPour(config.seuilFrais, config.seuilVieillissant));
	const apres = $derived(repartitionPour(seuilFrais, seuilVieillissant));
	const mouvements = $derived(impactSeuils(seuilFrais, seuilVieillissant));
	const bascules = $derived(
		mouvements.versFrais.length + mouvements.versVieil.length + mouvements.versObs.length
	);

	/** Les trois blocs de mouvement, dans l'ordre du gel (`V-33:3101`). */
	const blocsDeMouvement = $derived(
		(
			[
				['versObs', 'passent en obsolète', 'aggrave'],
				['versVieil', 'passent en vieillissant', null],
				['versFrais', 'repassent en frais', 'ameliore']
			] as const
		)
			.map(([cle, quoi, sensImpose]) => {
				const m = mouvements[cle];
				const sens = sensImpose ?? (m[0]?.aggrave ? 'aggrave' : 'ameliore');
				return {
					cle,
					m,
					sens,
					n: `${sens === 'aggrave' ? '+' : '−'}${m.length}`,
					quoi: `${m.length}${m.length > 1 ? ' notes ' : ' note '}${quoi}`,
					liste:
						m
							.slice(0, 4)
							.map((x) => x.note.titre)
							.join(' · ') + (m.length > 4 ? ` · et ${m.length - 4} autres` : '')
				};
			})
			.filter((b) => b.m.length)
	);

	/* `pluriel()` (`V-33:3136`) et `rendreVocabulaire()` (`V-33:3143`) ne sont
	   plus portés ici : ils sont dans `$lib/vocabulaire`, avec les quatre formes
	   du mot, parce que TOUT le produit en dépend et non cette seule vue
	   (`ARB-043` §4). Le calque du gel est inchangé, il a seulement déménagé. */
	const vocabulaire = $derived([
		['Console', `Types de ${motFichePlurielMinuscule}`],
		['Éditeur', `Type de ${motFicheMinuscule} — ajoute des propriétés structurées`],
		['Page de domaine', `${motFichePluriel} · module activé`],
		['Recherche', `Filtrer par type · ${motFiche}`]
	]);

	/** `majEtat()` (`V-33:3171`) — l'aide du champ « versions conservées ». */
	const aideVersions = $derived(
		config.versionsMax
			? `Au-delà de ${config.versionsMax} versions, la plus ancienne est supprimée à chaque ` +
					'nouvel enregistrement. Réduire cette valeur supprimera les versions excédentaires ' +
					"dès le prochain enregistrement d'une note."
			: ''
	);

	/** Le libellé d'une durée de session (`V-33:3502`). */
	const libelleDuree = (d: number): string =>
		d < 60 ? `${d} minutes` : `${d / 60}${d === 60 ? ' heure' : ' heures'}`;
</script>

<!--
	Le pictogramme d'erreur de champ, identique aux trois `.champ__erreur` du
	gel. `flex:none;margin-top:1px` figure à l'ensemble clos (ARB-016).
-->
<!-- prettier-ignore -->
{#snippet marqueurDErreur()}<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" style="flex:none;margin-top:1px"><path d="M8 4.5v4M8 11.2v.3"/><circle cx="8" cy="8" r="6.2"/></svg>{/snippet}

<!--
	La barre de répartition du produit, et sa légende chiffrée. Les gardes de
	formatage encadrent tout ce dont le texte porte un nom accessible.

	LA BRANCHE VIDE EST CELLE DU GEL, ET ELLE EST LA PREMIÈRE CHOSE RENDUE.
	`mockups/V-33-console-configuration.html:2902-2908` : quand l'ensemble
	mesuré est vide — `!r.total` —, la fabrique du gel ne rend NI barre NI
	légende, mais un seul nœud, `div.zone-etat__txt` de marge nulle, portant
	« Aucune note à mesurer. ». Le corpus natif de V-33 ne l'exerce jamais :
	`verif:maquette` était vert sans que ce chemin soit parcouru une seule fois
	(CLAUDE.md §6, P-5). C'est `pnpm test:vide` — corpus vierge — qui l'a levé.

	ICI LES SEGMENTS SONT DES `span`, ET NON DES BOUTONS. Ailleurs (V-07, V-10,
	V-11) une part de barre ouvre la liste filtrée sur son niveau ; ces deux
	barres-là ne le peuvent pas. « Avec ces seuils » compte selon des seuils
	SAISIS, pas encore enregistrés : aucune liste ne sait reproduire ce filtre,
	le serveur ne connaît que la configuration en vigueur. Et rendre sa jumelle
	« Actuellement » cliquable seule ferait d'une comparaison deux objets de
	nature différente. Un bouton dessiné est un geste promis : on ne dessine donc
	pas de bouton. Le gel fait le même choix — il appelle sa fabrique sans
	`surPart` (`V-33:3084`), les segments y étaient inertes. La barre reste ce
	qu'annonce son rôle d'image, une illustration, avec son nom accessible.
-->
<!-- prettier-ignore -->
{#snippet barreRepartition(r: Repartition, sansLegende: boolean)}{#if !r.total}<div class="zone-etat__txt" style="margin:0">Aucune note à mesurer.</div>{:else}<div class="repart" role="img" aria-label={libelleDeBarre(r)}
		>{#each partsDe(r) as p (p.cle)}<span class={p.classe} style="flex:{p.n}" title={p.libelle}></span>{/each}</div
	>{#if !sansLegende}<div class="legende"
		>{#each partsDe(r) as p (p.cle)}<span><i class={p.classe}></i><b>{p.n}</b>{` ${p.n > 1 ? p.pluriel : p.singulier}`}</span>{/each}</div
	>{/if}{/if}{/snippet}

<CoquilleDeConsole section="configuration" {notes} {univers} {domaines} {compte} {instance}>
	{#snippet enfants()}
		<TeteDeSection
			titre="Configuration"
			description="Les réglages qui pilotent le comportement du produit. Ils prennent effet immédiatement, pour tout le monde."
		/>

		<!-- ============ Fraîcheur ============ -->
		<!-- prettier-ignore -->
		<section class="groupe"
			><div class="groupe__tete"
				><div
					><h2 class="groupe__nom">Fraîcheur</h2
					><div class="groupe__sous">Au bout de combien de temps une note cesse d'être considérée comme fiable. C'est le réglage le plus visible du produit : il décide du signal affiché sur chaque note, partout.</div
				></div
			></div
			><div class="groupe__corps"
				><div class="duo-champs"
					><div class="champ" id="champ-frais"
						><label class="champ__label" for="c-frais">Frais jusqu'à</label
						><div class="champ-nombre"
							><input class="saisie" type="number" id="c-frais" min="1" max="3650" step="1" value={seuilFrais}
							><span class="champ-nombre__unite">jours après la dernière vérification</span
						></div
						><div class="champ__erreur" id="erreur-frais" hidden
							>{@render marqueurDErreur()}<span id="erreur-frais-txt"></span
						></div
					></div
					><div class="champ" id="champ-vieil" data-etat={erreurVieil ? 'erreur' : undefined}
						><label class="champ__label" for="c-vieil">Vieillissant jusqu'à</label
						><div class="champ-nombre"
							><input class="saisie" type="number" id="c-vieil" min="2" max="3650" step="1" value={seuilVieillissant}
							><span class="champ-nombre__unite">jours, puis obsolète</span
						></div
						><div class="champ__erreur" id="erreur-vieil" hidden={!erreurVieil}
							>{@render marqueurDErreur()}<span id="erreur-vieil-txt">{erreurVieil ?? ''}</span
						></div
					></div
				></div
				><div class="impact" id="impact"
					>{#if erreurVieil}<div class="impact__rien">L'aperçu s'affichera dès que les deux seuils formeront une progression valable.</div
					>{:else}<div class="impact__tete"
						><span class="etiq">Effet sur les {avant.total} notes de la base</span
						><span class="impact__bilan">{#if bascules}<b>{bascules}{bascules > 1 ? ' notes changent' : ' note change'} de signal</b>{:else}aucun changement{/if}</span
					></div
					><div class="comparaison"
						><div class="comparaison__ligne" data-etat="avant"
							><span class="comparaison__nom">Actuellement</span
							><div>{@render barreRepartition(avant, true)}</div
						></div
						><div class="comparaison__ligne" data-etat="apres"
							><span class="comparaison__nom">Avec ces seuils</span
							><div>{@render barreRepartition(apres, false)}</div
						></div
					></div
					>{#if bascules}<div class="mouvements"
						>{#each blocsDeMouvement as b (b.cle)}<div class="mvt" data-sens={b.sens}><span class="mvt__n">{b.n}</span><div class="mvt__corps"><div class="mvt__quoi">{b.quoi}</div><div class="mvt__liste">{b.liste}</div></div></div>{/each}</div
					>{:else}<div class="impact__rien" style="margin-top:var(--e-3)">Ces seuils produisent exactement la même répartition que ceux en vigueur. Aucun signal ne changera dans le produit.</div
					>{/if}{/if}</div
			></div
		></section>

		<!-- ============ Historique ============ -->
		<!-- prettier-ignore -->
		<section class="groupe"
			><div class="groupe__tete"
				><div
					><h2 class="groupe__nom">Historique</h2
					><div class="groupe__sous">Combien d'états antérieurs sont conservés pour chaque note. Au-delà, les plus anciens sont supprimés à mesure que de nouveaux arrivent.</div
				></div
			></div
			><div class="groupe__corps"
				><div class="champ"
					><label class="champ__label" for="c-versions">Versions conservées par note</label
					><div class="champ-nombre"
						><input class="saisie" type="number" id="c-versions" min="5" max="500" step="1" value={config.versionsMax}
						><span class="champ-nombre__unite">versions</span
					></div
					><span class="champ__aide" id="aide-versions">{aideVersions}</span
				></div
			></div
		></section>

		<!-- ============ Espace public ============ -->
		<!-- prettier-ignore -->
		<section class="groupe"
			><div class="groupe__tete"
				><div
					><h2 class="groupe__nom">Espace public</h2
					><div class="groupe__sous">Où mène le repli proposé au visiteur qui ne trouve pas sa réponse.</div
				></div
			></div
			><div class="groupe__corps"
				><div class="champ" id="champ-portail"
					><label class="champ__label" for="c-portail">Adresse du portail d'assistance</label
					><input class="saisie" type="url" id="c-portail" spellcheck="false" placeholder="https://…" value={config.portailAssistance}
					><span class="champ__aide">Cible du bouton « Ouvrir un ticket d'assistance », présent sur toutes les vues publiques et sur les pages introuvables.</span
					><div class="champ__erreur" id="erreur-portail" hidden
						>{@render marqueurDErreur()}<span id="erreur-portail-txt"></span
					></div
				></div
			></div
		></section>

		<!-- ============ Vocabulaire ============ -->
		<!-- prettier-ignore -->
		<section class="groupe"
			><div class="groupe__tete"
				><div
					><h2 class="groupe__nom">Vocabulaire</h2
					><div class="groupe__sous">Le mot employé pour désigner une note structurée. Chaque équipe a le sien : fiche, objet, actif, élément.</div
				></div
			></div
			><div class="groupe__corps"
				><div class="champ" id="champ-mot"
					><label class="champ__label" for="c-mot">Libellé du concept</label
					><input class="saisie" type="text" id="c-mot" style="max-width:280px" autocomplete="off" value={config.motFiche}
					><span class="champ__aide">Au singulier, avec sa majuscule. Le pluriel est déduit.</span
					><div class="champ__erreur" id="erreur-mot" hidden
						>{@render marqueurDErreur()}<span id="erreur-mot-txt"></span
					></div
				></div
				><div class="champ"
					><span class="champ__label">Où le mot apparaîtra</span
					><div class="apercu-vocabulaire" id="apercu-mot"
						>{#each vocabulaire as [ou, quoi] (ou)}<span><span>{`${ou} : `}</span><b>{quoi}</b></span>{/each}</div
				></div
			></div
		></section>

		<!-- ============ Fichiers et session ============ -->
		<!-- prettier-ignore -->
		<section class="groupe"
			><div class="groupe__tete"
				><div
					><h2 class="groupe__nom">Fichiers et session</h2
					><div class="groupe__sous">Limites techniques. Les modifier n'affecte pas ce qui existe déjà.</div
				></div
			></div
			><div class="groupe__corps"
				><div class="duo-champs"
					><div class="champ"
						><label class="champ__label" for="c-taille">Taille maximale d'une pièce jointe</label
						><div class="champ-nombre"
							><input class="saisie" type="number" id="c-taille" min="1" max="500" step="1" value={config.tailleMaxPieceJointe}
							><span class="champ-nombre__unite">Mo</span
						></div
						><span class="champ__aide">Les fichiers déjà déposés au-delà de cette limite restent accessibles.</span
					></div
					><div class="champ"
						><label class="champ__label" for="c-session">Durée de session</label
						><select class="selecteur" id="c-session"
							>{#each DUREES as d (d)}<option value={d} selected={d === config.dureeSession}>{libelleDuree(d)}</option>{/each}</select
						><span class="champ__aide">Délai d'inactivité au bout duquel la session se ferme, sauf si l'utilisateur a choisi de rester connecté.</span
					></div
				></div
			></div
		></section>

		<!-- prettier-ignore -->
		<div class="pied-config"
			><span class="pied-config__etat" id="etat-config" data-modifie={modifie ? 'oui' : 'non'}>{modifie ? "Modifications non enregistrées — elles ne s'appliquent pas encore." : 'Aucune modification en attente.'}</span
			><button class="btn" id="annuler" hidden={!modifie}>Rétablir les valeurs enregistrées</button
			><button class="btn btn--principal" id="enregistrer" disabled={!modifie}>Enregistrer les réglages</button
		></div>
	{/snippet}
</CoquilleDeConsole>
