export const ORG_SLUGS = ["xinyewu", "nm-ls", "haiwai", "dongbu", "xibu", "xx"] as const;

export type OrgSlug = (typeof ORG_SLUGS)[number];

export const SLUG_TO_NAME: Record<OrgSlug, string> = {
  xinyewu: "新业务项目群",
  "nm-ls": "NM&LS 项目群",
  haiwai: "海外项目群",
  dongbu: "东部项目群",
  xibu: "西部项目群",
  xx: "xx项目群",
};

export const SLUG_TO_SECTORS: Record<OrgSlug, string[]> = {
  xinyewu: ["PMC板块", "咨询板块", "数字技术板块"],
  "nm-ls": ["新材料板块", "生命科学板块"],
  haiwai: ["COII板块", "模块化板块", "供应链板块"],
  dongbu: ["金山中心", "沈阳中心", "惠湛中心"],
  xibu: ["银川中心"],
  xx: ["A板块", "B板块", "C板块"],
};
