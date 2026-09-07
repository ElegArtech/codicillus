-- ═════════════════════════════════════════════════════════════════════════
-- LA MODÉLISATION DEVIENT UN MODULE, ET LES REFUS DE PROPOSITION S'ÉCRIVENT
-- ═════════════════════════════════════════════════════════════════════════
--
-- DEUX CHANGEMENTS DANS UN SEUL FICHIER, ET ILS N'ONT AUCUNE INTERACTION : ni
-- l'un ni l'autre n'EMPLOIE la valeur d'énuméré que la première ligne ajoute.
-- Les séparer ferait trois fichiers là où deux suffisent — la reprise qui, elle,
-- emploie la valeur, ne PEUT pas tenir ici : `ALTER TYPE ... ADD VALUE` et un
-- ordre qui s'en sert ne cohabitent pas dans une transaction, et le lanceur
-- enveloppe chaque fichier dans la sienne.
--
-- CE QUE LA MODÉLISATION ÉTAIT AVANT : un second rendu de la cartographie, dont
-- l'entrée s'allumait dès que `cartographie` était active. La règle vivait en dur
-- dans la vue du domaine, et la console n'offrait donc aucune case pour l'éteindre.
ALTER TYPE module_de_domaine ADD VALUE 'modelisation';

-- ═════════════════════════════════════════════════════════════════════════
-- LA MÉMOIRE DES REFUS DE PROPOSITION
-- ═════════════════════════════════════════════════════════════════════════
--
-- UNE TABLE, ET NON UNE QUATRIÈME VALEUR D'`origine_de_relation`. Marquer la
-- ligne dans `relations` casserait deux choses : `relations_unicite` rendrait
-- IMPOSSIBLE de déclarer soi-même la relation refusée — le geste sortirait en
-- « cette relation existe déjà » —, et tous les lecteurs de `relations` (les deux
-- cartographies, le panneau d'une note, les compteurs de console, l'archive,
-- l'import) devraient apprendre à ignorer la nouvelle valeur ; chacun qui
-- l'oublierait afficherait un lien que personne n'a déclaré et que quelqu'un a
-- refusé. Un refus n'est pas une relation : il ne vit pas dans leur table.
--
-- `type_de_relation_id` EN CASCADE, alors que `relations` emploie `RESTRICT` :
-- une relation est un fait qu'on ne détruit pas par ricochet ; un refus est une
-- opinion sur une hypothèse, et supprimer le type qu'elle nommait la vide de sens.
--
-- `refusee_par_id` EN `SET NULL` : `RG-NF-05` exige qu'une trace de DESTRUCTION
-- garde son auteur, et un refus ne détruit rien. Faire dépendre la suppression
-- d'un compte de ses refus serait un verrou sans contrepartie.
CREATE TABLE propositions_refusees (
	id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	source_id           uuid NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
	cible_id            uuid NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
	type_de_relation_id uuid NOT NULL REFERENCES types_de_relation (id) ON DELETE CASCADE,
	refusee_par_id      uuid REFERENCES comptes (id) ON DELETE SET NULL,
	refusee_le          timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT propositions_refusees_unicite UNIQUE (source_id, cible_id, type_de_relation_id),
	CONSTRAINT propositions_refusees_pas_reflexives CHECK (source_id <> cible_id)
);

CREATE INDEX propositions_refusees_cible_idx ON propositions_refusees (cible_id);
