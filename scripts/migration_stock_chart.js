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
        this.male_stock_data = stock_data.filter(d => d.Gender.localeCompare("male") == 0 &
            d.Destination.localeCompare(this.chosen_country) == 0 & d.Year == this.chosen_year);
        this.female_stock_data = stock_data.filter(d => d.Gender.localeCompare("female") == 0 &
            d.Destination.localeCompare(this.chosen_country) == 0 & d.Year == this.chosen_year);

        this.age_groups = this.male_stock_data.map(d => d.AgeGroup);
        this.male_stock_numbers = this.male_stock_data.map(d => d.InternationalMigrantStocks);
        this.female_stock_numbers = this.female_stock_data.map(d => d.InternationalMigrantStocks);

        this.chart_data = d3.range(15).map(i => {
            return {
                age_gr: this.age_groups[i],
                male: this.male_stock_numbers[i],
                female: this.female_stock_numbers[i]
            };
        });

        // set margins
        this.margin = {
            top: 20,
            left: 20,
            right: 20,
            bottom: 20
        };

        var labelArea = 80;
        // set actual height and width (remove margins)
        this.SVG_HEIGHT = this.height + this.margin.top + this.margin.bottom;
        this.SVG_WIDTH = 2 * this.width + labelArea + this.margin.left + this.margin.right;

        var rightOffset = this.width + labelArea;
        var chart = d3.select('#' + element_id)
            .append('svg')
            .attr('class', 'chart')
            .attr("viewBox", `0 0 ${this.SVG_WIDTH} ${this.SVG_HEIGHT}`)

        var me = this;
        var xLeft = d3.scale.linear()
            .domain([0, d3.max(this.male_stock_numbers)])
            .range([0, me.width]);

        var y = d3.scale.ordinal()
            .domain(this.age_groups)
            .rangeBands([0, me.height]);

        var yPosByIndex = function(d, index) {
            return y.range()[index];
        }

        chart.selectAll("rect.male")
            .data(this.male_stock_numbers)
            .enter().append("rect")
            .attr("x", function(d) {
                return me.width - xLeft(d) - 15;
            })
            .attr("y", yPosByIndex)
            .attr("class", "male")
            .attr("width", xLeft)
            .attr("height", y.rangeBand());

        chart.selectAll("text.leftscore")
            .data(this.male_stock_numbers)
            .enter().append("text")
            .attr("x", function(d) {
                return me.width - xLeft(d);
            })
            .attr("y", function(d, z) {
                return yPosByIndex(d, z) + y.rangeBand() / 2;
            })
            .attr("dx", "20")
            .attr("dy", ".36em")
            .attr("text-anchor", "end")
            .attr('class', 'leftscore')
            .text(String);

        chart.selectAll("text.name")
            .data(this.age_groups)
            .enter().append("text")
            .attr("x", (labelArea / 2) + me.width)
            .attr("y", function(d, index) {
                return y(d) + y.rangeBand() / 2;
            })
            .attr("dy", ".20em")
            .attr("text-anchor", "middle")
            .attr('class', 'name')
            .text(String);

        var xRight = d3.scale.linear()
            .domain([0, d3.max(this.female_stock_numbers)])
            .range([0, me.width]);

        chart.selectAll("rect.female")
            .data(this.female_stock_numbers)
            .enter().append("rect")
            .attr("x", rightOffset)
            .attr("y", yPosByIndex)
            .attr("class", "female")
            .attr("width", xRight)
            .attr("height", y.rangeBand());

        chart.selectAll("text.score")
            .data(this.female_stock_numbers)
            .enter().append("text")
            .attr("x", function(d) {
                return xRight(d) + rightOffset;
            })
            .attr("y", function(d, z) {
                return yPosByIndex(d, z) + y.rangeBand() / 2;
            })
            .attr("dx", -5)
            .attr("dy", ".36em")
            .attr("text-anchor", "end")
            .attr('class', 'score')
            .text(String);
    }

    setYear(selected_year) {
      this.chosen_year = selected_year
    }

    setCountry(selected_country){
      this.chosen_country = selected_country
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
    var default_country = "Austria"
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

    dc.renderAll();

    countrySelect.on('filtered', function(chart, filter) {
        if (filter != null) {
          // show selected country
          console.log(filter)
          // chart_object.setCountry(filter);
        }
        else {
          // show all countries
        }
    });
}


whenDocumentLoaded(() => {
    d3.queue()
        .defer(d3.csv, prefix + "csv/International_and_totalStock_GenderAge.csv")
        .await(this.ready);
});
