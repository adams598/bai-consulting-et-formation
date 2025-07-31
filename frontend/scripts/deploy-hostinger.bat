@echo off
echo ========================================
echo   DEPLOIEMENT BAI CONSULTING - HOSTINGER
echo ========================================
echo.

echo [1/4] Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: La construction a échoué
    pause
    exit /b 1
)

echo.
echo [2/4] Vérification des fichiers de production...
if not exist "dist\index.html" (
    echo ERREUR: Le fichier index.html n'existe pas dans dist/
    pause
    exit /b 1
)

echo.
echo [3/4] Préparation des fichiers pour Hostinger...
echo Les fichiers sont prêts dans le dossier: frontend\dist\
echo.

echo [4/4] Instructions de déploiement:
echo.
echo 1. Connectez-vous à votre panneau de contrôle Hostinger
echo 2. Accédez au gestionnaire de fichiers
echo 3. Naviguez vers le dossier public_html
echo 4. Uploadez TOUS les fichiers du dossier frontend\dist\
echo.
echo IMPORTANT: N'oubliez pas de configurer l'URL de votre backend
echo dans le fichier .env.production avant de reconstruire!
echo.
echo ========================================
echo Déploiement terminé avec succès!
echo ========================================
pause 