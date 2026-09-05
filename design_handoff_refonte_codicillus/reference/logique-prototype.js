// Extrait tel quel de la classe Component du prototype : données d'exemple, ETATS, calcul etatDe(), pages.
// Référence de LECTURE pour le développeur ; à transposer en TypeScript dans src/lib/fraicheur.ts et les chargeurs.

const J = 86400000;
const TODAY = new Date('2026-09-05T12:00:00');
const d = s => new Date(s + 'T12:00:00');
const iso = x => x.toISOString().slice(0, 10);
const jours = (a, b) => Math.round((b - a) / J);
const fmtL = x => x.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtC = x => x.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtJ = x => x.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const pl = (n, m) => `${n} ${m}${n > 1 ? 's' : ''}`;

const DISQUE = 'M8 1.5a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13z';
const ETATS = {
  ajour:     { lib: 'À jour',             couleur: '#1d6b4a', voile: '#e4efe8', path: DISQUE, attention: 0, regle: 'La vérification est valide.' },
  bientot:   { lib: 'Bientôt à vérifier', couleur: '#6f6a0e', voile: '#f2f0dc', path: 'M8 8V1.5A6.5 6.5 0 1 1 1.5 8z', attention: 1, regle: 'L\'échéance approche. Signal discret.' },
  averifier: { lib: 'À vérifier',         couleur: '#8f5c00', voile: '#f6eedd', path: 'M8 1.5a6.5 6.5 0 0 1 0 13z', attention: 2, regle: 'Échéance atteinte : bascule automatique.' },
  arevoir:   { lib: 'À revoir',           couleur: '#b4471c', voile: '#f8e6dc', path: 'M7.1 4h1.8v5H7.1zM7.1 10.3h1.8v1.8H7.1z', attention: 3, regle: 'Retard important ou révision demandée.' },
  obsolete:  { lib: 'Obsolète',           couleur: '#a52c1b', voile: '#f7e7e3', path: '', attention: 3, regle: 'Plus considérée comme exploitable.' }
};

function runs(s) {
  const out = []; const re = /(`[^`]+`|\*\*[^*]+\*\*)/g; let i = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > i) out.push({ t: s.slice(i, m.index), texte: true });
    if (m[0][0] === '`') out.push({ t: m[0].slice(1, -1), code: true }); else out.push({ t: m[0].slice(2, -2), fort: true });
    i = m.index + m[0].length;
  }
  if (i < s.length) out.push({ t: s.slice(i), texte: true });
  return out;
}
const P = t => ({ type: 'p', runs: runs(t) });
const CODE = (lang, ...l) => ({ type: 'code', lang, lignes: l.map(t => ({ t, couleur: t.startsWith('#') ? '#1f5a3c' : '#16222b' })) });
const LI = (...items) => ({ type: 'liste', items: items.map(runs) });
const ETAPES = (...items) => ({ type: 'etapes', items: items.map(runs) });
const AVIS = (t, niveau) => ({ type: 'avis', runs: runs(t), niveau: niveau || 'info' });
const TAB = (tetes, ...lignes) => ({ type: 'tableau', tetes, lignes });
const SCHEMA = (legende, ...l) => ({ type: 'schema', legende, lignes: l.map(t => ({ t })) });
const S = (titre, sous, blocs, complement) => ({ titre, sous, blocs, complement });

