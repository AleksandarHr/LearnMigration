// const prefix = "../LearnMigration/"
// const prefix = "../";
const csv_stock_col = "InternationalMigrantStocks"

class MigrationStockChart {

    constructor(element_id, stock_data, chosen_country, chosen_year) {

        // set svg's height and with
        this.width = 400;
        this.bar_height = 20;
        this.height = 16 * 20; // # age groups * 20
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
        console.log(this.chart_data)

        // set margins
        this.margin = {
            top: 50,
            left: 50,
            right: 50,
            bottom: 50
        };

        // set actual height and width (remove margins)
        this.SVG_HEIGHT = this.height + this.margin.top + this.margin.bottom;
        this.SVG_WIDTH = this.width + this.margin.left + this.margin.right;

        var chart = d3.select('#' + element_id)

        var labelArea = 160;

        // var chart,
        //     width = 400,
        //     bar_height = 20,
        //     height = bar_height * (names.length);

        var rightOffset = this.width + labelArea;

        var chart = d3.select('#' + element_id)
            .append('svg')
            .attr('class', 'chart')
            .attr('width', labelArea + this.width + this.width)
            .attr('height', this.height);

        var xFrom = d3.scale.linear()
            .domain([0, d3.max(this.male_stock_numbers)])
            .range([0, this.width]);

        var y = d3.scale.ordinal()
            .domain(this.age_groups)
            .rangeBands([10, this.height]);

        var yPosByIndex = function(d, index) {
            return y.range()[index];
        }

        chart.selectAll("rect.left")
            .data(this.male_stock_numbers)
            .enter().append("rect")
            .attr("x", function(pos) {
                return this.width - xFrom(pos);
            })
            .attr("y", yPosByIndex)
            .attr("class", "left")
            .attr("width", xFrom)
            .attr("height", y.rangeBand());

        chart.selectAll("text.leftscore")
            .data(this.male_stock_numbers)
            .enter().append("text")
            .attr("x", function(d) {
                return this.width - xFrom(d);
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
            .attr("x", (labelArea / 2) + this.width)
            .attr("y", function(d) {
                return y(d) + y.rangeBand() / 2;
            })
            .attr("dy", ".20em")
            .attr("text-anchor", "middle")
            .attr('class', 'name')
            .text(String);

        var xTo = d3.scale.linear()
            .domain([0, d3.max(this.female_stock_numbers)])
            .range([0, this.width]);

        chart.selectAll("rect.right")
            .data(this.female_stock_numbers)
            .enter().append("rect")
            .attr("x", rightOffset)
            .attr("y", yPosByIndex)
            .attr("class", "right")
            .attr("width", xTo)
            .attr("height", y.rangeBand());

        chart.selectAll("text.score")
            .data(this.female_stock_numbers)
            .enter().append("text")
            .attr("x", function(d) {
                return xTo(d) + rightOffset;
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
    // this.prep();
    var generateChartButton = document.getElementById("generate_chart_button");
    generateChartButton.addEventListener('click', function() {
        var chosen_country = "Austria";
        var chosen_year = 2010;
        migrationStockChart = new MigrationStockChart("migration_stock_chart", stock_data, chosen_country, chosen_year);
    });
}

// function prep() {
//   // dc.js chart types
//   let countrySelect = dc.selectMenu('#countries_bar_chart');
//   let yearBarChartSelect = dc.selectMenu('#years_bar_chart');
//
//   countrySelect.on('pretransition', function(chart) {
//       // add styling to select input
//       d3.select('#countries_bar_chart').classed('dc-chart', false);
//       // use Bootstrap styling
//       chart.select('select').classed('form-control', true);
//   });
//
//   countrySelect.on('filtered', function(chart, filter) {
//       if (filter != null && steps.length < 4) {
//           steps.push({ "name": "location", "label": "Location" });
//           p = 0.85;
//       }
//       else if (filter == null) {
//           steps.pop();
//           p = 0.75;
//       }
//       let datum = transformToGraph(routeDim.top(Infinity));
//       renderSankey(datum);
//       bindHover();
//       renderLabels();
//   });
// }


whenDocumentLoaded(() => {
    d3.queue()
        .defer(d3.csv, prefix + "csv/International_and_totalStock_GenderAge.csv")
        .await(this.ready);
});
