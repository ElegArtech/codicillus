-- ═══════════════════════════════════════════════════════════════════════════
-- 009 — LE JOURNAL DES IMPORTS.
--
-- `RG-M12-09` (CDC:1093) : « Chaque lot d'import produit une entrée de journal :
-- source, volume, erreurs, auteur, date. CE JOURNAL ALIMENTE LE FLUX D'ACTIVITÉ
-- DE L'ACCUEIL ET L'ÉCRAN D'ADMINISTRATION. »
--
-- L'ENTRÉE ÉTAIT DÉJÀ CONSTRUITE, PUIS JETÉE : `src/lib/donnees/import.ts` la
-- compose sur le rapport du lot — source, volume, erreurs, auteur, date, ses
-- cinq membres mesurés sur ce qui a réellement eu lieu — et la route d'import
-- l'écrivait au journal d'application, où personne ne la relit. Aucune des
-- vingt-deux tables ne la recevait : `/console/imports` servait un tableau vide
-- sous la phrase « les rapports restent consultables indéfiniment », et le flux
-- d'activité de l'accueil n'avait rien à lire. C'est cette migration.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- AUCUNE PURGE DANS LE TEMPS
--
-- Le brief de V-35 dit « les rapports restent consultables INDÉFINIMENT ». Il
-- n'y a donc ni colonne d'expiration, ni index partiel sur une fenêtre, ni
-- travail de nettoyage : un lot entré au journal y reste. La seule disparition
-- possible est celle du lot lui-même, et elle n'est offerte nulle part.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- LES DEUX RATTACHEMENTS, ET POURQUOI ILS DIFFÈRENT
--
-- `auteur_id` est en `ON DELETE RESTRICT`, comme `notes.auteur_id` : `RG-M14-08`
-- (CDC:1186) ferme le cas — « un compte désactivé perd immédiatement l'accès
-- mais RESTE ATTACHÉ À SES CONTRIBUTIONS PASSÉES ». Le produit désactive, il ne
-- supprime pas de compte, et aucun chemin de `src/` n'efface une ligne de
-- `comptes`. Un lot sans auteur n'est pas une entrée de journal.
--
-- `domaine_id` est en `ON DELETE SET NULL`, et c'est le seul endroit où cette
-- migration s'écarte de la symétrie : `supprimerUnDomaine()` efface les notes
-- PUIS le domaine, en une transaction qui n'attrape rien. Un `RESTRICT` y aurait
-- fait remonter une violation de clé étrangère jusqu'à l'écran, et un `CASCADE`
-- aurait purgé le journal — les deux sont exclus. Le NOM du domaine est donc
-- copié dans la colonne `domaine` : un journal qui oublierait où un lot a
-- atterri ne serait plus un journal. La colonne dit ce que le lot a fait au
-- moment où il l'a fait ; la clé dit si la cible existe encore.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- CE QUE LE VOLUME COMPTE
--
-- Les six compteurs sont ceux de `RapportDImport`, à l'identique et sans
-- agrégat : `total` est le nombre de fichiers reçus, les cinq autres le sort
-- qu'ils ont eu. Ils sont recopiés du rapport, jamais recalculés en base — le
-- rapport est la seule mesure de ce qui a eu lieu (`RG-M12-02`).
--
-- `duree_ms` n'est pas dans l'énumération de `RG-M12-09` : elle est dans
-- L'ÉCRAN, `V-35:2736` porte une durée par ligne de journal. Elle est MESURÉE
-- entre le début et la fin du traitement, jamais estimée.
--
-- `simulation` distingue le lot annulé du lot écrit (`RG-M12-02`) : les deux
-- produisent une entrée, et une entrée qui ne le dirait pas ferait passer une
-- simulation pour un import.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE lots_d_import (
	id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	-- D'où vient le lot : le dossier de premier niveau commun, ou le repli.
	source             text NOT NULL,
	-- La cible, si elle existe encore. Voir l'en-tête.
	domaine_id         uuid REFERENCES domaines (id) ON DELETE SET NULL,
	-- Le NOM de la cible au moment du lot, qu'aucune suppression n'efface.
	domaine            text NOT NULL,
	auteur_id          uuid NOT NULL REFERENCES comptes (id) ON DELETE RESTRICT,
	le                 timestamptz NOT NULL DEFAULT now(),
	-- L'identifiant du scénario — `UC-M12-01`, `02` ou `03`.
	scenario           text NOT NULL,
	simulation         boolean NOT NULL DEFAULT false,
	duree_ms           integer NOT NULL DEFAULT 0,
	total              integer NOT NULL DEFAULT 0,
	notes_creees       integer NOT NULL DEFAULT 0,
	notes_mises_a_jour integer NOT NULL DEFAULT 0,
	ignores            integer NOT NULL DEFAULT 0,
	echecs             integer NOT NULL DEFAULT 0,
	dossiers_crees     integer NOT NULL DEFAULT 0,
	CONSTRAINT lots_d_import_volume_positif CHECK (
		duree_ms >= 0 AND total >= 0 AND notes_creees >= 0 AND notes_mises_a_jour >= 0
		AND ignores >= 0 AND echecs >= 0 AND dossiers_crees >= 0
	)
);

