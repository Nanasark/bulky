"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  PaperAirplaneIcon,
  DocumentTextIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});
import "react-quill-new/dist/quill.snow.css";

export default function BulkEmailSender() {
  const [htmlTemplate, setHtmlTemplate] = useState("");
  const [recipientFile, setRecipientFile] = useState<File | null>(null);
  const [smtpSettings, setSmtpSettings] = useState({
    host: "",
    port: "",
    user: "",
    pass: "",
    from: "",
    subject: "",
    delaySeconds: "5",
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSmtpSettings({ ...smtpSettings, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setRecipientFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientFile || !htmlTemplate) {
      alert("Please provide both recipient file and HTML template.");
      return;
    }

    setSending(true);
    setResult(null);

    const formData = new FormData();
    formData.append("recipientFile", recipientFile);
    formData.append("htmlTemplate", htmlTemplate);
    Object.entries(smtpSettings).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await fetch("/api/send-bulk-emails", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data.message);
    } catch (error) {
      setResult("An error occurred while sending emails.");
      console.log(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="htmlTemplate"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          HTML Template Editor
        </label>
        <ReactQuill
          value={htmlTemplate}
          onChange={setHtmlTemplate}
          modules={{
            toolbar: [
              [{ header: [1, 2, false] }],
              ["bold", "italic", "underline", "strike", "blockquote"],
              [
                { list: "ordered" },
                { list: "bullet" },
                { indent: "-1" },
                { indent: "+1" },
              ],
              ["link", "image"],
              ["clean"],
            ],
          }}
          className="h-64 mb-4"
        />
      </div>
      <div>
        <label
          htmlFor="recipientFile"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Recipient File (Excel or .txt)
        </label>
        <div className="flex items-center">
          <input
            type="file"
            id="recipientFile"
            accept=".xlsx,.xls,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="recipientFile"
            className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <TableCellsIcon className="h-5 w-5 inline-block mr-2" />
            Choose File
          </label>
          <span className="ml-3 text-sm text-gray-500">
            {recipientFile ? recipientFile.name : "No file chosen"}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="host"
            className="block text-sm font-medium text-gray-700"
          >
            SMTP Host
          </label>
          <input
            type="text"
            id="host"
            name="host"
            value={smtpSettings.host}
            onChange={handleSmtpChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="port"
            className="block text-sm font-medium text-gray-700"
          >
            SMTP Port
          </label>
          <input
            type="number"
            id="port"
            name="port"
            value={smtpSettings.port}
            onChange={handleSmtpChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="user"
            className="block text-sm font-medium text-gray-700"
          >
            SMTP Username
          </label>
          <input
            type="text"
            id="user"
            name="user"
            value={smtpSettings.user}
            onChange={handleSmtpChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="pass"
            className="block text-sm font-medium text-gray-700"
          >
            SMTP Password
          </label>
          <input
            type="password"
            id="pass"
            name="pass"
            value={smtpSettings.pass}
            onChange={handleSmtpChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="from"
            className="block text-sm font-medium text-gray-700"
          >
            Email From
          </label>
          <input
            type="email"
            id="from"
            name="from"
            value={smtpSettings.from}
            onChange={handleSmtpChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700"
          >
            Email Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={smtpSettings.subject}
            onChange={handleSmtpChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="delaySeconds"
            className="block text-sm font-medium text-gray-700"
          >
            Delay between emails (seconds)
          </label>
          <input
            type="number"
            id="delaySeconds"
            name="delaySeconds"
            value={smtpSettings.delaySeconds}
            onChange={handleSmtpChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            min="5"
            max="30"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={sending}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {sending ? (
          <>
            <DocumentTextIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
            Sending...
          </>
        ) : (
          <>
            <PaperAirplaneIcon className="-ml-1 mr-3 h-5 w-5 text-white" />
            Send Bulk Emails
          </>
        )}
      </button>
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <p className="text-sm text-gray-700">{result}</p>
        </div>
      )}
    </form>
  );
}
