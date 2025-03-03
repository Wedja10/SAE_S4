import './style/App.css';
import useIntersectionObserver from './ts/useIntersectionObserver.ts';
import AppRouter from "./AppRouter";

function App() {
  useIntersectionObserver("fade-in");

  return (
    <AppRouter />
  );
}

export default App;
