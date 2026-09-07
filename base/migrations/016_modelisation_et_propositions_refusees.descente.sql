-- Annulation de 016 — l'ordre est l'inverse exact de la montée.
--
-- RETIRER UNE VALEUR D'ÉNUMÉRÉ DEMANDE DE RECRÉER LE TYPE : PostgreSQL sait en
-- ajouter une, jamais en ôter. Le type est donc reconstruit dans son ordre
-- d'origine — c'est cet ordre que le relevé structurel lit (`enumsortorder`), et
-- la remontée doit lui redonner la même empreinte.
--
-- LES LIGNES QUI PORTENT LA VALEUR PARTENT D'ABORD : le retypage de la colonne
-- échouerait sur la première d'entre elles. Ce que la descente perd est donc
-- l'activation du module Modélisation sur les domaines qui l'avaient — et c'est
-- exactement ce que 017 sait reposer.
DROP TABLE propositions_refusees;

DELETE FROM modules_de_domaine WHERE module = 'modelisation';
ALTER TYPE module_de_domaine RENAME TO module_de_domaine_ancien;
CREATE TYPE module_de_domaine AS ENUM (
	'notes', 'dossiers', 'fiches', 'cartographie', 'signets', 'carte_mentale'
);
ALTER TABLE modules_de_domaine
	ALTER COLUMN module TYPE module_de_domaine USING module::text::module_de_domaine;
DROP TYPE module_de_domaine_ancien;
