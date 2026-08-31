<script lang="ts">
	/**
	 * V-33 — Console · Configuration. Route `/console/configuration`.
	 *
	 * Les quatre positions de planche ne changent QUE LES DEUX SEUILS DE FRAÎCHEUR
	 * (`V-33:3226-3231`) ; tout le reste de l'écran — validation, aperçu d'impact,
	 * aperçu de vocabulaire, pied de page — en DÉCOULE.
	 *
	 * `actuel` N'EST PAS UN RÉGLAGE D'ESSAI : le gel l'étiquette « 90 / 180 · en
	 * vigueur » (`V-33:1427`), c'est LA CONFIGURATION DE L'INSTANCE. L'écrire en
	 * littéral en ferait un second jeu de seuils — `ADR-005` interdit « toute
	 * duplication des seuils sous forme de constante littérale ailleurs que dans la
	 * configuration lue par l'implémentation unique ». Il en DÉRIVE :
	 * `SEUILS_PAR_DEFAUT` (`src/lib/fraicheur.ts`) → propriété `config` →
	 * `SEUILS_DE_PLANCHE.actuel`.
	 *
	 * UNE SEULE DÉFINITION DE LA FRAÎCHEUR : `niveauFraicheur()` de `$lib/fraicheur`
	 * EST `window.niveauPour` (`V-33:2667`) au caractère près, et prend ses seuils
	 * en paramètre. `repartitionPour()` et `impactSeuils()` sont les calques de
	 * `V-33:2687` et `V-33:2674`, et ils l'appellent. Les deux barres de la
	 * comparaison sont construites sur des notes FACTICES, comme au gel
	 * (`V-33:3085-3089`) : il ne compte que le niveau, jamais la note.
	 *
	 * `autofocus` n'est posé nulle part : le gel ne focalise rien au chargement.
	 *
	 * Coquille de forme abrégée, enveloppe `div.console`. V-33 n'a NI panneau
	 * `tiroir-form`, NI `data-form`, NI dialogue de suppression, NI tableau de
	 * gestion, NI action en tête de section. `div.app` ne porte au gel que
	 * `data-rail` et `data-role` : aucun attribut de données n'est transmis.
	 *
	 * Le style est dans `src/socle.css` et `src/vues/V-33.css`. Cette feuille n'est
	 * plus la copie à l'octet du gel : les règles de `.repart` y suivent les `span`
	 * de l'aperçu d'impact (voir `barreRepartition`). Le rendu est inchangé.
	 */
	import type { Configuration, NiveauFraicheur, Note } from '../../seeds/corpus';
	import { niveauFraicheur } from '$lib/fraicheur';
	import CoquilleDeConsole from '$lib/console/CoquilleDeConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { accord, vocabulaireRendu } from '$lib/vocabulaire';

	/* Le mot renommable de `M14.7`, lu sur le contexte de coquille : en constante,
	   le renommer en console ne changeait rien a l'ecran. Repli : « Fiche ». */
	const motsDuProduit = vocabulaireRendu();
	const motFiche = $derived(motsDuProduit.fiche);
	const motFicheMinuscule = $derived(motsDuProduit.ficheMin);
	const motFichePluriel = $derived(motsDuProduit.fiches);
	const motFichePlurielMinuscule = $derived(motsDuProduit.fichesMin);

	interface Proprietes {
		vecteur?: Record<string, string | boolean> | null;
		notes: readonly Note[];
		/**
		 * LES RÉGLAGES DE L'INSTANCE, EXIGÉS. La propriété retombait sur `CONFIG`
		 * de `seeds/corpus.ts` : une route qui l'oubliait servait les seuils, le
		 * portail et le plafond de versions du jeu de démonstration comme les réglages
		 * en vigueur.
		 */
		config: Configuration;
	}

	/*
	 * LE RAIL, LA BARRE ET LA VERSION NE PASSENT PLUS PAR ICI. Cette vue portait
	 * `univers`, `domaines`, `compte` et `instance` sans jamais les lire : elle ne
	 * faisait que les remettre à `CoquilleDeConsole`, qui retombait sur le jeu de
	 * démonstration.
	 */
	const { vecteur, notes, config }: Proprietes = $props();

	/**
	 * LES QUATRE POSITIONS DE LA PLANCHE. Les trois dernières sont des réglages
	 * hypothétiques, littéral du gel (`V-33:3228`) : aucune table ne les porte. La
	 * première, `actuel`, DÉRIVE de `config` — voir l'en-tête.
	 */
	const SEUILS_DE_PLANCHE: Record<string, readonly [number, number]> = $derived({
		actuel: [config.seuilFrais, config.seuilVieillissant],
		severe: [30, 60],
		large: [120, 240],
		invalide: [120, 90]
	});

	/**
	 * LES DURÉES DE SESSION PROPOSÉES — littéral du gel (`V-33:2963`).
	 * `config.dureeSession` donne la valeur retenue, jamais la liste des choix.
	 */
	const DUREES = [30, 60, 120, 240, 480] as const;

	const reglage = $derived(vecteur ?? {});
	const position = $derived(typeof reglage['seuils'] === 'string' ? reglage['seuils'] : 'actuel');
	const seuils = $derived(SEUILS_DE_PLANCHE[position] ?? SEUILS_DE_PLANCHE['actuel']!);
	const seuilFrais = $derived(seuils[0]);
	const seuilVieillissant = $derived(seuils[1]);

	/* Les fabriques du gel, portées ligne à ligne, et appelées avec les mêmes
	   valeurs (`ECART-020` É-3). */

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
		{ cle: 'frais', classe: 'p-frais', singulier: 'fraîche' },
		{ cle: 'vieil', classe: 'p-vieil', singulier: 'vieillissante' },
		{ cle: 'obs', classe: 'p-obs', singulier: 'obsolète' }
	] as const;

	/** `n fraîches` / `1 fraîche` — la forme du gel, employée au titre, au nom
	 *  accessible de chaque part et à la légende. */
	const partsDe = (r: Repartition) =>
		PARTS.filter((p) => r[p.cle]).map((p) => ({
			...p,
			n: r[p.cle],
			libelle: `${r[p.cle]} ${accord(r[p.cle], p.singulier)}`
		}));

	/** L'étiquette de la barre entière (`V-33:2920`). */
	const libelleDeBarre = (r: Repartition) =>
		`${partsDe(r)
			.map((p) => p.libelle)
			.join(', ')} sur ${r.total}`;

	/* ── L'état rendu ────────────────────────────────────────────────────── */

	/** `valider()` (`V-33:3003`) — seul le second seuil peut être en faute ici. Le
	 *  message est celui du gel, au mot près.
	 *
	 *  IL A UN JUMEAU SERVEUR, ET LES DEUX ÉCRIVENT DANS LE MÊME NŒUD :
	 *  `messageSeuilNonCroissant` de `donnees/administration.ts` compose la même
	 *  phrase, et `routes/console/configuration/cablage.ts` la repeint dans
	 *  `#erreur-vieil-txt` au retour d'« Enregistrer ». Ils doivent être IDENTIQUES
	 *  À L'OCTET — apostrophe typographique comprise, celle que tout le reste du
	 *  produit écrit. */
	const erreurVieil = $derived(
		seuilVieillissant <= seuilFrais
			? `Doit dépasser le seuil frais (${seuilFrais} ${accord(seuilFrais, 'jour')}). En l’état, aucune note ne serait ` +
					'jamais vieillissante : le témoin passerait directement du vert au rouge.'
			: null
	);

	/** `modifie()` (`V-33:3166`) — la comparaison porte sur les réglages ;
	 *  seuls les deux seuils peuvent différer de l'enregistré au rendu serveur, le
	 *  câblage tenant le témoin sur la saisie réelle. */
	const modifie = $derived(
		seuilFrais !== config.seuilFrais || seuilVieillissant !== config.seuilVieillissant
	);

	/** `rendreImpact()` (`V-33:3032`). L'aperçu ne s'affiche que si les deux seuils
	 *  forment une progression valable. L'ARTICLE « les » A DISPARU de « Effet sur
	 *  les N notes de la base » : un article ne s'accorde pas seul devant un
	 *  chiffre, et `avant.total` vaut 0 sur une instance neuve. */
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
				['versObs', 'passe en obsolète', 'passent en obsolète', 'aggrave'],
				['versVieil', 'passe en vieillissant', 'passent en vieillissant', null],
				['versFrais', 'repasse en frais', 'repassent en frais', 'ameliore']
			] as const
		)
			.map(([cle, quoiAuSingulier, quoiAuPluriel, sensImpose]) => {
				const m = mouvements[cle];
				const sens = sensImpose ?? (m[0]?.aggrave ? 'aggrave' : 'ameliore');
				return {
					cle,
					m,
					sens,
					n: `${sens === 'aggrave' ? '+' : '−'}${m.length}`,
					quoi: `${m.length} ${accord(m.length, 'note')} ${accord(m.length, quoiAuSingulier, quoiAuPluriel)}`,
					liste:
						m
							.slice(0, 4)
							.map((x) => x.note.titre)
							.join(' · ') +
						(m.length > 4 ? ` · et ${m.length - 4} ${accord(m.length - 4, 'autre')}` : '')
				};
			})
			.filter((b) => b.m.length)
	);

	/* `pluriel()` (`V-33:3136`) et `rendreVocabulaire()` (`V-33:3143`) sont dans
	   `$lib/vocabulaire`, avec les quatre formes du mot, parce que TOUT le produit
	   en dépend et non cette seule vue (`ARB-043` §4). */
	const vocabulaire = $derived([
		['Console', `Types de ${motFichePlurielMinuscule}`],
		['Éditeur', `Type de ${motFicheMinuscule} — ajoute des propriétés structurées`],
		['Page de domaine', `${motFichePluriel} · module activé`],
		['Recherche', `Filtrer par type · ${motFiche}`]
	]);

	/**
	 * L'AIDE DU CHAMP « nom de l'organisation » — elle ne nomme AUCUN écran. Elle en
	 * nommait deux, et c'était une promesse que le produit ne tenait pas : aucune
	 * vue ne lit encore ce réglage, les cinq pieds publics portent leur signature EN
	 * DUR. Ce qu'elle dit désormais est vrai sur n'importe quelle branche.
	 */
	const aideOrganisation = $derived(
		config.nomOrganisation === ''
			? 'Facultatif. « Codicillus » est le nom du logiciel, et il se suffit à lui-même.'
			: `« Codicillus » est le nom du logiciel ; « ${config.nomOrganisation} » est celui de votre organisation.`
	);

	/** `majEtat()` (`V-33:3171`) — l'aide du champ « versions conservées ». */
	const aideVersions = $derived(
		config.versionsMax
			? `Au-delà de ${config.versionsMax} versions, la plus ancienne est supprimée à chaque ` +
					'nouvel enregistrement. Réduire cette valeur supprimera les versions excédentaires ' +
					"dès le prochain enregistrement d'une note."
			: ''
	);

	/**
	 * L'AIDE DU GROUPE « Indisponibilité programmée » — `RG-NF-10`. Elle dit l'état en
	 * vigueur, jamais l'état saisi : c'est ce que les autres comptes reçoivent EN CE
	 * MOMENT, et l'écran ne l'a pas encore enregistré.
	 */
	const aideIndisponibilite = $derived(
		config.indisponibiliteActive
			? 'Active en ce moment : tout compte non administrateur est renvoyé sur la page d’indisponibilité. Vous continuez de travailler normalement — sans cela, vous ne pourriez plus la désactiver.'
			: 'Inactive : l’instance répond normalement à tout le monde. Une activation prend effet à la requête suivante, y compris pour les sessions déjà ouvertes.'
	);

	/** Le libellé d'une durée de session (`V-33:3502`). */
	const libelleDuree = (d: number): string =>
		d < 60 ? `${d} minutes` : `${d / 60}${d === 60 ? ' heure' : ' heures'}`;
