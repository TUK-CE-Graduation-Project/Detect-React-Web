import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Legend from './components/Legend';
import Optionsfield from './components/Optionsfield';
import './Map.css';
import data from './data.json';

mapboxgl.accessToken =
  'pk.eyJ1IjoibWktZmFzb2wiLCJhIjoiY2xoN3U1ZmNxMDI2eTNybzFlM2doc2M4ayJ9.GcTJmgh7OQSyiwlJ7nl38A';

const HTTP_URL = "http://localhost:8080/api/pothole";

const Map = () => {
  const options = [
    {
      name: '도로 파손 정도',
      description: '도로 파손 개수에 따른 지표',
      property: 'pothole',
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

    // "pop_est": 11862740,s
  ];
  const mapContainerRef = useRef(null);
  const [active, setActive] = useState(options[0]);
  const [map, setMap] = useState(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [127.0016958, 37.5642135],
      zoom: 10.0
    });

    map.on('load', () => {
      map.addSource('countries', {
        type: 'geojson',
        data
      });

    //   map.setLayoutProperty('country-label', 'text-field', [
    //     'format',
    //     ['get', 'name_en'],
    //     { 'font-scale': 1.2 },
    //     '\n',
    //     {},
    //     ['get', 'name'],
    //     {
    //       'font-scale': 0.8,
    //       'text-font': [
    //         'literal',
    //         ['DIN Offc Pro Italic', 'Arial Unicode MS Regular']
    //       ]
    //     }
    //   ]);

    //   map.addLayer(
    //     {
    //       id: 'countries',
    //       type: 'fill',
    //       source: 'countries'
    //     },
    //     'country-label'
    //   );

    //   map.setPaintProperty('countries', 'fill-color', {
    //     property: active.property,
    //     stops: active.stops
    //   });

    //   setMap(map);
    // });

    map.addLayer({
      id: 'countries',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': {
          property: 'pothole',
          stops: active.stops
        }
      }
    });
  
    // 클릭 이벤트 리스너 등록
    map.on('click', 'countries', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['countries'] });

      if (features.length > 0) {
        const clickedFeature = features[0];
        const potholeValue = clickedFeature.properties.pothole;

        console.log(`Clicked feature's pothole value: ${potholeValue}`);
      }
    });

    setMap(map);
  });
  
    return () => map.remove();
  }, []);

  useEffect(() => {
    paint();
  }, [active]);

  const paint = () => {
    if (map) {
      map.setPaintProperty('countries', 'fill-color', {
        property: active.property,
        stops: active.stops
      });
    }
  };

  const changeState = i => {
    setActive(options[i]);
    map.setPaintProperty('countries', 'fill-color', {
      property: active.property,
      stops: active.stops
    });
  };

  return (
    <div>
      <div ref={mapContainerRef} className='map-container' />
      <Legend active={active} stops={active.stops} />
      <Optionsfield
        options={options}
        property={active.property}
        changeState={changeState}
      />
    </div>
  );
};

// function fetchData(){
//   return fetch(HTTP_URL)
//   .then(response => {
//     return response.json();
//   })
//   .then(data => {
//     return data
//   })
//   .catch(error => console.log(error));
// }

export default Map;
