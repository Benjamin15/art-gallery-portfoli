import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Plus, Palette, Wine, Hammer } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface Artwork {
  id: string
  title: string
  description: string
  category: 'sculptures' | 'verres' | 'peintures'
  imageUrl: string
  year?: string
  medium?: string
  dimensions?: string
}

interface AdminUploadFormProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminUploadForm({ isOpen, onClose }: AdminUploadFormProps) {
  const [artworks, setArtworks] = useKV<Artwork[]>('gallery-artworks', [])
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as 'sculptures' | 'verres' | 'peintures' | '',
    imageUrl: '',
    year: '',
    medium: '',
    dimensions: ''
  })

  const categories = {
    sculptures: { label: 'Sculptures', icon: Hammer },
    verres: { label: 'Verres', icon: Wine },
    peintures: { label: 'Peintures', icon: Palette }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Veuillez sélectionner un fichier image valide')
      return
    }

    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewImage(objectUrl)
    setFormData(prev => ({
      ...prev,
      imageUrl: objectUrl
    }))

    showNotification('success', 'Image chargée avec succès')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!formData.title || !formData.description || !formData.category || !formData.imageUrl) {
      showNotification('error', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    setIsUploading(true)

    try {
      const newArtwork: Artwork = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        category: formData.category,
        imageUrl: formData.imageUrl,
        year: formData.year || undefined,
        medium: formData.medium || undefined,
        dimensions: formData.dimensions || undefined
      }

      // Add to artworks using functional update to avoid stale closure
      setArtworks(currentArtworks => [...currentArtworks, newArtwork])

      showNotification('success', 'Œuvre ajoutée avec succès à la galerie')
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        imageUrl: '',
        year: '',
        medium: '',
        dimensions: ''
      })
      setPreviewImage(null)
      onClose()
    } catch (error) {
      showNotification('error', 'Erreur lors de l\'ajout de l\'œuvre')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const clearPreview = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage)
    }
    setPreviewImage(null)
    setFormData(prev => ({ ...prev, imageUrl: '' }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus size={24} />
            Ajouter une nouvelle œuvre
          </DialogTitle>
        </DialogHeader>

        {/* Notification */}
        {notification && (
          <div className={`p-3 rounded-md border ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {notification.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-3">
            <Label htmlFor="image-upload" className="text-sm font-medium">
              Image de l'œuvre *
            </Label>
            
            {previewImage ? (
              <div className="relative">
                <div className="aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg border bg-muted">
                  <img 
                    src={previewImage} 
                    alt="Aperçu" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={clearPreview}
                >
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors">
                <Upload size={48} className="mx-auto mb-4 text-muted-foreground" />
                <Label 
                  htmlFor="image-upload" 
                  className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cliquez pour sélectionner une image ou glissez-déposez
                </Label>
              </div>
            )}
            
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Nom de l'œuvre"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
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
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Décrivez votre œuvre, son inspiration, sa technique..."
              rows={4}
              required
            />
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Année</Label>
              <Input
                id="year"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medium">Technique</Label>
              <Input
                id="medium"
                value={formData.medium}
                onChange={(e) => handleInputChange('medium', e.target.value)}
                placeholder="Huile sur toile, Bronze..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                value={formData.dimensions}
                onChange={(e) => handleInputChange('dimensions', e.target.value)}
                placeholder="50 x 70 cm"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isUploading || !formData.title || !formData.category || !formData.imageUrl}
              className="flex-1"
            >
              {isUploading ? 'Ajout en cours...' : 'Ajouter l\'œuvre'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}