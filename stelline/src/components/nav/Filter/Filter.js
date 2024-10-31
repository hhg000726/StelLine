const Filter = ({ targets, state, backgroundColor, color, handler }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
      {targets.map((el, index) => (
        <button
          key={index}
          style={{
            padding: '8px 2px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            width: '70px',
            backgroundColor: targets.length > 10 ? backgroundColor(el) : backgroundColor(index),
            color: targets.length > 10 ? color(el) : color(index),
            cursor: 'pointer',
            transform: state[index] ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.1s ease-in-out, background-color 0.1s ease-in-out',
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