const app = Vue.createApp({
    data() {
        return {
            regionInfo: null,
            rectangleCoordinates: null, // Store the rectangle's coordinates
            map: null, // Store the map instance
            drawingManager: null, // Store the drawing manager instance
            latLow: null,
            longLow: null,
            latHigh: null,
            longHigh: null,
        };
    },
    methods: {
        // Fetch region data based on coordinates
        showRegionInfo() {
            console.log(this.rectangleCoordinates);
            if (!this.rectangleCoordinates) {
                alert("Please draw a region on the map first!");
                return;
            }

            // Send coordinates to the backend
            axios.post('/get_region_stats', {
                southwest: this.rectangleCoordinates.southwest,
                northeast: this.rectangleCoordinates.northeast,
            }).then(response => {
                this.regionInfo = response.data;
            }).catch(error => {
                console.error('Error fetching region info:', error);
            });
        },
        
        // Show the species graph based on selection
        showGraph(species) {
            axios.post('/get_species_data', { species: species.name }).then(response => {
                const data = response.data;

                const svg = d3.select("#graph").html("").append("svg")
                    .attr("width", 500)
                    .attr("height", 300);

                const x = d3.scaleTime()
                    .domain(d3.extent(data, d => new Date(d.date)))
                    .range([0, 480]);

                const y = d3.scaleLinear()
                    .domain([0, d3.max(data, d => d.count)])
                    .range([280, 0]);

                const line = d3.line()
                    .x(d => x(new Date(d.date)))
                    .y(d => y(d.count));

                svg.append("g")
                    .attr("transform", "translate(0, 280)")
                    .call(d3.axisBottom(x));

                svg.append("g")
                    .call(d3.axisLeft(y));

                svg.append("path")
                    .datum(data)
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("d", line);
            }).catch(error => {
                console.error('Error fetching species graph data:', error);
            });
        },

        // Handle rectangle drawn on the map
        handleRectangleDrawn(rectangle) {
            const bounds = rectangle.getBounds();
            this.rectangleCoordinates = {
                southwest: {
                    lat: this.latLow,
                    lng: this.longLow
                },
                northeast: {
                    lat: this.latHigh,
                    lng: this.longHigh
                }
            };

            // Store the coordinates in sessionStorage
            sessionStorage.setItem('rectangleCoordinates', JSON.stringify(this.rectangleCoordinates));
        },

        loadRectangleCoordinates() {
            // Load coordinates from sessionStorage if available
            const storedCoordinates = sessionStorage.getItem('rectangleCoordinates');
            if (storedCoordinates) {
                this.rectangleCoordinates = JSON.parse(storedCoordinates);
            }
        },

        // Fetch coordinates from URL query parameters
        getCoordinatesFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            this.latLow = parseFloat(urlParams.get('latLow'));
            this.longLow = parseFloat(urlParams.get('longLow'));
            this.latHigh = parseFloat(urlParams.get('latHigh'));
            this.longHigh = parseFloat(urlParams.get('longHigh'));

            this.rectangleCoordinates = {
                southwest: {
                    lat: this.latLow,
                    lng: this.longLow
                },
                northeast: {
                    lat: this.latHigh,
                    lng: this.longHigh
                }
            };
        }
    },
    mounted() {
        // Fetch coordinates from the URL
        this.getCoordinatesFromURL();
        // Initialize the map
        this.loadRectangleCoordinates();
        initMap(this); // Pass Vue app instance to initMap
    }
});

// Initialize the map and drawing manager after the Google Maps API is loaded
async function initMap(vueApp) {
    const { Map } = await google.maps.importLibrary("maps");
    const { DrawingManager } = await google.maps.importLibrary("drawing");

    vueApp.map = new Map(document.getElementById("map"), {
        center: { lat: vueApp.latLow, lng: vueApp.longLow }, // Center map on the southwest corner
        zoom: 10,
        mapId: "978da9b8cd8f4e30"
    });

    vueApp.drawingManager = new google.maps.drawing.DrawingManager({
        map: vueApp.map,
        drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
        rectangleOptions: {
            editable: true,
            draggable: true
        }
    });

    google.maps.event.addListener(vueApp.drawingManager, 'rectanglecomplete', rectangle => {
        vueApp.handleRectangleDrawn(rectangle);
    });
}

app.mount('#app'); // Mount Vue instance
