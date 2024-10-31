import MonthItemDay from "./MonthItemDay";
import MonthItemEvent from "./MonthItemEvemt";

const YearItem = ({ year, expanded, toggleYear, groupedByDate, expandedMonths, toggleMonth, handler, kind }) => {
  console.log(expanded, year, groupedByDate[year])
  return (
    <li>
      <span onClick={() => toggleYear(year)} style={{ cursor: 'pointer', display: 'block' }}>
        {year} {expanded ? '▲' : '▼'}
      </span>
      {expanded && (
        <ul>
          {Object.keys(groupedByDate[year])
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((month) => (kind === 'time' ?
              <MonthItemEvent
                key={month}
                year={year}
                month={month}
                events={groupedByDate[year][month]}
                expanded={expandedMonths[`${year}-${month}`]}
                toggleMonth={toggleMonth}
                handler={handler}
              /> : 
              <MonthItemDay
                key={month}
                year={year}
                month={month}
                events={groupedByDate[year][month]}
                groupedByDate={groupedByDate}
                expanded={expandedMonths[`${year}-${month}`]}
                toggleMonth={toggleMonth}
                handler={handler}
              />
            ))}
        </ul>
      )}
    </li>
  )
};

export default YearItem