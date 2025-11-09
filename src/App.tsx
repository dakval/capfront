import React, { useState } from 'react';

// App.css의 내용을 style 태그로 여기에 포함시킵니다.
const styles = `
:root {
  --primary-color: #007bff;
  --light-gray: #f4f7f6;
  --gray: #ccc;
  --dark-gray: #555;
  --white: #ffffff;
  --danger-color: #dc3545;
  --bg-color: #f4f7f6;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--bg-color);
  margin: 0;
  padding: 0;
}

/* --- 전체 앱 레이아웃 --- */
.App {
  display: flex;
  justify-content: center; /* 수평 중앙 정렬 */
  align-items: flex-start; /* 상단 정렬 */
  min-height: 100vh; /* 화면 전체 높이 */
  padding: 2rem;
  box-sizing: border-box;
}

/* --- 메인 페이지 컨테이너 --- */
.main-container {
  width: 100%;
  max-width: 600px; /* 메인 컨텐츠 최대 너비 */
  background-color: var(--white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.main-container h1 {
  text-align: center;
  color: var(--dark-gray);
  margin-top: 0;
}

/* --- 결과 표시줄 --- */
.result-container {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: var(--light-gray);
  border-radius: 8px;
  text-align: center;
}

.result-container h2 {
  margin-top: 0;
  color: var(--primary-color);
}

.result-placeholder {
  color: var(--dark-gray);
  font-style: italic;
}

.result-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--danger-color);
}

.result-value span {
  font-size: 1.2rem;
  font-weight: normal;
  color: var(--dark-gray);
  margin-left: 0.5rem;
}

/* --- 플로팅 버튼 --- */
.floating-auth-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  background-color: var(--primary-color);
  color: var(--white);
  border-radius: 50%;
  border: none;
  font-size: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.floating-auth-button:hover {
  transform: scale(1.1);
}

/* --- 모달 --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background-color: var(--white);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  /* auth-container 스타일을 모달 컨텐츠에 통합 */
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  box-sizing: border-box;
}

.modal-close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--gray);
  cursor: pointer;
}

/* --- 공통 폼 스타일 (로그인/회원가입/메인) --- */
.input-group {
  margin-bottom: 1.5rem;
  width: 100%;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--dark-gray);
}

.input-group input[type="text"],
.input-group input[type="password"],
.input-group input[type="number"],
.input-group input[type="file"],
.input-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray);
  border-radius: 8px;
  box-sizing: border-box; /* 패딩이 너비를 밀어내지 않도록 */
  font-size: 1rem;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-group label {
  font-weight: normal;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.birth-group {
  display: flex;
  gap: 0.5rem;
}

.birth-group input {
  text-align: center;
}

.meal-input-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.meal-input-group button {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--primary-color);
  background-color: var(--white);
  color: var(--primary-color);
  cursor: pointer;
  font-weight: 600;
}

.meal-input-group button.active {
  background-color: var(--primary-color);
  color: var(--white);
}

/* --- 공통 버튼 스타일 --- */
.auth-button,
.predict-button {
  width: 100%;
  padding: 0.85rem;
  border: none;
  border-radius: 8px;
  background-color: var(--primary-color);
  color: var(--white);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 1rem;
}

.auth-button:hover,
.predict-button:hover {
  background-color: #0056b3;
}

.auth-links {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.auth-links a {
  color: var(--dark-gray);
  text-decoration: none;
}

.auth-links a:hover {
  text-decoration: underline;
}

.auth-switch {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}

.auth-switch a {
  color: var(--primary-color);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.auth-switch a:hover {
  text-decoration: underline;
}
`;

// TypeScript를 사용하므로, 모달에 보여줄 페이지의 '상태'를 문자열로 정의합니다.
type ModalState = 'hidden' | 'login' | 'signup';

// 메인 페이지의 식단 입력 타입을 정의합니다.
type MealInputType = 'text' | 'photo';

/**
 * [1] 로그인 페이지 컴포넌트
 */
