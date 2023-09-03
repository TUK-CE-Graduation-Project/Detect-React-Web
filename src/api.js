export async function fetchDataFromAPI() {
    try {
      const response = await fetch('http://18.207.198.224:8080/api/geotab/search/all'); // API 엔드포인트 URL을 사용자의 API URL로 대체합니다.
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }