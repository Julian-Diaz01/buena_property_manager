// This script is used to smoke test the API.
// This needs to be refactored/deleted once the API is fully implemented.
// And API tests should be written instead.
// This is not prod ready code. Its an MVP fast test code.
type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

const baseUrl = process.env.API_BASE_URL ?? "http://localhost:4000/api";

const request = async <T>(path: string, method: HttpMethod, body?: unknown): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json()) as { data?: T; message?: string };
  if (!response.ok) {
    throw new Error(`${method} ${path} failed (${response.status}): ${payload.message ?? "Unknown error"}`);
  }

  if (!payload.data) {
    throw new Error(`${method} ${path} returned no data payload`);
  }

  return payload.data;
};

const expectConflict = async (path: string) => {
  const response = await fetch(`${baseUrl}${path}`, { method: "DELETE" });
  if (response.status !== 409) {
    throw new Error(`Expected 409 for DELETE ${path}, got ${response.status}`);
  }
};

const run = async () => {
  console.log(`Running smoke test against ${baseUrl}`);

  const manager = await request<{ id: string }>("/managers", "POST", { fullName: "Smoke Manager" });
  const accountant = await request<{ id: string }>("/accountants", "POST", { fullName: "Smoke Accountant" });

  const property = await request<{ id: string }>(
    "/properties",
    "POST",
    { name: "Smoke Property", type: "WEG", managerId: manager.id, accountantId: accountant.id },
  );

  const building = await request<{ id: string }>(
    "/buildings",
    "POST",
    { propertyId: property.id, street: "Smoke Street", houseNumber: "1" },
  );

  const unit = await request<{ id: string }>(
    "/units",
    "POST",
    { buildingId: building.id, number: "A1", type: "APARTMENT", rooms: 2 },
  );

  await expectConflict(`/buildings/${building.id}`);
  await expectConflict(`/properties/${property.id}`);

  await request(`/units/${unit.id}`, "DELETE");
  await request(`/buildings/${building.id}`, "DELETE");
  await request(`/properties/${property.id}`, "DELETE");
  await request(`/managers/${manager.id}`, "DELETE");
  await request(`/accountants/${accountant.id}`, "DELETE");

  console.log("Smoke test passed.");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
