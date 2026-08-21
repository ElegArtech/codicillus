/**
 * LA RÉVÉLATION D'UN MOT DE PASSE — le geste commun à V-05 et à V-06.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI UN MODULE PARTAGÉ, ET NON DEUX CÂBLAGES
 *
 * Les deux écrans d'authentification portent le MÊME bouton, au même endroit,
 * avec le même identifiant et le même nom accessible : `button#voir`, dans la
 * `div.champ__boite` d'un champ de mot de passe. Le gel l'écrit deux fois
 * parce qu'une maquette n'a pas de module ; le recopier dans deux `cablage.ts`
 * en ferait deux implémentations d'un même geste, qui divergeraient au premier
 * changement — c'est ce que `P-35` dit d'un contrat recopié.
 *
 * IL VIT DANS `$lib/public/` PARCE QUE LES DEUX ÉCRANS Y SONT : `/connexion` et
 * `/mot-de-passe-oublie` sont l'un et l'autre de l'espace public au sens de
 * `$lib/donnees/public` — la réponse n'y dépend d'aucune session.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QUE LE GESTE FAIT, ET CE QU'IL NE FAIT PAS
 *
 * Il retourne le type du champ entre `password` et `text`, et recopie l'état
 * dans `aria-pressed` — le bouton du gel naît `aria-pressed="false"`, donc il
 * s'annonce comme une bascule et doit le rester. Le libellé accessible suit :
 * « Afficher » devient « Masquer », comme tout interrupteur dont l'état change.
 *
 * IL NE TOUCHE PAS AU DESSIN. Le gel change l'icône dans son propre script ;
 * la vue ne transcrit qu'un seul tracé, et en dessiner un second serait
 * redessiner. L'information ne passe donc pas par la seule icône — elle passe
 * par le type du champ, qui est visible, et par le nom accessible.
 */

/** Ce qu'un câblage rend : de quoi le défaire. Même contrat que les voisins. */
export type Debranchement = () => void;

const AFFICHER = 'Afficher le mot de passe';
const MASQUER = 'Masquer le mot de passe';

/**
 * LE CÂBLAGE DE LA RÉVÉLATION — `racine` est le `main.auth` de la vue.
 *
 * Chaque `button#voir` est apparié au champ de mot de passe de SA boîte, jamais
 * à un champ cherché dans tout le document : V-06 en porte un, et une page qui
 * en porterait deux ne doit pas révéler l'un en cliquant sur l'autre.
 */
export function cablerLaRevelation(racine: HTMLElement): Debranchement {
	const jetables: Debranchement[] = [];

	for (const bouton of racine.querySelectorAll('#voir')) {
		const champ = bouton.closest('.champ__boite')?.querySelector('input');
		if (!(champ instanceof HTMLInputElement)) continue;

		const basculer = (): void => {
			const revele = champ.type === 'text';
			champ.type = revele ? 'password' : 'text';
			bouton.setAttribute('aria-pressed', String(!revele));
			bouton.setAttribute('aria-label', revele ? AFFICHER : MASQUER);
		};
		bouton.addEventListener('click', basculer);
		jetables.push(() => {
			bouton.removeEventListener('click', basculer);
		});
	}

	return () => {
		for (const defaire of jetables) defaire();
	};
}
