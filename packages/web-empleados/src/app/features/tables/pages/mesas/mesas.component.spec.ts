import { TestBed } from '@angular/core/testing'
import { signal } from '@angular/core'
import { AuthStore } from '@resttek/web-shared'
import { MesasComponent } from './mesas.component'
import { TableStore } from '../../store/table.store'
import type { Table, TableStatus } from '../../models/table.model'
import { OrderStore } from '../../../orders/store/order.store'
import type { Order, OrderStatus } from '../../../orders/models/order.model'

function pedido(id: string, tableId: string | null, ...estados: OrderStatus[]): Order {
  return {
    id,
    restaurantId: 'rest-1',
    tableId,
    clientId: null,
    createdAt: '',
    items: estados.map((status, i) => ({
      id: `${id}-item-${i}`,
      dishId: `plato-${i}`,
      quantity: 1,
      notes: null,
      status,
      dishName: `Plato ${id}-${i}`
    }))
  }
}

function mesa(id: string, number: number, status: TableStatus): Table {
  return {
    id,
    restaurantId: 'rest-1',
    number,
    description: null,
    capacity: 4,
    status,
    createdAt: '',
    updatedAt: ''
  }
}

describe('MesasComponent', () => {
  let tables: ReturnType<typeof signal<Table[]>>
  let tableStore: {
    tables: () => Table[]
    loading: () => boolean
    error: () => string | null
    loadTables: ReturnType<typeof vi.fn>
    updateStatus: ReturnType<typeof vi.fn>
  }
  let orders: ReturnType<typeof signal<Order[]>>
  let orderStore: {
    orders: () => Order[]
    startPolling: ReturnType<typeof vi.fn>
    stopPolling: ReturnType<typeof vi.fn>
  }

  function render() {
    TestBed.configureTestingModule({
      imports: [MesasComponent],
      providers: [
        { provide: TableStore, useValue: tableStore },
        { provide: OrderStore, useValue: orderStore },
        { provide: AuthStore, useValue: { user: () => ({ restaurantId: 'rest-1' }) } }
      ]
    })
    const fixture = TestBed.createComponent(MesasComponent)
    fixture.detectChanges()
    return fixture
  }

  beforeEach(() => {
    tables = signal<Table[]>([mesa('t1', 1, 'libre'), mesa('t2', 2, 'ocupada')])
    tableStore = {
      tables: tables.asReadonly(),
      loading: () => false,
      error: () => null,
      loadTables: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue(undefined)
    }
    orders = signal<Order[]>([])
    orderStore = {
      orders: orders.asReadonly(),
      startPolling: vi.fn(),
      stopPolling: vi.fn()
    }
  })

  it('carga las mesas del restaurante del usuario', () => {
    render()
    expect(tableStore.loadTables).toHaveBeenCalledWith('rest-1')
  })

  it('muestra cada mesa con su estado y un selector', () => {
    const el: HTMLElement = render().nativeElement
    const tarjetas = el.querySelectorAll('[data-testid="mesa"]')

    expect(tarjetas).toHaveLength(2)
    expect(tarjetas[0].textContent).toContain('Mesa 1')
    expect(tarjetas[0].textContent).toContain('libre')
    expect(tarjetas[1].textContent).toContain('Mesa 2')
    expect(tarjetas[1].textContent).toContain('ocupada')
    const selector = tarjetas[1].querySelector('select') as HTMLSelectElement
    expect(selector.value).toBe('ocupada')
    expect(Array.from(selector.options).map(o => o.value)).toEqual(['libre', 'ocupada', 'reservada'])
  })

  it('al cambiar el selector llama a tableStore.updateStatus', () => {
    const el: HTMLElement = render().nativeElement
    const selector = el.querySelectorAll('[data-testid="mesa"]')[0].querySelector('select') as HTMLSelectElement

    selector.value = 'reservada'
    selector.dispatchEvent(new Event('change'))

    expect(tableStore.updateStatus).toHaveBeenCalledWith('rest-1', 't1', 'reservada')
  })

  describe('pedidos de las mesas ocupadas', () => {
    function pedidosDe(el: HTMLElement, indiceMesa: number): string[] {
      const tarjeta = el.querySelectorAll('[data-testid="mesa"]')[indiceMesa]
      return Array.from(tarjeta.querySelectorAll('[data-testid="pedido"]')).map(p => p.textContent ?? '')
    }

    it('arranca el polling de pedidos al entrar y lo para al salir', () => {
      const fixture = render()
      expect(orderStore.startPolling).toHaveBeenCalledWith('rest-1')

      fixture.destroy()
      expect(orderStore.stopPolling).toHaveBeenCalled()
    })

    it('lista en una mesa ocupada sus pedidos activos con el estado de los ítems', () => {
      orders.set([pedido('p1', 't2', 'pendiente', 'listo'), pedido('p2', 't2', 'preparando')])

      const pedidos = pedidosDe(render().nativeElement, 1)

      expect(pedidos).toHaveLength(2)
      expect(pedidos[0]).toContain('Plato p1-0')
      expect(pedidos[0]).toContain('pendiente')
      expect(pedidos[0]).toContain('Plato p1-1')
      expect(pedidos[0]).toContain('listo')
      expect(pedidos[1]).toContain('preparando')
    })

    it('no muestra pedidos en las mesas libres', () => {
      orders.set([pedido('p1', 't1', 'pendiente')])

      expect(pedidosDe(render().nativeElement, 0)).toHaveLength(0)
    })

    it('ignora pedidos sin mesa o con una mesa que no existe', () => {
      orders.set([pedido('p1', null, 'pendiente'), pedido('p2', 'mesa-borrada', 'pendiente'), pedido('p3', '2', 'pendiente')])

      const el: HTMLElement = render().nativeElement

      expect(el.querySelectorAll('[data-testid="pedido"]')).toHaveLength(0)
    })
  })
})
