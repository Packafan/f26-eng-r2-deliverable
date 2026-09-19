"use client";
import { max } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { csv } from "d3-fetch";
import { scaleBand, scaleLinear, scaleOrdinal } from "d3-scale";
import { select } from "d3-selection";
import { useEffect, useRef, useState } from "react";

export type Diet = "herbivore" | "omnivore" | "carnivore";

export interface AnimalDatum {
  name: string;
  speed: number;
  diet: Diet;
}

const diets: Diet[] = ["herbivore", "omnivore", "carnivore"];

function isDiet(value: string): value is Diet {
  return diets.includes(value as Diet);
}

export default function AnimalSpeedGraph() {
  const graphRef = useRef<HTMLDivElement>(null);

  const [animalData, setAnimalData] = useState<AnimalDatum[]>([]);

  useEffect(() => {
    let isMounted = true;

    // The CSV has friendly labels such as "Herbivore", so normalize them
    // before checking them against the smaller set used by the chart.
    void csv("/sample_animals.csv")
      .then((rows) => {
        const parsedData = rows.flatMap((row): AnimalDatum[] => {
          const diet = row.Diet?.trim().toLowerCase();
          const speed = Number(row["Average Speed (km/h)"] ?? row["Top Speed (km/h)"]);
          const name = row.Animal?.trim();

          if (!name || !Number.isFinite(speed) || !diet || !isDiet(diet)) {
            return [];
          }

          return [{ name, speed, diet }];
        });

        // Some species appear more than once in the source file. Keep one
        // record per name so D3 does not stack duplicate bars in one x position.
        const uniqueData = Array.from(new Map(parsedData.map((animal) => [animal.name, animal])).values());

        // Pick a random half of the animals on each load for variety, then sort that sample
        // so the bars still read from slowest to fastest.
        const displayData = uniqueData
          .toSorted(() => Math.random() - 0.5)
          .slice(0, Math.ceil(uniqueData.length / 2))
          .sort((firstAnimal, secondAnimal) => firstAnimal.speed - secondAnimal.speed);

        if (isMounted) {
          setAnimalData(displayData);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAnimalData([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const container = graphRef.current;
    if (!container || animalData.length === 0) return;

    // D3 owns the SVG, so clear its previous version before drawing again.
    select(container).selectAll("svg").remove();

    const containerWidth = container.clientWidth || 800;
    const width = Math.max(containerWidth, 600);
    const height = 500;
    const margin = { top: 70, right: 40, bottom: 105, left: 78 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = select(container)
      .append<SVGSVGElement>("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Animal speeds by diet");

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    // Each scale translates a data value into a position or color on the SVG.
    const x = scaleBand<string>()
      .domain(animalData.map(({ name }) => name))
      .range([0, chartWidth])
      .padding(0.22);
    const y = scaleLinear()
      .domain([0, (max(animalData, ({ speed }) => speed) ?? 0) * 1.1])
      .nice()
      .range([chartHeight, 0]);
    const color = scaleOrdinal<Diet, string>().domain(diets).range(["#2f855a", "#d69e2e", "#c53030"]);

    // A light grid makes the speed differences easier to compare.
    chart
      .append("g")
      .attr("class", "grid-lines")
      .call(
        axisLeft(y)
          .tickSize(-chartWidth)
          .tickFormat(() => ""),
      )
      .selectAll("line")
      .attr("stroke", "currentColor")
      .attr("opacity", 0.1);

    chart
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(axisBottom(x))
      .selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-35)")
      .attr("dx", "-0.6em")
      .attr("dy", "0.15em");

    chart.append("g").attr("class", "y-axis").call(axisLeft(y));

    chart
      .append("g")
      .selectAll("rect")
      .data(animalData)
      .join("rect")
      .attr("x", ({ name }) => x(name) ?? 0)
      .attr("y", ({ speed }) => y(speed))
      .attr("width", x.bandwidth())
      .attr("height", ({ speed }) => chartHeight - y(speed))
      .attr("rx", 3)
      .attr("fill", ({ diet }) => color(diet));

    chart
      .append("text")
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight + 92)
      .attr("text-anchor", "middle")
      .text("Animal");
    chart
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -chartHeight / 2)
      .attr("y", -54)
      .attr("text-anchor", "middle")
      .text("Speed (km/h)");

    // Stack the legend vertically so the labels do not run into each other.
    const legend = svg.append("g").attr("transform", `translate(${width - margin.right - 130},${margin.top - 66})`);
    diets.forEach((diet, index) => {
      const item = legend.append("g").attr("transform", `translate(0,${index * 20})`);
      item.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(diet));
      item
        .append("text")
        .attr("x", 18)
        .attr("y", 10)
        .attr("font-size", 11)
        .text(diet.charAt(0).toUpperCase() + diet.slice(1));
    });

    return () => {
      // Remove the SVG when the component unmounts or the data changes.
      select(container).selectAll("svg").remove();
    };
  }, [animalData]);

  return <div ref={graphRef} className="w-full overflow-x-auto" />;
}
