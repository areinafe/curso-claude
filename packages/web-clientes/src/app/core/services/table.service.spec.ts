import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { firstValueFrom } from 'rxjs'
import { API_URL } from '@resttek/web-shared'
import { TableService } from './table.service'
import { Table } from '../models/table.model'

const mesa: Table = {
  id: 'mesa-1',
  restaurantId: 'rest-1',
  number: 1,
  description: null,
  capacity: 4,
  status: 'libre',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
}

describe('TableService', () => {
  let service: TableService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/v1' }
      ]
    })
    service = TestBed.inject(TableService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('getAvailable pide las mesas libres para N personas', async () => {
    const promise = firstValueFrom(service.getAvailable('rest-1', 3))
    const req = http.expectOne(r => r.url === '/api/v1/public/restaurants/rest-1/tables/available')
    expect(req.request.method).toBe('GET')
    expect(req.request.params.get('people')).toBe('3')
    req.flush([mesa])
    expect(await promise).toEqual([mesa])
  })

  it('occupy hace POST sin cuerpo sobre la mesa', async () => {
    const promise = firstValueFrom(service.occupy('rest-1', 'mesa-1'))
    const req = http.expectOne('/api/v1/public/restaurants/rest-1/tables/mesa-1/occupy')
    expect(req.request.method).toBe('POST')
    req.flush({ ...mesa, status: 'ocupada' })
    expect((await promise).status).toBe('ocupada')
  })
})
