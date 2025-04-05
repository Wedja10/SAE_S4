import { useNavigate } from "react-router-dom";
import ArtefactInfo from '/assets/Artefacts/ArtefactInfo.svg';
import {useState, useEffect} from "react";
import descriptionData from "../../../public/assets/Artefacts/description.json";
import './Artefacts.css';

interface StartButtonProps {
  onStart: () => void;
}

export const StartButton = ({ onStart }: StartButtonProps) => {
  return (
    <button onClick={onStart} className="startButton">
      <img src="/assets/StartArrow.png" alt="Start"/> LAUNCH
    </button>
  );
}

interface OptionsPanelProps {
  settings: {
    max_players: number | null;
    time_limit: number | null;
    articles_number: number;
    visibility: string;
    allow_join: boolean;
    enabled_artifacts: Record<string, boolean>;
  };
  onSettingsUpdate: (settings: OptionsPanelProps['settings']) => void;
  isHost: boolean;
}

export const OptionsPanel = ({ settings, onSettingsUpdate, isHost }: OptionsPanelProps) => {
  const [unlimitedPlayers, setUnlimitedPlayers] = useState(settings.max_players === null);
  const [unlimitedTime, setUnlimitedTime] = useState(settings.time_limit === null);

  useEffect(() => {
    setUnlimitedPlayers(settings.max_players === null);
    setUnlimitedTime(settings.time_limit === null);
  }, [settings]);

  const handleUnlimitedPlayers = () => {
    if (!isHost || settings.allow_join) return;
    setUnlimitedPlayers(!unlimitedPlayers);
    onSettingsUpdate({
      ...settings,
      max_players: !unlimitedPlayers ? null : 2
    });
  };

  const handleUnlimitedTime = () => {
    if (!isHost) return;
    setUnlimitedTime(!unlimitedTime);
    onSettingsUpdate({
      ...settings,
      time_limit: !unlimitedTime ? null : 60
    });
  }

  const handleAllowToJoin = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!isHost) return;
    onSettingsUpdate({
      ...settings,
      allow_join: !settings.allow_join
    });
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isHost) return;

    const formData = new FormData(event.currentTarget);
    const newSettings = {
      max_players: unlimitedPlayers ? null : Number(formData.get('playersNumber')),
      time_limit: unlimitedTime ? null : Number(formData.get('timeLimit')),
      articles_number: Number(formData.get('articlesNumber')),
      visibility: formData.get('visibility') as string,
      allow_join: settings.allow_join,
      enabled_artifacts: settings.enabled_artifacts
    };

    onSettingsUpdate(newSettings);
  };

  // Helper function to determine if max players should be disabled
  const isMaxPlayersDisabled = !isHost || settings.allow_join;

  // Convert seconds to format "minutes:seconds"
  function formatSecondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

