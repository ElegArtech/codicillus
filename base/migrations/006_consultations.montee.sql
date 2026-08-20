-- ═══════════════════════════════════════════════════════════════════════════
-- 006 — LE JOURNAL DES CONSULTATIONS.
--
-- `RG-M04-09` (CDC:629) : « Toute ouverture d'une note incrémente son compteur
-- de consultations ET PRODUIT UNE ENTRÉE DE JOURNAL (identité de l'utilisateur,
-- horodatage, durée approximative). En anonyme, l'entrée est anonymisée. »
--
-- Le compteur existait déjà — `notes.compteur_de_consultations`, posée par
-- `002_socle.montee.sql` et semée depuis `seeds/corpus.ts`. LE JOURNAL, NON :
-- au 21 août 2026, aucune des vingt et une tables ne portait d'entrée de
-- consultation, et rien n'incrémentait le compteur. C'est cette migration.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- LE CONTENU DE L'ENTRÉE EST DONNÉ PAR LA SOURCE, PAS CHOISI ICI
--
-- CDC:1225 range le journal des consultations dans le tableau de M15.2 et en
-- énumère le contenu : « Note, horodatage, durée approximative, utilisateur
-- (anonymisé en public) ». Trois des quatre membres sont ci-dessous.
--
-- LE QUATRIÈME — LA DURÉE APPROXIMATIVE — N'EST PAS ÉCRIT, ET C'EST DÉLIBÉRÉ.
-- Aucune source du dépôt ne dit comment on l'obtient, ni ce qu'« approximative »
-- borne : ni le cahier (une seule occurrence du mot, celle de RG-M04-09,
-- reprise au tableau de M15.2), ni le brief, ni aucune des 41 maquettes gelées
-- — une durée de consultation ne se connaît qu'à la SORTIE de la page, donc par
-- un mécanisme de fin de visite qu'aucune maquette ne montre et qu'ARB-011
-- range parmi les comportements. Poser ici une colonne, ce serait décider son
-- unité, sa borne d'approximation et son mécanisme de mesure : trois décisions
-- fonctionnelles prises en exécution, donc un défaut de contrat de tâche
-- (CLAUDE.md §2, règle de non-comblement). Le vide est DÉCLARÉ au rapport de
-- `T-078`, il n'est pas comblé. La colonne s'ajoutera par une migration `007`
-- le jour où l'arbitrage dira ce qu'elle porte.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- POURQUOI `compte_id` EST NULLABLE — L'ANONYMISATION EST UNE ABSENCE
--
-- `RG-M15-02` (CDC:1227) donne la définition et ne laisse rien à interpréter :
-- « Les journaux de l'espace public sont anonymisés : AUCUN IDENTIFIANT
-- D'UTILISATEUR N'Y EST ASSOCIÉ. » Une colonne nulle dit exactement cela, et
-- rien d'autre.
--
-- ET L'ANONYMISATION N'EST PAS UNE OMISSION : la ligne EXISTE. Ne pas
-- journaliser une lecture anonyme ne serait pas anonymiser, ce serait perdre la
-- mesure — et le compteur de la note, lui, monte dans les deux cas, parce que
-- RG-M04-09 dit « toute ouverture ».
--
-- `ON DELETE SET NULL` est repris de `verifications` (002), à l'identique.
-- Il ne peut pas fabriquer de fausse anonymisation : `RG-M14-08` (CDC:1186)
-- ferme le cas — « un compte désactivé perd immédiatement l'accès mais RESTE
-- ATTACHÉ À SES CONTRIBUTIONS PASSÉES ». Le produit désactive, il ne supprime
-- pas de compte, et aucun chemin de `src/` n'efface une ligne de `comptes`.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- POURQUOI UNE TABLE, ET POURQUOI CELLE-CI RESSEMBLE À `verifications`
--
-- M15.2 énumère QUATRE journaux — recherches, consultations, imports,
-- vérifications. Le dernier existe déjà en table propre (`verifications`,
-- M06.2), avec la même forme : la note, le compte, l'instant. Reprendre cette
-- forme n'est pas une commodité, c'est refuser d'inventer une seconde manière
-- de dire la même chose.
--
-- `ON DELETE CASCADE` sur la note, comme `verifications` et `versions` : le
-- journal de consultation d'une note supprimée n'a plus d'objet, et M14.3
-- (CDC:1147) veut la suppression « atomique et définitive », sans corbeille —
-- une ligne de journal survivante en serait une. Le numéro de cette règle n'est
-- pas cité : cette migration ne la TIENT pas, elle s'y conforme, et le nommer
-- ferait descendre le compte de `pnpm verif:couverture` sans que le produit ait
-- changé.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE consultations (
	id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	note_id    uuid NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
	-- NULL = entrée anonymisée (RG-M15-02). Voir l'en-tête.
	compte_id  uuid REFERENCES comptes (id) ON DELETE SET NULL,
	le         timestamptz NOT NULL DEFAULT now()
);

-- La lecture attendue est « le journal d'une note, du plus récent au plus
-- ancien » : c'est l'index de `verifications`, mot pour mot.
CREATE INDEX consultations_note_idx ON consultations (note_id, le DESC);