const NOTES = {
  claude: {
    id: 'claude', titre: 'Note technique — Installation de Claude Code sous Linux et mode autonome',
    slug: 'note-technique-claude-code-linux', univers: 'Claude', domaine: 'audit_code', voisines: '4 autres notes dans ce domaine',
    etiquettes: ['Linux', 'Ubuntu 20.04+', 'Claude Code', 'CLI Anthropic'],
    creee: '2026-08-13', auteur: 'Alexandre Berge', modifie: 'il y a 4 jours par Alexandre Berge', consultations: 2, consult30: 2, version: 'v1.0.0',
    relations: 3, pieces: 0, retroliens: 0,
    resume: 'Cette note décrit l\'installation de Claude Code (CLI Anthropic) sur Linux (x64/ARM64), ainsi que la résolution des problèmes courants (notamment l\'erreur de commande non trouvée) et l\'activation du mode autonome.',
    registres: {
      reference: { verifiee: '2026-08-13', validite: 90, par: 'Alexandre Berge', sections: [
        S('Prérequis système', '', [P('Installer `curl` (utilisé par l\'installateur) :'), CODE('bash', '# Debian / Ubuntu', 'sudo apt update && sudo apt install -y curl', '', '# Fedora', 'sudo dnf install curl', '', '# Arch', 'sudo pacman -S curl'), P('Vérifier l\'architecture avec `uname -m` : la valeur attendue est `x86_64` ou `aarch64`. L\'installateur natif ne dépend pas de Node.js ; seule l\'installation via npm le requiert (18+).')], 'Sur les distributions à noyau ancien (glibc < 2.28), l\'installateur natif refuse de s\'exécuter. Passer alors par npm ou par un conteneur.'),
        S('Installation', '(installateur natif)', [P('L\'installateur natif télécharge le binaire correspondant à l\'architecture et le place dans `~/.local/bin` :'), CODE('bash', 'curl -fsSL https://claude.ai/install.sh | bash'), P('Le parcours d\'installation tient en quatre étapes ; la seule bifurcation est la présence de `~/.local/bin` dans le `PATH` :'), SCHEMA('Parcours d\'installation et point de bifurcation', 'flowchart LR', '  A[curl install.sh] --> B[Installateur natif]', '  B --> C[Binaire déposé dans ~/.local/bin]', '  C --> D{~/.local/bin dans le PATH ?}', '  D -- oui --> E[claude --version]', '  D -- non --> F[Incident 03 : command not found]', '  F -. corriger le PATH .-> D'), AVIS('Si `~/.local/bin` n\'est pas dans le `PATH`, la commande `claude` ne sera pas trouvée après l\'installation. Voir l\'incident connu ci-dessous.')]),
        S('Incident connu', 'claude: command not found', [P('Le binaire est présent mais le shell ne connaît pas son répertoire. Ajouter `~/.local/bin` au `PATH` de façon persistante :'), CODE('bash', 'echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc', 'source ~/.bashrc'), P('Vérifier ensuite avec `claude --version`. Sous zsh, remplacer `~/.bashrc` par `~/.zshrc`.')]),
        S('Première exécution', 'et authentification', [P('Depuis le répertoire d\'un projet, lancer `claude`. La première exécution enchaîne trois étapes :'), LI('choix du thème d\'affichage (clair / sombre) ;', 'connexion au compte Anthropic via le navigateur (un code de vérification s\'affiche dans le terminal) ;', 'autorisation d\'accès au répertoire courant, mémorisée dans `~/.claude.json`.')]),
        S('Mode autonome', 'bypass des permissions', [P('Par défaut, chaque commande et chaque écriture de fichier demande une confirmation. Le mode autonome les supprime :'), CODE('bash', 'claude --dangerously-skip-permissions'), AVIS('**Réservé à un environnement isolé** (conteneur, machine virtuelle jetable, sans accès aux identifiants de production). Le mode autonome exécute sans confirmation tout ce que le modèle décide.', 'danger')]),
        S('Précautions', '', [LI('Ne jamais lancer le mode autonome dans un répertoire contenant des secrets non versionnés.', 'Travailler sur une branche dédiée et relire le diff avant toute fusion.', 'Limiter la session avec `--max-turns` lorsque la tâche est bornée.')]),
        S('Références', '', [LI('Documentation officielle Claude Code — installation et prise en main.', 'Fiche interne « Mode autonome — Bonnes pratiques » (relation « complète »).', 'Incident « PATH Linux » (relation « corrige »).')]),
        S('Purge', '', [P('Pour retirer complètement l\'outil et sa configuration :'), CODE('bash', 'rm -rf ~/.local/bin/claude ~/.claude ~/.claude.json')])
      ] },
      operationnel: { verifiee: '2026-08-14', validite: 21, par: 'Alexandre Berge', sections: [
        S('Préparer la machine', '', [ETAPES('Vérifier `uname -m` → `x86_64` ou `aarch64`.', 'Installer `curl` si absent.')]),
        S('Installer', '', [CODE('bash', 'curl -fsSL https://claude.ai/install.sh | bash'), ETAPES('Attendre la fin du téléchargement du binaire.', 'Ouvrir un nouveau terminal.')]),
        S('Corriger le PATH si besoin', '', [ETAPES('Si `claude: command not found` : ajouter `~/.local/bin` au PATH dans `~/.bashrc`.', 'Recharger le shell puis `claude --version`.')]),
        S('Authentifier', '', [ETAPES('Lancer `claude` dans le projet.', 'Se connecter dans le navigateur avec le compte Anthropic.', 'Autoriser le répertoire courant.')]),
        S('Mode autonome', 'environnement isolé uniquement', [AVIS('**Point de vigilance** — n\'activer le mode autonome que dans un conteneur ou une VM jetable.', 'danger'), ETAPES('Créer une branche dédiée.', 'Lancer `claude --dangerously-skip-permissions`.', 'Relire le diff complet avant fusion.')])
      ] }
    },
    evenements: [
      { date: '2026-09-04', registre: 'operationnel', type: 'etat', etat: 'averifier', titre: 'Passage automatique à « À vérifier »', detail: 'Échéance de la vérification du 14 août atteinte (validité : 21 jours).' },
      { date: '2026-09-01', registre: 'reference', type: 'version', version: 'v1.0.0 · révision de forme', titre: 'Contenu modifié par Alexandre Berge', detail: 'Reformulation de la section 03 (Incident connu). Aucun changement de fond, version conservée.', avant: 'Ajouter le chemin au PATH puis recharger le shell.', apres: 'Le binaire est présent mais le shell ne connaît pas son répertoire. Ajouter ~/.local/bin au PATH de façon persistante.' },
      { date: '2026-08-14', registre: 'operationnel', type: 'verif', etat: 'ajour', titre: 'Version opérationnelle créée et vérifiée', detail: 'Dérivée de la référence par Alexandre Berge. Durée de validité : 21 jours (échéance le 4 septembre).' },
      { date: '2026-08-13', registre: 'reference', type: 'verif', etat: 'ajour', titre: 'Vérifiée par Alexandre Berge', detail: 'Durée de validité : 90 jours. Échéance le 11 novembre 2026.' },
      { date: '2026-08-13', registre: 'reference', type: 'version', version: 'v1.0.0', titre: 'Création de la note', detail: 'Rédigée par Alexandre Berge dans Claude › audit_code.', avant: '—', apres: 'Première version : 8 sections, 6 blocs de code.' }
    ]
  },
  pg: {
    id: 'pg', titre: 'Restaurer une sauvegarde PostgreSQL',
    slug: 'n-restaurer-une-sauvegarde-postgresql', univers: 'Infrastructure', domaine: 'Sauvegardes', voisines: '2 autres notes dans ce dossier',
    etiquettes: ['postgresql', 'sauvegarde', 'astreinte', 'restauration'],
    creee: '2026-01-12', auteur: 'k.belhadj', modifie: 'le 10 mars 2026 par k.belhadj', consultations: 412, consult30: 17, version: 'v1.2.0',
    relations: 4, pieces: 2, retroliens: 3,
    resume: 'Cette procédure couvre la restauration d\'une base PostgreSQL depuis les sauvegardes gérées sur le serveur de sauvegarde. Elle couvre la restauration complète et la restauration à un instant donné. Elle ne couvre pas la bascule d\'un réplica en primaire, traitée séparément.',
    registres: {
      reference: { verifiee: '2026-05-17', validite: 90, par: 'k.belhadj', sections: [
        S('Avant de commencer', 'prérequis et fenêtre', [LI('Un accès d\'administration sur le serveur de sauvegarde et sur le serveur cible.', 'La clé du compte de sauvegarde déployée vers la cible.', 'L\'espace disque disponible sur la cible : au moins **1,4 fois** la taille de la sauvegarde.'), AVIS('**ATTENTION — la base cible est arrêtée pendant toute la restauration.** Comptez 40 minutes pour une base de 120 Go sur disque local. Prévenez l\'astreinte applicative avant de démarrer et déclarez la fenêtre au comité des changements si l\'intervention n\'est pas un rétablissement.', 'danger')]),
        S('Choisir la sauvegarde', '', [P('Les sauvegardes sont listées de la plus récente à la plus ancienne. Recoupez toujours l\'identifiant obtenu avec le tableau de suivi tenu par l\'exploitation : une sauvegarde valide au sens de l\'outil peut porter des données déjà corrompues si l\'incident est antérieur.'), TAB(['Identifiant', 'Date', 'Type', 'Taille', 'Rétention'], ['20260310T020112', '10 mars 2026, 02:01', 'Complète', '118 Go', '30 jours'], ['20260303T020108', '3 mars 2026, 02:01', 'Complète', '117 Go', '30 jours'], ['20260224T020115', '24 février 2026, 02:01', 'Complète', '116 Go', '30 jours'])]),
        S('Les deux modes', '', [P('**Restauration complète** — on revient à l\'état de la sauvegarde. C\'est le mode du remplacement de matériel ou de la reconstruction d\'un environnement.'), P('**Restauration à un instant donné** — on rejoue les journaux de transaction jusqu\'à un horodatage choisi. C\'est le mode de la suppression accidentelle : on revient à la seconde qui précède l\'erreur.')]),
        S('Après la restauration', '', [P('Une restauration n\'est pas finie quand la base démarre. Elle est finie quand une **requête témoin** rend le résultat attendu et que l\'application se reconnecte. Le compte rendu d\'intervention porte les deux, plus la durée réelle — c\'est ce chiffre qui alimente la politique de sauvegarde.')])
      ] },
      operationnelLatent: { validite: 30, sections: [
        S('Arrêter le service sur la cible', '', [ETAPES('Prévenir l\'astreinte applicative.', 'Arrêter le service de base de données sur le serveur cible.', 'Vérifier qu\'aucune connexion ne subsiste.'), AVIS('**POINT DE NON-RETOUR** — au-delà de cette étape, la base cible est écrasée.', 'danger')]),
        S('Transférer la sauvegarde', '', [ETAPES('Se connecter au serveur de sauvegarde avec le compte dédié.', 'Lancer la restauration vers la cible, en précisant l\'identifiant relevé.', 'Surveiller le transfert : il occupe la bande passante du lien de secours.')]),
        S('Rejouer les journaux', '', [ETAPES('Laisser l\'outil rejouer les journaux jusqu\'à la fin de la sauvegarde.', 'Pour une restauration à un instant donné, préciser l\'horodatage cible **dans le fuseau du serveur de bases**, pas dans le vôtre.')]),
        S('Vérifier', '', [ETAPES('Démarrer le service.', 'Exécuter la requête témoin et comparer au résultat attendu.', 'Vérifier la reconnexion applicative.', 'Relever la durée réelle et la consigner au compte rendu.')]),
        S('En cas d\'échec', '', [P('Si le rejeu s\'interrompt, ne relancez pas la restauration sur la même cible : le répertoire est dans un état intermédiaire. Repartez d\'un répertoire vide, et signalez l\'incident — un rejeu qui échoue met en cause la sauvegarde elle-même, donc toutes les autres.')])
      ] }
    },
    evenements: [
      { date: '2026-08-29', registre: 'reference', type: 'etat', etat: 'arevoir', titre: 'Passage automatique à « À revoir »', detail: '14 jours après l\'échéance sans nouvelle vérification.' },
      { date: '2026-08-15', registre: 'reference', type: 'etat', etat: 'averifier', titre: 'Passage automatique à « À vérifier »', detail: 'Échéance de la vérification du 17 mai atteinte (validité : 90 jours).' },
      { date: '2026-05-17', registre: 'reference', type: 'verif', etat: 'ajour', titre: 'Vérifiée par k.belhadj', detail: 'Durée de validité : 90 jours. Échéance le 15 août 2026.' },
      { date: '2026-03-10', registre: 'reference', type: 'version', version: 'v1.2.0', titre: 'Contenu modifié par k.belhadj', detail: 'Mise à jour du tableau des sauvegardes disponibles.', avant: '20260217T020101 · 17 février 2026 · Complète · 115 Go', apres: '20260310T020112 · 10 mars 2026 · Complète · 118 Go' },
      { date: '2026-02-24', registre: 'reference', type: 'verif', etat: 'ajour', titre: 'Vérifiée par k.belhadj', detail: 'Durée de validité : 90 jours.' },
      { date: '2026-01-12', registre: 'reference', type: 'version', version: 'v1.0.0', titre: 'Création de la note', detail: 'Rédigée par k.belhadj dans Infrastructure › Sauvegardes.', avant: '—', apres: 'Première version : 4 sections, 1 tableau.' }
    ]
  }
};

