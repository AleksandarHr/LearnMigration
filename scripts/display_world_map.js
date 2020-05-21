// const prefix = "../LearnMigration/"
const prefix = "../"

class WorldMapPlot {

    constructor(data, country_codes_and_names, flows, pop) {

        this.data = data;
        this.country_codes_and_names = country_codes_and_names;
        this.flows = flows;
        this.pop = pop;
        // get countries' topographic data
        this.countries = topojson.feature(this.data, this.data.objects.countries).features;
        // compute list of all countries' names for filter selection
        this.country_names = [];
        this.countries_and_centroids = [];
        this.country_codes_and_names.map(x => this.country_names.push(x.name));

        // set svg's height and with
        this.SVG_HEIGHT = 400;
        this.SVG_WIDTH = 800;

        // set margins
        this.margin = {
            top: 50,
            left: 50,
            right: 50,
            bottom: 50
        };

        // set actual height and width (remove margins)
        this.height = this.SVG_HEIGHT - this.margin.top - this.margin.bottom;
        this.width = this.SVG_WIDTH - this.margin.left - this.margin.right;

        // set filtering variables
        this.min_flow_threshold = 0;
        this.selected_gender = 'b';
        this.selected_year0 = 2010;
        this.inflow_bool = false;
        this.normalized_bool = false;
        this.selected_country = null;
        this.filtered_countries = null;

        // set scales
        // logarithmic scale for the radius of the flowing countries
        this.radius_scale = d3version4.scaleSymlog()
            .domain([0, 2.83e6])
            .constant(0.01)
            .range([0, 30]);

        // construct world map's svg
        var svg = d3version4.select("#world-map")
            .append("svg")
            .classed("world-map_svg", true)
            .attr("viewBox", `0 0 ${this.SVG_WIDTH} ${this.SVG_HEIGHT}`)

        this.map = svg.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        self = this;
        // enable zoom on map
        svg.call(d3version4.zoom()
            .scaleExtent([1, 15])
            .on("zoom", function() {
                // map.style("stroke-width", 1.5 / d3version4.event.transform.k + "px");
                // g.attr("transform", "translate(" + d3version4.event.translate + ")scale(" + d3version4.event.scale + ")"); // not in d3version4 v4
                self.map.attr("transform", d3version4.event.transform); // updated for d3version4 v4));
            }));

        // create projection
        // here are some that look pretty good to Jon:
        // var projection2 = d3version4.geoNaturalEarth2().translate([width / 2, height / 2]).scale(150)
        // var projection = d3version4.geoMercator().translate([width / 2, height / 2])
        // var projection = d3version4.geoWinkel3().translate([width / 2, height / 2]).scale(150)
        this.projection = d3version4.geoNaturalEarth1().translate([this.width / 2, this.height / 2]).scale(150);

        // create path generator
        this.path = d3version4.geoPath().projection(this.projection)

        // compute centroids and make an object containing all countries and their centroid
        this.country_codes_and_names.forEach(d => {
            let country = this.countries.find(dd => dd.id == d.numeric);
            this.countries_and_centroids.push({
                "country": d,
                "centroid": this.path.centroid(country)
            });
        });
    } // end of constructor

    try_call() {
        console.log("success call");
    };

    getFlowingCountries(country) {
        let flow_extremity = this.inflow_bool ? "dest" : "orig";
        // let flow_extremity = (flow_dir == "out") ? "orig" : "dest";
        let flowing_countries = this.flows.filter(dd =>
            (dd[flow_extremity] == country.country.iso_a3) &
            (dd.year0 == this.selected_year0) &
            (dd.flow > this.min_flow_threshold) &
            (dd.sex == this.selected_gender));
        return flowing_countries;
    }

    getCountryPopulation(country) {
        return this.pop.filter(d => d.year == this.selected_year0)
            .find(d => d.alpha3 == country.country.iso_a3).pop;
    }

