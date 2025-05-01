import { ImmigrationData } from '../types';

function generateMockImmigrationData(): ImmigrationData[] {
	const controlPoints = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  
	const startDate = new Date(2020, 0, 24); // 2020-01-24
	const endDate = new Date(2025, 3, 26);   // 2025-04-26
  
	const mockData: ImmigrationData[] = [];
	let idCounter = 1;
  
	for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    for (const cp of controlPoints) {
      const dateString = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const upper = 50000 - cp*3000;
      const hk_residents = randomInt(upper / 2, upper);
      const mainland_visitors = randomInt(upper / 2, upper);
      const other_visitors = randomInt(100, 1000 - cp*30);
      const total = hk_residents + mainland_visitors + other_visitors;
      mockData.push({id: idCounter++, date: dateString, control_point_id: cp, 
        direction_id: 0, hk_residents, mainland_visitors, other_visitors, total});
      mockData.push({id: idCounter++, date: dateString, control_point_id: cp, 
        direction_id: 1, hk_residents, mainland_visitors, other_visitors, total});
    }
  }
	return mockData;
}
  
function randomInt(min:number, max:number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Mock data - in a real app, this would be replaced with actual database queries
export const fetchImmigrationData = async (): Promise<ImmigrationData[]> => {
  try {
    // In a production app, you would use sql.js-httpvfs or better-sqlite3 to query the database
    // For this example, we're using mock data
    const response = await fetch("/api/immigration-data");
    if (!response.ok) {
      throw new Error('Failed to fetch immigration data ' + response.statusText);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching immigration data:', error, ', generating mock data...');
    // Return mock data for demo purposes
    return generateMockImmigrationData();
  }
};
