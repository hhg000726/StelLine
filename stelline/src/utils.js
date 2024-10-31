// utils.js
export const toggleExpandYear = (year, groupedData, setExpandedYears, setExpandedMonths) => {
  setExpandedYears((prev) => {
    const newExpandedYears = Object.keys(prev).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});

    newExpandedYears[year] = !prev[year];

    if (!newExpandedYears[year]) {
      const monthsInYear = Object.keys(groupedData[year]);
      setExpandedMonths((prevMonths) => {
        const newExpandedMonths = { ...prevMonths };
        monthsInYear.forEach((month) => {
          newExpandedMonths[`${year}-${month}`] = false;
        });
        return newExpandedMonths;
      });
    }

    return newExpandedYears;
  });

  setExpandedMonths((prev) => {
    const newExpandedMonths = { ...prev };
    Object.keys(groupedData).forEach((otherYear) => {
      if (otherYear !== year) {
        Object.keys(groupedData[otherYear]).forEach((month) => {
          newExpandedMonths[`${otherYear}-${month}`] = false;
        });
      }
    });
    return newExpandedMonths;
  });
};

export const toggleExpandMonth = (year, month, groupedData, setExpandedMonths) => {
  setExpandedMonths((prev) => {
    const newExpandedMonths = { ...prev };
    Object.keys(groupedData[year]).forEach((otherMonth) => {
      newExpandedMonths[`${year}-${otherMonth}`] = false;
    });

    newExpandedMonths[`${year}-${month}`] = !prev[`${year}-${month}`];

    return newExpandedMonths;
  });
};

export const ResetCalendar = (setExpandedYears, setExpandedMonths) => {
  // Reset expandedYears: collapse all years
  setExpandedYears((prev) => {
    const newExpandedYears = {};
    Object.keys(prev).forEach((year) => {
      newExpandedYears[year] = false;
    });
    return newExpandedYears;
  });

  // Reset expandedMonths: collapse all months
  setExpandedMonths((prev) => {
    const newExpandedMonths = {};
    Object.keys(prev).forEach((key) => {
      newExpandedMonths[key] = false;
    });
    return newExpandedMonths;
  });
};

export const groupedByDate = (filteredevents) => {
  return filteredevents.reduce((grouped, event) => {
  const [year, month, day] = event.date.split('-');
  if (!grouped[year]) grouped[year] = {};
  if (!grouped[year][month]) grouped[year][month] = {};
  if (!grouped[year][month][day]) grouped[year][month][day] = [];
  grouped[year][month][day].push(event);
  return grouped;
}, {});
}