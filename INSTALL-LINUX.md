# Installation sur Linux

Ce guide explique comment installer et configurer le projet sur un serveur Linux.

## Prérequis système

### Dépendances système pour Puppeteer

Puppeteer nécessite Chrome/Chromium et plusieurs bibliothèques système. Installez-les selon votre distribution :

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

#### CentOS/RHEL/Fedora

```bash
sudo yum install -y \
  alsa-lib \
  atk \
  cups-libs \
  gtk3 \
  ipa-gothic-fonts \
  libXcomposite \
  libXcursor \
  libXdamage \
  libXext \
  libXi \
  libXrandr \
  libXScrnSaver \
  libXtst \
  pango \
  xorg-x11-fonts-100dpi \
  xorg-x11-fonts-75dpi \
  xorg-x11-utils \
  nss \
  at-spi2-atk
```

#### Alpine Linux

```bash
apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont
```

### Node.js et pnpm

#### Installation de Node.js (via nvm recommandé)

```bash
# Installer nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recharger le shell
source ~/.bashrc

# Installer Node.js (version LTS)
nvm install --lts
nvm use --lts
```

#### Installation de pnpm

```bash
npm install -g pnpm
```

### MySQL

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### CentOS/RHEL/Fedora

```bash
sudo yum install -y mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

## Installation du projet

### 1. Cloner le projet

```bash
git clone <url-du-repo> nightclub-ads
cd nightclub-ads
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Configurer l'environnement

Créer le fichier `.env` :

```bash
cp .env.example .env
nano .env
```

Remplir avec vos informations :

```env
NODE_ENV=production

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=nightclub
DB_PORT=3306

PLACEMINUTE_EMAIL=votre-email@example.com
PLACEMINUTE_PASSWORD=votre_mot_de_passe

BASE_URL=http://localhost:3000
```

### 4. Créer la base de données

```bash
mysql -u root -p
```

```sql
CREATE DATABASE nightclub;
EXIT;
```

### 5. Synchroniser la base de données

```bash
pnpm run sync
```

### 6. Créer un utilisateur admin

```bash
pnpm run create-admin
```

## Vérification de l'installation

### Tester le scraper

```bash
pnpm run scraper
```

Si vous obtenez une erreur concernant des bibliothèques manquantes, installez les dépendances système listées ci-dessus.

### Vérifier les logs

Les logs sont créés dans le dossier `logs/` :

```bash
tail -f logs/scraper-$(date +%Y-%m-%d).log
```

## Configuration Cron

Voir le fichier `cron-setup.md` pour configurer l'exécution automatique du scraper.

## Dépannage

### Erreur : "cannot open shared object file: No such file or directory"

Cette erreur indique qu'il manque des bibliothèques système. Installez les dépendances listées dans la section "Dépendances système pour Puppeteer" ci-dessus.

### Erreur : "Failed to launch the browser process"

1. Vérifiez que toutes les dépendances système sont installées
2. Vérifiez que Chrome/Chromium peut être lancé manuellement :
   ```bash
   /root/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome --version
   ```
3. Si Chrome n'est pas installé, Puppeteer le téléchargera automatiquement au premier lancement

### Erreur : "Permission denied"

Assurez-vous que les scripts ont les bonnes permissions :

```bash
chmod +x scripts/run-scraper.sh
```

### Vérifier les dépendances manquantes

Si vous obtenez une erreur spécifique pour une bibliothèque, vous pouvez la chercher :

```bash
# Ubuntu/Debian
apt-cache search libnss3

# CentOS/RHEL/Fedora
yum search nss
```

## Notes importantes

- Le scraper fonctionne en mode headless (sans interface graphique)
- Assurez-vous d'avoir suffisamment d'espace disque pour les logs et les fichiers CSV téléchargés
- Les logs sont automatiquement créés dans le dossier `logs/`
- Le scraper nécessite une connexion Internet stable pour accéder à Placeminute
