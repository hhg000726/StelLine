import React, { useState } from 'react';
import './ChannelFilter.css';

const MEMBERS = ['칸나', '유니', '히나', '시로', '리제', '타비', '부키', '린', '나나', '리코'];
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
];

const ChannelFilter = ({ onChannelsSelect }) => {
  const channels = Array.from({ length: 10 }, (_, i) => i); // [0, 1, 2, ..., 9]
  const [selectedChannels, setSelectedChannels] = useState([]);

  const toggleChannel = (channel) => {
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter((ch) => ch !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const applyFilter = () => {
    onChannelsSelect(selectedChannels);
  };

  return (
    <div className="channel-filter-container">
      <h3 className="filter-title">채널 고르기</h3>
      <div className="channels-list">
        {channels.map((channel) => (
          <button
            key={channel}
            className={`channel-button ${selectedChannels.includes(channel) ? 'selected' : ''}`}
            style={{
              backgroundColor: selectedChannels.includes(channel) ? COLORS[channel] : '#ffffff',
              color: selectedChannels.includes(channel) ? '#ffffff' : COLORS[channel],
              border: `2px solid ${COLORS[channel]}`
            }}
            onClick={() => toggleChannel(channel)}
          >
            {MEMBERS[channel]}
          </button>
        ))}
      </div>
      <button className="apply-filter-button" onClick={applyFilter} disabled={selectedChannels.length === 0}>
        시작
      </button>
    </div>
  );
};

export default ChannelFilter;