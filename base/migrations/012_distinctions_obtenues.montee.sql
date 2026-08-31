-- ═══════════════════════════════════════════════════════════════════════════
-- 012 — L'INSTANT OÙ UNE DISTINCTION A ÉTÉ OBTENUE.
--
-- `RG-M16-03` (CDC:1326) veut des distinctions « individuelles et privées ».
-- L'onglet « Distinctions » de `/mon-profil` (V-25) était VIDE POUR TOUJOURS :
-- le chargeur ne passait aucune distinction, et la vue taisait le bloc entier.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- AUCUN BARÈME N'EST STOCKÉ, ET C'EST LA DÉCISION
--
-- Les six paliers — leur nom, leur critère, leur seuil — sont une définition du
-- PRODUIT, au même titre que les seuils de fraîcheur : ils vivent dans
-- `src/lib/donnees/distinctions.ts`, en un seul endroit. Une table de barème
-- ferait une seconde définition, et deux définitions divergent.
--
-- LES MESURES NE SONT PAS STOCKÉES NON PLUS : elles se DÉRIVENT des
-- contributions que la base porte déjà — `notes.auteur_id` et `versions` pour
-- les notes écrites, `verifications.compte_id` pour les vérifications,
-- `relations` pour les liens déclarés. Une distinction recalculée est une
-- distinction qui ne ment jamais.
--
-- CE QUE LE CALCUL NE PEUT PAS RETROUVER, ET LUI SEUL : L'INSTANT. Une mesure
-- dit qu'un seuil EST franchi, jamais QUAND il l'a été. Sans cette table, la
-- distinction se réattribuerait à chaque affichage et l'écran ne saurait pas
-- dire « obtenue le … ». C'est tout ce que cette table porte.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- PRIVÉES, ET LA CLÉ PRIMAIRE LE DIT
--
-- `(compte_id, cle)` : une distinction est obtenue UNE FOIS par compte, et la
-- ligne appartient à ce compte. Aucune lecture du produit n'interroge cette
-- table autrement que par le compte de la session — il n'y a ni classement, ni
-- liste, ni palmarès, et `RG-M16-03` l'interdit.
--
-- `ON DELETE CASCADE` : une distinction n'existe pas sans son titulaire. Le
-- produit ne supprime pas de compte (`RG-M14-08` — un compte désactivé reste
-- attaché à ses contributions), mais une ligne orpheline ici n'aurait aucun
-- lecteur possible, l'écran ne servant que le compte connecté.
--
-- `cle` EST DU TEXTE, PAS UNE CLÉ ÉTRANGÈRE : il n'y a pas de table de barème à
-- référencer. Une clé retirée du catalogue laisse une ligne que plus rien ne
-- lit, ce qui est exactement le comportement voulu — la mémoire de l'obtention
-- survit à un remaniement du barème, et reparaît si la clé revient.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE distinctions_obtenues (
	compte_id  uuid NOT NULL REFERENCES comptes (id) ON DELETE CASCADE,
	cle        text NOT NULL,
	obtenue_le timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (compte_id, cle)
);
