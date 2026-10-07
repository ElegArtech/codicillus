-- Un nom sans lettre ni chiffre (« .. », « --- », un emoji seul) n'a pas d'adresse : le
-- menu latéral tombait en erreur pour tous ceux qui voyaient le dossier.

-- Un domaine et son dossier racine portent le même nom : ils sont renommés ensemble.
WITH renommes AS (
  UPDATE domaines
  SET nom = 'Domaine sans nom (' || left(id::text, 8) || ')'
  WHERE nom !~ '[[:alnum:]]'
  RETURNING id, nom
)
UPDATE dossiers
SET nom = renommes.nom
FROM renommes
WHERE dossiers.domaine_id = renommes.id AND dossiers.parent_id IS NULL;

UPDATE dossiers
SET nom = 'Dossier sans nom (' || left(id::text, 8) || ')'
WHERE nom !~ '[[:alnum:]]';

-- Aucun chemin d'écriture ne doit pouvoir en recréer.
ALTER TABLE dossiers ADD CONSTRAINT dossiers_nom_adressable CHECK (nom ~ '[[:alnum:]]');
