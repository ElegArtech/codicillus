-- ═══════════════════════════════════════════════════════════════════════════
-- 013 — QUI A DÉTRUIT QUOI, ET QUAND.
--
-- `RG-NF-05` : « Les actions destructives sont CONFIRMÉES, TRACÉES ET
-- ATTRIBUÉES à leur auteur. » Les trois membres n'étaient pas au même point.
--
-- LA CONFIRMATION EXISTE, ET ELLE A ÉTÉ MESURÉE : la suppression d'une note
-- rappelle son titre, ses rétroliens et ses versions ; celle d'un domaine
-- énumère ce qui part et fait retaper son nom ; celle d'un univers refuse tant
-- qu'il n'est pas vide. Rien à ajouter de ce côté.
--
-- LA TRACE ATTRIBUÉE, ELLE, N'EXISTAIT NULLE PART. Mesuré : une note supprimée
-- depuis l'écran de lecture faisait passer `notes` de 25 à 24, `relations` de 21
-- à 19, `etiquettes_de_note` de 71 à 68 — et AUCUNE des vingt-sept tables ne
-- gagnait une ligne. Aucune requête ne pouvait dire qui avait détruit quoi. Les
-- suppressions de la console ne recevaient même pas l'identité de l'appelant :
-- `supprimerUnUnivers(base, identifiant)` n'avait pas de paramètre où la mettre.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- POURQUOI UNE TABLE, ET PAS UNE COLONNE AILLEURS
--
-- La suppression du produit est ATOMIQUE ET DÉFINITIVE (`RG-M14-03`) : il n'y a
-- pas de corbeille, donc aucune ligne survivante où écrire un « supprimé par ».
-- La trace ne peut vivre que dans une table à part, et elle doit s'écrire DANS
-- LA MÊME TRANSACTION que la destruction — une trace validée séparément
-- mentirait dès la première transaction annulée, dans un sens ou dans l'autre.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- CE QUE LA LIGNE PORTE, ET RIEN DE PLUS
--
--   `objet`        la NATURE de ce qui a été détruit — « note », « domaine »…
--   `reference`    son identifiant TEL QU'IL ÉTAIT, du texte et jamais une clé
--                  étrangère : la cible n'existe plus, et un `REFERENCES` vers
--                  une ligne détruite est une contradiction.
--   `designation`  son nom lisible au moment du geste — un identifiant seul ne
--                  dit rien à qui relit six mois plus tard.
--   `detail`       ce qui est parti AVEC, en clair — « 2 notes, 1 dossier ». Le
--                  produit le COMPTE DÉJÀ pour l'écran de confirmation ; c'est
--                  ce compte-là qu'on garde, pas un second calculé autrement.
--   `auteur_id`    le compte. `ON DELETE RESTRICT` et NON `SET NULL` : une
--                  trace qui perd son auteur cesse d'être une attribution,
--                  c'est-à-dire cesse de tenir la règle. Le produit ne supprime
--                  aucun compte (`RG-M14-08` : on désactive), donc la contrainte
--                  ne bloque rien aujourd'hui — elle interdit qu'on la contourne
--                  demain.
--   `le`           l'instant.
--
-- `auteur_id` EST `NOT NULL`, ET C'EST UNE GARDE. Aucune destruction du produit
-- n'est accessible sans session : une trace sans auteur signalerait un chemin
-- d'écriture ouvert à l'anonyme, et il vaut mieux que la transaction échoue
-- bruyamment que de laisser passer la destruction sans savoir qui l'a faite.
--
-- AUCUN CONTENU DÉTRUIT N'EST RECOPIÉ ICI. Ce n'est pas une corbeille et cette
-- table ne doit pas en devenir une : `RG-M14-03` veut la suppression définitive,
-- et garder le corps d'une note supprimée la rendrait récupérable.
--
-- LA LECTURE ATTENDUE EST « les dernières destructions, la plus récente
-- d'abord » : c'est l'index, et c'est le seul.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE traces_de_suppression (
	id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	objet       text NOT NULL,
	reference   text NOT NULL,
	designation text NOT NULL,
	detail      text NOT NULL DEFAULT '',
	auteur_id   uuid NOT NULL REFERENCES comptes (id) ON DELETE RESTRICT,
	le          timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT traces_objet_non_vide CHECK (objet <> ''),
	CONSTRAINT traces_reference_non_vide CHECK (reference <> '')
);

CREATE INDEX traces_de_suppression_le_idx ON traces_de_suppression (le DESC);
