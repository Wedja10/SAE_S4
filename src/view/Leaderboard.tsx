import '../style/leaderboard/leaderboard.css';
import {LeaderboardList, Podium} from "../componnents/leaderboard/LeaderboardComponent.tsx";
import Navbar from '../componnents/Navbar.tsx';
interface Player {
  player: string;
  score: string;
}

const Leaderboard: React.FC = () => {

  const allPlayers: Player[] = [
    { player: "Alice", score: "5/5" },
    { player: "Bob", score: "5/5" },
    { player: "Charlie", score: "4/5" },
    { player: "David", score: "4/5" },
    { player: "Eve", score: "3/5" },
    { player: "Frank", score: "3/5" },
    { player: "Grace", score: "2/5" },
    { player: "Hank", score: "1/5" },
    { player: "Ivy", score: "0/5" }
  ];

  const podiumPlayers = allPlayers.slice(0, 3);
  const otherPlayers = allPlayers.slice(3);

  return (
    <div className="leaderboardBg">
      <Navbar />
      <Podium playerScore={podiumPlayers} />
      <LeaderboardList playerScore={otherPlayers} />
    </div>
  );
};

export default Leaderboard;
