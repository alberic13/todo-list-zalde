import { test, expect } from '@playwright/test';

test.describe('Zalde Todo E2E User Flow', () => {
  test('User login and task management flow', async ({ page }) => {
    // 1. Open home page
    await page.goto('/');

    // Check if already authenticated or at auth page
    const isDashboardVisible = await page.locator('text=Belum Mulai').isVisible().catch(() => false);

    if (!isDashboardVisible) {
      // 2. Click start button on hero if form is not visible yet
      const emailInput = page.locator('input#email');
      if (!await emailInput.isVisible()) {
        const startBtn = page.locator('button:has(svg.lucide-arrow-right)');
        if (await startBtn.isVisible()) {
          await startBtn.click();
        }
      }

      // 3. Fill login credentials
      await emailInput.waitFor({ state: 'visible', timeout: 5000 });
      await emailInput.fill('demo@zalde.com');
      await page.fill('input#password', 'Password123!');

      // 4. Submit login form
      await page.click('button[type="submit"]');
    }

    // 5. Verify dashboard loaded successfully
    await expect(page.locator('text=Belum Mulai')).toBeVisible({ timeout: 15000 });

    // 6. Click add task button
    const addTaskBtn = page.locator('button:has-text("Tambah Tugas"), button:has-text("Tugas Baru"), button[title*="Tambah di Belum Mulai"]').first();
    await addTaskBtn.waitFor({ state: 'visible', timeout: 5000 });
    await addTaskBtn.click();

    // 7. Fill task title in modal
    const titleInput = page.locator('input[placeholder*="Misal:"]');
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    const uniqueTaskTitle = `Tugas E2E ${Date.now()}`;
    await titleInput.fill(uniqueTaskTitle);

    // 8. Submit create task
    await page.click('button[type="submit"]:has-text("Buat Tugas")');

    // 9. Verify task appears on Kanban board
    await expect(page.locator(`text=${uniqueTaskTitle}`)).toBeVisible({ timeout: 10000 });
  });
});
