import '../../style/home/PublicSaloon.css'
import { useEffect, useState } from "react";
import "../../backend/services/apiService.js";
import { postRequest } from "../../backend/services/apiService.js";
import { getApiUrl } from "../../utils/config";
import {NavLink} from "react-router-dom";

import paginationEnd from "../../../public/assets/icons/paginationEnd.svg"
import paginationNext from "../../../public/assets/icons/paginationNext.svg"
import paginationPrevious from "../../../public/assets/icons/paginationPrevious.svg"
import paginationStart from "../../../public/assets/icons/paginationStart.svg"

interface Game {
    code: string;
    name: string;
    number: number;
    max_players: number;
}


export const PublicSaloonTicket = (props: {saloonName: string, players: number, maxPlayers: number, code: string}) => {
    return (
        <NavLink
            to={`/lobby/${props.code}`}
            className="PublicSaloonTicket"
        >
              <img className={"ticketImg"} src={'/public/assets/PublicSaloonTicket.png'} alt="Ticket" />
              <p className={"saloonName"}>{props.saloonName}</p>
              <p className={"players"}>{props.players + "/" + props.maxPlayers}</p>
              <p className={"code"}>{props.code}</p>

        </NavLink>
  )
}

export const PublicSaloonList = () => {
    const [games, setGames] = useState<Game[]>([]);

    const fetchPublicGames = async () => {
        const data = await postRequest(getApiUrl('/games/public-games'), {});

        const gamesFormatted = data.map((game: any[]) => ({
            code: game[0],
            name: game[1],
            number: game[2],
            max_players: game[3] ?? 0  // Si null, mettre 0 ou une valeur par défaut
        }));

        console.log("Données formatées :", gamesFormatted);  // Pour vérifier

        setGames(gamesFormatted);
    };

    const [begin, setBegin] = useState(0);
    const displayedGames = games.slice(begin, begin + 9);

    function previousPage() {
        if (begin > 0) {
            setBegin(begin - 9);
        }
    }

    function nextPage() {
        if (begin + 9 < games.length) {
            setBegin(begin + 9);
        }
    }

    function startPage() {
        setBegin(0);
    }

    function endPage() {
        setBegin(games.length - 9);
    }

    useEffect(() => {
        fetchPublicGames();
    }, []);

    return (
        <div className={"PublicSaloon"}>
            <img className={"saloonImg"} src={'/public/assets/PublicSaloonTitle.png'} alt="Saloon" />

          <div className={"pagination"}>
            <img src={paginationStart} alt="Start" onClick={startPage} />
            <img src={paginationPrevious} alt="Previous" onClick={previousPage} />
            <p className={"pageNumber"}>{begin / 9 + 1} / {games.length / 9}</p>
            <img src={paginationNext} alt="Next" onClick={nextPage} />
            <img src={paginationEnd} alt="End" onClick={endPage} />
          </div>

          <div className={"PublicSaloonList"}>
                {displayedGames.map((saloon, index) => (
                        <PublicSaloonTicket
                            key={`${saloon.code}-${index}`}
                            saloonName={saloon.name}
                            players={saloon.number}
                            maxPlayers={saloon.max_players}
                            code={saloon.code}
                        />
                ))}
            </div>
        </div>
    )


}
