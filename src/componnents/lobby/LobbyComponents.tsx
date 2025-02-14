export const Player = (props: {player: string, self: boolean}) => {
  return (
    <div className="Player fade-in">
      {!props.self ? <img className="playerPicture" src="/src/assets/playerPicture.png" alt="X" style={{
        height: '50px',
      }}/> : null}
      {props.player}
      <ChatButton />
    </div>
  )
}

export const ChatButton = () => {
  return (
    <button className="ChatButton">
      <img src="/src/assets/chatIcon.svg" alt="X" style={{
        height: '20px',
      }}/>
      <p>Chat</p>
    </button>
  )
}

export const PlayerList = (props: { players: string[] }) => { // A voir ce que vous mettez pour le back
  return (
    <div className="PlayerList">
      <div className="LobbyTitle fade-in">LOBBY</div>
      {props.players.map((player) => (
        <Player player={player} self={false} /> // Afficher le bouton de chat
      ))}
    </div>
  )
}