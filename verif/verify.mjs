#!/usr/bin/env node
/**
 * `pnpm verify` — L'ÉTAT DU DÉPÔT, BATTERIE PAR BATTERIE.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI IL REMPLACE UNE CHAÎNE DE CONJONCTIONS
 *
 * `verify` était une suite de commandes reliées par la conjonction du shell.
 * Deux défauts, et le second est de ceux que ce dépôt combat par principe.
 *
 * 1. ELLE S'ARRÊTE AU PREMIER ROUGE. Le dépôt porte aujourd'hui plusieurs
 *    rouges assumés — une dette de gel arbitrée, des vacuités qui se ferment
 *    route par route, des règles que le produit ne tient pas encore. Une
 *    chaîne conjonctive rend donc TOUJOURS le même chiffre, celui de la
 *    première batterie rouge, et n'apprend rien sur les seize suivantes.
 *    Ce n'est pas une vérification : c'est un test d'arrêt.
 *
 * 2. ELLE NE CONFRONTAIT JAMAIS L'APPLICATION AUX MAQUETTES. Elle appelait
 *    `verif:maquette`, l'ÉTALONNAGE À BLANC — la maquette contre elle-même.
 *    `CLAUDE.md` §4 le dit sans détour : cet étalonnage « prouve que le banc
 *    est déterministe, RIEN SUR L'APPLICATION ». La conformité réelle est
 *    `--contre=app`, et elle n'était dans aucune chaîne. Une commande qui
 *    s'annonce comme « les dix-huit batteries » et ne compare jamais le
 *    produit à la loi du projet est un vert qui ne dit rien — `RA-01`.
 *
 * Les deux sont réparés : chaque batterie est jouée jusqu'au bout, son code
 * de sortie est relevé, et les DEUX régimes du banc sont dans la liste.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * CE QU'IL NE PROUVE PAS, ET IL FAUT LE LIRE AVANT DE CONCLURE
 *
 * 1. IL N'AJOUTE AUCUNE MESURE. Il n'est que l'ordonnanceur des batteries :
 *    tout ce qu'il rapporte est le code de sortie d'une autre commande. Un
 *    défaut d'une batterie reste invisible ici.
 *
 * 2. IL NE REND PAS LES BATTERIES INDÉPENDANTES. Elles partagent la base et
 *    l'index de la composition (`P-30`), et l'ordre les expose au même
 *    voisinage. Ce qui suit une batterie destructrice la subit. L'ordre
 *    ci-dessous n'est donc pas arbitraire, et le champ `pourquoi_ici` de
 *    chaque entrée le dit.
 *
 * 3. LE VERT DE L'ENSEMBLE NE VAUT QUE POUR LES BATTERIES DE LA LISTE. Ce
 *    que le catalogue promet et qui n'y figure pas n'est pas mesuré. La
 *    liste est imprimée à chaque exécution pour que l'écart se voie.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * USAGE
 *
 *   pnpm verify                 toutes les batteries, une ligne par verdict
 *   pnpm verify --arret         s'arrête au premier rouge (ancien régime)
 *   pnpm verify --sauf=a,b      écarte des batteries, et LE DIT au rapport
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Les batteries, dans l'ordre où elles se jouent.
 *
 * `pourquoi_ici` n'est pas un ornement : l'ordre est la seule protection
 * contre le voisinage décrit au point 2 de l'en-tête.
 *
 * @type {{nom: string, prouve: string, pourquoi_ici: string}[]}
 */
