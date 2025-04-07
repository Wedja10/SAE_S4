import { NavLink } from 'react-router-dom'
import '../style/Navbar.css'
import { useState } from 'react'

function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <>
            <nav className="fade-in">
                <div className="nav-container">
                    <div className="menu-toggle" onClick={toggleMenu}>
                        <div className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                    <ul className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
                        <li><NavLink to="/" onClick={() => setIsMenuOpen(false)}>HOME</NavLink></li>
                        <li><NavLink to="/daily-challenge" onClick={() => setIsMenuOpen(false)}>DAILY</NavLink></li>
                    </ul>
                </div>
            </nav>
        </>
    )
}

export default Navbar
