import {SpanningTreeLink} from "../models/SpanningTree/spanningTreeLink";
import {SpanningTreeNode} from "../models/SpanningTree/spanningTreeNode";

// parses a string to SpanningTreeNodes + the name of the graph
export const parse: (input: string) => {graphName: string, nodes: SpanningTreeNode[]} =
	(input: string) => {
		// temporary Arr for links because we will later attach the links to its nodes.
		const tempLinks: {nodes: string[], cost: number}[] = [];
		const nodes: SpanningTreeNode[] = [];

		// regex for getting the information
		const graphName = input.match(/(?<=Graph[ ])(\S+)/g)[0];
		// matches: word if ' =' is after or value if '= ' is in front
		const nodeMatches = input.match(/[^\s]+(?= =)|(?<== )[1-9]*/g);
		// matches: words if '-' follows or word if '-' is in front or value if : is in front
		const linkMatches = input.match(/[^\s]+(?= -)|[^\s]+(?= :)|(?<=: )[0-9]*/g);
		// so for each link we get 3 results
		for (let i = 0; i < linkMatches.length; i = i + 3) {
			// push found info about link
			tempLinks.push({
				nodes: [linkMatches[i], linkMatches[i + 1]],
				cost: +linkMatches[i + 2] // some little trick to cast a string to number +'4' === 4
			});
		}
		// for each node we get 2 results
		for (let i = 0; i < nodeMatches.length; i = i + 2) {
			// get node info
			const name = nodeMatches[i];
			const value = +nodeMatches[i + 1];
			// add matching links as SpanningTreeLink
			const links = tempLinks.filter(l => l.nodes.findIndex(n => n === name) !== -1)
				.map(link => new SpanningTreeLink(link.nodes.find(n => n !== name), link.cost));
			// push new SpanningTreeNode
			nodes.push(new SpanningTreeNode(name, value, links));
		}
		return {
			graphName,
			nodes
		}
	};
