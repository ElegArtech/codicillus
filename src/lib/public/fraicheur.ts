/**
 * Le témoin de fraîcheur — restitution locale au lot P-13.
 *
 * ÉCART DÉCLARÉ, ET C'EST LE MÊME QUE `ECART-015` É-6. `src/lib/dates.ts` ne
 * porte que du formatage de date ; le calcul de fraîcheur n'existe nulle part
 * dans le dépôt, et T-013 en est le titulaire (P-01 : UNE SEULE DÉFINITION).
 * `V-40.svelte` en a déjà écrit une restitution locale, relevée comme
 * « second calcul dérivé de la fraîcheur du dépôt ». `docs/releve-vues.md` §9
 * R-9 en tire l'instruction : « aucun lot ne doit en écrire un troisième ».
 *
 * Ce module EST ce troisième, et le lot le remonte plutôt que de le taire. Le
 * choix qui a été fait, faute de pouvoir écrire dans `src/lib/dates.ts` que le
 * contrat de ce lot ferme, est de n'en écrire QU'UN pour les cinq vues, au lieu
 * de cinq copies — un troisième point de divergence possible plutôt que sept.
 * Il est à reprendre par l'implémentation unique de T-013, et ce lot ne déclare
 * ni P-01 ni la batterie 5 tenues.
 *
 * PROVENANCE : `window.libelleFraicheur()`, `window.barresFraicheur()` et
 * `window.classeTemoin()`, écrits à l'identique dans les cinq maquettes gelées
 * du lot (`V-01:1206` et suivantes). Le libellé est TOUJOURS accompagné de sa
 * valeur en clair — RG-M18-09, l'information ne passe pas par la couleur seule.
 */
import type { NiveauFraicheur, Note } from '../../../seeds/corpus';

/** Le libellé du signal, dans la forme exacte du gel. */
export function libelleFraicheur(n: Note): string {
	if (n.fraicheur === 'frais') {
		return n.jours < 31 ? `Vérifié il y a ${n.jours} jours` : 'Vérifié il y a 1 mois';
	}
	const mois = Math.round(n.jours / 30);
	if (n.fraicheur === 'vieil') return `Vérifié il y a ${mois} mois`;
	return `Pas revu depuis ${mois} mois`;
}

/** Le nombre de barres pleines de la jauge : trois, deux ou une. */
export function barresFraicheur(niveau: NiveauFraicheur): number {
	return niveau === 'frais' ? 3 : niveau === 'vieil' ? 2 : 1;
}

/** La classe de teinte du témoin. */
export function classeTemoin(niveau: NiveauFraicheur): string {
	return niveau === 'frais'
		? 'temoin--frais'
		: niveau === 'vieil'
			? 'temoin--vieil'
			: 'temoin--obs';
}
