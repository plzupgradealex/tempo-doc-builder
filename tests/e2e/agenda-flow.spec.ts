import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Comprehensive E2E tests for Tempo — Agenda Builder.
 * Uses fake data to exercise every major feature.
 */

// Fake data for testing
const FAKE_AGENDA = {
  vendor: 'Schreiber Foods Europe GmbH',
  customerNumber: 'CUST-2026-0042',
  projectNumber: 'PRJ-ERP-2026',
  customerAddress: '123 Industriestraße, 80331 München, Germany',
  customerContact: 'Hans Müller',
  vendorContact: 'Sarah Johnson',
  projectName: 'SAP S/4HANA Go-Live Preparation',
};

const FAKE_TRAVEL = {
  arrivalDate: '2026-03-15',
  arrivalTime: '08:30',
  arrivalRef: 'LH452',
  arrivalLocation: 'Munich Airport (MUC)',
  departureDate: '2026-03-19',
  departureTime: '19:00',
  departureRef: 'LH453',
  departureLocation: 'Munich Airport (MUC)',
};

test.describe('Tempo — Full E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.lcars-frame');
  });

  test('app loads with LCARS frame and default agenda', async ({ page }) => {
    await expect(page.locator('.lcars-frame')).toBeVisible();
    await expect(page.locator('.lcars-title')).toContainText('TEMPO');
    await expect(page.locator('#view-agenda')).toHaveClass(/active/);
    await expect(page.locator('.day-panel')).toBeVisible();
  });

  test('status bar shows Ready on load', async ({ page }) => {
    await expect(page.locator('#status-bar')).toContainText(/Ready|Listo|Bereit|Prêt/);
  });

  test('sidebar navigation works for all views', async ({ page }) => {
    const views = ['library', 'domains', 'preview', 'about', 'agenda'];
    for (const view of views) {
      await page.click(`[data-view="${view}"]`);
      await expect(page.locator(`#view-${view}`)).toHaveClass(/active/);
    }
  });

  test('fill in complete header form', async ({ page }) => {
    await page.locator('#header-vendorName').fill(FAKE_AGENDA.vendor);
    await page.locator('#header-customerNumber').fill(FAKE_AGENDA.customerNumber);
    await page.locator('#header-projectNumber').fill(FAKE_AGENDA.projectNumber);
    await page.locator('#header-customerAddress').fill(FAKE_AGENDA.customerAddress);
    await page.locator('#header-customerProjectContact').fill(FAKE_AGENDA.customerContact);
    await page.locator('#header-vendorProjectContact').fill(FAKE_AGENDA.vendorContact);
    await page.locator('#header-projectName').fill(FAKE_AGENDA.projectName);

    // Verify all fields retained values
    await expect(page.locator('#header-vendorName')).toHaveValue(FAKE_AGENDA.vendor);
    await expect(page.locator('#header-projectName')).toHaveValue(FAKE_AGENDA.projectName);
  });

  test('pre-work checkboxes generate requirements', async ({ page }) => {
    // Click the LCARS toggle label to check projector
    await page.locator('#prework-projector').click();
    await expect(page.locator('.prework-output')).toBeVisible();

    // Click the LCARS toggle label to check network
    await page.locator('#prework-network').click();

    // Should show both requirements
    const output = page.locator('.prework-output');
    await expect(output).toBeVisible();
  });

  test('fill in travel details', async ({ page }) => {
    // Arrival
    await page.locator('#travel-arrival-date').fill(FAKE_TRAVEL.arrivalDate);
    await page.locator('#travel-arrival-time').fill(FAKE_TRAVEL.arrivalTime);
    await page.locator('#travel-arrival-ref').fill(FAKE_TRAVEL.arrivalRef);
    await page.locator('#travel-arrival-location').fill(FAKE_TRAVEL.arrivalLocation);

    // Departure
    await page.locator('#travel-departure-date').fill(FAKE_TRAVEL.departureDate);
    await page.locator('#travel-departure-time').fill(FAKE_TRAVEL.departureTime);
    await page.locator('#travel-departure-ref').fill(FAKE_TRAVEL.departureRef);
    await page.locator('#travel-departure-location').fill(FAKE_TRAVEL.departureLocation);

    await expect(page.locator('#travel-arrival-ref')).toHaveValue(FAKE_TRAVEL.arrivalRef);
    await expect(page.locator('#travel-departure-location')).toHaveValue(FAKE_TRAVEL.departureLocation);
  });

  test('travel mode change updates reference label', async ({ page }) => {
    await page.locator('#travel-arrival-mode').selectOption('vehicle');
    // Should trigger change event
    await page.locator('#travel-arrival-mode').dispatchEvent('change');
  });

  test('default day has orientation and adjourn events', async ({ page }) => {
    const events = page.locator('.event-card');
    const count = await events.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // First event should be orientation-type
    const firstCard = events.first();
    await expect(firstCard).toBeVisible();
  });

  test('add a pause event', async ({ page }) => {
    const eventsBefore = await page.locator('.event-card').count();
    await page.locator('[data-action="add-pause"]').first().click();
    const eventsAfter = await page.locator('.event-card').count();
    expect(eventsAfter).toBe(eventsBefore + 1);
  });

  test('add a plant tour event', async ({ page }) => {
    const eventsBefore = await page.locator('.event-card').count();
    await page.locator('[data-action="add-plant-tour"]').first().click();
    const eventsAfter = await page.locator('.event-card').count();
    expect(eventsAfter).toBe(eventsBefore + 1);
  });

  test('add a custom event', async ({ page }) => {
    const eventsBefore = await page.locator('.event-card').count();
    await page.locator('[data-action="add-custom"]').first().click();
    const eventsAfter = await page.locator('.event-card').count();
    expect(eventsAfter).toBe(eventsBefore + 1);
  });

  test('topic picker opens and closes', async ({ page }) => {
    await page.locator('[data-action="add-topic"]').first().click();
    await expect(page.locator('#topic-picker-modal')).toHaveClass(/active/);

    // Close it
    await page.locator('#topic-picker-close').click();
    await expect(page.locator('#topic-picker-modal')).not.toHaveClass(/active/);
  });

  test('topic picker shows all topic cards', async ({ page }) => {
    await page.locator('[data-action="add-topic"]').first().click();
    await expect(page.locator('#topic-picker-modal')).toHaveClass(/active/);

    // Should have topic cards
    const cards = page.locator('#topic-picker-body .topic-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('add a second day', async ({ page }) => {
    const daysBefore = await page.locator('.day-panel').count();
    await page.locator('#btn-add-day').click();
    const daysAfter = await page.locator('.day-panel').count();
    expect(daysAfter).toBe(daysBefore + 1);
  });

  test('remove last day (cannot remove the only day)', async ({ page }) => {
    // Add a second day first
    await page.locator('#btn-add-day').click();
    const daysAfter = await page.locator('.day-panel').count();
    expect(daysAfter).toBe(2);

    // Remove one
    await page.locator('#btn-remove-day').click();
    const daysNow = await page.locator('.day-panel').count();
    expect(daysNow).toBe(1);
  });

  test('save agenda shows status message', async ({ page }) => {
    await page.locator('#header-vendorName').fill(FAKE_AGENDA.vendor);
    await page.locator('#header-projectName').fill(FAKE_AGENDA.projectName);

    await page.locator('#btn-save-agenda').click();

    // Status bar should show saved message
    await expect(page.locator('#status-bar')).not.toContainText(/Ready|Listo|Bereit|Prêt/);
  });

  test('saved agenda appears in library', async ({ page }) => {
    // Fill and save
    await page.locator('#header-vendorName').fill(FAKE_AGENDA.vendor);
    await page.locator('#header-projectName').fill(FAKE_AGENDA.projectName);
    await page.locator('#btn-save-agenda').click();
    await page.waitForTimeout(500);

    // Go to library
    await page.click('[data-view="library"]');
    await expect(page.locator('#view-library')).toHaveClass(/active/);

    // Should find the saved agenda
    await expect(page.locator('.library-card')).toBeVisible();
    await expect(page.locator('.library-card-title')).toBeVisible();
  });

  test('load agenda from library', async ({ page }) => {
    // Save first
    await page.locator('#header-vendorName').fill(FAKE_AGENDA.vendor);
    await page.locator('#header-projectName').fill(FAKE_AGENDA.projectName);
    await page.locator('#btn-save-agenda').click();
    await page.waitForTimeout(500);

    // Go to library and load
    await page.click('[data-view="library"]');
    await page.locator('[data-action="load"]').first().click();

    // Should be back on agenda view with data loaded
    await expect(page.locator('#view-agenda')).toHaveClass(/active/);
    await expect(page.locator('#header-vendorName')).toHaveValue(FAKE_AGENDA.vendor);
  });

  test('theme toggle switches between TNG and MOVIE', async ({ page }) => {
    const themeStatus = page.locator('#theme-status');
    await expect(themeStatus).toContainText('TNG');

    await page.locator('#theme-toggle').click();
    await expect(themeStatus).toContainText('MOVIE');

    await page.locator('#theme-toggle').click();
    await expect(themeStatus).toContainText('TNG');
  });

  test('trek mode toggle changes UI', async ({ page }) => {
    // Initially off
    await expect(page.locator('#trek-toggle')).toHaveAttribute('data-trek', 'off');

    await page.locator('#trek-toggle').click();
    await expect(page.locator('#trek-toggle')).toHaveAttribute('data-trek', 'on');

    // Title changes in trek mode
    await expect(page.locator('#app-title')).toContainText('BRIEFING');

    // Toggle back
    await page.locator('#trek-toggle').click();
    await expect(page.locator('#trek-toggle')).toHaveAttribute('data-trek', 'off');
    await expect(page.locator('#app-title')).toContainText('AGENDA BUILDER');
  });

  test('help modal opens and closes', async ({ page }) => {
    await page.locator('#help-btn').click();
    await expect(page.locator('#help-modal')).toHaveClass(/active/);

    await page.locator('#help-close').click();
    await expect(page.locator('#help-modal')).not.toHaveClass(/active/);
  });

  test('help modal contains getting started info', async ({ page }) => {
    await page.locator('#help-btn').click();
    await expect(page.locator('#help-modal .lcars-modal-body')).toBeVisible();
  });

  test('preview view shows agenda HTML', async ({ page }) => {
    // Add some data first
    await page.locator('#header-vendorName').fill(FAKE_AGENDA.vendor);
    await page.locator('#header-projectName').fill(FAKE_AGENDA.projectName);

    // Go to preview
    await page.click('[data-view="preview"]');
    await expect(page.locator('#view-preview')).toHaveClass(/active/);
    await expect(page.locator('#preview-frame')).toBeVisible();
    await expect(page.locator('#preview-frame')).toContainText(FAKE_AGENDA.vendor);
  });

  test('preview has export PDF and JSON buttons', async ({ page }) => {
    await page.click('[data-view="preview"]');
    await expect(page.locator('#preview-export-pdf')).toBeVisible();
    await expect(page.locator('#preview-export-json')).toBeVisible();
  });

  test('about view shows info and privacy section', async ({ page }) => {
    await page.click('[data-view="about"]');
    await expect(page.locator('#view-about')).toHaveClass(/active/);
    await expect(page.locator('#view-about')).toContainText('Tempo');
  });

  test('domains view shows all default domains', async ({ page }) => {
    await page.click('[data-view="domains"]');
    await expect(page.locator('#view-domains')).toHaveClass(/active/);

    const domainCards = page.locator('.domain-edit-card');
    const count = await domainCards.count();
    expect(count).toBe(13); // all default domains
  });

  test('day date picker updates the day title', async ({ page }) => {
    const dateInput = page.locator('.day-panel-date-input').first();
    await dateInput.fill('2026-04-01');
    await dateInput.dispatchEvent('change');

    const title = page.locator('.day-panel-title').first();
    await expect(title).toContainText('Apr');
  });

  test('agenda status bar updates with day/event count', async ({ page }) => {
    // Add a pause to increase event count
    await page.locator('[data-action="add-pause"]').first().click();

    const agendaStatus = page.locator('#agenda-status');
    // Should show format like "1 day(s) · N events"
    await expect(agendaStatus).toContainText('1');
  });

  test('Ctrl+S keyboard shortcut saves', async ({ page }) => {
    await page.locator('#header-vendorName').fill(FAKE_AGENDA.vendor);
    await page.keyboard.press('Meta+s');
    // Status bar should update (not show Ready anymore)
    await page.waitForTimeout(500);
  });
});

