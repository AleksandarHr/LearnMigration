class WorldMapPlot {
    constructor(data, country_codes_and_names, flows, pop, dev_info) {

        this.data = data;
        this.country_codes_and_names = country_codes_and_names;
        this.flows = flows;
        this.pop = pop.map(x => {
            x.pop = x.pop.split('.').join('');
            return x
        });
        // get countries' topographic data
        this.countries = topojson.feature(this.data, this.data.objects.countries).features;
        // reset countries' flows
        this.resetCountriesFlow();
        // compute list of all countries' names for filter selection
        this.country_names = [];
        this.countries_and_centroids = [];
        this.country_codes_and_names.map(x => this.country_names.push(x.name));
        this.all_years = Array.from([...new Set(this.flows.map(x => parseInt(x.year0)))]).sort();

        // Development level information
        this.dev_info = dev_info;
        this.dev_level_info = dev_info.filter(x => x.DevelopmentLevel.includes("Developed"));
        this.income_level_info = dev_info.filter(x => x.DevelopmentLevel.includes("income"));
        this.dev_levels = Array.from([...new Set(this.dev_level_info.map(x => x.DevelopmentLevel))]);
        this.income_levels = Array.from([...new Set(this.income_level_info.map(x => x.DevelopmentLevel))]);
        this.income_level_color_scale = d3version4.scaleSequential(d3version4.interpolateGnBu);
        // set svg's height and with
        this.SVG_HEIGHT = 400;
        this.SVG_WIDTH = 800;

        // set margins
        this.margin = {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        };

        // set actual height and width (remove margins)
        this.height = this.SVG_HEIGHT - this.margin.top - this.margin.bottom;
        this.width = this.SVG_WIDTH - this.margin.left - this.margin.right;

        // set filtering letiables
        this.min_flow_threshold = 0;
        this.selected_gender = 'b';
        this.selected_year0 = 1990;
        this.inflow_bool = false;
        this.normalized_bool = false;
        this.selected_country = null;
        this.hovered_country = null;

        this.selected_map_type = null;
        this.world_map_slider = null;
        // set scales
        // logarithmic scale for the radius of the flowing countries
        this.radius_scale = d3version4.scaleSymlog()
            .domain([0, 2.83e6])
            .constant(0.01)
            .range([0, 30]);

        // Define color scales for migration flow's choropleth
        // yes I tried quite a bunch :P. Here is the website displaying the different chromatic scales:
        // https://github.com/d3/d3-scale-chromatic
        // this.inflow_color_scale = d3version4.scaleSequential(d3version4.interpolateReds);
        this.inflow_color_scale = d3version4.scaleSequential(d3version4.interpolateYlGn);
        this.outflow_color_scale = d3version4.scaleSequential(d3version4.interpolateGnBu);
        this.lowest_flow = 10000000000;
        this.highest_flow = -10000000000;

        // construct world map's svg
        this.svg = d3version4.select("#flow-world-map")
            .append("svg")
            .classed("world-map_svg", true)
            .attr("viewBox", `0 0 ${this.SVG_WIDTH} ${this.SVG_HEIGHT}`)

        this.map = this.svg.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        self = this;
        // enable zoom on map
        this.svg.call(d3version4.zoom()
            .extent([
                [0, 0],
                [this.width, this.height]
            ])
            .scaleExtent([1, 10])
            .translateExtent([
                [0, -1 * (this.margin.top)],
                [this.width + this.margin.right, this.height + this.margin.bottom]
            ])
            .on("zoom", function() {
                // map.style("stroke-width", 1.5 / d3version4.event.transform.k + "px");
                // g.attr("transform", "translate(" + d3version4.event.translate + ")scale(" + d3version4.event.scale + ")"); // not in d3version4 v4
                self.map.attr("transform", d3version4.event.transform); // updated for d3version4 v4));
            }));

        // create projection
        // here are some that look pretty good to Jon:
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

    drawFlowLines() {
        const self = this;
        const line = d3version4.line().curve(d3version4.curveBasis);
        const flowing_countries = this.getFlowingCountries(this.selected_country, this.inflow_bool);
        const country_code = this.inflow_bool ? "orig_code" : "dest_code";

        flowing_countries.forEach(function(d, i) {
            let routePath = self.map.append("g").append("path")
                .attr("d", () => {
                    const country_name = self.country_codes_and_names.find(x => parseInt(x.numeric) == d[country_code]).name;
                    const curr_centroid = self.countries_and_centroids.find(x => x.country.name.localeCompare(country_name) == 0).centroid;
                    let intermediate_point = [];
                    intermediate_point[0] = (self.selected_country.centroid[0] + curr_centroid[0]) / 2 - 25;
                    intermediate_point[1] = (self.selected_country.centroid[1] + curr_centroid[1]) / 2 - 25;
                    if (self.inflow_bool) {
                        return line([curr_centroid, intermediate_point, self.selected_country.centroid]);
                    } else {
                        return line([self.selected_country.centroid, intermediate_point, curr_centroid]);
                    }
                })
                .attr("class", "route")
                .attr("stroke-opacity", (Math.sqrt(d.flow / (self.highest_flow * self.pop_factor ))))
                .attr("stroke-width", 1);

            let totalLength = routePath.node().getTotalLength() + 10;
            routePath
                .attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(2000)
                // .on("start", drawPorts(d))
                .attr("stroke-dashoffset", 0);
        });
    }

    getFlowingCountries(country, inflow_bool) {
        const flow_extremity = inflow_bool ? "dest" : "orig";
        const flowing_countries = this.flows.filter(dd =>
            (dd[flow_extremity] == country.country.iso_a3) &
            (dd.year0 == this.selected_year0) &
            (dd.flow > this.min_flow_threshold) &
            (dd.sex == this.selected_gender));
        return flowing_countries;
    }

    getCountryPopulation(country) {
        let filter_country = null;
        if (country != null) {
            filter_country = this.pop.filter(d => d.year == this.selected_year0)
                .find(d => d.alpha3 == country.country.iso_a3);
            if (filter_country == null) {
                return null;
            }
        }
        return filter_country.pop;
    }

    resetCountriesFlow() {
        self = this;
        self.countries.forEach(d => d.flow = 0);
        this.lowest_flow = 10000000000;
        this.highest_flow = -10000000000;
    }

    getTotalFlows() {
        let total_inflow = 0;
        let total_outflow = 0;
        if (self.hovered_country != null) {
            let flow_code = "orig_code";
            const inflowing_countries = self.getFlowingCountries(self.hovered_country, true);
            self.countries.forEach(d => {
                const inf = inflowing_countries.find(dd => dd[flow_code].padStart(3, "0") == d['id']);
                if (inf != undefined && inf != null) {
                    total_inflow += parseInt(inf['flow']);
                }
            });

            flow_code = "dest_code";
            const outflowing_countries = self.getFlowingCountries(self.hovered_country, false);
            self.countries.forEach(d => {
                // console.log("update flow");
                const outf = outflowing_countries.find(dd => dd[flow_code].padStart(3, "0") == d['id']);
                if (outf != undefined && outf != null) {
                    total_outflow += parseInt(outf['flow']);
                }
            });
        }
        return [total_inflow, total_outflow];
    }

    updateCountriesFlow(flowing_countries) {
        self = this;
        const country_id_field_name = self.inflow_bool ? "orig_code" : "dest_code";
        self.countries.forEach(d => {
            // console.log("update flow");
            let country = flowing_countries.find(dd => dd[country_id_field_name].padStart(3, "0") == d['id']);

            if (country != undefined) {
                d.flow = parseInt(country['flow']);
                if (d.flow > this.highest_flow) {
                    this.highest_flow = d.flow;
                }
                if (d.flow < this.lowest_flow) {
                    this.lowest_flow = d.flow;
                }
            }
        });
        if (self.inflow_bool) {
            this.inflow_color_scale = d3version4.scaleQuantize().range(inflow_color_scheme).domain([this.lowest_flow, this.highest_flow]);
        } else {
            this.outflow_color_scale = d3version4.scaleQuantize().range(outflow_color_scheme).domain([this.lowest_flow, this.highest_flow]);
        }
    }

    print_countries_flow() {
        self = this;
        this.countries.forEach(d => {
            const country = self.country_codes_and_names.find(dd => dd['numeric'] == d['id']);
            if (country != undefined) {
                console.log(country['name'] + ", flow = " + d.flow);
            }
        });
    }

    updateSelectedCountry(country) {
        this.removePreviousSelections();
        this.selected_country = country;
        this.displaySelectedCountries();
    }

    updateSelectedYear(year) {
        this.removePreviousSelections();
        this.selected_year0 = year;
        this.displaySelectedCountries();
    }


    // Renders legend for map coloring
    makeColorLegend() {
        this.colorbar_size = [this.SVG_WIDTH - 50, 20];
        const color_scale = d3version4.scaleLog();

        if (this.selected_map_type.localeCompare(map_types[0]) == 0) {
            // migration flow map
            if (this.inflow_bool) {
                color_scale.range([inflow_color_scheme[0], inflow_color_scheme[inflow_color_scheme.length - 1]])
            } else {
                color_scale.range([outflow_color_scheme[0], outflow_color_scheme[outflow_color_scheme.length - 1]])
            }
            color_scale.domain([this.lowest_flow, this.highest_flow]);
        } else if (this.selected_map_type.localeCompare(map_types[1]) == 0) {
            // development levels map
            color_scale.range([development_levels_color_scheme[0], development_levels_color_scheme[development_levels_color_scheme.length - 1]])
        } else if (this.selected_map_type.localeCompare(map_types[2]) == 0) {
            // income levels map
            color_scale.range([income_levels_color_scheme[0], income_levels_color_scheme[income_levels_color_scheme.length - 1]])
        } else {
            d3version4.selectAll(".color_legend").remove();
            return;
        }

        d3version4.selectAll(".color_legend").remove();
        this.color_bar_svg = d3version4.select("#world_map_legend")
            .append("svg")
            .classed("color_legend", true)
            .attr("viewBox", `0 0 ${this.colorbar_size[0]} ${this.colorbar_size[1]}`)

        const value_to_svg = d3version4.scaleLog()
            .domain(color_scale.domain())
            .range([this.colorbar_size[0], 0]);

        const range01_to_color = d3version4.scaleLinear()
            .domain([0, 1])
            .range(color_scale.range())
            .interpolate(color_scale.interpolate());

        // Axis numbers
        const colorbar_axis = d3version4.axisLeft(value_to_svg)
            .tickFormat(d3.format(".0f"))

        const colorbar_g = this.color_bar_svg.append("g")
            .attr("transform", "translate(" + 0 + ', ' + 0 + ")")
            .call(colorbar_axis);


        // Create the gradient
        function range01(steps) {
            return Array.from(Array(steps), (elem, index) => index / (steps - 1));
        }

        const svg_defs = this.color_bar_svg.append("defs");

        const gradient = svg_defs.append('linearGradient')
            .attr('id', 'colorbar-gradient')
            .attr('x1', '0%') // bottom
            .attr('y1', '0%')
            .attr('x2', '100%') // to top
            .attr('y2', '0%')
            .attr('spreadMethod', 'pad');

        gradient.selectAll('stop')
            .data(range01(10))
            .enter()
            .append('stop')
            .attr('offset', d => Math.round(100 * d) + '%')
            .attr('stop-color', d => range01_to_color(d))
            .attr('stop-opacity', 1);

        // create the colorful rect
        colorbar_g.append('rect')
            .attr('id', 'colorbar-area')
            .attr('width', this.colorbar_size[0])
            .attr('height', this.colorbar_size[1])
            .style('fill', 'url(#colorbar-gradient)')
            .style('stroke', 'black')
            .style('stroke-width', '1px')


        this.color_bar_svg.append("rect")
            .attr("width", this.colorbar_size[0])
            .attr("height", 0)
            .style("fill", "url(#gradient)")
            .attr("transform", "translate(0,10)");

        this.drawColorBarTicks();
    }

    drawColorBarTicks() {
        d3.selectAll(".color_bar_y_axis").remove();
        if (this.selected_map_type.localeCompare(map_types[0]) == 0 && this.highest_flow > 0) {
            var y = d3version4.scaleLinear()
                .range([this.colorbar_size[0], 0])
                .domain([this.highest_flow, this.lowest_flow])
                .nice();

            var yAxis = d3version4.axisBottom()
                .scale(y)
                .ticks(5);

            this.color_bar_svg.append("g")
                .attr("class", "color_bar_y_axis")
                // .attr("transform", "translate(0,20)")
                .call(yAxis)
                .append("text")
                // .attr("transform", "rotate(-90)")
                .attr("y", 0)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("axis title");
        } else {
            let startText = null;
            let endText = null;
            if (this.selected_map_type.localeCompare(map_types[1]) == 0) {
                // dev levels
                startText = "Less Developed";
                endText = "More Developed";
            } else if (this.selected_map_type.localeCompare(map_types[2]) == 0) {
              startText = "NA / Lower Income";
                endText = "Higher Income";
            }
            this.color_bar_svg.append("g")
                .append("text")
                .text(startText)
                .attr("x", 5)
                .attr("y", 15)
                .attr("font-family", "sans-serif")
                .attr("text-anchor", "start")
                .attr("font-size", "11px")
                .classed(".color_bar_y_axis", true)
                .attr("fill", "black");

            this.color_bar_svg.append("text")
                .text(endText)
                .attr("x", this.colorbar_size[0] - 5)
                .attr("y", 15)
                .attr("font-family", "sans-serif")
                .attr("text-anchor", "end")
                .attr("font-size", "11px")
                .classed(".color_bar_y_axis", true)
                .attr("fill", "black");
        }
    }


    // Displaying countries on the map and defining hover/click behavior
    displayCountries() {
        // display countries and define hovering/selecting behavior
        self = this;

        // get color scale corresponding to in/out flow
        const color_scale = self.inflow_bool ? self.inflow_color_scale : self.outflow_color_scale;

        self.map.append("g").selectAll(".country")
            .data(self.countries)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", self.path)
            .attr("fill", d => {
                return color_scale(d.flow);
            })
            .on("mouseover", function(d) {
                d3version4.select(this).classed("hovered", true);
                //
                // get hovered country
                self.hovered_country = self.countries_and_centroids.find(dd => dd.country.numeric == d.id);
            })
            .on("mouseout", function(d) {
                d3version4.select(this).classed("hovered", false);
                self.hovered_country = null;
            })
            .on("click", function(d) {
                self.updateSelectedCountry(self.countries_and_centroids.find(dd => dd.country.numeric == d.id));
            }) // end of "on click"
    }

    displayDevelopmentLevels() {
        // display countries and define hovering/selecting behavior
        const self = this;
        // get color scale corresponding to in/out flow
        let linearScale = d3version4.scaleLinear()
            .domain([self.dev_levels.length, 0])
            .range(development_levels_color_scheme);

        self.map.append("g").selectAll(".country")
            .data(self.countries)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", self.path)
            .attr("fill", d => {
                const curr_country = self.countries_and_centroids.find(dd => dd.country.numeric == d.id);
                if (curr_country != null) {
                    const found = self.dev_level_info.find(dd => dd.Region.localeCompare(curr_country.country.name) == 0)
                    if (found != null) {
                        return linearScale(self.dev_levels.indexOf(found.DevelopmentLevel));
                    }
                }
            })
            .on("mouseover", function(d) {
                d3version4.select(this).classed("hovered", true);
                self.hovered_country = self.countries_and_centroids.find(dd => dd.country.numeric == d.id);
            })
            .on("mouseout", function(d) {
                d3version4.select(this).classed("hovered", false);
                self.hovered_country = null;
            });
    }

    displayIncomeLevels() {
        // display countries and define hovering/selecting behavior
        self = this;
        // get color scale corresponding to in/out flow
        let color_scale = d3version4.scaleLinear()
            .domain([self.income_levels.length, 0])
            .range(income_levels_color_scheme);


        self.map.append("g").selectAll(".country")
            .data(self.countries)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", self.path)
            .attr("fill", d => {
                const curr_country = self.countries_and_centroids.find(dd => dd.country.numeric == d.id);
                if (curr_country != null) {
                    const found = self.income_level_info.find(dd => dd.Region.localeCompare(curr_country.country.name) == 0)
                    if (found != null) {
                        return color_scale(self.income_levels.indexOf(found.DevelopmentLevel));
                    }
                }
            })
            .on("mouseover", function(d) {
                d3version4.select(this).classed("hovered", true);
                const hovered_country = self.countries_and_centroids.find(dd => dd.country.numeric == d.id);
                self.hovered_country = hovered_country;
            })
            .on("mouseout", function(d) {
                d3version4.select(this).classed("hovered", false);
                self.hovered_country = null;
            });
    }

    removePreviousFlowLines() {
        d3.selectAll(".route").remove();
    }

    // Clears any previous visualized selections and flow data
    removePreviousSelections() {
        // REMOVE PRIOR SELECTION
        self = this;
        this.removePreviousFlowLines()
        // remove prior selection if any
        self.map.selectAll(".selected").remove()
        self.map.selectAll(".selected").classed("selected", false);
        // remove previously selected country's circle
        self.map.selectAll(".selected-country-circle").remove()
        self.map.selectAll(".selected-country-circle").classed("selected-country-circle", false);
        // remove circles identifying previously selected flowing countries
        const flow_class = self.inflow_bool ? "inflow-country" : "outflow-country";
        self.map.selectAll("." + flow_class)
            .remove();
        // remove arcs from previous selection if any
        const arc_class = self.inflow_bool ? "arc_in" : "arc_out";
        self.map.selectAll("." + arc_class)
            .remove();
    }

    removeDevelopmentInformation() {
        self.map.append("g").selectAll(".country")
            .data(self.countries)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", self.path)
            .attr("fill", null)
    }

    // Display selected countries
    displaySelectedCountries() {
        // remove previous flows' displayed
        self = this;
        this.removePreviousSelections();
        if (self.selected_country != null) {
            self.drawCountriesFlow();
            this.drawFlowLines();
            this.drawColorBarTicks();
        }
    }

    // Draws selected countries and their respective flow data
    drawCountriesFlow() {
        self = this;
        // compute outflowing countries from selected country
        const flowing_countries = self.getFlowingCountries(self.selected_country, self.inflow_bool);
        // update countries' flow letiable
        self.resetCountriesFlow();
        if (flowing_countries.length > 0) {
            self.updateCountriesFlow(flowing_countries);
        }

        // display updated colors on map
        self.displayCountries();

        // display circle at the centroid of selected country
        self.map.append("circle")
            .classed("selected-country-circle", true)
            .attr("r", 4)
            .attr("cx", self.selected_country.centroid[0])
            .attr("cy", self.selected_country.centroid[1]);

        // get country population
        const selected_country_population = self.getCountryPopulation(self.selected_country);
        this.pop_factor = self.normalized_bool ? selected_country_population : 1;
        this.highest_flow = this.highest_flow / this.pop_factor;
        this.lowest_flow = this.lowest_flow / this.pop_factor;
    }

} // end of class WorldMapPlot

function onCountryHover(world_map_object) {
    document.body.addEventListener('mousemove', function(e) {
        if (e.target.nodeName == 'path' && e.target.className.baseVal == 'country hovered') {
            if (world_map_object.selected_map_type.localeCompare(map_types[0]) == 0) {
                const total_flows = world_map_object.getTotalFlows();
                const country_found = world_map_object.pop.find(x =>
                    parseInt(x.year) == world_map_object.selected_year0 &&
                    x.name.localeCompare(world_map_object.hovered_country.country.name) == 0);
                let population = 0;
                if (country_found != null && country_found != undefined) {
                    population = parseInt(country_found.pop);
                }
                showWorldMapDetail(e, world_map_object.hovered_country, total_flows, population, world_map_object.selected_year0, world_map_object.selected_gender);
            } else {
                showWorldMapDetail(e, world_map_object.hovered_country, null, null, null, null);
            }
        }
    });
    document.body.addEventListener('mouseout', function(e) {
        if (e.target.nodeName == 'path') {
            hideDetail();
        }
    });
}

function showWorldMapDetail(e, hovered_country, total_flows, country_population, year, gender) {
    let content = "";
    if (!hovered_country) {
        // No prior count data
        content = "<b>" + "No Country Data, " + year + "</b><br/>";
    } else {
        if (country_population == 0 || country_population == null || total_flows == null) {
            content += "<b>" + hovered_country.country.name + "</b><br/>";
        } else {
            let gender_str = "Total";
            if (gender == 'm') gender_str = "Male";
            else if (gender == 'f') gender_str = "Female";
            // Display change w.r.t. previous and current count data, current data, current ratio
            content += "<h4>" + hovered_country.country.name + ", " + year + "</h4>";
            content += "<b>Population: " + d3.format(",")(country_population) + "</b><br/>";
            content += "<b>" + gender_str + " Inflow: " + d3.format(",")(total_flows[0]) + " (" + d3.format(".2%")(total_flows[0] / country_population) + " of total population)" + "</b><br/>";
            content += "<b>" + gender_str + " Outflow: " + d3.format(",")(total_flows[1]) + " (" + d3.format(".2%")(total_flows[1] / country_population) + " of total population)" + "</b><br/>";
            // "Thin" version:
            // content += "<h4>" + hovered_country.country.name + "</h4>";
            // content += "<b>Population:</b><br/>" + d3.format(",")(country_population) + "<br/>";
            // content += "<b>" + "Total Inflow:</b><br/>" + d3.format(",")(total_flows[0]) + " (" + d3.format(".2%")(total_flows[0] / country_population) + " of total population)" + "<br/>";
            // content += "<b>" + "Total Outflow:</b><br/>" + d3.format(",")(total_flows[1]) + " (" + d3.format(".2%")(total_flows[1] / country_population) + " of total population)" + "<br/>";
        }
    }
    // Render the pop-up dialogue with relevant information
    renderPopUpDetailDialogue(e, content);
}


function setupWorldMapSelectionControls(world_map_object) {
    // Creating data for Select Country menu
    let countries_data = []
    for (i = 0; i < world_map_object.country_names.length; i++) {
        countries_data.push({
            country: world_map_object.country_names[i],
        })
    }
    // Setting up the dropdown menu for Destination Country selection
    const countrySelect = dc.selectMenu('#world_map_countries');
    const ndx = crossfilter(countries_data);
    const countryDimension = ndx.dimension(function(d) {
        return d.country
    });

    countrySelect
        .dimension(countryDimension)
        .group(countryDimension.group())
        .multiple(false)
        .title(function(d) {
            return d.key;
        })
        .numberVisible(null)
        .promptText('All Countries')
        .promptValue(null);

    // Add styling to the dropdown menu
    countrySelect.on('pretransition', function(chart) {
        // add styling to select input
        d3.select('#world_map_countries').classed('dc-chart', false);
        // use Bootstrap styling
        chart.select('select').classed('form-control', true);
    });

    let map_types_data = [];
    for (i = 0; i < map_types.length; i++) {
        map_types_data.push({
            map_type: map_types[i],
        })
    }
    // Setting up the dropdown menu for Destination Country selection
    const mapSelect = dc.selectMenu('#world_map_type');
    const ndx_map_type = crossfilter(map_types_data);
    const mapSelectDimension = ndx_map_type.dimension(function(d) {
        return d.map_type
    });

    mapSelect
        .dimension(mapSelectDimension)
        .group(mapSelectDimension.group())
        .multiple(false)
        .title(function(d) {
            return d.key;
        })
        .numberVisible(null)
        .promptText('All Map Types')
        .promptValue(null);

    // Add styling to the dropdown menu
    mapSelect.on('pretransition', function(chart) {
        // add styling to select input
        d3.select('#world_map_type').classed('dc-chart', false);
        // use Bootstrap styling
        chart.select('select').classed('form-control', true);
    });

    // Add functionality on country selection
    mapSelect.on('filtered', function(chart, filter) {
        if (filter != null) {
            if (filter.localeCompare(map_types[0]) == 0) {
                world_map_object.selected_map_type = map_types[0];
                if (world_map_object.selected_country != null) {
                    countrySelect.filter(world_map_object.selected_country.country.name);
                }
                world_map_object.removePreviousFlowLines();
                world_map_object.removeDevelopmentInformation();
                world_map_object.displayCountries();
            } else if (filter.localeCompare(map_types[1]) == 0) {
                world_map_object.removePreviousFlowLines();
                world_map_object.removeDevelopmentInformation();
                world_map_object.displayDevelopmentLevels();
                world_map_object.selected_map_type = map_types[1];
                world_map_object.drawColorBarTicks();
            } else {
                world_map_object.removePreviousFlowLines();
                world_map_object.removeDevelopmentInformation();
                world_map_object.displayIncomeLevels();
                world_map_object.selected_map_type = map_types[2];
                world_map_object.drawColorBarTicks();
            }
            world_map_object.makeColorLegend();
            enableDisableFilters(world_map_object);
        }
    });
    mapSelect.filter(map_types[0]);

    // Add functionality on country selection
    if (world_map_object.selected_map_type.localeCompare(map_types[0]) == 0) {
        countrySelect.on('filtered', function(chart, filter) {
            if (filter != null) {
                if (world_map_object.selected_map_type.localeCompare(map_types[0]) == 0) {
                    world_map_object.updateSelectedCountry(self.countries_and_centroids.find(dd => 0 == dd.country.name.localeCompare(filter)));
                } else {
                    countrySelect.filter(null);
                }
            } else {
                // otherwise, show the last selected country
            }
        });
    }

    // Render the two dropdown menus
    dc.renderAll();

    d3.selectAll(".gender_cb").on("change", function() {
        world_map_object.removePreviousSelections();
        if (d3.select("#male_checkbox").property("checked")) {
            world_map_object.selected_gender = 'm';
        } else if (d3.select("#female_checkbox").property("checked")) {
            world_map_object.selected_gender = 'f';
        } else {
            world_map_object.selected_gender = 'b';
        }
        world_map_object.displaySelectedCountries();
    });

    d3.selectAll(".flow_cb").on("change", function() {
        world_map_object.removePreviousSelections();
        if (d3.select("#inflow_cb").property("checked")) {
            world_map_object.inflow_bool = true;
        } else {
            world_map_object.inflow_bool = false;
        }
        world_map_object.makeColorLegend();
        world_map_object.displaySelectedCountries();
    });

    d3.selectAll(".normalize_flow").on("change", function() {
        world_map_object.removePreviousSelections();
        if (d3.select("#yes_normalize").property("checked")) {
            world_map_object.normalized_bool = true;
        } else {
            world_map_object.normalized_bool = false;
        }
        world_map_object.displaySelectedCountries();
    });
} // end of function setupWorldMapSelectionControls

function enableDisableFilters(world_map_object) {
    let enable = world_map_object.selected_map_type.localeCompare(map_types[0]) == 0;
    let gender_cbs = document.getElementsByName('gender_cb');
    let flow_cbs = document.getElementsByName('flow_cb');
    let normalize_cbs = document.getElementsByName('normalize_cb');

    if (enable) {
        // world map migration flow - enalbe filters
        for (let i = 0; i < gender_cbs.length; i++) {
            gender_cbs[i].disabled = false;
        }
        for (let i = 0; i < flow_cbs.length; i++) {
            flow_cbs[i].disabled = false;
        }
        for (let i = 0; i < normalize_cbs.length; i++) {
            normalize_cbs[i].disabled = false;
        }
        world_map_object.world_map_slider.trackInset.classed('disabled', false);
        world_map_object.world_map_slider.handle.classed('disabled', false);
    } else {
        // not world map migration flow (e.g. development levels or income levels) - disalbe filters
        for (let i = 0; i < gender_cbs.length; i++) {
            gender_cbs[i].disabled = true;
        }
        for (let i = 0; i < flow_cbs.length; i++) {
            flow_cbs[i].disabled = true;
        }
        for (let i = 0; i < normalize_cbs.length; i++) {
            normalize_cbs[i].disabled = true;
        }
        world_map_object.world_map_slider.trackInset.classed('disabled', true);
        world_map_object.world_map_slider.handle.classed('disabled', true);
    }
}

function whenDocumentLoaded(action) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", action);
    } else {
        // `DOMContentLoaded` already fired
        action();
    };
}

// display map
function world_map_ready(error, data, country_codes_and_names, flows, pop, dev_info) {
    if (error) {
        console.log("Error loading data: " + error);
        throw error;
    }
    world_map = new WorldMapPlot(data, country_codes_and_names, flows, pop, dev_info);
    // Display countries
    world_map.displayCountries();
    world_map.world_map_slider = new Slider("world_map_slider", [d3.min(world_map.all_years), d3.max(world_map.all_years)], 5, world_map, 800);
    setupWorldMapSelectionControls(world_map);
    world_map.makeColorLegend();
    onCountryHover(world_map);
} // end of function `ready`

whenDocumentLoaded(() => {
    // import world atlas topojson
    d3version4.queue()
        .defer(d3version4.json, world_json_path)
        .defer(d3version4.json, country_codes_and_names_path)
        .defer(d3version4.csv, migflow_gender_path)
        .defer(d3version4.csv, pop_path)
        .defer(d3version4.csv, dev_level_path)
        .await(this.world_map_ready);
});
