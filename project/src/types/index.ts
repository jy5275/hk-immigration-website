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

export interface FilterOptions {
  group_by: GroupMetricId;
  direction_ids: DirectionId[];
  control_point_ids: ControlPointId[];
  category_ids: number[];
  date_range: DateRange;
}

export interface AggregatedData {
  [date: string]: {
    hk_residents: number;
    mainland_visitors: number;
    other_visitors: number;
    total: number;
  };
}