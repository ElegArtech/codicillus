/**
 * LES AIGUILLES — les noms qu'une instance neuve ne peut pas produire.
 *
 * Ce module ne mesure rien. Il répond à une seule question : « quels mots, s'ils
 * sortent du produit, prouvent que le jeu de démonstration a fui ? » Les deux
 * contrôles de `docs/traces/` s'en servent — `passage-a-froid.mjs` sur le HTML
 * SERVI, `aiguilles-dans-le-paquet.mjs` sur tout le paquet construit.
 *
 * LA LISTE N'EST PAS RECOPIÉE : ELLE EST PRODUITE PAR SA SOURCE.
 * Une liste écrite à la main aurait été verte le jour où le jeu aurait changé
 * sans elle. Les noms du corpus sont donc LUS DANS `seeds/corpus.ts`, par le
 * même chemin que le reste du dépôt (`ssrLoadModule`, comme `base/base.mjs`).
 * Ajouter une note au jeu ajoute son identifiant et son titre aux aiguilles,
 * sans que personne y pense.
 *
 * DEUX FAMILLES, ET ELLES N'ONT PAS LA MÊME PREUVE :
 *   · `corpus` — dérivée de `seeds/corpus.ts`. Sa preuve est son origine.
 *   · `gel`    — des noms que le corpus NE PORTE PAS et que les relevés du
 *                26/08/2026 ont nommés un par un dans les vues. Chacune cite le
 *                relevé qui l'a trouvée ; aucune n'est inventée ici.
 */

/* ═══════════════════════ CE QUI N'EST PAS UNE AIGUILLE ═══════════════════════

   Un nom du jeu qui est AUSSI un mot du produit ne peut pas servir de preuve :
   le contrôle crierait sur le vocabulaire de Codicillus lui-même, et un contrôle
   qui crie à tort finit débranché. La règle qui tranche : une aiguille NOMME UNE
   CHOSE DU JEU et rien d'autre.

   Ce n'est pas une exemption. Une exemption laisse passer une fuite reconnue
   (voir `EXEMPTIONS_DU_PAQUET` plus bas) ; ceci dit qu'il n'y a pas de fuite à
   voir.

   IL N'Y EN A QU'UN, ET C'EST UNE CORRECTION. La première rédaction en portait
   quatre, et TROIS ÉTAIENT INERTES — leur prose décrivait un filtrage qui ne
   filtrait rien :
     · « Comptes » et « Accès » ne sont jamais posés comme aiguilles. Ce qui les
       écarte n'est pas cette table : c'est la garde de `aiguillesDuCorpus`, qui
       ne retient un chemin de dossier que s'il porte un espace ou un « › ». Elle
       est commentée à son site, le seul endroit où elle agit.
     · « Codicillus 1.0.0 » non plus : `INSTANCE.version` n'est jamais lu par la
       dérivation, donc ce mot n'entre jamais dans la liste.
   Les décrire ici donnait à croire qu'un filtre les retenait. Un seul écart
   agit, et le voici. */
export const ECARTES = [
	{
		mot: 'Non classé',
		motif:
			'univers SYSTÈME, pas un univers du jeu — `schema.ts:193` le pose par défaut ' +
			'au titre de RG-STR-01 et interdit sa suppression. Le produit le nomme ' +
			'lui-même dans l’aide de la console des univers (`administration.ts:156` — ' +
			'« Non classé convient si aucune destination ne s’impose »), parce que c’est ' +
			'la destination de repli d’un domaine qui perd son rattachement. `UNIVERS` de ' +
			'`seeds/corpus.ts` le porte aussi : sans cet écart, le contrôle crierait sur ' +
			'la structure obligatoire de toute instance neuve.'
	}
];

/** Les mots que la dérivation ne pose jamais, pour la raison ci-dessus. */
const MOTS_ECARTES = new Set(ECARTES.map((e) => e.mot));

/* ══════════════════════ LES NOMS QUE LE CORPUS NE PORTE PAS ══════════════════

   Ils viennent des maquettes ou du cadrage, jamais de `seeds/corpus.ts` : rien
   ne peut donc les dériver, et chacun cite le relevé qui l'a trouvé. */
