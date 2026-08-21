-- La descente retire les cinq types que la montée a posés, et EUX SEULS.
-- Le filtre sur l'identifiant importe : une instance a pu en ajouter d'autres
-- par un chemin qui n'existe pas encore, et une descente ne détruit jamais ce
-- qu'elle n'a pas créé.
--
-- Une note référence son type en `ON DELETE RESTRICT` : si le corpus est chargé,
-- cette suppression ÉCHOUE, et c'est juste — descendre le référentiel sous des
-- notes qui s'y appuient laisserait une base incohérente.
DELETE FROM types_de_note
WHERE identifiant IN ('procedure', 'guide', 'note', 'fiche', 'signet');
