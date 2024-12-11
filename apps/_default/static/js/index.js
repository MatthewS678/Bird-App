"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.

// TODO: move into vue

let app = {};
let map;
let heatmap;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { HeatmapLayer } = await google.maps.importLibrary("visualization")
    map = new Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },   //Santa Cruz Coordinates
        zoom: 13,
        mapId: "978da9b8cd8f4e30"
    });
    heatmap = new HeatmapLayer({
        maxIntensity: 200,
        map: map
    });

    app.data.methods.center_map();

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
            map: map,
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

app.data = {    
    data: function() {
        return {
            map_center_pos : {},
            marker_pos : {},
            densities : [],
            species : [],
            query : "",
            drop : true,
            bird_filter : "",
        };
    },

    computed: {
        auto_completed: function() {
            return this.species.filter(bird_name => 
                bird_name.toLowerCase().includes(this.query.toLowerCase())
            );
        }
    },

    methods: {
        center_map: function() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    var position = { lat: position.coords.latitude, lng: position.coords.longitude };
                    map.setCenter(position);
                    this.map_center_pos = position;
                })
            }
        },

        add_checklist: function(position) {
            window.location.href = "/add_checklist?latitude=" + position.lat +"&longitude=" + position.lng  
        },

        update_heatmap: function() {
            if (this.species.some(name => name.toLowerCase() == this.query.toLowerCase())) {
                axios.get(get_densities_url, {
                    params: { bird_name: this.query }
                }).then(function(r) {
                    var data = []
                    for (var event of r.data.events) {
                        data.push({
                            location: new google.maps.LatLng(event.lat, event.lng),
                            weight: event.count
                        })
                    }
                    heatmap.setData(data)
                });
            }
        },

        select_bird: function(bird_name) {
            this.query=bird_name; 
            this.drop=false;
            this.update_heatmap();
        }
    },
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(get_species_url).then(function (r) {
        app.vue.species = r.data.species;
    });
    axios.get(get_densities_url).then(function (r) {
        for (var event of r.data.events) {
            app.vue.densities.push({
                location: new google.maps.LatLng(event.lat, event.lng),
                weight: event.count
            })
        }
        heatmap.setData(app.vue.densities)
    });
}

app.load_data();

