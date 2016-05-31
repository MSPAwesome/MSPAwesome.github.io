// ====================================================================
//    MAP
// various GeoJSON and TopoJSON files from https://github.com/thadk/GeoTZ
// but simplified with mapshaper.org
// ====================================================================

// ####################################################################
//    SOME GLOBAL VARIABLES
// ####################################################################
// width and height of mapSVG
var w = 750, h = 750;

// current checked radio button for Status
var checkedStatus = getStatus();

// variables to hold main data sets; may use outside map function
var regionData, jsonData;

// to tag region we're actively zoomed in on
var active = d3.select(null);
var activeCsvData = {};

// for opacity scale (for map); range is for quartiles
var opacityDomain = {}, opacityRange = [0.25, 0.5, 0.75, 1];

// create variables for pie
var wPie = 250, hPie = 250;
var outerRadius = wPie / 2;
var innerRadius = 0;

// ####################################################################
//    CREATE DEFAULTS FOR MAP
// ####################################################################

// scale for region fill opacity (based on quartiles--4 bins w/ same amount of values in each). will add domain later, when we get current class
var opacityScale = d3.scale.quantile()
  .range(opacityRange);

// i.e. map projection. Mostly just trial and error here.
var projection = d3.geo.mercator()
  .center([34.8888, -6.3690])
  .translate([w / 2, h / 2])
  .scale(3000);

// create path variable with our projection
var path = d3.geo.path().projection(projection);

// generate svg object at bottom of "#map-viz" div class ".viz"
var geoSVG = d3.select("#map-viz .viz")
  .append("svg")
  .attr("width", w)
  .attr("height", h)
  .attr("id", "geoSvg");


// g attribute groups elements together, so you can zoom all
var g = geoSVG.append("g")
  .style("stroke-width", "1px");

// ***************************************************************
//    DEFAULTS FOR pie
// ***************************************************************
var arc = d3.svg.arc()
	.innerRadius(innerRadius)
  .outerRadius(outerRadius);

var pie = d3.layout.pie();
var pieSVG = d3.select("#pie")
  .append("svg")
  .attr("width", wPie)
  .attr("height", hPie)
  .attr("id", "svgPie")
  .append("g")
  .attr("class", "arc")
  .attr("transform", "translate(" + outerRadius + ", " + outerRadius + ")");

// ****************************************************************
//    LEGEND
// ****************************************************************

var svgKey = d3.select("#key")
  .append("svg")
  .attr("width", wPie)
  .attr("height", hPie /2 )
  .attr("id", "svgKey")
  .append("g")   // to group elements together
  .attr("transform", "translate(20,20)")
  .call(legendColors);

// ****************************************************************
//    LOAD DATA / BIND TO elements
// ***************************************************************
// map of Africa (background)
d3.json("geo/africa.geo.json", function(error, json) {
  if(error) {
    console.log(error);
  } else {
    // console.log(json.features);
    g.selectAll("path.africa")
      .data(json.features)
      .enter().append("path")
      .attr("d", path)
      .attr("id", function(d) {
        // console.log(d);
        return d.properties.name;
      })
      .attr("class", "africa")
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1);
  }
});


