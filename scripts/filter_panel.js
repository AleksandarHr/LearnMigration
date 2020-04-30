function toggleFilter(ID){
    var element = document.getElementById(ID);
    if(element.style.display === "none"){
        element.style.display = "block";
    }else{
        element.style.display = "none";
    }
}


function populateCountries(div_id, country_names){
  var myDiv = document.getElementById(div_id);
  var br = document.createElement("br");
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

function clearFilters(cb_count) {
  for (var i = 0; i < cb_count; i++){
    var cb = document.getElementById("cb"+i);
    cb.checked = false
  }
  document.getElementById("inflow").checked = true;
  document.getElementById("both").checked = true;
  document.getElementById("normalize").checked = false;
}

function submitFilter(country_names) {
  var selected_countries = [];
  for (var i = 0; i < country_names.length; i++){
    var cb = document.getElementById("cb"+i);
    if (cb.checked) {
      selected_countries.push(country_names[i]);
    }
  }

  var outflow = document.getElementById("outflow");
  var male = document.getElementById("male");
  var female = document.getElementById("female");
  var normalized = document.getElementById("normalize");
  toggleFilter("filter_panel");
  return [selected_countries, inflow.checked, male.checked, female.checked, normalized.checked];
}