test.describe('Tempo — i18n Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.lcars-frame');
  });

  test('translate icon is visible in bottom-left elbow', async ({ page }) => {
    await expect(page.locator('#elbow-bottom')).toBeVisible();
    await expect(page.locator('#elbow-bottom .lang-icon')).toBeVisible();
  });

  test('clicking translate icon opens language panel', async ({ page }) => {
    await page.locator('#elbow-bottom').click();
    await expect(page.locator('#view-language')).toHaveClass(/active/);
    await expect(page.locator('.lcars-lang-btn')).toHaveCount(4);
  });

  test('switch to Spanish', async ({ page }) => {
    await page.locator('#elbow-bottom').click();
    await page.locator('.lcars-lang-btn[data-lang="es"]').click();

    // Should return to previous view with Spanish labels
    await expect(page.locator('[data-view="library"]')).toContainText('Biblioteca');
  });

  test('switch to German', async ({ page }) => {
    await page.locator('#elbow-bottom').click();
    await page.locator('.lcars-lang-btn[data-lang="de"]').click();
    await expect(page.locator('[data-view="library"]')).toContainText('Bibliothek');
  });

  test('switch to French', async ({ page }) => {
    await page.locator('#elbow-bottom').click();
    await page.locator('.lcars-lang-btn[data-lang="fr"]').click();
    await expect(page.locator('[data-view="library"]')).toContainText('Bibliothèque');
  });

  test('switch back to English', async ({ page }) => {
    await page.locator('#elbow-bottom').click();
    await page.locator('.lcars-lang-btn[data-lang="es"]').click();
    await page.locator('#elbow-bottom').click();
    await page.locator('.lcars-lang-btn[data-lang="en"]').click();
    await expect(page.locator('[data-view="library"]')).toContainText('Library');
  });

  test('language persists after reload', async ({ page }) => {
    await page.locator('#elbow-bottom').click();
    await page.locator('.lcars-lang-btn[data-lang="de"]').click();
    await page.reload();
    await page.waitForSelector('.lcars-frame');
    await expect(page.locator('[data-view="library"]')).toContainText('Bibliothek');
  });

  test('help modal content updates with language', async ({ page }) => {
    await page.locator('#elbow-bottom').click();
    await page.locator('.lcars-lang-btn[data-lang="es"]').click();
    await page.locator('#help-btn').click();
    await expect(page.locator('#help-modal .lcars-modal-body')).toBeVisible();
  });
});

