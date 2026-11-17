import { TestBed } from '@angular/core/testing'
import { Subject } from 'rxjs'
import { EmployeeService } from '../services/employee.service'
import { EmployeeStore } from './employee.store'
import type { Employee } from '../models/employee.model'

function employee(id: string, restaurantId: string): Employee {
  return { id, firstName: `Empleado ${id}`, lastName: '', email: `${id}@resttek.com`, role: 'camarero', restaurantId }
}

describe('EmployeeStore', () => {
  let respuestas: Record<string, Subject<Employee[]>>
  let store: EmployeeStore

  beforeEach(() => {
    respuestas = { 'rest-1': new Subject(), 'rest-2': new Subject() }
    TestBed.configureTestingModule({
      providers: [{ provide: EmployeeService, useValue: { getByRestaurant: (id: string) => respuestas[id] } }]
    })
    store = TestBed.inject(EmployeeStore)
  })

  it('descarta la respuesta obsoleta de un restaurante anterior', async () => {
    const carga1 = store.loadByRestaurant('rest-1')
    const carga2 = store.loadByRestaurant('rest-2')

    respuestas['rest-2'].next([employee('b', 'rest-2')])
    respuestas['rest-2'].complete()
    await carga2
    respuestas['rest-1'].next([employee('a', 'rest-1')])
    respuestas['rest-1'].complete()
    await carga1

    expect(store.employees().map(e => e.id)).toEqual(['b'])
    expect(store.loading()).toBe(false)
  })

  it('vacía la lista mientras carga otro restaurante', async () => {
    const carga1 = store.loadByRestaurant('rest-1')
    respuestas['rest-1'].next([employee('a', 'rest-1')])
    respuestas['rest-1'].complete()
    await carga1
    expect(store.employees()).toHaveLength(1)

    const carga2 = store.loadByRestaurant('rest-2')

    expect(store.employees()).toEqual([])
    respuestas['rest-2'].next([])
    respuestas['rest-2'].complete()
    await carga2
  })
})
