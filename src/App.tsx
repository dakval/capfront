import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import './App.css';

// --- [1] 아이콘 컴포넌트 ---
const IconHome = ({ active }: { active: boolean }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={active ? "#007aff" : "#C7C7CC"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);
const IconCalendar = ({ active }: { active: boolean }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={active ? "#007aff" : "#C7C7CC"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
const IconUser = ({ active }: { active: boolean }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={active ? "#007aff" : "#C7C7CC"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

// --- [2] 타입 정의 ---
type NutrientVector = { total_carb: number; sugar: number; protein: number; total_fat: number; };
type UserInfo = { name: string; gender: 'male' | 'female'; birthYear: string; birthMonth: string; birthDay: string; height: string; weight: string; };
type PredictionRecord = { id?: number; fullDate: string; displayTime: string; value: number; };
type ModalState = 'hidden' | 'login' | 'signup';
type TabState = 'main' | 'calendar' | 'mypage';
type MealInputType = 'text' | 'photo';
type GlucoseStatus = 'normal' | 'pre-diabetic' | 'danger';
type SelectedFood = { name: string; nutrients: NutrientVector; portion: number; };

// --- [3] 계산 로직 ---
const CORR_WEIGHTS: NutrientVector = { total_carb: 0.20, sugar: 0.17, protein: 0.13, total_fat: 0.14 };
const estimateGlucoseDeltaFromNutrients = (nutrients: NutrientVector): number => {
  const norm = {
    total_carb: nutrients.total_carb / 10, sugar: nutrients.sugar / 5, protein: nutrients.protein / 5, total_fat: nutrients.total_fat,
  };
  const score = CORR_WEIGHTS.total_carb * norm.total_carb + CORR_WEIGHTS.sugar * norm.sugar + CORR_WEIGHTS.protein * norm.protein + CORR_WEIGHTS.total_fat * norm.total_fat;
  return score * 40;
};
const estimatePostMealGlucose = (nutrients: NutrientVector, baseGlucose: number = 100): number => {
  const delta = estimateGlucoseDeltaFromNutrients(nutrients);
  let predicted = baseGlucose + delta;
  predicted = Math.max(80, Math.min(250, predicted));
  return Math.round(predicted);
};

// --- [4] 컴포넌트들 ---

// [혈당 상태 그래프]
const GlucoseStatusGraph = ({ value, status }: { value: number; status: GlucoseStatus | null }) => {
  if (!status) return null;
  const getIndicatorPosition = () => {
    const percentage = ((Math.max(80, Math.min(value, 250)) - 80) / (250 - 80)) * 100;
    return `max(0%, min(98%, ${percentage}%))`;
  };
  const statusInfo = {
    normal: { text: '정상', className: 'normal', emoji: '😀', color: '#34C759' },
    'pre-diabetic': { text: '주의', className: 'pre-diabetic', emoji: '😐', color: '#FF9500' },
    danger: { text: '위험', className: 'danger', emoji: '😡', color: '#FF3B30' },
  };
  const current = statusInfo[status];

  return (
    <div className="status-graph-container">
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '5px' }}>{current.emoji}</div>
        <h2 style={{ color: current.color, margin: 0, fontSize: '28px' }}>{current.text}</h2>
      </div>
      <div className="graph-wrapper">
        <div className="status-indicator" style={{ left: getIndicatorPosition() }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100px' }}> 
            <div className="indicator-value" style={{ fontSize: '20px', fontWeight: '800', marginBottom: '2px' }}>{value}</div>
            <div className="indicator-arrow">▼</div>
          </div>
        </div>
        <div className="status-bar">
          <div className="bar-segment normal" style={{ width: '35.3%' }}></div>
          <div className="bar-segment pre-diabetic" style={{ width: '34.7%' }}></div>
          <div className="bar-segment danger" style={{ width: '30%' }}></div>
        </div>
        <div className="status-labels"><span style={{ left: '35.3%' }}>140</span><span style={{ left: '70%' }}>200</span></div>
      </div>
    </div>
  );
};

// [로그인 페이지]
const LoginPage = ({ onPageChange, onLoginSuccess }: { onPageChange: (page: ModalState) => void; onLoginSuccess: (userInfo: UserInfo) => void; }) => {
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const handleLogin = async () => {
    try {
      const loginResponse = await fetch('https://capcoder-backendauth.onrender.com/api/member/loginAction.do', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: loginId, password: loginPw }),
      });
      if (!loginResponse.ok) { alert('로그인 실패'); return; }
      const loginData = await loginResponse.json();
      if (!loginData.token) { alert('토큰 없음'); return; }
      localStorage.setItem('authToken', loginData.token);

      const userInfoResponse = await fetch('https://capcoder-backendauth.onrender.com/api/member/userInfo.do', {
        method: 'GET', headers: { 'Authorization': `Bearer ${loginData.token}` }
      });
      if (!userInfoResponse.ok) throw new Error('유저 정보 로드 실패');
      const userInfoData = await userInfoResponse.json();
      const [year, month, day] = (userInfoData.birthDate || '---').split('-');
      
      onLoginSuccess({
        name: userInfoData.name || '회원', gender: userInfoData.gender === 'female' ? 'female' : 'male',
        birthYear: year !== '-' ? year : '', birthMonth: month !== '-' ? month : '', birthDay: day !== '-' ? day : '',
        height: String(userInfoData.height || ''), weight: String(userInfoData.weight || ''),
      });
      alert('로그인 성공!');
    } catch (error) { console.error(error); alert('로그인 중 오류 발생'); }
  };

  return (
    <>
      <h1>로그인</h1>
      <div className="input-group"><label>ID</label><input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} /></div>
      <div className="input-group"><label>PW</label><input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} /></div>
      <button className="auth-button" onClick={handleLogin}>로그인하기</button>
      <div className="auth-switch"><span>계정이 없으신가요? </span><a href="#" onClick={(e) => { e.preventDefault(); onPageChange('signup'); }}>회원가입</a></div>
    </>
  );
};

