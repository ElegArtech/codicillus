-- Annulation de 014 — l'ordre est l'inverse exact de la montée.
--
-- CE QUI EST PERDU : les durées de validité propres à chaque note, les
-- vérifications de l'Opérationnel, et le registre visé par les demandes de
-- révision courantes. Les demandes elles-mêmes SURVIVENT — elles redeviennent
-- ce qu'elles étaient, des demandes portées par la note entière —, et la
-- contrainte remontée est mot pour mot celle de `002_socle`.
--
-- Les vérifications de l'Opérationnel restent dans `verifications` sans plus
-- rien qui les distingue de celles de la Référence : la colonne tombe, les
-- lignes non. C'est le prix d'une descente, et il est annoncé plutôt que
-- masqué par une purge que personne n'a demandée.

ALTER TABLE verifications
	DROP COLUMN registre;

ALTER TABLE notes
	DROP CONSTRAINT notes_operationnel_verification_coherente,
	DROP CONSTRAINT notes_validite_operationnel_positive,
	DROP CONSTRAINT notes_validite_reference_positive,
	DROP CONSTRAINT notes_revision_coherente;

ALTER TABLE notes
	ADD CONSTRAINT notes_revision_coherente CHECK (
		(NOT revision_demandee
			AND revision_commentaire IS NULL
			AND revision_par_id IS NULL
			AND revision_le IS NULL)
		OR (revision_demandee AND revision_par_id IS NOT NULL AND revision_le IS NOT NULL)
	);

ALTER TABLE notes
	DROP COLUMN revision_registre,
	DROP COLUMN validite_operationnel,
	DROP COLUMN validite_reference,
	DROP COLUMN verifie_le_operationnel;

-- Le type ne tombe qu'après ses deux dernières colonnes : `DROP TYPE` refuse
-- tant qu'une colonne le porte, et c'est bien ainsi qu'on veut l'apprendre.
DROP TYPE registre_de_note;
