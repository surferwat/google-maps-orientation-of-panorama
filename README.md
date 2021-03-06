## Description

Google Maps API implementation to determine whether a subject panorama is left of, in front of, or right of a map center point.

## Installation

Step 1: Clone the repo 

```
git clone https://github.com/surferwat/google-maps-orientation-of-panorama.git
```

Step 2: Install the dependecies

```
cd <package_name>
npm install
```

Step 3: Build 
```
npm run-script build
```

Step 4: Go to app folder and install the module

```
npm install /file/path/to/module
```

## Usage

You may want to know whether a subject Street View panorama is to the left, in front of, or to the right of a map center point. `OrientationOfPanorama` provides a method, `checkOrientation`, that when called returns a `string` (LEFTOF, FRONTOF, or RIGHTOF). 

A subject Street View panorama could technically be on the left- or right-hand side, but optically could be considered in front of the map center. `OrientationOfPanorama` provides a method, `frontOfIsRange` which takes a boolean value to set the corresponding field. If set to `true`, a range of points would be used to represent the points in front of the map center point. If `false`, a single point would be used to represent the point in front of the map center. `frontOfIsRange` is set to `true` by default. The range is represented by the constant `DISTANCE_BETWEEN_BOUNDS`, which has a value of 5 (unit measure is in meters).

```javascript
import { Loader } from '@googlemaps/js-api-loader'
import { OrientationOfPanorama } from 'google-maps-orientation-of-panorama'

const frontOfPoint = {
    lat: 1.277856235994971,
    lng: 103.8481884743644
}

const mapCenterPoint = { 
    lat: 1.2777384,
    lng: 103.848394
}

const activePanoramaPoint = {
    lat: 1.277778557217417,
    lng: 103.8481407376543
}

const loader = new Loader({
  apiKey: 'YOUR_API_KEY',
  version: 'weekly',
})

loader
    .load()
    .then(() => {
        const orientationOfPanorama = new OrientationOfPanorama(frontOfPoint, mapCenterPoint)
        orientationOfPanorama.activePanoramaPoint = activePanoramaPoint
        orientationofPanorama
            .checkOrientation()
            .then((data) => console.log(data))
            .catch((e) => console.error(e))
    })
```

## Todo 

* [ ] Add tests
* [ ] Consider pre-condition to check whether panorama is relevant for the map center

## References

* [Typescript and Google Maps](https://developers.google.com/maps/documentation/javascript/using-typescript)
* [Geometry Library](https://developers.google.com/maps/documentation/javascript/reference/geometry)
* [Street View Containers](https://developers.google.com/maps/documentation/javascript/examples/streetview-embed#maps_streetview_embed-javascript)
* [google.maps.LatLng vs google.maps.LatLngLiteral](https://stackoverflow.com/questions/54545979/google-maps-latlng-vs-google-maps-latlngliteral)
* [Calculate if a point lies above or below (or right or left) of a line](https://math.stackexchange.com/questions/1435779/calculate-if-a-point-lies-above-or-below-or-right-to-left-of-a-line)
* [Direction of a Point from a Line Segment](https://www.geeksforgeeks.org/direction-point-line-segment/)