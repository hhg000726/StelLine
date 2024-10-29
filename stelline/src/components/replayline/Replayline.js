// src/components/Replayline.js
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReplaylineItem from './ReplaylineItem';
import './Replayline.css';
import axios from 'axios';

const MEMBERS = ['칸나', '유니', '히나', '시로', '리제', '타비', '부키', '린', '나나', '리코', '단체, 서버'];
const CONTENTS = ['종합게임', '공포게임', '노래', '서버', '기념일', '내부 합방', '외부 합방', '최초 공개', '팬게임', '월드컵', '특별 컨텐츠', '대회']

const COLORS = [
  '#373584',
  '#B77DE4',
  '#DFB387',
  '#757875',
  '#D94854',
  '#50D3F0',
  '#794EB7',
  '#77A0F2',
  '#FFAABA',
  '#7AD95F',
  '#222222',
];

// Replayline.js 파일에서 수정
const getGradientStyle = (members) => {
  const activeColors = members
    .map((value, index) => (value === 1 ? COLORS[index] : null))
    .filter(Boolean);

  if (activeColors.length === 0) {
    return { background: '#3498db' }; // 기본 색상 (남색)
  }

  const gradientPercentage = 100 / activeColors.length;
  const gradientColors = activeColors
    .map((color, index) => `${color} ${index * gradientPercentage}%, ${color} ${(index + 1) * gradientPercentage}%`)
    .join(', ');

  return {
    background: `linear-gradient(90deg, ${gradientColors})`,
  };
};


// Group events by date using reduce
const groupEventsByDate = (events) => {

  return events.reduce((grouped, event) => {
    if (!grouped[event.date]) {
      grouped[event.date] = [];
    }
    grouped[event.date].push(event);
    return grouped;
  }, {});
};

