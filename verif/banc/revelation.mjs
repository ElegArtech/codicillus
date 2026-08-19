/**
 * Banc de comparaison visuelle — la révélation d'un état.
 *
 * Ce module est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * Un agent bloqué sur un rouge ne modifie JAMAIS ce fichier, et n'ajoute jamais
 * une vue à `verif/references/protocole-app.json` pour faire taire un rouge.
 * Une révélation qui ne serait pas appliquée AUX DEUX CÔTÉS, ou qui ferait
 * autre chose que rendre vraie une propriété déclarée, serait le contournement
 * de vérification nommé par PLAN §12.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'EST UNE RÉVÉLATION — ARB-017
 *
 * Une révélation est une CONDITION DE CAPTURE : une propriété que le document
 * doit vérifier au moment de la mesure, et que le banc ÉTABLIT lui-même, des
 * deux côtés, par ce code unique.
 *
 * Le principe est déjà posé et éprouvé. `ECART-014` É-3 a établi que **le geste
 * appartient au banc, pas au candidat** : le clic qui ouvre une boîte de
 * dialogue est actionné par le banc, des deux côtés, après que
 * `element.click()` eut produit 33 % de pixels divergents et un anneau de
 * focalisation parasite. La modalité est le même cas.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LE PROBLÈME QU'ELLE RÉSOUT, MESURÉ — `ECART-015` É-4
 *
 * Côté maquette, le banc clique l'entrée du catalogue et `showModal()` place le
 * `dialog` dans la COUCHE SUPÉRIEURE : `position: fixed; inset: 0`, zone
 * **1440×900**, avec son `::backdrop`.
 *
 * Côté application, la vue rend le dialogue avec l'attribut `open` — qui n'est
 * PAS `showModal()`. Le dialogue reste `position: absolute` à sa position
 * statique, la zone fait **1440×901**, et le voile n'existe pas. Verdict sur
 * les dix états de V-40 : dimensions divergentes.
 *
 * La couche supérieure NE S'ATTEINT PAS DÉCLARATIVEMENT. Exiger de
 * l'application qu'elle entre en modalité, ce serait exiger du JavaScript d'un
 * squelette statique — donc contredire ARB-011, qui a tranché que le squelette
 * rend l'état et jamais la transition, pour satisfaire une mesure.
 * **L'instrument s'adapte au régime de la phase, il ne le dicte pas.**
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA SYMÉTRIE, ET COMMENT ELLE EST TENUE
 *
 * Une révélation est écrite comme une PROPRIÉTÉ À RENDRE VRAIE, jamais comme
 * un geste à jouer d'un seul côté. Le même code s'exécute des deux côtés, et
 * y établit la même postcondition :
 *
 *   « tout `dialog[open]` du document est `:modal` »
 *
 * Du côté maquette, le clic du banc l'a déjà rendue vraie : le code n'a rien à
 * faire, et NE FAIT RIEN — la référence n'est pas touchée, sa signature au
 * `verif/references/empreintes.json` ne bouge pas. Du côté application, il
 * l'établit. La postcondition est ensuite VÉRIFIÉE des deux côtés : une
 * révélation qui n'aurait pas pris échoue bruyamment, elle ne se tait pas.
 *
 * C'est bien une condition symétrique, et non un geste asymétrique : ce qui est
 * identique des deux côtés est l'ÉTAT DU DOCUMENT AU MOMENT DE LA MESURE, qui
 * est la seule chose dont le verdict dépende.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA MODALITÉ DE SAISIE COMPTE, ET ELLE EST REPRODUITE
 *
 * `ECART-014` É-4 l'a relevé sur la référence : **elle n'affiche aucun anneau
 * de focalisation**, le document étant en modalité « pointeur » — le dialogue a
 * été ouvert par un vrai clic. `showModal()` déplace pourtant le focus sur le
 * premier élément focalisable de la boîte, des deux côtés : ce n'est donc pas
 * le focus qui diffère, c'est la MODALITÉ SOUS LAQUELLE il a été posé.
 *
 * MESURÉ : sans rien faire, le côté application allume un anneau que la
 * référence n'a pas — 308 pixels divergents sur `d-simple`, `d-note`,
 * `d-doublon`, 264 sur `d-template`. C'est le même artefact que celui
 * qu'`ECART-014` É-3 avait chiffré à 584 px, et il a la même cause : Chromium
 * décide de `:focus-visible` d'après la dernière modalité de saisie du
 * document, et le côté application n'en a aucune — rien n'y a été cliqué,
 * l'état est arrivé par l'adresse.
 *
 * DEUX VOIES, ET UNE SEULE EST HONNÊTE.
 *
 *   • Retirer le focus. Mesuré aussi : l'anneau disparaît, mais le `:focus`
 *     disparaît avec lui, et avec lui tout ce que la feuille de la vue y
 *     attache. On échangerait un artefact contre un autre.
 *   • REPRODUIRE LA MODALITÉ. Le banc livre au côté application un vrai appui
 *     de pointeur — le seul moyen de basculer la modalité de Chromium,
 *     qu'aucun script ne peut feindre — puis rétablit le focal que
 *     `showModal()` avait posé. Le focus est alors le même des deux côtés, et
 *     sous la même modalité. C'est la voie retenue : elle reproduit la
 *     propriété au lieu de la masquer.
 *
 * L'appui a lieu APRÈS l'ouverture modale, au POINTEUR AU REPOS
 * (`conditions.mjs`) : le seul élément qui s'y trouve est alors le `dialog`
 * lui-même, la couche supérieure couvrant tout le reste, et le squelette n'a
 * aucun script à déclencher (ARB-011). Il n'a lieu QUE sur un côté qui avait
 * quelque chose à révéler — jamais sur la référence, qui tient déjà sa modalité
 * du clic de son déclencheur.
 *
 * AUCUN ANNEAU N'EST MASQUÉ : il n'y en a d'aucun côté, et pour la même raison
 * des deux côtés.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * LA MODALITÉ DE SAISIE DE LA RÉFÉRENCE — ET ELLE N'EST PAS TOUJOURS LA MÊME
 *
 * Ajouté par le lot T-007e, en même temps que les neuf vues que la déclaration
 * ne nommait pas. Le raisonnement ci-dessus est juste, et il était INCOMPLET :
 * il a été écrit sur V-40, où la référence tient sa modalité « pointeur » d'un
 * VRAI CLIC — celui que le banc livre sur l'entrée du catalogue. Il vaut donc
 * pour les onze états à déclencheur, et pour eux seuls.
 *
 * LES QUINZE AUTRES ÉTATS MODAUX N'ONT PAS DE DÉCLENCHEUR. Leur boîte s'ouvre
 * parce que `reglerPlanche()` a coché une position et RÉPARTI UN ÉVÉNEMENT
 * `change` SYNTHÉTIQUE, auquel le script de la maquette répond par
 * `showModal()`. Aucun pointeur n'a touché la référence : elle est donc dans la
 * modalité par défaut, et elle AFFICHE l'anneau de focalisation que
 * `showModal()` pose sur le premier élément focalisable.
 *
 * MESURÉ (T-007e, candidat privé de couche supérieure, `--source=composant`) :
 * en livrant l'appui de pointeur à ce candidat-là, on lui retire l'anneau que
 * la référence, elle, affiche — 308 px divergents sur `V-27 sup-systeme` et
 * `V-27 sup-ok`, sur le bouton de fermeture de la boîte. Sans l'appui, les six
 * états de V-27 sortent conformes. C'est le MÊME chiffre que celui relevé plus
 * haut sur V-40, dans l'autre sens : la même cause, la modalité de saisie, et
 * le remède opposé.
 *
 * LA RÈGLE, DONC, EST CELLE QUI ÉTAIT DÉJÀ ÉCRITE — « reproduire la modalité au
 * lieu de la masquer » — mais appliquée jusqu'au bout : ON REPRODUIT CELLE DE
 * LA RÉFÉRENCE, on n'en impose pas une. Le banc sait laquelle c'est, et il le
 * sait mécaniquement : la référence a reçu un vrai geste de pointeur si et
 * seulement si l'état porte un `zone.declencheur` dans
 * `verif/scenarios/V-xx.json`, dérivé de la maquette gelée. C'est le paramètre
 * `modaliteReference` de `reveler()`.
 *
 * CE QUE CE CORRECTIF NE PROUVE PAS. Aucune des dix vues n'est implémentée : la
 * mesure a été prise sur un candidat FABRIQUÉ pour être démuni — le corps du
 * gel, dont le premier `showModal()` de chaque boîte ne pose que l'attribut
 * `open`. C'est la seule façon d'éprouver aujourd'hui une contrainte qui ne
 * mord que sur un candidat sans JavaScript (`ECART-015` É-5) ; ce n'est pas une
 * implémentation, et le jour où il y en aura une, c'est elle qui fera foi.
 */
