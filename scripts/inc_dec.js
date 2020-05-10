//countries to show
var countries = ['France',
				 'China',
				 'United States of America',
				 'Switzerland',
				 'Spain',
				 'Portugal',
				 'Italy',
				 'Mexico',
				 'Canada']

var year_range=[1974,2003]


// The svg containing the plot
var inc_dec = d3.select("#inc_dec_svg")


var id_margin = {top: 20, right: 60, bottom: 100, left: 60},
    id_width = 960 - id_margin.left - id_margin.right,
    id_height = 600 - id_margin.top - id_margin.bottom;



id_ready()


function id_ready(){
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

            //console.log('from , to', xTimeFrom, xTimeTo)
            //console.log(yearFrom,yearTo)

			if (xTimeFrom + year_step >= sliderScale.range()[1] && d3.event.x- xTimeFrom >0) return;

            handleGragHead1(sliderScale.invert(d3.event.x))

            if (xTimeFrom + year_step > xTimeTo && d3.event.x- xTimeFrom >0) {
              //console.log('== BIM')
              handleGragHead2(sliderScale.invert(d3.event.x + year_step))
            }
            if(year_range[0]!=yearFrom || year_range[1]!=yearTo){
	            year_range=[yearFrom,yearTo]
	            update_inc_dec()
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
	            update_inc_dec()
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
	//bar plot
	var id_x = d3.scaleLinear()
	    .range([0, id_width]);

	var id_y = d3.scaleBand()
		    .range([0, id_height])


	var id_xAxis = d3.axisBottom()
	    .scale(id_x)


	var id_yAxis = d3.axisLeft()
	    .scale(id_y)
	    .tickSize(0)
	    .tickPadding(6);



	id_x.domain([-150,500]).nice();
	id_y.domain(inc_dec_data().map(function(d) { return d.name; }));

	inc_dec.append('g')
		  .attr('id','inc_dec_bars')
		  .selectAll(".bar")
		  .data(inc_dec_data())
		  .enter().append("rect")
		  .attr("fill", function(d) { return (d.value < 0 ? "#f67280" : "#69b3a2"); })
		  .attr("x", function(d) { return id_x(Math.min(0, d.value)); })
		  .attr("y", function(d) { return id_y(d.name)+5; })
		  .attr("width", function(d) { return Math.abs(id_x(d.value) - id_x(0)); })
		  .attr("height", id_y.bandwidth()-10);

	inc_dec.append("g")
	  .style("font", "14px times")
	  .attr('id','inc_dec_x')
	  .attr("class", "x axis")
	  .attr("transform", "translate(0," + id_height + ")")
	  .call(id_xAxis);

	inc_dec.append("g")
	  .style("font", "14px times")
	  .attr('id','inc_dec_y')
	  .attr("class", "y axis")
	  .attr("transform", "translate(" + id_x(0) + ",0)")
	  .call(id_yAxis);


	//years label
	inc_dec.append('text')
		   .attr('id','inc_dec_year_label')
		   .text(year_range[0]+' - '+year_range[1])
		   .attr('transform','translate('+(id_width/2-80)+','+(id_height+id_margin.bottom)+')')
		   .attr("font-family", "sans-serif")
           .attr("font-size", "30px")

}

function update_inc_dec(){
	var id_x = d3.scaleLinear()
	    .range([0, id_width]);

	var id_y = d3.scaleBand()
		    .range([0, id_height])


	var id_xAxis = d3.axisBottom()
	    .scale(id_x)


	var id_yAxis = d3.axisLeft()
	    .scale(id_y)
	    .tickSize(0)
	    .tickPadding(6);

	id_x.domain([-150,500]).nice();
	id_y.domain(inc_dec_data().map(function(d) { return d.name; }));


	d3.select('#inc_dec_bars')
		.selectAll('rect')
		.data(inc_dec_data())
		.transition()
      	.duration('200')
		.attr("fill", function(d) { return (d.value < 0 ? "#f67280" : "#69b3a2"); })
		  .attr("x", function(d) { return id_x(Math.min(0, d.value)); })
		  .attr("y", function(d) { return id_y(d.name)+5; })
		  .attr("width", function(d) { return Math.abs(id_x(d.value) - id_x(0)); })
		  .attr("height", id_y.bandwidth()-10);

	d3.select('#inc_dec_x').remove()
	//d3.select('#inc_dec_y').remove()
	inc_dec.append("g")
      .style("font", "14px times")
	  .attr('id','inc_dec_x')
	  .attr("class", "x axis")
	  .attr("transform", "translate("+id_margin.left+"," + (id_height + id_margin.top)+ ")")
	  .call(id_xAxis);


	d3.select('#inc_dec_y')
	  .style("font", "14px times")
	  .transition()
      .duration('200')
	  .attr("transform", "translate(" + (id_x(0)) + ",0)")


    //years label
	d3.select('#inc_dec_year_label')
		   .text(year_range[0]+' - '+year_range[1])

}


function inc_dec_data(){
	//console.log(year_range)
	var result = []

	//Get data by years
	var min_year = beehives[year_range[0]]
	var max_year = beehives[year_range[1]]


	for (let i=0; i<countries.length; i++){
		let obj={}
		obj.name=countries[i]
		obj.value=(max_year[obj.name].beehives-min_year[obj.name].beehives)/min_year[obj.name].beehives*100

		result.push(obj)
	}

	return result

}