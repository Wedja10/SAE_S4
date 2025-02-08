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
                    <li><a href="#">HOME</a></li>
                    <li><a href="#">PAGE</a></li>
                    <li><a href="#">PAGE</a></li>
                </ul>
            </nav>
        </>
    )
}

export default Navbar
