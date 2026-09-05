-- ═════════════════════════════════════════════════════════════════════════
-- UN CYCLE DE VIVACITÉ PAR REGISTRE — ce que le schéma ne savait pas dire
-- ═════════════════════════════════════════════════════════════════════════
--
-- CE QUI MANQUAIT. La note portait UNE date de vérification, aucune durée de
-- validité, et une demande de révision qui visait la note entière. Or une note
-- porte DEUX registres de lecture — Référence dense, Opérationnel pas-à-pas —,
-- et les deux ne vieillissent pas au même rythme : une référence d'architecture
-- tient trois mois, une procédure d'exploitation trois semaines. Avec une seule
-- date, vérifier la procédure remettait la référence au vert, et l'écran ne
-- pouvait afficher qu'un seul état pour deux contenus.
--
-- CE QUE LA MIGRATION POSE, ET RIEN DE PLUS :
--
--   `registre_de_note`             le type qui n'existait qu'en TypeScript.
--   `verifie_le_operationnel`      la vérification du SECOND registre ;
--                                  `verifie_le` reste celle de la Référence.
--   `validite_reference`           la durée de validité, en jours, par registre.
--   `validite_operationnel`        Défauts 90 et 21 — les valeurs du prototype.
--   `revision_registre`            la demande vise DÉSORMAIS un registre.
--   `verifications.registre`       l'historique dit lequel a été attesté.
--
-- AUCUNE TABLE D'ÉVÉNEMENTS. Les bascules automatiques d'état — à l'échéance,
-- puis à J+14, puis à J+90 — se DÉDUISENT du couple (vérifiée, validité) et de
-- la date du jour. Les stocker exigerait un ordonnanceur qui réveille chaque
-- note à son échéance pour écrire une ligne que le calcul rend déjà ; et une
-- ligne écrite hier resterait vraie après une vérification qui la dément.
-- `src/lib/donnees/vivacite.ts` porte la dérivation, en fonction pure.
--
-- POURQUOI LES VALIDITÉS SONT `NOT NULL` AVEC DÉFAUT, ET NON NULLABLES. Une
-- validité absente n'a pas de sens de repli : « pas de validité » voudrait dire
-- « ne périme jamais », c'est-à-dire une note dont le produit ne peut plus dire
-- si elle est digne de confiance — exactement ce que la fraîcheur existe pour
-- éviter. Le défaut est un réglage d'instance (`parametres`), la colonne est le
-- réglage de CETTE note.
--
-- LES LIGNES EXISTANTES PRENNENT `'reference'` POUR LEUR DEMANDE DE RÉVISION :
-- c'est le seul registre que le produit savait viser jusqu'ici, et c'est donc
-- la seule reprise qui ne réécrit pas l'histoire.

CREATE TYPE registre_de_note AS ENUM ('reference', 'operationnel');

ALTER TABLE notes
	ADD COLUMN verifie_le_operationnel timestamptz,
	ADD COLUMN validite_reference      integer NOT NULL DEFAULT 90,
	ADD COLUMN validite_operationnel   integer NOT NULL DEFAULT 21,
	ADD COLUMN revision_registre       registre_de_note;

-- Les demandes déjà posées visaient la Référence, faute d'avoir eu le choix.
UPDATE notes SET revision_registre = 'reference' WHERE revision_demandee;

-- `notes_revision_coherente` REPRISE, et non doublée : la contrainte n'admet
-- toujours que DEUX configurations, et le registre entre dans les deux — nul
-- quand aucune demande n'est courante, posé quand il y en a une. Un registre
-- laissé derrière une levée désignerait une demande qui n'existe plus.
ALTER TABLE notes
	DROP CONSTRAINT notes_revision_coherente;

ALTER TABLE notes
	ADD CONSTRAINT notes_revision_coherente CHECK (
		(NOT revision_demandee
			AND revision_commentaire IS NULL
			AND revision_par_id IS NULL
			AND revision_le IS NULL
			AND revision_registre IS NULL)
		OR (revision_demandee
			AND revision_par_id IS NOT NULL
			AND revision_le IS NOT NULL
			AND revision_registre IS NOT NULL)
	),
	-- Une validité nulle ou négative poserait une échéance avant sa
	-- vérification : la note naîtrait en retard de sa propre attestation.
	ADD CONSTRAINT notes_validite_reference_positive CHECK (validite_reference > 0),
	ADD CONSTRAINT notes_validite_operationnel_positive CHECK (validite_operationnel > 0),
	-- Dans l'esprit de `notes_operationnel_date_coherente` : un cycle
	-- opérationnel n'a de sens qu'avec un corps opérationnel. L'implication est
	-- à SENS UNIQUE, à la différence de la date de modification — un registre
	-- créé avant cette migration existe sans avoir jamais été attesté, et la
	-- réciproque le rendrait inécrivable.
	ADD CONSTRAINT notes_operationnel_verification_coherente
		CHECK (corps_operationnel IS NOT NULL OR verifie_le_operationnel IS NULL);

-- L'HISTORIQUE DIT DÉSORMAIS QUEL REGISTRE A ÉTÉ ATTESTÉ. Le défaut reprend
-- les lignes déjà écrites sans les relire : jusqu'ici, seule la Référence
-- pouvait être vérifiée.
ALTER TABLE verifications
	ADD COLUMN registre registre_de_note NOT NULL DEFAULT 'reference';