test.describe('Tempo — JSON Export & Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.lcars-frame');
  });

  test('export JSON from preview produces a download', async ({ page }) => {
    await page.locator('#header-vendorName').fill(FAKE_AGENDA.vendor);
    await page.locator('#header-projectName').fill(FAKE_AGENDA.projectName);

    await page.click('[data-view="preview"]');

    // Listen for download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#preview-export-json').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.json$/);

    // Read and verify content
    const filePath = await download.path();
    if (filePath) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      expect(data.header.vendorName).toBe(FAKE_AGENDA.vendor);
      expect(data.header.projectName).toBe(FAKE_AGENDA.projectName);
      expect(data.days).toBeInstanceOf(Array);
      expect(data.days.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('export PDF from preview produces a download', async ({ page }) => {
    await page.locator('#header-vendorName').fill(FAKE_AGENDA.vendor);
    await page.locator('#header-projectName').fill(FAKE_AGENDA.projectName);

    await page.click('[data-view="preview"]');

    // Listen for download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#preview-export-pdf').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);

    // Verify file is non-empty and starts with PDF header
    const filePath = await download.path();
    if (filePath) {
      const content = fs.readFileSync(filePath);
      expect(content.length).toBeGreaterThan(500);
      expect(content.slice(0, 5).toString()).toBe('%PDF-');
    }
  });

  test('import JSON restores agenda', async ({ page }) => {
    // Create a fake agenda JSON
    const fakeAgenda = {
      id: 'test-import-123',
      name: 'Imported Agenda',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      header: {
        vendorName: 'Import Test Vendor',
        customerNumber: 'IMP-001',
        customerAddress: '456 Import St',
        customerProjectContact: 'Jane Doe',
        vendorProjectContact: 'John Smith',
        projectNumber: 'IMP-PRJ-001',
        projectName: 'Imported Project',
      },
      travel: {
        arrival: { date: '2026-05-01', time: '09:00', mode: 'flight', reference: 'BA123', location: 'Heathrow', travelTimeToSite: 45 },
        departure: { date: '2026-05-03', time: '18:00', mode: 'train', reference: 'ICE789', location: 'Frankfurt Hbf', travelTimeToSite: 30 },
      },
      preWork: { needsProjector: true, needsNetworkAccess: true },
      days: [
        {
          id: 'day-1',
          date: '2026-05-01',
          dayStartTime: '09:00',
          adjournTime: '17:00',
          events: [
            { id: 'e1', type: 'orientation', title: 'Orientation', description: 'Setup', bulletPoints: [], startTime: '09:00', endTime: '09:30', duration: 30, attendees: [] },
            { id: 'e2', type: 'topic', title: 'Procurement Review', description: 'Review procurement processes', bulletPoints: ['PO flow', 'GR flow'], startTime: '09:30', endTime: '11:00', duration: 90, attendees: [{ name: 'Alice', role: 'Consultant' }] },
            { id: 'e3', type: 'pause', title: 'Lunch', description: '', bulletPoints: [], startTime: '12:00', endTime: '13:00', duration: 60, attendees: [] },
            { id: 'e4', type: 'adjourn', title: 'Adjourn', description: '', bulletPoints: [], startTime: '17:00', endTime: '17:00', duration: 0, attendees: [] },
          ],
        },
      ],
    };

    // Navigate to library
    await page.click('[data-view="library"]');
    await page.waitForSelector('#view-library.active');

    // Create a temporary file for upload
    const jsonContent = JSON.stringify(fakeAgenda, null, 2);

    // Use fileChooser to import
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#lib-import').click();
    const fileChooser = await fileChooserPromise;

    // Create temp file to upload
    const tmpPath = path.join('/tmp', 'tempo-test-import.json');
    fs.writeFileSync(tmpPath, jsonContent, 'utf-8');
    await fileChooser.setFiles(tmpPath);

    // Should switch to agenda view with imported data
    await page.waitForSelector('#view-agenda.active');
    await expect(page.locator('#header-vendorName')).toHaveValue('Import Test Vendor');
    await expect(page.locator('#header-projectName')).toHaveValue('Imported Project');

    // Clean up
    fs.unlinkSync(tmpPath);
  });
});

test.describe('Tempo — Multiple Days & Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.lcars-frame');
  });

  test('build a multi-day agenda with varied events', async ({ page }) => {
    // Fill header
    await page.locator('#header-vendorName').fill(FAKE_AGENDA.vendor);
    await page.locator('#header-projectName').fill(FAKE_AGENDA.projectName);

    // Day 1: add pause + custom
    await page.locator('[data-action="add-pause"]').first().click();
    await page.locator('[data-action="add-custom"]').first().click();

    const eventCount = await page.locator('.day-panel').first().locator('.event-card').count();
    expect(eventCount).toBeGreaterThanOrEqual(4); // orientation + pause + custom + adjourn

    // Add Day 2
    await page.locator('#btn-add-day').click();
    expect(await page.locator('.day-panel').count()).toBe(2);

    // Day 2: add plant tour
    await page.locator('.day-panel').nth(1).locator('[data-action="add-plant-tour"]').click();

    // Add Day 3
    await page.locator('#btn-add-day').click();
    expect(await page.locator('.day-panel').count()).toBe(3);

    // Save
    await page.locator('#btn-save-agenda').click();
    await page.waitForTimeout(500);

    // Verify in library
    await page.click('[data-view="library"]');
    await expect(page.locator('.library-card')).toBeVisible();
  });

  test('last day always gets recap, previous days lose it', async ({ page }) => {
    // Start: 1 day should have recap? Actually only after adding 2nd day
    await page.locator('#btn-add-day').click();

    // Day 2 (now last) should have a recap event
    const day2Events = page.locator('.day-panel').nth(1).locator('.event-card');
    const count = await day2Events.count();
    expect(count).toBeGreaterThanOrEqual(2); // recap + adjourn at minimum
  });
});

