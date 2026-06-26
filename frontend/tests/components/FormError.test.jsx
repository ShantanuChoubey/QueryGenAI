import { render, screen } from '@testing-library/react';
import FormError from '../../src/components/FormError.jsx';

describe('FormError component', () => {
  test('displays error message when provided', () => {
    const message = 'Invalid credentials';
    render(<FormError message={message} />);
    const errorEl = screen.getByText(message);
    expect(errorEl).toBeInTheDocument();
  });
});
