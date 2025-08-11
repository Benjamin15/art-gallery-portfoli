# Système de Sauvegarde de la Galerie

## Vue d'ensemble

Le système de sauvegarde permet d'exporter et d'importer toutes les données de la galerie, y compris les métadonnées des œuvres et les images en base64.

## Fonctionnalités

### Export de Sauvegarde
- **Contenu exporté** : Toutes les œuvres (actives et supprimées) avec leurs images
- **Format** : Fichier JSON contenant métadonnées et images encodées en base64
- **Nom du fichier** : `gallery-backup-YYYY-MM-DD.json`
- **Progression** : Barre de progression en temps réel pendant l'export

### Import de Sauvegarde
- **Méthodes** : Upload de fichier ou collage de données JSON
- **Validation** : Vérification du format avant import
- **Remplacement** : Remplace toutes les données existantes
- **Progression** : Barre de progression en temps réel pendant l'import

## Utilisation

### Créer une Sauvegarde
1. Connectez-vous à l'interface admin (`/admin`)
2. Cliquez sur le bouton "Sauvegarde"
3. Dans la section "Exporter la Galerie", cliquez sur "Télécharger la Sauvegarde"
4. Le fichier sera automatiquement téléchargé

### Restaurer une Sauvegarde
1. Dans l'interface de sauvegarde, utilisez l'une des méthodes :
   - **Fichier** : Sélectionnez le fichier `.json` de sauvegarde
   - **JSON** : Collez le contenu du fichier dans la zone de texte
2. Cliquez sur "Restaurer la Sauvegarde"
3. ⚠️ **Attention** : Cela remplacera toutes les données actuelles

## Bonnes Pratiques

### Sauvegarde Régulière
- Créez des sauvegardes avant d'ajouter de nouvelles œuvres importantes
- Effectuez des sauvegardes hebdomadaires ou mensuelles
- Gardez plusieurs versions historiques

### Stockage Sécurisé
- **Cloud** : Dropbox, Google Drive, OneDrive
- **Stockage local** : Disque dur externe, NAS
- **Git** : Pour les petites galeries uniquement (voir limitations ci-dessous)

### Contrôle de Version avec Git

#### Configuration Recommandée
```bash
# Dans votre projet
mkdir backups
echo "*.json" >> backups/.gitignore
```

#### Pour Sauvegarder sur Git (Limitations)
⚠️ **Attention** : Git n'est pas optimisé pour les gros fichiers binaires

**Taille limite recommandée** : < 10 MB par fichier de sauvegarde
**Alternative pour grandes galeries** : Utilisez Git LFS ou un service cloud

```bash
# Si la sauvegarde est petite (< 10 MB)
cp gallery-backup-2024-01-15.json backups/
git add backups/gallery-backup-2024-01-15.json
git commit -m "Backup: Gallery avec X œuvres"
git push
```

#### Avec Git LFS (pour gros fichiers)
```bash
# Installation et configuration
git lfs install
git lfs track "backups/*.json"
git add .gitattributes

# Ajout de sauvegardes
cp gallery-backup-2024-01-15.json backups/
git add backups/gallery-backup-2024-01-15.json
git commit -m "Backup: Gallery avec X œuvres"
git push
```

## Format de Sauvegarde

```json
{
  "artworks": [
    {
      "id": "unique-id",
      "title": "Titre de l'œuvre",
      "description": "Description...",
      "category": "sculptures",
      "imageUrl": "/images/timestamp.jpg",
      "year": "2024",
      "medium": "Bronze",
      "dimensions": "30x20x15 cm",
      "isDeleted": false
    }
  ],
  "images": {
    "/images/timestamp.jpg": "data:image/jpeg;base64,/9j/4AAQ..."
  },
  "exportDate": "2024-01-15T10:30:00.000Z",
  "version": "1.0"
}
```

## Dépannage

### Erreurs Communes

**"Format de sauvegarde invalide"**
- Vérifiez que le fichier JSON est valide
- Assurez-vous qu'il contient les champs `artworks` et `images`

**"Erreur lors de l'export"**
- Rechargez la page et réessayez
- Vérifiez que vous avez suffisamment d'espace disque

**"Import bloqué"**
- Les gros fichiers peuvent prendre du temps
- Attendez la fin de la barre de progression

### Récupération d'Urgence

Si vous perdez l'accès à l'interface admin :
1. Vérifiez vos sauvegardes cloud/locales
2. Utilisez une sauvegarde récente pour restaurer
3. Contactez l'administrateur système si nécessaire

## Sécurité

- Les sauvegardes contiennent toutes les images en base64
- Ne partagez les fichiers de sauvegarde qu'avec des personnes de confiance
- Conservez des sauvegardes dans des emplacements sécurisés
- Chiffrez les sauvegardes sensibles avant stockage cloud