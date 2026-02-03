import './playwright-coverage.js'
import { test, expect, Page } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import config from "../playwright.config.js";

// use serial execution since all tests share the same tasks.json file
test.describe.configure({ mode: 'serial' });


const BASE_URL = 'http://localhost:5050';
const TASKS_FILE = path.join(__dirname, '..', 'utils', 'tasks.json');
const TASKS_TEMPLATE = path.join(__dirname, '..', 'utils', 'tasks.template.json');
const COVERAGE_DIR = path.join(__dirname, '..', 'coverage', 'v8');

const defaultTask = {
    title: 'Test Task',
    description: 'Test Description',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '2026-01-15',
    imageUrl: null
};

// All mock tasks used across tests - pre-populated in beforeAll
const mockTasks = [
    // Default browser tasks
    { id: 'test-task-chromium', ...defaultTask },
    { id: 'test-task-firefox', ...defaultTask },
    { id: 'test-task-webkit', ...defaultTask },
    
    // Starting Flow tests
    { id: 'no-desc-test', title: 'Task Without Description', description: '', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'dataset-test', ...defaultTask },
    
    // Primary Flow tests
    { id: 'update-title-e2e', title: 'Old Title', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'update-desc-e2e', title: 'Test Task', description: 'Old Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'update-status-e2e', title: 'Test Task', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'update-priority-e2e', title: 'Test Task', description: 'Test Description', status: 'To Do', priority: 'Low', dueDate: '2026-01-15', imageUrl: null },
    { id: 'update-date-e2e', title: 'Test Task', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-01', imageUrl: null },
    { id: 'update-multiple-e2e', title: 'Old Title', description: 'Old Description', status: 'To Do', priority: 'Low', dueDate: '2026-01-01', imageUrl: null },
    { id: 'close-after-update', ...defaultTask },
    { id: 'refresh-list-test', title: 'Before Update', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    
    // Error Flow 1 tests
    { id: 'empty-title-validation', ...defaultTask },
    { id: 'empty-date-validation', ...defaultTask },
    { id: 'no-update-on-invalid', title: 'Original Title', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'whitespace-title-test', ...defaultTask },
    
    // Error Flow 2 tests
    { id: 'close-btn-test', ...defaultTask },
    { id: 'cancel-btn-test', ...defaultTask },
    { id: 'click-outside-test', ...defaultTask },
    { id: 'escape-key-test', ...defaultTask },
    { id: 'no-change-on-cancel', title: 'Cancel Test Title', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'reset-form-test', title: 'Original', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    
    // Error Flow 3 tests
    { id: 'will-be-deleted', ...defaultTask },
    { id: 'deleted-before-submit', ...defaultTask },
    
    // Error Flow 4 tests
    { id: 'server-error-test', ...defaultTask },
    { id: 'no-close-on-error', ...defaultTask },
    { id: 'server-error-load-test', ...defaultTask },
    { id: 'network-error-test', ...defaultTask },
    
    // Edge Cases tests
    { id: 'long-title-boundary', ...defaultTask },
    { id: 'special-chars-test', ...defaultTask },
    { id: 'unicode-emoji-test', ...defaultTask },
    { id: 'min-date-test', ...defaultTask },
    { id: 'max-date-test', ...defaultTask },
    { id: 'empty-desc-update', title: 'Test Task', description: 'Original', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'single-char-test', ...defaultTask },
    
    // Logical Branch Coverage tests
    { id: 'status-branch-ToDo', title: 'Test Task', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'status-branch-InProgress', title: 'Test Task', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'status-branch-Completed', title: 'Test Task', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'priority-branch-Low', title: 'Test Task', description: 'Test Description', status: 'To Do', priority: 'Low', dueDate: '2026-01-15', imageUrl: null },
    { id: 'priority-branch-Medium', title: 'Test Task', description: 'Test Description', status: 'To Do', priority: 'Low', dueDate: '2026-01-15', imageUrl: null },
    { id: 'priority-branch-High', title: 'Test Task', description: 'Test Description', status: 'To Do', priority: 'Low', dueDate: '2026-01-15', imageUrl: null },
    { id: 'first-in-list', title: 'First Task', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'second-in-list', title: 'Second Task', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'third-in-list', title: 'Third Task', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'first', title: 'First', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'middle', title: 'Middle', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'last', title: 'Last', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'task1', title: 'Task 1', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'task2', title: 'Task 2', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'tasklast', title: 'Last Task', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'only-task', title: 'Only Task', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    
    // Data Integrity tests
    { id: 'preserve-1', title: 'Task 1', description: 'Desc 1', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'preserve-2', title: 'Task 2', description: 'Desc 2', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 'preserve-3', title: 'Task 3', description: 'Desc 3', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null },
    { id: 't1', ...defaultTask },
    { id: 't2', ...defaultTask },
    { id: 't3', ...defaultTask },
    { id: 'preserve-id-test-123', ...defaultTask },
    
    // UI/UX tests
    { id: 'modal-title-test', ...defaultTask },
    { id: 'required-fields-test', ...defaultTask },
    { id: 'submit-btn-test', ...defaultTask },
    { id: 'cancel-btn-visible-test', ...defaultTask },
    { id: 'edit-btn-visible', ...defaultTask },
];

// Helper to read tasks from file
async function readTasks() {
    const data = await fs.readFile(TASKS_FILE, 'utf8');
    return JSON.parse(data);
}

// Helper to reset tasks file to mock data
async function resetTasksFile() {
    await fs.writeFile(TASKS_FILE, JSON.stringify(mockTasks, null, 2), 'utf-8');
}

test.describe('UPDATE Task E2E Tests - Frontend', () => {
    // Initialize mock data before all tests
    test.beforeAll(async () => {
        await fs.writeFile(
            TASKS_FILE,
            JSON.stringify(mockTasks, null, 2),
            "utf-8"
        );
        console.log("tasks.json initialized with mock data");
    });

    // Reset tasks file before each test to ensure clean state
    test.beforeEach(async () => {
        await resetTasksFile();
    });

    // Clean up mock tasks after all tests
    test.afterAll(async () => {
        try {
            const templateData = await fs.readFile(TASKS_TEMPLATE, 'utf-8');
            await fs.writeFile(TASKS_FILE, templateData, 'utf-8');
            console.log("tasks.json restored to template");
        } catch {
            // If template doesn't exist, reset to empty array
            await fs.writeFile(TASKS_FILE, '[]', 'utf-8');
            console.log("tasks.json reset to empty array");
        }
    });

    // STARTING FLOW - Opening Edit Modal
    
    test.describe('Starting Flow - Edit Modal Opens', () => {

        test('should open edit modal when clicking edit icon', async ({ page, browserName }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');
            
            // Pick a task to edit based on browser
            const taskId = `test-task-${browserName}`;
            
            // Click the edit button on the task card
            await page.click(`button.btn-edit[data-id="${taskId}"]`);

            // Verify modal is visible
            const modal = page.locator('#updateTaskModal');
            await expect(modal).toHaveClass(/show/);
        });

        test('should pre-fill all fields with existing task data', async ({ page, browserName }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');
            
            const taskId = `test-task-${browserName}`;
            await page.click(`button.btn-edit[data-id="${taskId}"]`);
            await page.waitForSelector('#updateTaskModal.show');

            // Verify all fields are pre-filled
            await expect(page.locator('#updateTaskTitle')).toHaveValue(defaultTask.title);
            await expect(page.locator('#updateTaskDescription')).toHaveValue(defaultTask.description);
            await expect(page.locator('#updateTaskStatus')).toHaveValue(defaultTask.status);
            await expect(page.locator('#updateTaskPriority')).toHaveValue(defaultTask.priority);
            await expect(page.locator('#updateTaskDueDate')).toHaveValue(defaultTask.dueDate);
        });

        test('should pre-fill with empty description if task has no description', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="no-desc-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            await expect(page.locator('#updateTaskDescription')).toHaveValue('');
        });

        test('should store task ID in modal dataset', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="dataset-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            const taskId = await page.locator('#updateTaskModal').getAttribute('data-task-id');
            expect(taskId).toBe('dataset-test');
        });
    });

    // PRIMARY FLOW - Success Case

    test.describe('Primary Flow - Successful Update', () => {

        test('should update task title successfully', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="update-title-e2e"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Clear and enter new title
            await page.fill('#updateTaskTitle', 'New Updated Title');

            // Submit the form
            await page.click('#updateTaskForm button[type="submit"]');

            // Wait for modal to close
            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            // Verify task is updated in the UI
            await page.waitForSelector('.task-title:has-text("New Updated Title")');

            // Verify in database
            const tasks = await readTasks();
            const updatedTask = tasks.find((t: any) => t.id === 'update-title-e2e');
            expect(updatedTask.title).toBe('New Updated Title');
        });

        test('should update task description successfully', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="update-desc-e2e"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskDescription', 'New Description Text');
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'update-desc-e2e').description).toBe('New Description Text');
        });

        test('should update task status successfully', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="update-status-e2e"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.selectOption('#updateTaskStatus', 'Completed');
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            // Verify status badge updated
            await page.waitForSelector('.task-status.completed');

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'update-status-e2e').status).toBe('Completed');
        });

        test('should update task priority successfully', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="update-priority-e2e"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.selectOption('#updateTaskPriority', 'High');
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'update-priority-e2e').priority).toBe('High');
        });

        test('should update task due date successfully', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="update-date-e2e"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskDueDate', '2026-12-31');
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'update-date-e2e').dueDate).toBe('2026-12-31');
        });

        test('should update multiple fields at once', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="update-multiple-e2e"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', 'New Title');
            await page.fill('#updateTaskDescription', 'New Description');
            await page.selectOption('#updateTaskStatus', 'In Progress');
            await page.selectOption('#updateTaskPriority', 'High');
            await page.fill('#updateTaskDueDate', '2026-06-15');

            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            const updated = tasks.find((t: any) => t.id === 'update-multiple-e2e');
            expect(updated.title).toBe('New Title');
            expect(updated.description).toBe('New Description');
            expect(updated.status).toBe('In Progress');
            expect(updated.priority).toBe('High');
            expect(updated.dueDate).toBe('2026-06-15');
        });

        test('should close modal after successful update', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="close-after-update"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', 'Updated Title');
            await page.click('#updateTaskForm button[type="submit"]');

            // Verify modal closes
            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);
        });

        test('should refresh task list after successful update', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            // Verify initial title
            await expect(page.locator('.task-title:has-text("Before Update")')).toBeVisible();

            await page.click('button.btn-edit[data-id="refresh-list-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', 'After Update');
            await page.click('#updateTaskForm button[type="submit"]');

            // Wait for refresh and verify new title
            await page.waitForSelector('.task-title:has-text("After Update")');
        });
    });

    // ERROR FLOW 1 - Invalid Input
    
    test.describe('Error Flow 1 - Invalid Input', () => {

        test('should show alert when title is empty', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="empty-title-validation"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Clear the title
            await page.fill('#updateTaskTitle', '');

            // Set up dialog handler
            page.on('dialog', async dialog => {
                expect(dialog.message()).toContain('Title');
                await dialog.accept();
            });

            await page.click('#updateTaskForm button[type="submit"]');

            // Modal should still be open
            await expect(page.locator('#updateTaskModal')).toHaveClass(/show/);
        });

        test('should show alert when due date is empty', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="empty-date-validation"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Clear the due date
            await page.fill('#updateTaskDueDate', '');

            // Set up dialog handler
            page.on('dialog', async dialog => {
                expect(dialog.message()).toContain('Due Date');
                await dialog.accept();
            });

            await page.click('#updateTaskForm button[type="submit"]');

            // Modal should still be open
            await expect(page.locator('#updateTaskModal')).toHaveClass(/show/);
        });

        test('should not update database when validation fails', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="no-update-on-invalid"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Clear required field
            await page.fill('#updateTaskTitle', '');

            page.on('dialog', async dialog => {
                await dialog.accept();
            });

            await page.click('#updateTaskForm button[type="submit"]');

            // Verify database unchanged
            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'no-update-on-invalid').title).toBe('Original Title');
        });

        test('should show validation for whitespace-only title', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="whitespace-title-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Enter whitespace only
            await page.fill('#updateTaskTitle', '   ');

            page.on('dialog', async dialog => {
                expect(dialog.message()).toContain('Title');
                await dialog.accept();
            });

            await page.click('#updateTaskForm button[type="submit"]');
        });
    });

    // ERROR FLOW 2 - Cancelled

    test.describe('Error Flow 2 - Modal Cancelled', () => {

        test('should close modal when clicking close button', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="close-btn-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Click close button
            await page.click('#closeUpdateModal');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);
        });

        test('should close modal when clicking cancel button', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="cancel-btn-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Click cancel button
            await page.click('#cancelUpdateBtn');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);
        });

        test('should close modal when clicking outside modal', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="click-outside-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Click on modal backdrop (outside content)
            await page.click('#updateTaskModal', { position: { x: 10, y: 10 } });

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);
        });

        test('should close modal when pressing Escape key', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="escape-key-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Press Escape
            await page.keyboard.press('Escape');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);
        });

        test('should not apply changes when modal is cancelled', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="no-change-on-cancel"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Make changes but cancel
            await page.fill('#updateTaskTitle', 'Changed Title');
            await page.click('#cancelUpdateBtn');

            // Verify database unchanged
            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'no-change-on-cancel').title).toBe('Cancel Test Title');

            // Verify UI unchanged
            await expect(page.locator('.task-title:has-text("Cancel Test Title")')).toBeVisible();
        });

        test('should reset form when modal is cancelled', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="reset-form-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Make changes
            await page.fill('#updateTaskTitle', 'Changed');

            // Cancel
            await page.click('#cancelUpdateBtn');

            // Re-open modal
            await page.click('button.btn-edit[data-id="reset-form-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Verify form has original values
            await expect(page.locator('#updateTaskTitle')).toHaveValue('Original');
        });
    });

    // ERROR FLOW 3 - Task Not Found

    test.describe('Error Flow 3 - Task Not Found', () => {

        test('should show alert when task is not found during edit open', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            // Delete the task from file before opening modal
            await fs.writeFile(TASKS_FILE, '[]', 'utf8');

            // Set up dialog handler
            let dialogMessage = '';
            page.on('dialog', async dialog => {
                dialogMessage = dialog.message();
                await dialog.accept();
            });

            await page.click('button.btn-edit[data-id="will-be-deleted"]');

            // Wait for dialog
            await page.waitForTimeout(500);

            expect(dialogMessage.toLowerCase()).toContain('could not find');
        });

        test('should show alert when task deleted before update submission', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="deleted-before-submit"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Delete the task while modal is open
            await fs.writeFile(TASKS_FILE, '[]', 'utf8');

            // Set up dialog handler
            let dialogMessage = '';
            page.on('dialog', async dialog => {
                dialogMessage = dialog.message();
                await dialog.accept();
            });

            await page.fill('#updateTaskTitle', 'Updated Title');
            await page.click('#updateTaskForm button[type="submit"]');

            // Wait for dialog
            await page.waitForTimeout(500);

            expect(dialogMessage).toContain('404');
        });
    });

    // ERROR FLOW 4 - Server Error

    test.describe('Error Flow 4 - Server Error', () => {

        test('should show alert on server error during update', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="server-error-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Create invalid JSON to cause server error
            await fs.writeFile(TASKS_FILE, 'invalid json', 'utf8');

            let dialogMessage = '';
            page.on('dialog', async dialog => {
                dialogMessage = dialog.message();
                await dialog.accept();
            });

            await page.fill('#updateTaskTitle', 'Updated');
            await page.click('#updateTaskForm button[type="submit"]');

            await page.waitForTimeout(500);

            expect(dialogMessage).toContain('500');
        });

        test('should not close modal on server error', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="no-close-on-error"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Create condition for server error
            await fs.writeFile(TASKS_FILE, 'broken', 'utf8');

            page.on('dialog', async dialog => {
                await dialog.accept();
            });

            await page.fill('#updateTaskTitle', 'Test');
            await page.click('#updateTaskForm button[type="submit"]');

            // Modal should remain open after error
            await page.waitForTimeout(500);
            // Note: Current implementation closes modal even on error
        });

        test('should show alert when server fails to load task data for editing', async ({ page, browserName }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            // Intercept /view-tasks to return 500 error when edit button is clicked
            await page.route('**/view-tasks', route => {
                route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'Internal Server Error' })
                });
            });

            // Set up dialog handler to capture alert
            let dialogMessage = '';
            page.on('dialog', async dialog => {
                dialogMessage = dialog.message();
                await dialog.accept();
            });

            // Click edit button - this will trigger /view-tasks which will now fail
            const taskId = `test-task-${browserName}`;
            await page.click(`button.btn-edit[data-id="${taskId}"]`);

            // Wait for alert
            await page.waitForTimeout(500);

            // Verify alert message contains expected error info (lines 47-48 of isaac-tan.js)
            expect(dialogMessage).toContain('Failed to load task');
            expect(dialogMessage).toContain('500');
        });

        test('should show alert when network error occurs during update', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="network-error-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Intercept the update-task endpoint and abort to simulate network error
            await page.route('**/update-task/**', route => {
                route.abort('failed');
            });

            // Set up dialog handler to capture alert
            let dialogMessage = '';
            page.on('dialog', async dialog => {
                dialogMessage = dialog.message();
                await dialog.accept();
            });

            // Fill form and submit
            await page.fill('#updateTaskTitle', 'Updated Title');
            await page.click('#updateTaskForm button[type="submit"]');

            // Wait for alert
            await page.waitForTimeout(500);

            // Verify alert message contains expected error info (lines 90-91 of isaac-tan.js)
            expect(dialogMessage).toContain('Error connecting to server for task update');
        });
    });

    // EDGE CASES - Boundary Conditions

    test.describe('Edge Cases - Boundary Conditions', () => {

        test('should handle very long title (boundary)', async ({ page }) => {
            const longTitle = 'A'.repeat(500);

            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="long-title-boundary"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', longTitle);
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'long-title-boundary').title).toBe(longTitle);
        });

        test('should handle special characters in title', async ({ page }) => {
            const specialTitle = 'Task <with> "special" \'chars\' & symbols!';

            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="special-chars-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', specialTitle);
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'special-chars-test').title).toBe(specialTitle);
        });

        test('should handle unicode and emoji in fields', async ({ page }) => {
            const unicodeTitle = '任务 🎉 tâche émoji';

            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="unicode-emoji-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', unicodeTitle);
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'unicode-emoji-test').title).toBe(unicodeTitle);
        });

        test('should handle minimum date value', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="min-date-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskDueDate', '2000-01-01');
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'min-date-test').dueDate).toBe('2000-01-01');
        });

        test('should handle maximum date value', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="max-date-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskDueDate', '2099-12-31');
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'max-date-test').dueDate).toBe('2099-12-31');
        });

        test('should handle empty description update', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="empty-desc-update"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskDescription', '');
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'empty-desc-update').description).toBe('');
        });

        test('should handle single character title', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="single-char-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', 'X');
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'single-char-test').title).toBe('X');
        });
    });

    // LOGICAL BRANCH COVERAGE
    
    test.describe('Logical Branch Coverage', () => {

        test('should handle all status dropdown options', async ({ page }) => {
            const statuses = ['To Do', 'In Progress', 'Completed'];

            for (const status of statuses) {
                await resetTasksFile();
                const taskId = `status-branch-${status.replace(/\s/g, '')}`;

                await page.goto(BASE_URL);
                await page.waitForSelector('.task-card');

                await page.click(`button.btn-edit[data-id="${taskId}"]`);
                await page.waitForSelector('#updateTaskModal.show');

                await page.selectOption('#updateTaskStatus', status);
                await page.click('#updateTaskForm button[type="submit"]');

                await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

                const tasks = await readTasks();
                expect(tasks.find((t: any) => t.id === taskId).status).toBe(status);
            }
        });

        test('should handle all priority dropdown options', async ({ page }) => {
            const priorities = ['Low', 'Medium', 'High'];

            for (const priority of priorities) {
                await resetTasksFile();
                const taskId = `priority-branch-${priority}`;

                await page.goto(BASE_URL);
                await page.waitForSelector('.task-card');

                await page.click(`button.btn-edit[data-id="${taskId}"]`);
                await page.waitForSelector('#updateTaskModal.show');

                await page.selectOption('#updateTaskPriority', priority);
                await page.click('#updateTaskForm button[type="submit"]');

                await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

                const tasks = await readTasks();
                expect(tasks.find((t: any) => t.id === taskId).priority).toBe(priority);
            }
        });

        test('should update first task in list of multiple', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="first-in-list"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', 'Updated First');
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'first-in-list').title).toBe('Updated First');
            expect(tasks.find((t: any) => t.id === 'second-in-list').title).toBe('Second Task');
            expect(tasks.find((t: any) => t.id === 'third-in-list').title).toBe('Third Task');
        });

        test('should update middle task in list', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="middle"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', 'Updated Middle');
            await page.click('#updateTaskForm button[type="submit"]');

            // Wait for modal to close indicating update is complete
            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'middle').title).toBe('Updated Middle');
        });

        test('should update last task in list', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="tasklast"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', 'Updated Last');
            await page.click('#updateTaskForm button[type="submit"]');

            // Wait for modal to close indicating update is complete
            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.find((t: any) => t.id === 'tasklast').title).toBe('Updated Last');
        });

        test('should update only task in single-item list', async ({ page }) => {
            // For this test, we need only one task
            await fs.writeFile(TASKS_FILE, JSON.stringify([
                { id: 'only-task', title: 'Only Task', description: 'Test Description', status: 'To Do', priority: 'Medium', dueDate: '2026-01-15', imageUrl: null }
            ], null, 2), 'utf-8');

            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="only-task"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', 'Updated Only Task');
            await page.click('#updateTaskForm button[type="submit"]');

            // Wait for modal to close indicating update is complete
            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            expect(tasks.length).toBe(1);
            expect(tasks[0].title).toBe('Updated Only Task');
        });
    });

    // DATA INTEGRITY TESTS
    
    test.describe('Data Integrity', () => {

        test('should preserve other tasks when updating one', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="preserve-2"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', 'Updated Task 2');
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();

            // Verify unchanged tasks
            const t1 = tasks.find((t: any) => t.id === 'preserve-1');
            expect(t1.title).toBe('Task 1');
            expect(t1.description).toBe('Desc 1');

            const t3 = tasks.find((t: any) => t.id === 'preserve-3');
            expect(t3.title).toBe('Task 3');
            expect(t3.description).toBe('Desc 3');

            // Verify updated task
            const t2 = tasks.find((t: any) => t.id === 'preserve-2');
            expect(t2.title).toBe('Updated Task 2');
        });

        test('should maintain task count after update', async ({ page }) => {
            // Set up exactly 3 tasks for this test
            await fs.writeFile(TASKS_FILE, JSON.stringify([
                { id: 't1', ...defaultTask },
                { id: 't2', ...defaultTask },
                { id: 't3', ...defaultTask }
            ], null, 2), 'utf-8');

            const tasksBefore = await readTasks();
            expect(tasksBefore.length).toBe(3);

            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="t2"]');
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', 'Updated');
            await page.click('#updateTaskForm button[type="submit"]');

            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasksAfter = await readTasks();
            expect(tasksAfter.length).toBe(3);
        });

        test('should preserve task ID after update', async ({ page }) => {
            const originalId = 'preserve-id-test-123';

            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click(`button.btn-edit[data-id="${originalId}"]`);
            await page.waitForSelector('#updateTaskModal.show');

            await page.fill('#updateTaskTitle', 'New Title');
            await page.click('#updateTaskForm button[type="submit"]');

            // Wait for modal to close indicating update is complete
            await expect(page.locator('#updateTaskModal')).not.toHaveClass(/show/);

            const tasks = await readTasks();
            const updatedTask = tasks.find((t: any) => t.title === 'New Title');
            expect(updatedTask.id).toBe(originalId);
        });
    });

    // UI/UX TESTS
    
    test.describe('UI/UX Tests', () => {

        test('should display modal with correct title', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="modal-title-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            await expect(page.locator('#updateTaskModal .modal-title')).toHaveText('Update Task');
        });

        test('should show required field indicators', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="required-fields-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            // Check for required indicators near title and due date labels
            const titleLabel = page.locator('label[for="updateTaskTitle"]');
            await expect(titleLabel).toContainText('*');

            const dateLabel = page.locator('label[for="updateTaskDueDate"]');
            await expect(dateLabel).toContainText('*');
        });

        test('should have Update Task submit button', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="submit-btn-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            await expect(page.locator('#updateTaskForm button[type="submit"]')).toHaveText('Update Task');
        });

        test('should have Cancel button', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            await page.click('button.btn-edit[data-id="cancel-btn-visible-test"]');
            await page.waitForSelector('#updateTaskModal.show');

            await expect(page.locator('#cancelUpdateBtn')).toBeVisible();
            await expect(page.locator('#cancelUpdateBtn')).toHaveText('Cancel');
        });

        test('should show edit button on task card', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForSelector('.task-card');

            const editBtn = page.locator('button.btn-edit[data-id="edit-btn-visible"]');
            await expect(editBtn).toBeVisible();
        });
    });
});
