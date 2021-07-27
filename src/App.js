import Header from './components/Header/Header';
import Home from './components/Home/Home';
import Jobs from './components/Jobs/Jobs';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import './App.css';
import { Jumbotron } from 'react-bootstrap';

import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'

function App() {
  const screenHeight = window.innerHeight

  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <main style={{ height: `${screenHeight}px` }}>
        {/* <AmplifySignOut /> */}

          <Jumbotron>
            <Switch>
              <Route path="/jobs">
                <Jobs />
              </Route>
              <Route path="/">
                <Home />
              </Route>
            </Switch>
          </Jumbotron>
        </main>
      </div>
    </BrowserRouter>
    
  );
}

// export default withAuthenticator(App);
export default App;
