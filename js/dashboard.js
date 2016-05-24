
// ====================================================================
//    MAP
// various GeoJSON and TopoJSON files from https://github.com/thadk/GeoTZ
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
// for zoom
var active = d3.select(null);
var zoomed = false;
// for opacity scale (for map); range is for quartiles
var opacityDomain = {}, opacityRange = [0.25, 0.5, 0.75, 1];

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
  // .attr("style", "outline: thin solid black;")
  .attr("width", w)
  .attr("height", h)
  .attr("border", 1);

// something about the svg itself, for zooming
var g = geoSVG.append("g")
    .style("stroke-width", "1px");

/* load csv data here, then merge with map data. This way we only have to
iterate through the csv once to match region names, not at every transition.*/
d3.csv("data/regions.csv", function(data) {
  // grab dataset in variable, delcare other variables here, outside loops
  regionData = data;

  // create object with arrays of all values for each class, for use in scale
  // loop through each region object in data array
  regionData.forEach(function (region){

    // loop thru each key in region object
    Object.keys(region).forEach(function (key){
      if (key !== "region") {   // don't need "region" property
        if (!opacityDomain[key]) {   // create empty array if doesn't exist yet
          opacityDomain[key] = [];
        }
        opacityDomain[key].push(region[key]);   // add value to array
      }
    })
  })

  // This code is for GeoJSON--larger file than TopoJSON, but has region names
  var dataRegion;
  var mapRegion;
  d3.json("geo/TZA_adm1_mkoaTZ.geojson", function(error, json) {
    if(error) {
      console.log(error);
    } else {
      // log json -- easier to read than in text editor
      // console.log(json);
      // store json in global scope var to access it later for updates
      jsonData = json;
      var jsonFeature;
      var csvRow;

      // loop through json features (i.e., regions) ...
      for (var i = 0; i < jsonData.features.length; i++) {
        // ...  to get region name ...
        jsonFeature = jsonData.features[i].properties
        // (note, country object does not have NAME_1 property...
        mapRegion = jsonFeature.NAME_1;

        // ... so verify we have a value here first)
        if (mapRegion) {
          // ... then loop through csv to find matching row ...
          for (var j = 0; j < regionData.length; j++) {
            csvRow = regionData[j];
            dataRegion = csvRow.region;
            // ... when we find a match ...
            if (dataRegion == mapRegion) {
              // ... add each column:value pair to json properties (for everything except country path, of course)
              Object.keys(csvRow).forEach(function(key) {
                jsonFeature[key] = csvRow[key];
              })
              break;
            }
          }
        }
      }

      // // frame around svg box
      // var frame = g.append("rect")
      //     .attr("width", w)
      //     .attr("height", h)
      //     .attr("x", 0)
      //     .attr("y", 0)
      //     // .transition()
      //     // .duration(1000)
      //     .style("stroke", "black")
      //     .style("stroke-width", 1)
      //     .style("fill", "none")
      //     .style("padding", 20);

      // bind GeoJSON features (incl count) to new path elements
      g.selectAll("path")
        .data(jsonData.features)
        .enter().append("path")
        .attr("d", path) // <-- draw path on our projection from abover
        // regions store name as NAME_1 property but country is ENGLI_NAME
        .attr("id", function(d) {
          if (d.properties.NAME_1) {
            return d.properties.NAME_1;
          } else {
            return d.properties.NAME_ENGLI;
          }
        })
        .style("fill-opacity", 0)
        .style("opacity", 0)
        .call(setMapAttr)
        .on("click", clicked);
    }
  })
});

d3.selectAll("input")
  .on("click", statusClick);
/* ********************************************************
  This is for TopoJSON. Smaller file, but no district names.
  Also only starts at District level, not region level.

d3.json("geo/TZA_adm2.topojson", function(error, json) {
  if(error) {
    console.log(error);
  } else {
    console.log(json);

    // projection of map to 2D plane
    var projection = d3.geo.mercator()
      .center([34.8888, -6.3690])
      .translate([w / 2, h / 2])
      .scale(3000);
    // path generator to format projection to SVG
    var path = d3.geo.path()
      .projection(projection);
    //must convert TopoJSON back to GeoJSON for display
    var subunits = topojson.feature(json, json.objects.TZA_adm2)

    // create new path elements and bind topoJSON features to them
    geoSVG.selectAll(".TZA_adm2")
      .data(subunits.features)
      .enter().append("path")
      .attr("class", "region")
      .attr("d", path);
  }
});
**************************************************************/

