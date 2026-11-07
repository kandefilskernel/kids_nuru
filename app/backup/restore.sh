#!/bin/sh
# Restaure une sauvegarde dans la base (REMPLACE les données actuelles).
# Usage (depuis app/) :  sh backup/restore.sh backups/nuru-AAAAMMJJ-HHMMSS.dump
set -eu

FILE="${1:?Usage: sh backup/restore.sh backups/<fichier>.dump}"
[ -f "$FILE" ] || { echo "Fichier introuvable : $FILE" >&2; exit 1; }

echo "Restauration de $FILE : les données actuelles seront remplacées."
printf "Taper OUI pour continuer : "
read -r ANSWER
[ "$ANSWER" = "OUI" ] || { echo "Annulé."; exit 1; }

docker compose stop web
docker compose exec -T db pg_restore -U nuru -d nuru --clean --if-exists --no-owner < "$FILE"
docker compose start web
echo "Restauration terminée."
