// app.test.js
import React, { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from './App';

// test utils file
const renderWithRouter = (ui: ReactElement, { route = '/' } = {
}) => {
  window.history.pushState({
  }, 'Test page', route);

  return {
    ...render(ui, {
      wrapper: BrowserRouter,
    }),
  };
};

test('full app rendering/navigating', async () => {
  renderWithRouter(<App />);

  // verify page content for default route
  expect(screen.getByText(/Shabadkosh Login/i)).toBeInTheDocument();

  // verify page content for expected route after navigating
  // await user.click(screen.getByText(/about/i))
  // expect(screen.getByText(/you are on the about page/i)).toBeInTheDocument()
});

test('landing on a bad page, err 404', () => {
  const badRoute = '/unknown';

  // use <MemoryRouter> when you want to manually control the history
  render(
    <MemoryRouter initialEntries={[badRoute]}>
      <App />
    </MemoryRouter>,
  );

  // verify navigation to "no match" route
  expect(screen.getByText(/404 Not Found/i)).toBeInTheDocument();
});

test('rendering about page', () => {
  const badRoute = '/about';

  render(
    <MemoryRouter initialEntries={[badRoute]}>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByText(/About Shabadavali/i)).toBeInTheDocument();
});

test('words page takes back to login page', async () => {
  const route = '/words';

  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
});