const IC_UNIVERS = {
  Claude: 'M8 1.5v13M1.5 8h13M3.4 3.4l9.2 9.2M12.6 3.4L3.4 12.6',
  Candidature: 'M2 5.5h12v8H2zM5.5 5.5V3.5h5v2M2 9h12',
  'Business Analysis': 'M2 14h12M4 11V7M8 11V4M12 11V9',
  Substack: 'M2.5 3h11M2.5 6.5h11M2.5 10h11v4h-11z',
  Agents: 'M8 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM3 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM13 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 5L4 11M9 5l3 6M5 13h6',
  Infrastructure: 'M2 2.5h12v4H2zM2 9.5h12v4H2zM4.5 4.5h.01M4.5 11.5h.01'
};
/* Répartition par état, dans l'ordre ajour / bientot / averifier / arevoir / obsolete. */
const REPARTITION = { Claude: [20, 2, 1, 1, 0], Candidature: [15, 2, 1, 0, 0], 'Business Analysis': [11, 1, 0, 0, 0], Substack: [7, 0, 1, 0, 0], Agents: [6, 0, 0, 0, 0], Infrastructure: [6, 1, 0, 1, 1] };
const RECEMMENT = [['claude', 'Note technique – Installation de Claude Code sous Linux', 'il y a 12 min', 'ajour'], [null, 'Mode autonome – Bonnes pratiques', 'il y a 1 h', 'ajour'], [null, 'Prompt – Architecture LLM', 'il y a 3 h', 'bientot'], ['pg', 'Restaurer une sauvegarde PostgreSQL', 'il y a 5 h', 'arevoir'], [null, 'Workflow – Analyse IA', 'il y a 7 h', 'ajour']];
const PLUS_CONSULTEES = [['pg', 'Restaurer une sauvegarde PostgreSQL', '412 consultations', 'arevoir'], [null, 'Workflow – Analyse IA', '142 consultations', 'ajour'], [null, 'Prompt – Architecture LLM', '118 consultations', 'bientot'], [null, 'Mode autonome – Bonnes pratiques', '94 consultations', 'ajour'], [null, 'Politique de sauvegarde', '87 consultations', 'averifier']];
const DESCRIPTIONS = {
  Claude: 'Notes techniques, prompts et harnais autour de Claude et de Claude Code : installation, audit de code, bonnes pratiques d\'autonomie.',
  Candidature: 'CV, lettres et préparation d\'entretiens. Chaque pièce est datée et revérifiée avant envoi.',
  'Business Analysis': 'Cadrages, ateliers et livrables d\'analyse. Les connaissances méthodologiques de référence.',
  Substack: 'Veille, connaissance et production autour de l\'écosystème Substack.',
  Agents: 'Orchestration d\'agents : patrons, garde-fous et retours d\'expérience.',
  Infrastructure: 'Exploitation, sauvegardes et réseau. Les procédures que l\'astreinte doit pouvoir suivre les yeux fermés.'
};
const DESC_DOMAINES = {
  audit_code: 'Audits, incidents et procédures autour de Claude Code.', prompts: 'Prompts utilisés dans l\'univers.', harnais: 'Bancs d\'évaluation et harnais LLM.',
  CV: 'Versions datées du CV.', Lettres: 'Lettres de motivation et relances.', Entretiens: 'Préparation et comptes rendus d\'entretiens.',
  Cadrage: 'Notes de cadrage et périmètres.', Ateliers: 'Supports et restitutions d\'ateliers.', Brouillons: 'Articles en cours d\'écriture.', 'Publiés': 'Articles publiés et leurs sources.',
  Orchestration: 'Patrons d\'orchestration et garde-fous.', Sauvegardes: 'Politique, procédures et fiches de sauvegarde.', 'Réseau': 'Équipements, bascules et incidents réseau.'
};
const IC_DOMAINE = 'M1.5 4.5h4l1.5 1.5h7.5v7.5h-13z';
const IC_DOSSIER = 'M1.5 4.5h4l1.5 1.5h7.5v7.5h-13zM1.5 8h13';
const IC_NOTE = 'M4 2.5h6l2.5 2.5v8.5H4zM6 8h4M6 10.5h4';
/* Univers → domaines → dossiers / notes. `note` référence une note du prototype. */
const ARBRE = [
  { nom: 'Claude', n: 24, enfants: [
    { nom: 'audit_code', n: 9, enfants: [
      { nom: 'Note technique – Installation de Claude Code', note: 'claude' },
      { nom: 'Incident – PATH Linux' }, { nom: 'Mode autonome – Bonnes pratiques' }, { nom: 'Workflow – Analyse IA' },
      { nom: 'archives', dossier: true, enfants: [{ nom: 'Ancienne procédure npm' }] }
    ] },
    { nom: 'prompts', n: 11, enfants: [{ nom: 'Prompt – Architecture LLM' }, { nom: 'Prompt – Revue de code' }] },
    { nom: 'harnais', n: 4, enfants: [{ nom: 'Harnais d\'évaluation' }] }
  ] },
  { nom: 'Candidature', n: 18, enfants: [{ nom: 'CV', n: 6, enfants: [] }, { nom: 'Lettres', n: 8, enfants: [] }, { nom: 'Entretiens', n: 4, enfants: [] }] },
  { nom: 'Business Analysis', n: 12, enfants: [{ nom: 'Cadrage', n: 7, enfants: [] }, { nom: 'Ateliers', n: 5, enfants: [] }] },
  { nom: 'Substack', n: 8, enfants: [{ nom: 'Brouillons', n: 5, enfants: [] }, { nom: 'Publiés', n: 3, enfants: [] }] },
  { nom: 'Agents', n: 6, enfants: [{ nom: 'Orchestration', n: 6, enfants: [] }] },
  { nom: 'Infrastructure', n: 9, enfants: [
    { nom: 'Sauvegardes', n: 3, enfants: [
      { nom: 'Exploitation', dossier: true, enfants: [{ nom: 'Restaurer une sauvegarde PostgreSQL', note: 'pg' }, { nom: 'Politique de sauvegarde' }] },
      { nom: 'Fiche BKP-01' }
    ] },
    { nom: 'Réseau', n: 6, enfants: [] }
  ] }
];
const RECENTS = [['claude', 'Note technique – Installation de Claude Code'], ['pg', 'Restaurer une sauvegarde PostgreSQL'], [null, 'Prompt – Architecture LLM'], [null, 'Workflow – Analyse IA'], [null, 'Mode autonome – Bonnes pratiques']];
const ICONES = {
  cal: 'M4 5h16v15H4zM4 10h16M8 3v4M16 3v4', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  eye: 'M3 12c2.5-4.5 6-6.5 9-6.5s6.5 2 9 6.5c-2.5 4.5-6 6.5-9 6.5s-6.5-2-9-6.5zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', tag: 'M3 3h8l10 10-8 8L3 11zM7.5 7.5h.01',
  crayon: 'M11 2.5l2.5 2.5L5 13.5H2.5V11z', horloge: 'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM8 4.5V8l2.5 1.5', export: 'M8 2v8M5 7l3 3 3-3M2.5 12.5h11',
  imprimer: 'M4.5 6V2.5h7V6M4.5 12H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1.5M4.5 10h7v3.5h-7z', supprimer: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8'
};

