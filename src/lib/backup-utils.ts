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
  isDeleted?: boolean
  deletedAt?: string
}

interface BackupData {
  artworks: Artwork[]
  images: { [key: string]: string }
  exportDate: string
  version: string
}

/**
 * Utility functions for backup operations
 * These can be used programmatically or in the UI
 */
export class BackupUtils {
  
  /**
   * Export all gallery data including images
   */
  static async exportGalleryData(): Promise<BackupData> {
    try {
      // Get artworks from KV storage
      const artworks = await spark.kv.get<Artwork[]>('gallery-artworks') || []
      
      // Get all image keys from KV storage
      const allKeys = await spark.kv.keys()
      const imageKeys = allKeys.filter(key => key.startsWith('/images/'))
      
      // Fetch all images
      const images: { [key: string]: string } = {}
      
      for (const key of imageKeys) {
        try {
          const imageData = await spark.kv.get<string>(key)
          if (imageData) {
            images[key] = imageData
          }
        } catch (error) {
          console.warn(`Failed to export image ${key}:`, error)
        }
      }
      
      // Create backup object
      const backupData: BackupData = {
        artworks,
        images,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      
      return backupData
      
    } catch (error) {
      console.error('Export error:', error)
      throw new Error('Failed to export gallery data')
    }
  }
  
  /**
   * Import gallery data and images
   */
  static async importGalleryData(backupData: BackupData): Promise<void> {
    try {
      // Validate backup data structure
      if (!backupData.artworks || !backupData.images) {
        throw new Error('Invalid backup format: missing artworks or images')
      }
      
      // Import images first
      const imageKeys = Object.keys(backupData.images)
      
      for (const key of imageKeys) {
        try {
          await spark.kv.set(key, backupData.images[key])
        } catch (error) {
          console.warn(`Failed to import image ${key}:`, error)
        }
      }
      
      // Import artworks
      await spark.kv.set('gallery-artworks', backupData.artworks)
      
    } catch (error) {
      console.error('Import error:', error)
      throw new Error('Failed to import gallery data')
    }
  }
  
  /**
   * Download backup data as JSON file
   */
  static downloadBackup(backupData: BackupData, filename?: string): void {
    const jsonString = JSON.stringify(backupData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `gallery-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  /**
   * Parse backup data from JSON string
   */
  static parseBackupData(jsonString: string): BackupData {
    try {
      const data = JSON.parse(jsonString)
      
      // Basic validation
      if (!data.artworks || !data.images) {
        throw new Error('Invalid backup format')
      }
      
      return data as BackupData
      
    } catch (error) {
      throw new Error('Failed to parse backup data: ' + error.message)
    }
  }
  
  /**
   * Get backup statistics
   */
  static getBackupStats(backupData: BackupData): {
    totalArtworks: number
    activeArtworks: number
    deletedArtworks: number
    totalImages: number
    backupSize: string
    exportDate: string
  } {
    const totalArtworks = backupData.artworks.length
    const activeArtworks = backupData.artworks.filter(a => !a.isDeleted).length
    const deletedArtworks = backupData.artworks.filter(a => a.isDeleted).length
    const totalImages = Object.keys(backupData.images).length
    
    // Estimate backup size
    const jsonString = JSON.stringify(backupData)
    const sizeInBytes = new Blob([jsonString]).size
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2)
    
    return {
      totalArtworks,
      activeArtworks,
      deletedArtworks,
      totalImages,
      backupSize: `${sizeInMB} MB`,
      exportDate: new Date(backupData.exportDate).toLocaleDateString('fr-FR')
    }
  }
  
  /**
   * Create automatic backup (can be called periodically)
   */
  static async createAutomaticBackup(): Promise<void> {
    try {
      const backupData = await this.exportGalleryData()
      
      // Store backup in KV with timestamp key
      const backupKey = `backup_${Date.now()}`
      await spark.kv.set(backupKey, backupData)
      
      // Keep only last 5 automatic backups
      const allKeys = await spark.kv.keys()
      const backupKeys = allKeys.filter(key => key.startsWith('backup_')).sort()
      
      // Remove old backups if more than 5
      if (backupKeys.length > 5) {
        const oldKeys = backupKeys.slice(0, backupKeys.length - 5)
        for (const oldKey of oldKeys) {
          await spark.kv.delete(oldKey)
        }
      }
      
      console.log('Automatic backup created:', backupKey)
      
    } catch (error) {
      console.error('Failed to create automatic backup:', error)
    }
  }
  
  /**
   * Get list of automatic backups
   */
  static async getAutomaticBackups(): Promise<{ key: string, date: Date, stats: any }[]> {
    try {
      const allKeys = await spark.kv.keys()
      const backupKeys = allKeys.filter(key => key.startsWith('backup_')).sort().reverse()
      
      const backups = []
      for (const key of backupKeys) {
        const backupData = await spark.kv.get<BackupData>(key)
        if (backupData) {
          const timestamp = parseInt(key.replace('backup_', ''))
          const date = new Date(timestamp)
          const stats = this.getBackupStats(backupData)
          
          backups.push({ key, date, stats })
        }
      }
      
      return backups
      
    } catch (error) {
      console.error('Failed to get automatic backups:', error)
      return []
    }
  }
  
  /**
   * Restore from automatic backup
   */
  static async restoreFromAutomaticBackup(backupKey: string): Promise<void> {
    try {
      const backupData = await spark.kv.get<BackupData>(backupKey)
      if (!backupData) {
        throw new Error('Backup not found')
      }
      
      await this.importGalleryData(backupData)
      
    } catch (error) {
      console.error('Failed to restore from automatic backup:', error)
      throw error
    }
  }
}