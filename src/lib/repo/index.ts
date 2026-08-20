// =============================================================
// 저장소 선택 — 데모 모드면 mock, 아니면 supabase.
// require를 써서 선택된 모듈만 로드한다(미선택 모듈은 평가 안 됨).
// 이 덕분에 데모 모드에서는 supabase.ts가 아예 로드되지 않아
// 환경변수가 없어도 앱이 정상 실행된다.
// =============================================================
import { USE_MOCK } from '../config';
import type { Repo } from './types';

export const repo: Repo = USE_MOCK
  ? require('./mockRepo').mockRepo
  : require('./realRepo').realRepo;

export type { Repo } from './types';
