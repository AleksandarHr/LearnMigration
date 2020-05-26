class MigrationStockChart {

    constructor(element_id, stock_data) {

        this.element_id = element_id
        // set svg's height and with
        this.width = 500;
        this.bar_height = 20;

        this.margin = {
            top: 20,
            left: 20,
            right: 20,
            bottom: 20
        };
        this.labelArea = 80;
        this.rightOffset = this.width + this.labelArea;


        // filter stock data into male/female
        this.stock_data = stock_data;
        this.male_stock_data_all = this.stock_data.filter(d => d.Gender.localeCompare("male") == 0)
        this.female_stock_data_all = this.stock_data.filter(d => d.Gender.localeCompare("female") == 0)

        // a set of all available destination countries and years
        this.all_countries = Array.from([...new Set(this.stock_data.map(x => x.Destination))]).sort();
        this.all_years = Array.from([...new Set(this.stock_data.map(x => x.Year))]).sort();
        this.age_groups = Array.from([...new Set(this.male_stock_data_all.map(d => d.AgeGroup))]);

        this.height = 15 * this.bar_height + 30; // # age groups * 20
        this.SVG_HEIGHT = this.height + this.margin.top + this.margin.bottom + 50;
        this.SVG_WIDTH = 2 * this.width + this.labelArea + this.margin.left + this.margin.right + 60;

        // Initialize the object with default country and year
        this.chosen_country = this.all_countries[0];
        this.chosen_year = this.all_years[0];

        // prepare data relevant to current selection
        this.prepareSelectedData();

        // create chart d3 element
        var me = this;
        var migration_chart_svg = d3.select('#' + this.element_id)
            .append('svg')
            .attr('class', 'chart')
            .attr("viewBox", `-30 0 ${this.SVG_WIDTH} ${this.SVG_HEIGHT}`)

        this.chart = migration_chart_svg.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        // set some y-scaling objects
        this.y = d3.scale.ordinal()
            .domain(this.age_groups)
            .rangeBands([30, me.height]);

        this.yPosByIndex = function(d, index) {
            return me.y.range()[index];
        }

        // draw the relevant selection data
        this.renderChart(this);
    }

    // Setter for year selection
    updateSelectedYear(selected_year) {
        this.chosen_year = selected_year
        this.prepareSelectedData();
        this.renderChart(this);
    }

    // Setter for country selection
    setCountry(selected_country) {
        this.chosen_country = selected_country
        this.prepareSelectedData();
        this.renderChart(this);
    }

    /*
      Prepares data to be visualized based on year and country selection
    */
    prepareSelectedData() {
        // Male data for all age ranges for the selected year and country
        this.male_stock_data = this.male_stock_data_all.filter(d =>
            d.Destination.localeCompare(this.chosen_country) == 0 &
            d.Year == this.chosen_year);

        // Female data for all age ranges for the selected year and country
        this.female_stock_data = this.female_stock_data_all.filter(d =>
            d.Destination.localeCompare(this.chosen_country) == 0 &
            d.Year == this.chosen_year);

        // Actual counts of male and female migrant stock
        this.male_stock_numbers = this.male_stock_data.map(d => parseInt(d.InternationalMigrantStocks));
        this.female_stock_numbers = this.female_stock_data.map(d => parseInt(d.InternationalMigrantStocks));

        // Tuples of data used for drawing the chart (age_group, male count, female count)
        this.chart_data = d3.range(this.age_groups.length).map(i => {
            return {
                age_gr: this.age_groups[i],
                male: this.male_stock_numbers[i],
                female: this.female_stock_numbers[i]
            };
        });
    }


    /*
      The main function which renders the chart on screen
    */
    renderChart(self) {
        var me = self;
        // Update d3 elements with new data
        var bars_male = this.chart.selectAll(".rect.male").data(me.male_stock_numbers);
        var bars_female = this.chart.selectAll(".rect.female").data(me.female_stock_numbers);
        var numbers_male = this.chart.selectAll(".text.leftscore").data(me.male_stock_numbers);
        var numbers_female = this.chart.selectAll(".text.score").data(me.female_stock_numbers);

        // Remove old chart
        this.chart.selectAll("*").remove();

        // Define horizontal linear scale for left part of the chart
        var xLeft = d3version4.scaleLinear()
            .domain([0, d3.max(this.male_stock_numbers)])
            .range([0, me.width]);

        // Define horizontal linear scale for right part of the chart
        var xRight = d3version4.scaleLinear()
            .domain([0, d3.max(this.female_stock_numbers)])
            .range([0, me.width]);

        // Draw bars for male migrant stock data
        bars_male.enter()
            .append("rect")
            .attr("x", function(d) {
                return me.width - xLeft(d);
            })
            .attr("y", me.yPosByIndex)
            .attr("class", "male")
            .attr("id", function(d, idx) {
                return idx;
            })
            .attr("width", xLeft)
            .attr("height", me.y.rangeBand());
        // bars_male.exit().remove();

        // Draw numbers for male migrant stock data
        numbers_male.enter()
            .append("text")
            .attr("x", function(d) {
                return me.width - xLeft(d) - 22;
            })
            .attr("y", function(d, z) {
                return me.yPosByIndex(d, z) + me.y.rangeBand() / 2;
            })
            .attr("dx", "20")
            .attr("dy", ".36em")
            .attr("text-anchor", "end")
            .attr('class', 'leftscore')
            .style('fill', 'black')
            .text(String);
        // numbers_male.exit().remove();

        // Draw the age groups column in the middle
        this.chart.selectAll("text.name")
            .data(this.age_groups)
            .enter().append("text")
            .attr("x", (this.labelArea / 2) + me.width)
            .attr("y", function(d, index) {
                return me.y(d) + me.y.rangeBand() / 2;
            })
            .attr("dy", ".20em")
            .attr("text-anchor", "middle")
            .attr('class', 'name')
            .text(String);

        // Draw bars for female migrant stock data
        bars_female.enter()
            .append("rect")
            .attr("x", me.rightOffset)
            .attr("y", me.yPosByIndex)
            .attr("class", "female")
            .attr("id", function(d, idx) {
                return idx;
            })
            .attr("width", xRight)
            .attr("height", me.y.rangeBand());
        // bars_female.exit().remove();

        // Draw numbers for female migrant stock data
        numbers_female.enter()
            .append("text")
            .attr("x", function(d) {
                return xRight(d) + me.rightOffset + 7;
            })
            .attr("y", function(d, z) {
                return me.yPosByIndex(d, z) + me.y.rangeBand() / 2;
            })
            .attr("dx", -5)
            .attr("dy", ".36em")
            .attr("text-anchor", "start")
            .attr('class', 'score')
            .style('fill', 'black')
            .text(String);
        // numbers_female.exit().remove();

        // Draw column titles
        this.chart.append('text')
            .attr('class', 'title')
            .attr('x', me.width / 2)
            .attr('y', 10)
            .style('fill', 'black')
            .attr('text-anchor', 'start')
            .text('Male');

        this.chart.append('text')
            .attr('class', 'title')
            .attr('x', (this.labelArea / 2) + 3 / 2 * me.width)
            .attr('y', 10)
            .style('fill', 'black')
            .attr('text-anchor', 'start')
            .text('Female');

        this.chart.append('text')
            .attr('class', 'title')
            .attr('x', (this.labelArea / 2) + me.width)
            .attr('y', 10)
            .style('fill', 'black')
            .attr('text-anchor', 'middle')
            .text("Age Group");
    }
}

