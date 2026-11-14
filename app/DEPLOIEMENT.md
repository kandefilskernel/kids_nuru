# Déploiement (Docker)

## Mise en ligne sur un serveur
1. Pointer un nom de domaine (enregistrement DNS A) vers l'IP du serveur ; ouvrir les ports 80 et 443.
2. Créer `app/.env` :
   ```
   DOMAIN=lab.exemple.cd
   POSTGRES_PASSWORD=<long mot de passe aléatoire>
   ADMIN_PASSWORD=<long mot de passe aléatoire>
   ```
3. Lancer : `docker compose up -d --build`
   Caddy obtient et renouvelle automatiquement le certificat HTTPS (Let's Encrypt).

Test local : sans `DOMAIN`, Caddy sert `https://localhost` avec un certificat local que le navigateur ne reconnaît pas (avertissement attendu). Variables `HTTP_PORT` / `HTTPS_PORT` si 80/443 sont occupés.

## Sauvegardes
- Une sauvegarde `pg_dump` au démarrage puis toutes les 24 h, dans `app/backups/nuru-AAAAMMJJ-HHMMSS.dump`.
- Au même moment, une archive des fichiers téléversés (photos, dossiers, pièces jointes, stockés dans le volume Docker `uploads`) : `app/backups/nuru-files-AAAAMMJJ-HHMMSS.tar.gz`.
- Conservation : 14 jours (`BACKUP_KEEP_DAYS`, `BACKUP_INTERVAL_HOURS` dans `.env`).
- **Copiez `backups/` hors du serveur** (autre machine, stockage cloud) : une sauvegarde sur le même disque ne protège pas d'une panne du serveur.

## Restauration
```bash
sh backup/restore.sh backups/nuru-AAAAMMJJ-HHMMSS.dump backups/nuru-files-AAAAMMJJ-HHMMSS.tar.gz
```
Le second fichier (fichiers téléversés) est facultatif ; prenez le même horodatage que le `.dump`.
Demande de taper `OUI`, arrête l'app, remplace les données, redémarre l'app. Testez-la au moins une fois avant d'en avoir besoin.
