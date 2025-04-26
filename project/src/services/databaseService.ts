import { ImmigrationData } from '../types';
import { encodeControlPoint, encodeDirection } from '../types/consts';

// Mock data - in a real app, this would be replaced with actual database queries
export const fetchImmigrationData = async (): Promise<ImmigrationData[]> => {
  try {
    // In a production app, you would use sql.js-httpvfs or better-sqlite3 to query the database
    // For this example, we're using mock data
    const response = await fetch('/api/immigration-data');
    
    if (!response.ok) {
      throw new Error('Failed to fetch immigration data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching immigration data:', error);
    
    // Return mock data for demo purposes
    return getMockData();
  }
};

// This function would be removed in a production application
// It's only here to demonstrate the UI without a real database connection
function getMockData(): ImmigrationData[] {
  const data: ImmigrationData[] = [];
  const controlPoints = [
    'Airport', 
    'Lo Wu', 
    'Shenzhen Bay', 
    'Hong Kong-Zhuhai-Macao Bridge',
    'Lok Ma Chau'
  ];
  const directions = ['Arrival', 'Departure'];
  
  // Generate 3 years of daily data
  const startDate = new Date('2021-01-01');
  const endDate = new Date();
  
  let currentDate = new Date(startDate);
  let id = 1;
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Generate data for each control point and direction
    controlPoints.forEach(controlPoint => {
      directions.forEach(direction => {
        // Generate reasonable numbers with some randomness
        // Higher numbers for busier control points
        const baseNumber = 
          controlPoint === 'Airport' ? 5000 :
          controlPoint === 'Lo Wu' ? 3000 :
          controlPoint === 'Shenzhen Bay' ? 2000 : 1000;
        
        // Simulate COVID impact - lower numbers in 2021, gradual increase in 2022-2023
        const yearFactor = 
          currentDate.getFullYear() === 2021 ? 0.1 :
          currentDate.getFullYear() === 2022 ? 0.4 : 0.8;
        
        // Simulate seasonal variations
        const month = currentDate.getMonth();
        const seasonalFactor = 
          (month >= 5 && month <= 7) || (month >= 11 && month <= 0) ? 1.3 : // Summer and Winter holidays
          1.0;
        
        // Weekend vs weekday
        const dayOfWeek = currentDate.getDay();
        const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.5 : 1.0;
        
        // Direction factor (typically more arrivals than departures or vice versa depending on time period)
        const directionFactor = direction === 'Arrival' ? 1.1 : 0.9;
        
        // Base calculation
        const factor = yearFactor * seasonalFactor * weekendFactor * directionFactor;
        const base = baseNumber * factor;
        
        // Add some randomness
        const randomFactor = 0.7 + Math.random() * 0.6; // Between 0.7 and 1.3
        
        // Calculate traveler numbers
        const total = Math.round(base * randomFactor);
        const hkResidents = Math.round(total * 0.6);
        const mainlandVisitors = Math.round(total * 0.3);
        const otherVisitors = total - hkResidents - mainlandVisitors;
        
        data.push({
          id: id++,
          date: dateStr,
          control_point_id: encodeControlPoint(controlPoint),
          direction_id: encodeDirection(direction),
          hk_residents: hkResidents,
          mainland_visitors: mainlandVisitors,
          other_visitors: otherVisitors,
          total
        });
      });
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return data;
}