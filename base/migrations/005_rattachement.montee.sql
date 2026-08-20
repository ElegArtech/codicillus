-- ═══════════════════════════════════════════════════════════════════════════
-- 005 — LE RATTACHEMENT D'UN COMPTE, SA DERNIÈRE CONNEXION, ET LE RANG D'UNE
--       ÉTIQUETTE : trois données que le jeu de semence porte et que le socle
--       n'accueillait pas.
--
-- Source : `pnpm verif:donnees` — treize formes, zéro divergence, SIX lacunes.
-- Une lacune y est définie ainsi : « la base NE PORTE PAS la donnée ». Cette
-- migration en referme TROIS ; les trois autres ne se referment pas par une
-- colonne, et le rapport de lot le dit, chiffres en main :
--
--   `Compte.id` — `c-karim` n'a aucune place. `comptes.identifiant` porte déjà
--   l'identifiant de connexion (`karim.belhadj`, CDC:1178) ; un SECOND
--   identifiant qu'aucune règle ne demande serait une colonne de commodité de
--   semence, et le rapport d'équivalence l'écarte de sa référence de toute façon.
--
--   `Note.pj` — le jeu ne porte que des DÉCOMPTES. Deux pièces sur treize
--   existent, au balisage de V-14 (:1831-1841, « Plan de reprise — volet
--   bases », PDF, 1,2 Mo) ; les onze autres n'existent nulle part. Or `nom`,
--   `taille_octets` et `type_media` sont NOT NULL : les écrire demanderait
--   trente-trois valeurs fabriquées, ce que P-02 proscrit.
--
--   `Template.utilisations` — V-31:1655 annonce « les 72 notes déjà créées à
--   partir de ces templates » (34+12+7+19) et V-31:3348 les rend note par note.
--   Le corpus compte 32 notes. AUCUNE colonne de provenance sur `notes` ne peut
--   porter 72 provenances sur 32 lignes : c'est un défaut que le gel porte
--   lui-même, donc un point de dossier de regel, pas un manque de schéma.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- POURQUOI LE RATTACHEMENT EST NULLABLE, ET CE N'EST PAS UNE PRÉCAUTION
--
-- RG-M14-04 (CDC:1149) l'exige en propres termes : « Les comptes rattachés au
-- domaine supprimé sont CONSERVÉS ; leur rattachement devient VIDE. » La règle
-- décrit exactement `ON DELETE SET NULL` sur une colonne nullable — ni un
-- `RESTRICT`, qui interdirait la suppression du domaine que RG-M14-04 autorise,
-- ni un `CASCADE`, qui emporterait le compte que la règle veut conserver. La
-- colonne est donc nullable PAR EXIGENCE, et non faute de mieux.
--
-- Le brief la nomme « domaine principal » (BRIEF-VUES.md:1487 pour le
-- formulaire de V-32, :1322 pour l'identité de V-25) ; la CDC dit
-- « rattachement » (:183, :1177, :1179). Le vocabulaire contractuel de
-- `CLAUDE.md` §3 n'a pas de terme pour ce lien : la colonne s'appelle donc
-- `domaine_id` — le domaine, par sa clé, et pas un synonyme de plus.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- LA DERNIÈRE CONNEXION EST UN INSTANT ; « aujourd'hui à 08:41 » EST UN RENDU
--
-- CDC:1177 range « date de dernière connexion » parmi les colonnes de la liste
-- des comptes. Le jeu, lui, ne porte que le LIBELLÉ RELATIF, et les deux vues
-- qui l'affichent l'écrivent tel quel, sans le calculer : V-32:3043
-- (`dc.textContent = c.derniere`) et V-25:2712. Le gel ne fournit donc AUCUNE
-- règle de passage d'un instant vers ce libellé — ni le seuil où « N jours »
-- devient « N mois », ni l'heure que porterait un « il y a 3 jours ».
--
-- Cette migration pose la DONNÉE, un instant, et rien de plus. La fabrique du
-- libellé n'est pas écrite : l'inventer serait un comblement (CLAUDE.md §2), et
-- elle appartient au lot qui câblera V-25 et V-32, avec son arbitrage. Le sens
-- inverse — le libellé du jeu vers l'instant — est lui DÉDUCTIBLE, et c'est
-- `instantDeDerniereConnexion()` de `src/lib/base/semence.ts` qui le porte.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- LE RANG D'UNE ÉTIQUETTE, ET POURQUOI IL NE SUFFIT PAS DE L'AJOUTER
--
-- `etiquettes_de_note` était une pure table de liaison : l'ordre du jeu — qui
-- n'est pas l'ordre alphabétique sur 25 notes de 32 — n'y était pas
-- représentable. `src/lib/donnees/lecture.ts` le dit et refuse de rendre
-- l'ordre PHYSIQUE des lignes, que PostgreSQL ne garantit pas et qu'un
-- `VACUUM FULL` suffirait à défaire.
--
-- La colonne arrive sur une table qui porte déjà des lignes, et l'unicité du
-- couple (note, rang) ne peut pas être posée avant que ces lignes n'aient un
-- rang distinct. D'où les trois temps ci-dessous : la colonne avec un défaut,
-- le remplissage, puis les contraintes. Le rang de remplissage est ARBITRAIRE
-- mais déterministe — ces lignes n'en portaient aucun, et `semer()` les réécrit
-- toutes.
--
-- Le défaut `0` n'est pas une commodité : avec l'unicité du couple, il rend
-- IMPOSSIBLE d'insérer deux étiquettes sur une même note sans dire leur rang.
-- Le silence est refusé par la base, pas par une intention — c'est la règle que
-- le socle (002) énonce pour lui-même.
-- ═══════════════════════════════════════════════════════════════════════════

/* ── Le rattachement d'un compte à son domaine principal ────────────────── */

ALTER TABLE comptes
	ADD COLUMN domaine_id uuid,
	ADD CONSTRAINT comptes_domaine_fk
		FOREIGN KEY (domaine_id) REFERENCES domaines (id) ON DELETE SET NULL;

-- V-32 filtre la liste des comptes par domaine (`:1316`, colonne « Domaine ») :
-- c'est une lecture PAR domaine, donc un index sur le rattachement.
CREATE INDEX comptes_domaine_idx ON comptes (domaine_id);

/* ── La dernière connexion ─────────────────────────────────────────────── */

-- Nullable : un compte qui ne s'est jamais connecté n'a pas de dernière
-- connexion, et `now()` ou l'époque en tiendraient lieu à tort. C'est le choix
-- de `condensat_mot_de_passe` en 003, mot pour mot — l'absence se dit par NULL.
ALTER TABLE comptes
	ADD COLUMN derniere_connexion_le timestamptz;

/* ── Le rang d'une étiquette sur sa note ───────────────────────────────── */

ALTER TABLE etiquettes_de_note
	ADD COLUMN ordre integer NOT NULL DEFAULT 0;

UPDATE etiquettes_de_note cible
   SET ordre = rang.n
  FROM (
    SELECT note_id,
           etiquette_id,
           row_number() OVER (PARTITION BY note_id ORDER BY etiquette_id) - 1 AS n
      FROM etiquettes_de_note
  ) rang
 WHERE cible.note_id = rang.note_id
   AND cible.etiquette_id = rang.etiquette_id;

ALTER TABLE etiquettes_de_note
	ADD CONSTRAINT etiquettes_de_note_ordre_positif CHECK (ordre >= 0),
	ADD CONSTRAINT etiquettes_de_note_ordre_unique UNIQUE (note_id, ordre);