// Convert "minutes:seconds" to seconds
  function convertMinutesSecondsToSeconds(timeString) {
    const [minutes, seconds] = timeString.split(':').map(Number);
    if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds >= 60) {
      return 0; // ou une valeur par défaut
    }
    return minutes * 60 + seconds;
  }

  return (
    <div className={"OptionsPanel"} >
      <form method={"put"} onSubmit={handleSubmit}>
        <div className={"OptionsList"}>
          <div className={"Option"}>
            <label htmlFor={"playerNumber"}>Number of players</label>
            {unlimitedPlayers ? (
              <input
                type={"text"}
                name={"playersNumber"}
                id={"playerNumber"}
                value={"UNLIMITED"}
                readOnly
                disabled={isMaxPlayersDisabled}
                className={isMaxPlayersDisabled ? "disabled-input" : ""}
              />
            ) : (
              <input
                type={"number"}
                name={"playersNumber"}
                id={"playerNumber"}
                min={1}
                value={settings.max_players || ''}
                onChange={(e) => onSettingsUpdate({
                  ...settings,
                  max_players: Number(e.target.value)
                })}
                required
                disabled={isMaxPlayersDisabled}
                className={isMaxPlayersDisabled ? "disabled-input" : ""}
              />
            )}
            <img
              src={unlimitedPlayers ? "/assets/UnlimitedButton.png" : "/assets/LimitedButton.png"}
              onClick={settings.allow_join ? undefined : handleUnlimitedPlayers}
              alt={"unlimited"}
              style={{cursor: (!isHost || settings.allow_join) ? 'default' : 'pointer'}}
            />
            {settings.allow_join && <div className="tooltip">Lock room to edit</div>}
          </div>

          <div className={"Option"}>
            <label htmlFor={"timeLimit"}>Time limit</label>
            {unlimitedTime ? (
              <input
                type={"text"}
                name={"timeLimit"}
                id={"timeLimit"}
                value={"UNLIMITED"}
                readOnly
                disabled={!isHost}
                className={!isHost ? "disabled-input" : ""}
              />
            ) : (
              <input
                type={"text"}
                name={"timeLimit"}
                id={"timeLimit"}
                value={formatSecondsToMinutesSeconds(settings.time_limit) || ''}
                onChange={(e) => {
                  const seconds = convertMinutesSecondsToSeconds(e.target.value);
                  onSettingsUpdate({
                    ...settings,
                    time_limit: seconds
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const increment = e.key === 'ArrowUp' ? 30 : -30;
                    const newTime = (settings.time_limit !== null ? Math.max(0, settings.time_limit + increment) : 0);
                    onSettingsUpdate({
                      ...settings,
                      time_limit: newTime,
                    });
                  }
                }}
                required
                disabled={!isHost}
                className={!isHost ? "disabled-input" : ""}
              />
            )}
            <img
              src={unlimitedTime ? "/assets/UnlimitedButton.png" : "/assets/LimitedButton.png"}
              onClick={isHost ? handleUnlimitedTime : undefined}
              alt={"unlimited"}
              style={{cursor: isHost ? 'pointer' : 'default'}}
            />
          </div>

          <div className={"Option"}>
            <label htmlFor={"articlesNumber"}>Number of articles</label>
            <input
              type={"number"}
              name={"articlesNumber"}
              id={"articlesNumber"}
              value={settings.articles_number}
              min={2}
              max={16}
              onChange={(e) => onSettingsUpdate({
                ...settings,
                articles_number: Number(e.target.value)
              })}
              required
              disabled={!isHost}
              className={!isHost ? "disabled-input" : ""}
            />
          </div>

          <div className={"Option"}>
            <label htmlFor={"visibility"}>Visibility</label>
            <select
              name={"visibility"}
              id={"visibility"}
              value={settings.visibility}
              onChange={(e) => onSettingsUpdate({
                ...settings,
                visibility: e.target.value
              })}
              disabled={!isHost}
              className={!isHost ? "disabled-input" : ""}
              defaultValue="private"
            >
              <option value={"private"}>Private</option>
              <option value={"public"}>Public</option>
            </select>
          </div>
        </div>

        <button
          className={"SubmitOptions"}
          type={"button"}
          onClick={handleAllowToJoin}
          style={{
            backgroundColor: settings.allow_join ? "#ff3838" : "#2a830c",
            cursor: isHost ? 'pointer' : 'default'
          }}
          disabled={!isHost}
        >
          {settings.allow_join ? "Lock room" : "Open room"}
        </button>
      </form>
    </div>
  );
}

export const OptionsPanelSolo = () => {
  const navigate = useNavigate();

  const [unlimitedTime, setUnlimitedTime] = useState(true);
  const [enabledArtifacts, setEnabledArtifacts] = useState<Record<string, boolean>>({
      "GPS": true,
      "Backtrack": true,
      "Teleporter": true,
      "Mine": true,
      "Snail": true,
      "Eraser": true,
      "Disorienter": true,
      "Dictator": true
  });

  const handleUnlimitedTime = () => {
    setUnlimitedTime(!unlimitedTime);
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const data = {
      ...Object.fromEntries(formData.entries()),
      time_limit: unlimitedTime ? null : Number(formData.get("timeLimit")),
      enabled_artifacts: enabledArtifacts
    };
    alert(JSON.stringify(data, null, 2)); // -------------- Ici pour le back à ajouter

    navigate(`/gameSolo`, { state: data });

  };

  return (
    <div className={"OptionsPanel"} >
      <form method={"put"} onSubmit={handleSubmit}>
        <div className={"OptionsList"}>

          <div className={"Option"}>
            <label htmlFor={"timeLimit"}>Time limit</label>

            {unlimitedTime ?
              <input type={"text"} name={"timeLimit"} id={"timeLimit"} value={"UNLIMITED"} readOnly/> :
              <input type={"number"} name={"timeLimit"} id={"timeLimit"} min={1} required/>}

            <img src={unlimitedTime ? "/assets/UnlimitedButton.png" : "/assets/LimitedButton.png"} onClick={handleUnlimitedTime} alt={"unlimited"}/>
          </div>

          <div className={"Option"}>
            <label htmlFor={"articlesNumber"}>Number of articles</label>
            <input type={"number"} name={"articlesNumber"} id={"articlesNumber"} defaultValue={5} min={2} max={16} required />
          </div>

        </div>

        <input className={"SubmitOptions"} type={"submit"} value={"LAUNCH"} style={{
          backgroundColor: "#17141d",
          borderColor: "#f1b24a"
        }}/>
      </form>
    </div>
  )
}

