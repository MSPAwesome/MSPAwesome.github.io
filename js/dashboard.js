  var dataset;  // global variable for the data itself
  // d3.csv is async, so if other functions require the data to
  // be loaded, include them inside this function.

 d3.csv("data/counts.csv", function(error, data) {
    if(error) {   // if error is not NULL, i.e. data file loaded wrong
      console.log(error);
    } else { // if file loaded correctly, go on with it
      // width and height of main svg, in pixels
      var w = 1000;
      var h = 400;
      var barPadding = 5;

      // Assign CSV data to variable so we can get it later
      dataset = data;

      // Create svg in <main> to bind data to
      var svg = d3.select("main")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

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
