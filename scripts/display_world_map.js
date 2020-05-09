// const prefix = "../LearnMigration/"
const prefix = "../"

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
			.classed("world-map_svg", true)
			.attr("viewBox", `0 0 ${this.SVG_WIDTH} ${this.SVG_HEIGHT}`)

		var map = svg.append("g")
			.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

		// enable zoom on map
		svg.call(d3.zoom()
			.scaleExtent([1, 15])
			.on("zoom", function () {
				// map.style("stroke-width", 1.5 / d3.event.transform.k + "px");
				// g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"); // not in d3 v4
				map.attr("transform", d3.event.transform); // updated for d3 v4));
			}));


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
			// .defer(d3.json, prefix + "data/world_50m.json") // this map makes Australia's centroid to be in the Indian ocean...
		// .defer(d3.json, "https://unpkg.com/world-atlas@1.1.4/world/50m.json")
		// .defer(d3.json, "https://raw.githubusercontent.com/andybarefoot/andybarefoot-www/master/maps/mapdata/custom50.json")
			.defer(d3.json, prefix + "data/country_codes_and_names.json")
			.defer(d3.csv, prefix + "data/migflows_gender_separated_1990_2015_filtered_without0flows.csv")
			.defer(d3.csv, prefix + "data/pop.csv")
		// .defer(d3.csv, "./data/migflows_gender_separated_1990_2015_filtered.csv")
			.await(ready);

		self = this;
		// display map
		function ready(error, data, country_codes_and_names, flows, pop) {

			// set filtering variables
			let min_flow_threshold = 0;
			let selected_gender = 'b';
			let selected_year0 = 2010;
			// let inflow_bool = true;
			let inflow_bool = false;
			// let normalized_bool = true;
			let normalized_bool = false;

			// set scales
			// logarithmic scale for the radius of the flowing countries
			const radius_scale = d3.scaleSymlog()
				.domain([0, 2.83e6])
				.constant(0.01)
				.range([0, 30]);

			// get countries' topographic data
			var countries = topojson.feature(data, data.objects.countries).features;

			// compute list of all countries' names for filter selection
			let country_names = [];
			country_codes_and_names.map(x => country_names.push(x.name));

			// compute centroids and make an object containing all countries and their centroid
			let countries_and_centroids = [];
			country_codes_and_names.forEach(d => {
				let country = countries.find(dd => dd.id == d.numeric);
				countries_and_centroids.push({
					"country": d,
					"centroid": path.centroid(country)
				});
			});
			// console.log(countries_and_centroids);
			// let australia = countries_and_centroids.find(dd => dd.country.name == "Australia");
			// console.log(projection.invert(australia.centroid));
			console.log({country_codes_and_names, countries_and_centroids, flows, pop});

			self.displayCountries(map, countries, countries_and_centroids, flows, pop,
				inflow_bool, selected_year0, min_flow_threshold, selected_gender, 
				normalized_bool, path, radius_scale);

			// Get results from  filter selections
			self.handleFilter(map, country_names, countries_and_centroids, flows, pop,
				inflow_bool, selected_year0, min_flow_threshold, selected_gender, 
				normalized_bool, path, radius_scale);
			// var checkedCountries = filterSelections[0];
			// var gender = filterSelections[1];
			// var flow = filterSelections[2];
			// var normalized = filterSelections[3];
		} // end of function `ready`
	} // end of constructor

	try_call() {
		console.log("success call");
	};

	getFlowingCountries(country, flows, inflow_bool, year0, gender, min_flow_threshold) {
		let flow_extremity = inflow_bool ? "dest" : "orig";
		// let flow_extremity = (flow_dir == "out") ? "orig" : "dest";
		let flowing_countries = flows.filter(dd =>
			(dd[flow_extremity] == country.country.iso_a3) &
			(dd.year0 == year0) &
			(dd.flow > min_flow_threshold) &
			(dd.sex == gender));
		return flowing_countries;
	}

	getCountryPopulation(country, pop, year0) {
		return pop.filter(d => d.year == year0)
			.find(d => d.alpha3 == country.country.iso_a3).pop;
	}

	// Displaying countries on the map and defining hover/click behavior
	displayCountries(map, countries, countries_and_centroids, flows, pop, 
		inflow_bool, selected_year0, min_flow_threshold, selected_gender, 
		normalized_bool, path, radius_scale) {
		self = this;
		// display countries and define hovering/selecting behavior
		map.append("g").selectAll(".country")
			.data(countries)
			.enter()
			.append("path")
			.attr("class", "country")
			.attr("d", path)
			.on("mouseover", function(d) {
				d3.select(this).classed("hovered", true);

				// get hovered country
				let hovered_country = countries_and_centroids.find(dd => dd.country.numeric == d.id);

				// get country population
				let hovered_country_population = self.getCountryPopulation(hovered_country, pop, selected_year0);
				// console.log(hovered_country_population);

				// get in/out flowing countries to/from the hovered country
				let flowing_countries = self.getFlowingCountries(hovered_country, flows, inflow_bool, 
					selected_year0, selected_gender, min_flow_threshold);

				// remove arcs from previous hover if any
				map.selectAll(".arc_hovered")
					.remove();

				// display arcs
				let flow_extremity_code = inflow_bool ? "orig_code" : "dest_code";
				map.selectAll(".arc_hovered")
					.data(flowing_countries)
					.enter()
					.append("path")
					.classed("arc_hovered", true)
					.attr("d", dd => {
						let dest_country = countries_and_centroids.find(ddd => ddd.country.numeric == dd[flow_extremity_code].padStart(3, "0"));
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
				self.removePreviousSelections(map, inflow_bool);
				let selected_country = countries_and_centroids.find(dd => dd.country.numeric == d.id);
				self.displaySelectedCountries(map, selected_country, null, 
					countries_and_centroids, flows, pop,
					inflow_bool, selected_year0, min_flow_threshold, selected_gender, 
					normalized_bool, path, radius_scale);
			}) // end of "on click"
	}

	// Clears any previous visualized selections and flow data
	removePreviousSelections(map, inflow_bool) {
		// REMOVE PRIOR SELECTION
		// remove prior selection if any
		d3.selectAll(".selected").classed("selected", false);
		// remove previously selected country's circle
		map.selectAll(".selected-country-circle").classed("selected-country-circle", false);
		// remove circles identifying previously selected flowing countries
		let flow_class = inflow_bool ? "inflow-country" : "outflow-country";
		map.selectAll("." + flow_class)
			.remove();
		// remove arcs from previous selection if any
		let arc_class = inflow_bool ? "arc_in" : "arc_out";
		map.selectAll("." + arc_class)
			.remove();
	}

	// Display selected countries
	displaySelectedCountries(map, clicked_country, filtered_countries, 
		countries_and_centroids, flows, pop,
		inflow_bool, selected_year0, min_flow_threshold, selected_gender, 
		normalized_bool, path, radius_scale) {

		// remove previous flows' displayed
		self.removePreviousSelections(map, true);
		self.removePreviousSelections(map, false);

		if (clicked_country != null) {
			self.drawCountriesFlow(map, clicked_country, 
				countries_and_centroids, flows, pop,
				inflow_bool, selected_year0, min_flow_threshold, selected_gender, 
				normalized_bool, path, radius_scale);
		} else {
			self = this;
			for (var i = 0; i < filtered_countries.length; i++) {
				// get country name
				// console.log(countries_and_centroids.find(x => x.name == "Somalia"));
				let selected_country = countries_and_centroids.find(dd => 0 == dd.country.name.localeCompare(filtered_countries[i]));
				// console.log("You selected the country: \n" + selected_country.country.name);

				self.drawCountriesFlow(map, selected_country, 
					countries_and_centroids, flows, pop,
					inflow_bool, selected_year0, min_flow_threshold, selected_gender, 
					normalized_bool, path, radius_scale)
			}
		}
	}

	// Draws selected countries and their respective flow data
	drawCountriesFlow(map, selected_country, 
		countries_and_centroids, flows, pop,
		inflow_bool, selected_year0, min_flow_threshold, selected_gender, 
		normalized_bool, path, radius_scale) {
		// display circle at the centroid of selected country
		map.append("circle")
			.classed("selected-country-circle", true)
			.attr("r", 4)
			.attr("cx", selected_country.centroid[0])
			.attr("cy", selected_country.centroid[1]);

		// compute outflowing countries from selected country
		self = this;
		let flowing_countries = self.getFlowingCountries(selected_country, flows, inflow_bool, selected_year0, selected_gender, min_flow_threshold);
		// console.log(flowing_countries);

		// get country population
		let selected_country_population = self.getCountryPopulation(selected_country, pop, selected_year0);
		let pop_factor = normalized_bool ? selected_country_population : 1;

		// display circles at centroids of destination countries
		let flow_extremity_code = inflow_bool ? "orig_code" : "dest_code";
		let flow_class = inflow_bool ? "inflow-country" : "outflow-country";
		map.selectAll("." + flow_class)
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
			.attr("r", dd => radius_scale(dd.flow / pop_factor))
			// .attr("r", dd => radius_scale(dd.flow))
			.attr("cx", 0)
			.attr("cy", 0)
			.attr("transform", function(dd) {
				// get destination country
				let dest_country = countries_and_centroids.find((ddd) => ddd.country.numeric == dd[flow_extremity_code].padStart(3, "0"));

				return "translate(" + dest_country.centroid + ")";
			});


		// display arcs between origin and destination countries
		// console.log(outflow_countries[0]);
		// console.log(countries_and_centroids.find(ddd => ddd.country.numeric == outflow_countries[0].dest_code.padStart(3, "0")));
		// let dest_country = countries_and_centroids.find((ddd) => ddd.country.numeric == dd.dest_code.padStart(3, "0"));

		// display arcs
		let arc_class = inflow_bool ? "arc_in" : "arc_out";
		map.selectAll("." + arc_class)
			.data(flowing_countries)
			.enter()
			.append("path")
			.classed(arc_class, true)
			.attr("d", dd => {
				let dest_country = countries_and_centroids.find(ddd => ddd.country.numeric == dd[flow_extremity_code].padStart(3, "0"));
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
	handleFilter(map, country_names, countries_and_centroids, flows, pop,
		inflow_bool, selected_year0, min_flow_threshold, selected_gender, 
		normalized_bool, path, radius_scale) {
		// Handle filter results - STARTS HERE;
		populateCountries("countries_list", country_names)
		var submitButton = document.getElementById("submit_filter");
		var clearButton = document.getElementById("clear_filter");
		var closeButton = document.getElementById("close_panel");
		var checkedCountries = [];
		// var flow = "inflow";
		var selected_gender = "b";
		var normalized = true;
		self = this;
		// Submit filters button on-click listener: registers filter selections
		submitButton.addEventListener('click', function() {
			var filters = submitFilter(country_names);
			checkedCountries = filters[0];
			inflow_bool = filters[1];
			// if (filters[1]) {
			// 	flow = "outflow";
			// }
			if (filters[2]) {
				selected_gender = "m";
			} else if (filters[3]) {
				selected_gender = "f";
			}
			normalized_bool = filters[4];
			// normalized = filters[4];
			self.removePreviousSelections(map, inflow_bool);
			self.displaySelectedCountries(map, null, checkedCountries, 
				countries_and_centroids, flows, pop,
				inflow_bool, selected_year0, min_flow_threshold, selected_gender, 
				normalized_bool, path, radius_scale)
		});

		// Clear filters button on-click listener - sets filters to default values
		clearButton.addEventListener('click', function() {
			clearFilters(country_names.length);
			self.removePreviousSelections(map, inflow_bool);
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
