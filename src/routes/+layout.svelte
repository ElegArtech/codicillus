<script lang="ts">
	// Enveloppe provisoire — lot T-002.
	// La coquille applicative réelle (navigation, en-tête, panneaux) est le lot
	// T-016, adossée à la maquette V-37. Rien n'est anticipé ici.

	// Le socle — lot T-004. Importé ici, et ici seulement : la mise en page
	// racine est le point d'entrée global de SvelteKit, et un import de feuille
	// depuis un `<script>` n'est pas encapsulé par le compilateur Svelte. La
	// feuille s'applique donc à toutes les routes, sans être portée par un
	// composant. `src/socle.css` est extrait mécaniquement du premier bloc
	// `<style>` de `mockups/V-07-accueil-contributeur.html` par
	// `pnpm socle:extraire` ; sa non-divergence est prouvée par
	// `pnpm verif:jetons` (batterie 2, ADR-002, ÉCART-007). Il ne s'édite pas.
	import '../socle.css';
	import { onMount, setContext } from 'svelte';
	import { cablerLaCoquille } from '$lib/cablage/coquille';
	import { CLE_IDENTITE, type IdentiteDeCoquille } from '$lib/coquille/identite';
	import { formesDuMot } from '$lib/vocabulaire';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	/**
	 * LE MOT RENOMMABLE, DÉRIVÉ UNE FOIS ET ICI SEULEMENT.
	 *
	 * `$lib/vocabulaire.ts` calculait ses quatre formes À L'IMPORT, depuis
	 * `CONFIG.motFiche` de `seeds/corpus.ts` : une constante de module, figée au
	 * chargement et partagée par toutes les requêtes du serveur, ne peut pas
	 * suivre une configuration. Renommer « Fiche » en console ne changeait donc
	 * rien à l'écran, alors que `RG-M14-09` promet un recalcul immédiat.
	 *
	 * Les QUATRE FORMES descendent, pas le mot brut : dix-sept composants
	 * rappelleraient sinon `pluriel()` et `initialeMinuscule()` chacun de son
	 * côté. `$derived` plutôt qu'un accesseur qui recalcule à chaque lecture : le
	 * mot est lu plusieurs fois par page, la dérivation une seule fois par valeur.
	 *
	 * La page d'erreur peut être rendue sans données de gabarit — le mot vaut
	 * alors `Fiche`, exactement ce que `motConfigure('')` rend.
	 */
	const vocabulaire = $derived(formesDuMot(data.motFiche ?? ''));

	/**
	 * L'IDENTITÉ RÉELLE DESCEND PAR CONTEXTE, ET D'ICI SEULEMENT.
	 *
	 * `Coquille.svelte` exige une propriété `compte` ; les vues la remplissent
	 * depuis `MOI` de `seeds/corpus.ts` et aucune route ne la passait — la barre
	 * supérieure affichait donc « Karim Belhadj — Référent » pour tout le monde,
	 * sur les huit pages qui montent une coquille. Mesuré le 21/08/2026.
	 *
	 * Le contexte plutôt que la propriété : trente `+page.svelte` qui recopieraient
	 * chacun le même passage divergeraient au premier oubli (`P-35`), et le défaut
	 * se lirait comme une identité fausse sur une page et juste sur la voisine.
	 * La coquille lit le contexte quand il existe, et retombe sur sa propriété
	 * sinon — le rendu par défaut des vues ne bouge donc pas d'un pixel.
	 */
	setContext<IdentiteDeCoquille>(CLE_IDENTITE, {
		get compte() {
			return data.compte;
		},
		get administrateur() {
			return data.administrateur;
		},
		get univers() {
			/* La page d'erreur peut être rendue sans données de gabarit. */
			return data.univers ?? [];
		},
		get domaines() {
			return data.domaines ?? [];
		},
		/* La version du paquet, pas le `1.0.0` du jeu de semence. `null` sur la
		   page d'erreur, qui peut être rendue sans données de gabarit. */
		get version() {
			return data.version ?? null;
		},
		/* LE NOM DE L'ORGANISATION, LU SUR LA TABLE `parametres` — pas la
		   « Direction technique » que huit vues écrivaient en dur, et que toute
		   autre organisation lisait comme un fait sur SON instance. Un accesseur,
		   comme les autres membres : le renommage fait en console descend sans
		   que le contexte soit réémis. Chaîne vide sur une instance qui ne s'est
		   pas nommée, et sur la page d'erreur, qui peut être rendue sans données
		   de gabarit — les vues rendent alors « Codicillus » seul, le nom du
		   LOGICIEL, qui n'est pas concerné. */
		get nomOrganisation() {
			return data.nomOrganisation ?? '';
		},
		/* AUCUNE SOURCE N'EXISTE — aucune table ne porte l'instant de la dernière
		   synchronisation. Constante, et non un accesseur sur `data` : il n'y a
		   rien à suivre. `V-07.svelte` lit ce `null` et n'émet pas la ligne
		   « Dernière synchronisation … » du pied, plutôt que la date fabriquée du
		   jeu de semence. */
		synchro: null,
		/* LE RATTACHEMENT DÉCIDE DE CE QUE LA BARRE ÉMET. Les deux entrées du
		   menu « Créer » qui exigent un domaine étaient servies puis retirées
		   par le câblage, après hydratation : `P-09` les veut absentes, donc
		   non émises. La page d'erreur peut être rendue sans données de
		   gabarit — la coquille retombe alors sur son rendu par défaut. */
		get rangement() {
			return data.rangement;
		},
		/* LE MOT DE M14.7, LU SUR LA TABLE `parametres` — pas celui du jeu de
		   démonstration. Un accesseur, comme les autres membres : la configuration
		   change, `data` change, et les quinze vues qui affichent le mot suivent
		   sans que le contexte soit réémis. */
		get vocabulaire() {
			return vocabulaire;
		},
		/* LES IDENTIFIANTS D'ADRESSE DES UNIVERS ET DES DOMAINES, PAR LEUR NOM —
		   lus en base par le chargeur racine, dans les requêtes qu'il émettait
		   déjà pour le rail. Les vues ne reçoivent que des noms d'affichage et
		   composaient l'adresse en les slugifiant ; l'identifiant, lui, est
		   persisté et ne suit pas les renommages (`RG-M12-11`), et renommer un
		   univers ou un domaine rendait donc 404 toutes ses adresses. Un
		   accesseur, comme les autres membres : la table suit une navigation sans
		   que le contexte soit réémis. Absente sur la page d'erreur et pour
		   l'anonyme, qui n'ont pas de données de gabarit — la composition retombe
		   alors sur la dérivation du nom. */
		get designations() {
			return data.designations;
		}
	});

	/**
	 * LA COQUILLE EST CÂBLÉE ICI, ET UNE SEULE FOIS.
	 *
	 * Sa barre supérieure est rendue par trente-quatre vues, et ses boutons —
	 * menu « Créer », menu de l'utilisateur, boîte de recherche — portent des
	 * comportements que `ARB-011` retire des transcriptions. Aucun n'était
	 * câblé : la façon la plus évidente de créer une note ne créait rien, et se
	 * déconnecter demandait de taper l'adresse à la main.
	 *
	 * La mise en page racine est le seul endroit qui les voit tous. Le câblage y
	 * est délégué sur le document, donc insensible au changement de page.
	 */
	onMount(() =>
		cablerLaCoquille(document, {
			rangement: data.rangement,
			administrateur: data.administrateur,
			/* `P-03` — « Nouvelle note » et « Importer des fichiers » ne mènent nulle
			   part tant que l'appelant ne peut écrire nulle part. Même verdict que la
			   garde des deux routes, et il vient d'ici. */
			ecriture: data.ecriture
		})
	);
</script>

{@render children()}
