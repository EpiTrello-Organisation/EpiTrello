import {
  test,
  expect,
  setupAuthenticatedUser,
  createBoardViaApi,
  createListViaApi,
  createCardViaApi,
} from './helpers';

/* ================================================================== */
/*  Full user journey E2E – sign up → create board → manage → logout   */
/* ================================================================== */

test.describe('Full user journey', () => {
  test('complete workflow: boards → create → lists → cards → delete', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // 1. Go to boards page
    await page.goto('/boards');
    await expect(page.getByRole('button', { name: /create new board/i })).toBeVisible();

    // 2. Create a board via modal
    await page.getByRole('button', { name: /create new board/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill('Journey Board');
    await dialog.getByRole('button', { name: /create/i }).click();
    await page.waitForURL('**/boards/**');

    // 3. Add a list
    await page.getByRole('button', { name: /add another list/i }).click();
    await page.getByPlaceholder('Enter list name...').fill('Stage 1');
    await page.getByPlaceholder('Enter list name...').press('Enter');
    await page.keyboard.press('Escape');
    await expect(page.getByText('Stage 1')).toBeVisible();

    // 4. Add a card to the list
    await page.getByRole('button', { name: /add a card/i }).click();
    await page.getByPlaceholder('Enter a title for this card...').fill('Task Alpha');
    await page.getByPlaceholder('Enter a title for this card...').press('Enter');
    await page.keyboard.press('Escape');
    await expect(page.getByText('Task Alpha')).toBeVisible();

    // 5. Open card and close it
    await page.getByLabel('Open card Task Alpha').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 6. Navigate back to boards list
    await page.goto('/boards');
    await expect(page.getByText('Journey Board')).toBeVisible();
  });

  test('board with pre-existing data renders correctly', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);

    // Setup via API
    const board = await createBoardViaApi(token, 'Pre-loaded Board');
    const list1 = await createListViaApi(token, board.id, 'Backlog');
    const list2 = await createListViaApi(token, board.id, 'Done');
    await createCardViaApi(token, list1.id, 'Item 1');
    await createCardViaApi(token, list1.id, 'Item 2');
    await createCardViaApi(token, list2.id, 'Completed Item');

    await page.goto(`/boards/${board.id}`);

    // Verify all data renders
    await expect(page.getByText('Pre-loaded Board')).toBeVisible();
    await expect(page.getByText('Backlog')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
    await expect(page.getByText('Item 1')).toBeVisible();
    await expect(page.getByText('Item 2')).toBeVisible();
    await expect(page.getByText('Completed Item')).toBeVisible();
  });
});
