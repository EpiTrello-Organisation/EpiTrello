import {
  test,
  expect,
  setupAuthenticatedUser,
  createBoardViaApi,
  createListViaApi,
  createCardViaApi,
} from './helpers';

/* ================================================================== */
/*  Board Detail (kanban) E2E                                          */
/* ================================================================== */

test.describe('Board Detail Page', () => {
  test('shows the board title and kanban area', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Detail Board');

    await page.goto(`/boards/${board.id}`);

    // Board title should be visible in the top bar
    await expect(page.getByText('Detail Board')).toBeVisible();
  });

  test('displays existing lists and cards', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Lists Board');
    const list = await createListViaApi(token, board.id, 'To Do');
    await createCardViaApi(token, list.id, 'First Task');
    await createCardViaApi(token, list.id, 'Second Task');

    await page.goto(`/boards/${board.id}`);

    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('First Task')).toBeVisible();
    await expect(page.getByText('Second Task')).toBeVisible();
  });

  test('adds a new list', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Add List Board');

    await page.goto(`/boards/${board.id}`);

    // Click "Add another list" button
    const addListBtn = page.getByRole('button', { name: /add another list/i });
    await addListBtn.click();

    // Fill the list name input
    const input = page.getByPlaceholder('Enter list name...');
    await input.fill('New List');
    await input.press('Enter');

    // The new list should appear
    await expect(page.getByText('New List')).toBeVisible();
  });

  test('adds a card to a list', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Add Card Board');
    await createListViaApi(token, board.id, 'Backlog');

    await page.goto(`/boards/${board.id}`);

    // Click "Add a card" button
    const addCardBtn = page.getByRole('button', { name: /add a card/i });
    await addCardBtn.click();

    // Fill the card title
    const input = page.getByPlaceholder('Enter a title for this card...');
    await input.fill('My New Card');
    await input.press('Enter');

    await expect(page.getByText('My New Card')).toBeVisible();
  });

  test('opens a card modal when clicking a card', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Modal Board');
    const list = await createListViaApi(token, board.id, 'In Progress');
    await createCardViaApi(token, list.id, 'Card To Open');

    await page.goto(`/boards/${board.id}`);

    // Click the card
    await page.getByLabel('Open card Card To Open').click();

    // Modal should appear (dialog role)
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Card To Open')).toBeVisible();
  });

  test('renames a board via the top bar', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'Old Name');

    await page.goto(`/boards/${board.id}`);

    // Click the board title to enter edit mode
    const titleButton = page.getByLabel('Edit board title');
    await titleButton.click();

    // The input should appear – clear it and type new name
    const input = page.getByLabel('Edit board title');
    await input.fill('Renamed Board');
    await input.press('Enter');

    await expect(page.getByText('Renamed Board')).toBeVisible();
  });

  test('deletes a board and navigates back to boards', async ({ page }) => {
    const { token } = await setupAuthenticatedUser(page);
    const board = await createBoardViaApi(token, 'To Delete');

    await page.goto(`/boards/${board.id}`);

    // Open the board menu
    const menuBtn = page.getByRole('button', { name: 'Board menu' });
    await menuBtn.click();

    // Click delete
    const deleteBtn = page.getByRole('button', { name: /delete board/i });
    await deleteBtn.click();

    // Should navigate back to /boards
    await page.waitForURL('**/boards');
    expect(page.url()).toMatch(/\/boards\/?$/);
  });
});
