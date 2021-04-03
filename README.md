## Description

Google Maps API implementation to determine whether a panorama is left of, in front of, or right of an origin point.

## Installation

Step 1: Clone the repo 

```
git clone https://github.com/surferwat/google-maps-position-of-panorama.git
```

Step 2: Install the dependecies

```
cd <package_name>
npm install
```

Step 3: Build 
```
npm run-script build:clean
```

Step 4: Go to app folder and install the module

```
npm install /file/path/to/module
```

## Usage

You may want to know whether a Street View panorama is to the left, in front of, or to the right of an origin point. `OrientationOfPanorama` provides a method, `computeOrientation`, that when called returns a `string` (LEFT, CENTER, or RIGHT). 

A Street View panorama could technically be on the left- or right-hand side, but optically could be considered in front of the origin. `OrientationOfPanorama` provides a setter method, `hasStretchedCenter` which takes a boolean value to set the corresponding field. If set to `true`, a range of points would be used to represent the points in front of the origin. If `false`, a single point would be used to represent the point in front of the origin. `hasStretchedCenter` is set to `true` by default. The range is represented by the constant `DISTANCE_BETWEEN_BOUNDS`, which has a value of 5 (unit measure is in meters).

```javascript
import { Loader } from '@googlemaps/js-api-loader'
import { OrientationOfPanorama } from 'google-maps-orientation-of-panorama'

const loader = new Loader({
  apiKey: 'YOUR_API_KEY',
  version: 'weekly',
  ...additionalOptions,
})

let panoramaPov
loader
    .load()
    .then(() => {
        panoramaPov = new google.maps.StreetViewPanorama(
            document.getElementById('street-view'),
            {
                position: { lat: 37.86926, lng: -122.254811 },
                pov: { heading: 165, pitch: 0 },
                zoom: 1
            }
        )
    })

const originPoint = { 
    lat: 37.86926, 
    lng: -122.254811
}

const orientationOfPanorama = new OrientationOfPanorama(panoramaPov, originPoint)
const orientation = orientationOfPanorama.computeOrientation()
```

## Todo 

* [ ] Add tests
* [ ] Consider pre-condition to check whether panorama is relevant for the origin

## References

* [Typescript and Google Maps](https://developers.google.com/maps/documentation/javascript/using-typescript)
* [Geometry Library](https://developers.google.com/maps/documentation/javascript/reference/geometry)
* [Street View Containers](https://developers.google.com/maps/documentation/javascript/examples/streetview-embed#maps_streetview_embed-javascript)
* [google.maps.LatLng vs google.maps.LatLngLiteral](https://stackoverflow.com/questions/54545979/google-maps-latlng-vs-google-maps-latlngliteral)
* [Calculate if a point lies above or below (or right or left) of a line](https://math.stackexchange.com/questions/1435779/calculate-if-a-point-lies-above-or-below-or-right-to-left-of-a-line)