/**
 * Advanced Testing Features for UPDATE Function (isaac-tan.js)
 * 
 * This file includes:
 * - Accessibility (a11y) Testing with axe-core
 * - Visual Regression Testing with Playwright screenshots
 * - API Contract/Schema Validation with Zod
 * - Performance Testing (page load times, API response times)
 * 
 * These tests demonstrate professional-grade testing practices.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://localhost:5050';
const TASKS_FILE = path.join(__dirname, '..', 'utils', 'tasks.json');

// Force serial execution since all tests share the same tasks.json file
test.describe.configure({ mode: 'serial' });

// Mock task for testing
const mockTask = {
    id: 'advanced-test-task',
    title: 'Advanced Test Task',
    description: 'Task for advanced testing features',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '2026-01-15',
    imageUrl: null
};

// Setup: Create mock task before tests
test.beforeAll(async () => {
    await fs.writeFile(TASKS_FILE, JSON.stringify([mockTask], null, 2), 'utf-8');
});

// Cleanup: Restore empty state after tests
test.afterAll(async () => {
    await fs.writeFile(TASKS_FILE, '[]', 'utf-8');
});

// ============================================
// ACCESSIBILITY (A11Y) TESTING
// Uses axe-core to check WCAG 2.1 compliance
// ============================================
test.describe('Accessibility (a11y) Tests', () => {

    test('main page should be scanned for accessibility violations', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForSelector('.task-card');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        // Log violations for debugging and documentation
        console.log(`Found ${accessibilityScanResults.violations.length} accessibility violations`);
        if (accessibilityScanResults.violations.length > 0) {
            console.log('Accessibility violations:', JSON.stringify(accessibilityScanResults.violations, null, 2));
        }

        // Document known issues (color-contrast is a known issue in the original design)
        // Filter out known issues for the pass/fail check
        const criticalViolations = accessibilityScanResults.violations.filter(
            v => v.impact === 'critical' && v.id !== 'color-contrast'
        );

        // Test passes if no critical violations (excluding known color-contrast issue)
        expect(criticalViolations).toEqual([]);
    });

    test('edit modal should be scanned for accessibility violations', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForSelector('.task-card');

        // Open edit modal
        await page.click(`button.btn-edit[data-id="${mockTask.id}"]`);
        await page.waitForSelector('#updateTaskModal.show');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .include('#updateTaskModal')
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        console.log(`Modal: Found ${accessibilityScanResults.violations.length} accessibility violations`);
        if (accessibilityScanResults.violations.length > 0) {
            console.log('Modal accessibility violations:', JSON.stringify(accessibilityScanResults.violations, null, 2));
        }

        // Filter critical violations
        const criticalViolations = accessibilityScanResults.violations.filter(
            v => v.impact === 'critical'
        );

        expect(criticalViolations).toEqual([]);
    });

    test('form inputs should have associated labels', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForSelector('.task-card');

        await page.click(`button.btn-edit[data-id="${mockTask.id}"]`);
        await page.waitForSelector('#updateTaskModal.show');

        // Check that form inputs have labels
        const titleLabel = await page.locator('label[for="updateTaskTitle"]').count();
        const descLabel = await page.locator('label[for="updateTaskDescription"]').count();
        const statusLabel = await page.locator('label[for="updateTaskStatus"]').count();
        const priorityLabel = await page.locator('label[for="updateTaskPriority"]').count();
        const dueDateLabel = await page.locator('label[for="updateTaskDueDate"]').count();

        expect(titleLabel).toBeGreaterThan(0);
        expect(descLabel).toBeGreaterThan(0);
        expect(statusLabel).toBeGreaterThan(0);
        expect(priorityLabel).toBeGreaterThan(0);
        expect(dueDateLabel).toBeGreaterThan(0);
    });

    test('modal should be keyboard navigable', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForSelector('.task-card');

        await page.click(`button.btn-edit[data-id="${mockTask.id}"]`);
        await page.waitForSelector('#updateTaskModal.show');

        // Tab through form elements
        await page.keyboard.press('Tab');
        const activeElement1 = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
        
        await page.keyboard.press('Tab');
        const activeElement2 = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);

        // Verify focus moves through form
        expect(activeElement1).toBeTruthy();
        expect(activeElement2).toBeTruthy();
        expect(activeElement1).not.toBe(activeElement2);
    });

    test('escape key should close modal (keyboard accessibility)', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForSelector('.task-card');

        await page.click(`button.btn-edit[data-id="${mockTask.id}"]`);
        await page.waitForSelector('#updateTaskModal.show');

        await page.keyboard.press('Escape');

        await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);
    });
});

// ============================================
// VISUAL REGRESSION TESTING
// Uses Playwright's built-in screenshot comparison
// Each browser has its own baseline snapshots
// ============================================
test.describe('Visual Regression Tests', () => {

    test('task list should match baseline screenshot', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForSelector('.task-card');

        // Wait for any animations to complete
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot('task-list.png', {
            maxDiffPixels: 100,
            threshold: 0.2
        });
    });

    test('edit modal should match baseline screenshot', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForSelector('.task-card');

        await page.click(`button.btn-edit[data-id="${mockTask.id}"]`);
        await page.waitForSelector('#updateTaskModal.show');

        // Wait for modal animation
        await page.waitForTimeout(300);

        await expect(page.locator('#updateTaskModal')).toHaveScreenshot('edit-modal.png', {
            maxDiffPixels: 100,
            threshold: 0.2
        });
    });

    test('task card should match baseline screenshot', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForSelector('.task-card');

        await expect(page.locator('.task-card').first()).toHaveScreenshot('task-card.png', {
            maxDiffPixels: 50,
            threshold: 0.2
        });
    });

    test('edit button hover state should be visually distinct', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForSelector('.task-card');

        const editButton = page.locator(`button.btn-edit[data-id="${mockTask.id}"]`);
        
        // Screenshot before hover
        await expect(editButton).toHaveScreenshot('edit-button-normal.png', {
            maxDiffPixels: 20
        });

        // Hover and screenshot
        await editButton.hover();
        await page.waitForTimeout(200);

        await expect(editButton).toHaveScreenshot('edit-button-hover.png', {
            maxDiffPixels: 20
        });
    });
});

// ============================================
// API CONTRACT/SCHEMA VALIDATION
// Uses Zod to validate API response structure
// ============================================
test.describe('API Schema Validation Tests', () => {

    // Define the expected Task schema
    const TaskSchema = z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        status: z.enum(['To Do', 'In Progress', 'Completed']),
        priority: z.enum(['Low', 'Medium', 'High']),
        dueDate: z.string(),
        imageUrl: z.string().nullable()
    });

    const TaskArraySchema = z.array(TaskSchema);

    // Define the Update Response schema
    const UpdateResponseSchema = z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable().optional(),
        status: z.string(),
        priority: z.string(),
        dueDate: z.string(),
        imageUrl: z.string().nullable().optional()
    });

    // Define Error Response schema
    const ErrorResponseSchema = z.object({
        message: z.string()
    });

    test('GET /view-tasks should return valid task array schema', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/view-tasks`);
        expect(response.status()).toBe(200);

        const data = await response.json();
        const parseResult = TaskArraySchema.safeParse(data);

        if (!parseResult.success) {
            console.log('Schema validation errors:', parseResult.error.format());
        }

        expect(parseResult.success).toBe(true);
    });

    test('PUT /update-task should return valid updated task schema', async ({ request }) => {
        const response = await request.put(`${BASE_URL}/update-task/${mockTask.id}`, {
            data: { title: 'Schema Validated Title' }
        });
        expect(response.status()).toBe(200);

        const data = await response.json();
        const parseResult = UpdateResponseSchema.safeParse(data);

        if (!parseResult.success) {
            console.log('Update response schema errors:', parseResult.error.format());
        }

        expect(parseResult.success).toBe(true);
    });

    test('PUT /update-task with invalid ID should return error schema', async ({ request }) => {
        const response = await request.put(`${BASE_URL}/update-task/non-existent-id`, {
            data: { title: 'Test' }
        });
        expect(response.status()).toBe(404);

        const data = await response.json();
        const parseResult = ErrorResponseSchema.safeParse(data);

        if (!parseResult.success) {
            console.log('Error response schema errors:', parseResult.error.format());
        }

        expect(parseResult.success).toBe(true);
    });

    test('task response should contain all required fields', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/view-tasks`);
        const data = await response.json();

        if (data.length > 0) {
            const task = data[0];
            
            // Verify all required fields exist
            expect(task).toHaveProperty('id');
            expect(task).toHaveProperty('title');
            expect(task).toHaveProperty('status');
            expect(task).toHaveProperty('priority');
            expect(task).toHaveProperty('dueDate');
            
            // Verify field types
            expect(typeof task.id).toBe('string');
            expect(typeof task.title).toBe('string');
            expect(typeof task.status).toBe('string');
            expect(typeof task.priority).toBe('string');
            expect(typeof task.dueDate).toBe('string');
        }
    });

    test('status field should only contain valid enum values', async ({ request }) => {
        const validStatuses = ['To Do', 'In Progress', 'Completed'];
        
        const response = await request.get(`${BASE_URL}/view-tasks`);
        const data = await response.json();

        for (const task of data) {
            expect(validStatuses).toContain(task.status);
        }
    });

    test('priority field should only contain valid enum values', async ({ request }) => {
        const validPriorities = ['Low', 'Medium', 'High'];
        
        const response = await request.get(`${BASE_URL}/view-tasks`);
        const data = await response.json();

        for (const task of data) {
            expect(validPriorities).toContain(task.priority);
        }
    });
});

// ============================================
// PERFORMANCE TESTING
// Measures page load times and API response times
// ============================================
test.describe('Performance Tests', () => {

    // Performance thresholds (in milliseconds)
    const THRESHOLDS = {
        pageLoad: 3000,          // Page should load in under 3 seconds
        apiResponse: 500,         // API should respond in under 500ms
        modalOpen: 1000,          // Modal should open in under 1 second
        domContentLoaded: 2000    // DOM should be ready in under 2 seconds
    };

    test('page should load within acceptable time', async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto(BASE_URL);
        await page.waitForSelector('.task-card');
        
        const loadTime = Date.now() - startTime;
        
        console.log(`Page load time: ${loadTime}ms (threshold: ${THRESHOLDS.pageLoad}ms)`);
        
        expect(loadTime).toBeLessThan(THRESHOLDS.pageLoad);
    });

    test('GET /view-tasks API should respond within acceptable time', async ({ request }) => {
        const startTime = Date.now();
        
        const response = await request.get(`${BASE_URL}/view-tasks`);
        
        const responseTime = Date.now() - startTime;
        
        console.log(`GET /view-tasks response time: ${responseTime}ms (threshold: ${THRESHOLDS.apiResponse}ms)`);
        
        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(THRESHOLDS.apiResponse);
    });

    test('PUT /update-task API should respond within acceptable time', async ({ request }) => {
        const startTime = Date.now();
        
        const response = await request.put(`${BASE_URL}/update-task/${mockTask.id}`, {
            data: { title: 'Performance Test Title' }
        });
        
        const responseTime = Date.now() - startTime;
        
        console.log(`PUT /update-task response time: ${responseTime}ms (threshold: ${THRESHOLDS.apiResponse}ms)`);
        
        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(THRESHOLDS.apiResponse);
    });

    test('edit modal should open within acceptable time', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForSelector('.task-card');

        const startTime = Date.now();
        
        await page.click(`button.btn-edit[data-id="${mockTask.id}"]`);
        await page.waitForSelector('#updateTaskModal.show');
        
        const openTime = Date.now() - startTime;
        
        console.log(`Modal open time: ${openTime}ms (threshold: ${THRESHOLDS.modalOpen}ms)`);
        
        expect(openTime).toBeLessThan(THRESHOLDS.modalOpen);
    });

    test('DOMContentLoaded should fire within acceptable time', async ({ page }) => {
        const metrics = await page.goto(BASE_URL).then(() => page.evaluate(() => {
            const timing = performance.timing;
            return {
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart
            };
        }));

        console.log(`DOMContentLoaded: ${metrics.domContentLoaded}ms`);
        console.log(`Load Complete: ${metrics.loadComplete}ms`);

        expect(metrics.domContentLoaded).toBeLessThan(THRESHOLDS.domContentLoaded);
    });

    test('multiple sequential updates should maintain performance', async ({ request }) => {
        const updateTimes: number[] = [];

        for (let i = 0; i < 5; i++) {
            const startTime = Date.now();
            
            await request.put(`${BASE_URL}/update-task/${mockTask.id}`, {
                data: { title: `Performance Test ${i}` }
            });
            
            updateTimes.push(Date.now() - startTime);
        }

        const averageTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
        const maxTime = Math.max(...updateTimes);

        console.log(`Average update time: ${averageTime.toFixed(2)}ms`);
        console.log(`Max update time: ${maxTime}ms`);
        console.log(`All update times: ${updateTimes.join(', ')}ms`);

        expect(averageTime).toBeLessThan(THRESHOLDS.apiResponse);
        expect(maxTime).toBeLessThan(THRESHOLDS.apiResponse * 2); // Allow 2x threshold for max
    });

    test('page should not have memory leaks after modal operations', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForSelector('.task-card');

        // Get initial memory usage
        const initialMemory = await page.evaluate(() => {
            if ((performance as any).memory) {
                return (performance as any).memory.usedJSHeapSize;
            }
            return 0;
        });

        // Perform multiple modal open/close operations
        for (let i = 0; i < 5; i++) {
            await page.click(`button.btn-edit[data-id="${mockTask.id}"]`);
            await page.waitForSelector('#updateTaskModal.show');
            await page.keyboard.press('Escape');
            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);
        }

        // Get final memory usage
        const finalMemory = await page.evaluate(() => {
            if ((performance as any).memory) {
                return (performance as any).memory.usedJSHeapSize;
            }
            return 0;
        });

        if (initialMemory > 0 && finalMemory > 0) {
            const memoryIncrease = finalMemory - initialMemory;
            const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
            
            console.log(`Memory increase after 5 modal operations: ${memoryIncreaseMB.toFixed(2)}MB`);
            
            // Allow up to 10MB increase
            expect(memoryIncreaseMB).toBeLessThan(10);
        }
    });
});
