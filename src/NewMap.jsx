import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import Legend from './components/Legend';
import './Map.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibWktZmFzb2wiLCJhIjoiY2xoN3U1ZmNxMDI2eTNybzFlM2doc2M4ayJ9.GcTJmgh7OQSyiwlJ7nl38A';

const Map = () => {
  const options = [
    {
      name: '도로 파손 정도',
      description: '도로 파손 개수에 따른 지표',
      property: 'numberOfPothole',
      stops: [
        [0, '#f8d5cc'],
        [3, '#f4bfb6'],
        [5, '#f1a8a5'],
        [7, '#ee8f9a'],
        [9, '#ec739b'],
        [12, '#dd5ca8'],
        [15, '#c44cc0'],
        [18, '#9f43d7'],
        [20, '#6e40e6']
      ]
    },
  ];

  const mapContainerRef = useRef(null);
  const [active, setActive] = useState(options[0]);
  const [map, setMap] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [potholeCount, setPotholeCount] = useState(0);
  const [r_name, setregionName] = useState(null);
  const [pImg, setPImg] = useState([]);
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });

  const openDialog = (count, position, r_name, images) => {
    setPotholeCount(count);
    setDialogPosition(position);
    setregionName(r_name);
    setDialogOpen(true);
    setPImg(Array.isArray(images) ? images : [images]);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const fetchDataFromAPI = async () => {
    try {
      const res = await fetch('/api/geotab/search/all', {
        'Accept-Charset': 'utf-8'
      });
      const { data } = await res.json();

      if (!res.ok) {
        throw new Error('Failed to fetch data from the API');
      }

      return data.features; // "data" 부분을 벗겨내서 features 배열 반환
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    }
  };

  const fetchImageUrls = async (geotabId) => {
    try {
      const res = await fetch(`/api/pothole/search/geotabId/${geotabId}`);
      const { data } = await res.json();
  
      if (!res.ok) {
        throw new Error('Failed to fetch image data from the API');
      }
  
      // 이미지 URL 배열 추출
      const imageUrls = data.map(item => item.imageURL);
  
      return imageUrls;
    } catch (error) {
      console.error('Error fetching image data:', error);
      return [];
    }
  };

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [127.0016958, 37.5642135],
      zoom: 10.0,
    });

    map.on('load', async () => { // 맵 로드하고 비동기로 데이터 받아오기
      const geojsonData = await fetchDataFromAPI();

      map.addSource('region', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: geojsonData.map((item) => ({ // geometry 필드 [] 한번 더 감싸야 함
            ...item,
            properties: {
              ...item.properties,
              numberOfPothole: parseInt(item.properties.numberOfPothole, 10),
            },
            geometry: { ...item.geometry, coordinates: [item.geometry.coordinates] },
          })),
        },
      });

      map.addLayer({
        id: 'region',
        type: 'fill',
        source: 'region',
        paint: {
          'fill-color': {
            property: active.property,
            stops:  
              active.stops
          },
        },
      });

      map.setPaintProperty('region', 'fill-color', {
        property: active.property,
        stops: active.stops
      });

      map.addLayer({
        id: 'region-border',
        type: 'line',
        source: 'region',
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.5,
        },
      });

      map.on('click', 'region', async (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['region'] });
  
        if (features.length > 0) {
          const clickedFeature = features[0];
          const potholeValue = clickedFeature.properties.numberOfPothole;
          const position = map.unproject(e.point);
          const pImg = await fetchImageUrls(clickedFeature.properties.code)
          const r_name = clickedFeature.properties.name;
          openDialog(potholeValue, position, r_name, pImg);
          console.log(`해당 구역의 포트홀 개수: ${potholeValue}`);
        }
      });

      setMap(map);
    });

    return () => map.remove();
  }, [active.property, active.stops]);

  const paint = useCallback(() => {
    if (map) {
      map.setPaintProperty('region', 'fill-color', {
        property: active.property,
        stops: active.stops,
      });
    }
  }, [active.property, active.stops, map]);

  useEffect(() => {
    paint();
  }, [active, paint]);
  

  const PotholeImg = ({ url }) => {
    return <img src={url} alt="pothole" />;
  };

  return (
    <div>
      <div ref={mapContainerRef} className="map-container" />
      <Legend active={active} stops={active.stops} />
      {dialogOpen && (
        <div className="dialog-overlay">
          <div className="dialog-content" style={{ left: dialogPosition.x, top: dialogPosition.y }}>
            <h3>{r_name}의 도로 현황</h3>
            <p>도로 파손 개수: {potholeCount}</p>
            {pImg.map((url, index) => (
              <PotholeImg key={index} url={url} />
            ))}
            <button className="dialog-button" onClick={closeDialog}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;