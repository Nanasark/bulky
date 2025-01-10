import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import xlsx from "xlsx";
import { parse, ParseResult } from "papaparse";

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    console.log("Starting bulk email sending process...");

    const formData = await req.formData();
    console.log("Received Form Data");

    const recipientFile = formData.get("recipientFile") as File;
    const htmlTemplate = formData.get("htmlTemplate") as string;
    const smtpHost = formData.get("host") as string;
    const smtpPort = parseInt(formData.get("port") as string);
    const smtpUser = formData.get("user") as string;
    const smtpPass = formData.get("pass") as string;
    const emailFrom = formData.get("from") as string;
    const emailSubject = formData.get("subject") as string;
    const delaySeconds = parseInt(formData.get("delaySeconds") as string);

    console.log("Form data overview:", {
      recipientFile: recipientFile?.name,
      htmlTemplate: !!htmlTemplate ? "Received" : "Not Received",
      smtpHost,
      smtpPort,
      emailFrom,
      emailSubject,
      delaySeconds,
    });

    if (!recipientFile || !htmlTemplate) {
      console.error("Missing required data: Recipient file or HTML template");
      return NextResponse.json(
        { success: false, message: "Missing required data" },
        { status: 400 }
      );
    }

    let recipients: { email: string; name: string }[] = [];

    console.log("Parsing recipient file...");
    if (
      recipientFile.name.endsWith(".xlsx") ||
      recipientFile.name.endsWith(".xls")
    ) {
      const workbook = xlsx.read(await recipientFile.arrayBuffer(), {
        type: "buffer",
      });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      recipients = xlsx.utils.sheet_to_json(worksheet) as {
        email: string;
        name: string;
      }[];
    } else if (recipientFile.name.endsWith(".txt")) {
      const text = await recipientFile.text();
      const result: ParseResult<string[]> = parse(text, {
        header: false,
        skipEmptyLines: true,
      });
      recipients = result.data.map((row: string[]) => ({
        email: row[0] || "",
        name: row[1] || "",
      }));
    } else {
      console.error("Unsupported file format:", recipientFile.name);
      return NextResponse.json(
        { success: false, message: "Unsupported file format" },
        { status: 400 }
      );
    }

    console.log("Parsed recipients:", recipients);
    console.log("Total recipients:", recipients.length);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    try {
      console.log("Verifying SMTP transporter...");
      await transporter.verify();
      console.log("SMTP transporter verified successfully.");
    } catch (error) {
      console.error("SMTP transporter verification failed:", error);
      return NextResponse.json(
        { success: false, message: "SMTP transporter verification failed" },
        { status: 500 }
      );
    }

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
          from: emailFrom,
          to: email,
          subject: emailSubject,
          html: personalizedContent,
        });

        successCount++;
        console.log(`Email successfully sent to: ${email}`);

        // if (delaySeconds > 0) {
        //   console.log(
        //     `Delaying for ${delaySeconds} seconds before next email...`
        //   );
        //   await delay(delaySeconds * 1000);
        // }
      } catch (error) {
        failCount++;
        console.error(`Failed to send email to ${email}:`, error);
      }
    }

    console.log(
      `Bulk email sending completed. Success: ${successCount}, Failures: ${failCount}`
    );

    return NextResponse.json({
      success: true,
      message: `Bulk email sending completed. ${successCount} emails sent successfully, ${failCount} failed.`,
    });
  } catch (error) {
    console.error("Error in bulk email sending process:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during bulk email sending",
      },
      { status: 500 }
    );
  }
}
