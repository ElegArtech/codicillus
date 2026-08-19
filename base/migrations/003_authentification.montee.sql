-- ═══════════════════════════════════════════════════════════════════════════
-- 003 — L'AUTHENTIFICATION : mots de passe, sessions, tentatives
--
-- Source : CDC M16.1 (UC-M16-01, RG-M16-01), M16.2 (UC-M16-02, RG-ACC-02),
-- RG-ACC-03, RG-M14-08, RG-NF-07, et `cadrage/STACK-TECHNIQUE.md` §4.7 :
-- « Mots de passe — @node-rs/argon2 2.1.0, Argon2id · Sessions — jetons
-- opaques en base, cookie HttpOnly, SameSite=Lax, Secure · Tentatives
-- répétées — ralentissement progressif puis blocage temporaire, COMPTEUR EN
-- BASE ».
--
-- CE QUE LA BASE PORTE, ET CE QU'ELLE NE PORTE PAS. Le socle (002) énonce la
-- règle : « une contrainte que seule l'application porterait n'est pas une
-- contrainte, c'est une intention ». Elle est tenue ici pour tout ce qui est
-- exprimable — unicité du condensat de jeton, clés étrangères en cascade,
-- plancher des durées. Elle ne l'est pas pour deux choses, et c'est dit à
-- l'endroit concerné : le DÉLAI D'INACTIVITÉ, qui est une valeur de
-- configuration lue dans `parametres` (M14.7, V-33:1361) et non une contrainte
-- de schéma ; et le BARÈME de ralentissement, qui se calcule sur les lignes de
-- `tentatives_de_connexion` — une colonne « bloqué jusqu'à » globale serait une
-- seconde définition de l'état de blocage, exactement ce que le socle refuse
-- pour la fraîcheur (:313) et T-011 pour le droit effectif.
--
-- LE VOCABULAIRE EST CONTRACTUEL (P-07). « session » et « tentative » sont les
-- mots des sources : CDC RG-ACC-03 « à l'expiration de la session », V-33:1361
-- « Durée de session — délai d'inactivité », RG-M16-01 « un nombre excessif de
-- tentatives ». Aucun synonyme n'est introduit.
-- ═══════════════════════════════════════════════════════════════════════════

/* ── Le mot de passe d'un compte ───────────────────────────────────────── */

-- UC-M16-01 — « l'utilisateur se connecte avec un compte local. Identifiant et
-- mot de passe. » Le socle (002) ne stockait aucun secret : la colonne est
-- posée ici, sur `comptes`, parce que le mot de passe est déjà un ATTRIBUT DU
-- COMPTE dans le cahier des charges — `mot_de_passe_verrouille` y est depuis
-- 002 (RG-CPT-01), et M14.6 range « réinitialiser un mot de passe » parmi les
-- actions sur un compte.
--
-- SEUL LE CONDENSAT EST STOCKÉ, JAMAIS LE MOT DE PASSE. Le format est celui
-- que produit Argon2id (`$argon2id$v=19$m=…,t=…,p=…$sel$condensat`) : il porte
-- ses propres paramètres, donc un changement de coût n'invalide pas les
-- condensats déjà écrits.
--
-- LA COLONNE EST NULLABLE, ET C'EST UNE FERMETURE PAR DÉFAUT. Un compte sans
-- condensat ne peut pas s'authentifier — c'est l'état d'un compte créé en
-- console avant que son mot de passe ne soit posé (M14.6). Le jeu de semence
-- n'en pose aucun : inventer un mot de passe de démonstration serait inventer
-- une donnée que le gel ne porte pas.
ALTER TABLE comptes ADD COLUMN condensat_mot_de_passe text;

/* ── Les sessions ──────────────────────────────────────────────────────── */