/* load csv data here, then merge with map data. This way we only have to
iterate through the csv once to match region names, not at every transition.*/
d3.csv("data/regions.csv", function(data) {
  // grab dataset in variable, delcare other variables here, outside loops
  regionData = data;

  // create object with arrays of all values for each class, for use in scale
  // loop through each region object in data array
  regionData.forEach(function (region) {

    // loop thru each key in region object
    Object.keys(region).forEach(function (key){
      if (key !== "region") {   // don't need "region" property
        if (!opacityDomain[key]) {   // create empty array if doesn't exist yet
          opacityDomain[key] = [];
        }
        opacityDomain[key].push(region[key]);   // add value to array
      }
    })
  });

  // This code is for TopoJSON, much smaller than geojson
  var dataRegion;
  var mapRegion;
  d3.json("geo/TZA_adm1_mapshaper.json", function(error, json) {
    if(error) {
      console.log(error);
    } else {
      // log json -- easier to read than in text editor
      // console.log(json);
      // store json in global scope var to access it later for updates
      jsonData = json.objects.TZA_adm1_mkoaTZ;
      // jsonData = json;
      var jsonFeature;
      var csvRow;

        // loop for topojson ...
        for (var i = 0; i < jsonData.geometries.length; i++) {
          // ...  to get region name ...
          jsonFeature = jsonData.geometries[i].properties;
          mapRegion = jsonFeature.NAME_1;

          if (mapRegion) {
            // ... then loop through csv to find matching row ...
            for (var j = 0; j < regionData.length; j++) {
              csvRow = regionData[j];
              dataRegion = csvRow.region;
              // ... when we find a match ...
              if (dataRegion == mapRegion) {
                // ... add each column:value pair to json
                // add the whole object, to make it easier to pull out later for Status and pie chart
                jsonFeature["csvData"] = csvRow;
                break;
              }
            }
          }
        }

      // must convert topojson to geo before loading
      var subunits = topojson.feature(json, jsonData);
      // console.log(subunits.features);
      g.selectAll("path.region")
        .data(subunits.features)
        .enter().append("path")
        .attr("d", path) // <-- draw path on our projection from above
        .attr("id", function(d) {
          // console.log(d);
          // regions not in csv won't have this property
          if (d.properties.csvData) {
            // console.log(d.properties.csvData);
            return d.properties.csvData.region;
          }
        })
        .style("opacity", function(d){
          var op = 1;   // for paths w/o data
          if (d.properties.csvData) {
            if (d.id !== "Tanzania") {
                op = 0;
            }
          }
          return op;
        })    // set opacity to 0 so we can transition in
        .call(setMapAttr)
        .on("click", clicked);

      g.selectAll(".regionLabel")
        .data(subunits.features)
        .enter().append("text")
        .attr("class", "regionLabel")
        .attr("x", function(d) {
          // regions not in csv won't have this property
          if (d.properties.csvData) {
            return path.centroid(d)[0];
          }
        })
        .attr("y", function(d) {
          // regions not in csv won't have this property
          if (d.properties.csvData) {
            return path.centroid(d)[1];
          }
        })
        .text(function(d) {
          // regions not in csv won't have this property
          if (d.properties.csvData) {
            if (d.properties.csvData.region != "Tanzania")
            return d.properties.csvData.region;
          }
        })
        .style("opacity", 0)
        .transition()
        .duration(750)
        .style("opacity", 1); // will fade in with transition
    }
  });
});

d3.selectAll("input")
  .on("click", statusClick);

// ####################################################################
//    FUNCTIONS
// ####################################################################

// get the text (i.e., status_group value) of currently selected radio button
function getStatus() {
  var form, options;
  // console.log("checking status");
  form = document.getElementById('currentStatus');
  options = form.elements.status_group;
  for (var i = 0; i < options.length; i++) {
    if (options[i].checked) {
      // console.log(options[i].value);
      return options[i].value;
      break;
    }
  }
}


