import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NaturalLanguageInput from '../../src/components/NaturalLanguageInput.jsx';

describe('NaturalLanguageInput component', () => {
  test('renders with placeholder', () => {
    render(<NaturalLanguageInput placeholder="Enter query" />);
    const input = screen.getByPlaceholderText(/enter query/i);
    expect(input).toBeInTheDocument();
  });

  test('calls onChange when typing', async () => {
    const onChange = vi.fn();
    render(<NaturalLanguageInput onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'select * from users');
    expect(onChange).toHaveBeenCalled();
  });
});