import { PEINTURE_MS, POINTEUR_AU_REPOS } from './conditions.mjs';

/**
 * Le catalogue des révélations connues. Il est CLOS : une déclaration qui
 * nommerait une révélation absente d'ici est refusée, plutôt que d'être
 * ignorée en silence (RA-01).
 *
 * Chaque entrée porte sa postcondition, exécutée dans la page, des deux côtés.
 * Elle rend le compte de ce qu'elle a trouvé et de ce qu'elle a établi.
 */
export const REVELATIONS = {
	/**
	 * `modalite-dialogue` — tout `dialog[open]` est `:modal`.
	 *
	 * `close()` puis `showModal()` : c'est la seule voie. Il n'existe pas de
	 * moyen de promouvoir un `dialog` déjà ouvert dans la couche supérieure, et
	 * `showModal()` sur un dialogue ouvert lève une `InvalidStateError`.
	 */
	'modalite-dialogue': {
		propriete: 'tout dialog[open] du document est :modal (couche supérieure, ::backdrop)',
		etablir: () => {
			const ouverts = [...document.querySelectorAll('dialog[open]')];
			const revelees = [];
			for (const d of ouverts) {
				if (d.matches(':modal')) continue;
				d.close();
				d.showModal();
				revelees.push(d.id || d.className || 'dialog');
			}
			// Le focal que `showModal()` vient de poser est mémorisé : la modalité
			// de saisie sera rétablie juste après, et il faudra le remettre.
			window.__focalRevele = revelees.length ? document.activeElement : null;
			const recalcitrants = [...document.querySelectorAll('dialog[open]')]
				.filter((d) => !d.matches(':modal'))
				.map((d) => d.id || d.className || 'dialog');
			return { trouves: ouverts.length, revelees, recalcitrants };
		},
		/**
		 * LA MODALITÉ DE SAISIE, RÉTABLIE PAR UN VRAI GESTE — et pas simulée.
		 *
		 * Voir le bandeau : la référence est en modalité « pointeur » parce qu'un
		 * vrai clic l'y a mise, et le côté application n'a rien de tel à faire
		 * valoir. Le banc lui livre donc un vrai appui de pointeur — le seul moyen
		 * de basculer la modalité de Chromium, qu'aucun script ne peut feindre —
		 * puis rétablit le focal que `showModal()` avait posé.
		 *
		 * L'APPUI EST INOFFENSIF, ET IL LE RESTE : il a lieu APRÈS l'ouverture
		 * modale, au POINTEUR AU REPOS — le même point que celui où le banc
		 * ramène le curseur après un déclencheur, donc le même survol des deux
		 * côtés. Le seul élément qui s'y trouve est alors le `dialog` lui-même,
		 * la couche supérieure couvrant tout le reste ; le squelette n'a par
		 * ailleurs aucun script à déclencher (ARB-011).
		 *
		 * @param {import('@playwright/test').Page} page
		 */
		modalitePointeur: async (page) => {
			await page.mouse.move(...POINTEUR_AU_REPOS);
			await page.mouse.down();
			await page.mouse.up();
			await page.evaluate(() => {
				const focal = window.__focalRevele;
				window.__focalRevele = null;
				if (focal && document.contains(focal)) focal.focus();
			});
		}
	}
};

