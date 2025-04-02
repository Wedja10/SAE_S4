import '../../style/leaderboard/leaderboard.css';

const FirstPlace = (props: {player: string, score: string}) => {
  return (
    <div className="firstPlace">
      <div className="textContainer">
        <div className="playerName">{props.player}</div>
        <div className="playerScore">{props.score}</div>
      </div>
    </div>
  )
}

const SecondPlace = (props: { player: string, score: string }) => {
  return (
    <div className="secondPlace">
      <div className="textContainer2">
        <div className="playerName2">{props.player}</div>
        <div className="playerScore">{props.score}</div>
      </div>
    </div>
  )
}

const ThirdPlace = (props: { player: string, score: string }) => {
  return (
    <div className="thirdPlace">
      <div className="textContainer3">
        <div className="playerName3">{props.player}</div>
        <div className="playerScore">{props.score}</div>
      </div>
    </div>
  )
}

interface PlayerScore {
  player: string;
  score: string;
}

export const Podium = (props: { playerScore: PlayerScore[] }) => {

  const first = props.playerScore[0] || { player: "", score: "0" };
  const second = props.playerScore[1] || { player: "", score: "0" };
  const third = props.playerScore[2] || { player: "", score: "0" };

  return (
    <div className="podium">
      { first.player == "" ? <></> : <FirstPlace player={first.player} score={first.score} />}
      { second.player == "" ? <></> : <SecondPlace player={second.player} score={second.score} />}
      { third.player == "" ? <></> : <ThirdPlace player={third.player} score={third.score} />}
    </div>
  );
};

export const LeaderboardList = (props: { playerScore: PlayerScore[] }) => {
  const half = Math.ceil(props.playerScore.length / 2);
  const firstHalf = props.playerScore.slice(0, half);
  const secondHalf = props.playerScore.slice(half);

  return (
    <div className="leaderboardList">
      <div className="leaderboardColumn">
        {firstHalf.map((player, index) => (
          <div key={index} className="leaderboardRow">
            <div className="rowClassment">{index + 4 + "th"}</div>
            <div className="rowPlayer">{player.player}</div>
            <div className="rowScore">{player.score}</div>
          </div>
        ))}
      </div>
      <div className="leaderboardColumn">
        {secondHalf.map((player, index) => (
          <div key={index + half} className="leaderboardRow">
            <div className="rowClassment">{index + 4 + half + "th"}</div>
            <div className="rowPlayer">{player.player}</div>
            <div className="rowScore">{player.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
};