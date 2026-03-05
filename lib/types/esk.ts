/** 工程软件技能人员卡片类型，与 API /api/esk/people 返回一致 */
export interface PersonCard {
  name: string;
  email: string;
  specialty?: string;
  region?: string;
  department?: string;
  skills: { name: string; level: 1 | 2 | 3; hours?: number }[];
  score?: number;
  phone?: string;
}
