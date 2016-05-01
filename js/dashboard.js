// global svg width and height, in pixels
var w = 1000;
var h = 1000;

// Let's make some maps!




// generate svg object in main section
var geoSVG = d3.select("#map-viz .viz")
  .append("svg")
  .attr("width", w)
  .attr("height", h);

// load GeoJSON and do stuff with it
// various GeoJSON files from https://github.com/thadk/GeoTZ
d3.json("geo/TZA_adm2.topojson", function(error, json) {
  if(error) {
    console.log(error);
  } else {
    console.log(json);

    // projection of map to 2D plane
    var projection = d3.geo.mercator()
      .center([34.8888, -6.3690])
      .translate([w / 2, h / 2])
      .scale(5000);
    // path generator to format projection to SVG
    var path = d3.geo.path()
      .projection(projection);
    //must convert TopoJSON back to GeoJSON for display
    var subunits = topojson.feature(json, json.objects.TZA_adm2)

    // create new path element and bind topoJSON features to it
    /* geoSVG.append("path")
      //.data(json.features)
      .datum(subunits)
      //.enter().append("path")
      .attr("d", path);
      */
    geoSVG.selectAll(".TZA_adm2")
      .data(subunits.features)
      .enter().append("path")
      .attr("class", "region")
      .attr("d", path);
  }
});

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
    h = h / 2
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
            return h - (+d["Freq"]/100) + 30;
         })
         .attr("fill", "white");
  }
});
