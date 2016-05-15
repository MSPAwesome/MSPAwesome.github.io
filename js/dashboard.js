// global svg width and height, in pixels
// primarily for map; maybe make different vars for each viz?
var w = 1000;
var h = 600;

// Let's make some maps!
// various GeoJSON and TopoJSON files from https://github.com/thadk/GeoTZ

// ####################################################################
//    GLOBAL VARIABLES
// ####################################################################
var checkedStatus;
// variables to hold main data sets; may use outside map function
var regionData, jsonData;

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

// class="region" for general CSS, plus class for status
// id=NAME_01 = may need for labels at some point
function setMapAttr(selection) {
  var opPct;
  // get which radio button is checked
  checkedStatus = getStatus();

  // set attributes on path elements based on checkedStatus
  selection
    .attr("id", function(d) {
      return d.properties.NAME_1;
    })
    // opacity is percent of total wells that meet the checkedStatus value
    .style("fill-opacity", function(d) {
      opPct = +d.properties[checkedStatus];
      // validate property exists, because not all regions are in csv
      if (opPct) {
        return(opPct);
      } else {
        // transparent if missing, also set stroke-width to 0 so won't appear
        return 0;
      }
    })
    .attr("class", function(d) {
      // if the property for the checkedStatus exists, set class as that checkedStatus, which defines the fill color (in CSS). Also include "region" for gen CSS rules. If no checkedStatus property, add "missing" class.
      if (+d.properties[checkedStatus]) {
        return("region " + checkedStatus);
      } else {
        // otherwise assign to class "missing"
        return("region missing");
      }
    });
  }

// generate svg object at botto mof "#map-viz" div class ".viz"
var geoSVG = d3.select("#map-viz .viz")
  .append("svg")
  .attr("width", w)
  .attr("height", h);

// i.e. map projection. Mostly just trial and error here.
var projection = d3.geo.mercator()
  .center([34.8888, -6.3690])
  .translate([w / 2, h / 2])
  .scale(3000);

// create path variable with our projection
var path = d3.geo.path().projection(projection);

// draw single path for the whole country, to control fill/background-color
// behind the regions (which will have opacity)
d3.json("geo/TZA_adm0_tanzanianzima.geojson", function(countryMap) {
  console.log(countryMap);
  geoSVG.selectAll("path")
    .data(countryMap.features)
    .enter().append("path")
    .attr("d", path) // <-- our projection from above
    .attr("id", "Tanzania");

  /* load csv data here, then merge with map data. This way we only have to
  iterate through the csv once to match region names, not at ever transition.*/
  d3.csv("data/regions.csv", function(data) {
    // grab dataset in variable, delcare other variables here, outside loops
    regionData = data;
    var dataRegion;
    var mapRegion;

    // This code is for GeoJSON--larger file than TopoJSON, but has region names
    d3.json("geo/TZA_adm1_mkoaTZ.geojson", function(error, json) {
      if(error) {
        console.log(error);
      } else {
        // log json -- easier to read than in text editor
        console.log(json);
        // store json in global scope var to access it later for updates
        jsonData = json;
        var jsonFeature;
        var csvRow;
        var prop;
        // loop through json features (i.e., regions) ...
        for (var i = 0; i < jsonData.features.length; i++) {
          // ...  to get region name ...
          jsonFeature = jsonData.features[i].properties
          mapRegion = jsonFeature.NAME_1;

          // ... then loop through csv to find matching row ...
          for (var j = 0; j < regionData.length; j++) {
            csvRow = regionData[j];
            dataRegion = csvRow.region;
            // ... when we find a match ...
            if (dataRegion == mapRegion) {
              // /... add each column:value pair to json properties
              Object.keys(csvRow).forEach(function(key) {
                prop = key;
                jsonFeature[prop] = csvRow[key];
              })
              break;
            }
          }
        }

        // bind GeoJSON features (incl percent) to new path elements
        geoSVG.selectAll("path")
          .data(jsonData.features)
          .enter().append("path")
          .attr("d", path) // <-- our projection from above
          .call(setMapAttr);


        // // load data for water points
        // // Using same projection as above should be OK as async?
        // d3.csv("data/sample-data-filters.csv", function(error, data) {
        //   if(error) {   // if error is not NULL, i.e. data file loaded wrong
        //     console.log(error);
        //   } else {
        //     mapPointsData = data;
        //
        //     geoSVG.selectAll("circle")
        //       .data(mapPointsData)
        //       .enter()
        //       .append("circle")
        //       .attr("cx", function(d) {
        //         return projection([d.longitude, d.latitude])[0];
        //       })
        //       .attr("cy", function(d) {
        //         return projection([d.longitude, d.latitude])[1];
        //       })
        //       .attr("class", function(d) {
        //         return d["status_group"]+" waterpoint";
        //       })
        //       .attr("r", 3);
        //   };
        // });
      }
    })
  })
});

