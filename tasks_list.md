# List of tasks to perform

## 1) World map viz
### Filter panel
- Make the currently chosen filters (e.g. _out_-flow, female only, normalized) apply to the display of clicked countries
- Make it Gapminder-like. See the following link, the countries' selection panel is on the right:
https://www.gapminder.org/tools/#$chart-type=bubbles
- Automatically select the country clicked and show it ticked at the top of the countries' filter selection
- Enable the user to choose the maximum number of flows to display, and/or set a threshold with the minimum number of people per flow

### Animations
- Dynamic viz of the flows
- Function to select randomly a country every x seconds and show its flows and stats
- "Play" button to run the time evolution of the migration flows of the selected countries

### Tips (little block window appearing on hover)
- Show name of country and its population in the selected time interval
- For both gender: total flow in, total flow out, and difference between in/out

### Selected countries' statistics and additional viz
- Chord diagram
- Show top k flows (normalized and un-normalized) for selected countries
- For both gender: total flow in, total flow out, and difference between in/out

### Misc (lower priority)
- Make it possible to click on a country situated under arcs or circles
- Change arcs color for (doing now)
- Improve visual components (e.g. the way arcs look, whether to use circles at centroids to show the number of migrants)
- Try to clean in order to avoid the Errors such as `Error: <path> attribute d: Expected number, "MNaN, ...`

## 2) Overall migration flows (fig. 2 in milestone2_report.pdf)
Maybe we could use some python library to make this interactive plot more quickly?

## 3) Migrants' stocks by age (fig. 3 in milestone2_report.pdf)
There is probably some example of d3 code for such _age pyramid_ like viz.

## 4) Refugees' population map (fig. 4 in milestone2_report.pdf)
We might take some snippets from the world map viz for this one.

## 5) Migrants' stocks by countries' development index (fig. 5 in milestone2_report.pdf)
Let's consider this one when we will have done all the previous viz.

## 6) Migration route and casualities (fig. 6 in milestone2_report.pdf)
Let's consider this one when we will have done all the previous viz.
