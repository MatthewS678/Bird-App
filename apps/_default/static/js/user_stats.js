"use strict";

let app = {};

app.data = {
    data: function () {
        return {
            common_names: [],
            query: "",  // search term for species
            map: null,
            markers: [],
            drop: false,
            species: []
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
        search: function () { // gets names filtered by the query
            let self = this;
            self.drop = false;
            axios.post(search_url, { params: { q: self.query} })
                .then(function (response) {
                    self.common_names = response.data.common_names;
                })
                .catch(function (error) {
                    console.error("Error during search:", error);
                });
        },
        getLocations: function (name) { // gets the sightings locations and displays on heatmap
            let self = this;
            axios.post(get_locations_url, { common_name: name.sightings.common_name })
                .then(function (response) {
                    self.clearMarkers();
                    self.clearHeatmap();
    
                    const heatmapData = [];
                    response.data.locations.forEach(loc => {
                        heatmapData.push(new google.maps.LatLng(loc.latitude, loc.longitude));
                    });
    
                    self.createHeatmap(heatmapData);
                })
                .catch(function (error) {
                    console.error("Error fetching locations:", error);
                });
        },
        clearMarkers: function () { // clear all heatmarkers from previous query for the next one
            let self = this;
            self.markers.forEach(marker => marker.setMap(null));
            self.markers = [];
        },
        clearHeatmap: function () { // removes heatmap layer
            if (this.heatmap) {
                this.heatmap.setMap(null);
            }
        },
        createHeatmap: function (heatmapData) { // creates the heatmap
            let self = this;
            if (heatmapData.length > 0) {
                self.heatmap = new google.maps.visualization.HeatmapLayer({
                    data: heatmapData,
                    map: self.map,
                    radius: 20,
                    opacity: 0.6
                });
            }
        },
        select_bird: function(bird_name) {
            this.query=bird_name; 
            this.drop=false;
        },
    },
    
    mounted: function () {
        let self = this;
        self.map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: 36.9741, lng: -122.0308 },  // defaults to Santa Cruz
            zoom: 10
        });
    }
};


app.vue = Vue.createApp(app.data).mount("#app");


app.load_data = function () {
    axios.get(get_species_url).then(function (r) {
        app.vue.species = r.data.species;
    });

}

app.load_data();
