#!/bin/sh
# Restaure une sauvegarde dans la base (REMPLACE les données actuelles).
# Usage (depuis app/) :  sh backup/restore.sh backups/nuru-AAAAMMJJ-HHMMSS.dump [backups/nuru-files-AAAAMMJJ-HHMMSS.tar.gz]
# Le second argument (facultatif) restaure aussi les fichiers téléversés (photos, dossiers, pièces jointes).
set -eu

FILE="${1:?Usage: sh backup/restore.sh backups/<fichier>.dump [backups/<fichiers>.tar.gz]}"
FILES="${2:-}"
[ -f "$FILE" ] || { echo "Fichier introuvable : $FILE" >&2; exit 1; }
[ -z "$FILES" ] || [ -f "$FILES" ] || { echo "Fichier introuvable : $FILES" >&2; exit 1; }

echo "Restauration de $FILE : les données actuelles seront remplacées."
[ -z "$FILES" ] || echo "Les fichiers téléversés seront remplacés par $FILES."
printf "Taper OUI pour continuer : "
read -r ANSWER
[ "$ANSWER" = "OUI" ] || { echo "Annulé."; exit 1; }

docker compose stop web
docker compose exec -T db pg_restore -U nuru -d nuru --clean --if-exists --no-owner < "$FILE"
if [ -n "$FILES" ]; then
  # Conteneur temporaire de l'app (utilisateur « app », propriétaire du volume) pour remplacer les fichiers.
  docker compose run --rm --no-deps -T --entrypoint sh web \
    -c 'find /app/uploads -mindepth 1 -delete && tar -xzf - -C /app/uploads' < "$FILES"
fi
docker compose start web
echo "Restauration terminée."
