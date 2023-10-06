import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserAuth } from './UserAuthContext';
import routes from './constants/routes';
import roles from './constants/roles';

const ProtectedRoute = ({ children }: { children:JSX.Element }) => {
  const { user } = useUserAuth();

  if (user === null) {
    return <Navigate to={routes.login} />;
  }
  if (user.role === roles.unassigned) {
    return <Navigate to={routes.noAccess} />;
  }
  return children;
};

export default ProtectedRoute;
