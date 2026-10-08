-- Les tentatives de connexion portent le compte visé, quand l'identifiant en désigne un.
-- Deux usages : un succès n'efface plus que les échecs de SON compte — un compte valide
-- ne remet plus à zéro le compteur d'une origine qui en attaque un autre —, et chaque
-- compte a son propre ralentissement, quelle que soit l'origine des tentatives.
-- L'identifiant saisi n'est toujours pas stocké : une saisie décalée d'un champ y
-- écrirait un mot de passe.
ALTER TABLE tentatives_de_connexion
	ADD COLUMN compte_id uuid REFERENCES comptes (id) ON DELETE CASCADE;

CREATE INDEX tentatives_de_connexion_compte_idx
	ON tentatives_de_connexion (compte_id, le DESC)
	WHERE compte_id IS NOT NULL;
