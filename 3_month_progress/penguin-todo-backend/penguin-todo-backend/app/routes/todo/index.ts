import express, { type Request, type Response } from "express";
import type { SubTask, Todo } from "../../../generated/prisma/client";
import { prisma } from "../../../prisma/db";
import { verifyUser } from "../middleware";

export const manageTodo = express.Router();

manageTodo.post(
    "/manage_todo",
    verifyUser,
    async (req: Request, res: Response) => {
        try {
            const { id, title, description, priority, status, subTasks, tags, date } =
                req.body;

            const subtask = subTasks as SubTask[];
            // 1. Extract the ID from the decoded user object
            const user = (req as any).user;
            const userId = user.id;

            let todo: Todo;

            // 2. Handle Update vs Create
            if (id) {
                todo = await prisma.todo.update({
                    where: { id },
                    data: {
                        title,
                        description,
                        priority,
                        status,
                        tags,
                        date: date ? new Date(date) : undefined,
                        subTasks: {
                            deleteMany: {}, // Clear existing subtasks
                            create: subtask.map((task) => ({
                                title: task.title,
                                status: task.status,
                            })),
                        },
                    },
                });
            } else {
                todo = await prisma.todo.create({
                    data: {
                        title,
                        description,
                        priority,
                        status,
                        tags,
                        date: date ? new Date(date) : undefined,
                        userId: userId,
                        subTasks: {
                            create: subtask.map((task) => ({
                                title: task.title,
                                status: task.status,
                            })),
                        },
                    },
                });
            }

            return res.status(200).json({
                success: true,
                todo,
                message: id ? "Todo Updated Successfully" : "Todo Created Successfully",
            });
        } catch (error) {
            console.log("Error while saving Todo:", error);
            return res.status(500).json({
                success: false,
                message: "Something went wrong while saving the todo",
            });
        }
    },
);

manageTodo.get(
    "/get_todos",
    verifyUser,
    async (req: Request, res: Response) => {
        // console.log("Received Request")

        try {
            const filter = req.query.filter as string;

            const user = (req as any).user;
            const userId = user.id;

            const whereClause: any = { userId };

            const now = new Date();
            const startOfToday = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
            );
            const endOfToday = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                23,
                59,
                59,
                999,
            );

            if (filter === "Today") {
                whereClause.date = {
                    gte: startOfToday,
                    lte: endOfToday,
                };
            } else if (filter === "Upcoming") {
                whereClause.date = {
                    gt: endOfToday,
                };
            } else if (filter === "Previous") {
                whereClause.date = {
                    lt: startOfToday,
                };
            } else if (filter === "Completed") {
                whereClause.status = "COMPLETED";
            } else if (filter === "Pending") {
                whereClause.status = "PENDING";
            }

            const todos = await prisma.todo.findMany({
                where: whereClause,
                include: {
                    subTasks: true,
                },
                orderBy: {
                    date: "asc",
                },
            });

            return res.status(200).json({
                success: true,
                todos,
                message: "Todos are Fetched SuccessFully",
            });
        } catch (error) {
            console.log("Error while Fetching Todo:", error);
            return res.status(500).json({
                success: false,
                message: "Something went wrong while fetching the todo",
            });
        }
    },
);

manageTodo.post("/delete_todo", verifyUser, async (req, res) => {
    try {
        const user = (req as any).user;
        const userId = user.id;

        const { id } = req.body;
        const deletetodo = await prisma.todo.delete({
            where: { userId, id },
        });

        return res.status(200).json({
            success: true,
            deletetodo,
            message: "Todos are Deleted SuccessFully",
        });
    } catch (error) {
        console.log("Error while deleting Todo:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while Deleting the todo",
        });
    }
});
