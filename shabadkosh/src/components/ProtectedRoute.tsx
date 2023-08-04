import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserAuth } from './UserAuthContext';
import routes from './constants/routes';

const ProtectedRoute = ({ children }: { children:JSX.Element }) => {
  const { user } = useUserAuth();

  if (user === null) {
    return <Navigate to={routes.login} />;
  }
  return children;
};

export default ProtectedRoute;
