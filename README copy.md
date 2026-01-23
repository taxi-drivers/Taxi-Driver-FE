# 🚗 인지 중심 운전 경로 추천 서비스

초보 운전자의 사고 예방을 위해 도로 환경의 위험 요소를 데이터로 정량화(난이도 점수)하고, 개인별 숙련도와 불안 요소를 반영한 맞춤형 안전 경로를 제공하는 시스템입니다.

## 📁 프로젝트 구조

```
Development/
├── backend/                 # Spring Boot 백엔드
│   ├── src/main/java/com/driving/backend/
│   │   ├── entity/          # JPA 엔티티 (User, RoadTile, TileScore, Route, Feedback)
│   │   └── BackendApplication.java
│   └── src/main/resources/
│       └── application.yml  # MySQL 및 JPA 설정
│
├── frontend/                # React 프론트엔드
│   ├── src/
│   │   ├── components/      # 재사용 컴포넌트
│   │   ├── pages/           # 페이지 컴포넌트 (MainPage, SurveyPage, MapPage)
│   │   ├── services/        # API 통신 (Axios)
│   │   └── types/           # TypeScript 타입 정의
│   └── package.json
│
└── README.md
```

## 🛠️ 기술 스택

### Backend
- **Java 17**
- **Spring Boot 3.2.1**
- **Spring Data JPA**
- **MySQL**
- **Lombok**

### Frontend
- **React 18**
- **TypeScript**
- **Vite**
- **Axios**
- **React Router DOM**

### External API
- **T map API** - 경로 탐색
- **OpenStreetMap** - 도로 형상 데이터

## 🚀 실행 방법

### 사전 요구사항
- Java 17+
- Node.js 18+
- MySQL 8.0+

### 1. 데이터베이스 설정

```sql
CREATE DATABASE driving_db;
```

`backend/src/main/resources/application.yml`에서 MySQL 비밀번호 수정:
```yaml
spring:
  datasource:
    password: your_password_here  # 실제 비밀번호로 변경
```

### 2. Backend 실행 (포트: 8080)

```bash
cd backend
./gradlew bootRun
```

> Windows: `gradlew.bat bootRun`

### 3. Frontend 실행 (포트: 5173)

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 📊 데이터 모델

| Entity | 주요 필드 |
|--------|----------|
| **User** | id, email, password, skillLevel (초보/중급/숙련), preferMode |
| **RoadTile** | tileId, latitude, longitude, difficulty (0~100), explanation |
| **TileScore** | slopeAvg, congestion, accidentRate, laneWidth, intersectionCount |
| **Route** | startLocation, endLocation, distance, avgDifficulty, polyline |
| **Feedback** | user, route, difficultyScore, reportType, comment |

## 📄 주요 페이지

- **MainPage** (`/`): 출발지/목적지 입력 및 경로 검색
- **SurveyPage** (`/survey`): 운전 숙련도 설문 (10문항, 5점 척도)
- **MapPage** (`/map`): 난이도 시각화 지도 및 경로 표시

## 📝 라이선스

This project is for educational purposes.