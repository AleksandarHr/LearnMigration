// const prefix = "../LearnMigration/"
// const prefix = "../";
const csv_stock_col = "InternationalMigrantStocks"

class MigrationStockChart {

    constructor(element_id, stock_data, chosen_country, chosen_year) {

        // set svg's height and with
        this.width = 500;
        this.bar_height = 20;
        this.height = 15 * this.bar_height; // # age groups * 20
        this.chosen_country = chosen_country;
        this.chosen_year = chosen_year;
        this.stock_data = stock_data;
        this.element_id = element_id
        // set margins
        this.margin = {
            top: 20,
            left: 20,
            right: 20,
            bottom: 20
        };

        this.labelArea = 80;
        this.rightOffset = this.width + this.labelArea;

        this.SVG_HEIGHT = this.height + this.margin.top + this.margin.bottom;
        this.SVG_WIDTH = 2 * this.width + this.labelArea + this.margin.left + this.margin.right;

        this.prepareData();

        var me = this;
        this.chart = d3.select('#' + this.element_id)
            .append('svg')
            .attr('class', 'chart')
            .attr("viewBox", `0 0 ${this.SVG_WIDTH} ${this.SVG_HEIGHT}`)

        this.y = d3.scale.ordinal()
            .domain(this.age_groups)
            .rangeBands([0, me.height]);

        this.yPosByIndex = function(d, index) {
            return me.y.range()[index];
        }

        this.renderChart(this);

    }

    setYear(selected_year) {
        this.chosen_year = selected_year
        this.prepareData();
        this.renderChart(this);
    }

    setCountry(selected_country) {
        this.chosen_country = selected_country
        console.log("HERE 1");
        this.prepareData();
        this.renderChart(this);
    }

    prepareData() {
        this.male_stock_data = this.stock_data.filter(d => d.Gender.localeCompare("male") == 0 &
            d.Destination.localeCompare(this.chosen_country) == 0 & d.Year == this.chosen_year);
        this.female_stock_data = this.stock_data.filter(d => d.Gender.localeCompare("female") == 0 &
            d.Destination.localeCompare(this.chosen_country) == 0 & d.Year == this.chosen_year);

        this.age_groups = this.male_stock_data.map(d => d.AgeGroup);
        this.male_stock_numbers = this.male_stock_data.map(d => parseInt(d.InternationalMigrantStocks));
        this.female_stock_numbers = this.female_stock_data.map(d => parseInt(d.InternationalMigrantStocks));

        this.chart_data = d3.range(15).map(i => {
            return {
                age_gr: this.age_groups[i],
                male: this.male_stock_numbers[i],
                female: this.female_stock_numbers[i]
            };
        });

    }

