function toggleFilter(ID){
    var element = document.getElementById(ID);
    if(element.style.display === "none"){
        element.style.display = "block";
    }else{
        element.style.display = "none";
    }
}


function populateCountries(div_id, country_names){
  console.log("Populating countries");
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


  // var submitButton = document.getElementById("submit_filter");
  // var clearButton = document.getElementById("clear_filter");
  //
  // submitButton.addEventListener('click', function(){
  //   submitFilter(country_names);
  // });
  // clearButton.addEventListener('click', function(){
  //   uncheckCountries(country_names.length);
  // });
}

function uncheckCountries(cb_count) {
  for (var i = 0; i < cb_count; i++){
    var cb = document.getElementById("cb"+i);
    cb.checked = false
  }
}

function submitFilter(country_names) {
  var selected_countries = [];
  for (var i = 0; i < country_names.length; i++){
    var cb = document.getElementById("cb"+i);
    if (cb.checked) {
      selected_countries.push(country_names[i]);
      console.log("Country checked: " + country_names[i]);
    }
  }
}
