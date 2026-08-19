-- ═══════════════════════════════════════════════════════════════════════════
-- 002 — LE SOCLE DES OBJETS MÉTIER
--
-- Source : `cadrage/CAHIER-DES-CHARGES-FONCTIONNEL.md` §3.1 à §3.6, règles
-- RG-STR-01 à RG-STR-06, RG-NOT-01 à RG-NOT-04, RG-DRO-01 à RG-DRO-05,
-- RG-M08-03, RG-M06-01. Arbitrage ARB-001 pour l'unicité de l'univers.
--
-- LE VOCABULAIRE EST CONTRACTUEL (P-07, CLAUDE.md §3). Les noms de tables, de
-- colonnes et de types d'énumération n'emploient que les douze termes et leurs
-- dérivés directs. Aucun synonyme — ni « document », ni « page », ni « tag »,
-- ni « article ». Les valeurs d'énumération sont écrites sans diacritique et en
-- minuscules : c'est une convention d'encodage, pas un second vocabulaire ; le
-- libellé affiché reste celui du produit.
--
-- CE QUI EST CONTRAINT PAR LA BASE, ET CE QUI NE L'EST PAS. Tout ce qui est
-- exprimable déclarativement l'est ici — une contrainte que seule l'application
-- porterait n'est pas une contrainte, c'est une intention. Ce qui ne l'est pas
-- (cycles de dossiers, plancher d'un module par domaine) est énoncé en
-- commentaire à l'endroit concerné, jamais passé sous silence.
-- ═══════════════════════════════════════════════════════════════════════════

/* ── Les énumérations ──────────────────────────────────────────────────── */

-- CDC §2.2 donne trois NIVEAUX D'ACCÈS ; les maquettes gelées donnent quatre
-- RÔLES (`seeds/corpus.ts` `RoleDeCompte`, console des comptes V-28). Les
-- maquettes priment (ordre de préséance). Écart déclaré au rapport.
CREATE TYPE role_de_compte AS ENUM ('administrateur', 'referent', 'contributeur', 'lecteur');

-- CDC §3.2 — « Visibilité : publique ou interne, défaut interne ».
CREATE TYPE visibilite AS ENUM ('interne', 'publique');

-- CDC §3.2 — « Statut : brouillon ou publiée, défaut publiée » (RG-NOT-04).
CREATE TYPE statut_de_note AS ENUM ('brouillon', 'publiee');

-- CDC §2.3 — les trois droits de dossier, hérités dans l'arborescence.
CREATE TYPE droit_de_dossier AS ENUM ('lecteur', 'redacteur', 'gestionnaire');

-- RG-STR-06 énumère CINQ modules ; les maquettes en portent SIX — « Dossiers »
-- s'y ajoute (`seeds/corpus.ts` `MODULES`, `DETAIL_DOMAINES`). Les maquettes
-- priment. Écart déclaré au rapport.
CREATE TYPE module_de_domaine AS ENUM (
	'notes', 'dossiers', 'fiches', 'cartographie', 'signets', 'carte_mentale'
);

-- P-08 et M08.3 — « l'origine d'une relation est visible : déclarée, déduite
-- ou ambiguë ». La colonne existe donc dès le socle : une origine ajoutée
-- après coup ne se rattrape pas sur les relations déjà écrites.
CREATE TYPE origine_de_relation AS ENUM ('declaree', 'deduite', 'ambigue');

-- CDC §3.5 — « texte, nombre, date, liste de valeurs, lien, booléen ».
-- M08.2 en énumère huit ; §3.5 est la section du périmètre de ce lot.
CREATE TYPE type_de_champ AS ENUM ('texte', 'nombre', 'date', 'liste', 'lien', 'booleen');

/* ── Les comptes ───────────────────────────────────────────────────────── */

-- CDC §2.4. Le compte est ici parce que la note en dépend : « Auteur —
-- créateur de la note — obligatoire » (§3.2).
CREATE TABLE comptes (
	id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	identifiant    text NOT NULL,
	nom            text NOT NULL,
	courriel       text NOT NULL,
	role           role_de_compte NOT NULL,
	actif          boolean NOT NULL DEFAULT true,
	-- RG-CPT-01 — « mot de passe verrouillé » : le compte garde ses droits de
	-- contenu mais ne peut pas changer son propre mot de passe.
	mot_de_passe_verrouille boolean NOT NULL DEFAULT false,
	arrive_le      date NOT NULL,
	cree_le        timestamptz NOT NULL DEFAULT now(),
	modifie_le     timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT comptes_identifiant_unique UNIQUE (identifiant),
	CONSTRAINT comptes_courriel_unique UNIQUE (courriel)
);

/* ── Le rangement : univers → domaine → dossier ────────────────────────── */

-- RG-STR-01 · ARB-001. « Deux univers ne peuvent pas porter le même nom ; le
-- refus est une règle métier appliquée à L'ÉCRITURE, pas un contrôle
-- d'affichage. » L'unicité de l'identifiant lisible s'y ajoute : il est le
-- segment d'adresse `/univers/{univers}` (RG-M03-02, `docs/routes.md` §3.3),
-- et deux univers partageant un identifiant rendraient l'adresse ambiguë.
CREATE TABLE univers (
	id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	identifiant text NOT NULL,
	nom         text NOT NULL,
	description text NOT NULL DEFAULT '',
	couleur     text NOT NULL,
	-- CDC §3.1 dit « icône » ; les maquettes portent `glyphe`, et le jeu de
	-- semence en est l'extraction. Les maquettes priment.
	glyphe      text NOT NULL,
	ordre       integer NOT NULL,
	-- RG-STR-01 — « un univers "Non classé" existe par défaut et NE PEUT PAS
	-- ÊTRE SUPPRIMÉ ». Le drapeau porte la propriété, le déclencheur plus bas
	-- porte le refus.
	systeme     boolean NOT NULL DEFAULT false,
	cree_le     timestamptz NOT NULL DEFAULT now(),
	modifie_le  timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT univers_nom_unique UNIQUE (nom),
	CONSTRAINT univers_identifiant_unique UNIQUE (identifiant)
);

-- LE REFUS DE SUPPRESSION D'UN UNIVERS SYSTÈME (RG-STR-01, seconde clause).
-- Une règle qu'aucun mécanisme n'applique est une intention : le refus est
-- porté par la base, au même titre que les unicités.
CREATE FUNCTION refuser_suppression_univers_systeme() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
	RAISE EXCEPTION 'univers système : suppression refusée (RG-STR-01) — %', OLD.nom
		USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER univers_systeme_indestructible
	BEFORE DELETE ON univers
	FOR EACH ROW WHEN (OLD.systeme)
	EXECUTE FUNCTION refuser_suppression_univers_systeme();

-- RG-STR-01 — « un domaine appartient à EXACTEMENT UN univers ».
-- RG-STR-02 — « l'identifiant lisible d'un domaine est unique AU SEIN DE SON
-- UNIVERS, pas globalement. Deux univers peuvent donc avoir chacun un domaine
-- "support". » L'unicité porte donc sur le COUPLE, et sur rien d'autre :
-- aucune contrainte globale sur `identifiant` seul, aucune sur `nom` seul —
-- ARB-001 le dit en toutes lettres, « aucune contrainte d'unicité globale sur
-- l'identifiant de domaine ».
CREATE TABLE domaines (
	id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	univers_id  uuid NOT NULL REFERENCES univers (id) ON DELETE RESTRICT,
	identifiant text NOT NULL,
	nom         text NOT NULL,
	description text NOT NULL DEFAULT '',
	couleur     text NOT NULL,
	cree_le     timestamptz NOT NULL DEFAULT now(),
	modifie_le  timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT domaines_identifiant_par_univers_unique UNIQUE (univers_id, identifiant)
);

-- RG-STR-06 — « un domaine active 1 à N modules ». Une table plutôt qu'un
-- tableau de valeurs : c'est ce qui rend le module joignable, comptable et
-- contraignable par clé étrangère.
--
-- CE QUE LA BASE NE PORTE PAS : le plancher « 1 à N ». Exiger au moins une
-- ligne fille à tout instant demande un déclencheur à contrainte différée,
-- dont le comportement en lot d'import n'est décidé nulle part. Non comblé,
-- déclaré au rapport.
CREATE TABLE modules_de_domaine (
	domaine_id uuid NOT NULL REFERENCES domaines (id) ON DELETE CASCADE,
	module     module_de_domaine NOT NULL,
	CONSTRAINT modules_de_domaine_pk PRIMARY KEY (domaine_id, module)
);

-- RG-STR-03 — « chaque domaine dispose à sa création d'un DOSSIER RACINE par
-- défaut ». RG-STR-04 — « profondeur plafonnée à 10 niveaux ». RG-STR-05 — « un
-- dossier ne peut pas être déplacé dans l'un de ses propres descendants, NI
-- DANS UN AUTRE DOMAINE ».
--
-- La seconde clause de RG-STR-05 est portée par une clé étrangère COMPOSITE :
-- le parent est désigné par (parent_id, domaine_id), et la cible est le couple
-- (id, domaine_id) de la même table. Un parent d'un autre domaine est alors
-- impossible à écrire — pas « interdit par l'application », impossible.
--
-- CE QUE LA BASE NE PORTE PAS : l'interdiction de cycle (première clause de
-- RG-STR-05, au-delà de l'auto-parentage) et la cohérence de `profondeur` avec
-- la chaîne des parents. Toutes deux demandent un parcours récursif, donc un
-- déclencheur. Non comblé, déclaré au rapport.
CREATE TABLE dossiers (
	id          uuid NOT NULL DEFAULT gen_random_uuid(),
	domaine_id  uuid NOT NULL REFERENCES domaines (id) ON DELETE CASCADE,
	parent_id   uuid,
	nom         text NOT NULL,
	-- CDC §3.1 — « position parmi ses frères ».
	position    integer NOT NULL DEFAULT 0,
	profondeur  integer NOT NULL,
	cree_le     timestamptz NOT NULL DEFAULT now(),
	modifie_le  timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT dossiers_pk PRIMARY KEY (id),
	CONSTRAINT dossiers_id_domaine_unique UNIQUE (id, domaine_id),
	CONSTRAINT dossiers_parent_meme_domaine
		FOREIGN KEY (parent_id, domaine_id) REFERENCES dossiers (id, domaine_id)
		ON DELETE CASCADE,
	-- RG-STR-04, le plafond. La racine est le niveau 1 : le chemin d'adresse
	-- `/…/dossiers/{chemin…}` ne porte pas la racine (`src/lib/rangement/
	-- adresses.ts`), dix niveaux se comptent donc racine comprise.
	CONSTRAINT dossiers_profondeur_plafonnee CHECK (profondeur BETWEEN 1 AND 10),
	-- La racine, et elle seule, n'a pas de parent.
	CONSTRAINT dossiers_racine_sans_parent
		CHECK ((parent_id IS NULL) = (profondeur = 1)),
	-- RG-STR-05, cas dégénéré : un dossier n'est pas son propre parent.
	CONSTRAINT dossiers_pas_son_propre_parent CHECK (parent_id IS DISTINCT FROM id)
);

-- RG-STR-03 — un dossier racine par domaine, et un seul.
CREATE UNIQUE INDEX dossiers_racine_unique_par_domaine
	ON dossiers (domaine_id) WHERE parent_id IS NULL;

CREATE INDEX dossiers_parent_idx ON dossiers (parent_id);

-- RG-DRO-01 — « le droit effectif est le droit explicite LE PLUS PROCHE en
-- remontant l'arborescence ». « Le plus proche » n'a de sens que si un compte
-- n'a qu'un droit explicite par dossier : d'où l'unicité du couple.
-- RG-DRO-02 — fermeture par défaut : l'absence de ligne vaut absence d'accès,
-- ce qui est exactement ce que dit une table sans ligne.
CREATE TABLE droits_de_dossier (
	dossier_id uuid NOT NULL REFERENCES dossiers (id) ON DELETE CASCADE,
	compte_id  uuid NOT NULL REFERENCES comptes (id) ON DELETE CASCADE,
	droit      droit_de_dossier NOT NULL,
	cree_le    timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT droits_de_dossier_pk PRIMARY KEY (dossier_id, compte_id)
);

/* ── Le référentiel (CDC §3.3 à §3.6) ──────────────────────────────────── */

CREATE TABLE types_de_note (
	id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	identifiant text NOT NULL,
	nom         text NOT NULL,
	ordre       integer NOT NULL,
	CONSTRAINT types_de_note_identifiant_unique UNIQUE (identifiant),
	CONSTRAINT types_de_note_nom_unique UNIQUE (nom)
);

-- RG-REF-01 — « chaque type fourni est accompagné d'un template ». Le lien est
-- une clé étrangère, non une convention de nommage.
CREATE TABLE templates (
	id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	identifiant      text NOT NULL,
	nom              text NOT NULL,
	description      text NOT NULL DEFAULT '',
	type_de_note_id  uuid NOT NULL REFERENCES types_de_note (id) ON DELETE RESTRICT,
	-- RG-REF-01 — « les templates sont SUBSIDIAIRES : la page vierge est le
	-- défaut, un template n'est jamais imposé ». Le drapeau désigne le template
	-- proposé en tête de liste, jamais un template appliqué d'office.
	defaut           boolean NOT NULL DEFAULT false,
	structure        jsonb NOT NULL DEFAULT '[]'::jsonb,
	contenu          text NOT NULL,
	cree_le          timestamptz NOT NULL DEFAULT now(),
	modifie_le       timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT templates_identifiant_unique UNIQUE (identifiant)
);

CREATE TABLE types_de_fiche (
	id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	identifiant text NOT NULL,
	nom         text NOT NULL,
	ordre       integer NOT NULL,
	CONSTRAINT types_de_fiche_identifiant_unique UNIQUE (identifiant),
	CONSTRAINT types_de_fiche_nom_unique UNIQUE (nom)
);

-- CDC §3.5 — « chacun définit un ensemble de propriétés typées ». La clé du
-- champ est ce que `notes.proprietes_typees` emploie : elle est unique DANS
-- SON TYPE DE FICHE, comme l'identifiant de domaine l'est dans son univers.
CREATE TABLE champs_de_type_de_fiche (
	id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	type_de_fiche_id  uuid NOT NULL REFERENCES types_de_fiche (id) ON DELETE CASCADE,
	cle               text NOT NULL,
	nom               text NOT NULL,
	type              type_de_champ NOT NULL,
	ordre             integer NOT NULL,
	exemple           text,
	-- Champs de type « liste » seulement : les valeurs admises.
	valeurs           jsonb,
	CONSTRAINT champs_cle_par_type_unique UNIQUE (type_de_fiche_id, cle),
	CONSTRAINT champs_valeurs_reservees_a_la_liste
		CHECK (valeurs IS NULL OR type = 'liste')
);

-- RG-M08-06 — « chaque type de relation définit un libellé direct et un
-- libellé inverse ».
CREATE TABLE types_de_relation (
	id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	identifiant     text NOT NULL,
	libelle_sortant text NOT NULL,
	libelle_entrant text NOT NULL,
	-- Les relations qui portent une dépendance TECHNIQUE : ce sont elles que la
	-- cartographie lit pour les points de défaillance unique. « Documente »
	-- n'en est pas une (`seeds/corpus.ts` `RELATIONS_TECHNIQUES`).
	technique       boolean NOT NULL DEFAULT false,
	ordre           integer NOT NULL,
	CONSTRAINT types_de_relation_identifiant_unique UNIQUE (identifiant),
	CONSTRAINT types_de_relation_libelle_sortant_unique UNIQUE (libelle_sortant)
);

-- CDC §3.3 — « Étiquette : mot-clé libre, créé à la volée, PARTAGÉ à l'échelle
-- du produit ». Partagé : une seule ligne par libellé, pour tout le produit.
CREATE TABLE etiquettes (
	id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	libelle  text NOT NULL,
	cree_le  timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT etiquettes_libelle_unique UNIQUE (libelle)
);

-- CDC §3.3 — « Paramètre : valeur de configuration globale (seuils, adresses,
-- quotas, libellés) ». M14.7 : le libellé du concept « fiche » en est un.
CREATE TABLE parametres (
	cle        text PRIMARY KEY,
	valeur     jsonb NOT NULL,
	modifie_le timestamptz NOT NULL DEFAULT now()
);

/* ── La note (CDC §3.2) ────────────────────────────────────────────────── */

-- RG-NOT-01 — « une note est UNIQUE. La fiche structurée n'est pas un objet
-- séparé : c'est une note qui porte un type de fiche et des propriétés typées.
-- Le nœud du graphe EST la note. » Il n'y a donc qu'une table, et il ne doit
-- jamais y en avoir deux.
--
-- LE SIGNET SUIT LA MÊME RÈGLE, et c'est une lecture des maquettes contre le
-- cahier des charges : §3.3 range le signet parmi les objets de référentiel,
-- les maquettes gelées en font un TYPE DE NOTE portant une adresse
-- (`seeds/corpus.ts`, `type: 'Signet'` + `url` + `ajoute`). Les maquettes
-- priment. Écart déclaré au rapport.
--
-- LA FRAÎCHEUR N'EST PAS UNE COLONNE (P-01, ADR-005). RG-M06-01 : « le calcul
-- repose sur la date de dernière vérification explicite ; à défaut, sur la date
-- de dernière modification ; à défaut, sur la date de création ». Les trois
-- dates sont donc stockées, le NIVEAU jamais : une colonne `fraicheur` serait
-- une seconde définition, et P-01 dit ce que deux définitions concurrentes font
-- au produit.
CREATE TABLE notes (
	id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	-- CDC §3.2 — « identifiant lisible, dérivé du titre, UNIQUE, stable,
	-- utilisé dans l'adresse ». Unique globalement : l'adresse est plate,
	-- `/notes/{identifiant}` (RG-M03-03).
	identifiant text NOT NULL,
	titre       text NOT NULL,

	-- ADR-003 — le corps est un document ProseMirror sérialisé en `jsonb`.
	-- RG-NOT-02 — « le corps Référence est canonique. Le corps Opérationnel est
	-- optionnel et NE PEUT EXISTER SANS Référence » : d'où `NOT NULL` d'un côté
	-- et rien de l'autre — l'absence de Référence est impossible, donc
	-- l'Opérationnel seul l'est aussi.
	corps_reference     jsonb NOT NULL,
	corps_operationnel  jsonb,

	type_de_note_id uuid NOT NULL REFERENCES types_de_note (id) ON DELETE RESTRICT,
	domaine_id      uuid NOT NULL REFERENCES domaines (id) ON DELETE RESTRICT,
	-- RG-STR-03 — « TOUTE note appartient à un dossier » : la colonne est
	-- obligatoire. Le couple (dossier, domaine) est contraint plus bas.
	dossier_id      uuid NOT NULL,
	auteur_id       uuid NOT NULL REFERENCES comptes (id) ON DELETE RESTRICT,

	visibilite  visibilite NOT NULL DEFAULT 'interne',
	statut      statut_de_note NOT NULL DEFAULT 'publiee',

	-- CDC §3.2, « Dates » : création, dernière modification, dernière
	-- modification du corps Référence, dernière mise à jour du corps
	-- Opérationnel, dernière vérification.
	cree_le                        timestamptz NOT NULL DEFAULT now(),
	modifie_le                     timestamptz NOT NULL DEFAULT now(),
	corps_reference_modifie_le     timestamptz NOT NULL DEFAULT now(),
	corps_operationnel_modifie_le  timestamptz,
	verifie_le                     timestamptz,

	compteur_de_consultations integer NOT NULL DEFAULT 0,

	-- CDC §3.2 — « Demande de révision : drapeau + commentaire + demandeur +
	-- date ». Portée par la note, comme le cahier des charges l'écrit.
	revision_demandee    boolean NOT NULL DEFAULT false,
	revision_commentaire text,
	revision_par_id      uuid REFERENCES comptes (id) ON DELETE SET NULL,
	revision_le          timestamptz,

	-- RG-NOT-01 — la fiche est cette note-ci, typée.
	type_de_fiche_id  uuid REFERENCES types_de_fiche (id) ON DELETE RESTRICT,
	proprietes_typees jsonb,

	-- Le signet : une note qui porte une adresse web (M11).
	signet_adresse   text,
	signet_ajoute_le date,

	CONSTRAINT notes_identifiant_unique UNIQUE (identifiant),
	-- Une note est rangée dans un dossier DE SON DOMAINE. Même mécanique que
	-- RG-STR-05 pour les dossiers : la clé composite rend l'autre cas
	-- inécrivable.
	CONSTRAINT notes_dossier_du_meme_domaine
		FOREIGN KEY (dossier_id, domaine_id) REFERENCES dossiers (id, domaine_id)
		ON DELETE RESTRICT,
	CONSTRAINT notes_operationnel_date_coherente
		CHECK ((corps_operationnel IS NULL) = (corps_operationnel_modifie_le IS NULL)),
	CONSTRAINT notes_proprietes_exigent_un_type_de_fiche
		CHECK (proprietes_typees IS NULL OR type_de_fiche_id IS NOT NULL),
	CONSTRAINT notes_revision_coherente CHECK (
		(NOT revision_demandee
			AND revision_commentaire IS NULL
			AND revision_par_id IS NULL
			AND revision_le IS NULL)
		OR (revision_demandee AND revision_par_id IS NOT NULL AND revision_le IS NOT NULL)
	),
	CONSTRAINT notes_signet_coherent
		CHECK ((signet_adresse IS NULL) = (signet_ajoute_le IS NULL)),
	CONSTRAINT notes_consultations_positives CHECK (compteur_de_consultations >= 0)
);

CREATE INDEX notes_domaine_idx ON notes (domaine_id);
CREATE INDEX notes_dossier_idx ON notes (dossier_id);
CREATE INDEX notes_auteur_idx ON notes (auteur_id);
-- RG-ACC-01 — le filtrage du périmètre anonyme « est appliqué AU PLUS PRÈS DE
-- LA DONNÉE » : notes publiques ET publiées. L'index porte exactement ce
-- couple, pour que le chemin le plus sensible soit aussi le plus direct.
CREATE INDEX notes_perimetre_public_idx
	ON notes (domaine_id) WHERE visibilite = 'publique' AND statut = 'publiee';

-- CDC §3.2 — « Étiquettes : mots-clés libres, PARTAGÉS à l'échelle du
-- produit ». RG-NOT-03 : elles sont communes aux deux registres — il n'y a
-- qu'une note, donc qu'un jeu d'étiquettes.
CREATE TABLE etiquettes_de_note (
	note_id      uuid NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
	etiquette_id uuid NOT NULL REFERENCES etiquettes (id) ON DELETE CASCADE,
	CONSTRAINT etiquettes_de_note_pk PRIMARY KEY (note_id, etiquette_id)
);

CREATE INDEX etiquettes_de_note_etiquette_idx ON etiquettes_de_note (etiquette_id);

-- RG-M08-03 — « une même relation (même source, même cible, même type) ne peut
-- exister QU'UNE FOIS ». RG-M08-05 — « supprimer une note supprime toutes ses
-- relations, DANS LES DEUX SENS » : `ON DELETE CASCADE` des deux côtés.
CREATE TABLE relations (
	id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	source_id           uuid NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
	cible_id            uuid NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
	type_de_relation_id uuid NOT NULL REFERENCES types_de_relation (id) ON DELETE RESTRICT,
	-- P-08 — déclarée, déduite ou ambiguë ; l'utilisateur sait toujours.
	origine             origine_de_relation NOT NULL DEFAULT 'declaree',
	cree_le             timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT relations_unicite UNIQUE (source_id, cible_id, type_de_relation_id),
	CONSTRAINT relations_pas_reflexives CHECK (source_id <> cible_id)
);

CREATE INDEX relations_cible_idx ON relations (cible_id);

-- CDC §3.2 « Pièces jointes : fichiers liés à la note » ; M04.7 en donne les
-- colonnes affichées — « liste des fichiers, taille, type, téléchargement ».
-- RG-M04-08 : l'accès suit strictement la visibilité de la NOTE, ce qui est
-- exactement ce que porte la clé étrangère — la pièce jointe n'a pas de
-- visibilité propre, et ne doit pas en avoir.
CREATE TABLE pieces_jointes (
	id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	note_id       uuid NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
	nom           text NOT NULL,
	taille_octets bigint NOT NULL,
	type_media    text NOT NULL,
	deposee_le    timestamptz NOT NULL DEFAULT now(),
	deposee_par_id uuid REFERENCES comptes (id) ON DELETE SET NULL,
	CONSTRAINT pieces_jointes_taille_positive CHECK (taille_octets >= 0)
);

CREATE INDEX pieces_jointes_note_idx ON pieces_jointes (note_id);

-- M06.2 — « l'historique complet des vérifications est conservé et
-- consultable » ; M04.7 en fait un panneau. `notes.verifie_le` est la dernière
-- ligne de cette table, dénormalisée pour que RG-M06-01 se lise sans jointure.
CREATE TABLE verifications (
	id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	note_id   uuid NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
	compte_id uuid REFERENCES comptes (id) ON DELETE SET NULL,
	le        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX verifications_note_idx ON verifications (note_id, le DESC);