const LoginPage = ({ onPageChange }: { onPageChange: (page: ModalState) => void }) => {
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const handleLogin = () => {
    // TODO: 백엔드 로그인 API (POST /api/v1/auth/login) 호출
    console.log('로그인 시도:', { loginId, loginPw });
    alert('로그인 성공! (임시)');
    onPageChange('hidden'); // 로그인 성공 시 모달 닫기
  };

  return (
    <>
      <h1>로그인</h1>
      
      <div className="input-group">
        <label htmlFor="loginId">ID</label>
        <input
          id="loginId"
          type="text"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="아이디를 입력하세요"
        />
      </div>
      
      <div className="input-group">
        <label htmlFor="loginPw">PW</label>
        <input
          id="loginPw"
          type="password"
          value={loginPw}
          onChange={(e) => setLoginPw(e.target.value)}
          placeholder="비밀번호를 입력하세요"
        />
      </div>
      
      <button className="auth-button" onClick={handleLogin}>
        로그인하기
      </button>

      <div className="auth-links">
        <a href="#" onClick={(e) => { e.preventDefault(); alert('아이디 찾기 기능'); }}>
          아이디 찾기
        </a>
        <span>|</span>
        <a href="#" onClick={(e) => { e.preventDefault(); alert('비밀번호 찾기 기능'); }}>
          비밀번호 찾기
        </a>
      </div>

      <div className="auth-switch">
        <span>계정이 없으신가요? </span>
        <a href="#" onClick={(e) => { e.preventDefault(); onPageChange('signup'); }}>
          회원가입
        </a>
      </div>
    </>
  );
};

/**
 * [2] 회원가입 페이지 컴포넌트
 */
const SignupPage = ({ onPageChange }: { onPageChange: (page: ModalState) => void }) => {
  const [signupForm, setSignupForm] = useState({
    name: '',
    gender: 'male',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    height: '',
    weight: '',
    id: '',
    pw: '',
  });

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSignupForm({
      ...signupForm,
      [name]: value,
    });
  };

  const handleSignup = () => {
    // TODO: 백엔드 회원가입 API (POST /api/v1/auth/signup) 호출
    console.log('회원가입 시도:', signupForm);
    alert('회원가입 성공! (임시)');
    onPageChange('login'); // 회원가입 성공 시 로그인 페이지로 이동
  };

  return (
    <>
      <h1>회원가입</h1>
      
      {/* 회원가입 폼 */}
      <div className="input-group">
        <label htmlFor="name">이름</label>
        <input name="name" type="text" value={signupForm.name} onChange={handleSignupChange} />
      </div>

      <div className="input-group">
        <label>성별</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="gender"
              value="male"
              checked={signupForm.gender === 'male'}
              onChange={handleSignupChange}
            /> 남
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="female"
              checked={signupForm.gender === 'female'}
              onChange={handleSignupChange}
            /> 여
          </label>
        </div>
      </div>

      <div className="input-group">
        <label>생년월일</label>
        <div className="birth-group">
          <input name="birthYear" type="text" placeholder="YYYY" value={signupForm.birthYear} onChange={handleSignupChange} />
          <input name="birthMonth" type="text" placeholder="MM" value={signupForm.birthMonth} onChange={handleSignupChange} />
          <input name="birthDay" type="text" placeholder="DD" value={signupForm.birthDay} onChange={handleSignupChange} />
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="height">키 (cm)</label>
        <input name="height" type="number" value={signupForm.height} onChange={handleSignupChange} />
      </div>

      <div className="input-group">
        <label htmlFor="weight">체중 (kg)</label>
        <input name="weight" type="number" value={signupForm.weight} onChange={handleSignupChange} />
      </div>

      <div className="input-group">
        <label htmlFor="id">ID</label>
        <input name="id" type="text" value={signupForm.id} onChange={handleSignupChange} />
      </div>

      <div className="input-group">
        <label htmlFor="pw">PW</label>
        <input name="pw" type="password" value={signupForm.pw} onChange={handleSignupChange} />
      </div>
      
      <button className="auth-button" onClick={handleSignup}>
        가입하기
      </button>

      <div className="auth-switch">
        <span>이미 계정이 있으신가요? </span>
        <a href="#" onClick={(e) => { e.preventDefault(); onPageChange('login'); }}>
          로그인
        </a>
      </div>
    </>
  );
};


/**
 * [3] 메인 예측 페이지 컴포넌트
 */
