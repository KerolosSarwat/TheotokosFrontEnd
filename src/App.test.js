import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

test('renders learn react link', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  // The default test looks for "learn react", which is not in the app.
  // I'll change it to look for something that is in the app.
  // Since the app redirects to a login page, I'll look for "Sign In".
  const linkElement = screen.getByRole('button', { name: /Sign In/i });
  expect(linkElement).toBeInTheDocument();
});
