import './Filter.css';

const Filter = ({ targets, state, backgroundColor, color, handler }) => {
  return (
    <div className='filter-container'>
      {targets.map((el, index) => (
        <button
          key={index}
          className='filter-button'
          style={{
            backgroundColor: targets.length > 10 ? backgroundColor(el) : backgroundColor(index),
            color: targets.length > 10 ? color(el) : color(index),
            transform: state[index] ? 'scale(0.95)' : 'scale(1)',
          }}
          onClick={() => handler(targets.length > 10 ? el : index)}
        >
          {el}
        </button>
      ))}
    </div>
  );
};

export default Filter;