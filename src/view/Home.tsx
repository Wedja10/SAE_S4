import GameOption from "../componnents/GameOption.tsx";
import GameInfo from "../componnents/GameInfo.tsx";
import Footer from "../componnents/Footer.tsx";
import Welcome from "../componnents/Welcome.tsx";
import Navbar from "../componnents/Navbar.tsx";

const Home: React.FC = () => {
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
    );
};

export default Home;
