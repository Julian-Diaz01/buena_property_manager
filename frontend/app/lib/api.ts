
export type ApiState<TData> = {
  data: TData | null;
  isLoading: boolean;
  error: string | null;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export function createInitialApiState<TData>(): ApiState<TData> {
  return {
    data: null,
    isLoading: true,
    error: null,
  };
}

export async function fetchApi<TData>(
  path: string,
  options?: RequestInit,
): Promise<ApiState<TData>> {
  try {
    const response = await fetch(`${backendUrl}${path}`, options);
    if (!response.ok) {
      return {
        data: null,
        isLoading: false,
        error: `Request failed with status ${response.status}.`,
      };
    }

    const data = (await response.json()) as TData;
    return {
      data,
      isLoading: false,
      error: null,
    };
  } catch {
    return {
      data: null,
      isLoading: false,
      error: "We couldn't reach the API. Check your backend connection.",
    };
  }
}