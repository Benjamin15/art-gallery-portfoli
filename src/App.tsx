import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Palette, Wine, Hammer, X, ChevronLeft, ChevronRight, Plus, UserGear, Trash, ArrowCounterClockwise, Archive } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { AdminUploadForm } from '@/components/AdminUploadForm'
import { StoredImage } from '@/components/StoredImage'
import { TrashView } from '@/components/TrashView'

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

function App() {
  const [artworks, setArtworks] = useKV<Artwork[]>('gallery-artworks', [])
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [showTrash, setShowTrash] = useState(false)

  // Check if current user is the owner
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const user = await spark.user()
        setIsOwner(user.isOwner)
      } catch (error) {
        console.error('Error checking user ownership:', error)
        setIsOwner(false)
      }
    }
    checkOwnership()
  }, [])

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

  const getArtworksByCategory = (category: string, includeDeleted = false) => {
    return artworks.filter(artwork => 
      artwork.category === category && 
      (includeDeleted ? artwork.isDeleted === true : !artwork.isDeleted)
    )
  }

  const getDeletedArtworks = () => {
    return artworks.filter(artwork => artwork.isDeleted === true)
  }

  const handleArtworkClick = (artwork: Artwork) => {
    setSelectedArtwork(artwork)
    const categoryArtworks = getArtworksByCategory(artwork.category)
    const index = categoryArtworks.findIndex(a => a.id === artwork.id)
    setCurrentImageIndex(index)
  }

  const handleUploadSuccess = () => {
    // Force page refresh to show the new artwork
    window.location.reload()
  }

  const handleDeleteArtwork = async (artworkId: string) => {
    try {
      // Move artwork to trash instead of permanent deletion
      setArtworks(currentArtworks => 
        currentArtworks.map(artwork => 
          artwork.id === artworkId 
            ? { ...artwork, isDeleted: true, deletedAt: new Date().toISOString() }
            : artwork
        )
      )
      
      // Close the detail dialog if the deleted artwork was selected
      if (selectedArtwork?.id === artworkId) {
        setSelectedArtwork(null)
      }
      
      // Force page refresh to ensure UI is updated
      window.location.reload()
    } catch (error) {
      console.error('Error moving artwork to trash:', error)
    }
  }

  const handleRestoreArtwork = async (artworkId: string) => {
    try {
      // Restore artwork from trash
      setArtworks(currentArtworks => 
        currentArtworks.map(artwork => 
          artwork.id === artworkId 
            ? { ...artwork, isDeleted: false, deletedAt: undefined }
            : artwork
        )
      )
      
      // Force page refresh to ensure UI is updated
      window.location.reload()
    } catch (error) {
      console.error('Error restoring artwork:', error)
    }
  }

  const handlePermanentDeleteArtwork = async (artworkId: string) => {
    try {
      // Permanently remove artwork from array
      setArtworks(currentArtworks => 
        currentArtworks.filter(artwork => artwork.id !== artworkId)
      )
      
      // Force page refresh to ensure UI is updated
      window.location.reload()
    } catch (error) {
      console.error('Error permanently deleting artwork:', error)
    }
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedArtwork) return
    
    const categoryArtworks = getArtworksByCategory(selectedArtwork.category)
    let newIndex = currentImageIndex
    
    if (direction === 'prev') {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : categoryArtworks.length - 1
    } else {
      newIndex = currentImageIndex < categoryArtworks.length - 1 ? currentImageIndex + 1 : 0
    }
    
    setCurrentImageIndex(newIndex)
    setSelectedArtwork(categoryArtworks[newIndex])
  }

  const ArtworkCard = ({ artwork }: { artwork: Artwork }) => {
    const CategoryIcon = categories[artwork.category].icon
    
    return (
      <Card className="group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="relative">
          <div 
            className="aspect-square overflow-hidden bg-gray-100"
            onClick={() => handleArtworkClick(artwork)}
          >
            <StoredImage 
              src={artwork.imageUrl} 
              alt={artwork.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          
          {/* Admin Delete Button */}
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash size={14} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Déplacer vers la corbeille</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir déplacer "{artwork.title}" vers la corbeille ? 
                    Vous pourrez la restaurer depuis la corbeille.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteArtwork(artwork.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Déplacer vers la corbeille
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        <CardContent className="p-6" onClick={() => handleArtworkClick(artwork)}>
          <div className="flex items-start justify-between mb-3">
            <h3 className="artwork-title text-foreground group-hover:text-accent transition-colors">
              {artwork.title}
            </h3>
            <Badge variant="secondary" className={categories[artwork.category].color}>
              <CategoryIcon size={14} className="mr-1" />
              {categories[artwork.category].label}
            </Badge>
          </div>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="gallery-title text-center text-foreground">
                Galerie d'Art
              </h1>
              <p className="text-center text-muted-foreground mt-2 max-w-2xl mx-auto">
                Une collection personnelle de sculptures, œuvres en verre et peintures, 
                chaque pièce racontant sa propre histoire artistique.
              </p>
            </div>
            
            {/* Admin Buttons */}
            {isOwner && (
              <div className="hidden sm:flex items-center gap-3">
                <Button
                  variant={showTrash ? "default" : "outline"}
                  onClick={() => setShowTrash(!showTrash)}
                  className="flex items-center gap-2"
                >
                  <Archive size={18} />
                  {showTrash ? 'Galerie' : `Corbeille (${getDeletedArtworks().length})`}
                </Button>
                
                {!showTrash && (
                  <Button
                    onClick={() => setIsUploadFormOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Ajouter une œuvre
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile Admin Buttons */}
          {isOwner && (
            <div className="sm:hidden mt-4 text-center space-y-3">
              <Button
                variant={showTrash ? "default" : "outline"}
                onClick={() => setShowTrash(!showTrash)}
                className="flex items-center gap-2 mx-auto"
              >
                <Archive size={18} />
                {showTrash ? 'Galerie' : `Corbeille (${getDeletedArtworks().length})`}
              </Button>
              
              {!showTrash && (
                <Button
                  onClick={() => setIsUploadFormOpen(true)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus size={18} />
                  Ajouter une œuvre
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {showTrash ? (
          <TrashView 
            deletedArtworks={getDeletedArtworks()}
            onRestore={handleRestoreArtwork}
            onPermanentDelete={handlePermanentDeleteArtwork}
          />
        ) : (
          <Tabs defaultValue="sculptures" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-12">
              {Object.entries(categories).map(([key, category]) => {
                const Icon = category.icon
                return (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                    <Icon size={18} />
                    {category.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {Object.keys(categories).map(category => (
              <TabsContent key={category} value={category}>
                <div className="gallery-grid">
                  {getArtworksByCategory(category).length > 0 ? (
                    getArtworksByCategory(category).map(artwork => (
                      <ArtworkCard key={artwork.id} artwork={artwork} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-16">
                      <div className="max-w-md mx-auto">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                          {React.createElement(categories[category as keyof typeof categories].icon, { 
                            size: 32, 
                            className: "text-muted-foreground" 
                          })}
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          Aucune œuvre dans cette catégorie
                        </h3>
                        <p className="text-muted-foreground">
                          Les {categories[category as keyof typeof categories].label.toLowerCase()} seront bientôt ajoutées à la collection.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      {/* Artwork Detail Dialog */}
      <Dialog open={!!selectedArtwork} onOpenChange={() => setSelectedArtwork(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 border-0">
          {selectedArtwork && (
            <div className="flex flex-col lg:flex-row h-full">
              {/* Image Section */}
              <div className="flex-1 relative bg-black">
                <StoredImage 
                  src={selectedArtwork.imageUrl} 
                  alt={selectedArtwork.title}
                  className="w-full h-full object-contain"
                />
                
                {/* Navigation Buttons */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={() => navigateImage('prev')}
                >
                  <ChevronLeft size={24} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={() => navigateImage('next')}
                >
                  <ChevronRight size={24} />
                </Button>

                {/* Close Button */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white"
                  onClick={() => setSelectedArtwork(null)}
                >
                  <X size={24} />
                </Button>
                
                {/* Admin Delete Button */}
                {isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        className="absolute top-4 right-16 bg-red-600/80 hover:bg-red-600 text-white"
                      >
                        <Trash size={20} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Déplacer vers la corbeille</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir déplacer "{selectedArtwork.title}" vers la corbeille ? 
                          Vous pourrez la restaurer depuis la corbeille.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteArtwork(selectedArtwork.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Déplacer vers la corbeille
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {/* Info Section */}
              <div className="lg:w-96 p-8 bg-card overflow-y-auto">
                <DialogHeader className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={categories[selectedArtwork.category].color}>
                      {React.createElement(categories[selectedArtwork.category].icon, { 
                        size: 14, 
                        className: "mr-1" 
                      })}
                      {categories[selectedArtwork.category].label}
                    </Badge>
                  </div>
                  <DialogTitle className="text-2xl font-medium text-left">
                    {selectedArtwork.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {selectedArtwork.year && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Année
                      </h4>
                      <p className="text-foreground">{selectedArtwork.year}</p>
                    </div>
                  )}

                  {selectedArtwork.medium && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Technique
                      </h4>
                      <p className="text-foreground">{selectedArtwork.medium}</p>
                    </div>
                  )}

                  {selectedArtwork.dimensions && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Dimensions
                      </h4>
                      <p className="text-foreground">{selectedArtwork.dimensions}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                      Description
                    </h4>
                    <p className="text-foreground leading-relaxed whitespace-pre-line">
                      {selectedArtwork.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Upload Form */}
      <AdminUploadForm 
        isOpen={isUploadFormOpen}
        onClose={() => setIsUploadFormOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
}

export default App