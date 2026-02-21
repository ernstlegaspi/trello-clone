import nodemailer from "nodemailer";

import env from "../config/env.js";
import HttpError from "./httpError.js";

type SendOrganizationInviteEmailInput = {
  toEmail: string;
  organizationName: string;
  invitedByName: string;
  invitationLink: string;
  expiresAt: string | Date;
};

let transporter: nodemailer.Transporter | undefined;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (env.SMTP_MOCK) {
    throw new HttpError(500, "Email transporter is disabled in mock mode");
  }

  if (!env.SMTP_HOST) {
    throw new HttpError(500, "Email service is not configured", {
      hint: "Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, and SMTP_MOCK=false"
    });
  }

  // Common misconfiguration: mixing Mailtrap host with Gmail credentials.
  if (
    env.SMTP_HOST.toLowerCase().includes("mailtrap") &&
    env.SMTP_USER &&
    env.SMTP_USER.toLowerCase().includes("@gmail.com")
  ) {
    throw new HttpError(500, "SMTP configuration is invalid", {
      hint: "Use Mailtrap inbox credentials with smtp.mailtrap.io, or use SMTP_HOST=smtp.gmail.com for Gmail."
    });
  }

  const hasAuth = Boolean(env.SMTP_USER && env.SMTP_PASS);
  if (!hasAuth) {
    throw new HttpError(500, "SMTP authentication is not configured", {
      hint: "Set SMTP_USER and SMTP_PASS"
    });
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  return transporter;
};

export const sendOrganizationInviteEmail = async ({
  toEmail,
  organizationName,
  invitedByName,
  invitationLink,
  expiresAt
}: SendOrganizationInviteEmailInput) => {
  const expiresAtText = new Date(expiresAt).toUTCString();
  const subject = `Invitation to join ${organizationName}`;
  const text = [
    `You were invited by ${invitedByName} to join "${organizationName}".`,
    "",
    `Accept invitation: ${invitationLink}`,
    "",
    `This invitation expires on ${expiresAtText}.`
  ].join("\n");
  const html = [
    `<p>You were invited by <strong>${invitedByName}</strong> to join <strong>${organizationName}</strong>.</p>`,
    `<p><a href="${invitationLink}">Accept invitation</a></p>`,
    `<p>This invitation expires on ${expiresAtText}.</p>`
  ].join("");

  if (env.SMTP_MOCK) {
    console.log(
      `[MOCK EMAIL] to=${toEmail} subject="${subject}" invite_link=${invitationLink}`
    );
    return;
  }

  const mailTransporter = getTransporter();
  try {
    await mailTransporter.sendMail({
      from: env.SMTP_FROM,
      to: toEmail,
      subject,
      text,
      html
    });
  } catch (error) {
    throw new HttpError(500, "Failed to send invitation email", {
      code: error?.code,
      reason: error?.message,
      response: error?.response
    });
  }
};
