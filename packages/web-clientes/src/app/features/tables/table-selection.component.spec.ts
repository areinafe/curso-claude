import { TestBed, ComponentFixture } from '@angular/core/testing'
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router'
import { HttpErrorResponse } from '@angular/common/http'
import { of, throwError } from 'rxjs'
import { TableSelectionComponent } from './table-selection.component'
import { TableService } from '../../core/services/table.service'
import { CartStore } from '../../core/store/cart.store'
import { Table } from '../../core/models/table.model'

const mesa = (id: string, number: number, capacity: number): Table => ({
  id,
  restaurantId: 'rest-1',
  number,
  description: number === 1 ? 'Junto a la ventana' : null,
  capacity,
  status: 'libre',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
})

describe('TableSelectionComponent', () => {
  let fixture: ComponentFixture<TableSelectionComponent>
  let component: TableSelectionComponent
  let tableService: { getAvailable: ReturnType<typeof vi.fn>; occupy: ReturnType<typeof vi.fn> }
  let cartStore: CartStore
  let router: Router

  beforeEach(() => {
    tableService = {
      getAvailable: vi.fn().mockReturnValue(of([mesa('mesa-1', 1, 2), mesa('mesa-3', 3, 4)])),
      occupy: vi.fn()
    }
    TestBed.configureTestingModule({
      imports: [TableSelectionComponent],
      providers: [
        provideRouter([]),
        { provide: TableService, useValue: tableService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'rest-1' }) } } }
      ]
    })
    cartStore = TestBed.inject(CartStore)
    router = TestBed.inject(Router)
    vi.spyOn(router, 'navigate').mockResolvedValue(true)
    fixture = TestBed.createComponent(TableSelectionComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? ''

  it('no busca mesas si el nº de personas no es un entero >= 1', () => {
    for (const valor of [0, -1, 2.5, NaN]) {
      component.people.set(valor)
      component.search()
    }
    fixture.detectChanges()
    expect(tableService.getAvailable).not.toHaveBeenCalled()
    expect(texto()).toContain('Indica un número de personas válido')
  })

  it('muestra las mesas disponibles para el nº de personas', () => {
    component.people.set(2)
    component.search()
    fixture.detectChanges()
    expect(tableService.getAvailable).toHaveBeenCalledWith('rest-1', 2)
    expect(texto()).toContain('Mesa 1')
    expect(texto()).toContain('Junto a la ventana')
    expect(texto()).toContain('Mesa 3')
  })

  it('muestra un aviso si no hay mesas disponibles', () => {
    tableService.getAvailable.mockReturnValue(of([]))
    component.people.set(10)
    component.search()
    fixture.detectChanges()
    expect(texto()).toContain('No hay mesas disponibles')
  })

  it('"Continuar" ocupa la mesa, la guarda en CartStore y navega a la carta', () => {
    const ocupada = { ...mesa('mesa-3', 3, 4), status: 'ocupada' as const }
    tableService.occupy.mockReturnValue(of(ocupada))
    component.people.set(4)
    component.search()
    component.select(mesa('mesa-3', 3, 4))
    component.continue()
    expect(tableService.occupy).toHaveBeenCalledWith('rest-1', 'mesa-3')
    expect(cartStore.table()).toEqual(ocupada)
    expect(cartStore.hasTableFor('rest-1')).toBe(true)
    expect(router.navigate).toHaveBeenCalledWith(['/restaurants', 'rest-1'])
  })

  it('si la mesa ya no está libre muestra un error y recarga la lista', () => {
    tableService.occupy.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 400,
      error: { error: 'TableNotAvailableError', message: 'Table is not available' }
    })))
    component.people.set(2)
    component.search()
    component.select(mesa('mesa-1', 1, 2))
    tableService.getAvailable.mockReturnValue(of([mesa('mesa-3', 3, 4)]))
    component.continue()
    fixture.detectChanges()
    expect(texto()).toContain('Esa mesa ya no está disponible')
    expect(tableService.getAvailable).toHaveBeenCalledTimes(2)
    expect(component.selected()).toBeNull()
    expect(cartStore.table()).toBeNull()
    expect(router.navigate).not.toHaveBeenCalled()
  })

  it('con otro error muestra un mensaje genérico', () => {
    tableService.occupy.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })))
    component.people.set(2)
    component.search()
    component.select(mesa('mesa-1', 1, 2))
    component.continue()
    fixture.detectChanges()
    expect(texto()).toContain('No se ha podido ocupar la mesa')
    expect(router.navigate).not.toHaveBeenCalled()
  })
})
