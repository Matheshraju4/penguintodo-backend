import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_fimvYHXU_85VMQvtYLetoRUB2hLUPuNYK');

export async function SendMail(email: string, userName: string, verificationUrl: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: "Penguin Todo <onboarding@penguintodo.makeweb.digital>",
            to: [email],
            subject: "🐧 Verify your Penguin Todo account",
            html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #2D3436; margin: 0;">Welcome to Penguin Todo!</h1>
                    <p style="color: #636E72; font-size: 16px;">One last step to get you started.</p>
                </div>
                
                <div style="background-color: #F9F9F9; padding: 40px; border-radius: 8px; text-align: center;">
                    <p style="color: #2D3436; font-size: 18px; margin-bottom: 10px;">Hello ${userName},</p>
                    <p style="color: #636E72; margin-bottom: 30px;">Please click the button below to verify your email address and activate your account:</p>
                    
                    <a href="${verificationUrl}" style="background-color: #00B894; color: white; padding: 15px 35px; text-decoration: none; font-size: 18px; font-weight: bold; border-radius: 6px; display: inline-block;">
                        Verify Account
                    </a>
                    
                    <p style="color: #B2BEC3; font-size: 12px; margin-top: 30px;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="${verificationUrl}" style="color: #00B894; word-break: break-all;">${verificationUrl}</a>
                    </p>
                </div>
                
                <div style="margin-top: 30px; text-align: center; color: #B2BEC3; font-size: 14px;">
                    <p>This link will expire in 24 hours.</p>
                    <p>If you didn't request this email, you can safely ignore it.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p>&copy; 2026 Penguin Todo. All rights reserved.</p>
                </div>
            </div>
            `,
        });

        if (error) {
            console.error("Resend Error:", error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        console.error("Mail System Error:", err);
        return { success: false, error: err };
    }
}
