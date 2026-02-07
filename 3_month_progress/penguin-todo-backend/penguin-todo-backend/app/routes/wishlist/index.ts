import express, { type Request, type Response } from "express";
import type { Wishlist } from "../../../generated/prisma/client";
import { prisma } from "../../../prisma/db";
import { verifyUser } from "../middleware";

export const manageWishlist = express.Router();

manageWishlist.post(
    "/manage_wishlist",
    verifyUser,
    async (req: Request, res: Response) => {
        try {
            const { id, title, description, status, date, } =
                req.body;

            // 1. Extract the ID from the decoded user object
            const user = (req as any).user;
            const userId = user.id;

            let wishlist: Wishlist;

            // 2. Handle Update vs Create
            if (id) {
                wishlist = await prisma.wishlist.update({
                    where: { id },
                    data: {
                        title,
                        description,

                        date: date ? new Date(date) : undefined,
                        status: status

                    },
                });
            } else {
                wishlist = await prisma.wishlist.create({
                    data: {
                        title,
                        description,

                        status,

                        date: date ? new Date(date) : undefined,
                        userId: userId,

                    },
                });
            }

            return res.status(200).json({
                success: true,
                wishlist,
                message: id ? "Wishlist Updated Successfully" : "Wishlist Created Successfully",
            });
        } catch (error) {
            console.log("Error while saving wishlist:", error);
            return res.status(500).json({
                success: false,
                message: "Something went wrong while saving the wishlist",
            });
        }
    },
);

manageWishlist.get("/get_wishlists", verifyUser, async (req: Request, res: Response) => {

    try {
        const user = (req as any).user;
        const userId = user.id;
        const wishlists = await prisma.wishlist.findMany({
            where: {
                userId,
            }, orderBy: {
                updatedAt: "asc"
            }
        });

        return res.status(200).json({
            success: true,
            wishlists,
            message: "wishlists are Fetched SuccessFully",
        });
    } catch (error) {
        console.log("Error while Fetching wishlists:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching the wishlists",
        });
    }
});


manageWishlist.delete("/delete_wishlist", verifyUser, async (req, res) => {
    try {

        const user = (req as any).user;
        const userId = user.id;

        const { id } = req.body
        const deleteWishlist = await prisma.wishlist.delete({
            where: { userId, id }
        })

        return res.status(200).json({
            success: true,
            deleteWishlist,
            message: "Wishlist Deleted SuccessFully",
        });

    } catch (error) {
        console.log("Error while deleting wishlist:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while Deleting the wishlist",
        });

    }
})