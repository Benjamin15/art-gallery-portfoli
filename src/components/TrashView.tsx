import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import { ArrowCounterClockwise, Trash, Palette, Wine, Hammer } from '@phosphor-icons/react'
import { StoredImage } from './StoredImage'

interface Artwork {
  id: string
  title: string
  description: string
  category: 'sculptures' | 'verres' | 'peintures'
  imageUrl: string
  year?: string
  medium?: string
  dimensions?: string
  isDeleted?: boolean
  deletedAt?: string
}

interface TrashViewProps {
  deletedArtworks: Artwork[]
  onRestore: (artworkId: string) => void
  onPermanentDelete: (artworkId: string) => void
}

export function TrashView({ deletedArtworks, onRestore, onPermanentDelete }: TrashViewProps) {
  const categories = {
    sculptures: { 
      label: 'Sculptures', 
      icon: Hammer, 
      color: 'bg-amber-100 text-amber-800' 
    },
    verres: { 
      label: 'Verres', 
      icon: Wine, 
      color: 'bg-blue-100 text-blue-800' 
    },
    peintures: { 
      label: 'Peintures', 
      icon: Palette, 
      color: 'bg-purple-100 text-purple-800' 
    }
  }

  const formatDeletedDate = (deletedAt: string) => {
    const date = new Date(deletedAt)
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const TrashArtworkCard = ({ artwork }: { artwork: Artwork }) => {
    const CategoryIcon = categories[artwork.category].icon
    
    return (
      <Card className="group overflow-hidden border-0 shadow-sm opacity-75">
        <div className="relative">
          <div className="aspect-square overflow-hidden bg-gray-100">
            <StoredImage 
              src={artwork.imageUrl} 
              alt={artwork.title}
              className="w-full h-full object-cover grayscale"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex gap-2">
            {/* Restore Button */}
            <Button
              variant="default"
              size="icon"
              className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onRestore(artwork.id)}
            >
              <ArrowCounterClockwise size={14} />
            </Button>
            
            {/* Permanent Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="w-8 h-8"
                >
                  <Trash size={14} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer définitivement</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer définitivement "{artwork.title}" ? 
                    Cette action est irréversible et l'œuvre ne pourra plus être récupérée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onPermanentDelete(artwork.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer définitivement
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="artwork-title text-foreground">
              {artwork.title}
            </h3>
            <Badge variant="secondary" className={categories[artwork.category].color}>
              <CategoryIcon size={14} className="mr-1" />
              {categories[artwork.category].label}
            </Badge>
          </div>
          
          {artwork.deletedAt && (
            <p className="text-xs text-red-600 mb-2">
              Supprimé le {formatDeletedDate(artwork.deletedAt)}
            </p>
          )}
          
          {artwork.year && (
            <p className="text-sm text-muted-foreground mb-2">{artwork.year}</p>
          )}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {artwork.description}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (deletedArtworks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Trash size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Corbeille vide
          </h3>
          <p className="text-muted-foreground">
            Aucune œuvre supprimée. Les œuvres supprimées apparaîtront ici et pourront être restaurées.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-medium text-foreground mb-2">
          Corbeille ({deletedArtworks.length})
        </h2>
        <p className="text-muted-foreground">
          Les œuvres supprimées peuvent être restaurées ou supprimées définitivement
        </p>
      </div>
      
      <div className="gallery-grid">
        {deletedArtworks.map(artwork => (
          <TrashArtworkCard key={artwork.id} artwork={artwork} />
        ))}
      </div>
    </div>
  )
}