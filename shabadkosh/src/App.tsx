import React, { Suspense } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Navigate, Route, Routes,
} from 'react-router-dom';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import NavBar from './components/navbar/NavBar';
import { UserAuthContextProvider } from './components/UserAuthContext';
import Login from './components/auth/Login';
import Logout from './components/auth/Logout';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import About from './components/about/About';
import Contact from './components/contact/Contact';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/home/Home';
import Search from './components/search/Search';
import Profile from './components/user/Profile';
import ViewDictionary from './components/words/ViewDictionary';
import WordDetail from './components/words/WordDetail';
import AddWord from './components/words/AddWord';
import EditWord from './components/words/EditWord';
import Users from './components/user/Users';
import AddWordlist from './components/wordlists/AddWordlist';
import Wordlists from './components/wordlists/Wordlists';
import EditWordlist from './components/wordlists/EditWordlist';
import ViewWordlist from './components/wordlists/ViewWordlist';
import EditUser from './components/user/EditUser';
import en from './components/constants/locales/en';
import routes from './components/constants/routes';
import NoAccess from './components/NoAccess';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        ...en,
      },
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export const App = () => {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<h2>{t('LOADING')}</h2>}>
      <div className="App">
        <UserAuthContextProvider>
          <div>
            <NavBar />
            <Routes>
              <Route path={routes.login} element={<Login />} />

              {/* auth */}
              <Route path={routes.login2} element={<Login />} />
              <Route path={routes.forgotPassword} element={<ForgotPassword />} />
              <Route path={routes.logout} element={<Logout />} />
              <Route path={routes.signup} element={<Signup />} />

              {/* general */}
              <Route path={routes.about} element={<About />} />
              <Route path={routes.contact} element={<Contact />} />

              {/* Protected ie AuthNeeded */}
              <Route
                path={routes.home}
                element={(
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                )}
              />

              <Route
                path={routes.search}
                element={(
                  <ProtectedRoute>
                    <Search />
                  </ProtectedRoute>
                )}
              />

              {/* user */}
              <Route
                path={routes.profile}
                element={(
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                )}
              />
              <Route
                path={routes.users}
                element={(
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                )}
              />
              <Route
                path={routes.editUser}
                element={(
                  <ProtectedRoute>
                    <EditUser />
                  </ProtectedRoute>
                )}
              />

              {/* words */}
              <Route
                path={routes.words}
                element={(
                  <ProtectedRoute>
                    <ViewDictionary />
                  </ProtectedRoute>
                )}
              />

              <Route
                path={routes.word}
                element={(
                  <ProtectedRoute>
                    <WordDetail />
                  </ProtectedRoute>
                )}
              />

              <Route
                path={routes.newWord}
                element={(
                  <ProtectedRoute>
                    <AddWord />
                  </ProtectedRoute>
                )}
              />
              <Route
                path={routes.editWord}
                element={(
                  <ProtectedRoute>
                    <EditWord />
                  </ProtectedRoute>
                )}
              />

              {/* wordlists */}
              <Route
                path={routes.wordlists}
                element={(
                  <ProtectedRoute>
                    <Wordlists />
                  </ProtectedRoute>
                )}
              />

              <Route
                path={routes.wordlist}
                element={(
                  <ProtectedRoute>
                    <ViewWordlist />
                  </ProtectedRoute>
                )}
              />

              <Route
                path={routes.newWordlist}
                element={(
                  <ProtectedRoute>
                    <AddWordlist />
                  </ProtectedRoute>
                )}
              />

              <Route
                path={routes.editWordlist}
                element={(
                  <ProtectedRoute>
                    <EditWordlist />
                  </ProtectedRoute>
                )}
              />

              {/* No Access */}
              <Route path='/no-access' element={<NoAccess />} />

              {/* The 404 page */}
              <Route path="*" element={<Navigate to={routes.words} />} />
            </Routes>
          </div>
        </UserAuthContextProvider>
      </div>
    </Suspense>
  );
};

export default App;