/*
  A function to handle user menu selections (e.g. destination country and year)
*/
function setupBarChartSelectionControls(chart_object) {

    // Creating data for Select Destination Country menu
    var countries_data = []
    for (i = 0; i < chart_object.all_countries.length; i++) {
        countries_data.push({
            country: chart_object.all_countries[i],
        })
    }

    // Setting up the dropdown menu for Destination Country selection
    let countrySelect = dc.selectMenu('#countries_bar_chart');
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
        d3.select('#routes').classed('dc-chart', false);
        // use Bootstrap styling
        chart.select('select').classed('form-control', true);
    });

    // Set default selected country
    countrySelect.filter(chart_object.chosen_country)

    // Creating data for Select Year menu
    // var years_data = []
    // for (i = 0; i < chart_object.all_years.length; i++) {
    //     years_data.push({
    //         country: chart_object.all_years[i]
    //     })
    // }

    // Setting up the dropdown menu for Year selection
    // let yearSelect = dc.selectMenu('#years_bar_chart');
    // var ndx = crossfilter(years_data);
    // var yearDimension = ndx.dimension(function(d) {
    //     return d.country
    // });
    //
    // yearSelect
    //     .dimension(yearDimension)
    //     .group(yearDimension.group())
    //     .multiple(false)
    //     .numberVisible(null)
    //     .title(function(d) {
    //         return d.key;
    //     })
    //     .promptText('Year')
    //     .promptValue(null);

    // Add styling to the dropdown menu
    // yearSelect.on('pretransition', function(chart) {
    //     d3.select('#routes').classed('dc-chart', false);
    //     // use Bootstrap styling
    //     chart.select('select').classed('form-control', true);
    // });
    // yearSelect.filter(chart_object.chosen_year)

    // Add functionality on country selection
    countrySelect.on('filtered', function(chart, filter) {
        if (filter != null) {
            // if a country was selected, show data for selected country only
            chart_object.setCountry(filter);
        } else {
            // otherwise, show the last selected country
            chart_object.setCountry(chart_object.chosen_country);
            countrySelect.filter(chart_object.chosen_country);
        }
    });

    // yearSelect.on('filtered', function(chart, filter) {
    //     if (filter != null) {
    //         // if an year was selected, show data for selected year only
    //         chart_object.updateSelectedYear(filter);
    //     } else {
    //         // otherwise, show the last selected year
    //         chart_object.updateSelectedYear(chart_object.chosen_year);
    //         yearSelect.filter(chart_object.chosen_year)
    //     }
    // });

    // Render the two dropdown menus
    dc.renderAll();
}

