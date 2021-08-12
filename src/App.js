import Header from './components/Header/Header';
import Home from './components/Home/Home';
import CreatePosting from './components/CreatePosting/CreatePosting';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { Jumbotron } from 'react-bootstrap';

import './App.css';

function App() {
  const screenHeight = window.innerHeight

  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <main style={{ height: `${screenHeight}px` }}>
          <Jumbotron>
            <Switch>
              <Route path="/createPosting">
                <CreatePosting />
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

export default App;
