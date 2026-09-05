<script lang="ts">
	/**
	 * V-42 — LA PLANCHE DES ÉTATS DE VIVACITÉ.
	 *
	 * Cinq lignes, une par état : le nom et sa règle, la ligne compacte RENDUE DANS CET ÉTAT, et
	 * la forme de rail. C'est la référence à laquelle on compare quand un écran doute — et c'est
	 * aussi la preuve que la fabrique et le glyphe rendent ce que la spécification dit, dans un
	 * navigateur, sur une vraie page.
	 *
	 * ELLE NE RECALCULE RIEN. Les cinq lignes sortent de `vivacite()`, la fabrique unique, sur des
	 * cycles construits pour tomber dans chaque état. Écrire ici « il reste 67 jours » serait un
	 * second calcul, donc un point de divergence pour demain.
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI (P-1, ADR-002) : elles vivent dans `V-42.css`.
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import GlypheDeVivacite from '$lib/GlypheDeVivacite.svelte';
	import { COMPTE_VIDE } from '$lib/coquille/compte-vide';
	import {
		ORDRE_DES_ETATS,
		vivacite,
		type CycleDeVivacite,
		type EtatDeVivacite,
		type SeuilsDeVivacite
	} from '$lib/fraicheur';
	import type { Domaine, Note, Univers } from '../../seeds/corpus';

	interface Proprietes {
		/** Le corpus lisible — le rail s'en dérive, et rien d'autre ici ne le lit. */
		notes: readonly Note[];
		univers: readonly Univers[];
		domaines: readonly Domaine[];
		/** Le jour de référence, pris par le chargeur. Jamais une horloge de navigateur. */
		aujourdhui: string;
		/**
		 * LES SEUILS EN VIGUEUR, LUS EN BASE. La planche les affiche ET les emploie : une
		 * constante ferait mentir la page dès qu'un administrateur les règle en console.
		 */
		seuils: SeuilsDeVivacite;
	}

	const { notes, univers, domaines, aujourdhui, seuils }: Proprietes = $props();

	/**
	 * L'ANCIENNETÉ QUI POSE CHAQUE ÉTAT, pour une validité de quatre-vingt-dix jours. Ce sont les
	 * valeurs du prototype validé : elles donnent « dans 67 jours », « dans 6 jours », « 4 jours
	 * de retard », « 21 jours de retard », « 110 jours de retard ».
	 */
	const ANCIENNETE: Readonly<Record<EtatDeVivacite, number>> = {
		ajour: 23,
		bientot: 84,
		averifier: 94,
		arevoir: 111,
		obsolete: 200
	};

	const VALIDITE = 90;

	/** Le jour civil à N jours en arrière, en forme ISO. */
	function ilYA(jours: number): string {
		const base = new Date(`${aujourdhui}T12:00:00Z`);
		return new Date(base.getTime() - jours * 86400000).toISOString().slice(0, 10);
	}

	const lignes = $derived(
		ORDRE_DES_ETATS.map((etat) => {
			const verifiee = ilYA(ANCIENNETE[etat]);
			const cycle: CycleDeVivacite = { verifiee, modifiee: verifiee, validite: VALIDITE };
			return { etat, viv: vivacite(cycle, aujourdhui, seuils) };
		})
	);
</script>

<Coquille
	fil={['Accueil', 'Planche des états de vivacité']}
	classeContenu="planche"
	{univers}
	{domaines}
	{notes}
	compte={COMPTE_VIDE}
	version=""
>
	{#snippet enfants()}
		<header class="planche__tete">
			<p class="etiq">Composant</p>
			<h1 class="planche__titre">États de vivacité</h1>
			<p class="planche__chapo">
				Cinq états, un seul composant. Forme, libellé et information temporelle portent le sens ; la
				couleur le répète. Plus la note demande d'attention, plus la ligne prend de place visuelle.
			</p>
		</header>

		<div class="planche__liste">
			{#each lignes as ligne (ligne.etat)}
				<section class="etat">
					<div class="etat__identite">
						<h2 class="etat__nom">{ligne.viv.libelle}</h2>
						<p class="etat__regle">{ligne.viv.regle}</p>
					</div>

					<div class="etat__demonstration">
						<!--
							LA LIGNE COMPACTE, RENDUE DANS SON ÉTAT. `data-attention` porte le degré :
							c'est lui qui décide du fond et du poids de l'échéance, jamais une couleur
							écrite dans le balisage.
						-->
						<p class="ligne-vivacite" data-attention={ligne.viv.attention}>
							<span class="ligne-vivacite__etat {ligne.viv.classe}">
								<GlypheDeVivacite etat={ligne.etat} />{ligne.viv.libelle}
							</span>
							<span class="ligne-vivacite__sep" aria-hidden="true"></span>
							<span class="ligne-vivacite__verif">{ligne.viv.ligneVerification}</span>
							<span class="ligne-vivacite__sep" aria-hidden="true"></span>
							<span class="ligne-vivacite__echeance {ligne.viv.classe}"
								>{ligne.viv.ligneEcheance}</span
							>
						</p>

						<p class="etat__rail">
							<span class="etiq">Rail compact</span>
							<span class="rail-compact {ligne.viv.classe}">
								<GlypheDeVivacite etat={ligne.etat} taille={12} />{ligne.viv.compact}
							</span>
						</p>
					</div>
				</section>
			{/each}
		</div>

		<aside class="cycle">
			<p class="etiq">Cycle</p>
			<p class="cycle__texte">
				Vérification → <strong>À jour</strong> pendant la durée de validité →
				<strong>Bientôt à vérifier</strong>
				{seuils.bientot} jours avant l'échéance → à l'échéance, passage automatique à
				<strong>À vérifier</strong>
				→ après {seuils.retardRevoir} jours de retard ou sur demande de révision,
				<strong>À revoir</strong>
				→ après {seuils.retardObsolete} jours de retard, <strong>Obsolète</strong>. Une nouvelle
				vérification relance le cycle.
			</p>
		</aside>
	{/snippet}
</Coquille>
