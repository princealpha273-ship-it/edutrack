const OFFLINE_DB_NAME = 'edutrack-offline'
const OFFLINE_STORE = 'pending-sync'

interface OfflineRecord {
  id?: number
  tableName: string
  recordId: string
  action: string
  data: any
  synced: boolean
  createdAt?: Date
}

class OfflineSyncManager {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(OFFLINE_DB_NAME, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
          db.createObjectStore(OFFLINE_STORE, { keyPath: 'id', autoIncrement: true })
        }
      }
    })
  }

  async saveOfflineChange(record: Omit<OfflineRecord, 'id'>): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(OFFLINE_STORE, 'readwrite')
      const store = tx.objectStore(OFFLINE_STORE)
      const request = store.add({ ...record, createdAt: new Date() })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getPendingChanges(): Promise<OfflineRecord[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(OFFLINE_STORE, 'readonly')
      const store = tx.objectStore(OFFLINE_STORE)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result.filter((r: any) => !r.synced))
    })
  }

  async markAsSynced(id: number): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(OFFLINE_STORE, 'readwrite')
      const store = tx.objectStore(OFFLINE_STORE)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const record = getRequest.result
        if (record) {
          record.synced = true
          store.put(record)
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
      tx.oncomplete = () => resolve()
    })
  }

  async syncWithServer(): Promise<{ success: number; failed: number }> {
    const pending = await this.getPendingChanges()
    let success = 0
    let failed = 0

    for (const record of pending) {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/offline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(record)
        })

        if (res.ok && record.id) {
          await this.markAsSynced(record.id)
          success++
        } else {
          failed++
        }
      } catch (error) {
        console.error('Sync failed for record:', record, error)
        failed++
      }
    }

    return { success, failed }
  }
}

export const offlineSync = new OfflineSyncManager()

export async function initOfflineSync(): Promise<void> {
  await offlineSync.init()
  
  window.addEventListener('online', async () => {
    console.log('Back online, syncing...')
    const result = await offlineSync.syncWithServer()
    console.log(`Sync complete: ${result.success} success, ${result.failed} failed`)
  })
}

export async function saveDataOffline(tableName: string, recordId: string, action: string, data: any): Promise<void> {
  await offlineSync.saveOfflineChange({
    tableName,
    recordId,
    action,
    data,
    synced: false
  })
}
