import { ImmigrationData, AggregatedData } from '../types';

export const aggregateDataByDate = (data: ImmigrationData[]): AggregatedData => {
  const aggregated: AggregatedData = {};
  
  data.forEach(item => {
    if (!aggregated[item.date]) {
      aggregated[item.date] = {
        hk_residents: 0,
        mainland_visitors: 0,
        other_visitors: 0,
        total: 0,
      };
    }
    
    aggregated[item.date].hk_residents += item.hk_residents;
    aggregated[item.date].mainland_visitors += item.mainland_visitors;
    aggregated[item.date].other_visitors += item.other_visitors;
    aggregated[item.date].total += item.total;
  });
  
  return aggregated;
};

export const aggregateDataByDirection = (data: ImmigrationData[]) => {
  const arrivalData: AggregatedData = {};
  const departureData: AggregatedData = {};
  const dates = new Set<string>();

  data.forEach(item => {
    dates.add(item.date);
    const targetData = item.direction_id === 0 ? arrivalData : departureData;

    if (!targetData[item.date]) {
      targetData[item.date] = {
        hk_residents: 0,
        mainland_visitors: 0,
        other_visitors: 0,
        total: 0,
      };
    }

    targetData[item.date].hk_residents += item.hk_residents;
    targetData[item.date].mainland_visitors += item.mainland_visitors;
    targetData[item.date].other_visitors += item.other_visitors;
    targetData[item.date].total += item.total;
  });

  return {
    arrivalData,
    departureData,
    dates: Array.from(dates).sort(),
  };
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};