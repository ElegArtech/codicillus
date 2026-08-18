#!/usr/bin/env node
// Jalon de vérification — lot T-002.
//
// Une batterie du catalogue (PLAN-DE-REALISATION.md §5) qui n'est pas encore
// outillée doit échouer bruyamment. Un script vide qui sortirait en 0 ferait
// passer la batterie au vert sans rien prouver : c'est exactement le mode de
// défaillance RA-01 du plan de réalisation (§12).
//
// Usage : node verif/jalon.mjs "<sujet>" "<lot>"

const [sujet, lot] = process.argv.slice(2);

if (!sujet || !lot) {
	console.error('jalon.mjs : deux arguments attendus — le sujet et le lot.');
	process.exit(2);
}

console.error(`${sujet} non encore outillée — lot ${lot}`);
process.exit(1);
