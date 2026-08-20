/**
 * Batterie 14 — unitaires de l'instrument lui-même.
 *
 * Ce fichier est un INSTRUMENT DE MESURE. Il relève du périmètre d'écriture
 * humain / orchestrateur, jamais d'un agent d'exécution : le contournement le
 * plus économique d'une vérification est de modifier la vérification.
 * Cf. règles/workflow_agentic.md §4.10 et §6, PLAN-DE-REALISATION.md §3.5.
 *
 * ═════════════════════════════════════════════════════════════════════════
 * POURQUOI CES CAS SONT SYNTHÉTIQUES, ET POURQUOI C'EST LE POINT
 *
 * `P-26`, mot pour mot : « un contrôle dont le seul cas d'épreuve est le défaut
 * qu'il trouve devient inerte en réussissant ». La propriété d'`ADR-009` est
 * TENUE dans `compose.yaml` au 20 août 2026 : la batterie, jouée sur le dépôt,
 * n'exerce donc jamais le côté ROUGE de son propre contrôle de structure. Le
 * jour où quelqu'un ajouterait un `depends_on` fautif, rien ne garantirait que
 * l'instrument sait le voir — sauf ces cas, qui l'exercent à chaque
 * `pnpm test:unit`, sur des compositions écrites ici et nulle part ailleurs.
 *
 * C'est aussi ce que `P-5` demande : « toute règle nouvelle doit être éprouvée
 * sur un cas qui la sollicite, sinon elle n'est pas posée, elle est espérée ».
 * Chaque contrôle est donc joué dans LES DEUX POLARITÉS — une composition
 * conforme, et une composition fautive par ce seul point.
 */
import { describe, it, expect } from 'vitest';
import {
	MARQUES_DU_SENS,
	analyserLaComposition,
	defautsDeComposition,
	pannesDeLaReponse,
	signalementDansLeDocument,
	verdictDuLot
	// @ts-expect-error — instrument en JavaScript pur, sans déclarations de types.
} from './degradation-attendu.mjs';

/* ═══════════════════════════════════════════ 1. La composition ═════════ */

/** Une composition CONFORME, réduite à ce que la batterie 14 examine. */
const CONFORME = `name: essai

services:
  # ── app ──
  # Le service applicatif.
  app:
    build:
      context: .
    depends_on:
      db:
        condition: service_healthy
      recherche:
        condition: service_healthy
    environment:
      URL_CONVERSION: http://conversion:8000
      URL_EMBEDDINGS: http://embeddings:11434
    healthcheck:
      test: ['CMD', 'node', '-e', "fetch('http://127.0.0.1:3000/')"]

  # ── db ──
  db:
    image: pgvector/pgvector:pg18
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready']

  # ── recherche ──
  recherche:
    image: getmeili/meilisearch:v1.53.1
    healthcheck:
      test: ['CMD', 'curl', '--fail', 'http://127.0.0.1:7700/health']

  # ── conversion ──
  # OPTIONNEL. Pandoc et compagnie.
  conversion:
    build:
      context: ./services/conversion
    healthcheck:
      test: ['CMD', 'python', '-c', "urlopen('http://127.0.0.1:8000/sante')"]

  # ── embeddings ──
  # OPTIONNEL. Ollama.
  embeddings:
    image: ollama/ollama:0.32.13
    healthcheck:
      test: ['CMD-SHELL', 'ollama list']
`;

describe('l’analyse de compose.yaml — un sous-ensemble, et il est éprouvé', () => {
	it('rend les cinq services, et sait lesquels sont OPTIONNELS', () => {
		const { services, refus } = analyserLaComposition(CONFORME);
		expect(refus).toEqual([]);
		expect([...services.keys()]).toEqual(['app', 'db', 'recherche', 'conversion', 'embeddings']);
		expect(services.get('conversion').optionnel).toBe(true);
		expect(services.get('embeddings').optionnel).toBe(true);
		expect(services.get('app').optionnel).toBe(false);
		expect(services.get('db').optionnel).toBe(false);
	});

	it('lit les dépendances de démarrage sous leur forme longue', () => {
		const { services } = analyserLaComposition(CONFORME);
		expect(services.get('app').dependsOn).toEqual(['db', 'recherche']);
	});

	it('lit AUSSI la forme courte — ne lire qu’une forme laisserait passer l’autre', () => {
		const courte = CONFORME.replace(
			'    depends_on:\n      db:\n        condition: service_healthy\n      recherche:\n        condition: service_healthy\n',
			'    depends_on:\n      - db\n      - conversion\n'
		);
		const { services } = analyserLaComposition(courte);
		expect(services.get('app').dependsOn).toEqual(['db', 'conversion']);
	});

	it('refuse de mesurer une composition qui emploie des tabulateurs', () => {
		const { refus } = analyserLaComposition(CONFORME.replace('  app:', '\tapp:'));
		expect(refus.join(' ')).toContain('tabulateur');
	});

	it('refuse de mesurer un fichier sans bloc « services »', () => {
		const { refus } = analyserLaComposition('name: essai\nvolumes:\n  a:\n');
		expect(refus.join(' ')).toContain('services');
	});
});

