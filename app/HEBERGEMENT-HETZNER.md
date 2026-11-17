# Héberger Kids Tech-nuru Lab sur Hetzner

Guide pas à pas pour mettre l'application en ligne sur un serveur Hetzner Cloud.
Complète `DEPLOIEMENT.md` (référence technique Docker).

**Coût estimé** : ~4-5 €/mois (serveur CX22) + ~1 €/mois (sauvegardes Hetzner) + ~10-15 €/an (nom de domaine).

---

## Ce qui sera installé

Un seul serveur fait tourner 4 conteneurs Docker :

| Conteneur | Rôle |
|---|---|
| `web` | L'application Next.js |
| `db` | Base PostgreSQL |
| `caddy` | Serveur web, HTTPS automatique (Let's Encrypt) |
| `backup` | Sauvegarde quotidienne de la base **et** des fichiers téléversés |

Les fichiers téléversés (dossiers des enfants, pièces des enseignants, galerie) sont stockés dans le volume Docker `uploads`.

---

## Étape 1 : Créer la clé SSH (sur votre PC Windows)

Ouvrez PowerShell :

```powershell
ssh-keygen -t ed25519
```

Appuyez sur Entrée à chaque question (ou choisissez une phrase secrète). Affichez la clé publique :

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

Copiez toute la ligne affichée (elle commence par `ssh-ed25519`).

## Étape 2 : Créer le serveur Hetzner

1. Créez un compte sur <https://www.hetzner.com/cloud> (pièce d'identité + carte bancaire ou PayPal).
2. Créez un **projet**, puis **Add Server** :
   - **Location** : Nuremberg ou Falkenstein (Allemagne)
   - **Image** : Ubuntu 24.04
   - **Type** : Shared vCPU → **CX22** (2 vCPU, 4 Go de RAM)
   - **Networking** : IPv4 + IPv6
   - **SSH keys** : *Add SSH key*, collez la clé copiée à l'étape 1
   - **Backups** : cochez (sauvegarde du serveur entier, +20 %)
   - **Name** : `nuru`
3. Cliquez **Create & Buy now** et notez l'**adresse IP** affichée.

## Étape 3 : Nom de domaine

1. Achetez un domaine (Namecheap, OVH, Gandi…), par exemple `kidstechnuru.org`.
2. Dans la zone DNS, créez un **enregistrement A** :
   - Nom : `lab` (donne `lab.kidstechnuru.org`) ou `@` pour le domaine nu
   - Valeur : l'IP du serveur
3. Attendez 5 à 30 minutes. Vérifiez depuis votre PC :
   ```powershell
   nslookup lab.kidstechnuru.org
   ```
   L'IP du serveur doit apparaître. **Ne lancez pas l'étape 7 avant**, sinon le certificat HTTPS échoue.

## Étape 4 : Se connecter et sécuriser

```powershell
ssh root@IP_DU_SERVEUR
```

Puis sur le serveur :

```bash
apt update && apt upgrade -y
apt install -y ufw unattended-upgrades git
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
dpkg-reconfigure -plow unattended-upgrades   # répondre « Oui »
```

Le pare-feu ne laisse passer que SSH, HTTP et HTTPS. La base PostgreSQL n'est de toute façon exposée que sur `127.0.0.1`.

## Étape 5 : Installer Docker

```bash
curl -fsSL https://get.docker.com | sh
docker --version
```

## Étape 6 : Récupérer le code

Le dépôt GitHub est **privé** : le serveur s'authentifie avec une **clé de déploiement** en lecture seule (elle ne donne accès qu'à ce dépôt).

