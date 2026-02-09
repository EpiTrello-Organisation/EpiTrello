import { test, expect, setupAuthenticatedUser, createBoardViaApi } from './helpers';

/* ================================================================== */
/*  Boards page E2E                                                    */
/* ================================================================== */

test.describe('Boards Page', () => {
  test('shows the boards page with create button', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/boards');

    await expect(page.getByRole('button', { name: /create new board/i })).toBeVisible();
  });

  test('displays boards owned by the user', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);

    // Create boards via API
    await createBoardViaApi(token, 'My Board Alpha');
    await createBoardViaApi(token, 'My Board Beta');

    await page.goto('/boards');

    await expect(page.getByText('My Board Alpha')).toBeVisible();
    await expect(page.getByText('My Board Beta')).toBeVisible();
  });

  test('creates a new board via the modal', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/boards');

    // Open the create board modal
    await page.getByRole('button', { name: /create new board/i }).click();

    // The modal should have a dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fill title
    const titleInput = dialog.getByRole('textbox');
    await titleInput.fill('Board From E2E');

    // Click Create
    await dialog.getByRole('button', { name: /create/i }).click();

    // Should navigate to the new board detail page
    await page.waitForURL('**/boards/**');
    expect(page.url()).toMatch(/\/boards\/.+/);
  });

  test('navigates to a board when clicking on it', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Clickable Board');

    await page.goto('/boards');
    await page.getByText('Clickable Board').click();

    await page.waitForURL(`**/boards/${board.id}`);
    expect(page.url()).toContain(board.id);
  });
});

/* ================================================================== */
/*  Other Boards page E2E                                              */
/* ================================================================== */

test.describe('Other Boards Page', () => {
  test('shows the other boards page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/other-boards');

    // The page should load without errors
    await expect(page.locator('main')).toBeVisible();
  });
});
