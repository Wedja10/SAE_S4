import '../../style/GameInfo.css'
import card from '/assets/card.png'

function GameInfo() {

    return (
        <>
            <section className="game-info">
                <h1 className="sectionTitle fade-in">THE GAME FOR YOU</h1>
                <div className="content fade-in">
                    <img src={card} alt="Game Image" />
                    <p>
                        Préparez vos colts, affûtez vos éperons et rassemblez votre bande. Ici, seuls les plus malins et les plus rapides survivront. Lancez votre partie ou rejoignez vos partenaires pour une aventure où chaque choix compte.
                        Serez-vous un shérif intrépide ou un hors-la-loi redouté ? Le Far West vous attend, cow-boy !
                    </p>
                </div>
            </section>
        </>
    )
}

export default GameInfo
