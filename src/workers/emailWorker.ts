import { emailQueue } from "../lib/queue";
import nodemailer from "nodemailer";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

emailQueue.process("send-emails", async (job) => {
  const { recipients, htmlTemplate, smtpSettings, delaySeconds } = job.data;

  const transporter = nodemailer.createTransport({
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: smtpSettings.port === 465,
    auth: {
      user: smtpSettings.user,
      pass: smtpSettings.pass,
    },
  });

  let successCount = 0;
  let failCount = 0;

  for (const recipient of recipients) {
    const { email, name } = recipient;
    if (!email) {
      console.error("Invalid recipient data:", recipient);
      failCount++;
      continue;
    }

    console.log(`Preparing email for: ${email}`);

    const personalizedContent = htmlTemplate
      .replace(/{{name}}/g, name || "Valued Customer")
      .replace(/{{email}}/g, email);

    try {
      await transporter.sendMail({
        from: smtpSettings.from,
        to: email,
        subject: smtpSettings.subject,
        html: personalizedContent,
      });

      successCount++;
      console.log(`Email successfully sent to: ${email}`);

      if (delaySeconds > 0) {
        console.log(
          `Delaying for ${delaySeconds} seconds before next email...`
        );
        await delay(delaySeconds * 1000);
      }
    } catch (error) {
      failCount++;
      console.error(`Failed to send email to ${email}:`, error);
    }
  }

  console.log(
    `Batch completed. Success: ${successCount}, Failures: ${failCount}`
  );
  return { successCount, failCount };
});
