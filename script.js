const locationButton = document.getElementById("locationButton");

const latitudeElement = document.getElementById("latitude");
const longitudeElement = document.getElementById("longitude");
const accuracyElement = document.getElementById("accuracy");

const statusElement = document.getElementById("status");


// ================================
// LOCATION SETTINGS
// ================================

const REQUIRED_READINGS = 10;

// Maximum GPS accuracy we will accept
// Smaller = more accurate
const MAX_ACCURACY = 50;

// How close readings need to be to each other
// for us to consider them stable
const MAX_DISTANCE_BETWEEN_READINGS = 30;


// ================================
// VARIABLES
// ================================

let watchID = null;

let readings = [];

let bestAccuracy = Infinity;

let stableLocation = null;


// ================================
// START LOCATION
// ================================

locationButton.addEventListener("click", startLocation);


function startLocation() {

    if (!navigator.geolocation) {

        statusElement.textContent =
            "Your browser does not support location services.";

        return;
    }


    // Reset everything
    readings = [];

    bestAccuracy = Infinity;

    stableLocation = null;


    latitudeElement.textContent = "--";
    longitudeElement.textContent = "--";
    accuracyElement.textContent = "--";


    locationButton.disabled = true;

    locationButton.textContent = "Locating...";


    statusElement.textContent =
        "Getting your location...";


    // Stop an old location watcher
    if (watchID !== null) {

        navigator.geolocation.clearWatch(watchID);

    }


    // Start watching location
    watchID = navigator.geolocation.watchPosition(

        handleLocation,

        handleLocationError,

        {
            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 0
        }

    );

}


// ================================
// LOCATION RECEIVED
// ================================

function handleLocation(position) {

    const latitude = position.coords.latitude;

    const longitude = position.coords.longitude;

    const accuracy = position.coords.accuracy;


    console.log(
        "GPS:",
        latitude,
        longitude,
        "Accuracy:",
        accuracy
    );


    // Ignore readings that are extremely inaccurate
    if (accuracy > MAX_ACCURACY) {

        statusElement.textContent =
            "GPS signal is not accurate enough yet. Searching...";

        accuracyElement.textContent =
            Math.round(accuracy) + " meters";

        return;
    }


    // Add reading
    readings.push({

        latitude: latitude,

        longitude: longitude,

        accuracy: accuracy

    });


    // Keep only the newest readings
    if (readings.length > REQUIRED_READINGS) {

        readings.shift();

    }


    // Find the best accuracy
    if (accuracy < bestAccuracy) {

        bestAccuracy = accuracy;

    }


    // Display current best reading
    latitudeElement.textContent =
        latitude.toFixed(6);

    longitudeElement.textContent =
        longitude.toFixed(6);

    accuracyElement.textContent =
        Math.round(accuracy) + " meters";


    statusElement.textContent =
        `Collecting accurate readings: ${readings.length}/${REQUIRED_READINGS}`;


    // Check whether we have enough readings
    if (readings.length >= REQUIRED_READINGS) {

        checkLocationStability();

    }

}


// ================================
// CHECK LOCATION STABILITY
// ================================

function checkLocationStability() {

    if (readings.length < REQUIRED_READINGS) {

        return;

    }


    // Calculate average latitude
    let totalLatitude = 0;

    let totalLongitude = 0;

    let totalAccuracy = 0;


    for (const reading of readings) {

        totalLatitude += reading.latitude;

        totalLongitude += reading.longitude;

        totalAccuracy += reading.accuracy;

    }


    const averageLatitude =
        totalLatitude / readings.length;

    const averageLongitude =
        totalLongitude / readings.length;

    const averageAccuracy =
        totalAccuracy / readings.length;


    // Check how far each reading is from the average
    let maximumDistance = 0;


    for (const reading of readings) {

        const distance = calculateDistance(

            averageLatitude,

            averageLongitude,

            reading.latitude,

            reading.longitude

        );


        if (distance > maximumDistance) {

            maximumDistance = distance;

        }

    }


    console.log(
        "Average location:",
        averageLatitude,
        averageLongitude
    );

    console.log(
        "Average accuracy:",
        averageAccuracy
    );

    console.log(
        "Maximum spread:",
        maximumDistance
    );


    // If readings are spread too far apart,
    // keep collecting
    if (maximumDistance > MAX_DISTANCE_BETWEEN_READINGS) {

        statusElement.textContent =
            "GPS readings are still moving. Stabilizing location...";

        return;

    }


    // ================================
    // LOCATION IS STABLE
    // ================================

    stableLocation = {

        latitude: averageLatitude,

        longitude: averageLongitude,

        accuracy: averageAccuracy

    };


    // Display stable location
    latitudeElement.textContent =
        averageLatitude.toFixed(6);

    longitudeElement.textContent =
        averageLongitude.toFixed(6);

    accuracyElement.textContent =
        Math.round(averageAccuracy) + " meters";


    statusElement.textContent =
        "✓ Location confirmed and stable.";


    locationButton.textContent =
        "Location Locked";


    // Stop collecting
    if (watchID !== null) {

        navigator.geolocation.clearWatch(watchID);

        watchID = null;

    }


    console.log(
        "FINAL LOCATION:",
        stableLocation
    );


    // This is where we will eventually
    // check the school boundary.

}


// ================================
// CALCULATE DISTANCE
// ================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius = 6371000;


    const latitudeDifference =
        degreesToRadians(lat2 - lat1);

    const longitudeDifference =
        degreesToRadians(lon2 - lon1);


    const a =

        Math.sin(latitudeDifference / 2) *
        Math.sin(latitudeDifference / 2)

        +

        Math.cos(degreesToRadians(lat1)) *
        Math.cos(degreesToRadians(lat2)) *

        Math.sin(longitudeDifference / 2) *
        Math.sin(longitudeDifference / 2);


    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadius * c;

}


// ================================
// DEGREES → RADIANS
// ================================

function degreesToRadians(degrees) {

    return degrees * (Math.PI / 180);

}


// ================================
// LOCATION ERRORS
// ================================

function handleLocationError(error) {

    console.error(
        "Location error:",
        error
    );


    if (error.code === 1) {

        statusElement.textContent =
            "Location permission was denied.";

    }

    else if (error.code === 2) {

        statusElement.textContent =
            "Your location could not be determined.";

    }

    else if (error.code === 3) {

        statusElement.textContent =
            "Location request timed out. Try again.";

    }

    else {

        statusElement.textContent =
            "An unknown location error occurred.";

    }


    locationButton.disabled = false;

    locationButton.textContent =
        "Try Again";

}
