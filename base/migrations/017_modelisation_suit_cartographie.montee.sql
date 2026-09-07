-- ═════════════════════════════════════════════════════════════════════════
-- LA REPRISE — rien ne doit disparaître
-- ═════════════════════════════════════════════════════════════════════════
--
-- AVANT CE LOT, LA MODÉLISATION SUIVAIT LA CARTOGRAPHIE : tout domaine qui avait
-- ouvert son graphe voyait les DEUX façons de le lire. Le module devenu réel, un
-- domaine qui ne porte pas la nouvelle ligne perdrait une entrée dont il se sert.
-- La reprise la lui pose.
--
-- ELLE EST FAITE PAR MIGRATION, ET NON PAR UN CODE DE DÉMARRAGE : une reprise qui
-- s'exécuterait à chaque lancement s'exécuterait aussi après une désactivation
-- volontaire, et ressusciterait un module que quelqu'un vient d'éteindre.
--
-- ELLE NE PEUT PAS TENIR DANS 016 : elle EMPLOIE la valeur que 016 ajoute, et une
-- valeur d'énuméré neuve ne s'emploie pas dans la transaction qui la crée.
INSERT INTO modules_de_domaine (domaine_id, module)
SELECT domaine_id, 'modelisation'::module_de_domaine
  FROM modules_de_domaine
 WHERE module = 'cartographie'
ON CONFLICT DO NOTHING;
