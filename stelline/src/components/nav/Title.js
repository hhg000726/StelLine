const Title = () => {
    return (
        <h2
          style={{
            fontFamily: "'Noto Sans', sans-serif", // 깔끔한 폰트 사용
            fontSize: '20px', // 제목 크기 지정
            fontWeight: '700', // 굵게 강조
            textAlign: 'center', // 텍스트 가운데 정렬
            color: '#333', // 텍스트 색상
            backgroundColor: '#f0f0f0', // 배경색 추가
            padding: '10px', // 패딩으로 여백 추가
            borderRadius: '8px', // 둥근 모서리로 부드러운 느낌
            marginBottom: '20px', // 아래쪽 여백 추가
          }}
        >
          내비게이션
        </h2>
    )
}

export default Title