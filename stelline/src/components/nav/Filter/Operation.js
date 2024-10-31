const Operation = ({ backgroundColor, handler, text }) => {
  return (
    <div>
      <h4 style={{ textAlign: 'center' }}>필터 방식</h4>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          style={{
            padding: '8px 16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: backgroundColor,
            color: '#ffffff',
            cursor: 'pointer',
            transform: 'scale(0.95)',
            transition: 'transform 0.1s ease-in-out, background-color 0.1s ease-in-out',
          }}
          onClick={handler}
        >
          {text}
        </button>
      </div>
    </div>
  );
};

export default Operation;