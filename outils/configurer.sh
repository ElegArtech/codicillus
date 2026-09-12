#!/usr/bin/env bash
# Configure une installation neuve et la démarre avec Docker Compose.
set -euo pipefail
umask 077
DEPOT_CODICILLUS=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$DEPOT_CODICILLUS"
[[ ! -e .env ]] || { echo '.env existe déjà. Il est conservé ; utiliser docker compose up -d pour démarrer.' >&2; exit 1; }
command -v docker > /dev/null || { echo 'Installer Docker Engine et Docker Compose avant de continuer.' >&2; exit 1; }
docker info > /dev/null 2>&1 || { echo 'Docker doit être démarré et accessible à votre compte.' >&2; exit 1; }
docker compose version > /dev/null
for outil in od tr; do command -v "$outil" > /dev/null; done
exec 3<> /dev/tty
printf 'Installation de Codicillus\nDossier : %s\n\n' "$DEPOT_CODICILLUS" >&3
read -r -p 'Adresse publique [http://localhost:19080] : ' ORIGINE <&3
ORIGINE=${ORIGINE:-http://localhost:19080}
ORIGINE=${ORIGINE%/}
if [[ ! "$ORIGINE" =~ ^(http|https)://([A-Za-z0-9.-]+)(:([0-9]+))?$ ]]; then
  echo 'Saisir une origine HTTP ou HTTPS, sans chemin, par exemple https://notes.example.org.' >&2; exit 1
fi
PROTOCOLE=${BASH_REMATCH[1]}
HOTE=${BASH_REMATCH[2]}
PORT_PUBLIC=${BASH_REMATCH[4]:-}
PORT_HTTP=80
PORT_HTTPS=19443
if [[ "$PROTOCOLE" == http ]]; then PORT_HTTP=${PORT_PUBLIC:-80}; else PORT_HTTPS=${PORT_PUBLIC:-443}; fi
if (( PORT_HTTP < 1 || PORT_HTTP > 65535 || PORT_HTTPS < 1 || PORT_HTTPS > 65535 )); then echo 'Le port doit être compris entre 1 et 65535.' >&2; exit 1; fi
DIRECTIVE_TLS=
if [[ "$PROTOCOLE" == https ]]; then
  read -r -p 'Certificat HTTPS : automatique, fourni ou interne [automatique] : ' TLS <&3
  case ${TLS:-automatique} in
    automatique) ;;
    fourni)
      [[ -f certificats/site.crt && -f certificats/site.key ]] || { echo 'Déposer site.crt et site.key dans certificats/, puis relancer.' >&2; exit 1; }
      DIRECTIVE_TLS='tls /etc/codicillus/certificats/site.crt /etc/codicillus/certificats/site.key' ;;
    interne) DIRECTIVE_TLS='tls internal' ;;
    *) echo 'Choisir automatique, fourni ou interne.' >&2; exit 1 ;;
  esac
fi
read -r -p 'Identifiant du premier administrateur [admin] : ' ADMIN_IDENTIFIANT <&3
ADMIN_IDENTIFIANT=${ADMIN_IDENTIFIANT:-admin}
read -r -p 'Nom affiché [Administrateur] : ' ADMIN_NOM <&3
ADMIN_NOM=${ADMIN_NOM:-Administrateur}
read -r -p 'Courriel de l’administrateur : ' ADMIN_COURRIEL <&3
[[ "$ADMIN_COURRIEL" == *@*.* ]] || { echo 'Renseigner un courriel valide.' >&2; exit 1; }
read -r -s -p 'Mot de passe de l’administrateur (12 caractères minimum) : ' MDP_ADMINISTRATEUR <&3
printf '\n' >&3
read -r -s -p 'Confirmer le mot de passe : ' CONFIRMATION <&3
printf '\n' >&3
[[ ${#MDP_ADMINISTRATEUR} -ge 12 && "$MDP_ADMINISTRATEUR" == "$CONFIRMATION" ]] || { echo 'Les mots de passe doivent être identiques et contenir au moins 12 caractères.' >&2; exit 1; }
read -r -p 'Activer la conversion bureautique ? [O/n] : ' REPONSE_CONVERSION <&3
PROFILS=conversion
case "$REPONSE_CONVERSION" in n|N|non) PROFILS= ;; esac
secret() { od -An -N32 -tx1 /dev/urandom | tr -d ' \n'; }
ecrire() {
  local valeur=$2
  valeur=${valeur//\\/\\\\}
  valeur=${valeur//\"/\\\"}
  valeur=${valeur//\$/\$\$}
  printf '%s="%s"\n' "$1" "$valeur"
}
CONFIG_TEMP=$(mktemp .env.XXXXXXXX)
trap 'rm -f -- "$CONFIG_TEMP"' EXIT
cat .env.example > "$CONFIG_TEMP"
{
  printf '\n# Configuration de cette installation\n'
  ecrire MDP_POSTGRES "$(secret)"
  ecrire CLE_MAITRE_RECHERCHE "$(secret)"
  ecrire ADRESSE_SITE "$PROTOCOLE://$HOTE"
  ecrire ORIGINE_PUBLIQUE "$ORIGINE"
  ecrire PORT_HTTP "$PORT_HTTP"
  ecrire PORT_HTTPS "$PORT_HTTPS"
  ecrire DIRECTIVE_TLS "$DIRECTIVE_TLS"
  ecrire ADMIN_IDENTIFIANT "$ADMIN_IDENTIFIANT"
  ecrire ADMIN_NOM "$ADMIN_NOM"
  ecrire ADMIN_COURRIEL "$ADMIN_COURRIEL"
  ecrire MDP_ADMINISTRATEUR "$MDP_ADMINISTRATEUR"
  ecrire COMPOSE_PROFILES "$PROFILS"
} >> "$CONFIG_TEMP"
docker compose --env-file "$CONFIG_TEMP" config --quiet
mv "$CONFIG_TEMP" .env
unset MDP_ADMINISTRATEUR CONFIRMATION
printf '\nConfiguration créée. Préparation des images et démarrage…\n'
docker compose up -d --wait
printf '\nCodicillus est prêt : %s\nConnectez-vous avec le compte %s.\n' "$ORIGINE" "$ADMIN_IDENTIFIANT"
printf 'Les paramètres ADMIN_* et MDP_ADMINISTRATEUR peuvent maintenant être retirés de .env.\n'
