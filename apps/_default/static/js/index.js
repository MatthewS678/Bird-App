"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            map_center_pos : {},
            marker_pos : {}
        };
    },
    methods: {
        update_map_center: function(position) {
            this.map_center_pos = position;
        },

        update_marker_position: function(position) {
            axios.post(add_checklist_url, {
                position: position
            }).then(() => {
                this.marker_pos = position;
            });
        }

    }
};

let map;
async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    map = new Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 10,
        mapId: "6ccc43bc2603356d"
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            var position = { lat: position.coords.latitude, lng: position.coords.longitude };
            map.setCenter(position);
            app.vue.update_map_center(position);
        })
    }

    let marker;
    map.addListener("click", (e) => {
        if (marker) marker.position = null  // remove previous marker if present

        let content = document.createElement("div");

        content.className = "button is-link"
        content.textContent = "Enter Checklist"

        marker = new AdvancedMarkerElement({
            map,
            position: e.latLng,
            content: content
        });

        marker.addListener("click", () => {
            var position = { lat: marker.position.lat, lng: marker.position.lng };
            app.data.methods.update_marker_position(position);
            marker.position = null; // remove marker when clicked
        })
    });
}

initMap();

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(get_species_url).then(function (r) {
        console.log(r.data)
    });
}

app.load_data();

