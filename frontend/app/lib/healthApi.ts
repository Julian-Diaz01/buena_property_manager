import { fetchApi } from "./api";

type HealthResponse = {
  ok: boolean;
};

export type ApiHealthState = {
  status: "online" | "offline";
  message: string;
};

const healthApiPath = "/api/health";

export async function getApiHealthState(): Promise<ApiHealthState> {
  const healthResult = await fetchApi<HealthResponse>(healthApiPath, { cache: "no-store" });

  if (healthResult.error) {
    return {
      status: "offline",
      message: "The API is currently unavailable. Please try again shortly.",
    };
  }

  if (!healthResult.data?.ok) {
    return {
      status: "offline",
      message: "The API is not healthy.",
    };
  }

  return {
    status: "online",
    message: "The API is online.",
  };
}

export async function getHealthStatus(): Promise<"online" | "offline"> {
  const state = await getApiHealthState();
  return state.status;
}
