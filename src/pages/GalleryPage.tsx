import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Palette, Wine, Hammer, X, ChevronLeft, ChevronRight, UserGear, MagnifyingGlass, SortAscending, Funnel } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'recent'>('recent')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Keyboard shortcuts for search and navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Rechercher"]') as HTMLInputElement
        searchInput?.focus()
      }
      
      // Escape to clear search when input is focused
      if (e.key === 'Escape' && document.activeElement?.tagName === 'INPUT') {
        setSearchTerm('')
        ;(document.activeElement as HTMLInputElement).blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const categories = {
    all: {
      label: 'Toutes les œuvres',
      icon: Palette,
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

  // Filter and sort artworks based on current criteria
  const filteredAndSortedArtworks = useMemo(() => {
    let filtered = artworks.filter(artwork => artwork.isDeleted !== true)

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(artwork => 
        artwork.title.toLowerCase().includes(searchLower) ||
        artwork.description.toLowerCase().includes(searchLower) ||
        artwork.medium?.toLowerCase().includes(searchLower) ||
        artwork.year?.toLowerCase().includes(searchLower)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(artwork => artwork.category === selectedCategory)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'year':
          const yearA = a.year || '0'
          const yearB = b.year || '0'
          return yearB.localeCompare(yearA) // Most recent first
        case 'recent':
        default:
          return b.id.localeCompare(a.id) // Most recently added first
      }
    })

    return filtered
  }, [artworks, searchTerm, selectedCategory, sortBy])

  // Get unique years and mediums for advanced filtering (future enhancement)
  const availableYears = useMemo(() => {
    const years = artworks
      .filter(artwork => artwork.year && artwork.isDeleted !== true)
      .map(artwork => artwork.year!)
      .filter((year, index, arr) => arr.indexOf(year) === index)
      .sort((a, b) => b.localeCompare(a))
    return years
  }, [artworks])

  const availableMediums = useMemo(() => {
    const mediums = artworks
      .filter(artwork => artwork.medium && artwork.isDeleted !== true)
      .map(artwork => artwork.medium!)
      .filter((medium, index, arr) => arr.indexOf(medium) === index)
      .sort()
    return mediums
  }, [artworks])

  const getArtworksByCategory = (category: string) => {
    return artworks.filter(artwork => 
      artwork.category === category && artwork.isDeleted !== true
    )
  }

  const handleArtworkClick = (artwork: Artwork) => {
    setSelectedArtwork(artwork)
    const index = filteredAndSortedArtworks.findIndex(a => a.id === artwork.id)
    setCurrentImageIndex(index)
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedArtwork) return
    
    let newIndex = currentImageIndex
    
    if (direction === 'prev') {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : filteredAndSortedArtworks.length - 1
    } else {
      newIndex = currentImageIndex < filteredAndSortedArtworks.length - 1 ? currentImageIndex + 1 : 0
    }
    
    setCurrentImageIndex(newIndex)
    setSelectedArtwork(filteredAndSortedArtworks[newIndex])
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSortBy('recent')
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

      {/* Search and Filter Section */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-[136px] z-30">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, description, technique... (Ctrl+K)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={14} />
                </Button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categories).map(([key, category]) => {
                    const Icon = category.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon size={16} />
                          {category.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              {/* Sort Filter */}
              <Select value={sortBy} onValueChange={(value: 'title' | 'year' | 'recent') => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <SortAscending size={16} className="mr-2" />
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récent</SelectItem>
                  <SelectItem value="title">Titre A-Z</SelectItem>
                  <SelectItem value="year">Année récente</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchTerm || selectedCategory !== 'all' || sortBy !== 'recent') && (
                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                  <X size={16} />
                  Effacer
                </Button>
              )}
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {filteredAndSortedArtworks.length} œuvre{filteredAndSortedArtworks.length !== 1 ? 's' : ''} 
              {searchTerm && ` correspondant à "${searchTerm}"`}
              {selectedCategory !== 'all' && ` dans ${categories[selectedCategory as keyof typeof categories]?.label}`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Display filtered results */}
        <div className="gallery-grid">
          {filteredAndSortedArtworks.length > 0 ? (
            filteredAndSortedArtworks.map(artwork => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <MagnifyingGlass size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Aucune œuvre trouvée
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? `Aucun résultat pour "${searchTerm}". Essayez d'autres mots-clés.`
                    : 'Aucune œuvre ne correspond aux filtres sélectionnés.'
                  }
                </p>
                {(searchTerm || selectedCategory !== 'all' || sortBy !== 'recent') && (
                  <Button variant="outline" onClick={clearFilters}>
                    Voir toutes les œuvres
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legacy Tab View (kept for backward compatibility but hidden when filters are active) */}
        {!searchTerm && selectedCategory === 'all' && sortBy === 'recent' && (
          <div className="mt-16 pt-8 border-t border-border">
            <h2 className="category-header text-center mb-8 text-muted-foreground">
              Parcourir par catégorie
            </h2>
            <Tabs defaultValue="sculptures" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-12">
                {Object.entries(categories).filter(([key]) => key !== 'all').map(([key, category]) => {
                  const Icon = category.icon
                  return (
                    <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                      <Icon size={18} />
                      {category.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {Object.keys(categories).filter(key => key !== 'all').map(category => (
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
          </div>
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