// [회원가입 페이지]
const SignupPage = ({ onPageChange }: { onPageChange: (page: ModalState) => void }) => {
  const [signupForm, setSignupForm] = useState({ name: '', gender: 'male', birthYear: '', birthMonth: '', birthDay: '', height: '', weight: '', id: '', pw: '' });
  const [idCheck, setIdCheck] = useState({ checked: false, available: false, message: '' });
  const [isCheckingId, setIsCheckingId] = useState(false);

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSignupForm({ ...signupForm, [name]: value });
    if (name === 'id') setIdCheck({ checked: false, available: false, message: '' });
  };

  const handleIdCheck = async () => {
    if (!signupForm.id) return alert('아이디 입력 필요');
    setIsCheckingId(true);
    try {
      const params = new URLSearchParams();
      params.append('userId', signupForm.id);
      const response = await fetch('https://capcoder-backendauth.onrender.com/api/member/checkId', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params,
      });
      if (response.ok) {
        const data = await response.json();
        if (data.available) setIdCheck({ checked: true, available: true, message: '사용 가능' });
        else setIdCheck({ checked: true, available: false, message: '이미 사용 중' });
      }
    } catch (e) { alert('중복 확인 오류'); }
    setIsCheckingId(false);
  };

  const handleSignup = async () => {
    if (!idCheck.checked || !idCheck.available) return alert('중복 확인 필요');
    try {
      const response = await fetch('https://capcoder-backendauth.onrender.com/api/member/regist.do', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: signupForm.id, password: signupForm.pw, name: signupForm.name, gender: signupForm.gender,
          birthDate: `${signupForm.birthYear}-${signupForm.birthMonth.padStart(2, '0')}-${signupForm.birthDay.padStart(2, '0')}`,
          height: signupForm.height, weight: signupForm.weight,
        }),
      });
      if (response.ok) { alert('가입 성공'); onPageChange('login'); } else alert('가입 실패');
    } catch (e) { alert('오류 발생'); }
  };

  // 날짜 데이터
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
  const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <>
      <h1>회원가입</h1>
      <div className="input-group"><label>이름(닉네임)</label><input name="name" value={signupForm.name} onChange={handleSignupChange} /></div>
      <div className="input-group"><label>성별</label><div className="radio-group"><label><input type="radio" name="gender" value="male" checked={signupForm.gender === 'male'} onChange={handleSignupChange} /> 남</label><label><input type="radio" name="gender" value="female" checked={signupForm.gender === 'female'} onChange={handleSignupChange} /> 여</label></div></div>
      <div className="input-group"><label>생년월일</label>
        <div className="birth-group">
          <select name="birthYear" value={signupForm.birthYear} onChange={handleSignupChange}><option value="">년도</option>{YEARS.map(y => <option key={y} value={y}>{y}년</option>)}</select>
          <select name="birthMonth" value={signupForm.birthMonth} onChange={handleSignupChange}><option value="">월</option>{MONTHS.map(m => <option key={m} value={m}>{m}월</option>)}</select>
          <select name="birthDay" value={signupForm.birthDay} onChange={handleSignupChange}><option value="">일</option>{DAYS.map(d => <option key={d} value={d}>{d}일</option>)}</select>
        </div>
      </div>
      <div className="input-group"><label>키</label><input name="height" value={signupForm.height} onChange={handleSignupChange} /></div>
      <div className="input-group"><label>체중</label><input name="weight" value={signupForm.weight} onChange={handleSignupChange} /></div>
      <div className="input-group"><label>ID</label><div className="id-check-group"><input name="id" value={signupForm.id} onChange={handleSignupChange} /><button className="id-check-button" onClick={handleIdCheck} disabled={isCheckingId}>중복 확인</button></div>{idCheck.message && <p className="id-check-message" style={{ color: idCheck.available ? 'green' : 'red' }}>{idCheck.message}</p>}</div>
      <div className="input-group"><label>PW</label><input name="pw" type="password" value={signupForm.pw} onChange={handleSignupChange} /></div>
      <button className="auth-button" onClick={handleSignup}>가입하기</button>
      <div className="auth-switch"><span>이미 계정이 있으신가요? </span><a href="#" onClick={(e) => { e.preventDefault(); onPageChange('login'); }}>로그인</a></div>
    </>
  );
};

