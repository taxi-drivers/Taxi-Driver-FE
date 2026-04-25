/**
 * 카카오 로컬 검색 API 기반 지오코딩
 *
 * 키워드 → 좌표 변환 + 강남구 범위 검증.
 *
 * 사용 전 .env(.local)에 VITE_KAKAO_REST_API_KEY 설정 필요.
 * 카카오 디벨로퍼스에서 사이트 도메인에 http://localhost:5173 등록 필수.
 */

import axios from 'axios';

// 강남구 대략 bounding box (라벨링 데이터 기준)
export const GANGNAM_BOUNDS = {
  minLat: 37.46,
  maxLat: 37.55,
  minLon: 127.01,
  maxLon: 127.11,
} as const;

export interface GeocodedPlace {
  name: string;          // 검색 결과 명칭
  address: string;       // 도로명 또는 지번 주소
  lat: number;
  lon: number;
}

export class GeocodeError extends Error {
  constructor(
    public readonly code: 'NO_API_KEY' | 'NO_RESULT' | 'OUT_OF_BOUNDS' | 'NETWORK_ERROR',
    message: string,
    public readonly place?: GeocodedPlace
  ) {
    super(message);
    this.name = 'GeocodeError';
  }
}

interface KakaoLocalDocument {
  place_name: string;
  road_address_name: string;
  address_name: string;
  x: string;  // longitude
  y: string;  // latitude
}

interface KakaoLocalResponse {
  documents: KakaoLocalDocument[];
}

const KAKAO_KEYWORD_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

export const isWithinGangnam = (lat: number, lon: number): boolean => {
  return (
    lat >= GANGNAM_BOUNDS.minLat &&
    lat <= GANGNAM_BOUNDS.maxLat &&
    lon >= GANGNAM_BOUNDS.minLon &&
    lon <= GANGNAM_BOUNDS.maxLon
  );
};

export interface PlaceSearchResult extends GeocodedPlace {
  withinGangnam: boolean;
}

/**
 * 키워드로 후보 장소 목록 검색 (자동완성용).
 * 강남구 안/밖 모두 반환하되 withinGangnam 플래그로 구분.
 */
export const searchPlaces = async (keyword: string, limit = 7): Promise<PlaceSearchResult[]> => {
  const apiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
  if (!apiKey || apiKey === 'your_kakao_rest_api_key_here') {
    throw new GeocodeError(
      'NO_API_KEY',
      '카카오 API 키가 설정되지 않았습니다. .env.local에 VITE_KAKAO_REST_API_KEY를 등록해주세요.'
    );
  }

  let response;
  try {
    response = await axios.get<KakaoLocalResponse>(KAKAO_KEYWORD_URL, {
      params: { query: keyword, size: Math.min(Math.max(limit, 1), 15) },
      headers: { Authorization: `KakaoAK ${apiKey}` },
      timeout: 5000,
    });
  } catch {
    throw new GeocodeError('NETWORK_ERROR', `'${keyword}' 검색 중 오류가 발생했습니다.`);
  }

  const docs = response.data.documents ?? [];
  return docs.map((d) => {
    const lat = parseFloat(d.y);
    const lon = parseFloat(d.x);
    return {
      name: d.place_name,
      address: d.road_address_name || d.address_name,
      lat,
      lon,
      withinGangnam: isWithinGangnam(lat, lon),
    };
  });
};

/**
 * 키워드를 좌표로 변환. 강남구 밖이면 OUT_OF_BOUNDS 에러를 던지되 place 정보는 함께 전달.
 */
export const geocodeKeyword = async (keyword: string): Promise<GeocodedPlace> => {
  const apiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
  if (!apiKey || apiKey === 'your_kakao_rest_api_key_here') {
    throw new GeocodeError(
      'NO_API_KEY',
      '카카오 API 키가 설정되지 않았습니다. .env.local에 VITE_KAKAO_REST_API_KEY를 등록해주세요.'
    );
  }

  let response;
  try {
    response = await axios.get<KakaoLocalResponse>(KAKAO_KEYWORD_URL, {
      params: { query: keyword, size: 5 },
      headers: { Authorization: `KakaoAK ${apiKey}` },
      timeout: 5000,
    });
  } catch (err) {
    throw new GeocodeError(
      'NETWORK_ERROR',
      `'${keyword}' 검색 중 오류가 발생했습니다.`
    );
  }

  const docs = response.data.documents;
  if (!docs || docs.length === 0) {
    throw new GeocodeError(
      'NO_RESULT',
      `'${keyword}'에 해당하는 장소를 찾을 수 없습니다.`
    );
  }

  // 강남구 안에 있는 첫 결과를 우선 선택
  const inBounds = docs.find(d => isWithinGangnam(parseFloat(d.y), parseFloat(d.x)));
  const picked = inBounds ?? docs[0];

  const place: GeocodedPlace = {
    name: picked.place_name,
    address: picked.road_address_name || picked.address_name,
    lat: parseFloat(picked.y),
    lon: parseFloat(picked.x),
  };

  if (!isWithinGangnam(place.lat, place.lon)) {
    throw new GeocodeError(
      'OUT_OF_BOUNDS',
      `'${keyword}' (${place.name})은(는) 강남구 외부에 있어 경로 탐색이 불가능합니다.\n` +
        '현재 서비스 범위는 강남구 내부로 한정됩니다.',
      place
    );
  }

  return place;
};
