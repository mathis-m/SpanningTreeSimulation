import {SpanningTreeLink} from "../models/SpanningTree/spanningTreeLink";
import {SpanningTreeNode} from "../models/SpanningTree/spanningTreeNode";

export const parse: (input: string) => {graphName: string, nodes: SpanningTreeNode[]} =
	(input: string) => {
		const tempLinks: {nodes: string[], cost: number}[] = [];
		const nodes: SpanningTreeNode[] = [];
		const graphName = input.match(/(?<=Graph[ ])(\S+)/g)[0];
		const nodeMatches = input.match(/[^\s]+(?= =)|(?<== )[1-9]*/g);
		const linkMatches = input.match(/[^\s]+(?= -)|[^\s]+(?= :)|(?<=: )[0-9]*/g);
		for (let i = 0; i < linkMatches.length; i = i + 3) {
			tempLinks.push({
				nodes: [linkMatches[i], linkMatches[i + 1]],
				cost: +linkMatches[i + 2] // some little trick to cast a string to number +'4' === 4
			});
		}
		for (let i = 0; i < nodeMatches.length; i = i + 2) {
			const name = nodeMatches[i];
			const value = +nodeMatches[i + 1];
			const links = tempLinks.filter(l => l.nodes.findIndex(n => n === name) !== -1)
				.map(link => new SpanningTreeLink(link.nodes.find(n => n !== name), link.cost));
			nodes.push(new SpanningTreeNode(name, value, links));
		}
		return {
			graphName,
			nodes
		}
	};
