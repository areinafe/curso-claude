import { randomUUID } from 'crypto'
import type { Table } from '@models/table.model.js'
import { normalizeTableStatus } from '@models/table.model.js'
import type { TableRepository } from '@repositories/table.repository.js'
import {
    InvalidTableNumberError,
    InvalidTableCapacityError,
    RestaurantIdRequiredError,
    DuplicatedTableNumberError,
    TableNotFoundError,
    TableNotAvailableError,
    InvalidPeopleCountError
} from '@errors/DomainErrors.js'

export interface CreateTableDTO {
    restaurantId: string
    number: unknown
    description?: unknown
    capacity: unknown
    status?: unknown
}

export interface UpdateTableDTO {
    number: unknown
    description?: unknown
    capacity: unknown
    status?: unknown
}

export class TableService {
    constructor(private readonly tableRepository: TableRepository) {}

    async create(dto: CreateTableDTO): Promise<Table> {
        const now = new Date().toISOString()
        const table = this.buildTable({
            id: randomUUID(),
            restaurantId: dto.restaurantId,
            number: dto.number,
            description: dto.description,
            capacity: dto.capacity,
            status: dto.status ?? 'libre',
            createdAt: now,
            updatedAt: now
        })

        await this.ensureNumberIsUnique(table)
        await this.tableRepository.save(table)
        return table
    }

    async update(restaurantId: string, id: string, dto: UpdateTableDTO): Promise<Table> {
        const existing = await this.findById(restaurantId, id)

        const updated = this.buildTable({
            id: existing.id,
            restaurantId: existing.restaurantId,
            number: dto.number,
            description: dto.description,
            capacity: dto.capacity,
            status: dto.status ?? existing.status,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString()
        })

        await this.ensureNumberIsUnique(updated)
        await this.tableRepository.save(updated)
        return updated
    }

    async delete(restaurantId: string, id: string): Promise<void> {
        await this.findById(restaurantId, id)
        await this.tableRepository.delete(id)
    }

    async findById(restaurantId: string, id: string): Promise<Table> {
        const table = await this.tableRepository.findById(id)
        if (!table || table.restaurantId !== restaurantId) {
            throw new TableNotFoundError()
        }
        return table
    }

    async findByRestaurantId(restaurantId: string): Promise<Table[]> {
        return this.tableRepository.findByRestaurantId(restaurantId)
    }

    async updateStatus(restaurantId: string, id: string, status: unknown): Promise<Table> {
        const existing = await this.findById(restaurantId, id)
        const updated: Table = {
            ...existing,
            status: normalizeTableStatus(status),
            updatedAt: new Date().toISOString()
        }
        await this.tableRepository.save(updated)
        return updated
    }

    async findAvailable(restaurantId: string, people: unknown): Promise<Table[]> {
        return this.tableRepository.findAvailable(restaurantId, parsePeopleCount(people))
    }

    async occupy(restaurantId: string, id: string): Promise<Table> {
        await this.findById(restaurantId, id)
        const occupied = await this.tableRepository.occupyIfFree(id)
        if (!occupied) {
            throw new TableNotAvailableError()
        }
        return this.findById(restaurantId, id)
    }

    private async ensureNumberIsUnique(table: Table): Promise<void> {
        const tables = await this.tableRepository.findByRestaurantId(table.restaurantId)
        if (tables.some(t => t.number === table.number && t.id !== table.id)) {
            throw new DuplicatedTableNumberError()
        }
    }

    private buildTable(props: {
        id: string
        restaurantId: string
        number: unknown
        description: unknown
        capacity: unknown
        status: unknown
        createdAt: string
        updatedAt: string
    }): Table {
        if (!props.restaurantId || props.restaurantId.trim() === '') {
            throw new RestaurantIdRequiredError()
        }
        if (!isPositiveInteger(props.number)) {
            throw new InvalidTableNumberError()
        }
        if (!isPositiveInteger(props.capacity)) {
            throw new InvalidTableCapacityError()
        }

        return {
            id: props.id,
            restaurantId: props.restaurantId,
            number: props.number,
            description: normalizeDescription(props.description),
            capacity: props.capacity,
            status: normalizeTableStatus(props.status),
            createdAt: props.createdAt,
            updatedAt: props.updatedAt
        }
    }
}

function isPositiveInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 1
}

function parsePeopleCount(value: unknown): number {
    if (isPositiveInteger(value)) return value
    if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) return Number(value)
    throw new InvalidPeopleCountError()
}

function normalizeDescription(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
}
