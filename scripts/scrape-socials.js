// Script pour récupérer les liens sociaux des actrices depuis Babepedia
// Usage: node scripts/scrape-socials.js
// Output: socials.csv

import axios from 'axios';
import { sql } from '@vercel/postgres';
import { config } from 'dotenv';
import fs from 'fs';

config({ path: '.env.local' });

// Délai entre les requêtes pour éviter le rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getActressSocials(firstName, lastName) {
  // Essayer d'abord IAFD (plus permissif)
  const iafdName = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`;
  const iafdUrl = `https://www.iafd.com/person.rme/perfid=${iafdName}/gender=f/${firstName.toLowerCase()}-${lastName.toLowerCase()}.htm`;
  
  // Fallback: essayer avec le format babepedia
  const babepediaName = `${firstName}_${lastName}`;
  const babepediaUrl = `https://www.babepedia.com/babe/${babepediaName}`;
  
  let instagram = null;
  let onlyfans = null;
  let twitter = null;
  
  // Essayer IAFD d'abord
  try {
    const res = await axios.get(iafdUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://www.google.com/',
      },
      timeout: 10000,
    });
    
    if (res.status === 200 && res.data.length > 1000) {
      const html = res.data;
      
      const instagramMatch = html.match(/href="(https?:\/\/(www\.)?instagram\.com\/[^"]+)"/i);
      const onlyfansMatch = html.match(/href="(https?:\/\/(www\.)?onlyfans\.com\/[^"]+)"/i);
      const twitterMatch = html.match(/href="(https?:\/\/(www\.)?(twitter|x)\.com\/[^"]+)"/i);
      
      if (instagramMatch) instagram = instagramMatch[1];
      if (onlyfansMatch) onlyfans = onlyfansMatch[1];
      if (twitterMatch) twitter = twitterMatch[1];
      
      if (instagram || onlyfans) {
        return { instagram, onlyfans, twitter };
      }
    }
  } catch (e) {
    // IAFD failed, continue
  }
  
  // Essayer FreeOnes
  try {
    const freeonesUrl = `https://www.freeones.com/${firstName.toLowerCase()}-${lastName.toLowerCase()}/bio`;
    const res = await axios.get(freeonesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
      },
      timeout: 10000,
    });
    
    if (res.status === 200 && res.data.length > 1000) {
      const html = res.data;
      
      const instagramMatch = html.match(/href="(https?:\/\/(www\.)?instagram\.com\/[^"]+)"/i);
      const onlyfansMatch = html.match(/href="(https?:\/\/(www\.)?onlyfans\.com\/[^"]+)"/i);
      const twitterMatch = html.match(/href="(https?:\/\/(www\.)?(twitter|x)\.com\/[^"]+)"/i);
      
      if (instagramMatch) instagram = instagramMatch[1];
      if (onlyfansMatch) onlyfans = onlyfansMatch[1];
      if (twitterMatch) twitter = twitterMatch[1];
    }
  } catch (e) {
    // FreeOnes failed
  }
  
  return { instagram, onlyfans, twitter };
}

async function scrapeSocials() {
  console.log('🚀 Fetching actresses from database...\n');
  
  // Récupérer toutes les actrices
  const result = await sql`
    SELECT id, first_name, last_name, instagram_url, onlyfans_url
    FROM actresses
    ORDER BY id
  `;
  
  const actresses = result.rows;
  console.log(`Found ${actresses.length} actresses\n`);
  
  const results = [];
  
  for (const actress of actresses) {
    console.log(`🔍 ${actress.first_name} ${actress.last_name}...`);
    
    const socials = await getActressSocials(actress.first_name, actress.last_name);
    
    results.push({
      id: actress.id,
      first_name: actress.first_name,
      last_name: actress.last_name,
      instagram_current: actress.instagram_url || '',
      instagram_found: socials.instagram || '',
      onlyfans_current: actress.onlyfans_url || '',
      onlyfans_found: socials.onlyfans || '',
      twitter_found: socials.twitter || '',
    });
    
    if (socials.instagram || socials.onlyfans || socials.twitter) {
      console.log(`  ✅ Found: ${socials.instagram ? 'IG ' : ''}${socials.onlyfans ? 'OF ' : ''}${socials.twitter ? 'X' : ''}`);
    } else {
      console.log(`  ➖ No socials found`);
    }
    
    // Pause entre les requêtes
    await delay(1500);
  }
  
  // Générer le CSV
  const header = 'id,first_name,last_name,instagram_current,instagram_found,onlyfans_current,onlyfans_found,twitter_found';
  const rows = results.map(r => 
    `${r.id},"${r.first_name}","${r.last_name}","${r.instagram_current}","${r.instagram_found}","${r.onlyfans_current}","${r.onlyfans_found}","${r.twitter_found}"`
  );
  
  const csv = [header, ...rows].join('\n');
  fs.writeFileSync('./socials.csv', csv);
  
  console.log('\n📝 Results saved to socials.csv');
  
  // Stats
  const withInstagram = results.filter(r => r.instagram_found).length;
  const withOnlyfans = results.filter(r => r.onlyfans_found).length;
  const withTwitter = results.filter(r => r.twitter_found).length;
  
  console.log(`\n📊 Stats:`);
  console.log(`   Instagram found: ${withInstagram}/${actresses.length}`);
  console.log(`   OnlyFans found: ${withOnlyfans}/${actresses.length}`);
  console.log(`   Twitter found: ${withTwitter}/${actresses.length}`);
}

scrapeSocials();