    // Displaying countries on the map and defining hover/click behavior
    displayCountries() {
        // display countries and define hovering/selecting behavior
        self = this;
        self.map.append("g").selectAll(".country")
            .data(self.countries)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", self.path)
            .on("mouseover", function(d) {
                d3version4.select(this).classed("hovered", true);

                // get hovered country
                let hovered_country = self.countries_and_centroids.find(dd => dd.country.numeric == d.id);

                // get country population
                let hovered_country_population = self.getCountryPopulation(hovered_country);
                // console.log(hovered_country_population);

                // get in/out flowing countries to/from the hovered country
                let flowing_countries = self.getFlowingCountries(hovered_country);

                // remove arcs from previous hover if any
                self.map.selectAll(".arc_hovered")
                    .remove();

                // display arcs
                let flow_extremity_code = self.inflow_bool ? "orig_code" : "dest_code";
                self.map.selectAll(".arc_hovered")
                    .data(flowing_countries)
                    .enter()
                    .append("path")
                    .classed("arc_hovered", true)
                    .attr("d", dd => {
                        let dest_country = self.countries_and_centroids.find(ddd => ddd.country.numeric == dd[flow_extremity_code].padStart(3, "0"));
                        let x_0 = hovered_country.centroid[0];
                        let x_1 = dest_country.centroid[0];
                        let y_0 = hovered_country.centroid[1];
                        let y_1 = dest_country.centroid[1];
                        let dx = x_1 - x_0;
                        let dy = y_1 - y_0;
                        let bend_factor = 10;
                        let eucl_dist = Math.sqrt(dx * dx + dy * dy);
                        let dr = eucl_dist * bend_factor;
                        return "M" + x_1 + "," + y_1 + "A" + dr + "," + dr + " 0 0,1 " + x_0 + "," + y_0;
                    });

            })
            .on("mouseout", function(d) {
                d3version4.select(this).classed("hovered", false);
            })
            .on("click", function(d) {
                self.removePreviousSelections();
                self.selected_country = self.countries_and_centroids.find(dd => dd.country.numeric == d.id);
                self.filtered_countries = null;
                self.displaySelectedCountries();
            }) // end of "on click"
    }

    // Clears any previous visualized selections and flow data
    removePreviousSelections() {
        // REMOVE PRIOR SELECTION
        // remove prior selection if any
        d3version4.selectAll(".selected").classed("selected", false);
        // remove previously selected country's circle
        this.map.selectAll(".selected-country-circle").classed("selected-country-circle", false);
        // remove circles identifying previously selected flowing countries
        let flow_class = this.inflow_bool ? "inflow-country" : "outflow-country";
        this.map.selectAll("." + flow_class)
            .remove();
        // remove arcs from previous selection if any
        let arc_class = this.inflow_bool ? "arc_in" : "arc_out";
        this.map.selectAll("." + arc_class)
            .remove();
    }

    // Display selected countries
    displaySelectedCountries() {
        // remove previous flows' displayed
        self = this;
        this.removePreviousSelections();
        if (self.selected_country != null) {
            this.drawCountriesFlow();
        } else {
            for (var i = 0; i < self.filtered_countries.length; i++) {
                // get country name
                // console.log(countries_and_centroids.find(x => x.name == "Somalia"));
                self.selected_country = self.countries_and_centroids.find(dd => 0 == dd.country.name.localeCompare(self.filtered_countries[i]));
                // console.log("You selected the country: \n" + selected_country.country.name);

                self.drawCountriesFlow()
            }
        }
    }

