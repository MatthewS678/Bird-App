"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            // Complete as you see fit.
            sightings:[],
            latitude: latitude || 0,
            longitude: longitude || 0,
            observation_date: null,
            time_started: null,
            observation_duration: null,
            species: []
        };
    },
    methods: {
        add_sighting: function() {
            this.sightings.push({
                species_name: "",
                observation_count: 0
            })
        },
        submit_checklist_sightings: function() {
            let checklist_data = {
                sightings: this.sightings,
                latitude: this.latitude,
                longitude: this.longitude,
                observation_date: this.observation_date,
                time_started: this.time_started,
                observation_duration: this.observation_duration
            }
            axios.post(add_checklist_sightings_url, checklist_data)
            .then(function (r) {
                window.location.href = "/my_checklists"
                console.log(r.data)
            })
            .catch(function(r) {
                alert("Error adding checklist/sightings")
            })
        },
        delete_sighting: function(s_index) {
            this.sightings.splice(s_index,1)
        },
        increment: function (s_index){
            this.sightings[s_index].observation_count++;
        },
        decrement: function (s_index){
            if(this.sightings[s_index].observation_count > 0) {
                this.sightings[s_index].observation_count--;
            }
        }
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(get_species_url).then(function (r) {
        app.vue.species = r.data.species
        console.log(app.vue.species)
    });
}

app.load_data();

