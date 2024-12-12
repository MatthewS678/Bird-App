const app = Vue.createApp({
    data() {
        return {
            regionInfo: null,
            rectangleCoordinates: null // Add this to store the coordinates
        };
    },
    methods: {
        showRegionInfo() {
            axios.post('/get_region_stats', {
                latitude: 37.7749, // example values, replace with actual lat/lng
                longitude: -122.4194,
                radius: 1.0
            }).then(response => {
                this.regionInfo = response.data;
            }).catch(error => {
                console.error('Error fetching region info:', error);
            });
        },
        showGraph(species) {
            // Functionality for showing the species graph
        },
        handleRectangleDrawn(rectangle) {
            // Capture the rectangle's bounds and store them in the data object
            const bounds = rectangle.getBounds();
            this.rectangleCoordinates = {
                southwest: {
                    lat: bounds.getSouthWest().lat(),
                    lng: bounds.getSouthWest().lng()
                },
                northeast: {
                    lat: bounds.getNorthEast().lat(),
                    lng: bounds.getNorthEast().lng()
                }
            };
        }
    }
});

// Extend initMap to add the rectangle drawing functionality
async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { DrawingManager } = await google.maps.importLibrary("drawing");

    const map = new Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },   //Santa Cruz Coordinates
        zoom: 13,
        mapId: "978da9b8cd8f4e30"
    });

    // Initialize the DrawingManager for drawing rectangles
    const drawingManager = new google.maps.drawing.DrawingManager({
        map: map,
        drawingMode: google.maps.drawing.OverlayType.RECTANGLE, // Set to rectangle mode
        rectangleOptions: {
            editable: true, // Allows editing of the rectangle
            draggable: true // Allows dragging of the rectangle
        }
    });

    google.maps.event.addListener(drawingManager, 'rectanglecomplete', function(rectangle) {
        app.vue.handleRectangleDrawn(rectangle); // Pass the rectangle to Vue's method
    });
}

initMap();

app.mount('#app');
