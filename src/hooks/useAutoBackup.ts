import { useEffect } from 'react'
import { BackupUtils } from '@/lib/backup-utils'

/**
 * Hook to handle automatic backups
 * Creates a backup when artworks are modified
 */
export function useAutoBackup() {
  useEffect(() => {
    // Create a backup on first load if none exists
    const initializeBackup = async () => {
      try {
        const backups = await BackupUtils.getAutomaticBackups()
        if (backups.length === 0) {
          console.log('Creating initial automatic backup...')
          await BackupUtils.createAutomaticBackup()
        }
      } catch (error) {
        console.warn('Failed to initialize automatic backup:', error)
      }
    }
    
    initializeBackup()
  }, [])

  // Function to trigger backup after artwork changes
  const triggerBackup = async () => {
    try {
      await BackupUtils.createAutomaticBackup()
      console.log('Automatic backup created after artwork change')
    } catch (error) {
      console.warn('Failed to create automatic backup:', error)
    }
  }

  return { triggerBackup }
}