const DISTANCE_BETWEEN_BOUNDS = 5 // in meters

enum PanoramaOrientation {
    Left = 'LEFT',
    Center = 'CENTER',
    Right = 'RIGHT'
}

type Bearings = {
    bearingToLeftBound: number,
    bearingToRightBound: number
}

type CenterBounds = {
    leftBound: google.maps.LatLng,
    rightBound: google.maps.LatLng
}


class OrientationOfPanorama {
    private _panorama: google.maps.StreetViewPanorama // non-null assertion operator used
    private _originPoint: google.maps.LatLng
    private _hasStretchedCenter: boolean = true

    constructor(initPanorama: google.maps.StreetViewPanorama, initOriginPoint: google.maps.LatLng) {
        this._panorama = initPanorama
        this._originPoint = initOriginPoint
    }

    set hasStretchedCenter(boolean: boolean) {
        this._hasStretchedCenter = boolean
    }

    /**
     * Calculates the angle A which represents the angle between the heading from the panorama to the 
     * origin and the heading from the panorama to _center_.
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
     * Calculates side A, which represents the distance from the origin to the _center_ (i.e., the point in 
     * front of the origin along the path of the panorama).
     * @param angleA 
     * @param angleB 
     * @param sideB 
     */

    private sideA(angleA: number, angleB: number, sideB: number): number {
        return Math.sin(angleA) * (sideB / Math.sin(angleB))
    }

    /**
     * Calculates angle C, which represents the angle between the heading from the origin to the panorama and 
     * the heading from the origin to the _center_.
     * @param angleA 
     * @param angleB 
     */

    private angleC(angleA: number, angleB: number): number {
        return 180 - angleA - angleB
    }

    /**
     * Sets the bearing towards the left and right bounds for panorama points that would be considered
     * to be in the _center_ (i.e., where it would be considered in front of the origin)
     * @param heading 
     */

    private bearingsTowardsCenterBounds(heading: number): Bearings {
        const bearings: Bearings = {
            bearingToLeftBound: heading - 90,
            bearingToRightBound: heading + 90
        }
        return bearings
    }

    /**
     * Sets the points for the left and right bounds for panorama points that would be considered 
     * to be in the _center_ (i.e., placed in front of the origin).
     * @param originPoint 
     * @param distanceToEnd 
     * @param bearings 
     */

    private centerBounds(pointCenter: google.maps.LatLng, distanceToEnd: number, bearings: Bearings): CenterBounds {
        const bounds: CenterBounds = {
            leftBound: google.maps.geometry.spherical.computeOffset(pointCenter, distanceToEnd, bearings.bearingToLeftBound),
            rightBound: google.maps.geometry.spherical.computeOffset(pointCenter, distanceToEnd, bearings.bearingToRightBound)
        }
        return bounds
    }
    
    /**
     * Calculates the y value (i.e., lat) that lies on the line that in this context represents the path from 
     * the _center_ to the origin.
     * @param point1 
     * @param xl 
     */

    private yValueOnLine(point1: google.maps.LatLng): number {
        const y1: number = point1.lat()
        const x1: number = point1.lng()
        const y2: number = this._originPoint.lat()
        const x2: number = this._originPoint.lng()
        const xL: number = this._panorama.getPosition()!.lng()

        const m: number = (y2-y1) / (x2-x1)
        const b: number = y2-(m*x2)
        const yL: number = (m*xL)+b
        return yL
    }

    /**
     * Computes the orientation of the panorama point relative to the origin point, which tells you whether the 
     * panorama point is on the left side, center, right side of the origin point.
     */

    computeOrientation(): PanoramaOrientation {
        let position: PanoramaOrientation

        //// 1) We first need to compute the _center_, point that is along the path of the panorama that is 
        //// directly in front of the origin. To do this, we figure out the angles and sides where we can 
        //// and finally use the Law of Sines to calculate the side representing the distance from the 
        //// origin to the _center_.

        // Calculate angle A, which represents the angle between heading from panorama to origin and heading from panorama to center 
        const headingPanoramaOrigin: number = google.maps.geometry.spherical.computeHeading(this._panorama.getPosition()!, this._originPoint)
        const headingPanoramaPhotographerPov: number = this._panorama.getPhotographerPov().heading
        const angleA: number = this.angleA(headingPanoramaOrigin, headingPanoramaPhotographerPov)

        // Calculate side A, which represents the distance from the origin to the center (i.e., the point in front of the origin along the path of the panorama)
        const sideB: number = google.maps.geometry.spherical.computeDistanceBetween(this._panorama.getPosition()!, this._originPoint) // distance from panorama to origin
        const angleB: number = 90 // angle between heading from center to panorama and heading from center to origin
        const sideA: number = this.sideA(angleA, angleB, sideB)

        // Calculate angle C, which represents the angle between heading from origin to panorama and heading from origin to center
        const angleC: number = this.angleC(angleA, angleB)

        // Compute the _center_ point
        const pointCenter: google.maps.LatLng = google.maps.geometry.spherical.computeOffset(this._panorama.getPosition()!, sideA, angleC)

        //// 2) We next use the equation for a line in the 2D plane to solve for a y value that is on the line that
        //// represents the path from the _center_ to the origin. If withCenterBounds is set to true (which is so by 
        //// default), then _center_ represents not just one point, but a range of points. So, we would have to calculate
        //// the y value for the left bound (i.e, left hand side or LHS) and the right bound (i.e., right hand side 
        //// or RHS).

        let yLOnLhsLine: number 
        let yLOnRhsLine: number
        if (this._hasStretchedCenter) {
            const headingCenterOrigin: number = google.maps.geometry.spherical.computeHeading(pointCenter, this._originPoint)
            const bearingsCenterBounds: Bearings = this.bearingsTowardsCenterBounds(headingCenterOrigin)
            const pointsCenterBounds: CenterBounds = this.centerBounds(pointCenter, DISTANCE_BETWEEN_BOUNDS/2, bearingsCenterBounds)
            
            yLOnLhsLine = this.yValueOnLine(pointsCenterBounds.leftBound)
            yLOnRhsLine = this.yValueOnLine(pointsCenterBounds.rightBound)
        } else {
            const ylOnLine : number = this.yValueOnLine(pointCenter)
            yLOnLhsLine = ylOnLine
            yLOnRhsLine = ylOnLine
        }

        //// 3) We finally can determine whether the panorama facing the origin is doing so from the left hand side,
        //// center, or right hand side by checking the difference between the y value that lies on the line that 
        //// represents the path from the _center_ to the origin and the y value of the panorma.

        const yP = this._panorama.getPosition()!.lat()
        if (yLOnLhsLine - yP < 0) {
            position = PanoramaOrientation.Left
        } else if (yLOnRhsLine - yP > 0) {
            position = PanoramaOrientation.Right
        } else {
            position = PanoramaOrientation.Center
        }

        return position
    }
}


export { OrientationOfPanorama }