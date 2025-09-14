# Galerie d'art de Michel Mailhot (Statique)

Application React (Vite + TypeScript + Tailwind) servant une galerie d'œuvres (verre et sculpture) à partir d’un JSON statique. Aucun serveur requis: les données sont lues depuis `public/data/kv.json`, les images depuis `public/assets/` ou des data URLs. Le routage est basé sur le hash (HashRouter) pour un déploiement simple (GitHub Pages compris).

## Fonctionnalités
- Galerie d’images par catégories (Tout, Sculptures, Verres)
- Autobiographie avec petite photo (avatar)
- Données statiques (JSON) fusionnées avec localStorage (si des valeurs locales existent)
- Build statique portable (assets en chemins relatifs)

## Structure des données
Fichier: `public/data/kv.json`

- `gallery-artworks`: tableau d’œuvres
	- `id` (string)
	- `title` (string)
	- `description` (string)
	- `category` ('sculptures' | 'verres' | 'peintures' — les peintures sont ignorées à l’affichage)
	- `imageUrl` (string) — peut être un chemin “/images/...”, une data URL, ou une URL publique
	- `year`, `medium`, `dimensions` (optionnels)
- `images`: map optionnelle des chemins `/images/...` → data URL (base64)
- `bio`: texte de présentation
- `bioPhoto`: chemin relatif (ex: `assets/xxx.jpg`) ou data URL

Notes:
- Les clés sans slash (ex: `bio`, `bioPhoto`) sont lues telles quelles par le shim.
- Les clés d’images commençant par `/images/` sont résolues via le shim `StoredImage`.

## Développement

Pré-requis: Node 20+

Installation:
```sh
npm install
```

Lancer en dev (Vite):
```sh
npm run dev
```

Build production:
```sh
npm run build
```

Prévisualisation du build:
```sh
npm run preview
```

## Déploiement GitHub Pages

- Le projet est configuré avec `HashRouter` et `base: './'` dans `vite.config.ts`.
- Un workflow GitHub Actions (`.github/workflows/deploy-pages.yml`) construit et déploie `dist/`.
- Sur push vers `main`, la page est publiée automatiquement.

Si vous déployez manuellement ailleurs, servez le dossier `dist/` tel quel. Les chemins d’assets étant relatifs, cela fonctionne sans configuration serveur.

## Astuces & Dépannage
- Page blanche en statique: utiliser `HashRouter` (déjà en place) et ouvrir l’URL avec `#/` (ex: `index.html#/`).
- 404 sur assets/CSS/JS: vérifier que `vite.config.ts` a `base: './'` et que vous servez bien le dossier `dist/`.
- Images bio: préférez un chemin relatif `assets/...` (copié depuis `public/assets/`) pour un build portable.

## Licence

MIT