</script>

<!--
	Le pictogramme d'erreur de champ, identique aux trois `.champ__erreur` du gel.
	`flex:none;margin-top:1px` figure à l'ensemble clos (ARB-016).
-->
<!-- prettier-ignore -->
{#snippet marqueurDErreur()}<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" style="flex:none;margin-top:1px"><path d="M8 4.5v4M8 11.2v.3"/><circle cx="8" cy="8" r="6.2"/></svg>{/snippet}

<!--
	La barre de répartition du produit, et sa légende chiffrée.

	LA BRANCHE VIDE EST CELLE DU GEL, ET ELLE EST LA PREMIÈRE CHOSE RENDUE :
	`mockups/V-33-console-configuration.html:2902-2908` — quand l'ensemble mesuré
	est vide, la fabrique ne rend NI barre NI légende, mais un seul
	`div.zone-etat__txt` portant « Aucune note à mesurer. ». Le corpus natif de V-33
	ne l'exerce jamais ; c'est le corpus vierge qui l'a levé.

	ICI LES SEGMENTS SONT DES `span`, ET NON DES BOUTONS. Ailleurs (V-07, V-10,
	V-11) une part de barre ouvre la liste filtrée sur son niveau ; ces deux
	barres-là ne le peuvent pas — « Avec ces seuils » compte selon des seuils
	SAISIS, que le serveur ne connaît pas. Le gel fait le même choix : il appelle sa
	fabrique sans `surPart` (`V-33:3084`).
-->
<!-- prettier-ignore -->
{#snippet barreRepartition(r: Repartition, sansLegende: boolean)}{#if !r.total}<div class="zone-etat__txt" style="margin:0">Aucune note à mesurer.</div>{:else}<div class="repart" role="img" aria-label={libelleDeBarre(r)}
		>{#each partsDe(r) as p (p.cle)}<span class={p.classe} style="flex:{p.n}" title={p.libelle}></span>{/each}</div
	>{#if !sansLegende}<div class="legende"
		>{#each partsDe(r) as p (p.cle)}<span><i class={p.classe}></i><b>{p.n}</b>{` ${accord(p.n, p.singulier)}`}</span>{/each}</div
	>{/if}{/if}{/snippet}

<CoquilleDeConsole section="configuration" {notes}>
	{#snippet enfants()}
		<TeteDeSection
			titre="Configuration"
			description="Les réglages qui pilotent le comportement du produit. Ils prennent effet immédiatement, pour tout le monde."
		/>

		<!-- Organisation — LE HUITIÈME RÉGLAGE, ET LE GEL NE LE DESSINE PAS.
			Huit vues écrivaient « Direction technique » en dur, dont les cinq pieds
			publics : le segment de marché du cadrage soudé dans une signature de
			produit. Sans ce champ, le paramètre n'était réglable par aucun écran.
			VIDE EST L'ÉTAT NORMAL D'UNE INSTALLATION NEUVE : rien n'est à valider, un nom
			d'organisation n'a pas de forme, et AUCUN BLOC D'ERREUR N'EST DESSINÉ — les
			sept autres en portent un parce que l'action sait les refuser.
			NI CE SOUS-TITRE NI L'AIDE NE NOMMENT D'ÉCRAN : à ce jour aucune vue ne lit ce
			réglage, et l'écran de réglage dit ce qu'il règle, pas ce que d'autres en
			feront. -->
		<!-- prettier-ignore -->
		<section class="groupe"
			><div class="groupe__tete"
				><div
					><h2 class="groupe__nom">Organisation</h2
					><div class="groupe__sous">Le nom de l'organisation qui héberge cette instance. « Codicillus » est le nom du logiciel ; celui-ci est le vôtre.</div
				></div
			></div
			><div class="groupe__corps"
				><div class="champ"
					><label class="champ__label" for="c-organisation">Nom de l'organisation</label
					><input class="saisie" type="text" id="c-organisation" style="max-width:360px" autocomplete="off" value={config.nomOrganisation}
					><span class="champ__aide">{aideOrganisation}</span
				></div
			></div
		></section>

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
						><span class="etiq">Effet sur {avant.total} {accord(avant.total, 'note')} de la base</span
						><span class="impact__bilan">{#if bascules}<b>{bascules}{' ' + accord(bascules, 'note change', 'notes changent')} de signal</b>{:else}aucun changement{/if}</span
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
				><div class="champ" id="champ-versions"
					><label class="champ__label" for="c-versions">Versions conservées par note</label
					><div class="champ-nombre"
						><input class="saisie" type="number" id="c-versions" min="5" max="500" step="1" value={config.versionsMax}
						><span class="champ-nombre__unite">versions</span
					></div
					><span class="champ__aide" id="aide-versions">{aideVersions}</span
					><div class="champ__erreur" id="erreur-versions" hidden
						>{@render marqueurDErreur()}<span id="erreur-versions-txt"></span
					></div
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
					><div class="champ" id="champ-taille"
						><label class="champ__label" for="c-taille">Taille maximale d'une pièce jointe</label
						><div class="champ-nombre"
							><input class="saisie" type="number" id="c-taille" min="1" max="500" step="1" value={config.tailleMaxPieceJointe}
							><span class="champ-nombre__unite">Mo</span
						></div
						><span class="champ__aide">Les fichiers déjà déposés au-delà de cette limite restent accessibles.</span
						><div class="champ__erreur" id="erreur-taille" hidden
							>{@render marqueurDErreur()}<span id="erreur-taille-txt"></span
						></div
					></div
					><div class="champ" id="champ-session"
						><label class="champ__label" for="c-session">Durée de session</label
						><select class="selecteur" id="c-session"
							>{#each DUREES as d (d)}<option value={d} selected={d === config.dureeSession}>{libelleDuree(d)}</option>{/each}</select
						><span class="champ__aide">Délai d'inactivité au bout duquel la session se ferme, sauf si l'utilisateur a choisi de rester connecté.</span
						><div class="champ__erreur" id="erreur-session" hidden
							>{@render marqueurDErreur()}<span id="erreur-session-txt"></span
						></div
					></div
				></div
			></div
		></section>

		<!-- ============ Indisponibilité programmée ============ -->
		<!-- `RG-NF-10` (`CDC:1572`) — « une page d'indisponibilité programmée est
			activable ». RIEN N'EXISTAIT : ni drapeau, ni message, ni page. Le gel ne
			dessine pas ce groupe, pas plus qu'il ne dessine « Organisation » ; il est
			bâti sur le même patron que les six autres, aux mêmes classes.
			L'ADMINISTRATEUR N'EST JAMAIS RENVOYÉ SUR LA PAGE, et l'aide le dit : sans
			cela, il ne pourrait plus la désactiver. -->
		<!-- prettier-ignore -->
		<section class="groupe"
			><div class="groupe__tete"
				><div
					><h2 class="groupe__nom">Indisponibilité programmée</h2
					><div class="groupe__sous">Ferme l'instance à tout le monde sauf aux administrateurs, le temps d'une intervention. Les autres comptes reçoivent une page qui dit ce qui se passe, à la place de l'application.</div
				></div
			></div
			><div class="groupe__corps"
				><div class="champ" id="champ-indisponibilite"
					><label class="champ__label" for="c-indisponibilite">État de l'instance</label
					><select class="selecteur" id="c-indisponibilite"
						><option value="non" selected={!config.indisponibiliteActive}>Ouverte — tout le monde travaille</option
						><option value="oui" selected={config.indisponibiliteActive}>Indisponibilité activée</option
					></select
					><span class="champ__aide">{aideIndisponibilite}</span
				></div
				><div class="champ" id="champ-message-indisponibilite"
					><label class="champ__label" for="c-message-indisponibilite">Message affiché</label
					><textarea class="saisie" id="c-message-indisponibilite" rows="3" placeholder="Migration du serveur de base de données. Retour prévu à 14 h.">{config.messageDIndisponibilite}</textarea
					><span class="champ__aide">Dites ce qui se passe et quand ça revient. C'est le seul texte que les comptes renvoyés liront.</span
					><div class="champ__erreur" id="erreur-message-indisponibilite" hidden
						>{@render marqueurDErreur()}<span id="erreur-message-indisponibilite-txt"></span
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
