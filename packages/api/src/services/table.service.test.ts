import { describe, it, expect, beforeEach } from 'vitest'
import { TableService } from './table.service.js'
import { MockTableRepository } from '@repositories/mocks/MockTableRepository.js'
import {
    InvalidTableNumberError,
    InvalidTableCapacityError,
    InvalidTableStatusError,
    RestaurantIdRequiredError,
    DuplicatedTableNumberError,
    TableNotFoundError
} from '@errors/DomainErrors.js'

describe('TableService', () => {
    let repo: MockTableRepository
    let service: TableService

    const validInput = {
        restaurantId: 'r1',
        number: 1,
        description: 'Terraza',
        capacity: 4
    }

    beforeEach(() => {
        repo = new MockTableRepository()
        service = new TableService(repo)
    })

    describe('create', () => {
        it('crea una mesa en estado libre por defecto y la guarda', async () => {
            const table = await service.create(validInput)

            expect(table.id).toBeTruthy()
            expect(table).toMatchObject({ restaurantId: 'r1', number: 1, description: 'Terraza', capacity: 4, status: 'libre' })
            expect(table.createdAt).toBe(table.updatedAt)
            expect(new Date(table.createdAt).toISOString()).toBe(table.createdAt)
            expect(await repo.findById(table.id)).toEqual(table)
        })

        it('respeta el estado indicado y lo normaliza', async () => {
            const table = await service.create({ ...validInput, status: ' Reservada ' })
            expect(table.status).toBe('reservada')
        })

        it('guarda description como null si falta, es null, vacía o solo espacios, y la recorta si no', async () => {
            const { description: _omit, ...withoutDescription } = validInput
            expect((await service.create({ ...withoutDescription, number: 1 })).description).toBeNull()
            expect((await service.create({ ...validInput, number: 2, description: null })).description).toBeNull()
            expect((await service.create({ ...validInput, number: 3, description: '' })).description).toBeNull()
            expect((await service.create({ ...validInput, number: 4, description: '   ' })).description).toBeNull()
            expect((await service.create({ ...validInput, number: 5, description: '  Salón  ' })).description).toBe('Salón')
        })

        it.each([0, -1, 1.5, '4', null, undefined, NaN])('lanza InvalidTableNumberError con number = %s', async (number) => {
            await expect(service.create({ ...validInput, number: number as any })).rejects.toThrow(InvalidTableNumberError)
        })

        it.each([0, -2, 2.5, '4', null, undefined])('lanza InvalidTableCapacityError con capacity = %s', async (capacity) => {
            await expect(service.create({ ...validInput, capacity: capacity as any })).rejects.toThrow(InvalidTableCapacityError)
        })

        it('lanza InvalidTableStatusError con un estado inválido', async () => {
            await expect(service.create({ ...validInput, status: 'rota' })).rejects.toThrow(InvalidTableStatusError)
        })

        it('lanza RestaurantIdRequiredError si falta el restaurante', async () => {
            await expect(service.create({ ...validInput, restaurantId: '' })).rejects.toThrow(RestaurantIdRequiredError)
        })

        it('lanza DuplicatedTableNumberError si el número ya existe en el restaurante', async () => {
            await service.create(validInput)
            await expect(service.create({ ...validInput, capacity: 2 })).rejects.toThrow(DuplicatedTableNumberError)
        })

        it('permite el mismo número en otro restaurante', async () => {
            await service.create(validInput)
            const other = await service.create({ ...validInput, restaurantId: 'r2' })
            expect(other.restaurantId).toBe('r2')
        })
    })
    describe('findById', () => {
        it('devuelve la mesa del restaurante', async () => {
            const created = await service.create(validInput)
            expect(await service.findById('r1', created.id)).toEqual(created)
        })

        it('lanza TableNotFoundError si no existe', async () => {
            await expect(service.findById('r1', 'no-existe')).rejects.toThrow(TableNotFoundError)
        })

        it('lanza TableNotFoundError si la mesa es de otro restaurante', async () => {
            const created = await service.create(validInput)
            await expect(service.findById('r2', created.id)).rejects.toThrow(TableNotFoundError)
        })
    })

    describe('findByRestaurantId', () => {
        it('devuelve solo las mesas del restaurante ordenadas por número', async () => {
            await service.create({ ...validInput, number: 3 })
            await service.create({ ...validInput, number: 1 })
            await service.create({ ...validInput, restaurantId: 'r2', number: 2 })

            const tables = await service.findByRestaurantId('r1')
            expect(tables.map(t => t.number)).toEqual([1, 3])
        })
    })

    describe('update', () => {
        it('revalida, actualiza los datos y mantiene restaurantId y createdAt', async () => {
            const created = await service.create(validInput)

            const updated = await service.update('r1', created.id, { number: 8, description: '  Barra ', capacity: 2, status: 'reservada' })

            expect(updated).toMatchObject({ id: created.id, restaurantId: 'r1', number: 8, description: 'Barra', capacity: 2, status: 'reservada', createdAt: created.createdAt })
            expect(await repo.findById(created.id)).toEqual(updated)
        })

        it('conserva el estado actual si no se envía status', async () => {
            const created = await service.create({ ...validInput, status: 'ocupada' })
            const updated = await service.update('r1', created.id, { number: 1, capacity: 6 })
            expect(updated.status).toBe('ocupada')
        })

        it('pone description a null si se envía vacía o no se envía', async () => {
            const created = await service.create(validInput)
            expect((await service.update('r1', created.id, { number: 1, capacity: 4, description: ' ' })).description).toBeNull()
            expect((await service.update('r1', created.id, { number: 1, capacity: 4 })).description).toBeNull()
        })

        it('lanza errores de validación', async () => {
            const created = await service.create(validInput)
            await expect(service.update('r1', created.id, { number: 0, capacity: 4 })).rejects.toThrow(InvalidTableNumberError)
            await expect(service.update('r1', created.id, { number: 1, capacity: '4' })).rejects.toThrow(InvalidTableCapacityError)
            await expect(service.update('r1', created.id, { number: 1, capacity: 4, status: 'rota' })).rejects.toThrow(InvalidTableStatusError)
        })

        it('permite mantener su propio número', async () => {
            const created = await service.create(validInput)
            await expect(service.update('r1', created.id, { number: 1, capacity: 2 })).resolves.toMatchObject({ number: 1, capacity: 2 })
        })

        it('lanza DuplicatedTableNumberError si el número es de otra mesa del restaurante', async () => {
            await service.create(validInput)
            const other = await service.create({ ...validInput, number: 2 })
            await expect(service.update('r1', other.id, { number: 1, capacity: 4 })).rejects.toThrow(DuplicatedTableNumberError)
        })

        it('lanza TableNotFoundError si no existe o es de otro restaurante', async () => {
            const created = await service.create(validInput)
            await expect(service.update('r1', 'no-existe', { number: 1, capacity: 4 })).rejects.toThrow(TableNotFoundError)
            await expect(service.update('r2', created.id, { number: 1, capacity: 4 })).rejects.toThrow(TableNotFoundError)
        })
    })

    describe('delete', () => {
        it('borra la mesa en cualquier estado', async () => {
            const created = await service.create({ ...validInput, status: 'ocupada' })
            await service.delete('r1', created.id)
            expect(await repo.findById(created.id)).toBeNull()
        })

        it('lanza TableNotFoundError si no existe o es de otro restaurante', async () => {
            const created = await service.create(validInput)
            await expect(service.delete('r1', 'no-existe')).rejects.toThrow(TableNotFoundError)
            await expect(service.delete('r2', created.id)).rejects.toThrow(TableNotFoundError)
            expect(await repo.findById(created.id)).not.toBeNull()
        })
    })
})
