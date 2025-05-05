export const allControlPoints = [
	"Lo Wu",
	"Lok Ma Chau Spur Line",
	"Airport",
	"Shenzhen Bay",
	"Hong Kong-Zhuhai-Macao Bridge",
	"Express Rail Link West Kowloon",
	"Heung Yuen Wai",
	"Lok Ma Chau",
	"Macau Ferry Terminal",
	"Man Kam To",
	"China Ferry Terminal",
	"Kai Tak Cruise Terminal",
	"Harbour Control",
	"Sha Tau Kok",
	"Hung Hom",
	"Tuen Mun Ferry Terminal",
] as const;

export const directionList = ["arrival", "departure"] as const;

export type ControlPointId = number; // 0~15
export type DirectionId = 0 | 1;
export type GroupMetricId = 0 | 1 | 2 | 3; // 0:all, 1:directions, 2:categories, 3:control_points

export function encodeControlPoint(name: string): ControlPointId {
  return allControlPoints.indexOf(name as any);
}

export function decodeControlPoint(id: ControlPointId): string {
  return allControlPoints[id];
}

export function encodeDirection(dir: string): DirectionId {
	return dir === "arrival" ? 0 : 1;
}

export function decodeDirection(id: DirectionId): string {
	return directionList[id];
}

export const allCategories = [
	"category.hkResidents",
	"category.mainlandVisitors",
	"category.otherVisitors",
] as const;

export function encodeCategory(cat: string): number {
	return allCategories.indexOf(cat as any);
}

export function decodeCategory(cat: number): string {
	return allCategories[cat];
}

export const styles = {
  hoverEffect: "transform transition-transform duration-200 hover:scale-105 active:scale-95 hover:shadow-md",
  checkBoxBasic: "rounded text-blue-600 focus:ring-blue-500 h-4 w-4 disabled:opacity-50",
  filterTitleText: "font-semibold font-medium text-gray-700",
  textSelected: "text-blue-600 font-semibold",
  textUnselected: "text-gray-700",
  radioSelected: "h-4 w-4 rounded-full border-2 border-blue-600",
  radioUnselected: "h-4 w-4 rounded-full border-2 border-gray-400",
  primaryButton: "bg-blue-600 text-white px-4 py-2 rounded-md",
  secondaryButton: "bg-gray-200 text-gray-700 px-4 py-2 rounded-md",
  filterBg: "bg-gray-100 p-3 rounded-md",
};
