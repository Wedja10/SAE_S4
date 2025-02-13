import GameOption from "../componnents/home/GameOption.tsx";
import GameInfo from "../componnents/home/GameInfo.tsx";
import Footer from "../componnents/home/Footer.tsx";
import Welcome from "../componnents/home/Welcome.tsx";
import Navbar from "../componnents/home/Navbar.tsx";

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
