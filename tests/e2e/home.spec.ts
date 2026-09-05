import { expect, test } from "@playwright/test";

test("loads the public application shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Rifas Online" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Panel/ })).toBeVisible();
});

test("serves the health endpoint", async ({ request }) => {
  const response = await request.get("/api/health");
  const body = (await response.json()) as { status: string; service: string };

  expect(response.ok()).toBe(true);
  expect(body).toMatchObject({ service: "rifas-online", status: "ok" });
});
