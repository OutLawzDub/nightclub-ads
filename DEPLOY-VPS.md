# Déploiement sur VPS

Ce guide explique comment déployer l'application Next.js sur un VPS Linux et la servir sur le port 8496.

## Prérequis

- VPS Linux avec accès root
- Node.js et pnpm installés (voir [INSTALL-LINUX.md](INSTALL-LINUX.md))
- MySQL installé et configuré
- Application buildée

## Configuration du port

L'application est configurée pour s'exécuter sur le port **8496** par défaut.

### Option 1 : Utiliser PM2 (Recommandé)

PM2 est un gestionnaire de processus pour Node.js qui permet de maintenir l'application en vie et de la redémarrer automatiquement.

#### Installation de PM2

```bash
npm install -g pm2
```

#### Configuration

1. Build l'application :

```bash
pnpm run build
```

2. Démarrer avec PM2 :

```bash
pm2 start ecosystem.config.cjs
```

3. Sauvegarder la configuration PM2 :

```bash
pm2 save
pm2 startup
```

#### Commandes PM2 utiles

```bash
# Voir les processus
pm2 list

# Voir les logs
pm2 logs nightclub-ads

# Redémarrer
pm2 restart nightclub-ads

# Arrêter
pm2 stop nightclub-ads

# Supprimer
pm2 delete nightclub-ads

# Surveiller
pm2 monit
```

### Option 2 : Utiliser systemd

#### Configuration

1. Copier le fichier de service systemd :

```bash
sudo cp systemd/nightclub-ads.service /etc/systemd/system/
```

2. Modifier le fichier pour adapter les chemins :

```bash
sudo nano /etc/systemd/system/nightclub-ads.service
```

Ajuster les valeurs suivantes :
- `User` : votre utilisateur (par défaut `root`)
- `WorkingDirectory` : chemin absolu vers votre projet
- `ExecStart` : chemin vers pnpm (peut être `/usr/bin/pnpm` ou `/usr/local/bin/pnpm`)

3. Recharger systemd :

```bash
sudo systemctl daemon-reload
```

4. Activer le service au démarrage :

```bash
sudo systemctl enable nightclub-ads
```

5. Démarrer le service :

```bash
sudo systemctl start nightclub-ads
```

#### Commandes systemd utiles

```bash
# Voir le statut
sudo systemctl status nightclub-ads

# Voir les logs
sudo journalctl -u nightclub-ads -f

# Redémarrer
sudo systemctl restart nightclub-ads

# Arrêter
sudo systemctl stop nightclub-ads

# Désactiver au démarrage
sudo systemctl disable nightclub-ads
```

### Option 3 : Démarrer manuellement

Pour tester ou démarrer temporairement :

```bash
# Build l'application
pnpm run build

# Démarrer le serveur
pnpm run server
```

L'application sera accessible sur `http://votre-ip:8496`

## Configuration du firewall

Si vous utilisez un firewall (ufw, firewalld, etc.), ouvrez le port 8496 :

### UFW (Ubuntu/Debian)

```bash
sudo ufw allow 8496/tcp
sudo ufw reload
```

### Firewalld (CentOS/RHEL)

```bash
sudo firewall-cmd --permanent --add-port=8496/tcp
sudo firewall-cmd --reload
```

## Configuration avec Nginx (Reverse Proxy)

Pour servir l'application via un domaine avec HTTPS, configurez Nginx comme reverse proxy :

### Installation de Nginx

```bash
# Ubuntu/Debian
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx
```

### Configuration Nginx

Créer un fichier de configuration :

```bash
sudo nano /etc/nginx/sites-available/nightclub-ads
```

Contenu :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:8496;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer le site :

```bash
# Ubuntu/Debian
sudo ln -s /etc/nginx/sites-available/nightclub-ads /etc/nginx/sites-enabled/

# CentOS/RHEL (créer directement dans /etc/nginx/conf.d/)
sudo cp /etc/nginx/sites-available/nightclub-ads /etc/nginx/conf.d/nightclub-ads.conf
```

Tester la configuration :

```bash
sudo nginx -t
```

Recharger Nginx :

```bash
sudo systemctl reload nginx
```

## Configuration SSL avec Let's Encrypt

Pour activer HTTPS :

```bash
# Installer Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot --nginx -d votre-domaine.com
```

## Mise à jour de BASE_URL dans .env

Assurez-vous que `BASE_URL` dans votre fichier `.env` correspond à votre configuration :

```env
# Si vous utilisez directement le port
BASE_URL=http://votre-ip:8496

# Si vous utilisez un domaine avec Nginx
BASE_URL=https://votre-domaine.com
```

## Vérification

1. Vérifier que l'application fonctionne :

```bash
curl http://localhost:8496
```

2. Vérifier depuis l'extérieur :

```bash
curl http://votre-ip:8496
```

3. Vérifier les logs :

```bash
# PM2
pm2 logs nightclub-ads

# systemd
sudo journalctl -u nightclub-ads -f

# Logs applicatifs
tail -f logs/scraper-$(date +%Y-%m-%d).log
```

## Dépannage

### Le port 8496 est déjà utilisé

Vérifier quel processus utilise le port :

```bash
sudo lsof -i :8496
# ou
sudo netstat -tulpn | grep 8496
```

Arrêter le processus ou changer le port dans `package.json` et `ecosystem.config.cjs`.

### L'application ne démarre pas

1. Vérifier les logs d'erreur
2. Vérifier que la base de données est accessible
3. Vérifier que toutes les variables d'environnement sont définies dans `.env`
4. Vérifier que l'application est buildée : `pnpm run build`

### Erreur de permissions

Assurez-vous que les dossiers `logs/` et `.next/` ont les bonnes permissions :

```bash
chmod -R 755 logs/
chmod -R 755 .next/
```

## Maintenance

### Mettre à jour l'application

```bash
# Arrêter l'application
pm2 stop nightclub-ads
# ou
sudo systemctl stop nightclub-ads

# Pull les dernières modifications
git pull

# Installer les dépendances
pnpm install

# Rebuild
pnpm run build

# Redémarrer
pm2 start nightclub-ads
# ou
sudo systemctl start nightclub-ads
```

### Nettoyer les logs

Les logs peuvent devenir volumineux. Créer un script de nettoyage :

```bash
# Supprimer les logs de plus de 30 jours
find logs/ -name "*.log" -mtime +30 -delete
```
