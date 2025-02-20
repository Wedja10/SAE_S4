import '../../style/home/PublicSaloon.css'

class PublicSaloon {
  saloonName: string;
  players: number;
  maxPlayers: number;
  code: string;

  constructor(saloonName: string, players: number, maxPlayers: number, code: string) {
    this.saloonName = saloonName;
    this.players = players;
    this.maxPlayers = maxPlayers;
    this.code = code;
  }
}

export const PublicSaloonTicket = (props: {saloonName: string, players: number, maxPlayers: number, code: string}) => {
  return (
    <div className={"PublicSaloonTicket"}>
      <img className={"ticketImg"} src={'/public/assets/PublicSaloonTicket.png'} alt="Ticket" />
      <p className={"saloonName"}>{props.saloonName}</p>
      <p className={"players"}>{props.players + "/" + props.maxPlayers}</p>
      <p className={"code"}>{props.code}</p>
    </div>
  )
}

export const PublicSaloonList = () => {

  // Temp, à remplacer par un prop
  const saloon1 = new PublicSaloon("Jawed's room", 4, 10, "284059");
  const saloon2 = new PublicSaloon("Andrei's room", 7, 12, "002817");
  const saloon3 = new PublicSaloon("Abdel's room", 3, 8, "182662");
  const saloon4 = new PublicSaloon("Victor's room", 5, 10, "338541");
  const saloon5 = new PublicSaloon("Public room", 8, 8, "123456");

  const saloons = [saloon1, saloon2, saloon3, saloon4, saloon5];

  return (
    <div className={"PublicSaloon"}>
      <img className={"saloonImg"} src={'/public/assets/PublicSaloonTitle.png'} alt="Saloon" />
      <div className={"PublicSaloonList"}>
        {saloons.map((saloon) => {
          return (
              <PublicSaloonTicket saloonName={saloon.saloonName} players={saloon.players} maxPlayers={saloon.maxPlayers} code={saloon.code}/>
          )
        })}
      </div>
    </div>
  )
}
