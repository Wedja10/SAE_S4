

import { NavLink } from 'react-router-dom'
import '../style/GameOption.css'

function GameOption() {

    return (
        <>
            <section className="game-options fade-in">
                <div className="option">
                    <h2>LAUNCH YOUR GAME</h2>
                    <div className="join-btnDiv">
                        <NavLink to="/game" className="join-btn">
                            <svg width="15" height="15" viewBox="0 0 35 40" fill="none"
                                xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
                                <path
                                    d="M33.1562 16.7739L5.65625 0.51605C3.42188 -0.804262 0 0.476988 0 3.74261V36.2504C0 39.1801 3.17969 40.9457 5.65625 39.477L33.1562 23.227C35.6094 21.7817 35.6172 18.2192 33.1562 16.7739Z"
                                    fill="#F1B24A" />
                            </svg>
                            START IT
                        </NavLink>
                        <svg className="topright" width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                            <rect width="100" height="100" fill="url(#pattern0_111_7)" />
                            <defs>
                                <pattern id="pattern0_111_7" patternContentUnits="objectBoundingBox" width="1" height="1">
                                    <use xlinkHref="#image0_111_7" transform="scale(0.01)" />
                                </pattern>
                                <image id="image0_111_7" width="100" height="100" xlinkHref="data:image/png;base64,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" />
                            </defs>
                        </svg>
                    </div>

                </div>
                <div className="option">
                    <h2>JOIN YOUR FRIENDS</h2>
                    <div className="join-btnDiv">
                        <input type="text" className="join-btn" placeholder="ENTER THE CODE" name="code" />
                            <svg className="topright topright2" width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                                <rect width="100" height="100" fill="url(#pattern0_111_8)" />
                                <defs>
                                    <pattern id="pattern0_111_8" patternContentUnits="objectBoundingBox" width="1" height="1">
                                        <use xlinkHref="#image0_111_8" transform="scale(0.01)" />
                                    </pattern>
                                    <image id="image0_111_8" width="100" height="100" xlinkHref="data:image/png;base64,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" />
                                </defs>
                            </svg>
                    </div>
                </div>
            </section>
        </>
    )
}

export default GameOption
