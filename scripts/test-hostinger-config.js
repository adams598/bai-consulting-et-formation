#!/usr/bin/env node

/**
 * Script de test de configuration Hostinger pour BAI Consulting
 * Usage: node scripts/test-hostinger-config.js
 */

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

console.log('🧪 Test de configuration Hostinger pour BAI Consulting');
console.log('=====================================================');

// Test de la base de données
async function testDatabase() {
  console.log('\n🗄️ Test de la base de données...');
  
  try {
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    // Test des tables principales
    const userCount = await prisma.user.count();
    const formationCount = await prisma.formation.count();
    const bankCount = await prisma.bank.count();
    
    console.log(`📊 Utilisateurs: ${userCount}`);
    console.log(`📚 Formations: ${formationCount}`);
    console.log(`🏦 Banques: ${bankCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    return false;
  }
}

// Test de Cloudinary
async function testCloudinary() {
  console.log('\n🌐 Test de Cloudinary...');
  
  try {
    // Configuration Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    
    // Test de ping
    const result = await cloudinary.api.ping();
    console.log('✅ Connexion à Cloudinary réussie');
    console.log(`📊 Temps de réponse: ${result.response_time}ms`);
    
    // Test des statistiques d'utilisation
    const usage = await cloudinary.api.usage();
    console.log(`📈 Plan: ${usage.plan}`);
    console.log(`💾 Stockage: ${usage.storage} bytes`);
    console.log(`🌐 Bande passante: ${usage.bandwidth} bytes`);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à Cloudinary:', error.message);
    return false;
  }
}

// Test des variables d'environnement
function testEnvironmentVariables() {
  console.log('\n⚙️ Test des variables d'environnement...');
  
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'FRONTEND_URL',
    'ALLOWED_ORIGINS'
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configuré`);
    } else {
      console.log(`❌ ${varName}: Manquant`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

// Test des fichiers de configuration
function testConfigurationFiles() {
  console.log('\n📁 Test des fichiers de configuration...');
  
  const fs = await import('fs');
  const path = await import('path');
  
  const requiredFiles = [
    'ecosystem.config.js',
    'docker-compose.postgresql.yml',
    'backend/package.json',
    'frontend/package.json',
    'backend/prisma/schema.prisma'
  ];
  
  let allPresent = true;
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}: Présent`);
    } else {
      console.log(`❌ ${file}: Manquant`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

// Test des scripts de déploiement
function testDeploymentScripts() {
  console.log('\n🚀 Test des scripts de déploiement...');
  
  const fs = await import('fs');
  
  const requiredScripts = [
    'scripts/deploy-hostinger.sh',
    'scripts/setup-hostinger.sh',
    'scripts/backup-hostinger.sh',
    'scripts/migrate-to-cloudinary-hostinger.js'
  ];
  
  let allPresent = true;
  
  for (const script of requiredScripts) {
    if (fs.existsSync(script)) {
      console.log(`✅ ${script}: Présent`);
    } else {
      console.log(`❌ ${script}: Manquant`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

// Test de la structure des uploads
function testUploadsStructure() {
  console.log('\n📤 Test de la structure des uploads...');
  
  const fs = await import('fs');
  const path = await import('path');
  
  const uploadsDir = path.join(process.cwd(), 'backend', 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('❌ Dossier uploads non trouvé');
    return false;
  }
  
  const formationsDir = path.join(uploadsDir, 'formations');
  const profilesDir = path.join(uploadsDir, 'profiles');
  const videosDir = path.join(uploadsDir, 'videos');
  
  let allPresent = true;
  
  if (fs.existsSync(formationsDir)) {
    const formations = fs.readdirSync(formationsDir);
    console.log(`✅ Formations: ${formations.length} dossiers`);
  } else {
    console.log('❌ Dossier formations non trouvé');
    allPresent = false;
  }
  
  if (fs.existsSync(profilesDir)) {
    const profiles = fs.readdirSync(profilesDir);
    console.log(`✅ Profils: ${profiles.length} fichiers`);
  } else {
    console.log('❌ Dossier profiles non trouvé');
    allPresent = false;
  }
  
  if (fs.existsSync(videosDir)) {
    const videos = fs.readdirSync(videosDir);
    console.log(`✅ Vidéos: ${videos.length} fichiers`);
  } else {
    console.log('❌ Dossier videos non trouvé');
    allPresent = false;
  }
  
  return allPresent;
}

// Exécution des tests
async function runTests() {
  const results = {
    environment: testEnvironmentVariables(),
    configFiles: await testConfigurationFiles(),
    deploymentScripts: testDeploymentScripts(),
    uploadsStructure: testUploadsStructure(),
    database: await testDatabase(),
    cloudinary: await testCloudinary()
  };
  
  console.log('\n📊 Résumé des tests');
  console.log('==================');
  
  let allPassed = true;
  
  for (const [testName, result] of Object.entries(results)) {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${testName}: ${result ? 'PASSÉ' : 'ÉCHOUÉ'}`);
    if (!result) allPassed = false;
  }
  
  console.log('\n🎯 Recommandations');
  console.log('=================');
  
  if (!results.environment) {
    console.log('📝 Configurez les variables d\'environnement manquantes');
  }
  
  if (!results.configFiles) {
    console.log('📁 Vérifiez les fichiers de configuration manquants');
  }
  
  if (!results.deploymentScripts) {
    console.log('🚀 Vérifiez les scripts de déploiement manquants');
  }
  
  if (!results.uploadsStructure) {
    console.log('📤 Vérifiez la structure des dossiers d\'upload');
  }
  
  if (!results.database) {
    console.log('🗄️ Vérifiez la connexion à la base de données');
  }
  
  if (!results.cloudinary) {
    console.log('🌐 Vérifiez la configuration Cloudinary');
  }
  
  if (allPassed) {
    console.log('\n🎉 Tous les tests sont passés !');
    console.log('Votre application est prête pour le déploiement sur Hostinger.');
  } else {
    console.log('\n⚠️ Certains tests ont échoué.');
    console.log('Corrigez les problèmes avant de procéder au déploiement.');
  }
  
  return allPassed;
}

// Exécution
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });















