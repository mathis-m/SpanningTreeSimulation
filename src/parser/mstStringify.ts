import {MinimalSpanTree} from "../models/SpanningTree/minimalSpanningTree";

export const stringify: (minimalSpanTree: MinimalSpanTree, name: string) => string =
	(minimalSpanTree, name: string) => `
Spanning-Tree of ${name} {
	Root: ${minimalSpanTree.root.name};
	${minimalSpanTree.linkToString()}
}`;
