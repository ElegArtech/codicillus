/** Conserve les branches et le défilement pendant le remplacement des données du rail. */
export function memoriserLeRail(): (renommage?: { avant: string; apres: string }) => void {
	const rail = document.querySelector<HTMLElement>('.rail');
	const defilement = rail?.scrollTop ?? 0;
	const branches = new Map<string, boolean>();
	for (const chevron of document.querySelectorAll('.rail .noeud__chevron')) {
		const adresse = chevron.closest('.noeud')?.querySelector('a')?.getAttribute('href');
		if (adresse) branches.set(adresse, chevron.getAttribute('aria-expanded') === 'true');
	}
	return (renommage) => {
		if (renommage) {
			for (const [adresse, ouvert] of [...branches]) {
				if (adresse === renommage.avant || adresse.startsWith(renommage.avant + '/')) {
					branches.delete(adresse);
					branches.set(renommage.apres + adresse.slice(renommage.avant.length), ouvert);
				}
			}
		}
		for (const chevron of document.querySelectorAll('.rail .noeud__chevron')) {
			const noeud = chevron.closest('.noeud');
			const lien = noeud?.querySelector('a');
			const ouvert = branches.get(lien?.getAttribute('href') ?? '');
			if (ouvert === undefined || !noeud) continue;
			chevron.closest('li')?.setAttribute('data-ouvert', ouvert ? 'oui' : 'non');
			if (ouvert) noeud.setAttribute('data-ouvert', 'oui');
			else noeud.removeAttribute('data-ouvert');
			chevron.setAttribute('aria-expanded', String(ouvert));
			chevron.setAttribute(
				'aria-label',
				`${ouvert ? 'Replier' : 'Déplier'} ${lien?.textContent?.trim() ?? ''}`
			);
		}
		const nouveauRail = document.querySelector<HTMLElement>('.rail');
		if (nouveauRail) nouveauRail.scrollTop = defilement;
	};
}
