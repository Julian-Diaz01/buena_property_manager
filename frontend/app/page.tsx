import { getHealthStatus } from "./lib/api";

export default async function Home() {
  const healthStatus = await getHealthStatus();

  return (
    <main className="mx-auto min-h-screen max-w-4xl p-8">
      <h1 className="text-3xl font-bold">Bueno Property Manager</h1>
      <p className="mt-2 text-gray-600">
        Next.js + Tailwind frontend connected to an Express API backend.
      </p>
      <p className="mt-2 text-sm text-gray-700">
        API health:{" "}
        <span className={healthStatus === "online" ? "font-semibold text-green-700" : "font-semibold text-red-700"}>
          {healthStatus}
        </span>
      </p>
    </main>
  );
}
