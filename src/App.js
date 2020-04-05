import React, { useEffect, useState } from "react";
import "./App.css";
import Amplify, { Auth } from "aws-amplify";
import { Route, BrowserRouter as Router, Switch } from "react-router-dom";

// Need to supply the https url on which cognito will redirect to after login
// This must be registered in the client config in AWS. Note it allows localhost to be http
const appUrl = process.env.PUBLIC_URL || window.location.origin;
const signoutPath = "/signout";

Amplify.configure({
  Auth: {
    region: "ap-southeast-2",
    userPoolId: "ap-southeast-2_umdJr06I3",
    userPoolWebClientId: "6l4c1mdr5mhqaiqbcdgoob7s06",
    mandatorySignIn: true,
    oauth: {
      domain: "up-education-test.auth.ap-southeast-2.amazoncognito.com",
      scopes: [
        "phone",
        "email",
        "profile",
        "openid",
        "aws.cognito.signin.user.admin",
      ],
      redirectSignIn: appUrl, // cognito redirects to this on login
      redirectSignOut: appUrl + signoutPath, // if you want to route to a special signout
      responseType: "token",
    },
  },
});

/**
 * Page displayed when (explicitly) signed out
 */
const SignedoutPage = () => {
  console.log("signed out");
  return <div>You are signed out</div>;
};

/**
 * Normal page
 */
const HomePage = ({ userInfo, alwaysLogin }) => {
  useEffect(() => {
    if (alwaysLogin && !userInfo) {
      Auth.federatedSignIn()
    }
  }, [userInfo,alwaysLogin]);
  return (
    <div>
      {userInfo ? (
        <p>
          Signed in user:{userInfo.username} email:
          {userInfo.attributes.email}
        </p>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  );
};

function App() {
  const [userInfo, setUserInfo] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * On intial mount we see if there's already a login and get info for display, this will
     * either be browser navigate/refresh or a redirect from cognito. Amplify stores the current login
     * info in Local Storage
     */
    Auth.currentAuthenticatedUser({
      bypassCache: false,
    })
      /**
       * Obtain and store the authenticated session info in a state variable - in a real app you might want to dispatch this
       * into your redux store so other bits of the app can depend on it, or continue with afetch of profile info etc
       * userInfo.signInUserSession.accessToken.jwtToken is signed token for API Calls
       * Note if the user as previously signed it and not out, it won't prompt, just pull info from localStorage
       */
      .then((user) => setUserInfo(user))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div>
          {!!userInfo ? (
            <button onClick={() => Auth.signOut()}>Sign Out</button>
          ) : (
            <div>
              <button onClick={() => Auth.federatedSignIn()}>Sign In</button>
            </div>
          )}
        </div>
      </header>
      <Router>
        <Switch>
          <Route path={signoutPath}>
            <SignedoutPage />
          </Route>
          <Route exact path="/">
            {!loading && <HomePage userInfo={userInfo} alwaysLogin />}
            
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