const MainPage = () => {
  const [formData, setFormData] = useState({
    gender: 'male',
    height: '',
    weight: '',
    birthYear: '',
    mealText: '',
  });
  const [mealInputType, setMealInputType] = useState<MealInputType>('text');
  const [mealFile, setMealFile] = useState<File | null>(null);
  const [predictedGlucose, setPredictedGlucose] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMealFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    setIsLoading(true);
    setPredictedGlucose(null);

    // TODO: 백엔드 예측 API (POST /api/v1/predict) 호출
    // FormData를 사용해야 사진 파일과 텍스트 데이터를 함께 보낼 수 있습니다.
    const apiFormData = new FormData();
    apiFormData.append('gender', formData.gender);
    apiFormData.append('height', formData.height);
    apiFormData.append('weight', formData.weight);
    apiFormData.append('birthYear', formData.birthYear);
    
    if (mealInputType === 'text') {
      apiFormData.append('mealText', formData.mealText);
    } else if (mealFile) {
      apiFormData.append('mealPhoto', mealFile);
    }

    console.log('예측 요청 데이터:', Object.fromEntries(apiFormData.entries()));

    // --- 가짜 API 호출 (2초 딜레이) ---
    setTimeout(() => {
      // 100 ~ 200 사이의 랜덤한 예측 혈당값 생성 (임시)
      const randomGlucose = Math.floor(Math.random() * 101) + 100;
      setPredictedGlucose(randomGlucose);
      setIsLoading(false);
    }, 2000);
    // ---------------------------------
  };

  return (
    <div className="main-container">
      <h1>혈당 예측</h1>
      
      <div className="input-group">
        <label>성별</label>
        <div className="radio-group">
          <label>
            <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleInputChange} /> 남
          </label>
          <label>
            <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleInputChange} /> 여
          </label>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="birthYear">태어난 연도</label>
        <input name="birthYear" type="number" placeholder="YYYY" value={formData.birthYear} onChange={handleInputChange} />
      </div>

      <div className="input-group">
        <label htmlFor="height">키 (cm)</label>
        <input name="height" type="number" placeholder="예: 170" value={formData.height} onChange={handleInputChange} />
      </div>

      <div className="input-group">
        <label htmlFor="weight">체중 (kg)</label>
        <input name="weight" type="number" placeholder="예: 65" value={formData.weight} onChange={handleInputChange} />
      </div>

      <div className="input-group">
        <label>식단 (사진 또는 직접 입력)</label>
        <div className="meal-input-group">
          <button
            className={mealInputType === 'text' ? 'active' : ''}
            onClick={() => setMealInputType('text')}
          >
            직접 입력
          </button>
          <button
            className={mealInputType === 'photo' ? 'active' : ''}
            onClick={() => setMealInputType('photo')}
          >
            사진 첨부
          </button>
        </div>
        
        {mealInputType === 'text' ? (
          <input
            name="mealText"
            type="text"
            placeholder="예: 백미밥, 닭가슴살 샐러드"
            value={formData.mealText}
            onChange={handleInputChange}
            style={{ marginTop: '1rem' }}
          />
        ) : (
          <input
            name="mealPhoto"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ marginTop: '1rem' }}
          />
        )}
      </div>

      <button className="predict-button" onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? '예측 중...' : '예측하기'}
      </button>

      <div className="result-container">
        <h2>예상 식후 2시간 혈당</h2>
        {isLoading ? (
          <p className="result-placeholder">데이터를 분석 중입니다...</p>
        ) : predictedGlucose ? (
          <p className="result-value">
            {predictedGlucose} <span>mg/dL</span>
          </p>
        ) : (
          <p className="result-placeholder">정보를 입력하고 버튼을 눌러주세요.</p>
        )}
      </div>
    </div>
  );
};


/**
 * [4] 인증 모달 컴포넌트
 */
const AuthModal = ({ modalPage, onPageChange, onClose }: {
  modalPage: ModalState;
  onPageChange: (page: ModalState) => void;
  onClose: () => void;
}) => {
  if (modalPage === 'hidden') {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        {modalPage === 'login' && <LoginPage onPageChange={onPageChange} />}
        {modalPage === 'signup' && <SignupPage onPageChange={onPageChange} />}
      </div>
    </div>
  );
};

/**
 * [5] 플로팅 버튼 컴포넌트
 */
const FloatingAuthButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button className="floating-auth-button" onClick={onClick} title="로그인 / 회원가입">
      👤
    </button>
  );
};

/**
 * [App] 메인 앱 컴포넌트
 */
function App() {
  const [modalPage, setModalPage] = useState<ModalState>('hidden');

  const handleOpenModal = () => {
    setModalPage('login'); // 모달을 열면 항상 로그인 페이지부터 보여줌
  };

  const handleCloseModal = () => {
    setModalPage('hidden');
  };

  return (
    <div className="App">
      {/* 스타일 태그를 여기에 삽입 */}
      <style>{styles}</style>
      
      {/* 메인 페이지는 항상 렌더링 */}
      <MainPage />

      {/* 플로팅 버튼 */}
      <FloatingAuthButton onClick={handleOpenModal} />
      
      {/* 인증 모달 (로그인/회원가입) */}
      <AuthModal
        modalPage={modalPage}
        onPageChange={setModalPage}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default App;