class Component extends DCLogic {
  state = { vue: null, noteId: 'claude', registre: 'reference', menu: false, actif: 0, verifs: {}, revisions: {}, opCree: {}, ajoutes: {}, diffs: {}, filtre: 'tous', largeur: 1440, toast: '', copie: '', tiroir: null, ouverts: { 'Claude': true, 'Claude/audit_code': true, 'Infrastructure': true, 'Infrastructure/Sauvegardes': true, 'Infrastructure/Sauvegardes/Exploitation': true } };

  ouvrirUnivers(nom) { this.setState(s => ({ vue: 'univers', universNom: nom, menu: false, tiroir: null, ouverts: { ...s.ouverts, [nom]: true } })); }

  pageUnivers(nom, CLES) {
    const u = ARBRE.find(x => x.nom === nom) || ARBRE[0];
    const rep = REPARTITION[u.nom]; const total = rep.reduce((a, b) => a + b, 0);
    /* Les états hors « à jour » sont portés par les premiers domaines, à hauteur de leur effectif. */
    let reste = rep.slice(1);
    const domaines = u.enfants.map((dm, i) => {
      const n = dm.n || 0; let r = [0, 0, 0, 0, 0]; let pris = 0;
      reste = reste.map((c, k) => { const p = Math.min(c, n - pris); r[k + 1] = p; pris += p; return c - p; });
      r[0] = n - pris;
      const feuilles = (dm.enfants || []).flatMap(e => e.enfants ? e.enfants : [e]);
      const derniers = ['il y a 2 h', 'il y a 1 j', 'il y a 3 j', 'il y a 6 j', 'il y a 12 j'];
      /* Trois colonnes d'état sur la ligne : à jour, bientôt, puis tout ce qui est en retard (à vérifier + à revoir + obsolète). */
      const retard = r[2] + r[3] + r[4];
      const colonnes = [[r[0], 'ajour'], [r[1], 'bientot'], [retard, r[3] + r[4] ? 'arevoir' : 'averifier']];
      return {
        nom: dm.nom, description: DESC_DOMAINES[dm.nom] || '', n, unite: n > 1 ? 'notes' : 'note', vide: n === 0,
        icone: i % 3 === 0 ? IC_NOTE : i % 3 === 1 ? 'M2 3h12v10H2zM4.5 6.5l2 1.5-2 1.5M8 9.5h3' : 'M2.5 8c1.5-3 3.5-4.5 5.5-4.5S12 5 13.5 8c-1.5 3-3.5 4.5-5.5 4.5S4 11 2.5 8zM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
        dernier: n ? derniers[i % derniers.length] : '—',
        compteurs: colonnes.map(([c, k]) => ({ n: n ? c : '—', couleur: n ? ETATS[k].couleur : '#c9d0cc', path: ETATS[k].path, encre: !n ? '#93a2a6' : c && k !== 'ajour' ? ETATS[k].couleur : c ? '#16222b' : '#93a2a6' })),
        feuilles, r, dossiers: (dm.enfants || []).filter(e => e.dossier).length,
        onClick: () => this.ouvrirDomaine(u.nom, dm.nom)
      };
    });
    /* type, badge, couleur du disque, icône blanche */
    const IC_CRAYON = 'M11 2.5l2.5 2.5L5 13.5H2.5V11z', IC_COCHE = 'M3 8.5l3.5 3.5L13 4.5', IC_IMPORT = 'M8 2v8M5 7l3 3 3-3M2.5 13h11', IC_PLUS = 'M8 3v10M3 8h10';
    const types = [['Note vérifiée', 'Vérification', '#1d6b4a', IC_COCHE], ['Note modifiée', 'Note', '#1f5a3c', IC_CRAYON], ['Nouvelle note', 'Note', '#1f5a3c', IC_PLUS], ['Échéance atteinte', 'Vivacité', '#8f5c00', 'M8 4.5V8l2.5 1.5'], ['Import terminé', 'Import', '#46585f', IC_IMPORT]];
    const quands = ['il y a 2 h', 'il y a 12 h', 'il y a 1 j', 'il y a 2 j', 'il y a 4 j'];
    const brut = domaines.flatMap(dm => dm.feuilles.map(f => ({ objet: f.nom, domaine: dm.nom }))).slice(0, 5);
    if (!brut.length) brut.push({ objet: `${total} notes ajoutées depuis Fichiers déposés`, domaine: u.enfants[0] ? u.enfants[0].nom : '', import: true });
    const activite = brut.map((a, i) => { const t = a.import ? types[4] : types[i % 4]; return { ...a, type: t[0], badge: t[1], couleur: t[2], icone: t[3], par: 'Alexandre Berge', quand: quands[i], fil: i < brut.length - 1 ? 'block' : 'none' }; });
    const attention = rep[2] + rep[3] + rep[4];
    const alertes = [];
    if (attention) alertes.push({ n: attention, titre: attention > 1 ? 'notes nécessitent votre attention' : 'note nécessite votre attention', detail: 'Leur période de validité est dépassée', ...ETATS[rep[3] + rep[4] ? 'arevoir' : 'averifier'] });
    if (rep[1]) alertes.push({ n: rep[1], titre: rep[1] > 1 ? 'notes arrivent bientôt à échéance' : 'note arrive bientôt à échéance', detail: `Vérification prévue dans les ${this.props.seuilBientot ?? 10} prochains jours`, ...ETATS.bientot });
    return {
      nom: u.nom, icone: IC_UNIVERS[u.nom], description: DESCRIPTIONS[u.nom] || '', total,
      stats: [{ n: total, lib: 'notes', icone: IC_NOTE }, { n: u.enfants.length, lib: u.enfants.length > 1 ? 'domaines' : 'domaine', icone: IC_DOMAINE }, { n: 1, lib: 'contributeur', icone: 'M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.5 14.5a5.5 5.5 0 0 1 11 0' }, { n: activite[0].quand, lib: 'dernière activité', icone: 'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM8 4.5V8l2.5 1.5' }],
      compteurs: rep.map((c, k) => ({ n: c, lib: ETATS[CLES[k]].lib.toLowerCase(), couleur: ETATS[CLES[k]].couleur, path: ETATS[CLES[k]].path })).filter(c => c.n),
      domaines, activite, alertes, calme: alertes.length === 0, nbDomaines: pl(u.enfants.length, 'domaine'), types, quands
    };
  }

