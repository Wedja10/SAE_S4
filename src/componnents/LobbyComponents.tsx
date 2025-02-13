export const Player = (props: {player: string}) => {
  return (
    <div className="PlayerDiv">
      <img src={"player"} alt={props.player} />
      {props.player}
      <ChatButton />
    </div>
  )
}

export const ChatButton = () => {
  return (
    <button className="ChatButton">
      <img src="/src/assets/chatIcon.svg" alt="X" style={{
        width: '40%',
      }}/>
      <p>Chat</p>
    </button>
  )
}

export const PlayerList = (props: { players: string[] }) => { // A voir ce que vous mettez pour le back
  return (
    <div className="PlayerListDiv">
      <div className="LobbyTitle">LOBBY</div>
      {props.players.map((player) => (
        <Player player={player} />
      ))}
    </div>
  )
}