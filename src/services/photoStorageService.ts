import { Filesystem, Directory } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'

export interface StoredPhotoResult {
  localPath: string
  fileName: string
}

export class PhotoStorageService {
  private readonly PHOTOS_DIR = 'fuel_photos'

  /**
   * Save a captured photo permanently into private application storage.
   * Prevents photo deletion when OS purges temporary cache directories.
   */
  async savePhotoPermanently(
    sourceUri: string,
    photoType: 'METER' | 'VEHICLE'
  ): Promise<StoredPhotoResult> {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).slice(2, 7)
    const fileName = `fuel_${photoType.toLowerCase()}_${timestamp}_${randomId}.jpg`
    const relativePath = `${this.PHOTOS_DIR}/${fileName}`

    // On native Android / iOS platforms, copy to private app sandbox
    if (Capacitor.isNativePlatform()) {
      try {
        // Ensure directory exists
        try {
          await Filesystem.mkdir({
            path: this.PHOTOS_DIR,
            directory: Directory.Data,
            recursive: true,
          })
        } catch {
          // Directory may already exist
        }

        // Copy from temporary camera cache to private app data
        await Filesystem.copy({
          from: sourceUri,
          to: relativePath,
          toDirectory: Directory.Data,
        })

        // Obtain persistent URI
        const stat = await Filesystem.getUri({
          path: relativePath,
          directory: Directory.Data,
        })

        return {
          localPath: stat.uri || relativePath,
          fileName,
        }
      } catch (err) {
        console.warn('[PhotoStorageService] Native filesystem copy failed, retaining source URI:', err)
        return { localPath: sourceUri, fileName }
      }
    }

    // In web browser / dev mode, retain URI (or SVG demo path)
    return {
      localPath: sourceUri,
      fileName,
    }
  }

  /**
   * Delete a stored photo from private application storage.
   */
  async deletePhoto(relativePath: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || !relativePath) return true

    try {
      await Filesystem.deleteFile({
        path: relativePath,
        directory: Directory.Data,
      })
      return true
    } catch (err) {
      console.warn('[PhotoStorageService] Error deleting file:', err)
      return false
    }
  }
}

export const photoStorageService = new PhotoStorageService()