1. Sur le serveur, créez la clé :
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/nuru_deploy -N ""
   cat ~/.ssh/nuru_deploy.pub
   ```
2. Sur GitHub : dépôt `kids_nuru` → **Settings** → **Deploy keys** → **Add deploy key**. Titre `hetzner-nuru`, collez la clé, **ne cochez pas** « Allow write access ».
3. Sur le serveur, indiquez à SSH d'utiliser cette clé, puis clonez :
   ```bash
   cat >> ~/.ssh/config <<'EOF'
   Host github.com
     IdentityFile ~/.ssh/nuru_deploy
     IdentitiesOnly yes
   EOF
   git clone git@github.com:kandefilskernel/kids_nuru.git /opt/nuru
   ```
   Répondez `yes` à la question sur l'empreinte de GitHub.

**Alternative sans GitHub** : copiez le code depuis votre PC (PowerShell, dans le dossier du projet) :

```powershell
ssh root@IP_DU_SERVEUR "mkdir -p /opt/nuru"
scp -r app complements root@IP_DU_SERVEUR:/opt/nuru/
```

Dans les deux cas, on obtient `/opt/nuru/app` (l'application) et `/opt/nuru/complements` (documents de l'assistant).

## Étape 7 : Configurer et lancer

```bash
cd /opt/nuru/app
nano .env
```

Contenu du fichier `.env` :

```
DOMAIN=lab.kidstechnuru.org
POSTGRES_PASSWORD=<mot de passe long et aléatoire>
ADMIN_PASSWORD=<mot de passe long et aléatoire>
```

Pour générer un bon mot de passe : `openssl rand -base64 24`.
Enregistrez avec `Ctrl+O`, `Entrée`, puis quittez avec `Ctrl+X`. Protégez le fichier :

```bash
chmod 600 .env
```

Lancez :

```bash
docker compose up -d --build
```

La première compilation prend 3 à 8 minutes. Caddy obtient ensuite seul le certificat HTTPS.

## Étape 8 : Vérifier

```bash
docker compose ps            # 4 conteneurs « running » (db « healthy »)
docker compose logs -f web   # Ctrl+C pour quitter
docker compose logs backup   # doit afficher « [backup] OK ... »
```

Ouvrez `https://lab.kidstechnuru.org` dans le navigateur, connectez-vous à l'espace admin avec `ADMIN_PASSWORD`, et testez un téléversement de fichier.

**Test de persistance** (à faire une fois) : téléversez un fichier, puis `docker compose up -d --build`, et vérifiez que le fichier est toujours là.

---

## Sauvegardes

À chaque cycle (toutes les 24 h par défaut), le conteneur `backup` crée dans `/opt/nuru/app/backups/` :

- `nuru-AAAAMMJJ-HHMMSS.dump` : la base de données
- `uploads-AAAAMMJJ-HHMMSS.tar.gz` : les fichiers téléversés

Conservation : 14 jours (`BACKUP_KEEP_DAYS` dans `.env`).

Les sauvegardes Hetzner (étape 2) protègent contre la perte du serveur. Faites **en plus** une copie régulière sur votre PC (PowerShell) :

```powershell
scp -r root@IP_DU_SERVEUR:/opt/nuru/app/backups C:\Sauvegardes\nuru
```

### Restauration

Base de données :

```bash
cd /opt/nuru/app
sh backup/restore.sh backups/nuru-AAAAMMJJ-HHMMSS.dump
```

Fichiers téléversés :

```bash
docker compose stop web
docker compose run --rm --no-deps -v $(pwd)/backups:/b:ro --entrypoint sh web \
  -c "tar -xzf /b/uploads-AAAAMMJJ-HHMMSS.tar.gz -C /data"
docker compose start web
```

Testez une restauration au moins une fois avant d'en avoir besoin.

---

## Mises à jour de l'application

Depuis votre PC, après avoir poussé les changements (`git push`) :

```bash
ssh root@IP_DU_SERVEUR
cd /opt/nuru && git pull && cd app && docker compose up -d --build
```

(Si vous avez copié le code avec `scp`, recopiez le dossier modifié puis relancez `docker compose up -d --build`.)

---

## Fonctions optionnelles

Ajoutez ces lignes au `.env` si besoin, puis relancez `docker compose up -d` :

| Variable | Effet |
|---|---|
| `ANTHROPIC_API_KEY` | Active l'assistant IA de l'espace admin |
| `PARENT_SECRET` | Secret distinct pour les liens parents (sinon `ADMIN_PASSWORD` est utilisé) |

L'assistant IA lit les documents `.md` et `.csv` du dossier `complements/` (monté en lecture seule dans le conteneur). Ce dossier doit donc se trouver à côté de `app/` sur le serveur (`/opt/nuru/complements`). Pour mettre à jour ces documents, modifiez-les puis `docker compose restart web`.

---

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Navigateur : certificat invalide / site inaccessible | DNS pas encore propagé, ou ports fermés | Vérifier `nslookup`, puis `docker compose logs caddy` |
| `docker compose up` s'arrête sur `POSTGRES_PASSWORD` | `.env` absent ou incomplet | Vérifier le fichier `.env` dans `/opt/nuru/app` |
| Compilation tuée (« Killed ») | Mémoire insuffisante | Prendre un CX22 (4 Go) ou ajouter du swap |
| Site lent ou 502 | Application en redémarrage | `docker compose logs -f web` |
| Disque plein | Anciennes images Docker | `docker system prune -f` |

## Checklist finale

- [ ] DNS pointe vers le serveur, HTTPS fonctionne
- [ ] Connexion admin OK avec un mot de passe long
- [ ] Un fichier téléversé survit à `docker compose up -d --build`
- [ ] `backups/` contient un `.dump` **et** un `uploads-*.tar.gz`
- [ ] Une copie des sauvegardes existe hors du serveur
- [ ] Sauvegardes Hetzner activées
- [ ] Une restauration a été testée