// [마이페이지]
const MyPage = ({ userInfo, onLogout, onUpdateUser }: { userInfo: UserInfo | null, onLogout: () => void, onUpdateUser: (updated: UserInfo) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserInfo | null>(null);
  const [recommendation, setRecommendation] = useState<string>("분석 중...");

  useEffect(() => {
    if (userInfo) {
      setEditForm(userInfo);
      const fetchRecommendation = async () => {
        try {
          const token = localStorage.getItem('authToken');
          const res = await fetch('https://capcoder-backendauth.onrender.com/api/gemini/recommend', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.text();
            setRecommendation(data);
          } else setRecommendation("아직 식단 데이터가 부족해요.");
        } catch (e) { setRecommendation("추천을 불러오지 못했습니다."); }
      };
      fetchRecommendation();
    }
  }, [userInfo]);

  if (!userInfo || !editForm) return <div>로딩 중...</div>;

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://capcoder-backendauth.onrender.com/api/member/mypage.do', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: editForm.name, gender: editForm.gender, height: Number(editForm.height), weight: Number(editForm.weight),
          birthDate: `${editForm.birthYear}-${editForm.birthMonth.padStart(2, '0')}-${editForm.birthDay.padStart(2, '0')}`
        })
      });
      if (response.ok) { alert('정보가 수정되었습니다.'); onUpdateUser(editForm); setIsEditing(false); }
      else { alert('수정 실패'); }
    } catch (error) { alert('서버 오류 발생'); }
  };

  // 날짜 데이터
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
  const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="mypage-container">
      <div className="profile-card">
        <div className="character-area"><span style={{ fontSize: '4rem' }}>{userInfo.gender === 'male' ? '👦' : '👧'}</span></div>
        <h2>{userInfo.name}님</h2>
        {!isEditing && <p className="sub-text">생년월일: {userInfo.birthYear}.{userInfo.birthMonth}.{userInfo.birthDay}</p>}
      </div>

      {isEditing ? (
        <div className="edit-form">
          <h3>정보 수정</h3>
          <div className="input-group"><label>이름</label><input name="name" value={editForm.name} onChange={handleEditChange} /></div>
          <div className="input-group"><label>생년월일</label>
            <div className="birth-group">
              <select name="birthYear" value={editForm.birthYear} onChange={handleEditChange}><option value="">년도</option>{YEARS.map(y => <option key={y} value={y}>{y}년</option>)}</select>
              <select name="birthMonth" value={editForm.birthMonth} onChange={handleEditChange}><option value="">월</option>{MONTHS.map(m => <option key={m} value={m}>{m}월</option>)}</select>
              <select name="birthDay" value={editForm.birthDay} onChange={handleEditChange}><option value="">일</option>{DAYS.map(d => <option key={d} value={d}>{d}일</option>)}</select>
            </div>
          </div>
          <div className="input-group"><label>키</label><input name="height" value={editForm.height} onChange={handleEditChange} /></div>
          <div className="input-group"><label>몸무게</label><input name="weight" value={editForm.weight} onChange={handleEditChange} /></div>
          <div className="edit-buttons">
            <button className="save-btn" onClick={handleSave}>저장</button>
            <button className="cancel-btn" onClick={() => { setIsEditing(false); setEditForm(userInfo); }}>취소</button>
          </div>
        </div>
      ) : (
        <>
          <div className="recommend-card" style={{background: '#e3f2fd', padding: '20px', borderRadius: '20px', marginBottom: '20px'}}>
             <h3 style={{fontSize: '1.1rem', margin: '0 0 10px 0', color: '#007aff'}}>🤖 AI 식단 조언</h3>
             <p style={{lineHeight: '1.6', fontSize: '0.95rem', color: '#333'}}>{recommendation}</p>
          </div>
          <div className="stats-card" style={{background: '#f9f9f9', padding: '20px', borderRadius: '20px', marginBottom: '30px'}}>
            <h3 style={{fontSize: '1.1rem', margin: '0 0 15px 0'}}>🏆 많이 먹은 메뉴</h3>
            <ol style={{paddingLeft: '20px', margin: 0, lineHeight: '1.8', color: '#555'}}>
                <li>닭가슴살 샐러드</li><li>김치찌개</li><li>현미밥</li>
            </ol>
          </div>
          <button className="edit-mode-btn" onClick={() => setIsEditing(true)}>개인정보 수정하기</button>
          <button className="logout-button" onClick={onLogout}>로그아웃</button>
        </>
      )}
    </div>
  );
};

