import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

import '../shared/Edit.css';
import { MEMBERS, CONTENTS } from '../../consts';
import ListFilter from '../nav/Filter/ListFilter';

const EditReplayEvent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id, date, members: initialMembers, videoId, title, contents: initialContents, games: initialGames, songs: initialSongs } = location.state || {};

  const [eventDate, setEventDate] = useState(date || '');
  const [selectedMembers, setSelectedMembers] = useState(initialMembers || Array(MEMBERS.length).fill(0));
  const [selectedContents, setSelectedContents] = useState(initialContents || CONTENTS.reduce((acc, content) => {
    acc[content] = false;
    return acc;
  }, {}));
  const [selectedGames, setSelectedGames] = useState(initialGames || []);
  const [selectedSongs, setSelectedSongs] = useState(initialSongs || []);
  const [serachGame, setSearchGame] = useState('')
  const [serachSong, setSearchSong] = useState('')
  const [isLoading, setIsLoading] = useState(false);
  const [GAMES, setGAMES] = useState([]); // 테이블에서 가져온 노래 목록
  const [SONGS, setSONGS] = useState([]); // 테이블에서 가져온 노래 목록

  // useEffect로 노래 목록을 가져오기
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/games`)
      .then(response => {
        // 각 노래 객체에서 title만 추출하여 songTitles 배열에 저장
        const titles = response.data.map(game => game.game_title);
        setGAMES(titles);
      })
      .catch(error => {
        console.error('Error fetching songs:', error);
      });
    axios.get(`${process.env.REACT_APP_API_URL}/api/songs`)
      .then(response => {
        // 각 노래 객체에서 title만 추출하여 songTitles 배열에 저장
        const titles = response.data.map(song => song.song_title);
        setSONGS(titles);
      })
      .catch(error => {
        console.error('Error fetching songs:', error);
      });
  }, []);

  const handleDateChange = (e) => {
    setEventDate(e.target.value);
  };

  const handleMemberChange = (index) => {
    const updatedMembers = [...selectedMembers];
    updatedMembers[index] = updatedMembers[index] === 1 ? 0 : 1;
    setSelectedMembers(updatedMembers);
  };

  const handleContentChange = (content) => {
    setSelectedContents((prevContents) => ({
      ...prevContents,
      [content]: !prevContents[content],
    }));
  };

  const handleGameChange = (game) => {
    setSearchGame(game)
  };

  const handleAddGame = () => {
    if (selectedGames.includes(serachGame) || !GAMES.includes(serachGame))
      return
    const updatedGames = [...selectedGames];
    updatedGames.push(serachGame)
    setSelectedGames(updatedGames);
  }

  const handleRemoveGame = (game) => {
    setSelectedGames(selectedGames.filter(g => g !== game))
  }

  const handleSongChange = (song) => {
    setSearchSong(song)
  };

  const handleAddSong = () => {
    if (selectedSongs.includes(serachSong) || !SONGS.includes(serachSong))
      return
    const updatedSongs = [...selectedSongs];
    updatedSongs.push(serachSong)
    setSelectedSongs(updatedSongs);
  }

  const handleRemoveSong = (song) => {
    setSelectedSongs(selectedSongs.filter(s => s !== song))
  }

  const handleSave = () => {
    setIsLoading(true);
    axios.put(`${process.env.REACT_APP_API_URL}/api/replayline/${id}`, {
      date: eventDate,
      members: selectedMembers,
      contents: selectedContents,
      games: selectedGames,
      songs: selectedSongs
    })
      .then(() => {
        setIsLoading(false);
        navigate('/replayline', { state: { restoreScroll: true } });
      })
      .catch((error) => {
        console.error('Error updating event:', error);
        setIsLoading(false);
      });
  };

  return (
    <div className="edit-event-container">
      <h1>태그 수정</h1>
      {isLoading ? (
        <div>저장 중...</div>
      ) : (
        <>
          <div className="edit-event-form">
            <h2>{title}</h2>
            <div className="video-section">
              {videoId && (
                <iframe
                  className='responsive-video-iframe2'
                  src={`https://www.youtube.com/embed/${videoId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`YouTube video - ${title}`} // Add a descriptive title here
                ></iframe>
              )}
            </div>
            <label>
              날짜:
              <input type="date" value={eventDate} onChange={handleDateChange} />
            </label>

            <div className="edit-members-contents">
              <div className="edit-members">
                <h4>멤버:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {MEMBERS.map((member, index) => (
                    <label key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '1px' }}>
                      <input
                        type="checkbox"
                        checked={selectedMembers[index] === 1}
                        onChange={() => handleMemberChange(index)}
                      />{' '}
                      {member}
                    </label>
                  ))}
                </div>
              </div>

              <div className="edit-contents">
                <h4>콘텐츠:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {CONTENTS.map((content, index) => (
                    <label key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '1px' }}>
                      <input
                        type="checkbox"
                        checked={selectedContents[content]}
                        onChange={() => handleContentChange(content)}
                      />{' '}
                      {content}
                    </label>
                  ))}
                </div>
              </div>

              <div className="edit-games">
                <h4>게임</h4>
                <div className="game-search">
                  {/* ListFilter component for game search */}
                  <ListFilter targets={GAMES} handler={handleGameChange} text={''} />
                  <button className="add-game-button" onClick={handleAddGame}>추가</button>
                </div>

                <div className="selected-games">
                  {selectedGames.length === 0 ? (
                    <p>선택된 게임이 없습니다.</p>
                  ) : (
                    selectedGames.map((game, index) => (
                      <div key={index} className="selected-game-item">
                        <span className="game-name">{game}</span>
                        <button className="remove-game-button" onClick={() => handleRemoveGame(game)}>제거</button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="edit-games">
                <h4>노래</h4>
                <div className="game-search">
                  {/* ListFilter component for game search */}
                  <ListFilter targets={SONGS} handler={handleSongChange} text={''} />
                  <button className="add-game-button" onClick={handleAddSong}>추가</button>
                </div>

                <div className="selected-games">
                  {selectedSongs.length === 0 ? (
                    <p>선택된 노래가 없습니다.</p>
                  ) : (
                    selectedSongs.map((song, index) => (
                      <div key={index} className="selected-game-item">
                        <span className="game-name">{song}</span>
                        <button className="remove-game-button" onClick={() => handleRemoveSong(song)}>제거</button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
          <button className="save-button" onClick={handleSave}>저장</button>
          <button className="cancel-button" onClick={() => navigate('/replayline', { state: { restoreScroll: true } })}>취소</button>
        </>
      )}
    </div>
  );
};

export default EditReplayEvent;
