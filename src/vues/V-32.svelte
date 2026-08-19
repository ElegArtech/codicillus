<script lang="ts">
	/**
	 * V-32 — Console · Comptes.
	 * Route `/console/comptes` (`docs/routes.md` §3.6).
	 *
	 * COQUILLE DE FORME ABRÉGÉE, ENVELOPPE `console` — vérifié sur le gel par
	 * `node verif/releve-vues.mjs --formes` (ARB-021, A-1 ; ARB-023).
	 *
	 * CE QUI EST COMMUN, ET CE QUI NE L'EST PAS. `src/lib/console/` porte les
	 * treize classes des dix vues de console et le panneau des six registres
	 * (`sections.ts`, en-tête). Propres à V-32 : `avatar-c`, `tg__ident`,
	 * `tg__marques`, `past--desactive`, `past--verrou`, `past--systeme`,
	 * `past--admin`, `champ__boite`, `champ__action`, `avert-unique`,
	 * `mdp-unique`, `mdp-unique__valeur`, `transmettre`, `tg--reduit`, et le
	 * modificateur de grille `tg--comptes`. AUCUNE FACTORISATION AU-DELÀ.
	 *
	 * SEULE VUE DU DÉPÔT À DEUX BOÎTES DISTINCTES ouvertes par deux états
	 * distincts — `#dlg-mdp` pour `mdp`, `#dlg-desactiver` pour `des`. La
	 * révélation `modalite-dialogue` porte sur « tout `dialog[open]` du
	 * document » et couvre donc les deux sans les nommer
	 * (`verif/references/protocole-app.json`, ARB-017).
	 *
	 * LE PANNEAU `tiroir-form` NE PÈSE AUCUN PIXEL, ET C'EST LE GEL. Hors de
	 * `div.app`, `.app[data-form="ouvert"] .tiroir-form` ne l'atteint pas ; le
	 * NIVEAU 1 en est le seul juge (`CLAUDE.md` §6, P-3).
	 *
	 * AUCUN `autofocus` : hors dialogue, le focus ne survit pas à `stabiliser()`
	 * (`CLAUDE.md` §6, P-4). Dans `#dlg-desactiver`, `showModal()` focalise
	 * `button.dlg__fermer`, premier focalisable ; dans `#dlg-mdp`, qui n'a pas
	 * de bouton de fermeture en tête, c'est `button#mdp-copier`, également le
	 * premier — rien à déclarer dans un cas comme dans l'autre.
	 *
	 * LES ÉTATS DE RÔLE ET DE DROIT SONT DES ÉTATS DE PLANCHE, PAS UNE
	 * FRONTIÈRE DE SÉCURITÉ. Le sélecteur de rôle verrouillé et le refus de
	 * désactivation du dernier administrateur reproduisent la maquette. **CE LOT
	 * NE DÉCLARE PAS `P-09` TENUE** : qu'une action interdite ne soit dans aucun
	 * DOM relève de la batterie 7 (`pnpm test:droits`) et des lots T-011, T-016.
	 *
	 * AUCUN CHIFFRE N'EST SAISI (P-02) : les comptes, leurs rôles et leurs
	 * dernières connexions viennent de `COMPTES` ; le nombre de contributions
	 * est compté sur le corpus de la vue.
	 *
	 * AUCUNE MINUTERIE, AUCUN COMPORTEMENT (ARB-011).
	 *
	 * NON RENDUS, ET DÉCLARÉS : `template#tpl-palette`, `dialog#palette` fermé,
	 * et `div.planche`, bloc hors produit (§2.G).
	 *
	 * AUCUNE RÈGLE DE STYLE N'EST ÉCRITE ICI : `src/socle.css` (P-6.1) et
	 * `src/vues/V-32.css` (P-6.3). Les styles en ligne sont ceux du gel (P-6.4).
	 */
	import Coquille from '$lib/coquille/Coquille.svelte';
	import BoutonDeCreation from '$lib/console/BoutonDeCreation.svelte';
	import NavigationConsole from '$lib/console/NavigationConsole.svelte';
	import TeteDeSection from '$lib/console/TeteDeSection.svelte';
	import { filDeConsole } from '$lib/console/sections';
	import {
		COMPTES,
		DOMAINES,
		INSTANCE,
		MOI,
		UNIVERS,
		type Compte,
		type Note,
		type RoleDeCompte
	} from '../../seeds/corpus';

	interface Proprietes {
		/** Le vecteur complet de l'état — formulaire × cas. */
		vecteur: Record<string, string | boolean> | null;
		/** Le jeu de semence de la vue — `corpusPourVue('V-32')`. */
		notes: readonly Note[];
	}

	const { vecteur, notes: corpus }: Proprietes = $props();

	/**
	 * LES QUATRE RÔLES ET LEUR AIDE sont ceux du gel (`V-32:2947`).
	 * `seeds/corpus.ts` porte le TYPE `RoleDeCompte` — les quatre noms — mais
	 * pas la phrase qui dit ce que chacun permet : elle est recopiée du gel.
	 */
	const ROLES: readonly { cle: RoleDeCompte; aide: string }[] = [
		{ cle: 'Lecteur', aide: 'Consulte, ne modifie rien.' },
		{ cle: 'Contributeur', aide: 'Écrit et modifie les notes de son domaine.' },
		{
			cle: 'Référent',
			aide: 'Contributeur, plus la gestion du rangement et des droits de son domaine.'
		},
		{ cle: 'Administrateur', aide: 'Accès complet, y compris la console et tous les domaines.' }
	];

	/**
	 * LE VERROUILLAGE DE MOT DE PASSE est un attribut du gel (`V-32:2957`), et
	 * il n'existe que là : `Compte` n'en porte pas. Le déduire d'autre chose
	 * serait inventer une règle que rien ne pose.
	 */
	const IDENTIFIANT_VERROUILLE = 'lea.marchand';

	/** Le domaine proposé à la création : le premier de la liste (`V-32:3149`). */
	const PREMIER_DOMAINE = DOMAINES[0]?.nom ?? '';

	interface CompteRendu {
		readonly compte: Compte;
		readonly verrouille: boolean;
	}

	const comptes: readonly CompteRendu[] = COMPTES.map((c) => ({
		compte: c,
		verrouille: c.identifiant === IDENTIFIANT_VERROUILLE
	}));

	/** L'ordre du gel : les actifs d'abord, puis par nom (`V-32:2989`). */
	const listeTriee: readonly CompteRendu[] = [...comptes].sort(
		(a, b) =>
			Number(b.compte.actif) - Number(a.compte.actif) ||
			a.compte.nom.localeCompare(b.compte.nom, 'fr')
	);

	function initiales(nom: string): string {
		return nom
			.split(' ')
			.map((m) => m[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	const administrateurs: readonly CompteRendu[] = comptes.filter(
		(c) => c.compte.role === 'Administrateur' && c.compte.actif
	);

	function estDernierAdmin(c: CompteRendu): boolean {
		return c.compte.role === 'Administrateur' && c.compte.actif && administrateurs.length === 1;
	}

	/** Les notes écrites par ce compte — comptées, jamais écrites. */
	function contributions(nom: string): number {
		return corpus.filter((n) => n.auteur === nom).length;
	}

	/**
	 * LE MOT DE PASSE TEMPORAIRE — LA MÊME COMPOSITION QUE LE GEL
	 * (`V-32:2975`) : trois mots tirés d'une liste de seize, prononçables et
	 * sans caractère ambigu, puis un nombre à deux chiffres.
	 *
	 * SA VALEUR NE PEUT PAS COÏNCIDER AVEC CELLE DE LA MAQUETTE, et
	 * `verif/masques.json` le dit déjà en toutes lettres : « aucune
	 * implémentation ne peut reproduire la valeur de la maquette : la comparer
	 * mesurerait le générateur, pas la vue ». Le masque couvre les PIXELS ;
	 * l'instantané ARIA du niveau 1, lui, porte encore la valeur des deux
	 * côtés. C'est un manque d'instrument, déclaré au rapport de lot — jamais
	 * une raison de figer la valeur ici, ce qui ferait de ce générateur une
	 * suite prévisible.
	 */
	const MOTS_DE_PASSE: readonly string[] = [
		'ancre',
		'brique',
		'cordon',
		'dune',
		'ferme',
		'givre',
		'hamac',
		'ilot',
		'jonc',
		'lisse',
		'menthe',
		'noyau',
		'orage',
		'pivot',
		'roseau',
		'sillon'
	];

	function motDePasse(): string {
		const t: string[] = [];
		for (let i = 0; i < 3; i++) t.push(MOTS_DE_PASSE[Math.floor(Math.random() * 16)] ?? '');
		return `${t.join('-')}-${Math.floor(Math.random() * 90) + 10}`;
	}

	/* ── L'état, tel que le vecteur de planche le décrit ───────────────────
	   Le panneau et les boîtes ne s'ouvrent que si la position DÉVIE du
	   réglage par défaut (`V-32:3337`). */
	const reglage = $derived(vecteur ?? {});
	const form = $derived(String(reglage['form'] ?? 'ferme'));
	const panneauOuvert = $derived(form !== 'ferme');
	const casMdp = $derived(reglage['c-mdp'] === true);
	const casDes = $derived(reglage['c-des'] === true);

	/**
	 * Le compte édité : « Karim Belhadj » pour la position `edition`, le premier
	 * administrateur actif pour `admin` (`V-32:3342`).
	 */
	const edite = $derived<CompteRendu | null>(
		form === 'edition'
			? (comptes.find((c) => c.compte.identifiant === 'karim.belhadj') ?? null)
			: form === 'admin'
				? (administrateurs[0] ?? null)
				: null
	);
	const nouveau = $derived(form === 'creation');
	const dernierAdminEdite = $derived(edite !== null && estDernierAdmin(edite));

	/** Le rôle porté par le sélecteur, et l'aide qui va avec (`V-32:3136`). */
	const roleCourant = $derived<RoleDeCompte>(edite ? edite.compte.role : 'Contributeur');
	const aideDuRole = $derived(ROLES.find((r) => r.cle === roleCourant)?.aide ?? '');

	/** Le mot de passe initial, généré à l'ouverture d'un formulaire de création. */
	const motDePasseInitial = $derived(nouveau ? motDePasse() : '');

	/** `mdp` réinitialise le premier compte du jeu — `comptes[0]` (`V-32:3345`). */
	const compteReinitialise = $derived(casMdp ? comptes[0] : null);
	const motDePasseAffiche = $derived(casMdp ? motDePasse() : '—');

	/** `des` désactive le premier compte actif non administrateur (`V-32:3348`). */
	const compteDesactive = $derived(
		casDes
			? (comptes.find((c) => c.compte.actif && c.compte.role !== 'Administrateur') ?? null)
			: null
	);
	const refusDeDesactivation = $derived(
		compteDesactive !== null && estDernierAdmin(compteDesactive)
	);
</script>

<Coquille
	forme="abregee"
	role="admin"
	classeEnveloppe="console"
	classeContenu="travail"
	idContenu="travail"
	fil={filDeConsole('Comptes')}
	donnees={{ 'data-form': panneauOuvert ? 'ouvert' : 'ferme' }}
	univers={UNIVERS}
	domaines={DOMAINES}
	notes={corpus}
	compte={{ nom: MOI.nom, initiales: MOI.initiales, role: MOI.role, domaine: MOI.domaine }}
	version={INSTANCE.version}
>
	{#snippet avantContenu()}
		<NavigationConsole courante="comptes" />
	{/snippet}

	{#snippet enfants()}
		<TeteDeSection
			titre="Comptes"
			description="Les accès à l'instance. Un compte désactivé conserve ses contributions : les notes qu'il a écrites restent à son nom, et l'historique des vérifications n'est pas réécrit."
		>
			{#snippet action()}
				<BoutonDeCreation libelle="Nouveau compte" />
			{/snippet}
		</TeteDeSection>

		<div class="tableau-gestion">
			<div class="tg tg--comptes tg--entetes" role="row">
				<span></span>
				<span>Nom et identifiant</span>
				<span class="tg--reduit">Rôle</span>
				<span class="tg--masquable">Domaine</span>
				<span class="tg--masquable">Dernière connexion</span>
				<span></span>
			</div>
			<div id="liste">
				{#each listeTriee as c (c.compte.id)}
					{@const marques = !c.compte.actif || c.verrouille || estDernierAdmin(c)}
					<div class="tg tg--comptes tg--ligne" data-actif={c.compte.actif ? 'oui' : 'non'}>
						<span class="avatar-c">{initiales(c.compte.nom)}</span>
						<div style="min-width:0">
							<div class="tg__nom">{c.compte.nom}</div>
							<div class="tg__ident">{c.compte.identifiant}</div>
							{#if marques}<div class="tg__marques">
									{#if !c.compte.actif}<span class="past past--desactive">désactivé</span
										>{/if}{#if c.verrouille}<span class="past past--verrou"
											>mot de passe verrouillé</span
										>{/if}{#if estDernierAdmin(c)}<span class="past past--systeme"
											>seul administrateur</span
										>{/if}
								</div>{/if}
						</div>
						<span
							class="past tg--reduit"
							class:past--admin={c.compte.role === 'Administrateur'}
							style="justify-self:start">{c.compte.role}</span
						>
						<span class="tg__n tg--masquable">{c.compte.domaine}</span>
						<span
							class="tg__n tg--masquable"
							style={c.compte.actif ? undefined : 'color:var(--c-encre-4)'}
							>{c.compte.derniere}</span
						>
						<div class="tg__actions">
							<button class="btn" type="button">Modifier</button>
							{#if c.compte.actif}<button
									class="btn"
									type="button"
									aria-label="Réinitialiser le mot de passe de {c.compte.nom}"
									title="Réinitialiser le mot de passe"
									><svg
										width="14"
										height="14"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										><rect x="3" y="7" width="10" height="6.5" rx="1.3" /><path
											d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"
										/></svg
									></button
								>{/if}
							<button class="btn" class:btn--destructif={c.compte.actif} type="button"
								>{c.compte.actif ? 'Désactiver' : 'Réactiver'}</button
							>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/snippet}

	{#snippet superposition()}
		<aside class="tiroir-form" id="tiroir" aria-label="Formulaire de compte">
			<div class="tiroir-form__tete">
				<div style="min-width:0">
					<h2 class="tiroir-form__titre" id="form-titre">
						{edite ? edite.compte.nom : 'Nouveau compte'}
					</h2>
					<div class="tiroir-form__sous" id="form-sous">
						{#if edite}{#if edite.compte.actif}Dernière connexion {edite.compte
									.derniere}.{:else}Compte désactivé — ses contributions restent à son nom.{/if}{:else}L'utilisateur
							devra changer son mot de passe à la première connexion.{/if}
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
				<div id="avert-form">
					{#if dernierAdminEdite && edite}<div class="refus">
							<div class="refus__titre">Le rôle d'administrateur ne peut pas être retiré</div>
							<div class="refus__sortie">
								« {edite.compte.nom} » est le seul administrateur actif de l'instance. Le retirer fermerait
								définitivement l'accès à la console — plus personne ne pourrait créer de domaine, gérer
								les comptes, ni rendre ce rôle à quiconque. Nommez d'abord un second administrateur :
								le sélecteur se déverrouillera aussitôt.
							</div>
						</div>{/if}
				</div>

				<div class="champ" id="champ-ident">
					<label class="champ__label" for="f-ident">Identifiant <span class="oblig">*</span></label>
					<input
						class="saisie"
						type="text"
						id="f-ident"
						autocomplete="off"
						spellcheck="false"
						autocapitalize="none"
						placeholder="prenom.nom"
						value={edite ? edite.compte.identifiant : ''}
						disabled={edite !== null}
					/>
					<span class="champ__aide" id="aide-ident"
						>{#if edite}L'identifiant est définitif : le modifier casserait l'attribution de ses
							contributions passées.{:else}Sert à se connecter. Il ne pourra plus être modifié
							ensuite.{/if}</span
					>
					<div class="champ__erreur" id="erreur-ident" hidden>
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
						<span id="erreur-ident-txt"></span>
					</div>
				</div>

				<div class="champ" id="champ-nom">
					<label class="champ__label" for="f-nom">Nom affiché <span class="oblig">*</span></label>
					<input
						class="saisie"
						type="text"
						id="f-nom"
						autocomplete="off"
						placeholder="Prénom Nom"
						value={edite ? edite.compte.nom : ''}
					/>
					<span class="champ__aide">Apparaît sur les notes et dans l'activité.</span>
					<div class="champ__erreur" id="erreur-nom" hidden>
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
						Donnez un nom affiché.
					</div>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-courriel">Adresse électronique</label>
					<input
						class="saisie"
						type="email"
						id="f-courriel"
						autocomplete="off"
						placeholder="prenom.nom@exemple.fr"
						value={edite ? edite.compte.courriel : ''}
					/>
					<span class="champ__aide"
						>Sert aux notifications et à la réinitialisation autonome du mot de passe.</span
					>
				</div>

				<div class="champ" id="champ-mdp" hidden={edite !== null}>
					<label class="champ__label" for="f-mdp"
						>Mot de passe initial <span class="oblig">*</span></label
					>
					<div class="champ__boite">
						<input
							class="saisie"
							type="text"
							id="f-mdp"
							autocomplete="off"
							spellcheck="false"
							value={motDePasseInitial}
						/>
						<button
							class="champ__action"
							type="button"
							id="regenerer"
							aria-label="Générer un autre mot de passe"
							title="Générer un autre"
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4" /><path d="M2 2.5v3.6h3.6" /></svg
							>
						</button>
					</div>
					<span class="champ__aide"
						>Généré automatiquement. Il devra être changé à la première connexion.</span
					>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-role">Rôle <span class="oblig">*</span></label>
					<select class="selecteur" id="f-role" disabled={dernierAdminEdite}
						>{#if panneauOuvert}{#each ROLES as r (r.cle)}<option
									value={r.cle}
									selected={r.cle === roleCourant}>{r.cle}</option
								>{/each}{/if}</select
					>
					<span class="champ__aide" id="aide-role"
						>{#if panneauOuvert}{aideDuRole}{:else}Le rôle détermine ce que le compte peut faire,
							indépendamment du domaine.{/if}</span
					>
				</div>

				<div class="champ">
					<label class="champ__label" for="f-domaine">Domaine principal</label>
					<select class="selecteur" id="f-domaine"
						>{#if panneauOuvert}{#each DOMAINES as d (d.nom)}<option
									value={d.nom}
									selected={d.nom === (edite ? edite.compte.domaine : PREMIER_DOMAINE)}
									>{d.univers} › {d.nom}</option
								>{/each}{/if}</select
					>
					<span class="champ__aide"
						>Détermine son périmètre de contribution et ce qu'il voit à l'accueil.</span
					>
				</div>

				<div class="champ" id="champ-verrou">
					<label class="case" style="align-items:flex-start">
						<input type="checkbox" id="f-verrou" checked={edite ? edite.verrouille : false} />
						<span class="case__txt"
							>Mot de passe verrouillé
							<span class="case__aide"
								>Le compte ne pourra pas changer son mot de passe lui-même : seule l'administration
								le fera. Réservé aux comptes de démonstration et aux accès partagés.</span
							>
						</span>
					</label>
				</div>
			</div>

			<div class="tiroir-form__pied">
				<button
					class="btn btn--destructif"
					id="form-desactiver"
					hidden={edite === null || !edite.compte.actif}>Désactiver</button
				>
				<button class="btn" id="form-annuler">Annuler</button>
				<button class="btn btn--principal" id="form-valider"
					><span id="form-valider-txt">{edite ? 'Enregistrer' : 'Créer le compte'}</span></button
				>
			</div>
		</aside>

		<dialog class="dlg" id="dlg-mdp" aria-labelledby="dlg-mdp-titre" open={casMdp}>
			<div class="dlg__boite">
				<div class="dlg__tete">
					<span class="dlg__marque" aria-hidden="true">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><rect x="3" y="7" width="10" height="7" rx="1.4" /><path
								d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
							/></svg
						>
					</span>
					<h2 class="dlg__titre" id="dlg-mdp-titre">Mot de passe réinitialisé</h2>
				</div>
				<div class="dlg__corps">
					<p class="dlg__texte" id="mdp-qui">
						{#if compteReinitialise}Le mot de passe de {compteReinitialise.compte.nom} a été remplacé.
							L'ancien ne fonctionne plus.{:else}—{/if}
					</p>

					<!--
						L'avertissement précède la valeur : il faut savoir qu'on ne la
						reverra pas avant de fermer la boîte, pas après.
					-->
					<div class="avert-unique">
						<svg
							width="18"
							height="18"
							viewBox="0 0 16 16"
							fill="none"
							stroke="var(--c-alerte)"
							stroke-width="1.7"
							style="flex:none;margin-top:1px"
							><path d="M8 5.5v3.5M8 11.4v.3" /><circle cx="8" cy="8" r="6.2" /></svg
						>
						<div>
							<b>Ce mot de passe est affiché une seule fois.</b> Il n'est pas conservé en clair et ne
							pourra plus être consulté, ni par vous, ni par personne. Si vous fermez cette boîte sans
							l'avoir transmis, il faudra en générer un autre.
						</div>
					</div>

					<div class="mdp-unique">
						<div class="mdp-unique__valeur" id="mdp-valeur">{motDePasseAffiche}</div>
						<button class="btn btn--principal" id="mdp-copier">
							<svg
								width="15"
								height="15"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								><rect x="5.5" y="5.5" width="9" height="9" rx="1.5" /><path
									d="M10.5 5.5v-3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3"
								/></svg
							>
							<span id="mdp-copier-txt">Copier le mot de passe</span>
						</button>
					</div>

					<p class="transmettre">
						Transmettez-le par un canal distinct de l'adresse électronique du compte — de vive voix,
						par téléphone, ou par messagerie interne. Le compte devra le changer à sa première
						connexion.
					</p>
				</div>
				<div class="dlg__pied">
					<button class="btn btn--principal" id="mdp-fermer">J'ai noté le mot de passe</button>
				</div>
			</div>
		</dialog>

		<dialog class="dlg" id="dlg-desactiver" aria-labelledby="dlg-des-titre" open={casDes}>
			<div class="dlg__boite">
				<div class="dlg__tete">
					<span class="dlg__marque" aria-hidden="true" style="background:var(--c-alerte)">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"><circle cx="8" cy="8" r="6.2" /><path d="M4 12L12 4" /></svg
						>
					</span>
					<h2 class="dlg__titre" id="dlg-des-titre">Désactiver le compte</h2>
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
				<div class="dlg__corps" id="des-corps">
					{#if compteDesactive}{#if refusDeDesactivation}<div class="refus">
								<div class="refus__titre">Désactivation refusée</div>
								<div class="refus__sortie">
									« {compteDesactive.compte.nom} » est le seul administrateur actif. Désactiver ce compte
									rendrait la console inaccessible et sans recours. Nommez un second administrateur avant
									de revenir ici.
								</div>
							</div>{:else}{@const n = contributions(compteDesactive.compte.nom)}
							<p class="dlg__texte">
								« {compteDesactive.compte.nom} » ne pourra plus se connecter. Ses sessions ouvertes sont
								fermées immédiatement.
							</p>
							<div class="contexte contexte--succes" style="margin:0">
								<span class="contexte__marque" aria-hidden="true">✓</span>
								<div>
									<div class="contexte__titre">Ses contributions sont conservées</div>
									<div>
										{#if n}Les {n} notes écrites par {compteDesactive.compte.nom} restent à son nom, et
											l'historique des vérifications n'est pas réécrit. Désactiver n'efface rien : c'est
											ce qui permet de savoir, dans deux ans, qui avait rédigé quoi.{:else}Aucune
											note n'est attribuée à ce compte. Rien ne sera réécrit.{/if}
									</div>
								</div>
							</div>
							<p class="dlg__texte">
								La désactivation est réversible : le compte pourra être réactivé depuis cette liste,
								avec un nouveau mot de passe.
							</p>{/if}{/if}
				</div>
				<div class="dlg__pied">
					<button class="btn" data-fermer id="des-annuler"
						>{refusDeDesactivation ? 'Fermer' : 'Annuler'}</button
					>
					<button
						class="btn btn--principal btn--destructif"
						id="des-valider"
						style="background:var(--c-danger);border-color:var(--c-danger);color:#fff"
						hidden={refusDeDesactivation}>Désactiver</button
					>
				</div>
			</div>
		</dialog>
	{/snippet}
</Coquille>
