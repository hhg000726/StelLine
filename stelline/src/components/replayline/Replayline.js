// src/components/Replayline.js
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { VariableSizeList as List } from 'react-window';
import axios from 'axios';

import '../shared/Line.css';
import ReplaylineItem from './ReplaylineItem';
import { MEMBERS, COLORS, CONTENTS } from '../../consts.js'
import Filter from '../nav/Filter/Filter.js';
import Operation from '../nav/Filter/Operation.js';
import OneClickButton from '../nav/buttons/OneClickButton.js';
import Title from '../nav/Title.js';
import YearItem from '../nav/calendar/YearItem.js'
import { groupedByDate, ResetCalendar, toggleExpandMonth, toggleExpandYear } from '../../utils.js';

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

  const groupedByYearMonthDay = groupedByDate(filteredevents)

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
    toggleExpandYear(year, groupedByYearMonthDay, setExpandedYears, setExpandedMonths)
  };

  // Toggle the expansion state for a month
  const toggleMonth = (year, month) => {
    toggleExpandMonth(year, month, groupedByYearMonthDay, setExpandedMonths);
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

  const handleFilterMemberOperationChange = () => {
    const newOperation = filterMemberOperation === 'AND' ? 'OR' : 'AND';
    setFilterMemberOperation(newOperation);
    sessionStorage.setItem('filterMemberOperation', newOperation)
  }

  const handleFilterContentOperationChande = () => {
    const newOperation2 = filterContentOperation === 'AND' ? 'OR' : 'AND';
    setFilterContentOperation(newOperation2);
    sessionStorage.setItem('filterContentOperation', newOperation2);
  }

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedMembers(Array(10).fill(0));
    setSelectedChannels(Array(10).fill(1));
    setSelectedContents(CONTENTS.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {}));
    setFilterMemberOperation('AND')
    setFilterContentOperation('AND')
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
    ResetCalendar(setExpandedYears, setExpandedMonths)
  };

  return (
    <div className="page">

      <button className="nav-toggle-button" onClick={toggleNav}>
        {navOpen ? '내비게이션 닫기' : '내비게이션 열기'}
      </button>

      <div className={`nav ${navOpen ? 'open' : 'closed'}`}>

        <OneClickButton
          handler={handleClickToTimeline}
          text={"주요 영상으로"}
        />

        <Title />

        <input
          type="text"
          placeholder="제목 검색"
          value={searchText}
          onChange={handleSearchChange}
          style={{ width: '90%', padding: '5px', marginBottom: '10px' }}
        />
        
        <ul>
          {Object.keys(groupedByYearMonthDay).map((year) => (
            <YearItem
              key={year}
              year={year}
              expanded={expandedYears[year]}
              toggleYear={toggleYear}
              groupedByDate={groupedByYearMonthDay}
              expandedMonths={expandedMonths}
              toggleMonth={toggleMonth}
              handler={handleNavClick}
            />
          ))}
        </ul>
        
        <OneClickButton
          handler={handleResetFilters}
          text={'필터 초기화'}
        />

        <div className="filter-container">
          <h4>멤버 필터</h4>
          <Filter
            targets={MEMBERS}
            state={selectedMembers}
            backgroundColor={(index) => selectedMembers[index] ? COLORS[index] : '#ffffff'}
            color={(index) => selectedMembers[index] ? '#ffffff' : '#333'}
            handler={handleMemberChange}
          />
          <Operation
            backgroundColor={filterMemberOperation === 'AND' ? '#007BFF' : '#2ecc71'}
            handler={handleFilterMemberOperationChange}
            text={filterMemberOperation === 'AND' ? '모두 포함' : '하나라도 포함'}
          />
        </div>

        <div className="filter-container">
          <h4>채널 필터</h4>
          <Filter
            targets={MEMBERS}
            state={selectedChannels}
            backgroundColor={(index) => selectedChannels[index] ? COLORS[index] : '#ffffff'}
            color={(index) => selectedChannels[index] ? '#ffffff' : '#333'}
            handler={handleChannelChange}
          />
        </div>

        <div className="filter-container">
          <h4>컨텐츠 필터</h4>
          <Filter
            targets={CONTENTS}
            state={selectedContents}
            backgroundColor={(content) => selectedContents[content] ? '#007BFF' : '#ffffff'}
            color={(content) => selectedContents[content] ? '#ffffff' : '#333'}
            handler={handleContentChange}
          />
          <Operation
            backgroundColor={filterContentOperation === 'AND' ? '#007BFF' : '#2ecc71'}
            handler={handleFilterContentOperationChande}
            text={filterContentOperation === 'AND' ? '모두 포함' : '하나라도 포함'}
          />
        </div>

        <OneClickButton
          handler={handleResetCalendar}
          text={"달력 접기"}
        />

      </div>

      <div className="container">
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