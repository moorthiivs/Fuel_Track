import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PhotoStorageService } from '../../src/services/photoStorageService'
import { Filesystem } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    mkdir: vi.fn(),
    copy: vi.fn(),
    getUri: vi.fn(),
    deleteFile: vi.fn(),
  },
  Directory: {
    Data: 'DATA',
  },
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}))

describe('PhotoStorageService', () => {
  let service: PhotoStorageService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new PhotoStorageService()
  })

  it('saves photo in private app storage on native platform', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Filesystem.mkdir).mockResolvedValue(undefined as any)
    vi.mocked(Filesystem.copy).mockResolvedValue(undefined as any)
    vi.mocked(Filesystem.getUri).mockResolvedValue({ uri: 'file:///data/user/0/com.fueltrack/files/fuel_photos/sample.jpg' })

    const result = await service.savePhotoPermanently('temp:///cache/temp_meter.jpg', 'METER')

    expect(Filesystem.mkdir).toHaveBeenCalled()
    expect(Filesystem.copy).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'temp:///cache/temp_meter.jpg',
      })
    )
    expect(result.localPath).toBe('file:///data/user/0/com.fueltrack/files/fuel_photos/sample.jpg')
    expect(result.fileName).toContain('fuel_meter_')
  })

  it('falls back to source URI gracefully if native filesystem copy fails', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Filesystem.mkdir).mockRejectedValue(new Error('Storage permission denied'))
    vi.mocked(Filesystem.copy).mockRejectedValue(new Error('Storage permission denied'))

    const result = await service.savePhotoPermanently('temp:///cache/temp_meter.jpg', 'METER')

    expect(result.localPath).toBe('temp:///cache/temp_meter.jpg')
    expect(result.fileName).toBeDefined()
  })

  it('retains web URI directly when running on web platform', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

    const result = await service.savePhotoPermanently('/demo-photos/fuel-meter.svg', 'VEHICLE')

    expect(Filesystem.copy).not.toHaveBeenCalled()
    expect(result.localPath).toBe('/demo-photos/fuel-meter.svg')
    expect(result.fileName).toContain('fuel_vehicle_')
  })

  it('deletes photo file on native platform', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Filesystem.deleteFile).mockResolvedValue(undefined as any)

    const success = await service.deletePhoto('fuel_photos/test.jpg')

    expect(Filesystem.deleteFile).toHaveBeenCalledWith({
      path: 'fuel_photos/test.jpg',
      directory: 'DATA',
    })
    expect(success).toBe(true)
  })

  it('handles deletion failure gracefully without throwing', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(Filesystem.deleteFile).mockRejectedValue(new Error('File not found'))

    const success = await service.deletePhoto('fuel_photos/missing.jpg')

    expect(success).toBe(false)
  })

  it('safely handles deletePhoto on web platform without calling native filesystem', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

    const success = await service.deletePhoto('demo.jpg')

    expect(Filesystem.deleteFile).not.toHaveBeenCalled()
    expect(success).toBe(true)
  })
})