const BATTERIES = [
	{
		nom: 'verif:gel',
		prouve: 'les 43 empreintes du gel correspondent aux fichiers',
		pourquoi_ici: "d'abord : tout ce qui suit se mesure CONTRE le gel"
	},
	{
		nom: 'check',
		prouve: 'le code compile et respecte les conventions',
		pourquoi_ici: 'avant toute mesure : un dépôt qui ne compile pas ne se mesure pas'
	},
	{
		nom: 'verif:jetons',
		prouve: 'aucune valeur de design en dur hors du socle',
		pourquoi_ici: 'statique, sans base ni serveur'
	},
	{
		nom: 'verif:inventaire',
		prouve: "les composants employés sont ceux de l'inventaire fermé",
		pourquoi_ici: 'statique'
	},
	{
		nom: 'verif:demo:hors-production',
		prouve: "le mode de conception n'existe pas dans le produit construit",
		pourquoi_ici: 'statique, sur le produit bâti'
	},
	{
		nom: 'verif:tracabilite',
		prouve: 'aucune référence numérotée sans pièce porteuse',
		pourquoi_ici: 'statique, et elle surveille la mémoire du dépôt'
	},
	{
		nom: 'verif:couverture',
		prouve:
			'quelle règle du cahier n\u2019est portée par aucun code, et laquelle par aucun contrôle',
		pourquoi_ici: 'statique — et elle est la seule à mesurer une ABSENCE'
	},
	{
		nom: 'test:unit',
		prouve: 'les comportements locaux, droits et fraîcheur compris',
		pourquoi_ici: 'sans base'
	},
	{
		nom: 'test:aller-retour',
		prouve: 'sérialiser puis désérialiser redonne le document',
		pourquoi_ici: 'sans base'
	},
	{
		nom: 'verif:convertisseur',
		prouve: 'une seule implémentation du convertisseur, et tous y passent',
		pourquoi_ici: 'sans base'
	},
	{
		nom: 'verif:fraicheur',
		prouve: "une seule implémentation de la fraîcheur, et tous l'appellent",
		pourquoi_ici: 'sans base — P-01'
	},
	{
		nom: 'verif:donnees',
		prouve: 'le corpus servi est celui de la base',
		pourquoi_ici: 'première batterie qui lit la base'
	},
	{
		nom: 'test:etancheite',
		prouve: 'aucun contenu interne atteignable par aucun chemin',
		pourquoi_ici: 'avant les batteries qui écrivent : elle mesure un état de lecture'
	},
	{
		nom: 'test:droits',
		prouve: "aucune action non autorisée n'est dans le DOM",
		pourquoi_ici: 'banc, en lecture seule'
	},
	{
		nom: 'test:vide',
		prouve: "sur base vierge, aucun indicateur n'affiche de valeur",
		pourquoi_ici: 'banc, en lecture seule'
	},
	{
		nom: 'test:etats',
		prouve: 'chaque zone rend ses quatre états',
		pourquoi_ici: 'banc, en lecture seule'
	},
	{
		nom: 'test:impression',
		prouve: "la lecture d'une note s'imprime sans navigation",
		pourquoi_ici: 'banc, en lecture seule'
	},
	{
		nom: 'verif:menus',
		prouve: 'aucune entrée de navigation inerte',
		pourquoi_ici: 'banc, en lecture seule — P-03, P-04'
	},
	{
		nom: 'verif:vocabulaire',
		prouve: 'aucun synonyme des douze termes contractuels',
		pourquoi_ici: 'banc, en lecture seule — P-07'
	},
	{
		nom: 'test:a11y',
		prouve: 'axe-core sans violation, parcours clavier complet',
		pourquoi_ici: 'banc, longue — après les batteries courtes'
	},
	{
		nom: 'verif:maquette',
		prouve: 'LE BANC EST DÉTERMINISTE — la maquette contre elle-même',
		pourquoi_ici: "l'étalonnage précède la mesure qu'il étalonne"
	},
	{
		nom: 'verif:maquette:app',
		prouve: "LA CONFORMITÉ RÉELLE — l'application contre le gel, 409 couples",
		pourquoi_ici: "après l'étalonnage : c'est lui qui rend ce verdict opposable"
	},
	{
		nom: 'test:parcours',
		prouve: 'PU-01 à PU-06 joués de bout en bout',
		pourquoi_ici: 'première batterie qui ÉCRIT dans la base'
	},
	{
		nom: 'test:degradation',
		prouve: 'les deux conteneurs optionnels arrêtés, le produit tient',
		pourquoi_ici: 'elle arrête des services : après tout ce qui en dépend'
	},
	{
		nom: 'mesure:budgets',
		prouve: 'les sept budgets sur volumétrie haute',
		pourquoi_ici: 'elle charge une volumétrie de 5 000 notes et la retire'
	},
	{
		nom: 'exploitation:restauration',
		prouve: 'restauration complète depuis une sauvegarde, corpus identique',
		pourquoi_ici: 'EN DERNIER : elle remplace le contenu de la base'
	}
];

