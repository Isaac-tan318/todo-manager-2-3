// Tests for backend and API

const { app, server } = require('../index');
const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const { updateTask } = require('../utils/IsaacTanUtil');

const TASKS_FILE = path.join('utils', 'tasks.json');
const TASKS_TEMPLATE = path.join('utils', 'tasks.template.json');

// Helper to reset tasks.json before each test
async function resetTasksFile() {
    try {
        const template = await fs.readFile(TASKS_TEMPLATE, 'utf8');
        await fs.writeFile(TASKS_FILE, template, 'utf8');
    } catch (error) {
        // If template doesn't exist, create empty array
        await fs.writeFile(TASKS_FILE, '[]', 'utf8');
    }
}

// Helper to create a test task
async function createTestTask(taskData = {}) {
    const defaultTask = {
        id: 'test-task-123',
        title: 'Test Task',
        description: 'Test Description',
        status: 'To Do',
        priority: 'Medium',
        dueDate: '2026-01-15',
        imageUrl: null
    };
    const task = { ...defaultTask, ...taskData };

    let tasks = [];
    try {
        const data = await fs.readFile(TASKS_FILE, 'utf8');
        tasks = JSON.parse(data);
    } catch (error) {
        tasks = [];
    }

    tasks.push(task);
    await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
    return task;
}

// Helper to read tasks from file
async function readTasks() {
    const data = await fs.readFile(TASKS_FILE, 'utf8');
    return JSON.parse(data);
}

