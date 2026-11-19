import { Component, computed, inject, OnDestroy, OnInit } from '@angular/core'
import { AuthStore } from '@resttek/web-shared'
import { TableStore } from '../../store/table.store'
import { TABLE_STATUSES, TableStatus } from '../../models/table.model'
import { OrderStore } from '../../../orders/store/order.store'
import type { Order } from '../../../orders/models/order.model'

@Component({
  selector: 'app-mesas',
  standalone: true,
  templateUrl: './mesas.component.html',
  styleUrl: './mesas.component.css'
})
export class MesasComponent implements OnInit, OnDestroy {
  private readonly authStore = inject(AuthStore)
  readonly tableStore = inject(TableStore)

  readonly orderStore = inject(OrderStore)

  readonly statuses = TABLE_STATUSES

  // Pedidos activos agrupados por `Table.id`, solo de mesas ocupadas.
  // Se ignoran los pedidos sin mesa o cuya mesa no existe (p. ej. borrada).
  readonly ordersByTable = computed(() => {
    const ocupadas = new Set(
      this.tableStore.tables().filter(t => t.status === 'ocupada').map(t => t.id)
    )
    const grupos = new Map<string, Order[]>()
    for (const order of this.orderStore.orders()) {
      if (!order.tableId || !ocupadas.has(order.tableId)) continue
      grupos.set(order.tableId, [...(grupos.get(order.tableId) ?? []), order])
    }
    return grupos
  })

  private get restaurantId(): string | undefined {
    return this.authStore.user()?.restaurantId
  }

  ngOnInit(): void {
    const restaurantId = this.restaurantId
    if (restaurantId) {
      this.tableStore.loadTables(restaurantId)
      this.orderStore.startPolling(restaurantId)
    }
  }

  ngOnDestroy(): void {
    this.orderStore.stopPolling()
  }

  ordersOf(tableId: string): Order[] {
    return this.ordersByTable().get(tableId) ?? []
  }

  changeStatus(tableId: string, event: Event): void {
    const restaurantId = this.restaurantId
    if (!restaurantId) return
    const status = (event.target as HTMLSelectElement).value as TableStatus
    this.tableStore.updateStatus(restaurantId, tableId, status)
  }
}
