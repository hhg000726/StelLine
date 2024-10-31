const OneClickButton = ({ handler, text }) => {
    return (
        <button
          onClick={handler}
          style={{
            display: 'flex',
            justifyContent: 'center',
            position: 'sticky',
            bottom: '10px',
            width: '90%',
            margin: '10px auto',
            padding: '12px 16px',
            backgroundColor: '#4CAF50', // 메인 색상 (초록색)
            color: 'white', // 텍스트 색상
            border: 'none',
            borderRadius: '8px', // 둥근 모서리
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // 그림자 추가
            cursor: 'pointer',
            fontWeight: 'bold', // 글씨를 조금 더 두껍게
            transition: 'background-color 0.3s, transform 0.2s', // 배경색과 크기 변화에 애니메이션 적용
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45A049'} // 호버 시 색상 약간 어둡게
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'} // 클릭 시 크기 살짝 축소
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {text}
        </button>
    )
}

export default OneClickButton