-- La lecture attendue est « le journal de l'instance, du plus récent au plus
-- ancien » : c'est l'index de `verifications`, à la table près.
CREATE INDEX lots_d_import_le_idx ON lots_d_import (le DESC);
CREATE INDEX lots_d_import_domaine_idx ON lots_d_import (domaine_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- LE DÉTAIL D'UN LOT — une ligne par fichier reçu.
--
-- `RG-M12-09` demande « les erreurs » ; `RG-M12-04` veut que chacune soit
-- consignée avec son motif, et le rapport de lot de V-35 les nomme une par une.
-- Ce n'est donc pas le seul décompte qui est gardé, c'est la ligne : sans elle,
-- « rapport détaillé de chaque lot » (BRIEF V-35) n'aurait rien à détailler.
--
-- LES TROIS COLONNES QUI NE SONT NI LE SORT NI LE MOTIF sont celles que le
-- rapport porte déjà et que rien d'autre ne retiendrait : `aplatie`
-- (`RG-M12-10`), `avertissements` (`M12.1` et `RG-M12-04`) et
-- `images_non_reprises` (`RG-M12-07`). Les taire six mois plus tard ferait
-- croire qu'un lot est entré sans écart.
--
-- `rang` est l'ORDRE DE RÉCEPTION. PostgreSQL ne garantit aucun ordre physique,
-- et deux lignes peuvent porter le même chemin — un doublon dans le lot est
-- précisément une ligne de plus sur le même chemin : trier sur le chemin les
-- confondrait.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TYPE sort_de_fichier AS ENUM ('note', 'ignore', 'echec');

CREATE TABLE lignes_de_lot (
	id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	lot_id              uuid NOT NULL REFERENCES lots_d_import (id) ON DELETE CASCADE,
	rang                integer NOT NULL,
	chemin              text NOT NULL,
	sort                sort_de_fichier NOT NULL,
	-- Le code du motif, pour un fichier écarté ou en échec. NULL pour une note.
	motif               text,
	-- L'identifiant lisible de la note écrite. NULL quand rien ne l'a été.
	identifiant         text,
	aplatie             boolean NOT NULL DEFAULT false,
	avertissements      text[] NOT NULL DEFAULT '{}',
	images_non_reprises integer NOT NULL DEFAULT 0,
	CONSTRAINT lignes_de_lot_rang_positif CHECK (rang >= 0),
	CONSTRAINT lignes_de_lot_images_positives CHECK (images_non_reprises >= 0),
	CONSTRAINT lignes_de_lot_rang_unique UNIQUE (lot_id, rang)
);

-- La lecture attendue est « le rapport d'un lot, dans l'ordre de réception ».
CREATE INDEX lignes_de_lot_lot_idx ON lignes_de_lot (lot_id, rang);