describe('la propriété d’ADR-009 — les deux polarités, à chaque contrôle', () => {
	it('une composition conforme ne lève AUCUN défaut', () => {
		const { services } = analyserLaComposition(CONFORME);
		expect(defautsDeComposition(services)).toEqual([]);
	});

	it('ROUGIT quand un optionnel entre dans le depends_on d’app — la sonde du contrat', () => {
		const fautive = CONFORME.replace(
			'      recherche:\n        condition: service_healthy\n',
			'      recherche:\n        condition: service_healthy\n      conversion:\n        condition: service_healthy\n'
		);
		const { services } = analyserLaComposition(fautive);
		const defauts = defautsDeComposition(services);
		expect(defauts).toHaveLength(1);
		expect(defauts[0].quoi).toContain('attend la brique optionnelle « conversion »');
	});

	it('ROUGIT quand le contrôle de santé d’app traverse un optionnel', () => {
		const fautive = CONFORME.replace(
			"fetch('http://127.0.0.1:3000/')",
			"fetch('http://embeddings:11434/')"
		);
		const { services } = analyserLaComposition(fautive);
		const defauts = defautsDeComposition(services);
		expect(defauts.map((d) => d.quoi)).toContain(
			'le contrôle de santé de « app » traverse « embeddings »'
		);
	});

	it('ROUGIT quand un contrôle de santé critique cite seulement le PORT d’un optionnel', () => {
		const fautive = CONFORME.replace("'pg_isready'", "'wget http://un-hote-quelconque:8000/sante'");
		const { services } = analyserLaComposition(fautive);
		expect(defautsDeComposition(services).map((d) => d.quoi)).toContain(
			'le contrôle de santé de « db » traverse « conversion »'
		);
	});

	it('ROUGIT quand app perd l’adresse d’un optionnel — une adresse, jamais une dépendance', () => {
		const fautive = CONFORME.replace('      URL_EMBEDDINGS: http://embeddings:11434\n', '');
		const { services } = analyserLaComposition(fautive);
		expect(defautsDeComposition(services).map((d) => d.quoi)).toContain(
			'« app » ne reçoit plus l’adresse de « embeddings » (URL_EMBEDDINGS)'
		);
	});

	it('ROUGIT quand un service n’est plus qualifié OPTIONNEL', () => {
		const fautive = CONFORME.replace('  # OPTIONNEL. Ollama.\n', '');
		const { services } = analyserLaComposition(fautive);
		expect(defautsDeComposition(services).map((d) => d.quoi)).toContain(
			'le service « embeddings » n’est plus qualifié OPTIONNEL dans compose.yaml'
		);
	});

	it('ROUGIT quand un service optionnel disparaît de la composition', () => {
		const { services } = analyserLaComposition(CONFORME);
		services.delete('conversion');
		expect(defautsDeComposition(services).map((d) => d.quoi)).toContain(
			'le service « conversion » a disparu de la composition'
		);
	});

	it('ne reproche RIEN à un optionnel qui dépend d’un autre optionnel', () => {
		/* La règle porte sur les services CRITIQUES : deux briques optionnelles
		   qui s'attendent l'une l'autre ne mettent rien dans le chemin critique.
		   Sans ce cas, la règle serait plus large qu'ADR-009 sans qu'on le voie. */
		const large = CONFORME.replace(
			'  conversion:\n    build:',
			'  conversion:\n    depends_on:\n      - embeddings\n    build:'
		);
		const { services } = analyserLaComposition(large);
		expect(defautsDeComposition(services)).toEqual([]);
	});
});

/* ═══════════════════════════════════════════ 2. Le verdict d’un lot ════ */

/** Un plan d'import réduit à ce que le verdict lit. */
function ligne(chemin: string, sort: string, motif: string | null, voie = 'service') {
	return { chemin, sort, motif, voie };
}

