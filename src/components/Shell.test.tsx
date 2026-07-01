import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Shell } from './Shell';

describe('Shell', () => {
  it('renders two regions: graph canvas and detail pane', () => {
    render(<Shell />);
    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('detail-pane')).toBeInTheDocument();
  });
});