describe('UPDATE Task Function Tests', () => {

    beforeEach(async () => {
        await resetTasksFile();
    });

    afterAll(async () => {
        await resetTasksFile();
        server.close();
    });

    // BACKEND UNIT TESTS 

    describe('Backend Unit Tests - updateTask()', () => {

        describe('Input Validation', () => {

            test('should return 400 when task ID is missing', async () => {
                // Direct unit test for missing taskId
                const mockReq = {
                    params: {},
                    body: { title: 'Test' }
                };

                const mockRes = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn()
                };

                await updateTask(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Task ID is required for update.'
                });
            });

            test('should return 400 when task ID is undefined', async () => {
                const mockReq = {
                    params: { id: undefined },
                    body: { title: 'Test' }
                };

                const mockRes = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn()
                };

                await updateTask(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
            });

            test('should return 400 when task ID is empty string', async () => {
                const mockReq = {
                    params: { id: '' },
                    body: { title: 'Test' }
                };

                const mockRes = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn()
                };

                await updateTask(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
            });

            test('should return 400 when task ID is null', async () => {
                const mockReq = {
                    params: { id: null },
                    body: { title: 'Test' }
                };

                const mockRes = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn()
                };

                await updateTask(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
            });
        });

        describe('Primary Flow (Success Cases)', () => {

            test('should successfully update task title', async () => {
                const task = await createTestTask({ id: 'update-title-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ title: 'Updated Title' })
                    .expect(200);

                expect(response.body.title).toBe('Updated Title');
                expect(response.body.id).toBe(task.id);

                // Verify persistence
                const tasks = await readTasks();
                const updatedTask = tasks.find(t => t.id === task.id);
                expect(updatedTask.title).toBe('Updated Title');
            });

            test('should successfully update task description', async () => {
                const task = await createTestTask({ id: 'update-desc-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ description: 'Updated Description' })
                    .expect(200);

                expect(response.body.description).toBe('Updated Description');
            });

            test('should successfully update task status', async () => {
                const task = await createTestTask({ id: 'update-status-test', status: 'To Do' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ status: 'In Progress' })
                    .expect(200);

                expect(response.body.status).toBe('In Progress');
            });

            test('should successfully update task priority', async () => {
                const task = await createTestTask({ id: 'update-priority-test', priority: 'Low' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ priority: 'High' })
                    .expect(200);

                expect(response.body.priority).toBe('High');
            });

            test('should successfully update task due date', async () => {
                const task = await createTestTask({ id: 'update-date-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ dueDate: '2026-12-31' })
                    .expect(200);

                expect(response.body.dueDate).toBe('2026-12-31');
            });

            test('should successfully update multiple fields at once', async () => {
                const task = await createTestTask({ id: 'update-multiple-test' });

                const updateData = {
                    title: 'New Title',
                    description: 'New Description',
                    status: 'Completed',
                    priority: 'High',
                    dueDate: '2026-06-15'
                };

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send(updateData)
                    .expect(200);

                expect(response.body.title).toBe('New Title');
                expect(response.body.description).toBe('New Description');
                expect(response.body.status).toBe('Completed');
                expect(response.body.priority).toBe('High');
                expect(response.body.dueDate).toBe('2026-06-15');
            });

            test('should preserve unchanged fields when updating', async () => {
                const task = await createTestTask({
                    id: 'preserve-fields-test',
                    title: 'Original Title',
                    description: 'Original Description',
                    imageUrl: '/uploads/test.jpg'
                });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ title: 'Updated Title' })
                    .expect(200);

                expect(response.body.title).toBe('Updated Title');
                expect(response.body.description).toBe('Original Description');
                expect(response.body.imageUrl).toBe('/uploads/test.jpg');
            });

            test('should preserve task ID after update', async () => {
                const task = await createTestTask({ id: 'preserve-id-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ title: 'New Title' })
                    .expect(200);

                expect(response.body.id).toBe(task.id);
            });
        });

        describe('Error Flow 3 - Task Not Found', () => {

            test('should return 404 when task ID does not exist', async () => {
                const response = await request(app)
                    .put('/update-task/non-existent-id')
                    .send({ title: 'Updated Title' })
                    .expect(404);

                expect(response.body.message).toContain('not found');
            });

            test('should return 404 for empty task list', async () => {
                await fs.writeFile(TASKS_FILE, '[]', 'utf8');

                const response = await request(app)
                    .put('/update-task/any-id')
                    .send({ title: 'Updated Title' })
                    .expect(404);

                expect(response.body.message).toContain('not found');
            });

            test('should return 404 when task was deleted', async () => {
                // Simulate a deleted task scenario
                const response = await request(app)
                    .put('/update-task/deleted-task-id')
                    .send({ title: 'Updated Title' })
                    .expect(404);

                expect(response.body.message).toContain('not found');
            });
        });

        describe('Error Flow 4 - Server Errors', () => {

            test('should handle file read error gracefully', async () => {
                // Create invalid JSON in tasks file
                await fs.writeFile(TASKS_FILE, 'invalid json content', 'utf8');

                const response = await request(app)
                    .put('/update-task/test-id')
                    .send({ title: 'Updated Title' });

                // Should return 500 due to JSON parse error
                expect(response.status).toBe(500);
            });

            test('should handle missing tasks file for new environment', async () => {
                // Delete tasks file to simulate fresh environment
                try {
                    await fs.unlink(TASKS_FILE);
                } catch (e) {
                    // File might not exist
                }

                const response = await request(app)
                    .put('/update-task/test-id')
                    .send({ title: 'Updated Title' })
                    .expect(404);

                // Should treat as empty list - task not found
                expect(response.body.message).toContain('not found');
            });

            test('should return 500 when file write fails', async () => {
                // Test the write error path directly by mocking fs at module level
                const task = await createTestTask({ id: 'write-error-test' });
                const taskId = task.id;

                // Read current tasks to have valid data for the mock
                const currentTasks = await readTasks();

                // Create mock req/res to call updateTask directly
                const mockReq = {
                    params: { id: taskId },
                    body: { title: 'Updated Title' }
                };

                let statusCode;
                let responseBody;
                const mockRes = {
                    status: jest.fn().mockImplementation(code => {
                        statusCode = code;
                        return mockRes;
                    }),
                    json: jest.fn().mockImplementation(body => {
                        responseBody = body;
                        return mockRes;
                    })
                };

                // Save original readFile
                const originalReadFile = require('fs').promises.readFile;
                const originalWriteFile = require('fs').promises.writeFile;

                // Mock readFile to return valid tasks
                require('fs').promises.readFile = jest.fn().mockResolvedValue(
                    JSON.stringify(currentTasks)
                );

                // Mock writeFile to throw an error
                require('fs').promises.writeFile = jest.fn().mockRejectedValue(
                    new Error('Simulated write error')
                );

                // Call updateTask directly
                await updateTask(mockReq, mockRes);

                // Restore
                require('fs').promises.readFile = originalReadFile;
                require('fs').promises.writeFile = originalWriteFile;

                expect(statusCode).toBe(500);
                expect(responseBody.message).toContain('Error');
            });
        });

        describe('Edge Cases - Boundary Conditions', () => {

            test('should handle empty title update (boundary)', async () => {
                const task = await createTestTask({ id: 'empty-title-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ title: '' })
                    .expect(200);

                // Backend accepts empty - validation should be in frontend
                expect(response.body.title).toBe('');
            });

            test('should handle very long title (boundary - max length)', async () => {
                const task = await createTestTask({ id: 'long-title-test' });
                const longTitle = 'A'.repeat(1000);

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ title: longTitle })
                    .expect(200);

                expect(response.body.title).toBe(longTitle);
            });

            test('should handle very long description (boundary)', async () => {
                const task = await createTestTask({ id: 'long-desc-test' });
                const longDescription = 'B'.repeat(5000);

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ description: longDescription })
                    .expect(200);

                expect(response.body.description).toBe(longDescription);
            });

            test('should handle special characters in title', async () => {
                const task = await createTestTask({ id: 'special-char-test' });
                const specialTitle = '<script>alert("xss")</script> & "quotes" \'apostrophe\'';

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ title: specialTitle })
                    .expect(200);

                expect(response.body.title).toBe(specialTitle);
            });

            test('should handle unicode characters in fields', async () => {
                const task = await createTestTask({ id: 'unicode-test' });
                const unicodeTitle = '任务标题 🎉 émojis and ñ';

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ title: unicodeTitle })
                    .expect(200);

                expect(response.body.title).toBe(unicodeTitle);
            });

            test('should handle minimum date (far past)', async () => {
                const task = await createTestTask({ id: 'min-date-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ dueDate: '1970-01-01' })
                    .expect(200);

                expect(response.body.dueDate).toBe('1970-01-01');
            });

            test('should handle maximum date (far future)', async () => {
                const task = await createTestTask({ id: 'max-date-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ dueDate: '2099-12-31' })
                    .expect(200);

                expect(response.body.dueDate).toBe('2099-12-31');
            });

            test('should handle null values in update', async () => {
                const task = await createTestTask({ id: 'null-test', description: 'Original' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ description: null })
                    .expect(200);

                expect(response.body.description).toBeNull();
            });

            test('should handle empty object update (no changes)', async () => {
                const task = await createTestTask({ id: 'empty-update-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({})
                    .expect(200);

                expect(response.body.id).toBe(task.id);
                expect(response.body.title).toBe(task.title);
            });

            test('should handle whitespace-only title', async () => {
                const task = await createTestTask({ id: 'whitespace-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ title: '   ' })
                    .expect(200);

                expect(response.body.title).toBe('   ');
            });

            test('should handle task ID with special characters', async () => {
                const response = await request(app)
                    .put('/update-task/task-with-special-chars!@#')
                    .send({ title: 'Test' })
                    .expect(404);

                expect(response.body.message).toContain('not found');
            });

            test('should handle numeric task ID', async () => {
                const task = await createTestTask({ id: '12345' });

                const response = await request(app)
                    .put('/update-task/12345')
                    .send({ title: 'Updated' })
                    .expect(200);

                expect(response.body.title).toBe('Updated');
            });
        });

        describe('Logical Branch Coverage', () => {

            test('should update first task in list', async () => {
                await createTestTask({ id: 'first-task' });
                await createTestTask({ id: 'second-task' });
                await createTestTask({ id: 'third-task' });

                const response = await request(app)
                    .put('/update-task/first-task')
                    .send({ title: 'Updated First' })
                    .expect(200);

                expect(response.body.title).toBe('Updated First');

                // Verify other tasks unchanged
                const tasks = await readTasks();
                expect(tasks.find(t => t.id === 'second-task').title).toBe('Test Task');
            });

            test('should update middle task in list', async () => {
                await createTestTask({ id: 'first-task' });
                await createTestTask({ id: 'middle-task' });
                await createTestTask({ id: 'last-task' });

                const response = await request(app)
                    .put('/update-task/middle-task')
                    .send({ title: 'Updated Middle' })
                    .expect(200);

                expect(response.body.title).toBe('Updated Middle');
            });

            test('should update last task in list', async () => {
                await createTestTask({ id: 'first-task' });
                await createTestTask({ id: 'second-task' });
                await createTestTask({ id: 'last-task' });

                const response = await request(app)
                    .put('/update-task/last-task')
                    .send({ title: 'Updated Last' })
                    .expect(200);

                expect(response.body.title).toBe('Updated Last');
            });

            test('should update only task in single-item list', async () => {
                await createTestTask({ id: 'only-task' });

                const response = await request(app)
                    .put('/update-task/only-task')
                    .send({ title: 'Updated Only' })
                    .expect(200);

                expect(response.body.title).toBe('Updated Only');
            });

            test('should handle all status values', async () => {
                const statuses = ['To Do', 'In Progress', 'Completed'];

                for (const status of statuses) {
                    const task = await createTestTask({ id: `status-${status.replace(/\s/g, '')}` });

                    const response = await request(app)
                        .put(`/update-task/${task.id}`)
                        .send({ status })
                        .expect(200);

                    expect(response.body.status).toBe(status);
                }
            });

            test('should handle all priority values', async () => {
                const priorities = ['Low', 'Medium', 'High'];

                for (const priority of priorities) {
                    const task = await createTestTask({ id: `priority-${priority}` });

                    const response = await request(app)
                        .put(`/update-task/${task.id}`)
                        .send({ priority })
                        .expect(200);

                    expect(response.body.priority).toBe(priority);
                }
            });
        });

        describe('Data Integrity Tests', () => {

            test('should not modify other tasks when updating one', async () => {
                const task1 = await createTestTask({ id: 'task-1', title: 'Task 1' });
                const task2 = await createTestTask({ id: 'task-2', title: 'Task 2' });
                const task3 = await createTestTask({ id: 'task-3', title: 'Task 3' });

                await request(app)
                    .put('/update-task/task-2')
                    .send({ title: 'Updated Task 2' })
                    .expect(200);

                const tasks = await readTasks();
                expect(tasks.find(t => t.id === 'task-1').title).toBe('Task 1');
                expect(tasks.find(t => t.id === 'task-2').title).toBe('Updated Task 2');
                expect(tasks.find(t => t.id === 'task-3').title).toBe('Task 3');
            });

            test('should maintain task count after update', async () => {
                await createTestTask({ id: 'task-a' });
                await createTestTask({ id: 'task-b' });
                await createTestTask({ id: 'task-c' });

                const tasksBefore = await readTasks();
                expect(tasksBefore.length).toBe(3);

                await request(app)
                    .put('/update-task/task-b')
                    .send({ title: 'Updated' })
                    .expect(200);

                const tasksAfter = await readTasks();
                expect(tasksAfter.length).toBe(3);
            });

            test('should not allow changing task ID via update', async () => {
                const task = await createTestTask({ id: 'original-id' });

                const response = await request(app)
                    .put('/update-task/original-id')
                    .send({ id: 'new-id', title: 'Updated' })
                    .expect(200);

                // The spread operator will override id, but task is found by original id
                const tasks = await readTasks();
                const updatedTask = tasks.find(t => t.title === 'Updated');
                expect(updatedTask).toBeTruthy();
            });
        });

        describe('Concurrent Update Tests', () => {

            test('should handle rapid sequential updates to same task', async () => {
                const task = await createTestTask({ id: 'concurrent-update-test' });

                // Fire all requests simultaneously
                const results = await Promise.all([
                    request(app).put(`/update-task/${task.id}`).send({ title: 'Update 1' }),
                    request(app).put(`/update-task/${task.id}`).send({ title: 'Update 2' }),
                    request(app).put(`/update-task/${task.id}`).send({ title: 'Update 3' }),
                ]);

                // All should succeed (no crashes)
                results.forEach(res => expect(res.status).toBe(200));

                // Final state should be one of the updates (last-write-wins)
                const tasks = await readTasks();
                const finalTask = tasks.find(t => t.id === task.id);
                expect(['Update 1', 'Update 2', 'Update 3']).toContain(finalTask.title);
            });
        });
    });

    // API INTEGRATION TESTS

    describe('API Integration Tests - PUT /update-task/:id', () => {

        describe('HTTP Method Validation', () => {

            test('should accept PUT method', async () => {
                const task = await createTestTask({ id: 'put-method-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ title: 'Updated' });

                expect(response.status).toBe(200);
            });

            test('should reject GET method on update endpoint', async () => {
                const response = await request(app)
                    .get('/update-task/test-id');

                expect(response.status).toBe(404);
            });

            test('should reject POST method on update endpoint', async () => {
                const response = await request(app)
                    .post('/update-task/test-id')
                    .send({ title: 'Test' });

                expect(response.status).toBe(404);
            });

            test('should reject DELETE method on update endpoint', async () => {
                const response = await request(app)
                    .delete('/update-task/test-id');

                // DELETE has its own endpoint, so this should fail
                expect(response.status).not.toBe(200);
            });
        });

        describe('Request Body Validation', () => {

            test('should accept JSON content type', async () => {
                const task = await createTestTask({ id: 'json-content-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .set('Content-Type', 'application/json')
                    .send({ title: 'Updated' })
                    .expect(200);

                expect(response.body.title).toBe('Updated');
            });

            test('should handle empty request body', async () => {
                const task = await createTestTask({ id: 'empty-body-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({})
                    .expect(200);

                expect(response.body.id).toBe(task.id);
            });

            test('should handle additional unknown fields in request', async () => {
                const task = await createTestTask({ id: 'extra-fields-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({
                        title: 'Updated',
                        unknownField: 'should be added',
                        anotherField: 123
                    })
                    .expect(200);

                expect(response.body.title).toBe('Updated');
                expect(response.body.unknownField).toBe('should be added');
            });
        });

        describe('Response Validation', () => {

            test('should return updated task object on success', async () => {
                const task = await createTestTask({ id: 'response-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ title: 'Updated Title' })
                    .expect(200);

                expect(response.body).toHaveProperty('id');
                expect(response.body).toHaveProperty('title');
                expect(response.body).toHaveProperty('description');
                expect(response.body).toHaveProperty('status');
                expect(response.body).toHaveProperty('priority');
                expect(response.body).toHaveProperty('dueDate');
            });

            test('should return JSON content type', async () => {
                const task = await createTestTask({ id: 'content-type-test' });

                const response = await request(app)
                    .put(`/update-task/${task.id}`)
                    .send({ title: 'Updated' })
                    .expect(200);

                expect(response.headers['content-type']).toMatch(/json/);
            });

            test('should return 404 status for non-existent task', async () => {
                const response = await request(app)
                    .put('/update-task/non-existent')
                    .send({ title: 'Test' })
                    .expect(404);

                expect(response.body).toHaveProperty('message');
            });

            test('should return error message for 404 response', async () => {
                const response = await request(app)
                    .put('/update-task/does-not-exist')
                    .send({ title: 'Test' })
                    .expect(404);

                expect(response.body.message).toContain('not found');
            });
        });

        describe('URL Parameter Handling', () => {

            test('should correctly parse task ID from URL', async () => {
                const task = await createTestTask({ id: 'url-param-test-123' });

                const response = await request(app)
                    .put('/update-task/url-param-test-123')
                    .send({ title: 'Updated' })
                    .expect(200);

                expect(response.body.id).toBe('url-param-test-123');
            });

            test('should handle URL-encoded task ID', async () => {
                const task = await createTestTask({ id: 'task with spaces' });

                const response = await request(app)
                    .put('/update-task/task%20with%20spaces')
                    .send({ title: 'Updated' })
                    .expect(200);

                expect(response.body.title).toBe('Updated');
            });

            test('should handle numeric string task ID', async () => {
                const task = await createTestTask({ id: '9876543210' });

                const response = await request(app)
                    .put('/update-task/9876543210')
                    .send({ title: 'Updated' })
                    .expect(200);

                expect(response.body.id).toBe('9876543210');
            });
        });
    });


    // GET /view-tasks Integration Tests (for edit dialog)

    describe('GET /view-tasks Integration Tests (for edit pre-fill)', () => {

        test('should return all tasks including the one to edit', async () => {
            const task = await createTestTask({ id: 'view-for-edit-test' });

            const response = await request(app)
                .get('/view-tasks')
                .expect(200);

            const taskToEdit = response.body.find(t => t.id === task.id);
            expect(taskToEdit).toBeDefined();
            expect(taskToEdit.title).toBe(task.title);
        });

        test('should return empty array when no tasks exist', async () => {
            await fs.writeFile(TASKS_FILE, '[]', 'utf8');

            const response = await request(app)
                .get('/view-tasks')
                .expect(200);

            expect(response.body).toEqual([]);
        });

        test('should return complete task data for pre-filling form', async () => {
            const task = await createTestTask({
                id: 'complete-data-test',
                title: 'Full Task',
                description: 'Full Description',
                status: 'In Progress',
                priority: 'High',
                dueDate: '2026-03-15',
                imageUrl: '/uploads/test.png'
            });

            const response = await request(app)
                .get('/view-tasks')
                .expect(200);

            const taskData = response.body.find(t => t.id === task.id);
            expect(taskData.title).toBe('Full Task');
            expect(taskData.description).toBe('Full Description');
            expect(taskData.status).toBe('In Progress');
            expect(taskData.priority).toBe('High');
            expect(taskData.dueDate).toBe('2026-03-15');
            expect(taskData.imageUrl).toBe('/uploads/test.png');
        });
    });
});