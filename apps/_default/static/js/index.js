"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            position : {lat: 0, lng: 0},
        };
    },
    methods: {
        // Complete as you see fit.
        my_function: function() {
            // This is an example.
            this.my_value += 1;
        },

        update_positions: function(lat, lng) {
            this.position.lat = lat;
            this.position.lng = lng;
        }

    }
};

let map;
async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    map = new Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 10,
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            let lat = position.coords.latitude;
            let lng = position.coords.longitude;
            app.vue.update_positions(lat, lng);
            map.setCenter({lat: lat, lng: lng});
        })
    }


}

initMap();

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(get_species_url).then(function (r) {
        console.log(r.data)
    });
}

app.load_data();

