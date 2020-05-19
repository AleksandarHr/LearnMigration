// const prefix = "../LearnMigration/"
// const prefix = "../";
const csv_stock_col = "InternationalMigrantStocks"

class MigrationStockChart {

    constructor(element_id, stock_data, chosen_country, chosen_year) {
        // set svg's height and with
        this.width = 800;
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

        this.chart_data = d3.range(16).map(i => {
            return {
                age_gr: this.age_groups[i],
                male: this.male_stock_numbers[i],
                female: this.female_stock_numbers[i]
            };
        });

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

        // var chart = d3.select("#" + element_id)
        //     .append('svg')
        //     .attr('class', 'chart')
        //     .attr('width', this.width + this.width)
        //     .attr('height', this.height);
        //
        // var x = d3.scaleLinear()
        //     .domain([0, d3.max([
        //         d3.max(this.chart_data, function(d) {
        //             return d.female;
        //         }),
        //         d3.max(this.chart_data, function(d) {
        //             return d.male;
        //         })
        //     ])])
        //     .rangeRound([0, this.width / 2]);
        //
        // var y = d3.scaleBand()
        //     .domain(this.chart_data.map(function(d) {
        //         return d.grade;
        //     }))
        //     .rangeRound([0, this.height]);

        x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.value))
            .rangeRound([margin.left, width - margin.right])

        y = d3.scaleBand()
            .domain(d3.range(data.length))
            .rangeRound([margin.top, height - margin.bottom])
            .padding(0.1)
        xAxis = g => g
            .attr("transform", `translate(0,${margin.top})`)
            .call(d3.axisTop(x).ticks(width / 80).tickFormat(tickFormat))
            .call(g => g.select(".domain").remove())

        yAxis = g => g
            .attr("transform", `translate(${x(0)},0)`)
            .call(d3.axisLeft(y).tickFormat(i => data[i].name).tickSize(0).tickPadding(6))
            .call(g => g.selectAll(".tick text").filter(i => data[i].value < 0)
                .attr("text-anchor", "start")
                .attr("x", 6))

        const svg = d3.create("svg")
            .attr("viewBox", [0, 0, width, height]);

        svg.append("g")
            .selectAll("rect")
            .data(data)
            .join("rect")
            .attr("fill", d => d3.schemeSet1[d.value > 0 ? 1 : 0])
            .attr("x", d => x(Math.min(d.value, 0)))
            .attr("y", (d, i) => y(i))
            .attr("width", d => Math.abs(x(d.value) - x(0)))
            .attr("height", y.bandwidth());

        svg.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .selectAll("text")
            .data(data)
            .join("text")
            .attr("text-anchor", d => d.value < 0 ? "end" : "start")
            .attr("x", d => x(d.value) + Math.sign(d.value - 0) * 4)
            .attr("y", (d, i) => y(i) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => format(d.value));

        svg.append("g")
            .call(xAxis);

        svg.append("g")
            .call(yAxis);

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
    var generateChartButton = document.getElementById("generate_chart_button");
    generateChartButton.addEventListener('click', function() {
        var chosen_country = "Austria";
        var chosen_year = 2010;
        migrationStockChart = new MigrationStockChart("migration_stock_chart", stock_data, chosen_country, chosen_year);
    });
}

whenDocumentLoaded(() => {
    d3.queue()
        .defer(d3.csv, prefix + "csv/International_and_totalStock_GenderAge.csv")
        .await(this.ready);
});
