import EventItem from "./EventItem";

const MonthItemEvent = ({ year, month, events, expanded, toggleMonth, handler }) => {
  return (
    <li>
      <span onClick={() => toggleMonth(year, month)} style={{ cursor: 'pointer', display: 'block' }}>
        {month}월 {expanded ? '▲' : '▼'}
      </span>
      {expanded && (
        <ul>
          {events.map((event, index) => (
            <EventItem key={index} event={event} handler={handler} />
          ))}
        </ul>
      )}
    </li>
  )
};

export default MonthItemEvent