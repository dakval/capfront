import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import './App.css'; // CSS 파일을 분리하여 import

// TypeScript: 모달에 보여줄 페이지의 '상태'를 문자열로 정의
type ModalState = 'hidden' | 'login' | 'signup' | 'my-page';

// TypeScript: 메인 페이지의 식단 입력 타입을 정의
type MealInputType = 'text' | 'photo';

// TypeScript: 혈당 상태를 정의
type GlucoseStatus = 'normal' | 'pre-diabetic' | 'danger';

// TypeScript: 예측 기록 데이터의 형식을 정의
type PredictionRecord = {
  date: string; // X축 (예: "11/06 14:30")
  value: number; // Y축 (예: 146)
};

// --- [로그인 자동채우기] ---
// 로그인한 사용자의 정보 타입을 정의
type UserInfo = {
  gender: 'male' | 'female';
  birthYear: string;
  birthMonth: string; 
  birthDay: string; 
  height: string;
  weight: string;
};
// ---

/**
 * [0] 혈당 상태 그래프 컴포넌트 (메인 페이지용)
 */
const GlucoseStatusGraph = ({ value, status }: { value: number; status: GlucoseStatus | null }) => {
  if (!status) return null; // 상태가 null이면 그래프를 그리지 않음

  // 그래프 상의 화살표 위치를 계산하는 함수
  const getIndicatorPosition = () => {
    const min = 80; // 그래프의 최소값
    const max = 250; // 그래프의 최대값
    const clampedValue = Math.max(min, Math.min(value, max));
    const percentage = ((clampedValue - min) / (max - min)) * 100;
    return `max(0%, min(98%, ${percentage}%))`;
  };

  const statusInfo = {
    normal: { text: '정상', className: 'normal' },
    'pre-diabetic': { text: '당뇨 전단계', className: 'pre-diabetic' },
    danger: { text: '당뇨 관리 필요', className: 'danger' },
  };

  const currentStatus = statusInfo[status];

  return (
    <div className="status-graph-container">
      <div className="status-indicator" style={{ left: getIndicatorPosition() }}>
        <div className="indicator-value">{value}</div>
        <div className="indicator-arrow">▼</div>
      </div>
      <div className="status-bar">
        <div className="bar-segment normal" style={{ width: '35.3%' }}></div>
        <div className="bar-segment pre-diabetic" style={{ width: '34.7%' }}></div>
        <div className="bar-segment danger" style={{ width: '30%' }}></div>
      </div>
      <div className="status-labels">
        <span style={{ left: '35.3%' }}>140</span>
        <span style={{ left: '70%' }}>200</span>
      </div>
      <p className={`status-text ${currentStatus.className}`}>
        {currentStatus.text}
      </p>
    </div>
  );
};


/**
 * [1] 로그인 페이지 컴포넌트
 */
