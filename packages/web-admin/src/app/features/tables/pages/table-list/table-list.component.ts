import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { LucideAngularModule } from 'lucide-angular'
import { AuthStore } from '@resttek/web-shared'
import { TableStore } from '../../store/table.store'
import type { TableStatus } from '../../models/table.model'

@Component({
  selector: 'app-table-list',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './table-list.component.html',
  styleUrl: './table-list.component.css'
})
export class TableListComponent implements OnInit {
  readonly store = inject(TableStore)
  private readonly authStore = inject(AuthStore)
  private readonly route = inject(ActivatedRoute)
  private readonly destroyRef = inject(DestroyRef)
  restaurantId = ''

  /** Solo el admin puede crear, editar y borrar mesas (contrato C4). */
  readonly isAdmin = computed(() => this.authStore.userRole() === 'admin')

  ngOnInit(): void {
    this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.restaurantId = params.get('restaurantId') ?? ''
      if (this.restaurantId) {
        this.store.loadByRestaurant(this.restaurantId)
      }
    })
  }

  statusBadgeClass(status: TableStatus): string {
    return `badge status-${status}`
  }

  async onDelete(id: string): Promise<void> {
    if (!this.restaurantId) return
    if (confirm('¿Estás seguro de eliminar esta mesa?')) {
      try {
        await this.store.delete(this.restaurantId, id)
      } catch {
        alert('Error al eliminar la mesa.')
      }
    }
  }
}
