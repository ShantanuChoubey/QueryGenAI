import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthInput from '../../src/components/AuthInput.jsx';

describe('AuthInput component', () => {
  test('renders with placeholder and calls onChange for each keystroke', async () => {
    const handleChange = vi.fn();
    render(<AuthInput placeholder='Email' value='' onChange={handleChange} />);
    const input = screen.getByPlaceholderText('Email');
    expect(input).toBeInTheDocument();
    const typedText = 'test@example.com';
    await userEvent.type(input, typedText);
    // Since component is controlled, value remains empty
    expect(input).toHaveValue('');
    // onChange should be called for each character typed
    expect(handleChange).toHaveBeenCalledTimes(typedText.length);
  });
});
