import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Panel, Badge, NoctraButton, EmptyState } from './Primitives';
import { Zap, AlertTriangle } from 'lucide-react';

describe('Primitives', () => {
  describe('Panel', () => {
    it('should render children', () => {
      render(<Panel>Test content</Panel>);
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should have correct styles', () => {
      const { container } = render(<Panel>Test</Panel>);
      const div = container.firstChild as HTMLElement;
      expect(div.style.background).toContain('var(--noctra-surface)');
    });

    it('should accept custom className', () => {
      const { container } = render(<Panel className="custom-class">Test</Panel>);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Badge', () => {
    it('should render children', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should apply custom styles', () => {
      render(<Badge style={{ background: 'red', color: 'white' }}>Styled</Badge>);
      const badge = screen.getByText('Styled');
      expect(badge.style.background).toBe('red');
      expect(badge.style.color).toBe('white');
    });
  });

  describe('NoctraButton', () => {
    it('should render with text', () => {
      render(<NoctraButton>Click me</NoctraButton>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render primary variant by default', () => {
      render(<NoctraButton>Primary</NoctraButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-[var(--noctra-cyan)]');
    });

    it('should render ghost variant', () => {
      render(<NoctraButton variant="ghost">Ghost</NoctraButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });

    it('should render with icon', () => {
      render(<NoctraButton icon={<Zap />}>With Icon</NoctraButton>);
      expect(screen.getByTestId('button-icon')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<NoctraButton disabled>Disabled</NoctraButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should handle click events', () => {
      const handleClick = vi.fn();
      render(<NoctraButton onClick={handleClick}>Click</NoctraButton>);
      screen.getByRole('button').click();
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('EmptyState', () => {
    it('should render title', () => {
      render(<EmptyState title="No items" />);
      expect(screen.getByText('No items')).toBeInTheDocument();
    });

    it('should render body text', () => {
      render(<EmptyState title="Title" body="Body text" />);
      expect(screen.getByText('Body text')).toBeInTheDocument();
    });

    it('should render icon', () => {
      render(<EmptyState title="Test" icon={<Zap data-testid="test-icon" />} />);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('should render action element', () => {
      render(
        <EmptyState title="Test" action={<button>Action</button>} />
      );
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });
});