import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Palette, Wine, Hammer, X, CaretLeft, CaretRight, UserGear, SquaresFour, MagnifyingGlass, SortAscending } from '@phosphor-icons/react'
import { useKV } from '@/hooks/useKV-shim'
import { StoredImage } from '@/components/StoredImage'
import { Link } from 'react-router-dom'

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

export function GalleryPage() {
  const [artworks, setArtworks] = useKV<Artwork[]>('gallery-artworks', [])
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name')

  const categories = {
    all: {
      label: 'Toutes les œuvres',
      icon: SquaresFour,
      color: 'bg-gray-100 text-gray-800'
    },
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

  // Get artworks by category including all, with filtering and sorting
  const getArtworksByCategory = (category: string) => {
    const activeArtworks = artworks.filter(artwork => artwork.isDeleted !== true)
    
    // Filter by category
    let filteredArtworks = category === 'all' 
      ? activeArtworks 
      : activeArtworks.filter(artwork => artwork.category === category)
    
    // Filter by search term
    if (searchTerm.trim()) {
      filteredArtworks = filteredArtworks.filter(artwork =>
        artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artwork.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Sort artworks
    filteredArtworks.sort((a, b) => {
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title)
      } else if (sortBy === 'date') {
        // Sort by year, then by title if no year
        const yearA = a.year || '0000'
        const yearB = b.year || '0000'
        if (yearA === yearB) {
          return a.title.localeCompare(b.title)
        }
        return yearB.localeCompare(yearA) // Most recent first
      }
      return 0
    })
    
    return filteredArtworks
  }

  const handleArtworkClick = (artwork: Artwork) => {
    setSelectedArtwork(artwork)
    const currentTabArtworks = getArtworksByCategory(activeTab)
    const index = currentTabArtworks.findIndex(a => a.id === artwork.id)
    setCurrentImageIndex(index)
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedArtwork) return
    
    const currentTabArtworks = getArtworksByCategory(activeTab)
    if (currentTabArtworks.length === 0) return
    
    let newIndex = currentImageIndex
    
    if (direction === 'prev') {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : currentTabArtworks.length - 1
    } else {
      newIndex = currentImageIndex < currentTabArtworks.length - 1 ? currentImageIndex + 1 : 0
    }
    
    setCurrentImageIndex(newIndex)
    setSelectedArtwork(currentTabArtworks[newIndex])
  }

  const ArtworkCard = ({ artwork }: { artwork: Artwork }) => {
    const CategoryIcon = categories[artwork.category as keyof typeof categories]?.icon || Palette
    
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
        </div>
        
        <CardContent className="p-6" onClick={() => handleArtworkClick(artwork)}>
          <div className="flex items-start justify-between mb-3">
            <h3 className="artwork-title text-foreground group-hover:text-accent transition-colors">
              {artwork.title}
            </h3>
            <Badge variant="secondary" className={categories[artwork.category as keyof typeof categories]?.color}>
              <CategoryIcon size={14} className="mr-1" />
              {categories[artwork.category as keyof typeof categories]?.label}
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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
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
            
            {/* Admin Link */}
            <div className="hidden sm:flex">
              <Link to="/admin">
                <Button variant="outline" className="flex items-center gap-2">
                  <UserGear size={18} />
                  Administration
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Mobile Admin Link */}
          <div className="sm:hidden mt-4 text-center">
            <Link to="/admin">
              <Button variant="outline" className="flex items-center gap-2 mx-auto">
                <UserGear size={18} />
                Administration
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content with Category Tabs */}
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="category-header text-center mb-8 text-muted-foreground">
            Parcourir par catégorie
          </h2>
          <Tabs defaultValue="all" className="w-full" onValueChange={(value) => {
            setActiveTab(value)
            setSearchTerm('') // Reset search when changing tabs
          }}>
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-12">
              {Object.entries(categories).map(([key, category]) => {
                const Icon = category.icon
                return (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                    <Icon size={18} />
                    <span className="hidden sm:inline">{category.label}</span>
                    <span className="sm:hidden">{key === 'all' ? 'Tout' : category.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {Object.keys(categories).map(category => (
              <TabsContent key={category} value={category}>
                {/* Filter and Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
                  <div className="flex-1 relative">
                    <MagnifyingGlass 
                      size={20} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                    />
                    <Input
                      placeholder="Rechercher par nom ou description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <SortAscending size={20} className="text-muted-foreground" />
                    <Select value={sortBy} onValueChange={(value: 'name' | 'date') => setSortBy(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nom A-Z</SelectItem>
                        <SelectItem value="date">Date (récent)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="gallery-grid">
                  {getArtworksByCategory(category).length > 0 ? (
                    getArtworksByCategory(category).map(artwork => (
                      <ArtworkCard key={artwork.id} artwork={artwork} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-16">
                      <div className="max-w-md mx-auto">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                          {searchTerm ? (
                            <MagnifyingGlass size={32} className="text-muted-foreground" />
                          ) : (
                            React.createElement(categories[category as keyof typeof categories].icon, { 
                              size: 32, 
                              className: "text-muted-foreground" 
                            })
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          {searchTerm 
                            ? 'Aucun résultat trouvé'
                            : category === 'all' ? 'Aucune œuvre' : 'Aucune œuvre dans cette catégorie'
                          }
                        </h3>
                        <p className="text-muted-foreground">
                          {searchTerm 
                            ? `Aucune œuvre ne correspond à "${searchTerm}". Essayez des termes différents.`
                            : category === 'all' 
                              ? 'La collection sera bientôt remplie d\'œuvres magnifiques.'
                              : `Les ${categories[category as keyof typeof categories].label.toLowerCase()} seront bientôt ajoutées à la collection.`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
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
                  <CaretLeft size={24} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={() => navigateImage('next')}
                >
                  <CaretRight size={24} />
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
              </div>

              {/* Info Section */}
              <div className="lg:w-96 p-8 bg-card overflow-y-auto">
                <DialogHeader className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={categories[selectedArtwork.category as keyof typeof categories]?.color}>
                      {React.createElement(categories[selectedArtwork.category as keyof typeof categories]?.icon || Palette, { 
                        size: 14, 
                        className: "mr-1" 
                      })}
                      {categories[selectedArtwork.category as keyof typeof categories]?.label}
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
    </div>
  )
}