-- STACK §4.7 — « jetons opaques en base ». Le jeton est tiré au hasard côté
-- application et n'a aucune structure : il ne porte ni identifiant de compte,
-- ni date, ni signature. Rien n'en est déductible, et rien ne s'y falsifie.
--
-- SEUL LE CONDENSAT DU JETON EST STOCKÉ. Le jeton lui-même ne vit que dans le
-- cookie de l'appelant. Une copie de la base ne rend donc aucune session
-- utilisable, au même titre qu'elle ne rend aucun mot de passe. Le condensat
-- est un SHA-256 : à la différence d'un mot de passe, un jeton de 256 bits
-- tiré au hasard n'est pas énumérable, un condensat lent n'apporte rien, et il
-- coûterait sa durée à CHAQUE requête.
--
-- V-25:1236 — « Fermer toutes les autres sessions » : une ligne par session,
-- et non un compteur, sans quoi cette action n'aurait pas d'objet.
CREATE TABLE sessions (
	id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	condensat_jeton  text NOT NULL,
	compte_id        uuid NOT NULL REFERENCES comptes (id) ON DELETE CASCADE,
	-- V-05:582 « Se souvenir de moi · À éviter sur un poste partagé » et
	-- V-25:1222-1223 « Rester connecté sur cet appareil — sans cette option, la
	-- session se ferme après deux heures d'inactivité ». Le drapeau EXEMPTE du
	-- délai d'inactivité ; il ne prolonge aucune durée, il en retire une.
	souvenir         boolean NOT NULL DEFAULT false,
	-- V-33:1361 — « DÉLAI D'INACTIVITÉ au bout duquel la session se ferme ».
	-- L'inactivité se mesure depuis la dernière requête servie, jamais depuis
	-- l'ouverture : d'où deux dates et non une.
	creee_le         timestamptz NOT NULL DEFAULT now(),
	derniere_activite_le timestamptz NOT NULL DEFAULT now(),
	-- Non nul dès que la session est fermée : déconnexion (UC-M16-02), délai
	-- d'inactivité échu (RG-ACC-03), ou fermeture des autres sessions
	-- (V-25:1236). La ligne est CONSERVÉE — une session fermée reste un fait
	-- daté, et l'effacer priverait la fermeture de sa trace.
	fermee_le        timestamptz,
	CONSTRAINT sessions_condensat_unique UNIQUE (condensat_jeton),
	-- La dernière activité ne précède jamais l'ouverture : une horloge qui
	-- reculerait ferait mesurer une inactivité négative, donc une session
	-- éternelle.
	CONSTRAINT sessions_activite_apres_ouverture CHECK (derniere_activite_le >= creee_le)
);

-- Les deux accès réels : par condensat de jeton (unicité ci-dessus, à chaque
-- requête) et par compte (fermeture des autres sessions, désactivation d'un
-- compte).
CREATE INDEX sessions_compte_idx ON sessions (compte_id, creee_le DESC);

/* ── Les tentatives de connexion ───────────────────────────────────────── */

-- RG-M16-01 — « un nombre excessif de tentatives DEPUIS UNE MÊME ORIGINE est
-- ralenti puis bloqué temporairement, avec un message explicite indiquant la
-- durée d'attente ». STACK §4.7 : « compteur en base ».
--
-- LA CLÉ EST L'ORIGINE, ET C'EST LA LETTRE DE LA RÈGLE. L'identifiant saisi
-- n'est PAS stocké : la règle ne le demande pas, et une saisie décalée d'un
-- champ écrirait un mot de passe dans cette table.
--
-- `blocage_jusqu_a` est le seul état persistant du barème, et il est porté par
-- la tentative QUI L'A DÉCLENCHÉ. Il sert deux fois : à refuser les tentatives
-- suivantes, et à REMETTRE LE COMPTEUR À ZÉRO quand la durée est échue — le
-- gel le montre, `verrouiller()` réactive le formulaire au terme du décompte
-- (V-05:730-735). Un compteur qui ne redescendrait jamais bloquerait à vie.
CREATE TABLE tentatives_de_connexion (
	id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	origine          text NOT NULL,
	reussie          boolean NOT NULL,
	-- Le ralentissement effectivement appliqué avant réponse, en secondes
	-- (RG-M16-01, « ralenti »). Écrit pour que la mesure soit relisible en
	-- base : une temporisation qu'aucune trace n'atteste n'est pas mesurable.
	attente_secondes integer NOT NULL DEFAULT 0,
	-- Non nul sur la seule tentative qui déclenche le blocage temporaire.
	blocage_jusqu_a  timestamptz,
	le               timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT tentatives_attente_positive CHECK (attente_secondes >= 0),
	-- Un blocage ne commence jamais avant la tentative qui l'ouvre.
	CONSTRAINT tentatives_blocage_posterieur CHECK (blocage_jusqu_a IS NULL OR blocage_jusqu_a > le)
);

-- Le seul accès : les tentatives d'une origine, les plus récentes d'abord.
CREATE INDEX tentatives_de_connexion_origine_idx ON tentatives_de_connexion (origine, le DESC);
