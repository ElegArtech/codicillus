-- Annulation de 015 — l'ordre est l'inverse exact de la montée.
--
-- CE QUI EST PERDU : rien de la donnée. La colonne était dérivée du corps et de
-- lui seul ; la retirer ne retire aucune vérité que `notes` ne porte pas déjà,
-- et le rétrolien redevient ce qu'il n'a jamais cessé d'être, une déduction.
-- Seul son coût revient : le parcours des corps à chaque ouverture de note.

DROP INDEX notes_liens_internes;

ALTER TABLE notes
	DROP COLUMN liens_internes;
