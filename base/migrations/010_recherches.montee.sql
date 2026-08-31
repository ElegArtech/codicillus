-- ═══════════════════════════════════════════════════════════════════════════
-- 010 — LE JOURNAL DES RECHERCHES.
--
-- `RG-M02-03` (CDC:457) : « Toute recherche est journalisée : requête,
-- horodatage, nombre de résultats, ouverture éventuelle d'un résultat. Ce
-- journal est le signal de trou documentaire exploité en M15. »
--
-- M15.2 (CDC:1220-1227) énumère QUATRE journaux — recherches, consultations,
-- imports, vérifications. Deux existaient : `verifications` (002) et
-- `consultations` (006). Celui-ci est le troisième, et c'est le seul dont
-- `/console/analytique` tire son indicateur nord : sans lui, « taux de
-- recherche aboutie » et « trous documentaires » n'avaient rien à interroger,
-- et l'écran entier se taisait derrière « Pas encore assez d'usage pour
-- conclure ».
--
-- ═══════════════════════════════════════════════════════════════════════════
-- LES QUATRE MEMBRES DE LA RÈGLE, ET AUCUN CINQUIÈME
--
--   requête              `terme`
--   horodatage           `le`
--   nombre de résultats  `resultats`
--   ouverture éventuelle `ouverture_note_id`, NULL tant que rien n'est ouvert
--
-- L'OUVERTURE EST NULLABLE PARCE QU'ELLE EST « ÉVENTUELLE » : une recherche
-- sans suite est le fait que l'indicateur nord mesure. La ligne est écrite au
-- moment de la recherche, jamais à l'ouverture, et la note s'y attache après
-- coup.
--
-- `ON DELETE SET NULL` SUR LA NOTE, ET NON `CASCADE` : la recherche a eu lieu.
-- Supprimer la note qu'elle a fait ouvrir ne rend pas la recherche non advenue —
-- elle redevient seulement une recherche sans ouverture connue.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- POURQUOI `compte_id` EST NULLABLE — L'ANONYMISATION EST UNE ABSENCE
--
-- `RG-M15-02` (CDC:1229) : « Les journaux de l'espace public sont anonymisés :
-- aucun identifiant d'utilisateur n'y est associé. » Le patron est celui de
-- `consultations` (006), repris sans une variante : une colonne nulle dit
-- exactement cela, la ligne EXISTE, et anonymiser n'est pas omettre — ne pas
-- journaliser une recherche publique perdrait la mesure au lieu de protéger
-- quiconque.
--
-- `ON DELETE SET NULL` vers `comptes`, comme `consultations` et
-- `verifications`. Il ne peut pas fabriquer de fausse anonymisation :
-- `RG-M14-08` (CDC:1186) garde un compte désactivé attaché à ses contributions,
-- et aucun chemin de `src/` n'efface une ligne de `comptes`.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- LES DEUX INDEX
--
-- « Le journal des trente derniers jours, du plus récent au plus ancien » est
-- la lecture de l'écran d'analytique : c'est `recherches_le_idx`.
-- « La dernière recherche de ce terme » est celle de l'attribution d'une
-- ouverture : c'est `recherches_terme_idx`.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE recherches (
	id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	terme             text NOT NULL,
	-- NULL = entrée anonymisée (RG-M15-02). Voir l'en-tête.
	compte_id         uuid REFERENCES comptes (id) ON DELETE SET NULL,
	le                timestamptz NOT NULL DEFAULT now(),
	resultats         integer NOT NULL DEFAULT 0,
	-- NULL = la recherche n'a été suivie d'aucune ouverture.
	ouverture_note_id uuid REFERENCES notes (id) ON DELETE SET NULL,
	CONSTRAINT recherches_resultats_positifs CHECK (resultats >= 0)
);

CREATE INDEX recherches_le_idx ON recherches (le DESC);

CREATE INDEX recherches_terme_idx ON recherches (terme, le DESC);
