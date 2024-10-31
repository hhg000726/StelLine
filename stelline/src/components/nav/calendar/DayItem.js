import { COLORS, MEMBERS_ONE } from "../../../consts";

const DayItem = ({ year, month, day, groupedByDate, events, handler }) => {
  const handleTooltip = (e, bool) => {
    if (bool) {
      handler(`${year}-${month}-${day}`);
      if ('ontouchstart' in window) { // 모바일에서만 실행
        const tooltipContent = groupedByDate[year][month][day]
          .map((event, idx) => `<div style="color: ${COLORS[event.members.findIndex(member => member === 1)]}; background: rgba(255, 255, 255, 0.9); padding: 5px; border-radius: 5px; margin-bottom: 5px;">${event.title}</div>`)
          .join('');

        // 툴팁 생성 (모바일 클릭 시 화면에 고정 표시)
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.innerHTML = tooltipContent;
        tooltip.style.position = 'fixed';
        tooltip.style.top = '20%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '15px';
        tooltip.style.fontWeight = 'bold';
        tooltip.style.borderRadius = '8px';
        tooltip.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
        tooltip.style.zIndex = '1000';
        tooltip.addEventListener('click', () => {
          if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
        });
        document.body.appendChild(tooltip);

        // 모바일에서도 클릭 후 툴팁을 닫기 위한 설정
        setTimeout(() => {
          document.addEventListener('click', function handleClickOutside(event) {
            if (tooltip && !tooltip.contains(event.target)) {
              if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
              }
              document.removeEventListener('click', handleClickOutside);
            }
          });
        }, 0);
      }
    }
    else {
      if (!('ontouchstart' in window)) { // PC에서만 실행
        const tooltipContent = groupedByDate[year][month][day]
          .map((event, idx) => `<div style="color: ${COLORS[event.members.findIndex(member => member === 1)]}; background: rgba(255, 255, 255, 0.9); padding: 5px; border-radius: 5px; margin-bottom: 5px;">${event.title}</div>`)
          .join('');

        // 툴팁 생성
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.innerHTML = tooltipContent;
        tooltip.style.position = 'fixed';
        tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '15px';
        tooltip.style.fontWeight = 'bold';
        tooltip.style.borderRadius = '8px';
        tooltip.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
        tooltip.style.zIndex = '1000';
        document.body.appendChild(tooltip);

        const updateTooltipPosition = (e) => {
          let x = e.clientX + 20;
          let y = e.clientY + 20;
          const tooltipRect = tooltip.getBoundingClientRect();

          // 화면 경계 조정 - 화면을 넘어가지 않도록 수정
          if (x + tooltipRect.width > window.innerWidth) {
            x = window.innerWidth - tooltipRect.width - 10;
          }
          if (y + tooltipRect.height > window.innerHeight) {
            y = window.innerHeight - tooltipRect.height - 10;
          }
          if (y < 0) {
            y = 10;
          }
          if (x < 0) {
            x = 10;
          }

          tooltip.style.top = `${y}px`;
          tooltip.style.left = `${x}px`;
        };

        updateTooltipPosition(e);
        e.target.tooltipElement = tooltip;

        e.target.addEventListener('mousemove', updateTooltipPosition);
        e.target.updateTooltipPosition = updateTooltipPosition;
      }
    }
  };

  const memberPresenceArray = Array(10).fill(0);
  events.forEach((event) => {
    event.members.forEach((member, idx) => {
      if (member === 1) memberPresenceArray[idx] = 1;
    });
    if (event.channel >= 0 && event.channel < memberPresenceArray.length) {
      memberPresenceArray[event.channel] = 1;
    }
  });

  return (
    <li
      onClick={(e) => handleTooltip(e, true)}
      onMouseEnter={(e) => handleTooltip(e, false)}
      onMouseLeave={(e) => {
        if (e.target.tooltipElement) {
          e.target.removeEventListener('mousemove', e.target.updateTooltipPosition);
          if (e.target.tooltipElement.parentNode) {
            e.target.tooltipElement.parentNode.removeChild(e.target.tooltipElement);
          }
          e.target.tooltipElement = null;
          e.target.updateTooltipPosition = null;
        }
        const existingTooltips = document.querySelectorAll('.custom-tooltip');
        existingTooltips.forEach((tooltip) => {
          if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
        });
      }}
    >
      {day}일<br />
      {memberPresenceArray.map((member, index) =>
        member === 1 ? (
          <span
            key={index}
            style={{
              color: COLORS[index],
              fontWeight: 'bold',
              marginLeft: '4px',
            }}
          >
            {MEMBERS_ONE[index]}
          </span>
        ) : null
      )}
    </li>
  );
};

export default DayItem