import './style/App.css'
import useIntersectionObserver from './ts/useIntersectionObserver.ts'
import Navbar from "./componnents/Navbar.tsx"
import Footer from './componnents/Footer.tsx'

function GameDashboard() {
    useIntersectionObserver("fade-in");

    return (
        <>
            <header>
                <Navbar />
            </header>

            <Footer />
        </>
    )
}

export default GameDashboard