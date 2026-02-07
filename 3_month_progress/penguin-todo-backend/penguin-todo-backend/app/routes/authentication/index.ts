import Cryptr from "cryptr";
import express from "express";
import jwt from "jsonwebtoken";

import { prisma } from "../../../prisma/db";
import { SendMail } from "../../utils";

export const authentication = express.Router();

const cryptr = new Cryptr(process.env.ENCRYPTION_KEY!);

authentication.get("/verify", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #e74c3c;">Verification Failed</h1>
                <p>Missing verification token.</p>
            </div>
        `);
  }

  try {
    const decoded = jwt.verify(token as string, process.env.JWT_TOKEN_KEY!) as {
      id: string;
      email: string;
    };

    await prisma.user.update({
      where: {
        id: decoded.id,
        email: decoded.email,
      },
      data: {
        isVerified: true,
      },
    });

    return res.send(`
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5;">
                <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; max-width: 400px;">
                    <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
                    <h1 style="color: #2d3436; margin-bottom: 10px;">Email Verified!</h1>
                    <p style="color: #636e72; line-height: 1.6; margin-bottom: 30px;">
                        Your account has been successfully verified. You can now close this window and log in to the app.
                    </p>
                    <a href="${process.env.FRONTEND_URL || "#"}" style="background-color: #00b894; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Go to Login
                    </a>
                </div>
            </div>
        `);
  } catch (error) {
    console.error("Verification Error:", error);
    return res.status(400).send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #e74c3c;">Verification Link Expired</h1>
                <p>This link is invalid or has expired. Please request a new verification email.</p>
            </div>
        `);
  }
});

authentication.get("/resend_email", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (user) {
      const verificationToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_TOKEN_KEY!,
        { expiresIn: "24h" },
      );

      const verificationUrl = `${process.env.APP_URL}/auth/verify?token=${verificationToken}`;

      const { success, error: mailError } = await SendMail(
        email,
        user.name || "User",
        verificationUrl,
      );

      if (!success) {
        return res.status(201).json({
          success: true,
          message:
            "User is Found, but failed to send verification email. Please try resending it later.",
          user: {
            id: user.id,
            email: user.email,
          },
        });
      }

      return res.status(201).json({
        success: true,
        message:
          "User is Found Please check your email to verify your account.",
        user: {
          id: user.id,
          email: user.email,
        },
      });
    }
    // Generate a verification token (JWT)
  } catch (error) {
    console.log("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during resending email",
    });
  }
});

authentication.post("/create_user", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Kindly enter email",
    });
  }
  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Kindly enter password",
    });
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: cryptr.encrypt(password),
        name: name,
      },
    });

    // Generate a verification token (JWT)
    const verificationToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_TOKEN_KEY!,
      { expiresIn: "24h" },
    );

    const verificationUrl = `${process.env.APP_URL}/auth/verify?token=${verificationToken}`;

    const { success, error: mailError } = await SendMail(
      email,
      user.name || "User",
      verificationUrl,
    );

    if (!success) {
      return res.status(201).json({
        success: true,
        message:
          "User created, but failed to send verification email. Please try resending it later.",
        user: {
          id: user.id,
          email: user.email,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "User created successfully. Please check your email to verify your account.",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.log("Error Creating a User", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating a user",
    });
  }
});

authentication.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Kindly enter email",
    });
  }
  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Kindly enter password",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    if (user.isVerified === false) {
      return res.status(401).json({
        success: false,
        message: "Verify your email and then login",
      });
    }

    if (password === cryptr.decrypt(user.password)) {
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        process.env.JWT_TOKEN_KEY!,
      );

      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber,
        },
        token: token,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    console.log("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during login",
    });
  }
});
