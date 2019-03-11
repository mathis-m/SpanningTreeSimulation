import {ParsedNode} from "./Parser/parsedNode";
import {ParsedLink} from "./Parser/parsedLink";

export class Simulation {
    public simulate = (nodes: ParsedNode[], someLinks: ParsedLink[], randomIndexOfNodes: number) => {
        // get simulation Context
        const simulationContext = new SimulationContext();
        // get them in the right data format
        const spantreeNodes = [];
        for (const node of nodes)
        {
            spantreeNodes.push(new SpanTreeNode(node.name, node.value));
        }
        // register each node and its links to the simulation context
        spantreeNodes.forEach(node => {
            const links = someLinks.filter(link => link.nodes.findIndex(n => n === node.name) !== -1);
            const spantreeLinks = links.map(link => new SpanTreeLink(spantreeNodes.filter(n => n.name === link.nodes[0] || n.name === link.nodes[1]), link.cost));
            simulationContext.registerNode(node, spantreeLinks);
        });

        // let one node start the network indexing process(gets all links and makes mst then pushes mst to other nodes)
        console.log('Node used to discover the network: ', simulationContext.container[randomIndexOfNodes].node);
        simulationContext.container[randomIndexOfNodes].node.sendInformationRequest();
        return simulationContext.__proto__;
    };
}