var formatNumber = d3.format(",.0f"), // zero decimal places
    format = function(d) {
        return formatNumber(d) + " " + units;
    };

/*
  A function to define the hover functionality of the barchart - a pop-up dialogue
    with comparative information about the hovered gender/age-group pair for the selected
    country and selected year with the previous year.
*/
function onBarChartHover(chart_object) {
    document.body.addEventListener('mousemove', function(e) {
        // If the mouse hovers over a rect (but not bar) object classed as 'male' or 'female',
        //    it must be one of the chart's bars
        if (e.target.nodeName == 'rect' && e.target.className.animVal != 'bar' &&
            (e.target.className.baseVal == 'male' || e.target.className.baseVal == 'female')) {

            let hovered_year = chart_object.chosen_year
            if (hovered_year == 1990) {
                // if the selected year is 1990, there is no previous year's data to compare with
                //    display "No Information"
                showBarChartDetail(e, false, null, null);
            } else {
                // If there is previous year's data
                let previous_year_index = chart_object.all_years.indexOf(hovered_year) - 1;
                if (previous_year_index < 0) {
                    showBarChartDetail(e, false, null, null);
                } else {
                    // Gather relevant data - e.g. previous year, hovered age group, hovered country
                    let previous_year = chart_object.all_years[previous_year_index]
                    let hovered_age_group = (chart_object.age_groups[e.target.id])
                    let hovered_country = chart_object.chosen_country
                    let previous_count = 0;
                    let relevant_data = [];
                    if (e.target.className.baseVal == 'male') {
                        // If the user hovered a male bar, get the relevant count
                        relevant_data = chart_object.male_stock_data_all.filter(d =>
                            d.Destination.localeCompare(hovered_country) == 0 &
                            d.Year == previous_year &
                            d.AgeGroup.localeCompare(hovered_age_group) == 0);

                        if (relevant_data.length != 1) {
                            // We only expect one data point, if more - something wrong happened
                            //    show "No Information"
                            showBarChartDetail(e, false, null, null);
                        } else {
                            // Get the respective count from previous year
                            previous_count = formatNumber(relevant_data[0].InternationalMigrantStocks)
                        }
                    } else if (e.target.className.baseVal == 'female') {
                        // If the user hovered a феmale bar, get the relevant count
                        relevant_data = chart_object.female_stock_data_all.filter(d =>
                            d.Destination.localeCompare(hovered_country) == 0 &
                            d.Year == previous_year &
                            d.AgeGroup.localeCompare(hovered_age_group) == 0);

                        if (relevant_data.length != 1) {
                            // We only expect one data point, if more - something wrong happened
                            //    show "No Information"
                            showBarChartDetail(e, false, null, null);
                        } else {
                            // Get the respective count from previous year
                            previous_count = formatNumber(relevant_data[0].InternationalMigrantStocks)
                        }
                    }

                    // Get the current count of the hovered bar
                    let hovered_count = formatNumber(d3.select(e.target).data()[0]);

                    // Display the actual pop-up dialogue
                    showBarChartDetail(e, true, hovered_count, previous_count);
                }
            }
        }
    });

    // Hide the pop-up once the mouse leaves the area of the bar
    document.body.addEventListener('mouseout', function(e) {
        if (e.target.nodeName == 'rect') hideDetail();
    });
}

/*
  A function to display relevant information in the dialogue pop-up on hover
*/
function showBarChartDetail(e, prior_information, current_count, previous_count) {
    var content = "";
    if (!prior_information) {
        // No prior count data
        content = "<b>" + "No Previous Count Data" + "</b><br/>";
    } else {
        // Display previous and current count data
        content = "<b>" + "Last Count Data: " + previous_count + "</b><br/>";
        content += "<b>" + "Current Count Data: " + current_count + "</b><br/>";
    }

    // Render the pop-up dialogue with relevant information
    renderPopUpDetailDialogue(e, content);
}

function whenDocumentLoaded(action) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", action);
    } else {
        // `DOMContentLoaded` already fired
        action();
    };
}

whenDocumentLoaded(() => {
    d3.queue()
        .defer(d3.csv, gender_age_stock_path)
        .await(this.bar_chart_ready);
});

function bar_chart_ready(error, stock_data) {
    if (error) {
        console.log("Error loading data: " + error);
        throw error;
    }

    // Create a bar chart
    var migration_stock_chart = new MigrationStockChart("migration_stock_chart", stock_data);
    migration_chart_slider = new Slider("migration_stock_slider", [1990, 2020], 5, migration_stock_chart);
    // Setup selection controls (e.g. dropdown select menus)
    setupBarChartSelectionControls(migration_stock_chart);
    // Bind hover functionality for the bar chart
    onBarChartHover(migration_stock_chart)
}
