-- Les anciens noms ne sont pas conservés : un retour en arrière ne les rétablit pas.
ALTER TABLE dossiers DROP CONSTRAINT IF EXISTS dossiers_nom_adressable;
