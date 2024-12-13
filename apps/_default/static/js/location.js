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
            checklists:[]
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
                const data = response.data;
                console.log(response.data.sightings)
            }).catch(error => {
                console.error('Error fetching species graph data:', error);
            });
        },
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
