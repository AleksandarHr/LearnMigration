d3.sankey = function() {
  var sankey = {},
      nodeWidth = 24,
      nodePadding = 8,
      size = [1, 1],
      nodes = [],
      links = [];

  sankey.nodeWidth = function(_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };

  sankey.nodePadding = function(_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };

  sankey.nodes = function(_) {
    if (!arguments.length) return nodes;
    nodes = _;
    return sankey;
  };

  sankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };

  sankey.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };

  sankey.layout = function(iterations) {
    computeNodeLinks();
    computeNodeValues();
    computeNodeBreadths();
    computeNodeDepths(iterations);
    computeLinkDepths();
    return sankey;
  };

  sankey.relayout = function() {
    computeLinkDepths();
    return sankey;
  };

  sankey.link = function() {
    var curvature = .5;

    function link(d) {
      var x0 = d.source.x + d.source.dx,
          x1 = d.target.x,
          xi = d3.interpolateNumber(x0, x1),
          x2 = xi(curvature),
          x3 = xi(1 - curvature),
          y0 = d.source.y + d.sy + d.dy / 2,
          y1 = d.target.y + d.ty + d.dy / 2;
      return "M" + x0 + "," + y0
           + "C" + x2 + "," + y0
           + " " + x3 + "," + y1
           + " " + x1 + "," + y1;
    }

    link.curvature = function(_) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };

    return link;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks() {
    nodes.forEach(function(node) {
      node.sourceLinks = [];
      node.targetLinks = [];
    });
    links.forEach(function(link) {
      var source = link.source,
          target = link.target;
      if (typeof source === "number") source = link.source = nodes[link.source];
      if (typeof target === "number") target = link.target = nodes[link.target];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });
  }

  // Compute the value (size) of each node by summing the associated links.
  function computeNodeValues() {
    nodes.forEach(function(node) {
      node.value = Math.max(
        d3.sum(node.sourceLinks, value),
        d3.sum(node.targetLinks, value)
      );
    });
  }

  // Iteratively assign the breadth (x-position) for each node.
  // Nodes are assigned the maximum breadth of incoming neighbors plus one;
  // nodes with no incoming links are assigned breadth zero, while
  // nodes with no outgoing links are assigned the maximum breadth.
  function computeNodeBreadths() {
    var remainingNodes = nodes,
        nextNodes,
        x = 0;

    while (remainingNodes.length) {
      nextNodes = [];
      remainingNodes.forEach(function(node) {
        node.x = x;
        node.dx = nodeWidth;
        node.sourceLinks.forEach(function(link) {
          nextNodes.push(link.target);
        });
      });
      remainingNodes = nextNodes;
      ++x;
    }

    //
    moveSinksRight(x);
    scaleNodeBreadths((width - nodeWidth) / (x - 1));
  }

  function moveSourcesRight() {
    nodes.forEach(function(node) {
      if (!node.targetLinks.length) {
        node.x = d3.min(node.sourceLinks, function(d) { return d.target.x; }) - 1;
      }
    });
  }

  function moveSinksRight(x) {
    nodes.forEach(function(node) {
      if (!node.sourceLinks.length) {
        node.x = x - 1;
      }
    });
  }

  function scaleNodeBreadths(kx) {
    nodes.forEach(function(node) {
      node.x *= kx;
    });
  }

  function computeNodeDepths(iterations) {
    var nodesByBreadth = d3.nest()
        .key(function(d) { return d.x; })
        .sortKeys(d3.ascending)
        .entries(nodes)
        .map(function(d) { return d.values; });

    initializeNodeDepth();
    resolveCollisions();
    for (var alpha = 1; iterations > 0; --iterations) {
      relaxRightToLeft(alpha *= .99);
      resolveCollisions();
      relaxLeftToRight(alpha);
      resolveCollisions();
    }

    function initializeNodeDepth() {
      var ky = d3.min(nodesByBreadth, function(nodes) {
        return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
      });

      nodesByBreadth.forEach(function(nodes) {
        nodes.forEach(function(node, i) {
          node.y = i;
          node.dy = node.value * ky;
        });
      });

      links.forEach(function(link) {
        link.dy = link.value * ky;
      });
    }

    function relaxLeftToRight(alpha) {
      nodesByBreadth.forEach(function(nodes, breadth) {
        nodes.forEach(function(node) {
          if (node.targetLinks.length) {
            var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedSource(link) {
        return center(link.source) * link.value;
      }
    }

    function relaxRightToLeft(alpha) {
      nodesByBreadth.slice().reverse().forEach(function(nodes) {
        nodes.forEach(function(node) {
          if (node.sourceLinks.length) {
            var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedTarget(link) {
        return center(link.target) * link.value;
      }
    }

    function resolveCollisions() {
      nodesByBreadth.forEach(function(nodes) {
        var node,
            dy,
            y0 = 0,
            n = nodes.length,
            i;

        // Push any overlapping nodes down.
        nodes.sort(ascendingDepth);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dy = y0 - node.y;
          if (dy > 0) node.y += dy;
          y0 = node.y + node.dy + nodePadding;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodePadding - size[1];
        if (dy > 0) {
          y0 = node.y -= dy;

          // Push any overlapping nodes back up.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.dy + nodePadding - y0;
            if (dy > 0) node.y -= dy;
            y0 = node.y;
          }
        }
      });
    }

    function ascendingDepth(a, b) {
      return a.y - b.y;
    }
  }

  function computeLinkDepths() {
    nodes.forEach(function(node) {
      node.sourceLinks.sort(ascendingTargetDepth);
      node.targetLinks.sort(ascendingSourceDepth);
    });
    nodes.forEach(function(node) {
      var sy = 0, ty = 0;
      node.sourceLinks.forEach(function(link) {
        link.sy = sy;
        sy += link.dy;
      });
      node.targetLinks.forEach(function(link) {
        link.ty = ty;
        ty += link.dy;
      });
    });

    function ascendingSourceDepth(a, b) {
      return a.source.y - b.source.y;
    }

    function ascendingTargetDepth(a, b) {
      return a.target.y - b.target.y;
    }
  }

  function center(node) {
    return node.y + node.dy / 2;
  }

  function value(link) {
    return link.value;
  }

  return sankey;
};

function getSize() {
    var myWidth = 0,
        myHeight = 0;
    if (typeof(window.innerWidth) == 'number') {
        //Non-IE
        myWidth = window.innerWidth;
        myHeight = window.innerHeight;
    }
    else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        //IE 6+ in 'standards compliant mode'
        myWidth = document.documentElement.clientWidth;
        myHeight = document.documentElement.clientHeight;
    }
    else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        //IE 4 compatible
        myWidth = document.body.clientWidth;
        myHeight = document.body.clientHeight;
    }
    return {
        "height": myHeight,
        "width": myWidth
    };
}

var formatNumber = d3.format(",.0f"),    // zero decimal places
    format = function(d) { return formatNumber(d) + " " + units; };

// create tooltip
let tooltip = d3.select("body").append("div").style({
    "position": "absolute",
    "z-index": "10",
    "visibility": "hidden"
}).attr({
    "class": "tooltip"
});

const eventYear = 2015; // default year for sankey

let width;

// dimensions for the charts
let dashboardHeight = getSize().height;
let headerHeight = document.querySelector('#title').offsetHeight;
let footerHeight = document.querySelector('#source > footnote').offsetHeight;

let height = (dashboardHeight - headerHeight - footerHeight) * 6 / 9;

width = (document.querySelector('#flow').offsetWidth - 16);

let margins = {
    top: 25,
    right: 10,
    bottom: 20,
    left: 10
};

// Return only 1 - p quantile to reduce possibility of overlapping text
// Define p as an arbitrary number between [0,1]
let p = 0.8;

// Define the hierarchical categories of the sankey
let steps = [{ "name": "route", "label": "Migration Route" }, { "name": "causal", "label": "Event (Death / Missing) Causality" }, { "name": "reason", "label": "Specific Reason of the Event" }];

// append the svg canvas to the page
let svg = d3.select("#flow").append("svg")
    .attr("width", width + margins.left + margins.right)
    .attr("height", height + margins.top + margins.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margins.left + "," + (+margins.top) + ")");

// Set the sankey diagram properties
let sankey = d3.sankey()
    .nodeWidth(12)
    .nodePadding(2)
    .size([width, height]);

let path = sankey.link();

// define the bars group
let barsGroup = svg.append("g");

// define the links group
let linksGroup = svg.append("g");

// define the node group
let nodesGroup = svg.append("g");

// load the data
d3.csv("./csv/filteredsankey.csv", function(error, data) {

    if (error) throw error;

    // process data
    let results = data.filter(function(d) {
        d.Year = d.event_year.toString();
        return d.value != 0;
    });

    // set crossfilter
    let ndx = crossfilter(results);

    // define dimensions
    let
        routeDim = ndx.dimension(function(d) {
            return d.route;
        }),
        yearDim = ndx.dimension(function(d) {
            return d.Year;
        }),
        sankeyDim = ndx.dimension(function(d) {
            return d.route;
        });

    // group dimensions
    let
        amountByRoute = routeDim.group().reduceSum(function(d) {
            return Math.round(+d.value);
        }),
        amountByyear = yearDim.group().reduceSum(function(d) {
            return Math.round(+d.value);
        });

    // dc.js chart types
    let routeSelect = dc.selectMenu('#routes');
    let yearSelect = dc.selectMenu('#years');

    // menuselect
    routeSelect
        .dimension(routeDim)
        .group(amountByRoute)
        .multiple(false)
        .numberVisible(null)
        .title(function(d) {
            return d.key;
        })
        .promptText('All routes')
        .promptValue(null);

    routeSelect.on('pretransition', function(chart) {
        // add styling to select input
        d3.select('#routes').classed('dc-chart', false);
        // use Bootstrap styling
        chart.select('select').classed('form-control', true);
    });

    routeSelect.on('filtered', function(chart, filter) {
        if (filter != null && steps.length < 4) {
            steps.push({ "name": "location", "label": "Location" });
            p = 0.85;
        }
        else if (filter == null) {
            steps.pop();
            p = 0.75;
        }
        let datum = transformToGraph(routeDim.top(Infinity));
        renderSankey(datum);
        bindHover();
        renderLabels();
    });

    // menuselect
    yearSelect
        .dimension(yearDim)
        .group(amountByyear)
        .title(function(d) {
            return d.key;
        })
        .promptText('All event years')
        .promptValue(null)
    ;

    yearSelect.on('pretransition', function(chart) {
        // add styling to select input
        d3.select('#years').classed('dc-chart', false);
        // use Bootstrap styling
        chart.select('select').classed('form-control', true);
    });

    yearSelect.on('filtered', function(chart, filter) {
        let datum = transformToGraph(yearDim.top(Infinity));
        renderSankey(datum);
        bindHover();
    });

    yearSelect.filter(eventYear);

    // set sankey graph data
    let graph = transformToGraph(sankeyDim.top(Infinity));

    dc.renderAll();
    renderSankey(graph);
    bindHover();
    renderLabels();
});

// transform JSON data array into sankey graph object with nodes and links arrays
// inspired by http://app.rawgraphs.io/ and http://www.d3noob.org/2013/02/formatting-data-for-sankey-diagrams-in.html
function transformToGraph(data) {
    let d = {
        nodes: [],
        links: []
    };

    if (!steps || steps.length < 2) return d;

    let n = [],
        l = [],
        si, ti;

    for (let i = 0; i < steps.length - 1; i++) {
        let sg = steps[i].name;
        let tg = steps[i + 1].name;
        let relations = d3.nest()
            .key(function(d) {
                return d[sg];
            })
            .key(function(d) {
                return d[tg];
            })
            .entries(data);

        relations.forEach(function(s) {
            si = getNodeIndex(n, s.key, sg);

            if (si == -1) {
                n.push({
                    name: s.key,
                    group: sg
                });
                si = n.length - 1;
            }

            s.values.forEach(function(t) {
                ti = getNodeIndex(n, t.key, tg);
                if (ti == -1) {
                    n.push({
                        name: t.key,
                        group: tg
                    });
                    ti = n.length - 1;
                }
                let value = d3.sum(t.values, function(d) {
                    return d.value;
                });
                let link = {
                    source: n[si],
                    target: n[ti],
                    value: value
                };
                l.push(link);
            });
        });
    }
    d.nodes = n.sort(customSort);
    l.forEach(function(d) {
        d.source = n.indexOf(d.source);
        d.target = n.indexOf(d.target);
    });
    d.links = l;

    function customSort(a, b) {
        let Item1 = a.group;
        let Item2 = b.group;
        if (Item1 != Item2) {
            return (Item1.localeCompare(Item2));
        }
        else {
            return (a.name.localeCompare(b.name));
        }
    }

    function getNodeIndex(array, name, group) {
        for (let i in array) {
            let a = array[i];
            if (a['name'] == name && a['group'] == group) {
                return i;
            }
        }
        return -1;
    }
    return d;
}

function renderLabels() {
    // create rect elements to store category labels
    let bars = barsGroup.selectAll('.label')
        .data(steps);

    // Enter
    bars
        .enter()
        .append('g')
        .attr('class', 'label');

    bars
        .append('rect')
        .attr('class', 'bar')
        .attr('height', function(d) {
            return height;
        });

    bars
        .append("text")
        .attr("dy", ".35em")
        .attr("transform", null);

    // Enter + Update
    bars
        .select('.bar')
        .style('fill', 'white')
        .transition()
        .duration(750)
        .attr('width', function(d, i) {
            return width / steps.length;
        })
        .attr('x', function(d, i) {
            return width / steps.length * i;
        });

    bars
        .select('text')
        .transition()
        .duration(750)
        .attr('y', -margins.top + 6) // 6 seems to be a good number for font size
        .attr('x', function(d, i) {
            return width / steps.length * i + (width / steps.length) / 2;
        })
        .attr("text-anchor", function(d, i) {
            if (steps.length < 4) {
                return "middle";
            }
            else {
                return "end";
            }
        })
        .style('font-weight', 'bold')
        .text(function(d) {
            return d.label;
        });

    // Exit
    bars.exit().remove();

    return bars;

}

function renderSankey(graph) {

    // the function for moving the nodes
    function dragmove(d) {
        d3.select(this).attr("transform",
            "translate(" + d.x + "," + (
                d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
            ) + ")");
        sankey.relayout();
        links.attr("d", path);
    }

    // Returns an event handler for fading a given chord group.
    // http://bl.ocks.org/mbostock/4062006
    function fade(opacity) {
        return function(selectedNode, i) {
            // loop through target links of the selected node and push to array
            let targetLinks = selectedNode.targetLinks.map(function(d) {
                return d.source.name;
            });

            // loop through source links of the selected node and push to array
            let sourceLinks = selectedNode.sourceLinks.map(function(d) {
                return d.target.name;
            });

            // get an array of nodes
            let nodes = svg.selectAll(".node");

            // filter an array of nodes that are not contained in targetLinks or sourceLinks
            let nonSiblingNodes = nodes.filter(function(node) {
                return node.name != graph.nodes[i].name && targetLinks.indexOf(node.name) < 0 && sourceLinks.indexOf(node.name) < 0;
            });
            nonSiblingNodes
                .transition('nodeFade') // assign a name to the transition to prevent other transitions from interfering
                .style("opacity", opacity);

            let links = svg.selectAll(".link");

            let siblingLinks = links.filter(function(d) {
                return d.source.name != graph.nodes[i].name && d.target.name != graph.nodes[i].name;
            });
            siblingLinks
                .transition('linkFade') // assign a name to the transition to prevent other transitions from interfering
                .style("opacity", opacity);
        };
    }

    // certain text will overlap due to the number of nodes at the lowest level of the graph
    // show text for the nodes that are within the top x% by value
    // construct an array of values from the graph to determine quantiles
    let valueRange = graph.links.map(function(d) {
        return d.value;
    });

    valueRange.sort(function(a, b) {
        return a - b;
    });

    let nodeNames = graph.nodes.map(function(d) {
        return d.name;
    });

    // http://jonathansoma.com/tutorials/d3/color-scale-examples/
    let color = d3.scale.ordinal().domain(nodeNames).range(colorbrewer.Dark2[8]);
    let quantile = d3.quantile(valueRange, p);
    console.log("The " + p + " quantile value is: " + quantile);

    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(36);

    // Draw the links
    let links = linksGroup.selectAll(".link")
        .data(graph.links);

    // Enter
    links
        .enter()
        .append("path")
        .attr("class", "link");

    // Enter + Update
    links
        .sort(function(a, b) {
            return b.dy - a.dy;
        })
        .transition('pathDraw') // assign a name to the transition to prevent other transitions from interfering
        // .delay(750)
        .duration(750)
        .attr("d", path)
        // .transition('strokeWidth') // assign a name to the transition to prevent other transitions from interfering
        // .duration(250)
        .style("stroke-width", function(d) {
            return Math.max(1, d.dy);
        });

    // Exit
    links.exit().remove();

    // add in the nodes
    let nodes = nodesGroup.selectAll(".node")
        .data(graph.nodes);

    // Enter
    nodes.enter()
        .append("g")
        .attr("class", "node");

    nodes.append("rect")
        .attr("width", sankey.nodeWidth())
        .style('fill', '#ccc')
        .append("title");

    nodes.call(d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", function() {
            this.parentNode.appendChild(this);
        })
        .on("drag", dragmove));

    nodes.append("text")
        .attr("dy", ".35em")
        .style('fill', '#e5e5e5')
        .attr("transform", null);

    // Enter + Update
    nodes
        .transition('nodeTransform') // assign a name to the transition to prevent other transitions from interfering
        .duration(750)
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    // add the rectangles for the nodes
    nodes.select("rect")
        .attr("height", function(d) {
            return d.dy;
        })
        .transition('rectFill') // assign a name to the transition to prevent other transitions from interfering
        .delay(500)
        .duration(750)
        .style("fill", function(d, i) {
            return d.color = color(d.name.replace(/ .*/, ""));
        })
        .style("stroke", function(d) {
            return d3.rgb(d.color).darker(2);
        });

    nodes.select('text')
        .attr("x", function(d) {
            if (d.x < width - width / 3) {
                return 6 + sankey.nodeWidth();
            }
            else {
                return -6;
            }
        })
        .attr("text-anchor", function(d) {
            if (d.x < width - width / 3) {
                return "start";
            }
            else {
                return "end";
            }
        })
        .transition('yTextPosition') // assign a name to the transition to prevent other transitions from interfering
        .delay(250)
        .duration(750)
        .attr('y', function(d) {
            return d.dy / 2;
        })
        .style('fill', '#000000')
        .text(function(d) {
            if (d.dy > 25) { // arbitrary number of <rect> height
                return d.name;
            }
            else {
                return null;
            }
        });

    nodes.exit().remove();

    //http://bl.ocks.org/frischmilch/7667996
    nodes
        .on("mouseover", fade(0.1))
        .on("mouseout", fade(1));

    return sankey;
}

// define mouseover and mouseout events
function bindHover() {
    document.body.addEventListener('mousemove', function(e) {
        if (e.target.className.animVal == 'link') {
            let d = d3.select(e.target).data()[0];
            let key = d.source.name + " → " + d.target.name;
            let amount = formatNumber(d.value);
            showDetail(e, key, amount, null, null)
        }
        else if (e.target.nodeName == 'rect' && e.target.className.animVal != 'bar') {
            let d = d3.select(e.target).data()[0];
            let key = d.name;
            let amount = formatNumber(d.value);
            showDetail(e, key, amount, null, null)
        }
    });

    document.body.addEventListener('mouseout', function(e) {
        if (e.target.className.animVal == 'link' || e.target.nodeName == 'rect') hideDetail();
    });
}

// Show tooltip on hover
function showDetail(event, key, amount) {

    // show tooltip with information from the __data__ property of the element
    var x_hover = 0;
    var y_hover = 0;

    var content = "<b>" + key + "</b><br/>";

    if (amount != null) content += "<b>Death: </b>" + amount + "<br/>";

    var tooltipWidth = parseInt(tooltip.style('width'));
    var tooltipHeight = parseInt(tooltip.style('height'));
    var classed,notClassed;

    if (event.pageX > document.body.clientWidth / 2) {
        x_hover = tooltipWidth + 30;
        classed = 'right';
        notClassed = 'left';
    } else {
        x_hover = -30;
        classed = 'left';
        notClassed = 'right';
    }

    y_hover = (document.body.clientHeight - event.pageY < (tooltipHeight + 4)) ? event.pageY - (tooltipHeight - 40) : event.pageY - tooltipHeight - 40;

    return tooltip
        .classed(classed,true)
        .classed(notClassed,false)
        .style({
            "visibility": "visible",
            "top": y_hover + "px",
            "left": (event.pageX - x_hover) + "px"
        })
        .html(content);
}

// Hide tooltip on hover
function hideDetail() {

    // hide tooltip
    return tooltip.style("visibility", "hidden");
}