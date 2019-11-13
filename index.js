'use strict';

(function() {

  let data = "no data";
  let allYearsData = "no data";
  let svgScatterPlot = ""; // keep SVG reference in global scope
  let func  = ""; // scaling and mapping functions 
  let svgLine = ""; 
  let xCoordinate = ""; 
  let yCoordinate = "";
  let linexScale = ""; 

  const m = { 
    width: 800, 
    height: 600, 
    marginAll: 50 
  }

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgScatterPlot = d3.select('body')
      .append('svg')
      .attr('width', m.width)
      .attr('height', m.height);

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter  
    d3.csv("data/gapminder.csv", function (csvData){
        data = csvData;
        allYearsData = csvData;

        let years = [...new Set(allYearsData.map((row) => row["year"]))];
        console.log(years); 
        
        var prev = d3.select('body')
          .append('button')
          .html('&#8592;')
          .on('click', function() {
            let yearSelect = document.getElementById('yearSelect');
            if (yearSelect.value == Math.min(...years)) {
              var newYearValue = Math.max(...years);
            } else {
              var newYearValue = +yearSelect.value - 1;
            }
            yearSelect.value = newYearValue;
            makeScatterPlot(newYearValue);
          });
        
        
        var dropDown = d3.select('body')
          .append('select')
          .attr('id', 'yearSelect')
          .on('change', function() {
            makeScatterPlot(this.value);
          });

        var options = dropDown.selectAll('option')
          .data(years)
          .enter()
            .append('option')
            .text((d) => { return d; });
        
        var next = d3.select('body')
          .append('button')
          .html('&#8594;')
          .on('click', function() {
            let yearSelect = document.getElementById('yearSelect');
            if (yearSelect.value == Math.max(...years)) {
              var newYearValue = Math.min(...years);
            } else {
              var newYearValue = +yearSelect.value + 1;
            }
            yearSelect.value = newYearValue;
            makeScatterPlot(newYearValue);
          });
          

        makeScatterPlot(Math.min(...years));
        makeLineGraph(csvData); 
      });
  }

  // make scatter plot with trend line
  function makeScatterPlot(year) {
    filterByYear(year);
    svgScatterPlot.html("");

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy", svgScatterPlot, {min: 50, max: 700}, {min: 50, max: 450});

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();

  }

  
  function filterByYear(year) {
    data = allYearsData.filter((row) => row['year'] == year);
  }

  // make title and axes labels
  function makeLabels() {
    svgScatterPlot.append('text')
      .attr('x', 170)
      .attr('y', 30)
      .style('font-size', '14pt')
      .text("Life Expectancy vs Fertility (" + data[0]["year"] + ")");

    svgScatterPlot.append('text')
      .attr('x', 300)
      .attr('y', 500)
      .style('font-size', '10pt')
      .text('Fertility Rates');

    svgScatterPlot.append('text')
      .attr('transform', 'translate(15, 350)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // get population data as array
    let pop_data = data.map((row) => +row["population"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    // .style("background", "white")

    xCoordinate = xMap; 
    yCoordinate = yMap; 

    /* 
    let padding = {top: 10, right: 10, bottom: 10, left: 70}
    let lineWidth = 300 - padding.left - padding.right;
    let lineHeight = 300 - padding.top - padding.bottom;
        
        div = d3.select("body")
          .append("div")
            .attr("class", "tooltip")
            
            .style("opacity", 0)
          // .append("g")
          //   .attr('transform', 'translate(' + padding.left + ', ' + padding.top + ')');
        svgLine = d3.select("div")
          .append("svg")
          .attr('width', lineWidth + padding.left + padding.right)
          .attr('height', lineHeight + padding.top + padding.bottom)
          .style("display", "block")


        div.append("g")
            .attr('transform', 'translate(10,10)')
            .call(d3.axisBottom()
                  .scale(linexScale)
                  .tickFormat(d3.format("d"))
                  .ticks(20)
            );
      */

    // append data to SVG and plot as points
    svgScatterPlot.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["population"]))
        .attr('fill', "#4286f4")
        // add tooltip functionality to points
        .on("mouseover", (d) => {
          div.transition()
            .duration(200)
            .style("opacity", .9);
            svgLine.append()
          div.html('<pre>' + 
              'Country:         ' + d.country + '<br/>' + 
              'Year:            ' + d.year + '<br/>' + 
              'Fertility Rate:  ' + d.fertility + '<br/>' + 
              'Life Expectancy: ' + d.life_expectancy + '<br/>' + 
              'Population:      ' + numberWithCommas(d["population"]) + 
              '</pre>'
          )
            // .style("color", d3.select(this).style("fill"))
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });
    
    d3.select(".tooltip")
        .select(".tooltip")
        .style("color", "white");

  }

  function makeLineGraph(csvData) {
    let minYear = d3.min(data, function(d) {
      return +d["year"];
    });
    let maxYear = d3.max(data, function(d) {
      return +d["year"];
    });

    
    let margin = {top: 10, right: 10, bottom: 10, left: 70}
    let width = 500 - margin.left - margin.right;
    let height = 500 - margin.top - margin.bottom;
  
      svgLine = d3.select("body")
      .append("svg")
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append("g")
        .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    // Scale x Axis
    let linexScale = d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([0, width + 50]);

    let minPop = d3.min(data, function(d) {
      return +d["population"];
    });
    let maxPop = d3.max(data, function(d) {
      return +d["population"];
    })

    // Scale y axis    
    let yScale = d3.scaleLinear()
      .domain([minPop, maxPop])
      .range([height - 25, 0]);

    drawLineAxes(linexScale, yScale, svgLine, height, width)

    let valueLine = d3.line()
          .x(function(d) {  return linexScale(d.year)})
          .y(function(d) {  return yScale(d.poplation)})
    console.log(valueLine(data)); 

    svgLine.append("path")
        .attr("class", "line")
        .attr("d", valueLine(data))
        .attr("stroke", "#1f77b4")
        .attr("stroke-width", "1")

  }

  function drawLineAxes(xScale, yScale, element, height, width) {
    // Draw x axis
    element.append("g")
    .attr('transform', 'translate(80, ' + 450 + ')')
    .call(d3.axisBottom()
          .scale(xScale)
          .tickFormat(d3.format("d"))
          .ticks(20)
    );

    // X axis label
    element.append("text")
      .attr("x", 300)
      .attr("y", 480)
      .text("Year")
    
    
    // draw y axis
    element.append("g")
    .attr('transform', 'translate(80, -5)')
    .call(d3.axisLeft(yScale));
    
    // y axis label
    element.append("text")
      .attr("x", -350)
      .attr("y", -10)//height / 2)
      .attr("transform", "rotate(-90)")
      .text("Average Population Size (millions)")

  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, rangeX, rangeY) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([rangeX.min, rangeX.max]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svg.append("g")
      .attr('transform', 'translate(0, ' + rangeY.max + ')')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([rangeY.min, rangeY.max]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(' + rangeX.min + ', 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();