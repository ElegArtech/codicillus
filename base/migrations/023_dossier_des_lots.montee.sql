-- Le dossier où un lot d'import a atterri. Le fil d'activité ne rattachait un lot qu'à
-- son domaine : il nommait son auteur, sa source et ses volumes à quiconque lisait une
-- note du domaine, même hors du dossier visé. Les lots antérieurs n'en portent pas.
ALTER TABLE lots_d_import
	ADD COLUMN dossier_id uuid REFERENCES dossiers (id) ON DELETE SET NULL;
