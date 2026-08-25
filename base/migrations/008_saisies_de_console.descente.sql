-- La descente retire les cinq colonnes que la montée a posées, et ELLES SEULES.
-- Les valeurs qu'elles portaient disparaissent avec elles : c'est le prix d'une
-- descente, et rien d'autre du schéma n'est touché.
ALTER TABLE comptes
	DROP COLUMN mot_de_passe_a_changer;

ALTER TABLE champs_de_type_de_fiche
	DROP COLUMN obligatoire,
	DROP COLUMN defaut,
	DROP COLUMN aide;

ALTER TABLE types_de_fiche
	DROP COLUMN glyphe,
	DROP COLUMN description;
