import {
  test,
  expect,
  setupAuthenticatedUser,
  createBoardViaApi,
  createListViaApi,
} from './helpers';

/* ================================================================== */
/*  Lists E2E – CRUD operations on lists                               */
/* ================================================================== */

test.describe('List operations', () => {
  test('renames a list', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Rename List Board');
    await createListViaApi(token, board.id, 'Old List');

    await page.goto(`/boards/${board.id}`);

    // Click the list title to enter edit mode
    const titleBtn = page.getByLabel('Edit list title');
    await titleBtn.click();

    const input = page.getByLabel('Edit list title');
    await input.fill('Renamed List');
    await input.press('Enter');

    await expect(page.getByText('Renamed List')).toBeVisible();
  });

  test('deletes a list', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Delete List Board');
    await createListViaApi(token, board.id, 'Dying List');

    await page.goto(`/boards/${board.id}`);

    // Open list menu (use getByLabel to avoid dnd-kit wrapper duplicate)
    const menuBtn = page.getByLabel('List menu');
    await menuBtn.click();

    // Click delete inside the menu
    await page.getByRole('button', { name: 'Delete List', exact: true }).click();

    await expect(page.getByText('Dying List')).not.toBeVisible();
  });

  test('creates multiple lists', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Multi List Board');

    await page.goto(`/boards/${board.id}`);

    const addListBtn = page.getByRole('button', { name: /add another list/i });

    // Create first list
    await addListBtn.click();
    const input = page.getByPlaceholder('Enter list name...');
    await input.fill('List 1');
    await input.press('Enter');

    // Create second list
    await page.getByPlaceholder('Enter list name...').fill('List 2');
    await page.getByPlaceholder('Enter list name...').press('Enter');

    // Press Escape to close composer
    await page.keyboard.press('Escape');

    // Both should be visible
    await expect(page.getByText('List 1')).toBeVisible();
    await expect(page.getByText('List 2')).toBeVisible();
  });
});
