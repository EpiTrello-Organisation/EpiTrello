import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TemplatesPage from './TemplatesPage';

vi.mock('../../components/TopBar/TopBar', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return { default: () => React.createElement('div', { 'data-testid': 'TopBar' }, 'TopBar') };
});

vi.mock('../../components/SideMenu/SideMenu', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return { default: () => React.createElement('div', { 'data-testid': 'SideMenu' }, 'SideMenu') };
});

describe('pages/TemplatesPage', () => {
  it('renders TopBar, SideMenu and an empty main region', () => {
    render(<TemplatesPage />);

    expect(screen.getByTestId('TopBar')).toBeTruthy();
    expect(screen.getByTestId('SideMenu')).toBeTruthy();

    const main = screen.getByRole('main');
    expect(main).toBeTruthy();
    expect(main.textContent ?? '').toBe('');
  });
});
