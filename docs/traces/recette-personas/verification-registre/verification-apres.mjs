import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import pg from 'pg';
import { cloner, ouvrirNavigateur, fermerInstance } from '../preparer.mjs';

const chemin = await cloner('/tmp/codicillus_recette9_mtv40vd1/configuration.json', 'verification_registre_apres', 'garnie', 5920);
let session;
let pool;
try {
 session = await ouvrirNavigateur(chemin, 'contributeur', 'verification-registre/apres');
 const { page, instance } = session;
 const env = instance.env;
 pool = new pg.Pool({ host: env.HOTE_BASE ?? env.HOTE_POSTGRES ?? '127.0.0.1', port: Number(env.PORT_BASE ?? env.PORT_DB ?? 19432), user: env.UTILISATEUR_BASE ?? env.UTILISATEUR_POSTGRES ?? 'codicillus', password: env.MDP_BASE ?? env.MDP_POSTGRES, database: instance.base });
 const dates = async () => (await pool.query("select verifie_le,verifie_le_operationnel from notes where identifiant='recette-interne'")).rows[0];
 const avant = await dates();
 const posts = [];
 page.on('request', (requete) => {
  if (requete.method() === 'POST') posts.push({ url: requete.url(), corps: requete.postData() });
 });
 await page.goto(`${instance.url}/notes/recette-interne`);
 await page.getByRole('link', { name: 'Opérationnel', exact: true }).click();
 await page.waitForURL((url) => url.searchParams.get('registre') === 'operationnel');
 await page.screenshot({ path: `${session.dossierTraces}/01-operationnel.png`, fullPage: true });
 await page.getByRole('button', { name: "Plus d'actions" }).click();
 await Promise.all([
  page.waitForResponse((reponse) => reponse.request().method() === 'POST' && reponse.url().includes('/verifier')),
  page.getByRole('button', { name: 'Marquer comme vérifiée', exact: true }).click()
 ]);
 await page.waitForLoadState('networkidle');
 const apres = await dates();
 await page.screenshot({ path: `${session.dossierTraces}/02-apres-verification.png`, fullPage: true });
 const resultat = { avant, apres, posts, url: page.url(), erreurs: session.erreurs };
 await writeFile(`${session.dossierTraces}/resultat-apres.json`, JSON.stringify(resultat, null, 2));
 assert.equal(new URLSearchParams(posts.find((post) => post.url.includes('/verifier')).corps).get('registre'), 'operationnel');
 assert.equal(apres.verifie_le.toISOString(), avant.verifie_le.toISOString());
 assert.ok(apres.verifie_le_operationnel > avant.verifie_le_operationnel);
 assert.equal(new URL(page.url()).searchParams.get('registre'), 'operationnel');
 assert.deepEqual(session.erreurs, []);
 resultat.assertions = 'POST Opérationnel, Référence inchangée, Opérationnel avancé, registre conservé et zéro erreur navigateur : vérifiés.';
 await writeFile(`${session.dossierTraces}/resultat-apres.json`, JSON.stringify(resultat, null, 2));
 console.log(resultat.assertions);
} finally {
 await pool?.end();
 await session?.fermer();
 await fermerInstance(chemin);
}
