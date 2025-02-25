import {NavLink} from "react-router-dom";

const Multi = () => {
  return (
    <NavLink to="/lobby" className={"Multi"}>
        <h1>MULTI</h1>
    </NavLink>
  )
}

const Solo = () => {
  return (
    <NavLink to="/lobbySolo" className={"Solo"}>
      <h1>SOLO</h1>
    </NavLink>
  )
}

export const ChoicePanel = () => {
    return (
        <div className={"ChoicePanel"}>
          <Solo />
          <h1>- OR -</h1>
          <Multi />
        </div>
    )
}