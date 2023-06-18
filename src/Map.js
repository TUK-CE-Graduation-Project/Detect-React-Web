import React, { useRef, useEffect, useState, Component } from 'react';
import mapboxgl from 'mapbox-gl';
import Legend from './components/Legend';
import './Map.css';
// import data from './data.json'
import pImage from './img/pothole.jpeg'

mapboxgl.accessToken =
  'pk.eyJ1IjoibWktZmFzb2wiLCJhIjoiY2xoN3U1ZmNxMDI2eTNybzFlM2doc2M4ayJ9.GcTJmgh7OQSyiwlJ7nl38A';

// json 데이터를 가져 올 API 주소
const HTTP_URL = "http://15.164.100.67:9090/api/geotab/search/all";

// 이미지 GET API가 미완성인 관계로 임시로 더미 데이터 사용
const items = [
  {
      url: pImage,
  },
  {
    url: pImage,
  },
  {
    url: pImage,
  },{
    url: pImage,
  },{
    url: pImage,
  },{
    url: pImage,
  },{
    url: pImage,
  },{
    url: pImage,
  },{
    url: pImage,
  },{
    url: pImage,
  },{
    url: pImage,
  },
]
const Map = () => {
  const options = [
    {
      name: '도로 파손 정도',
      description: '도로 파손 개수에 따른 지표',
      property: 'numberOfPothole',
      stops: [
        [0, '#f8d5cc'],
        [3, '#f4bfb6'],
        [6, '#f1a8a5'],
        [9, '#ee8f9a'],
        [12, '#ec739b'],
        [15, '#dd5ca8'],
        [18, '#c44cc0'],
        [21, '#9f43d7'],
        [24, '#6e40e6']
      ]
    },
  ];
  const mapContainerRef = useRef(null);
  const [active, setActive] = useState(options[0]);
  const [map, setMap] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [potholeCount, setPotholeCount] = useState(0);
  const [r_name, setRegionName] = useState(null);
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });

  const openDialog = (count, position, r_name) => {
    setPotholeCount(count);
    setDialogPosition(position);
    setRegionName(r_name)
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(HTTP_URL);
        const jsonData = await response.json();

        if (jsonData) {
          return jsonData.data;
        }
      } catch (error) {
        console.error('Failed to fetch GeoJSON data:', error);
      }
    };

    const loadMap = async () => {
      const jsonData = await fetchData();
      if (jsonData) {
        const newMap = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [127.0016958, 37.5642135],
          zoom: 10.0,
        });

        newMap.on('load', () => {
          newMap.addSource('region', {
            type: 'geojson',
            data: jsonData,
          });

          newMap.addLayer({
            id: 'region',
            type: 'fill',
            source: 'region',
            paint: {
              'fill-color': {
                property: 'numberOfPothole',
                stops: active.stops,
              },
            },
          });

          newMap.on('click', 'region', (e) => {
            const features = newMap.queryRenderedFeatures(e.point, { layers: ['region'] });

            if (features.length > 0) {
              const clickedFeature = features[0];
              const potholeValue = clickedFeature.properties.numberOfPothole;
              const position = newMap.unproject(e.point);
              const r_name = clickedFeature.properties.name;
              openDialog(potholeValue, position, r_name);
              console.log(`해당 구역의 포트홀 개수: ${potholeValue}`);
            }
          });

          setMap(newMap);
        });
      }
    };

    loadMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [active]);

  useEffect(() => {
    if (map) {
      map.setPaintProperty('region', 'fill-color', {
        property: active.property,
        stops: active.stops,
      });
    }
  }, [active, map]);

  const changeState = (i) => {
    setActive(options[i]);
    if (map) {
      map.setPaintProperty('region', 'fill-color', {
        property: options[i].property,
        stops: options[i].stops,
      });
    }
  };

  return (
    <div>
      <div ref={mapContainerRef} className='map-container' />
      <Legend active={active} stops={active.stops} />
      {dialogOpen && (
        <div className="dialog-overlay">
          <div className="dialog-content" style={{ left: dialogPosition.x, top: dialogPosition.y }}>
            <h3>{r_name}의 도로 현황</h3>
            <p>도로 파손 개수: {potholeCount}</p>
            {items.map((img) => {
              return <ImgList url={img.url} key={img.url} />;
            })}
            <button className = "dialog-button" onClick={closeDialog}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

class ImgList extends Component{
  render(){
    return(
      <div>
        <PotholeImg url = {this.props.url}/>
      </div>
    )
  }
}

class PotholeImg extends Component{
  render(){
    return(
      <img src = {this.props.url}/>
    )
  }
}

export default Map;
