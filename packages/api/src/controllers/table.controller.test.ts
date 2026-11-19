import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { TableController } from './table.controller.js'
import type { TableService } from '@services/table.service.js'
import type { Table } from '@models/table.model.js'
import { TableNotFoundError } from '@errors/DomainErrors.js'

const table: Table = {
    id: 't1',
    restaurantId: 'r1',
    number: 1,
    description: null,
    capacity: 4,
    status: 'libre',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
}

function createService() {
    return {
        create: vi.fn(),
        findByRestaurantId: vi.fn(),
        findById: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        updateStatus: vi.fn(),
        findAvailable: vi.fn(),
        occupy: vi.fn()
    }
}

function createRes() {
    const res = {
        status: vi.fn(),
        json: vi.fn(),
        send: vi.fn()
    }
    res.status.mockReturnValue(res)
    res.json.mockReturnValue(res)
    res.send.mockReturnValue(res)
    return res
}

function createReq(overrides: Partial<Request> = {}): Request {
    return { params: { restaurantId: 'r1' }, body: {}, query: {}, ...overrides } as unknown as Request
}

describe('TableController', () => {
    let service: ReturnType<typeof createService>
    let controller: TableController
    let res: ReturnType<typeof createRes>
    let next: NextFunction

    beforeEach(() => {
        service = createService()
        controller = new TableController(service as unknown as TableService)
        res = createRes()
        next = vi.fn() as unknown as NextFunction
    })

    async function call(method: keyof TableController, req: Request) {
        await (controller[method] as any)(req, res as unknown as Response, next)
    }

    it('getAll usa req.params.restaurantId y responde 200 con la lista', async () => {
        service.findByRestaurantId.mockResolvedValue([table])
        await call('getAll', createReq())
        expect(service.findByRestaurantId).toHaveBeenCalledWith('r1')
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith([table])
    })

    it('getById pasa restaurantId e id y responde 200', async () => {
        service.findById.mockResolvedValue(table)
        await call('getById', createReq({ params: { restaurantId: 'r1', id: 't1' } }))
        expect(service.findById).toHaveBeenCalledWith('r1', 't1')
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(table)
    })

    it('create pasa el cuerpo con el restaurantId de la URL y responde 201', async () => {
        service.create.mockResolvedValue(table)
        const body = { number: 1, description: 'Terraza', capacity: 4, status: 'libre', restaurantId: 'otro' }
        await call('create', createReq({ body }))
        expect(service.create).toHaveBeenCalledWith({ number: 1, description: 'Terraza', capacity: 4, status: 'libre', restaurantId: 'r1' })
        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalledWith(table)
    })

    it('update pasa restaurantId, id y cuerpo y responde 200', async () => {
        service.update.mockResolvedValue(table)
        await call('update', createReq({ params: { restaurantId: 'r1', id: 't1' }, body: { number: 2, capacity: 4 } }))
        expect(service.update).toHaveBeenCalledWith('r1', 't1', { number: 2, description: undefined, capacity: 4, status: undefined })
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(table)
    })

    it('delete responde 204 sin cuerpo', async () => {
        service.delete.mockResolvedValue(undefined)
        await call('delete', createReq({ params: { restaurantId: 'r1', id: 't1' } }))
        expect(service.delete).toHaveBeenCalledWith('r1', 't1')
        expect(res.status).toHaveBeenCalledWith(204)
        expect(res.send).toHaveBeenCalledWith()
    })

    it('updateStatus pasa el estado del cuerpo y responde 200', async () => {
        service.updateStatus.mockResolvedValue({ ...table, status: 'ocupada' })
        await call('updateStatus', createReq({ params: { restaurantId: 'r1', id: 't1' }, body: { status: 'ocupada' } }))
        expect(service.updateStatus).toHaveBeenCalledWith('r1', 't1', 'ocupada')
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ ...table, status: 'ocupada' })
    })

    it.each(['getAll', 'getById', 'create', 'update', 'delete', 'updateStatus'] as const)('%s pasa los errores a next', async (method) => {
        const error = new TableNotFoundError()
        const serviceMethod = { getAll: 'findByRestaurantId', getById: 'findById' }[method as string] ?? method
        ;(service as any)[serviceMethod].mockRejectedValue(error)
        await call(method, createReq({ params: { restaurantId: 'r1', id: 't1' } }))
        expect(next).toHaveBeenCalledWith(error)
        expect(res.status).not.toHaveBeenCalled()
    })
    it('getAvailable lee req.query.people tal cual y responde 200 con las mesas', async () => {
        service.findAvailable.mockResolvedValue([table])
        await call('getAvailable', createReq({ query: { people: '3' } as any }))
        expect(service.findAvailable).toHaveBeenCalledWith('r1', '3')
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith([table])
    })

    it('occupy pasa restaurantId e id y responde 200 con la mesa ocupada', async () => {
        service.occupy.mockResolvedValue({ ...table, status: 'ocupada' })
        await call('occupy', createReq({ params: { restaurantId: 'r1', id: 't1' } }))
        expect(service.occupy).toHaveBeenCalledWith('r1', 't1')
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ ...table, status: 'ocupada' })
    })

    it.each(['getAvailable', 'occupy'] as const)('%s pasa los errores a next', async (method) => {
        const error = new TableNotFoundError()
        const serviceMethod = method === 'getAvailable' ? 'findAvailable' : 'occupy'
        service[serviceMethod].mockRejectedValue(error)
        await call(method, createReq({ params: { restaurantId: 'r1', id: 't1' } }))
        expect(next).toHaveBeenCalledWith(error)
        expect(res.status).not.toHaveBeenCalled()
    })
})
