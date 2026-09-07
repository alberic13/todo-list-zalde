import { test, expect } from '@playwright/test';

test.describe('Zalde Todo E2E User Flow', () => {
  test('User login and task management flow', async ({ page }) => {
    const mockTasks: any[] = [];

    // 1. Mock Login
    await page.route(/\/api\/auth\/login/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Login berhasil',
          data: {
            token: 'mock-e2e-jwt-token',
            user: { id: 'mock-user-1', name: 'Demo User', email: 'demo@zalde.com' },
          },
          errors: null,
        }),
      });
    });

    // 2. Mock /api/auth/me
    await page.route(/\/api\/auth\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Profile retrieved',
          data: { id: 'mock-user-1', name: 'Demo User', email: 'demo@zalde.com' },
          errors: null,
        }),
      });
    });

    // 3. Mock /api/tasks and /api/tasks/stats
    await page.route(/\/api\/tasks/, async (route) => {
      const url = route.request().url();

      if (url.includes('/api/tasks/stats')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Stats retrieved',
            data: { total: mockTasks.length, completed: 0, inProgress: 0, pending: mockTasks.length },
            errors: null,
          }),
        });
        return;
      }

      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newTask = {
          id: `task-${Date.now()}`,
          userId: 'mock-user-1',
          title: body.title,
          description: body.description || null,
          status: body.status || 'todo',
          priority: body.priority || 'medium',
          dueDate: body.dueDate || null,
          orderIndex: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subtasks: [],
          category: null,
        };
        mockTasks.push(newTask);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Task created', data: newTask, errors: null }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Tasks retrieved', data: mockTasks, errors: null }),
        });
      }
    });

    // 4. Mock /api/categories
    await page.route(/\/api\/categories/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Categories retrieved', data: [], errors: null }),
      });
    });

    // 1. Open home page
    await page.goto('/');

    // 2. Open auth form if on hero
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

    // 5. Verify dashboard loaded successfully
    await expect(page.locator('text=Belum Mulai')).toBeVisible({ timeout: 10000 });

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