  ouvrirDomaine(univers, domaine) { this.setState(s => ({ vue: 'domaine', universNom: univers, domaineNom: domaine, menu: false, tiroir: null, ouverts: { ...s.ouverts, [univers]: true, [univers + '/' + domaine]: true } })); }

  pageDomaine(uni, CLES) {
    const dm = uni.domaines.find(x => x.nom === this.state.domaineNom) || uni.domaines[0];
    const r = dm.r; const n = dm.n;
    const attention = r[2] + r[3] + r[4];
    /* Les états se posent sur les premières notes listées : retard d'abord, puis bientôt, puis à jour. */
    /* Une note réelle du prototype porte son vrai état ; les états synthétiques restants vont aux autres feuilles. */
    const reel = f => { if (!f.note) return null; const N = NOTES[f.note]; const reg = N.registres.reference; const cle = f.note + ':reference'; return this.etatDe(this.state.verifs[cle] || reg.verifiee, reg.validite, this.state.revisions[cle]).cle; };
    const restants = { ajour: r[0], bientot: r[1], averifier: r[2], arevoir: r[3], obsolete: r[4] };
    const feuilles = dm.feuilles.slice(0, 5);
    feuilles.forEach(f => { const k = reel(f); if (k && restants[k] > 0) restants[k]--; });
    const etatsNotes = []; ['obsolete', 'arevoir', 'averifier', 'bientot', 'ajour'].forEach(k => { for (let i = 0; i < restants[k]; i++) etatsNotes.push(k); });
    let curseur = 0;
    const vues = [5, 3, 3, 3, 2];
    const notes = feuilles.map((f, i) => { const k = reel(f) || etatsNotes[curseur++] || 'ajour'; return { num: String(i + 1).padStart(2, '0'), titre: f.nom, etat: ETATS[k].lib, couleur: ETATS[k].couleur, path: ETATS[k].path, vues: pl(vues[i], 'vue'), onClick: () => { if (f.note) this.setState({ noteId: f.note, registre: 'reference', vue: 'note', actif: 0, menu: false }); } }; });
    const alertes = [];
    if (attention) alertes.push({ n: attention, titre: attention > 1 ? 'notes nécessitent votre attention' : 'note nécessite votre attention', detail: notes.find(x => x.etat !== 'À jour' && x.etat !== 'Bientôt à vérifier') ? notes.find(x => x.etat !== 'À jour' && x.etat !== 'Bientôt à vérifier').titre : 'Leur période de validité est dépassée', ...ETATS[r[3] + r[4] ? 'arevoir' : 'averifier'] });
    if (r[1]) alertes.push({ n: r[1], titre: r[1] > 1 ? 'notes arrivent bientôt à échéance' : 'note arrive bientôt à échéance', detail: `Vérification prévue dans les ${this.props.seuilBientot ?? 10} prochains jours`, ...ETATS.bientot });
    const activite = dm.feuilles.slice(0, 5).map((f, i) => { const t = uni.types[i % 4]; return { objet: f.nom, type: t[0], badge: t[1], couleur: t[2], icone: t[3], par: 'Alexandre Berge', quand: uni.quands[i], fil: i < Math.min(dm.feuilles.length, 5) - 1 ? 'block' : 'none' }; });
    if (!activite.length) activite.push({ objet: dm.nom, type: 'Domaine créé', badge: 'Domaine', couleur: '#46585f', icone: 'M8 3v10M3 8h10', par: 'Alexandre Berge', quand: 'il y a 3 mois', fil: 'none' });
    return {
      nom: dm.nom, univers: uni.nom, description: dm.description, total: n, totalLib: n > 1 ? 'notes au total' : 'note au total', vide: n === 0,
      ouvrirUnivers: () => this.ouvrirUnivers(uni.nom),
      stats: [{ n, lib: n > 1 ? 'notes' : 'note', icone: IC_NOTE }, { n: 1, lib: 'contributeur', icone: 'M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.5 14.5a5.5 5.5 0 0 1 11 0' }, { n: activite[0].quand, lib: 'dernière activité', icone: 'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM8 4.5V8l2.5 1.5' }],
      compteurs: [[r[0], 'ajour'], [r[1], 'bientot'], [r[2], 'averifier'], [r[3], 'arevoir'], [r[4], 'obsolete']].filter(([c, k], i) => i < 2 || c).map(([c, k]) => ({ n: c, lib: ETATS[k].lib, couleur: c ? ETATS[k].couleur : '#c9d0cc', path: ETATS[k].path })),
      contenu: [{ lib: 'Notes', n, icone: IC_NOTE, barre: n ? '#1f5a3c' : '#e3e6e1' }, { lib: 'Dossiers', n: dm.dossiers, icone: IC_DOSSIER, barre: dm.dossiers ? '#9aa7a3' : '#e3e6e1' }, { lib: 'Fiches', n: 0, icone: 'M2 3h12v10H2zM2 6.5h12M6 6.5V13', barre: '#e3e6e1' }, { lib: 'Signets', n: 0, icone: 'M4 2h8v12l-4-3-4 3z', barre: '#e3e6e1' }],
      alertes, calme: alertes.length === 0, notes, activite
    };
  }