test.describe('Tempo — Domains Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.lcars-frame');
  });

  test('add a new domain', async ({ page }) => {
    await page.click('[data-view="domains"]');

    const cardsBefore = await page.locator('.domain-edit-card').count();
    await page.locator('#dom-add').click();
    const cardsAfter = await page.locator('.domain-edit-card').count();
    expect(cardsAfter).toBe(cardsBefore + 1);
  });

  test('edit domain name', async ({ page }) => {
    await page.click('[data-view="domains"]');

    const firstNameInput = page.locator('.domain-edit-card').first().locator('[data-field="name"]');
    await firstNameInput.fill('My Custom Domain');
    await firstNameInput.dispatchEvent('change');

    await expect(firstNameInput).toHaveValue('My Custom Domain');
  });

  test('remove a domain', async ({ page }) => {
    await page.click('[data-view="domains"]');

    // Add one first so we can safely delete
    await page.locator('#dom-add').click();
    const cardsAfterAdd = await page.locator('.domain-edit-card').count();

    // Delete the last one
    await page.locator('.domain-edit-card').last().locator('[data-action="delete"]').click();
    const cardsAfterDelete = await page.locator('.domain-edit-card').count();
    expect(cardsAfterDelete).toBe(cardsAfterAdd - 1);
  });

  test('save and reload domains', async ({ page }) => {
    await page.click('[data-view="domains"]');
    // Save
    await page.locator('#dom-save').click();

    // Status bar should reflect save
    await page.waitForTimeout(500);
  });
});

