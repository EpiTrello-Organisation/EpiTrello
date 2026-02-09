import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SideMenu from './SideMenu';
import styles from './SideMenu.module.css';

function renderWithRoute(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <SideMenu />
    </MemoryRouter>,
  );
}

describe('components/SideMenu', () => {
  it('renders sidebar with navigation links', () => {
    renderWithRoute('/');

    const aside = screen.getByLabelText(/sidebar/i);
    expect(aside).toBeTruthy();

    const boardsLink = screen.getByRole('link', { name: /^boards$/i });
    const otherBoardsLink = screen.getByRole('link', { name: /^other boards$/i });

    expect(boardsLink).toHaveAttribute('href', '/boards');
    expect(otherBoardsLink).toHaveAttribute('href', '/other-boards');
  });

  it('marks Boards link as active when route is /boards', () => {
    renderWithRoute('/boards');

    const boardsLink = screen.getByRole('link', { name: /^boards$/i });
    const otherBoardsLink = screen.getByRole('link', { name: /^other boards$/i });

    expect(boardsLink.classList.contains(styles.active)).toBe(true);
    expect(otherBoardsLink.classList.contains(styles.active)).toBe(false);
  });

  it('marks Other Boards link as active when route is /other-boards', () => {
    renderWithRoute('/other-boards');

    const boardsLink = screen.getByRole('link', { name: /^boards$/i });
    const otherBoardsLink = screen.getByRole('link', { name: /^other boards$/i });

    expect(otherBoardsLink.classList.contains(styles.active)).toBe(true);
    expect(boardsLink.classList.contains(styles.active)).toBe(false);
  });

  it('renders aria-hidden icons (span + svg)', () => {
    const { container } = renderWithRoute('/boards');

    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBeGreaterThanOrEqual(4);

    const links = screen.getAllByRole('link');
    for (const link of links) {
      expect(link.querySelector('span[aria-hidden="true"]')).toBeTruthy();
    }
  });
});
