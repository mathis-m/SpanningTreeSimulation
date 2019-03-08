const inputEl = document.getElementById('textInput');
const outEl = document.getElementById('textOut');
const btnEl = document.getElementById('simulate');
const simulateClick = () => {
	const graph = parser.parse(inputEl.value);
	const minSpanTree = simulate(graph.nodes, graph.links);
	const resultText = parser.stringify(minSpanTree, graph.name);
	outEl.value = resultText;
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


