import type { ImmigrationData } from '../types';

function generateMockImmigrationData(): ImmigrationData[] {
	const controlPoints = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  
	const endDate = new Date();
	endDate.setHours(0, 0, 0, 0);
	const startDate = new Date(endDate);
	startDate.setFullYear(startDate.getFullYear() - 5);
  
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

// Fetch data from the Pages Function; on failure fall back to mock data so the
// UI remains usable during local development without a D1 binding.
export const fetchImmigrationData = async (): Promise<ImmigrationData[]> => {
  try {
    const response = await fetch('/api/immigration-data');
    if (!response.ok) {
      throw new Error('Failed to fetch immigration data ' + response.statusText);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching immigration data:', error, ', generating mock data...');
    return generateMockImmigrationData();
  }
};
