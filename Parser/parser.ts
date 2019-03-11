import {ParsedSpanningTree} from "./parsedSpanningTree";

export class Parser {
    public parse: (text:string) => ParsedSpanningTree = (text: string) => {
        const nodes = [];
        const links = [];
        const nodeMatches = text.match(/[^\s]+(?= =)|(?<== )[1-9]*/g);
        const linkMatches = text.match(/[^\s]+(?= -)|[^\s]+(?= :)|(?<=: )[0-9]*/g);
        for (let i = 0; i < nodeMatches.length; i = i + 2) {
            nodes.push({
                name: nodeMatches[i],
                value: nodeMatches[i + 1]
            });
        }
        for (let i = 0; i < linkMatches.length; i = i + 3) {
            links.push({
                nodes: [linkMatches[i], linkMatches[i + 1]],
                cost: linkMatches[i + 2]
            })
        }
        return {
            name: text.match(/(?<=Graph[ ])(\S+)/g)[0],
            nodes,
            links
        };
    };

    public stringify = (minimalSpanTree, name: string) => `
Spanning-Tree of ${name} {
	Root: ${minimalSpanTree.root.name};
	${minimalSpanTree.linkToString()}
}`;
}
