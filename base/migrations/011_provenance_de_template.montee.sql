-- ═════════════════════════════════════════════════════════════════════════
-- LA PROVENANCE D'UNE NOTE — la colonne qui rendait le compteur incalculable
-- ═════════════════════════════════════════════════════════════════════════
--
-- `/console/templates` (V-31) affiche « Utilisations » en tête de colonne, un
-- nombre par ligne, un rappel dans le tiroir d'édition et un autre dans le
-- dialogue de suppression. Aucun des quatre n'avait de source : `templates` ne
-- porte pas de compteur, et `notes` ne référençait pas `templates`. L'écran
-- rendait « — » aux quatre endroits.
--
-- CE QUE LA COLONNE EST, ET CE QU'ELLE N'EST PAS. Elle est une TRACE D'ORIGINE :
-- le template qui a amorcé la rédaction. Elle n'est pas un rattachement — le
-- contenu du squelette est COPIÉ à la création, et la note en devient aussitôt
-- indépendante. La prose de l'écran reste donc vraie mot pour mot : modifier un
-- template ne touche aucune note.
--
-- `ON DELETE SET NULL`, ET SURTOUT PAS `RESTRICT` : V-31 promet en toutes
-- lettres que supprimer un template n'empêche rien et n'affecte aucune note.
-- `RESTRICT` aurait fait mentir l'écran à la première suppression, et `CASCADE`
-- aurait emporté les notes. La trace disparaît, la note reste.
--
-- L'INDEX SERT LA JOINTURE DE COMPTAGE : `lireTemplates()` groupe les notes par
-- `template_id` pour chaque ligne de l'écran.

ALTER TABLE notes
	ADD COLUMN template_id uuid REFERENCES templates (id) ON DELETE SET NULL;

CREATE INDEX notes_template_idx ON notes (template_id);
