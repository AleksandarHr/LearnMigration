var year_range=[1990,2015]

//years range
var start_year=1990
var end_year=2015
var years = [...Array(end_year-start_year+1).keys()].map(x => x+start_year)

// The svg containing the plot
var inc_dec = d3.select("#inc_dec_svg")

var id_margin = {top: 20, right: 60, bottom: 100, left: 60},
    id_width = 960 - id_margin.left - id_margin.right,
    id_height = 600 - id_margin.top - id_margin.bottom;

id_ready()

function id_ready(map, countries, countries_and_centroids, flows, pop,
				  inflow_bool, selected_year0, min_flow_threshold, selected_gender,
				  normalized_bool, path, radius_scale){
	console.log("Asli")
	//the svg
	var inc_dec = d3.select("#inc_dec_svg")
	    .attr("width", id_width + id_margin.left + id_margin.right)
	    .attr("height", id_height + id_margin.top + id_margin.bottom)
	    .append("g")
	    .attr("transform", "translate(" + id_margin.left + "," + id_margin.top + ")");

	//Years Slider
	var triangleRight = {
		draw: function (context, size) {
		  var x = -Math.sqrt(size / (Math.sqrt(3) * 3));
		  context.moveTo(-x * 2, 0);
		  context.lineTo(x, -Math.sqrt(3) * x);
		  context.lineTo(x, Math.sqrt(3) * x);
		  context.closePath();
		}
	};

	var triangleLeft = {
		draw: function (context, size) {
		  var x = -Math.sqrt(size / (Math.sqrt(3) * 3));
		  context.moveTo(x * 2, 0);
		  context.lineTo(-x, -Math.sqrt(3) * x);
		  context.lineTo(-x, Math.sqrt(3) * x);
		  context.closePath();
		}
	};

	let leftTrgl = d3.symbol().type(triangleRight)
	.size(180);
	let rightTrgl = d3.symbol().type(triangleLeft)
	.size(180);

	let sliderScale = d3.scaleLinear()
        .domain([0, years.length-1])
        .range([0, id_width])
        .clamp(true);
    let year_step=sliderScale(1)-sliderScale(0)


    let slider = inc_dec.append('line')
        .attr('class', 'track')
        .attr('x1', sliderScale.range()[0])
        .attr('x2', sliderScale.range()[1])
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('transform',"translate(0," + (id_height+ id_margin.bottom/2) + ")")

    let head1 = inc_dec.append('path')
        .attr('d', leftTrgl)
        .style('fill', 'grey')
      	.style('stroke', 'none')
        .classed('slider-circle-time-from', true)
        .attr('transform', 'translate(202, '+ (id_height+ id_margin.bottom/2) +')')
        .call(d3.drag()
          .on('start.interrupt', function () {
            head1.interrupt();
          })
          .on('start drag', function () {
            // d3.event.x : get x  position of the mouse click
            let xTimeTo = Number(d3.select('.slider-circle-time-to').attr('transform').split('translate(')[1].split(',')[0]);

          	let xTimeFrom = Number(d3.select('.slider-circle-time-from').attr('transform').split('translate(')[1].split(',')[0])


          	let yearTo=years[Math.round(sliderScale.invert(xTimeTo))]
          	let yearFrom=years[Math.round(sliderScale.invert(xTimeFrom))]

            console.log('from , to', xTimeFrom, xTimeTo)
            console.log(yearFrom,yearTo)

			if (xTimeFrom + year_step >= sliderScale.range()[1] && d3.event.x- xTimeFrom >0) return;

            handleGragHead1(sliderScale.invert(d3.event.x))

            if (xTimeFrom + year_step > xTimeTo && d3.event.x- xTimeFrom >0) {
              handleGragHead2(sliderScale.invert(d3.event.x + year_step))
            }
            if(year_range[0]!=yearFrom || year_range[1]!=yearTo){
	            year_range=[yearFrom,yearTo]
	            update_inc_dec(map, countries, countries_and_centroids, flows, pop,
					inflow_bool, selected_year0, min_flow_threshold, selected_gender,
					normalized_bool, path, radius_scale)
	        }
          }));

    let head2 = inc_dec.append('path')
        .attr('d', rightTrgl)
        .style('fill', 'grey')
      	.style('stroke', 'none')
        .classed('slider-circle-time-to', true)
        .attr('transform', 'translate(628, '+ (id_height+ id_margin.bottom/2) +')')
        .call(d3.drag()
          .on('start.interrupt', function () {
            head2.interrupt();
          })
          .on('start drag', function () {
            // d3.event.x : get x  position of the mouse click

          	let xTimeTo = Number(d3.select('.slider-circle-time-to').attr('transform').split('translate(')[1].split(',')[0]);
          	let xTimeFrom = Number(d3.select('.slider-circle-time-from').attr('transform').split('translate(')[1].split(',')[0])

          	let yearTo=years[Math.round(sliderScale.invert(xTimeTo))]
          	let yearFrom=years[Math.round(sliderScale.invert(xTimeFrom))]

            //console.log('from , to', xTimeFrom, xTimeTo, yearScale(xTimeFrom))
            //console.log(yearFrom,yearTo)

            if (xTimeTo <= year_step && d3.event.x- xTimeTo <0) return;

            handleGragHead2(sliderScale.invert(d3.event.x));

          	if (xTimeTo- year_step  < xTimeFrom && d3.event.x- xTimeTo <0) {
               //console.log('== BOM',year_step)
              handleGragHead1(sliderScale.invert(d3.event.x - year_step))
            }

            if(year_range[0]!=yearFrom || year_range[1]!=yearTo){
	            year_range=[yearFrom,yearTo]
	            update_inc_dec(map, countries, countries_and_centroids, flows, pop,
					inflow_bool, selected_year0, min_flow_threshold, selected_gender,
					normalized_bool, path, radius_scale)
	        }
          }));
    //slider events
	function handleGragHead2(x) {
	d3.select('.slider-circle-time-to')
	  .attr('transform', 'translate(' + sliderScale(x) + ', '+ (id_height+ id_margin.bottom/2) +')')
	}

	function handleGragHead1(x) {
	d3.select('.slider-circle-time-from')
	  .attr('transform', 'translate(' + sliderScale(x) + ', '+ (id_height+ id_margin.bottom/2) +')')
	}


	//years label
	inc_dec.append('text')
		   .attr('id','inc_dec_year_label')
		   .text(year_range[0]+' - '+year_range[1])
		   .attr('transform','translate('+(id_width/2-80)+','+(id_height+id_margin.bottom)+')')
		   .attr("font-family", "sans-serif")
           .attr("font-size", "30px")

}

