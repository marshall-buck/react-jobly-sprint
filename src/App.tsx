import { BrowserRouter } from "react-router-dom";
import NavBar from "./navigation/NavBar";
import RoutesList from "./navigation/RoutesList";

import UserContext from "./context/UserContext";
import { useState, useEffect } from "react";
import JoblyApi from "./api";
import jwt_decode from "jwt-decode";
import {
  FormEditUser,
  FormLoginUser,
  FormSignupUser,
  TokenPayload,
  User,
} from "./interfaces";
import NavMenu from "./navigation/NavMenus";

interface UserStateInterface {
  data: User | null;
  isLoading?: boolean;
}

/** App Component
 *
 *
 *  App -> BrowserRouter -> (NavBar, RoutesList)
 */

function App() {
  const [user, setUser] = useState<UserStateInterface>({
    data: null,
    isLoading: true,
  });
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  /**
   *  Checks for token and hydrates user on load and when token is changed.
   */
  useEffect(
    function loadUserInfo() {
      async function getCurrentUser() {
        if (token) {
          try {
            const payload: TokenPayload = jwt_decode(token);
            JoblyApi.token = token;
            const response = await JoblyApi.getUserData(payload.username);

            setUser({ data: response, isLoading: false });
          } catch (err) {
            console.error("App loadUserInfo: problem loading", err);
            // TODO:Alert to log in again
            setToken(null);
            setUser({ data: null, isLoading: false });
          }
        } else {
          setUser({ data: null, isLoading: false });
        }
      }
      getCurrentUser();
    },
    [token]
  );

  /**
   * Handles user signup and sets token to Local Storage
   *
   * formData:
   * { username, password, firstName, lastName, email}
   */
  async function handleSignup(formData: FormSignupUser): Promise<void> {
    const token = await JoblyApi.handleSignup(formData);
    setToken(token);
    localStorage.setItem("token", token);
  }

  /**
   * Handles user login and sets token to Local Storage
   *
   * formData:
   * { username, password}
   */
  async function handleLogin(formData: FormLoginUser): Promise<void> {
    const token = await JoblyApi.loginUserApi(formData);
    setToken(token);
    localStorage.setItem("token", token);
  }

  /**
   * Clears state, token and local storage
   *
   */
  function handleLogout(): void {
    setToken(null);
    setUser({ data: null, isLoading: false });
    JoblyApi.token = null;
    localStorage.removeItem("token");
  }

  /**
   * Updates state with new user info
   *
   * formData:
   * { firstName,lastName,email}
   */
  async function handleEditForm(formData: FormEditUser): Promise<void> {
    const response = await JoblyApi.handleEditForm(formData);
    setUser((user) => {
      return {
        ...user,
        data: response,
      };
    });
  }

  /**
   * waiting for user data to hydrate
   */

  if (user.isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p className="text-4xl text-black">Loading...</p>;
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user: user.data, token }}>
      <div className="drawer" data-theme="light">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col bg-base-300">
          <NavBar handleLogout={handleLogout} />

          {/* <!-- Page content here --> */}
          <div>
            <RoutesList
              handleSignup={handleSignup}
              handleLogin={handleLogin}
              handleEditForm={handleEditForm}
            />
          </div>
        </div>
        {/* TODO: extract */}
        <div className="drawer-side">
          <label htmlFor="my-drawer" className="drawer-overlay"></label>
          <ul className="menu p-4 overflow-y-auto w-80 bg-base-100">
            {/* <!-- Sidebar content here --> */}
            <NavMenu handleLogout={handleLogout} />
          </ul>
        </div>
      </div>
    </UserContext.Provider>
  );
}

export default App;
