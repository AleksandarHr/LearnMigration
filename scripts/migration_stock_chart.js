// const prefix = "../LearnMigration/"
// const prefix = "../";
const csv_stock_col = "InternationalMigrantStocks"

class MigrationStockChart {

    constructor(element_id, stock_data, chosen_country, chosen_year) {

        // set svg's height and with
        this.width = 500;
        this.bar_height = 20;
        this.height = 15 * this.bar_height + 30; // # age groups * 20
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

        this.SVG_HEIGHT = this.height + this.margin.top + this.margin.bottom + 50;
        this.SVG_WIDTH = 2 * this.width + this.labelArea + this.margin.left + this.margin.right + 60;

        this.prepareSelectedData();

        var me = this;
        var migration_chart_svg = d3.select('#' + this.element_id)
            .append('svg')
            .attr('class', 'chart')
            .attr("viewBox", `-30 0 ${this.SVG_WIDTH} ${this.SVG_HEIGHT}`)

        this.chart = migration_chart_svg.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.y = d3.scale.ordinal()
            .domain(this.age_groups)
            .rangeBands([30, me.height]);

        this.yPosByIndex = function(d, index) {
            return me.y.range()[index];
        }

        this.renderChart(this);

    }

    setYear(selected_year) {
        this.chosen_year = selected_year
        this.prepareSelectedData();
        this.renderChart(this);
    }

    setCountry(selected_country) {
        this.chosen_country = selected_country
        this.prepareSelectedData();
        this.renderChart(this);
    }

    prepareSelectedData() {
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

    prepareTotalData() {
      this.male_stock_data_all = this.stock_data.filter(d => d.Gender.localeCompare("male"))
      this.female_stock_data_all = this.stock_data.filter(d => d.Gender.localeCompare("female"))
      this.age_groups = this.male_stock_data.map(d => d.AgeGroup);

      var male_age_group_filtered =[];
      var female_age_group_filtered = [];
      this.age_groups.forEach((age_group, i) => {
        male_age_group_filtered[i] = this.male_stock_data_all.filter(d => d.AgeGroup == age_group)
        console.log(male_age_group_filtered[i]);
        console.log(male_age_group_filtered[i].reduce((a, b) => ({"InternationalMigrantStocks": a.InternationalMigrantStocks + b.InternationalMigrantStocks})));
        female_age_group_filtered[i] = this.female_stock_data_all.filter(d => d.AgeGroup == age_group)
      });

      // this.male_stock_numbers = this.male_stock_data.map(d => parseInt(d.InternationalMigrantStocks));
      // this.female_stock_numbers = this.female_stock_data.map(d => parseInt(d.InternationalMigrantStocks));
      //
      // this.chart_data = d3.range(15).map(i => {
      //     return {
      //         age_gr: this.age_groups[i],
      //         male: this.male_stock_numbers[i],
      //         female: this.female_stock_numbers[i]
      //     };
      // });
    }

    renderChart(self) {
        var me = self;
        var bars_male = this.chart.selectAll(".rect.male").data(me.male_stock_numbers);
        var bars_female = this.chart.selectAll(".rect.female").data(me.female_stock_numbers);
        var numbers_male = this.chart.selectAll(".text.leftscore").data(me.male_stock_numbers)
        var numbers_female = this.chart.selectAll(".text.score").data(me.female_stock_numbers)

        this.chart.selectAll("*").remove();

        var xLeft = d3version4.scaleLinear()
            .domain([0, d3.max(this.male_stock_numbers)])
            .range([0, me.width]);

        var xRight = d3version4.scaleLinear()
            .domain([0, d3.max(this.female_stock_numbers)])
            .range([0, me.width]);

        bars_male.enter()
            .append("rect")
            .attr("x", function(d) {
                return me.width - xLeft(d);
            })
            .attr("y", me.yPosByIndex)
            .attr("class", "male")
            .attr("width", xLeft)
            .attr("height", me.y.rangeBand());
        // bars_male.exit().remove();

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

        bars_female.enter()
            .append("rect")
            .attr("x", me.rightOffset)
            .attr("y", me.yPosByIndex)
            .attr("class", "female")
            .attr("width", xRight)
            .attr("height", me.y.rangeBand());
        // bars_female.exit().remove();

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

        this.chart.append('text')
            .attr('class', 'title')
            .attr('x', me.width / 2)
            .attr('y', 10)
            .style('fill', 'black')
            .attr('text-anchor', 'middle')
            .text('Male');

        this.chart.append('text')
            .attr('class', 'title')
            .attr('x', 3 / 2 * me.width)
            .attr('y', 10)
            .style('fill', 'black')
            .attr('text-anchor', 'middle')
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
    var default_country = "Afghanistan";
    var default_year = 1990;
    var migrationStockChart = new MigrationStockChart("migration_stock_chart", stock_data, default_country, default_year);
    selectParameters(stock_data, migrationStockChart, default_country, default_year);
}

function selectParameters(stock_data, chart_object, default_country, default_year) {

    const all_countries = Array.from([...new Set(stock_data.map(x => x.Destination))]).sort();
    var countries_data = []
    for (i = 0; i < all_countries.length; i++) {
        countries_data.push({
            country: all_countries[i],
            stuff: 10
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
        .title(function(d) {
            return d.key;
        })
        .numberVisible(null)
        .promptText('All Countries')
        .promptValue(null);

    countrySelect.on('pretransition', function(chart) {
        // add styling to select input
        d3.select('#routes').classed('dc-chart', false);
        // use Bootstrap styling
        chart.select('select').classed('form-control', true);
    });
    countrySelect.filter(default_country)

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
        .title(function(d) {
            return d.key;
        })
        .promptText('Year')
        .promptValue(null);

    // add styling to select input
    yearSelect.on('pretransition', function(chart) {
        d3.select('#routes').classed('dc-chart', false);
        // use Bootstrap styling
        chart.select('select').classed('form-control', true);
    });
    yearSelect.filter(default_year)

    countrySelect.on('filtered', function(chart, filter) {
        if (filter != null) {
            // show data for selected country only
            chart_object.setCountry(filter);
        } else {
            // show default country
            chart_object.setCountry(default_country);
            countrySelect.filter(default_country)
        }
        onBarChartHover()
    });

    yearSelect.on('filtered', function(chart, filter) {
        if (filter != null) {
            // show data for selected year only
            chart_object.setYear(filter);
        } else {
            // show default year
            chart_object.setYear(default_year);
            yearSelect.filter(default_year)
        }
        onBarChartHover()
    });

    dc.renderAll();
    onBarChartHover()
}

function onBarChartHover() {
    document.body.addEventListener('mousemove', function(e) {
      if (e.target.nodeName == 'rect' && e.target.className.animVal != 'bar' &&
            (e.target.className.baseVal == 'male' || e.target.className.baseVal == 'female')) {
            let d = d3.select(e.target).data()[0];
            let key = d.name;
            let amount = formatNumber(d.value);
            console.log(e.target.className.baseVal);
            showBarChartDetail();
        }
    });

    document.body.addEventListener('mouseout', function(e) {
        if (e.target.className.animVal == 'link' || e.target.nodeName == 'rect') hideDetail();
    });
}

function showBarChartDetail(){

}


whenDocumentLoaded(() => {
    d3.queue()
        .defer(d3.csv, prefix + "csv/International_and_totalStock_GenderAge.csv")
        .await(this.ready);
});
