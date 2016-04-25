  /*
  var dataset;  // global variable for the data itself
  // d3.csv is async, so if other functions require the data to
  // be loaded, include them inside this function.

 d3.csv("data/counts.csv", function(error, data) {
    if(error) {   // if error is not NULL, i.e. data file loaded wrong
      console.log(error);
    } else {
      console.log(data);  // if file loaded correctly, go on with it

      // Assign CSV data to variable so we can get it later
      dataset = data;
      d3.select("main").selectAll("p")
        .data(dataset)
        .enter()
        .append("p")
        .text(function(d) { return d; })
        .style("color", "red");
    }
  });
  */
  // width and height of main svg, in pixels
  var w = 500
  var h = 50

  // something simplier to play with
  var svg = d3.select("main")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  var dataset = [ 5, 10 ,15 , 20, 25 ]
  var circles = svg.selectAll("circle")
                  .data(dataset)
                  .enter()
                  .append("circle");
  circles.attr("cx", function(d, i) {
    return (i * 50) + 25;
  })
    .attr("cy", h/2)
    .attr("r", function(d) {
      return d;
    });
