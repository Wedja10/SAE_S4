import '../../style/Footer.css'

function Footer() {

    return (
        <>
            <footer className="fade-in" id="contact">
                <div className="footer-container">
                    <div className="footer-section">
                        <h3>À propos</h3>
                        <p>Ce site a été développer par :</p> <br />
                            <ul>
                                <li>Abdelrmb (<a href="https://github.com/AbdelRMB" target="_blank">Github</a>, <a
                                    href="https://abdelrahimriche.com" target="_blank">Portfolio</a>)</li>
                                <li>Jawed (<a href="https://github.com/Wedja10" target="_blank">Github</a>, <a href="#"
                                    target="_blank">Portfolio</a>)</li>
                                <li>Victor (<a href="#" target="_blank">Github</a>, <a href="#" target="_blank">Portfolio</a>)</li>
                                <li>Andrei (<a href="#" target="_blank">Github</a>, <a href="#" target="_blank">Portfolio</a>)</li>
                            </ul>
                    </div>
                    <div className="footer-section">
                        <h3>Mentions Légales</h3>
                        <ul>
                            <li><a href="#">Mentions légales</a></li>
                            <li><a href="#">Conditions générales d'utilisation</a></li>
                            <li><a href="#">Politique de confidentialité</a></li>
                            <li><a href="#">Cookies</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h3>Contact</h3>
                        <p>Email : <a href="#">contact.example@gmail.com</a></p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2025 SAE S4. Tous droits réservés.</p>
                </div>
            </footer>
        </>
    )
}

export default Footer
