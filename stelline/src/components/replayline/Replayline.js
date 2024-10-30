// src/components/Replayline.js
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReplaylineItem from './ReplaylineItem';
import './Replayline.css';
import axios from 'axios';
import { VariableSizeList as List } from 'react-window';

const MEMBERS = ['칸나', '유니', '히나', '시로', '리제', '타비', '부키', '린', '나나', '리코'];
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
  const listRef = useRef(null);
  const resizeTimer = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [eventsCopy, setEventsCopy] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(Array(10).fill(0));  // 멤버 필터링용 상태
  const [selectedChannels, setSelectedChannels] = useState(Array(10).fill(1));  // 채널 필터링용 상태
  const [selectedContents, setSelectedContents] = useState(CONTENTS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {}));  // 컨텐츠 필터링용 상태
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});
  const [filterMemberOperation, setFilterMemberOperation] = useState('AND');  // AND 또는 OR 선택('OR');  // AND 또는 OR 선택
  const [filterContentOperation, setFilterContentOperation] = useState('AND');  // AND 또는 OR 선택
  const [navOpen, setNavOpen] = useState(false); // 내비게이션 열림 상태 관리

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // 필터 상태 복원
    const savedSearchText = sessionStorage.getItem('searchText');
    const savedSelectedMembers = sessionStorage.getItem('selectedMembers');
    const savedSelectedChannels = sessionStorage.getItem('selectedChannels');
    const savedSelectedContents = sessionStorage.getItem('selectedContents');
    const savedFilterMemberOperation = sessionStorage.getItem('filterMemberOperation');
    const savedFilterContentOperation = sessionStorage.getItem('filterContentOperation');

    if (savedSearchText) setSearchText(savedSearchText);
    if (savedSelectedMembers) setSelectedMembers(JSON.parse(savedSelectedMembers));
    if (savedSelectedChannels) setSelectedChannels(JSON.parse(savedSelectedChannels));
    if (savedSelectedContents) setSelectedContents(JSON.parse(savedSelectedContents));
    if (savedFilterMemberOperation) setFilterMemberOperation(savedFilterMemberOperation);
    if (savedFilterContentOperation) setFilterContentOperation(savedFilterContentOperation);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      // 우선 현재의 윈도우 크기를 설정합니다.
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // 이전 타이머를 제거합니다.
      if (resizeTimer.current) {
        clearTimeout(resizeTimer.current);
      }

      // 일정 시간이 지나면 (예: 500ms) 강제 리렌더링합니다.
      resizeTimer.current = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 500);
    };

    window.addEventListener('resize', handleResize);

    // 컴포넌트가 언마운트될 때 리스너와 타이머를 정리합니다.
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimer.current) {
        clearTimeout(resizeTimer.current);
      }
    };
  }, []);

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
      const savedScrollPosition = sessionStorage.getItem('scrollPosition');
      if (savedScrollPosition && listRef.current) {
        listRef.current.scrollTo(parseInt(savedScrollPosition, 10));
      }
    }
  }, [isLoading, location.state]);

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
    if (listRef.current) {
      const index = Object.keys(groupedEvents).indexOf(arg);
      if (index !== -1) {
        listRef.current.scrollToItem(index, 'start');
      }
    }
  };

  const getItemSize = (index) => {
    const date = Object.keys(groupedEvents)[index];
    const videoCount = groupedEvents[date].reduce((total, event) => total + event.videoIds.length, 0);
    if (window.innerWidth <= 768) {
      return 172 + (Math.min(1000, window.innerWidth) * 0.5625 + 280) * videoCount
    }
    return (172 + (Math.min(1000, window.innerWidth * 0.7) * 0.5625 + 400) * videoCount)
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
    sessionStorage.setItem('selectedMembers', JSON.stringify(updatedMembers));
  };

  const handleChannelChange = (index) => {
    const updatedChannels = [...selectedChannels];
    updatedChannels[index] = !updatedChannels[index];
    setSelectedChannels(updatedChannels);
    sessionStorage.setItem('selectedChannels', JSON.stringify(updatedChannels));
  };

  const handleContentChange = (content) => {
    const updatedContents = { ...selectedContents }
    updatedContents[content] = !updatedContents[content];
    console.log('Updated Contents:', updatedContents);
    setSelectedContents(updatedContents);
    sessionStorage.setItem('selectedContents', JSON.stringify(updatedContents));
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    sessionStorage.setItem('searchText', e.target.value ?? '');
  };

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedMembers(Array(10).fill(0));
    setSelectedChannels(Array(10).fill(1));
    setSelectedContents(CONTENTS.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {}));
    setFilterMemberOperation('AND')
    sessionStorage.setItem('searchText', '');
    sessionStorage.setItem('selectedMembers', JSON.stringify(Array(10).fill(0)));
    sessionStorage.setItem('selectedChannels', JSON.stringify(Array(10).fill(1)));
    sessionStorage.setItem('selectedContents', JSON.stringify(CONTENTS.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {})));
    sessionStorage.setItem('filterMemberOperation', 'AND');
    sessionStorage.setItem('filterContentOperation', 'AND');
  };

  const toggleNav = () => {
    setNavOpen((prevOpen) => !prevOpen);
  };

  const handleClickToTimeline = () => {
    navigate('/timeline');
  }

  const handleResetCalendar = () => {
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
                              onClick={(e) => {
                                handleNavClick(`${year}-${month}-${day}`);
                                if ('ontouchstart' in window) { // 모바일에서만 실행
                                  const tooltipContent = groupedByYearMonthDay[year][month][day]
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
                              }}
                              onMouseEnter={(e) => {
                                if (!('ontouchstart' in window)) { // PC에서만 실행
                                  const tooltipContent = groupedByYearMonthDay[year][month][day]
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
                              }}
                              onMouseLeave={(e) => {
                                if (e.target.tooltipElement) {
                                  e.target.removeEventListener('mousemove', e.target.updateTooltipPosition);
                                  if (e.target.tooltipElement.parentNode) {
                                    e.target.tooltipElement.parentNode.removeChild(e.target.tooltipElement);
                                  }
                                  e.target.tooltipElement = null;
                                  e.target.updateTooltipPosition = null;
                                }
                              }}
                              style={getGradientStyle(groupedByYearMonthDay[year][month][day].reduce((acc, event) => {
                                return acc.map((value, index) => value || event.members[index]);
                              }, Array(MEMBERS.length).fill(0)))}
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
        <button onClick={handleResetFilters} style={{ display: 'block', margin: '0 auto', marginBottom: '10px' }}>필터<br />초기화</button>   
        {/* 체크박스 */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{marginRight: '5px', padding: '5px',  border: '3px solid #0000ff', borderRadius: '10px'}}>
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
                    onChange={() => {
                      setFilterMemberOperation('AND')
                      sessionStorage.setItem('filterMemberOperation', 'AND');
                    }}
                  />{' '}
                  <br />모두<br />포함
                </label>
                <label style={{ display: 'block' }}>
                  <input
                    type="radio"
                    name="filterMemberOperation"
                    value="OR"
                    checked={filterMemberOperation === 'OR'}
                    onChange={() => {
                      setFilterMemberOperation('OR')
                      sessionStorage.setItem('filterMemberOperation', 'OR');
                    }}
                  />{' '}
                  <br />하나라도<br />포함
                </label>
              </div>
            </div>
          </div>
          
          <div style={{marginRight: '5px', padding: '5px',  border: '3px solid #ff0000', borderRadius: '10px'}}>
            
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
        
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5px' }}>
          <div style={{marginRight: '5px', padding: '5px',  border: '3px solid #ff00ff', borderRadius: '10px'}}>
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
                    onChange={() => {
                      setFilterContentOperation('AND')
                      sessionStorage.setItem('filterContentOperation', 'AND');
                    }}
                  />{' '}
                  <br />모두<br />포함
                </label>
                <label style={{ display: 'block' }}>
                  <input
                    type="radio"
                    name="filterContentOperation"
                    value="OR"
                    checked={filterContentOperation === 'OR'}
                    onChange={() => {
                      setFilterContentOperation('OR')
                      sessionStorage.setItem('filterContentOperation', 'OR');
                    }}
                  />{' '}
                  <br />하나라도<br />포함
                </label>
              </div>
            </div>
          </div>

        </div>

        <button
          onClick={handleResetCalendar}
          style={{
            position: 'sticky',
            bottom: '10px',
            width: '90%',
            margin: '10px auto',
            padding: '10px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            cursor: 'pointer',
          }}
        >
          달력 접기
        </button>
      </div>


      <div className="replayline-container">

        <List
          key={Object.keys(groupedEvents).join('-')}
          ref={listRef}
          height={window.innerHeight * 0.9}
          itemCount={Object.keys(groupedEvents).length}
          itemSize={getItemSize}
          width={window.innerWidth > 768 ? window.innerWidth * 0.7 : window.innerWidth}
        >
          {({ index, style }) => {
            const date = Object.keys(groupedEvents)[index];
            return (
              <div style={style} ref={(el) => (itemRefs.current[date] = el)} data-date={date}>
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
                    listRef={listRef}
                  />
                ))}
              </div>
            );
          }}
        </List>
      </div>
    </div>
  );
};

export default Replayline;