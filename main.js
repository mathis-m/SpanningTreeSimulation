const inputEl = document.getElementById('textInput');
const outEl = document.getElementById('textOut');
const btnEl = document.getElementById('simulate');
const dumpEl = document.getElementById('simulationDump');

const dumpInformationPackages = (context, graph) => {
	let res = "";
	context.container.forEach(container => {
		let nodeTemplate = `
		<span style="text-decoration: underline"><span style="font-weight: bold">Node '${container.node.name}'</span> has sent a Information package through the graph '${graph.name}'.
		It received following Result-Information packages of this Information package:</span><br>
		`;
		context.recivedPackageMst.filter(p => p.node.name === container.node.name).forEach(p => {
			let hopString = "<br>";
			p.informationPackage.data.hops.forEach(h => {
				if(h.cost !== 0){
					hopString += ` =${h.cost}=> `
				}
				hopString += h.node.name;
				
			});
			nodeTemplate += `${hopString}<br>`;
			nodeTemplate += `${parser.stringify(p.mst, graph.name)}<br>`;
		});
		res += `${nodeTemplate}<br>`
	});
	dumpEl.innerHTML = res;
};

const simulateClick = () => {
	const graph = parser.parse(inputEl.value);
	let context = simulate(graph.nodes, graph.links);
	const minSpanTree = context.container[0].node.minimalDiscoveredSpanTree.root.minimalDiscoveredSpanTree;
	outEl.value = parser.stringify(minSpanTree, graph.name);
	dumpInformationPackages(context, graph);
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


