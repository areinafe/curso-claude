import { Injectable, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { TableService } from '../services/table.service'
import type { Table, CreateTableDto, UpdateTableDto } from '../models/table.model'

/** Los errores de la API se distinguen por el nombre de clase (`error`), nunca por `message` (contrato C2). */
function saveErrorMessage(err: unknown): string {
  const apiError = (err as { error?: { error?: string } } | null)?.error?.error
  if (apiError === 'DuplicatedTableNumberError') {
    return 'Ya existe una mesa con ese número en este restaurante.'
  }
  return 'Error al guardar la mesa.'
}

@Injectable({ providedIn: 'root' })
export class TableStore {
  private readonly service = inject(TableService)

  private readonly _tables = signal<Table[]>([])
  private readonly _loading = signal(false)
  private readonly _error = signal<string | null>(null)
  private _currentRestaurantId: string | null = null

  readonly tables = this._tables.asReadonly()
  readonly loading = this._loading.asReadonly()
  readonly error = this._error.asReadonly()

  async loadByRestaurant(restaurantId: string): Promise<void> {
    if (this._currentRestaurantId !== restaurantId) this._tables.set([])
    this._currentRestaurantId = restaurantId
    this._loading.set(true)
    this._error.set(null)
    try {
      const data = await firstValueFrom(this.service.getAll(restaurantId))
      if (this._currentRestaurantId !== restaurantId) return
      this._tables.set(data)
    } catch {
      if (this._currentRestaurantId !== restaurantId) return
      this._error.set('No se pudieron cargar las mesas.')
    } finally {
      if (this._currentRestaurantId === restaurantId) this._loading.set(false)
    }
  }

  async create(restaurantId: string, dto: CreateTableDto): Promise<void> {
    this._error.set(null)
    try {
      const table = await firstValueFrom(this.service.create(restaurantId, dto))
      this._tables.update(list => [...list, table])
    } catch (err) {
      this._error.set(saveErrorMessage(err))
      throw err
    }
  }

  async update(restaurantId: string, id: string, dto: UpdateTableDto): Promise<void> {
    this._error.set(null)
    try {
      const updated = await firstValueFrom(this.service.update(restaurantId, id, dto))
      this._tables.update(list => list.map(t => t.id === id ? updated : t))
    } catch (err) {
      this._error.set(saveErrorMessage(err))
      throw err
    }
  }

  async delete(restaurantId: string, id: string): Promise<void> {
    this._error.set(null)
    try {
      await firstValueFrom(this.service.delete(restaurantId, id))
      this._tables.update(list => list.filter(t => t.id !== id))
    } catch (err) {
      this._error.set('Error al eliminar la mesa.')
      throw err
    }
  }
}
