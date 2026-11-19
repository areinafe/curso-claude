import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { errorHandler } from './errorHandler.js'
import { TableNotFoundError, TableNotAvailableError, InvalidPeopleCountError } from '@errors/DomainErrors.js'

function createRes() {
    const res = {
        status: vi.fn(),
        json: vi.fn()
    }
    res.status.mockReturnValue(res)
    res.json.mockReturnValue(res)
    return res
}

function handle(error: unknown) {
    const res = createRes()
    errorHandler(error, {} as Request, res as unknown as Response, vi.fn() as NextFunction)
    return res
}

describe('errorHandler', () => {
    it('responde 404 con TableNotFoundError', () => {
        const res = handle(new TableNotFoundError())
        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({ error: 'TableNotFoundError', message: 'Table not found' })
    })

    it('responde 400 con TableNotAvailableError', () => {
        const res = handle(new TableNotAvailableError())
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ error: 'TableNotAvailableError', message: 'Table is not available' })
    })

    it('responde 400 con InvalidPeopleCountError', () => {
        const res = handle(new InvalidPeopleCountError())
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json.mock.calls[0]![0].error).toBe('InvalidPeopleCountError')
    })

    it('responde 500 con errores que no son de dominio', () => {
        const res = handle(new Error('boom'))
        expect(res.status).toHaveBeenCalledWith(500)
    })
})