export const AIGUILLES_DU_GEL = [
	{
		mot: 'Direction technique',
		origine:
			'gel · relevé du 26/08 §1 — segment de marché du cadrage (CAHIER:60, :94, :96) ' +
			'soudé dans la signature « Codicillus · Direction technique » de huit vues, ' +
			"dont les cinq pieds publics et /connexion. Un nom d'organisation se configure " +
			"désormais ; il ne s'écrit plus en dur."
	},
	{
		mot: 'bascule-telephonie-voip',
		origine:
			'gel · relevé du 26/08 §B — adresse par défaut de la planche de V-26. Toute ' +
			"adresse cassée de l'instance l'annonçait, et « Créer la note » ouvrait " +
			"l'éditeur sur ce titre-là."
	},
	{
		mot: 'restaurer-une-sauvegarde-mariadb',
		origine: 'gel · relevé du 26/08 §B — seconde adresse de la planche de V-26.'
	},
	{
		mot: 'comptes-a-privileges-production',
		origine: 'gel · relevé du 26/08 §B — troisième adresse de la planche de V-26.'
	},
	{
		mot: '20260810T020112',
		origine:
			"gel · relevé du 26/08 §B — l'étiquette de sauvegarde du corps de la note de " +
			'démonstration, dans `CorpsReference.svelte`.'
	},
	{
		mot: 'Ordonnancement',
		origine:
			"gel · relevé du 26/08 §B — nœud de l'arborescence abrégée, servie dans TOUT " +
			'chunk montant une coquille. Ce nom-là ne figure pas dans le corpus.'
	},
	{
		mot: 'Adressage',
		origine: "gel · relevé du 26/08 §B — second nœud de l'arborescence abrégée absent du corpus."
	},
	{
		mot: 'Barman',
		origine:
			"jeu · relevé du 26/08 §B — l'outil de sauvegarde du corps de démonstration " +
			'(`barman` ×16 dans `CorpsReference.svelte`). Les deux casses sont relevées : ' +
			'le contrôle compare à la casse, pour ne pas crier sur la prose du produit.'
	},
	{ mot: 'barman', origine: 'jeu · même relevé, casse basse — nom de commande et étiquette.' }
];

/* ════════════════════════ LES EXEMPTIONS DU PAQUET ═══════════════════════════

   ELLE EST VIDE, ET C'EST UNE CORRECTION.

   Le brief du lot ne prévoyait qu'un cas, et un seul : « SI UN LOT EST EN
   QUARANTAINE, ses noms passeront encore : exempte-les nommément, avec un
   commentaire qui dit le lot et que l'exemption est provisoire. » La première
   rédaction en posait quatre HORS DE CE CAS — `master` valait alors
   `631e4f3 Merge branch 'lot-a-accords'`, les six lots S/P/N/R/C/A y étaient
   FUSIONNÉS, aucun n'était en quarantaine. Elles couvraient donc des défauts
   RÉSIDUELS de lots livrés, et le contrôle partait VERT sur un paquet client qui
   portait encore `bascule-telephonie-voip`, `restaurer-une-sauvegarde-mariadb`,
   `comptes-a-privileges-production` (V-26, dans le nœud d'erreur — le fichier
   servi comme source à tout visiteur d'une adresse cassée) et `Applications`
   (V-21). C'est EXACTEMENT la propriété que ce contrôle existe pour interdire :
   un garde-fou vert sur la fuite qu'il devait nommer.

   Ces quatre occurrences sont désormais RELEVÉES ET FATALES. Le contrôle rend
   donc 1 aujourd'hui, et c'est la vérité du paquet : le remède est de rendre
   `adresse` REQUISE dans V-26 (et de reprendre les trois cas de
   `proprietes-coquille.test.ts:763-790` sur une autre source que le repli), et
   de faire filtrer l'axe restreint de `V-21:141` sur une donnée de droits plutôt
   que sur le nom de domaine « Applications ». Ni l'un ni l'autre n'appartient à
   ce lot, et aucun des deux ne s'obtient en taisant la mesure.

   QUAND CETTE TABLE PEUT SE REMPLIR, ET SEULEMENT ALORS : un lot en quarantaine.
   Chaque entrée nomme UN SITE — `{ mot, vue, temoin, lot, motif }` —, jamais une
   aiguille seule : le reste du paquet reste gardé pour le même mot. `temoin` est
   ce qui tient l'exemption à son site, un second littéral de la MÊME vue qui
   doit se trouver dans le MÊME fichier — les fichiers construits portent un
   condensat dans leur nom, le nommer ferait expirer l'exemption à chaque
   construction.

   ELLES NE VAUDRAIENT QUE POUR LE PAQUET, JAMAIS POUR LE HTML SERVI : ce qu'un
   lecteur peut LIRE À L'ÉCRAN ne s'exempte pas, et `passage-a-froid` ignore
   cette table entière.

   ET ELLES EXPIRENT SEULES : une exemption qui ne trouve plus rien FAIT ÉCHOUER
   le contrôle, avec l'ordre de la retirer. */
export const EXEMPTIONS_DU_PAQUET = [];

/**
 * Ouvre un serveur Vite en mode intergiciel et lit `seeds/corpus.ts`.
 * C'est le chemin de `base/base.mjs` : un seul mode de résolution de modules
 * dans le dépôt, parce que deux finissent toujours par diverger.
 */
async function lireLeCorpus() {
	const { createServer } = await import('vite');
	const vite = await createServer({
		server: { middlewareMode: true, hmr: false },
		appType: 'custom',
		logLevel: 'error'
	});
	try {
		return await vite.ssrLoadModule('/seeds/corpus.ts');
	} finally {
		await vite.close();
	}
}

