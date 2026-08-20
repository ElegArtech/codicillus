-- ═══════════════════════════════════════════════════════════════════════════
-- 004 — L'HISTORIQUE DES VERSIONS : ce que RG-M07-02 exigeait depuis 002
--
-- Source : CDC RG-M07-02 — « une version capture titre et les deux corps,
-- immuable » —, M07.1 (V-15, l'historique), M07.3 (V-16, la comparaison
-- visuelle), et `seeds/corpus.ts` qui en porte déjà la forme complète :
-- `interface Version` (:292-305), `VERSIONS` (:1383), `CONTENU_VERSIONS`
-- (:1503) et `RETENTION_VERSIONS = 50` (:1379).
--
-- POURQUOI CETTE TABLE ARRIVE EN 004 ET NON EN 002. Elle aurait dû être au
-- socle : deux vues gelées en dépendent et aucune ne peut être câblée sans
-- elle. Le socle l'a omise ; ce fichier ne fait que réparer l'omission, il
-- n'ouvre aucune fonction nouvelle. Le lot de V-15 / V-16 la remplira.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- « IMMUABLE » EST TENU PAR LE SCHÉMA, PAS PAR UNE INTENTION
--
-- Le socle (002) énonce la règle : « une contrainte que seule l'application
-- porterait n'est pas une contrainte, c'est une intention ». RG-M07-02 dit
-- « immuable » : la table n'a donc AUCUNE colonne `modifie_le` — en poser une
-- serait écrire que la ligne peut changer — et un DÉCLENCHEUR refuse tout
-- UPDATE et tout DELETE. La purge au-delà du plafond est une tâche de fond
-- (T-019) : elle passera par `DROP TRIGGER` explicite dans sa propre
-- transaction, ou par une exception nommée. Ce n'est pas l'affaire de 004.
--
-- LE PLAFOND N'EST PAS ICI, ET C'EST VOULU. `RETENTION_VERSIONS = 50` est déjà
-- en base : `lignesDeParametre()` écrit `versions_max` depuis `CONFIG.versionsMax`,
-- qui vaut 50. Poser une seconde clé serait une seconde définition du même
-- nombre — exactement ce que le socle refuse pour la fraîcheur (:313). Un
-- plafond en contrainte de schéma serait pire encore : il rendrait la valeur
-- non configurable, quand M14.7 la range parmi les réglages.
--
-- LES DEUX CORPS SONT DES DOCUMENTS CANONIQUES (ADR-003). Ils sont en `jsonb`,
-- comme `notes.corps_reference` : ADR-003 interdit « toute colonne de contenu
-- en text ou en varchar qui contiendrait un corps rédigé », et interdit aussi
-- « toute écriture directe en base d'un document non validé par le schéma
-- ProseMirror » — la validation est portée par `analyserDocument`, côté
-- application, parce qu'un schéma ProseMirror n'est pas exprimable en SQL.
--
-- LE VOCABULAIRE EST CONTRACTUEL (P-07). « version » est le mot de M07 et de
-- `seeds/corpus.ts` ; ni « révision » — qui désigne la DEMANDE de révision de
-- RG-M06-05, déjà portée par `notes.revision_*` —, ni « historique », qui est
-- le nom de l'écran et non de l'objet.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE versions (
	id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	note_id  uuid NOT NULL REFERENCES notes (id) ON DELETE CASCADE,

	-- `Version.n` — le numéro, croissant, unique par note.
	numero   integer NOT NULL,

	-- `Version.date` et `Version.heure` des maquettes sont deux champs
	-- d'AFFICHAGE ; l'instant est un. Il est stocké une fois, en
	-- `timestamptz`, comme les dates de `notes` : deux colonnes se
	-- désaccorderaient, et le fuseau serait perdu.
	le       timestamptz NOT NULL,

	-- `Version.auteur`. ON DELETE RESTRICT : effacer un compte ne doit pas
	-- effacer la trace de qui a écrit — une version est immuable.
	auteur_id uuid NOT NULL REFERENCES comptes (id) ON DELETE RESTRICT,

	-- `Version.resume` — la ligne que V-15 affiche en regard du numéro.
	resume   text NOT NULL,

	-- `Version.ajout` et `Version.retrait` : « comptent les lignes touchées »
	-- (`seeds/corpus.ts`:1381). Positifs tous les deux, retrait compris : ce
	-- sont des quantités, pas un solde.
	ajout    integer NOT NULL,
	retrait  integer NOT NULL,

	-- RG-M07-02 — « une version capture titre et LES DEUX CORPS ». Le titre
	-- est capturé parce qu'il est renommable et que V-16 doit pouvoir montrer
	-- un renommage. Le corps Opérationnel est nullable, comme sur `notes` :
	-- RG-NOT-02 l'autorise à ne pas exister.
	titre              text NOT NULL,
	corps_reference    jsonb NOT NULL,
	corps_operationnel jsonb,

	cree_le  timestamptz NOT NULL DEFAULT now(),

	-- Le numéro identifie la version DE SA NOTE : c'est le couple qui est
	-- unique, jamais le numéro seul.
	CONSTRAINT versions_numero_par_note_unique UNIQUE (note_id, numero),
	CONSTRAINT versions_numero_positif CHECK (numero >= 1),
	CONSTRAINT versions_ajout_positif   CHECK (ajout >= 0),
	CONSTRAINT versions_retrait_positif CHECK (retrait >= 0)
);

-- V-15 liste l'historique d'UNE note, de la plus récente à la plus ancienne :
-- c'est l'ordre de l'index, pas un tri à faire.
CREATE INDEX versions_note_idx ON versions (note_id, numero DESC);

/* ── L'immuabilité, tenue par la base ─────────────────────────────────────
   Sans ce déclencheur, « immuable » serait une convention que la première
   requête d'un lot pressé emporterait. Avec lui, la tentative échoue, et le
   message dit la règle et son numéro plutôt que « permission denied ».

   IL NE PORTE QUE L'UPDATE, ET C'EST UN CHOIX RAISONNÉ. « Immuable » qualifie
   le CONTENU d'une version : ce qui a été capturé ne se réécrit pas. Étendre
   le refus au DELETE aurait deux conséquences fausses. La première est
   mécanique : `note_id` est en ON DELETE CASCADE — RG-M04-10 régit la
   suppression d'une note et compte d'ailleurs « les versions perdues » —, et
   un déclencheur qui refuse le DELETE rendrait
   toute note historisée INDESTRUCTIBLE, ce qu'aucune règle ne demande. La
   seconde est fonctionnelle : la purge au-delà du plafond (T-019, `versions_max`)
   est un DELETE légitime, et la seule façon de la laisser passer serait de
   retirer le déclencheur au moment de purger — une protection qu'on décroche
   pour travailler n'en est pas une.

   Autrement dit : on ne peut pas RÉÉCRIRE l'histoire ; on peut en oublier la
   queue, et seulement par les deux chemins que les règles nomment. */
CREATE FUNCTION versions_refuser_reecriture() RETURNS trigger AS $corps$
BEGIN
	RAISE EXCEPTION
		'RG-M07-02 : une version est immuable — % refusé sur versions', TG_OP
		USING ERRCODE = 'restrict_violation';
END;
$corps$ LANGUAGE plpgsql;

CREATE TRIGGER versions_immuables
	BEFORE UPDATE ON versions
	FOR EACH ROW EXECUTE FUNCTION versions_refuser_reecriture();
