import { test } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
// Global array to store JavaScript coverage data across tests
let jsCoverage = [];
// Directory where coverage files will be saved
const coverageDir = path.join(process.cwd(), 'coverage/temp');
// Target file for update-task tests coverage
const TARGET_FILE = 'isaac-tan.js';
test.beforeEach(async ({ page, browserName }) => {
    // Only enable JS coverage for Chromium browsers since coverage is browser-specific
    if (browserName === 'chromium') {
        // Start collecting JavaScript coverage for the page
        await page.coverage.startJSCoverage();
    }
});
test.afterEach(async ({ page, browserName }, testInfo) => {
    if (browserName === 'chromium') {
        // Stop JS coverage collection for the page
        const coverage = await page.coverage.stopJSCoverage();
        // Filter coverage to only include the target file (isaac-tan.js)
        const filteredCoverage = coverage.filter(entry => 
            entry.url && entry.url.includes(TARGET_FILE)
        );
        // Append the filtered coverage data for this test to the global array
        jsCoverage.push(...filteredCoverage);
        // Ensure coverage folder exists
        try {
            await fs.access(coverageDir);
        } catch {
            await fs.mkdir(coverageDir, { recursive: true });
        }
        // Generate a file path to save the coverage JSON
        const filePath = path.join(
            coverageDir,
            `v8-coverage-${testInfo.title.replace(/[\W_]+/g, '-')}.json`
        );
        // Save the filtered coverage data asynchronously as a JSON file
        await fs.writeFile(filePath, JSON.stringify(filteredCoverage));
    }
});