  arbre(note) {
    const rows = []; const ouverts = this.state.ouverts;
    const visite = (n, chemin, depth) => {
      const cle = chemin ? chemin + '/' + n.nom : n.nom;
      const type = depth === 0 ? 'univers' : n.note || (!n.enfants && !n.dossier) ? 'note' : n.dossier ? 'dossier' : 'domaine';
      const aEnfants = !!(n.enfants && n.enfants.length);
      const ouvert = !!ouverts[cle];
      const vue = this.state.vue || this.props.vue || 'accueil';
      const actif = vue === 'univers' ? (type === 'univers' && n.nom === this.state.universNom) : vue === 'domaine' ? (type === 'domaine' && n.nom === this.state.domaineNom && chemin === this.state.universNom) : vue === 'accueil' ? false : type === 'note' ? n.note === note.id : type === 'univers' ? n.nom === note.univers : type === 'domaine' && n.nom === note.domaine && chemin === note.univers;
      rows.push({
        cle, nom: n.nom, n: n.n || '', depth, pad: (depth * 14) + 'px', hauteur: depth === 0 ? '38px' : '32px', taille: depth === 0 ? '15px' : '13.5px',
        icone: type === 'univers' ? IC_UNIVERS[n.nom] : type === 'domaine' ? IC_DOMAINE : type === 'dossier' ? IC_DOSSIER : IC_NOTE,
        chevron: aEnfants ? 'visible' : 'hidden', rotation: ouvert ? 'rotate(90deg)' : 'rotate(0deg)',
        bg: actif && (type === 'note' || vue === 'univers' || vue === 'domaine') ? '#e9e8e1' : 'transparent', couleur: actif ? '#1f5a3c' : type === 'note' ? '#46585f' : '#16222b', poids: actif ? 600 : type === 'univers' ? 500 : 400,
        onToggle: () => this.setState(s => ({ ouverts: { ...s.ouverts, [cle]: !s.ouverts[cle] } })),
        onClick: () => { if (n.note) this.setState({ noteId: n.note, registre: 'reference', vue: 'note', actif: 0, menu: false, tiroir: null }); else if (type === 'univers') this.ouvrirUnivers(n.nom); else if (type === 'domaine') this.ouvrirDomaine(chemin, n.nom); else if (aEnfants) this.setState(s => ({ ouverts: { ...s.ouverts, [cle]: !s.ouverts[cle] } })); }
      });
      if (aEnfants && ouvert) n.enfants.forEach(e => visite(e, cle, depth + 1));
    };
    ARBRE.forEach(u => visite(u, '', 0));
    return rows;
  }
  refCentre = React.createRef();

