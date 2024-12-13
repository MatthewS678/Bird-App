const app = Vue.createApp({
    data() {
        return {
            regionInfo: null,
            rectangleCoordinates: null, // Store the rectangle's coordinates
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
            axios.post('/get_species_data', { species_name: species.name }).then(response => {
                const data = response.data;

                const svg = d3.select("#graph").html("").append("svg")
                    .attr("width", "100%")
                    .attr("height", 300);

                const x = d3.scaleTime()
                    .domain(d3.extent(data.dates, d => new Date(d)))
                    .range([0, svg.node().getBoundingClientRect().width]);

                const y = d3.scaleLinear()
                    .domain([0, d3.max(data.sightings)])
                    .range([280, 0]);

                const line = d3.line()
                    .x(d => x(new Date(d)))
                    .y(d => y(d));

                svg.append("g")
                    .attr("transform", "translate(0, 280)")
                    .call(d3.axisBottom(x));

                svg.append("g")
                    .call(d3.axisLeft(y));

                svg.append("path")
                    .datum(data.sightings.map((s, i) => ({ date: data.dates[i], count: s })))
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("d", line);
            }).catch(error => {
                console.error('Error fetching species graph data:', error);
            });
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
    }
});

app.mount('#app'); // Mount Vue instance