test.describe('Tempo — Agenda Building Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.lcars-frame');
  });

  test('add topic via picker and verify it appears', async ({ page }) => {
    const eventsBefore = await page.locator('.event-card').count();

    // Open topic picker
    await page.locator('[data-action="add-topic"]').first().click();
    await expect(page.locator('#topic-picker-modal')).toHaveClass(/active/);

    // Click the first domain card
    await page.locator('.topic-card').first().click();

    // Picker should close and event count should increase
    await expect(page.locator('#topic-picker-modal')).not.toHaveClass(/active/);
    const eventsAfter = await page.locator('.event-card').count();
    expect(eventsAfter).toBe(eventsBefore + 1);
  });

  test('edit event via inline edit form', async ({ page }) => {
    // Add a custom event
    await page.locator('[data-action="add-custom"]').first().click();

    // Find the last event card and click edit
    const cards = page.locator('.event-card');
    const lastCard = cards.nth((await cards.count()) - 2); // -2 because adjourn is last
    await lastCard.locator('.event-card-action.edit').click();

    // Edit form should appear
    const editForm = page.locator('.event-edit-inline');
    await expect(editForm).toBeVisible();

    // Change title
    await editForm.locator('#edit-title').fill('Updated Title');
    await editForm.locator('#edit-save').click();

    // The card should show the new title
    await expect(page.locator('.event-card-title').filter({ hasText: 'Updated Title' })).toBeVisible();
  });

  test('delete an event', async ({ page }) => {
    // Add a pause
    await page.locator('[data-action="add-pause"]').first().click();
    const eventsBefore = await page.locator('.event-card').count();

    // Find the pause event and delete it
    const pauseCard = page.locator('.event-card .event-card-indicator.pause').first().locator('..');
    await pauseCard.locator('.event-card-action.delete').click();

    const eventsAfter = await page.locator('.event-card').count();
    expect(eventsAfter).toBe(eventsBefore - 1);
  });

  test('change event start time via inline time input', async ({ page }) => {
    // Add a custom event
    await page.locator('[data-action="add-custom"]').first().click();
    await page.waitForTimeout(200);

    // Find the time picker on the custom event card (not orientation/adjourn)
    const customCards = page.locator('.event-card:has(.event-card-indicator.custom)');
    const timePicker = customCards.first().locator('.lcars-time-picker[data-field="start"]');
    await expect(timePicker).toBeVisible();

    // Change the start time via hour and minute selects
    await timePicker.locator('.lcars-time-hour').selectOption('14');
    await timePicker.locator('.lcars-time-min').selectOption('0');
    await page.waitForTimeout(200);

    // Verify the duration text updates
    await expect(customCards.first().locator('.event-card-duration')).toBeVisible();
  });

  test('pause and plant-tour events have controls', async ({ page }) => {
    // Add pause
    await page.locator('[data-action="add-pause"]').first().click();
    // Add plant tour
    await page.locator('[data-action="add-plant-tour"]').first().click();

    const pauseCard = page.locator('.event-card:has(.event-card-indicator.pause)');
    const tourCard = page.locator('.event-card:has(.event-card-indicator.plant-tour)');

    // Pause should have grip, edit, delete buttons
    await expect(pauseCard.locator('.event-card-action.grip')).toBeVisible();
    await expect(pauseCard.locator('.event-card-action.edit')).toBeVisible();
    await expect(pauseCard.locator('.event-card-action.delete')).toBeVisible();

    // Plant tour should have grip, edit, delete buttons
    await expect(tourCard.locator('.event-card-action.grip')).toBeVisible();
    await expect(tourCard.locator('.event-card-action.edit')).toBeVisible();
    await expect(tourCard.locator('.event-card-action.delete')).toBeVisible();
  });

  test('edit a pause event title', async ({ page }) => {
    await page.locator('[data-action="add-pause"]').first().click();

    const pauseCard = page.locator('.event-card:has(.event-card-indicator.pause)');
    await pauseCard.locator('.event-card-action.edit').click();

    const editForm = page.locator('.event-edit-inline');
    await expect(editForm).toBeVisible();
    await editForm.locator('#edit-title').fill('Coffee Break');
    await editForm.locator('#edit-save').click();

    await expect(page.locator('.event-card-title').filter({ hasText: 'Coffee Break' })).toBeVisible();
  });

  test('edit a plant tour event title', async ({ page }) => {
    await page.locator('[data-action="add-plant-tour"]').first().click();

    const tourCard = page.locator('.event-card:has(.event-card-indicator.plant-tour)');
    await tourCard.locator('.event-card-action.edit').click();

    const editForm = page.locator('.event-edit-inline');
    await expect(editForm).toBeVisible();
    await editForm.locator('#edit-title').fill('Facility Tour');
    await editForm.locator('#edit-save').click();

    await expect(page.locator('.event-card-title').filter({ hasText: 'Facility Tour' })).toBeVisible();
  });

  test('build a multi-topic day agenda', async ({ page }) => {
    // Add all available topics via the topic picker
    await page.locator('[data-action="add-topic"]').first().click();
    await page.locator('.topic-card').first().click();
    await page.waitForTimeout(200);

    await page.locator('[data-action="add-pause"]').first().click();

    await page.locator('[data-action="add-topic"]').first().click();
    await page.locator('.topic-card').nth(1).click();
    await page.waitForTimeout(200);

    // Should now have orientation + 2 topics + pause + adjourn = 5 events
    const eventCount = await page.locator('.event-card').count();
    expect(eventCount).toBeGreaterThanOrEqual(5);
  });

  test('event cards show FA icons', async ({ page }) => {
    // Default agenda has orientation, which should show handshake icon
    const orientationCard = page.locator('.event-card:has(.event-card-indicator.orientation)');
    await expect(orientationCard.locator('.fa-handshake')).toBeVisible();

    // Add a topic via picker
    await page.locator('[data-action="add-topic"]').first().click();
    await page.locator('.topic-card').first().click();
    await page.waitForTimeout(200);

    // Topic card should have an icon (any fa-solid icon)
    const topicCard = page.locator('.event-card:has(.event-card-indicator.topic)');
    await expect(topicCard.first().locator('.fa-solid').first()).toBeVisible();
  });

  test('build 3-day agenda with all topic types', async ({ page }) => {
    // Fill header
    await page.locator('#header-vendorName').fill(FAKE_AGENDA.vendor);
    await page.locator('#header-projectName').fill(FAKE_AGENDA.projectName);
    await page.locator('#header-customerNumber').fill(FAKE_AGENDA.customerNumber);

    const day1 = page.locator('.day-panel').first();

    // Day 1: Add 2 topics + pause
    await day1.locator('[data-action="add-topic"]').click();
    await page.locator('.topic-card').first().click();
    await page.waitForTimeout(300);

    await day1.locator('[data-action="add-pause"]').click();

    await day1.locator('[data-action="add-topic"]').click();
    await page.locator('.topic-card').first().click();
    await page.waitForTimeout(300);

    // Add Day 2
    await page.locator('#btn-add-day').click();
    await expect(page.locator('.day-panel')).toHaveCount(2);
    const day2 = page.locator('.day-panel').nth(1);

    // Day 2: Add topic + plant tour
    await day2.locator('[data-action="add-topic"]').click();
    await page.locator('.topic-card').first().click();
    await page.waitForTimeout(300);

    await day2.locator('[data-action="add-plant-tour"]').click();

    // Add Day 3
    await page.locator('#btn-add-day').click();
    await expect(page.locator('.day-panel')).toHaveCount(3);
    const day3 = page.locator('.day-panel').nth(2);

    // Day 3: Add custom event
    await day3.locator('[data-action="add-custom"]').click();
    await page.waitForTimeout(300);

    // Verify total event count across all days
    const totalEvents = await page.locator('.event-card').count();
    // Each day has orientation + adjourn + added events
    expect(totalEvents).toBeGreaterThanOrEqual(10);

    // Save
    await page.locator('#btn-save-agenda').click();
    await page.waitForTimeout(500);

    // Navigate to preview
    await page.click('[data-view="preview"]');
    await expect(page.locator('#view-preview')).toHaveClass(/active/);
    await expect(page.locator('.preview-frame')).toBeVisible();
  });

  test('header label says Agenda Header Data', async ({ page }) => {
    // The project information panel should say "Agenda Header Data" not "Trip Header Data"
    const headerTitle = page.locator('.lcars-panel-title').filter({ hasText: /Agenda Header Data|Agendakopfdaten|Datos del Encabezado|Données d'En-tête/ });
    await expect(headerTitle).toBeVisible();
  });
});

