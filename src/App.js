import Header from './components/Header/Header';
import Home from './components/Home/Home';
import './App.css';

function App() {
  const screenHeight = window.innerHeight

  return (
    <div className="App">
        <Header />
      <main style={{ height: `${screenHeight}px` }}>
        <Home />
      </main>
    </div>
  );
}

export default App;
