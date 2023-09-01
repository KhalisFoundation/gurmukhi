import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../components/UserAuthContext';
import Home from '../components/home/Home';

// Mock the useUserAuth hook
jest.mock('../components/UserAuthContext', () => ({
  useUserAuth: jest.fn(),
}));

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('Home Component', () => {
  test('renders user name and logout button', async () => {
    // Mock user data for the test
    const mockUser = { displayName: 'John Doe' };
    const mockLogOut = jest.fn();
    const mockNavigate = jest.fn();
    // Mock useUserAuth and useNavigate hooks
    (useUserAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logOut: mockLogOut,
    });

    // Render the component
    const { getByText } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    // Assert that user's name and logout button are rendered
    expect(getByText(/John Doe/i)).toBeInTheDocument();
    expect(getByText(/LOGOUT/i)).toBeInTheDocument();
  });

  test('calls logOut and navigates to login on button click', async () => {
    const mockLogOut = jest.fn();
    const mockNavigate = jest.fn();

    // Mock useUserAuth and useNavigate hooks
    (useUserAuth as jest.Mock).mockReturnValue({ logOut: mockLogOut });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    // Render the component
    const screen = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    // Click the logout button
    const logoutButton = screen.getByText(/LOGOUT/i);
    fireEvent.click(logoutButton);

    // Assert that logOut function was called and navigation occurred
    expect(mockLogOut).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login'); // Adjust the route as needed
  });
});
