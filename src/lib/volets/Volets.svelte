<script lang="ts">
	// Les routes et leurs formulaires restent isolés dans chaque volet.
	// La coquille commune porte l'arborescence, la disposition et l'historique.
	import { onMount, tick, type Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import {
		afterNavigate,
		beforeNavigate,
		goto,
		invalidateAll,
		pushState,
		replaceState
	} from '$app/navigation';
	import { page } from '$app/state';
	import Coquille from '$lib/coquille/Coquille.svelte';
	import { COMPTE_VIDE } from '$lib/coquille/compte-vide';
	import {
		EVENEMENT_VOLETS,
		adresseLocale,
		dansUnVolet,
		demanderAuParent,
		estGlobale,
		type Disposition,
		type VoletSauve
	} from './navigation';
	import './volets.css';

	let {
		children,
		session,
		compte,
		ecriture
	}: {
		children: Snippet;
		session: boolean;
		compte: string;
		ecriture: boolean;
	} = $props();
	let disposition = $state<Disposition | null>(null);
	let integre = $state(false);
	let pret = $state(false);
	let redimensionnement = $state(false);
	const cadres = $state<Record<string, HTMLIFrameElement>>({});
	const sources: Record<string, string> = {};
	const attentes: Record<string, string | undefined> = {};
	const mutations = new SvelteSet<string>();
	const saisies = new SvelteSet<string>();
	const fils = $state<Record<string, string[]>>({});
	let derniereHistoire = '';
	let mutation = false;
	let saisie = false;
	let defilementAReprendre: number | null = null;
	let attenteActualisation = $state(false);
	const globale = $derived(estGlobale(page.url.pathname));
	const hote = $derived(pret && !integre && session && disposition !== null && !globale);
	const actif = $derived(disposition?.volets.find((v) => v.id === disposition?.actif));
	const cle = $derived('codicillus:volets:' + compte);

	function sauver(): Disposition | null {
		if (!disposition) return null;
		const copie = $state.snapshot(disposition);
		try {
			sessionStorage.setItem(cle, JSON.stringify(copie));
		} catch {
			/* Stockage facultatif. */
		}
		return copie;
	}

	function historiser(ajouter = false): void {
		const copie = sauver();
		if (!copie || !actif || globale) return;
		derniereHistoire = JSON.stringify(copie);
		const etat = { ...page.state, volets: copie };
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- adresse canonique du volet
		if (ajouter) pushState(actif.adresse, etat);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- adresse canonique du volet
		else replaceState(actif.adresse, etat);
	}

	function creer(adresse: string, defilement = 0): VoletSauve {
		const id = Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(36)).join(
			'-'
		);
		sources[id] = adresse;
		return {
			id,
			adresse,
			titre: document.querySelector('.fil__courant')?.textContent?.trim() || 'Accueil',
			largeur: 1,
			defilement
		};
	}

	function commander(id: string, type: string, valeurs: Record<string, unknown> = {}): void {
		if (type === 'naviguer') attentes[id] = String(valeurs.adresse);
		if (!cadres[id]?.contentDocument?.documentElement.hasAttribute('data-volet-pret')) return;
		cadres[id]?.contentWindow?.dispatchEvent(
			new CustomEvent('codicillus:commande-volet', {
				detail: { type, ...valeurs }
			})
		);
	}

	function activer(id: string): void {
		if (!disposition || disposition.actif === id) return;
		disposition.actif = id;
		historiser();
	}

	function fractionner(id?: string): void {
		if (!disposition) {
			const premier = creer(adresseLocale(window.location.href), window.scrollY);
			disposition = { volets: [premier], actif: premier.id };
			historiser();
		}
		const rang = disposition.volets.findIndex((v) => v.id === (id ?? disposition?.actif));
		const original = disposition.volets[rang];
		if (!original) return;
		original.largeur /= 2;
		const copie = creer(original.adresse, original.defilement);
		copie.titre = original.titre;
		copie.largeur = original.largeur;
		disposition.volets.splice(rang + 1, 0, copie);
		disposition.actif = copie.id;
		historiser(true);
	}

	function fermer(id: string): void {
		if (!disposition) return;
		// La fermeture passe dans le volet pour respecter une saisie non enregistrée.
		if (cadres[id]?.contentDocument?.documentElement.hasAttribute('data-volet-pret'))
			commander(id, 'demander-fermeture');
		else retirer(id);
	}

	function retirer(id: string): void {
		if (!disposition) return;
		const rang = disposition.volets.findIndex((v) => v.id === id);
		if (rang < 0) return;
		disposition.volets.splice(rang, 1);
		saisies.delete(id);
		if (!disposition.volets.length) disposition.volets.push(creer('/'));
		if (disposition.actif === id) disposition.actif = disposition.volets[Math.max(0, rang - 1)]!.id;
		historiser(true);
	}

	function ouvrir(adresse: string): void {
		if (!actif) return;
		if (estGlobale(adresse)) {
			for (const volet of disposition?.volets ?? []) sources[volet.id] = volet.adresse;
			sauver();
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- adresse du lien existant
			void goto(adresse);
		} else commander(actif.id, 'naviguer', { adresse });
		document.getElementById('app')?.removeAttribute('data-tiroir');
	}

	function annoncer(): void {
		if (!dansUnVolet()) return;
		void tick().then(() => {
			if (defilementAReprendre !== null) {
				window.scrollTo(0, defilementAReprendre);
				defilementAReprendre = null;
			}
			demanderAuParent('adresse', {
				adresse: adresseLocale(window.location.href),
				titre:
					document.querySelector('.fil__courant')?.textContent?.trim() ||
					document.title ||
					'Accueil',
				fil: Array.from(document.querySelectorAll('.fil > :not(.fil__sep)')).map((e) =>
					e.classList.contains('fil__maison') ? 'Accueil' : (e.textContent?.trim() ?? '')
				),
				erreur: page.status >= 400,
				defilement: window.scrollY
			});
			if (mutation && page.status < 400) {
				mutation = false;
				saisie = false;
				demanderAuParent('saisie', { saisie: false });
			}
		});
	}

	beforeNavigate((navigation) => {
		const perdUneSaisie = (integre && saisie && !mutation) || (hote && saisies.size > 0);
		if (
			perdUneSaisie &&
			!window.confirm('Quitter et abandonner les modifications non enregistrées ?')
		)
			navigation.cancel();
	});
	afterNavigate(annoncer);
	$effect(() => {
		void page.data;
		if (pret && integre) annoncer();
	});
	$effect(() => {
		if (!pret || integre) return;
		document.documentElement.toggleAttribute('data-hote-volets', hote);
	});
	$effect(() => {
		const etat = page.state.volets;
		if (!pret || integre || !etat) return;
		const serialise = JSON.stringify(etat);
		if (serialise === derniereHistoire) return;
		derniereHistoire = serialise;
		for (const volet of etat.volets) {
			if (!cadres[volet.id]) sources[volet.id] = volet.adresse;
			const ancien = disposition?.volets.find((v) => v.id === volet.id);
			if (ancien && ancien.adresse !== volet.adresse)
				commander(volet.id, 'naviguer', { adresse: volet.adresse });
		}
		disposition = JSON.parse(serialise);
		sauver();
	});

	onMount(() => {
		integre = dansUnVolet();
		pret = true;
		if (integre) {
			document.documentElement.setAttribute('data-dans-volet', '');
		} else if (session) {
			try {
				const sauvee: Disposition | null =
					page.state.volets ?? JSON.parse(sessionStorage.getItem(cle) ?? 'null');
				if (sauvee?.volets?.length && sauvee.volets.some((v) => v.id === sauvee.actif)) {
					for (const volet of sauvee.volets) {
						volet.adresse = adresseLocale(volet.adresse);
						sources[volet.id] = volet.adresse;
					}
					disposition = sauvee;
					// Une adresse ouverte explicitement remplace le contenu actif.
					const courant = disposition.volets.find((v) => v.id === disposition?.actif);
					if (!globale && courant) {
						courant.adresse = adresseLocale(window.location.href);
						sources[courant.id] = courant.adresse;
					}
					historiser();
				}
			} catch {
				sessionStorage.removeItem(cle);
			}
		}

		const evenement = (brut: Event): void => {
			if (integre || !session) return;
			const detail = (brut as CustomEvent).detail;
			const volet = disposition?.volets.find((v) => cadres[v.id]?.contentWindow === detail.source);
			if (detail.source !== window && !volet) return;
			switch (detail.type) {
				case 'fractionner':
					fractionner(volet?.id);
					break;
				case 'activer':
					if (volet) activer(volet.id);
					break;
				case 'fermer':
					if (volet) fermer(volet.id);
					break;
				case 'fermeture-acceptee':
					if (volet) retirer(volet.id);
					break;
				case 'pret':
					if (volet)
						commander(volet.id, 'initialiser', {
							defilement: volet.defilement,
							actif: volet.id === disposition?.actif
						});
					if (volet && attentes[volet.id])
						commander(volet.id, 'naviguer', { adresse: attentes[volet.id] });
					break;
				case 'adresse':
					if (volet) {
						const adresse = adresseLocale(detail.adresse);
						if (estGlobale(adresse)) {
							delete attentes[volet.id];
							ouvrir(adresse);
							break;
						}
						if (attentes[volet.id] && attentes[volet.id] !== adresse) break;
						delete attentes[volet.id];
						const changee = volet.adresse !== adresse;
						volet.adresse = adresse;
						volet.titre = detail.titre;
						fils[volet.id] = detail.fil;
						if (mutations.has(volet.id) && !detail.erreur) {
							mutations.delete(volet.id);
							saisies.delete(volet.id);
							void invalidateAll();
							for (const autre of disposition?.volets ?? [])
								if (autre.id !== volet.id) commander(autre.id, 'actualiser');
						}
						volet.defilement = detail.defilement;
						if (volet.id === disposition?.actif) historiser(changee);
						else sauver();
					}
					break;
				case 'defilement':
					if (volet) {
						volet.defilement = detail.defilement;
						sauver();
					}
					break;
				case 'navigation':
					ouvrir(detail.adresse);
					break;
				case 'rail':
					document.getElementById('app')?.setAttribute('data-tiroir', 'rail');
					break;
				case 'recherche':
					document.querySelector<HTMLElement>('.rail .recherche')?.click();
					break;
				case 'navigation-annulee':
					if (volet) delete attentes[volet.id];
					break;
				case 'saisie':
					if (volet) {
						if (detail.saisie) saisies.add(volet.id);
						else saisies.delete(volet.id);
					}
					break;
				case 'mutation':
					if (volet) mutations.add(volet.id);
					break;
				case 'actualiser':
					void invalidateAll();
					for (const autre of disposition?.volets ?? []) {
						if (autre.id !== volet?.id) commander(autre.id, 'actualiser');
					}
					break;
			}
		};

		const commande = (brut: Event): void => {
			if (!integre) return;
			const detail = (brut as CustomEvent).detail;
			switch (detail.type) {
				case 'initialiser':
					defilementAReprendre = detail.defilement;
					annoncer();
					if (detail.actif) window.focus();
					break;
				case 'naviguer':
					if (
						saisie &&
						!window.confirm('Quitter ce volet et abandonner les modifications non enregistrées ?')
					) {
						demanderAuParent('navigation-annulee');
						return;
					}
					saisie = false;
					// eslint-disable-next-line svelte/no-navigation-without-resolve -- adresse interne fournie par la coquille
					void goto(detail.adresse, { replaceState: true });
					break;
				case 'demander-fermeture':
					if (
						!saisie ||
						window.confirm('Fermer ce volet et abandonner les modifications non enregistrées ?')
					)
						demanderAuParent('fermeture-acceptee');
					break;
				case 'actualiser':
					if (saisie || /\/(modifier|operationnel|nouvelle)$/.test(page.url.pathname))
						attenteActualisation = true;
					else void invalidateAll();
					break;
			}
		};

		const navigation = (brut: Event): void => {
			if (hote) {
				brut.preventDefault();
				ouvrir((brut as CustomEvent<string>).detail);
			}
		};
		const clic = (e: MouseEvent): void => {
			const cible = e.target instanceof Element ? e.target : null;
			if (integre) {
				if (cible?.closest('.recherche')) {
					e.preventDefault();
					e.stopImmediatePropagation();
					demanderAuParent('recherche');
					return;
				}
				if (cible?.closest('[data-ouvrir-tiroir="rail"]')) {
					e.preventDefault();
					e.stopImmediatePropagation();
					demanderAuParent('rail');
					return;
				}
			}
			if (cible?.closest('.palette, .recherche')) return;
			const lien = cible?.closest<HTMLAnchorElement>('a[href]');
			if (
				!lien ||
				e.button !== 0 ||
				e.ctrlKey ||
				e.metaKey ||
				e.shiftKey ||
				e.altKey ||
				lien.target ||
				lien.hasAttribute('download')
			)
				return;
			const url = new URL(lien.href);
			if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)) return;
			if (
				lien.getAttribute('href')?.startsWith('#') ||
				/\/(exporter|pieces-jointes)\//.test(url.pathname)
			)
				return;
			if (hote) {
				e.preventDefault();
				e.stopImmediatePropagation();
				ouvrir(adresseLocale(url.href));
			} else if (integre && estGlobale(url.pathname)) {
				e.preventDefault();
				e.stopImmediatePropagation();
				demanderAuParent('navigation', { adresse: adresseLocale(url.href) });
			} else if (integre) {
				lien.setAttribute('data-sveltekit-replacestate', '');
			}
		};
		const focus = (): void => {
			if (integre) demanderAuParent('activer');
		};
		const clavier = (e: KeyboardEvent): void => {
			if (integre && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				e.stopImmediatePropagation();
				demanderAuParent('recherche');
			}
		};
		const entree = (e: Event): void => {
			if (
				integre &&
				e.target instanceof Element &&
				e.target.closest('[contenteditable="true"], form textarea, form input:not([type="search"])')
			) {
				saisie = true;
				demanderAuParent('saisie', { saisie: true });
			}
		};
		const soumission = (): void => {
			if (integre) {
				mutation = true;
				demanderAuParent('mutation');
			}
		};
		let minuterie: ReturnType<typeof setTimeout>;
		const defilement = (): void => {
			clearTimeout(minuterie);
			if (integre)
				minuterie = setTimeout(
					() => demanderAuParent('defilement', { defilement: window.scrollY }),
					150
				);
		};
		window.addEventListener(EVENEMENT_VOLETS, evenement);
		window.addEventListener('codicillus:commande-volet', commande);
		window.addEventListener('codicillus:naviguer', navigation);
		document.addEventListener('click', clic, true);
		document.addEventListener('pointerdown', focus, true);
		document.addEventListener('focusin', focus, true);
		document.addEventListener('keydown', clavier, true);
		document.addEventListener('input', entree, true);
		document.addEventListener('submit', soumission, true);
		window.addEventListener('scroll', defilement, { passive: true });
		if (integre) {
			document.documentElement.setAttribute('data-volet-pret', '');
			demanderAuParent('pret');
		}
		return () => {
			clearTimeout(minuterie);
			window.removeEventListener(EVENEMENT_VOLETS, evenement);
			window.removeEventListener('codicillus:commande-volet', commande);
			window.removeEventListener('codicillus:naviguer', navigation);
			document.removeEventListener('click', clic, true);
			document.removeEventListener('pointerdown', focus, true);
			document.removeEventListener('focusin', focus, true);
			document.removeEventListener('keydown', clavier, true);
			document.removeEventListener('input', entree, true);
			document.removeEventListener('submit', soumission, true);
			window.removeEventListener('scroll', defilement);
		};
	});

	function redimensionner(rang: number, difference: number): void {
		if (!disposition) return;
		const gauche = disposition.volets[rang];
		const droite = disposition.volets[rang + 1];
		if (!gauche || !droite) return;
		const total = gauche.largeur + droite.largeur;
		gauche.largeur = Math.max(total * 0.15, Math.min(total * 0.85, gauche.largeur + difference));
		droite.largeur = total - gauche.largeur;
	}

	function tirer(e: PointerEvent, rang: number): void {
		const cible = e.currentTarget as HTMLElement;
		cible.setPointerCapture(e.pointerId);
		redimensionnement = true;
		let position = e.clientX;
		const largeur = cible.parentElement?.clientWidth ?? 1;
		const total = disposition?.volets.reduce((somme, v) => somme + v.largeur, 0) ?? 1;
		const mouvement = (ev: PointerEvent): void => {
			redimensionner(rang, ((ev.clientX - position) / largeur) * total);
			position = ev.clientX;
		};
		const fin = (): void => {
			redimensionnement = false;
			cible.removeEventListener('pointermove', mouvement);
			cible.removeEventListener('pointerup', fin);
			cible.removeEventListener('pointercancel', fin);
			historiser();
		};
		cible.addEventListener('pointermove', mouvement);
		cible.addEventListener('pointerup', fin);
		cible.addEventListener('pointercancel', fin);
	}
