const DISTANCE_BETWEEN_BOUNDS = 5 // in meters

enum PanoramaOrientation {
    LeftOf = 'LEFTOF',
    FrontOf = 'FRONTOF',
    RightOf = 'RIGHTOF'
}

type BearingsToFrontOfBounds = {
    toLeftBound: number,
    toRightBound: number
}

type FrontOfBounds = {
    leftBound: google.maps.LatLng,
    rightBound: google.maps.LatLng
}

class OrientationOfPanorama {
    private _mapCenterPoint: google.maps.LatLng
    private _frontOfPoint: google.maps.LatLng
    private _activePanoramaPoint: google.maps.LatLng
    private _frontOfIsRange: boolean = true

    constructor(
        initFrontOfPoint: google.maps.LatLng,
        initMapCenterPoint: google.maps.LatLng
    ) {
        this._frontOfPoint = initFrontOfPoint,
        this._mapCenterPoint = initMapCenterPoint
    }

    set isRange(boolean: boolean) {
        this._frontOfIsRange = boolean
    }

    set activePanoramaPoint(newActivePanoramaPoint: google.maps.LatLng) {
        this._activePanoramaPoint = newActivePanoramaPoint
    }

    /**
     * Sets the bearing towards the left and right bounds for the panorama points that would represent the
     * _front of_ range(i.e., the area that would be considered in front of the map center)
     * @param heading 
     */

    private bearingsTowardsFrontOfBounds(heading: number): BearingsToFrontOfBounds {
        const bearings: BearingsToFrontOfBounds = {
            toLeftBound: heading - 90,
            toRightBound: heading + 90
        }
        return bearings
    }

    /**
     * Sets the points for the left and right bounds for panorama points that would be considered 
     * to be in the _center_ (i.e., placed in front of the map).
     * @param pointCenter 
     * @param distanceToEnd 
     * @param bearings 
     */

    private frontOfBounds(frontOfPoint: google.maps.LatLng, distanceToEnd: number, bearings: BearingsToFrontOfBounds): FrontOfBounds {
        const bounds: FrontOfBounds = {
            leftBound: google.maps.geometry.spherical.computeOffset(frontOfPoint, distanceToEnd, bearings.toLeftBound),
            rightBound: google.maps.geometry.spherical.computeOffset(frontOfPoint, distanceToEnd, bearings.toRightBound)
        }
        return bounds
    }

    /**
     * Calculates the dot product for points a, b, and p.
     * @param a // The geo coordinates for the map center point
     * @param b // The geo cooridinates for the default panorama of the map center point
     * @param p // The geo coordinates for the active panorama
     */

    private dotProduct(a: google.maps.LatLng, b: google.maps.LatLng, p: google.maps.LatLng) {
        const ax: number = a.lat() 
        const ay: number = a.lng()
        const bx: number = b.lat() 
        const by: number = b.lng() 
        const px: number = p.lat() 
        const py: number = p.lng() 

        const dp: number = (bx - ax) * (py - ay) - (by - ay) * (px - ax)
        return dp
    }

    /**
     * Computes the orientation of the panorama point relative to the map point, which tells you whether the 
     * subject panorama point is to the left of, in front, or right of the map center point.
     */

    checkOrientation(): PanoramaOrientation {

        //// 1) We first use the equation for a line in the 2D plane to solve for a y value that is on the line that
        //// represents the path from the _front of_ to the map center. If withCenterBounds is set to true (which is so by 
        //// default), then _front of_ represents not just one point, but a range of points. So, we would have to calculate
        //// the y value for the left bound (i.e, left hand side or LHS) and the right bound (i.e., right hand side 
        //// or RHS).

        let dotProductLhs: number 
        let dotProductRhs: number 
        if (this._frontOfIsRange) {
            const headingFrontOfMapCenter: number = google.maps.geometry.spherical.computeHeading(this._frontOfPoint, this._mapCenterPoint)
            const bearingsFrontOfBounds: BearingsToFrontOfBounds = this.bearingsTowardsFrontOfBounds(headingFrontOfMapCenter)
            const frontOfBoundsPoints: FrontOfBounds = this.frontOfBounds(this._frontOfPoint, DISTANCE_BETWEEN_BOUNDS/2, bearingsFrontOfBounds)

            dotProductLhs = this.dotProduct(this._mapCenterPoint, frontOfBoundsPoints.leftBound, this._activePanoramaPoint)
            dotProductRhs = this.dotProduct(this._mapCenterPoint, frontOfBoundsPoints.rightBound, this._activePanoramaPoint)
        } else {
            dotProductLhs = this.dotProduct(this._mapCenterPoint, this._frontOfPoint, this._activePanoramaPoint)
            dotProductRhs = this.dotProduct(this._mapCenterPoint, this._frontOfPoint, this._activePanoramaPoint)
        }

        //// 2) We finally can determine whether the subject panorama facing the map center is doing so from the left 
        //// hand side, center, or right hand side by checking the difference between the y value that lies on the line that 
        //// represents the path from the _front of_ to the map center and the y value of the panorama.

        let orientation: PanoramaOrientation
        if (dotProductLhs < 0) {
            // Left of, from perspective of map center
            // So, right of, from perspective of panorama
            orientation = PanoramaOrientation.RightOf
        } else if (dotProductRhs > 0) {
            // Right of, from perspective of map center
            // So, left of, from perspective of panorama
            orientation = PanoramaOrientation.LeftOf
        } else {
            orientation = PanoramaOrientation.FrontOf
        }
        return orientation
    }
}

