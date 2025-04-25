export interface ImmigrationData {
  id: number;
  date: string;
  control_point: string;
  direction: string;
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
  mode: string;
  direction: string;
  controlPoints: string[];
  travelerCategories: string[];
  dateRange: DateRange;
}

export interface AggregatedData {
  [date: string]: {
    hk_residents: number;
    mainland_visitors: number;
    other_visitors: number;
    total: number;
  };
}