describe('le verdict d’un lot — « un échec unitaire n’interrompt jamais un lot »', () => {
	it('compte les motifs, et voit qu’un fichier est retenu APRÈS le premier échec', () => {
		const plan = {
			lignes: [
				ligne('a.docx', 'note', null),
				ligne('b.pdf', 'echec', 'fichier-protege'),
				ligne('c.pptx', 'echec', 'fichier-endommage'),
				ligne('d.docx', 'note', null),
				ligne('e.md', 'note', null, 'application')
			],
			notes: 3,
			ignores: 0,
			echecs: 2
		};
		const v = verdictDuLot(plan);
		expect(v.continueApresLErreur).toBe(true);
		expect(v.premierEchec).toBe('b.pdf');
		expect(v.derniereRetenue).toBe('e.md');
		expect(v.notesDeLApplication).toBe(1);
		expect([...v.motifs]).toEqual([
			['fichier-protege', 1],
			['fichier-endommage', 1]
		]);
	});

	it('ROUGIT sur un lot interrompu au premier échec — la sonde « lot-interrompu »', () => {
		const plan = {
			lignes: [ligne('a.docx', 'note', null), ligne('b.pdf', 'echec', 'injoignable')],
			notes: 1,
			ignores: 0,
			echecs: 1
		};
		expect(verdictDuLot(plan).continueApresLErreur).toBe(false);
	});

	it('NE SE LAISSE PAS TROMPER par un lot dont les valides sont tous en tête', () => {
		/* Le compte de notes serait le même qu'un lot complet : c'est l'ORDRE qui
		   distingue « le lot continue » de « le lot s'est arrêté à temps ». */
		const plan = {
			lignes: [
				ligne('a.docx', 'note', null),
				ligne('b.docx', 'note', null),
				ligne('c.pdf', 'echec', 'injoignable')
			],
			notes: 2,
			ignores: 0,
			echecs: 1
		};
		expect(verdictDuLot(plan).continueApresLErreur).toBe(false);
	});

	it('relève les échecs SANS motif — un échec muet n’est pas un message clair', () => {
		const plan = {
			lignes: [ligne('a.docx', 'echec', null), ligne('b.docx', 'echec', 'injoignable')],
			notes: 0,
			ignores: 0,
			echecs: 2
		};
		expect(verdictDuLot(plan).sansMotif).toEqual(['a.docx']);
	});
});

/* ═══════════════════════════════════════════ 3. Le signalement ═════════ */

describe('le signalement — ce qui ATTEINT l’écran, et rien d’autre', () => {
	it('exige les deux marques : l’attribut d’état ET la phrase du gel', () => {
		const complet = `<div class="app" data-degrade="oui"><div class="degrade"><svg></svg>
			${MARQUES_DU_SENS.phrase} — les résultats sont établis en mots-clés.</div></div>`;
		expect(signalementDansLeDocument(complet, MARQUES_DU_SENS).atteintLEcran).toBe(true);
	});

	it('REFUSE un attribut sans phrase — un état connu du serveur n’est pas un message', () => {
		const muet = '<div class="app" data-degrade="oui"><div class="degrade"></div></div>';
		const vu = signalementDansLeDocument(muet, MARQUES_DU_SENS);
		expect(vu.attribut).toBe(true);
		expect(vu.phrase).toBe(false);
		expect(vu.atteintLEcran).toBe(false);
	});

	it('REFUSE une phrase sans attribut — la sonde « sens-simule »', () => {
		const simule = `<div class="app" data-degrade="non">${MARQUES_DU_SENS.phrase}</div>`;
		expect(signalementDansLeDocument(simule, MARQUES_DU_SENS).atteintLEcran).toBe(false);
	});

	it('lit la phrase même repliée par des balises entre deux mots', () => {
		const replie =
			'<div class="app" data-degrade="oui">Recherche par sens\n<b>momentanément</b>\n indisponible</div>';
		expect(signalementDansLeDocument(replie, MARQUES_DU_SENS).atteintLEcran).toBe(true);
	});
});

/* ═══════════════════════════════════════════ 4. Panne contre dégradé ═══ */

describe('« dégradation, jamais panne » — la frontière, éprouvée des deux côtés', () => {
	it('ne voit AUCUNE panne dans une page dégradée ordinaire', () => {
		const page = {
			code: 200,
			corps:
				'<main class="rech">\n    <p>Recherche par sens momentanément indisponible</p>\n' +
				'    <p>Les résultats sont établis en mots-clés.</p>\n</main>'
		};
		expect(pannesDeLaReponse(page)).toEqual([]);
	});

	it('voit un 500 comme une panne', () => {
		expect(pannesDeLaReponse({ code: 500, corps: '<h1>Erreur</h1>' })).toContain('code 500');
	});

	it('voit une trame de pile servie, et la nomme', () => {
		const trace = {
			code: 200,
			corps: 'TypeError: fetch failed\n    at node.fetch (node:internal/deps/undici:1)\n'
		};
		expect(pannesDeLaReponse(trace).length).toBeGreaterThan(0);
	});

	it('NE SE DÉCLENCHE PAS sur un document indenté qui contient le mot « at »', () => {
		/* Le premier jet cherchait « at » précédé d'espaces, et aurait rougi ici.
		   Le cas reste, précisément pour que la correction ne se reperde pas. */
		const anglais = { code: 200, corps: '<ul>\n    <li>Look at the report</li>\n</ul>' };
		expect(pannesDeLaReponse(anglais)).toEqual([]);
	});

	it('voit une requête qui n’a pas abouti — un produit injoignable n’est pas dégradé', () => {
		expect(pannesDeLaReponse({ code: 0, corps: 'TypeError' }).join(' ')).toContain(
			'aucune réponse'
		);
	});

	it('voit un corps vide servi en 200 — l’écran vide qu’ADR-009 interdit', () => {
		expect(pannesDeLaReponse({ code: 200, corps: '   ' })).toContain('corps vide sur un 200');
	});
});