    renderChart(self) {
        var me = self;
        var bars_male = this.chart.selectAll(".rect.male").data(me.male_stock_numbers);
        var bars_female = this.chart.selectAll(".rect.female").data(me.female_stock_numbers);
        var numbers_male = this.chart.selectAll("text.leftscore").data(me.male_stock_numbers)
        var numbers_female = this.chart.selectAll("text.score").data(me.female_stock_numbers)

        var bar_male_exit = bars_male.exit().remove();
        var bar_female_exit = bars_female.exit().remove();
        var numbers_male_exit = numbers_male.exit().remove();
        var numbers_female_exit = numbers_female.exit().remove();


        var xLeft = d3version4.scaleLinear()
            .domain([0, d3.max(this.male_stock_numbers)])
            .range([0, me.width]);

        console.log(this.male_stock_numbers)
        console.log(d3.max(this.male_stock_numbers))
        console.log(xLeft(d3.max(this.male_stock_numbers)))

        var xRight = d3version4.scaleLinear()
            .domain([0, d3.max(this.female_stock_numbers)])
            .range([0, me.width]);

        var bar_male_enter = bars_male.enter()
            .append("rect")
            .attr("x", function(d) {
                return me.width - xLeft(d);
            })
            .attr("y", me.yPosByIndex)
            .attr("class", "male")
            .attr("width", xLeft)
            .attr("height", me.y.rangeBand());

        this.chart.selectAll("text.leftscore")
            .data(this.male_stock_numbers)
            .enter().append("text")
            .attr("x", function(d) {
                return me.width - xLeft(d);
            })
            .attr("y", function(d, z) {
                return me.yPosByIndex(d, z) + me.y.rangeBand() / 2;
            })
            .attr("dx", "20")
            .attr("dy", ".36em")
            .attr("text-anchor", "end")
            .attr('class', 'leftscore')
            .text(String);

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

        var bar_female_enter = bars_female.enter()
            .append("rect")
            .attr("x", me.rightOffset)
            .attr("y", me.yPosByIndex)
            .attr("class", "female")
            .attr("width", xRight)
            .attr("height", me.y.rangeBand());

        this.chart.selectAll("text.score")
            .data(this.female_stock_numbers)
            .enter().append("text")
            .attr("x", function(d) {
                return xRight(d) + me.rightOffset;
            })
            .attr("y", function(d, z) {
                return me.yPosByIndex(d, z) + me.y.rangeBand() / 2;
            })
            .attr("dx", -5)
            .attr("dy", ".36em")
            .attr("text-anchor", "end")
            .attr('class', 'score')
            .text(String);

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


function ready(error, stock_data) {
    if (error) {
        console.log("Error loading data: " + error);
        throw error;
    }
    var default_year = 1990
    var default_country = "Cuba"
    var migrationStockChart = new MigrationStockChart("migration_stock_chart", stock_data, default_country, default_year);
    selectParameters(stock_data, migrationStockChart);
}

function selectParameters(stock_data, chart_object) {

    const all_countries = Array.from([...new Set(stock_data.map(x => x.Destination))]).sort();
    var countries_data = []
    for (i = 0; i < all_countries.length; i++) {
        countries_data.push({
            country: all_countries[i]
        })
    }

    let countrySelect = dc.selectMenu('#countries_bar_chart');
    var ndx = crossfilter(countries_data);
    var countryDimension = ndx.dimension(function(d) {
        return d.country
    });

    countrySelect
        .dimension(countryDimension)
        .group(countryDimension.group())
        .multiple(false)
        .numberVisible(null)
        .promptText('All Countries')
        .promptValue(null);

    countrySelect.on('pretransition', function(chart) {
        // add styling to select input
        d3.select('#routes').classed('dc-chart', false);
        // use Bootstrap styling
        chart.select('select').classed('form-control', true);
    });


    const all_years = Array.from([...new Set(stock_data.map(x => x.Year))]).sort();
    var years_data = []
    for (i = 0; i < all_years.length; i++) {
        years_data.push({
            country: all_years[i]
        })
    }

    let yearSelect = dc.selectMenu('#years_bar_chart');
    var ndx = crossfilter(years_data);
    var yearDimension = ndx.dimension(function(d) {
        return d.country
    });

    yearSelect
        .dimension(yearDimension)
        .group(yearDimension.group())
        .multiple(false)
        .numberVisible(null)
        .promptText('Year')
        .promptValue(null);

    // add styling to select input
    yearSelect.on('pretransition', function(chart) {
        d3.select('#routes').classed('dc-chart', false);
        // use Bootstrap styling
        chart.select('select').classed('form-control', true);
    });

    dc.renderAll();

    countrySelect.on('filtered', function(chart, filter) {
        if (filter != null) {
            // show data for selected country only
            chart_object.setCountry(filter);
        } else {
            // show all countries
        }
    });

    yearSelect.on('filtered', function(chart, filter) {
        if (filter != null) {
            // show data for selected year only
            chart_object.setYear(filter);
        } else {
            // show all years
        }
    });
}


whenDocumentLoaded(() => {
    d3.queue()
        .defer(d3.csv, prefix + "csv/International_and_totalStock_GenderAge.csv")
        .await(this.ready);
});
