-- Annulation de 017 — la reprise se défait, le module reste offert.
--
-- Elle retire TOUTES les lignes `modelisation`, y compris celles qu'un
-- utilisateur a cochées lui-même depuis la console : la table ne distingue pas
-- l'activation reprise de l'activation choisie, et laisser les secondes ferait
-- d'une descente une opération dont le résultat dépend de l'histoire.
DELETE FROM modules_de_domaine WHERE module = 'modelisation';
