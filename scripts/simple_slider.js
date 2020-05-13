
var MIN_YEAR = 1990,
    MAX_YEAR = 2010,
    min_selected_year = 1990,
    max_selected_year = 2010;

//var years = [1990, 1995, 2000, 2005, 2010];
var year_display = 1990;

var svg_simple_slider = d3.select("#simple_slider_d3")
    .append("svg")
    .attr("width", 250)
    .attr("height", 40);
//    .append("rect")
//    .attr("cx", 0)
//    .attr("cy", 0)
//    .attr("width", 250)
//    .attr("height", 40)
//    .attr("fill", "red");

var simple_slider = svg_simple_slider.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + 10 + "," + 20 + ")");

var slider_width = 200,
    x_simple_slider = d3.scaleLinear()
        .domain([1990, 2010])
        .range([0, slider_width])
        .clamp(true);

//var sliderStep = d3
//.sliderBottom()
//.min(d3.min(years))
//.max(d3.max(years))
//.width(300)
//.ticks(4)
//.step(5)
//.default(1990)
//.on('onchange', val => {
//  d3.select('p#value-step').text(val);
//});
//
//var gStep = d3
//.select('#simple_slider_d3')
//.append('svg')
//.attr('width', 250)
//.attr('height', 40)
//.append('g')
//.attr('transform', 'translate(30,30)');
//
//gStep.call(sliderStep);
//
//d3.select('p#value-step').text(sliderStep.value());


simple_slider.append("line")
    .attr("class", "track")
    .attr("x1", x_simple_slider.range()[0])
    .attr("x2", x_simple_slider.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { simple_slider.interrupt(); })
        .on("start drag", function() {
            setHandle(x_simple_slider.invert(d3.event.x));
        }));

simple_slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .append("text")
    .attr("x", 77)
    .attr("class", "label_simple_slider")
    .style('font-size', '11px')
    .style('fill', 'red')
    .text(function(){
        return year_display
    });


var handle = simple_slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("cx", x_simple_slider(year_display))
    .attr("r", 9);

function setHandle(h) {
    handle.attr("cx", x_simple_slider(Math.round(h)));
//    if (country_selected) updateNumberArcs();

    year_display = Math.round(h);

    simple_slider.select(".label_simple_slider").text(function(){
        return year_display + "-" + `${year_display + 5}`
    });
}

function getYear0(){
    return x_simple_slider.invert(handle.attr("cx"));
}