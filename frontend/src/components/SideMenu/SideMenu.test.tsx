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

    const boardsLink = screen.getByRole('link', { name: /boards/i });
    const templatesLink = screen.getByRole('link', { name: /templates/i });

    expect(boardsLink).toHaveAttribute('href', '/boards');
    expect(templatesLink).toHaveAttribute('href', '/templates');
  });

  it('marks Boards link as active when route is /boards', () => {
    renderWithRoute('/boards');

    const boardsLink = screen.getByRole('link', { name: /boards/i });
    const templatesLink = screen.getByRole('link', { name: /templates/i });

    expect(boardsLink.classList.contains(styles.active)).toBe(true);
    expect(templatesLink.classList.contains(styles.active)).toBe(false);
  });

  it('marks Templates link as active when route is /templates', () => {
    renderWithRoute('/templates');

    const boardsLink = screen.getByRole('link', { name: /boards/i });
    const templatesLink = screen.getByRole('link', { name: /templates/i });

    expect(templatesLink.classList.contains(styles.active)).toBe(true);
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