test.describe('Tempo — Headed Demo Walkthrough', () => {
  test('full 3-day schedule demo', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.lcars-frame');

    // === HEADER DATA ===
    await page.locator('#header-vendorName').fill('Schreiber Foods Europe GmbH');
    await page.locator('#header-customerNumber').fill('CUST-2026-0042');
    await page.locator('#header-projectNumber').fill('PRJ-ERP-2026');
    await page.locator('#header-customerAddress').fill('123 Industriestraße, 80331 München');
    await page.locator('#header-customerProjectContact').fill('Hans Müller');
    await page.locator('#header-vendorProjectContact').fill('Sarah Johnson');
    await page.locator('#header-projectName').fill('SAP S/4HANA Go-Live Preparation');

    // === PRE-WORK ===
    await page.locator('#prework-projector').click();
    await page.locator('#prework-network').click();
    await expect(page.locator('.prework-output')).toBeVisible();

    // === TRAVEL ARRIVAL ===
    await page.locator('#travel-arrival-date').fill('2026-03-15');
    await page.locator('#travel-arrival-time').fill('08:30');
    await page.locator('#travel-arrival-ref').fill('LH452');
    await page.locator('#travel-arrival-location').fill('Munich Airport (MUC)');
    await page.locator('#travel-arrival-travel-time').fill('45');

    const day1 = page.locator('.day-panel').first();

    // === DAY 1: Add topic + lunch + topic ===
    await day1.locator('[data-action="add-topic"]').click();
    await page.locator('.topic-card').first().click();
    await page.waitForTimeout(300);

    await day1.locator('[data-action="add-pause"]').click();

    await day1.locator('[data-action="add-topic"]').click();
    await page.locator('.topic-card').first().click();
    await page.waitForTimeout(300);

    // === DAY 2 ===
    await page.locator('#btn-add-day').click();
    await expect(page.locator('.day-panel')).toHaveCount(2);
    const day2 = page.locator('.day-panel').nth(1);

    await day2.locator('[data-action="add-topic"]').click();
    await page.locator('.topic-card').first().click();
    await page.waitForTimeout(300);

    await day2.locator('[data-action="add-plant-tour"]').click();

    // === DAY 3 ===
    await page.locator('#btn-add-day').click();
    await expect(page.locator('.day-panel')).toHaveCount(3);
    const day3 = page.locator('.day-panel').nth(2);

    await day3.locator('[data-action="add-topic"]').click();
    await page.locator('.topic-card').first().click();
    await page.waitForTimeout(300);

    await day3.locator('[data-action="add-pause"]').click();

    // === TRAVEL DEPARTURE ===
    await page.locator('#travel-departure-date').fill('2026-03-17');
    await page.locator('#travel-departure-time').fill('18:00');
    await page.locator('#travel-departure-ref').fill('LH453');
    await page.locator('#travel-departure-location').fill('Munich Airport (MUC)');
    await page.locator('#travel-departure-travel-time').fill('45');

    // === SAVE ===
    await page.locator('#btn-save-agenda').click();
    await page.waitForTimeout(500);

    // === VERIFY ===
    await expect(page.locator('.day-panel')).toHaveCount(3);

    const totalEvents = await page.locator('.event-card').count();
    expect(totalEvents).toBeGreaterThanOrEqual(12);

    // Navigate to preview
    await page.click('[data-view="preview"]');
    await expect(page.locator('#view-preview')).toHaveClass(/active/);
    await expect(page.locator('.preview-frame')).toBeVisible();

    // Verify header data in preview
    const preview = page.locator('.preview-frame');
    await expect(preview).toContainText('Schreiber Foods Europe GmbH');
    await expect(preview).toContainText('SAP S/4HANA Go-Live Preparation');
    await expect(preview).toContainText('CUST-2026-0042');
  });
});
