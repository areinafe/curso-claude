import { TestBed } from '@angular/core/testing'
import { HttpErrorResponse } from '@angular/common/http'
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { TableStore } from '../../store/table.store'
import { TableService } from '../../services/table.service'
import { TableFormComponent } from './table-form.component'
import type { Table } from '../../models/table.model'

const MESA: Table = {
  id: 'mesa-1',
  restaurantId: 'rest-1',
  number: 5,
  description: 'Terraza',
  capacity: 4,
  status: 'ocupada',
  createdAt: '',
  updatedAt: ''
}

describe('TableFormComponent', () => {
  let store: { create: ReturnType<typeof vi.fn>, update: ReturnType<typeof vi.fn>, error: ReturnType<typeof vi.fn> }
  let service: { getById: ReturnType<typeof vi.fn> }
  let router: { navigate: ReturnType<typeof vi.fn> }

  async function crear(id: string | null) {
    TestBed.configureTestingModule({
      providers: [
        { provide: TableStore, useValue: store },
        { provide: TableService, useValue: service },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: { snapshot: { params: { restaurantId: 'rest-1' } } },
            snapshot: { paramMap: convertToParamMap(id ? { id } : {}) }
          }
        }
      ]
    })
    TestBed.overrideComponent(TableFormComponent, { set: { template: '', imports: [] } })
    const component = TestBed.createComponent(TableFormComponent).componentInstance
    component.ngOnInit()
    await new Promise(resolve => setTimeout(resolve))
    return component
  }

  beforeEach(() => {
    store = {
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockReturnValue(null)
    }
    service = { getById: vi.fn(() => of(MESA)) }
    router = { navigate: vi.fn() }
  })

  describe('alta', () => {
    it('no envía si el número es menor que 1', async () => {
      const c = await crear(null)
      c.form = { number: 0, description: '', capacity: 4, status: 'libre' }

      await c.onSubmit()

      expect(store.create).not.toHaveBeenCalled()
      expect(c.error()).toBe('El número de mesa debe ser un entero mayor o igual que 1.')
    })

    it('no envía si la capacidad es menor que 1 o está vacía', async () => {
      const c = await crear(null)
      c.form = { number: 1, description: '', capacity: null, status: 'libre' }
      await c.onSubmit()
      c.form = { number: 1, description: '', capacity: 0, status: 'libre' }
      await c.onSubmit()

      expect(store.create).not.toHaveBeenCalled()
      expect(c.error()).toBe('La capacidad debe ser un entero mayor o igual que 1.')
    })

    it('llama a create con la descripción recortada y navega al listado', async () => {
      const c = await crear(null)
      c.form = { number: 3, description: '  Ventana  ', capacity: 2, status: 'reservada' }

      await c.onSubmit()

      expect(store.create).toHaveBeenCalledWith('rest-1', {
        number: 3, description: 'Ventana', capacity: 2, status: 'reservada'
      })
      expect(router.navigate).toHaveBeenCalledWith(['/restaurants', 'rest-1', 'tables'])
    })

    it('envía description null si está vacía', async () => {
      const c = await crear(null)
      c.form = { number: 3, description: '   ', capacity: 2, status: 'libre' }

      await c.onSubmit()

      expect(store.create).toHaveBeenCalledWith('rest-1', expect.objectContaining({ description: null }))
    })

    it('muestra el mensaje del store si la API rechaza el alta y no navega', async () => {
      const c = await crear(null)
      store.create.mockRejectedValue(new HttpErrorResponse({ status: 400, error: { error: 'DuplicatedTableNumberError' } }))
      store.error.mockReturnValue('Ya existe una mesa con ese número en este restaurante.')
      c.form = { number: 3, description: '', capacity: 2, status: 'libre' }

      await c.onSubmit()

      expect(c.error()).toBe('Ya existe una mesa con ese número en este restaurante.')
      expect(router.navigate).not.toHaveBeenCalled()
    })
  })

  describe('edición', () => {
    it('precarga los datos de la mesa', async () => {
      const c = await crear('mesa-1')

      expect(service.getById).toHaveBeenCalledWith('rest-1', 'mesa-1')
      expect(c.isEditing).toBe(true)
      expect(c.form).toEqual({ number: 5, description: 'Terraza', capacity: 4, status: 'ocupada' })
    })

    it('muestra un error si no se puede cargar la mesa', async () => {
      service.getById.mockReturnValue(throwError(() => new Error('404')))
      const c = await crear('mesa-1')

      expect(c.error()).toBe('No se pudo cargar la mesa.')
    })

    it('llama a update sin status si no ha cambiado y navega al listado', async () => {
      const c = await crear('mesa-1')
      c.form = { ...c.form, capacity: 6 }

      await c.onSubmit()

      expect(store.update).toHaveBeenCalledWith('rest-1', 'mesa-1', {
        number: 5, description: 'Terraza', capacity: 6
      })
      expect(router.navigate).toHaveBeenCalledWith(['/restaurants', 'rest-1', 'tables'])
    })

    it('envía status en update si el admin lo ha cambiado', async () => {
      const c = await crear('mesa-1')
      c.form = { ...c.form, status: 'libre' }

      await c.onSubmit()

      expect(store.update).toHaveBeenCalledWith('rest-1', 'mesa-1', {
        number: 5, description: 'Terraza', capacity: 4, status: 'libre'
      })
    })
  })
})
