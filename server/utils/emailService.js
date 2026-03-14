const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false // Bypass SSL certificate issues for development
    }
});

/**
 * Send OTP via Email
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 */
async function sendOTP(email, otp) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Your Vyntro Verification Code',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                    <h2 style="color: #0f172a; text-align: center;">Verification Required</h2>
                    <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
                        Please use the following 6-digit code to complete your login to <strong>Vyntro</strong>.
                    </p>
                    <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 12px; color: #3b82f6;">${otp}</span>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        This code is valid for 10 minutes. If you did not request this code, please ignore this email.
                    </p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP Email sent:', info.messageId);
        return true;
    } catch (err) {
        console.error('Error sending OTP email:', err);
        // We log the error but don't strictly throw if we want to handle it in controller
        throw err;
    }
}

module.exports = { sendOTP };