// set region path attributes if zoomed out
// selection is selection of path elements
function setMapAttr(selection) {
  var pointCount;
  var currentRegion;
  var currentCsvData = {};
  var tzaData = {};

  // get which radio button is checked
  checkedStatus = getStatus();

  // now add domain to scale. need to update after every getStatus()
  opacityScale.domain(opacityDomain[checkedStatus]);

  // set attributes on path elements based on checkedStatus
  selection
    // opacity is quartile of count out of all counts of that class
    .transition()
    .duration(750)
    .style("opacity", 1)
    .style("fill-opacity", function(d) {
      // not every d has csvData, so check first
      currentCsvData = d.properties.csvData;
      if (currentCsvData) {
        // value of current checkedStatus count
        pointCount = +currentCsvData[checkedStatus];
        currentRegion = currentCsvData.region;
        if (currentRegion == "Tanzania") {
          // console.log(d.properties.csvData);
          active = d3.select(this);
          updatePie(currentCsvData);
          return 1;
        } else {
          // get opacity for that class's quartiles
          return opacityScale(pointCount);
        }
        return 1;
      }
    })
    .attr("class", function(d) {
      // if the property for the csvData object exists, set class as that checkedStatus, which defines the fill color (in CSS). Also include "region" for gen CSS rules. If no checkedStatus property, add "missing" class. Country path gets "active" since we're by definition zoomed out (or is that added in "reset()"?)
      if (d.properties.csvData) {
        if (d.properties.csvData.region == "Tanzania") {
          return("region country active");
        } else {
          return("region " + checkedStatus);
        }
      } else {
        // otherwise assign to class "missing"; includes country-path
        return("region missing");
      }
    });
}

// zoom on region when clicked..
function clicked(d) {

  // if the region clicked is already "active" reset to original view
  // console.log(active);
  if (active.node() === this) return reset();

  // remove the "active" class from the formerly "active" node
  active.classed("active", false);

  // add "active" class to current selection
  active = d3.select(this).classed("active", true);

  // pass csvData object to update pie and status box
  var thisCsvData = {};
  thisCsvData = d.properties.csvData;
  updatePie(thisCsvData);

  g.selectAll("path.region")
    // trying to keep "Tanzania" path white with others fully transparent, but it's not really working. Perhaps need to learn more about keys.
    .transition()
    // .delay(750)
    .duration(1000)
    .style("fill-opacity", function(d) {
      if (d.properties.csvData) {
        if (d.properties.csvData.region == "Tanzania") {
          return 1;
        } else {
          return 0;
        }
      }
    });

  // call function to add (and remove!) data points to region
  if (active.node().id !== "Tanzania") {
    addPoints(active.node());
  }

  // set new view area
  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .9 / Math.max(dx / w, dy / h),
      translate = [w / 2 - scale * x, h / 2 - scale * y];

  // transition to new view
  g.transition()
      .duration(2000)
      .style("stroke-width", 1.5 / scale + "px")
      .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

  g.selectAll(".regionLabel")
    .transition()
    .duration(2000)
    .style("opacity", 0);
}

// zoom out when clicked again
function reset() {
  // remove active class from current region
  active.classed("active", false);
  active = d3.select(null);

  g.selectAll("circle")
    .transition()
    .duration(1000)
    .attr("r", 0)
    .remove();

  g.selectAll("path.region")
    // no transition here, it's already in the function
    .call(setMapAttr);

  g.selectAll(".regionLabel")
    .transition()
    .duration(750)
    .style("opacity", 1);

  g.transition()
      // .delay(750)
      .duration(1000)
      .style("stroke-width", "1.5px")
      .attr("transform", "");
}

// filter to only include current checked status dots
function dotFilter(dot) {
  return dot.status_group == checkedStatus;
}

function addPoints(regionNode) {
  // get which radio button is checked
  checkedStatus = getStatus();

  var fileName = "data/" + regionNode.id + ".csv";
  if (fileName) {

    // load data for water points
    d3.csv(fileName, function(error, oneRegion) {
      if(error) {   // if error is not NULL, i.e. data file loaded wrong
        console.log(error);
      } else {
        // Filter by checkedStatus
        var statusData = [];
        statusData = oneRegion.filter(dotFilter);

        // bind new data to circles
        var waterpoints = g.selectAll("circle").data(statusData);

        // add points for any new elements
        waterpoints.enter()
          .append("circle")
          .attr("r", 0); // starting point for radius, will transition below

        // remove leftover elements
        waterpoints.exit()
          .transition()
          .duration(1000)
          .attr("r", 0)
          .remove();

        // update the circles that remain (incuding new ones)
        waterpoints.transition()
          .duration(1000)
          .attr("r", 0)
          .transition()
          .delay(1000)
          .duration(250)
          .attr("cx", function(d) {
            return projection([d.longitude, d.latitude])[0];
          })
          .attr("cy", function(d) {
            return projection([d.longitude, d.latitude])[1];
          })
          .transition()
          .delay(1250)
          .duration(2000)
          .ease("elastic")
          .attr("r", 3)
          .attr("class", "waterpoint " + checkedStatus);

      };
    })
  } else {
    console.log("no CSV for " + regionName);
  }
}

