import {ParsedNode} from "./parsedNode";
import {ParsedLink} from "./parsedLink";

export interface ParsedSpanningTree {
    name: string,
    nodes: ParsedNode[],
    links: ParsedLink[]
}
