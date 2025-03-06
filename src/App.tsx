import './style/App.css';
import useIntersectionObserver from './ts/useIntersectionObserver.ts';
import AppRouter from "./AppRouter";
import { Toaster } from 'react-hot-toast';

function App() {
  useIntersectionObserver("fade-in");

  return (
    <>
      <Toaster position="top-center" />
      <AppRouter />
    </>
  );
}

export default App;
