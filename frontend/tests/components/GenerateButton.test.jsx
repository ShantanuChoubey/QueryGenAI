import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GenerateButton from '../../src/components/GenerateButton.jsx';

describe('GenerateButton component', () => {
  test('renders with provided label and calls onClick', async () => {
    const handleClick = vi.fn();
    render(<GenerateButton onClick={handleClick}>Generate</GenerateButton>);
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('displays loading indicator when isLoading prop is true', () => {
    render(<GenerateButton isLoading={true} />);
    // Loading text should be present
    const loadingText = screen.getByText(/generating sql/i);
    expect(loadingText).toBeInTheDocument();
    // Button should be disabled while loading
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
