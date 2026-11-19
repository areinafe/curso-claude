import type { Request, Response, NextFunction } from 'express'
import type { TableService } from '@services/table.service.js'

export class TableController {
    constructor(private readonly tableService: TableService) {}

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tables = await this.tableService.findByRestaurantId(req.params.restaurantId as string)
            res.status(200).json(tables)
        } catch (error) {
            next(error)
        }
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.findById(req.params.restaurantId as string, req.params.id as string)
            res.status(200).json(table)
        } catch (error) {
            next(error)
        }
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.create({
                number: req.body?.number,
                description: req.body?.description,
                capacity: req.body?.capacity,
                status: req.body?.status,
                restaurantId: req.params.restaurantId as string
            })
            res.status(201).json(table)
        } catch (error) {
            next(error)
        }
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.update(req.params.restaurantId as string, req.params.id as string, {
                number: req.body?.number,
                description: req.body?.description,
                capacity: req.body?.capacity,
                status: req.body?.status
            })
            res.status(200).json(table)
        } catch (error) {
            next(error)
        }
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.tableService.delete(req.params.restaurantId as string, req.params.id as string)
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }

    updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.updateStatus(req.params.restaurantId as string, req.params.id as string, req.body?.status)
            res.status(200).json(table)
        } catch (error) {
            next(error)
        }
    }
}
