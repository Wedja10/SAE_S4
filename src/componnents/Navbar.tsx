import { NavLink } from 'react-router-dom'
import '../style/Navbar.css'

function Navbar() {

    return (
        <>
            <nav className="fade-in">
                <div className="menu-toggle">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                </div>
                <ul className="nav-links">
                    <li><NavLink to="/">HOME</NavLink></li>
                </ul>
            </nav>
        </>
    )
}

export default Navbar
