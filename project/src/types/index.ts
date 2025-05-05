import type { ControlPointId, DirectionId, GroupMetricId } from "./consts";

export interface ImmigrationData {
  id: number;
  date: string;
  control_point_id: ControlPointId;
  direction_id: DirectionId;
  hk_residents: number;
  mainland_visitors: number;
  other_visitors: number;
  total: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function CanUseAvgMode(dateRange: DateRange): boolean {
  const SHOW_7_DAYS_AVG_THRESHOLD = 1000 * 60 * 60 * 24 * 30 * 6; // six months
  return dateRange.endDate.getTime() - dateRange.startDate.getTime() >= SHOW_7_DAYS_AVG_THRESHOLD
}

export interface FilterOptions {
  group_by: GroupMetricId;
  direction_ids: DirectionId[];
  control_point_ids: ControlPointId[];
  category_ids: number[];
  date_range: DateRange;
  use7DaysAvg: boolean;
}

export interface AggregatedData {
  [date: string]: {
    hk_residents: number;
    mainland_visitors: number;
    other_visitors: number;
    total: number;
  };
}