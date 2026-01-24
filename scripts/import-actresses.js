// Script d'import des actrices
// Usage: node scripts/import-actresses.js
// Nécessite: npm install @vercel/postgres dotenv

import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

// Charge .env.local
config({ path: '.env.local' });

const actresses = [
  // Top 50 - Tu devras ajouter les URLs d'images toi-même
  { first_name: "Lana", last_name: "Rhoades", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Mia", last_name: "Khalifa", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Riley", last_name: "Reid", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Mia", last_name: "Malkova", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: true },
  { first_name: "Angela", last_name: "White", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Abella", last_name: "Danger", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Madison", last_name: "Ivy", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Nicole", last_name: "Aniston", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Brandi", last_name: "Love", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Alexis", last_name: "Texas", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: true },
  { first_name: "Eva", last_name: "Lovia", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Dani", last_name: "Daniels", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Adriana", last_name: "Chechik", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Asa", last_name: "Akira", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Lisa", last_name: "Ann", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Kendra", last_name: "Lust", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Janice", last_name: "Griffith", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Emily", last_name: "Willis", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Gabbie", last_name: "Carter", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Autumn", last_name: "Falls", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Elsa", last_name: "Jean", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Lena", last_name: "Paul", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Valentina", last_name: "Nappi", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Kendra", last_name: "Sunderland", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Peta", last_name: "Jensen", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "August", last_name: "Ames", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Tori", last_name: "Black", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Jessa", last_name: "Rhodes", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Lexi", last_name: "Belle", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Remy", last_name: "Lacroix", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Jynx", last_name: "Maze", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Gianna", last_name: "Michaels", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Sasha", last_name: "Grey", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Jenna", last_name: "Jameson", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Jesse", last_name: "Jane", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Julia", last_name: "Ann", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Phoenix", last_name: "Marie", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Ava", last_name: "Addams", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Nikki", last_name: "Benz", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Jayden", last_name: "Jaymes", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Rachel", last_name: "Starr", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Bridgette", last_name: "B", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Kagney", last_name: "Linn Karter", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Keisha", last_name: "Grey", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Karlee", last_name: "Grey", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Alina", last_name: "Lopez", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Vina", last_name: "Sky", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Violet", last_name: "Myers", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Skylar", last_name: "Vox", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Blake", last_name: "Blossom", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },

  // --- Légendes & Stars établies ---
  { first_name: "Jenna", last_name: "Haze", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Tera", last_name: "Patrick", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Briana", last_name: "Banks", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Belladonna", last_name: "", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Stoya", last_name: "", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Kayden", last_name: "Kross", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Katsuni", last_name: "", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Tory", last_name: "Lane", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Silvia", last_name: "Saint", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Asia", last_name: "Carrera", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Shyla", last_name: "Stylez", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Sunny", last_name: "Leone", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Bree", last_name: "Olson", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Faye", last_name: "Reagan", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: false, is_busty: false, is_curvy: false }, // Rousse
  { first_name: "Ashlynn", last_name: "Brooke", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Teanna", last_name: "Trump", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Skin", last_name: "Diamond", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Bonnie", last_name: "Rotten", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Misty", last_name: "Stone", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Jada", last_name: "Fire", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },

  // --- MILFs & Mature Popular ---
  { first_name: "Cherie", last_name: "DeVille", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Cory", last_name: "Chase", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Sara", last_name: "Jay", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Sophie", last_name: "Dee", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Romi", last_name: "Rain", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Alexis", last_name: "Fawx", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Maitland", last_name: "Ward", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: false, is_busty: true, is_curvy: true }, // Rousse/Auburn
  { first_name: "India", last_name: "Summer", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Ryan", last_name: "Conner", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Dee", last_name: "Williams", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Anikka", last_name: "Albrite", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Raylene", last_name: "", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Hitomi", last_name: "Tanaka", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "London", last_name: "River", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Sarah", last_name: "Vandella", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Richelle", last_name: "Ryan", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Savana", last_name: "Styles", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },

  // --- Stars Modernes & Actuelles ---
  { first_name: "Eva", last_name: "Elfie", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Liya", last_name: "Silver", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Little", last_name: "Caprice", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Jia", last_name: "Lissa", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: false, is_busty: false, is_curvy: false }, // Rousse
  { first_name: "Sweetie", last_name: "Fox", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: false, is_busty: true, is_curvy: true }, // Rousse
  { first_name: "Anissa", last_name: "Kate", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Gina", last_name: "Valentina", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Kelsi", last_name: "Monroe", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Rose", last_name: "Monroe", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Ariana", last_name: "Marie", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Scarlit", last_name: "Scandal", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Megan", last_name: "Rain", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Jada", last_name: "Stevens", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Lauren", last_name: "Phillips", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: false, is_busty: true, is_curvy: false }, // Rousse
  { first_name: "Charlotte", last_name: "Stokely", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Dillion", last_name: "Harper", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Kira", last_name: "Noir", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Honey", last_name: "Gold", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Xev", last_name: "Bellringer", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "A.J.", last_name: "Applegate", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Kenzie", last_name: "Reeves", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Sky", last_name: "Pierce", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Naomi", last_name: "Swann", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Jill", last_name: "Kassidy", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Elena", last_name: "Koshka", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Adria", last_name: "Rae", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Eliza", last_name: "Ibarra", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Gia", last_name: "Derza", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Tru", last_name: "Kait", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Karma", last_name: "Rx", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: false, is_busty: true, is_curvy: true }, // Rousse/Colorée
  { first_name: "Alex", last_name: "Coal", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Maddy", last_name: "O'Reilly", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Aidra", last_name: "Fox", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Carter", last_name: "Cruise", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Aletta", last_name: "Ocean", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false }, // Varie, souvent brune
  { first_name: "Penny", last_name: "Pax", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Veronica", last_name: "Rodriguez", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Luna", last_name: "Star", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Pristine", last_name: "Edge", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Sinn", last_name: "Sage", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Daisy", last_name: "Marie", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: true },
  { first_name: "Yurizan", last_name: "Beltran", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Dakota", last_name: "Skye", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Lena", last_name: "Anderson", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Lucy", last_name: "Li", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Sybil", last_name: "", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Foxy", last_name: "Di", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: false, is_busty: false, is_curvy: true }, // Rousse
  { first_name: "Emily", last_name: "Bloom", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Katrina", last_name: "Jade", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Kleio", last_name: "Valentien", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Monique", last_name: "Alexander", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Anna", last_name: "Bell Peaks", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Brooklyn", last_name: "Chase", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Chanel", last_name: "Preston", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Natasha", last_name: "Nice", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Ashly", last_name: "Anderson", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Tiffany", last_name: "Watson", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Bunny", last_name: "Colby", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Havana", last_name: "Bleu", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Lulu", last_name: "Chu", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Jane", last_name: "Wilde", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Evelyn", last_name: "Claire", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Haley", last_name: "Reed", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Piper", last_name: "Perri", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Mandy", last_name: "Muse", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Courtney", last_name: "Cummz", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Diamond", last_name: "Foxxx", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Reagan", last_name: "Foxx", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Kendra", last_name: "Spade", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Audrey", last_name: "Bitoni", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Lylith", last_name: "Lavey", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: false, is_busty: false, is_curvy: false } // Rousse
];

async function importActresses() {
  console.log('🚀 Starting import...');
  
  let imported = 0;
  let skipped = 0;

  for (const actress of actresses) {
    try {
      await sql`
        INSERT INTO actresses (
          first_name, 
          last_name, 
          image_url_1, 
          image_url_2, 
          is_blonde, 
          is_brunette, 
          is_busty, 
          is_curvy
        )
        VALUES (
          ${actress.first_name},
          ${actress.last_name},
          ${actress.image_url_1},
          ${actress.image_url_2 || null},
          ${actress.is_blonde},
          ${actress.is_brunette},
          ${actress.is_busty},
          ${actress.is_curvy}
        )
        ON CONFLICT DO NOTHING
      `;
      console.log(`✅ ${actress.first_name} ${actress.last_name}`);
      imported++;
    } catch (error) {
      console.error(`❌ ${actress.first_name} ${actress.last_name}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n🏁 Done! Imported: ${imported}, Skipped: ${skipped}`);
}

importActresses();