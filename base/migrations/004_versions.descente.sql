-- ═══════════════════════════════════════════════════════════════════════════
-- Annulation de 004 — l'ordre est l'inverse exact de la montée.
--
-- AUCUN `CASCADE`, comme en 002 et 003 : une dépendance oubliée doit faire
-- ÉCHOUER l'annulation, pas emporter silencieusement un objet que la montée
-- n'avait pas créé. C'est cette symétrie stricte que `pnpm base:reversibilite`
-- mesure, par comparaison d'empreintes et non par déclaration.
--
-- L'index et les quatre contraintes tombent avec la table. Le DÉCLENCHEUR
-- aussi — mais PAS la fonction qu'il appelle : une fonction n'appartient à
-- aucune table, et la laisser derrière ferait diverger l'empreinte. Elle est
-- donc retirée explicitement, et après le déclencheur qui en dépend.
-- ═══════════════════════════════════════════════════════════════════════════

DROP TRIGGER versions_immuables ON versions;

DROP TABLE versions;

DROP FUNCTION versions_refuser_reecriture();