export { OrientationOfPanorama }

// // Calculates the point in front of the map center. However, we assume that 
// // the default panorama is in front of the map center, so we do not use this 
// // function at the moment.
//
// private _defaultPanoramaPhotographerPovHeading: number // Be sure to initialize in constructor
// private _defaultPanoramaPoint: google.maps.LatLng // Be sure to initialize in constructor
//
// /**
//  * Calculates the angle A which represents the angle between the heading from the subject panorama to the 
//  * map center and the heading from the subject panorama to _front of_ point.
//  * @param heading1 
//  * @param heading2 
//  */

// private angleA(heading1: number, heading2: number) {
//     const diff = heading1 - heading2
//     let angle: number
//     if (Math.abs(diff) > 90 ) {
//         angle = Math.abs(diff - 180)
//     } else if (Math.abs(diff) < -90) {
//         angle = Math.abs(diff + 180)
//     } else {
//         angle = Math.abs(diff)
//     }
//     return angle
// }

// /**
//  * Calculates side A, which represents the distance from the map center to the _front of_ point (i.e., the point in 
//  * front of the map center that sits along the same path as the subject panorama).
//  * @param angleA 
//  * @param angleB 
//  * @param sideB 
//  */

// private sideA(angleA: number, angleB: number, sideB: number): number {
//     return Math.sin(angleA) * (sideB / Math.sin(angleB))
// }

// /**
//  * Calculates angle C, which represents the angle between the heading from the map center to the subject panorama and 
//  * the heading from the map center to the _front of_ point.
//  * @param angleA 
//  * @param angleB 
//  */

// private angleC(angleA: number, angleB: number): number {
//     return 180 - angleA - angleB
// }

// /**
//  * We need to instatiate the _front of_ point that is along the path of the panorama that is 
//  * directly in front of the map. To do this, we figure out the angles and sides where we can 
//  * and, subsequently, use the Law of Sines to calculate the side representing the distance from the 
//  * map center point to the _front of_ point.
//  */

// frontOfPoint() {
//     // Calculate angle A, which represents the angle between the heading from the subject panorama to the map center
//     // and the heading from subject panorama point to front of point 
//     const headingPanoramaMapCenter: number = google.maps.geometry.spherical.computeHeading(this._defaultPanoramaPoint, this._mapCenterPoint)
//     const angleA: number = this.angleA(headingPanoramaMapCenter, this._defaultPanoramaPhotographerPovHeading)

//     // Calculate side A, which represents the distance from the map center to the panorama center (i.e., the point in 
//     // front of the map center point that is along the path of the panorama)
//     const sideB: number = google.maps.geometry.spherical.computeDistanceBetween(this._defaultPanoramaPoint, this._mapCenterPoint) // distance from subject panorama to map center
//     const angleB: number = 90 // angle between the heading from front of panorama to the subject panorama and the heading from the front panorama to the map center
//     const sideA: number = this.sideA(angleA, angleB, sideB)

//     // Calculate angle C, which represents the angle between the heading from the map center to the subject panorama and the heading from the map center to the front of panorama
//     const angleC: number = this.angleC(angleA, angleB)

//     // Compute the _front of_ point
//     this._frontOfPoint = google.maps.geometry.spherical.computeOffset(this._defaultPanoramaPoint, sideA, angleC)
// }