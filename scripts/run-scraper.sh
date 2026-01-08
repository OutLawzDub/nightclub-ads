#!/bin/bash

# Script wrapper pour exécuter le scraper via cron
# Ce script gère les chemins absolus et l'environnement Node.js

# Obtenir le répertoire du projet (parent du dossier scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Aller dans le répertoire du projet
cd "$PROJECT_DIR" || exit 1

# Charger les variables d'environnement depuis .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Trouver le gestionnaire de paquets (utiliser pnpm si disponible, sinon npm)
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    SCRAPER_CMD="pnpm run scraper"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    SCRAPER_CMD="npm run scraper"
else
    echo "Error: pnpm or npm not found in PATH"
    exit 1
fi

# Exécuter le scraper
$SCRAPER_CMD

# Code de sortie
exit $?
