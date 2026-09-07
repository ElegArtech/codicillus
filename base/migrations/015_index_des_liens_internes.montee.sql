-- ═════════════════════════════════════════════════════════════════════════
-- LES LIENS INTERNES D'UNE NOTE, DÉRIVÉS PAR LA BASE — et indexés
-- ═════════════════════════════════════════════════════════════════════════
--
-- CE QUI MANQUAIT. `RG-M05-02` veut les rétroliens « recalculés par parcours de
-- l'arbre du document », jamais saisis. Le produit tenait la règle, et il la
-- tenait au pire prix : pour afficher les rétroliens d'UNE note, il lisait les
-- deux corps des 300 notes de l'instance de recette et analysait les 600
-- documents — 47 ms de base et 165 ms d'analyse à chaque ouverture. La lecture
-- a été refaite pour ne demander que les notes qui PEUVENT porter un lien vers
-- celle qu'on ouvre ; encore faut-il que la base sache répondre sans relire les
-- corps.
--
-- CE QUE LA MIGRATION POSE, ET RIEN DE PLUS : une colonne dérivée qui porte la
-- LISTE DES CIBLES des marques `lienInterne` des deux registres, et un index
-- GIN dessus.
--
-- UNE COLONNE GÉNÉRÉE, PAS UNE DÉNORMALISATION. Elle n'est jamais écrite par le
-- produit : PostgreSQL la recalcule à chaque écriture d'un corps, par
-- l'expression même du parcours — le JSONPath ci-dessous est la traduction
-- littérale de ce que `liensInternes()` traverse en TypeScript. Le lien reste
-- déduit ; aucun chemin d'écriture n'a de nouvelle obligation, et aucun ne peut
-- oublier de la tenir à jour.
--
-- POURQUOI UNE COLONNE ET NON UN INDEX D'EXPRESSION. Les deux ont été mesurés.
-- L'index d'expression est correct et le planificateur le refuse : le corps est
-- stocké HORS LIGNE (TOAST), un parcours séquentiel de `notes` lui semble donc
-- coûter 28 unités quand il en coûte 45 ms de décompression. Selon la note
-- visée, il choisissait l'index — 0,25 ms — ou le parcours — 44 ms. La colonne
-- ferme la question : elle tient EN LIGNE, et le parcours qui la lit est
-- rapide même quand le planificateur le préfère à l'index.

ALTER TABLE notes
	ADD COLUMN liens_internes jsonb
		GENERATED ALWAYS AS (
			jsonb_path_query_array(
				corps_reference,
				'$.**.marks[*] ? (@.type == "lienInterne").attrs.cible'
			)
			|| coalesce(
				jsonb_path_query_array(
					corps_operationnel,
					'$.**.marks[*] ? (@.type == "lienInterne").attrs.cible'
				),
				'[]'::jsonb
			)
		) STORED;

CREATE INDEX notes_liens_internes ON notes USING gin (liens_internes jsonb_path_ops);
