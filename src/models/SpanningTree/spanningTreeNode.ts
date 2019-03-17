import {SpanningTreeLink} from "./spanningTreeLink";

export class SpanningTreeNode {
	constructor(public name: string, public value: number, public links: SpanningTreeLink[]) {
	}
}
