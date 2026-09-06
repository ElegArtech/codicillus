<script lang="ts">
	/**
	 * `/cartographie` — la cartographie, en explorateur de graphe.
	 *
	 * Ce fichier rend la vue avec ce que son chargeur a lu en base, et lui donne ses
	 * gestes. Le périmètre de droits et l'état de zone viennent de
	 * `+page.server.ts` ; le comportement vit dans `cablage.ts`, voisin (`ARB-063`).
	 *
	 * C'EST ICI QUE SE BÂTIT CE QUE LE PANNEAU CONTEXTUEL DIT DE CHAQUE NŒUD, et
	 * c'est le bon endroit : le câblage ne voit que le document, et lui faire relire
	 * un titre sur le dessin en ferait une seconde source. La table descend donc
	 * depuis les données du chargeur, une fois, à l'accrochage.
	 *
	 * ELLE NE PORTE PAS UN CHIFFRE UNIQUE DE CONNEXIONS. Les relations se comptent
	 * ensemble et les affinités à part : additionner une appartenance commune et un
	 * lien déclaré donnerait un nombre dont aucune des parts ne s'explique.
	 */
	import Vue from '../../vues/V-19.svelte';
	import '../../vues/V-19.css';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { adresseDeNote } from '$lib/rangement/adresses';
	import { ETATS_DE_VIVACITE } from '$lib/fraicheur';
	import { coucheDeLOrigine } from '$lib/graphe/filtres';
	import { pointsArticulation, sousGraphe, typeDe } from '$lib/graphe/cartographie';
	import { cablerLaCartographie, type DetailDeNoeud } from './cablage';

	import type { Domaine, IdentifiantNote } from '../../../seeds/corpus';

	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let enveloppe: HTMLDivElement;

	/** Le graphe que la vue dessine — recalculé ici pour les comptes du panneau. */
	const perimetre = $derived.by(() => {
		const brut = data.perimetreDemande;
		const barre = brut.indexOf('|');
		const type = barre < 0 ? brut : brut.slice(0, barre);
		const nom = barre < 0 ? '' : brut.slice(barre + 1);
		if ((type === 'univers' || type === 'domaine') && nom !== '') return { type, nom };
		return { type: 'global' };
	});

	const graphe = $derived(sousGraphe(data.notes, perimetre, data.relations, 'gardees'));
	const ruptures = $derived(pointsArticulation(graphe, data.relationsTechniques));

	const familleParNote = $derived(
		new Map(data.familles.familles.flatMap((f) => f.membres.map((membre) => [membre, f] as const)))
	);

	const titreParNote = $derived(new Map(data.notes.map((n) => [n.id, n.titre] as const)));

	/**
	 * LA CENTRALITÉ LA PLUS HAUTE DU PÉRIMÈTRE — le dénominateur de ce que le panneau
	 * montre.
	 *
	 * LA MESURE EST NORMALISÉE SUR LE NOMBRE DE PAIRES DU GRAPHE, et c'est juste :
	 * c'est ce qui la rend comparable d'un périmètre à l'autre, et c'est elle que la
	 * TAILLE d'un nœud porte. Mais elle est ILLISIBLE À L'ÉCRAN sur un corpus peu
	 * relié : sur l'instance de recette, la note la plus centrale vaut 0,002, et le
	 * panneau affichait « 0,00 » pour tout le monde — un chiffre qui ne distingue
	 * personne n'est pas une mesure, c'est du bruit.
	 *
	 * LE PANNEAU MONTRE DONC LA PART DE LA PLUS HAUTE, et il le dit. Les deux nombres
	 * ordonnent les nœuds de la même façon ; celui-ci se lit.
	 */
	const centraliteMaximale = $derived.by(() => {
		let max = 0;
		for (const noeud of graphe.noeuds) {
			const v = data.centralite[noeud.id] ?? 0;
			if (v > max) max = v;
		}
		return max;
	});

	const detailParNoeud = $derived.by<Record<string, DetailDeNoeud>>(() => {
		const table: Record<string, DetailDeNoeud> = {};
		for (const noeud of graphe.noeuds) {
			const n = noeud.note;
			let declarees = 0;
			let deduites = 0;
			let entrantes = 0;
			let sortantes = 0;
			for (const r of graphe.aretes) {
				if (r.de !== n.id && r.vers !== n.id) continue;
				if (coucheDeLOrigine((r as { origine?: string }).origine) === 'declarees') declarees += 1;
				else deduites += 1;
				if (r.de === n.id) sortantes += 1;
				else entrantes += 1;
			}
			const etat = data.vivaciteParNote[n.id] ?? null;
			const famille = familleParNote.get(n.id) ?? null;
			table[n.id] = {
				titre: n.titre,
				type: typeDe(n).nom,
				extrait: n.extrait,
				etiquettes: n.etiquettes,
				etat: etat === null ? 'Vivacité inconnue' : ETATS_DE_VIVACITE[etat].libelle,
				classeDEtat: etat === null ? '' : ETATS_DE_VIVACITE[etat].classe,
				centralite:
					centraliteMaximale === 0 ? 0 : (data.centralite[n.id] ?? 0) / centraliteMaximale,
				declarees,
				deduites,
				entrantes,
				sortantes,
				rupture: ruptures.has(n.id),
				famille: famille?.nom ?? null,
				origineDeFamille: famille?.origine ?? null,
				/* LE RANGEMENT EST UN FAIT DÉCLARÉ, et il ne se dessine PAS : il ferait
				   un arbre de rayons par-dessus le graphe des relations. Il se LIT, ici,
				   sur le nœud qu'on a choisi. */
				rangement: n.univers + ' › ' + n.domaine,
				/* LE TRANSTYPAGE NE COMBLE AUCUN TROU : les identifiants des voisins
				   d'affinité sortent des mêmes notes lisibles que le graphe, et
				   `familles.ts` les rend en `string` parce qu'il ne connaît pas le
				   type nominal du corpus. */
				affinites: (data.familles.voisinsParNote[n.id] ?? []).map((v) => {
					const identifiant = v.note as IdentifiantNote;
					return {
						note: v.note,
						titre: titreParNote.get(identifiant) ?? v.note,
						origine: v.origine + ' ' + v.trait,
						adresse: adresseDeNote(identifiant)
					};
				}),
				adresse: adresseDeNote(n.id),
				adresseDuVoisinage: `?centre=${encodeURIComponent(n.id)}&profondeur=1`
			};
		}
		return table;
	});

	/**
	 * LE CÂBLAGE SE REFAIT QUAND LES DONNÉES CHANGENT, ET C'EST UN DÉFAUT RÉPARÉ.
	 *
	 * Il s'accrochait à `onMount`, donc UNE FOIS. Depuis que le périmètre navigue par
	 * `goto` — une navigation de client, qui rejoue le chargeur sans remonter le
	 * composant —, la table `detailParNoeud` du câblage restait celle du périmètre
	 * PRÉCÉDENT : le panneau montrait une note absente du dessin, la recherche
	 * proposait des nœuds qui n'y étaient plus, et la sélection gardait le graphe
	 * entier estompé. Mesuré au navigateur en passant de « tous » à « Substack ».
	 *
	 * `$effect` rebranche à chaque changement de ses dépendances et débranche avant :
	 * les écouteurs ne s'empilent pas.
	 */
	$effect(() => {
		const debrancher = cablerLaCartographie(enveloppe, {
			perimetreCourant: data.perimetreDemande,
			/* LES DOMAINES VIENNENT DU GABARIT RACINE, comme la vue les reçoit : le
			   second sélecteur ne propose que les domaines de l'univers choisi, et le
			   câblage doit retrouver l'univers d'un domaine pour composer le périmètre. */
			domaines: (page.data.domaines as readonly Domaine[]).map((d) => ({
				nom: d.nom as string,
				univers: d.univers as string
			})),
			adresseParType: resolve('/cartographie/par-type'),
			adresseDesRelations:
				data.premiereNote === null ? null : `${adresseDeNote(data.premiereNote)}/relations`,
			exploration: data.exploration,
			detailParNoeud,
			locale: data.exploration.centre !== null,
			centre: data.exploration.centre
		});
		return debrancher;
	});
</script>

<div bind:this={enveloppe} style="display:contents">
	<!-- `univers` ET `domaines` viennent du GABARIT RACINE, qui les lit en base :
	     les propriétés de la vue retombent sinon sur le jeu de semence, et le
	     sélecteur proposait des rangements inexistants — mesuré sur une instance
	     neuve, il offrait « Production › Infrastructure » à une base qui n'en a
	     jamais eu. Le gabarit racine filtre déjà les univers au périmètre lisible
	     de l'appelant. -->
	<Vue
		univers={page.data.univers}
		domaines={page.data.domaines}
		vecteur={data.vecteur}
		notes={data.notes}
		relations={data.relations}
		typesRelation={data.typesRelation}
		relationsTechniques={data.relationsTechniques}
		perimetreDemande={data.perimetreDemande}
		familles={data.familles}
		centralite={data.centralite}
		vivaciteParNote={data.vivaciteParNote}
		exploration={data.exploration}
	/>
</div>
