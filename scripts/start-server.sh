#!/bin/bash

# Script pour démarrer le serveur Next.js en production

# Obtenir le répertoire du projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Aller dans le répertoire du projet
cd "$PROJECT_DIR" || exit 1

# Charger les variables d'environnement depuis .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Vérifier si l'application est buildée
if [ ! -d ".next" ]; then
    echo "Building the application..."
    pnpm run build
fi

# Démarrer le serveur
echo "Starting server on port 8496..."
pnpm run server
