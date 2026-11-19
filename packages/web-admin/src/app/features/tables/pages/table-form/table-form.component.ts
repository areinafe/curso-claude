import { Component, inject, OnInit, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { LucideAngularModule } from 'lucide-angular'
import { firstValueFrom } from 'rxjs'
import { TableStore } from '../../store/table.store'
import { TableService } from '../../services/table.service'
import { TABLE_STATUSES, type TableStatus, type UpdateTableDto } from '../../models/table.model'

export interface TableForm {
  number: number | null
  description: string
  capacity: number | null
  status: TableStatus
}

function isPositiveInteger(value: number | null): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1
}

@Component({
  selector: 'app-table-form',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './table-form.component.html',
  styleUrl: './table-form.component.css'
})
export class TableFormComponent implements OnInit {
  private readonly store = inject(TableStore)
  private readonly service = inject(TableService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)

  isEditing = false
  tableId: string | null = null
  restaurantId = ''
  loading = signal(false)
  error = signal<string | null>(null)

  readonly statuses = TABLE_STATUSES

  form: TableForm = { number: null, description: '', capacity: null, status: 'libre' }
  /** Estado cargado al editar: solo se envía `status` en el PUT si ha cambiado (contrato C5). */
  private originalStatus: TableStatus | null = null

  get pageTitle(): string {
    return this.isEditing ? 'Editar mesa' : 'Nueva mesa'
  }

  get listUrl(): string {
    return `/restaurants/${this.restaurantId}/tables`
  }

  ngOnInit(): void {
    this.restaurantId = this.route.parent?.snapshot.params['restaurantId'] ?? ''
    const id = this.route.snapshot.paramMap.get('id')

    if (id && this.restaurantId) {
      this.isEditing = true
      this.tableId = id
      this.loadTable(id)
    }
  }

  private async loadTable(id: string): Promise<void> {
    this.loading.set(true)
    try {
      const table = await firstValueFrom(this.service.getById(this.restaurantId, id))
      this.form = {
        number: table.number,
        description: table.description ?? '',
        capacity: table.capacity,
        status: table.status
      }
      this.originalStatus = table.status
    } catch {
      this.error.set('No se pudo cargar la mesa.')
    } finally {
      this.loading.set(false)
    }
  }

  async onSubmit(): Promise<void> {
    this.error.set(null)
    const { number, capacity, status } = this.form
    if (!isPositiveInteger(number)) {
      this.error.set('El número de mesa debe ser un entero mayor o igual que 1.')
      return
    }
    if (!isPositiveInteger(capacity)) {
      this.error.set('La capacidad debe ser un entero mayor o igual que 1.')
      return
    }
    const description = this.form.description.trim() || null

    this.loading.set(true)
    try {
      if (this.isEditing && this.tableId) {
        const dto: UpdateTableDto = { number, description, capacity }
        if (status !== this.originalStatus) dto.status = status
        await this.store.update(this.restaurantId, this.tableId, dto)
      } else {
        await this.store.create(this.restaurantId, { number, description, capacity, status })
      }
      this.router.navigate(['/restaurants', this.restaurantId, 'tables'])
    } catch {
      this.error.set(this.store.error() ?? 'Error al guardar la mesa.')
    } finally {
      this.loading.set(false)
    }
  }
}
