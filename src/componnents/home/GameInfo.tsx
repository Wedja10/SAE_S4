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
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer blandit feugiat ex.
                        Nam at sagittis turpis, vel consequat dolor. Suspendisse potenti. Cras eget fringilla urna.
                        Nullam eu volutpat nulla. Duis mollis pretium enim sit amet molestie.
                    </p>
                </div>
            </section>
        </>
    )
}

export default GameInfo
