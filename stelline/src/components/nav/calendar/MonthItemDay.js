import DayItem from "./DayItem";

const MonthItemDay = ({ year, month, events, expanded, toggleMonth, groupedByDate, handler }) => (
  <li>
    <span onClick={() => toggleMonth(year, month)} style={{ cursor: 'pointer', display: 'block' }}>
      {month}월 {expanded ? '▲' : '▼'}
    </span>
    {expanded && (
      <ul>
        {Object.keys(events)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map((day) => (
            <DayItem key={day} year={year} month={month} day={day} events={events[day]} groupedByDate={groupedByDate} handler={handler} />
          ))}
      </ul>
    )}
  </li>
);

export default MonthItemDay