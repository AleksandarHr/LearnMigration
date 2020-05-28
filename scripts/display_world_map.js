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

        // set filtering variables
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

        // this.inflow_color_scale = d3version4.scaleSequential(d3version4.interpolateOranges);
        // this.outflow_color_scale = d3version4.scaleSequential(d3version4.interpolatePurples);
        // this.outflow_color_scale = d3version4.scaleSequential(["blue", "purple"]);
        // this.inflow_color_scale = d3version4.scaleSequentialLog(d3version4.interpolateOranges).domain([0, 100]);
        // this.outflow_color_scale = d3version4.scaleSequentialLog(d3version4.interpolatePurples).domain([0, 100]);
        // this.inflow_color_scale = d3version4.scaleSequentialLog(d3version4.interpolateOranges).domain([0, 2.83e6]);
        // this.outflow_color_scale = d3version4.scaleSequentialLog(d3version4.interpolatePurples).domain([0, 2.83e6]);
        // this.outflow_color_scale = d3version4.scaleSequentialLog(d3version4.interpolateBlues).domain([0, 2.83e6]);
        // this.outflow_color_scale = d3version4.scaleSequentialLog(d3version4.interpolatePuBuGn).domain([0, 2.83e6]);
        // this.outflow_color_scale = d3version4.scaleSequentialLog(d3version4.interpolatePuBuGn).domain([0, 2.83e6]);

        // construct world map's svg
        var svg = d3version4.select("#flow-world-map")
            .append("svg")
            .classed("world-map_svg", true)
            .attr("viewBox", `0 0 ${this.SVG_WIDTH} ${this.SVG_HEIGHT}`)

        this.map = svg.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        self = this;
        // enable zoom on map
        svg.call(d3version4.zoom()
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

    drawFlowLines() {
        var self = this;
        var line = d3version4.line().curve(d3version4.curveBasis);
        var flowing_countries = this.getFlowingCountries(this.selected_country, this.inflow_bool);
        var country_code = this.inflow_bool ? "orig_code" : "dest_code";

        flowing_countries.forEach(function(d, i) {
            var routePath = self.map.append("g").append("path")
                .attr("d", () => {
                    var country_name = self.country_codes_and_names.find(x => parseInt(x.numeric) == d[country_code]).name;
                    var curr_centroid = self.countries_and_centroids.find(x => x.country.name.localeCompare(country_name) == 0).centroid;
                    var intermediate_point = [];
                    intermediate_point[0] = (self.selected_country.centroid[0] + curr_centroid[0]) / 2 - 25;
                    intermediate_point[1] = (self.selected_country.centroid[1] + curr_centroid[1]) / 2 - 25;
                    if (self.inflow_bool) {
                        return line([ curr_centroid, intermediate_point, self.selected_country.centroid]);
                    } else {
                        return line([self.selected_country.centroid, intermediate_point, curr_centroid]);
                    }
                })
                .attr("class", "route")
                .attr("stroke-opacity", Math.sqrt(d.flow / self.highest_flow))
                .attr("stroke-width", 1);

            var totalLength = routePath.node().getTotalLength() + 10;
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
        let flow_extremity = inflow_bool ? "dest" : "orig";
        let flowing_countries = this.flows.filter(dd =>
            (dd[flow_extremity] == country.country.iso_a3) &
            (dd.year0 == this.selected_year0) &
            (dd.flow > this.min_flow_threshold) &
            (dd.sex == this.selected_gender));
        return flowing_countries;
    }

    getCountryPopulation(country) {
        if (country != null) {
            var filter_country = this.pop.filter(d => d.year == this.selected_year0)
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
        var total_inflow = 0;
        var total_outflow = 0;
        if (self.hovered_country != null) {
            var flow_code = "orig_code";
            let inflowing_countries = self.getFlowingCountries(self.hovered_country, true);
            self.countries.forEach(d => {
                let inf = inflowing_countries.find(dd => dd[flow_code].padStart(3, "0") == d['id']);
                if (inf != undefined && inf != null) {
                    total_inflow += parseInt(inf['flow']);
                }
            });

            flow_code = "dest_code";
            let outflowing_countries = self.getFlowingCountries(self.hovered_country, false);
            self.countries.forEach(d => {
                // console.log("update flow");
                let outf = outflowing_countries.find(dd => dd[flow_code].padStart(3, "0") == d['id']);
                if (outf != undefined && outf != null) {
                    total_outflow += parseInt(outf['flow']);
                }
            });
        }
        return [total_inflow, total_outflow];
    }

    updateCountriesFlow(flowing_countries) {
        self = this;
        let country_id_field_name = self.inflow_bool ? "orig_code" : "dest_code";
        self.countries.forEach(d => {
            // console.log("update flow");
            let country = flowing_countries.find(dd => dd[country_id_field_name].padStart(3, "0") == d['id']);

            // let selected_country_population = self.getCountryPopulation(self.selected_country);
            // let pop_factor = self.normalized_bool ? selected_country_population : 1;
            if (country != undefined) {
                d.flow = country['flow'];
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
            let country = self.country_codes_and_names.find(dd => dd['numeric'] == d['id']);
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

    // Displaying countries on the map and defining hover/click behavior
    displayCountries() {
        // display countries and define hovering/selecting behavior
        self = this;

        // get color scale corresponding to in/out flow
        let color_scale = self.inflow_bool ? self.inflow_color_scale : self.outflow_color_scale;

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

                // get hovered country
                let hovered_country = self.countries_and_centroids.find(dd => dd.country.numeric == d.id);
                self.hovered_country = hovered_country;
                // get country population
                let hovered_country_population = self.getCountryPopulation(hovered_country);
                if (hovered_country_population != null) {
                    // get in/out flowing countries to/from the hovered country
                    let flowing_countries = self.getFlowingCountries(hovered_country, self.inflow_bool);

                    // remove arcs from previous hover if any
                    self.map.selectAll(".arc_hovered")
                        .remove();

                    // // display arcs
                    // let flow_extremity_code = self.inflow_bool ? "orig_code" : "dest_code";
                    // self.map.selectAll(".arc_hovered")
                    //     .data(flowing_countries)
                    //     .enter()
                    //     .append("path")
                    //     .classed("arc_hovered", true)
                    //     .attr("d", dd => {
                    //         let dest_country = self.countries_and_centroids.find(ddd => ddd.country.numeric == dd[flow_extremity_code].padStart(3, "0"));
                    //         let x_0 = hovered_country.centroid[0];
                    //         let x_1 = dest_country.centroid[0];
                    //         let y_0 = hovered_country.centroid[1];
                    //         let y_1 = dest_country.centroid[1];
                    //         let dx = x_1 - x_0;
                    //         let dy = y_1 - y_0;
                    //         let bend_factor = 10;
                    //         let eucl_dist = Math.sqrt(dx * dx + dy * dy);
                    //         let dr = eucl_dist * bend_factor;
                    //         return "M" + x_1 + "," + y_1 + "A" + dr + "," + dr + " 0 0,1 " + x_0 + "," + y_0;
                    //     });
                }
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
        self = this;
        // get color scale corresponding to in/out flow
        var linearScale = d3version4.scaleLinear()
            .domain([0, self.dev_levels.length])
            .range(['yellow', 'green']);

        self.map.append("g").selectAll(".country")
            .data(self.countries)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", self.path)
            .attr("fill", d => {
                let curr_country = self.countries_and_centroids.find(dd => dd.country.numeric == d.id);
                if (curr_country != null) {
                    var found = self.dev_level_info.find(dd => dd.Region.localeCompare(curr_country.country.name) == 0)
                    if (found != null) {
                        return linearScale(self.dev_levels.indexOf(found.DevelopmentLevel));
                    }
                }
            })
            .on("mouseover", function(d) {
                d3version4.select(this).classed("hovered", true);
                let hovered_country = self.countries_and_centroids.find(dd => dd.country.numeric == d.id);
                self.hovered_country = hovered_country;
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
        var color_scale = d3version4.scaleQuantize().range(income_levels_color_scheme).domain([0, self.income_levels.length]);

        self.map.append("g").selectAll(".country")
            .data(self.countries)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", self.path)
            .attr("fill", d => {
                let curr_country = self.countries_and_centroids.find(dd => dd.country.numeric == d.id);
                if (curr_country != null) {
                    var found = self.income_level_info.find(dd => dd.Region.localeCompare(curr_country.country.name) == 0)
                    if (found != null) {
                        return color_scale(self.income_levels.indexOf(found.DevelopmentLevel));
                    }
                }
            })
            .on("mouseover", function(d) {
                d3version4.select(this).classed("hovered", true);
                let hovered_country = self.countries_and_centroids.find(dd => dd.country.numeric == d.id);
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
        let flow_class = self.inflow_bool ? "inflow-country" : "outflow-country";
        self.map.selectAll("." + flow_class)
            .remove();
        // remove arcs from previous selection if any
        let arc_class = self.inflow_bool ? "arc_in" : "arc_out";
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
        }
    }

    // Draws selected countries and their respective flow data
    drawCountriesFlow() {
        self = this;
        // compute outflowing countries from selected country
        let flowing_countries = self.getFlowingCountries(self.selected_country, self.inflow_bool);
        // update countries' flow variable
        // console.log(flowing_countries);
        self.resetCountriesFlow();
        if (flowing_countries.length > 0) {
            self.updateCountriesFlow(flowing_countries);
            // console.log("No info!!");
        }

        // display updated colors on map
        self.displayCountries();
        // self.print_countries_flow();

        // display circle at the centroid of selected country
        self.map.append("circle")
            .classed("selected-country-circle", true)
            .attr("r", 4)
            .attr("cx", self.selected_country.centroid[0])
            .attr("cy", self.selected_country.centroid[1]);

        // get country population
        let selected_country_population = self.getCountryPopulation(self.selected_country);
        let pop_factor = self.normalized_bool ? selected_country_population : 1;

        // display circles at centroids of destination countries
        // let flow_extremity_code = self.inflow_bool ? "orig_code" : "dest_code";
        // let flow_class = self.inflow_bool ? "inflow-country" : "outflow-country";
        // self.map.selectAll("." + flow_class)
        //     // map.selectAll(".outflow-country")
        //     .data(flowing_countries)
        //     // .data(outflow_countries)
        //     .enter()
        //     // .append("g")
        //     .append("circle")
        //     // .classed("outflow-country", true)
        //     .classed(flow_class, true)
        //     // .attr("r", dd => {
        //     // 	console.log(radius_scale(dd.flow / pop_factor));
        //     // 	radius_scale(dd.flow / pop_factor);
        //     // })
        //     .attr("r", dd => self.radius_scale(dd.flow / pop_factor))
        //     // .attr("r", dd => radius_scale(dd.flow))
        //     .attr("cx", 0)
        //     .attr("cy", 0)
        //     .attr("transform", function(dd) {
        //         // get destination country
        //         let dest_country = self.countries_and_centroids.find((ddd) => ddd.country.numeric == dd[flow_extremity_code].padStart(3, "0"));
        //
        //         return "translate(" + dest_country.centroid + ")";
        //     });

        // display arcs between origin and destination countries
        // console.log(outflow_countries[0]);
        // console.log(countries_and_centroids.find(ddd => ddd.country.numeric == outflow_countries[0].dest_code.padStart(3, "0")));
        // let dest_country = countries_and_centroids.find((ddd) => ddd.country.numeric == dd.dest_code.padStart(3, "0"));

        // // display arcs
        // let arc_class = self.inflow_bool ? "arc_in" : "arc_out";
        // self.map.selectAll("." + arc_class)
        //     .data(flowing_countries)
        //     .enter()
        //     .append("path")
        //     .classed(arc_class, true)
        //     .attr("d", dd => {
        //         let dest_country = self.countries_and_centroids.find(ddd => ddd.country.numeric == dd[flow_extremity_code].padStart(3, "0"));
        //         let x_0 = self.selected_country.centroid[0];
        //         let x_1 = dest_country.centroid[0];
        //         let y_0 = self.selected_country.centroid[1];
        //         let y_1 = dest_country.centroid[1];
        //         let dx = x_1 - x_0;
        //         let dy = y_1 - y_0;
        //         let bend_factor = 10;
        //         let eucl_dist = Math.sqrt(dx * dx + dy * dy);
        //         let dr = eucl_dist * bend_factor;
        //         return "M" + x_1 + "," + y_1 + "A" + dr + "," + dr + " 0 0,1 " + x_0 + "," + y_0;
        //     });
    }

} // end of class WorldMapPlot

function onCountryHover(world_map_object) {
    document.body.addEventListener('mousemove', function(e) {
        if (e.target.nodeName == 'path' && e.target.className.baseVal == 'country hovered') {
            if (world_map_object.selected_map_type.localeCompare(map_types[0]) == 0) {
                var total_flows = world_map_object.getTotalFlows();
                var country_found = world_map_object.pop.find(x =>
                    parseInt(x.year) == world_map_object.selected_year0 &&
                    x.name.localeCompare(world_map_object.hovered_country.country.name) == 0);
                var population = 0;
                if (country_found != null && country_found != undefined) {
                    population = parseInt(country_found.pop);
                }
                showWorldMapDetail(e, world_map_object.hovered_country, total_flows, population);
            } else {
                showWorldMapDetail(e, world_map_object.hovered_country, null, null);
            }
        }
    });
    document.body.addEventListener('mouseout', function(e) {
        if (e.target.nodeName == 'path') {
            hideDetail();
        }
    });
}

function showWorldMapDetail(e, hovered_country, total_flows, country_population) {
    var content = "";
    if (!hovered_country) {
        // No prior count data
        content = "<b>" + "No Country Data" + "</b><br/>";
    } else {
        if (country_population == 0 || country_population == null || total_flows == null) {
            content += "<b>" + hovered_country.country.name + "</b><br/>";
        } else {
            // Display change w.r.t. previous and current count data, current data, current ratio
            content += "<b>" + hovered_country.country.name + "</b><br/>";
            content += "<b>Population: " + d3.format(",")(country_population) + "</b><br/>";
            content += "<b>" + "Total Inflow: " + d3.format(",")(total_flows[0]) + " (" + d3.format(".2%")(total_flows[0] / country_population) + " of total population)" + "</b><br/>";
            content += "<b>" + "Total Outflow: " + d3.format(",")(total_flows[1]) + " (" + d3.format(".2%")(total_flows[1] / country_population) + " of total population)" + "</b><br/>";
        }
    }
    // Render the pop-up dialogue with relevant information
    renderPopUpDetailDialogue(e, content);
}


function setupWorldMapSelectionControls(world_map_object) {
    // Creating data for Select Country menu
    var countries_data = []
    for (i = 0; i < world_map_object.country_names.length; i++) {
        countries_data.push({
            country: world_map_object.country_names[i],
        })
    }
    // Setting up the dropdown menu for Destination Country selection
    var countrySelect = dc.selectMenu('#world_map_countries');
    var ndx = crossfilter(countries_data);
    var countryDimension = ndx.dimension(function(d) {
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

    var map_types_data = [];
    for (i = 0; i < map_types.length; i++) {
        map_types_data.push({
            map_type: map_types[i],
        })
    }
    // Setting up the dropdown menu for Destination Country selection
    var mapSelect = dc.selectMenu('#world_map_type');
    var ndx_map_type = crossfilter(map_types_data);
    var mapSelectDimension = ndx_map_type.dimension(function(d) {
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
            } else {
                world_map_object.removePreviousFlowLines();
                world_map_object.removeDevelopmentInformation();
                world_map_object.displayIncomeLevels();
                world_map_object.selected_map_type = map_types[2];
            }
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
    var enable = world_map_object.selected_map_type.localeCompare(map_types[0]) == 0;
    var gender_cbs = document.getElementsByName('gender_cb');
    var flow_cbs = document.getElementsByName('flow_cb');
    var normalize_cbs = document.getElementsByName('normalize_cb');

    if (enable) {
        // world map migration flow - enalbe filters
        for (var i = 0; i < gender_cbs.length; i++) {
            gender_cbs[i].disabled = false;
        }
        for (var i = 0; i < flow_cbs.length; i++) {
            flow_cbs[i].disabled = false;
        }
        for (var i = 0; i < normalize_cbs.length; i++) {
            normalize_cbs[i].disabled = false;
        }
        world_map_object.world_map_slider.trackInset.classed('disabled', false);
        world_map_object.world_map_slider.handle.classed('disabled', false);
    } else {
        // not world map migration flow (e.g. development levels or income levels) - disalbe filters
        for (var i = 0; i < gender_cbs.length; i++) {
            gender_cbs[i].disabled = true;
        }
        for (var i = 0; i < flow_cbs.length; i++) {
            flow_cbs[i].disabled = true;
        }
        for (var i = 0; i < normalize_cbs.length; i++) {
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
    world_map.world_map_slider = new Slider("world_map_slider", [d3.min(world_map.all_years), d3.max(world_map.all_years)], 5, world_map);
    setupWorldMapSelectionControls(world_map);
    onCountryHover(world_map);
} // end of function `ready`

whenDocumentLoaded(() => {
    // import world atlas topojson
    d3version4.queue()
        .defer(d3version4.json, world_json_path)
        // .defer(d3version4.json, prefix + "data/world_50m.json") // this map makes Australia's centroid to be in the Indian ocean...
        // .defer(d3version4.json, "https://unpkg.com/world-atlas@1.1.4/world/50m.json")
        // .defer(d3version4.json, "https://raw.githubusercontent.com/andybarefoot/andybarefoot-www/master/maps/mapdata/custom50.json")
        .defer(d3version4.json, country_codes_and_names_path)
        .defer(d3version4.csv, migflow_gender_path)
        .defer(d3version4.csv, pop_path)
        // .defer(d3version4.csv, "./data/migflows_gender_separated_1990_2015_filtered.csv")
        .defer(d3version4.csv, dev_level_path)
        .await(this.world_map_ready);
});
