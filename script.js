const locationButton = document.getElementById("locationButton");

const latitudeElement = document.getElementById("latitude");
const longitudeElement = document.getElementById("longitude");
const accuracyElement = document.getElementById("accuracy");

const statusElement = document.getElementById("status");

let watchID = null;


// Start getting location
locationButton.addEventListener("click", () => {

    if (!navigator.geolocation) {

        statusElement.textContent =
            "Your browser does not support location services.";

        return;
    }

    statusElement.textContent =
        "Requesting your location...";

    locationButton.disabled = true;
    locationButton.textContent = "Locating...";


    // Continuously watch the student's location
    watchID = navigator.geolocation.watchPosition(

        (position) => {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const accuracy = position.coords.accuracy;


            // Display coordinates
            latitudeElement.textContent =
                latitude.toFixed(6);

            longitudeElement.textContent =
                longitude.toFixed(6);

            accuracyElement.textContent =
                Math.round(accuracy) + " meters";


            statusElement.textContent =
                "Location found successfully.";

            locationButton.textContent =
                "Location Active";

        },

        (error) => {

            console.error(error);


            if (error.code === 1) {

                statusElement.textContent =
                    "Location permission was denied.";

            } else if (error.code === 2) {

                statusElement.textContent =
                    "Your location could not be determined.";

            } else if (error.code === 3) {

                statusElement.textContent =
                    "Location request timed out.";

            } else {

                statusElement.textContent =
                    "An unknown location error occurred.";

            }


            locationButton.disabled = false;

            locationButton.textContent =
                "Try Again";
        },

        {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 5000
        }
    );

});