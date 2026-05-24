import nodemailer from "nodemailer";

const EMAIL_ENABLED = process.env.EMAIL_ENABLED === "true";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendWelcomeEmail({
  to,
  name,
  username,
  position,
  department,
  startDate,
  managerName,
}: {
  to: string;
  name: string;
  username: string;
  position: string;
  department: string;
  startDate: string;
  managerName?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!EMAIL_ENABLED) {
    console.log(`[EMAIL SIMULATED] Welcome email to ${to} for ${name}`);
    return { success: true };
  }

  try {
    await transporter.sendMail({
      from: `"OnboardIQ" <${process.env.SMTP_USER}>`,
      to,
      subject: `Welcome to the team, ${name}! 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #6366f1; padding: 32px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome aboard, ${name}!</h1>
          </div>
          <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
            <p style="color: #334155; font-size: 16px;">We're thrilled to have you join our team. Here are your onboarding details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Position</td>
                <td style="padding: 12px 0; color: #1e293b;">${position}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Department</td>
                <td style="padding: 12px 0; color: #1e293b;">${department}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Start Date</td>
                <td style="padding: 12px 0; color: #1e293b;">${startDate}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Username</td>
                <td style="padding: 12px 0; color: #1e293b; font-family: monospace;">${username}</td>
              </tr>
              ${managerName ? `<tr><td style="padding: 12px 0; color: #64748b; font-weight: 600;">Manager</td><td style="padding: 12px 0; color: #1e293b;">${managerName}</td></tr>` : ""}
            </table>
            <p style="color: #64748b; font-size: 14px;">Your IT team will set up your accounts and equipment before your start date. If you have any questions, please don't hesitate to reach out.</p>
            <p style="color: #334155; margin-top: 32px;">Looking forward to working with you!<br><strong>The HR Team</strong></p>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Email error";
    return { success: false, error: message };
  }
}

export async function sendOffboardingEmail({
  to,
  name,
  endDate,
}: {
  to: string;
  name: string;
  endDate: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!EMAIL_ENABLED) {
    console.log(`[EMAIL SIMULATED] Offboarding email to ${to} for ${name}`);
    return { success: true };
  }

  try {
    await transporter.sendMail({
      from: `"OnboardIQ" <${process.env.SMTP_USER}>`,
      to,
      subject: "Important: Offboarding Information",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b;">Hi ${name},</h2>
          <p style="color: #475569;">This email confirms your offboarding process has been initiated. Your last working day is <strong>${endDate}</strong>.</p>
          <p style="color: #475569;">Our HR team will reach out to guide you through the exit process, including equipment return and final documentation.</p>
          <p style="color: #334155;">Thank you for your contributions to the team.<br><strong>HR Team</strong></p>
        </div>
      `,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Email error";
    return { success: false, error: message };
  }
}
