/**
 * LE CHARGEUR DE `/recherche` — une adresse, deux écrans.
 *
 * `docs/routes.md` §3.1 et §5.5 : **V-02 Recherche publique** sans session,
 * **V-08 Recherche** avec session, et la même colonne pour tous les rôles
 * connectés. La route est une, donc le chargeur est un.
 *
 * CE FICHIER NE DÉCIDE RIEN. Il lit l'identité que `src/hooks.server.ts` a
 * posée, appelle `$lib/donnees/public`, et rend ce qu'il en reçoit. Aucune
 * comparaison de visibilité, de statut, de rôle ou de droit ne s'écrit ici :
 * `src/lib/droits/resolution.ts` est l'implémentation unique, et le premier
 * défaut de la batterie 6 vient de ce qu'aucune route ne l'appelait
 * (`ECART-047` É-1).
 *
 * L'INSTANT DE RÉFÉRENCE EST PRIS ICI, ET NULLE PART AILLEURS, comme au
 * chargeur de `/` : la couche de lecture le reçoit en paramètre pour rester
 * reproductible, donc mesurable. LES SEUILS VIENNENT DE LA BASE — `P-01` veut
 * une seule définition de la fraîcheur, donc un seul jeu de seuils.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * `/recherche` NE REFUSE JAMAIS — ET C'EST UNE EXIGENCE, PAS UNE COMMODITÉ
 *
 * `docs/routes.md:248` : « Un paramètre `statut=` ou `visibilite=` présenté par
 * un anonyme est IGNORÉ, jamais refusé — un refus révélerait l'existence du
 * filtre. » Ce chargeur ne porte donc AUCUN `error()`, aucune redirection et
 * aucune validation de paramètre. Les paramètres non honorés sont comptés par
 * `parametresIgnores()` — pour le rapport et pour la mesure —, et ce compte
 * n'ouvre aucune branche : la réponse est la même avec ou sans eux.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE PÉRIMÈTRE EST DANS LA REQUÊTE AU MOTEUR — `ADR-006`
 *
 * Ce chargeur ne filtre rien et ne reçoit aucune liste à filtrer. Il passe le
 * moteur et l'identité à `lireLaRecherche()`, qui appelle l'unique chemin de
 * recherche du dépôt ; celui-ci CALCULE le filtre depuis `resolution.ts` et
 * l'injecte dans la requête. « La requête envoyée au moteur NE PEUT PAS
 * rapporter un document interdit » (`STACK` §4.2).
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE MODE « SENS » SE DÉCLARE INDISPONIBLE
 *
 * L'index sert les mots-clés. Le mode « Sens » a besoin de VECTEURS, et aucun
 * n'existe : le service d'embeddings est optionnel et le modèle n'est pas fixé.
 * `SENS_DISPONIBLE` porte le constat — dérivé des réglages de l'index, où
 * l'absence d'embedder est la condition mécanique de l'indisponibilité —, et
 * V-08 porte la phrase du gel : « Recherche par sens momentanément
 * indisponible ». `P-10` — dégradation, jamais panne ; `P-02` — jamais de
 * simulation.
 */
import { basePartagee } from '$lib/base/acces';
import { lireSeuils } from '$lib/donnees/lecture';
import { lireLaRecherche } from '$lib/donnees/public';
import { moteurPartage } from '$lib/recherche/acces';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const base = basePartagee();
	const contexte = { maintenant: new Date(), seuils: await lireSeuils(base) };
	return await lireLaRecherche(base, moteurPartage(), locals.identite, url, contexte);
};
