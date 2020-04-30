// Toggles the filter panel
function toggleFilter(ID){
    var element = document.getElementById(ID);
    if(element.style.display === "none"){
        element.style.display = "block";
    }else{
        element.style.display = "none";
    }
}

// Populates list of countries and checkboxes in the filter panel
function populateCountries(div_id, country_names){
  var myDiv = document.getElementById(div_id);
  var br = document.createElement("br");

  // for every country create a checkbox
  for (var i = 0; i < country_names.length; i++) {
    var checkBox = document.createElement("input");
    var label = document.createElement("label");
    checkBox.type = "checkbox";
    checkBox.value = country_names[i];
    checkBox.id = "cb" + i;
    label.textContent = country_names[i];
    myDiv.appendChild(checkBox);
    myDiv.appendChild(label);
    myDiv.appendChild(br);
  }
}

// On-click event function for the clear button - unchecks all coutries,
//    sets other filters to their default values - Inflow, Both genders, Not-normalized flow data
function clearFilters(cb_count) {
  // deselects all countries
  for (var i = 0; i < cb_count; i++){
    var cb = document.getElementById("cb"+i);
    cb.checked = false
  }

  // sets other filters to their default values
  document.getElementById("inflow").checked = true;
  document.getElementById("both").checked = true;
  document.getElementById("normalize").checked = false;
}


// On-click event function for the submit button
function submitFilter(country_names) {
  var selected_countries = [];

  // registers selected countries
  for (var i = 0; i < country_names.length; i++){
    var cb = document.getElementById("cb"+i);
    if (cb.checked) {
      selected_countries.push(country_names[i]);
    }
  }

  // registers other filter selections
  var outflow = document.getElementById("outflow");
  var male = document.getElementById("male");
  var female = document.getElementById("female");
  var normalized = document.getElementById("normalize");
  toggleFilter("filter_panel");

  // returns an array with informatino about all filters
  return [selected_countries, inflow.checked, male.checked, female.checked, normalized.checked];
}
