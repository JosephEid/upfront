import Header from './components/Header/Header';
import Home from './components/Home/Home';
import Container from 'react-bootstrap/Container';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Header />
      </header>
      <main>
        <Container>
          <Home />
        </Container>
      </main>
    </div>
  );
}

export default App;
