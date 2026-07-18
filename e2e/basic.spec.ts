import { test, expect } from "@playwright/test"

test.describe("Landing Page", () => {
  test("loads and shows hero section", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.getByText("The Serene Lens")).toBeVisible()
  })

  test("has pricing link", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("link", { name: /precios|pricing/i })).toBeVisible()
  })
})

test.describe("Registration Flow", () => {
  test("shows registration form", async ({ page }) => {
    await page.goto("/login")
    await page.getByText("Regístrate gratis").click()
    await expect(page.getByLabel("Nombre")).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Contraseña")).toBeVisible()
  })

  test("shows esthetician code field in register mode", async ({ page }) => {
    await page.goto("/login")
    await page.getByText("Regístrate gratis").click()
    await expect(page.getByText("Código de Esteticista")).toBeVisible()
  })
})

test.describe("Analysis Flow", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/analysis")
    await expect(page).toHaveURL(/\/login/)
  })
})
