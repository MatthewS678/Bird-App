let app = {}
app.data = {
    data: function() {
        return {
            species: [],
            topContributors: [],
            rectangleCoordinates: null, // Store the rectangle's coordinates
            latLow: null,
            longLow: null,
            latHigh: null,
            longHigh: null,
            query: "",
            checklists:[],
            chart: null
        };
    },
    methods: {
        showSpecies: function() {
            console.log(this.query)
        },
        // Show the species graph based on selection
        showGraph: function() {
            console.log(this.query)
            axios.post('/get_species_data', { species_name: this.query, checklists : this.checklists }).then(response => {
                let data = response.data.sightings;
                this.update_chart(data);
                console.log(response.data.sightings)
            }).catch(error => {
                console.error('Error fetching species graph data:', error);
            });
        },
        update_chart: function(data) {
            //Aggregate data
            const aggregatedData = data.reduce((acc, curr) => {
                if (acc[curr.observation_date]) {
                    acc[curr.observation_date] += curr.observation_count;
                } else {
                    acc[curr.observation_date] = curr.observation_count;
                }
                return acc;
                }, {});

                const sortedData = Object.keys(aggregatedData)
                .sort() // Sort the keys (dates) in ascending order
                .reduce((acc, key) => {
                    acc[key] = aggregatedData[key];
                return acc;
            }, {});  

            const sortedDates = Object.keys(aggregatedData).sort(); // Sort dates
            const sortedCounts = sortedDates.map(date => aggregatedData[date]); // Get the corresponding counts
            console.log(sortedDates)
            console.log(sortedCounts)
            const ctx = document.getElementById('graph');
            console.log(this.chart)
            if(this.chart) {
                this.chart.destroy()
                setTimeout(() => {}, 50);
            }
            this.chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sortedDates,
                    datasets: [{
                        label: 'Observation Count',
                        data: sortedCounts
                    }]
                },
                options: {
                    animation: {
                        duration: 100
                    }
                }
            })
            this.chart.save
        }
    },
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    const urlParams = new URLSearchParams(window.location.search);
    app.vue.latLow = parseFloat(urlParams.get('latLow'));
    app.vue.longLow = parseFloat(urlParams.get('longLow'));
    app.vue.latHigh = parseFloat(urlParams.get('latHigh'));
    app.vue.longHigh = parseFloat(urlParams.get('longHigh'));

    app.vue.rectangleCoordinates = {
        southwest: {
            lat: app.vue.latLow,
            lng: app.vue.longLow
        },
        northeast: {
            lat: app.vue.latHigh,
            lng: app.vue.longHigh
        }
    };

    console.log(app.vue.rectangleCoordinates);
    if (!app.vue.rectangleCoordinates) {
        alert("Please draw a region on the map first!");
        return;
    }

    // Send coordinates to the backend
    axios.post('/get_region_stats', {
        southwest: app.vue.rectangleCoordinates.southwest,
        northeast: app.vue.rectangleCoordinates.northeast,
    }).then(response => {
        console.log(response.data)
        app.vue.species = response.data.species
        app.vue.topContributors = response.data.topContributors
        app.vue.checklists = response.data.checklists
    }).catch(error => {
        console.error('Error fetching region info:', error);
    });
}

app.load_data();