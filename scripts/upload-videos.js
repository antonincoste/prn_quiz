// Script pour uploader les vidéos "spicy" vers Vercel Blob
// Les vidéos sont coupées à 5 secondes et compressées
// 
// Prérequis: ffmpeg installé (brew install ffmpeg)
// Usage: node scripts/upload-videos.js
//
// Structure attendue: videos/prenom-nom-gif.mp4

import { put } from '@vercel/blob';
import { sql } from '@vercel/postgres';
import { readdir, readFile, rename, unlink } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { config } from 'dotenv';

config({ path: '.env.local' });

const execAsync = promisify(exec);

const VIDEOS_DIR = './videos';
const TEMP_DIR = './videos/temp';
const ARCHIVE_DIR = './videos/uploaded';
const VIDEO_DURATION = 5; // secondes
const VIDEO_WIDTH = 640; // pixels (16:9 = 640x360)

// Créer les dossiers si nécessaire
if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true });
}
if (!existsSync(ARCHIVE_DIR)) {
  mkdirSync(ARCHIVE_DIR, { recursive: true });
}

// Compresser et couper la vidéo
async function processVideo(inputPath, outputPath) {
  // -t : durée
  // -vf scale : redimensionner
  // -c:v libx264 : codec H.264
  // -crf 28 : qualité (18-28 recommandé, plus haut = plus compressé)
  // -preset fast : vitesse d'encodage
  // -an : pas d'audio
  // -movflags +faststart : optimisé pour le web
  const cmd = `ffmpeg -y -i "${inputPath}" -t ${VIDEO_DURATION} -vf "scale=${VIDEO_WIDTH}:-2" -c:v libx264 -crf 28 -preset fast -an -movflags +faststart "${outputPath}"`;
  
  try {
    await execAsync(cmd);
    return true;
  } catch (error) {
    console.error(`  ❌ FFmpeg error: ${error.message}`);
    return false;
  }
}

// Parser le nom de fichier: prenom-nom-gif.mp4 → { firstName, lastName }
function parseFilename(filename) {
  // Enlever l'extension et le suffixe -gif
  const name = filename.replace(/\.mp4$/i, '').replace(/-gif$/i, '');
  const parts = name.split('-');
  
  if (parts.length < 2) {
    return null;
  }
  
  // Capitaliser
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  
  const firstName = capitalize(parts[0]);
  const lastName = parts.slice(1).map(capitalize).join(' ');
  
  return { firstName, lastName };
}

async function uploadVideos() {
  console.log('🎬 Upload des vidéos spicy\n');
  
  // Vérifier que ffmpeg est installé
  try {
    await execAsync('ffmpeg -version');
  } catch {
    console.error('❌ FFmpeg non installé. Installe-le avec: brew install ffmpeg');
    process.exit(1);
  }
  
  // Lister les vidéos (ignorer temp et uploaded)
  const files = await readdir(VIDEOS_DIR);
  const videos = files.filter(f => f.endsWith('.mp4') && !f.startsWith('.'));
  
  console.log(`📁 ${videos.length} vidéos trouvées\n`);
  
  let uploaded = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const filename of videos) {
    const parsed = parseFilename(filename);
    
    if (!parsed) {
      console.log(`⚠️  ${filename} - format invalide, skip`);
      skipped++;
      continue;
    }
    
    const { firstName, lastName } = parsed;
    console.log(`🔍 ${firstName} ${lastName}...`);
    
    // Vérifier si l'actrice existe en DB
    const result = await sql`
      SELECT id, gif_url FROM actresses 
      WHERE LOWER(first_name) = ${firstName.toLowerCase()} 
      AND LOWER(last_name) = ${lastName.toLowerCase()}
    `;
    
    if (result.rows.length === 0) {
      console.log(`  ⚠️  Actrice non trouvée en DB, skip`);
      skipped++;
      continue;
    }
    
    const actress = result.rows[0];
    
    // Skip si déjà une vidéo
    if (actress.gif_url) {
      console.log(`  ⏭️  Vidéo déjà présente, skip`);
      skipped++;
      continue;
    }
    
    // Traiter la vidéo (couper + compresser)
    const inputPath = path.join(VIDEOS_DIR, filename);
    
    // Nom final: {id}-spicy.mp4 (comme les images)
    const finalFilename = `${actress.id}-spicy.mp4`;
    const tempPath = path.join(TEMP_DIR, finalFilename);
    
    console.log(`  ⚙️  Compression...`);
    const processed = await processVideo(inputPath, tempPath);
    
    if (!processed) {
      errors++;
      continue;
    }
    
    // Upload vers Vercel Blob
    console.log(`  ☁️  Upload...`);
    try {
      const fileBuffer = await readFile(tempPath);
      const blob = await put(`spicy/${finalFilename}`, fileBuffer, {
        access: 'public',
        contentType: 'video/mp4',
      });
      
      // Mettre à jour la DB
      await sql`
        UPDATE actresses 
        SET gif_url = ${blob.url}
        WHERE id = ${actress.id}
      `;
      
      console.log(`  ✅ OK - ${blob.url}`);
      uploaded++;
      
      // Supprimer le fichier temp
      await unlink(tempPath);
      
      // Archiver la vidéo originale
      const archivePath = path.join(ARCHIVE_DIR, filename);
      await rename(inputPath, archivePath);
      console.log(`  📦 Archivée dans ${ARCHIVE_DIR}/`);
      
    } catch (error) {
      console.error(`  ❌ Erreur upload: ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Uploadées: ${uploaded}`);
  console.log(`   ⏭️  Skippées: ${skipped}`);
  console.log(`   ❌ Erreurs: ${errors}`);
}

uploadVideos();