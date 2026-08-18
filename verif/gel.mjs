#!/usr/bin/env node
/**
 * verif:gel — contrôle d'intégrité du gel des maquettes.
 *
 * Recalcule l'empreinte SHA-256 de chaque fichier de référence listé dans
 * mockups/GEL.md et refuse toute divergence.
 *
 * Ce script est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const cheminGel = join(racine, 'mockups', 'GEL.md');

if (!existsSync(cheminGel)) {
  console.error('verif:gel — mockups/GEL.md est absent. Le gel n\'existe pas.');
  process.exit(1);
}

// | `fichier` | `empreinte` | octets | planche |
const ligne = /^\|\s*`([^`]+)`\s*\|\s*`([0-9a-f]{64})`\s*\|\s*(\d+)\s*\|/;

const attendus = readFileSync(cheminGel, 'utf8')
  .split('\n')
  .map((l) => l.match(ligne))
  .filter(Boolean)
  .map(([, fichier, empreinte, octets]) => ({ fichier, empreinte, octets: Number(octets) }));

if (attendus.length === 0) {
  console.error('verif:gel — aucune entrée lisible dans mockups/GEL.md.');
  process.exit(1);
}

const divergences = [];

for (const { fichier, empreinte, octets } of attendus) {
  const chemin = join(racine, 'mockups', fichier);
  if (!existsSync(chemin)) {
    divergences.push({ fichier, motif: 'fichier absent du dépôt' });
    continue;
  }
  const contenu = readFileSync(chemin);
  const reelle = createHash('sha256').update(contenu).digest('hex');
  if (reelle !== empreinte) {
    divergences.push({
      fichier,
      motif: 'empreinte divergente',
      attendue: empreinte,
      obtenue: reelle,
      octetsAttendus: octets,
      octetsObtenus: contenu.length,
    });
  }
}

if (divergences.length > 0) {
  console.error(`\nverif:gel — ÉCHEC : ${divergences.length} divergence(s) sur ${attendus.length} fichiers de référence.\n`);
  for (const d of divergences) {
    console.error(`  ${d.fichier} — ${d.motif}`);
    if (d.attendue) {
      console.error(`    attendue : ${d.attendue}  (${d.octetsAttendus} o)`);
      console.error(`    obtenue  : ${d.obtenue}  (${d.octetsObtenus} o)`);
    }
  }
  console.error(`
Une divergence signale un regel non arbitré. La référence n'évolue que par
arbitrage humain tracé, jamais par une session d'exécution. Si le changement
est légitime, il passe par un nouveau gel daté ; sinon, il se révoque.
`);
  process.exit(1);
}

console.log(`verif:gel — conforme : ${attendus.length} fichiers de référence, empreintes intactes.`);
process.exit(0);
