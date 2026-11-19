import { describe, it, expect, beforeEach } from 'vitest'
import { TableService } from './table.service.js'
import { MockTableRepository } from '@repositories/mocks/MockTableRepository.js'
import {
    InvalidTableNumberError,
    InvalidTableCapacityError,
    InvalidTableStatusError,
    RestaurantIdRequiredError,
    DuplicatedTableNumberError
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
})
