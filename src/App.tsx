import './style/App.css'
import useIntersectionObserver from './ts/useIntersectionObserver.ts'
import Navbar from "./componnents/Navbar.tsx"
import Footer from './componnents/Footer.tsx'
import Welcome from './componnents/Welcome.tsx';
import GameOption from './componnents/GameOption.tsx';
import GameInfo from './componnents/GameInfo.tsx';

function App() {
  useIntersectionObserver("fade-in");

  return (
    <>
      <header>
        <Navbar />
        <Welcome />
      </header>
      <GameOption />
      <GameInfo />
      <Footer />
    </>
  )
}

export default App