const args = process.argv.slice(2);
const arretAuPremier = args.includes('--arret');
const ecartees = new Set(
	args
		.filter((a) => a.startsWith('--sauf='))
		.flatMap((a) => a.slice('--sauf='.length).split(','))
		.filter((n) => n !== '')
);

/** La dernière ligne non vide d'une sortie — le verdict, en général. */
function derniereLigneUtile(texte) {
	const lignes = texte
		.split('\n')
		.map((l) => l.replace(/\s+$/, ''))
		.filter((l) => l.trim() !== '' && !l.startsWith('[ELIFECYCLE]'));
	return lignes.length === 0 ? '' : lignes[lignes.length - 1].trim().slice(0, 96);
}

console.log('');
console.log(`  pnpm verify — ${BATTERIES.length} batteries, chacune jouée jusqu'au bout.`);
if (ecartees.size > 0) {
	console.log(
		`  ÉCARTÉES À LA DEMANDE : ${[...ecartees].join(', ')} — ce rapport ne dit RIEN d'elles.`
	);
}
console.log('');

const resultats = [];
for (const batterie of BATTERIES) {
	if (ecartees.has(batterie.nom)) {
		resultats.push({ ...batterie, code: null, secondes: 0, verdict: 'écartée à la demande' });
		continue;
	}
	const debut = process.hrtime.bigint();
	const r = spawnSync('pnpm', ['run', batterie.nom], {
		cwd: RACINE,
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024
	});
	const secondes = Number(process.hrtime.bigint() - debut) / 1e9;
	const code = r.status ?? 2;
	const verdict = derniereLigneUtile(`${r.stdout ?? ''}\n${r.stderr ?? ''}`);
	resultats.push({ ...batterie, code, secondes, verdict });
	const marque = code === 0 ? 'VERT ' : `ROUGE`;
	console.log(
		`  ${marque} ${String(code).padStart(2)} · ${secondes.toFixed(0).padStart(4)}s · ${batterie.nom}`
	);
	if (code !== 0) console.log(`            ${verdict}`);
	if (code !== 0 && arretAuPremier) break;
}

const jouees = resultats.filter((r) => r.code !== null);
const rouges = jouees.filter((r) => r.code !== 0);
const total = resultats.reduce((s, r) => s + r.secondes, 0);

console.log('');
console.log(
	`  ${jouees.length} jouée(s) · ${jouees.length - rouges.length} verte(s) · ${rouges.length} rouge(s) · ${(total / 60).toFixed(1)} min`
);
if (rouges.length > 0) {
	console.log('');
	console.log('  LES ROUGES :');
	for (const r of rouges) console.log(`    ${r.nom} (${r.code}) — ${r.prouve}`);
}
console.log('');
console.log(
	`  Ce rapport ne dit rien de ce qui n'est pas dans la liste : ${BATTERIES.length} batteries ordonnancées.`
);
console.log('');

mkdirSync(join(RACINE, 'verif/rapports'), { recursive: true });
writeFileSync(
	join(RACINE, 'verif/rapports/verify.json'),
	`${JSON.stringify({ batteries: resultats, rouges: rouges.length, jouees: jouees.length }, null, '\t')}\n`
);

process.exit(rouges.length === 0 ? 0 : 1);
