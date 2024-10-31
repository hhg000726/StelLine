import React from "react";
import { COLORS, MEMBERS_ONE } from "../../../consts";

const EventItem = ({ event, handler }) => (
  <li onClick={() => handler(event.date)}>
    {event.date.split('-')[2]}일
    {event.members.map((member, memberIndex) =>
      member === 1 && (
        <span
          key={memberIndex}
          style={{
            color: COLORS[memberIndex], // 멤버에 해당하는 색상 적용
            fontWeight: 'bold',
            marginLeft: '4px',
          }}
        >
          {MEMBERS_ONE[memberIndex]}
        </span>
      )
    )}
    <br />
    {event.title.split('\n').map((line, lineIndex) => (
      <React.Fragment key={lineIndex}>
        {line}
        <br />
      </React.Fragment>
    ))}
  </li>
);

export default EventItem