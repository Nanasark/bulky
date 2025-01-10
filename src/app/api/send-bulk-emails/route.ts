
import { NextResponse } from "next/server";
import xlsx from "xlsx";
import { parse, ParseResult } from "papaparse";
import { emailQueue } from "../../../lib/queue";


export async function POST(req: Request) {
  try {
    console.log("Starting bulk email sending process...");

    const formData = await req.formData();
    const recipientFile = formData.get("recipientFile") as File;
    const htmlTemplate = formData.get("htmlTemplate") as string;
    const smtpSettings = {
      host: formData.get("host") as string,
      port: parseInt(formData.get("port") as string),
      user: formData.get("user") as string,
      pass: formData.get("pass") as string,
      from: formData.get("from") as string,
      subject: formData.get("subject") as string,
    };
    const delaySeconds = parseInt(formData.get("delaySeconds") as string);

    console.log("Form data overview:", {
      recipientFile: recipientFile?.name,
      htmlTemplate: !!htmlTemplate ? "Received" : "Not Received",
      smtpSettings,
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

    // Add jobs to the queue
    const batchSize = 50; // Adjust this value based on your needs
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      await emailQueue.add("send-emails", {
        recipients: batch,
        htmlTemplate,
        smtpSettings,
        delaySeconds,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Bulk email sending process started. ${recipients.length} emails queued for sending.`,
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
