    // references to the dom
import {parse, stringify} from "./parser";
import {Simulation} from "./models/Simulation/Simulation";

// get a ref to the input and output of graphs
const inputArea = document.getElementById('textIn') as HTMLTextAreaElement;
const outputArea = document.getElementById('textOut') as HTMLTextAreaElement;
// trigger new simulation ref
const simulationButton = document.getElementById('simulate_btn') as HTMLButtonElement;


// example inputs
const simpleTest = `
Graph mygraph {
	// Node
	A = 2;
	B = 1;
	C = 3;
	
	// Links und zugeh. Kosten
	A - B : 1;
	A - C : 1;
	C - B : 2;
}`;
const test = `
Graph mygraph {
	// Node
	A = 5;
	B = 1;
	C = 3;
	D = 7;
	E = 6;
	F = 4;
	
	// Links und zugeh. Kosten
	A - B : 10;
	A - C : 10;
	B - D : 15;
	B - E : 10;
	C - D : 3;
	C - E : 10;
	D - E : 2;
	D - F : 10;
	E - F : 2;
}`;
inputArea.value = test;

// click impl
const onSimulationClick = () => {
    // parse input
    const parseResult = parse(inputArea.value);
    // create new Simulation with parsed graph and a multiplier for the cost of links in seconds.
    const simulation = new Simulation(parseResult.nodes, +(document.getElementById('mult') as HTMLInputElement).value);
    // Start the simulation using my own protocol called CSTP Centralized Spanning Tree Protocol
    simulation.startIndexingFromRandomBridge().then(mst => {
        // when it has all information of the network it returns a mst
        // and shares it with all other bridges then where part of the indexing process.
        // show the mst in string version
        outputArea.value = stringify(mst, parseResult.graphName);
    })
};

// call click impl on simulationButton click
simulationButton.addEventListener('click', onSimulationClick);
