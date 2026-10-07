import { redirect as redirigerSvelteKit } from '@sveltejs/kit';

/**
 * LA REDIRECTION DU PRODUIT. Une adresse peut porter un nom cyrillique ou japonais, et un
 * en-tête HTTP n'admet que l'ASCII : la redirection de SvelteKit tombait alors en
 * erreur 500 après une écriture pourtant faite. Seuls les caractères hors ASCII sont
 * encodés — une adresse déjà encodée n'est pas réencodée.
 */
export function adresseHttp(adresse: string): string {
	return adresse.replace(/[\u0080-\u{10ffff}]+/gu, (morceau) => encodeURIComponent(morceau));
}

export function redirect(
	statut: Parameters<typeof redirigerSvelteKit>[0],
	adresse: string | URL
): never {
	redirigerSvelteKit(statut, typeof adresse === 'string' ? adresseHttp(adresse) : adresse);
}
