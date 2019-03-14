import {Parser} from "./Parser/parser";
import {Simulation} from "./Simulation";

const simulate = new Simulation().simulate;
const parser = new Parser();
const inputEl: HTMLTextAreaElement = document.getElementById('textInput') as HTMLTextAreaElement;
const outEl: HTMLTextAreaElement = document.getElementById('textOut') as HTMLTextAreaElement;
const btnEl: HTMLButtonElement = document.getElementById('simulate') as HTMLButtonElement;
const dumpEl: HTMLDivElement = document.getElementById('simulationDump') as HTMLDivElement;

const dumpInformationPackages = (context, graph, randomIndexOfNodes) => {
    let res = "";
    const container = context.container[randomIndexOfNodes];
    let nodeTemplate = `
		<span style="text-decoration: underline"><span style="font-weight: bold">Node '${container.node.name}'</span> has sent a Information package through the graph '${graph.name}'.
		It received following Result-Information packages of this Information package:</span><br>
		`;
    context.recivedPackageMst.filter(p => p.node.name === container.node.name).forEach(p => {
        let hopString = "<br>";
        p.informationPackage.data.forEach(d => {
            hopString += "<br>";
            d.hops.forEach(h => {
                if (h.cost !== 0)
                {
                    hopString += ` =${h.cost}=> `;
                }
                hopString += h.node.name;

            })
        });
        nodeTemplate += `${hopString}<br>`;
        nodeTemplate += `${parser.stringify(p.mst, graph.name)}<br>`;
    });
    res += `${nodeTemplate}<br>`;
    dumpEl.innerHTML = res;
};

const simulateClick = () => {
    const graph = parser.parse(inputEl.value);
    let randomIndexOfNodes = Math.floor(Math.random() * graph.nodes.length);
    let context = simulate(graph.nodes, graph.links, randomIndexOfNodes);
    const minSpanTree = context.container[0].node.minimalDiscoveredSpanTree.root.minimalDiscoveredSpanTree;
    outEl.value = parser.stringify(minSpanTree, graph.name);
    dumpInformationPackages(context, graph, randomIndexOfNodes);
};
btnEl.addEventListener('click', simulateClick);
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
inputEl.value = test;

