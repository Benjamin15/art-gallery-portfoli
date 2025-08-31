import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Upload, Warning, CheckCircle, X, Clock, Archive } from '@phosphor-icons/react'
import { useKV } from '@/hooks/useKV-shim'
import { BackupUtils } from '@/lib/backup-utils'

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

interface BackupManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function BackupManager({ isOpen, onClose }: BackupManagerProps) {
  const [artworks, setArtworks] = useKV<Artwork[]>('gallery-artworks', [])
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [importData, setImportData] = useState('')
  const [automaticBackups, setAutomaticBackups] = useState<any[]>([])
  const [loadingBackups, setLoadingBackups] = useState(false)

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // Load automatic backups when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadAutomaticBackups()
    }
  }, [isOpen])

  const loadAutomaticBackups = async () => {
    setLoadingBackups(true)
    try {
      const backups = await BackupUtils.getAutomaticBackups()
      setAutomaticBackups(backups)
    } catch (error) {
      console.error('Failed to load automatic backups:', error)
    } finally {
      setLoadingBackups(false)
    }
  }

  // Export all gallery data including images using utility
  const handleExport = async () => {
    try {
      setIsExporting(true)
      setExportProgress(0)
      
      // Use utility function for export
      setExportProgress(20)
      const backupData = await BackupUtils.exportGalleryData()
      setExportProgress(80)
      
      // Download the backup
      BackupUtils.downloadBackup(backupData)
      setExportProgress(100)
      
      const stats = BackupUtils.getBackupStats(backupData)
      showNotification('success', `Sauvegarde créée: ${stats.totalArtworks} œuvres, ${stats.totalImages} images (${stats.backupSize})`)
      
    } catch (error) {
      console.error('Export error:', error)
      showNotification('error', 'Erreur lors de l\'export de la sauvegarde')
    } finally {
      setIsExporting(false)
      setTimeout(() => setExportProgress(0), 2000)
    }
  }

  // Import gallery data and images using utility
  const handleImport = async () => {
    if (!importData.trim()) {
      showNotification('error', 'Veuillez coller les données de sauvegarde')
      return
    }

    try {
      setIsImporting(true)
      setImportProgress(0)
      
      // Parse backup data using utility
      setImportProgress(10)
      const backupData = BackupUtils.parseBackupData(importData)
      setImportProgress(30)
      
      // Import using utility
      await BackupUtils.importGalleryData(backupData)
      setImportProgress(80)
      
      // Refresh local state
      setArtworks(backupData.artworks)
      setImportProgress(90)
      
      // Clear form
      setImportData('')
      setImportProgress(100)
      
      const stats = BackupUtils.getBackupStats(backupData)
      showNotification('success', `Import réussi: ${stats.totalArtworks} œuvres et ${stats.totalImages} images restaurées`)
      
    } catch (error) {
      console.error('Import error:', error)
      showNotification('error', 'Erreur lors de l\'import: ' + error.message)
    } finally {
      setIsImporting(false)
      setTimeout(() => setImportProgress(0), 2000)
    }
  }

  // Handle file upload for import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/json') {
      showNotification('error', 'Veuillez sélectionner un fichier JSON valide')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportData(content)
    }
    reader.readAsText(file)
  }

  // Create automatic backup
  const handleCreateAutomaticBackup = async () => {
    try {
      await BackupUtils.createAutomaticBackup()
      showNotification('success', 'Sauvegarde automatique créée')
      loadAutomaticBackups()
    } catch (error) {
      showNotification('error', 'Erreur lors de la création de la sauvegarde automatique')
    }
  }

  // Restore from automatic backup
  const handleRestoreAutomaticBackup = async (backupKey: string) => {
    try {
      setIsImporting(true)
      await BackupUtils.restoreFromAutomaticBackup(backupKey)
      
      // Refresh artworks
      const updatedArtworks = await spark.kv.get<Artwork[]>('gallery-artworks') || []
      setArtworks(updatedArtworks)
      
      showNotification('success', 'Sauvegarde automatique restaurée')
      loadAutomaticBackups()
    } catch (error) {
      showNotification('error', 'Erreur lors de la restauration')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download size={20} />
            Gestion des Sauvegardes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Notification */}
          {notification && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              notification.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {notification.type === 'success' && <CheckCircle size={16} />}
              {notification.type === 'error' && <Warning size={16} />}
              <span className="text-sm">{notification.message}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotification(null)}
                className="ml-auto h-6 w-6 p-0"
              >
                <X size={12} />
              </Button>
            </div>
          )}

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Sauvegarde Manuelle</TabsTrigger>
              <TabsTrigger value="automatic">Sauvegardes Automatiques</TabsTrigger>
            </TabsList>

            {/* Manual Backup Tab */}
            <TabsContent value="manual" className="space-y-6">
              {/* Export Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Download size={18} />
                    Exporter la Galerie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Créer une sauvegarde complète incluant toutes les œuvres et leurs images.
                    Le fichier peut être conservé en sécurité et utilisé pour restaurer la galerie.
                  </p>
                  
                  {isExporting && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Export en cours...</span>
                        <span>{Math.round(exportProgress)}%</span>
                      </div>
                      <Progress value={exportProgress} className="h-2" />
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleExport} 
                    disabled={isExporting}
                    className="w-full"
                  >
                    <Download size={16} className="mr-2" />
                    {isExporting ? 'Export en cours...' : 'Télécharger la Sauvegarde'}
                  </Button>
                </CardContent>
              </Card>

              {/* Import Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Upload size={18} />
                    Importer une Sauvegarde
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Warning size={16} />
                      <span className="text-sm font-medium">Attention</span>
                    </div>
                    <p className="text-sm text-amber-600 mt-1">
                      L'import remplacera toutes les données actuelles. Assurez-vous d'avoir créé une sauvegarde avant de continuer.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backup-file">Sélectionner un fichier de sauvegarde</Label>
                    <input
                      id="backup-file"
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backup-data">Ou coller les données JSON</Label>
                    <Textarea
                      id="backup-data"
                      placeholder="Collez ici le contenu du fichier de sauvegarde..."
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      rows={6}
                      className="font-mono text-xs"
                    />
                  </div>

                  {isImporting && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Import en cours...</span>
                        <span>{Math.round(importProgress)}%</span>
                      </div>
                      <Progress value={importProgress} className="h-2" />
                    </div>
                  )}

                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting || !importData.trim()}
                    className="w-full"
                    variant="destructive"
                  >
                    <Upload size={16} className="mr-2" />
                    {isImporting ? 'Import en cours...' : 'Restaurer la Sauvegarde'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Automatic Backup Tab */}
            <TabsContent value="automatic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock size={18} />
                    Sauvegardes Automatiques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Les sauvegardes automatiques sont stockées localement et conservent les 5 versions les plus récentes.
                  </p>
                  
                  <Button 
                    onClick={handleCreateAutomaticBackup}
                    className="w-full"
                  >
                    <Archive size={16} className="mr-2" />
                    Créer une Sauvegarde Automatique
                  </Button>
                  
                  {loadingBackups ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Chargement des sauvegardes...</p>
                    </div>
                  ) : automaticBackups.length === 0 ? (
                    <div className="text-center py-8">
                      <Archive size={48} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Aucune sauvegarde automatique</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-medium">Sauvegardes Disponibles</h4>
                      {automaticBackups.map((backup) => (
                        <div key={backup.key} className="border rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">
                                {backup.date.toLocaleDateString('fr-FR', { 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {backup.stats.totalArtworks} œuvres • {backup.stats.totalImages} images • {backup.stats.backupSize}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestoreAutomaticBackup(backup.key)}
                              disabled={isImporting}
                            >
                              Restaurer
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Info Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Format de sauvegarde :</strong> JSON contenant les métadonnées et les images en base64</p>
                <p><strong>Compatibilité :</strong> Les sauvegardes peuvent être partagées entre installations</p>
                <p><strong>Sécurité :</strong> Conservez vos sauvegardes dans un lieu sûr (cloud, disque externe)</p>
                <p><strong>Git :</strong> Pour de petites galeries uniquement (&lt; 10 MB). Consultez BACKUP_GUIDE.md</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}