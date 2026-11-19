import { Injectable, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { TableService } from '../services/table.service'
import type { Table, TableStatus } from '../models/table.model'

// Los errores de dominio se distinguen por el nombre de clase (`error`), nunca por `message`
const MENSAJES_ERROR: Record<string, string> = {
  TableNotFoundError: 'La mesa ya no existe.',
  InvalidTableStatusError: 'Estado de mesa no válido.'
}

@Injectable({ providedIn: 'root' })
export class TableStore {
  private readonly service = inject(TableService)

  private readonly _tables = signal<Table[]>([])
  private readonly _loading = signal(false)
  private readonly _error = signal<string | null>(null)

  readonly tables = this._tables.asReadonly()
  readonly loading = this._loading.asReadonly()
  readonly error = this._error.asReadonly()

  async loadTables(restaurantId: string): Promise<void> {
    this._loading.set(true)
    this._error.set(null)
    try {
      this._tables.set(await firstValueFrom(this.service.getAll(restaurantId)))
    } catch {
      this._error.set('No se pudieron cargar las mesas.')
    } finally {
      this._loading.set(false)
    }
  }

  async updateStatus(restaurantId: string, id: string, status: TableStatus): Promise<void> {
    this._error.set(null)
    try {
      const updated = await firstValueFrom(this.service.updateStatus(restaurantId, id, status))
      this._tables.update(list => list.map(t => t.id === id ? updated : t))
    } catch (err: any) {
      this._error.set(MENSAJES_ERROR[err?.error?.error] ?? 'No se pudo cambiar el estado de la mesa.')
    }
  }
}
