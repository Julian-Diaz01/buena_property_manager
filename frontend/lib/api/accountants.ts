import { apiRequest } from "./client";
import type { Accountant } from "./types";

export async function listAccountants(): Promise<Accountant[]> {
  return apiRequest<Accountant[]>("/api/accountants");
}

export async function createAccountant(body: { fullName: string }): Promise<Accountant> {
  return apiRequest<Accountant>("/api/accountants", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
