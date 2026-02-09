import {
  test,
  expect,
  setupAuthenticatedUser,
  createBoardViaApi,
  createListViaApi,
  createCardViaApi,
} from './helpers';

/* ================================================================== */
/*  Cards E2E – CRUD operations on cards                               */
/* ================================================================== */

test.describe('Card operations', () => {
  test('creates multiple cards in order', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Multi Card Board');
    await createListViaApi(token, board.id, 'Todo');

    await page.goto(`/boards/${board.id}`);

    const addCardBtn = page.getByRole('button', { name: /add a card/i });

    // Add first card
    await addCardBtn.click();
    const input = page.getByPlaceholder('Enter a title for this card...');
    await input.fill('Card A');
    await input.press('Enter');

    // Composer closes after submit — wait for card to appear, then re-open
    await expect(page.getByLabel('Open card Card A')).toBeVisible();
    await page.getByRole('button', { name: /add a card/i }).click();
    await page.getByPlaceholder('Enter a title for this card...').fill('Card B');
    await page.getByPlaceholder('Enter a title for this card...').press('Enter');

    // Both cards should be visible
    await expect(page.getByLabel('Open card Card A')).toBeVisible();
    await expect(page.getByLabel('Open card Card B')).toBeVisible();
  });

  test('renames a card via the card modal', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Rename Card Board');
    const list = await createListViaApi(token, board.id, 'List');
    await createCardViaApi(token, list.id, 'Original Title');

    await page.goto(`/boards/${board.id}`);
    await page.getByLabel('Open card Original Title').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Click the card title to edit it
    const titleBtn = dialog.getByLabel('Edit card title');
    await titleBtn.click();

    const titleInput = dialog.getByLabel('Edit card title');
    await titleInput.fill('Updated Title');
    await titleInput.press('Enter');

    await expect(dialog.getByText('Updated Title')).toBeVisible();
  });

  test('deletes a card via the card modal', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Delete Card Board');
    const list = await createListViaApi(token, board.id, 'List');
    await createCardViaApi(token, list.id, 'Doomed Card');

    await page.goto(`/boards/${board.id}`);
    await page.getByLabel('Open card Doomed Card').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Open the card menu and delete
    const menuBtn = dialog.getByRole('button', { name: 'Card menu' });
    await menuBtn.click();
    await dialog.getByRole('button', { name: /delete card/i }).click();

    // Modal should close and card should be gone
    await expect(dialog).not.toBeVisible();
    await expect(page.getByLabel('Open card Doomed Card')).not.toBeVisible();
  });

  test('closes card modal with Escape', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Escape Modal Board');
    const list = await createListViaApi(token, board.id, 'List');
    await createCardViaApi(token, list.id, 'Press Escape');

    await page.goto(`/boards/${board.id}`);
    await page.getByLabel('Open card Press Escape').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('toggles labels on a card', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Labels Board');
    const list = await createListViaApi(token, board.id, 'List');
    await createCardViaApi(token, list.id, 'Label Card');

    await page.goto(`/boards/${board.id}`);
    await page.getByLabel('Open card Label Card').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Click "Labels" button to open the labels popover
    const labelsBtn = dialog.getByRole('button', { name: /labels/i });
    await labelsBtn.click();

    // The labels popover should appear – click a label
    const labelCheckbox = page.locator('[role="dialog"] input[type="checkbox"]').first();
    if (await labelCheckbox.isVisible()) {
      await labelCheckbox.click();
      // Close the popover
      await page.keyboard.press('Escape');
    }
  });
});
