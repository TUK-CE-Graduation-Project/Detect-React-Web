import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import './Map.css';
import data from './data.json';

mapboxgl.accessToken = 'pk.eyJ1IjoibWktZmFzb2wiLCJhIjoiY2xoN3U1ZmNxMDI2eTNybzFlM2doc2M4ayJ9.GcTJmgh7OQSyiwlJ7nl38A';


const Map = () => {
  const options = [
    {
      name: '도로 파손 정도',
      description: '도로 파손 개수에 따른 지표',
      property: 'pothole',
      stops: [
        [0, 'green'],
        [4, 'yellow'],
        [8, 'red'],
      ],
    },
  ];


  const mapContainerRef = useRef(null);
  const [data, setData] = useState([]);
  const [active, setActive] = useState(options[0]);
  const [map, setMap] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [potholeCount, setPotholeCount] = useState(0);
  const [r_name, setRegionName] = useState(null);
  const [pImg, setPImg] = useState([]);
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });

  const openDialog = (count, position, r_name, images) => {
    setPotholeCount(count);
    setDialogPosition(position);
    setRegionName(r_name);
    setDialogOpen(true);
    setPImg(Array.isArray(images) ? images : [images]);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const fetchDataFromAPI = async () => {
  try {
    const response = await fetch('/api/geotab/search/all', {
      method: "GET",
      headers:{
      'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8'
      }
    } );
    if (!response.ok) {
      throw new Error('Failed to fetch data from the API');
    }
    const data = await response.json();
    return data.features; // "data" 부분을 벗겨내서 features 배열 반환
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
};

const displayDataOnMap = async () => {
  const geojsonData = await fetchDataFromAPI();

  if (map && geojsonData.length > 0) {
    // GeoJSON 데이터를 지도에 추가
    map.addSource('custom-data', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: geojsonData,
      },
    });

    map.addLayer({
      id: 'region',
      type: 'fill',
      source: 'region',
      paint: {
        'fill-color': {
          property: 'pothole',
          stops: [
            [0, 'green'],
            [4, 'yellow'],
            [8, 'red'],
          ],
        },
      },
    });

    map.addLayer({
      id: 'region-border',
      type: 'line',
      source: 'region',
      paint: {
        'line-color': '#000000',
        'line-width': 0.5,
      },
    });

    map.on('click', 'region', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['region'] });

      if (features.length > 0) {
        const clickedFeature = features[0];
        const potholeValue = clickedFeature.properties.pothole;
        const position = map.unproject(e.point);
        const pImg = clickedFeature.properties.images;
        const r_name = clickedFeature.properties.name;
        openDialog(potholeValue, position, r_name, pImg);
        console.log(`해당 구역의 포트홀 개수: ${potholeValue}`);
      }
    });
  }
};


  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [127.0016958, 37.5642135],
      zoom: 10.0,
    });

    map.on('load', () => {
      setMap(map);
      displayDataOnMap(); // 데이터를 지도에 표시하는 함수 호출
    });

    setMap(map);
    return () => map.remove();
  }, []);


  useEffect(() => {
        paint();

  }, [active]);

  const paint = () => {
    if (map) {
      map.setPaintProperty('region', 'fill-color', {
        property: active.property,
        stops: active.stops,
      });
    }
  };

  const changeState = (i) => {
    setActive(options[i]);
    map.setPaintProperty('region', 'fill-color', {
      property: active.property,
      stops: active.stops,
    });
  };

  const ImgList = ({ url }) => {
    return (
      <div>
        <PotholeImg url={url} />
      </div>
    );
  };

  const PotholeImg = ({ url }) => {
    return <img src={url} alt="pothole" />;
  };

  return (
    <div>
      <div ref={mapContainerRef} className="map-container" />
      {dialogOpen && (
        <div className="dialog-overlay">
          <div className="dialog-content" style={{ left: dialogPosition.x, top: dialogPosition.y }}>
            <h3>{r_name}의 도로 현황</h3>
            <p>도로 파손 개수: {potholeCount}</p>
            {pImg.map((url, index) => (
  <ImgList key={index} url={require(`./img/${url}`).default} />
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