d3.selectAll("input")
  .on("click", function() {
    geoSVG.selectAll("path")
      .data(jsonData.features)
      .call(setMapAttr);
  });
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

// ****************************************************
// ****************************************************
// this is bar chart of counts of functionality values

var dataset;  // global variable for the data itself
// d3.csv is async, so if other functions require the data to
// be loaded, include them inside this function.
d3.csv("data/counts.csv", function(error, data) {
  if(error) {   // if error is not NULL, i.e. data file loaded wrong
    console.log(error);
  } else { // if file loaded correctly, go on with it
    h = h * 0.65
    var barPadding = 5;

    // Assign CSV data to variable so we can get it later
    dataset = data;

    // Create svg in <main> to bind data to
    var svg = d3.select("#barChart-viz .viz")
      .append("svg")
      .attr("width", w)
      .attr("height", h)
      .attr("class", "barChart");

    // create svg elements and bind data to them
    svg.selectAll("rect")
       //Freq is frequency of each target
      .data(dataset)
      .enter()
      .append("rect")
      .attr("x", function(d, i) {
        return i * (w / dataset.length);
      })
      .attr("width", w / dataset.length - barPadding)
      .attr("y", function(d) {
        return h - +d["Freq"]/100;
      })
      .attr("height", function(d) {
        return +d["Freq"]/100;
      })
      .attr("class", function(d) {
        return d["Var1"];
      });

      svg.selectAll("text")
         .data(dataset)
         .enter()
         .append("text")
         .text(function(d) {
            return d["Var1"];
         })
         .attr("x", function(d, i) {
            return i * (w / dataset.length) + 15;
         })
         .attr("y", function(d) {
            return h - +d["Freq"]/100 + 30;
         });
  }
});


//*******************************************
// This is a scatter plot that shows water point count by construction year and functional status
//***************************************************
//
// var dataset1; //data set for scatter plot
//
//
// d3.csv("data/Status_Const-Year.csv", function(error, data) {
// 	if(error) {   // if error is not NULL, i.e. data file loaded wrong
//     console.log(error);
// 	} else { // if file loaded correctly, go on with it
//
// 	w = 800
// 	h = 600
//
//
// 	dataset1 = data;
//
// 	var svg1 = d3.select("#status-year .viz")
//       .append("svg")
//       .attr("width", w)
//       .attr("height", h)
//       .attr("class", "status-year");
//
// 	var padding = 50;
//
// 	var formatwhole = d3.format("d")
//
// 	var xscale = d3.scale.linear()	//creating scale function to scale x axis for scatterplot
// 		.domain([1955,
// 			d3.max(dataset1,function(d) {
// 				return d["Const-Year"];})])
// 		.range([padding,w - padding]);
//
// 	var yscale = d3.scale.linear()	//creating scale function to scale y axis for scatterplot
// 		.domain([0, 2050]) //max function not seeming to work - need to spend time working later, also not sure why there are 5 dots at top rather than proper place
// 			//d3.max(dataset1,function(d) {
// 				//return d["ID_Count"];})])
//
// 		.range([ h - padding , 0]);
//
// 	var xAxis = d3.svg.axis()
// 		.scale(xscale)
// 		.orient("bottom")
// 		.ticks(10)
// 		.tickFormat(formatwhole);
//
// 	var yAxis = d3.svg.axis()
// 		.scale(yscale)
// 		.orient("left")
// 		.ticks(10);
//
//
// 	// create svg elements and bind data to them
//     svg1.selectAll("circle")
//        //ID_Count is the count of water points by functional status and construction year
//       .data(dataset1)
//       .enter()
//       .append("circle")
// 	  .attr("cx", function(d) {
// 			return xscale(d["Const-Year"]);
// 	  })
// 	  .attr("cy", function(d) {
// 			return yscale(d["ID_Count"]);
// 	  })
// 	  .attr("r",5)
// 	  .attr("class", function(d) {
//         return d["Var1"];
//       });
//
// 	svg1.append("g")
// 		.attr("class", "axis")
// 		.attr("transform", "translate(0," + (h- padding) + ")")
// 		.call(xAxis);
//
// 	svg1.append("g")
// 		.attr("class", "axis")
// 		.attr("transform", "translate(" + padding + ",0)")
// 		.call(yAxis);
// 	}
// });