function update_inc_dec(map, countries, countries_and_centroids, flows, pop,
						inflow_bool, selected_year0, min_flow_threshold, selected_gender,
						normalized_bool, path, radius_scale){


//	d3.select('#inc_dec_x').remove()
//	//d3.select('#inc_dec_y').remove()
//	inc_dec.append("g")
//      .style("font", "14px times")
//	  .attr('id','inc_dec_x')
//	  .attr("class", "x axis")
//	  .attr("transform", "translate("+id_margin.left+"," + (id_height + id_margin.top)+ ")")
//	  .call(id_xAxis);
//
//
//	d3.select('#inc_dec_y')
//	  .style("font", "14px times")
//	  .transition()
//      .duration('200')
//	  .attr("transform", "translate(" + (id_x(0)) + ",0)")

	d3.select('#inc_dec_year_label').remove()

    //years label
	d3.select('#inc_dec_year_label')
		   .text(year_range[0]+' - '+year_range[1])

	let flowingRange = getFlowingRange(flows, inflow_bool, year_range[0], year_range[1], selected_gender,min_flow_threshold);

	displaySelectedRange(map, null, countries,
		countries_and_centroids, flowingRange, pop,
		inflow_bool, selected_year0, min_flow_threshold, selected_gender,
		normalized_bool, path, radius_scale);
}