    // Draws selected countries and their respective flow data
    drawCountriesFlow() {
        self = this;
        // display circle at the centroid of selected country
        self.map.append("circle")
            .classed("selected-country-circle", true)
            .attr("r", 4)
            .attr("cx", self.selected_country.centroid[0])
            .attr("cy", self.selected_country.centroid[1]);

        // compute outflowing countries from selected country
        let flowing_countries = self.getFlowingCountries(self.selected_country);
        // console.log(flowing_countries);

        // get country population
        let selected_country_population = self.getCountryPopulation(self.selected_country);
        let pop_factor = self.normalized_bool ? selected_country_population : 1;

        // display circles at centroids of destination countries
        let flow_extremity_code = self.inflow_bool ? "orig_code" : "dest_code";
        let flow_class = self.inflow_bool ? "inflow-country" : "outflow-country";
        self.map.selectAll("." + flow_class)
            // map.selectAll(".outflow-country")
            .data(flowing_countries)
            // .data(outflow_countries)
            .enter()
            // .append("g")
            .append("circle")
            // .classed("outflow-country", true)
            .classed(flow_class, true)
            // .attr("r", dd => {
            // 	console.log(radius_scale(dd.flow / pop_factor));
            // 	radius_scale(dd.flow / pop_factor);
            // })
            .attr("r", dd => self.radius_scale(dd.flow / pop_factor))
            // .attr("r", dd => radius_scale(dd.flow))
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("transform", function(dd) {
                // get destination country
                let dest_country = self.countries_and_centroids.find((ddd) => ddd.country.numeric == dd[flow_extremity_code].padStart(3, "0"));

                return "translate(" + dest_country.centroid + ")";
            });

        // display arcs between origin and destination countries
        // console.log(outflow_countries[0]);
        // console.log(countries_and_centroids.find(ddd => ddd.country.numeric == outflow_countries[0].dest_code.padStart(3, "0")));
        // let dest_country = countries_and_centroids.find((ddd) => ddd.country.numeric == dd.dest_code.padStart(3, "0"));

        // display arcs
        let arc_class = self.inflow_bool ? "arc_in" : "arc_out";
        self.map.selectAll("." + arc_class)
            .data(flowing_countries)
            .enter()
            .append("path")
            .classed(arc_class, true)
            .attr("d", dd => {
                let dest_country = self.countries_and_centroids.find(ddd => ddd.country.numeric == dd[flow_extremity_code].padStart(3, "0"));
                let x_0 = self.selected_country.centroid[0];
                let x_1 = dest_country.centroid[0];
                let y_0 = self.selected_country.centroid[1];
                let y_1 = dest_country.centroid[1];
                let dx = x_1 - x_0;
                let dy = y_1 - y_0;
                let bend_factor = 10;
                let eucl_dist = Math.sqrt(dx * dx + dy * dy);
                let dr = eucl_dist * bend_factor;
                return "M" + x_1 + "," + y_1 + "A" + dr + "," + dr + " 0 0,1 " + x_0 + "," + y_0;
            });
    }

    // Populate filter and setup event listeners
    handleFilter() {
        self = this;
        // Handle filter results - STARTS HERE;
        populateCountries("countries_list", self.country_names)
        var submitButton = document.getElementById("submit_filter");
        var clearButton = document.getElementById("clear_filter");
        var closeButton = document.getElementById("close_panel");
        // var flow = "inflow";
        var selected_gender = "b";
        var normalized = true;

        // Submit filters button on-click listener: registers filter selections
        submitButton.addEventListener('click', function() {
            var filters = submitFilter(self.country_names);
            self.filtered_countries = filters[0];
            self.inflow_bool = filters[1];
            // if (filters[1]) {
            // 	flow = "outflow";
            // }
            if (filters[2]) {
                self.selected_gender = "m";
            } else if (filters[3]) {
                self.selected_gender = "f";
            }
            self.normalized_bool = filters[4];
            // normalized = filters[4];
            self.removePreviousSelections();
            self.displaySelectedCountries()
        });

        // Clear filters button on-click listener - sets filters to default values
        clearButton.addEventListener('click', function() {
            clearFilters(self.country_names.length);
            self.removePreviousSelections();
        });

        closeButton.addEventListener('click', function() {
            toggleFilter('filter_panel');
        });
    }
} // end of class WorldMapPlot


function whenDocumentLoaded(action) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", action);
    } else {
        // `DOMContentLoaded` already fired
        action();
    };
}

// display map
function world_map_ready(error, data, country_codes_and_names, flows, pop) {
    if (error) {
        console.log("Error loading data: " + error);
        throw error;
    }
    world_map = new WorldMapPlot(data, country_codes_and_names, flows, pop);
    // Display countries
    world_map.displayCountries();
    // Get results from  filter selections
    world_map.handleFilter();
} // end of function `ready`

whenDocumentLoaded(() => {
    // import world atlas topojson
    d3version4.queue()
        .defer(d3version4.json, prefix + "data/world.json")
        // .defer(d3version4.json, prefix + "data/world_50m.json") // this map makes Australia's centroid to be in the Indian ocean...
        // .defer(d3version4.json, "https://unpkg.com/world-atlas@1.1.4/world/50m.json")
        // .defer(d3version4.json, "https://raw.githubusercontent.com/andybarefoot/andybarefoot-www/master/maps/mapdata/custom50.json")
        .defer(d3version4.json, prefix + "data/country_codes_and_names.json")
        .defer(d3version4.csv, prefix + "data/migflows_gender_separated_1990_2015_filtered_without0flows.csv")
        .defer(d3version4.csv, prefix + "data/pop.csv")
        // .defer(d3version4.csv, "./data/migflows_gender_separated_1990_2015_filtered.csv")
        .await(this.world_map_ready);
});
