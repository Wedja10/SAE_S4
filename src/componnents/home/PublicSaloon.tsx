import '../../style/home/PublicSaloon.css'
import React, { useEffect, useState } from "react";
import "../../backend/services/apiService.js";
import { postRequest } from "../../backend/services/apiService.js";
import { getApiUrl } from "../../utils/config";
import {NavLink} from "react-router-dom";

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



    useEffect(() => {
        fetchPublicGames();
    }, []);

    return (
        <div className={"PublicSaloon"}>
            <img className={"saloonImg"} src={'/public/assets/PublicSaloonTitle.png'} alt="Saloon" />
            <div className={"PublicSaloonList"}>
                {games.map((saloon, index) => (
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