const LoginPage = ({ onPageChange, onLoginSuccess }: {
  onPageChange: (page: ModalState) => void;
  onLoginSuccess: (userInfo: UserInfo) => void;
}) => {
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  // 함수를 async로 변경
// [수정됨] 함수를 async로 변경
  const handleLogin = async () => {
    console.log('로그인 시도:', { loginId, loginPw });

    try {
      // --- 1단계: 로그인 API 호출 (토큰 받기) ---
      const loginResponse = await fetch('https://capcoder-backendauth.onrender.com/api/member/loginAction.do', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: loginId,
          password: loginPw,
        }),
      });

      if (!loginResponse.ok) {
        // 로그인 실패 (아이디, 비번 틀림 등)
        alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
        return; // 여기서 함수 종료
      }

      // 1단계 성공: 토큰 추출
      const loginData = await loginResponse.json();
      const token = loginData.token;

      if (!token) {
        alert('로그인에 성공했으나 토큰을 받지 못했습니다.');
        return;
      }
      
      // [중요] 토큰을 브라우저에 저장 (로그인 유지용)
      localStorage.setItem('authToken', token);

      // --- 2단계: 유저 정보 API 호출 (토큰 보내기) ---
      const userInfoResponse = await fetch('https://capcoder-backendauth.onrender.com/api/member/userInfo.do', {
        method: 'GET',
        headers: {
          // JWT 인증 표준 방식: 'Bearer {토큰}'
          'Authorization': `Bearer ${token}` 
        }
      });

      if (!userInfoResponse.ok) {
        throw new Error('토큰은 받았으나 유저 정보 로드에 실패했습니다.');
      }
      
      // 2단계 성공: 유저 정보 추출
      const userInfoData = await userInfoResponse.json();
      console.log('백엔드 /userInfo.do 에서 받은 데이터:', userInfoData);

      // API 응답(userInfoData)을 프론트엔드 타입(UserInfo)에 맞게 가공
      const [year, month, day] = (userInfoData.birthDate || '---').split('-');
      
      const userInfoFromBackend: UserInfo = {
        // API가 'female'을 주면 'female', 그 외(male 등)는 'male'
        gender: userInfoData.gender === 'female' ? 'female' : 'male',
        // [수정] Y, M, D를 각각 저장
        birthYear: year !== '-' ? year : '',
        birthMonth: month !== '-' ? month : '',
        birthDay: day !== '-' ? day : '',
        // API가 숫자를 줘도 String()으로 변환 (타입 일치)
        height: String(userInfoData.height || ''),
        weight: String(userInfoData.weight || ''),
      };
      
      alert('로그인 성공!');
      onLoginSuccess(userInfoFromBackend); // App.tsx에 '최종' 유저 정보 전달

    } catch (error) {
      console.error('로그인 처리 중 오류:', error);
      alert('로그인 중 오류가 발생했습니다.');
      // 오류 발생 시 혹시 모를 토큰 제거
      localStorage.removeItem('authToken'); 
    }
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
  
  const [idCheck, setIdCheck] = useState({ checked: false, available: false, message: '' });
  const [isCheckingId, setIsCheckingId] = useState(false);

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSignupForm({
      ...signupForm,
      [name]: value,
    });

    if (name === 'id') {
      setIdCheck({ checked: false, available: false, message: '' });
    }
  };

  // --- [ ▼ 여기에 새 함수 통째로 추가 ▼ ] ---
  // ID 중복 확인 함수
  const handleIdCheck = async () => {
    if (!signupForm.id) {
      alert('아이디를 먼저 입력해주세요.');
      return;
    }
    
    setIsCheckingId(true);
    setIdCheck({ checked: false, available: false, message: '확인 중...' });

    try {
      // 백엔드가 @RequestParam으로 받으므로 URLSearchParams를 사용
      const params = new URLSearchParams();
      params.append('userId', signupForm.id);

      const response = await fetch('https://capcoder-backendauth.onrender.com/api/member/checkId', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (response.ok) {
        const data = await response.json(); // { exists: false, available: true }
        if (data.available) {
          setIdCheck({ checked: true, available: true, message: '사용 가능한 아이디입니다.' });
        } else {
          setIdCheck({ checked: true, available: false, message: '이미 사용 중인 아이디입니다.' });
        }
      } else {
        setIdCheck({ checked: false, available: false, message: '중복 확인 중 오류 발생' });
      }
    } catch (error) {
      console.error('ID check network error:', error);
      setIdCheck({ checked: false, available: false, message: '네트워크 오류' });
    }
    setIsCheckingId(false);
  };

  // --- [415 오류 수정] ---
  // handleSignup 함수를 JSON 방식으로 수정
  const handleSignup = async () => {
      // ID 중복 확인을 통과했는지 검사
      if (!idCheck.checked || !idCheck.available) {
        alert('아이디 중복 확인을 먼저 완료해주세요.');
        return;
      }
     try{
       // [백엔드 연동] API 주소
       const response = await fetch('https://capcoder-backendauth.onrender.com/api/member/regist.do', {
         method: 'POST',
         headers: {
           // 'Content-Type'을 'application/json'으로 변경
           'Content-Type': 'application/json',
         },
         // body를 'JSON.stringify'를 사용해 JSON 문자열로 변경
         body: JSON.stringify({
           userId: signupForm.id,
           password: signupForm.pw,
           name: signupForm.name,
           gender: signupForm.gender,
           // 백엔드 DTO 필드명에 맞게 'birth'로 보냄
           birthDate: `${signupForm.birthYear}-${signupForm.birthMonth.padStart(2, '0')}-${signupForm.birthDay.padStart(2, '0')}`, // 'birth' -> 'birthDate'
           height: signupForm.height,
           weight: signupForm.weight,
         }),
       });

       console.log('회원가입 시도 (JSON):', JSON.stringify({
        userId: signupForm.id,
        password: signupForm.pw,
        name: signupForm.name,
        gender: signupForm.gender,
        birth: `${signupForm.birthYear}-${signupForm.birthMonth.padStart(2, '0')}-${signupForm.birthDay.padStart(2, '0')}`,
        height: signupForm.height,
        weight: signupForm.weight,
      }));

       if (response.ok) {
         alert('회원가입 성공!');
         onPageChange('login'); // 회원가입 성공 시 로그인 페이지로 이동
       } else {
         // 백엔드에서 보낸 구체적인 오류 메시지 확인 (선택 사항)
         const errorData = await response.json().catch(() => null);
         console.error('서버 응답 오류:', response.status, errorData);
         alert(`회원가입 실패. (서버 오류: ${response.status})`);
       }
     } catch (error){
       console.error('회원가입 네트워크 오류:', error);
       alert('회원가입 중 오류가 발생했습니다.');
     }
  };
  // --- [415 오류 수정 끝] ---

  return (
    <>
      <h1>회원가입</h1>
      
      {/* (회원가입 폼은 이전과 동일) */}
      <div className="input-group">
        <label htmlFor="name">이름</label>
        <input name="name" type="text" value={signupForm.name} onChange={handleSignupChange} />
      </div>
      <div className="input-group">
        <label>성별</label>
        <div className="radio-group">
          <label>
            <input type="radio" name="gender" value="male" checked={signupForm.gender === 'male'} onChange={handleSignupChange} /> 남
          </label>
          <label>
            <input type="radio" name="gender" value="female" checked={signupForm.gender === 'female'} onChange={handleSignupChange} /> 여
          </label>
        </div>
      </div>
      <div className="input-group">
        <label>생년월일</label>
        <div className="birth-group">
          <input name="birthYear" type="number" placeholder="YYYY" value={signupForm.birthYear} onChange={handleSignupChange} />
          <input name="birthMonth" type="number" placeholder="MM" value={signupForm.birthMonth} onChange={handleSignupChange} />
          <input name="birthDay" type="number" placeholder="DD" value={signupForm.birthDay} onChange={handleSignupChange} />
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
        <div className="id-check-group">
          <input
            name="id"
            type="text"
            value={signupForm.id}
            onChange={handleSignupChange}
          />
          <button
            onClick={handleIdCheck}
            disabled={isCheckingId}
            className="id-check-button"
          >
            {isCheckingId ? '확인 중' : '중복 확인'}
          </button>
        </div>
        {/* 중복 확인 결과 메시지 표시 */}
        {idCheck.message && (
          <p
            className="id-check-message"
            style={{ color: idCheck.available ? 'green' : 'red' }}
          >
            {idCheck.message}
          </p>
        )}
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
 * [3] 마이페이지 (꺾은선 그래프가 *빠진* 버전)
 */
const MyPage = ({ onLogout }: {
  onLogout: () => void;
}) => {
  return (
    <>
      <h1>마이 페이지</h1>
      <p>계정 관리 및 로그아웃을 할 수 있습니다.</p>
      
      {/* TODO: 여기에 나중에 프로필 수정 폼 등을 추가할 수 있습니다. */}

      <button className="auth-button logout-button" onClick={onLogout}>
        로그아웃
      </button>
    </>
  );
};


/**
 * [4] 메인 예측 페이지 컴포넌트
 */
// --- [로그인 자동채우기] ---
// onNewPrediction, isLoggedIn, history, userInfo를 props로 받음
const MainPage = ({ onNewPrediction, isLoggedIn, history, userInfo }: {
  onNewPrediction: (record: PredictionRecord) => void;
  isLoggedIn: boolean;
  history: PredictionRecord[];
  userInfo: UserInfo | null; // 로그인한 유저 정보
}) => {
  // ---

  const [formData, setFormData] = useState({
    gender: 'male',
    height: '',
    weight: '',
    birthYear: '',
    birthMonth: '', 
    birthDay: '',
    mealText: '',
  });
  const [mealInputType, setMealInputType] = useState<MealInputType>('text');
  const [mealFile, setMealFile] = useState<File | null>(null);
  const [predictedGlucose, setPredictedGlucose] = useState<number | null>(null);
  const [glucoseStatus, setGlucoseStatus] = useState<GlucoseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- [로그인 자동채우기] ---
  // userInfo prop이 변경될 때마다(로그인/로그아웃 시) 폼 데이터를 업데이트
  useEffect(() => {
    if (userInfo) {
      // 로그인 시: 유저 정보로 폼을 채움
      setFormData(prev => ({
        ...prev, // mealText 등 기존에 입력 중이던 값은 유지
        gender: userInfo.gender,
        height: userInfo.height,
        weight: userInfo.weight,
        birthYear: userInfo.birthYear,
        birthMonth: userInfo.birthMonth, 
        birthDay: userInfo.birthDay,     
      }));
    } else {
      // 로그아웃 시: 폼을 초기값으로 리셋
      setFormData({
        gender: 'male',
        height: '',
        weight: '',
        birthYear: '',
        birthMonth: '', 
        birthDay: '',   
        mealText: '',
      });
    }
  }, [userInfo]); // userInfo가 바뀔 때만 이 효과를 실행
  // ---

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

  // 함수를 async로 변경
  const handleSubmit = async () => {
    setIsLoading(true);
    setPredictedGlucose(null);
    setGlucoseStatus(null); 

    const apiFormData = new FormData();
    apiFormData.append('gender', formData.gender);
    apiFormData.append('height', formData.height);
    apiFormData.append('weight', formData.weight);
    apiFormData.append('birthYear', formData.birthYear);
    // (참고: 텍스트/사진 데이터는 아래 분기에서 추가)

    try {
      if (mealInputType === 'text') {
        // --- [텍스트 입력] ---
        // TODO: 백엔드 담당자에게 '텍스트'로 식단을 보냈을 때의
        // API 주소와 형식을 받아야 합니다.
        // (예: /api/gemini/textdb ?)
        
        console.error("아직 '직접 입력' API가 연동되지 않았습니다.");
        alert("현재 '사진 첨부' 기능만 사용 가능합니다. (텍스트 API 연동 필요)");

        // (임시로 가짜 데이터 로직을 남겨둡니다)
        setTimeout(() => {
          const randomGlucose = 150; // 가짜 데이터
          setPredictedGlucose(randomGlucose);
          setGlucoseStatus('pre-diabetic');
          onNewPrediction({ date: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }), value: randomGlucose });
          setIsLoading(false);
        }, 500);

      } else if (mealFile) {
        // --- [사진 첨부] ---
        apiFormData.append('mealPhoto', mealFile); // (백엔드에서 받을 key 이름 확인 필요)
        console.log('사진 예측 요청:', Object.fromEntries(apiFormData.entries()));

        const response = await fetch('https://capcoder-backendauth.onrender.com/api/gemini/imagedb', {
          method: 'POST',
          body: apiFormData, // FormData는 Content-Type을 'multipart/form-data'로 자동 설정
        });

        if (response.ok) {
          const data = await response.json(); // { predictedGlucose: 146, status: "..." } 같은 응답 가정
          
          // TODO: 백엔드 응답 형식을 확인하세요. (data.value? data.glucose?)
          const resultValue = data.predictedGlucose || 100; // 백엔드 응답 key에 맞게 수정
          
          setPredictedGlucose(resultValue);

          // 상태 분류
          let currentStatus: GlucoseStatus = 'normal';
          if (resultValue <= 140) currentStatus = 'normal';
          else if (resultValue <= 199) currentStatus = 'pre-diabetic';
          else currentStatus = 'danger';
          setGlucoseStatus(currentStatus);
          
          // 기록 추가
          onNewPrediction({
            date: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            value: resultValue,
          });
        } else {
          alert('사진 분석 중 오류가 발생했습니다.');
        }
        setIsLoading(false);
      } else {
        alert('식단 정보를 입력(또는 첨부)해주세요.');
        setIsLoading(false);
      }
    } catch(error) {
      console.error('예측 API 오류:', error);
      alert('예측 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="main-container">
      <h1>혈당 예측</h1>
      
      {/* (입력 폼 UI는 이전과 동일) */}
      {/* [로그인 자동채우기] value가 formData 상태를 따르므로 자동으로 채워짐 */}
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
        <label>생년월일</label>
        <div className="birth-group">
          <input name="birthYear" type="number" placeholder="YYYY" value={formData.birthYear} onChange={handleInputChange} />
          <input name="birthMonth" type="number" placeholder="MM" value={formData.birthMonth} onChange={handleInputChange} />
          <input name="birthDay" type="number" placeholder="DD" value={formData.birthDay} onChange={handleInputChange} />
        </div>
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

      {/* --- 결과 표시 영역 --- */}
      <div className="result-container">
        <h2>예상 식후 2시간 혈당</h2>
        {isLoading ? (
          <p className="result-placeholder">데이터를 분석 중입니다...</p>
        ) : predictedGlucose && glucoseStatus ? (
          <>
            <p className="result-value">
              {predictedGlucose} <span>mg/dL</span>
            </p>
            <GlucoseStatusGraph value={predictedGlucose} status={glucoseStatus} />
          </>
        ) : (
          <p className="result-placeholder">정보를 입력하고 버튼을 눌러주세요.</p>
        )}
      </div>

      {/* --- 꺾은선 그래프 섹션 --- */}
      {isLoggedIn && history.length > 0 && (
        <div className="history-chart-container">
          <h2>나의 혈당 예측 기록</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={history}
                margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis domain={[80, 250]} fontSize={12} />
                <Tooltip />
                <Legend />
                <ReferenceLine y={140} label="정상" stroke="green" strokeDasharray="3 3" />
                <ReferenceLine y={200} label="주의" stroke="red" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="예측 혈당" 
                  stroke="#007aff" 
                  strokeWidth={2} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};


/**
 * [5] 인증 모달 컴포넌트
 */
const AuthModal = ({ modalPage, onPageChange, onClose, onLoginSuccess, onLogout }: {
  modalPage: ModalState;
  onPageChange: (page: ModalState) => void;
  onClose: () => void;
  onLoginSuccess: (userInfo: UserInfo) => void; // 로그인 성공 시
  onLogout: () => void; // 로그아웃 시
}) => {
  if (modalPage === 'hidden') {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        
        {modalPage === 'login' && <LoginPage onPageChange={onPageChange} onLoginSuccess={onLoginSuccess} />}
        {modalPage === 'signup' && <SignupPage onPageChange={onPageChange} />}
        {modalPage === 'my-page' && <MyPage onLogout={onLogout} />}
      </div>
    </div>
  );
};

/**
 * [6] 플로팅 버튼 컴포넌트
 */
const FloatingAuthButton = ({ isLoggedIn, onClick }: {
  isLoggedIn: boolean;
  onClick: () => void;
}) => {
  return (
    <button 
      className="floating-auth-button" 
      onClick={onClick} 
      title={isLoggedIn ? "마이페이지" : "로그인 / 회원가입"}
    >
      {'👤'}
    </button>
  );
};

/**
 * [App] 메인 앱 컴포넌트
 */
/**
 * [App] 메인 앱 컴포넌트
 */
function App() {
  // --- 상태 관리 ---
  const [modalPage, setModalPage] = useState<ModalState>('hidden');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태
  const [predictionHistory, setPredictionHistory] = useState<PredictionRecord[]>([]); // 예측 기록
  
  // --- [로그인 자동채우기] ---
  // 로그인한 유저의 정보를 저장할 상태
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null);
  // ---

  
  // --- [ ▼ 모든 핸들러 함수를 여기로 이동 ▼ ] ---

  // --- 핸들러 함수 ---
  
  // 플로팅 버튼 클릭 시
  const handleOpenModal = () => {
    if (isLoggedIn) {
      setModalPage('my-page'); // 로그인 O -> 마이페이지 열기
    } else {
      setModalPage('login'); // 로그인 X -> 로그인 페이지 열기
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setModalPage('hidden');
  };

  // 로그인 성공 시 (LoginPage에서 호출 또는 자동로그인)
  const handleLoginSuccess = (userInfo: UserInfo) => { 
    setIsLoggedIn(true);
    setModalPage('hidden'); // 모달 닫기

    // --- [로그인 자동채우기] ---
    // (가짜 데이터를 삭제하고, 파라미터로 받은 실제 유저 정보를 저장)
    setCurrentUserInfo(userInfo);
    // ---

    // TODO: 로그인 성공 시, 백엔드에서 이 유저의 과거 예측 기록을 불러와
    // setPredictionHistory(...)에 채워넣어야 합니다.
    setPredictionHistory([
      { date: '10:00', value: 120 },
      { date: '14:30', value: 155 },
      { date: '19:15', value: 130 },
    ]);
  };

  // 로그아웃 시 (MyPage에서 호출 또는 자동로그인 실패)
  const handleLogout = () => {
    setIsLoggedIn(false);
    setModalPage('hidden'); // 모달 닫기
    setPredictionHistory([]); // 기록 초기화
    
    // --- [로그인 자동채우기] ---
    // 로그아웃 시 유저 정보와 폼을 리셋합니다.
    setCurrentUserInfo(null);
    // ---
    
    // [추가됨] 브라우저에 저장된 토큰 삭제
    localStorage.removeItem('authToken');

    alert('로그아웃되었습니다.');
  };

  // 새 예측 발생 시 (MainPage에서 호출)
  const handleNewPrediction = (newRecord: PredictionRecord) => {
    // 로그인 상태일 때만 기록을 저장합니다.
    if (isLoggedIn) {
      setPredictionHistory(prevHistory => [...prevHistory, newRecord]);
      // TODO: 이 새 기록(newRecord)을 백엔드 DB에도 저장해야 합니다.
      // (POST /api/v1/predictions)
    }
  };

  // --- [ ▲ 핸들러 함수 끝 ▲ ] ---


  // [추가됨] 앱이 처음 로드될 때(새로고침 시) 토큰을 확인하는 로직
  // (모든 핸들러 함수가 정의된 '이후'에 실행되어야 함)
  useEffect(() => {
    // 브라우저 저장소에서 토큰을 가져옴
    const token = localStorage.getItem('authToken');

    // 토큰이 존재하면, 이 토큰이 유효한지 확인하고 유저 정보를 가져옴
    if (token) {
      const fetchUserInfoOnLoad = async () => {
        try {
          // 2단계: 유저 정보 API 호출 (토큰 보내기)
          const userInfoResponse = await fetch('https://capcoder-backendauth.onrender.com/api/member/userInfo.do', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (userInfoResponse.ok) {
            // 성공: 유저 정보를 받아와서 로그인 처리
            const userInfoData = await userInfoResponse.json();
            
            // [수정] birthDate를 Y, M, D로 분해
            const [year, month, day] = (userInfoData.birthDate || '---').split('-');

            const userInfoFromBackend: UserInfo = {
              gender: userInfoData.gender === 'female' ? 'female' : 'male',
              // [수정] Y, M, D를 각각 저장
              birthYear: year !== '-' ? year : '',
              birthMonth: month !== '-' ? month : '',
              birthDay: day !== '-' ? day : '',
              height: String(userInfoData.height || ''),
              weight: String(userInfoData.weight || ''),
            };
            // App의 로그인 성공 함수를 호출 (state 업데이트)
            handleLoginSuccess(userInfoFromBackend);
          } else {
            // 실패: 토큰이 만료되었거나 유효하지 않음 -> 강제 로그아웃
            console.log('유효하지 않은 토큰, 자동 로그아웃 처리');
            // handleLogout(); // <- 로그아웃 알림이 뜨는 것을 방지하기 위해 alert를 뺌
            setIsLoggedIn(false);
            setCurrentUserInfo(null);
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.error('자동 로그인 중 오류 발생:', error);
          // handleLogout(); // <- 오류 시에도 알림 없이 로그아웃
          setIsLoggedIn(false);
          setCurrentUserInfo(null);
          localStorage.removeItem('authToken');
        }
      };

      fetchUserInfoOnLoad();
    }
  }, []); // '[]'는 이 useEffect가 앱 실행 시 딱 한 번만 실행되게 함


  return (
    <div className="App">
      {/* [로그인 자동채우기] 
        MainPage에 로그인 상태(isLoggedIn), 기록(history),
        새 예측 핸들러(onNewPrediction), 
        그리고 '로그인한 유저 정보(userInfo)'를 props로 전달 
      */}
      <MainPage 
        onNewPrediction={handleNewPrediction} 
        isLoggedIn={isLoggedIn}
        history={predictionHistory}
        userInfo={currentUserInfo}
      />

      {/* 플로팅 버튼 (isLoggedIn 상태를 props로 전달) */}
      <FloatingAuthButton isLoggedIn={isLoggedIn} onClick={handleOpenModal} />
      
      {/* 인증 모달 (모든 상태와 핸들러를 props로 전달) */}
      <AuthModal
        modalPage={modalPage}
        onPageChange={setModalPage}
        onClose={handleCloseModal}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;