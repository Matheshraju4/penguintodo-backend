import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export async function verifyUser(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        // 1. Headers are accessed via req.headers (plural) or req.header() method
        const userAuthToken = req.headers["user-auth-token"] as string;

        if (!userAuthToken) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided.",
            });
        }

        // 2. Verify the token
        const decoded = jwt.verify(userAuthToken, process.env.JWT_TOKEN_KEY!);

        // 3. Attach user data to request object for use in routes
        (req as any).user = decoded;

        // 4. Call next() to move to the next middleware/route handler
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
}