/**
 * LES AIGUILLES, dans l'ordre où elles se lisent : famille, puis mot.
 * Rend `[{ mot, origine }]`, sans doublon.
 *
 * LA FORME DE LA SOURCE EST VÉRIFIÉE, PAS SUPPOSÉE. Si `seeds/corpus.ts` cesse
 * d'exporter ce que ce module lit, la fonction ÉCHOUE au lieu de rendre une
 * liste courte : une liste courte est un contrôle qui ne garde plus rien.
 */
export async function aiguillesDuCorpus() {
	const C = await lireLeCorpus();

	const attendu = (nom, valeur, minimum) => {
		if (!Array.isArray(valeur) || valeur.length < minimum) {
			throw new Error(
				`seeds/corpus.ts n’exporte plus « ${nom} » sous la forme attendue ` +
					`(au moins ${minimum} entrées). Les aiguilles ne peuvent plus s’en dériver : ` +
					`reprends aiguilles-du-corpus.mjs avant de mesurer quoi que ce soit.`
			);
		}
		return valeur;
	};

	const par = new Map();
	const poser = (mot, origine) => {
		if (typeof mot !== 'string') return;
		const propre = mot.trim();
		if (propre === '' || MOTS_ECARTES.has(propre)) return;
		if (!par.has(propre)) par.set(propre, origine);
	};

	for (const c of attendu('COMPTES', C.COMPTES, 5)) {
		poser(c.nom, 'corpus · COMPTES.nom');
		poser(c.identifiant, 'corpus · COMPTES.identifiant');
		poser(c.courriel, 'corpus · COMPTES.courriel');
	}
	for (const u of attendu('UNIVERS', C.UNIVERS, 3)) poser(u.nom, 'corpus · UNIVERS.nom');
	for (const d of attendu('DOMAINES', C.DOMAINES, 4)) poser(d.nom, 'corpus · DOMAINES.nom');
	for (const n of attendu('CORPUS', C.CORPUS, 32)) {
		poser(n.id, 'corpus · CORPUS.id');
		poser(n.titre, 'corpus · CORPUS.titre');
		poser(n.auteur, 'corpus · CORPUS.auteur');
		poser(n.url, 'corpus · CORPUS.url');
		/* LE CHEMIN ENTIER, JAMAIS SES SEGMENTS — et pas les chemins d'UN SEUL MOT.
		   « Exploitation › Sauvegardes » ne peut venir que du jeu ; « Exploitation »
		   tout seul est un mot, qu'une instance réelle peut porter et que l'écran
		   d'import donne en exemple d'une arborescence DE DISQUE (`V-24:415-429`,
		   tranché par le lot C : « les deux dossiers de gauche restent ce qu'ils
		   sont »). Un chemin d'un seul mot n'accuse personne. C'EST ICI, ET NULLE
		   PART AILLEURS, QUE « Comptes » ET « Accès » SONT ÉCARTÉS. */
		if (typeof n.dossier === 'string' && /[\s›]/u.test(n.dossier)) {
			poser(n.dossier, 'corpus · CORPUS.dossier (chemin entier)');
		}
	}

	/* L'HÔTE DU PORTAIL D'ASSISTANCE, pas l'adresse entière : le défaut du produit
	   est la chaîne vide, et c'est l'hôte inventé du jeu qui trahit la fuite. */
	const portail = C.CONFIG?.portailAssistance;
	if (typeof portail === 'string' && portail !== '') {
		try {
			poser(new URL(portail).hostname, 'corpus · CONFIG.portailAssistance (hôte)');
		} catch {
			poser(portail, 'corpus · CONFIG.portailAssistance');
		}
	}

	for (const a of AIGUILLES_DU_GEL) poser(a.mot, a.origine);

	const liste = [...par].map(([mot, origine]) => ({ mot, origine }));
	liste.sort((a, b) => a.mot.localeCompare(b.mot, 'fr'));
	return liste;
}

/**
 * Les aiguilles trouvées dans un texte. La comparaison est À LA CASSE, et c'est
 * un choix : « Direction technique » est une signature d'organisation, « la
 * direction technique » un nom commun de la prose du produit. Confondre les deux
 * ferait crier le contrôle sur une phrase que personne ne veut changer.
 */
export function aiguillesTrouvees(texte, aiguilles) {
	const vues = [];
	for (const a of aiguilles) {
		let depuis = 0;
		let combien = 0;
		let premier = -1;
		for (;;) {
			const ou = texte.indexOf(a.mot, depuis);
			if (ou < 0) break;
			if (premier < 0) premier = ou;
			combien += 1;
			depuis = ou + a.mot.length;
		}
		if (combien > 0) vues.push({ ...a, combien, extrait: extraitAutour(texte, premier, a.mot) });
	}
	return vues;
}

/** Ce qu'il y a autour de la première occurrence, pour que le rapport situe. */
export function extraitAutour(texte, ou, mot) {
	const avant = texte.slice(Math.max(0, ou - 70), ou);
	const apres = texte.slice(ou + mot.length, ou + mot.length + 70);
	return `…${avant}⟦${mot}⟧${apres}…`.replace(/\s+/gu, ' ');
}
