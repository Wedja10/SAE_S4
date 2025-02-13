import { NavLink } from "react-router-dom";

const Game: React.FC = () => {
    return (
        <>
            <NavLink to="/" className="back-btn">
            Retour
            </NavLink>
        </>
    );
};

export default Game;
