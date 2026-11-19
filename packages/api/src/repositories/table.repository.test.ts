import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { SqliteTableRepository } from './table.repository.js'
import { Database } from '@config/database.js'
import type { Table } from '@models/table.model.js'

function buildTable(overrides: Partial<Table> = {}): Table {
    const now = new Date().toISOString()
    return {
        id: 't1',
        restaurantId: 'r1',
        number: 1,
        description: 'Junto a la ventana',
        capacity: 4,
        status: 'libre',
        createdAt: now,
        updatedAt: now,
        ...overrides
    }
}

describe('SqliteTableRepository (Integration)', () => {
    let db: Database
    let repo: SqliteTableRepository

    beforeAll(async () => {
        process.env.NODE_ENV = 'test'
        db = new Database()
        await db.initialize()
        repo = new SqliteTableRepository(db)

        for (const id of ['r1', 'r2']) {
            await db.run(
                'INSERT INTO restaurants (id, name, address, email, phone, owner_first_name, owner_last_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, `Restaurante ${id}`, 'Calle Mayor 10', `${id}@resttek.com`, '+34 612345678', 'Carlos', 'García', new Date().toISOString(), new Date().toISOString()]
            )
        }
    })

    afterAll(async () => {
        await db.close()
    })

    describe('operaciones básicas', () => {
        it('save inserta una mesa y findById la devuelve con todos sus campos', async () => {
            const table = buildTable()
            await repo.save(table)

            const found = await repo.findById('t1')
            expect(found).toEqual(table)
        })

        it('findById devuelve null si no existe', async () => {
            expect(await repo.findById('no-existe')).toBeNull()
        })

        it('save actualiza una mesa existente', async () => {
            const updated = buildTable({ number: 7, description: null, capacity: 6, status: 'reservada', updatedAt: '2030-01-01T00:00:00.000Z' })
            await repo.save(updated)

            const found = await repo.findById('t1')
            expect(found?.number).toBe(7)
            expect(found?.description).toBeNull()
            expect(found?.capacity).toBe(6)
            expect(found?.status).toBe('reservada')
            expect(found?.updatedAt).toBe('2030-01-01T00:00:00.000Z')
        })

        it('findByRestaurantId devuelve solo las mesas del restaurante ordenadas por número', async () => {
            await repo.save(buildTable({ id: 't2', number: 3 }))
            await repo.save(buildTable({ id: 't3', number: 2 }))
            await repo.save(buildTable({ id: 't-otro', restaurantId: 'r2', number: 1 }))

            const results = await repo.findByRestaurantId('r1')
            expect(results.map(t => t.number)).toEqual([2, 3, 7])
        })

        it('delete elimina la mesa', async () => {
            await repo.delete('t1')
            expect(await repo.findById('t1')).toBeNull()
        })
    })
})
