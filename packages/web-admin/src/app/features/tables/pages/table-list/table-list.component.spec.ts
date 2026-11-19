import { importProvidersFrom, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router'
import { BehaviorSubject } from 'rxjs'
import { LucideAngularModule, Edit, Plus, Trash2, Armchair } from 'lucide-angular'
import { AuthStore } from '@resttek/web-shared'
import { TableStore } from '../../store/table.store'
import { TableListComponent } from './table-list.component'
import type { Table } from '../../models/table.model'

function mesa(id: string, number: number, extra: Partial<Table> = {}): Table {
  return {
    id,
    restaurantId: 'rest-1',
    number,
    description: null,
    capacity: 4,
    status: 'libre',
    createdAt: '',
    updatedAt: '',
    ...extra
  }
}

describe('TableListComponent', () => {
  let tables: ReturnType<typeof signal<Table[]>>
  let store: {
    tables: () => Table[]
    loading: () => boolean
    error: () => string | null
    loadByRestaurant: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  let role: ReturnType<typeof signal<string | null>>

  function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick({ Edit, Plus, Trash2, Armchair })),
        { provide: TableStore, useValue: store },
        { provide: AuthStore, useValue: { userRole: role } },
        {
          provide: ActivatedRoute,
          useValue: { parent: { paramMap: new BehaviorSubject(convertToParamMap({ restaurantId: 'rest-1' })) } }
        }
      ]
    })
    const fixture = TestBed.createComponent(TableListComponent)
    fixture.detectChanges()
    return fixture
  }

  beforeEach(() => {
    tables = signal<Table[]>([])
    role = signal<string | null>('admin')
    store = {
      tables,
      loading: () => false,
      error: () => null,
      loadByRestaurant: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined)
    }
  })

  afterEach(() => vi.restoreAllMocks())

  it('carga las mesas del restaurante de la ruta', () => {
    render()
    expect(store.loadByRestaurant).toHaveBeenCalledWith('rest-1')
  })

  it('muestra número, descripción, capacidad y estado de cada mesa', () => {
    tables.set([
      mesa('a', 1, { description: 'Junto a la ventana', capacity: 2, status: 'ocupada' }),
      mesa('b', 2, { capacity: 6, status: 'reservada' })
    ])
    const el: HTMLElement = render().nativeElement

    const filas = el.querySelectorAll('tbody tr')
    expect(filas).toHaveLength(2)
    expect(filas[0].textContent).toContain('1')
    expect(filas[0].textContent).toContain('Junto a la ventana')
    expect(filas[0].textContent).toContain('2')
    expect(filas[0].textContent).toContain('ocupada')
    expect(filas[1].textContent).toContain('6')
    expect(filas[1].textContent).toContain('reservada')
  })

  it('muestra un estado vacío si no hay mesas', () => {
    const el: HTMLElement = render().nativeElement
    expect(el.querySelector('table')).toBeNull()
    expect(el.textContent).toContain('No hay mesas para este restaurante')
  })

  it('el botón borrar llama a store.delete tras confirmar', async () => {
    tables.set([mesa('a', 1)])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const el: HTMLElement = render().nativeElement

    el.querySelector<HTMLButtonElement>('[data-test="borrar"]')!.click()

    expect(window.confirm).toHaveBeenCalled()
    expect(store.delete).toHaveBeenCalledWith('rest-1', 'a')
  })

  it('no borra si no se confirma', () => {
    tables.set([mesa('a', 1)])
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const el: HTMLElement = render().nativeElement

    el.querySelector<HTMLButtonElement>('[data-test="borrar"]')!.click()

    expect(store.delete).not.toHaveBeenCalled()
  })

  it('oculta crear, editar y borrar si el usuario no es admin', () => {
    tables.set([mesa('a', 1)])
    role.set('manager')
    const el: HTMLElement = render().nativeElement

    expect(el.querySelector('tbody tr')).not.toBeNull()
    expect(el.querySelector('[data-test="nueva"]')).toBeNull()
    expect(el.querySelector('[data-test="editar"]')).toBeNull()
    expect(el.querySelector('[data-test="borrar"]')).toBeNull()
  })

  it('muestra crear, editar y borrar al admin', () => {
    tables.set([mesa('a', 1)])
    const el: HTMLElement = render().nativeElement

    expect(el.querySelector('[data-test="nueva"]')).not.toBeNull()
    expect(el.querySelector('[data-test="editar"]')).not.toBeNull()
    expect(el.querySelector('[data-test="borrar"]')).not.toBeNull()
  })
})
