import { TestBed } from '@angular/core/testing'
import { signal } from '@angular/core'
import { AuthStore } from '@resttek/web-shared'
import { MesasComponent } from './mesas.component'
import { TableStore } from '../../store/table.store'
import type { Table, TableStatus } from '../../models/table.model'

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

  function render() {
    TestBed.configureTestingModule({
      imports: [MesasComponent],
      providers: [
        { provide: TableStore, useValue: tableStore },
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
})
