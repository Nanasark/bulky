import BulkEmailSender from "@/components/BulkEmailSender";

export default function Home() {
  return (
    <main className="text-blue-600 bg-white container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bulk Email Sender</h1>
      <BulkEmailSender />
    </main>
  );
}
