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
            observation_date: "",
            time_started: "",
            observation_duration: ""
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
            console.log(this)
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
    console.log("test")
    axios.get(get_species_url).then(function (r) {
        console.log(r.data)
    });
}

app.load_data();