/**
 * Applique à une page la révélation déclarée pour la vue, s'il y en a une.
 *
 * UNE VUE SANS DÉCLARATION N'EST JAMAIS RÉVÉLÉE. C'est le défaut, et c'est la
 * position la plus stricte : ne rien écrire n'ouvre rien (ARB-012, ARB-014,
 * même garde-fou).
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ revelation: string } | null} declaration la déclaration de la vue,
 *   lue dans `verif/references/protocole-app.json` — écriture humaine seule.
 * @param {string} cote 'reference' ou 'candidat', pour le message d'échec.
 * @returns {Promise<{ revelation: string, trouves: number, revelees: string[] } | null>}
 */
export async function reveler(page, declaration, cote, { modaliteReference = 'pointeur' } = {}) {
	if (!declaration) return null;
	const nom = declaration.revelation;
	const connue = REVELATIONS[nom];
	if (!connue) {
		throw new Error(
			`banc : révélation « ${nom} » inconnue du catalogue de verif/banc/revelation.mjs.\n` +
				`  Connues : ${Object.keys(REVELATIONS).join(', ')}.\n` +
				'  Une déclaration qui nomme une révélation inexistante est refusée : un vert\n' +
				"  muet vaudrait moins qu'un refus (RA-01, PLAN §12)."
		);
	}

	const compte = await page.evaluate(connue.etablir);

	/* LA MODALITÉ N'EST PAS IMPOSÉE : ELLE EST REPRODUITE. Voir le bandeau,
	   section « la modalité de saisie de la référence ». Le rétablissement au
	   pointeur n'a lieu que si la révélation a ouvert quelque chose — donc
	   jamais du côté référence — ET si la référence, elle, tient sa modalité
	   d'un vrai geste de pointeur. Pour les quinze états à planche, elle n'en
	   tient aucun : l'imposer au seul candidat lui retirerait un anneau que la
	   référence affiche. Mesuré : 308 px sur `V-27 sup-systeme` et `sup-ok`. */
	if (compte.revelees.length && connue.modalitePointeur && modaliteReference === 'pointeur') {
		await connue.modalitePointeur(page);
	}

	// La postcondition est VÉRIFIÉE, des deux côtés. Une révélation qui n'aurait
	// pas pris ferait comparer deux objets différents en silence.
	if (compte.recalcitrants.length) {
		throw new Error(
			`banc : la révélation « ${nom} » n'a pas pris du côté ${cote} — ` +
				`${compte.recalcitrants.join(', ')}.\n` +
				`  Propriété exigée : ${connue.propriete}.\n` +
				'  Comparer sans elle mesurerait deux surfaces différentes.'
		);
	}

	/* LA SECONDE MOITIÉ DE LA POSTCONDITION — « et ils sont TOUJOURS OUVERTS ».
	   Le contrôle ci-dessus est VACUEMENT VRAI si la révélation a fait
	   disparaître ce qu'elle devait promouvoir : `dialog[open]` ne trouve alors
	   plus rien, donc aucun récalcitrant, donc aucun cri. C'est le mode de
	   défaillance RA-01 dans sa forme la plus pure — un contrôle qui se tait
	   parce qu'il n'a plus rien à contrôler.

	   IL A ÉTÉ RENCONTRÉ, PAS SUPPOSÉ (T-007e). Sur un candidat où la couche
	   supérieure manquait mais où les scripts de la maquette étaient présents,
	   l'appui de pointeur au repos (0, 0) est tombé sur le `dialog` lui-même —
	   qui est `inset: 0`, donc couvre la fenêtre — et y a déclenché le renvoi au
	   clic du voile : la boîte s'est refermée juste après avoir été révélée. Le
	   banc a comparé une zone vide à une zone pleine et rendu « échec de
	   structure », c'est-à-dire le bon verdict pour la mauvaise raison, sans
	   jamais nommer la cause.

	   Le compte est donc relevé APRÈS, et comparé. Un candidat de phase 1 n'a
	   pas de script à déclencher (ARB-011) et ne peut pas rencontrer ce cas ;
	   c'est précisément pourquoi le contrôle doit exister — le jour où il se
	   produira, personne ne le cherchera là. */
	const ouvertsApres = await page.evaluate(() => document.querySelectorAll('dialog[open]').length);
	if (ouvertsApres < compte.trouves) {
		throw new Error(
			`banc : la révélation « ${nom} » a REFERMÉ ce qu'elle devait révéler, du côté ` +
				`${cote} — ${compte.trouves} dialogue(s) ouvert(s) avant, ${ouvertsApres} après.\n` +
				`  Propriété exigée : ${connue.propriete}.\n` +
				'  Le contrôle des récalcitrants ne le voit pas : sans dialogue ouvert, il\n' +
				"  n'a plus rien à trouver et se tait (RA-01). Celui-ci parle."
		);
	}

	// Le compositeur, lui, n'est pas virtualisable : la couche supérieure et son
	// voile viennent d'apparaître, il faut le laisser peindre. Aucune avance
	// d'horloge VIRTUELLE n'est dépensée ici — elle le serait des deux côtés,
	// mais elle déclencherait aussi, du côté maquette, des minuteries que
	// l'état n'a pas prévues.
	await page.waitForTimeout(PEINTURE_MS);

	return { revelation: nom, trouves: compte.trouves, revelees: compte.revelees };
}