</script>

{#if hote && disposition}
	<Coquille
		fil={fils[actif?.id ?? ''] ?? ['Accueil']}
		courant={(fils[actif?.id ?? ''] ?? []).slice(
			2,
			actif?.adresse.startsWith('/notes/') ? -1 : undefined
		)}
		accueilCourant={actif?.adresse === '/'}
		univers={[]}
		domaines={[]}
		notes={[]}
		compte={COMPTE_VIDE}
		version=""
		droits={ecriture ? 'ecriture' : 'lecture'}
		classeContenu="volets-contenu"
		donnees={{ 'data-coquille-volets': '' }}
	>
		{#snippet enfants()}
			{#if disposition}
				<nav class="volets-choix" aria-label="Volets ouverts">
					<button type="button" class="btn" data-ouvrir-tiroir="rail">Navigation</button>
					{#each disposition.volets as volet, rang (volet.id)}
						<button
							type="button"
							aria-current={volet.id === disposition.actif ? 'true' : undefined}
							onclick={() => activer(volet.id)}>{rang + 1}. {volet.titre}</button
						>
					{/each}
				</nav>
				<div class="volets" class:volets--redimensionnement={redimensionnement}>
					{#each disposition.volets as volet, rang (volet.id)}
						<section
							class="volet"
							data-actif={volet.id === disposition.actif}
							style:flex-grow={volet.largeur /
								disposition.volets.reduce((somme, v) => somme + v.largeur, 0)}
							aria-label={'Volet ' + (rang + 1)}
						>
							<div class="volet__titre">
								<button
									type="button"
									class="volet__activation"
									onclick={() => {
										activer(volet.id);
										cadres[volet.id]?.focus();
									}}>{volet.titre}</button
								>
								<button
									type="button"
									class="volet__fermer"
									aria-label={'Fermer le volet ' + (rang + 1)}
									onclick={() => fermer(volet.id)}>×</button
								>
							</div>
							<iframe
								bind:this={cadres[volet.id]}
								data-volet={volet.id}
								title={'Volet ' + (rang + 1) + ' : ' + volet.titre}
								src={sources[volet.id]}
							></iframe>
						</section>
						{#if rang < disposition.volets.length - 1}
							<!-- Séparateur ajustable au clavier selon le motif ARIA de redimensionnement. -->
							<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
							<div
								class="volets-separation"
								role="separator"
								tabindex="0"
								aria-label={'Largeur du volet ' + (rang + 1)}
								aria-orientation="vertical"
								aria-valuenow={Math.round(
									(volet.largeur / (volet.largeur + disposition.volets[rang + 1]!.largeur)) * 100
								)}
								aria-valuemin="15"
								aria-valuemax="85"
								onpointerdown={(e) => tirer(e, rang)}
								onkeydown={(e) => {
									if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
										e.preventDefault();
										redimensionner(rang, e.key === 'ArrowLeft' ? -0.05 : 0.05);
										historiser();
									}
								}}
							></div>
						{/if}
					{/each}
				</div>
			{/if}
		{/snippet}
	</Coquille>
{:else}
	{@render children()}
	{#if integre && attenteActualisation}
		<div class="volet-actualisation" role="status">
			Le contenu a changé dans un autre volet. Votre saisie est conservée.
		</div>
	{/if}
{/if}