  componentDidMount() {
    /* Adresse directe d'une vue : #vue=note&note=pg&registre=operationnel&univers=Claude&domaine=audit_code&largeur=1600 */
    const p = new URLSearchParams((location.hash || '').replace(/^#/, ''));
    if (p.get('vue')) {
      const s = { vue: p.get('vue') };
      if (p.get('note')) s.noteId = p.get('note');
      if (p.get('registre')) s.registre = p.get('registre');
      if (p.get('univers')) s.universNom = p.get('univers');
      if (p.get('domaine')) s.domaineNom = p.get('domaine');
      if (p.get('largeur')) { this.largeurForcee = +p.get('largeur'); s.largeur = this.largeurForcee; }
      this.setState(s);
    }
    this.onResize = () => this.setState({ largeur: this.largeurForcee || window.innerWidth });
    if (!this.largeurForcee) this.onResize(); window.addEventListener('resize', this.onResize);
    const el = this.refCentre.current;
    if (el) { this.onScroll = () => this.majActif(); el.addEventListener('scroll', this.onScroll, { passive: true }); }
  }
  componentWillUnmount() { window.removeEventListener('resize', this.onResize); const el = this.refCentre.current; if (el && this.onScroll) el.removeEventListener('scroll', this.onScroll); clearTimeout(this.tToast); }

  majActif() {
    const el = this.refCentre.current; if (!el) return;
    const secs = el.querySelectorAll('section[id^="sec-"]'); let actif = 0;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top - el.getBoundingClientRect().top < 140) actif = i; });
    if (actif !== this.state.actif) this.setState({ actif });
  }
  aller(i) {
    const el = this.refCentre.current; const s = el && el.querySelector('#sec-' + i);
    if (s) el.scrollTo({ top: s.offsetTop - 90, behavior: 'smooth' });
  }
  dire(toast) { clearTimeout(this.tToast); this.setState({ toast }); this.tToast = setTimeout(() => this.setState({ toast: '' }), 2600); }

  cle() { return this.state.noteId + ':' + this.state.registre; }
  registreCourant(note) {
    const r = this.state.registre;
    if (r === 'operationnel' && !note.registres.operationnel && this.state.opCree[note.id]) return { ...note.registres.operationnelLatent, verifiee: iso(TODAY), par: 'Alexandre Berge' };
    return note.registres[r] || note.registres.reference;
  }
  etatDe(verifiee, validite, revision) {
    const seuil = this.props.seuilBientot ?? 10;
    const force = this.props.forcerEtat;
    const v = d(verifiee); const e = new Date(v.getTime() + validite * J); const reste = jours(TODAY, e);
    let cle = reste > seuil ? 'ajour' : reste >= 0 ? 'bientot' : reste > -14 ? 'averifier' : reste > -90 ? 'arevoir' : 'obsolete';
    if (revision) cle = 'arevoir';
    if (force && force !== 'auto') cle = force;
    return { cle, v, e, reste };
  }
  ligneViv(x, verifieePar, revision) {
    const E = ETATS[x.cle]; const { v, e, reste } = x;
    const ligneEcheance = reste > 0 ? `Prochaine vérification : ${fmtC(e)} (dans ${pl(reste, 'jour')})` : reste === 0 ? `Échéance aujourd'hui : ${fmtC(e)}` : `Échéance dépassée de ${pl(-reste, 'jour')} (${fmtC(e)})`;
    const rappel = reste >= 0 ? `Cette note repassera automatiquement à « À vérifier » le ${fmtC(e)}.` : x.cle === 'obsolete' ? `Échéance dépassée depuis le ${fmtC(e)}. Une nouvelle vérification relancera le cycle.` : `En attente de vérification depuis le ${fmtC(e)}. Passage à « ${reste > -14 ? 'À revoir' : 'Obsolète'} » ${reste > -14 ? 'le ' + fmtC(new Date(e.getTime() + 14 * J)) : 'le ' + fmtC(new Date(e.getTime() + 90 * J))}.`;
    const total = e - v; const pctA = Math.max(0, Math.min(1, (TODAY - v) / total));
    return {
      ...E, ligneVerif: `Vérifiée le ${fmtL(v)}${verifieePar ? ' par ' + verifieePar : ''}`, ligneEcheance,
      couleurEcheance: E.attention >= 2 ? E.couleur : '#536066', poidsEcheance: E.attention >= 2 ? 600 : 400,
      fondLigne: E.attention >= 3 ? E.voile : E.attention === 2 ? 'rgba(143,92,0,.06)' : 'transparent',
      rappel, revision: !!revision, revisionPar: revision || '',
      pctEcoule: (pctA * 100).toFixed(1) + '%', pctAujourdhui: (pctA * 100).toFixed(1) + '%', couleurEcheanceRond: reste < 0 ? E.couleur : '#b8c2bd',
      verifieeCourt: fmtC(v), echeanceCourt: fmtC(e), aujourdhuiRel: reste >= 0 ? `J−${reste}` : `J+${-reste}`,
      compact: reste >= 0 ? `dans ${reste} j` : `${-reste} j de retard`
    };
  }

  renderVals() {
    const st = this.state; const vue = st.vue || this.props.vue || 'accueil';
    const note = NOTES[st.noteId];
    const reg = this.registreCourant(note);
    const aOp = !!(note.registres.operationnel || st.opCree[note.id]);
    const cle = this.cle();
    const verifiee = st.verifs[cle] || reg.verifiee; const par = st.verifs[cle] ? 'Alexandre Berge' : reg.par;
    const x = this.etatDe(verifiee, reg.validite, st.revisions[cle]);
    const viv = this.ligneViv(x, par, st.revisions[cle]);

    const sections = reg.sections.map((s, i) => ({
      ...s, id: 'sec-' + i, num: String(i + 1).padStart(2, '0'), aComplement: !!s.complement,
      blocs: s.blocs.map((b, k) => {
        const id = cle + i + ':' + k;
        const o = { ...b, estP: b.type === 'p', estCode: b.type === 'code', estListe: b.type === 'liste', estEtapes: b.type === 'etapes', estAvis: b.type === 'avis', estTableau: b.type === 'tableau', estSchema: b.type === 'schema' };
        if (o.estCode) { o.libCopier = st.copie === id ? 'Copié' : 'Copier'; o.copier = () => { try { navigator.clipboard.writeText(b.lignes.map(l => l.t).join('\n')); } catch (e) {} this.setState({ copie: id }); setTimeout(() => this.setState({ copie: '' }), 1600); }; }
        if (o.estAvis) { const danger = b.niveau === 'danger'; o.fond = danger ? '#f7e7e3' : '#eef3ef'; o.encre = danger ? '#7a2a1c' : '#2d4a3a'; o.marque = danger ? '!' : 'i'; }
        return o;
      })
    }));
    const sommaire = sections.map((s, i) => ({ num: s.num, titre: s.titre, sous: s.sous, onClick: () => this.aller(i), barre: i === st.actif ? '#1f5a3c' : 'transparent', couleur: i === st.actif ? '#1f5a3c' : '#536066', poids: i === st.actif ? 600 : 400 }));

    const tab = (actif) => ({ barre: actif ? '#1f5a3c' : 'transparent', couleur: actif ? '#1f5a3c' : '#46585f', poids: actif ? 600 : 400, bg: actif ? '#f5f4ef' : 'transparent' });
    const l = st.largeur; const droiteRepliee = l < 1180; const gaucheRepliee = l < 1024;
    const montrerDroite = vue === 'note' && (!droiteRepliee || st.tiroir === 'droite');
    const montrerGauche = !gaucheRepliee || st.tiroir === 'gauche';
    const montrerSommaire = l >= 1380 && vue === 'note';
    const gridCols = (gaucheRepliee ? '' : '300px ') + 'minmax(0,1fr)' + (!droiteRepliee && vue === 'note' ? ' 340px' : '');
    const tiroir = 'position:absolute;top:0;bottom:0;z-index:40;width:min(340px,86vw);box-shadow:0 6px 20px -4px rgba(22,34,43,.18),0 2px 6px rgba(22,34,43,.08);animation:monte 180ms both';
    const styleGauche = gaucheRepliee ? tiroir + ';left:0' : '';
    const styleDroite = droiteRepliee ? tiroir + ';right:0' : '';

    const arbre = this.arbre(note);
    const recents = RECENTS.map(([id, titre]) => { const actif = id === note.id && vue === 'note'; return { titre, bg: actif ? '#e9e8e1' : 'transparent', couleur: actif ? '#1f5a3c' : '#16222b', poids: actif ? 600 : 400, onClick: () => { if (id) this.setState({ noteId: id, registre: 'reference', vue: 'note', actif: 0, menu: false }); } }; });

    const metas = [
      { icone: ICONES.cal, valeur: fmtL(d(note.creee)), libelle: 'Date de création' },
      { icone: ICONES.user, valeur: note.auteur, libelle: 'Rédacteur' },
      { icone: ICONES.eye, valeur: pl(note.consultations, 'consultation'), libelle: `${note.consult30} sur les 30 derniers jours` },
      { icone: ICONES.tag, valeur: 'Version', libelle: note.version }
    ];

    const marquerVerifie = () => { this.setState(s => ({ verifs: { ...s.verifs, [cle]: iso(TODAY) }, revisions: { ...s.revisions, [cle]: null }, menu: false, ajoutes: { ...s.ajoutes, [note.id]: [{ date: iso(TODAY), registre: st.registre, type: 'verif', etat: 'ajour', titre: 'Vérifiée par Alexandre Berge', detail: `Durée de validité : ${reg.validite} jours. Échéance le ${fmtL(new Date(TODAY.getTime() + reg.validite * J))}.` }, ...(s.ajoutes[note.id] || [])] } })); this.dire('Vérifiée à l\'instant — le cycle repart pour ' + pl(reg.validite, 'jour')); };
    const signalerReviser = () => { const actif = !!st.revisions[cle]; this.setState(s => ({ revisions: { ...s.revisions, [cle]: actif ? null : 'Alexandre Berge' }, menu: false, ajoutes: actif ? s.ajoutes : { ...s.ajoutes, [note.id]: [{ date: iso(TODAY), registre: st.registre, type: 'etat', etat: 'arevoir', titre: 'Révision demandée par Alexandre Berge', detail: 'La note passe à « À revoir » jusqu\'à la prochaine vérification.' }, ...(s.ajoutes[note.id] || [])] } })); this.dire(actif ? 'Demande de révision levée' : 'Révision demandée — la note passe à « À revoir »'); };
    const ouvrirHistorique = () => this.setState({ vue: 'historique', menu: false, filtre: 'tous' });
    const retourNote = () => this.setState({ vue: 'note', menu: false });
    const creerOperationnel = () => { this.setState(s => ({ opCree: { ...s.opCree, [note.id]: true }, registre: 'operationnel', actif: 0, ajoutes: { ...s.ajoutes, [note.id]: [{ date: iso(TODAY), registre: 'operationnel', type: 'verif', etat: 'ajour', titre: 'Version opérationnelle créée et vérifiée', detail: `Dérivée de la référence par Alexandre Berge. Durée de validité : ${note.registres.operationnelLatent.validite} jours.` }, ...(s.ajoutes[note.id] || [])] } })); this.dire('Version opérationnelle créée — son propre cycle de vivacité démarre'); };

    const actions = [
      { lib: 'Modifier la référence', icone: ICONES.crayon, couleur: '#16222b', onClick: () => {} },
      { lib: aOp ? 'Modifier l\'opérationnel' : 'Créer l\'opérationnel', icone: ICONES.crayon, couleur: '#16222b', onClick: aOp ? () => {} : creerOperationnel },
      { lib: 'Historique des versions', icone: ICONES.horloge, couleur: '#16222b', onClick: ouvrirHistorique },
      { lib: 'Exporter', icone: ICONES.export, couleur: '#16222b', onClick: () => {} },
      { lib: 'Imprimer', icone: ICONES.imprimer, couleur: '#16222b', onClick: () => {} },
      { lib: 'Supprimer', icone: ICONES.supprimer, couleur: '#a52c1b', onClick: () => {} }
    ];

    const tous = [...(st.ajoutes[note.id] || []), ...note.evenements];
    const filtres = [['tous', 'Tous'], ['reference', 'Référence'], ['operationnel', 'Opérationnel']].map(([k, lib]) => ({ lib, onClick: () => this.setState({ filtre: k }), barre: st.filtre === k ? '#1f5a3c' : 'transparent', couleur: st.filtre === k ? '#1f5a3c' : '#46585f', poids: st.filtre === k ? 600 : 400 }));
    const evenements = tous.filter(ev => st.filtre === 'tous' || ev.registre === st.filtre).map((ev, i) => {
      const E = ev.etat ? ETATS[ev.etat] : null; const k = note.id + ':' + i + ev.date;
      return { ...ev, date: fmtL(d(ev.date)), registre: ev.registre === 'reference' ? 'Référence' : 'Opérationnel', couleur: E ? E.couleur : '#9aa7a3', path: E ? E.path : (ev.type === 'version' ? 'M5 5h6v6H5z' : ''), couleurTitre: E && E.attention >= 2 ? E.couleur : '#16222b', diffOuvert: !!st.diffs[k], libComparer: st.diffs[k] ? 'Masquer la comparaison' : 'Comparer avec la version précédente', comparer: () => this.setState(s => ({ diffs: { ...s.diffs, [k]: !s.diffs[k] } })) };
    });

    const seuil = this.props.seuilBientot ?? 10;
    const CLES = Object.keys(ETATS);
    const ouvrirNote = id => () => { if (id) this.setState({ noteId: id, registre: 'reference', vue: 'note', actif: 0, menu: false }); };
    const totaux = [0, 0, 0, 0, 0]; Object.values(REPARTITION).forEach(r => r.forEach((n, i) => { totaux[i] += n; }));
    const total = totaux.reduce((a, b) => a + b, 0); const attention = totaux[2] + totaux[3] + totaux[4]; const critiques = totaux[3] + totaux[4];
    const item = ([id, titre, sous, etat]) => ({ titre, sous, etat: ETATS[etat].lib, couleur: ETATS[etat].couleur, path: ETATS[etat].path, onClick: ouvrirNote(id) });
    const acc = {
      total, ajour: totaux[0],
      alertes: [
        { n: totaux[1], titre: totaux[1] > 1 ? 'notes arrivent bientôt à échéance' : 'note arrive bientôt à échéance', detail: `Vérification prévue dans les ${seuil} prochains jours`, ...ETATS.bientot, onClick: () => {} },
        { n: attention, titre: attention > 1 ? 'notes nécessitent votre attention' : 'note nécessite votre attention', detail: 'Leur période de validité est dépassée', ...ETATS[critiques ? 'arevoir' : 'averifier'], onClick: () => {} }
      ],
      compteurs: CLES.map((k, i) => ({ n: totaux[i], lib: ETATS[k].lib, couleur: ETATS[k].couleur, path: ETATS[k].path })),
      bilan: critiques ? { ...ETATS.arevoir, titre: critiques > 1 ? `${critiques} notes critiques` : '1 note critique', texte: `${totaux[3]} à revoir, ${totaux[4]} obsolète. La plus ancienne : « Restaurer une sauvegarde PostgreSQL », échéance dépassée de 21 jours.`, trait: 'M12 7.5v5M12 15.5v.5' } : { ...ETATS.ajour, titre: 'Tout est sous contrôle', texte: 'Aucune note critique.', trait: 'M8.5 12l2.5 2.5 4.5-5' },
      listes: [
        { titre: 'Récemment consultées', periode: '7 derniers jours', icone: IC_NOTE, tout: 'Voir toutes les consultations', items: RECEMMENT.map(item) },
        { titre: 'Les plus consultées', periode: '30 derniers jours', icone: 'M2 14h12M4 11V8M8 11V4M12 11V6', tout: 'Voir toutes les notes les plus consultées', items: PLUS_CONSULTEES.map(item) }
      ],
      colonnes: CLES.map(k => k === 'bientot' ? 'Bientôt' : ETATS[k].lib),
      univers: ARBRE.map(u => { const r = REPARTITION[u.nom]; const n = r.reduce((a, b) => a + b, 0); return {
        nom: u.nom, icone: IC_UNIVERS[u.nom], notes: pl(n, 'note'),
        compteurs: r.map((c, i) => ({ n: c, couleur: c ? ETATS[CLES[i]].couleur : '#c9d0cc', path: ETATS[CLES[i]].path, encre: c && i >= 2 ? ETATS[CLES[i]].couleur : c ? '#16222b' : '#93a2a6' })),
        barre: r.map((c, i) => ({ couleur: ETATS[CLES[i]].couleur, pct: (c / n * 100).toFixed(1) + '%' })).filter(s => s.pct !== '0.0%'),
        onClick: () => this.ouvrirUnivers(u.nom)
      }; })
    };
    const uni = this.pageUnivers(st.universNom || note.univers, CLES);
    const dom = vue === 'domaine' ? this.pageDomaine(uni, CLES) : null;
    const exemples = { ajour: [-23, 90], bientot: [-84, 90], averifier: [-94, 90], arevoir: [-111, 90], obsolete: [-200, 90] };
    const planche = Object.keys(ETATS).map(k => { const [dv, val] = exemples[k]; const v = new Date(TODAY.getTime() + dv * J); const xx = { cle: k, v, e: new Date(v.getTime() + val * J), reste: jours(TODAY, new Date(v.getTime() + val * J)) }; return { ...this.ligneViv(xx, null, null), regle: ETATS[k].regle }; });

    return {
      gridCols, centreCols: montrerSommaire ? '190px minmax(0,1fr)' : 'minmax(0,1fr)', montrerSommaire, montrerDroite, montrerGauche, gaucheRepliee, droiteRepliee, styleGauche, styleDroite,
      tiroirOuvert: !!st.tiroir, fermerTiroirs: () => this.setState({ tiroir: null }), ouvrirGauche: () => this.setState({ tiroir: 'gauche', menu: false }), ouvrirDroite: () => this.setState({ tiroir: 'droite', menu: false }),
      vueNote: vue === 'note', vueHistorique: vue === 'historique', vueEtats: vue === 'etats', vueAccueil: vue === 'accueil', vueAccueilNon: vue !== 'accueil', vueRetour: vue === 'historique' || vue === 'etats', montrerModif: vue === 'note' || vue === 'historique', vueAccueil: vue === 'accueil',
      acc, ouvrirAccueil: () => this.setState({ vue: 'accueil', menu: false, tiroir: null }),
      uni, dom, vueUnivers: vue === 'univers', vueDomaine: vue === 'domaine', vueAccueilOuUnivers: vue === 'accueil' || vue === 'univers' || vue === 'domaine', filNote: vue === 'note' || vue === 'historique' || vue === 'etats', ouvrirUniversCourant: () => this.ouvrirUnivers(note.univers), ouvrirDomaineCourant: () => this.ouvrirDomaine(note.univers, note.domaine),
      note, arbre, recents, metas, resume: note.resume, sections, sommaire, actions, viv,
      registreLib: st.registre === 'reference' ? 'Référence' : 'Opérationnel',
      aOperationnel: aOp, sansOperationnel: !aOp, tabRef: tab(st.registre === 'reference'), tabOp: tab(st.registre === 'operationnel'),
      choisirReference: () => this.setState({ registre: 'reference', actif: 0 }), choisirOperationnel: () => this.setState({ registre: 'operationnel', actif: 0 }), creerOperationnel,
      menuOuvert: st.menu, toggleMenu: () => this.setState(s => ({ menu: !s.menu })), marquerVerifie, signalerReviser, ouvrirHistorique, retourNote, ouvrirEtats: () => this.setState({ vue: 'etats', menu: false }),
      libMarquer: 'Marquer comme vérifiée', libReviser: st.revisions[cle] ? 'Lever la demande de révision' : 'Signaler à réviser',
      filtres, evenements, planche, seuilTexte: pl(seuil, 'jour'), toast: st.toast
    };
  }
}
