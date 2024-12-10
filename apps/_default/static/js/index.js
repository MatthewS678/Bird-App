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

        add_checklist: function(position) {
            // axios.post(add_checklist_url, {
            //     position: position
            // }).then(() => {
            //     this.marker_pos = position;
            // });
            window.location.href = "/add_checklist?latitude=" + position.lat +"&longitude=" + position.lng  
        }

    }
};

let map;
async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    map = new Map(document.getElementById("map"), {
        center: { lat: 36.97376596436481, lng: -122.03073866623154 },   //Santa Cruz Coordinates
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
        console.log(marker)
        if (marker && marker.position) {
            marker.position = null  // remove previous marker if present
            return
        }
            

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
            console.log(position)
            app.data.methods.add_checklist(position);
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

