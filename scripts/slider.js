class Slider {
    constructor(element_id, range, step, viz_object, width) {
        const margin = {
            left: 20,
            right: 0
        };
		// set it to 60 instead of 40 because years were overlapping with world map
        const height = 60;
        this.range = range;
        this.step = step;
        this.viz_object = viz_object;
        this.SVG_WIDTH = width + margin.left + margin.right;
        this.SVG_HEIGHT = height;

        let svg = d3version4.select('#' + element_id)
            .append('svg')
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${this.SVG_WIDTH} ${this.SVG_HEIGHT}`);

        this.slider = svg.append('g')
            .classed('slider', true)
            .attr('transform', 'translate(' + margin.left + ', ' + (height / 2) + ')');

        // using clamp here to avoid slider exceeding the range limits
        this.xScale = d3version4.scaleLinear()
            .domain(this.range)
            .range([0, width - margin.left - margin.right])
            .clamp(true);

        // array useful for step sliders
        this.rangeValues = d3version4.range(this.range[0], this.range[1], this.step || 1).concat(this.range[1]);
        this.xAxis = d3version4.axisBottom(this.xScale).tickValues(this.rangeValues).tickFormat(function(d) {
            return d;
        });

        const this_slider = this;
        // drag behavior initialization
        let drag = d3version4.drag()
            .on('start.interrupt', function() {
                this_slider.slider.interrupt();
            }).on('start drag', function() {
                if (viz_object.selected_map_type == null ||
                    viz_object.selected_map_type == undefined ||
                    viz_object.selected_map_type.localeCompare(map_types[0]) == 0) {
                    console.log(viz_object.selected_map_type);
                    let selected_year = this_slider.dragged(d3version4.event.x);
                    viz_object.updateSelectedYear(selected_year);
                }
            });

        // this is the main bar with a stroke (applied through CSS)
        const track = this.slider.append('line').attr('class', 'track')
            .attr('x1', this.xScale.range()[0])
            .attr('x2', this.xScale.range()[1]);

        // this is a bar (steelblue) that's inside the main "track" to make it look like a rect with a border
        this.trackInset = d3version4.select(this.slider.node().appendChild(track.node().cloneNode())).attr('class', 'track-inset');

		let ticks_class = null;

		if (element_id == 'world_map_slider') {
			ticks_class = 'ticks_worldmap';
			console.log('reached ticks_worldmap');
		}
		else {
			ticks_class = 'ticks_stock';
			console.log('reached ticks_stock');
		}

		const ticks = this.slider.append('g').attr('class', ticks_class).attr('transform', 'translate(0, 4)')
			.call(this.xAxis);
		// const ticks = this.slider.append('g').attr('class', 'ticks').attr('transform', 'translate(0, 4)')
		// 	.call(this.xAxis);

        // drag handle
        this.handle = this.slider.append('circle').classed('handle', true)
            .attr('r', 8);

        // this is the bar on top of above tracks with stroke = transparent and on which the drag behaviour is actually called
        // try removing above 2 tracks and play around with the CSS for this track overlay, you'll see the difference
        this.trackOverlay = d3version4.select(this.slider.node().appendChild(track.node().cloneNode())).attr('class', 'track-overlay')
            .call(drag);

        if (viz_object.constructor.name.localeCompare("MigrationStockChart") == 0) {
            // initial transition
            this.slider.transition().duration(750)
                .tween("drag", function() {
                    let i = d3version4.interpolate(range[0], viz_object.chosen_year);
                    return function(t) {
                        this_slider.dragged(this_slider.xScale(i(t)));
                    }
                });
        }
    }

    dragged(value) {
        let x = this.xScale.invert(value),
            index = null,
            midPoint, cx, xVal;
        if (this.step) {
            // if step has a value, compute the midpoint based on range values and reposition the slider based on the mouse position
            for (let i = 0; i < this.rangeValues.length - 1; i++) {
                if (x >= this.rangeValues[i] && x <= this.rangeValues[i + 1]) {
                    index = i;
                    break;
                }
            }
            midPoint = (this.rangeValues[index] + this.rangeValues[index + 1]) / 2;
            if (x < midPoint) {
                cx = this.xScale(this.rangeValues[index]);
                xVal = this.rangeValues[index];
            } else {
                cx = this.xScale(this.rangeValues[index + 1]);
                xVal = this.rangeValues[index + 1];
            }
        } else {
            // if step is null or 0, return the drag value as is
            cx = this.xScale(x);
            xVal = x.toFixed(3);
        }
        // use xVal as drag value
        this.handle.attr('cx', cx);
        return xVal;
    }

}
