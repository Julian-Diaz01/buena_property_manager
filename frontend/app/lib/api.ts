
type HealthResponse = {
    ok: boolean;
  };
  
  export async function getHealthStatus(): Promise<"online" | "offline"> {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
  
    try {
      const response = await fetch(`${backendUrl}/api/health`, { cache: "no-store" });
      if (!response.ok) {
        return "offline";
      }
  
      const data = (await response.json()) as HealthResponse;
      return data.ok ? "online" : "offline";
    } catch {
      return "offline";
    }
  }