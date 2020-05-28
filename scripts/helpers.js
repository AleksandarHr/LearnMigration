/*
  A function to render the pop-up dialogue on hover for sankey diagram and for the bar chart
*/
function renderPopUpDetailDialogue(event, content) {
  // show tooltip with information from the __data__ property of the element
  let x_hover = 0;
  let y_hover = 0;
  let tooltipWidth = parseInt(tooltip.style('width'));
  let tooltipHeight = parseInt(tooltip.style('height'));
  let classed, notClassed;

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
      .classed(classed, true)
      .classed(notClassed, false)
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

// Takes care of learnMoreMain button functionality
$("#learnMoreMain").click(function() {
	$('html,body').animate({
		scrollTop: $("#Abstract").offset().top
	},
		'slow');
});

// Collapse navbar dropdown when clicking on an item from it
$('.navbar-collapse a').click(function(){
	$(".navbar-collapse").collapse('hide');
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
