<script lang="ts">
	/**
	 * V-30 — Console · Types de relations.
	 * Route `/console/types-de-relations` (`docs/routes.md` §3.6).
	 *
	 * COQUILLE DE FORME ABRÉGÉE, ENVELOPPE `console` — vérifié sur le gel par
	 * `node verif/releve-vues.mjs --formes` (ARB-021, A-1 ; ARB-023).
	 *
	 * CE QUI EST COMMUN, ET CE QUI NE L'EST PAS. `src/lib/console/` porte les
	 * treize classes des dix vues de console et le panneau des six registres
	 * (`sections.ts`, en-tête). Propres à V-30, et à elle seule : `sens`,
	 * `sens--inverse`, `sens__fleche`, `sens__libelle`, `apercu-phrases`,
	 * `phrase`, `phrase--inverse`, `phrase__sens`, `phrase__manque`, `exemples`,
	 * `choix-reaffectation`, `aide`, et le modificateur de grille
	 * `tg--relations`. AUCUNE FACTORISATION AU-DELÀ (`docs/DESIGN.md` §2.H).
	 *
	 * LE PANNEAU `tiroir-form` NE PÈSE AUCUN PIXEL, ET C'EST LE GEL. Hors de
	 * `div.app`, il n'est pas atteint par `.app[data-form="ouvert"]
	 * .tiroir-form` (`V-30.css:401`) et reste hors fenêtre. Le NIVEAU 1 en est
	 * le seul juge — `position: fixed` le laisse dans l'ordre de tabulation et
	 * dans l'instantané ARIA (`CLAUDE.md` §6, P-3).
	 *
	 * AUCUN `autofocus` : la maquette focalise `#f-direct` à l'ouverture
	 * (`V-30:3054`), mais hors dialogue le focus ne survit pas à `stabiliser()`
	 * (`CLAUDE.md` §6, P-4). Dans le dialogue, `showModal()` — établi par le
	 * banc (ARB-017) — focalise déjà `button.dlg__fermer`, premier focalisable.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : les compteurs de relations sont
	 * calculés sur `RELATIONS` de `seeds/corpus.ts`.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011).
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette`, `dialog#palette` fermé,
	 * et `div.planche`, bloc hors produit (§2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-30.css` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import NavigationConsole from '$lib/console/NavigationConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { filDeConsole } from '$lib/console/sections';
	import {
		DOMAINES,
		INSTANCE,
		MOI,
		RELATIONS,
		RELATIONS_TECHNIQUES,
		TYPES_RELATION,
		UNIVERS,
		type CleDeTypeDeRelation,
		type Domaine,
		type EtatDInstance,
		type LibellesDeRelation,
		type Note,
		type Relation,
		type Univers,
		type UtilisateurCourant
	} from '../../seeds/corpus';
	import { motFicheMinuscule, motFichePlurielMinuscule } from '$lib/vocabulaire';

	interface Proprietes {
		/** Le vecteur complet de l'état — formulaire × suppression. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-30')`. */
		notes: readonly Note[];
		/** Les univers déclarés. Absente, la constante du jeu de semence s'applique. */
		univers?: readonly Univers[];
		/** Les domaines déclarés. Absente, la constante du jeu de semence s'applique. */
		domaines?: readonly Domaine[];
		/** L'utilisateur courant. Absente, la constante du jeu de semence s'applique. */
		compte?: UtilisateurCourant;
		/** L'état de l'instance. Absente, la constante du jeu de semence s'applique. */
		instance?: EtatDInstance;
		/** Le catalogue des types de relation. Absente, la constante du jeu. */
		typesRelation?: Record<CleDeTypeDeRelation, LibellesDeRelation>;
		/**
		 * Les types qui portent une dépendance technique — `types_de_relation.technique`.
		 * Absente, la constante du jeu de semence s'applique.
		 */
		relationsTechniques?: readonly CleDeTypeDeRelation[];
		/** Les relations déclarées, dont se compte l'usage. Absente, la constante du jeu. */
		relations?: readonly Relation[];
	}

	const {
		vecteur,
		notes: corpus,
		univers = UNIVERS,
		domaines = DOMAINES,
		compte = MOI,
		instance = INSTANCE,
		typesRelation = TYPES_RELATION,
		relationsTechniques = RELATIONS_TECHNIQUES,
		relations = RELATIONS
	}: Proprietes = $props();

	/**
	 * L'USAGE ATTENDU EST UN TEXTE DU GEL (`V-30:2875`), recopié depuis lui.
	 * `seeds/corpus.ts` porte les deux libellés de chaque type de relation,
	 * jamais la phrase qui dit quand l'employer : la dériver serait inventer.
	 */
	const USAGES: Record<string, string> = {
		heberge: "Entre un serveur et ce qui tourne dessus. La rupture du serveur emporte l'hébergé.",
		depend:
			"Quand l'indisponibilité de la cible empêche l'origine de fonctionner. Le lien le plus structurant du graphe.",
		replique:
			'Entre deux instances qui portent la même donnée. Distinct de « dépend de » : la bascule est possible.',
		sauvegarde:
			"Entre un dispositif de sauvegarde et ce qu'il protège. Sert aux revues de plan de reprise.",
		documente:
			"Entre une procédure et l'objet qu'elle décrit. Lien éditorial, sans dépendance technique.",
		contact: "Entre un objet et l'interlocuteur à joindre à son sujet."
	};

	interface TypeDeRelationRendu {
		readonly cle: string;
		readonly direct: string;
		readonly inverse: string;
		readonly usage: string;
		readonly technique: boolean;
	}

	/**
	 * LE TYPE `remplace` EST UN AJOUT DU GEL, ET IL EST DÉCLARÉ COMME TEL
	 * (`V-30:2895`) : « un type inutilisé, pour que le cas de suppression
	 * simple existe ». Aucune relation ne le porte, et c'est précisément ce
	 * qu'il sert à montrer. Le déduire du corpus est impossible — les six types
	 * de `TYPES_RELATION` sont tous employés.
	 */
	const TYPE_INUTILISE: TypeDeRelationRendu = {
		cle: 'remplace',
		direct: 'remplace',
		inverse: 'est remplacé par',
		usage: 'Entre un objet retiré du service et celui qui reprend sa fonction.',
		technique: false
	};

	/**
	 * La liste — plus le type inutilisé, MAIS SEULEMENT SUR LE JEU DE SEMENCE.
	 *
	 * `TYPE_INUTILISE` est un littéral de démonstration : il donne à la planche
	 * son état « type inutilisé », et aucune table ne le porte. Servi à côté des
	 * types réels d'une instance, c'est une ligne que l'administrateur voit et
	 * qui ne correspond à rien — la valeur illustrative que `P-02` proscrit.
	 * La condition est une comparaison d'identité avec le défaut : la maquette
	 * garde exactement ce qu'elle montrait, et la base ne montre qu'elle-même.
	 * Même geste, même motif, que `TELEPHONIE` de `V-28`.
	 */
	const types: readonly TypeDeRelationRendu[] = $derived([
		...(Object.keys(typesRelation) as readonly CleDeTypeDeRelation[]).map((cle) => ({
			cle,
			direct: typesRelation[cle].sortant,
			inverse: typesRelation[cle].entrant,
			usage: USAGES[cle] ?? '',
			technique: relationsTechniques.includes(cle)
		})),
		...(typesRelation === TYPES_RELATION ? [TYPE_INUTILISE] : [])
	]);

	/** Les relations déclarées qui portent ce type — calculé, jamais écrit. */
	function usage(cle: string): number {
		return relations.filter((r) => r.type === cle).length;
	}

	/**
	 * LES TROIS COUPLES D'ÉPREUVE DE L'APERÇU sont ceux du gel (`V-30:2900`) :
	 * des sujets choisis pour éprouver la formulation, pas des données. Le
	 * premier est le couple courant au chargement.
	 */
	const COUPLE_COURANT: readonly [string, string] = ['srv-app-01', 'Facturation'];
	const COUPLES: readonly (readonly [string, string])[] = [
		COUPLE_COURANT,
		['bkp-01.prod', 'pg-prod-01'],
		['Restaurer une sauvegarde PostgreSQL', 'pg-prod-02']
	];

	/* ── L'état, tel que le vecteur de planche le décrit ───────────────────
	   Le panneau et le dialogue ne s'ouvrent que si la position DÉVIE du
	   réglage par défaut : la maquette ne les ouvre que sur l'événement
	   `change` que le banc répartit, jamais au chargement (`V-30:3230`). */
	const reglage = $derived(vecteur ?? {});
	const form = $derived(String(reglage['form'] ?? 'ferme'));
	const sup = $derived(String(reglage['sup'] ?? 'utilise'));
	const panneauOuvert = $derived(form !== 'ferme');

	/** Le type édité par la position « Édition · héberge » (`V-30:3234`). */
	const edite = $derived(
		form === 'edition' ? (types.find((t) => t.cle === 'heberge') ?? null) : null
	);
	const relationsEditees = $derived(edite ? usage(edite.cle) : 0);

	/** Les deux phrases de l'aperçu, dans l'ordre du gel. */
	const phrases = $derived([
		{
			sujet: COUPLE_COURANT[0],
			libelle: edite ? edite.direct : '',
			objet: COUPLE_COURANT[1],
			sens: 'sens direct',
			modificateur: ''
		},
		{
			sujet: COUPLE_COURANT[1],
			libelle: edite ? edite.inverse : '',
			objet: COUPLE_COURANT[0],
			sens: 'sens inverse',
			modificateur: 'phrase--inverse'
		}
	]);

	/**
	 * LE TYPE PROPOSÉ À LA SUPPRESSION (`V-30:3237`) : le premier type sans
	 * relation pour « Type inutilisé », `heberge` pour « Type utilisé ». La
	 * position par défaut n'ouvre rien.
	 */
	const aSupprimer = $derived(
		sup === 'utilise' ? null : (types.find((t) => usage(t.cle) === 0) ?? null)
	);
	const relationsASupprimer = $derived(aSupprimer ? usage(aSupprimer.cle) : 0);
	const autresTypes = $derived(aSupprimer ? types.filter((t) => t !== aSupprimer) : []);
