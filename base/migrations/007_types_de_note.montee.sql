-- ═════════════════════════════════════════════════════════════════════════
-- LES CINQ TYPES DE NOTE, POSÉS PAR LA MIGRATION ET NON PAR LA SEMENCE
-- ═════════════════════════════════════════════════════════════════════════
--
-- MESURÉ LE 21/08/2026, sur une base migrée mais NON SEMÉE — c'est-à-dire une
-- INSTALLATION NEUVE, l'état normal du produit au premier démarrage :
-- `types_de_note` est vide, l'éditeur propose ZÉRO type, et `lireLaSaisie()`
-- refuse toute création en « type manquant ». Un administrateur pouvait créer
-- son univers et son domaine, puis ne jamais écrire la première note.
--
-- POURQUOI ICI ET NON DANS `semence.ts`. Ces cinq valeurs ne sont pas des
-- données de démonstration : aucune console ne les gère, aucune instance ne les
-- redéfinit, et le produit les nomme dans son vocabulaire même — `CLAUDE.md` §3
-- range « Note » et « Fiche » parmi les mots qui ne souffrent aucun synonyme.
-- Elles appartiennent au SCHÉMA, au même titre qu'une énumération.
--
-- `ON CONFLICT DO NOTHING` : le semeur les pose aussi, pour les bases déjà
-- montées avant cette migration. Les deux chemins doivent pouvoir se croiser
-- sans se marcher dessus.
--
-- L'ORDRE EST CELUI DU CAHIER DES CHARGES, et il se lit : les deux formes
-- rédigées d'abord (Procédure, Guide), puis la note libre, puis les deux formes
-- structurées (Fiche, Signet).

INSERT INTO types_de_note (identifiant, nom, ordre) VALUES
	('procedure', 'Procédure', 0),
	('guide',     'Guide',     1),
	('note',      'Note',      2),
	('fiche',     'Fiche',     3),
	('signet',    'Signet',    4)
ON CONFLICT (identifiant) DO NOTHING;