export const ArtefactsList = (props: { 
  artefacts: string[],
  enabledArtifacts?: Record<string, boolean>,
  onToggleArtifact?: (artifact: string, enabled: boolean) => void,
  isHost?: boolean
}) => {
  const { artefacts, enabledArtifacts = {}, onToggleArtifact, isHost = false } = props;
    const artefactImages: string[] = ["GPS", "BACK", "TELEPORT", "MINE", "SNAIL", "ERASER", "DISORIENTATOR", "DICTATOR"];
  
  return (
    <div className='ArtefactsListContainer'>
      <div className="ArtefactsList">
        {artefacts.map((artefact, index) => (
          <Artefact 
            key={index} 
            artefact={artefact}
            image={artefactImages[index]}
            enabled={artefact in enabledArtifacts ? enabledArtifacts[artefact] : true}
            onToggle={onToggleArtifact}
            isHost={isHost}
          />
        ))}
      </div>
    </div>
  );
};

interface Artefact {
  _id: { $oid: string };
  name: string;
  type: string;
  effect: string;
  __v: number;
  storable: boolean;
}

export const Artefact = (props: { 
  artefact: string,
    image: string,
  enabled?: boolean,
  onToggle?: (artifact: string, enabled: boolean) => void,
  isHost?: boolean
}) => {
  const { artefact, enabled = true, onToggle, isHost = false } = props;
  const [info, setInfo] = useState(false);

  const handleInfo = () => {
    setInfo(!info);
  }

  const handleToggle = () => {
    if (isHost && onToggle) {
      onToggle(artefact, !enabled);
    }
  }

  const artefactData = descriptionData.find((item: Artefact) => item.name === artefact);
  const description = artefactData ? artefactData.effect : "Description not found";

  if (!info) {
    return (
      <div 
        className={`Artefact ${!enabled ? 'disabled' : ''} ${isHost ? 'toggleable' : ''}`} 
        onClick={isHost ? handleToggle : undefined}
      >
        <img onClick={(e) => { e.stopPropagation(); handleInfo(); }} className="ArtefactInfo" src={ArtefactInfo} alt="Artefact Info"/>
        {isHost && (
          <div className="artifact-toggle-status">
            {enabled ? 'Enabled' : 'Disabled'}
          </div>
        )}
        <img
          className="ArtefactImage"
          src={`/assets/Artefacts/${props.image}.png`}
          alt="Artefact"
          style={{
            height: '100px',
            opacity: enabled ? 1 : 0.5
          }}
        />
        <p>{artefact}</p>
      </div>
    );
  } else {
    return (
      <div className={`Artefact-info ${!enabled ? 'disabled' : ''}`}>
        <img onClick={handleInfo} className="ArtefactInfo" src={"/assets/Artefacts/skipInfo.svg"} alt="Close Info"/>
        
        <div className="artifact-info-header">
          <img
            className="ArtefactImage-small"
            src={`/assets/Artefacts/${props.image}.png`}
            alt={artefact}
            style={{
              height: '40px',
              marginRight: '10px',
              opacity: enabled ? 1 : 0.5
            }}
          />
          <p>{artefact}</p>
        </div>
        
        <div className="artifact-info-content">
          <p className="ArtefactDescription">{description}</p>
        </div>
        
        {isHost && (
          <div className="artifact-toggle-button" onClick={(e) => { e.stopPropagation(); handleToggle(); }}>
            {enabled ? 'Disable' : 'Enable'} Artifact
          </div>
        )}
      </div>
    )
  }
};