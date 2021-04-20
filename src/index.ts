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
    private _panorama: google.maps.StreetViewPanorama // non-null assertion operator used
    private _mapCenterPoint: google.maps.LatLng
    private _frontOfIsRange: boolean = true

    constructor(initPanorama: google.maps.StreetViewPanorama, initMapCenterPoint: google.maps.LatLng) {
        this._panorama = initPanorama
        this._mapCenterPoint = initMapCenterPoint
    }

    set hasStretchedCenter(boolean: boolean) {
        this._frontOfIsRange = boolean
    }

    /**
     * Calculates the angle A which represents the angle between the heading from the subject panorama to the 
     * map center and the heading from the subject panorama to _front of_ point.
     * @param heading1 
     * @param heading2 
     */
    
    private angleA(heading1: number, heading2: number) {
        const diff = heading1 - heading2
        let angle: number
        if (Math.abs(diff) > 90 ) {
            angle = Math.abs(diff - 180)
        } else if (Math.abs(diff) < -90) {
            angle = Math.abs(diff + 180)
        } else {
            angle = Math.abs(diff)
        }
        return angle
    }

    /**
     * Calculates side A, which represents the distance from the map center to the _front of_ point (i.e., the point in 
     * front of the map center that sits along the same path as the subject panorama).
     * @param angleA 
     * @param angleB 
     * @param sideB 
     */

    private sideA(angleA: number, angleB: number, sideB: number): number {
        return Math.sin(angleA) * (sideB / Math.sin(angleB))
    }

    /**
     * Calculates angle C, which represents the angle between the heading from the map center to the subject panorama and 
     * the heading from the map center to the _front of_ point.
     * @param angleA 
     * @param angleB 
     */

    private angleC(angleA: number, angleB: number): number {
        return 180 - angleA - angleB
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

    private centerBounds(pointCenter: google.maps.LatLng, distanceToEnd: number, bearings: BearingsToFrontOfBounds): FrontOfBounds {
        const bounds: FrontOfBounds = {
            leftBound: google.maps.geometry.spherical.computeOffset(pointCenter, distanceToEnd, bearings.toLeftBound),
            rightBound: google.maps.geometry.spherical.computeOffset(pointCenter, distanceToEnd, bearings.toRightBound)
        }
        return bounds
    }
    
    /**
     * Calculates the y value (i.e., lat) that lies on the line that in this context represents the path from 
     * the _center_ to the map.
     * @param point1 
     * @param xl 
     */

    private yValueOnLine(point1: google.maps.LatLng): number {
        const y1: number = point1.lat()
        const x1: number = point1.lng()
        const y2: number = this._mapCenterPoint.lat()
        const x2: number = this._mapCenterPoint.lng()
        const xL: number = this._panorama.getPosition()!.lng()

        const m: number = (y2-y1) / (x2-x1)
        const b: number = y2-(m*x2)
        const yL: number = (m*xL)+b
        return yL
    }

    /**
     * Computes the orientation of the panorama point relative to the map point, which tells you whether the 
     * subject panorama point is to the left of, in front, or right of the map center point.
     */

    computeOrientation(): PanoramaOrientation {
        const panoramaPosition: google.maps.LatLng | null = this._panorama.getPosition()
        if (panoramaPosition == null) {
            throw new Error('could not get position of panorama')
        }

        //// 1) We first need to compute the _front of_ point that is along the path of the panorama that is 
        //// directly in front of the map. To do this, we figure out the angles and sides where we can 
        //// and, subsequently, use the Law of Sines to calculate the side representing the distance from the 
        //// map center point to the _front of_ point.

        // Calculate angle A, which represents the angle between the heading from the subject panorama to the map center
        // and the heading from subject panorama point to front of point 
        const headingPanoramaMapCenter: number = google.maps.geometry.spherical.computeHeading(panoramaPosition, this._mapCenterPoint)
        const headingPanoramaPhotographerPov: number = this._panorama.getPhotographerPov().heading
        const angleA: number = this.angleA(headingPanoramaMapCenter, headingPanoramaPhotographerPov)

        // Calculate side A, which represents the distance from the map center to the panorama center (i.e., the point in 
        // front of the map center point that is along the path of the panorama)
        const sideB: number = google.maps.geometry.spherical.computeDistanceBetween(panoramaPosition, this._mapCenterPoint) // distance from subject panorama to map center
        const angleB: number = 90 // angle between the heading from front of panorama to the subject panorama and the heading from the front panorama to the map center
        const sideA: number = this.sideA(angleA, angleB, sideB)

        // Calculate angle C, which represents the angle between the heading from the map center to the subject panorama and the heading from the map center to the front of panorama
        const angleC: number = this.angleC(angleA, angleB)

        // Compute the _front of_ point
        const pointCenter: google.maps.LatLng = google.maps.geometry.spherical.computeOffset(panoramaPosition, sideA, angleC)

        //// 2) We next use the equation for a line in the 2D plane to solve for a y value that is on the line that
        //// represents the path from the _front of_ to the map center. If withCenterBounds is set to true (which is so by 
        //// default), then _front of_ represents not just one point, but a range of points. So, we would have to calculate
        //// the y value for the left bound (i.e, left hand side or LHS) and the right bound (i.e., right hand side 
        //// or RHS).

        let yLOnLhsLine: number 
        let yLOnRhsLine: number
        if (this._frontOfIsRange) {
            const headingFrontOfMapCenter: number = google.maps.geometry.spherical.computeHeading(pointCenter, this._mapCenterPoint)
            const bearingsFrontOfBounds: BearingsToFrontOfBounds = this.bearingsTowardsFrontOfBounds(headingFrontOfMapCenter)
            const pointsFrontOfBounds: FrontOfBounds = this.centerBounds(pointCenter, DISTANCE_BETWEEN_BOUNDS/2, bearingsFrontOfBounds)
            
            yLOnLhsLine = this.yValueOnLine(pointsFrontOfBounds.leftBound)
            yLOnRhsLine = this.yValueOnLine(pointsFrontOfBounds.rightBound)
        } else {
            const ylOnLine : number = this.yValueOnLine(pointCenter)
            yLOnLhsLine = ylOnLine
            yLOnRhsLine = ylOnLine
        }

        //// 3) We finally can determine whether the subject panorama facing the map center is doing so from the left 
        //// hand side, center, or right hand side by checking the difference between the y value that lies on the line that 
        //// represents the path from the _front of_ to the map center and the y value of the panorama.
        
        let orientation: PanoramaOrientation
        const yP = this._panorama.getPosition()!.lat()
        if (yLOnLhsLine - yP < 0) {
            orientation = PanoramaOrientation.LeftOf
        } else if (yLOnRhsLine - yP > 0) {
            orientation = PanoramaOrientation.RightOf
        } else {
            orientation = PanoramaOrientation.FrontOf
        }

        return orientation
    }
}

export { OrientationOfPanorama }