<script lang="ts">
	/**
	 * `/notes/{identifiant}/relations` — le panneau de gestion des relations.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * CET ÉCRAN N'A PAS DE MAQUETTE GELÉE, ET IL FAUT LE DIRE EN PREMIER
	 *
	 * Le gel place ce geste dans V-14 — bouton « + Ajouter » du panneau
	 * « Relations » (`mockups/V-14-lecture-note.html:1848`) — et lui donne la
	 * forme du dialogue `d-relation` de V-40 (`mockups/V-40-dialogues.html:1227`).
	 * Ni l'un ni l'autre n'est monté ici : `src/vues/V-14.svelte` est hors du
	 * périmètre de ce lot, et `src/vues/V-40.svelte` fixe sa note de
	 * démonstration en dur (`n-restaurer-pg`, `V-40:160`), ce qui en ferait un
	 * écran qui parle d'une autre note que celle qu'on regarde — la valeur
	 * illustrative que `P-02` proscrit.
	 *
	 * CE QUI EST PORTÉ DU GEL, MALGRÉ TOUT :
	 *   • le titre du dialogue — « Ajouter une relation » ;
	 *   • ses deux champs, dans l'ordre : « Type de relation », « Note visée » ;
	 *   • le libellé de son bouton — « Déclarer la relation » ;
	 *   • le groupement des relations par libellé de type, et la forme
	 *     `rel-groupe` / `rel-groupe__titre etiq` que V-14, V-19 et V-20
	 *     partagent ;
	 *   • l'état vide de V-14 — « Aucune relation », « Cette note n'est reliée à
	 *     aucune autre par une relation qualifiée ».
	 *
	 * CE QUI NE L'EST PAS, ET POURQUOI :
	 *   • l'APERÇU « Ce que cela produira », les deux phrases `phrase-rel` du
	 *     dialogue. Elles se recomposent à chaque frappe, donc en JavaScript ;
	 *     cette page est rendue au serveur, sans hydratation (`ADR-001`). Les
	 *     deux libellés du type sont portés autrement : ils sont ÉCRITS DANS
	 *     L'OPTION, ce qui tient `RG-M08-06` — « l'interface affiche toujours le
	 *     libellé adapté au sens de lecture » — au moment où le choix se fait ;
	 *   • la RECHERCHE de la note visée, `input[type=search]` et sa liste
	 *     déroulante. Même raison. Le choix se fait dans un `select`, dont la
	 *     planche dit l'usage : « le sélecteur quand les valeurs possibles sont
	 *     connues, fermées et peu nombreuses » (`docs/DESIGN.md` D-3).
	 *
	 * AUCUNE CLASSE INVENTÉE. Toutes celles employées ici sont soit déclarées par
	 * le socle (`etiq`, `btn*`, `past*`, `panneau*`, `zone-etat*`, `champ*`),
	 * soit transverses au sens de `docs/DESIGN.md` §2 : `rel-groupe` et
	 * `rel-groupe__titre` (V-14, V-19, V-20), `rel-item`, `rel-item__t`,
	 * `rel-item__s` (V-19, V-20, V-40), `selecteur` (12 vues), `doc` et
	 * `doc__tete` (V-38, V-40, V-41). Aucune règle de style n'est écrite, aucune
	 * feuille n'est modifiée.
	 *
	 * LA FEUILLE PORTÉE EST CELLE DE V-40, et le choix se justifie : c'est la
	 * maquette qui porte le dialogue de ce geste, et sa feuille déclare les trois
	 * familles dont cet écran a besoin et que le socle n'a pas — `doc`,
	 * `selecteur`, `rel-item*`. Elle est importée, jamais modifiée.
	 *
	 * ═════════════════════════════════════════════════════════════════════════
	 * TROIS PIÈGES, ET AUCUN N'EST OUVERT ICI
	 *
	 *   1. SvelteKit rend 500 si une action par défaut cohabite avec une action
	 *      nommée : les deux actions de cette page sont NOMMÉES, il n'y a pas
	 *      d'action par défaut ;
	 *   2. `formulaire.action` n'est jamais réécrit avant `requestSubmit()` :
	 *      aucun formulaire n'est soumis par JavaScript, chacun porte son propre
	 *      attribut `action` au balisage ;
	 *   3. un `button` sans attribut `type` SOUMET : tous ceux de cette page
	 *      portent `type="submit"`, et il n'y en a pas d'autre.
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { resolve } from '$app/paths';
	import '../../../../vues/V-40.css';
	import type { ActionData, PageData } from './$types';

	/**
	 * LE MOTIF DE ROUTE, ÉCRIT EN CONSTANTE — même raison qu'à `V-07:455` :
	 * `svelte/no-navigation-without-resolve` inspecte l'EXPRESSION du `href`, et
	 * une adresse composée à la main lui est opaque.
	 */
	const ROUTE_DE_NOTE = '/notes/[identifiant]' as const;
	/** Les deux adresses qui débloquent, écrites en constantes pour la même raison. */
	const ROUTE_DES_TYPES_DE_RELATIONS = '/console/types-de-relations' as const;
	const ROUTE_DE_NOTE_NOUVELLE = '/notes/nouvelle' as const;

	const { data, form }: { data: PageData; form: ActionData } = $props();

	/**
	 * Le rangement de la note, composé PAR LE CHARGEUR : le séparateur de chemin
	 * est une constante du corpus (`SEPARATEUR_DE_CHEMIN`), et le réécrire ici en
	 * ferait une seconde définition.
	 */
	const rangement = $derived(data.rangement);

	/** Le compte des relations, tel que le panneau l'annonce. */
	const combien = $derived(data.groupes.reduce((n, g) => n + g.relations.length, 0));

	/**
	 * DEUX MANQUES DISTINCTS, ET ILS NE SE SOIGNENT PAS AU MÊME ENDROIT.
	 *
	 * Le formulaire exigeait trois conditions et n'en annonçait aucune : sur une
	 * instance neuve — aucun type de relation, une seule note — le panneau
	 * « Ajouter une relation » n'était pas ÉMIS DU TOUT, et l'écran se refermait
	 * sur « Aucune relation » sans jamais dire pourquoi aucune n'était
	 * déclarable. `P-09` demande de ne pas offrir un geste impossible ; elle ne
	 * demande pas de taire ce qui le rend impossible.
	 *
	 * Les deux manques sont portés SÉPARÉMENT, parce qu'ils se comblent
	 * séparément : un type de relation se crée dans la console
	 * (`/console/types-de-relations`, réservée à l'administrateur), une seconde
	 * note se crée depuis `/notes/nouvelle` — ou le droit d'écriture se demande
	 * sur la note visée. Les confondre en une phrase enverrait la moitié des
	 * lecteurs au mauvais endroit.
	 */
	const sansType = $derived(data.typesOfferts.length === 0);
	const sansCible = $derived(data.cibles.length === 0);

	/** `P-09` — le formulaire n'est ÉMIS que si le geste est possible. */
	const peutEcrire = $derived(data.droits === 'ecriture' && !sansType && !sansCible);