const Replayline = () => {
  const itemRefs = useRef({});
  const navigate = useNavigate();
  const location = useLocation();
  const [eventsCopy, setEventsCopy] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(Array(11).fill(0));  // 멤버 필터링용 상태
  const [selectedChannels, setSelectedChannels] = useState(Array(10).fill(1));  // 채널 필터링용 상태
  const [selectedContents, setSelectedContents] = useState({ "게임": false, "노래방": false, "컨텐츠": false, "asmr": false, "서버": false, "기념일": false, "외부 합방": false, "신곡": false, "특별": false });  // 컨텐츠 필터링용 상태
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});
  const [visibleDates, setVisibleDates] = useState([]);
  const [filterMemberOperation, setFilterMemberOperation] = useState('AND');  // AND 또는 OR 선택('OR');  // AND 또는 OR 선택
  const [filterContentOperation, setFilterContentOperation] = useState('AND');  // AND 또는 OR 선택
  const [navOpen, setNavOpen] = useState(false); // 내비게이션 열림 상태 관리

  useEffect(() => {
    // 데이터 요청
    axios.get(`${process.env.REACT_APP_API_URL}/api/replayline`)
      .then((response) => {
        const modifiedData = response.data.map((event) => ({
          ...event,
          members: JSON.parse(event.members), // JSON 문자열을 파싱하여 리스트로 변환
          videoIds: JSON.parse(event.videoIds), // videoIds도 마찬가지로 파싱
          contents: JSON.parse(event.contents) // videoIds도 마찬가지로 파싱
        }));
        setEventsCopy(modifiedData); // 데이터 상태에 저장
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isLoading && location.state?.restoreScroll) {
      // 컴포넌트 렌더링 후 스크롤 복원을 위해 setTimeout 사용
      const savedScrollPosition = sessionStorage.getItem('scrollPosition');
      if (savedScrollPosition) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScrollPosition, 10));
        }, 100);
      }
    }
  }, [isLoading, location.state]);

  // Lazy load items based on visibility
  useEffect(() => {
    if (eventsCopy.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleDates((prevDates) => {
              if (!prevDates.includes(entry.target.dataset.date)) {
                return [...prevDates, entry.target.dataset.date];
              }
              return prevDates;
            });
          }
        });
      },
      { threshold: 0 }
    );

    // `itemRefs`를 복사하여 사용
    const currentRefs = Object.values(itemRefs.current);

    currentRefs.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      currentRefs.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [eventsCopy]);


  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  // 제목과 멤버 필터링을 적용한 이벤트 목록
  const filteredevents = eventsCopy.filter((event) => {
    // 제목 검색 필터
    const keywords = searchText.toLowerCase().split(" ");
    const titleMatch = keywords.every(keyword => event.title.replace(/\s/g, "").toLowerCase().includes(keyword));

    // 채널 필터
    let channelMatch;
    channelMatch = selectedChannels.some((isSelected, idx) =>
      isSelected && event.channel === idx
    );

    // 멤버 필터: 선택된 연산 방식에 따라 필터링
    let memberMatch;
    if (filterMemberOperation === 'AND') {
      memberMatch = selectedMembers.every((isSelected, idx) =>
        !isSelected || event.members[idx] === 1
      );
    } else if (filterMemberOperation === 'OR') {
      memberMatch = selectedMembers.some((isSelected, idx) =>
        isSelected && event.members[idx] === 1
      );
    }

    // 컨텐츠 필터: 선택된 연산 방식에 따라 필터링
    let contentMatch = true;

    if (filterContentOperation === 'AND') {
      contentMatch = Object.entries(selectedContents).every(([key, value]) => {
        // selectedContents[key]가 1인 경우에만 필터링 조건을 확인
        if (value === true) {
          return event.contents[key] === true;
        }
        return true; // selectedContents[key]가 0이면 조건을 무시
      });
    } else if (filterContentOperation === 'OR') {
      contentMatch = Object.entries(selectedContents).some(([key, value]) => {
        // selectedContents[key]가 1인 경우에만 필터링 조건을 확인
        return value === true && event.contents[key] === true;
      });
    }

    return titleMatch && channelMatch && memberMatch && contentMatch;
  });

  const groupedEvents = groupEventsByDate(filteredevents);

  // Group dates by year and month for navigation
  const groupedByYearMonth = filteredevents.reduce((grouped, event) => {
    const [year, month] = event.date.split('-');
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = [];
    grouped[year][month].push(event);
    return grouped;
  }, {});

  const groupedByYearMonthDay = filteredevents.reduce((grouped, event) => {
    const [year, month, day] = event.date.split('-');
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = {};
    if (!grouped[year][month][day]) grouped[year][month][day] = [];
    grouped[year][month][day].push(event);
    return grouped;
  }, {});

  const handleNavClick = (arg) => {
    if (itemRefs.current[arg]) {
      itemRefs.current[arg].scrollIntoView({ behavior: 'auto' });
    }
  };

  // Toggle the expansion state for a year
  const toggleYear = (year) => {
    setExpandedYears((prev) => {
      // 모든 연도를 접기
      const newExpandedYears = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});

      // 클릭한 연도는 토글하여 펼치거나 접음
      newExpandedYears[year] = !prev[year];

      // 만약 연도를 접는 경우, 해당 연도에 속한 모든 월도 접기
      if (!newExpandedYears[year]) {
        const monthsInYear = Object.keys(groupedByYearMonth[year]);
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

    // 다른 연도를 접을 때 해당 연도의 모든 월도 접기
    setExpandedMonths((prev) => {
      const newExpandedMonths = { ...prev };
      Object.keys(groupedByYearMonth).forEach((otherYear) => {
        if (otherYear !== year) {
          Object.keys(groupedByYearMonth[otherYear]).forEach((month) => {
            newExpandedMonths[`${otherYear}-${month}`] = false;
          });
        }
      });
      return newExpandedMonths;
    });
  };

  // Toggle the expansion state for a month
  const toggleMonth = (year, month) => {
    setExpandedMonths((prev) => {
      // 같은 연도의 다른 모든 월을 접기
      const newExpandedMonths = { ...prev };
      Object.keys(groupedByYearMonth[year]).forEach((otherMonth) => {
        newExpandedMonths[`${year}-${otherMonth}`] = false;
      });

      // 클릭한 월의 상태를 반대로 토글
      newExpandedMonths[`${year}-${month}`] = !prev[`${year}-${month}`];

      return newExpandedMonths;
    });
  };

  const handleMemberChange = (index) => {
    const updatedMembers = [...selectedMembers];
    updatedMembers[index] = !updatedMembers[index];
    setSelectedMembers(updatedMembers);
  };

  const handleChannelChange = (index) => {
    const updatedChannels = [...selectedChannels];
    updatedChannels[index] = !updatedChannels[index];
    setSelectedChannels(updatedChannels);
  };

  const handleContentChange = (content) => {
    const updatedContents = { ...selectedContents }
    updatedContents[content] = !updatedContents[content];
    console.log('Updated Contents:', updatedContents);
    setSelectedContents(updatedContents);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedMembers(Array(11).fill(0));
    setSelectedChannels(Array(10).fill(0));
    setSelectedContents(Array(10).fill(0));
    setFilterMemberOperation('AND')
  };

  const toggleNav = () => {
    setNavOpen((prevOpen) => !prevOpen);
  };

  const handleClickToTimeline = () => {
    navigate('/timeline');
  }

  return (
    <div className="replayline-page">

      <button className="nav-toggle-button" onClick={toggleNav}>
        {navOpen ? '내비게이션 닫기' : '내비게이션 열기'}
      </button>

      <div className={`replayline-nav ${navOpen ? 'open' : 'closed'}`}>

        <button onClick={handleClickToTimeline}>
          타임 라인
        </button>

        <h2>내비게이션</h2>

        <input
          type="text"
          placeholder="제목 검색"
          value={searchText}
          onChange={handleSearchChange}
          style={{ width: '90%', padding: '5px', marginBottom: '10px' }}
        />

        <ul>
          {Object.keys(groupedByYearMonthDay).map((year) => (
            <li key={year}>
              <span onClick={() => toggleYear(year)} style={{ cursor: 'pointer', display: 'block' }}>
                {year} {expandedYears[year] ? '▲' : '▼'}
              </span>
              {expandedYears[year] && (
                <ul>
                  {Object.keys(groupedByYearMonthDay[year]).sort((a, b) => parseInt(a) - parseInt(b)).map((month) => (
                    <li key={month}>
                      <span onClick={() => toggleMonth(year, month)} style={{ cursor: 'pointer', display: 'block' }}>
                        {month}월 {expandedMonths[`${year}-${month}`] ? '▲' : '▼'}
                      </span>
                      {expandedMonths[`${year}-${month}`] && (
                        <ul>
                          {Object.keys(groupedByYearMonthDay[year][month]).sort((a, b) => parseInt(a) - parseInt(b)).map((day) => (
                            <li
                              key={day}
                              onClick={() => handleNavClick(`${year}-${month}-${day}`)}
                              style={getGradientStyle(groupedByYearMonthDay[year][month][day].reduce((acc, event) => {
                                return acc.map((value, index) => value || event.members[index]);
                              }, Array(MEMBERS.length).fill(0)))}
                              onMouseEnter={(e) => {
                                const tooltip = document.createElement('div');
                                tooltip.className = 'custom-tooltip';
                                tooltip.innerHTML = groupedByYearMonthDay[year][month][day]
                                  .map((event, idx) => `<div style="color: ${COLORS[event.members.findIndex(member => member === 1)]}; background: rgba(255, 255, 255, 0.9); padding: 5px; border-radius: 5px; margin-bottom: 5px;">${event.title}</div>`)
                                  .join('');
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
                                  let x = e.clientX + 50;
                                  let y = e.clientY - 10;
                                  const tooltipRect = tooltip.getBoundingClientRect();

                                  // 화면의 오른쪽 경계를 벗어나지 않도록 조정
                                  if (x + tooltipRect.width > window.innerWidth) {
                                    x = window.innerWidth - tooltipRect.width - 10;
                                  }

                                  // 화면의 아래쪽 경계를 벗어나지 않도록 조정
                                  if (y + tooltipRect.height > window.innerHeight) {
                                    y = window.innerHeight - tooltipRect.height - 10;
                                  }

                                  // 화면의 위쪽 경계를 벗어나지 않도록 조정
                                  if (y < 0) {
                                    y = 10;
                                  }

                                  // 화면의 왼쪽 경계를 벗어나지 않도록 조정
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
                              }}
                              onMouseLeave={(e) => {
                                if (e.target.tooltipElement) {
                                  e.target.removeEventListener('mousemove', e.target.updateTooltipPosition);
                                  document.body.removeChild(e.target.tooltipElement);
                                  e.target.tooltipElement = null;
                                  e.target.updateTooltipPosition = null;
                                }
                              }}
                            >
                              {day}일
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {/* 멤버 체크박스 */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ marginRight: '40px' }}>
            <h4>멤버<br />필터</h4>

            {MEMBERS.map((member, index) => (
              <label key={index} style={{ display: 'block', marginBottom: '1px' }}>
                <input
                  type="checkbox"
                  checked={selectedMembers[index]}
                  onChange={() => handleMemberChange(index)}
                />{' '}
                {member}
              </label>
            ))}
            <div style={{ marginTop: '20px' }}>
              <h4>필터방식</h4>
              <div>
                <label style={{ display: 'block' }}>
                  <input
                    type="radio"
                    name="filterMemberOperation"
                    value="AND"
                    checked={filterMemberOperation === 'AND'}
                    onChange={() => setFilterMemberOperation('AND')}
                  />{' '}
                  <br />모두<br />포함
                </label>
                <label style={{ display: 'block' }}>
                  <input
                    type="radio"
                    name="filterMemberOperation"
                    value="OR"
                    checked={filterMemberOperation === 'OR'}
                    onChange={() => setFilterMemberOperation('OR')}
                  />{' '}
                  <br />하나라도<br />포함
                </label>
              </div>
            </div>
          </div>
          <div>
            <button onClick={handleResetFilters} >필터<br />초기화</button>
            <h4>채널<br />필터</h4>

            {MEMBERS.slice(0, 10).map((channel, index) => (
              <label key={index} style={{ display: 'block', marginBottom: '1px' }}>
                <input
                  type="checkbox"
                  checked={selectedChannels[index]}
                  onChange={() => handleChannelChange(index)}
                />{' '}
                {channel}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div>
            <h4>컨텐츠<br />필터</h4>

            {CONTENTS.map((content) => (
              <label key={content} style={{ display: 'block', marginBottom: '1px' }}>
                <input
                  type="checkbox"
                  checked={selectedContents[content]}
                  onChange={() => handleContentChange(content)}
                />{' '}
                {content}
              </label>
            ))}
            <div style={{ marginTop: '20px' }}>
              <h4>필터방식</h4>
              <div>
                <label style={{ display: 'block' }}>
                  <input
                    type="radio"
                    name="filterContentOperation"
                    value="AND"
                    checked={filterContentOperation === 'AND'}
                    onChange={() => setFilterContentOperation('AND')}
                  />{' '}
                  <br />모두<br />포함
                </label>
                <label style={{ display: 'block' }}>
                  <input
                    type="radio"
                    name="filterContentOperation"
                    value="OR"
                    checked={filterContentOperation === 'OR'}
                    onChange={() => setFilterContentOperation('OR')}
                  />{' '}
                  <br />하나라도<br />포함
                </label>
              </div>
            </div>
          </div>
        </div>


      </div>
      <div className="replayline-container">
        <h1>리플레이 라인</h1>
        <div className="replayline">
          {Object.keys(groupedEvents).map((date, index) => (
            <div
              key={index}
              ref={(el) => (itemRefs.current[date] = el)}
              data-date={date}
            >
              {visibleDates.includes(date) && (
                <>
                  <h2>{date}</h2>
                  {groupedEvents[date].map((event, idx) => (
                    <ReplaylineItem
                      key={idx}
                      date={event.date}
                      title={event.title}
                      videoIds={event.videoIds}
                      id={event.id}
                      members={event.members}
                      contents={event.contents}
                    />
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Replayline;