-- Deux pièces d'une même note ne portent pas le même nom : la pièce est adressée par son
-- nom (`/notes/{note}/pieces-jointes/{nom}`), et deux dépôts simultanés passaient tous
-- deux la vérification préalable. L'adresse servait alors l'une ou l'autre, au hasard, et
-- la suppression en retirait une au hasard.
--
-- Les doublons existants gardent la plus ancienne sous son nom ; les suivantes sont
-- suffixées de leur rang.
WITH doublons AS (
	SELECT id, row_number() OVER (PARTITION BY note_id, nom ORDER BY deposee_le, id) AS rang
	FROM pieces_jointes
)
UPDATE pieces_jointes
SET nom = pieces_jointes.nom || ' (' || doublons.rang || ')'
FROM doublons
WHERE pieces_jointes.id = doublons.id AND doublons.rang > 1;

ALTER TABLE pieces_jointes ADD CONSTRAINT pieces_jointes_nom_unique UNIQUE (note_id, nom);