// [New] 캘린더 페이지 (애플 스타일 + 백엔드 연동 + 삭제 기능)
const CalendarPage = () => {
  // 1. 상태 관리 (이제 스스로 데이터를 관리합니다)
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');

  // 2. 초기화 (오늘 날짜 선택)
  useEffect(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(todayStr);
  }, []);

  // 3. 백엔드 데이터 가져오기 (월이 바뀔 때마다 실행)
  useEffect(() => {
    const fetchLog = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const year = viewDate.getFullYear();
      const month = viewDate.getMonth() + 1;

      try {
        const res = await fetch(`https://capcoder-backendauth.onrender.com/api/my/glucoseLog.do?year=${year}&month=${month}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          // 백엔드 데이터를 프론트 형식으로 변환
          const formatted = data.map((item: any) => ({
            id: item.id, 
            fullDate: item.date, 
            displayTime: item.time, 
            value: item.glucose
          }));
          setHistory(formatted);
        }
      } catch (e) { console.error("로그 불러오기 실패", e); }
    };
    fetchLog();
  }, [viewDate]);

  // 4. 월 이동 함수
  const moveMonth = (direction: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + direction, 1);
    setViewDate(newDate);
  };

  // 5. 삭제 함수
  const handleDelete = async (id: number) => {
    if(!window.confirm("이 기록을 삭제하시겠습니까?")) return;
    // TODO: 백엔드 삭제 API가 나오면 주석 해제하고 연결!
    // await fetch(`https://capcoder-backendauth.onrender.com/api/delete?id=${id}`, { method: 'DELETE' ... });
    
    // (일단 화면에서만 지워줌)
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  // --- 달력 렌더링 로직 ---
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth() + 1;
  const daysInCurrentMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysArray = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  // 선택된 날짜 데이터 필터링
  const dailyData = history
    .filter(record => record.fullDate === selectedDate)
    .sort((a, b) => a.displayTime.localeCompare(b.displayTime));

  // 점 색깔 결정
  const getDayStatusColor = (records: PredictionRecord[]) => {
    if (records.length === 0) return null;
    if (records.some(r => r.value > 199)) return '#FF3B30'; // 위험
    if (records.some(r => r.value > 140)) return '#FF9500'; // 주의
    return '#34C759'; // 정상
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="nav-btn" onClick={() => moveMonth(-1)}>&lt;</button>
        <h2>{viewYear}년 {viewMonth}월</h2>
        <button className="nav-btn" onClick={() => moveMonth(1)}>&gt;</button>
      </div>
      
      <div className="calendar-grid">
        {WEEKDAYS.map((day, idx) => (
          <div key={day} className={`weekday-header ${idx === 0 ? 'sunday' : ''}`}>{day}</div>
        ))}
        {emptySlots.map(i => <div key={`empty-${i}`} className="empty-day"></div>)}
        {daysArray.map(day => {
          const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayRecords = history.filter(r => r.fullDate === dateStr);
          const dotColor = getDayStatusColor(dayRecords);
          
          return (
            <button
              key={day}
              className={`calendar-day ${selectedDate === dateStr ? 'selected' : ''}`}
              onClick={() => setSelectedDate(dateStr)}
            >
              <span className="day-number">{day}</span>
              {dotColor && <div className="dot" style={{ backgroundColor: dotColor }} />}
            </button>
          );
        })}
      </div>

      <div className="daily-chart-section">
        <h3>{selectedDate} 기록</h3>
        {dailyData.length > 0 ? (
          <div className="chart-wrapper">
            {/* 목록 리스트 + 삭제 버튼 */}
            <ul style={{listStyle: 'none', padding: 0, marginBottom: '20px'}}>
               {dailyData.map((record, idx) => (
                   <li key={idx} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #eee', fontSize:'14px'}}>
                       <span>{record.displayTime} - <strong style={{color: '#007aff'}}>{record.value}</strong></span>
                       <button onClick={() => handleDelete(record.id!)} style={{color:'#ff3b30', border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>삭제</button>
                   </li>
               ))}
            </ul>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayTime" fontSize={12} />
                <YAxis domain={[80, 250]} fontSize={12} />
                <Tooltip />
                <Legend />
                <ReferenceLine y={140} label="정상" stroke="green" strokeDasharray="3 3" />
                <ReferenceLine y={200} label="주의" stroke="red" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="value" name="예측 혈당" stroke="#007aff" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="no-data">이 날짜의 기록이 없습니다.</p>}
      </div>
      
      <div style={{height: '150px'}}></div>
    </div>
  );
};

// [메인 페이지]
const MainPage = ({ userInfo }: { userInfo: UserInfo | null; }) => {
  const [formData, setFormData] = useState({ gender: 'male', height: '', weight: '', birthYear: '', birthMonth: '', birthDay: '' });
  const [mealInputType, setMealInputType] = useState<MealInputType>('text');
  const [mealFile, setMealFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [predictedGlucose, setPredictedGlucose] = useState<number | null>(null);
  const [glucoseStatus, setGlucoseStatus] = useState<GlucoseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userInfo) {
        setFormData({ gender: userInfo.gender, height: userInfo.height, weight: userInfo.weight, birthYear: userInfo.birthYear, birthMonth: userInfo.birthMonth, birthDay: userInfo.birthDay });
    }
  }, [userInfo]);

  const handleSearch = async () => {
      if (!searchText.trim()) return;
      try {
          const res = await fetch(`https://capcoder-backendauth.onrender.com/api/food/search?keyword=${encodeURIComponent(searchText)}`);
          if (res.ok) { const data = await res.json(); setSearchResults(data); }
      } catch (e) { alert("검색 실패"); }
  };

  const addFood = (food: any) => {
      const newFood: SelectedFood = {
          name: food.name || food.desc_kor,
          nutrients: { total_carb: Number(food.carbohydrates || 0), sugar: Number(food.sugars || 0), protein: Number(food.protein || 0), total_fat: Number(food.fat || 0) },
          portion: 1
      };
      setSelectedFoods([...selectedFoods, newFood]); setSearchResults([]); setSearchText('');
  };

  const changePortion = (index: number, amount: number) => {
      const updated = [...selectedFoods]; updated[index].portion = amount; setSelectedFoods(updated);
  };

  const removeFood = (index: number) => {
      const updated = selectedFoods.filter((_, i) => i !== index); setSelectedFoods(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMealFile(file); setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true); setPredictedGlucose(null); setGlucoseStatus(null);
    try {
        let totalNutrients: NutrientVector = { total_carb: 0, sugar: 0, protein: 0, total_fat: 0 };
        let resultValue = 0;

        if (mealInputType === 'text') {
            if (selectedFoods.length === 0) { alert("음식을 추가해주세요."); setIsLoading(false); return; }
            selectedFoods.forEach(food => {
                totalNutrients.total_carb += food.nutrients.total_carb * food.portion;
                totalNutrients.sugar += food.nutrients.sugar * food.portion;
                totalNutrients.protein += food.nutrients.protein * food.portion;
                totalNutrients.total_fat += food.nutrients.total_fat * food.portion;
            });
            resultValue = estimatePostMealGlucose(totalNutrients, 100);

        } else if (mealFile) {
            const apiFormData = new FormData(); apiFormData.append('image', mealFile);
            const res = await fetch('https://capcoder-backendauth.onrender.com/api/gemini/imagedb', { method: 'POST', body: apiFormData });
            if(res.ok) {
                const raw = await res.text();
                const jsonData = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
                if (typeof jsonData.predictedGlucose === 'number') resultValue = jsonData.predictedGlucose;
                else {
                    const currentNutrients = { total_carb: parseFloat(jsonData.total_carb) || 0, sugar: parseFloat(jsonData.sugar) || 0, protein: parseFloat(jsonData.protein) || 0, total_fat: parseFloat(jsonData.total_fat) || 0 };
                    resultValue = estimatePostMealGlucose(currentNutrients, 100);
                }
            }
        } else { alert("입력 확인 필요"); setIsLoading(false); return; }

        setPredictedGlucose(resultValue);
        let status: GlucoseStatus = 'normal';
        if (resultValue > 199) status = 'danger'; else if (resultValue > 140) status = 'pre-diabetic';
        setGlucoseStatus(status);

        // TODO: 백엔드 저장 API 연결 (POST)

    } catch (e) { console.error(e); alert("오류 발생"); }
    setIsLoading(false);
  };

  // 날짜 데이터
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
  const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="main-container">
      <h1>혈당 예측</h1>
      
      <div className="input-group"><label>식단 입력</label>
        <div className="meal-input-group"><button className={mealInputType === 'text' ? 'active' : ''} onClick={() => setMealInputType('text')}>텍스트 검색</button><button className={mealInputType === 'photo' ? 'active' : ''} onClick={() => setMealInputType('photo')}>사진 첨부</button></div>
        
        {mealInputType === 'text' ? (
            <div style={{marginTop: '1rem'}}>
                <div style={{display: 'flex', gap: '5px'}}>
                    <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="예: 피자" />
                    <button onClick={handleSearch} style={{width:'60px', background:'#333', color:'white', border:'none', borderRadius:'8px'}}>검색</button>
                </div>
                {searchResults.length > 0 && (
                    <ul style={{border:'1px solid #eee', maxHeight:'150px', overflowY:'auto', padding:'0', listStyle:'none', marginTop:'5px'}}>
                        {searchResults.map((food, idx) => (<li key={idx} onClick={() => addFood(food)} style={{padding:'10px', borderBottom:'1px solid #eee', cursor:'pointer'}}>{food.name || food.desc_kor}</li>))}
                    </ul>
                )}
                <div style={{marginTop: '15px'}}>
                    {selectedFoods.map((food, idx) => (
                        <div key={idx} style={{background:'#f9f9f9', padding:'10px', borderRadius:'8px', marginBottom:'8px'}}>
                            <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold'}}>{food.name} <span onClick={() => removeFood(idx)} style={{color:'red', cursor:'pointer'}}>✕</span></div>
                            <div style={{marginTop:'5px', display:'flex', gap:'5px'}}>
                                {[0.25, 0.5, 1, 2].map(p => (
                                    <button key={p} 
                                        onClick={() => changePortion(idx, p)}
                                        style={{
                                            flex: 1, padding: '5px', border: '1px solid #ddd', 
                                            background: food.portion === p ? '#007aff' : 'white',
                                            color: food.portion === p ? 'white' : '#333',
                                            borderRadius: '4px', fontSize: '0.8rem'
                                        }}
                                    >
                                        {p === 0.25 ? '1/4인분' : p === 0.5 ? '1/2인분' : p + '인분'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div><input type="file" accept="image/*" onChange={handleFileChange} style={{ marginTop: '1rem' }} />{previewUrl && <img src={previewUrl} alt="preview" style={{maxWidth:'200px', marginTop:'10px'}}/>}</div>
        )}
      </div>

      <button className="predict-button" onClick={handleSubmit} disabled={isLoading}>{isLoading ? '분석 중...' : '예측하기'}</button>

      <div className="result-container">
        {predictedGlucose ? <GlucoseStatusGraph value={predictedGlucose} status={glucoseStatus} /> : <p className="result-placeholder">정보를 입력해주세요.</p>}
      </div>
      <div style={{height: '150px'}}></div>
    </div>
  );
};

// [5] 로그인 필요 안내
const LoginRequiredView = ({ onLoginClick }: { onLoginClick: () => void }) => (
  <div className="login-required-container">
    <div className="icon">🔒</div><h2>로그인 필요</h2><p>기록을 관리하려면 로그인하세요.</p>
    <button className="auth-button" onClick={onLoginClick}>로그인</button>
  </div>
);

// [6] 모달
const AuthModal = ({ modalPage, onPageChange, onClose, onLoginSuccess }: { modalPage: ModalState, onPageChange: (p: ModalState) => void, onClose: () => void, onLoginSuccess: (u: UserInfo) => void }) => {
  if (modalPage === 'hidden') return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        {modalPage === 'login' && <LoginPage onPageChange={onPageChange} onLoginSuccess={onLoginSuccess} />}
        {modalPage === 'signup' && <SignupPage onPageChange={onPageChange} />}
      </div>
    </div>
  );
};

// [App]
function App() {
  const [modalPage, setModalPage] = useState<ModalState>('hidden');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null);
  const [currentTab, setCurrentTab] = useState<TabState>('main');

  const handleLoginSuccess = (userInfo: UserInfo) => {
    setIsLoggedIn(true); setModalPage('hidden'); setCurrentUserInfo(userInfo);
  };
  const handleLogout = () => {
    setIsLoggedIn(false); setModalPage('hidden'); setCurrentUserInfo(null); localStorage.removeItem('authToken'); alert('로그아웃');
  };

  // [누락되었던 함수 추가!]
  const handleUserInfoUpdate = (updatedUser: UserInfo) => {
    setCurrentUserInfo(updatedUser);
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
        const fetchUser = async () => {
            try {
                const res = await fetch('https://capcoder-backendauth.onrender.com/api/member/userInfo.do', { headers: { 'Authorization': `Bearer ${token}` }});
                if(res.ok) {
                    const data = await res.json();
                    const [y, m, d] = (data.birthDate || '--').split('-');
                    handleLoginSuccess({ name: data.name||'회원', gender: data.gender==='female'?'female':'male', birthYear:y, birthMonth:m, birthDay:d, height:String(data.height), weight:String(data.weight) });
                } else { localStorage.removeItem('authToken'); }
            } catch(e) { localStorage.removeItem('authToken'); }
        };
        fetchUser();
    }
  }, []);

  return (
    <div className="App">
      <div className="content-area">
        {currentTab === 'main' && <MainPage userInfo={currentUserInfo} />}
        {currentTab === 'calendar' && (isLoggedIn ? <CalendarPage /> : <LoginRequiredView onLoginClick={() => setModalPage('login')} />)}
        {currentTab === 'mypage' && (isLoggedIn ? <MyPage userInfo={currentUserInfo} onLogout={handleLogout} onUpdateUser={handleUserInfoUpdate} /> : <LoginRequiredView onLoginClick={() => setModalPage('login')} />)}
      </div>
      
      <nav className="bottom-nav-bar">
        <button className={currentTab === 'main' ? 'active' : ''} onClick={() => setCurrentTab('main')}><IconHome active={currentTab === 'main'} /></button>
        <button className={currentTab === 'calendar' ? 'active' : ''} onClick={() => setCurrentTab('calendar')}><IconCalendar active={currentTab === 'calendar'} /></button>
        <button className={currentTab === 'mypage' ? 'active' : ''} onClick={() => setCurrentTab('mypage')}><IconUser active={currentTab === 'mypage'} /></button>
      </nav>
      <AuthModal modalPage={modalPage} onPageChange={setModalPage} onClose={() => setModalPage('hidden')} onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}

export default App;