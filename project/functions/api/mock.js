export function generateMockImmigrationData() {
	const controlPoints = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
	const directions = [0, 1]; // 0: Arrival, 1: Departure
  
	const startDate = new Date(2020, 0, 24); // 2020-01-24
	const endDate = new Date(2025, 3, 26);   // 2025-04-26
  
	const mockData = [];
	let idCounter = 1;
  
	for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
	  const dateString = d.toISOString().slice(0, 10); // YYYY-MM-DD 格式
  
	  for (const direction_id of directions) {
		const control_point_id = controlPoints[Math.floor(Math.random() * controlPoints.length)];
		const hk_residents = randomInt(1000, 50000);
		const mainland_visitors = randomInt(1000, 50000);
		const other_visitors = randomInt(100, 5000);
		const total = hk_residents + mainland_visitors + other_visitors;
  
		mockData.push({
		  id: idCounter++,
		  date: dateString,
		  control_point_id,
		  direction_id,
		  hk_residents,
		  mainland_visitors,
		  other_visitors,
		  total,
		});
	  }
	}
  
	return mockData;
  }
  
  function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  