</script>

<!--
	LA VERSION DU PIED DE RAIL VIENT DU CONTEXTE DE COQUILLE, lu sur
	`package.json` par le gabarit racine. Ce chargeur servait `INSTANCE.version`
	de `seeds/corpus.ts` — un numéro de démonstration présenté comme un fait de
	l'instance. La propriété reste, vide : le contexte l'emporte toujours ici.
-->
<Coquille
	classeContenu="doc"
	fil={['Accueil', ...rangement, data.note.titre, 'Relations']}
	courant={rangement.slice(1)}
	droits={data.droits}
	univers={data.univers}
	domaines={data.domaines}
	notes={data.notes}
	compte={data.compte}
	version=""
>
	{#snippet enfants()}
		<div class="doc__tete">
			<h1>Relations de « {data.note.titre} »</h1>
			<p>
				Une relation est un lien qualifié et dirigé entre deux notes. Elle se lit dans les deux
				sens, chacun avec son propre libellé, et elle nourrit la cartographie.
			</p>
		</div>

		{#if form && 'motif' in form && typeof form.motif === 'string'}
			<div class="zone-etat">
				<div class="zone-etat__titre">Relation refusée</div>
				<div class="zone-etat__txt">{form.motif}</div>
			</div>
		{/if}

		<!-- ---------- Les relations déjà déclarées ---------- -->
		<section class="panneau">
			<div class="panneau__tete">
				<span class="etiq">Relations</span>
				<span class="past">{combien}</span>
			</div>
			<div class="panneau__corps panneau__corps--serre">
				{#each data.groupes as groupe (groupe.libelle)}
					<div class="rel-groupe">
						<div class="rel-groupe__titre etiq">{groupe.libelle}</div>
						{#each groupe.relations as relation (relation.id)}
							<div class="rel-item">
								<div class="rel-item__t">
									<a href={resolve(ROUTE_DE_NOTE, { identifiant: relation.autre.identifiant })}
										>{relation.autre.titre}</a
									>
								</div>
								<div class="rel-item__s">
									<span class="past past--type">{relation.autre.type}</span>
									<span class="past">{relation.autre.domaine}</span>
									<!--
										`P-08` — L'ORIGINE, ÉCRITE EN TOUTES LETTRES. Le mot vient de
										`libelleDOrigine()`, seule traduction de l'énuméré du schéma, et
										les trois valeurs sont celles du cahier (`CDC:901`).
									-->
									<span class="past">origine : {relation.origine}</span>
									<!--
										LE SENS, DANS LES MOTS DU GEL. `phrase-rel__sens` du dialogue
										`d-relation` dit « sens direct » quand la note lue est la source,
										« sens inverse » quand elle est la cible
										(`mockups/V-40-dialogues.html:3450`). Ce sont ces deux mots-là,
										et non une reformulation : ils disent de quel côté la relation a
										été saisie sans jamais se confondre avec son ORIGINE.
									-->
									<span class="past"
										>{relation.sens === 'sortante' ? 'sens direct' : 'sens inverse'}</span
									>
								</div>
								{#if data.droits === 'ecriture'}
									<form method="POST" action="?/retirer">
										<input type="hidden" name="relation" value={relation.id} />
										<button class="btn btn--discret btn--destructif" type="submit"
											>Retirer cette relation</button
										>
									</form>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="zone-etat">
						<div class="zone-etat__titre">Aucune relation</div>
						<div class="zone-etat__txt">
							Cette note n'est reliée à aucune autre par une relation qualifiée.
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!--
			---------- Déclarer une relation ----------

			LE PANNEAU EST ÉMIS DÈS QUE L'APPELANT PEUT ÉCRIRE, et son corps dit alors
			l'une de deux choses : le formulaire, ou ce qui manque pour l'ouvrir. Sans
			droit d'écriture, rien n'est émis — c'est `P-09`, et l'absence n'est alors
			pas un manque à combler.
		-->
		{#if data.droits === 'ecriture'}
			<section class="panneau">
				<div class="panneau__tete">
					<span class="etiq">Ajouter une relation</span>
				</div>
				<div class="panneau__corps">
					{#if !peutEcrire}
						<!--
							CE QUI MANQUE, NOMMÉ AVEC SON ADRESSE — le modèle est celui de
							`MESSAGE_AMORCAGE` ($lib/donnees/amorcage.ts) et du premier univers de
							V-07 : on nomme le geste ET l'endroit où il se fait. Les deux manques
							valent ensemble sur une instance neuve, et les deux sont alors écrits
							— l'un ne masque pas l'autre.
						-->
						{#if sansType}
							<div class="zone-etat">
								<div class="zone-etat__titre">Aucun type de relation n'existe encore</div>
								<div class="zone-etat__txt">
									Une relation est qualifiée par un type, qui porte son libellé dans chaque sens de
									lecture. Tant qu'aucun type n'est déclaré, aucune relation ne peut l'être. Les
									types se créent dans la console, à l'adresse /console/types-de-relations —
									réservée à l'administrateur.
								</div>
								{#if data.administrateur}
									<a class="btn btn--principal" href={resolve(ROUTE_DES_TYPES_DE_RELATIONS)}
										>Créer un type de relation</a
									>
								{/if}
							</div>
						{/if}
						{#if sansCible}
							<div class="zone-etat">
								<div class="zone-etat__titre">Aucune autre note à relier</div>
								<div class="zone-etat__txt">
									Une relation relie deux notes, et la déclarer exige le droit d'écriture sur les
									deux extrémités : aucune autre note de votre périmètre d'écriture n'est
									disponible. Créez-en une seconde à l'adresse /notes/nouvelle, ou faites-vous
									accorder l'écriture sur la note que vous visez.
								</div>
								<a class="btn btn--principal" href={resolve(ROUTE_DE_NOTE_NOUVELLE)}
									>Créer une note</a
								>
							</div>
						{/if}
					{:else}
						<form method="POST" action="?/ajouter">
							<div class="champ">
								<label class="champ__label" for="rel-type">Type de relation</label>
								<select class="selecteur" id="rel-type" name="type">
									{#each data.typesOfferts as type (type.identifiant)}
										<option value={type.identifiant}
											>{type.sortant} — depuis l'autre note : {type.entrant}</option
										>
									{/each}
								</select>
								<span class="champ__aide"
									>Le premier libellé se lit depuis cette note, le second depuis la note visée.</span
								>
							</div>
							<div class="champ">
								<label class="champ__label" for="rel-cible">Note visée</label>
								<select class="selecteur" id="rel-cible" name="cible">
									{#each data.cibles as cible (cible.identifiant)}
										<option value={cible.identifiant}
											>{cible.titre} — {cible.type}, {cible.domaine}</option
										>
									{/each}
								</select>
								<span class="champ__aide"
									>Seules les notes sur lesquelles vous pouvez écrire sont proposées : déclarer une
									relation exige le droit d'écriture sur les deux extrémités.</span
								>
							</div>
							<button class="btn btn--principal" type="submit">Déclarer la relation</button>
						</form>
					{/if}
				</div>
			</section>
		{/if}
	{/snippet}
</Coquille>
