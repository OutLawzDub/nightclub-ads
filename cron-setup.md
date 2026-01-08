# Configuration Cron pour le Scraper

Ce guide explique comment configurer une tâche cron pour exécuter le scraper automatiquement toutes les heures sur Linux.

## Prérequis

- Linux avec cron installé
- Node.js installé et accessible dans le PATH
- pnpm installé (ou npm)
- Fichier `.env` configuré avec les bonnes variables d'environnement
- Permissions d'exécution sur les scripts

## Installation

### 1. Rendre le script exécutable

```bash
chmod +x scripts/run-scraper.sh
```

### 2. Tester le script manuellement

```bash
./scripts/run-scraper.sh
```

Si le test fonctionne, vous pouvez continuer avec la configuration cron.

### 3. Éditer le crontab

```bash
crontab -e
```

### 4. Ajouter la ligne suivante pour exécuter toutes les heures

```cron
0 * * * * /chemin/absolu/vers/scripts/run-scraper.sh >> /chemin/absolu/vers/logs/cron-scraper.log 2>&1
```

**Exemple avec le chemin complet :**
```cron
0 * * * * /home/user/nightclub-ads/scripts/run-scraper.sh >> /home/user/nightclub-ads/logs/cron-scraper.log 2>&1
```

**Important :** Remplacez `/chemin/absolu/vers` par le chemin absolu réel de votre projet. Vous pouvez obtenir le chemin absolu avec :
```bash
pwd
```

### 5. Vérifier que la tâche cron est bien configurée

```bash
crontab -l
```

### 6. Vérifier les logs

Les logs du scraper seront dans :
- `logs/scraper-YYYY-MM-DD.log` (logs détaillés du scraper)
- `logs/cron-scraper.log` (sortie standard/erreur de cron)

## Format Cron (Référence)

```
* * * * * commande
│ │ │ │ │
│ │ │ │ └─── Jour de la semaine (0-7, 0 et 7 = dimanche)
│ │ │ └───── Mois (1-12)
│ │ └─────── Jour du mois (1-31)
│ └───────── Heure (0-23)
└─────────── Minute (0-59)
```

### Exemples

- `0 * * * *` : Toutes les heures à la minute 0
- `0 */2 * * *` : Toutes les 2 heures
- `0 9 * * *` : Tous les jours à 9h00
- `0 9 * * 1` : Tous les lundis à 9h00
- `*/30 * * * *` : Toutes les 30 minutes

## Dépannage

### Vérifier que cron fonctionne

```bash
# Voir les logs système de cron
sudo tail -f /var/log/syslog | grep CRON

# Ou selon la distribution
sudo journalctl -u cron -f
# ou
sudo tail -f /var/log/cron
```

### Vérifier les permissions

```bash
# Vérifier que le script est exécutable
ls -l scripts/run-scraper.sh

# Si nécessaire, rendre exécutable
chmod +x scripts/run-scraper.sh
```

### Vérifier les chemins

Assurez-vous que tous les chemins dans le script sont absolus ou relatifs au bon répertoire.

### Vérifier les variables d'environnement

Le script charge automatiquement le fichier `.env`, mais vous pouvez aussi définir les variables d'environnement directement dans le crontab :

```cron
0 * * * * export PLACEMINUTE_EMAIL="email@example.com" && /chemin/vers/scripts/run-scraper.sh
```

## Logs

Les logs sont automatiquement créés dans le dossier `logs/` :
- `scraper-YYYY-MM-DD.log` : Logs détaillés du scraper (via le logger)
- `cron-scraper.log` : Sortie standard/erreur de la commande cron (si redirigée)

Pour nettoyer les anciens logs, vous pouvez ajouter une tâche cron supplémentaire :

```cron
0 0 * * 0 find /chemin/vers/logs -name "scraper-*.log" -mtime +30 -delete
```

Cela supprimera les logs de plus de 30 jours tous les dimanches à minuit.
