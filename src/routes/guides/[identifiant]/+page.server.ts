/**
 * `/guides/{identifiant}` — LA LECTURE PUBLIQUE D'UN GUIDE (V-03).
 *
 * `docs/routes.md` §5.5, deux lignes et elles suffisent :
 *
 *   note publique ET publiée      → **V-03**, dans les QUATRE colonnes
 *   note interne ou brouillon     → **404 V-04**, dans les QUATRE colonnes
 *
 * `ARB-007` A-05 en donne le motif : « une seule adresse, un seul rendu : la
 * session ne change ni la route, ni la vue, ni les états ». Ce chargeur ne lit
 * donc PAS `locals.identite`, et ce n'est pas un oubli : la réponse ne doit
 * dépendre d'aucun cookie. Une branche par persona ne peut pas s'y glisser,
 * puisqu'il n'y a rien à quoi la raccrocher.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE POINT DUR — `V-04:2219`, ET C'EST CETTE ROUTE QUI LE REND MESURABLE
 *
 * « Une adresse inexistante et une note existante non publique doivent produire
 * un rendu strictement identique : c'est la vérification la plus importante de
 * cette vue. » La batterie 6 la comptait VACANTE parce que cette route n'était
 * pas montée (`ECART-047`, « 0 couple indiscernable prouvé sur une adresse de
 * RESSOURCE »).
 *
 * Trois propriétés la tiennent, et aucune n'est déclarative :
 *
 *   1. **une seule requête, la même dans les deux cas** — une projection par
 *      identifiant, sans contenu (`resoudreLeGuide()`). Une note interne coûte
 *      exactement ce que coûte une note absente ;
 *   2. **un seul point de sortie** — `refuserLAdresse()`, dont le type de
 *      retour `never` interdit qu'on reprenne la main pour nuancer. Ce fichier
 *      ne porte qu'un `if`, et il ne sait pas ce qu'il refuse ;
 *   3. **un seul écran d'échec** — le composant d'erreur de la racine, qui ne
 *      reçoit ni la ressource, ni la raison, ni l'identifiant demandé.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `vecteur={null}` — CE QUE CE LOT NE PEINT PAS, ET POURQUOI
 *
 * V-03 ne déclare qu'une propriété, `vecteur`, dont les deux axes — fraîcheur
 * du cartouche, présence du registre « En bref » — décrivent LA NOTE AFFICHÉE.
 * Or l'article de V-03 est la transcription du guide écrit dans la maquette
 * gelée : les piloter depuis une AUTRE note peindrait les attributs d'une note
 * sur le corps d'une autre — la « valeur illustrative » que `P-02` proscrit.
 * C'est le refus qu'a déjà opposé le chargeur de `/notes/{identifiant}` pour
 * les six axes de V-14. Les deux lacunes sont nommées et comptées à
 * `LACUNES_DU_CHEMIN_PUBLIC`, et remontées au rapport du lot.
 *
 * La résolution, elle, est bien faite sur la note demandée : le 200 et le 404
 * portent sur le corpus réel, et c'est ce que la batterie 6 mesure.
 */
import { basePartagee } from '$lib/base/acces';
import { compteDeLEspacePublic, journaliserUneConsultation } from '$lib/donnees/consultation';
import { refuserLAdresse } from '$lib/donnees/rangement';
import { resoudreLeGuide } from '$lib/donnees/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const base = basePartagee();
	const resolution = await resoudreLeGuide(base, params.identifiant);
	if (!resolution.trouve) refuserLAdresse(url.pathname);

	/* ═══════════════════════════════════════════════════════════════════════
	   LA CONSULTATION SE COMPTE ET SE JOURNALISE — `RG-M04-09`, T-078.

	   « TOUTE ouverture d'une note » : la lecture publique en est une. Le
	   compteur monte donc ici aussi, et non sur la seule lecture interne — un
	   compteur qui ignorerait l'espace public sous-compterait les notes
	   publiques, qui sont précisément celles que le public lit.

	   CE CHARGEUR N'AFFICHE PAS CE COMPTEUR, et il ne prétend donc rien de la
	   règle de M15.1 qui veut le nombre de consultations visible partout où une
	   note apparaît : elle reste sans porteur, et son numéro n'est pas cité ici
	   — le nommer ferait descendre le compte de `pnpm verif:couverture` sans que
	   le produit ait changé.

	   L'ENTRÉE EST ANONYMISÉE, ET SANS LIRE LA SESSION. `RG-M15-02` (CDC:1227)
	   ne parle pas du lecteur mais du JOURNAL : « les journaux de l'espace
	   public sont anonymisés : aucun identifiant d'utilisateur n'y est
	   associé ». C'est aussi la seule forme compatible avec `ARB-007` A-05, que
	   l'en-tête de ce fichier cite — « la session ne change ni la route, ni la
	   vue, ni les états » : un journal qui distinguerait le connecté de
	   l'anonyme rétablirait ici la dépendance au cookie que l'arbitrage a
	   fermée. La fonction appelée ne prend aucune identité ; la garantie est
	   portée par la signature, pas par la discipline.

	   APRÈS LA RÉSOLUTION, ET JAMAIS AVANT — même raison qu'à
	   `/notes/{identifiant}` : une note interne et une adresse absente sortent
	   toutes deux par le refus ci-dessus, sans atteindre cette écriture. Le
	   point dur de `V-04:2219` reste tenu, coût compris.

	   L'INSTANT EST PRIS ICI, une fois : ce chargeur n'en avait aucun. */
	await journaliserUneConsultation(base, {
		identifiant: params.identifiant,
		compte: compteDeLEspacePublic(),
		maintenant: new Date()
	});

	return {};
};