// // ****************************************************
// // ****************************************************
// // this is bar chart of counts of functionality values
//
// var dataset;  // global variable for the data itself
// // d3.csv is async, so if other functions require the data to
// // be loaded, include them inside this function.
// d3.csv("data/counts.csv", function(error, data) {
//   if(error) {   // if error is not NULL, i.e. data file loaded wrong
//     console.log(error);
//   } else { // if file loaded correctly, go on with it
//     h = h * 0.65
//     var barPadding = 5;
//
//     // Assign CSV data to variable so we can get it later
//     dataset = data;
//
//     // Create svg in <main> to bind data to
//     var svg = d3.select("#barChart-viz .viz")
//       .append("svg")
//       .attr("width", w)
//       .attr("height", h)
//       .attr("class", "barChart");
//
//     // create svg elements and bind data to them
//     svg.selectAll("rect")
//        //Freq is frequency of each target
//       .data(dataset)
//       .enter()
//       .append("rect")
//       .attr("x", function(d, i) {
//         return i * (w / dataset.length);
//       })
//       .attr("width", w / dataset.length - barPadding)
//       .attr("y", function(d) {
//         return h - +d["Freq"]/100;
//       })
//       .attr("height", function(d) {
//         return +d["Freq"]/100;
//       })
//       .attr("class", function(d) {
//         return d["Var1"];
//       });
//
//       svg.selectAll("text")
//          .data(dataset)
//          .enter()
//          .append("text")
//          .text(function(d) {
//             return d["Var1"];
//          })
//          .attr("x", function(d, i) {
//             return i * (w / dataset.length) + 15;
//          })
//          .attr("y", function(d) {
//             return h - +d["Freq"]/100 + 30;
//          });
//   }
// });

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

function setMapAttr(selection) {
  var pointCount;
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
      // value of current checkedStatus count
      pointCount = +d.properties[checkedStatus];
      // validate property exists, because not all regions are in csv
      if (pointCount) {
        // get opacity for that class's quartiles
        return opacityScale(pointCount);
      } else {
        // country path or region missing from CSV.
        return 1;
      }
    })
    .attr("class", function(d) {
      // if the property for the checkedStatus exists, set class as that checkedStatus, which defines the fill color (in CSS). Also include "region" for gen CSS rules. If no checkedStatus property, add "missing" class.
      if (+d.properties[checkedStatus]) {
        return("region " + checkedStatus);
      } else {
        // otherwise assign to class "missing"; includes country-path
        return("region missing");
      }
    });
}

// zoom on region when clicked..
function clicked(d) {
  // if the region clicked is already "active" reset to original view
  if (active.node() === this) return reset();

  // remove the "active" class from the formerly "active" node
  active.classed("active", false);

  // add "active" class to current selection
  active = d3.select(this)
    .classed("active", true);

  g.selectAll("path")
    // trying to keep "Tanzania" path white with others fully transparent, but it's not really working. Perhaps need to learn more about keys.
    .transition()
    // .delay(750)
    .duration(1000)
    .style("fill-opacity", function(d) {
      if (d.id == "Tanzania") {
        return 1;
      } else {
        return 0;
      }
    });

    // call function to add data points to region
    // not quite working yet
    if (zoomed = true) {
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
}

// zoom out when clicked again
function reset() {
  active.classed("active", false);
  active = d3.select(null);
  zoomed = false;
  g.selectAll("circle")
    .transition()
    .duration(1000)
    .attr("r", 0)
    .remove();
  g.selectAll("path")
    // no transition here, it's already in the function
    .call(setMapAttr);
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
  if (zoomed == false) {
    g.selectAll("path")
      // .data(jsonData.features)
      .transition()
      .duration(500)
      .style("fill-opacity", 0)
      .call(setMapAttr);
  } else {
    addPoints(active.node());
  }
}
