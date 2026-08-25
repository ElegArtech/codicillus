-- ═════════════════════════════════════════════════════════════════════════
-- CE QUE LA CONSOLE ACCEPTAIT ET JETAIT — les cinq colonnes qui manquaient
-- ═════════════════════════════════════════════════════════════════════════
--
-- `/console/types-de-fiches` (V-29) demande une description, une icône, et par
-- propriété une aide à la saisie, une valeur par défaut et un caractère
-- obligatoire. Aucune de ces cinq valeurs n'avait de colonne : l'écran les
-- affichait comme acquises, et l'enregistrement les perdait sans un mot.
--
-- `/console/comptes` (V-32) écrit « Il devra être changé à la première
-- connexion » sous le mot de passe engendré. Rien ne le forçait :
-- `mot_de_passe_verrouille` dit qui ne PEUT PAS changer son mot de passe,
-- jamais qui DOIT le changer. L'administrateur croyait distribuer un mot de
-- passe à usage unique.
--
-- LES QUATRE PREMIÈRES SONT NULLABLES : une valeur absente est un champ que
-- l'administrateur n'a pas rempli, ce qui n'est pas la même chose qu'une chaîne
-- vide qu'il aurait effacée.
--
-- LES DEUX BOOLÉENS PORTENT UN DÉFAUT : les lignes déjà en base n'ont ni
-- obligation, ni changement dû, et c'est exactement ce que le produit tenait
-- avant cette migration.

ALTER TABLE types_de_fiche
	ADD COLUMN description text,
	ADD COLUMN glyphe      text;

ALTER TABLE champs_de_type_de_fiche
	ADD COLUMN aide        text,
	ADD COLUMN defaut      text,
	ADD COLUMN obligatoire boolean NOT NULL DEFAULT false;

-- RG-CPT-01 garde le dernier mot : un compte à mot de passe verrouillé ne peut
-- pas changer son mot de passe lui-même, on ne le lui impose donc jamais. La
-- garde de connexion lit les deux colonnes ensemble.
ALTER TABLE comptes
	ADD COLUMN mot_de_passe_a_changer boolean NOT NULL DEFAULT false;
