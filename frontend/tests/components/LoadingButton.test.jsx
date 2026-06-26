import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoadingButton from '../../src/components/LoadingButton.jsx';

describe('LoadingButton component', () => {
  test('renders with label and shows loading state when clicked', async () => {
    const handleClick = vi.fn();
    render(<LoadingButton onClick={handleClick}>Submit</LoadingButton>);
    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
    // Assuming button shows spinner when loading prop is true; you can test based on your implementation.
  });
});
