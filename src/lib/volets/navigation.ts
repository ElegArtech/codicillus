import { goto } from '$app/navigation';

export const EVENEMENT_VOLETS = 'codicillus:volets';

export interface VoletSauve {
	id: string;
	adresse: string;
	titre: string;
	largeur: number;
	defilement: number;
}

export interface Disposition {
	volets: VoletSauve[];
	actif: string;
}

export function dansUnVolet(): boolean {
	return typeof window !== 'undefined' && window.frameElement?.hasAttribute('data-volet') === true;
}

export function adresseLocale(adresse: string): string {
	const url = new URL(adresse, window.location.origin);
	if (url.origin !== window.location.origin) return '/';
	return url.pathname + url.search + url.hash;
}

export function estGlobale(adresse: string): boolean {
	return /^\/(console|connexion|deconnexion|mon-profil|mot-de-passe)(\/|$|-)/.test(adresse);
}

export function demanderAuParent(type: string, valeurs: Record<string, unknown> = {}): void {
	const cible = dansUnVolet() ? window.parent : window;
	cible.dispatchEvent(
		new CustomEvent(EVENEMENT_VOLETS, {
			detail: { type, source: window, ...valeurs }
		})
	);
}

export function fractionner(): void {
	demanderAuParent('fractionner');
}

/** La coquille et la palette utilisent la même destination : le volet actif. */
export async function naviguer(adresse: string): Promise<void> {
	const evenement = new CustomEvent('codicillus:naviguer', { detail: adresse, cancelable: true });
	if (!window.dispatchEvent(evenement)) return;
	// eslint-disable-next-line svelte/no-navigation-without-resolve -- adresse interne déjà composée
	await goto(adresse, { replaceState: dansUnVolet() });
}
