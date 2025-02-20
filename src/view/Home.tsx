import GameOption from "../componnents/home/GameOption.tsx";
import GameInfo from "../componnents/home/GameInfo.tsx";
import Footer from "../componnents/Footer.tsx";
import Welcome from "../componnents/home/Welcome.tsx";
import Navbar from "../componnents/Navbar.tsx";
import {PublicSaloonList} from "../componnents/home/PublicSaloon.tsx";

const Home: React.FC = () => {
    return (
        <>
            <header>
                <Navbar />
                <Welcome />
            </header>
            <GameOption />
            <GameInfo />
            <PublicSaloonList />
            <Footer />
        </>
    );
};

export default Home;