// change displayed data based on current selected status_group
function statusClick() {
  checkedStatus = getStatus();
  svgKey.call(legendColors);
  if (active.node().id == "Tanzania") {
    g.selectAll("path.region")
      // .data(jsonData.features)
      .transition()
      .duration(500)
      .style("fill-opacity", 0)
      .call(setMapAttr);
  } else {
    addPoints(active.node());
  }
}

function updatePie(currentData) {
  // selection of pie "g" elements
  var wedges;
  var dataLabels;
  var statusClass;

  // pieData() also updates status box
  // and activeCsvData var
	var wedgeData = pie(pieData(currentData));

  // bind data to paths for wedges
	wedges = pieSVG.selectAll("path.wedge")
  	.data(wedgeData);
  // bind data to text labels
  dataLabels = pieSVG.selectAll("text")
  	.data(wedgeData);

	// add elements to enter selection (1st time only)
  wedges.enter()
  	.append("path");

  dataLabels.enter()
  	.append("text")
    .attr("font-family", "monospace")
    .attr("font-size", "20px");

	// define attributes based on new data
	wedges.attr("d", arc)
    .attr("class", function(d) {
      Object.keys(activeCsvData).forEach(function (key) {
        if (activeCsvData[key] == d.data) {
          statusClass = key;
        }
      })
    	return statusClass + " wedge";
  	});

	dataLabels.text(function(d) {
      // compute percentages based on start/end angles
  		return Math.round(((d.endAngle - d.startAngle) / (2 * Math.PI)) * 100) + "%";
  	})
    .attr("transform", function(d) {
    	return "translate(" + arc.centroid(d) + ")";
    })
    .attr("class", "dataLabel");
}

function pieData(activeData) {
  activeCsvData = activeData;
  var regCounts = [];   // numbers to actually put in the pie

  // loop through this object's csvData object
  Object.keys(activeData).forEach(function (key) {
    // console.log(key);
    // update text in status box
    var item = document.getElementById(key);
    var statusLabel;
    if (activeData[key] == "Tanzania") {
      statusLabel = activeData[key];
    } else {
      statusLabel = key + ": " + activeData[key];
    }
    item.textContent = statusLabel;

    // get total of all points in region
    if (key !== "region") {
      // create array of JUST the data values to bind to pie chart
      regCounts.push(activeData[key])
    }
  });
  return regCounts;
}

function legendColors(svg) {
  var legendRange = getKeyRange(checkedStatus);

  var keyScale = d3.scale.quantile()
    .domain([0,1])
    .range(legendRange);

  var legendScale = d3.legend.color()
    .labelFormat(d3.format(".0%"))
    .title("Count quartile")
    .shapeWidth(50)
    .scale(keyScale);

  svg.call(legendScale);

    function getKeyRange(status) {
      var keyRange = [];
      var element = document.getElementById(status);
      var style = window.getComputedStyle(element);
      var color = style.getPropertyValue("color"); //returns rgb

      var newColor;
      opacityRange.forEach(function (item) {
        newColor = color.replace(')', ', ' + item).replace('rgb', 'rgba');
        keyRange.push(newColor);
      });
      // console.log(keyRange);
      return keyRange;
    }
}
