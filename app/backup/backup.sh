#!/bin/sh
# Sauvegarde Postgres en boucle : une sauvegarde au démarrage puis toutes les BACKUP_INTERVAL_HOURS.
# Les anciennes sauvegardes (> BACKUP_KEEP_DAYS jours) sont supprimées.
set -eu

DIR=/backups
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
INTERVAL=$(( ${BACKUP_INTERVAL_HOURS:-24} * 3600 ))
export PGPASSWORD="$POSTGRES_PASSWORD"

while true; do
  STAMP=$(date -u +%Y%m%d-%H%M%S)
  TMP="$DIR/.nuru-$STAMP.dump.part"
  OUT="$DIR/nuru-$STAMP.dump"
  if pg_dump -h db -U nuru -d nuru -Fc -f "$TMP"; then
    mv "$TMP" "$OUT"
    echo "[backup] OK $OUT ($(wc -c < "$OUT") octets)"
    find "$DIR" -name 'nuru-*.dump' -mtime +"$KEEP_DAYS" -print -delete
  else
    rm -f "$TMP"
    echo "[backup] ECHEC de pg_dump" >&2
  fi

  # Fichiers téléversés (photos, dossiers, pièces jointes), au même horodatage que la base.
  if [ -d /uploads ]; then
    FTMP="$DIR/.nuru-files-$STAMP.tar.gz.part"
    FOUT="$DIR/nuru-files-$STAMP.tar.gz"
    if tar -czf "$FTMP" -C /uploads .; then
      mv "$FTMP" "$FOUT"
      echo "[backup] OK $FOUT ($(wc -c < "$FOUT") octets)"
      find "$DIR" -name 'nuru-files-*.tar.gz' -mtime +"$KEEP_DAYS" -print -delete
    else
      rm -f "$FTMP"
      echo "[backup] ECHEC de l'archive des fichiers" >&2
    fi
  fi
  sleep "$INTERVAL"
done