</script>

<Coquille
	forme="abregee"
	role="admin"
	classeEnveloppe="console"
	classeContenu="travail"
	idContenu="travail"
	fil={filDeConsole('Types de relations')}
	donnees={{ 'data-form': panneauOuvert ? 'ouvert' : 'ferme' }}
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
	{#snippet avantContenu()}
		<NavigationConsole courante="relations" />
	{/snippet}

	{#snippet enfants()}
		<TeteDeSection
			titre="Types de relations"
			description={`Le vocabulaire qui relie les ${motFichePlurielMinuscule} entre elles. Chaque type se lit dans les deux sens : « héberge » d'un côté, « est hébergé par » de l'autre. C'est ce couple qui rend le graphe compréhensible sans légende.`}
		>
			{#snippet action()}
				<BoutonDeCreation libelle="Nouveau type" />
			{/snippet}
		</TeteDeSection>

		<div class="tableau-gestion">
			<div class="tg tg--relations tg--entetes" role="row">
				<span>Libellé direct</span>
				<span>Libellé inverse</span>
				<span class="tg--masquable">Usage attendu</span>
				<span class="tg--masquable">Relations</span>
				<span></span>
			</div>
			<div id="liste">
				{#each types as t (t.cle)}
					{@const n = usage(t.cle)}
					<div class="tg tg--relations tg--ligne">
						<span class="sens"
							><span class="sens__fleche"
								><svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"><path d="M2 8h11M9.5 4.5L13 8l-3.5 3.5" /></svg
								></span
							><span class="sens__libelle">{t.direct}</span>{#if t.technique}<span
									class="past"
									title="Entre dans le calcul des points de rupture">technique</span
								>{/if}</span
						>
						<span class="sens sens--inverse"
							><span class="sens__fleche"
								><svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"><path d="M14 8H3M6.5 4.5L3 8l3.5 3.5" /></svg
								></span
							><span class="sens__libelle">{t.inverse}</span></span
						>
						<span class="tg__desc tg--masquable" style="margin-top:0">{t.usage}</span>
						<span class="tg__n tg--masquable" style={n ? undefined : 'color:var(--c-encre-4)'}
							>{n} {n > 1 ? 'relations' : 'relation'}</span
						>
						<div class="tg__actions">
							<button class="btn" type="button">Modifier</button>
							<button
								class="btn btn--destructif"
								type="button"
								aria-label="Supprimer le type {t.direct}"
								><svg
									width="14"
									height="14"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.4"
									><path
										d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8"
									/></svg
								></button
							>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/snippet}

	{#snippet superposition()}
		<aside class="tiroir-form" id="tiroir" aria-label="Formulaire de type de relation">
			<div class="tiroir-form__tete">
				<div style="min-width:0">
					<h2 class="tiroir-form__titre" id="form-titre">
						{edite ? edite.direct : 'Nouveau type de relation'}
					</h2>
					<div class="tiroir-form__sous" id="form-sous">
						{#if edite}{relationsEditees}
							{relationsEditees > 1
								? 'relations déclarées utilisent ce type.'
								: 'relation déclarée utilise ce type.'}{:else}Un couple de libellés, un par sens de
							lecture.{/if}
					</div>
				</div>
				<button class="tiroir-form__fermer" id="form-fermer" aria-label="Fermer le formulaire">
					<svg
						width="17"
						height="17"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
					>
				</button>
			</div>

			<div class="tiroir-form__corps">
				<div class="champ" id="champ-direct">
					<label class="champ__label" for="f-direct"
						>Libellé direct <span class="oblig">*</span></label
					>
					<input
						class="saisie"
						type="text"
						id="f-direct"
						autocomplete="off"
						placeholder="héberge"
						value={edite ? edite.direct : ''}
					/>
					<span class="champ__aide"
						>Se lit de la {motFicheMinuscule} d'origine vers la {motFicheMinuscule} cible. En minuscules,
						à la troisième personne.</span
					>
					<div class="champ__erreur" id="erreur-direct" hidden>
						<svg
							width="13"
							height="13"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							style="flex:none;margin-top:1px"
							><path d="M8 4.5v4M8 11.2v.3" /><circle cx="8" cy="8" r="6.2" /></svg
						>
						<span id="erreur-direct-txt"></span>
					</div>
				</div>

				<div class="champ" id="champ-inverse">
					<label class="champ__label" for="f-inverse"
						>Libellé inverse <span class="oblig">*</span></label
					>
					<input
						class="saisie"
						type="text"
						id="f-inverse"
						autocomplete="off"
						placeholder="est hébergé par"
						value={edite ? edite.inverse : ''}
					/>
					<span class="champ__aide"
						>Se lit de la cible vers l'origine. C'est lui qui apparaît dans le panneau Relations de
						la {motFicheMinuscule} visée.</span
					>
					<div class="champ__erreur" id="erreur-inverse" hidden>
						<svg
							width="13"
							height="13"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							style="flex:none;margin-top:1px"
							><path d="M8 4.5v4M8 11.2v.3" /><circle cx="8" cy="8" r="6.2" /></svg
						>
						<span id="erreur-inverse-txt"></span>
					</div>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-desc">Usage attendu</label>
					<textarea
						class="saisie"
						id="f-desc"
						rows="2"
						placeholder="Quand employer ce type plutôt qu'un autre."
						value={edite ? edite.usage : ''}></textarea>
					<span class="champ__aide"
						>Affiché au moment de déclarer une relation. C'est ce qui évite que deux types voisins
						soient employés au hasard.</span
					>
				</div>

				<div class="champ">
					<label class="case" style="align-items:flex-start">
						<input type="checkbox" id="f-technique" checked={edite ? edite.technique : false} />
						<span class="case__txt"
							>Dépendance technique
							<span class="case__aide"
								>Entre dans le calcul des points de rupture de la cartographie. À cocher pour «
								héberge » ou « dépend de », à laisser vide pour « documente » — une note qui en
								documente une autre n'en dépend pas.</span
							>
						</span>
					</label>
				</div>

				<div class="champ">
					<span class="champ__label">Aperçu dans les deux sens</span>
					<div class="apercu-phrases" id="apercu">
						{#if panneauOuvert}{#each phrases as p (p.sens)}<div class="phrase {p.modificateur}">
									<span class="phrase__sens">{p.sens}</span><span
										><i>{p.sujet}</i>
										{#if p.libelle}<b>{p.libelle}</b>{:else}<span class="phrase__manque"
												>…libellé à saisir…</span
											>{/if}
										<i>{p.objet}</i>.</span
									>
								</div>{/each}{/if}
					</div>
					<span class="champ__aide" style="margin-top:var(--e-2)"
						>Changez les sujets pour éprouver la formulation sur un autre couple :</span
					>
					<div class="exemples" id="exemples">
						{#if panneauOuvert}{#each COUPLES as couple (couple[0])}<button
									type="button"
									style={couple === COUPLE_COURANT
										? 'border-color:var(--c-accent);background:var(--c-accent-voile);color:var(--c-accent-fonce)'
										: undefined}>{couple[0]} / {couple[1]}</button
								>{/each}{/if}
					</div>
				</div>
			</div>

			<div class="tiroir-form__pied">
				<button class="btn btn--destructif" id="form-supprimer" hidden={!edite}>Supprimer</button>
				<button class="btn" id="form-annuler">Annuler</button>
				<button class="btn btn--principal" id="form-valider"
					><span id="form-valider-txt">{edite ? 'Enregistrer' : 'Créer le type'}</span></button
				>
			</div>
		</aside>

		<dialog
			class="dlg dlg--destructif"
			id="dlg-supprimer"
			aria-labelledby="dlg-sup-titre"
			open={aSupprimer !== null}
		>
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
							><path d="M8 4.5v4.2M8 11.4v.3" /><path
								d="M7 1.9L1.3 12.4a.9.9 0 0 0 .8 1.3h11.8a.9.9 0 0 0 .8-1.3L9 1.9a1.1 1.1 0 0 0-2 0z"
							/></svg
						>
					</span>
					<h2 class="dlg__titre" id="dlg-sup-titre">Supprimer le type de relation</h2>
					<button class="dlg__fermer" data-fermer aria-label="Fermer">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8" /></svg
						>
					</button>
				</div>
				<div class="dlg__corps" id="sup-corps">
					{#if aSupprimer}{#if relationsASupprimer === 0}<p class="dlg__texte">
								« {aSupprimer.direct} » n'est utilisé par aucune relation. Sa suppression retire seulement
								ce couple de libellés du vocabulaire proposé.
							</p>{:else}<div class="refus">
								<div class="refus__titre">Suppression refusée en l'état : ce type est employé</div>
								<ul>
									<li>
										<b>{relationsASupprimer}</b>{relationsASupprimer > 1
											? `relations déclarées entre des ${motFichePlurielMinuscule}`
											: `relation déclarée entre des ${motFichePlurielMinuscule}`}
									</li>
									{#if aSupprimer.technique}<li>
											Type technique : sa disparition modifiera le calcul des points de rupture de
											la cartographie.
										</li>{/if}
								</ul>
								<div class="refus__sortie">
									Choisissez ce qu'il advient de ces relations. Aucune {motFicheMinuscule} n'est supprimée
									dans les deux cas : seul le lien entre elles est concerné.
								</div>
							</div>
							<div class="choix-reaffectation">
								<label
									><input type="radio" name="sortie" value="reaffecter" checked /><span
										style="flex:1"
										>Réaffecter à un autre type<select
											class="selecteur"
											style="margin-top:var(--e-2);width:100%;padding:6px var(--e-2);border:1px solid var(--c-trait-fort);border-radius:var(--r-2);background:var(--c-papier);font-family:var(--f-ui);font-size:var(--t-petit)"
											>{#each autresTypes as t (t.cle)}<option value={t.cle}
													>{t.direct} / {t.inverse}</option
												>{/each}</select
										><span class="aide"
											>Les {relationsASupprimer} relations sont conservées et changent d'étiquette. Le
											graphe garde sa structure.</span
										></span
									></label
								><label
									><input type="radio" name="sortie" value="supprimer" /><span style="flex:1"
										>Supprimer aussi ces {relationsASupprimer} relations<span class="aide"
											>Les liens disparaissent du graphe et des panneaux Relations. Les {motFichePlurielMinuscule}
											restent intactes. Cette perte est définitive.</span
										></span
									></label
								>
							</div>{/if}{/if}
				</div>
				<div class="dlg__pied">
					<button class="btn" data-fermer id="sup-annuler">Annuler</button>
					<button
						class="btn btn--principal btn--destructif"
						id="sup-valider"
						style="background:var(--c-danger);border-color:var(--c-danger);color:#fff"
						>{aSupprimer && relationsASupprimer === 0 ? 'Supprimer' : 'Appliquer'}</button
					>
				</div>
			</div>
		</dialog>
	{/snippet}
</Coquille>
