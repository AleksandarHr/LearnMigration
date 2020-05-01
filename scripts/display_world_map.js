const prefix = "../LearnMigration/"
// const prefix = "../"

class WorldMapPlot {

    constructor() {

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

        // construct world map's svg
        var svg = d3.select("#world-map")
            .append("svg")
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("width", this.width + this.margin.left + this.margin.right)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        // create projection
        // here are some that look pretty good to Jon:
        var projection = d3.geoNaturalEarth1().translate([this.width / 2, this.height / 2]).scale(150);
        // var projection2 = d3.geoNaturalEarth2().translate([width / 2, height / 2]).scale(150)
        // var projection = d3.geoMercator().translate([width / 2, height / 2])
        // var projection = d3.geoWinkel3().translate([width / 2, height / 2]).scale(150)

        // create path generator
        var path = d3.geoPath().projection(projection)

        // import world atlas topojson
        d3.queue()
            .defer(d3.json, prefix + "data/world.json")
            // .defer(d3.json, "https://raw.githubusercontent.com/andybarefoot/andybarefoot-www/master/maps/mapdata/custom50.json")
            .defer(d3.json, prefix + "data/country_codes_and_names.json")
            .defer(d3.csv, prefix + "data/migflows_gender_separated_1990_2015_filtered_without0flows.csv")
            // .defer(d3.csv, "./data/migflows_gender_separated_1990_2015_filtered.csv")
            .await(ready);

        self = this;
        // display map
        function ready(error, data, country_codes_and_names, flows) {

            // set filtering variables
            let min_flow_threshold = 0;
            let selected_gender = 'b';
            let selected_year0 = 2010;

            // set scales
            // logarithmic scale for the radius of the flowing countries
            const radius_scale = d3.scaleSymlog()
                .domain([1, 2.83e6])
                .constant(0.01)
                .range([0, 30]);

            // get countries' topographic data
            var countries = topojson.feature(data, data.objects.countries).features;

            // show how the data look like
            // console.log(countries);
            let country_names = [];
            country_codes_and_names.map(x => country_names.push(x.name));
            // console.log(country_codes_and_names);
            // console.log(flows);

            // compute centroids and make an object containing all countries and their centroid:
            let countries_and_centroids = [];
            country_codes_and_names.forEach(d => {
                let country = countries.find(dd => dd.id == d.numeric);
                countries_and_centroids.push({
                    "country": d,
                    "centroid": path.centroid(country)
                });
            });
            // console.log(countries_and_centroids);
            // console.log(countries_and_centroids.find(dd => dd.country.name == "India"));

            self.displayCountries(svg, countries, countries_and_centroids, flows,
                selected_year0, min_flow_threshold, selected_gender, path, radius_scale);

            // Get results from  filter selections
            self.handleFilter(svg, country_names, countries_and_centroids, flows, selected_year0,
                min_flow_threshold, selected_gender, path, radius_scale);
            // var checkedCountries = filterSelections[0];
            // var gender = filterSelections[1];
            // var flow = filterSelections[2];
            // var normalized = filterSelections[3];
        } // end of function `ready`
    } // end of constructor


