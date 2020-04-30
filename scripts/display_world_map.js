class WorldMapPlot {

	constructor() {

		// set svg's height and with
		this.SVG_HEIGHT = 400;
		this.SVG_WIDTH  = 800;

		// set margins
		this.margin = {
			top: 50, 
			left: 50,
			right: 50, 
			bottom: 50};

		// set actual height and width (remove margins)
		this.height = this.SVG_HEIGHT - this.margin.top - this.margin.bottom;
		this.width  = this.SVG_WIDTH - this.margin.left - this.margin.right;

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
			.defer(d3.json, "https://unpkg.com/world-atlas@1.1.4/world/110m.json")
		// .defer(d3.json, "https://raw.githubusercontent.com/andybarefoot/andybarefoot-www/master/maps/mapdata/custom50.json")
			.defer(d3.json, "data/country_codes_and_names.json")
			.defer(d3.csv, "data/migflows_gender_separated_1990_2015_filtered_without0flows.csv")
		// .defer(d3.csv, "./data/migflows_gender_separated_1990_2015_filtered.csv")
			.await(ready);

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
			console.log(countries);
			console.log(country_codes_and_names);
			console.log(flows);

			// compute centroids and make an object containing all countries and their centroid:
			let countries_and_centroids = [];
			country_codes_and_names.forEach(d => {
				let country = countries.find( dd => dd.id == d.numeric );
				countries_and_centroids.push({"country": d, "centroid": path.centroid(country)});
			});
			console.log(countries_and_centroids);
			console.log(countries_and_centroids.find(dd => dd.country.name == "India"));

			// display countries and define hovering/selecting behavior
			svg.append("g").selectAll(".country")
				.data(countries)
				.enter()
				.append("path")
				.attr("class", "country")
				.attr("d", path)
				.on("mouseover", function(d) {
					d3.select(this).classed("hovered", true);
				})
				.on("mouseout", function(d) {
					d3.select(this).classed("hovered", false);
				})
				.on("click", function(d) {

					// remove prior selection if any
					d3.selectAll(".selected").classed("selected", false);

					// add clicked country to selected class
					d3.select(this).classed("selected", true)

					// get country name
					console.log(countries_and_centroids.find(x => x.name == "Somalia"));
					let selected_country = countries_and_centroids.find( dd => dd.country.numeric == d.id);
					console.log("You selected the country: \n" + selected_country.country.name);

					// remove previously selected country's circle
					svg.selectAll(".selected-country-circle").classed("selected-country-circle", false);

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
						(dd.sex == selected_gender) );

					// compute inflowing countries to selected country
					let inflow_countries = flows.filter(dd => 
						(dd.dest == selected_country.country.iso_a3) & 
						(dd.year0 == selected_year0) & 
						(dd.flow > min_flow_threshold) &
						(dd.sex == selected_gender) );

					// remove circles identifying previously selected flowing countries
					svg.selectAll(".outflow-country")
						.remove();

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
							let dest_country = countries_and_centroids.find( (ddd) => ddd.country.numeric == dd.dest_code.padStart(3, "0"));

							return "translate(" + dest_country.centroid + ")";
						});

				}) // end of "on click"

		} // end of function `ready`

	} // end of constructor

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