function getFlowingRange(flows, inflow_bool, yearFrom, yearTo, gender, min_flow_threshold) {
	let flow_extremity = inflow_bool ? "dest" : "orig";
	// let flow_extremity = (flow_dir == "out") ? "orig" : "dest";
	let flowing_range = flows.filter(dd =>
		(dd.year0 >= yearFrom) & (dd.year0 <= yearTo)
	);
	return flowing_range;
}

function getFlowingCountries(country, flows, inflow_bool, year0, gender, min_flow_threshold) {
	let flow_extremity = inflow_bool ? "dest" : "orig";
	// let flow_extremity = (flow_dir == "out") ? "orig" : "dest";
	let flowing_countries = flows.filter(dd =>
		(dd[flow_extremity] == country.country.iso_a3) &
		(dd.year0 == year0) &
		(dd.flow > min_flow_threshold) &
		(dd.sex == gender)
	);
	return flowing_countries;
}

function getCountryPopulation(country, pop, year0) {
	return pop.filter(d => d.year == year0
	)
		.find(d => d.alpha3 == country.country.iso_a3
		).pop;
}

// Display selected countries
function displaySelectedRange(map, clicked_country, filtered_countries,
	countries_and_centroids, flows, pop,
	inflow_bool, selected_year0, min_flow_threshold, selected_gender,
	normalized_bool, path, radius_scale) {

	if (clicked_country != null) {
		drawCountriesFlow(map, clicked_country,
			countries_and_centroids, flows, pop,
			inflow_bool, selected_year0, min_flow_threshold, selected_gender,
			normalized_bool, path, radius_scale);
	} else {
		for (var i = 0; i < filtered_countries.length; i++) {
			// get country name
			// console.log(countries_and_centroids.find(x => x.name == "Somalia"));
			let selected_country =
				countries_and_centroids.find(dd => 0 == dd.country.name.localeCompare(filtered_countries[i]));
			// console.log("You selected the country: \n" + selected_country.country.name);

			drawCountriesFlow(map, selected_country,
				countries_and_centroids, flows, pop,
				inflow_bool, selected_year0, min_flow_threshold, selected_gender,
				normalized_bool, path, radius_scale)
		}
	}
}

// Draws selected countries and their respective flow data
function drawCountriesFlow(map, selected_country,
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
	let flowing_countries = getFlowingCountries(selected_country, flows, inflow_bool, selected_year0, selected_gender, min_flow_threshold);
	// console.log(flowing_countries);

	// get country population
	let selected_country_population = getCountryPopulation(selected_country, pop, selected_year0);
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
		.attr("r", dd => radius_scale(dd.flow / pop_factor)
		)
		// .attr("r", dd => radius_scale(dd.flow))
		.attr("cx", 0)
		.attr("cy", 0)
		.attr("transform", function (dd) {
			// get destination country
			let dest_country = countries_and_centroids.find((ddd) => ddd.country.numeric == dd[flow_extremity_code].padStart(3, "0")
				)
			;

			return "translate(" + dest_country.centroid + ")";
		});


	// display arcs between origin and destination countries
	// console.log(outflow_countries[0]);
	// console.log(countries_and_centroids.find(ddd => ddd.country.numeric == outflow_countries[0].dest_code.padStart(3, "0")));
	// let dest_country = countries_and_centroids.find((ddd) => ddd.country.numeric == dd.dest_code.padStart(3, "0"));

	// display arcs
	// let arc_class = inflow_bool ? "arc_in" : "arc_out";
	// map.selectAll("." + arc_class)
	map.selectAll(".arc")
		.data(flowing_countries)
		.enter()
		.append("path")
		// .classed(arc_class, true)
		.classed("arc", true)
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
		})
	;
}

