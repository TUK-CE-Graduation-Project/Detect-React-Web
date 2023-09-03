import { fetchDataFromAPI } from './api';

let cachedData = null;

export async function getData() {
  if (cachedData) {
    return cachedData;
  } else {
    try {
      const data = await fetchDataFromAPI();
      cachedData = data;
      return data;
    } catch (error) {
      throw error;
    }
  }
}