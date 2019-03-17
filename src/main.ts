    // references to the dom
import {parse, stringify} from "./parser";
import {Simulation} from "./models/Simulation/Simulation";
import {SimulationPackage} from "./models/Simulation/SimulationPackage";

const inputArea = document.getElementById('textIn') as HTMLTextAreaElement;
const outputArea = document.getElementById('textOut') as HTMLTextAreaElement;
const simulationButton = document.getElementById('simulate_btn') as HTMLButtonElement;



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
console.log(inputArea);
// click impl
const onSimulationClick = () => {
    const parseResult = parse(inputArea.value);
    const simulation = new Simulation(parseResult.nodes, +(document.getElementById('mult') as HTMLInputElement).value);
    console.log(simulation);
    simulation.startIndexingFromRandomBridge().then(mst => {
        outputArea.value = stringify(mst, parseResult.graphName);
    })
};

// call click impl on simulationButton click
simulationButton.addEventListener('click', onSimulationClick);
