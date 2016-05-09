// global svg width and height, in pixels
// primarily for map; maybe make different vars for each viz?
var w = 600;
var h = 600;

// Let's make some maps!

// generate svg object in main section
var geoSVG = d3.select("#map-viz .viz")
  .append("svg")
  .attr("width", w)
  .attr("height", h);

// path generator to map JSON file to SVG path codes
var projection = d3.geo.mercator()
  .center([34.8888, -6.3690])
  .translate([w / 2, h / 2])
  .scale(3000);

// variable to hold main data set
var mapPointsData;

// load map and do stuff with it
// various GeoJSON and TopoJSON files from https://github.com/thadk/GeoTZ

/**********************************************************
  This is for GeoJSON. Larger file, but has regions and names. */

d3.json("geo/TZA_adm1_mkoaTZ.geojson", function(error, json) {
  if(error) {
    console.log(error);
  } else {
    // log json to get a look at its structure since it crashes my text editor
    console.log(json);

    var path = d3.geo.path()
      .projection(projection);
    // bind GeoJSON features to new path elements
    geoSVG.selectAll("path")
      .data(json.features)
      .enter().append("path")
      .attr("d", path)
      .attr({
        class: "region"
      });


    // load data for water points
    // Using same projection as above should be OK as async?
    d3.csv("data/sample-data-filters.csv", function(error, data) {
      if(error) {   // if error is not NULL, i.e. data file loaded wrong
        console.log(error);
      } else {
        mapPointsData = data;

        geoSVG.selectAll("circle")
          .data(mapPointsData)
          .enter()
          .append("circle")
          .attr("cx", function(d) {
            return projection([d.longitude, d.latitude])[0];
          })
          .attr("cy", function(d) {
            return projection([d.longitude, d.latitude])[1];
          })
          .attr("class", function(d) {
            return d["status_group"]+" waterpoint";
          })
          .attr("r", 3);
      };
    });
  }
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

var dataset1; //data set for scatter plot


d3.csv("data/Status_Const-Year.csv", function(error, data) {
	if(error) {   // if error is not NULL, i.e. data file loaded wrong
    console.log(error);
	} else { // if file loaded correctly, go on with it

	w = 800
	h = 600


	dataset1 = data;

	var svg1 = d3.select("#status-year .viz")
      .append("svg")
      .attr("width", w)
      .attr("height", h)
      .attr("class", "status-year");

	var padding = 50;

	var formatwhole = d3.format("d")

	var xscale = d3.scale.linear()	//creating scale function to scale x axis for scatterplot
		.domain([1955,
			d3.max(dataset1,function(d) {
				return d["Const-Year"];})])
		.range([padding,w - padding]);

	var yscale = d3.scale.linear()	//creating scale function to scale y axis for scatterplot
		.domain([0, 2050]) //max function not seeming to work - need to spend time working later, also not sure why there are 5 dots at top rather than proper place
			//d3.max(dataset1,function(d) {
				//return d["ID_Count"];})])

		.range([ h - padding , 0]);

	var xAxis = d3.svg.axis()
		.scale(xscale)
		.orient("bottom")
		.ticks(10)
		.tickFormat(formatwhole);

	var yAxis = d3.svg.axis()
		.scale(yscale)
		.orient("left")
		.ticks(10);


	// create svg elements and bind data to them
    svg1.selectAll("circle")
       //ID_Count is the count of water points by functional status and construction year
      .data(dataset1)
      .enter()
      .append("circle")
	  .attr("cx", function(d) {
			return xscale(d["Const-Year"]);
	  })
	  .attr("cy", function(d) {
			return yscale(d["ID_Count"]);
	  })
	  .attr("r",5)
	  .attr("class", function(d) {
        return d["Var1"];
      });

	svg1.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0," + (h- padding) + ")")
		.call(xAxis);

	svg1.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(" + padding + ",0)")
		.call(yAxis);
	}
});
