import { NavLink } from 'react-router-dom'
import '../style/Navbar.css'

function Navbar() {

    return (
        <>
            <nav className="fade-in">
                <ul className="nav-links">
                    <li><NavLink to="/">HOME</NavLink></li>
                    <li><NavLink to="/daily-challenge">DAILY</NavLink></li>
                </ul>
            </nav>
        </>
    )
}

export default Navbar
