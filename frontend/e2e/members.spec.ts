import {
  test,
  expect,
  setupAuthenticatedUser,
  createBoardViaApi,
  uniqueEmail,
  registerViaApi,
} from './helpers';

/* ================================================================== */
/*  Members & Share E2E                                                */
/* ================================================================== */

test.describe('Board sharing', () => {
  test('opens the share modal from the board top bar', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Share Board');

    await page.goto(`/boards/${board.id}`);

    // Click Share button
    const shareBtn = page.getByRole('button', { name: /share/i });
    await shareBtn.click();

    // The share modal should appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });

  test('adds a member to the board', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Add Member Board');

    // Register a second user to invite
    const inviteeEmail = uniqueEmail('invite');
    await registerViaApi({
      email: inviteeEmail,
      username: `invitee_${Date.now()}`,
      password: 'Password123!',
    });

    await page.goto(`/boards/${board.id}`);

    // Open Share modal
    await page.getByRole('button', { name: /share/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Type the email and share
    const emailInput = dialog.getByRole('textbox');
    await emailInput.fill(inviteeEmail);
    await dialog.getByRole('button', { name: 'Share', exact: true }).click();

    // The member list should now contain 2 entries (owner + invitee)
    await expect(dialog.getByRole('listitem')).toHaveCount(2, { timeout: 10000 });
  });

  test('shows error when sharing with non-existent user', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Bad Share Board');

    await page.goto(`/boards/${board.id}`);

    await page.getByRole('button', { name: /share/i }).click();
    const dialog = page.getByRole('dialog');

    const emailInput = dialog.getByRole('textbox');
    await emailInput.fill('nobody-exists@nowhere.com');
    await dialog.getByRole('button', { name: 'Share', exact: true }).click();

    // Should show an error
    await expect(dialog.getByText('User not found')).toBeVisible({ timeout: 5000 });
  });
});

/* ================================================================== */
/*  Navigation E2E                                                     */
/* ================================================================== */

test.describe('Navigation', () => {
  test('side menu navigates between boards and other boards', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/boards');

    // Click "Other boards" in side menu
    const otherBoardsLink = page.getByRole('link', { name: /other boards/i });
    if (await otherBoardsLink.isVisible()) {
      await otherBoardsLink.click();
      await page.waitForURL('**/other-boards');
      expect(page.url()).toContain('/other-boards');

      // Go back to My boards
      const myBoardsLink = page.getByRole('link', { name: /my boards|boards/i }).first();
      await myBoardsLink.click();
      await page.waitForURL('**/boards');
    }
  });

  test('TopBar is visible on boards page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/boards');

    // The TopBar should have recognizable elements
    await expect(page.getByText(/epitrello/i)).toBeVisible();
  });

  test('logout redirects to login', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/boards');

    // Open profile menu
    const profileBtn = page.getByRole('button', { name: /profile|account|avatar/i });
    if (await profileBtn.isVisible()) {
      await profileBtn.click();

      const logoutBtn = page.getByRole('button', { name: /log ?out|sign ?out/i });
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForURL('**/login');
        expect(page.url()).toContain('/login');
      }
    }
  });
});