    // Displaying countries on the map and defining hover/click behavior
    displayCountries(svg, countries, countries_and_centroids, flows, selected_year0, min_flow_threshold, selected_gender, path, radius_scale) {
        self = this;
        // display countries and define hovering/selecting behavior
        svg.append("g").selectAll(".country")
            .data(countries)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", path)
            .on("mouseover", function(d) {
                d3.select(this).classed("hovered", true);

                // get hovered country
                let hovered_country = countries_and_centroids.find(dd => dd.country.numeric == d.id);
                // console.log(hovered_country);

                // compute outflowing countries from selected country
                let outflow_countries = flows.filter(dd =>
                    (dd.orig == hovered_country.country.iso_a3) &
                    (dd.year0 == selected_year0) &
                    (dd.flow > min_flow_threshold) &
                    (dd.sex == selected_gender));

                // compute inflowing countries to selected country
                let inflow_countries = flows.filter(dd =>
                    (dd.dest == hovered_country.country.iso_a3) &
                    (dd.year0 == selected_year0) &
                    (dd.flow > min_flow_threshold) &
                    (dd.sex == selected_gender));

                // // remove arcs from previous hover if any
                svg.selectAll(".arc_hovered")
                    .remove();

                // display arcs
                svg.selectAll(".arc_hovered")
                    .data(outflow_countries)
                    .enter()
                    .append("path")
                    .classed("arc_hovered", true)
                    .attr("d", dd => {
                        let dest_country = countries_and_centroids.find(ddd => ddd.country.numeric == dd.dest_code.padStart(3, "0"));
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
                d3.select(this).classed("hovered", false);
            })
            .on("click", function(d) {
                self.removePreviousSelections(svg);
                let selected_country = countries_and_centroids.find(dd => dd.country.numeric == d.id);
                self.displaySelectedCountries(svg, selected_country, null, countries_and_centroids, flows, selected_year0,
                    min_flow_threshold, selected_gender, path, radius_scale);
            }) // end of "on click"
    }

    // Clears any previous visualized selections and flow data
    removePreviousSelections(svg) {
        // REMOVE PRIOR SELECTION
        // remove prior selection if any
        d3.selectAll(".selected").classed("selected", false);
        // remove previously selected country's circle
        svg.selectAll(".selected-country-circle").classed("selected-country-circle", false);
        // remove circles identifying previously selected flowing countries
        svg.selectAll(".outflow-country")
            .remove();
        // remove arcs from previous selection if any
        svg.selectAll(".arc")
            .remove();
    }

    //
    displaySelectedCountries(svg, clicked_country, filtered_countries, countries_and_centroids, flows, selected_year0,
        min_flow_threshold, selected_gender, path, radius_scale) {

        if (clicked_country != null) {
            self.drawCountriesFlow(svg, clicked_country, countries_and_centroids, flows, selected_year0,
                min_flow_threshold, selected_gender, path, radius_scale)
        } else {
            self = this;
            for (var i = 0; i < filtered_countries.length; i++) {
                // get country name
                // console.log(countries_and_centroids.find(x => x.name == "Somalia"));
                let selected_country = countries_and_centroids.find(dd => 0 == dd.country.name.localeCompare(filtered_countries[i]));
                // console.log("You selected the country: \n" + selected_country.country.name);

                self.drawCountriesFlow(svg, selected_country, countries_and_centroids, flows, selected_year0,
                    min_flow_threshold, selected_gender, path, radius_scale)
            }
        }
    }

    // Draws selected countries and their respective flow data
    drawCountriesFlow(svg, selected_country, countries_and_centroids, flows, selected_year0,
        min_flow_threshold, selected_gender, path, radius_scale) {
        // display circle at the centroid of selected country
        svg.append("circle")
            .classed("selected-country-circle", true)
            .attr("r", 4)
            .attr("cx", selected_country.centroid[0])
            .attr("cy", selected_country.centroid[1]);

        // compute outflowing countries from selected country
        let outflow_countries = flows.filter(dd =>
            (dd.orig == selected_country.country.iso_a3) &
            (dd.year0 == selected_year0) &
            (dd.flow > min_flow_threshold) &
            (dd.sex == selected_gender));

        // compute inflowing countries to selected country
        let inflow_countries = flows.filter(dd =>
            (dd.dest == selected_country.country.iso_a3) &
            (dd.year0 == selected_year0) &
            (dd.flow > min_flow_threshold) &
            (dd.sex == selected_gender));

        // display circles at centroids of destination countries
        svg.selectAll(".outflow-country")
            .data(outflow_countries)
            .enter()
            // .append("g")
            .append("circle")
            .classed("outflow-country", true)
            .attr("r", dd => radius_scale(dd.flow))
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("transform", function(dd) {
                // get destination country
                let dest_country = countries_and_centroids.find((ddd) => ddd.country.numeric == dd.dest_code.padStart(3, "0"));

                return "translate(" + dest_country.centroid + ")";
            });


        // display arcs between origin and destination countries
        // console.log(outflow_countries[0]);
        // console.log(countries_and_centroids.find(ddd => ddd.country.numeric == outflow_countries[0].dest_code.padStart(3, "0")));
        // let dest_country = countries_and_centroids.find((ddd) => ddd.country.numeric == dd.dest_code.padStart(3, "0"));

        // display arcs
        svg.selectAll(".arc")
            .data(outflow_countries)
            .enter()
            .append("path")
            .classed("arc", true)
            .attr("d", dd => {
                let dest_country = countries_and_centroids.find(ddd => ddd.country.numeric == dd.dest_code.padStart(3, "0"));
                let x_0 = selected_country.centroid[0];
                let x_1 = dest_country.centroid[0];
                let y_0 = selected_country.centroid[1];
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
    handleFilter(svg, country_names, countries_and_centroids, flows, selected_year0,
        min_flow_threshold, selected_gender, path, radius_scale) {
        // Handle filter results - STARTS HERE;
        populateCountries("countries_list", country_names)
        var submitButton = document.getElementById("submit_filter");
        var clearButton = document.getElementById("clear_filter");
        var closeButton = document.getElementById("close_panel");
        var checkedCountries = [];
        var flow = "inflow";
        var selected_gender = "b";
        var normalized = true;
        self = this;
        // Submit filters button on-click listener: registers filter selections
        submitButton.addEventListener('click', function() {
            var filters = submitFilter(country_names);
            checkedCountries = filters[0];
            if (filters[1]) {
                flow = "outflow";
            }
            if (filters[2]) {
                selected_gender = "m";
            } else if (filters[3]) {
                selected_gender = "f";
            }
            normalized = filters[4];
            self.removePreviousSelections(svg);
            self.displaySelectedCountries(svg, null, checkedCountries, countries_and_centroids, flows, selected_year0,
                min_flow_threshold, selected_gender, path, radius_scale)
        });

        // Clear filters button on-click listener - sets filters to default values
        clearButton.addEventListener('click', function() {
            clearFilters(country_names.length);
            self.removePreviousSelections(svg);
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

whenDocumentLoaded(() => {
    // make an instance of WorldMapPlot class
    world_map = new WorldMapPlot();
});
