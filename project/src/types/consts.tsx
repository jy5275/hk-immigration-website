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

export const directionList = ["Arrival", "Departure"] as const;

export type ControlPointId = number; // 0~15
export type DirectionId = 0 | 1;

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
