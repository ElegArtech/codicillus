CREATE TYPE etat_de_requete AS ENUM ('a-evaluer', 'acceptee', 'diffusee', 'non-retenue');
CREATE TABLE requetes_de_documentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sujet text NOT NULL,
  besoin text NOT NULL,
  recherche text NOT NULL DEFAULT '',
  origine text NOT NULL,
  demandeur_id uuid REFERENCES comptes(id) ON DELETE SET NULL,
  etat etat_de_requete NOT NULL DEFAULT 'a-evaluer',
  domaine_id uuid REFERENCES domaines(id) ON DELETE SET NULL,
  note_id uuid REFERENCES notes(id) ON DELETE SET NULL,
  commentaire_interne text NOT NULL DEFAULT '',
  commentaire_demandeur text NOT NULL DEFAULT '',
  revision integer NOT NULL DEFAULT 0,
  revision_lue integer NOT NULL DEFAULT 0,
  cree_le timestamptz NOT NULL DEFAULT now(),
  modifie_le timestamptz NOT NULL DEFAULT now(),
  supprimee_le timestamptz,
  CONSTRAINT requetes_sujet_longueur CHECK (char_length(sujet) BETWEEN 1 AND 160),
  CONSTRAINT requetes_besoin_longueur CHECK (char_length(besoin) <= 2000),
  CONSTRAINT requetes_origine CHECK (origine IN ('accueil-public', 'recherche-publique', 'accueil-interne', 'recherche-interne'))
);
CREATE INDEX requetes_etat_idx ON requetes_de_documentation(etat, cree_le DESC) WHERE supprimee_le IS NULL;
CREATE INDEX requetes_demandeur_idx ON requetes_de_documentation(demandeur_id, modifie_le DESC);
CREATE TABLE evenements_de_requete (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requete_id uuid REFERENCES requetes_de_documentation(id) ON DELETE SET NULL,
  acteur_id uuid REFERENCES comptes(id) ON DELETE SET NULL,
  geste text NOT NULL,
  commentaire_demandeur text NOT NULL DEFAULT '',
  visible_demandeur boolean NOT NULL DEFAULT false,
  le timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX evenements_requete_idx ON evenements_de_requete(requete_id, le DESC);
CREATE INDEX evenements_requete_le_idx ON evenements_de_requete(le DESC);
