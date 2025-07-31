@echo off
echo ========================================
echo   DEPLOIEMENT SEO BAI CONSULTING
echo ========================================
echo.

echo [1/5] Construction de l'application...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: La construction a echoue
    pause
    exit /b 1
)
echo ✓ Construction reussie
echo.

echo [2/5] Verification des fichiers SEO...
if not exist "dist\robots.txt" (
    echo ERREUR: robots.txt manquant
    pause
    exit /b 1
)
if not exist "dist\sitemap.xml" (
    echo ERREUR: sitemap.xml manquant
    pause
    exit /b 1
)
echo ✓ Fichiers SEO presents
echo.

echo [3/5] Preparation des fichiers pour upload...
echo - Copie des fichiers vers le dossier de deploy
xcopy "dist\*" "deploy-seo\" /E /Y /Q
echo ✓ Fichiers prepares
echo.

echo [4/5] Upload vers Hostinger...
echo ATTENTION: Vous devez maintenant uploader manuellement
echo les fichiers du dossier 'deploy-seo' vers votre serveur Hostinger
echo.
echo Fichiers a uploader:
echo - robots.txt
echo - sitemap.xml
echo - index.html
echo - dossier assets/
echo - dossier images/
echo.

echo [5/5] Verification post-deploiement...
echo.
echo Une fois l'upload termine, verifiez:
echo 1. https://bai-consultingetformation.com/robots.txt
echo 2. https://bai-consultingetformation.com/sitemap.xml
echo 3. https://bai-consultingetformation.com/
echo.
echo ========================================
echo   DEPLOIEMENT TERMINE
echo ========================================
echo.
echo Prochaines etapes SEO:
echo 1. Configurer Google Search Console
echo 2. Soumettre le sitemap
echo 3. Demander l'indexation
echo.
pause 