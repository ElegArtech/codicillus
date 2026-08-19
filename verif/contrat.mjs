#!/usr/bin/env node
/**
 * contrat — génère la part FACTUELLE d'un contrat de tâche depuis les sources
 * machine, jamais depuis une énumération à la main.
 *
 * MOTIF, et il est empirique. Quatre contrats successifs ont transmis un chiffre
 * faux, corrigé au recomptage par l'exécutant : le nombre d'états d'une vue
 * (ECART-010 É-3), « 33 maquettes sur 35 » qui étaient 32 sur 34 avec une
 * troisième valeur d'identifiant (ECART-016 É-1), V-41 classée à tort parmi les
 * cibles à amender (ECART-018 É-2), et une divergence de gabarit qui n'existait
 * pas (ECART-021). Trois exécutants sur quatre ont recompté sans qu'on le leur
 * demande ; le quatrième aurait implémenté un attribut qu'aucune maquette
 * n'écrit.
 *
 * La règle qui en découle : UN CHIFFRE CITÉ DANS UN CONTRAT N'EST PAS UNE
 * SOURCE. Ce script rend la règle mécanique — le contrat ne cite plus de
 * chiffre, il cite la commande qui le produit, et l'imprime au moment de
 * l'écrire.
 *
 * INSTRUMENT — écriture humaine seule. Un agent d'exécution ne génère pas le
 * contrat par lequel il sera jugé.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (p) => JSON.parse(readFileSync(join(racine, p), 'utf8'));

const vues = process.argv.slice(2).filter((a) => /^V-\d\d$/.test(a));
if (!vues.length) {
	console.error(`contrat — usage : node verif/contrat.mjs V-xx [V-yy …]

Rend la part factuelle d'un contrat de tâche : états, fenêtres, zones,
révélations, régime de mesure, et les commandes de sortie. La part rédigée —
périmètre, interdictions de conclure, pointeurs de harnais — reste à écrire.`);
	process.exit(2);
}

const { VUES_RG_M18_13 } = await import(join(racine, 'verif/banc/conditions.mjs'));
const zones = existsSync(join(racine, 'verif/references/zones.json'))
	? lire('verif/references/zones.json')
	: {};
const protocole = lire('verif/references/protocole-app.json');

const gelees = readdirSync(join(racine, 'mockups')).filter((f) => /^V-\d\d-.*\.html$/.test(f));
const fichierDe = (v) => gelees.find((f) => f.startsWith(v + '-'));
const empreintes = readFileSync(join(racine, 'mockups/GEL.md'), 'utf8');

/* Les fichiers de référence rangent leurs entrées sous `.vues`, à côté d'un
   bandeau `_` d'intégrité. On lit la forme réelle, jamais une forme supposée. */
const parVue = (o, v) => o?.vues?.[v];

let total = 0;
console.log(`# Part factuelle — ${vues.join(', ')}\n`);
console.log(`> Généré par \`node verif/contrat.mjs ${vues.join(' ')}\`.`);
console.log(`> **Aucun chiffre de cette section n'est écrit à la main.** Régénérer avant de`);
console.log(`> lancer le lot : les scénarios sont réextraits des planches à chaque évolution.\n`);

for (const v of vues) {
	const f = fichierDe(v);
	if (!f) {
		console.log(`## ${v} — INTROUVABLE dans mockups/\n`);
		continue;
	}
	const sc = lire(`verif/scenarios/${v}.json`);
	const etats = sc.etats ?? [];
	const deZone = etats.filter((e) => e.zone).length;
	const dePlanche = etats.length - deZone;
	const fens = VUES_RG_M18_13.includes(v) ? 4 : 1;
	const couples = etats.length * fens;
	total += couples;

	const emp = (empreintes.match(new RegExp(`\\\`${f}\\\`\\s*\\|\\s*\\\`([0-9a-f]{64})`)) ?? [])[1];
	const z = parVue(zones, v);
	const ez = parVue(protocole.etats_de_zone, v);
	const rev = parVue(protocole.revelations, v);

	console.log(`## ${v}\n`);
	console.log(`| | |`);
	console.log(`|---|---|`);
	console.log(`| Maquette gelée | \`mockups/${f}\` |`);
	console.log(`| Empreinte | \`${emp ?? '— absente de GEL.md'}\` |`);
	console.log(`| États | **${etats.length}** — ${dePlanche} de planche, ${deZone} de zone |`);
	console.log(`| Fenêtres | ${fens}${fens === 4 ? ' — vue visée par RG-M18-13 (ARB-009)' : ''} |`);
	console.log(`| **Couples à rendre conformes** | **${couples}** |`);
	console.log(
		`| Zones comparées | ${z ? `\`${z.zones ?? z.surface}\` (ARB-012)` : 'page entière, par défaut'} |`
	);
	console.log(
		`| États de zone | ${ez ? '`' + (ez.protocole ?? protocole.etats_de_zone.protocole) + '` (ARB-014)' : '—'} |`
	);
	console.log(`| Révélation | ${rev ? `\`${rev.revelation}\` (ARB-017)` : '—'} |`);
	console.log(`\n**Clés d'état** — toutes doivent être conformes, une vue partiellement`);
	console.log(`conforme n'est pas une vue livrée (\`PLAN §4.3\`) :\n`);
	console.log('```');
	console.log(etats.map((e) => e.cle).join(' · '));
	console.log('```\n');
}

console.log(`## Critères de sortie — ${total} couples au total\n`);
console.log('```');
for (const v of vues)
	console.log(`pnpm verif:maquette ${v} --contre=app     → 0, zéro pixel divergent`);
console.log(`pnpm check · pnpm verif:jetons · pnpm verif:inventaire      → 0`);
console.log(`pnpm verif:gel · pnpm test:unit                             → 0`);
console.log(`pnpm verif:maquette          (à blanc, 41 vues)             → 0`);
console.log('```\n');
console.log(`Le seuil de conformité est **zéro pixel** (ARB-018) : il n'y a plus de marge`);
console.log(`sous laquelle un défaut pourrait passer. Un écart jugé irréductible est un`);
console.log(`recours au niveau 3 — arbitré par un tiers, compté, jamais accordé par soi-même.`);
console.log(`\n**La feuille de style se pose par commande**, jamais à la main :`);
console.log('```');
for (const v of vues) console.log(`node verif/feuilles-de-vue.mjs ${v} --installer`);
console.log('```');
