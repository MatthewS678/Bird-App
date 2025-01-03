"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.

// TODO: move into vue

let app = {};
let map;
let heatmap;
let rectangle;
let marker;
let drawingManager

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { HeatmapLayer } = await google.maps.importLibrary("visualization");
    const { DrawingManager } = await google.maps.importLibrary("drawing");
    map = new Map(document.getElementById("map"), {
        center: { lat: 36.9741, lng: -122.0308 },  // defaults to Santa Cruz
        zoom: 13,
        mapId: "978da9b8cd8f4e30"
    });
    
    heatmap = new HeatmapLayer({
        maxIntensity: 200,
        map: map
    });

    app.data.methods.center_map();

    map.addListener("dblclick", (e) => {
        // Log the coordinates of the double-click
        const latLng = e.latLng;
        console.log(`Double-clicked at coordinates: Latitude: ${latLng.lat()}, Longitude: ${latLng.lng()}`);

        // Remove previous marker if it exists
        if (marker && marker.position) {
            marker.setMap(null);
        }

        // Create new marker on double-click
        marker = new AdvancedMarkerElement({
            map: map,
            position: latLng
        });


        // Add listener to open checklist page on marker click
        marker.addListener("click", () => {
            const position = { lat: marker.position.lat, lng: marker.position.lng };
            console.log(position);
            app.data.methods.add_checklist(position);  // Navigate to checklist page
        });
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
            loading: true
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
        check_empty: function() {
            if(this.query === "") {
                this.loading = true
                let self = this
                axios.get(get_densities_url).then(function (r) {
                    for (var event of r.data.events) {
                        self.densities.push({
                            location: new google.maps.LatLng(event.lat, event.lng),
                            weight: event.count
                        })
                    }
                    heatmap.setData(self.densities)
                    self.loading = false;
                });
            }
        },

        update_heatmap: function() {
            let self = this
            if (this.species.some(name => name.toLowerCase() == this.query.toLowerCase())) {
                self.loading = true;
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
                    self.loading = false;
                });
            }
        },

        select_bird: function(bird_name) {
            this.query=bird_name; 
            this.drop=false;
            this.update_heatmap();
        },

        activateRectangleDrawing: function() {
            if (drawingManager) return;
            drawingManager = new google.maps.drawing.DrawingManager({
                map: map,
                drawingMode: google.maps.drawing.OverlayType.RECTANGLE, // Set to rectangle mode
                rectangleOptions: {
                    editable: true, // Allows editing of the rectangle
                    draggable: true // Allows dragging of the rectangle
                },
                drawingControl: true, // Enable drawing control
                drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER, // Position of the drawing control
                    drawingModes: [google.maps.drawing.OverlayType.RECTANGLE] // Only rectangle mode enabled
                }
            });

            google.maps.event.addListener(drawingManager, 'overlaycomplete', (event) => {
                // Check if the overlay is a rectangle
                if (event.type === google.maps.drawing.OverlayType.RECTANGLE) {
                    // Remove the existing rectangle if any
                    if (rectangle) {
                        rectangle.setMap(null);
                    }
                    // Save the new rectangle
                    rectangle = event.overlay;
                    console.log(rectangle)
                    
                    // Optionally, stop the drawing mode to prevent continuous drawing
                    drawingManager.setDrawingMode(null);
                }
            });
        },

        clearMap: function() {
            // Clear the drawn rectangles
            if (rectangle) rectangle.setMap(null);
            
            // Clear markers
            if (marker) marker.setMap(null)

            console.log(rectangle)
            console.log(marker)
        },
        
        viewRegionInfo: function() {
            // Navigate to location.html when button is clicked
            let bounds = rectangle.getBounds();
            if (rectangle && rectangle.map) {
                const southwest = bounds.getSouthWest();
                const northeast = bounds.getNorthEast();

                window.location.href = "/location?latLow=" + southwest.lat() + "&longLow=" + southwest.lng() +
                    "&latHigh=" + northeast.lat() + "&longHigh=" + northeast.lng();
            }
        },
    },
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    app.vue.loading = true;
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
        app.vue.loading = false
    });

}

app.load_data();

