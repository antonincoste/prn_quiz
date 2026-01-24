# The P0rn Quiz

Quiz game où les joueurs doivent reconnaître des actrices en 60 secondes.

## Stack

- **Frontend** : React + Vite + Tailwind CSS
- **Backend** : Vercel Serverless Functions
- **Database** : Neon (PostgreSQL)
- **Storage** : Vercel Blob (images)
- **Hosting** : Vercel

---

## Structure du projet

```
prn-quiz/
├── api/                    # Serverless functions (Vercel)
│   ├── actresses.js        # GET - Liste des actrices
│   ├── stats.js            # POST - Mise à jour des stats
│   └── subscribe.js        # POST - Newsletter
├── scripts/                # Scripts utilitaires
│   ├── import-actresses.js # Import des actrices en DB
│   ├── upload-images.js    # Upload images vers Vercel Blob
│   └── update-image-urls.js# Mise à jour des URLs en DB
├── src/
│   ├── App.jsx             # Composant principal (quiz)
│   ├── actress.js          # Données locales (fallback dev)
│   └── ...
├── images/                 # Images à uploader (non versionné)
├── .env.local              # Variables d'environnement (non versionné)
└── image-urls.txt          # URLs générées après upload (non versionné)
```

---

## Commandes

### Développement

```bash
# Lancer en local (avec API routes)
npx vercel dev

# ⚠️ Ne pas utiliser `npm run dev` - les API routes ne fonctionnent pas
```

### Déploiement

```bash
# Push sur la branche dev → déploie sur preview
git add .
git commit -m "message"
git push origin dev

# Merger dev → main pour la prod
git checkout main
git merge dev
git push origin main
```

---

## Gestion des actrices

### 1. Ajouter des actrices en DB

Modifier le tableau dans `scripts/import-actresses.js` puis :

```bash
node scripts/import-actresses.js
```

### 2. Uploader des images

```bash
# 1. Placer les images dans le dossier images/
#    Format du nom : prenom-nom.jpg (ex: lana-rhoades.jpg)

# 2. Upload vers Vercel Blob
node scripts/upload-images.js

# 3. Mettre à jour les URLs en DB
node scripts/update-image-urls.js
```

### Format des noms de fichiers

| Nom en DB | Nom du fichier |
|-----------|----------------|
| Lana Rhoades | `lana-rhoades.jpg` |
| Mia Khalifa | `mia-khalifa.jpg` |
| Kagney Linn Karter | `kagney-linn-karter.jpg` |

### Taille recommandée des images

- **Ratio** : 5:7 (portrait)
- **Taille idéale** : 500 x 700 px
- **Format** : JPEG ou WebP

---

## Base de données

### Environnements

| Environnement | Base de données | Usage |
|---------------|-----------------|-------|
| Development | `prn-quiz-dev` | Tests locaux |
| Preview | `prn-quiz-dev` | Branches de preview |
| Production | `prn-quiz-prod` | Site live |

### Schéma

```sql
-- Table actresses
CREATE TABLE IF NOT EXISTS actresses (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  image_url_1 TEXT,
  image_url_2 TEXT,
  is_blonde BOOLEAN DEFAULT FALSE,
  is_brunette BOOLEAN DEFAULT FALSE,
  is_busty BOOLEAN DEFAULT FALSE,
  is_curvy BOOLEAN DEFAULT FALSE,
  times_shown INTEGER DEFAULT 0,
  times_guessed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Requêtes utiles

```sql
-- Voir toutes les actrices avec images
SELECT first_name, last_name, image_url_1 FROM actresses WHERE image_url_1 != '';

-- Reset des stats
UPDATE actresses SET times_shown = 0, times_guessed = 0;

-- Supprimer tous les subscribers (tests)
DELETE FROM subscribers;

-- Voir les stats de popularité
SELECT first_name, last_name, times_shown, times_guessed,
       ROUND(times_guessed::numeric / NULLIF(times_shown, 0) * 100, 1) as success_rate
FROM actresses
ORDER BY times_shown DESC;
```

---

## Variables d'environnement

### Récupérer les variables depuis Vercel

```bash
npx vercel env pull .env.local
```

### Variables requises

```env
POSTGRES_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

---

## API Routes

### GET /api/actresses

Retourne la liste des actrices.

```javascript
// Response
{
  "actresses": [
    {
      "id": 1,
      "firstName": "Lana",
      "lastName": "Rhoades",
      "image": "https://...",
      "isBlonde": false,
      "isBrunette": true,
      "isBusty": true,
      "isCurvy": false
    }
  ]
}
```

Query params (pour V2) :
- `blonde=true` - Filtrer les blondes
- `brunette=true` - Filtrer les brunes
- `busty=true` - Filtrer busty
- `curvy=true` - Filtrer curvy
- `limit=50` - Nombre max d'actrices

### POST /api/stats

Met à jour les statistiques après chaque réponse.

```javascript
// Request
{
  "actressId": 1,
  "guessed": true  // true = trouvé, false = skip ou mauvaise réponse
}
```

### POST /api/subscribe

Enregistre un email pour la newsletter.

```javascript
// Request
{
  "email": "user@example.com"
}
```

---

## Troubleshooting

### "POSTGRES_URL not found"

```bash
npx vercel env pull .env.local
```

### "invalid_connection_string" dans les scripts

Les scripts doivent utiliser `sql` de `@vercel/postgres`, pas `createPool`.

### Images qui ne s'affichent pas

1. Vérifier que l'URL est en DB : `SELECT image_url_1 FROM actresses WHERE first_name = 'Lana';`
2. Vérifier que l'URL est accessible dans le navigateur
3. En local, utiliser `npx vercel dev` (pas `npm run dev`)

### API routes 404 en local

Utiliser `npx vercel dev` au lieu de `npm run dev`.

---

## Roadmap V2

- [ ] Catégories (blonde, brunette, etc.)
- [ ] Niveaux de difficulté
- [ ] Leaderboard
- [ ] Statistiques personnelles
- [ ] Mode challenge